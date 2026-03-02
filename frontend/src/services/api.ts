function normalizeApiUrl(input?: string): string {
  if (!input) {
    return '/api';
  }

  const trimmed = input.trim().replace(/\/+$/, '');

  if (trimmed === '/api') {
    return '/api';
  }

  if (trimmed.endsWith('/api')) {
    return trimmed;
  }

  return `${trimmed}/api`;
}

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL as string | undefined);

function buildUrl(path: string, base: string): string {
  return `${base}${path}`;
}

function buildCandidateBases(): string[] {
  const bases = new Set<string>();
  bases.add(API_URL);
  bases.add("/api");
  bases.add("http://127.0.0.1:8000/api");
  bases.add("http://localhost:8000/api");

  if (API_URL.includes("localhost:8000")) {
    bases.add("http://127.0.0.1:8000/api");
  }

  if (API_URL.includes("127.0.0.1:8000")) {
    bases.add("http://localhost:8000/api");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    bases.add(`${window.location.origin}/api`);
  }

  return Array.from(bases);
}

async function safeFetch(path: string, init?: globalThis.RequestInit): Promise<Response> {
  const bases = buildCandidateBases();
  let lastError: unknown = null;
  const attempted: string[] = [];

  for (const base of bases) {
    const url = buildUrl(path, base);
    attempted.push(url);
    try {
      const response = await fetch(url, init);
      if ([502, 503, 504].includes(response.status)) {
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw new Error(
      `Cannot connect to API server. Start Laravel with: php artisan serve. Tried: ${attempted.join(", ")}`,
    );
  }

  throw new Error(
    `Cannot connect to API server. Start Laravel with: php artisan serve. Tried: ${attempted.join(", ")}`,
  );
}

async function readApiError(response: Response, fallback: string): Promise<Error> {
  try {
    const data = await response.json();
    if (data?.message) {
      return new Error(data.message);
    }
    const firstField = data?.errors ? Object.keys(data.errors)[0] : null;
    const firstError =
      firstField && Array.isArray(data.errors[firstField]) ? data.errors[firstField][0] : null;
    return new Error(firstError || fallback);
  } catch {
    return new Error(fallback);
  }
}

export interface DashboardStats {
  label: string;
  value: string;
  trend: string;
  accent: string;
}

export interface RevenueData {
  name: string;
  revenue: number;
}

export interface CategoryData {
  category: string;
  orders: number;
}

export interface RecentOrder {
  id: string;
  table: string;
  total: string;
  status: string;
}

export interface LowStockItem {
  name: string;
  level: number;
}

export interface Notification {
  id: string;
  type: 'order' | 'ready' | 'stock' | 'near_stock';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface DashboardData {
  stats: DashboardStats[];
  revenueData: RevenueData[];
  categoryData: CategoryData[];
  recentOrders: RecentOrder[];
  lowStockItems: LowStockItem[];
  notifications: Notification[];
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  initials: string;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const response = await safeFetch("/dashboard");
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  
  return response.json();
}

export async function fetchNotifications(): Promise<{ notifications: Notification[] }> {
  const response = await safeFetch("/dashboard/notifications");
  
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  
  return response.json();
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await safeFetch("/user/me");
  
  if (!response.ok) {
    throw new Error('Failed to fetch current user');
  }
  
  return response.json();
}

export interface OrderItem {
  id: number;
  product_id: number;
  size: string;
  qty: number;
  price: number;
  product?: {
    id: number;
    name: string;
  };
}

export interface LiveOrder {
  id: number;
  queue_number: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_price: number;
  payment_type: string;
  created_at: string;
  updated_at: string;
  table?: {
    id: number;
    name: string;
  };
  items: OrderItem[];
}

export async function fetchLiveOrders(): Promise<LiveOrder[]> {
  const response = await safeFetch("/orders/live");
  
  if (!response.ok) {
    throw new Error('Failed to fetch live orders');
  }
  
  return response.json();
}

export async function updateOrderStatus(orderId: number, status: string): Promise<LiveOrder> {
  const response = await safeFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update order status');
  }
  
  return response.json();
}

export interface OrderHistoryParams {
  date_from?: string;
  date_to?: string;
  payment_type?: string;
  search?: string;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CategoryApiItem {
  id: number;
  name: string;
  description: string | null;
  quantity?: number;
  is_active: boolean;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

export interface IngredientApiItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  stock_qty: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory = "ingredients" | "utilities" | "salary" | "rent" | "other";

export interface ExpenseApiItem {
  id: number;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchOrderHistory(params: OrderHistoryParams = {}): Promise<PaginatedResponse<LiveOrder>> {
  const queryParams = new URLSearchParams();
  
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);
  if (params.payment_type) queryParams.append('payment_type', params.payment_type);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page.toString());
  
  const response = await safeFetch(`/orders/history?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch order history');
  }
  
  return response.json();
}

export async function fetchCategories(): Promise<CategoryApiItem[]> {
  const response = await safeFetch("/categories");

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  const payload = await response.json();
  if (Array.isArray(payload)) {
    return payload as CategoryApiItem[];
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data as CategoryApiItem[];
  }
  return [];
}

export async function fetchIngredients(): Promise<IngredientApiItem[]> {
  const response = await safeFetch("/ingredients");

  if (!response.ok) {
    throw new Error("Failed to fetch ingredients");
  }

  const payload = await response.json();
  if (Array.isArray(payload)) {
    return payload as IngredientApiItem[];
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data as IngredientApiItem[];
  }
  return [];
}

export async function createIngredient(payload: {
  name: string;
  category: string;
  unit: string;
  stock_qty: number;
  min_stock: number;
}): Promise<IngredientApiItem> {
  const response = await safeFetch("/ingredients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await readApiError(response, "Failed to create ingredient");
  }

  return response.json();
}

export async function updateIngredient(
  ingredientId: number,
  payload: {
    name?: string;
    category?: string;
    unit?: string;
    stock_qty?: number;
    min_stock?: number;
  },
): Promise<IngredientApiItem> {
  const response = await safeFetch(`/ingredients/${ingredientId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await readApiError(response, "Failed to update ingredient");
  }

  return response.json();
}

export async function deleteIngredient(ingredientId: number): Promise<void> {
  const response = await safeFetch(`/ingredients/${ingredientId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await readApiError(response, "Failed to delete ingredient");
  }
}

export async function createCategory(payload: {
  name: string;
  quantity?: number;
  is_active?: boolean;
}): Promise<CategoryApiItem> {
  const response = await safeFetch("/categories", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Failed to create category');
  }

  return response.json();
}

export async function updateCategory(
  categoryId: number,
  payload: { name?: string; quantity?: number; is_active?: boolean },
): Promise<CategoryApiItem> {
  const response = await safeFetch(`/categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Failed to update category');
  }

  return response.json();
}

export async function deleteCategory(categoryId: number): Promise<void> {
  const response = await safeFetch(`/categories/${categoryId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw await readApiError(response, 'Failed to delete category');
  }
}

export async function fetchExpenses(params: { category?: ExpenseCategory; page?: number } = {}): Promise<PaginatedResponse<ExpenseApiItem>> {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.append("category", params.category);
  if (params.page) queryParams.append("page", String(params.page));

  const query = queryParams.toString();
  const response = await safeFetch(query ? `/expenses?${query}` : "/expenses");

  if (!response.ok) {
    throw await readApiError(response, "Failed to fetch expenses");
  }

  return response.json();
}

export async function createExpense(payload: {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  note?: string;
}): Promise<ExpenseApiItem> {
  const response = await safeFetch("/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await readApiError(response, "Failed to create expense");
  }

  return response.json();
}

export async function updateExpense(
  expenseId: number,
  payload: {
    title?: string;
    amount?: number;
    category?: ExpenseCategory;
    date?: string;
    note?: string | null;
  },
): Promise<ExpenseApiItem> {
  const response = await safeFetch(`/expenses/${expenseId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await readApiError(response, "Failed to update expense");
  }

  return response.json();
}

export async function deleteExpense(expenseId: number): Promise<void> {
  const response = await safeFetch(`/expenses/${expenseId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await readApiError(response, "Failed to delete expense");
  }
}
