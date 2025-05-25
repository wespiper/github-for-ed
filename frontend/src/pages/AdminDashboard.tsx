import { useAuth } from "@/hooks/useAuth";

export const AdminDashboard = () => {
    const { user } = useAuth();
    
    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-ink-900 mb-4">Admin Dashboard</h1>
            <p className="text-ink-600 mb-4">Welcome, {user?.firstName}!</p>
            <p className="text-ink-500">Admin functionality is under construction.</p>
        </div>
    );
};