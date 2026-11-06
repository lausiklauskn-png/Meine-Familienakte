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
    const ampel = await t.locator("[data-memory-erinnern-kalender]").getAttribute("data-memory-erinnern-kalender");
    if (ampel !== "keiner" || !/Kein Kalender verbunden/.test(await t.locator("[data-memory-erinnern-kalender]").innerText())) { console.log("   ↳ Ampel", ampel); return false; }
    const chips = await t.locator(".kalender-chip.an").allInnerTexts();
    return an && datum === morgen && zeit === "09:00" && chips.join() === "15 Min. vorher,zur Uhrzeit" ? true : (console.log("   ↳", an, datum, zeit, chips), false);
  });
  await step("„Woran erinnern“ hat ein Mikrofon (Klaus 2026-11-06)", async () => (await fenster.locator(".memory-erinnern-titel .dictation-button").count()) === 1);
  await step("Von Hand änderbar: Uhrzeit 10:30, „1 Std. vorher“ dazu; ein weiterer Text überschreibt das nicht", async () => {
    const t = fenster.locator("[data-memory-erinnern]");
    await t.locator("[data-memory-erinnern-zeit]").fill("10:30");
    await t.locator('[data-erinnerung="60m"]').click();
    await fenster.locator("[data-notiz-eingabe]").fill("Erinnere mich morgen um 9 Uhr Jens anzurufen, Nummer liegt im Ordner");
    return (await t.locator("[data-memory-erinnern-zeit]").inputValue()) === "10:30" && (await t.locator(".kalender-chip.an").allInnerTexts()).join() === "1 Std. vorher,15 Min. vorher,zur Uhrzeit";
  });
  await step("Speichern legt einen Erinnerungseintrag und eine Aufgabe mit Termin, Uhrzeit, Erinnerung und Kalender-Haken an", async () => {
    await fenster.locator("[data-notiz-speichern]").click();
    await fenster.locator("[data-notiz-liste] li").first().waitFor({ timeout: 10000 });
    const muell = await fenster.locator("[data-notiz-liste] [data-notiz-loeschen]").isVisible() && (await fenster.locator("[data-notiz-eingabe]").inputValue()) === "" && /Jens anzurufen/.test(await fenster.locator("[data-notiz-liste]").innerText());
    await fenster.locator("[data-notiz-fertig]").click();
    await fenster.waitFor({ state: "detached", timeout: 10000 });
    if (!muell) { console.log("   ↳ nach dem Haken keine Liste mit Mülleimer"); return false; }
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
    await fenster.locator("[data-notiz-liste] li").first().waitFor({ timeout: 10000 });
    await fenster.locator("[data-notiz-fertig]").click();
    await fenster.waitFor({ state: "detached", timeout: 10000 });
    const nachher = await page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records.filter((r) => r.recordType === "task").length; });
    return aus && felder && nachher === vorher ? true : (console.log("   ↳", aus, felder, vorher, nachher, await fenster.locator("[data-notiz-eingabe]").inputValue().catch(() => "-")), false);
  });
  await step("Mehrere Notizen hintereinander: jede klappt in die Liste, der Mülleimer löscht genau sie samt Aufgabe", async () => {
    const zahl = () => page.evaluate(async () => { const f = window.__vaultFixture; const r = (await f.readLocalVaultData(await f.browserVault())).records; return r.filter((x) => /Müll rausbringen/.test(JSON.stringify(x.data))).length; });
    await page.locator("[data-notiz-knopf]").click(); await fenster.waitFor();
    await page.waitForFunction(() => (document.querySelector("[data-notiz-eingabe]") || {}).value?.includes("morgen um 9 Uhr"), null, { timeout: 5000 });
    await fenster.locator(".dictation-button.listening").click().catch(() => {});
    await page.waitForFunction(() => !document.querySelector("[data-notiz-fenster] .dictation-button.listening"), null, { timeout: 5000 });
    await fenster.locator("[data-notiz-eingabe]").fill("Erinnere mich morgen um 7 Uhr, Müll rausbringen");
    await fenster.locator("[data-notiz-speichern]").click();
    await fenster.locator("[data-notiz-liste] li").nth(0).waitFor();
    await fenster.locator("[data-notiz-eingabe]").fill("Erinnere mich übermorgen um 18 Uhr, Blumen gießen");
    await fenster.locator("[data-notiz-speichern]").click();
    await page.waitForFunction(() => document.querySelectorAll("[data-notiz-liste] li").length === 2);
    const nachSpeichern = await zahl();
    await fenster.locator("[data-notiz-liste] li", { hasText: "Müll rausbringen" }).locator("[data-notiz-loeschen]").click();
    await page.waitForFunction(() => document.querySelectorAll("[data-notiz-liste] li").length === 1);
    const nachLoeschen = await zahl();
    const bleibt = /Blumen gießen/.test(await fenster.locator("[data-notiz-liste]").innerText());
    await fenster.locator("[data-notiz-fertig]").click();
    return nachSpeichern === 2 && nachLoeschen === 0 && bleibt ? true : (console.log("   ↳", nachSpeichern, nachLoeschen, bleibt), false);
  });
  await step("Roter Kalender-Knopf springt zu „Kalender verbinden“ (Karte offen); der Notiz-Text bleibt erhalten", async () => {
    await page.locator("[data-notiz-knopf]").click(); await fenster.waitFor();
    await page.waitForFunction(() => (document.querySelector("[data-notiz-eingabe]") || {}).value?.includes("morgen um 9 Uhr"), null, { timeout: 5000 });
    await fenster.locator(".dictation-button.listening").click().catch(() => {});
    await page.waitForFunction(() => !document.querySelector("[data-notiz-fenster] .dictation-button.listening"), null, { timeout: 5000 });
    await fenster.locator("[data-notiz-eingabe]").fill("Erinnere mich morgen um 10 Uhr, Zahnarzt");
    await fenster.locator("[data-memory-erinnern-kalender]").click();
    await fenster.waitFor({ state: "detached" });
    await page.locator("#kalender-verbinden").waitFor(); await page.waitForTimeout(700);
    const offen = await page.locator("#kalender-verbinden").evaluate((d) => d.open);
    await page.locator("[data-notiz-knopf]").click(); await fenster.waitFor();
    const text = await fenster.locator("[data-notiz-eingabe]").inputValue();
    await fenster.locator("[data-notiz-leeren]").click();
    await fenster.locator("[data-notiz-schliessen]").click();
    return offen && text === "Erinnere mich morgen um 10 Uhr, Zahnarzt" ? true : (console.log("   ↳", offen, text), false);
  });
  await step("Kleines × im Textfeld löscht Text und Erinnerung; ohne Text keine Erinnerung", async () => {
    await page.locator("[data-notiz-knopf]").click(); await fenster.waitFor();
    await page.waitForFunction(() => (document.querySelector("[data-notiz-eingabe]") || {}).value?.includes("morgen um 9 Uhr"), null, { timeout: 5000 });
    await fenster.locator(".dictation-button.listening").click().catch(() => {});
    const mitText = await fenster.locator("[data-memory-erinnern-haken]").isChecked();
    await fenster.locator("[data-notiz-leeren]").click();
    const leer = (await fenster.locator("[data-notiz-eingabe]").inputValue()) === "" && (await fenster.locator("[data-memory-erinnern]").count()) === 0 && (await fenster.locator("[data-notiz-speichern]").isDisabled());
    await fenster.locator("[data-notiz-schliessen]").click();
    return mitText && leer;
  });
  await step("Eigene Erinnerungszeit: „weitere … → eigene Zeit“, Tag und 12:30 → Chip und im Register gespeichert", async () => {
    await page.locator("[data-notiz-knopf]").click(); await fenster.waitFor();
    await page.waitForFunction(() => (document.querySelector("[data-notiz-eingabe]") || {}).value?.includes("morgen um 9 Uhr"), null, { timeout: 5000 });
    await fenster.locator(".dictation-button.listening").click().catch(() => {});
    await page.waitForFunction(() => !document.querySelector("[data-notiz-fenster] .dictation-button.listening"), null, { timeout: 5000 });
    await fenster.locator("[data-notiz-eingabe]").fill("Erinnere mich morgen um 15 Uhr, Paket abholen");
    await fenster.locator("[data-erinnerung-tage]").selectOption("eigen");
    await fenster.locator("[data-erinnerung-eigen-tag]").fill(morgen);
    await fenster.locator("[data-erinnerung-eigen-zeit]").fill("12:30");
    await fenster.locator("[data-erinnerung-eigen-ok]").click();
    const chip = await fenster.locator(`[data-erinnerung="@${morgen}T12:30"]`).innerText();
    await fenster.locator("[data-notiz-speichern]").click(); await fenster.locator("[data-notiz-liste] li").first().waitFor();
    await fenster.locator("[data-notiz-fertig]").click(); await fenster.waitFor({ state: "detached" });
    const r = await page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records; });
    const t = r.find((x) => x.recordType === "task" && x.data.title === "Paket abholen");
    return /12:30 Uhr/.test(chip) && t?.data.erinnerungen?.includes(`@${morgen}T12:30`) ? true : (console.log("   ↳", chip, JSON.stringify(t?.data)), false);
  });
  await step("Notiz mit Erinnerung gespeichert: App-Glocke ist danach von selbst an (Mein Kalender zeigt „an“)", async () => {
    await page.locator("[data-mein-kalender-knopf]").click();
    const k = page.locator("[data-mein-kalender] [data-glocke]"); await k.waitFor();
    return (await k.getAttribute("data-glocke")) === "an";
  });
  await step("Kamera in der Notiz (Klaus 2026-11-06): Mikrofon, Kamera, Haken untereinander; Foto allein und mit Text gespeichert", async () => {
    await page.locator("[data-notiz-knopf]").click(); await fenster.waitFor();
    await page.waitForFunction(() => (document.querySelector("[data-notiz-eingabe]") || {}).value?.length > 0, null, { timeout: 5000 });
    await fenster.locator(".dictation-button.listening").click().catch(() => {});
    await fenster.locator("[data-notiz-leeren]").click();
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const lage = await page.evaluate(() => ["[data-notiz-fenster] .dictation-button", "[data-notiz-kamera]", "[data-notiz-speichern]"].map((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; }));
    await fenster.locator("[data-notiz-kamera-eingabe]").setInputFiles({ name: "zaehler.png", mimeType: "image/png", buffer: png });
    await fenster.locator("[data-notiz-fotos] img").first().waitFor();
    if (!(await fenster.locator("[data-notiz-speichern]").isEnabled())) { console.log("   ↳ Haken ohne Text gesperrt"); return false; }
    await fenster.locator("[data-notiz-speichern]").click();
    await fenster.locator("[data-notiz-liste] li", { hasText: "📷 1" }).waitFor({ timeout: 8000 });
    const leer = await fenster.locator("[data-notiz-fotos]").count();
    await fenster.locator("[data-notiz-eingabe]").fill("Zählerstand Wasser notiert");
    await fenster.locator("[data-notiz-kamera-eingabe]").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: png }, { name: "b.png", mimeType: "image/png", buffer: png }]);
    await fenster.locator("[data-notiz-speichern]").click();
    await fenster.locator("[data-notiz-liste] li", { hasText: "Zählerstand" }).waitFor({ timeout: 8000 });
    await fenster.locator("[data-notiz-fertig]").click(); await fenster.waitFor({ state: "detached" });
    const r = await page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records; });
    const ev = r.filter((x) => x.recordType === "event" && Array.isArray(x.data.media) && x.data.media.length);
    const nurFoto = ev.find((x) => x.data.captureType === "foto" && x.data.media.length === 1);
    const mitText = ev.find((x) => x.data.captureType === "kombination" && x.data.media.length === 2 && /Zählerstand/.test(x.data.originalText || ""));
    const untereinander = lage[0][1] < lage[1][1] && lage[1][1] < lage[2][1] && Math.abs(lage[0][0] - lage[2][0]) <= 8;
    return nurFoto && mitText && leer === 0 && untereinander ? true : (console.log("   ↳", JSON.stringify(lage), leer, JSON.stringify(ev.map((x) => [x.data.captureType, x.data.media.length]))), false);
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
