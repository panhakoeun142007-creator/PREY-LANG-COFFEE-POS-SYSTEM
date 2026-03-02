import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import CategoriesPage from "./pages/CategoriesPage";
import LiveOrders from "./pages/LiveOrders";
import OrderHistory from "./pages/OrderHistory";
import PlaceholderPage from "./pages/PlaceholderPage";
import ReceiptsPage from "./pages/ReceiptsPage";
import IngredientsPage from "./pages/IngredientsPage";
import IncomePage from "./components/ui/income";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="live-orders" element={<LiveOrders />} />
        <Route path="order-history" element={<OrderHistory />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="products" element={<PlaceholderPage title="Products" />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="tables" element={<PlaceholderPage title="Table Management" />} />
        <Route path="recipes" element={<PlaceholderPage title="Recipes" />} />
        <Route path="stock" element={<IngredientsPage />} />
        <Route path="finance" element={<IncomePage />} />
        <Route path="analytics" element={<PlaceholderPage title="Sales Analytics" />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
