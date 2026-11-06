// „Memory bearbeiten“ (Klaus 2026-11-05): Lebensbereich, Zeitpunkt, Einordnung, Text änderbar; Erinnerung (Tag, Uhrzeit)
// änderbar oder nachträglich anlegen. Prüft, was im Register steht.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors, footer, internetAn } from "./_harness.mjs";
import { speechStub } from "./_stubs.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";

const app = await startApp();
const browser = await launchBrowser();
const register = async (page) => { await vaultFixture(page); return page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records; }); };
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.addInitScript(speechStub("ich erwarte einen Anruf um 15 Uhr von meinem Freund"));
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await internetAn(page);
  const fenster = page.locator("[data-notiz-fenster]");
  // Notiz ohne „erinnere mich“: gespeichert ohne Erinnerung.
  await page.locator("[data-notiz-knopf]").click(); await fenster.waitFor();
  await page.waitForFunction(() => (document.querySelector("[data-notiz-eingabe]") || {}).value?.includes("15 Uhr"), null, { timeout: 5000 });
  await fenster.locator(".dictation-button.listening").click().catch(() => {});
  await fenster.locator("[data-notiz-speichern]").click(); await fenster.locator("[data-notiz-liste] li").first().waitFor();
  await fenster.locator("[data-notiz-fertig]").click(); await fenster.waitFor({ state: "detached" });

  await footer(page, "Tagebuch & Erinnerungen");
  const dialog = page.locator("[data-memory-bearbeiten]");
  await step("„Memory bearbeiten“ öffnet ein Fenster mit Lebensbereich, Tag, Uhrzeit, Einordnung und „Erinnern lassen“", async () => {
    await page.locator("button", { hasText: "ich erwarte einen Anruf" }).first().click();
    await page.locator("button", { hasText: "Memory bearbeiten" }).click();
    await dialog.waitFor();
    return (await dialog.locator("[data-mb-bereich]").count()) === 1 && (await dialog.locator("[data-mb-tag]").count()) === 1 && (await dialog.locator("[data-mb-einordnung]").count()) === 1 && (await dialog.locator("[data-memory-erinnern]").count()) === 1;
  });
  await step("Ändern und Erinnerung nachträglich anlegen: steht im Register (Bereich, Zeitpunkt, Einordnung, Aufgabe mit 15:00)", async () => {
    await dialog.locator("[data-mb-bereich]").selectOption("Familie & Personen").catch(async () => { const o = await dialog.locator("[data-mb-bereich] option").allInnerTexts(); await dialog.locator("[data-mb-bereich]").selectOption(o[1]); });
    const bereich = await dialog.locator("[data-mb-bereich]").inputValue();
    await dialog.locator("[data-mb-tag]").fill("2026-11-04");
    await dialog.locator("[data-mb-uhr]").fill("14:10");
    await dialog.locator("[data-mb-einordnung]").selectOption("unklar");
    await dialog.locator("[data-memory-erinnern-haken]").check();
    await dialog.locator("[data-memory-erinnern-datum]").fill("2026-11-12");
    await dialog.locator("[data-memory-erinnern-zeit]").fill("15:00");
    await dialog.locator("[data-mb-speichern]").click(); await dialog.waitFor({ state: "detached", timeout: 10000 });
    const r = await register(page);
    const ev = r.find((x) => x.recordType === "event" && /Anruf um 15 Uhr/.test(x.data.originalText || ""));
    const task = r.find((x) => x.recordType === "task" && x.source === ev?.id);
    const ok = ev?.data.lifeArea === bereich && ev?.data.eventAt === "2026-11-04T14:10:00" && ev?.data.confidence === "unklar" && task?.data.dueAt === "2026-11-12" && task?.data.dueTime === "15:00" && task?.data.kalenderEintragen === true;
    return ok ? true : (console.log("   ↳", JSON.stringify(ev?.data).slice(0, 300), JSON.stringify(task?.data)), false);
  });
  await step("Erinnerung später ändern: Uhrzeit 16:30 im zweiten Bearbeiten", async () => {
    await page.locator("button", { hasText: "Memory bearbeiten" }).click(); await dialog.waitFor();
    await dialog.locator("[data-mb-termin-uhr]").fill("16:30");
    await dialog.locator("[data-mb-speichern]").click(); await dialog.waitFor({ state: "detached", timeout: 10000 });
    const r = await register(page);
    const ev = r.find((x) => x.recordType === "event" && /Anruf um 15 Uhr/.test(x.data.originalText || ""));
    const tasks = r.filter((x) => x.recordType === "task" && x.source === ev?.id);
    return tasks.length === 1 && tasks[0].data.dueTime === "16:30" && tasks[0].data.kalenderEintragen === true ? true : (console.log("   ↳", tasks.length, JSON.stringify(tasks.map((t) => t.data))), false);
  });
  await step("Ansicht: Kasten „Erinnerung aktiv“ mit Tag und Uhrzeit, Glocke in der Chronologie", async () => {
    const k = page.locator("[data-erinnerung-kasten]");
    const text = await k.innerText();
    const glocke = await page.locator("button", { hasText: "ich erwarte einen Anruf" }).first().locator("[data-memory-glocke]").innerText();
    return /Erinnerung aktiv/.test(text) && /12\.11\.2026, 16:30 Uhr/.test(text) && /Erinnerung ändern/.test(text) && /12\.11\., 16:30 Uhr/.test(glocke) ? true : (console.log("   ↳", text, "|", glocke), false);
  });
  await step("Tagebuch-Mülleimer (Klaus 2026-11-06): erster Tipp „Löschen?“, zweiter löscht Notiz samt Erinnerung", async () => {
    const zeile = page.locator(".memory-event-zeile", { hasText: "ich erwarte einen Anruf" }).first();
    await zeile.locator("[data-memory-auge]").click(); // 2.28.30: Mülleimer hinter dem Auge
    const knopf = zeile.locator("[data-notiz-tagebuch-loeschen]");
    await knopf.click();
    const sicher = await knopf.getAttribute("data-notiz-tagebuch-loeschen");
    await knopf.click();
    await page.waitForFunction(() => !Array.from(document.querySelectorAll(".memory-event-zeile")).some((e) => /ich erwarte einen Anruf/.test(e.textContent || "")), null, { timeout: 8000 });
    const r = await register(page);
    const rest = r.filter((x) => /Anruf um 15 Uhr|erwarte einen Anruf/i.test(JSON.stringify(x.data)) && x.status !== "archiviert");
    return sicher === "sicher" && rest.length === 0 ? true : (console.log("   ↳", sicher, JSON.stringify(rest.map((x) => [x.recordType, x.status]))), false);
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
  await context.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Memory bearbeiten"));
