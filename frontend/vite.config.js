import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"; // 👈 добавляем для работы alias

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 5173,
        strictPort: true,
        proxy: {
            "/api": {
                target: "https://api.dev.kpiturnir.ru",
                changeOrigin: true,
                rewrite: (url) => url.replace(/^\/api/, ""),
            },
        },
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
    },
    optimizeDeps: {
        include: ["react-pdf"]
    }
});