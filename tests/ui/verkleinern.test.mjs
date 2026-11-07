// P4 (Plan 07.11., Punkt 1): Foto über der Gerätegrenze verkleinern, nie unter 300 dpi, mit Texterkennungs-Gegenprobe.
// Gerät gestellt: 2 GB Arbeitsspeicher → sichere Größe 15 MB. Das Testfoto (erfundener Text, Rauschen) hat etwa 16 MB.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { startApp, launchBrowser, DESKTOP, ready, footer, step, fail, summary, collectErrors, ROOT } from "./_harness.mjs";

const LAUFZEIT = path.join(ROOT, "tests/testdateien/.laufzeit");
mkdirSync(LAUFZEIT, { recursive: true });
const FOTO = path.join(LAUFZEIT, "Foto_Garantie_gross.jpg");
const app = await startApp();
const browser = await launchBrowser();
if (!existsSync(FOTO)) {
  const p = await browser.newPage();
  const b64 = await p.evaluate(async () => {
    const W = 4600, H = 6500, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.fillStyle = "#111"; x.font = "64px serif";
    const w = "Rechnung Garantie Waschautomat Lavorix Kundennummer Betrag Datum Zahlung Ueberweisung Bestellung Lieferung Wohnung Vertrag".split(" ");
    for (let y = 200, i = 0; y < H - 200; y += 110) { let line = ""; for (let k = 0; k < 9; k++) line += w[(i++ * 7) % w.length] + " "; x.fillText(line, 200, y); }
    let s = 7; const zufall = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
    const d = x.getImageData(0, 0, W, H); for (let i = 0; i < d.data.length; i += 4) { const n = (zufall() - 0.5) * 70; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; } x.putImageData(d, 0, 0);
    const bl = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.95));
    const u = new Uint8Array(await bl.arrayBuffer()); let t = ""; for (let i = 0; i < u.length; i += 8192) t += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(t);
  });
  writeFileSync(FOTO, Buffer.from(b64, "base64")); await p.close();
}
const context = await browser.newContext(DESKTOP);
await context.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, "deviceMemory", { get: () => 2, configurable: true }); } catch { /* Probe */ } });
const page = await context.newPage(); page.setDefaultTimeout(8000);
const errors = collectErrors(page);
try {
  await step("Eingangszentrale öffnen", async () => { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await footer(page, "Eingangszentrale"); await page.locator("h1", { hasText: "Eingangszentrale" }).waitFor(); });
  const box = page.locator(".intake-modal [data-zu-gross]");
  await step("Foto über 15 MB: Ansage nennt Dateigröße und sichere Größe", async () => {
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([FOTO]);
    const item = page.locator(".intake-queue-item", { hasText: "Foto Garantie gross" }).first(); await item.waitFor();
    await item.locator("button", { hasText: "Zuordnung prüfen" }).click();
    const text = await box.innerText({ timeout: 20000 });
    if (!/Dieses Gerät schafft sicher 15 MB\./.test(text) || !/300 dpi/.test(text)) throw new Error(text);
    return text.split("\n")[0];
  });
  await step("Verkleinern: Qualität zuerst, Texterkennung prüft beide Fassungen, Notiz am Eintrag", async () => {
    await box.locator("[data-verkleinern]").click();
    const notiz = await page.locator(".intake-modal [data-verkleinert]").innerText({ timeout: 300000 });
    if (!/^verkleinert von 16 MB, Text geprüft$/.test(notiz)) throw new Error(notiz);
    if (await box.count()) throw new Error("Ansage bleibt nach dem Verkleinern");
    const name = await page.locator(".intake-modal .drop-zone strong").innerText();
    const groesse = await page.locator(".intake-modal .drop-zone span").first().innerText();
    if (!/\.jpg$/.test(name)) throw new Error(name);
    return `${name} · ${groesse} · ${notiz}`;
  });
  await step("Speichern legt die kleine Fassung mit der Notiz ab", async () => {
    await page.locator(".intake-modal button[type=submit]").click();
    await page.locator(".intake-modal").waitFor({ state: "detached", timeout: 30000 });
    const doc = page.locator(".document-item", { hasText: "Foto_Garantie_gross" }).first(); await doc.waitFor({ timeout: 20000 });
    const text = (await doc.innerText()).replace(/\s+/g, " ");
    if (!text.includes("verkleinert von 16 MB, Text geprüft")) throw new Error(text.slice(0, 300));
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); if (e.length) throw new Error(e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Verkleinern"));
