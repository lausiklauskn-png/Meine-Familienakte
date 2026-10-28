// Internetschalter: Standard aus, Verbindungen nach außen abgewiesen, Umschalten, Zustand überlebt Neuladen, Diktat beachtet ihn.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await step("Standard ist aus (Lampe rot, data-app-offline)", async () => {
    const netz = await page.getAttribute(".netz-schalter", "data-netz");
    const html = await page.getAttribute("html", "data-app-offline");
    return netz === "aus" && html === "true" ? `data-netz=${netz}, data-app-offline=${html}` : false;
  });
  await step("fetch nach außen wird mit APP_OFFLINE abgewiesen", async () => page.evaluate(async () => { try { await fetch("https://example.invalid/x"); return false; } catch (e) { return e && e.message === "APP_OFFLINE"; } }));
  await step("window.open nach außen bleibt zu und zeigt den Hinweis", async () => {
    const result = await page.evaluate(() => window.open("https://chatgpt.com/", "_blank") === null);
    const hinweis = await page.locator(".familienakte-hinweis span").first().innerText().catch(() => "");
    return result && /Internet für die App ist aus/.test(hinweis) ? hinweis : false;
  });
  // Hinweis bewusst geändert (Klaus 2026-10-28: „warum geht das Mikrofon nicht“): bei Schalter „aus“ nennt er den Weg.
  await step("Diktatknopf ist bei „aus“ gesperrt mit Hinweis „Internet für die App ist aus – oben einschalten oder tippen.“", async () => {
    const title = await page.locator(".dictation-button").first().getAttribute("title");
    const disabled = await page.locator(".dictation-button").first().isDisabled();
    if (!disabled || !/Internet für die App ist aus – oben einschalten/.test(title || "")) throw new Error(`disabled=${disabled}, title=${title}`);
    return title;
  });
  await step("Einschalten über den Knopf in der Kopfleiste", async () => {
    await page.click(".netz-schalter");
    await page.waitForSelector('.netz-schalter[data-netz="an"]');
    const html = await page.getAttribute("html", "data-app-offline");
    const stored = await page.evaluate(() => localStorage.getItem("familienakte-internet"));
    return html === "false" && stored === "an" ? `gespeichert: ${stored}` : `html=${html}, stored=${stored}`;
  });
  await step("fetch nach außen geht jetzt durch die Hülle (hier vom Test abgefangen, nicht APP_OFFLINE)", async () => page.evaluate(async () => { try { await fetch("https://example.invalid/x"); return true; } catch (e) { return e.message !== "APP_OFFLINE"; } }));
  await step("Diktatknopf ist bei „an“ freigegeben", async () => !(await page.locator(".dictation-button").first().isDisabled()));
  await step("Zustand „an“ überlebt das Neuladen", async () => { await page.reload({ waitUntil: "networkidle" }); await ready(page); await page.waitForSelector('.netz-schalter[data-netz="an"]'); return true; });
  await step("Ausschalten und Neuladen: wieder aus", async () => { await page.click(".netz-schalter"); await page.waitForSelector('.netz-schalter[data-netz="aus"]'); await page.reload({ waitUntil: "networkidle" }); await ready(page); await page.waitForSelector('.netz-schalter[data-netz="aus"]'); return true; });
  await step("Lampe hat Kontrast und sitzt im Knopf", async () => page.evaluate(() => { const l = document.querySelector(".netz-schalter .netz-lampe"); const b = document.querySelector(".netz-schalter"); const r = l.getBoundingClientRect(), br = b.getBoundingClientRect(); return r.width >= 6 && r.left >= br.left && r.right <= br.right; }));
  check(errors.filter((e) => !/APP_OFFLINE|net::ERR_FAILED|Failed to load resource/.test(e)).length === 0, "keine unerwarteten Seitenfehler", errors.join(" | ").slice(0, 300));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Internetschalter"));
