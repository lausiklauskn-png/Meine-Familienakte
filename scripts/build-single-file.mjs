// Fasst den fertigen Build (dist/) zu einer einzigen HTML-Datei zusammen:
// JavaScript, CSS und Symbol werden eingebettet. So lässt sich die App als eine Datei
// weitergeben oder als einzelne Seite veröffentlichen (z. B. als Link auf claude.ai).
// Aufruf nach „npm run build“: node scripts/build-single-file.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const html = readFileSync(join(dist, "index.html"), "utf8");
const scriptPath = html.match(/<script type="module"[^>]*src="\.\/([^"]+)"/)?.[1];
const stylePath = html.match(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"/)?.[1];
if (!scriptPath || !stylePath) throw new Error("Im Build wurden Skript oder Stylesheet nicht gefunden.");

const script = readFileSync(join(dist, scriptPath), "utf8").replaceAll("</script", "<\\/script");
const style = readFileSync(join(dist, stylePath), "utf8").replaceAll("</style", "<\\/style");
const icon = `data:image/svg+xml;base64,${readFileSync(join(dist, "favicon.svg")).toString("base64")}`;

// Seiteninhalt ohne eigenes <html>/<head>/<body>: Die Plattform ergänzt das Grundgerüst.
const page = `<title>Meine Familienakte</title>
<meta name="description" content="Privater Aktenschrank für Gesundheit, Arbeit, Familie, Wohnen, Fahrzeuge, Käufe, Garantien und wichtige Unterlagen. Alle Daten sind Beispieldaten.">
<link rel="icon" type="image/svg+xml" href="${icon}">
<style>
${style}
</style>
<div id="root"></div>
<script>document.body.classList.add("antialiased");</script>
<script type="module">
${script}
</script>
`;

const outDir = join(root, "dist-single");
mkdirSync(outDir, { recursive: true });
const target = join(outDir, "meine-familienakte.html");
writeFileSync(target, page);
console.log(`Einzeldatei geschrieben: ${target} (${(page.length / 1024 / 1024).toFixed(2)} MB)`);
