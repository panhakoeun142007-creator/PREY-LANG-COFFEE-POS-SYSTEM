import { useCallback, useEffect, useMemo, useState } from "react";
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
import { deleteRecipeLog, getOrders, getRecipeLogs, updateOrderStatus as updateOrderStatusApi } from "../lib/api";
import { buildOrderDisplayIdMap } from "../lib/orderDisplayId";
import type { Order, RecipeLog } from "../types";
import { fetchCurrentUser, fetchManager, type CurrentUser, type ManagerInfo, updateCurrentUser } from "../services/api";
import { persistUserToLocalStorage } from "../utils/userStorage";

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") return true;
    if (savedTheme === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [recipeLogs, setRecipeLogs] = useState<RecipeLog[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? (JSON.parse(stored) as CurrentUser) : null;
    } catch {
      return null;
    }
  });
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const orderDisplayIdMap = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    return buildOrderDisplayIdMap(safeOrders.map((order) => order.id));
  }, [orders]);

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const response = await getOrders();
      setOrders(response);
    } catch (error) {
      toast.error("Unable to load orders from backend API.");
      console.error(error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const loadRecipeLogs = useCallback(async () => {
    setIsLoadingRecipes(true);
    setRecipeError(null);
    try {
      const response = await getRecipeLogs();
      setRecipeLogs(response);
    } catch (error) {
      setRecipeError("Unable to load recipe history from backend API.");
      console.error(error);
    } finally {
      setIsLoadingRecipes(false);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    void loadOrders();
    void loadRecipeLogs();
  }, [loadOrders, loadRecipeLogs]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const fresh = await fetchCurrentUser();
        if (cancelled) return;
        setCurrentUser(fresh);
        persistUserToLocalStorage(fresh);
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const payload = await fetchManager();
        if (cancelled) return;
        setManager(payload);
      } catch (error) {
        console.error(error);
        setManager(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab === "recipe") {
      void loadRecipeLogs();
    }
  }, [activeTab, loadRecipeLogs]);

  async function updateOrderStatus(id: string, status: Order["status"]) {
    try {
      const updated = await updateOrderStatusApi(id, status);
      setOrders((prev) => prev.map((order) => (order.id === id ? updated : order)));

      const displayId = orderDisplayIdMap[id] ?? id;
      if (status === "Completed") {
        toast.success(`Order ${displayId} completed!`);
      } else if (status === "Cancelled") {
        toast.error(`Order ${displayId} cancelled`);
      }
    } catch (error) {
      const displayId = orderDisplayIdMap[id] ?? id;
      toast.error(`Failed to update order ${displayId}.`);
      console.error(error);
    }
  }

  async function handleDeleteRecipeLog(logId: string) {
    try {
      await deleteRecipeLog(logId);
      setRecipeLogs((prev) => prev.filter((log) => log.id !== logId));
      toast.success(`Recipe log ${logId} deleted.`);
    } catch (error) {
      toast.error("Failed to delete recipe log.");
      console.error(error);
    }
  }

  function handleThemeToggle() {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  function openProfileDialog() {
    if (profileImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profileImagePreview);
    }
    setProfileImageFile(null);
    setProfileImagePreview(currentUser?.profile_image_url ?? null);
    setProfileDialogOpen(true);
  }

  function onProfileImageChange(file: File | null) {
    if (profileImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profileImagePreview);
    }

    setProfileImageFile(file);
    setProfileImagePreview(file ? URL.createObjectURL(file) : (currentUser?.profile_image_url ?? null));
  }

  async function saveProfileImage() {
    if (!profileImageFile) {
      setProfileDialogOpen(false);
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await updateCurrentUser({ profile_image: profileImageFile });
      setCurrentUser(updated);
      persistUserToLocalStorage(updated);
      toast.success("Profile image updated.");
      setProfileDialogOpen(false);
      if (profileImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(profileImagePreview);
      }
      setProfileImageFile(null);
      setProfileImagePreview(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile image.");
      console.error(error);
    } finally {
      setSavingProfile(false);
    }
  }

  async function removeProfileImage() {
    try {
      setSavingProfile(true);
      const updated = await updateCurrentUser({ remove_profile_image: true });
      setCurrentUser(updated);
      persistUserToLocalStorage(updated);
      toast.success("Profile image removed.");
      setProfileImageFile(null);
      setProfileImagePreview(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove profile image.");
      console.error(error);
    } finally {
      setSavingProfile(false);
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return isLoadingOrders ? (
          <p className="text-slate-500 dark:text-slate-400 font-bold">Loading orders...</p>
        ) : (
          <Dashboard
            orders={orders}
            onViewDetails={setSelectedOrder}
            currentUser={currentUser}
            onProfileClick={openProfileDialog}
          />
        );
      case "orders":
        return isLoadingOrders ? (
          <p className="text-slate-500 dark:text-slate-400 font-bold">Loading orders...</p>
        ) : (
          <Orders orders={orders} updateStatus={updateOrderStatus} />
        );
      case "history":
        return isLoadingOrders ? (
          <p className="text-slate-500 dark:text-slate-400 font-bold">Loading orders...</p>
        ) : (
          <OrderHistory orders={orders} />
        );
      case "recipe":
        return (
          <RecipeView
            history={recipeLogs}
            isLoading={isLoadingRecipes}
            error={recipeError}
            onDeleteLog={handleDeleteRecipeLog}
          />
        );
      default:
        return isLoadingOrders ? (
          <p className="text-slate-500 dark:text-slate-400 font-bold">Loading orders...</p>
        ) : (
          <Dashboard
            orders={orders}
            onViewDetails={setSelectedOrder}
            currentUser={currentUser}
            onProfileClick={openProfileDialog}
          />
        );
    }
  };

  return (
    <div className="staff-admin-typography min-h-screen w-full flex transition-colors duration-300 overflow-x-hidden">
      <Toaster position="top-right" />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogoutClick={handleLogout}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
      />

      <div className={`flex-1 ml-72 min-h-screen ${isDark ? "dark" : ""}`}>
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
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedOrder.status === "Preparing"
                      ? "bg-orange-100 text-orange-600"
                      : selectedOrder.status === "Pending"
                        ? "bg-amber-100 text-amber-600"
                        : selectedOrder.status === "Ready"
                          ? "bg-emerald-100 text-emerald-600"
                          : selectedOrder.status === "Completed"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-red-100 text-red-600"
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Order Items
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-3 rounded-xl"
                    >
                      <div className="flex gap-3 items-center">
                        <span className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center font-bold text-[#BD5E0A] shadow-sm">
                          {item.quantity}
                        </span>
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{item.name}</p>
                          {item.customization && (
                            <p className="text-[10px] text-slate-400 font-medium">
                              {item.customization}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Total Amount</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  ${selectedOrder.total.toFixed(2)}
                </p>
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
                  <img
                    src={profileImagePreview}
                    alt="Profile preview"
                    className="h-14 w-14 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-[#F5E6D3] text-sm font-semibold text-[#4B2E2B]">
                    {(currentUser?.name ?? "ST")
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() ?? "")
                      .join("")}
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => onProfileImageChange(event.target.files?.[0] ?? null)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => void removeProfileImage()}
                  disabled={savingProfile}
                >
                  Remove
                </Button>
              </div>
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Manager</label>
              <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
                {manager?.profile_image_url ? (
                  <img
                    src={manager.profile_image_url}
                    alt={manager.name}
                    className="h-9 w-9 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-[#F5E6D3] text-sm font-semibold text-[#4B2E2B]">
                    {(manager?.name ?? "AD")
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? "")
                      .join("")}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {manager?.name ?? "Admin"}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{manager?.email ?? ""}</div>
                </div>
              </div>
            </div>
          </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setProfileDialogOpen(false);
                if (profileImagePreview?.startsWith("blob:")) {
                  URL.revokeObjectURL(profileImagePreview);
                }
                setProfileImageFile(null);
                setProfileImagePreview(null);
              }}
            >
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
