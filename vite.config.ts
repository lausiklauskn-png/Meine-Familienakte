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
});
