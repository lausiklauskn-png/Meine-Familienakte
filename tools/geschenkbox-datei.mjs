#!/usr/bin/env node
// Geschenkbox als EINE Datei zum Herunterladen (Klaus 10.11.2026): die Seite aus docs/geschenk/geschenkbox-pro.html und
// die Pro-Verbund-Karte (public/pro-verbund/pro-verbund.html, byte-gleich aus BookLedgerPro) als eigene Seite darin.
// Die Karte steckt unverändert in einem iframe (srcdoc) – so bleibt sie byte-gleich und öffnet nie in einer installierten App.
// Aufruf: node tools/geschenkbox-datei.mjs  →  docs/geschenk/Geschenkbox-Pro-Apps.html
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const box = readFileSync("docs/geschenk/geschenkbox-pro.html", "utf8");
const karte = readFileSync("public/pro-verbund/pro-verbund.html", "utf8");
const ziel = "docs/geschenk/Geschenkbox-Pro-Apps.html";

if (!box.includes('href="pro-verbund.html"')) { console.error("ABBRUCH: Link auf pro-verbund.html in der Geschenkbox nicht gefunden."); process.exit(2); }
const attr = (t) => t.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const titel = box.match(/<title>([^<]*)<\/title>/)?.[1] || "Geschenkbox Pro-Apps";
// Der Knopf „Als eine Datei speichern“ gilt nur online (Artefakt); in der Datei selbst zeigte er auf sich.
const rumpf = box.replace(/<title>[^<]*<\/title>\s*/, "").replace(/<p data-nur-online[^>]*>[\s\S]*?<\/p>\s*<script>[\s\S]*?<\/script>/, "").replace('href="pro-verbund.html" target="_blank" rel="noopener"', 'href="#verbund-karte"');

const seite = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${titel}</title>
<style>
/* Seite „Karte“: ganze Höhe, oben ein Zurück-Knopf. */
#verbund-karte { display:none; position:fixed; inset:0; background:#f4f7f9; z-index:50; flex-direction:column; }
#verbund-karte.an { display:flex; }
#verbund-karte .karte-kopf { display:flex; align-items:center; gap:12px; padding:10px 16px; background:#fffcf7; border-bottom:1px solid #d8cfc1; font:600 16px/1.3 system-ui,sans-serif; color:#1e2328; }
#verbund-karte .karte-kopf a { text-decoration:none; color:#fff; background:#2f6f73; padding:8px 14px; border-radius:10px; }
#verbund-karte iframe { flex:1; width:100%; border:0; background:#fff; }
body.karte-offen > main { display:none; }
</style>
</head>
<body>
${rumpf}
<section id="verbund-karte" aria-label="Pro-App-Verbund – Karte">
 <div class="karte-kopf"><a href="#">‹ Zurück zur Geschenkbox</a><span>Pro-App-Verbund</span></div>
 <iframe title="Pro-App-Verbund" srcdoc="${attr(karte)}"></iframe>
</section>
<script>
(function () {
  var s = document.getElementById("verbund-karte");
  function zeigen() { var an = location.hash === "#verbund-karte"; s.classList.toggle("an", an); document.body.classList.toggle("karte-offen", an); if (!an && zeigen.zuvor) window.scrollTo(0, zeigen.y || 0); zeigen.zuvor = an; }
  window.addEventListener("hashchange", function () { if (location.hash === "#verbund-karte") zeigen.y = window.scrollY; zeigen(); });
  zeigen();
})();
</script>
</body>
</html>
`;
writeFileSync(ziel, seite);
const sha = (t) => createHash("sha256").update(t).digest("hex");
console.log(`geschrieben: ${ziel} (${Buffer.byteLength(seite)} Bytes) · Karte darin ${sha(karte).slice(0, 12)}… unverändert`);
