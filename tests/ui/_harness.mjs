// Gemeinsamer Rahmen für die Oberflächenproben (Playwright, vorinstalliertes Chromium).
// Jede Probe ist ein eigenes Skript `tests/ui/*.test.mjs`; `node tests/run-ui.mjs` fährt alle.
// Der Rahmen baut bei Bedarf `dist/`, startet `vite preview` auf einem freien Port,
// öffnet einen Browser und zählt grüne/rote Zeilen. Rückgabe 1 bei mindestens einer roten Zeile.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
export const { chromium, devices } = require("playwright");
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let gruen = 0, rot = 0;
const rote = [];
export function ok(name, detail = "") { gruen++; console.log(`🟢 ${name}${detail ? ` – ${detail}` : ""}`); }
export function fail(name, detail = "") { rot++; rote.push(name); console.log(`🔴 ${name}${detail ? ` – ${detail}` : ""}`); }
export function check(cond, name, detail = "") { (cond ? ok : fail)(name, detail); return !!cond; }
// Browser-Diktat braucht seit dem Internetschalter (PR #10, Standard aus) ein eingeschaltetes Internet.
export async function internetAn(page) {
  if ((await page.getAttribute(".netz-schalter", "data-netz")) === "aus") { await page.click(".netz-schalter"); await page.waitForSelector('.netz-schalter[data-netz="an"]'); }
}
export async function step(name, fn) {
  try { const r = await fn(); if (r === false) fail(name); else ok(name, typeof r === "string" ? r : ""); return r; }
  catch (e) { fail(name, String(e?.message || e).split("\n")[0].slice(0, 200)); return false; }
}
export function summary(title) {
  console.log(`${title}: ${gruen} grün · ${rot} rot${rot ? ` (${rote.join(" | ")})` : ""}`);
  return rot ? 1 : 0;
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer(); s.unref();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); });
  });
}
function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: "inherit", ...opts });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} → ${code}`))));
  });
}

/** Baut dist/ wenn nötig (oder bei UI_BUILD=1 immer) und startet vite preview. */
export async function startApp() {
  if (process.env.UI_BASE) return { base: process.env.UI_BASE, stop: async () => {} };
  if (process.env.UI_BUILD === "1" || !existsSync(path.join(ROOT, "dist/index.html"))) await run("npx", ["vite", "build"]);
  const port = await freePort();
  // Eigene Prozessgruppe: npx startet vite als Kind; SIGTERM an npx allein ließ den Vorschau-Server stehen (verwaiste Prozesse in der CI).
  const child = spawn("npx", ["vite", "preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], { cwd: ROOT, stdio: "ignore", detached: true });
  const base = `http://127.0.0.1:${port}/`;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try { const r = await fetch(base); if (r.ok) break; } catch { /* noch nicht da */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  return { base, stop: async () => { try { process.kill(-child.pid, "SIGTERM"); } catch { child.kill("SIGTERM"); } } };
}

export async function launchBrowser() {
  return chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
}
export const DESKTOP = { viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, locale: "de-DE" };
export const HANDY = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "de-DE" };

/** Wartet, bis die Beispielfamilie angelegt ist (beim ersten Start dauert das einige Sekunden). */
export const ready = (page) => page.waitForSelector('.sample-data-notice strong:has-text("Alle Daten")', { timeout: 120000 });
/** Hauptmenü (Index 0 = Assistenz … 7 = Hilfe) und Eintrag im Mega-Menü. */
export async function openMenu(page, navIndex, itemText) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".main-navigation .nav-cluster > button").nth(navIndex).click({ force: true });
  await page.locator(".mega-menu button", { hasText: itemText }).first().click();
  await page.waitForTimeout(400);
}
/** Fußzeilen-Verzeichnis („Interaktives Cockpit“, „Dokumentenbibliothek“, „Eingangszentrale“, „Sicherheitscenter“, „Hilfe“ …). */
// Wartet, bis das sanfte Rollen (go() rollt nach oben mit behavior: smooth) zur Ruhe gekommen ist – sonst meldet
// Playwright „Element is outside of the viewport“, wenn der Knopf während der Animation wegrutscht (Wackler in der CI).
export async function ruhig(page, maxMs = 2000) {
  await page.evaluate((max) => new Promise((resolve) => { const start = Date.now(); let last = window.scrollY; let still = 0; const tick = () => { if (window.scrollY === last) still += 1; else { still = 0; last = window.scrollY; } if (still >= 3 || Date.now() - start > max) return resolve(); setTimeout(tick, 60); }; tick(); }), maxMs);
}
export async function footer(page, text) {
  await ruhig(page);
  await page.locator(".footer-directory button", { hasText: text }).first().click();
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));
}
/** Sammelt Konsolen-Fehler und Seitenfehler. */
export function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  return errors;
}
