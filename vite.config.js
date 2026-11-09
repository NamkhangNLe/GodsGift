import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages serves this app under /GodsGift/, so all built asset paths
  // must be prefixed with the subpath. Without this, a clean `vite build`
  // emits absolute /assets/... paths that 404 on Pages.
  base: "/GodsGift/",
  server: {
    port: 5173,
    proxy: {
      "/parse-pdf": "http://localhost:3000",
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/parse-pdf": "http://localhost:3000",
    },
  },
});
