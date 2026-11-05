// Impressum & Datenschutz (2026-11-05, für Google: Startseite und Datenschutzerklärung der App). Die Seite liegt neben der
// App, die Fußzeile verlinkt sie, und der Service Worker liefert dort NICHT die Akte aus (sonst sähe ein installierter Nutzer
// statt der Erklärung die App).
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await step("Fußzeile: Link „Impressum & Datenschutz“ zeigt auf ./datenschutz.html", async () => (await page.locator('.footer-directory a[href="./datenschutz.html"]').count()) === 1);
  await step("Service Worker ist aktiv (sonst misst der nächste Schritt nichts)", async () => page.evaluate(async () => Boolean((await navigator.serviceWorker?.ready)?.active)));
  await step("Mit aktivem Service Worker: Klick öffnet die Erklärung, nicht die Akte", async () => {
    await page.reload({ waitUntil: "networkidle" });
    await page.locator('.footer-directory a[href="./datenschutz.html"]').click();
    await page.waitForLoadState("domcontentloaded");
    const h = await page.locator("h1").allInnerTexts();
    return h.join("|") === "Impressum|Datenschutz" && (await page.locator(".site-header").count()) === 0;
  });
  await step("Inhalt: Kalender-Abschnitt nennt Bereiche, „Notizen … nie“, Widerruf und Limited Use", async () => {
    const t = await page.locator("main").innerText();
    return /calendar\.events/.test(t) && /Notizen und Dokumente werden nie übertragen/.test(t) && /myaccount\.google\.com\/permissions/.test(t) && /Limited Use/.test(t) && /info@family-projekt\.de/.test(t);
  });
  check(errors.length === 0, "Keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Datenschutz"));
