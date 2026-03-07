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

// Public pages
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyCode = lazy(() => import("./pages/VerifyCode"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifySuccessful = lazy(() => import("./pages/VerifySuccessful"));
const SessionExpired = lazy(() => import("./pages/SessionExpired"));

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

// Role-based Route Protection - redirects users away from pages they don't have access to
function RoleProtectedRoute({ requiredRole, children }) {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (auth.user?.role && requiredRole && auth.user.role !== requiredRole) {
      // Staff trying to access admin page, redirect to dashboard
      if (requiredRole === 'admin' && auth.user.role !== 'admin') {
        navigate('/', { replace: true });
      }
    }
  }, [auth.user, requiredRole, navigate]);

  return children;
}

// Auth Provider
function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
        // Fetch fresh user data from API to ensure we have latest data from database
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        fetch(`${API_BASE_URL}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
          .then(res => {
            if (!res.ok) {
              // Token is invalid, clear storage
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setIsAuthenticated(false);
              return null;
            }
            return res.json();
          })
          .then(data => {
            if (data && data.id) {
              setUser(data);
              localStorage.setItem('user', JSON.stringify(data));
            }
          })
          .catch(() => {});
      } catch (e) {
        // Invalid user data, clear storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
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

  const updateUser = (newUser) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF7F2]">
        <div className="text-[#7C5D58]">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Staff Routes (limited access)
function StaffRoutes() {
  return (
    <CategoryProvider>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={withSuspense(<DashboardPage />)} />
          <Route path="live-orders" element={withSuspense(<LiveOrders />)} />
          <Route path="order-history" element={withSuspense(<OrderHistory />)} />
          <Route path="receipts" element={withSuspense(<ReceiptsPage />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </CategoryProvider>
  );
}

// Admin Routes (full access)
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

// Main Routes with role-based access
function AppRoutes() {
  const auth = useContext(AuthContext);
  const userRole = auth.user?.role || 'admin';
  
  // Staff users get limited routes, admin gets full access
  if (userRole === 'staff') {
    return <StaffRoutes />;
  }
  return <AdminRoutes />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes - accessible without authentication */}
        <Route path="/login" element={withSuspense(<Login />)} />
        <Route path="/forgot-password" element={withSuspense(<ForgotPassword />)} />
        <Route path="/verify-code" element={withSuspense(<VerifyCode />)} />
        <Route path="/reset-password" element={withSuspense(<ResetPassword />)} />
        <Route path="/verify-successful" element={withSuspense(<VerifySuccessful />)} />
        <Route path="/session-expired" element={withSuspense(<SessionExpired />)} />
        
        {/* All other routes - protected with role-based access */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppRoutes />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

// Export auth context for use in components
export { AuthContext };
