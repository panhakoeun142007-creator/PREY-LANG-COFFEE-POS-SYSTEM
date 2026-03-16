import { Bell, ChevronLeft, ChevronRight, LogOut, Menu, Moon, Settings, Sun, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { navGroups, pageTitleByPath } from "../data/mockData";
import { useSettings } from "../context/SettingsContext";
import { persistUserToLocalStorage } from "../utils/userStorage";
import {
  fetchNotifications,
  fetchCurrentUser,
  Notification,
  CurrentUser,
  logoutAdmin,
  updateCurrentUser,
} from "../services/api";

function statusClass(isActive: boolean, isDarkMode: boolean): string {
  if (isActive) {
    return isDarkMode
      ? "bg-slate-700 text-slate-100 font-semibold shadow"
      : "bg-[#F5E6D3] text-[#4B2E2B] font-semibold shadow";
  }
  return isDarkMode ? "text-slate-200 hover:bg-slate-700/70" : "text-white/80 hover:bg-white/10";
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'order':
      return '🛒';
    case 'ready':
      return '✅';
    case 'stock':
      return '⚠️';
    case 'near_stock':
      return '📦';
    default:
      return '🔔';
  }
}

export default function AppLayout() {
  // We'll just use local state and localStorage - no need for AuthContext
  const [collapsed, setCollapsed] = useState(false);
  const { settings } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsPollingEnabled, setNotificationsPollingEnabled] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountImageFile, setAccountImageFile] = useState<File | null>(null);
  const [accountImagePreview, setAccountImagePreview] = useState<string | null>(null);
  const [accountRemoveImage, setAccountRemoveImage] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
      return;
    }

    if (savedTheme === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setCurrentUser(null);
      setAccountName("");
      setAccountEmail("");
      setAccountImagePreview(null);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser) as CurrentUser;
      setCurrentUser(parsed);
      setAccountName(parsed.name ?? "");
      setAccountEmail(parsed.email ?? "");
      setAccountImagePreview(parsed.profile_image_url ?? null);
      persistUserToLocalStorage(parsed);
    } catch (err) {
      console.error("Failed to parse stored user:", err);
      setCurrentUser(null);
      setAccountName("");
      setAccountEmail("");
      setAccountImagePreview(null);
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

    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [notificationsPollingEnabled]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const userRole = currentUser?.role === 'admin' ? 'admin' : 'staff';
  const filteredNavGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!item.roles || item.roles.length === 0) return true;
          return item.roles.includes(userRole);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [userRole]);

  const pageTitle = pageTitleByPath[location.pathname] ?? "Dashboard";
  const shopName = settings?.general?.shop_name ?? "PREY LANG";
  const dateText = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );

  const sidebarWidth = collapsed ? "md:w-20" : "md:w-64";
  const mainMargin = collapsed 
    ? isDarkMode 
      ? "md:ml-[calc(5rem+1px)]" 
      : "md:ml-20" 
    : "md:ml-64";

  function roleLabel(role: string | undefined): string {
    if (role === 'staff') return 'Staff';
    return "Admin";
  }

  function openAccountModal() {
    setAccountName(currentUser?.name ?? "Admin User");
    setAccountEmail(currentUser?.email ?? "admin@preylang.com");
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
    const name = accountName.trim();
    const email = accountEmail.trim();

    // Build update data - only include fields that have values
    const updateData: { name?: string; email?: string; profile_image?: File; remove_profile_image?: boolean } = {};
    
    if (name && name !== (currentUser?.name ?? "")) {
      updateData.name = name;
    }
    if (email && email !== (currentUser?.email ?? "")) {
      updateData.email = email;
    }
    if (accountRemoveImage) {
      updateData.remove_profile_image = true;
    }
    if (accountImageFile) {
      updateData.profile_image = accountImageFile;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      setAccountError("No changes to save.");
      return;
    }

    try {
      setAccountSaving(true);
      setAccountError(null);
      await updateCurrentUser(updateData as any);
      // Re-fetch from database to ensure refresh shows the saved data.
      const updated = await fetchCurrentUser();
      setCurrentUser(updated);
      persistUserToLocalStorage(updated);
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

  function toggleTheme(): void {
    setIsDarkMode((prev) => !prev);
  }

  return (
    <div
      className={`h-screen ${
        isDarkMode
          ? "bg-[radial-gradient(circle_at_top,#1e293b_0%,#0b1220_55%)] text-slate-100"
          : "bg-[#FFF8F0] text-[#4B2E2B]"
      }`}
    >
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close mobile sidebar"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          `fixed inset-y-0 left-0 z-40 flex w-64 flex-col text-white transition-transform duration-300 md:translate-x-0 ${
            isDarkMode
              ? "border-r border-slate-700/70 bg-slate-950/90 backdrop-blur-xl"
              : "bg-[#4B2E2B]"
          }`,
          sidebarWidth,
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo and User Info */}
        <div className={`flex items-center gap-3 px-4 py-5 ${isDarkMode ? "border-b border-slate-800" : "border-b border-white/10"}`}>
          <img
            src="/img/logo-coffee.png"
            alt="PREY LANG Logo"
            className="h-11 w-11 rounded-lg bg-white/20 object-cover"
          />
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-wide">{shopName}</p>
              <p className="text-xs text-white/80">Dashboard</p>
            </div>
          )}
        </div>

        <div className={`px-4 py-4 ${isDarkMode ? "border-b border-slate-800" : "border-b border-white/10"}`}>
          <div className="flex items-center gap-3">
            {currentUser?.profile_image_url ? (
              <img
                src={currentUser.profile_image_url}
                alt={currentUser.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${isDarkMode ? "bg-slate-700 text-slate-100" : "bg-[#F5E6D3] text-[#4B2E2B]"}`}>
                {currentUser?.initials ?? (currentUser?.role === 'staff' ? 'ST' : 'AD')}
              </div>
            )}
            {!collapsed && (
              <div>
                <p className="text-sm font-semibold">{currentUser?.name ?? 'User'}</p>
                <p className="text-xs text-white/70">{roleLabel(currentUser?.role)}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {filteredNavGroups.map((group) => (
              <div key={group.group} className="space-y-2">
                {!collapsed && (
                  <p className={`px-2 text-[11px] font-semibold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-white/50"}`}>
                    {group.group}
                  </p>
                )}
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center rounded-xl px-3 py-2.5 text-sm transition ${statusClass(
                        isActive,
                        isDarkMode,
                      )}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon size={18} />
                      {!collapsed && <span className="ml-3">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        <div className={`p-3 ${isDarkMode ? "border-t border-slate-800" : "border-t border-white/10"}`}>
          <button
            type="button"
            onClick={async () => {
              try {
                await logoutAdmin();
              } catch (err) {
                console.error("Failed to logout:", err);
                } finally {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.dispatchEvent(new Event('auth:unauthorized'));
                  navigate('/login', { replace: true });
                }
              }}
            className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition ${
              isDarkMode ? "text-slate-300 hover:bg-slate-800/70" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <LogOut size={18} />
            {!collapsed && <span className="ml-3">Logout</span>}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={`absolute -right-3 top-24 hidden h-7 w-7 items-center justify-center rounded-full shadow md:flex ${
            isDarkMode
              ? "border-slate-600 bg-slate-800 text-slate-100"
              : "border-[#EAD6C0] bg-[#FFF8F0] text-[#4B2E2B]"
          }`}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      <div className={`flex h-screen flex-col transition-all duration-300 ${mainMargin}`}>
        <header
          className={`sticky top-0 z-20 px-4 py-4 backdrop-blur md:px-8 ${
            isDarkMode ? "border-b border-slate-700/80 bg-slate-950/70" : "border-b border-[#EAD6C0] bg-[#FFF8F0]/95"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Toggle mobile menu"
                onClick={() => setMobileOpen((prev) => !prev)}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg md:hidden ${
                  isDarkMode
                    ? "border border-slate-600 bg-slate-800 text-slate-100"
                    : "border border-[#E5D2BB] bg-white text-[#4B2E2B]"
                }`}
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className="text-lg font-semibold md:text-2xl">{pageTitle}</h1>
                <p className={`text-xs md:text-sm ${isDarkMode ? "text-slate-400" : "text-[#7C5D58]"}`}>{dateText}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full shadow-sm ${
                  isDarkMode
                    ? "border border-slate-600 bg-slate-800 text-amber-300"
                    : "border border-[#E5D2BB] bg-white text-[#4B2E2B]"
                }`}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={isDarkMode ? "Light mode" : "Dark mode"}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full shadow-sm ${
                    isDarkMode
                      ? "border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                      : "border border-[#E5D2BB] bg-white text-[#4B2E2B]"
                  }`}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className={`absolute right-0 top-12 w-80 rounded-xl p-2 shadow-lg ${isDarkMode ? "border border-slate-700 bg-slate-900" : "border border-[#EAD6C0] bg-white"}`}>
                    <div className={`px-3 py-2 ${isDarkMode ? "border-b border-slate-700" : "border-b border-[#F1E3D3]"}`}>
                      <h3 className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-[#4B2E2B]"}`}>Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={`flex items-start gap-3 rounded-lg p-3 ${
                              isDarkMode ? "hover:bg-slate-800" : "hover:bg-[#F8EFE4]"
                            } ${
                              !notification.read ? (isDarkMode ? "bg-slate-800/70" : "bg-amber-50") : ""
                            }`}
                          >
                            <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isDarkMode ? "text-slate-100" : "text-[#4B2E2B]"}`}>{notification.title}</p>
                              <p className={`truncate text-xs ${isDarkMode ? "text-slate-300" : "text-[#7C5D58]"}`}>{notification.message}</p>
                              <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-[#8E706B]"}`}>{notification.time}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={`p-4 text-center text-sm ${isDarkMode ? "text-slate-400" : "text-[#7C5D58]"}`}>
                          No notifications
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className={`flex items-center gap-2 rounded-xl px-2 py-1.5 shadow-sm md:px-3 ${
                    isDarkMode
                      ? "border border-slate-700 bg-slate-900 text-slate-100"
                      : "border border-[#E5D2BB] bg-white"
                  }`}
                >
                  {currentUser?.profile_image_url ? (
                    <img
                      src={currentUser.profile_image_url}
                      alt={currentUser.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${isDarkMode ? "bg-slate-700" : "bg-[#4B2E2B]"}`}>
                      {currentUser?.initials ?? (currentUser?.role === 'staff' ? 'ST' : 'AD')}
                    </div>
                  )}
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-semibold leading-tight">{currentUser?.name ?? 'User'}</p>
                    <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-[#7C5D58]"}`}>{currentUser?.email ?? 'user@preylang.com'}</p>
                  </div>
                </button>

                {profileOpen && (
                  <div className={`absolute right-0 top-12 z-50 w-48 rounded-xl p-2 shadow-lg ${isDarkMode ? "border border-slate-700 bg-slate-900" : "border border-[#EAD6C0] bg-white"}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        openAccountModal();
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                        isDarkMode ? "text-slate-100 hover:bg-slate-800" : "text-[#4B2E2B] hover:bg-[#F8EFE4]"
                      }`}
                    >
                      <User size={16} />
                      Account
                    </button>
                    {userRole === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/settings');
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                        isDarkMode ? "text-slate-100 hover:bg-slate-800" : "text-[#4B2E2B] hover:bg-[#F8EFE4]"
                      }`}
                    >
                      <Settings size={16} />
                      Settings
                    </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await logoutAdmin();
                        } catch (err) {
                          console.error("Failed to logout:", err);
                        } finally {
                          localStorage.removeItem('token');
                          localStorage.removeItem('user');
                          window.dispatchEvent(new Event('auth:unauthorized'));
                          navigate('/login', { replace: true });
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Account Modal */}
        {showAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className={`w-full max-w-md rounded-2xl p-6 shadow-xl ${isDarkMode ? "border border-slate-700 bg-slate-900" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? "text-slate-100" : "text-[#4B2E2B]"}`}>Account</h2>
                <button
                  type="button"
                  onClick={closeAccountModal}
                  className={isDarkMode ? "text-slate-400 hover:text-slate-100" : "text-[#7C5D58] hover:text-[#4B2E2B]"}
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
                  <div className={`h-16 w-16 overflow-hidden rounded-full ${isDarkMode ? "bg-slate-700" : "bg-[#4B2E2B]"}`}>
                    {accountImagePreview ? (
                      <img
                        src={accountImagePreview}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white">
                        {currentUser?.initials ?? "AD"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-lg font-semibold ${isDarkMode ? "text-slate-100" : "text-[#4B2E2B]"}`}>
                      {currentUser?.name ?? "Admin User"}
                    </p>
                    <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-[#7C5D58]"}`}>{roleLabel(currentUser?.role)}</p>
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
                        isDarkMode
                          ? "text-slate-400 file:bg-slate-700 file:text-slate-100"
                          : "text-[#7C5D58] file:bg-[#F5E6D3] file:text-[#4B2E2B]"
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
                          isDarkMode ? "text-slate-300 hover:text-slate-100" : "text-[#4B2E2B] hover:text-[#6B4E4B]"
                        }`}
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
                <div className={`pt-4 space-y-3 ${isDarkMode ? "border-t border-slate-700" : "border-t border-[#EAD6C0]"}`}>
                  <div>
                    <label className={`text-xs ${isDarkMode ? "text-slate-400" : "text-[#7C5D58]"}`}>
                      Name {currentUser?.role === 'staff' && <span className="text-xs text-amber-500">(Read only for staff)</span>}
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      disabled={currentUser?.role === 'staff'}
                      onChange={(event) => setAccountName(event.target.value)}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                        currentUser?.role === 'staff'
                          ? isDarkMode
                            ? "border-slate-700 bg-slate-800/50 text-slate-500 cursor-not-allowed"
                            : "border-[#EAD6C0] bg-gray-50 text-gray-500 cursor-not-allowed"
                          : isDarkMode
                            ? "border-slate-600 bg-slate-800 text-slate-100 focus:border-slate-400"
                            : "border-[#EAD6C0] text-[#4B2E2B] focus:border-[#B28A6E]"
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs ${isDarkMode ? "text-slate-400" : "text-[#7C5D58]"}`}>
                      Email {currentUser?.role === 'staff' && <span className="text-xs text-amber-500">(Read only for staff)</span>}
                    </label>
                    <input
                      type="email"
                      value={accountEmail}
                      disabled={currentUser?.role === 'staff'}
                      onChange={(event) => setAccountEmail(event.target.value)}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                        currentUser?.role === 'staff'
                          ? isDarkMode
                            ? "border-slate-700 bg-slate-800/50 text-slate-500 cursor-not-allowed"
                            : "border-[#EAD6C0] bg-gray-50 text-gray-500 cursor-not-allowed"
                          : isDarkMode
                            ? "border-slate-600 bg-slate-800 text-slate-100 focus:border-slate-400"
                            : "border-[#EAD6C0] text-[#4B2E2B] focus:border-[#B28A6E]"
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs ${isDarkMode ? "text-slate-400" : "text-[#7C5D58]"}`}>Role</label>
                    <p className={`text-sm ${isDarkMode ? "text-slate-100" : "text-[#4B2E2B]"}`}>{roleLabel(currentUser?.role)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAccountModal}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                    isDarkMode
                      ? "border-slate-600 text-slate-200 hover:bg-slate-800"
                      : "border-[#EAD6C0] text-[#4B2E2B] hover:bg-[#F8EFE4]"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAccount}
                  disabled={accountSaving}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-70 ${
                    isDarkMode ? "bg-indigo-500 hover:bg-indigo-400" : "bg-[#4B2E2B] hover:bg-[#6B4E4B]"
                  }`}
                >
                  {accountSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
