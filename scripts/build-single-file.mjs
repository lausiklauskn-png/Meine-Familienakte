// Fasst den fertigen Build (dist/) zu einer einzigen HTML-Datei zusammen:
// JavaScript, CSS und Symbol werden eingebettet. So lässt sich die App als eine Datei
// weitergeben oder als einzelne Seite veröffentlichen (z. B. als Link auf claude.ai).
// Aufruf nach „npm run build“: node scripts/build-single-file.mjs
// Eigener Bau ohne Code-Splitting nach dist-einzel/ (FAMILIENAKTE_EINZELDATEI=1): von der Platte (file://) darf eine Seite
// keine weiteren Skriptteile nachladen. Geprüft von tests/ui/einzeldatei.test.mjs (öffnet die Datei per file://).
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist-einzel");
rmSync(dist, { recursive: true, force: true });
const bau = spawnSync("npx", ["vite", "build", "--outDir", "dist-einzel", "--emptyOutDir"], { cwd: root, stdio: "inherit", env: { ...process.env, FAMILIENAKTE_EINZELDATEI: "1" } });
if (bau.status !== 0) throw new Error("Bau der Einzeldatei fehlgeschlagen.");
const html = readFileSync(join(dist, "index.html"), "utf8");
const scriptPath = html.match(/<script type="module"[^>]*src="\.\/([^"]+)"/)?.[1];
const stylePath = html.match(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"/)?.[1];
if (!scriptPath || !stylePath) throw new Error("Im Build wurden Skript oder Stylesheet nicht gefunden.");
// Kein Nachladen weiterer Teile: sonst bleibt die Seite von der Platte leer.
if ((html.match(/<script type="module"/g) || []).length !== 1 || /rel="modulepreload"/.test(html)) throw new Error("Einzeldatei-Bau enthält mehrere Skriptteile.");

// U+FFFD (Ersatzzeichen) kommt nur in Zeichenketten der Textprüfung vor; als Escape-Folge
// bleibt die Bedeutung gleich und die Datei enthält kein Ersatzzeichen mehr.
const script = readFileSync(join(dist, scriptPath), "utf8").replaceAll("</script", "<\\/script").replaceAll("\uFFFD", "\\uFFFD");
const style = readFileSync(join(dist, stylePath), "utf8").replaceAll("</style", "<\\/style");
const icon = `data:image/svg+xml;base64,${readFileSync(join(dist, "favicon.svg")).toString("base64")}`;
// pdf.js (A8) liegt im Paket; in der Einzeldatei wird es eingebettet, damit die PDF-Vorschau auch dort ohne Netz geht.
// Hülle (Internetschalter, Hinweisleiste): dieselben Skripte wie in index.html, eingebettet. Ohne Service Worker (Einzeldatei).
const huelle = ["native/familienakte-netz.js", "native/native-network.js", "native/25_pseudonym.js", "native/familienakte-app.js"].map((name) => readFileSync(join(dist, name), "utf8").replaceAll("</script", "<\\/script")).join("\n");
const huelleStyle = readFileSync(join(dist, "native/familienakte-app.css"), "utf8").replaceAll("</style", "<\\/style");
const pdfjs = ["pdf.min.js", "pdf.worker.min.js"].map((name) => readFileSync(join(dist, "vendor/pdfjs", name), "utf8").replaceAll("</script", "<\\/script")).join("\n");

// Seiteninhalt ohne eigenes <html>/<head>/<body>: Die Plattform ergänzt das Grundgerüst.
const page = `<title>Meine Familienakte</title>
<meta name="description" content="Privater Aktenschrank für Gesundheit, Arbeit, Familie, Wohnen, Fahrzeuge, Käufe, Garantien und wichtige Unterlagen. Alle Daten sind Beispieldaten.">
<link rel="icon" type="image/svg+xml" href="${icon}">
<style>
${style}
${huelleStyle}
</style>
<div id="root"></div>
<script>document.body.classList.add("antialiased");</script>
<script>
${huelle}
</script>
<script>
${pdfjs}
</script>
<script type="module">
${script}
</script>
`;

const outDir = join(root, "dist-single");
mkdirSync(outDir, { recursive: true });
const target = join(outDir, "meine-familienakte.html");
writeFileSync(target, page);
console.log(`Einzeldatei geschrieben: ${target} (${(page.length / 1024 / 1024).toFixed(2)} MB)`);
