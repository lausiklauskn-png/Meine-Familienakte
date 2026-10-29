import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Reine Browser-App: keine Serverfunktionen, kein bestimmter Hosting-Anbieter.
// Relative Pfade, damit der gebaute Ordner „dist“ überall abgelegt werden kann.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  server: { port: 5173 },
  build: {
    // E1: React und die Symbole als eigener Vendor-Teil; der Service Worker cacht ihn über Updates hinweg.
    // Einzeldatei (scripts/build-single-file.mjs, FAMILIENAKTE_EINZELDATEI=1): alles in einem Block. Von der Platte (file://)
    // verbietet der Browser das Nachladen weiterer Teile; mit Code-Splitting blieb die Seite dort leer.
    rollupOptions: { output: process.env.FAMILIENAKTE_EINZELDATEI === "1" ? { inlineDynamicImports: true } : { manualChunks(id) {
      if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
      if (id.includes("node_modules/lucide-react/")) return "icons";
      return undefined;
    } } },
    chunkSizeWarningLimit: 900,
  },
});
