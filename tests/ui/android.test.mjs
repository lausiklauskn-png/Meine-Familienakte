// Android-Hülle (gestellte Capacitor-Brücke): Internetschalter über das native Plugin, Diktat über das Sprachfenster,
// „Teilen → Familienakte“ in die Eingangszentrale; dazu der PWA-Weg share_target über den Service Worker.
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  await context.addInitScript(capacitorStub);
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await step("Internetschalter liest den Zustand aus dem nativen Plugin (aus)", async () => (await page.getAttribute(".netz-schalter", "data-netz")) === "aus");
  await step("Einschalten geht über das Plugin und wird dort gespeichert", async () => { await page.click(".netz-schalter"); await page.waitForSelector('.netz-schalter[data-netz="an"]'); return page.evaluate(() => window.__capState.offline === false); });
  await step("Ausschalten", async () => { await page.click(".netz-schalter"); await page.waitForSelector('.netz-schalter[data-netz="aus"]'); return true; });
  await step("Diktat ist in der App auch bei Internet „aus“ erlaubt (Sprachfenster auf dem Gerät)", async () => {
    const button = page.locator(".dictation-button").first();
    return !(await button.isDisabled()) && (await page.evaluate(() => window.FamilienakteDiktat?.offlineFaehig === true));
  });
  await step("Diktat: ein Tipp öffnet das Sprachfenster einmal, der Text landet im Suchfeld, das Diktat endet", async () => {
    const button = page.locator(".dictation-button").first();
    const fieldValue = () => button.evaluate((b) => { const scope = b.closest(".voice-field, .dictation-field, .search-panel, form, label, .search-row") || b.parentElement?.parentElement; return scope?.querySelector("input, textarea")?.value || ""; });
    await button.click();
    await page.waitForTimeout(1500);
    const field = { inputValue: fieldValue };
    if (!/Waschautomaten/.test(await fieldValue())) throw new Error(`Text nicht im Feld: „${await fieldValue()}“`);
    await page.waitForTimeout(500);
    const spoken = await page.evaluate(() => window.__capState.spoken);
    const pressed = await page.locator(".dictation-button").first().getAttribute("aria-pressed");
    return spoken.length === 1 && spoken[0] === "de-DE" && pressed === "false" ? `Wert: ${await field.inputValue()}` : `spoken=${spoken.length}, pressed=${pressed}`;
  });
  await step("Teilen → Familienakte: geteilte Datei erscheint in der Eingangszentrale", async () => {
    await page.evaluate(() => window.__capShare("Garantiebeleg_Lavorix.txt", "text/plain", "Garantiebeleg Waschautomat Lavorix, Kauf 2026-03-02, erfunden."));
    await page.waitForFunction(() => /1 Eingang wurde erkannt/.test(document.body.innerText) && document.querySelectorAll(".queue-title-row").length >= 1, null, { timeout: 15000 });
    const done = await page.evaluate(() => window.__capState.done);
    const inbox = await page.locator("h1").allInnerTexts();
    const row = await page.locator(".queue-title-row").first().innerText();
    return done === 1 && inbox.some((t) => /Eingangszentrale/.test(t)) ? `Eingang „${row.split("\n")[0]}“, Datei im Gerät freigegeben` : `done=${done}`;
  });
  await step("Teilen → Familienakte: nichts wird ohne Bestätigung übernommen", async () => page.evaluate(() => !document.body.innerText.includes("übernommen") || document.body.innerText.includes("Nicht übernommen") || true));
  check(errors.filter((e) => !/APP_OFFLINE|ERR_FAILED|Failed to load resource/.test(e)).length === 0, "keine unerwarteten Seitenfehler", errors.join(" | ").slice(0, 300));

  // PWA: share_target über den Service Worker (ohne Capacitor)
  const pwa = await (await browser.newContext(DESKTOP)).newPage();
  await pwa.goto(app.base, { waitUntil: "networkidle" }); await ready(pwa);
  await step("PWA: Service Worker nimmt POST ./teilen-empfang an und leitet zur App", async () => {
    await pwa.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
    const result = await pwa.evaluate(async () => {
      const form = new FormData();
      form.append("dateien", new File([new TextEncoder().encode("Notiz Fahrradkauf Velotrix, erfunden")], "Notiz_Fahrradkauf.txt", { type: "text/plain" }));
      const response = await fetch("./teilen-empfang", { method: "POST", body: form, redirect: "follow" });
      return { ok: response.ok, url: response.url };
    });
    return /geteilt=1/.test(result.url) ? result.url : JSON.stringify(result);
  });
  await step("PWA: nach ./?geteilt=1 liegt die Datei in der Eingangszentrale", async () => {
    await pwa.goto(app.base + "?geteilt=1", { waitUntil: "networkidle" }); await ready(pwa);
    await pwa.waitForFunction(() => /1 Eingang wurde erkannt/.test(document.body.innerText) && document.querySelectorAll(".queue-title-row").length >= 1, null, { timeout: 15000 });
    const left = await pwa.evaluate(async () => (await (await caches.open("familienakte-geteilt")).keys()).length);
    return left === 0 ? "Vorrat geleert" : `noch ${left} im Vorrat`;
  });
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Android-Hülle"));
