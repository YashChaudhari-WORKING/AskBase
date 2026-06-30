import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    // Alias React → Preact/compat to ship a much smaller runtime (~3x lighter).
    // Order matters: the more specific jsx-runtime keys must precede "react".
    resolve: {
      alias: {
        "react/jsx-runtime": "preact/jsx-runtime",
        "react/jsx-dev-runtime": "preact/jsx-dev-runtime",
        "react-dom/client": "preact/compat",
        "react-dom/test-utils": "preact/test-utils",
        "react-dom": "preact/compat",
        react: "preact/compat",
      },
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env": "{}",
      // Bake the API URL into the bundle at build time
      "import.meta.env.VITE_API_URL": JSON.stringify(
        env.VITE_API_URL ?? "https://api.askbase.io"
      ),
    },
    build: {
      lib: {
        entry: "src/main.tsx",
        name: "AskBaseWidget",
        fileName: "widget",
        formats: ["iife"],
      },
      rollupOptions: {
        external: [],
      },
      // Minify for CDN delivery
      minify: "terser",
    },
  };
});
