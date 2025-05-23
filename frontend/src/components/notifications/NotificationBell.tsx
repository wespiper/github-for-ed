import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

export const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        loading,
        unreadCount,
        fetchNotifications,
        markAllAsRead,
        markAsRead,
        deleteNotification,
    } = useNotifications();

    useEffect(() => {
        fetchNotifications({ limit: 10, unreadOnly: showUnreadOnly });
    }, [fetchNotifications, showUnreadOnly]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const priorityColor = (priority: string) => {
        switch (priority) {
            case "urgent":
                return "bg-ember-500";
            case "high":
                return "bg-orange-500";
            case "medium":
                return "bg-highlight-500";
            case "low":
                return "bg-scribe-500";
            default:
                return "bg-ink-500";
        }
    };

    const severityColor = (severity?: string) => {
        switch (severity) {
            case "critical":
                return "border-l-ember-500";
            case "warning":
                return "border-l-orange-500";
            case "info":
                return "border-l-scribe-500";
            default:
                return "border-l-ink-300";
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-ink-600 hover:text-ink-900 hover:bg-ink-100 rounded-md transition-colors"
                aria-label={`Notifications (${unreadCount} unread)`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-ember-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white border border-ink-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-ink-200">
                        <h3 className="font-semibold text-ink-900">
                            Notifications
                        </h3>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() =>
                                    setShowUnreadOnly(!showUnreadOnly)
                                }
                                className={`text-xs px-2 py-1 rounded ${
                                    showUnreadOnly
                                        ? "bg-scribe-100 text-scribe-700"
                                        : "bg-ink-100 text-ink-600"
                                }`}
                            >
                                {showUnreadOnly ? "Unread only" : "All"}
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-scribe-600 hover:text-scribe-800 flex items-center space-x-1"
                                    title="Mark all as read"
                                >
                                    <CheckCheck size={14} />
                                    <span>Mark all read</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-80">
                        {loading ? (
                            <div className="p-4 text-center text-ink-500">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-scribe-600 mx-auto"></div>
                                <span className="block mt-2">
                                    Loading notifications...
                                </span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-ink-500">
                                <Bell
                                    size={24}
                                    className="mx-auto mb-2 opacity-30"
                                />
                                <span>
                                    {showUnreadOnly
                                        ? "No unread notifications"
                                        : "No notifications"}
                                </span>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`p-3 border-b border-ink-100 hover:bg-ink-50 ${
                                        notification.status === "unread"
                                            ? "bg-scribe-50"
                                            : ""
                                    } ${severityColor(
                                        notification.intervention?.severity
                                    )} border-l-4`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <div
                                                    className={`w-2 h-2 rounded-full ${priorityColor(
                                                        notification.priority
                                                    )}`}
                                                    title={`${notification.priority} priority`}
                                                />
                                                <span className="font-medium text-sm text-ink-900 truncate">
                                                    {notification.title}
                                                </span>
                                                {notification.status ===
                                                    "unread" && (
                                                    <span className="w-2 h-2 bg-scribe-500 rounded-full flex-shrink-0" />
                                                )}
                                            </div>

                                            <p className="text-sm text-ink-600 mb-2 line-clamp-2">
                                                {notification.message}
                                            </p>

                                            <div className="flex items-center justify-between text-xs text-ink-500">
                                                <span>
                                                    {formatTimeAgo(
                                                        notification.createdAt
                                                    )}
                                                </span>
                                                <div className="flex items-center space-x-1">
                                                    {notification.category ===
                                                        "educational_intervention" && (
                                                        <span className="bg-ember-100 text-ember-700 px-2 py-1 rounded">
                                                            Intervention
                                                        </span>
                                                    )}
                                                    {notification.actionRequired && (
                                                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                                            Action Required
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {notification.intervention
                                                ?.suggestedActions && (
                                                <div className="mt-2 text-xs">
                                                    <span className="font-medium text-ink-700">
                                                        Suggested Actions:
                                                    </span>
                                                    <ul className="list-disc list-inside text-ink-600 mt-1">
                                                        {notification.intervention.suggestedActions
                                                            .slice(0, 2)
                                                            .map(
                                                                (
                                                                    action,
                                                                    idx
                                                                ) => (
                                                                    <li
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="truncate"
                                                                    >
                                                                        {action}
                                                                    </li>
                                                                )
                                                            )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col space-y-1 ml-2">
                                            {notification.status ===
                                                "unread" && (
                                                <button
                                                    onClick={() =>
                                                        markAsRead(
                                                            notification._id
                                                        )
                                                    }
                                                    className="text-scribe-600 hover:text-scribe-800 p-1"
                                                    title="Mark as read"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() =>
                                                    deleteNotification(
                                                        notification._id
                                                    )
                                                }
                                                className="text-ink-400 hover:text-ember-600 p-1"
                                                title="Delete"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-ink-200 bg-ink-50">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    // Navigate to full notifications page
                                    window.location.href = "/notifications";
                                }}
                                className="w-full text-center text-sm text-scribe-600 hover:text-scribe-800"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
