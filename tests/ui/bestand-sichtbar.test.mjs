// „Bestand prüfen“: Die drei Schritte Quelle · Analyse · Archiv müssen ohne Expertenmodus sichtbar sein.
// Befund 2026-11-04: seit #11 (B2, 2026-10-28) lagen sie mit den Testwerkzeugen im versteckten Expertenbereich;
// die Seite zeigte in PWA, APK und Windows-App nur die Überschrift.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, footer, collectErrors } from "./_harness.mjs";
const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  check(await page.evaluate(() => localStorage.getItem("familienakte-experte")) !== "1", "Ohne Expertenmodus gestartet");
  await step("Bestand prüfen zeigt Quelle, Analyse und Archiv", async () => {
    await footer(page, "Bestand prüfen");
    const schritte = page.locator(".inventory-steps"); await schritte.waitFor({ timeout: 10000 });
    const t = await schritte.innerText();
    return ["1 · Quelle", "2 · Analyse", "3 · Archiv"].every((w) => t.toUpperCase().includes(w.toUpperCase())) ? t.split("\n")[0] : false;
  });
  await step("Testwerkzeuge bleiben ohne Expertenmodus verborgen", async () => (await page.locator(".test-workspace-card").count()) === 0);
  check(errors.length === 0, "Keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Bestand prüfen sichtbar"));
