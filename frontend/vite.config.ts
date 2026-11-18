/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  build: {
    rollupOptions: {
      output: {
        // Bibliotecas grandes e estáveis em arquivos próprios: ficam em cache entre deploys do app.
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) {
            return "react";
          }

          if (/node_modules\/(@mui|@emotion)\//.test(id)) {
            return "mui";
          }

          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api-backend": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-backend/, ""),
      },
    },
  },
});
