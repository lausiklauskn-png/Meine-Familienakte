// Rücksprung mit Markierung (Plan 07.11.2026, Punkt 4): aus der Hilfe in die App und zurück → derselbe Abschnitt ist offen,
// der angetippte Kasten steht im Bild und ist markiert, bis zum nächsten Tipp.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
const imBild = (page, sel) => page.locator(sel).first().evaluate((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
try {
  for (const [name, geraet] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const context = await browser.newContext(geraet);
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await footer(page, "Hilfe");

    await step(`${name}: „Fristen im Kalender“ → „Kalender verbinden“ → zurück: offen, im Bild, markiert`, async () => {
      const d = page.locator("details[data-kalender-hilfe]");
      await d.locator("summary").click();
      await d.locator(".ablauf-knoten", { hasText: "Kalender verbinden" }).first().click();
      await page.locator("#kalender-verbinden").waitFor();
      await page.waitForTimeout(600);
      await page.goBack();
      await page.waitForSelector("details[data-kalender-hilfe]");
      await page.waitForTimeout(700);
      const offen = await page.locator("details[data-kalender-hilfe]").evaluate((e) => e.open);
      const markiert = page.locator(".zurueck-hier");
      const n = await markiert.count();
      const text = n ? await markiert.first().innerText() : "";
      return offen && n === 1 && /Kalender verbinden/.test(text) && await imBild(page, ".zurueck-hier") ? true : `offen=${offen} markiert=${n} „${text.slice(0, 40)}“`;
    });
    await step(`${name}: Markierung bleibt bis zum nächsten Tipp`, async () => {
      await page.waitForTimeout(400);
      const vorher = await page.locator(".zurueck-hier").count();
      await page.mouse.click(5, 300);
      await page.waitForTimeout(150);
      return vorher === 1 && (await page.locator(".zurueck-hier").count()) === 0;
    });
    await step(`${name}: neues Hilfe-Thema bleibt nach Zurück offen`, async () => {
      const t = page.locator('details[data-hilfe-thema="app-glocke"]');
      await t.locator(":scope > summary").click(); // nur die Überschrift des Themas, nicht die von „Ausführlich“ (Sitzung 4)
      await footer(page, "Interaktives Cockpit");
      await page.goBack();
      await page.waitForSelector('details[data-hilfe-thema="app-glocke"]');
      await page.waitForTimeout(700);
      return await page.locator('details[data-hilfe-thema="app-glocke"]').evaluate((e) => e.open);
    });
    check(errors.length === 0, `${name}: keine Seitenfehler`, errors.join(" | "));
    await context.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Rücksprung"));
