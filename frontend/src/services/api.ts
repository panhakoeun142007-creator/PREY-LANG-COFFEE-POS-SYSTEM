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
