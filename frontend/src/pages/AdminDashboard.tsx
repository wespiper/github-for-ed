import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { APIEndpointsViewer } from "@/components/admin/APIEndpointsViewer";
import { APITester } from "@/components/admin/APITester";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'api-endpoints' | 'api-tester' | 'users'>('overview');
    const [testEndpointData, setTestEndpointData] = useState<{method: string, path: string} | null>(null);

    const handleTestEndpoint = (method: string, path: string) => {
        setTestEndpointData({ method, path });
        setActiveTab('api-tester');
    };
    
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-ink-900 mb-2">Admin Dashboard</h1>
                <p className="text-ink-600">Welcome, {user?.firstName}! Manage your Scribe Tree platform.</p>
            </div>

            <div className="mb-6">
                <div className="flex space-x-2 border-b">
                    <Button
                        variant={activeTab === 'overview' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('overview')}
                        className="rounded-b-none"
                    >
                        Overview
                    </Button>
                    <Button
                        variant={activeTab === 'api-endpoints' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('api-endpoints')}
                        className="rounded-b-none"
                    >
                        API Endpoints
                    </Button>
                    <Button
                        variant={activeTab === 'api-tester' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('api-tester')}
                        className="rounded-b-none"
                    >
                        API Tester
                    </Button>
                    <Button
                        variant={activeTab === 'users' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('users')}
                        className="rounded-b-none"
                    >
                        Users
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Platform Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-ink-600">API Status:</span>
                                        <span className="text-green-600 font-medium">Online</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-ink-600">Database:</span>
                                        <span className="text-green-600 font-medium">Connected</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={() => setActiveTab('api-endpoints')}
                                    >
                                        View API Endpoints
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={() => setActiveTab('api-tester')}
                                    >
                                        Test API Endpoints
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={() => setActiveTab('users')}
                                    >
                                        Manage Users
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">System Info</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-ink-600">Role:</span>
                                        <span className="font-medium capitalize">{user?.role}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-ink-600">Access Level:</span>
                                        <span className="text-red-600 font-medium">Admin</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'api-endpoints' && (
                    <div>
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold text-ink-900 mb-2">API Endpoints</h2>
                            <p className="text-ink-600">
                                View and explore all available API endpoints in the system. Use this for debugging, 
                                development, and understanding the platform's capabilities.
                            </p>
                        </div>
                        <APIEndpointsViewer onTestEndpoint={handleTestEndpoint} />
                    </div>
                )}

                {activeTab === 'api-tester' && (
                    <div>
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold text-ink-900 mb-2">API Tester</h2>
                            <p className="text-ink-600">
                                Test API endpoints directly from the admin interface with proper authentication. 
                                Perfect for debugging and development without needing external tools.
                            </p>
                        </div>
                        <APITester 
                            initialMethod={testEndpointData?.method}
                            initialPath={testEndpointData?.path}
                        />
                    </div>
                )}

                {activeTab === 'users' && (
                    <div>
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold text-ink-900 mb-2">User Management</h2>
                            <p className="text-ink-600">User management functionality coming soon.</p>
                        </div>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-ink-500 text-center">User management interface is under development.</p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};