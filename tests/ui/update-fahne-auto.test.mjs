// Fähnchen „Update verfügbar“ ohne Tipp (Klaus 09.11.2026: in der APK ging das Fähnchen erst nach dem Tipp auf die
// Versionszeile an). Die Hülle fragt den Update-Server selbst: beim Start, nach dem Einschalten des Internets, beim
// Zurückkehren in die App (höchstens alle 10 min), stündlich und nach einem Fehlversuch nach 2 min erneut.
// Android- und Windows-Brücke gestellt; die Zeit läuft über page.clock.
import { startApp, launchBrowser, HANDY, DESKTOP, step, soll, summary } from "./_harness.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { tauriStub } from "./_tauri-stub.mjs";

// Gestellter Server: window.__server = { neu: "2.28.52" | "", fehler: "" }; zählt die Abfragen.
const server = `(() => {
  window.__server = { neu: "", fehler: "", abfragen: 0 };
  const antwort = () => { const s = window.__server; s.abfragen++; if (s.fehler) throw Object.assign(new Error(s.fehler), { code: s.fehler });
    return s.neu ? { neu: s.neu, installiert: "2.28.51", groesse: 4194304 } : { aktuell: true, version: "2.28.51" }; };
  if (window.Capacitor) { window.__capState.offline = false; window.Capacitor.Plugins.FamilienakteUpdates.pruefen = async () => antwort(); }
  if (window.__TAURI__) { const alt = window.__TAURI__.core.invoke; window.__TAURI__.core.invoke = async (cmd, args) => cmd === "fa_update_pruefen" ? antwort() : alt(cmd, args); }
})();`;
const fahne = (page) => page.evaluate(() => document.documentElement.dataset.updateVerfuegbar || "");
const abfragen = (page) => page.evaluate(() => window.__server.abfragen);
const zurueck = (page) => page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
const warteFahne = (page, soll) => page.waitForFunction((s) => (document.documentElement.dataset.updateVerfuegbar || "") === s, soll, { timeout: 8000 }).catch(() => {});

const app = await startApp();
const browser = await launchBrowser();
try {
  // ── Android ──
  {
    const context = await browser.newContext(HANDY);
    await context.addInitScript(capacitorStub); await context.addInitScript(server);
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
    const page = await context.newPage();
    await page.clock.install();
    await page.addInitScript(() => { window.__server.neu = "2.28.52"; });
    await page.goto(app.base); await page.waitForSelector(".site-brand-version", { state: "attached", timeout: 120000 });
    await warteFahne(page, "2.28.52");
    await step("Android, App-Start: Fähnchen geht ohne Tipp an", async () => soll(await fahne(page) === "2.28.52" && await page.locator("[data-update-fahne]").count() === 1, { fahne: await fahne(page), abfragen: await abfragen(page) }));

    // Rückkehr aus dem Hintergrund: so öffnet man die App am Handy meist.
    await page.evaluate(() => { window.__server.neu = ""; });
    await page.clock.fastForward("11:00"); await zurueck(page); await warteFahne(page, "");
    await step("Android: nach dem Update meldet der Server nichts Neues → Fähnchen geht beim Zurückkehren aus", async () => soll(await fahne(page) === "", await fahne(page)));
    await page.evaluate(() => { window.__server.neu = "2.28.53"; });
    const vorher = await abfragen(page);
    await page.clock.fastForward("02:00"); await zurueck(page); await page.waitForTimeout(300);
    await step("Android: Zurückkehren innerhalb von 10 min fragt nicht erneut (kein Dauerfeuer)", async () => soll(await abfragen(page) === vorher, { vorher, nachher: await abfragen(page) }));
    await page.clock.fastForward("09:00"); await zurueck(page); await warteFahne(page, "2.28.53");
    await step("Android: Zurückkehren nach mehr als 10 min fragt und zeigt die neue Fassung", async () => soll(await fahne(page) === "2.28.53", await fahne(page)));

    // Fehlversuch (Netz noch nicht da) → nach 2 min erneut.
    await page.evaluate(() => { window.__server.neu = "2.28.54"; window.__server.fehler = "UPDATE_NICHT_ERREICHBAR"; });
    await page.clock.fastForward("11:00"); await zurueck(page); await page.waitForTimeout(300);
    const nachFehler = await abfragen(page);
    await page.evaluate(() => { window.__server.fehler = ""; });
    await page.clock.fastForward("02:05"); await warteFahne(page, "2.28.54");
    await step("Android: nach einem Fehlversuch nach 2 min erneut gefragt, Fähnchen an", async () => soll(await fahne(page) === "2.28.54" && await abfragen(page) > nachFehler, { fahne: await fahne(page), nachFehler, jetzt: await abfragen(page) }));

    // Stündlich, auch ohne Zurückkehren.
    await page.evaluate(() => { window.__server.neu = "2.28.55"; });
    await page.clock.fastForward("01:00:00"); await warteFahne(page, "2.28.55");
    await step("Android: stündliche Prüfung bei offener App", async () => soll(await fahne(page) === "2.28.55", await fahne(page)));

    // Internet aus: keine Abfrage.
    await page.evaluate(() => window.PBNetwork.setOffline(true));
    const ausVorher = await abfragen(page);
    await page.clock.fastForward("01:15:00"); await zurueck(page); await page.waitForTimeout(300);
    await step("Android: bei Internet aus fragt die App nie", async () => soll(await abfragen(page) === ausVorher, { ausVorher, jetzt: await abfragen(page) }));
    await context.close();
  }
  // ── Windows ──
  {
    const context = await browser.newContext(DESKTOP);
    await context.addInitScript(tauriStub); await context.addInitScript(server);
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
    const page = await context.newPage();
    await page.clock.install();
    await page.addInitScript(() => { window.__server.neu = "2.28.52"; });
    await page.goto(app.base); await page.waitForSelector(".site-brand-version", { state: "attached", timeout: 120000 });
    await step("Windows: Internet ab Werk aus → keine Abfrage, kein Fähnchen", async () => soll(await abfragen(page) === 0 && await fahne(page) === "", { abfragen: await abfragen(page) }));
    await page.click(".netz-schalter"); await page.waitForSelector('.netz-schalter[data-netz="an"]'); await warteFahne(page, "2.28.52");
    await step("Windows: Internet an → Fähnchen ohne Tipp", async () => soll(await fahne(page) === "2.28.52", await fahne(page)));
    await page.evaluate(() => { window.__server.neu = "2.28.53"; });
    await page.clock.fastForward("11:00"); await zurueck(page); await warteFahne(page, "2.28.53");
    await step("Windows: Zurückkehren ins Fenster nach mehr als 10 min fragt erneut", async () => soll(await fahne(page) === "2.28.53", await fahne(page)));
    await context.close();
  }
} finally {
  await browser.close(); await app.stop();
}
process.exit(summary("Update-Fähnchen ohne Tipp"));
