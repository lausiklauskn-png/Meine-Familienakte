// Erstellt Screenshots der App mit Beispieldaten unter docs/screenshots/.
// Voraussetzung: laufende App (npm run dev) und installiertes Playwright mit Chromium.
// Aufruf: node scripts/screenshots.mjs [http://127.0.0.1:5173/]
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const base = process.argv[2] || "http://127.0.0.1:5173/";
const out = new URL("../docs/screenshots/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const ready = (page) => page.waitForSelector('.sample-data-notice strong:has-text("Alle Daten")', { timeout: 120000 });
async function openMenu(page, navIndex, itemText) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".main-navigation .nav-cluster > button").nth(navIndex).click({ force: true });
  await page.locator(".mega-menu button", { hasText: itemText }).first().click();
  await page.waitForTimeout(900);
}
async function footer(page, text) {
  await page.locator(".footer-directory button", { hasText: text }).first().click();
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
}

// Seitenausschnitt bis 1700 px Höhe: Kopfbereich plus Inhalt der jeweiligen Seite.
async function shot(page, path) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path, fullPage: true, clip: { x: 0, y: 0, width: 1440, height: Math.min(1700, height) } });
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const desktop = await (await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })).newPage();
await desktop.goto(base, { waitUntil: "networkidle" });
await ready(desktop);
await desktop.waitForTimeout(800);
await desktop.screenshot({ path: `${out}01-startseite.png`, fullPage: true });
await footer(desktop, "Interaktives Cockpit");
await shot(desktop, `${out}02-cockpit.png`);
await footer(desktop, "Dokumentenbibliothek");
await shot(desktop, `${out}03-dokumentenbibliothek.png`);
await footer(desktop, "Fristen und Aufgaben");
await shot(desktop, `${out}04-fristen-und-aufgaben.png`);
await footer(desktop, "Tagebuch & Erinnerungen");
await shot(desktop, `${out}05-tagebuch.png`);
await openMenu(desktop, 0, "Assistenzzentrale");
await shot(desktop, `${out}06-assistenz.png`);
await openMenu(desktop, 0, "Korrespondenz");
await shot(desktop, `${out}07-korrespondenz.png`);
await footer(desktop, "Eingangszentrale");
await shot(desktop, `${out}08-dokumenteneingang.png`);
await footer(desktop, "Sicherheitscenter");
await shot(desktop, `${out}09-datentresor-sicherheit.png`);
await footer(desktop, "Hilfe");
await shot(desktop, `${out}10-hilfe.png`);

const mobile = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
await mobile.goto(base, { waitUntil: "networkidle" });
await ready(mobile);
await mobile.waitForTimeout(800);
await mobile.screenshot({ path: `${out}11-handy-startseite.png` });
await browser.close();
console.log(`Screenshots gespeichert in ${out}`);
