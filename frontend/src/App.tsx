import { lazy, Suspense, type ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import { CategoryProvider } from "./context/CategoryContext";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const StaffManagementPage = lazy(() => import("./pages/CustomerManagementPage"));
const LiveOrders = lazy(() => import("./pages/LiveOrders"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const PlaceholderPage = lazy(() => import("./pages/PlaceholderPage"));
const SalesAnalytics = lazy(() => import("./pages/SalesAnalytics"));
const Products = lazy(() => import("./pages/Products"));
const ReceiptsPage = lazy(() => import("./pages/ReceiptsPage"));
const RecipesStockPage = lazy(() => import("./pages/RecipesStockPage"));
const Tables = lazy(() => import("./pages/Tables"));
const IngredientsPage = lazy(() => import("./pages/IngredientsPage"));
const IncomePage = lazy(() => import("./components/ui/income"));
const SettingsPage = lazy(() => import("./components/ui/setting"));
const MenuPage = lazy(() => import("./pages/MenuPage"));

function RouteFallback() {
  return (
    <div className="rounded-lg border border-[#EAD6C0] bg-white p-4 text-sm text-[#7C5D58]">
      Loading...
    </div>
  );
}

function withSuspense(element: ReactElement) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

export default function App() {
  return (
    <CategoryProvider>
      <Routes>
        <Route path="/menu" element={withSuspense(<MenuPage />)} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={withSuspense(<DashboardPage />)} />
          <Route path="live-orders" element={withSuspense(<LiveOrders />)} />
          <Route path="order-history" element={withSuspense(<OrderHistory />)} />
          <Route path="receipts" element={withSuspense(<ReceiptsPage />)} />
          <Route path="products" element={withSuspense(<Products />)} />
          <Route path="categories" element={withSuspense(<CategoriesPage />)} />
          <Route path="tables" element={withSuspense(<Tables />)} />
          <Route path="recipes" element={withSuspense(<RecipesStockPage />)} />
          <Route path="stock" element={withSuspense(<IngredientsPage />)} />
          <Route path="staff-management" element={withSuspense(<StaffManagementPage />)} />
          <Route path="analytics" element={withSuspense(<SalesAnalytics />)} />
          <Route path="finance" element={withSuspense(<IncomePage />)} />
          <Route path="settings" element={withSuspense(<SettingsPage />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </CategoryProvider>
  );
}
