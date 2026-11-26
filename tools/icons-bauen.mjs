// App-Symbol „Familienakte“ (Klaus 26.11.2026): Basic (Web-App, PWA) und Pro (Android, Windows) sind auf den ersten Blick zu
// unterscheiden. Klaus: „Die PWAs haben keinen Farbverlauf in ihrem Icon. Die APK und die Pro-Version von Windows haben einen
// Farbverlauf“, von der Mitte nach außen dunkler, wie Workflow PDF und Datei-Organizer. Bis dahin war es genau vertauscht: das
// maskable-Symbol der PWA war dunkel (Android nimmt es für die installierte Web-App), die Pro-App hell ohne Verlauf.
// Eine Quelle für alles; das Zeichen sind die vier Kacheln aus public/favicon.svg (unverändert, gleiche Farben).
// Bauart wie Datei-Organizer scripts/symbol-bauen.mjs (dort gebaut am 14./17.11.2026).
// Aufruf: node tools/icons-bauen.mjs --vorschau <ziel.png>   |   node tools/icons-bauen.mjs --schreiben
// Ersetzt die alte Fassung dieser Datei (nur PWA; das maskable-Symbol war dunkel #0b3154 und damit das vertauschte).
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
const req = createRequire(import.meta.url);
let pw; try { pw = req("playwright"); } catch { pw = req("/opt/node-tools/node_modules/playwright"); }

// Die vier Kacheln aus public/favicon.svg (24er Raster), Farben wie dort
const KACHELN = [
  ["M22 19.2727C22 20.779 20.779 22 19.2727 22H14.7273C13.221 22 12 20.779 12 19.2727V12H19.2727C20.779 12 22 13.221 22 14.7273V19.2727Z", "#68C4FF"],
  ["M20 2C21.1046 2 22 2.89543 22 4V7C22 8.10457 21.1046 9 20 9H17C15.8954 9 15 8.10457 15 7V4C15 2.89543 15.8954 2 17 2H20Z", "#0C79D8"],
  ["M7 15C8.10457 15 9 15.8954 9 17V20C9 21.1046 8.10457 22 7 22H4C2.89543 22 2 21.1046 2 20V17C2 15.8954 2.89543 15 4 15H7Z", "#0C79D8"],
  ["M12 12H4.72727C3.22104 12 2 10.779 2 9.27273V4.72727C2 3.22104 3.22104 2 4.72727 2H9.27273C10.779 2 12 3.22104 12 4.72727V12Z", "#2E9EFF"],
];

/** form: "kachel" (gerundetes Quadrat), "rund" (Kreis), "voll" (randlos, maskable), "vorne" (nur Zeichen, Android-Vordergrund), "hinten" (nur Grund)
 *  variante: "pro" (Verlauf, von der Mitte nach außen dunkler) | "basic" (hell, ohne Verlauf) */
export function symbolSvg(form = "kachel", g = 1024, variante = "pro") {
  const basic = variante === "basic";
  const r = form === "rund" ? g / 2 : g * 0.22, randlos = form === "hinten" || form === "voll";
  const flaeche = form === "vorne" ? "" : `
  <rect width="${g}" height="${g}" rx="${randlos ? 0 : r}" fill="${basic ? "#f2f7fa" : "url(#verlauf)"}"/>
  ${basic ? "" : `<rect width="${g}" height="${g}" rx="${randlos ? 0 : r}" fill="url(#glanz)"/>`}`;
  const anteil = { vorne: 0.5, voll: 0.56, rund: 0.56 }[form] ?? 0.62, s = (g * anteil) / 20, x0 = (g - 20 * s) / 2 - 2 * s, y0 = (g - 20 * s) / 2 - 2 * s;
  const zeichen = form === "hinten" ? "" : `
  ${basic ? "" : `<g transform="translate(${x0} ${y0 + 0.5 * s}) scale(${s})" opacity="0.45" filter="url(#weich)">${KACHELN.map(([d]) => `<path d="${d}" fill="#020d18"/>`).join("")}</g>`}
  <g transform="translate(${x0} ${y0}) scale(${s})">${KACHELN.map(([d, f]) => `<path d="${d}" fill="${f}"/>`).join("")}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g} ${g}" width="${g}" height="${g}">
  <defs>
    <radialGradient id="verlauf" cx="0.5" cy="0.5" r="0.72">
      <stop offset="0" stop-color="#1f5d96"/><stop offset="0.55" stop-color="#103f6c"/><stop offset="1" stop-color="#061c33"/>
    </radialGradient>
    <radialGradient id="glanz" cx="0.3" cy="0.12" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="0.6" stop-color="#ffffff" stop-opacity="0.03"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="weich" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="0.45"/></filter>
  </defs>${flaeche}${zeichen}
</svg>`;
}

async function bild(seite, svg, b) {
  await seite.setViewportSize({ width: b, height: b });
  await seite.setContent(`<html><body style="margin:0;background:transparent">${svg.replace(/width="\d+" height="\d+"/, `width="${b}" height="${b}"`)}</body></html>`);
  return seite.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: b, height: b } });
}

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const browser = await pw.chromium.launch();
const seite = await browser.newPage({ deviceScaleFactor: arg("--vorschau") ? 2 : 1 });
if (arg("--vorschau")) {
  const b64 = (svg) => "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
  const fig = (src, px, t) => `<figure style="margin:0;text-align:center"><img src="${src}" width="${px}" height="${px}"><figcaption>${t}</figcaption></figure>`;
  const alt = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");
  const zeile = (grund, schrift) => `<div style="display:flex;gap:30px;align-items:flex-end;padding:24px 30px;background:${grund};color:${schrift};font:600 14px system-ui">
    ${fig(alt("public/icons/icon-maskable-512.png"), 110, "bisher Web-App")}
    ${fig(alt("android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"), 110, "bisher Pro")}
    <span style="width:2px;align-self:stretch;background:${schrift};opacity:.25"></span>
    ${fig(b64(symbolSvg("kachel", 512, "basic")), 110, "neu Basic (Web-App)")}
    ${fig(b64(symbolSvg("kachel", 512)), 110, "neu Pro (Windows)")}
    ${fig(b64(symbolSvg("rund", 512)), 110, "neu Pro (Android)")}
    ${fig(b64(symbolSvg("kachel", 512)), 40, "klein")}</div>`;
  await seite.setViewportSize({ width: 1000, height: 400 });
  await seite.setContent(`<html><body style="margin:0">${zeile("#eef3f7", "#15283a")}${zeile("#1f2430", "#e6edf3")}</body></html>`);
  await seite.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth));
  writeFileSync(arg("--vorschau"), await seite.screenshot({ fullPage: true }));
} else if (process.argv.includes("--schreiben")) {
  const schreibe = (p, b) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, b); console.log(p); };
  // Basic (Web-App): hell, ohne Verlauf — auch das maskable-Symbol, das Android für die installierte Web-App nimmt
  schreibe("public/icons/icon-192.png", await bild(seite, symbolSvg("kachel", 1024, "basic"), 192));
  schreibe("public/icons/icon-512.png", await bild(seite, symbolSvg("kachel", 1024, "basic"), 512));
  schreibe("public/icons/icon-maskable-512.png", await bild(seite, symbolSvg("voll", 1024, "basic"), 512));
  schreibe("public/icons/apple-touch-icon.png", await bild(seite, symbolSvg("voll", 1024, "basic"), 180));
  // Pro (Android): Verlauf
  const dichten = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [d, px] of Object.entries(dichten)) {
    const ordner = join("android/app/src/main/res", `mipmap-${d}`), v = Math.round(px * 108 / 48);
    schreibe(join(ordner, "ic_launcher.png"), await bild(seite, symbolSvg("kachel"), px));
    schreibe(join(ordner, "ic_launcher_round.png"), await bild(seite, symbolSvg("rund"), px));
    schreibe(join(ordner, "ic_launcher_foreground.png"), await bild(seite, symbolSvg("vorne"), v));
    schreibe(join(ordner, "ic_launcher_background.png"), await bild(seite, symbolSvg("hinten"), v));
  }
  // Pro (Windows): Verlauf; icon.ico wird danach aus icon.png gebaut (Python/PIL, Grössen 16–256)
  schreibe("windows/src-tauri/icons/32x32.png", await bild(seite, symbolSvg("kachel"), 32));
  schreibe("windows/src-tauri/icons/128x128.png", await bild(seite, symbolSvg("kachel"), 128));
  schreibe("windows/src-tauri/icons/128x128@2x.png", await bild(seite, symbolSvg("kachel"), 256));
  schreibe("windows/src-tauri/icons/icon.png", await bild(seite, symbolSvg("kachel"), 512));
}
await browser.close();
