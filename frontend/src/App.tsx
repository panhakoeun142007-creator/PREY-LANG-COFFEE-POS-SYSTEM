import {
  lazy,
  Suspense,
  useState,
  type ComponentType,
  type FormEvent,
  type ReactElement,
} from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import { loginAdmin } from "./services/api";

function lazyWithRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const module = await importer();
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("lazy-retry");
      }
      return module;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const chunkFetchFailed =
        /Failed to fetch dynamically imported module/i.test(message);

      if (chunkFetchFailed && typeof window !== "undefined") {
        const hasRetried = sessionStorage.getItem("lazy-retry") === "1";
        if (!hasRetried) {
          sessionStorage.setItem("lazy-retry", "1");
          window.location.reload();
          return new Promise<never>(() => {});
        }
      }

      throw err;
    }
  });
}

const DashboardPage = lazyWithRetry(
  () => import("./pages/admin/DashboardPage"),
);
const CategoriesPage = lazyWithRetry(
  () => import("./pages/admin/CategoriesPage"),
);
const StaffManagementPage = lazyWithRetry(
  () => import("./pages/admin/CustomerManagementPage"),
);
const LiveOrders = lazyWithRetry(() => import("./pages/staff/LiveOrders"));
const OrderHistory = lazyWithRetry(() => import("./pages/staff/OrderHistory"));
const PlaceholderPage = lazyWithRetry(
  () => import("./pages/admin/PlaceholderPage"),
);
const SalesAnalytics = lazyWithRetry(
  () => import("./pages/admin/SalesAnalytics"),
);
const Products = lazyWithRetry(() => import("./pages/admin/Products"));
const ReceiptsPage = lazyWithRetry(() => import("./pages/admin/ReceiptsPage"));
const RecipesStockPage = lazyWithRetry(
  () => import("./pages/admin/RecipesStockPage"),
);
const Tables = lazyWithRetry(() => import("./pages/admin/Tables"));
const IngredientsPage = lazyWithRetry(
  () => import("./pages/admin/IngredientsPage"),
);
const IncomePage = lazyWithRetry(() => import("./components/ui/income"));
const CustomerMenuPage = lazyWithRetry(() => import("./pages/customer/Menu"));
const CustomerCartPage = lazyWithRetry(() => import("./pages/customer/Cart"));
const CustomerOrderConfirmationPage = lazyWithRetry(
  () => import("./pages/customer/Confirmation"),
);
const CustomerOrderStatusPage = lazyWithRetry(
  () => import("./pages/customer/OrderStatus"),
);
const CustomerReceiptPage = lazyWithRetry(
  () => import("./pages/customer/Receipt"),
);

type AuthRole = "admin" | "staff";

function getStoredRole(): AuthRole {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("auth_role") : null;

  return role === "staff" ? "staff" : "admin";
}

function getDefaultRouteForRole(role: AuthRole): string {
  return role === "staff" ? "/live-orders" : "/";
}

function LoginPage() {
  const navigate = useNavigate();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const storedRole = getStoredRole();
  const [email, setEmail] = useState("admin@pos.com");
  const [password, setPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (token) {
    return <Navigate to={getDefaultRouteForRole(storedRole)} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const auth = await loginAdmin(email.trim(), password);
      const role = auth.user.role === "staff" ? "staff" : "admin";
      navigate(getDefaultRouteForRole(role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#EAD6C0] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#4B2E2B]">
          Staff / Admin Login
        </h1>
        <p className="mt-1 text-sm text-[#7C5D58]">
          Sign in to connect to backend API.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div>
            <label
              className="mb-1 block text-sm text-[#4B2E2B]"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg border border-[#EAD6C0] px-3 py-2 text-sm text-[#4B2E2B] outline-none focus:border-[#B28A6E]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm text-[#4B2E2B]"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-lg border border-[#EAD6C0] px-3 py-2 text-sm text-[#4B2E2B] outline-none focus:border-[#B28A6E]"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#4B2E2B] px-3 py-2 text-sm font-medium text-white hover:bg-[#5B3E3B] disabled:opacity-70"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

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

function RequireAuth({ children }: { children: ReactElement }) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RequireRole({
  children,
  allowedRoles,
}: {
  children: ReactElement;
  allowedRoles: AuthRole[];
}) {
  const role = getStoredRole();
  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/menu" element={withSuspense(<CustomerMenuPage />)} />
      <Route path="/menu/cart" element={withSuspense(<CustomerCartPage />)} />
      <Route
        path="/order-confirmation/:id"
        element={withSuspense(<CustomerOrderConfirmationPage />)}
      />
      <Route
        path="/order-status/:id"
        element={withSuspense(<CustomerOrderStatusPage />)}
      />
      <Route
        path="/receipt/:id"
        element={withSuspense(<CustomerReceiptPage />)}
      />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={withSuspense(<DashboardPage />)} />
        <Route path="live-orders" element={withSuspense(<LiveOrders />)} />
        <Route path="order-history" element={withSuspense(<OrderHistory />)} />
        <Route
          path="receipts"
          element={
            <RequireRole allowedRoles={["admin"]}>
              {withSuspense(<ReceiptsPage />)}
            </RequireRole>
          }
        />
        <Route
          path="products"
          element={
            <RequireRole allowedRoles={["admin"]}>
              {withSuspense(<Products />)}
            </RequireRole>
          }
        />
        <Route
          path="categories"
          element={
            <RequireRole allowedRoles={["admin"]}>
              {withSuspense(<CategoriesPage />)}
            </RequireRole>
          }
        />
        <Route
          path="tables"
          element={
            <RequireRole allowedRoles={["admin"]}>
              {withSuspense(<Tables />)}
            </RequireRole>
          }
        />
        <Route
          path="recipes"
          element={
            <RequireRole allowedRoles={["admin"]}>
              {withSuspense(<RecipesStockPage />)}
            </RequireRole>
          }
        />
        <Route
          path="stock"
          element={
            <RequireRole allowedRoles={["admin"]}>
              {withSuspense(<IngredientsPage />)}
            </RequireRole>
          }
        />
        <Route
          path="staff-management"
          element={
            <RequireRole allowedRoles={["admin"]}>
              {withSuspense(<StaffManagementPage />)}
            </RequireRole>
          }
        />
        <Route
          path="analytics"
          element={
            <RequireRole allowedRoles={["admin"]}>
              {withSuspense(<SalesAnalytics />)}
            </RequireRole>
          }
        />
        <Route
          path="finance"
          element={
            <RequireRole allowedRoles={["admin"]}>
              {withSuspense(<IncomePage />)}
            </RequireRole>
          }
        />
        <Route
          path="settings"
          element={
            <RequireRole allowedRoles={["admin"]}>
              {withSuspense(<PlaceholderPage title="Settings" />)}
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
