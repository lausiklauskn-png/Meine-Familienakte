// „Was ist neu“ (Klaus 10.11.2026): jeder Knopf führt an die genannte Stelle – „E-Mail in der Hilfe“ öffnet das Thema mit der
// E-Mail-Karte, nicht nur die Hilfe. Je Eintrag ein Schritt; das Ziel muss da, aufgeklappt und im Bild sein.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, step, soll, summary, collectErrors, neuKnopf } from "./_harness.mjs";

const ZIELE = {
  "zweiter-ort-2026-11-12": "[data-zweiter-ort]",
  "cloud-ordner-2026-11-12": "[data-cloud-ordner]",
  "email-wege-2026-11-12": "[data-email-wege]",
  "landkarte-farben-2026-11-11": '[data-app-landkarte="offen"]',
};
const app = await startApp();
const browser = await launchBrowser();
try {
  for (const [name, geraet] of (process.env.NUR_HANDY ? [["Handy", HANDY]] : [["Desktop", DESKTOP], ["Handy", HANDY]])) {
    const page = await (await browser.newContext(geraet)).newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    for (const [id, ziel] of Object.entries(ZIELE)) {
      await step(`${name}: „Was ist neu“ › ${id} › Knopf führt zu ${ziel}`, async () => {
        await page.goto(app.base, { waitUntil: "networkidle" }); await page.waitForSelector(".neu-knopf-schalter", { state: "attached" });
        await (await neuKnopf(page)).click();
        const knopf = page.locator(`.neu-eintrag[data-neu="${id}"] button.button`);
        soll(await knopf.count() === 1, `Eintrag ${id} ohne Knopf`);
        await knopf.scrollIntoViewIfNeeded(); await knopf.click({ timeout: 8000 });
        await page.waitForSelector(ziel, { timeout: 8000 });
        await page.waitForTimeout(800);
        const r = await page.evaluate((sel) => { const el = document.querySelector(sel); const b = el.getBoundingClientRect(); return { oben: Math.round(b.top), unten: Math.round(b.bottom), h: innerHeight }; }, ziel);
        return soll(r.oben < r.h && r.unten > 0, r);
      });
    }
    await step(`${name}: keine Fehler in der Konsole`, async () => soll(errors.length === 0, errors));
  }
} finally { await browser.close(); await app.stop(); }
summary("Was ist neu – Ziele");
