import {
  BarChart3,
  BookOpenText,
  Boxes,
  ClipboardList,
  Coffee,
  CupSoda,
  History,
  LayoutDashboard,
  Package,
  ReceiptText,
  Sandwich,
  Table2,
  Tags,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export type CategoryStatus = 'Active' | 'Inactive';

export interface Category {
  id: number;
  name: string;
  icon: keyof typeof ICONS;
  status: CategoryStatus;
  productsCount: number;
}

export const ICONS: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  LiveOrders: ClipboardList,
  OrderHistory: History,
  Receipts: ReceiptText,
  Products: Package,
  Categories: Tags,
  Tables: Table2,
  Recipes: BookOpenText,
  Stock: Boxes,
  IncomeExpenses: Wallet,
  SalesAnalytics: BarChart3,
  Coffee,
  Tea: CupSoda,
  Bakery: Sandwich,
};

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Coffee', icon: 'Coffee', status: 'Active', productsCount: 12 },
  { id: 2, name: 'Tea', icon: 'Tea', status: 'Active', productsCount: 8 },
  { id: 3, name: 'Bakery', icon: 'Bakery', status: 'Active', productsCount: 10 },
  { id: 4, name: 'Seasonal', icon: 'Categories', status: 'Inactive', productsCount: 3 },
];
