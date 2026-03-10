import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
// mode "firebase" → base "/" (Firebase Hosting, cross-platform via --mode flag)
// default mode    → "/SARASVA/" (GitHub Pages)
// CI override still supported via VITE_BASE env var
const base = (mode === "firebase" || process.env.VITE_BASE === "/") ? "/" : "/SARASVA/";

return {
  base,
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
        start_url: base,
        scope: base,
        icons: [
          { src: "logo.png", sizes: "64x64 192x192 512x512", type: "image/png" },
          { src: "logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Do NOT precache HTML — let NetworkFirst handle it so updates are instant
        globPatterns: ["**/*.{js,css,ico,png,svg,woff,woff2}"],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [new RegExp(`^${base.replace(/\//g, "\\/")}assets\\/`)],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
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
      "/api": { target: "http://localhost:5000", changeOrigin: true },
    },
  },
}; // end return
}); // end defineConfig
