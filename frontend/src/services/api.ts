const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
  const response = await fetch(`${API_URL}/dashboard`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  
  return response.json();
}

export async function fetchNotifications(): Promise<{ notifications: Notification[] }> {
  const response = await fetch(`${API_URL}/dashboard/notifications`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  
  return response.json();
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await fetch(`${API_URL}/user/me`);
  
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
  updated_at?: string;
  table?: {
    id: number;
    name: string;
  };
  items: OrderItem[];
}

export async function fetchLiveOrders(): Promise<LiveOrder[]> {
  const response = await fetch(`${API_URL}/orders/live`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch live orders');
  }
  
  return response.json();
}

export async function updateOrderStatus(orderId: number, status: string): Promise<LiveOrder> {
  const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
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
  status?: string;
  payment_type?: string;
  search?: string;
  page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export async function fetchOrderHistory(params: OrderHistoryParams = {}): Promise<PaginatedResponse<LiveOrder>> {
  const queryParams = new URLSearchParams();
  
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);
  if (params.status) queryParams.append('status', params.status);
  if (params.payment_type) queryParams.append('payment_type', params.payment_type);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.sort_order) queryParams.append('sort_order', params.sort_order);
  
  const response = await fetch(`${API_URL}/orders/history?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch order history');
  }
  
  return response.json();
}

// Category types
export interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

function normalizeCategory(raw: unknown): Category {
  const c = (raw ?? {}) as Record<string, unknown>;
  return {
    id: toNumber(c.id),
    name: typeof c.name === 'string' ? c.name : '',
    description: typeof c.description === 'string' ? c.description : undefined,
    is_active: toBoolean(c.is_active, true),
    created_at: typeof c.created_at === 'string' ? c.created_at : undefined,
    updated_at: typeof c.updated_at === 'string' ? c.updated_at : undefined,
  };
}

// Product types - matching backend API
export interface ApiProduct {
  id: number;
  category_id: number;
  name: string;
  sku?: string;
  price_small: number;
  price_medium: number;
  price_large: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  is_active: boolean;
  is_available: boolean;
  image?: string;
  created_at?: string;
  updated_at?: string;
  category?: Category;
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return fallback;
}

function normalizeProduct(raw: unknown): ApiProduct {
  const p = (raw ?? {}) as Record<string, unknown>;
  return {
    id: toNumber(p.id),
    category_id: toNumber(p.category_id),
    name: typeof p.name === 'string' ? p.name : '',
    sku: typeof p.sku === 'string' ? p.sku : undefined,
    price_small: toNumber(p.price_small),
    price_medium: toNumber(p.price_medium),
    price_large: toNumber(p.price_large),
    stock_quantity: p.stock_quantity === undefined ? undefined : toNumber(p.stock_quantity),
    low_stock_threshold: p.low_stock_threshold === undefined ? undefined : toNumber(p.low_stock_threshold),
    is_active: toBoolean(p.is_active, true),
    is_available: toBoolean(p.is_available, true),
    image: typeof p.image === 'string' ? p.image : undefined,
    created_at: typeof p.created_at === 'string' ? p.created_at : undefined,
    updated_at: typeof p.updated_at === 'string' ? p.updated_at : undefined,
    category: (p.category as Category | undefined) ?? undefined,
  };
}

// Product params for API calls
export interface ProductParams {
  category_id?: number;
  is_available?: boolean;
  page?: number;
}

// Product form data for creating/updating
export interface ProductFormData {
  category_id: number;
  name: string;
  sku?: string;
  price_small: number;
  price_medium: number;
  price_large: number;
  image?: string;
  is_available?: boolean;
}

// Fetch all categories
export async function fetchCategories(): Promise<PaginatedResponse<Category>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  try {
    const response = await fetch(`${API_URL}/categories`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }
    
    const payload = await response.json() as PaginatedResponse<unknown>;
    return {
      ...payload,
      data: Array.isArray(payload?.data) ? payload.data.map(normalizeCategory) : [],
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('fetchCategories error:', error);
    throw error;
  }
}

// Fetch products with optional filters
export async function fetchProducts(params: ProductParams = {}): Promise<PaginatedResponse<ApiProduct>> {
  const queryParams = new URLSearchParams();
  
  if (params.category_id) queryParams.append('category_id', params.category_id.toString());
  if (params.is_available !== undefined) queryParams.append('is_available', params.is_available.toString());
  if (params.page) queryParams.append('page', params.page.toString());
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  try {
    const response = await fetch(`${API_URL}/products?${queryParams.toString()}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    
    const payload = await response.json() as PaginatedResponse<unknown>;
    return {
      ...payload,
      data: Array.isArray(payload?.data) ? payload.data.map(normalizeProduct) : [],
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('fetchProducts error:', error);
    throw error;
  }
}

// Fetch single product
export async function fetchProduct(id: number): Promise<ApiProduct> {
  const response = await fetch(`${API_URL}/products/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  
  return normalizeProduct(await response.json());
}

// Create new product
export async function createProduct(data: ProductFormData): Promise<ApiProduct> {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const responseText = await response.text();
    let errorData: { message?: string; errors?: Record<string, string[]> } = {};
    try {
      errorData = responseText ? JSON.parse(responseText) : {};
    } catch {
      errorData = {};
    }
    const validationErrors = errorData.errors
      ? Object.values(errorData.errors).flat().join(', ')
      : '';
    const message = errorData.message || validationErrors || `Failed to create product (${response.status})`;
    throw new Error(message);
  }
  
  return normalizeProduct(await response.json());
}

// Update existing product
export async function updateProduct(id: number, data: Partial<ProductFormData>): Promise<ApiProduct> {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const responseText = await response.text();
    let errorData: { message?: string; errors?: Record<string, string[]> } = {};
    try {
      errorData = responseText ? JSON.parse(responseText) : {};
    } catch {
      errorData = {};
    }
    const validationErrors = errorData.errors
      ? Object.values(errorData.errors).flat().join(', ')
      : '';
    const message = errorData.message || validationErrors || `Failed to update product (${response.status})`;
    throw new Error(message);
  }
  
  return normalizeProduct(await response.json());
}

// Delete product
export async function deleteProduct(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || 'Failed to delete product';
    throw new Error(message);
  }
  
  return response.json();
}

export interface ApiTable {
  id: string;
  name: string;
  capacity: number;
  status: 'active' | 'inactive';
  qrCode: string;
}

export interface TableFormData {
  name: string;
  capacity: number;
  status?: 'active' | 'inactive';
  qrCode?: string;
}

function normalizeTable(raw: unknown): ApiTable {
  const t = (raw ?? {}) as Record<string, unknown>;
  const inferredActive = toBoolean(t.is_active, true);
  const statusRaw = typeof t.status === 'string' ? t.status : '';
  const status = statusRaw === 'active' || statusRaw === 'inactive'
    ? statusRaw
    : (inferredActive ? 'active' : 'inactive');

  return {
    id: String(t.id ?? ''),
    name: typeof t.name === 'string' ? t.name : '',
    capacity: toNumber(t.capacity ?? t.seats, 2),
    status,
    qrCode: typeof t.qrCode === 'string'
      ? t.qrCode
      : (typeof t.qr_code === 'string' ? t.qr_code : `QR-${String(t.id ?? '')}`),
  };
}

export async function fetchTables(): Promise<PaginatedResponse<ApiTable>> {
  const response = await fetch(`${API_URL}/tables`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tables: ${response.status}`);
  }

  const payload = await response.json() as PaginatedResponse<unknown>;
  return {
    ...payload,
    data: Array.isArray(payload?.data) ? payload.data.map(normalizeTable) : [],
  };
}

export async function createTable(data: TableFormData): Promise<ApiTable> {
  const response = await fetch(`${API_URL}/tables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      capacity: data.capacity,
      is_active: data.status ? data.status === 'active' : true,
      qr_code: data.qrCode,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const validationErrors = errorData?.errors
      ? Object.values(errorData.errors as Record<string, string[]>).flat().join(', ')
      : '';
    throw new Error(errorData?.message || validationErrors || 'Failed to create table');
  }

  return normalizeTable(await response.json());
}

export async function updateTable(
  id: string,
  data: Partial<TableFormData>
): Promise<ApiTable> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.capacity !== undefined) payload.capacity = data.capacity;
  if (data.status !== undefined) payload.is_active = data.status === 'active';
  if (data.qrCode !== undefined) payload.qr_code = data.qrCode;

  const response = await fetch(`${API_URL}/tables/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const validationErrors = errorData?.errors
      ? Object.values(errorData.errors as Record<string, string[]>).flat().join(', ')
      : '';
    throw new Error(errorData?.message || validationErrors || 'Failed to update table');
  }

  return normalizeTable(await response.json());
}
