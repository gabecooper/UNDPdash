import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react-vendor";
          }

          if (id.includes("node_modules/recharts")) {
            return "recharts-vendor";
          }

          if (id.includes("/src/components/charts/")) {
            return "chart-ui";
          }

          if (id.includes("/src/components/tables/") || id.includes("/src/components/sections/")) {
            return "data-ui";
          }

          return undefined;
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
});
