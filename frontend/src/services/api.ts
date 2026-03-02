function normalizeApiUrl(input?: string): string {
  if (!input) {
    return '/api';
  }

  const trimmed = input.trim().replace(/\/+$/, '');

  if (trimmed === '/api') {
    return trimmed;
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
  bases.add("http://127.0.0.1:8000/api");
  bases.add("http://localhost:8000/api");
  bases.add("/api");

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

export async function safeFetch(path: string, init?: globalThis.RequestInit): Promise<Response> {
  const bases = buildCandidateBases();
  let lastError: unknown = null;
  const attempted: string[] = [];
  const htmlResponses: string[] = [];
  const authToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  for (const base of bases) {
    const url = buildUrl(path, base);
    attempted.push(url);
    try {
      const headers = new Headers(init?.headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "application/json");
      }
      if (!headers.has("X-Requested-With")) {
        headers.set("X-Requested-With", "XMLHttpRequest");
      }
      if (authToken) {
        headers.set("Authorization", `Bearer ${authToken}`);
      }

      const response = await fetch(url, {
        ...init,
        headers,
      });
      const contentType = response.headers.get("content-type")?.toLowerCase() || "";

      // If this base points to a frontend/dev server route, we may get HTML.
      // Skip it and continue trying API bases that return JSON.
      if (contentType.includes("text/html")) {
        htmlResponses.push(url);
        continue;
      }

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

  if (htmlResponses.length > 0) {
    throw new Error(
      `API base URL is misconfigured (received HTML instead of JSON). Check VITE_API_URL. Tried: ${htmlResponses.join(", ")}`,
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

// Dashboard types
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

export interface SalesTrendDataPoint {
  month: string;
  sales: number;
  orders: number;
}

export interface PeakHourDataPoint {
  hour: string;
  orders: number;
}

export interface SalesAnalyticsData {
  monthlyTrendData: SalesTrendDataPoint[];
  peakHoursData: PeakHourDataPoint[];
  monthlyPerformanceData: SalesTrendDataPoint[];
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  initials: string;
  profile_image_url?: string | null;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export async function loginAdmin(email: string, password: string): Promise<LoginResponse> {
  const response = await safeFetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw await readApiError(response, "Login failed");
  }

  const payload = (await response.json()) as LoginResponse;
  localStorage.setItem("auth_token", payload.token);
  return payload;
}

export async function logoutAdmin(): Promise<void> {
  const response = await safeFetch("/logout", {
    method: "POST",
  });

  localStorage.removeItem("auth_token");

  if (!response.ok) {
    throw await readApiError(response, "Logout failed");
  }
}

// Dashboard
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
    return { notifications: [] };
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

export async function fetchSalesAnalyticsData(): Promise<SalesAnalyticsData> {
  const response = await safeFetch("/sales-analytics");

  if (!response.ok) {
    throw new Error("Failed to fetch sales analytics");
  }

  return response.json();
}

export async function updateCurrentUser(payload: {
  name: string;
  email: string;
  profile_image?: File | null;
}): Promise<CurrentUser> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("email", payload.email);
  if (payload.profile_image) {
    formData.append("profile_image", payload.profile_image);
  }

  const response = await safeFetch("/user/me", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw await readApiError(response, "Failed to update account");
  }

  return response.json();
}

// Staff
export interface StaffApiItem {
  id: number;
  name: string;
  email: string;
  salary: number;
  is_active: boolean;
  profile_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FetchStaffsParams {
  search?: string;
  is_active?: boolean;
  page?: number;
}

export async function fetchStaffs(
  params: FetchStaffsParams = {},
): Promise<PaginatedResponse<StaffApiItem>> {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.is_active !== undefined) queryParams.append("is_active", String(params.is_active));
  if (params.page) queryParams.append("page", String(params.page));

  const query = queryParams.toString();
  const response = await safeFetch(`/staffs${query ? `?${query}` : ""}`);

  if (!response.ok) {
    throw new Error("Failed to fetch staff");
  }

  const payload = await response.json();
  if (Array.isArray(payload)) {
    return {
      data: payload as StaffApiItem[],
      current_page: 1,
      last_page: 1,
      per_page: payload.length,
      total: payload.length,
    };
  }
  return payload as PaginatedResponse<StaffApiItem>;
}

export async function createStaff(payload: {
  name: string;
  email: string;
  password: string;
  salary: number;
  is_active?: boolean;
  profile_image?: File | null;
}): Promise<StaffApiItem> {
  const body = new FormData();
  body.append("name", payload.name);
  body.append("email", payload.email);
  body.append("password", payload.password);
  body.append("salary", String(payload.salary));
  if (payload.is_active !== undefined) {
    body.append("is_active", payload.is_active ? "1" : "0");
  }
  if (payload.profile_image) {
    body.append("profile_image", payload.profile_image);
  }

  const response = await safeFetch("/staffs", {
    method: "POST",
    body,
  });

  if (!response.ok) {
    throw await readApiError(response, "Failed to create staff");
  }

  return response.json();
}

export async function updateStaff(
  staffId: number,
  payload: {
    name?: string;
    email?: string;
    password?: string;
    salary?: number;
    is_active?: boolean;
    profile_image?: File | null;
  },
): Promise<StaffApiItem> {
  const hasProfileImage = payload.profile_image instanceof File;
  const response = hasProfileImage
    ? await safeFetch(`/staffs/${staffId}`, {
        method: "POST",
        body: (() => {
          const body = new FormData();
          body.append("_method", "PUT");
          if (payload.name !== undefined) body.append("name", payload.name);
          if (payload.email !== undefined) body.append("email", payload.email);
          if (payload.password !== undefined) body.append("password", payload.password);
          if (payload.salary !== undefined) body.append("salary", String(payload.salary));
          if (payload.is_active !== undefined) body.append("is_active", payload.is_active ? "1" : "0");
          body.append("profile_image", payload.profile_image);
          return body;
        })(),
      })
    : await safeFetch(`/staffs/${staffId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

  if (!response.ok) {
    throw await readApiError(response, "Failed to update staff");
  }

  return response.json();
}

export async function deleteStaff(staffId: number): Promise<void> {
  const response = await safeFetch(`/staffs/${staffId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await readApiError(response, "Failed to delete staff");
  }
}

// Backward-compatible aliases
export type CustomerApiItem = StaffApiItem;
export type FetchCustomersParams = FetchStaffsParams;
export const fetchCustomers = fetchStaffs;
export const createCustomer = createStaff;
export const updateCustomer = updateStaff;
export const deleteCustomer = deleteStaff;

// Order types
export interface OrderItem {
  id: number;
  product_id: number;
  size: string;
  qty: number | string;
  price: number | string;
  product?: {
    id: number;
    name: string;
  };
}

export interface LiveOrder {
  id: number;
  queue_number: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_price: number | string;
  payment_type: string;
  created_at: string;
  updated_at: string;
  table?: {
    id: number;
    name: string;
  };
  items: OrderItem[];
}

export interface OrderHistoryParams {
  status?: string;
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

export interface OrderHistorySummary {
  completed_count: number;
  cancelled_count: number;
  total_revenue: number | string;
}

export interface PaginatedOrderHistoryResponse extends PaginatedResponse<LiveOrder> {
  summary?: OrderHistorySummary;
}

// Orders
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

export async function fetchOrderHistory(params: OrderHistoryParams = {}): Promise<PaginatedOrderHistoryResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.status) queryParams.append('status', params.status);
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);
  if (params.payment_type) queryParams.append('payment_type', params.payment_type);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page.toString());
  
  const response = await safeFetch(`/orders/history?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch order history');
  }
  
  return response.json() as Promise<PaginatedOrderHistoryResponse>;
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

// Categories
export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean | number;
  products_count?: number;
  quantity?: number;
  created_at?: string;
  updated_at?: string;
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

export interface CreateCategoryData {
  name: string;
  description?: string;
  quantity?: number;
  is_active?: boolean;
}

export async function createCategory(payload: CreateCategoryData): Promise<CategoryApiItem> {
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
  payload: { name?: string; description?: string; quantity?: number; is_active?: boolean },
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

// Products
export interface FetchProductsParams {
  category_id?: number;
  is_available?: boolean;
}

export interface ApiProduct {
  id: number;
  category_id: number;
  name: string;
  sku: string | null;
  price_small: number;
  price_medium: number;
  price_large: number;
  image: string | null;
  is_available: boolean;
  category?: Category;
}

export async function fetchProducts(params: FetchProductsParams = {}): Promise<PaginatedResponse<ApiProduct>> {
  const queryParams = new URLSearchParams();
  
  if (params.category_id) queryParams.append('category_id', params.category_id.toString());
  if (params.is_available !== undefined) queryParams.append('is_available', params.is_available.toString());
  
  const response = await fetch(`${API_URL}/products?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  
  return response.json();
}

export interface CreateProductData {
  category_id: number;
  name: string;
  sku?: string;
  price_small: number;
  price_medium: number;
  price_large: number;
  image?: string;
  is_available?: boolean;
}

export async function createProduct(data: CreateProductData): Promise<ApiProduct> {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create product' }));
    throw new Error(error.message || 'Failed to create product');
  }
  
  return response.json();
}

export async function updateProduct(id: number, data: Partial<CreateProductData>): Promise<ApiProduct> {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update product' }));
    throw new Error(error.message || 'Failed to update product');
  }
  
  return response.json();
}

export async function deleteProduct(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete product');
  }
}

// Tables
export interface ApiTable {
  id: number;
  name: string;
  capacity: number;
  seats: number;
  status: "active" | "inactive";
  qrCode?: string;
  qr_code: string | null;
  is_active: boolean;
  db_status: string | null;
}

export interface CreateTableData {
  name: string;
  capacity: number;
  status?: string;
  qrCode?: string;
  qr_code?: string;
  is_active?: boolean;
}

export async function fetchTables(): Promise<PaginatedResponse<ApiTable>> {
  const response = await fetch(`${API_URL}/tables`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch tables');
  }
  
  return response.json();
}

export async function createTable(data: CreateTableData): Promise<ApiTable> {
  const response = await fetch(`${API_URL}/tables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create table');
  }
  
  return response.json();
}

export async function updateTable(id: number, data: Partial<CreateTableData>): Promise<ApiTable> {
  const response = await fetch(`${API_URL}/tables/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update table');
  }
  
  return response.json();
}

export async function deleteTable(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/tables/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete table');
  }
}

// Ingredients
export interface ApiIngredient {
  id: number;
  name: string;
  category_id: number | null;
  category?: string | null;
  unit: string;
  stock_qty: number;
  min_stock: number;
  unit_cost?: number;
}

export interface IngredientApiItem {
  id: number;
  name: string;
  category_id: number | null;
  category: string | null;
  unit: string;
  stock_qty: number;
  min_stock: number;
  unit_cost?: number | null;
  created_at: string;
  updated_at: string;
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
  category_id: number;
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
    category_id?: number;
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

// Recipes board
export type RecipeSize = 'small' | 'medium' | 'large';

export interface RecipeBoardIngredient {
  ingredient_id: number;
  ingredient_name?: string;
  amount: number;
}

export interface RecipeBoardRow {
  id: string;
  product_id: number;
  product: string;
  category_id: number;
  category: string;
  size: string;
  ingredients_count: number;
  est_cost: number;
  status: 'active' | 'inactive';
  ingredients: RecipeBoardIngredient[];
}

export interface FetchRecipeBoardParams {
  search?: string;
  category_id?: number;
  status?: 'all' | 'active' | 'inactive';
}

export interface RecipeBoardPayload {
  product_id: number;
  size: RecipeSize;
  ingredients: Array<{
    ingredient_id: number;
    amount: number;
  }>;
}

export async function fetchRecipeBoard(
  params: FetchRecipeBoardParams = {},
): Promise<{ data: RecipeBoardRow[] }> {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.category_id) queryParams.append('category_id', String(params.category_id));
  if (params.status) queryParams.append('status', params.status);

  const query = queryParams.toString();
  const response = await fetch(`${API_URL}/recipes-board${query ? `?${query}` : ''}`);

  if (!response.ok) {
    throw new Error('Failed to fetch recipe board');
  }

  return response.json();
}

export async function createRecipeBoard(payload: RecipeBoardPayload): Promise<RecipeBoardRow> {
  const response = await fetch(`${API_URL}/recipes-board`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create recipe' }));
    throw new Error(error.message || 'Failed to create recipe');
  }

  return response.json();
}

export async function updateRecipeBoard(
  productId: number,
  payload: Omit<RecipeBoardPayload, 'product_id'>,
): Promise<RecipeBoardRow> {
  const response = await fetch(`${API_URL}/recipes-board/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update recipe' }));
    throw new Error(error.message || 'Failed to update recipe');
  }

  return response.json();
}

export async function updateRecipeBoardStatus(
  productId: number,
  isActive: boolean,
): Promise<{ product_id: number; status: 'active' | 'inactive' }> {
  const response = await fetch(`${API_URL}/recipes-board/${productId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_active: isActive }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update recipe status' }));
    throw new Error(error.message || 'Failed to update recipe status');
  }

  return response.json();
}

export async function deleteRecipeBoard(productId: number, size: RecipeSize): Promise<void> {
  const response = await fetch(`${API_URL}/recipes-board/${productId}/${size}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete recipe');
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
