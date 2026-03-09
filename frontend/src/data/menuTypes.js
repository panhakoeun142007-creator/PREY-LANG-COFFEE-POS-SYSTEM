// Menu Types Configuration
// This file defines all menu categories and their products for the POS system

import { FaCoffee, FaLeaf, FaGlassWhiskey, FaBreadSlice, FaIceCream, FaWineGlass } from "react-icons/fa";

// Menu Category Types
export const MENU_TYPES = {
  ALL: "All",
  HOT_COFFEE: "Hot Coffee",
  ICED_COFFEE: "Iced Coffee",
  TEA: "Tea",
  SMOOTHIES: "Smoothies",
  FRAPPE: "Frappé",
  CAKES: "Cakes",
  PASTRIES: "Pastries",
};

// Simplified menu filters for clickable tabs in UI
export const MENU_FILTER_TYPES = {
  ALL: "All",
  COFFEE: "Coffee",
  TEA: "Tea",
  SMOOTHIE: "Smoothie",
  PASTRY: "Pastry",
};

export const MENU_FILTER_CATEGORIES = [
  { id: MENU_FILTER_TYPES.ALL, label: "All", icon: null },
  { id: MENU_FILTER_TYPES.COFFEE, label: "Coffee", icon: FaCoffee },
  { id: MENU_FILTER_TYPES.TEA, label: "Tea", icon: FaLeaf },
  { id: MENU_FILTER_TYPES.SMOOTHIE, label: "Smoothie", icon: FaGlassWhiskey },
  { id: MENU_FILTER_TYPES.PASTRY, label: "Pastry", icon: FaBreadSlice },
];

// Category definitions with metadata
export const CATEGORIES = [
  { 
    id: MENU_TYPES.ALL, 
    label: "All Menu", 
    icon: null,
    description: "View all items"
  },
  { 
    id: MENU_TYPES.HOT_COFFEE, 
    label: "Hot Coffee", 
    icon: FaCoffee,
    description: "Hot brewed coffee drinks"
  },
  { 
    id: MENU_TYPES.ICED_COFFEE, 
    label: "Iced Coffee", 
    icon: FaWineGlass,
    description: "Cold coffee beverages"
  },
  { 
    id: MENU_TYPES.TEA, 
    label: "Tea", 
    icon: FaLeaf,
    description: "Tea selections"
  },
  { 
    id: MENU_TYPES.FRAPPE, 
    label: "Frappé", 
    icon: FaGlassWhiskey,
    description: "Blended ice drinks"
  },
  { 
    id: MENU_TYPES.SMOOTHIES, 
    label: "Smoothies", 
    icon: FaGlassWhiskey,
    description: "Fresh fruit smoothies"
  },
  { 
    id: MENU_TYPES.CAKES, 
    label: "Cakes", 
    icon: FaIceCream,
    description: "Cakes and desserts"
  },
  { 
    id: MENU_TYPES.PASTRIES, 
    label: "Pastries", 
    icon: FaBreadSlice,
    description: "Baked goods"
  },
];

// Badge types for products
export const BADGES = {
  HOT: { label: "HOT", color: "#e74c3c" },
  ICED: { label: "ICED", color: "#3498db" },
  POPULAR: { label: "POPULAR", color: "#f39c12" },
  NEW: { label: "NEW", color: "#9b59b6" },
  SEASONAL: { label: "SEASONAL", color: "#1abc9c" },
  FRESH: { label: "FRESH", color: "#2ecc71" },
  CREAMY: { label: "CREAMY", color: "#f1c40f" },
};

// Sample products data - this would typically come from an API
export const SAMPLE_PRODUCTS = {
  [MENU_TYPES.HOT_COFFEE]: [
    { id: 1, name: "Espresso", price: 3.00, badge: BADGES.HOT },
    { id: 2, name: "Americano", price: 3.50, badge: BADGES.HOT },
    { id: 3, name: "Latte", price: 4.25, badge: BADGES.HOT },
    { id: 4, name: "Cappuccino", price: 4.00, badge: BADGES.HOT },
    { id: 5, name: "Flat White", price: 4.00, badge: BADGES.HOT },
    { id: 6, name: "Mocha", price: 4.50, badge: BADGES.HOT },
    { id: 7, name: "Macchiato", price: 3.75, badge: BADGES.HOT },
    { id: 8, name: "Double Espresso", price: 4.00, badge: BADGES.HOT },
  ],
  [MENU_TYPES.ICED_COFFEE]: [
    { id: 9, name: "Iced Americano", price: 3.75, badge: BADGES.ICED },
    { id: 10, name: "Iced Latte", price: 4.50, badge: BADGES.ICED },
    { id: 11, name: "Iced Mocha", price: 4.75, badge: BADGES.ICED },
    { id: 12, name: "Cold Brew", price: 4.25, badge: BADGES.ICED },
    { id: 13, name: "Nitro Cold Brew", price: 5.25, badge: BADGES.ICED },
    { id: 14, name: "Iced Cappuccino", price: 4.50, badge: BADGES.ICED },
  ],
  [MENU_TYPES.TEA]: [
    { id: 15, name: "Green Tea", price: 3.00, badge: BADGES.HOT },
    { id: 16, name: "Black Tea", price: 3.00, badge: BADGES.HOT },
    { id: 17, name: "Chai Latte", price: 4.50, badge: BADGES.HOT },
    { id: 18, name: "Matcha Latte", price: 5.00, badge: BADGES.POPULAR },
    { id: 19, name: "Earl Grey", price: 3.25, badge: BADGES.HOT },
    { id: 20, name: "Jasmine Tea", price: 3.50, badge: null },
    { id: 21, name: "Iced Tea", price: 3.50, badge: BADGES.ICED },
    { id: 22, name: "Honey Lemon Tea", price: 4.00, badge: BADGES.NEW },
  ],
  [MENU_TYPES.FRAPPE]: [
    { id: 23, name: "Mocha Frappé", price: 5.50, badge: BADGES.SEASONAL },
    { id: 24, name: "Caramel Frappé", price: 5.25, badge: BADGES.POPULAR },
    { id: 25, name: "Vanilla Frappé", price: 5.00, badge: BADGES.NEW },
    { id: 26, name: "Coffee Frappé", price: 4.75, badge: null },
    { id: 27, name: "Chocolate Frappé", price: 5.25, badge: null },
  ],
  [MENU_TYPES.SMOOTHIES]: [
    { id: 28, name: "Berry Blast", price: 5.50, badge: BADGES.FRESH },
    { id: 29, name: "Mango Tango", price: 5.25, badge: BADGES.CREAMY },
    { id: 30, name: "Banana Shake", price: 4.75, badge: BADGES.CREAMY },
    { id: 31, name: "Strawberry Delight", price: 5.00, badge: BADGES.FRESH },
    { id: 32, name: "Green Smoothie", price: 5.75, badge: BADGES.NEW },
  ],
  [MENU_TYPES.CAKES]: [
    { id: 33, name: "Chocolate Cake", price: 5.50, badge: BADGES.POPULAR },
    { id: 34, name: "Cheesecake", price: 6.00, badge: null },
    { id: 35, name: "Carrot Cake", price: 5.75, badge: null },
    { id: 36, name: "Red Velvet", price: 6.25, badge: BADGES.POPULAR },
    { id: 37, name: "Tiramisu", price: 6.50, badge: null },
    { id: 38, name: "Black Forest", price: 6.00, badge: null },
    { id: 39, name: "Lemon Tart", price: 5.25, badge: BADGES.FRESH },
    { id: 40, name: "Mille Feuille", price: 5.50, badge: BADGES.NEW },
  ],
  [MENU_TYPES.PASTRIES]: [
    { id: 41, name: "Croissant", price: 3.50, badge: BADGES.FRESH },
    { id: 42, name: "Chocolate Croissant", price: 3.75, badge: BADGES.FRESH },
    { id: 43, name: "Blueberry Muffin", price: 3.25, badge: BADGES.FRESH },
    { id: 44, name: "Cinnamon Roll", price: 4.00, badge: BADGES.HOT },
    { id: 45, name: "Danish Pastry", price: 3.50, badge: null },
    { id: 46, name: "Apple Pie", price: 4.25, badge: null },
    { id: 47, name: "Scone", price: 3.00, badge: BADGES.FRESH },
    { id: 48, name: "Pain au Chocolat", price: 3.75, badge: BADGES.POPULAR },
  ],
};

// Helper function to get category by ID
export const getCategoryById = (id) => {
  return CATEGORIES.find(cat => cat.id === id);
};

// Helper function to get all products
export const getAllProducts = () => {
  return Object.values(SAMPLE_PRODUCTS).flat();
};

export const getAllProductsWithCategory = () => {
  return Object.entries(SAMPLE_PRODUCTS).flatMap(([category, items]) =>
    items.map((item) => ({ ...item, category }))
  );
};

// Helper function to get products by category
export const getProductsByCategory = (categoryId) => {
  if (categoryId === MENU_TYPES.ALL) {
    return getAllProducts();
  }
  return SAMPLE_PRODUCTS[categoryId] || [];
};

export const normalizeMenuFilterType = (category) => {
  const value = (category || "").toLowerCase();
  if (value.includes("coffee")) return MENU_FILTER_TYPES.COFFEE;
  if (value === "tea") return MENU_FILTER_TYPES.TEA;
  if (value === "smoothie" || value === "smoothies" || value === "frappe" || value === "frappé") {
    return MENU_FILTER_TYPES.SMOOTHIE;
  }
  if (value === "pastry" || value === "pastries" || value === "cake" || value === "cakes") {
    return MENU_FILTER_TYPES.PASTRY;
  }
  return category;
};

export const getProductsByMenuType = (menuTypeId) => {
  if (menuTypeId === MENU_FILTER_TYPES.ALL) {
    return getAllProducts();
  }

  return getAllProductsWithCategory().filter(
    (product) => normalizeMenuFilterType(product.category) === menuTypeId
  );
};
