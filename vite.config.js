import { defineConfig } from "vite";

export default defineConfig({
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
