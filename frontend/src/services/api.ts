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
  updated_at: string;
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

export async function fetchOrderHistory(params: OrderHistoryParams = {}): Promise<PaginatedResponse<LiveOrder>> {
  const queryParams = new URLSearchParams();
  
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);
  if (params.payment_type) queryParams.append('payment_type', params.payment_type);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page.toString());
  
  const response = await fetch(`${API_URL}/orders/history?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch order history');
  }
  
  return response.json();
}

// Categories
export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean | number;
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

export async function fetchCategories(): Promise<PaginatedResponse<Category>> {
  const response = await fetch(`${API_URL}/categories`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  
  return response.json();
}

export interface FetchProductsParams {
  category_id?: number;
  is_available?: boolean;
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

// Products
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

// Category CRUD
export interface ApiCategory {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  is_active?: boolean;
}

export async function createCategory(data: CreateCategoryData): Promise<ApiCategory> {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create category');
  }
  
  return response.json();
}

export async function updateCategory(id: number, data: Partial<CreateCategoryData>): Promise<ApiCategory> {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update category');
  }
  
  return response.json();
}

export async function deleteCategory(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete category');
  }
}

// Tables
export interface ApiTable {
  id: string;
  name: string;
  capacity: number;
  seats: number;
  status: string;
  qrCode: string;
  qr_code: string | null;
  is_active: boolean;
  db_status: string | null;
}

export interface CreateTableData {
  name: string;
  capacity: number;
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
