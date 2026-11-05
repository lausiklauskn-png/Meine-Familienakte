// Knopf „Notiz“ im Kopf (Klaus 2026-11-05): einsprechen, Termin aus dem Text erkennen, als Erinnerungseintrag mit Aufgabe
// und Kalender-Haken speichern; derselbe Teil „Erinnern lassen“ im Memory-Dialog. Spracheingabe ist gestellt.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, collectErrors, internetAn } from "./_harness.mjs";
import { speechStub } from "./_stubs.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";

const morgen = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.addInitScript(speechStub("Erinnere mich morgen um 9 Uhr Jens anzurufen"));
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await internetAn(page); // Spracheingabe braucht das Internet der App
  const fenster = page.locator("[data-notiz-fenster]");

  await step("Kopf: Knopf „Notiz“ öffnet ein kleines Fenster, das Mikrofon startet von selbst und schreibt mit", async () => {
    await page.locator("[data-notiz-knopf]").click();
    await fenster.waitFor();
    await page.waitForFunction(() => (document.querySelector("[data-notiz-eingabe]") || {}).value?.includes("morgen um 9 Uhr"), null, { timeout: 5000 });
    await fenster.locator(".dictation-button.listening").click().catch(() => {});
    return true;
  });
  await step("Aus dem Text erkannt: „Erinnern lassen“ an, Tag morgen, Uhrzeit 09:00, Erinnerung 15 Min. vorher und zur Uhrzeit", async () => {
    const t = fenster.locator("[data-memory-erinnern]");
    const an = await t.locator("[data-memory-erinnern-haken]").isChecked();
    const datum = await t.locator("[data-memory-erinnern-datum]").inputValue();
    const zeit = await t.locator("[data-memory-erinnern-zeit]").inputValue();
    await t.locator("[data-memory-erinnern-kalender]").check(); // kein Kalender verbunden: Haken von Hand
    const chips = await t.locator(".kalender-chip.an").allInnerTexts();
    return an && datum === morgen && zeit === "09:00" && chips.join() === "15 Min. vorher,zur Uhrzeit" ? true : (console.log("   ↳", an, datum, zeit, chips), false);
  });
  await step("Von Hand änderbar: Uhrzeit 10:30, „1 Std. vorher“ dazu; ein weiterer Text überschreibt das nicht", async () => {
    const t = fenster.locator("[data-memory-erinnern]");
    await t.locator("[data-memory-erinnern-zeit]").fill("10:30");
    await t.locator('[data-erinnerung="60m"]').click();
    await fenster.locator("[data-notiz-eingabe]").fill("Erinnere mich morgen um 9 Uhr Jens anzurufen, Nummer liegt im Ordner");
    return (await t.locator("[data-memory-erinnern-zeit]").inputValue()) === "10:30" && (await t.locator(".kalender-chip.an").allInnerTexts()).join() === "1 Std. vorher,15 Min. vorher,zur Uhrzeit";
  });
  await step("Speichern legt einen Erinnerungseintrag und eine Aufgabe mit Termin, Uhrzeit, Erinnerung und Kalender-Haken an", async () => {
    await fenster.locator("[data-memory-erinnern-kalender]").check();
    await fenster.locator("[data-notiz-speichern]").click();
    await fenster.waitFor({ state: "detached", timeout: 10000 });
    await vaultFixture(page);
    const records = await page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records; });
    const ev = records.find((r) => r.recordType === "event" && /Jens anzurufen/.test(JSON.stringify(r.data)));
    const task = records.find((r) => r.recordType === "task" && r.source === ev?.id);
    const ok = ev && task && task.data.dueAt === morgen && task.data.dueTime === "10:30" && task.data.kalenderEintragen === true && JSON.stringify(task.data.erinnerungen) === JSON.stringify(["60m", "15m", "0m"]);
    return ok ? true : (console.log("   ↳", JSON.stringify(task?.data)), false);
  });
  await step("Ohne „Erinnern lassen“: nur die Notiz, keine Aufgabe; Erinnern bleibt von Hand einschaltbar", async () => {
    await page.locator("[data-notiz-knopf]").click(); await fenster.waitFor();
    await page.waitForFunction(() => (document.querySelector("[data-notiz-eingabe]") || {}).value?.includes("morgen um 9 Uhr"), null, { timeout: 5000 });
    await fenster.locator(".dictation-button.listening").click().catch(() => {});
    await page.waitForFunction(() => !document.querySelector("[data-notiz-fenster] .dictation-button.listening"), null, { timeout: 5000 });
    await fenster.locator("[data-notiz-eingabe]").fill("Heute war ein ruhiger Tag.");
    await page.waitForTimeout(300);
    const aus = !(await fenster.locator("[data-memory-erinnern-haken]").isChecked());
    await fenster.locator("[data-memory-erinnern-haken]").click();
    const felder = await fenster.locator("[data-memory-erinnern-datum]").isVisible();
    await fenster.locator("[data-memory-erinnern-haken]").click();
    if (await fenster.locator("[data-memory-erinnern-haken]").isChecked()) { console.log("   ↳ Text:", await fenster.locator("[data-notiz-eingabe]").inputValue()); return false; }
    const vorher = await page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records.filter((r) => r.recordType === "task").length; });
    await fenster.locator("[data-notiz-speichern]").click();
    await fenster.waitFor({ state: "detached", timeout: 10000 });
    const nachher = await page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records.filter((r) => r.recordType === "task").length; });
    return aus && felder && nachher === vorher ? true : (console.log("   ↳", aus, felder, vorher, nachher, await fenster.locator("[data-notiz-eingabe]").inputValue().catch(() => "-")), false);
  });
  check(errors.length === 0, "Desktop: keine Seitenfehler", errors.join(" | "));
  await context.close();

  for (const breite of [390, 320]) {
    const ctx = await browser.newContext({ ...HANDY, viewport: { width: breite, height: 760 } });
    const p = await ctx.newPage(); const err = collectErrors(p);
    await p.goto(app.base, { waitUntil: "networkidle" }); await ready(p);
    await step(`Handy ${breite} px: „Notiz“ im Kopf sichtbar, Kopf ohne Überlauf, Fenster im Bild`, async () => {
      const m = await p.evaluate(() => { const kopf = document.querySelector(".masthead"), n = document.querySelector("[data-notiz-knopf]").getBoundingClientRect(); return { ueber: kopf.scrollWidth - kopf.clientWidth, seite: document.documentElement.scrollWidth - innerWidth, rechts: n.right, breite: innerWidth, sichtbar: n.width > 0 }; });
      await p.locator("[data-notiz-knopf]").click();
      const f = await p.locator("[data-notiz-fenster]").boundingBox();
      return m.sichtbar && m.ueber <= 0 && m.seite <= 0 && m.rechts <= m.breite && f && f.x >= 0 && f.x + f.width <= m.breite + 0.5 ? true : (console.log("   ↳", JSON.stringify({ ...m, f })), false);
    });
    check(err.length === 0, `Handy ${breite} px: keine Seitenfehler`, err.join(" | "));
    await ctx.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Notiz"));
