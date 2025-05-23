import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, isLoading, loginError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ email, password });
            navigate("/dashboard");
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-forest-50">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-ink-900">
                        Return to Your Tree
                    </h1>
                    <p className="text-ink-600 mt-2">
                        Welcome back to your writing grove
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-ink-700 mb-2"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-ink-700 mb-2"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                        />
                    </div>

                    {loginError && (
                        <div className="text-sm text-ember-600 text-center p-3 bg-ember-50 rounded-md">
                            {(
                                loginError as Error & {
                                    response?: { data?: { error?: string } };
                                }
                            ).response?.data?.error ||
                                "Login failed. Please try again."}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-forest-600 text-white py-2 px-4 rounded-md hover:bg-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </button>

                    <div className="text-sm text-center text-ink-600">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            className="text-forest-600 hover:underline"
                        >
                            Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};
