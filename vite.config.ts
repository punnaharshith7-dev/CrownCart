import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      // Link previews (WhatsApp, X, Facebook…) need absolute image URLs. On Vercel each copy of the
      // site fills in its own address here; when the API serves the site, server/index.ts does it.
      name: "absolute-preview-images",
      transformIndexHtml(html) {
        const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
        return host ? html.replace(/(content=")\/brand\//g, `$1https://${host}/brand/`) : html;
      },
    },
  ],
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
