import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Search, Bell, X, Hash, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import coffeeLogo from '../assets/coffee.png';
import { fetchNotifications, dismissNotification, type Notification } from '../services/api';
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

function buildOrderDisplayIdMap(ids: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  ids.forEach((id, i) => { map[id] = `POS_${String(i + 1).padStart(3, "0")}`; });
  return map;
}

async function createRecipeLog(payload: { order_id: string; table_no: string; name: string }): Promise<void> {
  const token = localStorage.getItem("auth_token");
  await fetch("/api/recipe-logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}

interface OrderHistoryProps {
  orders: Order[];
  onNotificationClick?: (notification: Notification) => void;
}

function ReceiptCard({ order, displayId }: { order: Order; displayId: string }) {
  const receiptDate = new Date(order.timestamp || Date.now());
  const receiptDateText = receiptDate.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="receipt-card">
      <div className="receipt-head">
        <img src={coffeeLogo} className="receipt-logo" alt="logo" />
        <div className="receipt-brand">
          <h2 className="receipt-title">Prey Lang Coffee</h2>
          <p className="receipt-sub">Street 371, Phnom Penh</p>
        </div>
      </div>

      <div className="receipt-divider" />

      <div className="receipt-meta">
        <div className="receipt-meta-row">
          <span className="receipt-label">Receipt</span>
          <span className="receipt-value">{displayId}</span>
        </div>
        <div className="receipt-meta-row">
          <span className="receipt-label">Date</span>
          <span className="receipt-value">{receiptDateText}</span>
        </div>
        <div className="receipt-meta-row">
          <span className="receipt-label">Table</span>
          <span className="receipt-value">{order.tableNo}</span>
        </div>
      </div>

      <div className="receipt-divider soft" />

      <div className="receipt-items">
        <div className="receipt-items-head">
          <span className="receipt-items-label">Item</span>
          <span className="receipt-items-label">Amount</span>
        </div>
        {(order.items || []).map((item, i) => (
          <div key={i} className="receipt-item">
            <div className="receipt-item-row">
              <p className="receipt-item-name">{item.name}</p>
              <p className="receipt-item-price">
                ${(item.quantity * (item.price || 0)).toFixed(2)}
              </p>
            </div>
            <p className="receipt-item-sub">
              {item.quantity} x ${(item.price || 0).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="receipt-divider" />

      <div className="receipt-total">
        <span className="receipt-total-label">Total</span>
        <span className="receipt-total-value">${(order.total || 0).toFixed(2)}</span>
      </div>

      <div className="receipt-footer">
        <p className="receipt-thanks">Thank you for your visit</p>
        <p className="receipt-note">Save this receipt for future reference.</p>
      </div>
    </div>
  );
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders = [], onNotificationClick }) => {
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingPrintLog, setIsSavingPrintLog] = useState(false);
  const [printedOrderIds, setPrintedOrderIds] = useState<Set<string>>(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const orderDisplayIdMap = useMemo(() => buildOrderDisplayIdMap(orders.map((order) => order.id)), [orders]);

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

  const notificationBubbleClass = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-500';
      case 'payment':
        return 'bg-green-500';
      case 'system':
        return 'bg-purple-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Hash size={16} className="text-white" />;
      case 'payment':
        return <Printer size={16} className="text-white" />;
      case 'system':
        return <Bell size={16} className="text-white" />;
      case 'warning':
        return <Search size={16} className="text-white" />;
      default:
        return <Bell size={16} className="text-white" />;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const payload = await fetchNotifications();
        if (cancelled) return;
        const dismissed = new Set(readDismissed());
        const list = (payload.notifications || []).filter((n: Notification) => !dismissed.has(String(n.id ?? '')));
        const seen = new Set(readSeen());
        const unseenCount = list.filter((n: Notification) => !seen.has(String(n.id ?? ''))).length;
        setNotifications(list);
        setNotificationCount(unseenCount);
      } catch (err) {
        console.error('Failed to load notifications:', err);
        if (cancelled) return;
        setNotifications([]);
        setNotificationCount(0);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handlePrint = async () => {
    if (!orderToPrint) return;
    if (isSavingPrintLog) return;

    if (!printedOrderIds.has(orderToPrint.id)) {
      try {
        setIsSavingPrintLog(true);
        await Promise.all(
          orderToPrint.items.map((item) =>
            createRecipeLog({
              order_id: orderToPrint.id,
              table_no: orderToPrint.tableNo,
              name: item.name,
            })
          )
        );
        setPrintedOrderIds((prev) => new Set(prev).add(orderToPrint.id));
      } catch (error) {
        console.error('Failed to save print log', error);
        toast.error('Failed to save receipt history. Please try again.');
        return;
      } finally {
        setIsSavingPrintLog(false);
      }
    }

    window.print();
  };

  const filteredOrders = orders.filter(
    (order) =>
      (orderDisplayIdMap[order.id] ?? order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tableNo.toString().toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <div id="order-history-page" className="w-full space-y-6 pb-16 transition-colors duration-500">
        <style>{`
          #print-preview-overlay {
            position: fixed;
            inset: 0;
            background:
              radial-gradient(circle at 20% 10%, rgba(217, 119, 6, 0.12), transparent 45%),
              rgba(15, 23, 42, 0.82);
            display: ${orderToPrint ? 'flex' : 'none'};
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: clamp(16px, 3vw, 32px);
            backdrop-filter: blur(8px);
          }

          #print-preview-shell {
            width: min(94vw, 460px);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }

          #print-sheet {
            display: none;
          }

          .receipt-card {
            width: min(92vw, 380px);
            background: #ffffff;
            border: 1px solid #e6e3de;
            border-radius: 18px;
            padding: 22px 20px;
            color: #1f2937;
            box-shadow:
              0 18px 38px -20px rgba(15, 23, 42, 0.35),
              0 10px 20px -16px rgba(15, 23, 42, 0.28);
            font-family: "Segoe UI", Tahoma, sans-serif;
          }

          .receipt-head {
            display: flex;
            align-items: center;
            gap: 12px;
            justify-content: center;
            margin-bottom: 6px;
          }

          .receipt-logo {
            width: 40px;
            height: 40px;
            object-fit: contain;
            display: block;
          }

          .receipt-title {
            margin: 0;
            font-size: 20px;
            line-height: 1.1;
            font-weight: 800;
            letter-spacing: 0.3px;
          }

          .receipt-sub {
            margin: 4px 0 0;
            font-size: 11px;
            color: #6b7280;
            font-weight: 600;
          }

          .receipt-brand {
            text-align: left;
          }

          .receipt-divider {
            border-top: 1px solid #e6e3de;
            margin: 12px 0;
          }

          .receipt-divider.soft {
            border-top-style: dashed;
            border-top-color: #ece9e3;
          }

          .receipt-meta {
            display: grid;
            gap: 6px;
          }

          .receipt-meta-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
          }

          .receipt-label {
            color: #9ca3af;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.2px;
            max-width: 90px;
          }

          .receipt-value {
            color: #1f2937;
            font-size: 14px;
            line-height: 1.3;
            font-weight: 700;
            text-align: right;
            word-break: break-word;
            max-width: 210px;
          }

          .receipt-items {
            display: grid;
            gap: 10px;
          }

          .receipt-items-head {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.14em;
          }

          .receipt-item-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 8px;
          }

          .receipt-item-name,
          .receipt-item-price {
            margin: 0;
            font-size: 15px;
            line-height: 1.2;
            font-weight: 700;
          }

          .receipt-item-sub {
            margin: 5px 0 0;
            color: #6b7280;
            font-size: 11px;
            font-weight: 600;
          }

          .receipt-total {
            margin-top: 6px;
            padding-top: 6px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 10px;
          }

          .receipt-total-label {
            font-size: 18px;
            line-height: 1.1;
            font-weight: 800;
            color: #1f2937;
            text-transform: uppercase;
            letter-spacing: 0.12em;
          }

          .receipt-total-value {
            font-size: 28px;
            line-height: 1;
            font-weight: 900;
            color: #b45309;
            white-space: nowrap;
          }

          .receipt-footer {
            text-align: center;
            margin-top: 12px;
          }

          .receipt-thanks {
            margin: 0;
            font-size: 13px;
            line-height: 1.2;
            font-weight: 800;
            letter-spacing: 0.4px;
            color: #1f2937;
          }

          .receipt-note {
            margin: 6px 0 0;
            font-size: 10px;
            color: #9ca3af;
            font-weight: 600;
          }

          @media (max-width: 430px) {
            .receipt-card {
              width: min(96vw, 350px);
              padding: 18px 14px;
            }

            .receipt-value {
              font-size: 13px;
              max-width: 190px;
            }

            .receipt-item-name,
            .receipt-item-price {
              font-size: 14px;
            }

            .receipt-total-label {
              font-size: 16px;
            }

            .receipt-total-value {
              font-size: 24px;
            }
          }

          #print-preview-actions {
            width: min(94vw, 380px);
            display: flex;
            gap: 10px;
            justify-content: center;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(8px);
            padding: 10px;
          }

          @media (max-width: 560px) {
            #print-preview-actions {
              flex-direction: column;
            }
          }

          @media print {
            @page {
              size: 100mm 155mm;
              margin: 0;
            }

            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }

            #order-history-page {
              display: none !important;
            }

            #print-sheet {
              display: flex !important;
              position: fixed !important;
              inset: 0 !important;
              align-items: center !important;
              justify-content: center !important;
              background: #fff !important;
            }

            #print-sheet .receipt-card {
              width: 100mm !important;
              max-width: 100mm !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              padding: 8mm 6mm !important;
            }
          }
        `}</style>

        <div className="no-print w-full">
          <header className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/5 p-2 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm">
                <img src={coffeeLogo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight transition-colors">
                  Order History
                </h1>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  Prey Lang POS
                </p>
              </div>
            </div>
            <div className="relative">
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
                <div className="absolute right-0 top-16 w-96 bg-white dark:bg-[#1A110B] rounded-2xl border border-slate-100 dark:border-white/10 shadow-xl z-50 overflow-hidden">
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
                                  className="p-1 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors"
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
                </div>
              )}
            </div>
          </header>

          <div className="relative mb-6">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600"
              size={18}
            />
            <input
              type="text"
              placeholder="Search Order ID or Table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-14 pr-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BD5E0A]/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>

          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/10 flex items-center justify-between shadow-sm transition-colors hover:border-[#BD5E0A]/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <Hash size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{order.tableNo}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Order {orderDisplayIdMap[order.id] ?? order.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-black text-[#BD5E0A]">${(order.total || 0).toFixed(2)}</p>
                  <button
                    onClick={() => setOrderToPrint(order)}
                    className="p-3 bg-[#BD5E0A] text-white rounded-xl hover:bg-[#964B08] transition-all active:scale-95 shadow-lg shadow-orange-900/20"
                  >
                    <Printer size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {orderToPrint && createPortal(
        <div id="print-preview-overlay">
          <div id="print-preview-shell">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              Receipt Preview
            </p>
            <ReceiptCard order={orderToPrint} displayId={orderDisplayIdMap[orderToPrint.id] ?? orderToPrint.id} />

            <div id="print-preview-actions" className="no-print">
              <button
                onClick={() => setOrderToPrint(null)}
                className="px-6 py-3 bg-slate-700/80 text-slate-100 rounded-xl font-bold text-xs uppercase tracking-[0.15em] hover:bg-slate-600 transition-all"
              >
                <X size={16} className="inline mr-2" />
                Back
              </button>
              <button
                onClick={handlePrint}
                disabled={isSavingPrintLog}
                className="px-7 py-3 bg-[#BD5E0A] text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-xl hover:bg-[#964B08] transition-all"
              >
                {isSavingPrintLog ? 'Saving...' : 'Print / Save PDF'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {orderToPrint && createPortal(
        <div id="print-sheet" aria-hidden="true">
          <ReceiptCard order={orderToPrint} displayId={orderDisplayIdMap[orderToPrint.id] ?? orderToPrint.id} />
        </div>,
        document.body
      )}
    </>
  );
};

export default OrderHistory;
