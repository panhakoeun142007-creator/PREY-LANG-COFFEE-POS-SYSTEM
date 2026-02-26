export type OrderStatus = 'Pending' | 'Preparing' | 'Brewing' | 'Ready' | 'Delayed' | 'Completed' | 'Cancelled';

export interface OrderItem {
  name: string;
  quantity: number;
  customization?: string;
}

export interface Order {
  id: string;
  tableNo: string;
  status: OrderStatus;
  items: OrderItem[];
  timeElapsed: string;
  timestamp: string;
  customerName?: string;
  total: number;
  paymentMethod?: 'KHQR' | 'Cash' | 'Card';
  completedAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  ingredients: string[];
}
