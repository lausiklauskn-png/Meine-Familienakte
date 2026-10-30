// Windows-Hülle (gestellte Tauri-Brücke): Internetschalter über localStorage, Diktat über SAPI, Startdateien
// („Öffnen mit“) in die Eingangszentrale, Update-Prüfung über die Versionszeile (nur bei Internet an).
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors } from "./_harness.mjs";
import { tauriStub } from "./_tauri-stub.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  await context.addInitScript(tauriStub);
  const fremd = [];
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => { fremd.push(route.request().url()); return route.abort(); });
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await step("Windows-Brücke erkannt: Plattform windows, Internet standardmäßig aus, kein Service Worker", async () => page.evaluate(async () => window.Capacitor?.getPlatform() === "windows" && document.documentElement.dataset.appOffline === "true" && !(await navigator.serviceWorker.getRegistration())));
  await step("Kein Neu-laden-Knopf in der App (Updates über die Versionszeile)", async () => { await page.waitForSelector(".header-actions"); const n = await page.locator("[data-neu-laden]").count(); if (n !== 0) throw new Error(`${n} Knöpfe`); return "keiner"; });
  await step("Kein Installieren-Knopf in der Windows-App (html.app-installiert)", async () => { await page.waitForSelector(".header-actions"); await page.waitForTimeout(600); return page.evaluate(() => document.documentElement.classList.contains("app-installiert") && !document.querySelector(".header-actions [data-install-knopf]")?.offsetParent); });
  await step("Diktat über SAPI: Tipp → Text im Feld, Diktat endet, auch bei Internet aus", async () => {
    const button = page.locator(".dictation-button").first();
    if (await button.isDisabled()) throw new Error("Diktatknopf gesperrt");
    await button.click(); await page.waitForTimeout(1200);
    const value = await button.evaluate((b) => (b.closest(".voice-field, .dictation-field, .search-panel, form, label, .search-row") || b.parentElement?.parentElement)?.querySelector("input, textarea")?.value || "");
    const spoken = await page.evaluate(() => window.__tauriState.diktat);
    if (!(/Arenberg-Hof/.test(value) && spoken.length === 1)) throw new Error(`Wert „${value}“, Aufrufe ${spoken.length}`);
    return `„${value}“`;
  });
  await step("Versionszeile ist der Update-Knopf; bei Internet aus kommt der Hinweis, nichts geht ins Netz", async () => {
    await page.click(".site-brand-version");
    const text = await page.locator(".familienakte-hinweis span").innerText();
    if (!/Internet für die App ist aus/.test(text)) throw new Error(text);
    return text;
  });
  await step("Mit Internet an: neue Fassung gefunden (Prüfung in der Hülle), „Laden und installieren“ ruft die Hülle", async () => {
    await page.click(".netz-schalter"); await page.waitForSelector('.netz-schalter[data-netz="an"]');
    await page.click(".site-brand-version");
    await page.waitForFunction(() => /Neu: Fassung 2\.28\.3 \(du hast 2\.28\.2\), 40 MB/.test(document.querySelector(".familienakte-hinweis span")?.textContent || ""), null, { timeout: 8000 });
    await page.click(".familienakte-hinweis button:not(.familienakte-hinweis-zu)");
    await page.waitForFunction(() => window.__tauriState.installiert.length === 1, null, { timeout: 5000 });
    const text = await page.locator(".familienakte-hinweis span").innerText();
    if (!/Setup wird geladen … 20 MB von 40 MB/.test(text)) throw new Error(`Stand: ${text}`);
    if (fremd.some((u) => /family-projekt|github\.io/.test(u))) throw new Error(`Seite selbst im Netz: ${fremd.join(", ")}`);
    return text;
  });
  await step("Falsch unterschriebener Feed: klare Meldung, nichts wird geladen", async () => {
    const vorher = await page.evaluate(() => { window.__tauriState.updateFehler = "UPDATE_UNTERSCHRIFT_FALSCH"; return window.__tauriState.installiert.length; });
    await page.click(".site-brand-version");
    await page.waitForFunction(() => /nicht richtig unterschrieben/.test(document.querySelector(".familienakte-hinweis span")?.textContent || ""), null, { timeout: 8000 });
    const nachher = await page.evaluate(() => window.__tauriState.installiert.length);
    if (nachher !== vorher || await page.locator(".familienakte-hinweis button:not(.familienakte-hinweis-zu):not([hidden])").count()) throw new Error("trotzdem Laden angeboten");
    return "abgewiesen";
  });
  await step("„Öffnen mit“: eine zweite Instanz reicht die Datei weiter, sie landet in der Eingangszentrale", async () => {
    await page.evaluate(() => window.__tauriEmit("familienakte:startdateien", { dateien: [{ name: "Garantiebeleg_Velotrix.txt", size: 20, data: btoa("Fahrradkauf Velotrix, erfunden") }] }));
    await page.waitForFunction(() => /1 Eingang wurde erkannt/.test(document.body.innerText) && document.querySelectorAll(".queue-title-row").length >= 1, null, { timeout: 15000 });
    return (await page.locator(".queue-title-row").first().innerText()).split("\n")[0];
  });
  check(errors.filter((e) => !/APP_OFFLINE|ERR_FAILED|Failed to load resource/.test(e)).length === 0, "keine unerwarteten Seitenfehler", errors.join(" | ").slice(0, 300));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Windows-Hülle"));
