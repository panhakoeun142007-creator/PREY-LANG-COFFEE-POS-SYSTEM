import { Bell, User } from "lucide-react";
import { useCallback, useContext, useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardPage from "./DashboardPage";
import LiveOrders from "./LiveOrders";
import OrderHistory from "./OrderHistory";
import ReceiptsPage from "./ReceiptsPage";
import { AuthContext } from "../context/AuthContext";
import { SettingsProvider } from "../context/SettingsContext";
import { auth } from "../utils/auth";
import { toSameOriginMediaUrl, withCacheBuster } from "../utils/media";
import { useNewOrderSoundNotifications } from "../hooks";
import {
  CurrentUser,
  fetchCurrentUser,
  fetchNotifications,
  logoutAdmin,
  Notification,
  updateCurrentUser,
} from "../services/api";
import LogoutConfirmModal from "../components/LogoutConfirmModal";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useI18n } from "../context/I18nContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function StaffDashboardPage() {
  const authContext = useContext(AuthContext);
  const updateUser = authContext.updateUser;
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isDark, setIsDark] = useState<boolean>(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") return true;
    if (storedTheme === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountImageFile, setAccountImageFile] = useState<File | null>(null);
  const [accountImagePreview, setAccountImagePreview] = useState<string | null>(null);
  const [accountRemoveImage, setAccountRemoveImage] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsPollingEnabled, setNotificationsPollingEnabled] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const seenStorageKey = useState(() => {
    const id = (auth.getUser() as { id?: number | string } | null)?.id ?? "unknown";
    return `prey-lang-pos:notifications:seen:${id}`;
  })[0];

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const openAccount = openAccountModal;
  const closeAccount = closeAccountModal;

  const readSeen = useCallback(() => {
    try {
      const raw = localStorage.getItem(seenStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }, [seenStorageKey]);

  const writeSeen = useCallback((keys: string[]) => {
    localStorage.setItem(seenStorageKey, JSON.stringify(keys));
  }, [seenStorageKey]);

  function getNotificationIcon(type: Notification["type"] | string) {
    const key = String(type ?? "").toLowerCase();
    if (key.includes("order")) return "🧾";
    if (key.includes("payment") || key.includes("paid")) return "💳";
    if (key.includes("warning") || key.includes("alert")) return "⚠️";
    if (key.includes("error") || key.includes("fail")) return "❌";
    if (key.includes("success") || key.includes("done")) return "✅";
    return "🔔";
  }

  function handleNotificationClick(notification: Notification): void {
    const type = String(notification.type ?? "").toLowerCase();
    const content = `${notification.title ?? ""} ${notification.message ?? ""}`.toLowerCase();

    setNotificationsOpen(false);

    if (type === "order" || type === "ready" || content.includes("order")) {
      setActiveTab("orders");
      return;
    }

    if (type.includes("receipt") || content.includes("receipt")) {
      setActiveTab("receipts");
      return;
    }

    if (content.includes("history")) {
      setActiveTab("history");
      return;
    }

    setActiveTab("dashboard");
  }

  useEffect(() => {
    const user = authContext.user ?? auth.getUser();
    if (!user) return;

    setCurrentUser(user);
    setAccountName(user.name ?? "");
    setAccountEmail(user.email ?? "");
    setAccountImagePreview(user.profile_image_url ?? null);
  }, [authContext.user]);

  useEffect(() => {
    let isMounted = true;

    async function refreshCurrentUser() {
      if (!auth.getToken()) return;

      try {
        const user = await fetchCurrentUser();
        if (!isMounted) return;

        setCurrentUser(user);
        setAccountName(user.name ?? "");
        setAccountEmail(user.email ?? "");
        setAccountImagePreview(user.profile_image_url ?? null);
        auth.setUser(user);
        updateUser(user);
      } catch (err) {
        console.error("Failed to refresh current user:", err);
      }
    }

    void refreshCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [updateUser]);

  useEffect(() => {
    if (!notificationsPollingEnabled) {
      return;
    }

    function isConnectionError(err: unknown): boolean {
      if (!(err instanceof Error)) {
        return false;
      }
      return (
        err.message.includes("Cannot connect to API server") ||
        err.message.includes("Failed to fetch") ||
        err.message.includes("ECONNREFUSED")
      );
    }

    async function loadNotifications() {
      try {
        const data = await fetchNotifications();
        const seen = new Set(readSeen());
        const hydrated = (data.notifications || []).map((notification) => ({
          ...notification,
          read: seen.has(String(notification.id ?? "")),
        }));
        setNotifications(hydrated);
      } catch (err) {
        if (isConnectionError(err)) {
          setNotificationsPollingEnabled(false);
          return;
        }
        console.error("Failed to load notifications:", err);
      }
    }

    loadNotifications();

    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [notificationsPollingEnabled, readSeen]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const { enabled: newOrderSoundEnabled, setEnabled: setNewOrderSoundEnabled, testSound: testNewOrderSound } =
    useNewOrderSoundNotifications(notifications);

  function openAccountModal() {
    setAccountName(currentUser?.name ?? t("user.staff_default_name"));
    setAccountEmail(currentUser?.email ?? t("user.staff_default_email"));
    setAccountImagePreview(currentUser?.profile_image_url ?? null);
    setAccountImageFile(null);
    setAccountRemoveImage(false);
    setAccountError(null);
    setShowAccountModal(true);
  }

  function closeAccountModal() {
    setShowAccountModal(false);
    setAccountImageFile(null);
    setAccountRemoveImage(false);
    setAccountError(null);
  }

  async function saveAccount() {
    const updateData: { profile_image?: File | null; remove_profile_image?: boolean } = {};

    if (accountRemoveImage) {
      updateData.remove_profile_image = true;
    }
    if (accountImageFile) {
      updateData.profile_image = accountImageFile;
    }

    if (Object.keys(updateData).length === 0) {
      setAccountError(t("account.no_changes"));
      return;
    }

    try {
      setAccountSaving(true);
      setAccountError(null);
      const updated = await updateCurrentUser(updateData);
      setCurrentUser(updated);
      auth.setUser(updated);
      authContext.updateUser(updated);
      setAccountName(updated.name ?? "");
      setAccountEmail(updated.email ?? "");
      setAccountImageFile(null);
      setAccountRemoveImage(false);
      setAccountImagePreview(updated.profile_image_url ?? null);
      setShowAccountModal(false);
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : t("account.update_failed"));
    } finally {
      setAccountSaving(false);
    }
  }

  async function doLogout() {
    setShowLogoutConfirm(false);
    try { await logoutAdmin(); } catch { /* ignore */ }
    auth.clear();
    navigate("/login", { replace: true });
  }

  const renderContent = () => {
    switch (activeTab) {
      case "orders":
        return <LiveOrders />;
      case "history":
        return (
          <SettingsProvider>
            <OrderHistory />
          </SettingsProvider>
        );
      case "receipts":
        return (
          <SettingsProvider>
            <ReceiptsPage />
          </SettingsProvider>
        );
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex ${
        isDark
          ? "bg-[radial-gradient(circle_at_top,#1e293b_0%,#0b1220_55%)] text-slate-100"
          : "bg-[#FFF8F0] text-[#4B2E2B]"
      }`}
    >
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogoutClick={() => setShowLogoutConfirm(true)}
        isDark={isDark}
        onThemeToggle={() => setIsDark((prev) => {
          return !prev;
        })}
      />

      <div className="flex-1 ml-64 min-h-screen">
        {/* Top Nav Bar (sticky) */}
        <div
          className={`sticky top-0 z-20 flex items-center justify-end gap-3 px-4 py-4 backdrop-blur md:px-8 ${
            isDark ? "border-b border-slate-700/80 bg-slate-950/70" : "border-b border-[#EAD6C0] bg-[#FFF8F0]/95"
          }`}
        >
          <LanguageSwitcher
            className={`w-[150px] ${
              isDark ? "border-slate-700 bg-slate-900 text-slate-100" : ""
            }`}
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2 shadow-sm ${
                isDark
                  ? "border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  : "border border-[#E5D2BB] bg-white text-slate-900 hover:bg-slate-50"
              }`}
            >
              {currentUser?.profile_image_url ? (
                <img
                  src={withCacheBuster(toSameOriginMediaUrl(currentUser.profile_image_url), currentUser.updated_at ?? currentUser.profile_image_url)}
                  alt={currentUser.name ?? t("role.staff")}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${
                    isDark ? "bg-slate-700" : "bg-[#4B2E2B]"
                  }`}
                >
                  {(currentUser?.name ?? auth.getUser()?.name ?? "ST")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)}
                </div>
              )}
              <div className="text-left leading-tight">
                <p className="text-sm font-semibold">
                  {currentUser?.name ?? auth.getUser()?.name ?? t("user.staff_member")}
                </p>
                <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                  {t("role.staff")}
                </p>
              </div>
            </button>

            {profileOpen && (
              <div className={`absolute right-0 top-12 z-50 w-48 rounded-xl p-2 shadow-lg ${isDark ? "border border-slate-700 bg-slate-900" : "border border-[#EAD6C0] bg-white"}`}>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    openAccount();
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                    isDark ? "text-slate-100 hover:bg-slate-800" : "text-[#4B2E2B] hover:bg-[#F8EFE4]"
                  }`}
                >
                  <User className="h-4 w-4" />
                  {t("nav.account")}
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={async () => {
                const next = !newOrderSoundEnabled;
                setNewOrderSoundEnabled(next);
                if (next) {
                  await testNewOrderSound();
                }
              }}
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full shadow-sm ${
                isDark
                  ? "border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  : "border border-[#E5D2BB] bg-white text-[#4B2E2B]"
              }`}
              aria-label={newOrderSoundEnabled ? "Disable new order sound" : "Enable new order sound"}
              title={newOrderSoundEnabled ? "New order sound: On" : "New order sound: Off"}
            >
              {newOrderSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((prev) => {
                  const next = !prev;
                  if (!prev) {
                    const keys = notifications.map((notification) => String(notification.id ?? ""));
                    writeSeen(keys);
                    setNotifications((current) =>
                      current.map((notification) => ({ ...notification, read: true })),
                    );
                  }
                  return next;
                });
              }}
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full shadow-sm ${
                isDark
                  ? "border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  : "border border-[#E5D2BB] bg-white text-[#4B2E2B]"
              }`}
              aria-label={t("nav.notifications")}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div
                className={`absolute right-0 top-12 z-50 w-80 rounded-xl p-2 shadow-lg ${
                  isDark ? "border border-slate-700 bg-slate-900" : "border border-[#EAD6C0] bg-white"
                }`}
              >
                <div className={`px-3 py-2 ${isDark ? "border-b border-slate-700" : "border-b border-[#F1E3D3]"}`}>
                  <h3 className={`font-semibold ${isDark ? "text-slate-100" : "text-[#4B2E2B]"}`}>{t("nav.notifications")}</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 10).map((notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`flex items-start gap-3 rounded-lg p-3 ${
                          isDark ? "hover:bg-slate-800" : "hover:bg-[#F8EFE4]"
                        } ${!notification.read ? (isDark ? "bg-slate-800/70" : "bg-amber-50") : ""} w-full text-left`}
                      >
                        <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-[#4B2E2B]"}`}>{notification.title}</p>
                          <p className={`truncate text-xs ${isDark ? "text-slate-300" : "text-[#7C5D58]"}`}>{notification.message}</p>
                          <p className={`text-xs ${isDark ? "text-slate-400" : "text-[#8E706B]"}`}>{notification.time}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className={`p-4 text-center text-sm ${isDark ? "text-slate-400" : "text-[#7C5D58]"}`}>
                      {t("msg.no_notifications")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <main className="w-full p-4 md:p-6 lg:p-8 transition-colors duration-300">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? "text-slate-300" : "text-[#7C5D58]"}`}>{t("role.staff")}</p>
              <h1 className={`text-2xl font-semibold ${isDark ? "text-slate-100" : "text-[#4B2E2B]"}`}>
                {activeTab === "orders"
                  ? t("nav.live_orders")
                  : activeTab === "history"
                    ? t("nav.order_history")
                    : activeTab === "receipts"
                      ? t("nav.receipts")
                      : t("nav.dashboard")}
                </h1>
              </div>
          </div>
          {renderContent()}
        </main>
      </div>

      <LogoutConfirmModal
        open={showLogoutConfirm}
        isDarkMode={isDark}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={doLogout}
      />

      <Dialog
        open={showAccountModal}
        onOpenChange={(open) => {
          if (!open) closeAccount();
        }}
      >
        <DialogContent className={`max-w-lg ${isDark ? "border-slate-700 bg-slate-900 text-slate-100" : ""}`}>
          <DialogHeader>
            <DialogTitle>{t("nav.account")}</DialogTitle>
            <DialogDescription>
              {t("account.desc_name_image_only")}
            </DialogDescription>
          </DialogHeader>

          {accountError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {accountError}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {accountImagePreview ? (
                <img
                  src={accountImagePreview}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className={`flex h-16 w-16 items-center justify-center rounded-full text-sm font-semibold text-white ${isDark ? "bg-slate-700" : "bg-[#4B2E2B]"}`}>
                  {(accountName || "ST")
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)}
                </div>
              )}
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setAccountImageFile(file);
                    setAccountRemoveImage(false);
                    if (file) {
                      setAccountImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
                <button
                  type="button"
                  className={`text-xs font-medium underline ${isDark ? "text-slate-200 hover:text-slate-100" : "text-[#4B2E2B] hover:text-[#6B4E4B]"}`}
                  onClick={() => {
                    setAccountRemoveImage(true);
                    setAccountImageFile(null);
                    setAccountImagePreview(null);
                  }}
                >
                  {t("btn.remove_photo")}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`text-xs ${isDark ? "text-slate-300" : "text-[#7C5D58]"}`}>{t("field.name")}</label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className={isDark ? "border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-400" : ""}
                />
              </div>
              <div>
                <label className={`text-xs ${isDark ? "text-slate-300" : "text-[#7C5D58]"}`}>
                  {t("field.email")} <span className="text-xs text-amber-600">({t("hint.assigned_by_admin")})</span>
                </label>
                <Input
                  value={accountEmail}
                  disabled
                  className={isDark ? "border-slate-700 bg-slate-800/50 text-slate-400" : ""}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAccount} disabled={accountSaving}>
              {t("btn.cancel")}
            </Button>
            <Button onClick={saveAccount} disabled={accountSaving}>
              {accountSaving ? t("btn.saving") : t("btn.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


