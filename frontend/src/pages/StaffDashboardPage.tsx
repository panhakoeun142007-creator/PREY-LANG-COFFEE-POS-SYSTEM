import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import Orders from "../components/Orders";
import OrderHistory from "../components/OrderHistory";
import RecipeView from "../components/RecipeView";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  fetchLiveOrders,
  fetchOrderHistory,
  updateOrderStatus as updateOrderStatusApi,
  fetchCurrentUser,
  fetchManager,
  updateCurrentUser,
  logoutAdmin,
  type ApiOrder,
  type CurrentUser,
  type ManagerInfo,
  type Notification,
} from "../services/api";
import { auth } from "../utils/auth";
import LogoutConfirmModal from "../components/LogoutConfirmModal";

// Minimal local types for the staff dashboard UI
type OrderStatus = "Pending" | "Preparing" | "Brewing" | "Ready" | "Delayed" | "Completed" | "Cancelled";

interface UiOrderItem {
  name: string;
  quantity: number;
  customization?: string;
  price?: number;
}

interface UiOrder {
  id: string;
  tableNo: string;
  status: OrderStatus;
  items: UiOrderItem[];
  timeElapsed: string;
  timestamp: string;
  total: number;
  paymentMethod?: "KHQR" | "Cash" | "Card";
}

interface RecipeLog {
  id: string;
  orderId: string;
  tableNo: string;
  name: string;
}

function toUiStatus(raw: string): OrderStatus {
  const s = (raw || "").toLowerCase();
  if (s === "pending") return "Pending";
  if (s === "preparing") return "Preparing";
  if (s === "brewing") return "Brewing";
  if (s === "ready") return "Ready";
  if (s === "delayed") return "Delayed";
  if (s === "completed") return "Completed";
  if (s === "cancelled") return "Cancelled";
  return "Pending";
}

function formatElapsed(createdAt?: string): string {
  if (!createdAt) return "";
  const diff = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

function mapApiOrder(o: ApiOrder): UiOrder {
  return {
    id: String(o.id),
    tableNo: o.table?.name || (o.table_id ? `Table ${String(o.table_id).padStart(2, "0")}` : "Takeaway"),
    status: toUiStatus(o.status),
    items: (o.items || []).map((item) => ({
      name: item.product?.name || `Product #${item.product_id}`,
      quantity: Number(item.qty || 0),
      customization: item.size ? `Size: ${item.size}` : undefined,
      price: item.price !== null && item.price !== undefined ? Number(item.price) : undefined,
    })),
    timeElapsed: formatElapsed(o.created_at),
    timestamp: o.created_at || "",
    total: Number(o.total_price || 0),
    paymentMethod: (() => {
      const p = (o.payment_type || "").toLowerCase();
      if (p === "cash") return "Cash";
      if (p === "card" || p === "credit_card") return "Card";
      if (p === "khqr") return "KHQR";
      return undefined;
    })(),
  };
}

function buildDisplayIdMap(ids: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  ids.forEach((id, i) => { map[id] = `POS_${String(i + 1).padStart(3, "0")}`; });
  return map;
}

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState<boolean>(() => {
    const t = localStorage.getItem("theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<UiOrder | null>(null);
  const [recipeLogs, setRecipeLogs] = useState<RecipeLog[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [historyOrders, setHistoryOrders] = useState<UiOrder[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historySummary, setHistorySummary] = useState<{ completed: number; cancelled: number }>({
    completed: 0,
    cancelled: 0,
  });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => auth.getUser() as CurrentUser | null);
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const lastOrderIdsRef = useRef<Set<string>>(new Set());
  const didInitOrdersRef = useRef(false);

  const orderDisplayIdMap = buildDisplayIdMap(orders.map((o) => o.id));

  async function doLogout() {
    setShowLogoutConfirm(false);
    try { await logoutAdmin(); } catch { /* ignore */ }
    auth.clear();
    navigate("/login", { replace: true });
  }

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const data = await fetchLiveOrders();
      const mapped = data.map(mapApiOrder);
      setOrders(mapped);

      const nextIds = new Set(mapped.map((o) => o.id));
      if (didInitOrdersRef.current) {
        let newCount = 0;
        nextIds.forEach((id) => {
          if (!lastOrderIdsRef.current.has(id)) newCount += 1;
        });
        if (newCount > 0) {
          toast.success(`${newCount} new order${newCount > 1 ? "s" : ""} received.`);
        }
      }
      lastOrderIdsRef.current = nextIds;
      didInitOrdersRef.current = true;
    } catch {
      toast.error("Unable to load orders.");
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    void loadOrders();
    const interval = setInterval(() => {
      void loadOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const payload = await fetchOrderHistory({ status: "completed", sort_by: "updated_at", sort_order: "desc" });
      const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setHistoryOrders(rows.map(mapApiOrder));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load order history.";
      setHistoryError(message);
      setHistoryOrders([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadHistorySummary = useCallback(async () => {
    try {
      const payload = await fetchOrderHistory({ page: 1 });
      const summary = payload?.summary || {};
      const completed = Number(summary.completed_count ?? 0);
      const cancelled = Number(summary.cancelled_count ?? 0);
      setHistorySummary({
        completed: Number.isFinite(completed) ? completed : 0,
        cancelled: Number.isFinite(cancelled) ? cancelled : 0,
      });
    } catch {
      setHistorySummary({ completed: 0, cancelled: 0 });
    }
  }, []);

  useEffect(() => {
    void loadHistorySummary();
    const interval = setInterval(() => {
      void loadHistorySummary();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadHistorySummary]);

  const loadRecipeLogs = useCallback(async () => {
    setRecipeLoading(true);
    setRecipeError(null);
    try {
      const response = await fetch("/api/recipe-logs");
      if (!response.ok) throw new Error("Failed to load receipt history.");
      const payload = await response.json();
      const mapped: RecipeLog[] = (Array.isArray(payload) ? payload : []).map((log) => ({
        id: String(log.id),
        orderId: String(log.order_id ?? log.orderId ?? ""),
        tableNo: String(log.table_no ?? log.tableNo ?? ""),
        name: String(log.name ?? ""),
      }));
      setRecipeLogs(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load receipt history.";
      setRecipeError(message);
      setRecipeLogs([]);
    } finally {
      setRecipeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "recipe") {
      void loadRecipeLogs();
    }
  }, [activeTab, loadRecipeLogs]);

  useEffect(() => {
    if (activeTab !== "history") return;
    void loadHistory();
    const interval = setInterval(() => {
      void loadHistory();
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, loadHistory]);

  useEffect(() => {
    if (activeTab !== "orders") return;
    void loadHistory();
  }, [activeTab, loadHistory]);

  useEffect(() => {
    if (activeTab !== "dashboard") return;
    void loadHistory();
  }, [activeTab, loadHistory]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const fresh = await fetchCurrentUser();
        if (cancelled) return;
        setCurrentUser(fresh);
        auth.setUser(fresh);
      } catch { /* keep cached user */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const payload = await fetchManager();
        if (cancelled) return;
        setManager(payload);
      } catch { setManager(null); }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleUpdateOrderStatus(id: string, status: OrderStatus) {
    try {
      await updateOrderStatusApi(Number(id), status.toLowerCase());
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
      const displayId = orderDisplayIdMap[id] ?? id;
      if (status === "Completed") toast.success(`Order ${displayId} completed!`);
      else if (status === "Cancelled") toast.error(`Order ${displayId} cancelled`);
    } catch {
      toast.error(`Failed to update order ${orderDisplayIdMap[id] ?? id}.`);
    }
  }

  async function handleDeleteRecipeLog(logId: string) {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`/api/recipe-logs/${logId}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error("Failed to delete receipt log.");
    }
    setRecipeLogs((prev) => prev.filter((log) => log.id !== logId));
  }

  function openProfileDialog() {
    if (profileImagePreview?.startsWith("blob:")) URL.revokeObjectURL(profileImagePreview);
    setProfileImageFile(null);
    setProfileImagePreview(currentUser?.profile_image_url ?? null);
    setProfileDialogOpen(true);
  }

  function onProfileImageChange(file: File | null) {
    if (profileImagePreview?.startsWith("blob:")) URL.revokeObjectURL(profileImagePreview);
    setProfileImageFile(file);
    setProfileImagePreview(file ? URL.createObjectURL(file) : (currentUser?.profile_image_url ?? null));
  }

  async function saveProfileImage() {
    if (!profileImageFile) { setProfileDialogOpen(false); return; }
    try {
      setSavingProfile(true);
      const updated = await updateCurrentUser({ profile_image: profileImageFile });
      setCurrentUser(updated);
      auth.setUser(updated);
      toast.success("Profile image updated.");
      setProfileDialogOpen(false);
      if (profileImagePreview?.startsWith("blob:")) URL.revokeObjectURL(profileImagePreview);
      setProfileImageFile(null);
      setProfileImagePreview(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile image.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function removeProfileImage() {
    try {
      setSavingProfile(true);
      const updated = await updateCurrentUser({ remove_profile_image: true });
      setCurrentUser(updated);
      auth.setUser(updated);
      toast.success("Profile image removed.");
      setProfileImageFile(null);
      setProfileImagePreview(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove profile image.");
    } finally {
      setSavingProfile(false);
    }
  }

  function handleNotificationClick(notification: Notification) {
    setActiveTab("orders");
    const rawId = String(notification.id ?? "");
    const match = rawId.match(/(\d+)/);
    if (!match) return;
    const targetId = match[1];
    const target =
      orders.find((o) => o.id === targetId) ||
      historyOrders.find((o) => o.id === targetId);
    if (target) {
      setSelectedOrder(target);
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "orders":
        if (isLoadingOrders) {
          return <p className="text-slate-500 dark:text-slate-400 font-bold">Loading orders...</p>;
        }
        return (
          <Orders
            orders={orders}
            historyOrders={historyOrders}
            updateStatus={handleUpdateOrderStatus}
            summaryCounts={historySummary}
          />
        );
      case "history":
        if (historyLoading) {
          return <p className="text-slate-500 dark:text-slate-400 font-bold">Loading order history...</p>;
        }
        if (historyError) {
          return <p className="text-red-500 font-bold">{historyError}</p>;
        }
        return <OrderHistory orders={historyOrders} onNotificationClick={handleNotificationClick} />;
      case "recipe":
        return (
          <RecipeView
            history={recipeLogs}
            isLoading={recipeLoading}
            error={recipeError}
            onDeleteLog={handleDeleteRecipeLog}
          />
        );
      default:
        return (
          <Dashboard
            orders={orders}
            historyOrders={historyOrders}
            onViewDetails={setSelectedOrder}
            currentUser={currentUser}
            onProfileClick={openProfileDialog}
            onNotificationClick={handleNotificationClick}
            summaryCounts={{
              live: orders.length,
              completed: historySummary.completed,
              cancelled: historySummary.cancelled,
            }}
          />
        );
    }
  };

  return (
    <div className="staff-admin-typography min-h-screen w-full flex transition-colors duration-300 overflow-x-hidden">
      <Toaster position="top-right" />
      <LogoutConfirmModal
        open={showLogoutConfirm}
        isDarkMode={isDark}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={doLogout}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogoutClick={() => setShowLogoutConfirm(true)}
        isDark={isDark}
        onThemeToggle={() => setIsDark((prev) => {
          const next = !prev;
          localStorage.setItem("theme", next ? "dark" : "light");
          return next;
        })}
      />

      <div className={`flex-1 ml-64 min-h-screen ${isDark ? "dark" : ""}`}>
        <main className="w-full p-4 md:p-6 lg:p-8 transition-colors duration-300">
          <section className="panel-shell p-5 md:p-8 min-h-[calc(100vh-3rem)] w-full">
            {renderContent()}
          </section>
        </main>

        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1a1c2e] rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {selectedOrder.tableNo}
                  </p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    Order {orderDisplayIdMap[selectedOrder.id] ?? selectedOrder.id}
                  </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedOrder.status === "Preparing" ? "bg-orange-100 text-orange-600" :
                  selectedOrder.status === "Pending" ? "bg-amber-100 text-amber-600" :
                  selectedOrder.status === "Ready" ? "bg-emerald-100 text-emerald-600" :
                  selectedOrder.status === "Completed" ? "bg-blue-100 text-blue-600" :
                  "bg-red-100 text-red-600"
                }`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className="space-y-3">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
                    <div className="flex gap-3 items-center">
                      <span className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center font-bold text-[#BD5E0A] shadow-sm">
                        {item.quantity}
                      </span>
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-300">{item.name}</p>
                        {item.customization && (
                          <p className="text-[10px] text-slate-400 font-medium">{item.customization}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Total Amount</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">${selectedOrder.total.toFixed(2)}</p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-4 rounded-2xl font-bold text-white bg-[#BD5E0A] hover:bg-[#BD5E0A]/90 transition-all shadow-lg shadow-[#BD5E0A]/20"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>
              Staff can change profile image only. Name, email, and password are managed by admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Profile Image</label>
              <div className="flex items-center gap-3">
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Profile preview" className="h-14 w-14 rounded-full border object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-[#F5E6D3] text-sm font-semibold text-[#4B2E2B]">
                    {(currentUser?.name ?? "ST").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")}
                  </div>
                )}
                <Input type="file" accept="image/*" onChange={(e) => onProfileImageChange(e.target.files?.[0] ?? null)} />
              </div>
              <Button variant="outline" onClick={() => void removeProfileImage()} disabled={savingProfile}>
                Remove
              </Button>
            </div>

            <div className="grid gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name</label>
                <Input value={currentUser?.name ?? ""} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input value={currentUser?.email ?? ""} disabled />
              </div>
              {manager && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Manager</label>
                  <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
                    {manager.profile_image_url ? (
                      <img src={manager.profile_image_url} alt={manager.name} className="h-9 w-9 rounded-full border object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-[#F5E6D3] text-sm font-semibold text-[#4B2E2B]">
                        {(manager.name ?? "AD").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{manager.name}</div>
                      <div className="text-xs text-slate-500 truncate">{manager.email}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setProfileDialogOpen(false);
              if (profileImagePreview?.startsWith("blob:")) URL.revokeObjectURL(profileImagePreview);
              setProfileImageFile(null);
              setProfileImagePreview(null);
            }}>
              Close
            </Button>
            <Button onClick={() => void saveProfileImage()} disabled={savingProfile || !profileImageFile}>
              {savingProfile ? "Saving..." : "Save Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
