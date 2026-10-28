// PWA: Service Worker, Offline-Neustart, Manifest mit PNG-Symbolen, version.json und Bau-Kennung, Hinweisleiste.
import { readFileSync } from "node:fs";
import path from "node:path";
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, ROOT } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage();
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  const meta = await page.evaluate(() => ({ build: document.querySelector('meta[name="familienakte-build"]')?.content, version: document.querySelector('meta[name="familienakte-version"]')?.content }));
  check(!!meta.build && !!meta.version, "Bau-Kennung und Fassung stehen in der Seite", JSON.stringify(meta));
  await step("version.json passt zur Seite", async () => { const v = await (await fetch(app.base + "version.json")).json(); return v.build === meta.build && v.version === meta.version ? `Bau ${v.build}, ${v.files} Dateien` : JSON.stringify(v); });
  await step("Manifest hat PNG-Symbole (192, 512, maskable) und eine feste id", async () => { const m = await (await fetch(app.base + "manifest.webmanifest")).json(); const sizes = m.icons.map((i) => i.sizes + (i.purpose ? ":" + i.purpose : "")); return sizes.includes("192x192") && sizes.includes("512x512") && sizes.includes("512x512:maskable") && m.id === "./index.html" ? sizes.join(" ") : false; });
  await step("Service Worker ist angemeldet und hat den Vorrat gefüllt", async () => {
    await page.waitForFunction(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!(r && r.active); }, null, { timeout: 30000 });
    await page.waitForFunction(async () => (await caches.keys()).some((k) => k.startsWith("familienakte-")), null, { timeout: 30000 });
    const keys = await page.evaluate(async () => { const k = (await caches.keys()).filter((k) => k.startsWith("familienakte-")); const c = await caches.open(k[0]); return [k[0], (await c.keys()).length]; });
    const expected = JSON.parse(readFileSync(path.join(ROOT, "dist/version.json"), "utf8")).files;
    if (!(keys[1] >= expected)) throw new Error(`nur ${keys[1]} von ${expected}`);
    return `${keys[0]}: ${keys[1]} Dateien`;
  });
  await step("Ohne Netz neu geladen: die App startet aus dem Vorrat", async () => {
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
    await context.setOffline(true);
    await page.reload({ waitUntil: "load" }); await ready(page);
    const title = await page.title();
    await context.setOffline(false);
    return /Familienakte/.test(title) ? title : false;
  });
  await step("Hinweisleiste der Hülle lässt sich zeigen und schließen", async () => {
    await page.evaluate(() => window.FamilienakteApp.hinweis("Probe-Hinweis", 0, { text: "Jetzt", run: () => {} }));
    const text = await page.locator(".familienakte-hinweis span").innerText();
    await page.click(".familienakte-hinweis-zu");
    return text === "Probe-Hinweis" && (await page.locator(".familienakte-hinweis").count()) === 0;
  });
  await step("Installieren-Knopf (Kanon installieren.js) steht hinten in den Kopfleisten-Aktionen", async () => {
    const k = page.locator(".header-actions [data-install-knopf]");
    await k.waitFor({ timeout: 8000 });
    const letzter = await page.evaluate(() => document.querySelector(".header-actions").lastElementChild?.hasAttribute("data-install-knopf"));
    const text = (await k.innerText()).replace(/\s+/g, " ").trim();
    if (!(letzter && /Installieren/.test(text) && (await k.isVisible()))) throw new Error(`letzter=${letzter} „${text}“`);
    return `„${text}“, Lage ${await k.getAttribute("data-lage")}`;
  });
  await step("Ohne Angebot des Browsers: Tipp zeigt die lesbare Erklärung, nichts geht ins Netz", async () => {
    await page.click(".header-actions [data-install-knopf]");
    const m = page.locator("#install-meldung"); await m.waitFor();
    return /bietet die Installation gerade nicht an/.test(await m.innerText()) ? `data-lesbar=${await m.getAttribute("data-lesbar")}` : (await m.innerText()).slice(0, 120);
  });
  await step("Mit Angebot des Browsers (beforeinstallprompt gestellt): Tipp ruft den Dialog, danach „Installiert“", async () => {
    await page.evaluate(() => { const e = new Event("beforeinstallprompt"); e.prompt = () => { window.__promptCalled = true; }; e.userChoice = Promise.resolve({ outcome: "accepted" }); window.dispatchEvent(e); });
    const lage = await page.getAttribute(".header-actions [data-install-knopf]", "data-lage");
    await page.click(".header-actions [data-install-knopf]");
    await page.waitForFunction(() => window.__promptCalled === true && /Installiert/.test(document.querySelector("#install-meldung-text")?.textContent || ""));
    if (!(lage === "angeboten")) throw new Error(`Lage vorher ${lage}`);
    return "angeboten → Dialog → Installiert";
  });
  await step("Als installierte App (display-mode: standalone): kein Knopf", async () => {
    const app2 = await context.newPage();
    await app2.addInitScript(() => { const orig = window.matchMedia.bind(window); window.matchMedia = (q) => /display-mode: standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : orig(q); });
    await app2.goto(app.base, { waitUntil: "networkidle" }); await ready(app2);
    await app2.waitForSelector(".header-actions");
    await app2.waitForTimeout(600);
    const n = await app2.locator(".header-actions [data-install-knopf]:visible").count();
    await app2.close();
    if (!(n === 0)) throw new Error(`${n} sichtbar`);
    return "kein sichtbarer Knopf";
  });
  await step("Versionszeile trägt die Bau-Kennung als Tipp", async () => { const t = await page.getAttribute(".site-brand-version", "title"); return t && t.includes(meta.build) ? t : false; });
} finally { await browser.close(); await app.stop(); }
process.exit(summary("PWA"));
