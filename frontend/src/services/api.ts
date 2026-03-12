const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Type definitions for API responses
export interface Category {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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
  price_small: number | null;
  price_medium: number | null;
  price_large: number | null;
  is_active: boolean;
  is_available?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface LiveOrder {
  id: number;
  order_number: string;
  table_id: number;
  table_name?: string;
  customer_name: string | null;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: string | null;
  payment_status: 'pending' | 'paid' | 'refunded';
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: Array<{
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    notes: string | null;
  }>;
}

export interface OrderHistoryParams {
  page?: number;
  limit?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface OrderHistorySummary {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  completed_orders: number;
  cancelled_orders: number;
}

export interface PaginatedOrderHistoryResponse {
  data: LiveOrder[];
  summary: OrderHistorySummary;
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  role: string;
  profile_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryApiItem {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  is_active: boolean;
}

export type RecipeSize = 'small' | 'medium' | 'large';

export interface IngredientApiItem {
  id: number;
  name: string;
  category_id: number | null;
  category_name?: string;
  unit: string;
  stock_qty: number;
  min_stock: number;
  unit_cost: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  status: 'active' | 'inactive';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function apiRequest(path: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = { 
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...((options.headers as Record<string, string>) || {})
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers,
      ...options,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new Error(payload?.message || `Request failed: ${response.status}`);
    }

    return payload;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to API server. Please check your network connection.');
    }
    throw error;
  }
}

export const fetchCurrentUser = async () => {
  const storedUser = localStorage.getItem('user');
  const userRole = storedUser ? JSON.parse(storedUser).role : 'admin';
  const endpoint = userRole === 'staff' ? '/staff/me' : '/user/me';
  return apiRequest(endpoint);
};

export const fetchNotifications = async () => {
  return apiRequest('/notifications');
};

export const logoutAdmin = async () => {
  return apiRequest('/logout', { method: 'POST' });
};

export const updateCurrentUser = async (data: any) => {
  const storedUser = localStorage.getItem('user');
  const userData = storedUser ? JSON.parse(storedUser) : null;
  const userRole = userData?.role || 'admin';
  
  const formData = new FormData();
  
  if (userRole === 'admin') {
    if (data.name !== undefined) {
      formData.append('name', data.name);
    }
    if (data.email !== undefined) {
      formData.append('email', data.email);
    }
  }
  if (data.profile_image) {
    formData.append('profile_image', data.profile_image);
  }
  
  const token = localStorage.getItem('token');
  const endpoint = userRole === 'staff' ? '/staff/me' : '/user/me';
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }
  
  const result = await response.json();
  return result;
};

export const fetchCategories = async () => {
  return apiRequest('/categories');
};

export const updateCategory = async (id: number, data: any) => {
  return apiRequest(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteCategory = async (id: number) => {
  return apiRequest(`/categories/${id}`, { method: 'DELETE' });
};

export const createCategory = async (data: any) => {
  return apiRequest('/categories', { method: 'POST', body: JSON.stringify(data) });
};

export const fetchProducts = async () => {
  return apiRequest('/products');
};

export const createProduct = async (data: any) => {
  return apiRequest('/products', { method: 'POST', body: JSON.stringify(data) });
};

export const updateProduct = async (id: number, data: any) => {
  return apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteProduct = async (id: number) => {
  return apiRequest(`/products/${id}`, { method: 'DELETE' });
};

export const fetchOrders = async () => {
  return apiRequest('/orders');
};

export const createOrder = async (data: any) => {
  return apiRequest('/orders', { method: 'POST', body: JSON.stringify(data) });
};

export const updateOrder = async (id: number, data: any) => {
  return apiRequest(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const fetchTables = async () => {
  return apiRequest('/tables');
};

export const createTable = async (data: any) => {
  return apiRequest('/tables', { method: 'POST', body: JSON.stringify(data) });
};

export const updateTable = async (id: number, data: any) => {
  return apiRequest(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteTable = async (id: number) => {
  return apiRequest(`/tables/${id}`, { method: 'DELETE' });
};

export const fetchStaff = async () => {
  return apiRequest('/staffs');
};

export const createStaff = async (data: any) => {
  return apiRequest('/staffs', { method: 'POST', body: JSON.stringify(data) });
};

export const updateStaff = async (id: number, data: any) => {
  return apiRequest(`/staffs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteStaff = async (id: number) => {
  return apiRequest(`/staffs/${id}`, { method: 'DELETE' });
};

export const fetchIngredients = async () => {
  return apiRequest('/ingredients');
};

export const createIngredient = async (data: any) => {
  return apiRequest('/ingredients', { method: 'POST', body: JSON.stringify(data) });
};

export const updateIngredient = async (id: number, data: any) => {
  return apiRequest(`/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteIngredient = async (id: number) => {
  return apiRequest(`/ingredients/${id}`, { method: 'DELETE' });
};

export const fetchExpenses = async () => {
  return apiRequest('/expenses');
};

export const createExpense = async (data: any) => {
  return apiRequest('/expenses', { method: 'POST', body: JSON.stringify(data) });
};

export const fetchRecipes = async () => {
  return apiRequest('/recipes');
};

export const createRecipe = async (data: any) => {
  return apiRequest('/recipes', { method: 'POST', body: JSON.stringify(data) });
};

export const updateRecipe = async (id: number, data: any) => {
  return apiRequest(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const fetchAnalytics = async () => {
  return apiRequest('/analytics');
};

export const fetchSalesAnalytics = async () => {
  return apiRequest('/sales-analytics');
};

export const fetchSalesAnalyticsData = async () => {
  return apiRequest('/sales-analytics');
};

export const createRecipeBoard = async (data: any) => {
  return apiRequest('/recipes-board', { method: 'POST', body: JSON.stringify(data) });
};

export const deleteRecipeBoard = async (id: number, size: string) => {
  return apiRequest(`/recipes-board/${id}/${size}`, { method: 'DELETE' });
};

export const fetchRecipeBoards = async () => {
  return apiRequest('/recipes-board');
};

export const updateRecipeBoard = async (id: number, data: any) => {
  return apiRequest(`/recipes-board/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const fetchRecipeBoard = async (id: number) => {
  return apiRequest(`/recipes/${id}`);
};

export const updateRecipeBoardStatus = async (id: number, status: string) => {
  return apiRequest(`/recipes-board/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
};

export const deleteExpense = async (id: number) => {
  return apiRequest(`/expenses/${id}`, { method: 'DELETE' });
};

export const fetchIncomeTransactions = async () => {
  return apiRequest('/finance/income');
};

export const updateExpense = async (id: number, data: any) => {
  return apiRequest(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const fetchSettings = async () => {
  return apiRequest('/settings');
};

export const updateSettings = async (data: any) => {
  return apiRequest('/settings', { method: 'PUT', body: JSON.stringify(data) });
};

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
};

export const fetchDashboardData = async () => {
  return apiRequest('/dashboard');
};

export const fetchStaffs = async () => {
  return apiRequest('/staffs');
};

export const fetchLiveOrders = async () => {
  return apiRequest('/orders/live');
};

export const updateOrderStatus = async (id: number, status: string) => {
  return apiRequest(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
};

export const fetchOrderHistory = async () => {
  return apiRequest('/orders/history');
};

export const fetchReceipt = async (id: number) => {
  return apiRequest(`/receipts/${id}`);
};

export const fetchPurchases = async () => {
  return apiRequest('/purchases');
};

export const createPurchase = async (data: any) => {
  return apiRequest('/purchases', { method: 'POST', body: JSON.stringify(data) });
};
