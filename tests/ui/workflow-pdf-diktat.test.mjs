// Diktat im Klon von Workflow PDF (Klaus 2026-11-24, Galaxy Z Fold 7: Mikrofon „nicht erkannt“). Die WebView der App hat keine
// eigene Spracherkennung; die Akte setzt dafür das Sprachfenster des Systems ein (native/familienakte-android.js, Marke
// FamilienakteDiktat). Geprüft: im Rahmen nimmt der Klon dasselbe (Brücke) · Mikrofon der Bibliothek-Suche schreibt das Gehörte ins
// Feld und hört über die Akte · ohne Marke (Browser) bleibt die eigene Spracherkennung des Rahmens.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors } from "./_harness.mjs";

const zumKlon = async (page) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".main-navigation .nav-cluster > button", { hasText: "Dokumente" }).first().click({ force: true });
  await page.locator(".mega-menu button", { hasText: "Workflow PDF" }).first().click();
  await page.locator("[data-wfpdf-seite]").waitFor();
  await page.frameLocator("[data-wfpdf-rahmen]").locator("#sc-bib").waitFor({ timeout: 30000 });
  return page.frames().find((x) => x.url().includes("/apps/workflow-pdf/"));
};
// Wie familienakte-android.js mit ProSpeech: hört einmal zu (oneShot), nur im Hauptfenster.
const SPRACHFENSTER = () => {
  if (window.parent !== window) return;
  window.__gehoert = [];
  class SprachFenster {
    constructor() { this.lang = "de-DE"; this.oneShot = true; this.onstart = this.onend = this.onresult = this.onerror = null; this._stop = false; }
    start() { this._stop = false; this.onstart?.(); window.__gehoert.push(this.lang);
      setTimeout(() => { if (this._stop) return; this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: "Waschautomat" }], { isFinal: true, length: 1 })] }); this.onend?.(); }, 80); }
    stop() { this._stop = true; this.onend?.(); }
    abort() { this.stop(); }
  }
  window.SpeechRecognition = SprachFenster; window.webkitSpeechRecognition = SprachFenster;
  window.FamilienakteDiktat = { offlineFaehig: true, art: "android-sprachfenster" };
};

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext({ ...DESKTOP, serviceWorkers: "block" });
  await context.addInitScript(SPRACHFENSTER);
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  let klon;
  await step("Workflow PDF im Rahmen öffnen", async () => { klon = await zumKlon(page); return !!klon; });
  check(await klon.evaluate(() => window.webkitSpeechRecognition === window.parent.webkitSpeechRecognition && window.SpeechRecognition === window.parent.SpeechRecognition),
    "Klon nimmt das Sprachfenster der Akte");
  await step("Mikrofon der Suche: Gehörtes steht im Feld, gehört hat die Akte", async () => {
    await klon.locator("#bibMic").click();
    await klon.waitForFunction(() => document.getElementById("bibSuche")?.value === "Waschautomat", null, { timeout: 5000 });
    const n = await page.evaluate(() => window.__gehoert.length);
    if (n !== 1) throw new Error("Sprachfenster " + n + "-mal geöffnet");
    return true;
  });
  check(errors.length === 0, "Keine Fehler in der Seite", errors.slice(0, 2).join(" | "));

  // Gegenprobe Browser: ohne Marke behält der Rahmen seine eigene Spracherkennung.
  const ohne = await browser.newContext({ ...DESKTOP, serviceWorkers: "block" });
  const p2 = await ohne.newPage(); p2.setDefaultTimeout(20000);
  await p2.goto(app.base, { waitUntil: "networkidle" }); await ready(p2);
  const k2 = await zumKlon(p2);
  check(await k2.evaluate(() => !window.parent.FamilienakteDiktat && window.webkitSpeechRecognition !== window.parent.webkitSpeechRecognition),
    "Im Browser (ohne Sprachfenster) bleibt die eigene Spracherkennung des Rahmens");
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Workflow PDF – Diktat über die Akte"));
