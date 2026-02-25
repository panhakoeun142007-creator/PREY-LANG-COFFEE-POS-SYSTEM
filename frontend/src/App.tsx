import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import PlaceholderPage from "./pages/PlaceholderPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="live-orders" element={<PlaceholderPage title="Live Orders" />} />
        <Route path="order-history" element={<PlaceholderPage title="Order History" />} />
        <Route path="receipts" element={<PlaceholderPage title="Receipts" />} />
        <Route path="products" element={<PlaceholderPage title="Products" />} />
        <Route path="categories" element={<PlaceholderPage title="Categories" />} />
        <Route path="tables" element={<PlaceholderPage title="Table Management" />} />
        <Route path="recipes" element={<PlaceholderPage title="Recipes" />} />
        <Route path="stock" element={<PlaceholderPage title="Ingredients / Stock" />} />
        <Route path="finance" element={<PlaceholderPage title="Income & Expenses" />} />
        <Route path="analytics" element={<PlaceholderPage title="Sales Analytics" />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
