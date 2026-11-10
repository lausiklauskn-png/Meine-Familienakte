#!/usr/bin/env node
// Geschenkbox als EINE Datei zum Herunterladen (Klaus 10.11.2026): die Seite aus docs/geschenk/geschenkbox-pro.html und
// beide Karten als eigene Seiten darin – die Pro-Verbund-Karte (public/pro-verbund/pro-verbund.html, byte-gleich aus BookLedgerPro)
// und die Landkarte der Familienakte (docs/landkarte/Familienakte-Landkarte.html, gebaut von tools/landkarte-datei.mjs).
// Jede Karte steckt unverändert in einem iframe (srcdoc) – so bleibt sie byte-gleich und öffnet nie in einer installierten App.
// Aufruf: node tools/geschenkbox-datei.mjs  →  docs/geschenk/Geschenkbox-Pro-Apps.html
// Beim Veröffentlichen des Artefakts beide Karten als eigene Dateien mitgeben: pro-verbund.html, familienakte-landkarte.html.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const box = readFileSync("docs/geschenk/geschenkbox-pro.html", "utf8");
const ziel = "docs/geschenk/Geschenkbox-Pro-Apps.html";
const KARTEN = [
  { link: "pro-verbund.html", anker: "verbund-karte", titel: "Pro-App-Verbund", datei: "public/pro-verbund/pro-verbund.html" },
  { link: "familienakte-landkarte.html", anker: "landkarte-karte", titel: "Landkarte der Familienakte", datei: "docs/landkarte/Familienakte-Landkarte.html" },
];

const attr = (t) => t.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const titel = box.match(/<title>([^<]*)<\/title>/)?.[1] || "Geschenkbox Pro-Apps";
// Der Knopf „Als eine Datei speichern“ gilt nur online (Artefakt); in der Datei selbst zeigte er auf sich.
let rumpf = box.replace(/<title>[^<]*<\/title>\s*/, "").replace(/<p data-nur-online[^>]*>[\s\S]*?<\/p>\s*<script>[\s\S]*?<\/script>/, "");
for (const k of KARTEN) {
  const alt = `href="${k.link}" target="_blank" rel="noopener"`;
  if (!rumpf.includes(alt)) { console.error(`ABBRUCH: Link auf ${k.link} in der Geschenkbox nicht gefunden.`); process.exit(2); }
  rumpf = rumpf.replace(alt, `href="#${k.anker}"`);
  k.inhalt = readFileSync(k.datei, "utf8");
}
const anker = KARTEN.map((k) => `#${k.anker}`);

const seite = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${titel}</title>
<style>
/* Seiten „Karte“: ganze Höhe, oben ein Zurück-Knopf. */
.karten-seite { display:none; position:fixed; inset:0; background:#f4f7f9; z-index:50; flex-direction:column; }
.karten-seite.an { display:flex; }
.karten-seite .karte-kopf { display:flex; align-items:center; gap:12px; padding:10px 16px; background:#fffcf7; border-bottom:1px solid #d8cfc1; font:600 16px/1.3 system-ui,sans-serif; color:#1e2328; }
.karten-seite .karte-kopf a { text-decoration:none; color:#fff; background:#2f6f73; padding:8px 14px; border-radius:10px; }
.karten-seite iframe { flex:1; width:100%; border:0; background:#fff; }
body.karte-offen > main { display:none; }
</style>
</head>
<body>
${rumpf}
${KARTEN.map((k) => `<section id="${k.anker}" class="karten-seite" aria-label="${k.titel} – Karte">
 <div class="karte-kopf"><a href="#">‹ Zurück zur Geschenkbox</a><span>${k.titel}</span></div>
 <iframe title="${k.titel}" srcdoc="${attr(k.inhalt)}"></iframe>
</section>`).join("\n")}
<script>
(function () {
  var ANKER = ${JSON.stringify(anker)}, y = 0, zuvor = false;
  function zeigen() {
    var an = ANKER.indexOf(location.hash) >= 0;
    ANKER.forEach(function (a) { document.getElementById(a.slice(1)).classList.toggle("an", a === location.hash); });
    document.body.classList.toggle("karte-offen", an);
    if (!an && zuvor) window.scrollTo(0, y || 0);
    zuvor = an;
  }
  window.addEventListener("hashchange", function () { if (ANKER.indexOf(location.hash) >= 0 && !zuvor) y = window.scrollY; zeigen(); });
  zeigen();
})();
</script>
</body>
</html>
`;
writeFileSync(ziel, seite);
const sha = (t) => createHash("sha256").update(t).digest("hex").slice(0, 12);
console.log(`geschrieben: ${ziel} (${Buffer.byteLength(seite)} Bytes) · ${KARTEN.map((k) => `${k.link} ${sha(k.inhalt)}…`).join(" · ")} unverändert`);
