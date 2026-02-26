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
