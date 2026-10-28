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

const version = { version: pkg.version, build, commit, date, files: list.length };
writeFileSync(path.join(dist, "version.json"), JSON.stringify(version, null, 2) + "\n");

const sw = `/* Familienakte Service Worker – erzeugt von scripts/build-pwa.mjs, nicht von Hand ändern. */
const VORRAT = "familienakte-${build}";
const DATEIEN = ${JSON.stringify(list.map((f) => `./${f}`))};
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VORRAT).then((cache) => cache.addAll(DATEIEN)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith("familienakte-") && name !== VORRAT) await caches.delete(name);
    await self.clients.claim();
  })());
});
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
    const key = event.request.mode === "navigate" ? new Request(new URL("./index.html", self.registration.scope).href) : event.request;
    const hit = await cache.match(key, { ignoreSearch: true, ignoreVary: true });
    if (hit) return hit;
    try { const antwort = await fetch(event.request); if (antwort.ok && url.pathname.startsWith(new URL(self.registration.scope).pathname)) cache.put(event.request, antwort.clone()); return antwort; }
    catch (error) { const index = await cache.match(new URL("./index.html", self.registration.scope).href); if (index && event.request.mode === "navigate") return index; throw error; }
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
