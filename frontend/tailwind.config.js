export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class",

    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: "#3B82F6",
                    light: "#93C5FD",
                    dark: "#1D4ED8",
                },

                base: "#F8FAFC",
                panel: "#FFFFFF",
                hover: "#F1F5F9",
                border: "#E2E8F0",

                text: {
                    base: "#0F172A",
                    secondary: "#475569",
                    muted: "#94A3B8",
                },

                popup: "#FFFFFF",

                dark: {
                    base: "#0F172A",
                    panel: "#1E293B",
                    hover: "#334155",
                    border: "#475569",

                    text: {
                        base: "#F8FAFC",
                        secondary: "#CBD5E1",
                        muted: "#94A3B8",
                    },

                    popup: "#1E293B",
                },

                success: "#10B981",
                warning: "#F59E0B",
                error: "#EF4444",
                info: "#3B82F6",
            },

            boxShadow: {
                card: "0 2px 8px rgba(0,0,0,0.06)",
                popup: "0 4px 16px rgba(0,0,0,0.12)",
            },

            borderRadius: {
                lg: "12px",
                xl: "16px",
            },
        },
    },
    plugins: [],
};