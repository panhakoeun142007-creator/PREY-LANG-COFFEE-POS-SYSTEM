// Type declarations for JavaScript modules
declare module '*.jsx' {
  import { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}

declare module '*.js' {
  import { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
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
