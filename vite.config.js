import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon-32.png", "apple-touch-icon.png"],
            manifest: {
                name: "PrepCare — Adaptive Interview Practice & Screening",
                short_name: "PrepCare",
                description: "Conversational AI interviews that adapt to what candidates actually say, with transcript-cited scoring.",
                theme_color: "#14162B",
                background_color: "#FAF7F1",
                display: "standalone",
                start_url: "/",
                scope: "/",
                icons: [
                    {
                        src: "/icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "/icon-maskable-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
            },
            workbox: {
                // Don't try to precache/serve API calls to Supabase while offline —
                // this app needs a live connection for auth, data, and the AI
                // interview engine, so we only cache the app's own static assets.
                navigateFallbackDenylist: [/^\/functions\//, /^\/rest\//, /^\/auth\//],
            },
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 5173,
    },
});
