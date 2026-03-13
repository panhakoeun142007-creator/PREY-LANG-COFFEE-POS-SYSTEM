const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  // Laravel pagination extras (optional)
  from?: number | null;
  to?: number | null;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  is_active: boolean;
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryApiItem {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  is_active: boolean;
  products_count?: number;
}

export interface DashboardData {
  stats: Array<{
    label: string;
    value: string;
    trend: string;
    accent: string;
  }>;
  revenueData: Array<{
    name: string;
    revenue: number;
  }>;
  categoryData: Array<{
    category: string;
    orders: number;
  }>;
  recentOrders: Array<{
    id: number;
    table: string;
    total: string;
    status: string;
  }>;
  lowStockItems: Array<{
    name: string;
    level: number;
  }>;
  notifications: Array<{
    id: number;
    type: string;
    message: string;
    created_at: string;
  }>;
}

export interface ApiProduct {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  sku: string | null;
  image: string | null;
  price_small: number | string | null;
  price_medium: number | string | null;
  price_large: number | string | null;
  is_available?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  category?: { id: number; name: string };
}

export interface ApiIngredient {
  id: number;
  name: string;
  category_id: number | null;
  category_name?: string;
  unit: string;
  stock_qty: number;
  min_stock: number;
  unit_cost: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type IngredientApiItem = ApiIngredient & {
  category?: string | null;
};

export type RecipeSize = "small" | "medium" | "large";

export interface RecipeBoardRow {
  id: number | string;
  product_id: number;
  product: string;
  category_id: number;
  category: string;
  size: RecipeSize;
  ingredients: Array<{
    ingredient_id: number;
    ingredient_name: string;
    amount: number;
    unit?: string;
  }>;
  ingredients_count?: number;
  est_cost?: number;
  status: "active" | "inactive";
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiTable {
  id: number;
  name: string;
  capacity: number;
  status: string; // 'active' | 'inactive' (plus any legacy statuses)
  qrCode?: string;
  seats?: number;
  is_active: boolean;
  qr_code?: string | null;
  db_status?: string;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff" | string;
  profile_image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StaffApiItem {
  id: number;
  name: string;
  email: string;
  salary: number;
  is_active: boolean;
  role?: "staff";
  initials?: string;
  profile_image_url?: string | null;
  password_plain?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  size: RecipeSize | string | null;
  qty: number;
  price: number | string;
  created_at?: string;
  updated_at?: string;
  product?: ApiProduct;
}

export interface ApiOrder {
  id: number;
  table_id: number | null;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  total_price: number | string;
  payment_type: string | null;
  queue_number: number | null;
  created_at: string;
  updated_at: string;
  table?: ApiTable | { id: number; name: string } | null;
  items: ApiOrderItem[];
}

export type LiveOrder = ApiOrder;

export interface OrderHistoryParams {
  page?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  payment_type?: string;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc" | string;
}

export interface OrderHistorySummary {
  completed_count: number;
  cancelled_count: number;
  total_revenue: number;
}

export type PaginatedOrderHistoryResponse = PaginatedResponse<LiveOrder> & {
  summary?: OrderHistorySummary;
};

export type ExpenseCategory = "ingredients" | "utilities" | "salary" | "rent" | "other";

export interface ExpenseApiItem {
  id: number;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
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

// Settings Types
export interface GeneralSettingsData {
  shop_name: string;
  address: string;
  phone: string;
  email: string;
}

export interface NotificationSettingsData {
  new_orders_push: boolean;
  new_orders_email: boolean;
  new_orders_sound: boolean;
  ready_for_pickup: boolean;
  cancelled_orders: boolean;
  low_stock_warning: boolean;
  out_of_stock: boolean;
  daily_summary: boolean;
  weekly_performance: boolean;
}

export interface PaymentSettingsData {
  currency: string;
  tax_rate: number;
  cash_enabled: boolean;
  credit_card_enabled: boolean;
  aba_pay_enabled: boolean;
  wing_money_enabled: boolean;
  khqr_enabled: boolean;
}

export interface ReceiptSettingsData {
  shop_name: string;
  address: string;
  phone: string;
  tax_id: string;
  footer_message: string;
  show_logo: boolean;
  show_qr_payment: boolean;
  show_order_number: boolean;
  show_customer_name: boolean;
}

export interface AppSettings {
  general: GeneralSettingsData;
  notifications: NotificationSettingsData;
  payment: PaymentSettingsData;
  receipt: ReceiptSettingsData;
}

function withQuery(path: string, params?: Record<string, unknown>): string {
  if (!params) return path;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function safeFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const body = options.body as unknown;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
}

export async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await safeFetch(path, options);

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }

  return payload as T;
}

function toFormData(data: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (value instanceof File) {
      fd.append(key, value);
      continue;
    }
    fd.append(key, String(value));
  }
  return fd;
}

export const fetchCurrentUser = async (): Promise<CurrentUser> => {
  const storedUser = localStorage.getItem("user");
  const userRole = storedUser ? (JSON.parse(storedUser).role as string) : "admin";
  const endpoint = userRole === "staff" ? "/staff/me" : "/user/me";
  return apiRequest(endpoint);
};

export const fetchNotifications = async (): Promise<{ notifications: Notification[] }> => {
  return apiRequest("/notifications");
};

export const logoutAdmin = async (): Promise<any> => {
  return apiRequest("/logout", { method: "POST" });
};

export const updateCurrentUser = async (data: {
  name?: string;
  email?: string;
  profile_image?: File | null;
}): Promise<CurrentUser> => {
  const storedUser = localStorage.getItem("user");
  const userData = storedUser ? JSON.parse(storedUser) : null;
  const userRole = (userData?.role as string) || "admin";

  const fd = new FormData();
  if (userRole === "admin") {
    if (data.name !== undefined) fd.append("name", data.name);
    if (data.email !== undefined) fd.append("email", data.email);
  }
  if (data.profile_image) {
    fd.append("profile_image", data.profile_image);
  }

  const endpoint = userRole === "staff" ? "/staff/me" : "/user/me";
  const response = await safeFetch(endpoint, { method: "POST", body: fd });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }
  return (await response.json()) as CurrentUser;
};

export const fetchCategories = async (): Promise<CategoryApiItem[]> => apiRequest("/categories");
export const createCategory = async (data: any): Promise<CategoryApiItem> =>
  apiRequest("/categories", { method: "POST", body: JSON.stringify(data) });
export const updateCategory = async (id: number, data: any): Promise<CategoryApiItem> =>
  apiRequest(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteCategory = async (id: number): Promise<any> =>
  apiRequest(`/categories/${id}`, { method: "DELETE" });

export const fetchProducts = async (): Promise<PaginatedResponse<ApiProduct>> => apiRequest("/products");
export const createProduct = async (data: any): Promise<ApiProduct> =>
  apiRequest("/products", { method: "POST", body: JSON.stringify(data) });
export const updateProduct = async (id: number, data: any): Promise<ApiProduct> =>
  apiRequest(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteProduct = async (id: number): Promise<any> =>
  apiRequest(`/products/${id}`, { method: "DELETE" });

export const fetchIngredients = async (): Promise<IngredientApiItem[]> => apiRequest("/ingredients");
export const createIngredient = async (data: any): Promise<IngredientApiItem> =>
  apiRequest("/ingredients", { method: "POST", body: JSON.stringify(data) });
export const updateIngredient = async (id: number, data: any): Promise<IngredientApiItem> =>
  apiRequest(`/ingredients/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteIngredient = async (id: number): Promise<any> =>
  apiRequest(`/ingredients/${id}`, { method: "DELETE" });

export const fetchTables = async (): Promise<PaginatedResponse<ApiTable>> => apiRequest("/tables");
export const createTable = async (data: any): Promise<ApiTable> =>
  apiRequest("/tables", { method: "POST", body: JSON.stringify(data) });
export const updateTable = async (id: number, data: any): Promise<ApiTable> =>
  apiRequest(`/tables/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteTable = async (id: number): Promise<any> =>
  apiRequest(`/tables/${id}`, { method: "DELETE" });

export const fetchStaffs = async (params: {
  page?: number;
  search?: string;
  is_active?: boolean;
} = {}): Promise<PaginatedResponse<StaffApiItem>> => apiRequest(withQuery("/staffs", params));

export const createStaff = async (data: {
  name: string;
  email: string;
  password: string;
  salary: number;
  is_active?: boolean;
  profile_image?: File | null;
}): Promise<StaffApiItem> => {
  if (data.profile_image) {
    const fd = toFormData(data as unknown as Record<string, unknown>);
    return apiRequest("/staffs", { method: "POST", body: fd });
  }
  return apiRequest("/staffs", { method: "POST", body: JSON.stringify(data) });
};

export const updateStaff = async (
  id: number,
  data: {
    name?: string;
    email?: string;
    password?: string;
    salary?: number;
    is_active?: boolean;
    profile_image?: File | null;
  },
): Promise<StaffApiItem> => {
  if (data.profile_image) {
    const fd = toFormData({ ...data, _method: "PUT" } as unknown as Record<string, unknown>);
    // Use POST + _method override to ensure Laravel matches the PUT route with multipart/form-data.
    return apiRequest(`/staffs/${id}`, { method: "POST", body: fd });
  }
  return apiRequest(`/staffs/${id}`, { method: "PUT", body: JSON.stringify(data) });
};

export const deleteStaff = async (id: number): Promise<any> =>
  apiRequest(`/staffs/${id}`, { method: "DELETE" });

export const fetchOrders = async (): Promise<PaginatedResponse<ApiOrder>> => apiRequest("/orders");
export const createOrder = async (data: any): Promise<ApiOrder> =>
  apiRequest("/orders", { method: "POST", body: JSON.stringify(data) });
export const updateOrder = async (id: number, data: any): Promise<ApiOrder> =>
  apiRequest(`/orders/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const fetchLiveOrders = async (): Promise<LiveOrder[]> => apiRequest("/orders/live");
export const updateOrderStatus = async (id: number, status: string): Promise<LiveOrder> =>
  apiRequest(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const fetchOrderHistory = async (params: OrderHistoryParams = {}): Promise<PaginatedOrderHistoryResponse> =>
  apiRequest(withQuery("/orders/history", params));

export const fetchSettings = async (): Promise<AppSettings> => apiRequest("/settings");
export const updateSettings = async (data: Partial<AppSettings>): Promise<AppSettings> =>
  apiRequest("/settings", { method: "PUT", body: JSON.stringify(data) });

export const fetchDashboardData = async (): Promise<DashboardData> => apiRequest("/dashboard");
export const fetchSalesAnalyticsData = async (): Promise<{
  monthlyTrendData: SalesTrendDataPoint[];
  peakHoursData: PeakHourDataPoint[];
  monthlyPerformanceData: SalesTrendDataPoint[];
}> => apiRequest("/sales-analytics");

export const fetchExpenses = async (params: { category?: ExpenseCategory; page?: number } = {}): Promise<PaginatedResponse<ExpenseApiItem>> =>
  apiRequest(withQuery("/expenses", params));
export const createExpense = async (data: any): Promise<ExpenseApiItem> =>
  apiRequest("/expenses", { method: "POST", body: JSON.stringify(data) });
export const updateExpense = async (id: number, data: any): Promise<ExpenseApiItem> =>
  apiRequest(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteExpense = async (id: number): Promise<any> =>
  apiRequest(`/expenses/${id}`, { method: "DELETE" });

export const fetchIncomeTransactions = async (params: Record<string, unknown> = {}): Promise<any> =>
  apiRequest(withQuery("/finance/income", params));

export const fetchRecipeBoards = async (): Promise<PaginatedResponse<RecipeBoardRow>> => apiRequest("/recipes-board");
export const fetchRecipeBoard = async (id: number): Promise<any> => apiRequest(`/recipes/${id}`);
export const createRecipeBoard = async (data: any): Promise<any> =>
  apiRequest("/recipes-board", { method: "POST", body: JSON.stringify(data) });
export const updateRecipeBoard = async (id: number, data: any): Promise<any> =>
  apiRequest(`/recipes-board/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const updateRecipeBoardStatus = async (id: number, status: string): Promise<any> =>
  apiRequest(`/recipes-board/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteRecipeBoard = async (id: number, size: string): Promise<any> =>
  apiRequest(`/recipes-board/${id}/${size}`, { method: "DELETE" });
