// Klaus 2026-11-01 (Antwort 3): Prüfbericht von Workflow PDF (versteckter Text, Anweisungen an eine KI) im Stapel — nur auf Wahl.
// Geprüft: beim Einlesen läuft KEINE Prüfung (der Prüfkern wird nicht einmal geladen) · „Prüfen“ an einer Zeile meldet bei der
// Testdatei aus Workflow PDF („unsichtbarer Text“) einen Befund · „Prüfen (1)“ über die Auswahl meldet ein sauberes PDF als geprüft.
import { readFileSync } from "node:fs";
import path from "node:path";
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, summary, collectErrors, ROOT } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";

const TEST = path.join(ROOT, "public/apps/workflow-pdf/beispiele/Testdatei-unsichtbarer-Text.pdf");
const SAUBER = path.join(ROOT, "tests/testdateien/Garantiebeleg_Waschautomat_Lavorix.pdf");
const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext({ ...DESKTOP, serviceWorkers: "block" })).newPage();
  page.setDefaultTimeout(60000);
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  const kern = [];
  page.on("request", (r) => { if (/pruefer-(anhang|mail|formate)\.js/.test(r.url())) kern.push(r.url()); });
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await step("Zwei PDFs in den Stapel", async () => {
    await footer(page, "Eingangszentrale");
    await page.locator("[data-stapel-start]").setInputFiles([
      { name: "Testdatei-unsichtbarer-Text.pdf", mimeType: "application/pdf", buffer: readFileSync(TEST) },
      { name: "Garantiebeleg.pdf", mimeType: "application/pdf", buffer: readFileSync(SAUBER) }]);
    await page.locator('[data-stapel-lauf="fertig"]').waitFor();
    return true;
  });
  check(kern.length === 0 && await page.locator("[data-stapel-geprueft]").count() === 0, "Beim Einlesen läuft keine Prüfung (Prüfkern nicht geladen)", kern.join(" "));
  await step("„Prüfen“ an der Testdatei: Befund „Unsichtbarer Text“", async () => {
    const z = page.locator("[data-stapel-zeile]", { hasText: "Testdatei-unsichtbarer-Text" });
    await z.locator(".fa-stapel-name").click();
    await z.locator("[data-stapel-pruefen]").click();
    await page.locator('[data-stapel-zeile] [data-stapel-geprueft="warnung"]').waitFor({ timeout: 120000 });
    const b = await page.locator('[data-stapel-bericht="warnung"]').innerText();
    if (!/Unsichtbar|versteckt|KI/i.test(b)) throw new Error(b);
    return b.split("\n")[0];
  });
  await step("Auswahl „Prüfen (1)“ am sauberen PDF: geprüft, kein Befund", async () => {
    await page.locator("[data-stapel-zeile]", { hasText: "Garantiebeleg" }).locator("input[type=checkbox]").check();
    await page.locator("[data-stapel-pruefen-wahl]").click();
    await page.locator("[data-stapel-zeile]", { hasText: "Garantiebeleg" }).locator('[data-stapel-geprueft="sauber"]').waitFor({ timeout: 120000 });
    return true;
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Stapel: Prüfbericht auf Wahl"));
