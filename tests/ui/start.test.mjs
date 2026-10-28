// Rauchprobe: App startet, Beispielfamilie erscheint, keine Seitenfehler, Handy-Ansicht lädt.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, collectErrors } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage();
  const errors = collectErrors(page);
  await step("Startseite lädt (Desktop)", async () => { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); });
  check(errors.length === 0, "keine Seitenfehler beim Start", errors.join(" | "));
  await step("Acht Hauptmenüs vorhanden", async () => (await page.locator(".main-navigation .nav-cluster > button").count()) === 8);
  const mobile = await (await browser.newContext(HANDY)).newPage();
  await step("Startseite lädt (Handy)", async () => { await mobile.goto(app.base, { waitUntil: "networkidle" }); await ready(mobile); });
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Start"));
