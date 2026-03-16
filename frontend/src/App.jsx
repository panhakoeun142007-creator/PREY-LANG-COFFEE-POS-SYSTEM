import { lazy, Suspense, useState, useEffect, createContext, useContext, useCallback } from "react";
import { Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import { CategoryProvider } from "./context/CategoryContext";

// Auth Context
const AuthContext = createContext({
  isAuthenticated: false,
  login: () => { },
  logout: () => { },
  user: null,
});

// Staff pages (all pages accessible to staff)
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
const StaffDashboardPage = lazy(() => import("./pages/StaffDashboardPage"));

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

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

// Role-based Route Protection - Removed admin restrictions, all authenticated users can access all routes
function RoleProtectedRoute({ requiredRole, children }) {
  // All authenticated users can access all routes (admin restrictions removed)
  return children;
}

// Auth Provider with optimized loading
function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userFetched, setUserFetched] = useState(false);

  const fetchUserData = useCallback(async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        return false;
      }

      const data = await response.json();
      if (data && data.id) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        return true;
      }
      return false;
    } catch (error) {
      console.error('User fetch error:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);

        if (!userFetched) {
          fetchUserData(token).then(success => {
            if (!success) {
              setIsAuthenticated(false);
            }
            setUserFetched(true);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [fetchUserData, userFetched]);

  const login = (token, userData, redirectPath = '/') => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    setUserFetched(true);
    navigate(redirectPath, { replace: true });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    setUserFetched(false);
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

// Staff Routes (only accessible pages)
function StaffRoutes() {
  return (
    <CategoryProvider>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={withSuspense(<DashboardPage />)} />
          <Route path="live-orders" element={withSuspense(<LiveOrders />)} />
          <Route path="order-history" element={withSuspense(<OrderHistory />)} />
          <Route path="receipts" element={withSuspense(<ReceiptsPage />)} />
        </Route>
        <Route path="*" element={<Navigate to="/live-orders" replace />} />
      </Routes>
    </CategoryProvider>
  );
}

// Main Routes - Staff only access
function AppRoutes() {
  return <StaffRoutes />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={withSuspense(<Login />)} />
        <Route path="/forgot-password" element={withSuspense(<ForgotPassword />)} />
        <Route path="/verify-code" element={withSuspense(<VerifyCode />)} />
        <Route path="/reset-password" element={withSuspense(<ResetPassword />)} />
        <Route path="/verify-successful" element={withSuspense(<VerifySuccessful />)} />
        <Route path="/session-expired" element={withSuspense(<SessionExpired />)} />
        <Route path="/staff-dashboard" element={withSuspense(<StaffDashboardPage />)} />

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

export { AuthContext };
