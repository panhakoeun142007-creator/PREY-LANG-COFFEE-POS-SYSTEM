import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User } from "lucide-react";
import Sidebar from "../components/Sidebar";
import DashboardPage from "./DashboardPage";
import LiveOrders from "./LiveOrders";
import OrderHistory from "./OrderHistory";
import ReceiptsPage from "./ReceiptsPage";
import { SettingsProvider } from "../context/SettingsContext";
import { fetchNotifications, Notification, logoutAdmin, updateCurrentUser } from "../services/api";
import { auth } from "../utils/auth";
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountImageFile, setAccountImageFile] = useState<File | null>(null);
  const [accountImagePreview, setAccountImagePreview] = useState<string | null>(null);
  const [accountRemoveImage, setAccountRemoveImage] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const user = auth.getUser();
    if (!user) return;
    setAccountName(user.name ?? "");
    setAccountEmail(user.email ?? "");
    setAccountImagePreview(user.profile_image_url ?? null);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const payload = await fetchNotifications();
        if (!active) return;
        setNotifications(payload.notifications || []);
      } catch {
        // ignore
      }
    }

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  function getNotificationIcon(type: string) {
    switch (type) {
      case "order":
        return "🛒";
      case "ready":
        return "✅";
      case "stock":
        return "⚠️";
      case "near_stock":
        return "📦";
      default:
        return "🔔";
    }
  }

  function openAccount() {
    const user = auth.getUser();
    if (!user) return;
    setAccountName(user.name ?? "");
    setAccountEmail(user.email ?? "");
    setAccountImagePreview(user.profile_image_url ?? null);
    setAccountImageFile(null);
    setAccountRemoveImage(false);
    setAccountError(null);
    setShowAccountModal(true);
  }

  function closeAccount() {
    setShowAccountModal(false);
    setAccountImageFile(null);
    setAccountRemoveImage(false);
    setAccountError(null);
  }

  async function saveAccount() {
    const name = accountName.trim();
    const user = auth.getUser();

    const updateData: { name?: string; profile_image?: File | null; remove_profile_image?: boolean } = {};
    if (user && name && name !== (user.name ?? "")) {
      updateData.name = name;
    }
    if (accountRemoveImage) {
      updateData.remove_profile_image = true;
    }
    if (accountImageFile) {
      updateData.profile_image = accountImageFile;
    }

    if (Object.keys(updateData).length === 0) {
      setAccountError("No changes to save.");
      return;
    }

    try {
      setAccountSaving(true);
      setAccountError(null);
      const updated = await updateCurrentUser(updateData);
      auth.setUser(updated);
      setAccountImageFile(null);
      setAccountRemoveImage(false);
      setAccountImagePreview(updated.profile_image_url ?? null);
      setShowAccountModal(false);
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "Failed to update account");
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

            <div className="flex items-center gap-3">
              <LanguageSwitcher
                className={`w-[150px] ${
                  isDark ? "border-slate-700 bg-slate-900 text-slate-100" : ""
                }`}
              />

              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  aria-label={t("nav.notifications")}
                  className={isDark ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" : ""}
                >
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                      {notifications.length}
                    </span>
                  )}
                </Button>

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
                          <div
                            key={notification.id}
                            className={`flex items-start gap-3 rounded-lg p-3 ${
                              isDark ? "hover:bg-slate-800" : "hover:bg-[#F8EFE4]"
                            } ${!notification.read ? (isDark ? "bg-slate-800/70" : "bg-amber-50") : ""}`}
                          >
                            <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-[#4B2E2B]"}`}>{notification.title}</p>
                              <p className={`truncate text-xs ${isDark ? "text-slate-300" : "text-[#7C5D58]"}`}>{notification.message}</p>
                              <p className={`text-xs ${isDark ? "text-slate-400" : "text-[#8E706B]"}`}>{notification.time}</p>
                            </div>
                          </div>
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

              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className={`gap-2 ${isDark ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" : ""}`}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{auth.getUser()?.name ?? "Staff"}</span>
                </Button>

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
