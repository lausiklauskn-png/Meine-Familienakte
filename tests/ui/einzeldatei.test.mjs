// Einzeldatei von der Platte (Klaus 2026-10-29: „PWA mit auf die Festplatte … in jedem Browser öffnen“): öffnet
// dist-single/meine-familienakte.html per file:// und prüft, dass die App wirklich erscheint (nichts nachgeladen) und dass
// Ordnerwahl und Verschlüsselung des Browsers dort verfügbar sind. Baut die Einzeldatei, wenn sie fehlt.
import { existsSync } from "node:fs";
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
  check(!errors.some((e) => /CORS|ERR_FAILED|Failed to load/.test(e)), "keine blockierten Nachlade-Versuche", errors.join(" | ").slice(0, 300));
} finally { await browser.close(); }
process.exit(summary("Einzeldatei"));
