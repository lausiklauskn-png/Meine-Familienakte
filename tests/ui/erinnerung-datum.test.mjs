// Klaus 09.11.: Beim Einsprechen einer Erinnerung kam die Uhrzeit an, das Datum nicht (es stand „heute“ da). Die
// Spracherkennung schreibt „am 15. November“ – das muss im Feld „Tag“ ankommen. Am Handy (390 px).
import { startApp, launchBrowser, HANDY, ready, step, soll, check, summary, collectErrors, internetAn } from "./_harness.mjs";
import { speechStub } from "./_stubs.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(HANDY);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.addInitScript(speechStub("Erinnere mich am 15. Dezember um 10 Uhr Zahnarzt anrufen"));
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await internetAn(page);
  await step("Eingesprochen „am 15. Dezember um 10 Uhr“: Tag 15.12., Uhrzeit 10:00, Titel „Zahnarzt anrufen“", async () => {
    await page.locator("[data-notiz-knopf]").click();
    const fenster = page.locator("[data-notiz-fenster]"); await fenster.waitFor();
    await fenster.locator(".dictation-button").first().click();
    await page.waitForFunction(() => (document.querySelector("[data-notiz-eingabe]") || {}).value?.includes("Dezember"), null, { timeout: 5000 });
    await fenster.locator(".dictation-button.listening").click().catch(() => {});
    const datum = await fenster.locator("[data-memory-erinnern-datum]").inputValue();
    const zeit = await fenster.locator("[data-memory-erinnern-zeit]").inputValue();
    const titel = await fenster.locator(".memory-erinnern-titel input, [data-memory-erinnern-titel]").first().inputValue().catch(() => "");
    return soll(/-12-15$/.test(datum) && zeit === "10:00" && (!titel || /Zahnarzt anrufen/.test(titel)), { datum, zeit, titel });
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
  await context.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Erinnerung: gesprochenes Datum"));
