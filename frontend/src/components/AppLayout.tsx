import { Bell, ChevronLeft, ChevronRight, LogOut, Menu, User, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { navGroups, pageTitleByPath } from "../data/mockData";
import {
  fetchCurrentUser,
  fetchNotifications,
  Notification,
  CurrentUser,
  updateCurrentUser,
} from "../services/api";

function statusClass(isActive: boolean): string {
  if (isActive) {
    return "bg-[#F5E6D3] text-[#4B2E2B] font-semibold shadow";
  }
  return "text-white/80 hover:bg-white/10";
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
  const [collapsed, setCollapsed] = useState(false);
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
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
        setAccountName(user.name);
        setAccountEmail(user.email);
        setAccountImagePreview(user.profile_image_url ?? null);
      } catch (err) {
        console.error("Failed to load user:", err);
        // Fallback to default values
        const fallbackUser: CurrentUser = {
          id: 1,
          name: 'Admin User',
          email: 'admin@preylang.com',
          role: 'admin',
          initials: 'AD',
          profile_image_url: null,
        };
        setCurrentUser(fallbackUser);
        setAccountName(fallbackUser.name);
        setAccountEmail(fallbackUser.email);
        setAccountImagePreview(null);
      }
    }

    loadUser();
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

  const pageTitle = pageTitleByPath[location.pathname] ?? "Dashboard";
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
  const mainMargin = collapsed ? "md:ml-20" : "md:ml-64";

  function roleLabel(role: string | undefined): string {
    return role === "admin" ? "Administrator" : "Staff Member";
  }

  function openAccountModal() {
    setAccountName(currentUser?.name ?? "Admin User");
    setAccountEmail(currentUser?.email ?? "admin@preylang.com");
    setAccountImagePreview(currentUser?.profile_image_url ?? null);
    setAccountImageFile(null);
    setAccountError(null);
    setShowAccountModal(true);
  }

  function closeAccountModal() {
    setShowAccountModal(false);
    setAccountImageFile(null);
    setAccountError(null);
  }

  async function saveAccount() {
    const name = accountName.trim();
    const email = accountEmail.trim();

    if (!name || !email) {
      setAccountError("Name and email are required.");
      return;
    }

    try {
      setAccountSaving(true);
      setAccountError(null);
      const updated = await updateCurrentUser({
        name,
        email,
        profile_image: accountImageFile,
      });
      setCurrentUser(updated);
      setAccountImageFile(null);
      setAccountImagePreview(updated.profile_image_url ?? null);
      setShowAccountModal(false);
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "Failed to update account");
    } finally {
      setAccountSaving(false);
    }
  }

  return (
    <div className="h-screen bg-[#FFF8F0] text-[#4B2E2B]">
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
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#4B2E2B] text-white transition-transform duration-300 md:translate-x-0",
          sidebarWidth,
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo and User Info */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
          <img
            src="/img/logo-coffee.png"
            alt="PREY LANG Logo"
            className="h-11 w-11 rounded-lg bg-white/20 object-cover"
          />
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-wide">PREY LANG</p>
              <p className="text-xs text-white/80">COFFEE</p>
            </div>
          )}
        </div>

        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            {currentUser?.profile_image_url ? (
              <img
                src={currentUser.profile_image_url}
                alt={currentUser.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5E6D3] font-semibold text-[#4B2E2B]">
                {currentUser?.initials ?? 'AD'}
              </div>
            )}
            {!collapsed && (
              <div>
                <p className="text-sm font-semibold">{currentUser?.name ?? 'Admin User'}</p>
                <p className="text-xs text-white/70">{currentUser?.role === 'admin' ? 'Manager' : 'Staff'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.group} className="space-y-2">
                {!collapsed && (
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-widest text-white/50">
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

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10"
          >
            <LogOut size={18} />
            {!collapsed && <span className="ml-3">Logout</span>}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute -right-3 top-24 hidden h-7 w-7 items-center justify-center rounded-full border border-[#EAD6C0] bg-[#FFF8F0] text-[#4B2E2B] shadow md:flex"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      <div className={`flex h-screen flex-col transition-all duration-300 ${mainMargin}`}>
        <header className="sticky top-0 z-20 border-b border-[#EAD6C0] bg-[#FFF8F0]/95 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Toggle mobile menu"
                onClick={() => setMobileOpen((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5D2BB] bg-white text-[#4B2E2B] md:hidden"
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className="text-lg font-semibold md:text-2xl">{pageTitle}</h1>
                <p className="text-xs text-[#7C5D58] md:text-sm">{dateText}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5D2BB] bg-white text-[#4B2E2B] shadow-sm"
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
                  <div className="absolute right-0 top-12 w-80 rounded-xl border border-[#EAD6C0] bg-white p-2 shadow-lg">
                    <div className="border-b border-[#F1E3D3] px-3 py-2">
                      <h3 className="font-semibold text-[#4B2E2B]">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={`flex items-start gap-3 rounded-lg p-3 hover:bg-[#F8EFE4] ${
                              !notification.read ? 'bg-amber-50' : ''
                            }`}
                          >
                            <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#4B2E2B]">{notification.title}</p>
                              <p className="text-xs text-[#7C5D58] truncate">{notification.message}</p>
                              <p className="text-xs text-[#8E706B]">{notification.time}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-[#7C5D58]">
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
                  className="flex items-center gap-2 rounded-xl border border-[#E5D2BB] bg-white px-2 py-1.5 shadow-sm md:px-3"
                >
                  {currentUser?.profile_image_url ? (
                    <img
                      src={currentUser.profile_image_url}
                      alt={currentUser.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4B2E2B] text-xs font-semibold text-white">
                      {currentUser?.initials ?? "AD"}
                    </div>
                  )}
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-semibold leading-tight">{currentUser?.name ?? 'Admin User'}</p>
                    <p className="text-xs text-[#7C5D58]">{currentUser?.email ?? 'admin@preylang.com'}</p>
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 w-48 rounded-xl border border-[#EAD6C0] bg-white p-2 shadow-lg z-50">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        openAccountModal();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#4B2E2B] hover:bg-[#F8EFE4]"
                    >
                      <User size={16} />
                      Account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/settings');
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#4B2E2B] hover:bg-[#F8EFE4]"
                    >
                      <Settings size={16} />
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Handle logout
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('user');
                        window.location.href = '/';
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
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#4B2E2B]">Account</h2>
                <button
                  type="button"
                  onClick={closeAccountModal}
                  className="text-[#7C5D58] hover:text-[#4B2E2B]"
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
                  <div className="h-16 w-16 overflow-hidden rounded-full bg-[#4B2E2B]">
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
                    <p className="text-lg font-semibold text-[#4B2E2B]">
                      {currentUser?.name ?? "Admin User"}
                    </p>
                    <p className="text-sm text-[#7C5D58]">{roleLabel(currentUser?.role)}</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setAccountImageFile(file);
                        if (file) {
                          setAccountImagePreview(URL.createObjectURL(file));
                        } else {
                          setAccountImagePreview(currentUser?.profile_image_url ?? null);
                        }
                      }}
                      className="mt-2 block w-full text-xs text-[#7C5D58] file:mr-3 file:rounded-md file:border-0 file:bg-[#F5E6D3] file:px-2 file:py-1 file:text-xs file:font-medium file:text-[#4B2E2B]"
                    />
                  </div>
                </div>
                <div className="border-t border-[#EAD6C0] pt-4 space-y-3">
                  <div>
                    <label className="text-xs text-[#7C5D58]">Name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(event) => setAccountName(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#EAD6C0] px-3 py-2 text-sm text-[#4B2E2B] focus:border-[#B28A6E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#7C5D58]">Email</label>
                    <input
                      type="email"
                      value={accountEmail}
                      onChange={(event) => setAccountEmail(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#EAD6C0] px-3 py-2 text-sm text-[#4B2E2B] focus:border-[#B28A6E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#7C5D58]">Role</label>
                    <p className="text-sm text-[#4B2E2B]">{roleLabel(currentUser?.role)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAccountModal}
                  className="rounded-lg border border-[#EAD6C0] px-4 py-2 text-sm font-medium text-[#4B2E2B] hover:bg-[#F8EFE4]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAccount}
                  disabled={accountSaving}
                  className="rounded-lg bg-[#4B2E2B] px-4 py-2 text-sm font-medium text-white hover:bg-[#6B4E4B] disabled:opacity-70"
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
