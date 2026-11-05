// „Mein Kalender“ und App-Glocke (Klaus 2026-11-05): Monat und Tagesliste in der App, Eintrag an einem Tag anlegen und ändern,
// Notiz mit Erinnerung springt in den Kalender, Fristenliste zeigt Uhrzeit und „Ändern“ ohne Seitenwechsel, die Glocke läutet
// (abschaltbar, ab Werk aus). Die Uhr ist gestellt.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, collectErrors, internetAn } from "./_harness.mjs";
import { speechStub } from "./_stubs.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";

const app = await startApp();
const browser = await launchBrowser();
const register = async (page) => { await vaultFixture(page); return page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records; }); };
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.clock.install({ time: new Date(2026, 10, 10, 14, 0) });
  await page.addInitScript(speechStub("Erinnere mich morgen um 9 Uhr Jens anzurufen"));
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await internetAn(page);
  const kal = page.locator("[data-mein-kalender]");

  await step("Kopf: Kalender-Knopf öffnet „Mein Kalender“ mit Monat und heutigem Tag; App-Glocke ab Werk aus", async () => {
    await page.locator("[data-mein-kalender-knopf]").click(); await kal.waitFor();
    const monat = await kal.locator("[data-mk-monat]").innerText();
    const heute = await kal.locator('[data-mk-tag="2026-11-10"]').getAttribute("aria-pressed");
    const glocke = await kal.locator("[data-glocke]").getAttribute("data-glocke");
    return /November 2026/i.test(monat) && heute === "true" && glocke === "aus" ? true : (console.log("   ↳", monat, heute, glocke), false);
  });
  await step("Eintrag am Tag: Titel, 14:30, Erinnerung 15 Min. vorher – steht im Register und in der Tagesliste", async () => {
    await kal.locator("[data-mk-neu]").click();
    await kal.locator("[data-mk-titel]").fill("Zahnarzt anrufen");
    await kal.locator("[data-mk-uhr]").fill("14:30");
    await kal.locator("[data-mk-speichern]").click();
    await kal.locator("[data-mk-eintrag]", { hasText: "Zahnarzt anrufen" }).first().waitFor({ timeout: 8000 });
    const t = (await register(page)).find((r) => r.recordType === "task" && r.data.title === "Zahnarzt anrufen");
    const zeile = await kal.locator("[data-mk-eintrag]", { hasText: "Zahnarzt anrufen" }).first().innerText();
    return t?.data.dueAt === "2026-11-10" && t?.data.dueTime === "14:30" && JSON.stringify(t?.data.erinnerungen) === '["15m"]' && /14:30/.test(zeile) && /15 Min\. vorher/.test(zeile) ? true : (console.log("   ↳", JSON.stringify(t?.data), zeile), false);
  });
  await step("App-Glocke an: 15 Minuten vorher läutet sie mit Hinweis oben; „OK“ schließt, kein zweites Läuten", async () => {
    await kal.locator("[data-glocke]").click();
    if ((await kal.locator("[data-glocke]").getAttribute("data-glocke")) !== "an") return false;
    await page.clock.fastForward("16:00");
    const hinweis = page.locator("[data-app-glocke]");
    await hinweis.waitFor({ timeout: 5000 });
    const text = await hinweis.innerText();
    await hinweis.locator("[data-app-glocke-ok]").click();
    await page.clock.fastForward("01:00");
    await page.waitForTimeout(300);
    return /Zahnarzt anrufen/.test(text) && /15 Min\. vorher/.test(text) && (await page.locator("[data-app-glocke]").count()) === 0 ? true : (console.log("   ↳", text), false);
  });
  await step("Ändern im Kalender: Uhrzeit 18:45 im Termin-Fenster – Register und Liste zeigen sie", async () => {
    await kal.locator("[data-mk-eintrag]", { hasText: "Zahnarzt anrufen" }).first().locator("[data-mk-aendern]").click();
    const d = page.locator("[data-termin-bearbeiten]"); await d.waitFor();
    await d.locator("[data-tb-uhr]").fill("18:45");
    await d.locator("[data-tb-speichern]").click(); await d.waitFor({ state: "detached", timeout: 8000 });
    const t = (await register(page)).find((r) => r.recordType === "task" && r.data.title === "Zahnarzt anrufen");
    await page.waitForFunction(() => /18:45/.test(document.querySelector("[data-mein-kalender] .mk-liste")?.textContent || ""), null, { timeout: 5000 });
    return t?.data.dueTime === "18:45";
  });
  await step("Fristenliste: Uhrzeit, Erinnerung und „Ändern“ am Eintrag, ohne Seitenwechsel", async () => {
    const id = (await register(page)).find((r) => r.recordType === "task" && r.data.title === "Zahnarzt anrufen").id;
    const art = page.locator(`#termin-${id}`);
    const text = await art.innerText();
    await art.locator("[data-termin-aendern]").click();
    const d = page.locator("[data-termin-bearbeiten]"); await d.waitFor();
    await d.locator("button", { hasText: "Abbrechen" }).click();
    return /18:45 Uhr/.test(text) && /15 Min\. vorher/.test(text) ? true : (console.log("   ↳", text), false);
  });
  await step("Notiz mit Erinnerung: in der Liste steht, wohin sie ging; Kalender-Knopf springt zu „Mein Kalender“ am Tag", async () => {
    await page.locator("[data-notiz-knopf]").click();
    const f = page.locator("[data-notiz-fenster]"); await f.waitFor();
    await page.waitForFunction(() => (document.querySelector("[data-notiz-eingabe]") || {}).value?.includes("morgen um 9 Uhr"), null, { timeout: 5000 });
    await f.locator(".dictation-button.listening").click().catch(() => {});
    await f.locator("[data-notiz-speichern]").click(); await f.locator("[data-notiz-liste] li").first().waitFor();
    const zeile = await f.locator("[data-notiz-liste] li").first().innerText();
    await f.locator("[data-notiz-im-kalender]").first().click();
    await page.waitForFunction(() => document.querySelector('[data-mk-tag="2026-11-11"]')?.getAttribute("aria-pressed") === "true", null, { timeout: 5000 });
    const liste = await kal.locator(".mk-tagesliste").innerText();
    return /in Mein Kalender/.test(zeile) && /09:00/.test(liste) && /Jens anzurufen/i.test(liste) ? true : (console.log("   ↳", zeile, "|", liste), false);
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
  await context.close();

  const handy = await browser.newContext(HANDY);
  const p2 = await handy.newPage();
  await p2.goto(app.base, { waitUntil: "networkidle" }); await ready(p2);
  await step("Handy: Kalender-Knopf im Kopf sichtbar, Monat passt in die Breite", async () => {
    await p2.locator("[data-mein-kalender-knopf]").click(); await p2.locator("[data-mein-kalender]").waitFor();
    const breit = await p2.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    return breit;
  });
  await handy.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Mein Kalender"));
