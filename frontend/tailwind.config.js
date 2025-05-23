/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                // Branch & Word Brand Colors
                forest: {
                    50: "#f0f7ed",
                    100: "#deecd6",
                    200: "#bfd9b1",
                    300: "#9bc084",
                    400: "#77a45d",
                    500: "#5a8a40",
                    600: "#2d5016", // Primary brand color dark green
                    700: "#234012",
                    800: "#1a300e",
                    900: "#11200a",
                    950: "#081005",
                },
                branch: {
                    50: "#ecfdf5",
                    100: "#d1fae5",
                    200: "#a7f3d0",
                    300: "#6ee7b7",
                    400: "#34d399",
                    500: "#10b981", // Branch Green - success/growth
                    600: "#059669",
                    700: "#047857",
                    800: "#065f46",
                    900: "#064e3b",
                    950: "#022c22",
                },
                scribe: {
                    50: "#eff6ff",
                    100: "#dbeafe",
                    200: "#bfdbfe",
                    300: "#93c5fd",
                    400: "#60a5fa",
                    500: "#3b82f6", // Scribe Blue - communication/process
                    600: "#2563eb",
                    700: "#1d4ed8",
                    800: "#1e40af",
                    900: "#1e3a8a",
                    950: "#172554",
                },
                highlight: {
                    50: "#fffbeb",
                    100: "#fef3c7",
                    200: "#fde68a",
                    300: "#fcd34d",
                    400: "#fbbf24",
                    500: "#f59e0b", // Highlight Gold - achievements
                    600: "#d97706",
                    700: "#b45309",
                    800: "#92400e",
                    900: "#78350f",
                    950: "#451a03",
                },
                ember: {
                    50: "#fef2f2",
                    100: "#fee2e2",
                    200: "#fecaca",
                    300: "#fca5a5",
                    400: "#f87171",
                    500: "#ef4444", // Main ember red - error, warning, urgent, destructive
                    600: "#dc2626",
                    700: "#b91c1c",
                    800: "#991b1b",
                    900: "#7f1d1d",
                    950: "#450a0a",
                },
                // Enhanced Grays (replacing default gray)
                ink: {
                    50: "#f9fafb",
                    100: "#f3f4f6",
                    200: "#e5e7eb",
                    300: "#d1d5db",
                    400: "#9ca3af",
                    500: "#6b7280", // Warm Gray
                    600: "#4b5563",
                    700: "#374151",
                    800: "#1f2937",
                    900: "#111827", // Ink Black
                    950: "#030712",
                },
                // ShadCN compatibility - map to our brand colors
                border: "#e5e7eb", // ink-200
                input: "#e5e7eb", // ink-200
                ring: "#2d5016", // forest-600
                background: "#ffffff",
                foreground: "#111827", // ink-900
                primary: {
                    DEFAULT: "#2d5016", // forest-600
                    foreground: "#ffffff",
                },
                secondary: {
                    DEFAULT: "#f3f4f6", // ink-100
                    foreground: "#111827", // ink-900
                },
                destructive: {
                    DEFAULT: "#ef4444",
                    foreground: "#ffffff",
                },
                muted: {
                    DEFAULT: "#f3f4f6", // ink-100
                    foreground: "#6b7280", // ink-500
                },
                accent: {
                    DEFAULT: "#f3f4f6", // ink-100
                    foreground: "#111827", // ink-900
                },
                popover: {
                    DEFAULT: "#ffffff",
                    foreground: "#111827", // ink-900
                },
                card: {
                    DEFAULT: "#ffffff",
                    foreground: "#111827", // ink-900
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [],
};
