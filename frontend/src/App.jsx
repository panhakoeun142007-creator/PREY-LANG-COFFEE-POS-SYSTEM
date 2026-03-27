import { lazy, Suspense, useCallback, useContext, useEffect, useState, createContext } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { CategoryProvider } from "./context/CategoryContext";
import { I18nProvider } from "./context/I18nContext";
import { SettingsProvider } from "./context/SettingsContext";
import { fetchCurrentUser } from "./services/api";
import { auth } from "./utils/auth";

const AuthContext = createContext({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  user: null,
  updateUser: () => {},
});

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LiveOrders = lazy(() => import("./pages/LiveOrders"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const ReceiptsPage = lazy(() => import("./pages/ReceiptsPage"));
const Products = lazy(() => import("./pages/Products"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const Tables = lazy(() => import("./pages/Tables"));
const IngredientsStockPage = lazy(() => import("./pages/IngredientsStockPage"));
const FinancePage = lazy(() => import("./pages/FinancePage"));
const SalesAnalytics = lazy(() => import("./pages/SalesAnalytics"));
const StaffManagementPage = lazy(() => import("./pages/CustomerManagementPage"));
const SettingsPage = lazy(() => import("./components/ui/setting"));
const StaffDashboardPage = lazy(() => import("./pages/StaffDashboardPage"));

const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyCode = lazy(() => import("./pages/VerifyCode"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifySuccessful = lazy(() => import("./pages/VerifySuccessful"));
const SessionExpired = lazy(() => import("./pages/SessionExpired"));
const CustomerMenuApp = lazy(() => import("./pages/CustomerMenuApp"));

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

function CategoryLayout() {
  return (
    <CategoryProvider>
      <Outlet />
    </CategoryProvider>
  );
}

function ProtectedRoute({ children, requireAdmin = false }) {
  const authCtx = useContext(AuthContext);
  const location = useLocation();

  if (!authCtx.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && authCtx.user?.role !== "admin") {
    return <Navigate to="/staff-dashboard" replace />;
  }

  if (!requireAdmin && location.pathname === "/staff-dashboard" && authCtx.user?.role === "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <SettingsProvider>
      <ErrorBoundary>{children}</ErrorBoundary>
    </SettingsProvider>
  );
}

function AdminRoute({ children }) {
  const authContext = useContext(AuthContext);
  let role = authContext.user?.role;

  if (!role) {
    const storedAuth = auth.getUser();
    role = storedAuth?.role;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RoleRedirect() {
  const authContext = useContext(AuthContext);
  const role = authContext.user?.role || auth.getUser()?.role;
  if (role === "staff") return <Navigate to="/staff-dashboard" replace />;
  return withSuspense(<DashboardPage />);
}

function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userFetched, setUserFetched] = useState(false);

  useEffect(() => {
    const handler = () => {
      // Ensure we don't get stuck in a redirect loop if a bad/expired token is stored.
      auth.clear();
      setIsAuthenticated(false);
      setUser(null);
      setUserFetched(false);
      // Customer menu is a public route; avoid redirecting scanned QR users to /login.
      if (window.location.pathname.startsWith("/menu")) {
        return;
      }
      if (window.location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    };

    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, [navigate]);

  const fetchUserData = useCallback(async () => {
    try {
      const data = await fetchCurrentUser();
      if (data && data.id) {
        setUser(data);
        auth.setUser(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("User fetch error:", error);
      return true;
    }
  }, []);

  useEffect(() => {
    const token = auth.getToken();
    const userData = auth.getUser();

    if (token && userData) {
      setUser(userData);
      setIsAuthenticated(true);

      if (!userFetched) {
        fetchUserData().then((success) => {
          if (!success) {
            setIsAuthenticated(false);
          }
          setUserFetched(true);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } else {
      auth.clear();
      setLoading(false);
    }
  }, [fetchUserData, userFetched]);

  const login = (token, userData, redirectPath = "/") => {
    auth.setAuth(token, userData);
    setIsAuthenticated(true);
    setUser(userData);
    setUserFetched(true);
    navigate(redirectPath, { replace: true });
  };

  const logout = () => {
    auth.clear();
    setIsAuthenticated(false);
    setUser(null);
    setUserFetched(false);
    navigate("/login", { replace: true });
  };

  const updateUser = (newUser) => {
    setUser(newUser);
    auth.setUser(newUser);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2]">
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

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <Routes>
          <Route path="/menu" element={<SettingsProvider>{withSuspense(<CustomerMenuApp />)}</SettingsProvider>} />
          <Route path="/login" element={withSuspense(<Login />)} />
          <Route path="/forgot-password" element={withSuspense(<ForgotPassword />)} />
          <Route path="/verify-code" element={withSuspense(<VerifyCode />)} />
          <Route path="/reset-password" element={withSuspense(<ResetPassword />)} />
          <Route path="/verify-successful" element={withSuspense(<VerifySuccessful />)} />
          <Route path="/session-expired" element={withSuspense(<SessionExpired />)} />

          <Route
            path="/staff-dashboard"
            element={
              <ProtectedRoute>
                {withSuspense(<StaffDashboardPage />)}
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleRedirect />} />
            <Route path="live-orders" element={withSuspense(<LiveOrders />)} />
            <Route path="order-history" element={withSuspense(<OrderHistory />)} />
            <Route path="receipts" element={withSuspense(<ReceiptsPage />)} />
            <Route path="tables" element={withSuspense(<Tables />)} />
            <Route path="stock" element={withSuspense(<IngredientsStockPage />)} />
            <Route path="finance" element={withSuspense(<FinancePage />)} />
            <Route path="analytics" element={withSuspense(<SalesAnalytics />)} />
            <Route
              path="staff-management"
              element={<AdminRoute>{withSuspense(<StaffManagementPage />)}</AdminRoute>}
            />
            <Route path="settings" element={<AdminRoute>{withSuspense(<SettingsPage />)}</AdminRoute>} />

            <Route element={<CategoryLayout />}>
              <Route path="products" element={withSuspense(<Products />)} />
              <Route path="categories" element={<AdminRoute>{withSuspense(<CategoriesPage />)}</AdminRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/live-orders" replace />} />
          </Route>
        </Routes>
      </I18nProvider>
    </AuthProvider>
  );
}

export { AuthContext };
