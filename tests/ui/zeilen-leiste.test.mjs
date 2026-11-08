// 2.28.38 (Klaus 08.11.2026): Listenzeilen „Datum/Uhrzeit · Anfang … Hauptwort · Art und Glocke“; am Handy stecken ✓ ✎ 🗑 👁
// in einer Aufklappleiste (Pfeil ‹ auf, › zu, nur eine offen), breit stehen sie direkt in der Zeile. Stift ändert auch reine
// Erinnerungen (Titel, Tag, Uhrzeit), der Mülleimer löscht nach zwei Tipps.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, footer, collectErrors } from "./_harness.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };
const TITEL = "er mich an meinen Arztbesuch einen Tag um 15 Minuten vorher erinnere mich an meinen Arztbesuch Uhr 15:23 Uhr";
const app = await startApp();
const browser = await launchBrowser();
const register = (page) => page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records; });
try {
  for (const [name, geraet] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const context = await browser.newContext(geraet);
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.clock.install({ time: new Date(2026, 10, 10, 14, 0) });
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await vaultFixture(page);
    // Je Gerät ein eigener Browser-Speicher: Frist mit Uhrzeit, Glocke und Erinnerungsdatum anlegen, dann neu laden.
    const ids = await page.evaluate(async (titel) => {
      const f = window.__vaultFixture;
      // 2.28.39: das Erinnerungsdatum steht in der Aufgabe selbst; eine freie Erinnerung (ohne Aufgabe) bleibt eigener Eintrag.
      await f.createLocalScheduleBundle(await f.browserVault(), { recordType: "task", title: titel, dueAt: "2026-11-25", dueTime: "08:20", erinnerungen: ["15m"], reminderAt: "2026-11-24T09:00", references: [] });
      await f.createLocalFamilyRecord(await f.browserVault(), { recordType: "reminder", data: { title: `Erinnerung: ${titel}`, remindAt: "2026-11-24T09:00" }, status: "offen", source: "Probe" });
      return { alle: (await f.readLocalVaultData(await f.browserVault())).records.filter((x) => (x.recordType === "task" || x.recordType === "reminder") && String(x.data.title || "").includes(titel)).map((x) => [x.recordType, x.id]) };
    }, TITEL);
    await page.reload({ waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
    await footer(page, "Fristen und Aufgaben");
    const aufgabe = ids.alle.find(([t]) => t === "task")[1];
    const erinnerung = ids.alle.find(([t]) => t === "reminder")[1];
    const zeileA = page.locator(`#termin-${aufgabe}`);
    const zeileE = page.locator(`#termin-${erinnerung}`);

    await step(`${name}: Zeile zeigt „Anfang … Arztbesuch“, Datum mit Uhrzeit, Art und Glocke`, async () => {
      await zeileA.waitFor({ timeout: 15000 });
      const ende = await zeileA.locator(".flach-e").innerText();
      const punkte = await zeileA.locator(".flach-p").count();
      const zeit = await zeileA.locator(".mk-zeit").innerText();
      const klein = await zeileA.locator(".mk-text small").innerText();
      return soll(ende === "Arztbesuch" && punkte === 1 && /25\.11/.test(zeit) && /08:20/.test(zeit) && /Aufgabe/.test(klein) && /15 Min/.test(klein) && /24\.11\., 09:00 Uhr/.test(klein), { ende, punkte, zeit, klein });
    });
    await step(`${name}: Erinnerungsdatum ist Teil der Aufgabe – kein zweiter Datensatz „Erinnerung: …“ (Vorschau D)`, async () => {
      const r = await register(page);
      const t = r.find((x) => x.id === aufgabe);
      const rems = r.filter((x) => x.recordType === "reminder" && x.status !== "archiviert" && String(x.data.title).includes(TITEL));
      return soll((t?.data.erinnerungen || []).includes("@2026-11-24T09:00") && rems.length === 1 && rems[0].id === erinnerung, { erinnerungen: t?.data.erinnerungen, rems: rems.map((x) => x.id) });
    });

    if (name === "Desktop") {
      await step("Desktop: breite Zeile – ✓ ✎ 🗑 👁 direkt sichtbar, kein Pfeil", async () => {
        const griff = await zeileA.locator("[data-fz-griff]").isVisible();
        const stift = await zeileA.locator(`[data-termin-aendern="${aufgabe}"]`).isVisible();
        const eimer = await zeileA.locator("[data-erinnerung-loeschen]").isVisible();
        return soll(!griff && stift && eimer, { griff, stift, eimer });
      });
      await step("Stift an einer reinen Erinnerung: Fenster mit Titel, Tag, Uhrzeit (ohne Kalender); 10:15 wird gespeichert", async () => {
        await zeileE.locator(`[data-termin-aendern="${erinnerung}"]`).click();
        const f = page.locator("[data-termin-bearbeiten]"); await f.waitFor();
        const kopf = await f.locator(".eyebrow").innerText();
        const kalender = await f.locator("[data-tb-kalender]").count();
        await f.locator("[data-tb-uhr]").fill("10:15");
        await f.locator("[data-tb-speichern]").click();
        await f.waitFor({ state: "detached", timeout: 8000 });
        const r = (await register(page)).find((x) => x.id === erinnerung);
        return soll(/Erinnerung/i.test(kopf) && kalender === 0 && r?.data.remindAt === "2026-11-24T10:15", { kopf, kalender, remindAt: r?.data.remindAt });
      });
    } else {
      await step("Handy: Knöpfe in der Leiste – nur der Pfeil ‹ ist zu sehen", async () => {
        const griff = await zeileA.locator("[data-fz-griff]").isVisible();
        const stift = await zeileA.locator(`[data-termin-aendern="${aufgabe}"]`).isVisible();
        return soll(griff && !stift, { griff, stift });
      });
      await step("Handy: ‹ öffnet die Leiste, eine zweite schließt die erste, › schließt", async () => {
        await zeileA.locator("[data-fz-griff]").click();
        await zeileA.locator("[data-fz-leiste=auf]").waitFor();
        const stift = await zeileA.locator(`[data-termin-aendern="${aufgabe}"]`).isVisible();
        await zeileE.locator("[data-fz-griff]").click();
        await zeileE.locator("[data-fz-leiste=auf]").waitFor();
        const ersteZu = (await zeileA.locator("[data-fz-leiste=auf]").count()) === 0;
        await zeileE.locator("[data-fz-zu]").click();
        await page.waitForTimeout(300);
        const zweiteZu = (await zeileE.locator("[data-fz-leiste=auf]").count()) === 0;
        return soll(stift && ersteZu && zweiteZu, { stift, ersteZu, zweiteZu });
      });
      await step("Handy: Mülleimer in der Leiste löscht erst beim zweiten Tipp", async () => {
        await zeileE.locator("[data-fz-griff]").click();
        await zeileE.locator("[data-fz-leiste=auf]").waitFor();
        await zeileE.locator("[data-erinnerung-loeschen]").click();
        const nachEinem = (await register(page)).find((x) => x.id === erinnerung)?.status;
        await zeileE.locator("[data-erinnerung-loeschen=sicher]").click();
        await zeileE.waitFor({ state: "detached", timeout: 8000 });
        const nachZwei = (await register(page)).find((x) => x.id === erinnerung)?.status;
        return soll(nachEinem === "offen" && nachZwei === "archiviert", { nachEinem, nachZwei });
      });
      check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "Handy: Seite ohne waagerechten Überlauf");
    }
    check(errors.length === 0, `${name}: keine Seitenfehler`, errors.join(" | "));
    await context.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Zeilen mit Leiste"));
