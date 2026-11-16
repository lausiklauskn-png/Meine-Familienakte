// Macht aus dist/ die offline-fähige PWA: Service Worker mit Vorratsliste und Versionsstempel,
// version.json für die Update-Anzeige, Bau-Kennung in index.html. Läuft nach `vite build`.
// Aufruf: node scripts/build-pwa.mjs   (Teil von `npm run build`)
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

function git(args, fallback) { try { return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim(); } catch { return fallback; } }
const commit = process.env.FAMILIENAKTE_COMMIT || git(["rev-parse", "HEAD"], "0000000000000000000000000000000000000000");
const count = Number(process.env.FAMILIENAKTE_BUILD_NUMBER || git(["rev-list", "--count", "HEAD"], "0"));
const date = (process.env.FAMILIENAKTE_BUILD_DATE || git(["log", "-1", "--format=%cs"], new Date().toISOString().slice(0, 10)));

function files(dir, prefix = "") {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name), rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(full).isDirectory()) out.push(...files(full, rel));
    else if (!["sw.js", "version.json"].includes(rel) && !rel.endsWith(".map")) out.push(rel);
  }
  return out.sort();
}
const list = files(dist);
const hash = createHash("sha256");
for (const rel of list) hash.update(rel).update(readFileSync(path.join(dist, rel)));
const build = `${count}.${hash.digest("hex").slice(0, 8)}`;

// Texterkennung (21 MB) und Blatterkennung (3,5 MB) von Workflow PDF kommen nicht in den Installations-Vorrat: der Worker legt sie
// beim ersten Gebrauch ab (Sitzung F). Sonst lüde jede Installation und jedes Update 25 MB.
// Seit 2026-11-01 liegen beide nur noch im Klon von Workflow PDF (apps/workflow-pdf/vendor/).
// Discovery (Hilfe › Discovery, Fernrohr im Kopf): alle Filme (.mp4, rund 44 MB) und die Tonspuren (discovery-ton/, 2 MB) kommen
// ebenfalls erst beim Gebrauch in den Vorrat – die Regel gilt für jede .mp4/.mp3 unter discovery/, nicht für eine feste Liste.
// Seite, three.js und Standbilder (rund 3 MB) liegen vorab bereit. In APK und Windows liegt ohnehin alles im Paket.
const vorrat = list.filter((f) => !/^apps\/workflow-pdf\/vendor\/(tesseract|scanic)\//.test(f) && !/^discovery\/(.*\.(mp4|mp3)$|discovery-ton\/)/.test(f));
const version = { version: pkg.version, build, commit, date, files: list.length, vorrat: vorrat.length };
writeFileSync(path.join(dist, "version.json"), JSON.stringify(version, null, 2) + "\n");

const sw = `/* Familienakte Service Worker – erzeugt von scripts/build-pwa.mjs, nicht von Hand ändern. */
const VORRAT = "familienakte-${build}";
const DATEIEN = ${JSON.stringify(vorrat.map((f) => `./${f}`))};
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VORRAT).then((cache) => cache.addAll(DATEIEN)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith("familienakte-") && name !== VORRAT) await caches.delete(name);
    await self.clients.claim();
  })());
});
// Ton und Film fragen mit „Range“ nach Teilen; aus dem Vorrat kommt dann der gewünschte Ausschnitt (206), sonst spielt Safari nichts.
async function ausschnitt(antwort, bereich) {
  const m = /^bytes=(\\d*)-(\\d*)$/.exec(bereich.trim());
  if (!m || (!m[1] && !m[2])) return antwort;
  const daten = await antwort.arrayBuffer(), n = daten.byteLength;
  const a = m[1] ? Number(m[1]) : Math.max(0, n - Number(m[2])), e = m[1] && m[2] ? Math.min(Number(m[2]), n - 1) : n - 1;
  if (a >= n || a > e) return new Response(null, { status: 416, headers: { "content-range": "bytes */" + n } });
  return new Response(daten.slice(a, e + 1), { status: 206, headers: { "content-type": antwort.headers.get("content-type") || "application/octet-stream", "content-range": "bytes " + a + "-" + e + "/" + n, "content-length": String(e - a + 1), "accept-ranges": "bytes" } });
}
const unterwegs = new Set();
self.addEventListener("message", (event) => { if (event.data?.typ === "jetzt-aktivieren") self.skipWaiting(); });
// Nur der eigene Ursprung kommt aus dem Vorrat; fremde Adressen gehen unverändert durch (der Internetschalter der Seite entscheidet).
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Teilen → Familienakte (share_target): Dateien in den Vorrat „familienakte-geteilt“, dann zur App.
  if (event.request.method === "POST" && url.origin === self.location.origin && url.pathname.endsWith("/teilen-empfang")) {
    event.respondWith((async () => {
      try {
        const form = await event.request.formData();
        const cache = await caches.open("familienakte-geteilt");
        let n = 0;
        for (const entry of form.getAll("dateien")) {
          if (!(entry instanceof File)) continue;
          await cache.put(new Request(new URL(\`./geteilt/\${Date.now()}-\${n++}\`, self.registration.scope).href), new Response(entry, { headers: { "content-type": entry.type || "application/octet-stream", "x-name": encodeURIComponent(entry.name || "Geteilte Datei") } }));
        }
        const text = form.get("text") || form.get("title");
        if (!n && typeof text === "string" && text.trim()) { await cache.put(new Request(new URL(\`./geteilt/\${Date.now()}-text\`, self.registration.scope).href), new Response(text, { headers: { "content-type": "text/plain", "x-name": encodeURIComponent((form.get("title") || "Geteilter Text") + ".txt") } })); n++; }
        return Response.redirect(new URL(\`./?geteilt=\${n ? 1 : 0}\`, self.registration.scope).href, 303);
      } catch { return Response.redirect(new URL("./?geteilt=fehler", self.registration.scope).href, 303); }
    })());
    return;
  }
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/version.json")) { event.respondWith(fetch(event.request).catch(() => new Response("{}", { headers: { "content-type": "application/json" } }))); return; }
  event.respondWith((async () => {
    const cache = await caches.open(VORRAT);
    // Eingebettete Apps (apps/…, z. B. der Klon von Workflow PDF), die Karte des Pro-App-Verbunds (pro-verbund/) und Discovery (discovery/) sind eigene Seiten:
    // dort NICHT die Akte ausliefern.
    const eigeneSeite = url.pathname.startsWith(new URL("./apps/", self.registration.scope).pathname) || url.pathname.startsWith(new URL("./pro-verbund/", self.registration.scope).pathname) || url.pathname.startsWith(new URL("./discovery/", self.registration.scope).pathname) || url.pathname.endsWith("/datenschutz.html");
    const key = event.request.mode === "navigate" && !eigeneSeite ? new Request(new URL("./index.html", self.registration.scope).href) : event.request;
    const hit = await cache.match(key, { ignoreSearch: true, ignoreVary: true });
    const bereich = event.request.headers.get("range");
    if (hit) return bereich && hit.status === 200 ? ausschnitt(hit, bereich) : hit;
    try {
      // Teilantworten (206) lassen sich nicht ablegen: Ton und Film von Discovery holt der Worker daneben einmal ganz in den Vorrat.
      // Ein Film fragt mehrmals nach Teilen: je Adresse läuft nur ein Abruf der ganzen Datei zugleich.
      if (bereich && url.pathname.startsWith(new URL("./discovery/", self.registration.scope).pathname) && !unterwegs.has(url.href)) { unterwegs.add(url.href); event.waitUntil(fetch(url.href).then((ganz) => ganz.status === 200 ? cache.put(url.href, ganz) : undefined).catch(() => undefined).finally(() => unterwegs.delete(url.href))); }
      const antwort = await fetch(event.request); if (antwort.status === 200 && url.pathname.startsWith(new URL(self.registration.scope).pathname)) cache.put(event.request, antwort.clone()); return antwort;
    }
    catch (error) { const index = await cache.match(new URL("./index.html", self.registration.scope).href); if (index && event.request.mode === "navigate" && !eigeneSeite) return index; throw error; }
  })());
});
`;
writeFileSync(path.join(dist, "sw.js"), sw);

const indexPath = path.join(dist, "index.html");
let html = readFileSync(indexPath, "utf8");
html = html.replace(/<meta name="familienakte-(build|version)" content="[^"]*">\s*/g, "");
html = html.replace("</head>", `  <meta name="familienakte-version" content="${pkg.version}">\n    <meta name="familienakte-build" content="${build}">\n  </head>`);
writeFileSync(indexPath, html);
console.log(`PWA vorbereitet: Fassung ${pkg.version}, Bau ${build}, ${list.length} Dateien im Vorrat, Quelle ${commit.slice(0, 7)} (${date})`);
