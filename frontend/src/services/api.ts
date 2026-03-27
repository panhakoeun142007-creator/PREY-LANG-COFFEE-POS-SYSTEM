// Use in-memory auth instead of localStorage
import { auth } from "../utils/auth";

const pendingGetRequests = new Map<string, Promise<unknown>>();
const cachedGetResponses = new Map<string, { expiresAt: number; data: unknown }>();

function resolveApiBaseUrl(): string {
  const backendUrlRaw = (import.meta.env.VITE_BACKEND_URL as string | undefined) || "http://127.0.0.1:8000";
  const backendUrl = backendUrlRaw.replace(/\/+$/, "");

  const apiUrlRaw =
    (import.meta.env.VITE_API_URL as string | undefined) ||
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    `${backendUrl}/api`;

  if (apiUrlRaw.startsWith("/")) {
    return `${backendUrl}${apiUrlRaw}`;
  }
  return apiUrlRaw.replace(/\/+$/, "");
}

const API_BASE_URL = resolveApiBaseUrl();

function buildGetCacheKey(path: string): string {
  return `GET:${path}`;
}

function clearApiCache(matcher?: (key: string) => boolean): void {
  for (const key of cachedGetResponses.keys()) {
    if (!matcher || matcher(key)) {
      cachedGetResponses.delete(key);
    }
  }
}

async function apiGetCached<T>(path: string, ttlMs: number): Promise<T> {
  const key = buildGetCacheKey(path);
  const cached = cachedGetResponses.get(key);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  const pending = pendingGetRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = apiRequest<T>(path)
    .then((payload) => {
      cachedGetResponses.set(key, {
        expiresAt: Date.now() + ttlMs,
        data: payload,
      });
      return payload;
    })
    .finally(() => {
      pendingGetRequests.delete(key);
    });

  pendingGetRequests.set(key, request as Promise<unknown>);

  return request;
}

function invalidateCachedGet(path: string): void {
  cachedGetResponses.delete(buildGetCacheKey(path));
}

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
  notification_count: number;
}

export interface ApiProduct {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  description?: string | null;
  sku: string | null;
  image: string | null;
  image_url?: string | null;
  price_small: number | string | null;
  price_medium: number | string | null;
  price_large: number | string | null;
  cost?: number | string | null;
  supplier_id?: number | null;
  is_available?: boolean;
  is_popular?: boolean;
  is_active?: boolean;
  // Discount fields
  discount_type?: 'percentage' | 'fixed' | 'promo' | null;
  discount_value?: number | null;
  discount_start_date?: string | null;
  discount_end_date?: string | null;
  discount_active?: boolean;
  // Calculated discounted prices
  has_discount?: boolean;
  discounted_price_small?: number;
  discounted_price_medium?: number;
  discounted_price_large?: number;
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
  qrUrl?: string;
  qr_url?: string;
  seats?: number;
  is_active: boolean;
  qr_code?: string | null;
  db_status?: string;
}

export interface Notification {
  id: number | string;
  type: string;
  title?: string;
  message: string;
  time?: string;
  read: boolean;
  created_at?: string;
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

export type ManagerInfo = {
  id: number;
  name: string;
  email: string;
  role?: "admin" | string;
  profile_image_url?: string | null;
};

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

export interface OrderAction {
  id: number;
  order_id: number;
  actor_type: string;
  actor_id: number | null;
  actor_name: string;
  action_type: string;
  from_status: string | null;
  to_status: string | null;
  description?: string | null;
  created_at: string;
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
  actions?: OrderAction[];
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

function withQuery<T extends object>(path: string, params?: T): string {
  if (!params) return path;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function safeFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = auth.getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

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

  async function readPayload(): Promise<any> {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json") || contentType.includes("+json")) {
      return response.json();
    }
    const text = await response.text().catch(() => "");
    return text;
  }

  const payload = await readPayload().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      auth.clear();
      // Let the SPA router handle navigation (avoids hard reload / blank page in some setups).
      try {
        window.dispatchEvent(new CustomEvent("auth:unauthorized", { detail: { path } }));
      } catch {
        window.dispatchEvent(new Event("auth:unauthorized"));
      }
    }

    if (typeof payload === "string" && payload.trim().startsWith("<!doctype")) {
      throw new Error(`API returned HTML (check VITE_API_URL). Status: ${response.status}`);
    }
    throw new Error((payload as any)?.message || `Request failed: ${response.status}`);
  }

  if (typeof payload === "string") {
    if (payload.trim().startsWith("<!doctype")) {
      throw new Error("API returned HTML (check VITE_API_URL).");
    }
    throw new Error("API did not return JSON.");
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
    if (typeof value === "boolean") {
      fd.append(key, value ? "1" : "0");
      continue;
    }
    fd.append(key, String(value));
  }
  return fd;
}

export const fetchCurrentUser = async (): Promise<CurrentUser> => {
  const user = auth.getUser();
  const userRole = user?.role || "admin";

  const primaryEndpoint = userRole === "staff" ? "/staff/me" : "/user/me";
  const secondaryEndpoint = userRole === "staff" ? "/user/me" : "/staff/me";

  const primaryResponse = await safeFetch(primaryEndpoint);
  if (!primaryResponse.ok && (primaryResponse.status === 401 || primaryResponse.status === 403)) {
    const secondaryResponse = await safeFetch(secondaryEndpoint);
    if (secondaryResponse.ok) {
      return apiGetCached(secondaryEndpoint, 2000);
    }
  }

  return apiGetCached(primaryEndpoint, 2000);
};

export const fetchManager = async (): Promise<ManagerInfo> => apiGetCached("/manager", 10000);

export const fetchNotifications = async (fresh = false): Promise<{ notifications: Notification[] }> => {
  if (fresh) {
    invalidateCachedGet("/notifications");
  }
  return apiGetCached("/notifications", 5000);
};

export const dismissNotification = async (key: string): Promise<{ message?: string }> => {
  const encoded = encodeURIComponent(key);
  return apiRequest(`/notifications/${encoded}`, { method: "DELETE" });
};

export const fetchDashboard = async (): Promise<DashboardData> => {
  return apiGetCached("/dashboard", 10000);
};

export const logoutAdmin = async (): Promise<any> => {
  clearApiCache();
  return apiRequest("/logout", { method: "POST" });
};

export const updateCurrentUser = async (data: {
  name?: string;
  email?: string;
  profile_image?: File | null;
  remove_profile_image?: boolean;
}): Promise<CurrentUser> => {
  const user = auth.getUser();
  const userRole = user?.role || "admin";

  const fd = new FormData();
  if (data.name !== undefined) fd.append("name", data.name);
  // Email/password are assigned by admin; do not allow self-update from the profile modal.
  if (data.remove_profile_image) {
    fd.append("remove_profile_image", "1");
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

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json") || contentType.includes("+json")) {
    const payload = (await response.json()) as CurrentUser;
    clearApiCache((key) => key.includes("/user/me") || key.includes("/staff/me") || key.includes("/manager"));
    auth.setUser(payload);
    return payload;
  }

  const text = await response.text().catch(() => "");
  if (text.trim().startsWith("<!doctype")) {
    throw new Error("API returned HTML (check VITE_API_URL).");
  }
  throw new Error("API did not return JSON.");
};

export const fetchCategories = async (): Promise<CategoryApiItem[]> => apiRequest("/categories");
export const fetchCachedCategories = async (): Promise<CategoryApiItem[]> => apiGetCached("/categories", 60000);
export const createCategory = async (data: any): Promise<CategoryApiItem> =>
  apiRequest("/categories", { method: "POST", body: JSON.stringify(data) }).then((payload) => {
    clearApiCache((key) => key.includes("/categories"));
    return payload;
  });
export const updateCategory = async (id: number, data: any): Promise<CategoryApiItem> =>
  apiRequest(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }).then((payload) => {
    clearApiCache((key) => key.includes("/categories"));
    return payload;
  });
export const deleteCategory = async (id: number): Promise<any> =>
  apiRequest(`/categories/${id}`, { method: "DELETE" }).then((payload) => {
    clearApiCache((key) => key.includes("/categories"));
    return payload;
  });

export const fetchProducts = async (fresh = false): Promise<PaginatedResponse<ApiProduct>> => {
  if (fresh) {
    invalidateCachedGet("/products");
  }
  return apiGetCached("/products", 30000);
};

export const createProduct = async (data: any): Promise<ApiProduct> => {
  // Check if there's a file to upload
  if (data.imageFile instanceof File) {
    const fd = new FormData();
    fd.append('name', data.name);
    fd.append('category_id', String(data.category_id));
    fd.append('price_small', String(data.price_small || 0));
    fd.append('price_medium', String(data.price_medium || 0));
    fd.append('price_large', String(data.price_large || 0));
    if (data.description) fd.append('description', data.description);
    if (data.sku) fd.append('sku', data.sku);
    if (data.cost) fd.append('cost', String(data.cost));
    if (data.supplier_id) fd.append('supplier_id', String(data.supplier_id));
    if (data.image_url) fd.append('image_url', data.image_url);
    if (data.imageFile) fd.append('image_file', data.imageFile);
    if (data.is_available !== undefined) fd.append('is_available', String(data.is_available));
    
    return apiRequest("/products", { method: "POST", body: fd }).then((payload) => {
      clearApiCache((key) => key.includes("/products") || key.includes("/categories"));
      return payload;
    });
  }
  
  return apiRequest("/products", { method: "POST", body: JSON.stringify(data) }).then((payload) => {
    clearApiCache((key) => key.includes("/products") || key.includes("/categories"));
    return payload;
  });
};

export const updateProduct = async (id: number, data: any): Promise<ApiProduct> => {
  // Check if there's a file to upload
  if (data.imageFile instanceof File) {
    const fd = new FormData();
    // Laravel expects PUT for updates, so we add _method to spoof PUT
    fd.append('_method', 'PUT');
    if (data.name !== undefined) fd.append('name', data.name);
    if (data.category_id !== undefined) fd.append('category_id', String(data.category_id));
    if (data.price_small !== undefined) fd.append('price_small', String(data.price_small));
    if (data.price_medium !== undefined) fd.append('price_medium', String(data.price_medium));
    if (data.price_large !== undefined) fd.append('price_large', String(data.price_large));
    if (data.image_url !== undefined) fd.append('image_url', data.image_url || '');
    if (data.image) fd.append('image', data.image || '');
    if (data.imageFile) fd.append('image_file', data.imageFile);
    if (data.is_available !== undefined) fd.append('is_available', String(data.is_available));
    
    return apiRequest(`/products/${id}`, { method: "POST", body: fd }).then((payload) => {
      clearApiCache((key) => key.includes("/products") || key.includes("/categories"));
      return payload;
    });
  }
  
  return apiRequest(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }).then((payload) => {
    clearApiCache((key) => key.includes("/products") || key.includes("/categories"));
    return payload;
  });
};
export const deleteProduct = async (id: number): Promise<any> =>
  apiRequest(`/products/${id}`, { method: "DELETE" }).then((payload) => {
    clearApiCache((key) => key.includes("/products") || key.includes("/categories"));
    return payload;
  });

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
    return apiRequest("/staffs", { method: "POST", body: fd }).then((payload) => {
      clearApiCache((key) => key.includes("/staffs"));
      return payload;
    });
  }
  return apiRequest("/staffs", { method: "POST", body: JSON.stringify(data) }).then((payload) => {
    clearApiCache((key) => key.includes("/staffs"));
    return payload;
  });
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
    return apiRequest(`/staffs/${id}`, { method: "POST", body: fd }).then((payload) => {
      clearApiCache((key) => key.includes("/staffs"));
      return payload;
    });
  }
  return apiRequest(`/staffs/${id}`, { method: "PUT", body: JSON.stringify(data) }).then((payload) => {
    clearApiCache((key) => key.includes("/staffs"));
    return payload;
  });
};

export const deleteStaff = async (id: number): Promise<any> =>
  apiRequest(`/staffs/${id}`, { method: "DELETE" }).then((payload) => {
    clearApiCache((key) => key.includes("/staffs"));
    return payload;
  });

export const fetchOrders = async (): Promise<PaginatedResponse<ApiOrder>> => apiRequest("/orders");
export const createOrder = async (data: any): Promise<ApiOrder> =>
  apiRequest("/orders", { method: "POST", body: JSON.stringify(data) }).then((payload) => {
    clearApiCache((key) => key.includes("/orders") || key.includes("/dashboard") || key.includes("/notifications"));
    return payload;
  });
export const updateOrder = async (id: number, data: any): Promise<ApiOrder> =>
  apiRequest(`/orders/${id}`, { method: "PUT", body: JSON.stringify(data) }).then((payload) => {
    clearApiCache((key) => key.includes("/orders") || key.includes("/dashboard") || key.includes("/notifications"));
    return payload;
  });

export const fetchLiveOrders = async (fresh = false): Promise<LiveOrder[]> => {
  if (fresh) {
    invalidateCachedGet("/orders/live");
  }
  return apiGetCached("/orders/live", 4000);
};
export const updateOrderStatus = async (id: number, status: string, cancellationMessage?: string): Promise<LiveOrder> =>
  apiRequest(`/orders/${id}/status`, { 
    method: "PATCH", 
    body: JSON.stringify({ 
      status,
      cancellation_message: cancellationMessage || null
    }) 
  }).then((payload) => {
    clearApiCache((key) => key.includes("/orders") || key.includes("/dashboard") || key.includes("/notifications"));
    return payload;
  });

export const fetchOrderHistory = async (
  params: OrderHistoryParams = {},
  fresh = false,
): Promise<PaginatedOrderHistoryResponse> => {
  const path = withQuery("/orders/history", params);
  if (fresh) {
    invalidateCachedGet(path);
  }
  return apiGetCached(path, 4000);
};

export type ReceiptActor = {
  actor_type: string;
  actor_id: number | null;
  actor_name: string;
};

export type ReceiptDetailResponse = {
  receipt: {
    receipt_id: string;
    order_id: string;
    customer_label: string;
    order: {
      id: number;
      queue_number: number | null;
      status: ApiOrder["status"];
      payment_type: string | null;
      table: ApiOrder["table"];
      paid_at: string | null;
      created_at: string | null;
      updated_at: string | null;
    };
    source: {
      created_by: ReceiptActor | null;
      completed_by: ReceiptActor | null;
    };
    items: Array<{
      id: number;
      product_id: number;
      name: string | null | undefined;
      size: string | null;
      qty: number;
      price: number;
      line_total: number;
      product?: ApiProduct;
    }>;
    totals: {
      subtotal: number;
      tax_rate: number;
      tax_amount: number;
      computed_total: number;
      total: number;
    };
    actions: OrderAction[];
    receipt_settings: {
      shop_name: string;
      address: string;
      phone: string;
      tax_id: string;
      footer_message: string;
      show_logo: boolean;
      show_qr_payment: boolean;
      show_order_number: boolean;
      show_customer_name: boolean;
    };
  };
};

export const fetchReceiptDetail = async (orderId: number): Promise<ReceiptDetailResponse> =>
  apiRequest(`/receipts/${orderId}`);

export const deleteReceipt = async (orderId: number): Promise<{ message: string }> => {
  const clearRelatedCache = (payload: { message: string }) => {
    clearApiCache((key) => key.includes("/orders") || key.includes("/receipts"));
    return payload;
  };

  try {
    return await apiRequest(`/receipts/${orderId}`, { method: "DELETE" }).then(clearRelatedCache);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    // Fallback for environments that block DELETE requests.
    if (message.includes("405") || message.includes("404")) {
      return apiRequest(`/receipts/${orderId}/delete`, { method: "POST" }).then(clearRelatedCache);
    }
    throw err;
  }
};

export type ReceiptIndexItem = {
  receipt_id?: string;
  order_id?: string;
  order_numeric_id?: number;
  queue_number?: number | null;
  customer_label?: string;
  total?: number;
  payment_type?: string;
  paid_at?: string | null;

  // legacy fields
  receiptId?: string;
  orderId?: string;
  table?: string;
  paymentMethod?: string;
  paidAt?: string | null;
};

export const fetchReceipts = async (params: { per_page?: number } = {}): Promise<{ receipts: ReceiptIndexItem[] }> => {
  return apiRequest(withQuery("/receipts", params));
};

export const fetchSettings = async (): Promise<AppSettings> => apiGetCached("/settings", 60000);
export const updateSettings = async (data: Partial<AppSettings>): Promise<AppSettings> =>
  apiRequest("/settings", { method: "PUT", body: JSON.stringify(data) }).then((payload) => {
    clearApiCache((key) => key.includes("/settings"));
    return payload;
  });

export const fetchDashboardData = async (fresh = false): Promise<DashboardData> => {
  if (fresh) {
    invalidateCachedGet("/dashboard");
  }
  return apiGetCached("/dashboard", 10000);
};
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

export const fetchRecipeBoards = async (): Promise<{ data: RecipeBoardRow[] }> => apiRequest("/recipes-board");
export const fetchRecipeBoard = async (id: number): Promise<any> => apiRequest(`/recipes/${id}`);
export const createRecipeBoard = async (data: any): Promise<any> =>
  apiRequest("/recipes-board", { method: "POST", body: JSON.stringify(data) });
export const updateRecipeBoard = async (id: number, data: any): Promise<any> =>
  apiRequest(`/recipes-board/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const updateRecipeBoardStatus = async (id: number, status: string): Promise<any> =>
  apiRequest(`/recipes-board/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteRecipeBoard = async (id: number, size: string): Promise<any> =>
  apiRequest(`/recipes-board/${id}/${size}`, { method: "DELETE" });

export const fetchCustomerCategories = async (): Promise<CategoryApiItem[]> =>
  apiGetCached("/customer/categories", 60000);

export const fetchCustomerProducts = async (): Promise<PaginatedResponse<ApiProduct>> =>
  apiGetCached("/customer/products", 30000);

export const fetchCustomerPopularProducts = async (): Promise<PaginatedResponse<ApiProduct>> =>
  apiGetCached("/customer/products/popular", 30000);

export const fetchPopularProducts = async (): Promise<PaginatedResponse<ApiProduct>> =>
  apiGetCached("/products/popular", 30000);

export const toggleProductPopular = async (id: number, isPopular: boolean): Promise<ApiProduct> =>
  apiRequest(`/products/${id}/popular`, { method: "PATCH", body: JSON.stringify({ is_popular: isPopular }) });

export const createCustomerOrder = async (data: {
  table_id: number;
  items: Array<{ product_id: number; size: string; qty: number; price: number }>;
  total_price: number;
  payment_type: string;
}): Promise<ApiOrder> => apiRequest("/customer/orders", { method: "POST", body: JSON.stringify(data) });

export const fetchCustomerOrderStatus = async (orderId: number): Promise<{
  id: number;
  status: string;
  queue_number: number | null;
  table: string | null;
  updated_at: string;
  cancellation_message: string | null;
}> => apiGetCached(`/customer/orders/${orderId}`, 4000);

export const markCustomerOrderPickedUp = async (orderId: number): Promise<ApiOrder> =>
  apiRequest(`/customer/orders/${orderId}/pickup`, { method: "POST" });
