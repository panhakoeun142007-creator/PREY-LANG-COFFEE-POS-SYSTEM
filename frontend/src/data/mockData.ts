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
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

export type NavGroup = {
  group: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    group: "Dashboard",
    items: [{ label: "Dashboard", path: "/", icon: LayoutDashboard }],
  },
  {
    group: "Orders",
    items: [
      { label: "Live Orders", path: "/live-orders", icon: ShoppingCart },
      { label: "Order History", path: "/order-history", icon: ClipboardList },
      { label: "Receipts", path: "/receipts", icon: Receipt },
    ],
  },
  {
    group: "Menu Management",
    items: [
      { label: "Products", path: "/products", icon: Package },
      { label: "Categories", path: "/categories", icon: Salad },
    ],
  },
  {
    group: "Tables",
    items: [{ label: "Table Management", path: "/tables", icon: Table2 }],
  },
  {
    group: "Stock & Recipe",
    items: [
      { label: "Recipes", path: "/recipes", icon: ClipboardList },
      { label: "Ingredients / Stock", path: "/stock", icon: Package },
    ],
  },
  {
    group: "Finance",
    items: [{ label: "Income & Expenses", path: "/finance", icon: Wallet }],
  },
  {
    group: "Analytics",
    items: [{ label: "Sales Analytics", path: "/analytics", icon: BarChart3 }],
  },
  {
    group: "System",
    items: [{ label: "Settings", path: "/settings", icon: Settings }],
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

export interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  priceSmall: number;
  priceMedium: number;
  priceLarge: number;
  available: boolean;
}

export const productCategories = ["Coffee", "Tea", "Pastries", "Smoothies"] as const;

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Espresso",
    category: "Coffee",
    image: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=100&h=100&fit=crop",
    priceSmall: 2.50,
    priceMedium: 3.00,
    priceLarge: 3.50,
    available: true,
  },
  {
    id: "2",
    name: "Cappuccino",
    category: "Coffee",
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=100&h=100&fit=crop",
    priceSmall: 3.50,
    priceMedium: 4.00,
    priceLarge: 4.50,
    available: true,
  },
  {
    id: "3",
    name: "Latte",
    category: "Coffee",
    image: "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=100&h=100&fit=crop",
    priceSmall: 3.50,
    priceMedium: 4.00,
    priceLarge: 4.50,
    available: true,
  },
  {
    id: "4",
    name: "Americano",
    category: "Coffee",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100&h=100&fit=crop",
    priceSmall: 2.50,
    priceMedium: 3.00,
    priceLarge: 3.50,
    available: true,
  },
  {
    id: "5",
    name: "Mocha",
    category: "Coffee",
    image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=100&h=100&fit=crop",
    priceSmall: 4.00,
    priceMedium: 4.50,
    priceLarge: 5.00,
    available: true,
  },
  {
    id: "6",
    name: "Green Tea",
    category: "Tea",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=100&h=100&fit=crop",
    priceSmall: 2.00,
    priceMedium: 2.50,
    priceLarge: 3.00,
    available: true,
  },
  {
    id: "7",
    name: "Earl Grey",
    category: "Tea",
    image: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=100&h=100&fit=crop",
    priceSmall: 2.00,
    priceMedium: 2.50,
    priceLarge: 3.00,
    available: true,
  },
  {
    id: "8",
    name: "Chamomile",
    category: "Tea",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=100&h=100&fit=crop",
    priceSmall: 2.50,
    priceMedium: 3.00,
    priceLarge: 3.50,
    available: false,
  },
  {
    id: "9",
    name: "Croissant",
    category: "Pastries",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100&h=100&fit=crop",
    priceSmall: 2.50,
    priceMedium: 0,
    priceLarge: 0,
    available: true,
  },
  {
    id: "10",
    name: "Blueberry Muffin",
    category: "Pastries",
    image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=100&h=100&fit=crop",
    priceSmall: 3.00,
    priceMedium: 0,
    priceLarge: 0,
    available: true,
  },
  {
    id: "11",
    name: "Cinnamon Roll",
    category: "Pastries",
    image: "https://images.unsplash.com/photo-1509365390695-33aee754301f?w=100&h=100&fit=crop",
    priceSmall: 3.50,
    priceMedium: 0,
    priceLarge: 0,
    available: true,
  },
  {
    id: "12",
    name: "Banana Smoothie",
    category: "Smoothies",
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=100&h=100&fit=crop",
    priceSmall: 4.00,
    priceMedium: 5.00,
    priceLarge: 6.00,
    available: true,
  },
  {
    id: "13",
    name: "Strawberry Smoothie",
    category: "Smoothies",
    image: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=100&h=100&fit=crop",
    priceSmall: 4.50,
    priceMedium: 5.50,
    priceLarge: 6.50,
    available: true,
  },
  {
    id: "14",
    name: "Mango Smoothie",
    category: "Smoothies",
    image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=100&h=100&fit=crop",
    priceSmall: 4.50,
    priceMedium: 5.50,
    priceLarge: 6.50,
    available: false,
  },
];
