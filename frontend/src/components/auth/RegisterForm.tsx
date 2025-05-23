import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const RegisterForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState<"student" | "educator" | "admin" | "">("");
    const { register, isLoading, registerError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!role) return;

        try {
            await register({
                email,
                password,
                firstName,
                lastName,
                role: role as "student" | "educator" | "admin",
            });
            navigate("/dashboard");
        } catch (error) {
            console.error("Registration failed:", error);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-forest-50 py-8">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-ink-900">
                        Plant Your Words
                    </h1>
                    <p className="text-ink-600 mt-2">
                        Join Scribe Tree and watch your writing flourish
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="firstName"
                                className="block text-sm font-medium text-ink-700 mb-1"
                            >
                                First name
                            </label>
                            <input
                                id="firstName"
                                placeholder="John"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="lastName"
                                className="block text-sm font-medium text-ink-700 mb-1"
                            >
                                Last name
                            </label>
                            <input
                                id="lastName"
                                placeholder="Doe"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-ink-700 mb-1"
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
                            className="block text-sm font-medium text-ink-700 mb-1"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="role"
                            className="block text-sm font-medium text-ink-700 mb-1"
                        >
                            I am a...
                        </label>
                        <Select
                            value={role}
                            onValueChange={(value) =>
                                setRole(
                                    value as "student" | "educator" | "admin"
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="educator">
                                    Educator
                                </SelectItem>
                                <SelectItem value="admin">
                                    Admin (Development)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {registerError && (
                        <div className="text-sm text-ember-600 text-center p-3 bg-ember-50 rounded-md">
                            {(
                                registerError as Error & {
                                    response?: { data?: { error?: string } };
                                }
                            ).response?.data?.error ||
                                (registerError as Error).message ||
                                "Registration failed. Please check your connection and try again."}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !role}
                        className="w-full bg-forest-600 text-white py-2 px-4 rounded-md hover:bg-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Creating account..." : "Create account"}
                    </button>

                    <div className="text-sm text-center text-ink-600">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="text-forest-600 hover:underline"
                        >
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};
