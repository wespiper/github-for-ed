import { useState } from "react";
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    User,
    FileText,
    TrendingDown,
    TrendingUp,
    Minus,
    ExternalLink,
    Check,
    X,
} from "lucide-react";
import { type AppNotification } from "@/hooks/useNotifications";

interface NotificationCardProps {
    notification: AppNotification;
    onMarkAsRead?: (id: string) => void;
    onDelete?: (id: string) => void;
    onResolve?: (
        id: string,
        resolution: string,
        actionsTaken?: string[]
    ) => void;
    expanded?: boolean;
    showActions?: boolean;
}

export const NotificationCard = ({
    notification,
    onMarkAsRead,
    onDelete,
    onResolve,
    expanded = false,
    showActions = true,
}: NotificationCardProps) => {
    const [isExpanded, setIsExpanded] = useState(expanded);
    const [showResolveForm, setShowResolveForm] = useState(false);
    const [resolution, setResolution] = useState("");
    const [actionsTaken, setActionsTaken] = useState<string[]>([""]);

    const priorityStyles = {
        urgent: "bg-ember-50 border-ember-200 text-ember-800",
        high: "bg-orange-50 border-orange-200 text-orange-800",
        medium: "bg-highlight-50 border-highlight-200 text-highlight-800",
        low: "bg-scribe-50 border-scribe-200 text-scribe-800",
    };

    const severityStyles = {
        critical: "border-l-ember-500 bg-ember-50",
        warning: "border-l-orange-500 bg-orange-50",
        info: "border-l-scribe-500 bg-scribe-50",
    };

    const typeIcons = {
        writing_struggle_detected: AlertTriangle,
        progress_milestone_reached: CheckCircle,
        assignment_at_risk: Clock,
        collaboration_issue: User,
        procrastination_detected: TrendingDown,
        productivity_decline: TrendingDown,
        writing_productivity_decline: TrendingDown,
        no_recent_activity: Clock,
        default: FileText,
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

    const getTrendIcon = (trend?: string) => {
        switch (trend) {
            case "improving":
                return <TrendingUp size={16} className="text-branch-500" />;
            case "declining":
                return <TrendingDown size={16} className="text-ember-500" />;
            case "stable":
                return <Minus size={16} className="text-ink-500" />;
            default:
                return null;
        }
    };

    const IconComponent =
        typeIcons[notification.type as keyof typeof typeIcons] ||
        typeIcons.default;

    const handleResolve = () => {
        if (onResolve && resolution.trim()) {
            onResolve(
                notification._id,
                resolution,
                actionsTaken.filter((action) => action.trim())
            );
            setShowResolveForm(false);
            setResolution("");
            setActionsTaken([""]);
        }
    };

    const addActionField = () => {
        setActionsTaken([...actionsTaken, ""]);
    };

    const updateAction = (index: number, value: string) => {
        const updated = [...actionsTaken];
        updated[index] = value;
        setActionsTaken(updated);
    };

    const removeAction = (index: number) => {
        if (actionsTaken.length > 1) {
            setActionsTaken(actionsTaken.filter((_, i) => i !== index));
        }
    };

    return (
        <div
            className={`border rounded-lg p-4 ${
                notification.status === "unread"
                    ? "bg-scribe-50 border-scribe-200"
                    : "bg-white border-ink-200"
            } ${
                notification.intervention?.severity
                    ? severityStyles[notification.intervention.severity]
                    : ""
            } border-l-4`}
        >
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <IconComponent
                        size={20}
                        className={
                            notification.intervention?.severity === "critical"
                                ? "text-ember-600"
                                : notification.intervention?.severity ===
                                  "warning"
                                ? "text-orange-600"
                                : "text-scribe-600"
                        }
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-medium text-ink-900">
                                    {notification.title}
                                </h3>
                                {notification.status === "unread" && (
                                    <span className="w-2 h-2 bg-scribe-500 rounded-full" />
                                )}
                                <span
                                    className={`px-2 py-1 text-xs rounded-full border ${
                                        priorityStyles[notification.priority]
                                    }`}
                                >
                                    {notification.priority}
                                </span>
                            </div>

                            <p className="text-ink-700 mb-2">
                                {notification.message}
                            </p>

                            <div className="flex items-center space-x-4 text-sm text-ink-500 mb-2">
                                <span>
                                    {formatTimeAgo(notification.createdAt)}
                                </span>
                                <span className="capitalize">
                                    {notification.category.replace("_", " ")}
                                </span>
                                {notification.relatedMetrics?.trend && (
                                    <div className="flex items-center space-x-1">
                                        {getTrendIcon(
                                            notification.relatedMetrics.trend
                                        )}
                                        <span>
                                            {notification.relatedMetrics.trend}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {notification.actionRequired && (
                                <div className="mb-2">
                                    <span className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                                        Action Required
                                    </span>
                                </div>
                            )}

                            {notification.relatedMetrics && (
                                <div className="bg-ink-50 rounded p-2 mb-2 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="font-medium">
                                                Current:{" "}
                                            </span>
                                            {
                                                notification.relatedMetrics
                                                    .currentValue
                                            }
                                        </div>
                                        {notification.relatedMetrics
                                            .previousValue && (
                                            <div>
                                                <span className="font-medium">
                                                    Previous:{" "}
                                                </span>
                                                {
                                                    notification.relatedMetrics
                                                        .previousValue
                                                }
                                            </div>
                                        )}
                                        {notification.relatedMetrics
                                            .threshold && (
                                            <div>
                                                <span className="font-medium">
                                                    Threshold:{" "}
                                                </span>
                                                {
                                                    notification.relatedMetrics
                                                        .threshold
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {notification.intervention && (
                                <div className="border-t pt-2 mt-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-ink-900">
                                            Intervention Details
                                        </h4>
                                        <button
                                            onClick={() =>
                                                setIsExpanded(!isExpanded)
                                            }
                                            className="text-scribe-600 hover:text-scribe-800 text-sm"
                                        >
                                            {isExpanded
                                                ? "Show less"
                                                : "Show more"}
                                        </button>
                                    </div>

                                    {(isExpanded || expanded) && (
                                        <div className="space-y-3">
                                            <div>
                                                <span className="font-medium text-ink-700">
                                                    Suggested Actions:
                                                </span>
                                                <ul className="list-disc list-inside text-ink-600 mt-1 space-y-1">
                                                    {notification.intervention.suggestedActions.map(
                                                        (action, idx) => (
                                                            <li key={idx}>
                                                                {action}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>

                                            {notification.intervention
                                                .deadline && (
                                                <div>
                                                    <span className="font-medium text-ink-700">
                                                        Deadline:{" "}
                                                    </span>
                                                    <span className="text-ink-600">
                                                        {new Date(
                                                            notification.intervention.deadline
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}

                                            {notification.intervention
                                                .resolvedAt && (
                                                <div className="bg-branch-50 border border-branch-200 rounded p-2">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <CheckCircle
                                                            size={16}
                                                            className="text-branch-600"
                                                        />
                                                        <span className="font-medium text-branch-800">
                                                            Resolved
                                                        </span>
                                                    </div>
                                                    <p className="text-branch-700 text-sm">
                                                        {
                                                            notification
                                                                .intervention
                                                                .resolution
                                                        }
                                                    </p>
                                                    {notification.intervention
                                                        .actionsTaken &&
                                                        notification
                                                            .intervention
                                                            .actionsTaken
                                                            .length > 0 && (
                                                            <div className="mt-2">
                                                                <span className="font-medium text-branch-700">
                                                                    Actions
                                                                    Taken:
                                                                </span>
                                                                <ul className="list-disc list-inside text-branch-600 text-sm mt-1">
                                                                    {notification.intervention.actionsTaken.map(
                                                                        (
                                                                            action,
                                                                            idx
                                                                        ) => (
                                                                            <li
                                                                                key={
                                                                                    idx
                                                                                }
                                                                            >
                                                                                {
                                                                                    action
                                                                                }
                                                                            </li>
                                                                        )
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        )}
                                                </div>
                                            )}

                                            {!notification.intervention
                                                .resolvedAt &&
                                                notification.category ===
                                                    "educational_intervention" &&
                                                showActions && (
                                                    <div className="space-y-2">
                                                        {!showResolveForm ? (
                                                            <button
                                                                onClick={() =>
                                                                    setShowResolveForm(
                                                                        true
                                                                    )
                                                                }
                                                                className="px-3 py-1 bg-branch-600 text-white text-sm rounded hover:bg-branch-700"
                                                            >
                                                                Mark as Resolved
                                                            </button>
                                                        ) : (
                                                            <div className="bg-ink-50 border rounded p-3 space-y-3">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-ink-700 mb-1">
                                                                        Resolution
                                                                        Description
                                                                    </label>
                                                                    <textarea
                                                                        value={
                                                                            resolution
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            setResolution(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        className="w-full px-3 py-2 border border-ink-300 rounded-md text-sm"
                                                                        rows={2}
                                                                        placeholder="Describe how this intervention was resolved..."
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-medium text-ink-700 mb-1">
                                                                        Actions
                                                                        Taken
                                                                    </label>
                                                                    {actionsTaken.map(
                                                                        (
                                                                            action,
                                                                            index
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    index
                                                                                }
                                                                                className="flex space-x-2 mb-2"
                                                                            >
                                                                                <input
                                                                                    type="text"
                                                                                    value={
                                                                                        action
                                                                                    }
                                                                                    onChange={(
                                                                                        e
                                                                                    ) =>
                                                                                        updateAction(
                                                                                            index,
                                                                                            e
                                                                                                .target
                                                                                                .value
                                                                                        )
                                                                                    }
                                                                                    className="flex-1 px-3 py-1 border border-ink-300 rounded text-sm"
                                                                                    placeholder="Action taken..."
                                                                                />
                                                                                {actionsTaken.length >
                                                                                    1 && (
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            removeAction(
                                                                                                index
                                                                                            )
                                                                                        }
                                                                                        className="text-ember-600 hover:text-ember-800"
                                                                                    >
                                                                                        <X
                                                                                            size={
                                                                                                16
                                                                                            }
                                                                                        />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    )}
                                                                    <button
                                                                        onClick={
                                                                            addActionField
                                                                        }
                                                                        className="text-scribe-600 hover:text-scribe-800 text-sm"
                                                                    >
                                                                        + Add
                                                                        action
                                                                    </button>
                                                                </div>

                                                                <div className="flex space-x-2">
                                                                    <button
                                                                        onClick={
                                                                            handleResolve
                                                                        }
                                                                        disabled={
                                                                            !resolution.trim()
                                                                        }
                                                                        className="px-3 py-1 bg-branch-600 text-white text-sm rounded hover:bg-branch-700 disabled:opacity-50"
                                                                    >
                                                                        Save
                                                                        Resolution
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            setShowResolveForm(
                                                                                false
                                                                            )
                                                                        }
                                                                        className="px-3 py-1 bg-ink-300 text-ink-700 text-sm rounded hover:bg-ink-400"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {notification.actionUrl && (
                                <div className="mt-2">
                                    <a
                                        href={notification.actionUrl}
                                        className="inline-flex items-center space-x-1 text-scribe-600 hover:text-scribe-800 text-sm"
                                    >
                                        <span>Take Action</span>
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            )}
                        </div>

                        {showActions && (
                            <div className="flex flex-col space-y-2 ml-4">
                                {notification.status === "unread" &&
                                    onMarkAsRead && (
                                        <button
                                            onClick={() =>
                                                onMarkAsRead(notification._id)
                                            }
                                            className="text-scribe-600 hover:text-scribe-800 p-1"
                                            title="Mark as read"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                {onDelete && (
                                    <button
                                        onClick={() =>
                                            onDelete(notification._id)
                                        }
                                        className="text-ink-400 hover:text-ember-600 p-1"
                                        title="Delete"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
