import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShoppingBag,
  Bell,
  X,
  AlertTriangle,
  Info,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion'; // Fixed import to match common usage
import { fetchNotifications, fetchDashboard, dismissNotification, type Notification } from '../services/api';
import { auth } from '../utils/auth';

interface OrderItem {
  name: string;
  quantity: number;
  customization?: string;
  price?: number;
}

interface Order {
  id: string;
  tableNo: string;
  status: string;
  items: OrderItem[];
  timeElapsed: string;
  timestamp: string;
  total: number;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
}

type DashboardUser = {
  name?: string | null;
  role?: string | null;
  profile_image_url?: string | null;
};

interface DashboardProps {
  orders: Order[];
  historyOrders?: Order[];
  onViewDetails: (order: Order) => void;
  currentUser?: DashboardUser | null;
  onProfileClick?: () => void;
  summaryCounts?: { live?: number; completed?: number; cancelled?: number };
  onViewAllOrders?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, historyOrders = [], onViewDetails, currentUser, onProfileClick, summaryCounts, onViewAllOrders, onNotificationClick }) => {
  const [activeTab, setActiveTab] = useState<'Live' | 'Completed' | 'Cancelled'>('Live');
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  const storedUser: DashboardUser | null = useMemo(() => {
    return auth.getUser() as DashboardUser | null;
  }, []);

  const user = currentUser ?? storedUser;
  const userName = (user?.name ?? 'Staff').toString();
  const userRole = (user?.role ?? 'staff').toString().toUpperCase();
  const userInitials =
    userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'ST';

  const seenStorageKey = useMemo(() => {
    const id = (auth.getUser() as { id?: number | string } | null)?.id ?? 'unknown';
    return `prey-lang-pos:notifications:seen:${id}`;
  }, []);
  const dismissedStorageKey = useMemo(() => {
    const id = (auth.getUser() as { id?: number | string } | null)?.id ?? 'unknown';
    return `prey-lang-pos:notifications:dismissed:${id}`;
  }, []);

  const readSeen = useMemo(() => {
    return () => {
      try {
        const raw = localStorage.getItem(seenStorageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    };
  }, [seenStorageKey]);
  const writeSeen = useMemo(() => {
    return (keys: string[]) => {
      localStorage.setItem(seenStorageKey, JSON.stringify(keys));
    };
  }, [seenStorageKey]);
  const readDismissed = useMemo(() => {
    return () => {
      try {
        const raw = localStorage.getItem(dismissedStorageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    };
  }, [dismissedStorageKey]);
  const writeDismissed = useMemo(() => {
    return (keys: string[]) => {
      localStorage.setItem(dismissedStorageKey, JSON.stringify(keys));
    };
  }, [dismissedStorageKey]);

  const activeOrdersCount = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;
  const readyOrdersCount = orders.filter(o => o.status === 'Ready').length;
  const liveCount = Number.isFinite(summaryCounts?.live) ? Number(summaryCounts?.live) : activeOrdersCount;
  const completedCount = Number.isFinite(summaryCounts?.completed) ? Number(summaryCounts?.completed) : orders.filter(o => o.status === 'Completed').length;
  const cancelledCount = Number.isFinite(summaryCounts?.cancelled) ? Number(summaryCounts?.cancelled) : orders.filter(o => o.status === 'Cancelled').length;

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const payload = await fetchDashboard();
        if (cancelled) return;
        // keep for dashboard stats; badge handled by loadNotifications
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        if (cancelled) return;
      }
    }

    async function loadNotifications() {
      try {
        const payload = await fetchNotifications();
        if (cancelled) return;
        const dismissed = new Set(readDismissed());
        const list = (payload.notifications || []).filter((n) => !dismissed.has(String(n.id ?? '')));
        const seen = new Set(readSeen());
        const unseenCount = list.filter((n) => !seen.has(String(n.id ?? ''))).length;
        setNotifications(list);
        setNotificationCount(unseenCount);
      } catch (err) {
        console.error('Failed to load notifications:', err);
        if (cancelled) return;
        setNotifications([]);
        setNotificationCount(0);
      }
    }

    loadDashboard();
    loadNotifications();
    const interval = setInterval(() => {
      loadDashboard();
      loadNotifications();
    }, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'Live') return orders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled');
    if (activeTab === 'Completed') return historyOrders.filter((o) => o.status === 'Completed');
    if (activeTab === 'Cancelled') return historyOrders.filter((o) => o.status === 'Cancelled');
    return orders;
  }, [orders, historyOrders, activeTab]);

  useEffect(() => {
    setShowAllOrders(false);
  }, [activeTab]);

  const mockInventory: InventoryItem[] = [
    { id: '1', name: 'Whole Milk (1L)', quantity: 2, unit: 'units', threshold: 5 },
    { id: '2', name: 'Espresso Beans (500g)', quantity: 1, unit: 'bag', threshold: 3 },
    { id: '3', name: 'Caramel Syrup', quantity: 3, unit: 'bottles', threshold: 5 },
  ];

  const renderNotificationIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'ready') return <Check size={16} className="text-emerald-600 dark:text-emerald-400" />;
    if (t === 'order') return <ShoppingBag size={16} className="text-blue-600 dark:text-blue-400" />;
    if (t === 'stock' || t === 'near_stock') return <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />;
    return <Info size={16} className="text-slate-600 dark:text-slate-400" />;
  };

  const notificationBubbleClass = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'ready') return 'bg-emerald-100 dark:bg-emerald-500/10';
    if (t === 'order') return 'bg-blue-100 dark:bg-blue-500/10';
    if (t === 'stock' || t === 'near_stock') return 'bg-amber-100 dark:bg-amber-500/10';
    return 'bg-slate-100 dark:bg-white/5';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Header with Auto-Date and Profile */}
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Good morning, Barista!</h2>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1">
            <Clock size={16} />
            <span className="text-sm font-medium">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })} | {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
              })}
            </span>
          </div>
        </div>

        {/* Profile and Notifications Div - Dark Mode Support */}
        <div className="flex items-center gap-3 relative">
          {/* Notification Bell */}
          <button
            onClick={() => {
              const next = !showNotifications;
              setShowNotifications(next);
              if (next) {
                const keys = notifications.map((n) => String(n.id ?? ''));
                const merged = Array.from(new Set([...readSeen(), ...keys]));
                writeSeen(merged);
                setNotificationCount(0);
              }
            }}
            className="relative p-2 bg-white dark:bg-[#1A110B] rounded-full border border-slate-100 dark:border-white/10 shadow-sm transition-colors hover:scale-105 active:scale-95"
          >
            <Bell size={20} className="text-slate-600 dark:text-slate-300" />
            {/* Notification Badge */}
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#1A110B]">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-16 w-96 bg-white dark:bg-[#1A110B] rounded-2xl border border-slate-100 dark:border-white/10 shadow-xl z-50 overflow-hidden"
            >
              {/* Dropdown Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5">
                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X size={16} className="text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => {
                          setShowNotifications(false);
                          onNotificationClick?.(notification);
                        }}
                        className="p-4 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                    <div className="flex items-start gap-3">
                      {/* Icon based on type */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notificationBubbleClass(notification.type)}`}>
                        {renderNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {notification.title || 'Notification'}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {notification.time || ''}
                            </span>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const key = String(notification.id ?? "");
                                try {
                                  if (key) await dismissNotification(key);
                                } catch {
                                  // ignore API errors
                                }
                                const mergedSeen = Array.from(new Set([...readSeen(), key]));
                                writeSeen(mergedSeen);
                                const mergedDismissed = Array.from(new Set([...readDismissed(), key]));
                                writeDismissed(mergedDismissed);
                                setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
                                setNotificationCount((prev) => Math.max(0, prev - 1));
                              }}
                              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                              aria-label="Remove notification"
                            >
                              <X size={14} className="text-slate-400 dark:text-slate-500" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="p-8 text-center">
                    <Info size={24} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 dark:text-slate-500">No notifications</p>
                  </div>
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="p-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    const keys = notifications.map((n) => String(n.id ?? ''));
                    const mergedSeen = Array.from(new Set([...readSeen(), ...keys]));
                    writeSeen(mergedSeen);
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                    setNotificationCount(0);
                  }}
                  className="w-full text-center text-sm text-[#BD5E0A] font-bold hover:underline"
                >
                  Mark all as read
                </button>
              </div>
            </motion.div>
          )}

          {/* Profile Div */}
          <button
            type="button"
            onClick={onProfileClick}
            disabled={!onProfileClick}
            className={`flex items-center gap-3 bg-white dark:bg-[#1A110B] p-2 pr-4 rounded-full border border-slate-100 dark:border-white/10 shadow-sm transition-colors ${
              onProfileClick ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'
            }`}
          >
            {user?.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt="User"
                className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full border border-slate-100 dark:border-white/10 bg-[#F5E6D3] text-[#4B2E2B] flex items-center justify-center text-sm font-bold">
                {userInitials}
              </div>
            )}
            <div className="text-left">
              <p className="text-sm font-bold leading-none dark:text-white transition-colors">{userName}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{userRole}</p>
            </div>
          </button>
        </div>
      </header>

      {/* Quick Stats - Updated for Dark Mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1A110B] p-6 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm relative overflow-hidden transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
              <ShoppingBag size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded-lg">+20%</span>
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Orders</p>
          <h3 className="text-4xl font-black mt-1 dark:text-white transition-colors">{activeOrdersCount}</h3>
        </div>

        <div className="bg-white dark:bg-[#1A110B] p-6 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm relative overflow-hidden transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded-lg">+5%</span>
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ready for Pickup</p>
          <h3 className="text-4xl font-black mt-1 dark:text-white transition-colors">{readyOrdersCount}</h3>
        </div>
      </div>

      {/* Order Status Section - Updated for Dark Mode */}
      <section className="bg-white dark:bg-[#1A110B] rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-50 dark:border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg dark:text-white transition-colors">Order Status</h3>
            <button
              type="button"
              onClick={onViewAllOrders}
              className="text-[#BD5E0A] text-sm font-bold hover:underline"
            >
              View All Orders
            </button>
          </div>
          
          <div className="flex gap-8 border-b border-slate-100 dark:border-white/5">
            {(['Live', 'Completed', 'Cancelled'] as const).map((tab) => {
              const count =
                tab === 'Live' ? liveCount :
                tab === 'Completed' ? completedCount :
                cancelledCount;
              return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-bold transition-all relative ${
                  activeTab === tab ? 'text-orange-600 dark:text-orange-500' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
                }`}
              >
                {tab === 'Live' ? `Live Orders` : tab}
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === tab ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500'
                }`}>
                  {count}
                </span>
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-500"
                  />
                )}
              </button>
            )})}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5 text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                <th className="px-6 py-4">Table No.</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Time Elapsed</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredOrders.slice(0, showAllOrders ? filteredOrders.length : 5).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{order.tableNo}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'Brewing' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' :
                      order.status === 'Pending' ? 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400' :
                      order.status === 'Ready' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                      order.status === 'Completed' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                      order.status === 'Preparing' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                      'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        order.status === 'Brewing' ? 'bg-orange-600' :
                        order.status === 'Ready' ? 'bg-emerald-600' :
                        order.status === 'Completed' ? 'bg-blue-600' :
                        'bg-slate-600'
                      }`} />
                      {order.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-mono text-sm ${order.status === 'Delayed' ? 'text-red-500 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                    {order.timeElapsed}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onViewDetails(order)}
                      className="text-[#BD5E0A] text-[10px] font-bold uppercase tracking-widest hover:underline transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 dark:text-slate-600 text-sm">
                    No {activeTab.toLowerCase()} orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-5 border-t border-slate-50 dark:border-white/5 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAllOrders((prev) => !prev)}
            className="px-5 py-2.5 rounded-xl border border-[#BD5E0A]/40 text-[#BD5E0A] font-bold text-xs uppercase tracking-widest hover:bg-[#BD5E0A] hover:text-white transition-colors"
          >
            {showAllOrders ? "Show Less" : "See More"}
          </button>
        </div>
      </section>

      {/* Inventory Watchlist - Updated for Dark Mode */}
      <section>
        <h3 className="font-bold text-lg mb-4 dark:text-white transition-colors">Inventory Watchlist</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockInventory.map((item) => (
            <div key={item.id} className="bg-white dark:bg-[#1A110B] p-4 rounded-2xl border-l-4 border-l-red-500 shadow-sm flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</p>
                  <p className="text-[10px] text-red-500 dark:text-red-400 font-bold uppercase">{item.quantity} {item.unit} left</p>
                </div>
              </div>
              <button className="w-8 h-8 bg-slate-50 dark:bg-white/5 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default Dashboard;
