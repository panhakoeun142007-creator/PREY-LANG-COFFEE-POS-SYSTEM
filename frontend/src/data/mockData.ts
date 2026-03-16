import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Package,
  Receipt,
  Salad,
  Settings,
  ShoppingCart,
  Table2,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: ('admin' | 'staff')[]; // Which roles can access this item
};

export type NavGroup = {
  group: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    group: "Dashboard",
    items: [{ label: "Dashboard", path: "/", icon: LayoutDashboard, roles: ['admin', 'staff'] }],
  },
  {
    group: "Orders",
    items: [
      { label: "Live Orders", path: "/live-orders", icon: ShoppingCart, roles: ['admin', 'staff'] },
      { label: "Order History", path: "/order-history", icon: ClipboardList, roles: ['admin', 'staff'] },
      { label: "Receipts", path: "/receipts", icon: Receipt, roles: ['admin', 'staff'] },
    ],
  },
  {
    group: "Menu Management",
    items: [
      { label: "Products", path: "/products", icon: Package, roles: ['admin', 'staff'] },
      { label: "Categories", path: "/categories", icon: Salad, roles: ['admin', 'staff'] },
    ],
  },
  {
    group: "Tables",
    items: [{ label: "Table Management", path: "/tables", icon: Table2, roles: ['admin', 'staff'] }],
  },
  {
    group: "Stock & Recipe",
    items: [
      { label: "Recipes", path: "/recipes", icon: ClipboardList, roles: ['admin', 'staff'] },
      { label: "Ingredients / Stock", path: "/stock", icon: Package, roles: ['admin', 'staff'] },
    ],
  },
  {
    group: "Finance",
    items: [{ label: "Income & Expenses", path: "/finance", icon: Wallet, roles: ['admin', 'staff'] }],
  },
  {
    group: "Analytics",
    items: [{ label: "Sales Analytics", path: "/analytics", icon: BarChart3, roles: ['admin', 'staff'] }],
  },
  {
    group: "System",
    items: [
      { label: "Staff Management", path: "/staff-management", icon: Users, roles: ['admin', 'staff'] },
      { label: "Settings", path: "/settings", icon: Settings, roles: ['admin', 'staff'] },
    ],
  },
];

export const pageTitleByPath: Record<string, string> = navGroups
  .flatMap((group) => group.items)
  .reduce<Record<string, string>>((acc, item) => {
    acc[item.path] = item.label;
    return acc;
  }, {});

export const stats = [
  {
    label: "Total Revenue Today",
    value: "$1,247.50",
    trend: "↑ 12.5%",
    accent: "text-emerald-600",
  },
  {
    label: "Total Orders Today",
    value: "87",
    trend: "↑ 8.2%",
    accent: "text-emerald-600",
  },
  {
    label: "Low Stock Items",
    value: "4",
    trend: "Needs attention",
    accent: "text-rose-600",
  },
  {
    label: "Monthly Profit",
    value: "$18,450",
    trend: "↑ 15.3%",
    accent: "text-emerald-600",
  },
];

export const revenueData = [
  { name: "Mon", revenue: 820 },
  { name: "Tue", revenue: 930 },
  { name: "Wed", revenue: 1060 },
  { name: "Thu", revenue: 980 },
  { name: "Fri", revenue: 1250 },
  { name: "Sat", revenue: 1410 },
  { name: "Sun", revenue: 1180 },
];

export const categoryData = [
  { category: "Coffee", orders: 42 },
  { category: "Tea", orders: 20 },
  { category: "Pastries", orders: 15 },
  { category: "Smoothies", orders: 9 },
  { category: "Sandwiches", orders: 11 },
];

export const recentOrders = [
  { id: "#ORD-1001", table: "Table 3", total: "$18.50", status: "pending" },
  { id: "#ORD-1002", table: "Table 7", total: "$26.75", status: "preparing" },
  { id: "#ORD-1003", table: "Table 1", total: "$12.00", status: "ready" },
  { id: "#ORD-1004", table: "Takeaway", total: "$9.50", status: "completed" },
  { id: "#ORD-1005", table: "Table 5", total: "$31.25", status: "preparing" },
];

export const lowStockItems = [
  { name: "Colombian Beans", level: 24 },
  { name: "Almond Milk", level: 18 },
  { name: "Chocolate Syrup", level: 30 },
  { name: "Croissant Dough", level: 12 },
];
