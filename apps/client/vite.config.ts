import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  build: { target: "es2022", sourcemap: true },
  // En développement, l'API et les WebSocket de salon passent par le Worker local (wrangler dev).
  server: { proxy: { "/api": { target: "http://localhost:8787", ws: true } } },
  test: { name: "client", environment: "node" },
});
