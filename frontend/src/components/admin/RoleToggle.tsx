import { useAdmin } from "@/hooks/useAdmin";
import { useAuthStore } from "@/stores/authStore";

export const RoleToggle = () => {
    const { user } = useAuthStore();
    const { toggleMyRole, isTogglingRole, toggleError } = useAdmin();

    if (!user || user.role === "admin") {
        return null; // Don't show toggle for admins or if no user
    }

    const handleToggle = async () => {
        try {
            await toggleMyRole();
        } catch (error) {
            console.error("Role toggle failed:", error);
        }
    };

    const otherRole = user.role === "student" ? "educator" : "student";

    return (
        <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
                Current:{" "}
                <span className="capitalize text-scribe-600">{user.role}</span>
            </span>

            <button
                onClick={handleToggle}
                disabled={isTogglingRole}
                className="px-3 py-1 text-xs bg-ink-200 text-ink-700 rounded hover:bg-ink-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isTogglingRole ? "Switching..." : `Switch to ${otherRole}`}
            </button>

            {toggleError && (
                <span className="text-xs text-ember-600">
                    {typeof toggleError === 'object' && toggleError && 'response' in toggleError ? 
                        (toggleError as { response?: { data?: { error?: string } } }).response?.data?.error || "Toggle failed" :
                        "Toggle failed"}
                </span>
            )}
        </div>
    );
};
