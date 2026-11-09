// Hilfe-Thema „Pro-App-Verbund (Vorschau)“ (Klaus 09.11.2026): Karte aus BookLedgerPro (public/pro-verbund/, byte-gleich) im
// Vollbild-Rahmen über der App. Geprüft: Thema da, Tipp öffnet den Rahmen, im Rahmen steht die Karte (#graph), Schließen/Esc/Zurück.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, soll, summary, footer, collectErrors } from "./_harness.mjs";
const app = await startApp();
const browser = await launchBrowser();
try {
  for (const [name, geraet] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const context = await browser.newContext(geraet);
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await footer(page, "Hilfe");
    const thema = page.locator("details[data-pro-verbund-hilfe]");
    check(await thema.count() === 1, `${name}: Thema „Pro-App-Verbund (Vorschau)“ steht in der Hilfe`);
    await step(`${name}: Tipp auf „Karte öffnen“ öffnet den Vollbild-Rahmen mit der Karte (#graph)`, async () => {
      await thema.locator("summary").click();
      await thema.locator("[data-pro-verbund-oeffnen]").click();
      const rahmen = page.locator("[data-pro-verbund-rahmen]");
      await rahmen.waitFor({ state: "visible", timeout: 5000 });
      const mass = await rahmen.evaluate((r) => { const b = r.getBoundingClientRect(); return { b: b.width, h: b.height, w: innerWidth, H: innerHeight }; });
      soll(mass.b >= mass.w - 1 && mass.h >= mass.H - 1, mass);
      const frame = page.frameLocator("iframe[data-pro-verbund-frame]");
      await frame.locator("#graph").waitFor({ state: "attached", timeout: 8000 });
      const kanten = await frame.locator("#graph *").count();
      return soll(kanten > 0, `#graph leer (${kanten})`);
    });
    await step(`${name}: Schließen nimmt den Rahmen weg, die Hilfe bleibt stehen`, async () => {
      await page.locator("[data-pro-verbund-schliessen]").click();
      await page.locator("[data-pro-verbund-rahmen]").waitFor({ state: "detached", timeout: 3000 });
      return soll(await thema.isVisible(), "Hilfe-Thema nicht mehr sichtbar");
    });
    await step(`${name}: Zurück (wie Android-Zurück) und Esc schließen den Rahmen`, async () => {
      await thema.locator("[data-pro-verbund-oeffnen]").click();
      await page.locator("[data-pro-verbund-rahmen]").waitFor({ state: "visible", timeout: 3000 });
      const verbraucht = await page.evaluate(() => window.familienakteZurueck?.());
      await page.locator("[data-pro-verbund-rahmen]").waitFor({ state: "detached", timeout: 3000 });
      soll(verbraucht === true && await thema.isVisible(), "Zurück verließ die Hilfe");
      await thema.locator("[data-pro-verbund-oeffnen]").click();
      await page.locator("[data-pro-verbund-rahmen]").waitFor({ state: "visible", timeout: 3000 });
      await page.keyboard.press("Escape");
      await page.locator("[data-pro-verbund-rahmen]").waitFor({ state: "detached", timeout: 3000 });
      return true;
    });
    await step(`${name}: „Wie kann ich dir helfen?“ findet das Thema über „BookLedgerPro“`, async () => {
      await page.locator("#hilfe-frage-feld").fill("Wie arbeitet die Akte mit BookLedgerPro zusammen"); await page.waitForTimeout(350);
      const ids = await page.locator("[data-hilfe-treffer]").evaluateAll((l) => l.map((e) => e.dataset.hilfeTreffer));
      return soll(ids.slice(0, 3).includes("pro-verbund"), ids.join(","));
    });
    check(errors.length === 0, `${name}: keine Fehler in der Konsole`, errors.join(" | "));
    await context.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Pro-App-Verbund"));
