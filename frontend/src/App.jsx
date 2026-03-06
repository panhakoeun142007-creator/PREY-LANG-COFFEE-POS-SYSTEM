import { lazy, Suspense, useState, useEffect, createContext, useContext } from "react";
import { Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import { CategoryProvider } from "./context/CategoryContext";

// Auth Context
const AuthContext = createContext({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  user: null,
});

// Lazy loaded admin pages
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const StaffManagementPage = lazy(() => import("./pages/CustomerManagementPage"));
const LiveOrders = lazy(() => import("./pages/LiveOrders"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const SalesAnalytics = lazy(() => import("./pages/SalesAnalytics"));
const Products = lazy(() => import("./pages/Products"));
const ReceiptsPage = lazy(() => import("./pages/ReceiptsPage"));
const RecipesStockPage = lazy(() => import("./pages/RecipesStockPage"));
const Tables = lazy(() => import("./pages/Tables"));
const IngredientsPage = lazy(() => import("./pages/IngredientsPage"));
const IncomePage = lazy(() => import("./components/ui/income"));
const SettingsPage = lazy(() => import("./components/ui/setting"));

// Login page
const Login = lazy(() => import("./pages/Login"));

function RouteFallback() {
  return (
    <div className="rounded-lg border border-[#EAD6C0] bg-white p-4 text-sm text-[#7C5D58]">
      Loading...
    </div>
  );
}

function withSuspense(element) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const auth = useContext(AuthContext);
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Auth Provider
function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    navigate("/", { replace: true });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}

// Admin Routes (protected)
function AdminRoutes() {
  return (
    <CategoryProvider>
      <Routes>
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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={withSuspense(<Login />)} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminRoutes />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

// Export auth context for use in components
export { AuthContext };
