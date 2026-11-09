// Klaus 09.11.: „Ausloggen“ in der Web-App am Android-Handy tat sichtbar nichts (die Seite lud nur neu). Ein Browser darf seinen
// Tab nicht schließen – darum deckt eine Abmeldeseite alles zu. Am Handy liegt der Knopf in der Kopfleiste hinter ‹, die nach
// dem Tipp zuklappt; die Seite muss trotzdem sichtbar sein. Am Handy (390 px).
import { startApp, launchBrowser, HANDY, ready, step, soll, check, summary, collectErrors } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(HANDY);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await step("Handy: ‹ öffnen, „Ausloggen“ zeigt die Abmeldeseite über allem", async () => {
    await page.locator("[data-kopf-auf]").click(); await page.locator(".logout-button").click();
    const seite = page.locator("[data-abgemeldet]"); await seite.waitFor({ state: "visible", timeout: 5000 });
    const r = await page.evaluate(() => { const e = document.querySelector("[data-abgemeldet]"); const q = e.getBoundingClientRect(); const mitte = document.elementFromPoint(innerWidth / 2, innerHeight / 2); return { deckt: q.width >= innerWidth - 1 && q.height >= innerHeight - 1, oben: !!mitte && e.contains(mitte) }; });
    return soll(r.deckt && r.oben && /Abgemeldet/.test(await seite.innerText()), r);
  });
  await step("„Wieder öffnen“ lädt die Familienakte neu", async () => {
    await page.locator("[data-wieder-oeffnen]").click();
    await page.waitForLoadState("load"); await page.waitForSelector(".site-brand-version");
    return soll((await page.locator("[data-abgemeldet]").count()) === 0, "Abmeldeseite noch da");
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
  await context.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Ausloggen"));
