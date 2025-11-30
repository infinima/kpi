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
                target: "http://localhost:3000",
                changeOrigin: true,
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