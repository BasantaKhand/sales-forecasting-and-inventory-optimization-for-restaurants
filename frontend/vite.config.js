import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server runs on port 3000 to match the backend CORS allow-list.
// All /api requests are proxied to the Flask backend on port 5000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
