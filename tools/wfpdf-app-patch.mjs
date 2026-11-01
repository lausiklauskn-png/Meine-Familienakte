// tools/wfpdf-app-patch.mjs — die EINE kontrollierte Abweichung des eingebetteten Klons von Workflow PDF (Klaus 2026-11-01,
// Weg B: „einen Klon von WF PDF integrieren in den Farben von Familienakte“). Alle übrigen Dateien unter
// public/apps/workflow-pdf/ sind byte-1:1 (tools/wfpdf-app-nachziehen.mjs, Pins public/apps/HERKUNFT.json).
// Nur index.html wird verändert — reine Funktion, in scripts/run-ausfuellen-tests.mjs geprüft:
//   1. Familienakte-Brücke (public/apps/fa-wfpdf-bruecke.js) als ERSTES Skript im Kopf: eigene Bibliothek und eigene
//      Einstellungen (Klaus: „Ja, getrennt“), kein Service Worker, ⟳ löscht keine fremden Vorräte.
//   2. Familienakte-Farben (public/apps/fa-wfpdf-thema.css) als letztes Stylesheet.
//   3. Keine eigene Service-Worker-Anmeldung (die Dateien kommen aus dem Vorrat der Familienakte).
//   4. Kein Mycel-Knoten (Klaus: „Weglassen“; die Akte hat ihre eigene Netz-Seite): sbkim-init.js wird nicht geladen.
export const BRUECKE_ZEILE = '<script src="../fa-wfpdf-bruecke.js?v=1"></script>';
export const THEMA_ZEILE = '<link rel="stylesheet" href="../fa-wfpdf-thema.css?v=1">';
export const SW_ERSATZ = "<!-- Familienakte: kein eigener Service Worker im Klon — der Vorrat kommt von der Familienakte (public/apps/HERKUNFT.json) -->";
export const MYCEL_ERSATZ = "<!-- Familienakte: kein Mycel-Knoten im Klon — die Akte hat ihre eigene Netz-Seite -->";

const CHARSET = '<meta charset="utf-8">';
const SW_ZEILE = /<script>if\('serviceWorker' in navigator&&location\.protocol==='https:'\)navigator\.serviceWorker\.register\('sw\.js'\)\.catch\(function\(\)\{\}\);<\/script>/;
const MYCEL_ZEILE = /<script defer src="assets\/sbkim-init\.js\?v=\d+"><\/script>/;

/** @returns {{html:string, aenderungen:string[]}} wirft, wenn eine Stelle fehlt (dann ist Workflow PDF anders gebaut — nicht raten). */
export function patchIndex(html) {
  const s = String(html);
  if (!s.includes(CHARSET)) throw new Error("index.html: <meta charset> fehlt");
  if (!s.includes("</head>")) throw new Error("index.html: </head> fehlt");
  if (!SW_ZEILE.test(s)) throw new Error("index.html: Service-Worker-Anmeldung nicht gefunden");
  if (!MYCEL_ZEILE.test(s)) throw new Error("index.html: sbkim-init.js nicht gefunden");
  if (s.includes(BRUECKE_ZEILE) || s.includes(THEMA_ZEILE)) throw new Error("index.html: ist schon gepatcht");
  let out = s.replace(CHARSET, CHARSET + "\n" + BRUECKE_ZEILE);
  out = out.replace(SW_ZEILE, SW_ERSATZ);
  out = out.replace(MYCEL_ZEILE, MYCEL_ERSATZ);
  out = out.replace("</head>", THEMA_ZEILE + "\n</head>");
  return { html: out, aenderungen: ["Brücke als erstes Skript", "Familienakte-Farben als letztes Stylesheet", "Service-Worker-Anmeldung entfernt", "Mycel-Knoten (sbkim-init.js) entfernt"] };
}

/** Prüft eine gepatchte index.html: alle vier Abweichungen da, Brücke vor jedem anderen Skript. */
export function istGepatcht(html) {
  const s = String(html);
  const ersteSkript = s.indexOf("<script");
  return s.includes(BRUECKE_ZEILE) && s.includes(THEMA_ZEILE) && s.includes(SW_ERSATZ) && s.includes(MYCEL_ERSATZ)
    && !/serviceWorker\.register/.test(s) && !/<script[^>]*sbkim-init\.js/.test(s) && ersteSkript === s.indexOf(BRUECKE_ZEILE)
    && s.lastIndexOf("<link rel=\"stylesheet\"") === s.indexOf(THEMA_ZEILE);
}
