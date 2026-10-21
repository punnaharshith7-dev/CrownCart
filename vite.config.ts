import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      // The API runs separately (npm run dev:api); the browser only ever talks to this origin.
      "/api": { target: "http://localhost:8787", changeOrigin: false },
      "/sitemap.xml": "http://localhost:8787",
      "/robots.txt": "http://localhost:8787",
    },
  },
});
