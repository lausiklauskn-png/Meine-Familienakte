// Stück 2a (Klaus 2026-10-31: „Eigene Seite Netz“): Mycel/SBKIM in der Familienakte.
// Geprüft: beim Start wird kein SBKIM-Baustein geladen und keine Verbindung geöffnet · Seite „Netz (Mycel)“ lädt die
// byte-gleichen Kanon-Module, öffnet aber nichts ins Netz · kein schwebender Kanon-Knopf · Gerätename wird gemerkt und
// steht im Kanon-Fenster · „Verbinden …“ öffnet nur das Fenster · Seite verlassen schließt es · Handy ohne Querrollen.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, collectErrors } from "./_harness.mjs";

const ZAEHLER = `(() => { const W = window.WebSocket; window.__ws = [];
  window.WebSocket = function (url, p) { window.__ws.push(String(url)); return new W(url, p); };
  window.WebSocket.prototype = W.prototype; Object.assign(window.WebSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 }); })();`;
const zurNetzSeite = async (page) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".main-navigation .nav-cluster > button", { hasText: "Dokumente" }).first().click({ force: true });
  await page.locator(".mega-menu button", { hasText: "Netz (Mycel)" }).first().click();
  await page.locator("[data-netz-seite]").waitFor();
};

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  await context.addInitScript(ZAEHLER);
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = collectErrors(page);
  const sbkimAnfragen = [], fremd = [];
  page.on("request", (r) => { const u = r.url(); if (/\/sbkim\//.test(u)) sbkimAnfragen.push(u); if (!u.startsWith(app.base) && !u.startsWith("data:") && !u.startsWith("blob:")) fremd.push(u); });
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  // Zähler zusätzlich AUSSEN um den Internetschalter (native-network.js) legen: der wirft bei „Internet aus“ schon vor dem
  // inneren Zähler — ein Verbindungs-VERSUCH soll trotzdem zählen (Gegenprobe „verbindet von selbst“ war sonst blind).
  await page.evaluate(() => { const W = window.WebSocket; window.WebSocket = function (url, p) { window.__ws.push(`versuch:${url}`); return new W(url, p); }; window.WebSocket.prototype = W.prototype; Object.assign(window.WebSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 }); });
  check(sbkimAnfragen.length === 0 && await page.locator("script[data-familienakte-sbkim]").count() === 0, "Start: kein SBKIM-Baustein geladen", sbkimAnfragen.join(" "));
  check((await page.evaluate(() => window.__ws.length)) === 0, "Start: keine Verbindung (kein WebSocket)");

  await step("Menü Dokumente → „Netz (Mycel)“: Seite erscheint, Bausteine bereit", async () => {
    await zurNetzSeite(page);
    await page.locator("[data-netz-zustand]", { hasText: "bereit" }).waitFor({ timeout: 20000 });
    return `${await page.locator("script[data-familienakte-sbkim]").count()} Kanon-Module geladen`;
  });
  check(await page.evaluate(() => !!(window.SbkimRendezvous && window.SbkimRendezvousUI && window.SbkimStorage)), "Kanon-Module laufen (Modul 01, 23, 23-UI)");
  check(await page.evaluate(() => window.SbkimStorage?._meta?.dbName || window.SBKIM_DB_SUFFIX) !== undefined && await page.evaluate(() => window.SBKIM_DB_SUFFIX) === "familienakte", "Eigene Schublade „familienakte“");
  await page.waitForTimeout(1500);
  check((await page.evaluate(() => window.__ws.length)) === 0, "Auf der Seite: weiterhin keine Verbindung", (await page.evaluate(() => window.__ws)).join(" "));
  check(fremd.length === 0, "Keine Anfrage an fremde Adressen", fremd.slice(0, 3).join(" "));
  check(!(await page.locator("#sbkim-rdv-btn").isVisible().catch(() => false)), "Kein schwebender Kanon-Knopf");
  check(await page.locator(".fa-netz-hinweis", { hasText: "Internet für die App ist aus" }).count() === 1, "Internet aus: Hinweis zum Einschalten");

  await step("Gerätename wird gemerkt", async () => {
    await page.locator("[data-netz-seite] [data-sbkim-geraetename]").fill("Tablet Küche");
    return (await page.evaluate(() => localStorage.getItem("sbkim_geraetename"))) === "Tablet Küche";
  });
  await step("„Verbinden …“ öffnet das Kanon-Fenster, Gerätename steht darin, noch keine Verbindung", async () => {
    await page.locator("[data-netz-verbinden]").click();
    await page.locator("#sbkim-rdv-panel").waitFor({ state: "visible" });
    const imFenster = await page.locator("#sbkim-rdv-panel [data-sbkim-geraetename]").inputValue();
    const ws = await page.evaluate(() => window.__ws.length);
    return imFenster === "Tablet Küche" && ws === 0 ? "Fenster offen, 0 Verbindungen" : false;
  });
  await step("Seite verlassen schließt das Fenster", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(".main-navigation .nav-cluster > button", { hasText: "Dokumente" }).first().click({ force: true });
    await page.locator(".mega-menu button", { hasText: "Eingangszentrale" }).first().click();
    await page.waitForTimeout(500);
    return !(await page.locator("#sbkim-rdv-panel").isVisible());
  });
  const handy = await (await browser.newContext(HANDY)).newPage();
  await handy.goto(app.base, { waitUntil: "networkidle" }); await ready(handy);
  await step("Handy 390 px: Netz-Seite ohne Querrollen", async () => {
    await handy.evaluate(() => window.scrollTo(0, 0));
    await handy.locator(".mobile-menu-button").click();
    await handy.locator(".main-navigation .nav-cluster > button", { hasText: "Dokumente" }).first().click({ force: true });
    await handy.locator(".mega-menu .mega-group button", { hasText: "Netz (Mycel)" }).first().click({ force: true });
    await handy.locator("[data-netz-seite]").waitFor({ timeout: 10000 });
    const ueber = await handy.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    return ueber <= 1 ? `Überlauf ${ueber} px` : false;
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Netz (Mycel)"));
