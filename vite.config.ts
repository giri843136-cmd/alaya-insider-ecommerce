import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// Bundle analyzer (rollup-plugin-visualizer) — optional dependency
let visualizer: any = () => null;
try {
  visualizer = (await import("rollup-plugin-visualizer")).visualizer;
} catch {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Bundle analyzer — run with ANALYZE=true to see bundle breakdown
    process.env.ANALYZE ? visualizer({
      filename: "dist/stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
    }) : null,
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        // manualChunks strategy:
        //  - vendor-react: ALL npm dependencies bundled together
        //  - vendor-icons: lucide-react (large icon library, separate)
        //
        // A single vendor-react chunk eliminates the circular dependency
        // warning (vendor-other -> vendor-react -> vendor-other) because
        // some packages in vendor-other depend on React, and some React-
        // ecosystem packages depend on utilities that would otherwise
        // land in vendor-other. Merging them avoids the cycle entirely.
        manualChunks(id) {
          // IMPORTANT: Lucide check MUST come before the node_modules
          // catch-all below, otherwise lucide-react gets merged into
          // vendor-react instead of its own vendor-icons chunk.
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-icons";
          }
          // react-router-dom is large and changes independently from React
          if (id.includes("node_modules/react-router-dom/")) {
            return "vendor-router";
          }
          // All other npm dependencies bundled together to avoid
          // circular dependency between vendor-other and vendor-react.
          if (id.includes("node_modules/")) {
            return "vendor-react";
          }
          // NOT grouping admin-pages or context manually —
          // React.lazy() dynamic imports in App.tsx already create
          // granular per-page chunks via Vite's natural code splitting.
        },
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Generate source maps for production debugging
    sourcemap: process.env.SOURCEMAP === "true",
    // Minify with esbuild (fastest)
    minify: "esbuild",
    // Target modern browsers for smaller bundles
    target: "es2020",
    // Chunk size warning
    chunkSizeWarningLimit: 500,
  },



  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "lucide-react", "clsx", "tailwind-merge"],
  },
});
