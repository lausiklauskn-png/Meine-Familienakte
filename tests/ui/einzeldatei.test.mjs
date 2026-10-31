// Einzeldatei von der Platte (Klaus 2026-10-29: „PWA mit auf die Festplatte … in jedem Browser öffnen“): öffnet
// dist-single/meine-familienakte.html per file:// und prüft, dass die App wirklich erscheint (nichts nachgeladen) und dass
// Ordnerwahl und Verschlüsselung des Browsers dort verfügbar sind. Baut die Einzeldatei, wenn sie fehlt.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { launchBrowser, DESKTOP, check, step, summary, collectErrors } from "./_harness.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const datei = path.join(root, "dist-single/meine-familienakte.html");
if (!existsSync(datei) || process.env.UI_BUILD === "1") {
  if (!existsSync(path.join(root, "dist/index.html"))) spawnSync("npx", ["vite", "build"], { cwd: root, stdio: "inherit" });
  spawnSync(process.execPath, [path.join(root, "scripts/build-single-file.mjs")], { cwd: root, stdio: "inherit" });
}
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage();
  const errors = collectErrors(page);
  await page.goto("file://" + datei);
  await step("Von der Platte geöffnet: die Startseite erscheint (kein Nachladen weiterer Teile)", async () => {
    await page.waitForFunction(() => document.querySelectorAll("button").length > 5, null, { timeout: 15000 });
    const text = await page.evaluate(() => document.body.innerText);
    if (!/FAMILIENAKTE/i.test(text)) throw new Error(`kein App-Inhalt: ${text.slice(0, 120)}`);
    return `${await page.locator("button").count()} Knöpfe`;
  });
  await step("Dort verfügbar: sicherer Kontext, Ordnerwahl und Verschlüsselung (AES-GCM) des Browsers", async () => {
    const r = await page.evaluate(async () => {
      const k = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt"]);
      await crypto.subtle.encrypt({ name: "AES-GCM", iv: new Uint8Array(12) }, k, new Uint8Array(4));
      return { secure: isSecureContext, picker: typeof window.showDirectoryPicker };
    });
    if (!r.secure || r.picker !== "function") throw new Error(JSON.stringify(r));
    return "isSecureContext, showDirectoryPicker, AES-GCM";
  });
  // Stück 1b (Klaus 2026-10-31, Frage 4 aus Sitzung F): Kern fürs Ausfüllen eingebettet, byte-1:1, ohne Scanner/Texterkennung.
  const html = readFileSync(datei, "utf8");
  const kern = ["pdf-lib.min.js", "export.js", "erkennung.js", "reinigung.js", "schluesseltresor.js"];
  const fehlt = kern.filter((n) => !html.includes(readFileSync(path.join(root, "public/wfpdf", n), "utf8")));
  check(fehlt.length === 0, "Kern von Workflow PDF fürs Ausfüllen steht byte-gleich in der Einzeldatei", fehlt.length ? `fehlt: ${fehlt.join(", ")}` : `${kern.length} Dateien`);
  check(!html.includes(readFileSync(path.join(root, "public/wfpdf/scanner.js"), "utf8")), "Scanner und Texterkennung bleiben draußen (Größe)");
  await step("Von der Platte: Kern ist geladen und rechnet (PDF anlegen, Linien erkennen)", async () => {
    const r = await page.evaluate(async () => {
      const W = window;
      const doc = await W.PDFLib.PDFDocument.create(); doc.addPage([200, 200]); const bytes = await doc.save();
      const c = document.createElement("canvas"); c.width = 400; c.height = 200; const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, 400, 200); g.fillStyle = "#000"; g.fillRect(60, 100, 280, 2);
      const felder = W.WFP.Erkennung.linienErkennung(g.getImageData(0, 0, 400, 200));
      return { pdf: bytes.length, export: typeof W.WFP.Export?.exportieren, reinigung: typeof W.WFP.Reinigung?.versteckt, schloss: typeof W.WERKSTATT_SCHLUESSEL?.zu, felder: felder.length };
    });
    if (!(r.pdf > 100 && r.export === "function" && r.reinigung === "function" && r.schloss === "function" && r.felder >= 1)) throw new Error(JSON.stringify(r));
    return `PDF ${r.pdf} B, ${r.felder} Linie erkannt`;
  });
  check(!errors.some((e) => /CORS|ERR_FAILED|Failed to load/.test(e)), "keine blockierten Nachlade-Versuche", errors.join(" | ").slice(0, 300));
} finally { await browser.close(); }
process.exit(summary("Einzeldatei"));
