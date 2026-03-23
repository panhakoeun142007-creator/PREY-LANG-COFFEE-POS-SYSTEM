import { Bell, LogOut, Menu, Moon, Settings, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NotificationBell from "../components/NotificationBell";
import DashboardPage from "./DashboardPage";
import LiveOrders from "./LiveOrders";
import OrderHistory from "./OrderHistory";
import ReceiptsPage from "./ReceiptsPage";
import { SettingsProvider } from "../context/SettingsContext";
import { auth } from "../utils/auth";
import {
  CurrentUser,
  fetchNotifications,
  logoutAdmin,
  Notification,
  updateCurrentUser,
} from "../services/api";
import LogoutConfirmModal from "../components/LogoutConfirmModal";

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState<boolean>(() => {
    const t = localStorage.getItem("theme");
    if (t === "dark") return true;
    if (t === "light") return false;
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

  useEffect(() => {
    const user = auth.getUser();
    if (user) {
      try {
        setCurrentUser(user);
        setAccountName(user.name ?? "");
        setAccountEmail(user.email ?? "");
        setAccountImagePreview(user.profile_image_url ?? null);
      } catch (err) {
        console.error("Failed to parse stored user:", err);
      }
    }
  }, []);

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
        setNotifications(data.notifications);
      } catch (err) {
        if (isConnectionError(err)) {
          setNotificationsPollingEnabled(false);
          return;
        }
        console.error("Failed to load notifications:", err);
      }
    }

    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [notificationsPollingEnabled]);

  function openAccountModal() {
    setAccountName(currentUser?.name ?? "Staff User");
    setAccountEmail(currentUser?.email ?? "staff@preylang.com");
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
      setAccountError("No changes to save.");
      return;
    }

    try {
      setAccountSaving(true);
      setAccountError(null);
      const updated = await updateCurrentUser(updateData);
      setCurrentUser(updated);
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
    <div className="min-h-screen w-full flex">
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
        {/* Top Notification Bar with Profile */}
        <div className={`sticky top-0 z-40 border-b px-6 py-3 flex items-center justify-end gap-3 ${
          isDark
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        }`}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className={`flex items-center gap-2 rounded-xl px-2 py-1.5 shadow-sm md:px-3 ${
                isDark
                  ? "border border-slate-700 bg-slate-900 text-slate-100"
                  : "border border-slate-200 bg-white"
              }`}
            >
              {currentUser?.profile_image_url ? (
                <img
                  src={currentUser.profile_image_url}
                  alt={currentUser.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${
                  isDark ? "bg-slate-700" : "bg-[#4B2E2B]"
                }`}>
                  {currentUser?.name
                    ? currentUser.name
                      .split(' ')
                      .map(part => part[0])
                      .join('')
                      .toUpperCase()
                      .substring(0, 2)
                    : 'ST'}
                </div>
              )}
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold leading-tight">{currentUser?.name ?? 'Staff'}</p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Staff</p>
              </div>
            </button>

            {profileOpen && (
              <div className={`absolute right-0 top-12 z-50 w-48 rounded-xl p-2 shadow-lg ${
              isDark ? "border border-slate-700 bg-slate-900" : "border border-slate-200 bg-white"
            }`}>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    openAccountModal();
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                    isDark ? "text-slate-100 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <User size={16} />
                  Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
          <NotificationBell />
        </div>
        <main className="w-full p-4 md:p-6 lg:p-8 transition-colors duration-300">
          {renderContent()}
        </main>
      </div>

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-xl ${
            isDark ? "border border-slate-700 bg-slate-900" : "bg-white"
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${isDark ? "text-slate-100" : "text-slate-700"}`}>Account</h2>
              <button
                type="button"
                onClick={closeAccountModal}
                className={isDark ? "text-slate-400 hover:text-slate-100" : "text-slate-500 hover:text-slate-700"}
              >
                ✕
              </button>
            </div>
            {accountError ? (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {accountError}
              </p>
            ) : null}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 overflow-hidden rounded-full ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                  {accountImagePreview ? (
                    <img
                      src={accountImagePreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center text-2xl font-semibold text-white ${
                      isDark ? "bg-slate-700" : "bg-[#4B2E2B]"
                    }`}>
                      {currentUser?.name
                        ? currentUser.name
                          .split(' ')
                          .map(part => part[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2)
                        : 'ST'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-700"}`}>
                    {currentUser?.name ?? "Staff User"}
                  </p>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Staff</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setAccountImageFile(file);
                      setAccountRemoveImage(false);
                      if (file) {
                        setAccountImagePreview(URL.createObjectURL(file));
                      } else {
                        setAccountImagePreview(currentUser?.profile_image_url ?? null);
                      }
                    }}
                    className={`mt-2 block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:px-2 file:py-1 file:text-xs file:font-medium ${
                      isDark
                        ? "text-slate-400 file:bg-slate-700 file:text-slate-100"
                        : "text-slate-500 file:bg-slate-100 file:text-slate-700"
                    }`}
                  />
                  {currentUser?.profile_image_url && !accountImageFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountRemoveImage(true);
                        setAccountImagePreview(null);
                      }}
                      className={`mt-2 text-xs font-medium underline ${
                        isDark ? "text-slate-300 hover:text-slate-100" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Remove profile image
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAccountModal}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    isDark
                      ? "text-slate-300 hover:bg-slate-800"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAccount}
                  disabled={accountSaving}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-[#4B2E2B] hover:bg-[#3d2524]"
                  } ${accountSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {accountSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LogoutConfirmModal
        open={showLogoutConfirm}
        isDarkMode={isDark}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={doLogout}
      />
    </div>
  );
}
