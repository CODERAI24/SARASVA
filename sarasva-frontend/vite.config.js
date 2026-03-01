import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  base: "/SARASVA/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon.svg", "logo.png", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "Sarasva",
        short_name: "Sarasva",
        description: "Academic tracker — attendance, exams, timetable & tasks",
        theme_color: "#6366f1",
        background_color: "#0f0e17",
        display: "standalone",
        start_url: "/SARASVA/",
        scope: "/SARASVA/",
        icons: [
          {
            src: "logo.png",
            sizes: "64x64 192x192 512x512",
            type: "image/png",
          },
          {
            src: "logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // Force new SW to activate immediately — no waiting for tabs to close
        skipWaiting: true,
        clientsClaim: true,
        // Re-check for updates every time the app is opened
        navigateFallback: "/SARASVA/index.html",
        navigateFallbackDenylist: [/^\/SARASVA\/assets\//],
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
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
