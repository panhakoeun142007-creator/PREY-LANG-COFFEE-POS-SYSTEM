// Core API Types - Strongly typed to avoid 'any'

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type RecipeSize = 'small' | 'medium' | 'large';
export type PaymentType = 'cash' | 'credit_card' | 'aba_pay' | 'wing_money' | 'khqr';
export type UserRole = 'admin' | 'staff';
export type ExpenseCategory = 'ingredients' | 'utilities' | 'salary' | 'rent' | 'other';

// ==================== Base Types ====================

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

// ==================== Product Types ====================

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

export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  sku: string | null;
  image: string | null;
  image_url: string | null;
  price_small: number;
  price_medium: number;
  price_large: number;
  cost?: number;
  supplier_id?: number | null;
  is_available: boolean;
  is_popular?: boolean;
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
  category?: Category;
}

// ==================== Order Types ====================

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  size: RecipeSize;
  qty: number;
  price: number;
  created_at?: string;
  updated_at?: string;
  product?: Product;
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
  description: string | null;
  created_at: string;
}

export interface DiningTable {
  id: number;
  name: string;
  capacity: number;
  status: string;
  qr_code?: string | null;
  is_active: boolean;
}

export interface Order {
  id: number;
  table_id: number | null;
  status: OrderStatus;
  total_price: number;
  payment_type: PaymentType | null;
  queue_number: number | null;
  created_at: string;
  updated_at: string;
  table?: DiningTable | null;
  items: OrderItem[];
  actions?: OrderAction[];
}

export interface OrderHistoryParams extends PaginationParams {
  status?: OrderStatus;
  date_from?: string;
  date_to?: string;
  payment_type?: PaymentType;
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'total_price' | 'queue_number';
  sort_order?: 'asc' | 'desc';
}

export interface OrderHistorySummary {
  completed_count: number;
  cancelled_count: number;
  total_revenue: number;
}

export type OrderHistoryResponse = PaginatedResponse<Order> & {
  summary?: OrderHistorySummary;
};

// ==================== User/Staff Types ====================

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  profile_image_url: string | null;
  initials?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Staff extends User {
  salary: number;
  is_active: boolean;
  password_plain?: string;
}

export interface ManagerInfo {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  profile_image_url: string | null;
}

// ==================== Ingredient Types ====================

export interface Ingredient {
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

// ==================== Expense Types ====================

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  note: string | null;
  created_at?: string;
  updated_at?: string;
}

// ==================== Settings Types ====================

export interface GeneralSettings {
  shop_name: string;
  address: string;
  phone: string;
  email: string;
}

export interface NotificationSettings {
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

export interface PaymentSettings {
  currency: string;
  tax_rate: number;
  cash_enabled: boolean;
  credit_card_enabled: boolean;
  aba_pay_enabled: boolean;
  wing_money_enabled: boolean;
  khqr_enabled: boolean;
}

export interface ReceiptSettings {
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
  general: GeneralSettings;
  notifications: NotificationSettings;
  payment: PaymentSettings;
  receipt: ReceiptSettings;
}

// ==================== Analytics Types ====================

export interface SalesTrend {
  month: string;
  sales: number;
  orders: number;
}

export interface PeakHour {
  hour: string;
  orders: number;
}

// ==================== Notification Types ====================

export interface Notification {
  id: number | string;
  type: string;
  title?: string;
  message: string;
  time?: string;
  read: boolean;
  created_at?: string;
}

// ==================== Recipe Types ====================

export interface RecipeIngredient {
  ingredient_id: number;
  ingredient_name: string;
  amount: number;
  unit?: string;
}

export interface RecipeBoardRow {
  id: number | string;
  product_id: number;
  product: string;
  category_id: number;
  category: string;
  size: RecipeSize;
  ingredients: RecipeIngredient[];
  ingredients_count?: number;
  est_cost?: number;
  status: 'active' | 'inactive';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
