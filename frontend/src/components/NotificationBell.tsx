import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, Clock } from "lucide-react";
import { fetchNotifications, Notification } from "../services/api";

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch notifications
    const loadNotifications = async () => {
        try {
            setLoading(true);
            const response = await fetchNotifications();
            setNotifications(response.notifications || []);
            const unread = (response.notifications || []).filter((n) => !n.read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load and polling
    useEffect(() => {
        loadNotifications();

        // Poll every 10 seconds for new notifications
        const interval = setInterval(loadNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "order":
                return "📦";
            case "ready":
                return "✅";
            case "alert":
                return "⚠️";
            default:
                return "🔔";
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "order":
                return "bg-blue-100 text-blue-600";
            case "ready":
                return "bg-green-100 text-green-600";
            case "alert":
                return "bg-red-100 text-red-600";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                            Notifications
                        </h3>
                        <button
                            onClick={loadNotifications}
                            className="text-xs text-primary hover:text-primary/80 font-medium"
                        >
                            Refresh
                        </button>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                                <Bell className="w-12 h-12 mb-2 opacity-30" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!notification.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                            }`}
                                    >
                                        {/* Icon */}
                                        <div
                                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getTypeColor(notification.type)
                                                }`}
                                        >
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                                                    {notification.title || notification.message}
                                                </p>
                                                {!notification.read && (
                                                    <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></span>
                                                )}
                                            </div>
                                            {notification.message && notification.title && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                                                <Clock className="w-3 h-3" />
                                                <span>{notification.time || notification.created_at}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                            <button className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium">
                                View All Notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}