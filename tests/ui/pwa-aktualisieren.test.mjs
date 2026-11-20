// Knopf „Aktualisieren“ in der Web-App (Klaus 20.11.2026: „für die PWA einen Aktualisierungsbutton, da ich nicht immer Hard Reload
// machen kann“): steht im Kopf der PWA, auch am Handy ohne „‹“; Tipp fragt nach einer neuen Fassung und meldet sonst die aktuelle.
// In der Android-/Windows-App gibt es ihn nicht (dort Versionszeile und Fähnchen).
import { startApp, launchBrowser, DESKTOP, HANDY, ready, step, summary, collectErrors, internetAn, soll } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await internetAn(page);
  const knopf = page.locator("[data-pwa-aktualisieren]");
  await step("PWA: Knopf „Aktualisieren“ im Kopf", async () => soll(await knopf.isVisible(), "nicht sichtbar"));
  await step("Tipp prüft und meldet „aktuelle Fassung“ (oder lädt neu)", async () => {
    await knopf.click();
    const ok = await page.waitForFunction(() => /aktuelle Fassung|Neue Fassung wird geladen|Prüfung läuft/.test(document.body.innerText), null, { timeout: 15000 }).then(() => true).catch(() => false);
    return soll(ok, "keine Meldung");
  });
  const handy = await (await browser.newContext(HANDY)).newPage();
  await handy.goto(app.base, { waitUntil: "networkidle" }); await ready(handy);
  await step("Handy: Knopf sichtbar, ohne „‹“ zu öffnen", async () => soll(await handy.locator("[data-pwa-aktualisieren]").isVisible(), "am Handy versteckt"));
  const nativ = await (await browser.newContext(DESKTOP)).newPage();
  await nativ.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true, getPlatform: () => "android", Plugins: {} }; });
  await nativ.goto(app.base, { waitUntil: "networkidle" }); await ready(nativ).catch(() => {});
  await step("Android-App (gestellt): kein Knopf", async () => soll((await nativ.locator("[data-pwa-aktualisieren]").count()) === 0, "Knopf in der App"));
  await step("Keine Seitenfehler", async () => soll(errors.length === 0, errors));
} finally { await browser.close(); await app.stop(); }
summary("PWA aktualisieren");
