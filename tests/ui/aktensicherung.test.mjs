// Hilfe „Akten sichern“ (Klaus 2026-11-05): Orte als Baum, Kästen abhaken (rot → grün → grau), gemerkt nach dem Neuladen,
// Hinweise (⊘) nicht umschaltbar, Weg ins Sicherheitscenter.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, footer, collectErrors } from "./_harness.mjs";
const app = await startApp();
const browser = await launchBrowser();
const oeffnen = async (page) => {
  await footer(page, "Hilfe");
  const d = page.locator("details[data-aktensicherung]");
  if (!(await d.evaluate((e) => e.open))) await d.locator("summary").click();
  return d;
};
try {
  for (const [name, geraet] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const context = await browser.newContext(geraet);
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await footer(page, "Hilfe");
    const d = page.locator("details[data-aktensicherung]");
    check(await d.count() === 1, `${name}: Abschnitt „Akten sichern“ in der Hilfe`);
    check(!(await d.evaluate((e) => e.open)), `${name}: startet zugeklappt`);
    await oeffnen(page);
    const lage = await page.evaluate(() => {
      const knoepfe = [...document.querySelectorAll("[data-sicherung-punkt]")];
      const hinweise = [...document.querySelectorAll("details[data-aktensicherung] .ablauf-knoten.art-aus")];
      return { knoepfe: knoepfe.length, alleRot: knoepfe.every((k) => k.dataset.stand === "offen" && k.classList.contains("art-warnung")),
        hinweise: hinweise.length, hinweiseKeinKnopf: hinweise.every((h) => !h.hasAttribute("data-sicherung-punkt")),
        quer: document.documentElement.scrollWidth - innerWidth };
    });
    check(lage.knoepfe >= 9, `${name}: abhakbare Schritte vorhanden (${lage.knoepfe})`);
    check(lage.alleRot, `${name}: ab Werk alle rot (zu tun)`);
    check(lage.hinweise >= 8 && lage.hinweiseKeinKnopf, `${name}: graue Hinweise sind keine Knöpfe (${lage.hinweise})`);
    check(lage.quer <= 1, `${name}: kein Querlaufen (${lage.quer}px)`);
    if (name === "Desktop") {
      await step("Tipp: rot → grün → grau → rot", async () => {
        const k = page.locator('[data-sicherung-punkt="vollsicherung"]');
        const s = [];
        for (let i = 0; i < 3; i++) { await k.click(); s.push(await k.getAttribute("data-stand")); }
        return s.join(",") === "erledigt,unnoetig,offen";
      });
      await step("Zähler folgt", async () => {
        await page.locator('[data-sicherung-punkt="kopie"]').click();
        return /1 erledigt/.test(await page.locator("[data-sicherung-stand]").innerText());
      });
      await step("Haken bleibt nach dem Neuladen grün", async () => {
        await page.reload({ waitUntil: "networkidle" }); await ready(page); await oeffnen(page);
        const k = page.locator('[data-sicherung-punkt="kopie"]');
        return (await k.getAttribute("data-stand")) === "erledigt" && /✓/.test(await k.innerText());
      });
      await step("Kasten „Pro-Tresor“ führt ins Sicherheitscenter (Karte nur in den Apps)", async () => {
        await page.locator('details[data-aktensicherung] button[data-sicherung-ziel="pro-tresor"]').click();
        await page.waitForTimeout(700);
        const karte = page.locator("[data-pro-tresor]");
        if (await karte.count()) return await karte.first().isVisible();
        return /Sicherheit/.test(await page.locator("h1").first().innerText());
      });
      await step("Mit verbundenem Datentresor: Kasten grün mit Namen und führt zur Akte", async () => {
        await footer(page, "Hilfe"); await oeffnen(page);
        const k = page.locator('details[data-aktensicherung] .aktensicherung-ort > button').first();
        const gruen = await k.evaluate((e) => e.classList.contains("art-gut") && /Verbunden:/.test(e.innerText) && e.dataset.sicherungZiel === "akte");
        if (!gruen) return "nicht grün: " + (await k.innerText());
        await k.click(); await page.waitForTimeout(500);
        return /Dokumente/.test(await page.locator("h1").first().innerText());
      });
      await step("Weg führt ins Sicherheitscenter", async () => {
        await footer(page, "Hilfe"); await oeffnen(page);
        await page.locator("details[data-aktensicherung] .pfadangabe button").click();
        await page.waitForTimeout(700);
        return await page.locator('[data-hilfe-ziel="vollsicherung"]').isVisible();
      });
    }
    check(errors.length === 0, `${name}: keine Seitenfehler`, errors.join(" | "));
    await context.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Aktensicherung"));
