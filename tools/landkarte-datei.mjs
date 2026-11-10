#!/usr/bin/env node
// Landkarte der App als EINE Datei mit Funktion (Klaus 10.11.2026): Tipp auf einen Kasten zeigt die Wege, Legende als Knöpfe.
// Baut app/landkarte-allein.tsx (dieselbe Komponente und Listen wie in der App) ohne Code-Splitting und bettet Skript und CSS ein.
// Aufruf: node tools/landkarte-datei.mjs  →  docs/landkarte/Familienakte-Landkarte.html
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "vite";

const aus = "node_modules/.landkarte-bau";
const ziel = "docs/landkarte/Familienakte-Landkarte.html";
const fassung = JSON.parse(readFileSync("package.json", "utf8")).version;
rmSync(aus, { recursive: true, force: true });
process.env.FAMILIENAKTE_EINZELDATEI = "1"; // vite.config.ts: alles in einem Block
process.env.VITE_FA_FASSUNG = fassung;
await build({ configFile: "vite.config.ts", publicDir: false, logLevel: "warn",
  build: { outDir: aus, emptyOutDir: true, modulePreload: false, rollupOptions: { input: "tools/landkarte/landkarte.html" } } });
const html = readFileSync(join(aus, "tools/landkarte/landkarte.html"), "utf8");
const js = html.match(/<script type="module"[^>]*src="([^"]+)"/)?.[1];
const css = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"/)?.[1];
if (!js || !css) { console.error("ABBRUCH: Skript oder CSS im Bau nicht gefunden."); process.exit(2); }
const lies = (p) => readFileSync(join(aus, "tools/landkarte", p), "utf8");
const skript = lies(js).replaceAll("</script", "<\\/script");
const stil = lies(css).replaceAll("</style", "<\\/style");
const seite = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Familienakte – Landkarte der App</title>
<style>
${stil}
.landkarte-allein { max-width: none; padding: 16px; display: grid; gap: 10px; }
.landkarte-allein-kopf h1 { margin: 0; font-size: 1.25rem; color: #0b3154; }
.landkarte-allein-kopf p { margin: 4px 0 0; color: #4f6472; }
body { background: #f2f7fa; }
</style>
</head>
<body class="antialiased">
<div id="root"></div>
<script type="module">
${skript}
</script>
</body>
</html>
`;
mkdirSync("docs/landkarte", { recursive: true });
writeFileSync(ziel, seite);
rmSync(aus, { recursive: true, force: true });
console.log(`geschrieben: ${ziel} (${Buffer.byteLength(seite)} Bytes, Fassung ${fassung})`);
