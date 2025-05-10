import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://task-app-backend-r2t0.onrender.com/",
        changeOrigin: true,
      },
    },
  },
});
