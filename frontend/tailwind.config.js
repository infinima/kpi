export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class",

    theme: {
        screens: {
            sm: "640px",   // телефоны в горизонтали / маленькие планшеты
            md: "768px",   // планшеты
            lg: "1024px",  // обычные ноуты
            xl: "1280px",  // большие мониторы
            "2xl": "1536px",
        },

        extend: {
            fontFamily: {
                nunito: ["Nunito", "sans-serif"],
            },

            colors: {
                primary: {
                    DEFAULT: "#3B82F6",
                    dark: "#1D4ED8",
                    light: "#93C5FD",
                },
                background: "#F8FAFC",
                surface: "#FFFFFF",
                hover: "#F1F5F9",
                border: "#E2E8F0",

                text: {
                    main: "#0F172A",
                    secondary: "#475569",
                    muted: "#94A3B8",
                },

                success: "#10B981",
                warning: "#F59E0B",
                error: "#EF4444",
                info: "#3B82F6",

                dark: {
                    bg: "#0F172A",
                    surface: "#1E293B",
                    border: "#334155",
                    hover: "#1E293B",

                    text: {
                        main: "#F8FAFC",
                        secondary: "#CBD5E1",
                        muted: "#94A3B8",
                    }
                },
            },

            borderRadius: {
                lg: "12px",
                xl: "16px",
            },

            boxShadow: {
                card: "0 2px 8px rgba(0, 0, 0, 0.06)",
            },

            fontSize: {
                h1: ["28px", "36px"],
                h2: ["22px", "30px"],
                h3: ["18px", "26px"],
                body: ["15px", "22px"],
                small: ["13px", "18px"],
            },
        },
    },

    plugins: [],
};