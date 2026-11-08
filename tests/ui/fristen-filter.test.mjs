// 2.28.39 (Punkt 10): Fristenliste mit Suchfeld und Filtern (Offen · Diese Woche · Überfällig · Erledigt), 50 je Seite,
// andere Jahre mit Jahreszahl. Der Sprung an #termin-<id> trifft auch einen Eintrag auf einer späteren Seite. Das Auge
// zeigt nur, was nicht schon in der Zeile steht; Verknüpfungen mit Namen statt Kennung. Alle Einträge erfunden.
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(15000);
  await page.addInitScript(windowStub);
  await page.clock.install({ time: new Date(2026, 10, 10, 10, 0) }); // Dienstag, 10.11.2026
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  const ids = await page.evaluate(async () => {
    const f = window.__vaultFixture; const v = await f.browserVault();
    const vorgang = await f.createLocalFamilyRecord(v, { recordType: "case", data: { title: "Umzug Sonnenweg", caseType: "Probe" }, status: "offen", source: "Probe" });
    const neu = async (title, dueAt, references = []) => { await f.createLocalScheduleBundle(v, { recordType: "task", title, dueAt, reminderAt: null, source: "Probe", notes: null, references }); const d = await f.readLocalVaultData(v); return d.records.find((r) => r.data.title === title).id; };
    for (let i = 1; i <= 52; i++) await neu(`Probe Aufgabe ${String(i).padStart(2, "0")} Birkenhain`, `2026-12-${String(1 + (i % 28)).padStart(2, "0")}`);
    const ueber = await neu("Rechnung überfällig Eichenblatt", "2026-11-03");
    const woche = await neu("Termin diese Woche Lindenhof", "2026-11-12", [{ recordType: "case", id: vorgang.id, relationType: "gehört zu" }]);
    const spaet = await neu("Steuererklärung Wolkenpost", "2027-03-15");
    const fertig = await neu("Erledigt Probe Ahorn", "2026-11-05");
    await f.updateLocalScheduleStatus(v, fertig, "erledigt");
    return { ueber, woche, spaet, fertig, vorgang: vorgang.id };
  });
  await page.reload({ waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  await footer(page, "Fristen und Aufgaben");
  const liste = page.locator("#offene-fristen");
  await liste.locator(`[data-fristen-suche]`).waitFor();
  const zeilen = () => liste.locator(".schedule-list > article").count();

  await step("50 je Seite: 50 Zeilen und „Weitere … anzeigen“", async () => {
    // Der Prüftresor bringt eigene Beispieleinträge mit; gezählt wird gegen den Zähler „N angezeigt“.
    const n = await zeilen(); const mehr = Number(await liste.locator("[data-liste-mehr]").getAttribute("data-liste-mehr"));
    const gesamt = Number((await liste.locator(".badge", { hasText: "angezeigt" }).innerText()).match(/\d+/)[0]);
    return soll(n === 50 && gesamt >= 56 && mehr === gesamt - 50, { n, mehr, gesamt });
  });
  await step("Suchfeld: „Wolkenpost“ zeigt nur diesen Eintrag – mit Jahreszahl 2027", async () => {
    await liste.locator("[data-fristen-suche]").fill("Wolkenpost");
    const n = await zeilen(); const datum = await liste.locator(`#termin-${ids.spaet} .mk-zeit`).innerText();
    await liste.locator("[data-fristen-suche]").fill("");
    return soll(n === 1 && /15\.03\.2027/.test(datum), { n, datum });
  });
  await step("Dieses Jahr ohne Jahreszahl (12.11.)", async () => {
    const datum = await liste.locator(`#termin-${ids.woche} .mk-zeit`).innerText();
    return soll(/^12\.11\.$/.test(datum.split("\n")[0].trim()), datum);
  });
  await step("Filter „Überfällig“ und „Diese Woche“", async () => {
    await liste.locator('[data-fristen-chip="ueberfaellig"]').click();
    const ueber = await liste.locator(".schedule-list > article").evaluateAll((els) => els.map((e) => [e.id, e.classList.contains("schedule-overdue")]));
    await liste.locator('[data-fristen-chip="woche"]').click();
    const woche = await liste.locator(".schedule-list > article").evaluateAll((els) => els.map((e) => [e.id, e.querySelector(".mk-zeit")?.textContent || ""]));
    await liste.locator('[data-fristen-chip="offen"]').click();
    const inWoche = (t) => /^(09|1[0-5])\.11\./.test(t);
    return soll(ueber.some(([id]) => id === `termin-${ids.ueber}`) && ueber.every(([, o]) => o)
      && woche.some(([id]) => id === `termin-${ids.woche}`) && woche.every(([, t]) => inWoche(t)) && !woche.some(([id]) => id === `termin-${ids.spaet}`), { ueber, woche });
  });
  await step("„Erledigt“ öffnet die erledigten Punkte mit dem erledigten Eintrag", async () => {
    await liste.locator('[data-fristen-chip="erledigt"]').click();
    await page.locator(`#erledigte-fristen #termin-${ids.fertig}`).waitFor({ state: "visible" });
    return soll(await page.locator(`#offene-fristen #termin-${ids.fertig}`).count() === 0, "erledigter Eintrag steht auch oben");
  });
  await step("Auge ohne Doppelung: kein Titel, Datum, Art, Kennung; Vorgang mit Namen", async () => {
    const z = liste.locator(`#termin-${ids.woche}`);
    await z.locator("[data-termin-auge]").click();
    const offen = await z.locator("[data-termin-offen]").innerText();
    return soll(!/Termin diese Woche Lindenhof/.test(offen) && !/12\.11/.test(offen) && !/Aufgabe ·/.test(offen) && !/Kennung/.test(offen) && /Vorgang: Umzug Sonnenweg/.test(offen) && !offen.includes(ids.vorgang), offen);
  });
  await step("Sprung an #termin-<id> auf Seite 2 (aus der Suche): Eintrag steht offen im Bild", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(".global-search input").fill("Steuererklärung Wolkenpost");
    await page.locator(".search-results button", { hasText: "Steuererklärung Wolkenpost" }).first().click();
    const el = page.locator(`#termin-${ids.spaet}`); await el.waitFor({ timeout: 10000 });
    await page.waitForTimeout(1200);
    const lage = await el.evaluate((e) => { const r = e.getBoundingClientRect(); return { top: r.top, h: innerHeight, offen: e.classList.contains("offen") }; });
    return soll(lage.offen && lage.top >= 0 && lage.top < lage.h, lage);
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Fristenliste filtern"));
