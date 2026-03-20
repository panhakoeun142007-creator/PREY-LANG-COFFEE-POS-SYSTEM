import type { AppSettings } from "../services/api";

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    shop_name: "Prey Lang Coffee Roastery",
    address: "123 Samdach Sihanouk Blvd, Phnom Penh, Cambodia",
    phone: "+855 23 123 456",
    email: "hello@preylangcoffee.com",
  },
  notifications: {
    new_orders_push: true,
    new_orders_email: false,
    new_orders_sound: true,
    ready_for_pickup: true,
    cancelled_orders: true,
    low_stock_warning: true,
    out_of_stock: true,
    daily_summary: true,
    weekly_performance: true,
  },
  payment: {
    currency: "USD",
    tax_rate: 10,
    cash_enabled: true,
    credit_card_enabled: true,
    aba_pay_enabled: true,
    wing_money_enabled: false,
    khqr_enabled: true,
  },
  receipt: {
    shop_name: "Prey Lang Coffee",
    address: "St. 214, Phnom Penh, Cambodia",
    phone: "+855 12 345 678",
    tax_id: "",
    footer_message:
      "Thank you for visiting! We hope you enjoyed your organic coffee. Save this receipt for a 5% discount on your next visit.",
    show_logo: true,
    show_qr_payment: true,
    show_order_number: true,
    show_customer_name: false,
  },
  orders: {
    live_orders_auto_refresh: false,
  },
};

