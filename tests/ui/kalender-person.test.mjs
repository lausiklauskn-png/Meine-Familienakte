// Kalender je Person (Klaus 20.11.2026, Vorschau docs/vorschau/kalender-person-familie.html): das Handy gehört einer Person,
// „Kalender von …“ zeigt ihre Termine; vorläufig mit „Für wen noch“, Warnung bei Überschneidung, privat; „Fristen und Aufgaben“
// zeigt die Familie mit Filter je Person, „belegt“ für Privates der anderen, „passt / passt nicht“ für Mitgemeinte.
import { startApp, launchBrowser, DESKTOP, ready, step, summary, collectErrors, internetAn, soll } from "./_harness.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage(); const errors = collectErrors(page);
  await page.clock.install({ time: new Date(2026, 10, 20, 10, 0) });
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await internetAn(page);
  await vaultFixture(page);
  const ids = await page.evaluate(async () => { const f = window.__vaultFixture, h = await f.browserVault();
    const a = await f.saveLocalStammRecord(h, { recordType: "person", angaben: { name: "Anna Beispiel", art: "", notiz: "" } });
    const b = await f.saveLocalStammRecord(h, { recordType: "person", angaben: { name: "Bernd Beispiel", art: "", notiz: "" } });
    await f.createLocalScheduleBundle(h, { recordType: "task", title: "Fußball", dueAt: "2026-11-20", dueTime: "18:30", references: [], familie: { fuer: [b.id], von: b.id } });
    await f.createLocalScheduleBundle(h, { recordType: "task", title: "Geheimer Termin", dueAt: "2026-11-21", dueTime: "09:00", references: [], familie: { fuer: [b.id], von: b.id, privat: true } });
    await f.createLocalScheduleBundle(h, { recordType: "task", title: "Kino mit Anna", dueAt: "2026-11-22", dueTime: "20:00", references: [], familie: { fuer: [b.id, a.id], von: b.id, vorlaeufig: true } });
    return { a: a.id, b: b.id }; });
  await page.reload({ waitUntil: "networkidle" }); await ready(page);
  const kal = page.locator("[data-mein-kalender]");
  await page.locator("[data-mein-kalender-knopf]").click(); await kal.waitFor();

  await step("Erstes Öffnen: „Wem gehört dieses Handy?“ – Anna wählen → „Kalender von Anna“", async () => {
    await kal.locator("[data-mk-ich-wahl]").waitFor();
    await kal.locator(`[data-mk-ich-person="${ids.a}"]`).click();
    return soll(/Kalender von\s*Anna/.test(await kal.locator("h2").first().innerText()) && !(await kal.locator("[data-mk-ich-wahl]").count()), "Titel");
  });
  await step("Mein Kalender zeigt Bernds eigenen Termin nicht, wohl aber den gemeinsamen (vorläufig)", async () => {
    await kal.locator('[data-mk-tag="2026-11-20"]').click();
    const heute = await kal.locator(".mk-tagesliste").innerText();
    await kal.locator('[data-mk-tag="2026-11-22"]').click();
    const kino = kal.locator("[data-mk-eintrag]", { hasText: "Kino mit Anna" }).first();
    return soll(!/Fußball/.test(heute) && (await kino.getAttribute("data-mk-stand")) === "vorläufig", heute);
  });
  await step("Neuer Eintrag: 19:00, vorläufig, für Bernd – Warnung „Bernd hat da schon Fußball“, gespeichert mit Personen", async () => {
    await kal.locator('[data-mk-tag="2026-11-20"]').click();
    await kal.locator("[data-mk-neu]").click();
    await kal.locator("[data-mk-titel]").fill("Elternabend");
    await kal.locator("[data-mk-uhr]").fill("19:00");
    await kal.locator("[data-mk-vorlaeufig]").click();
    await kal.locator(`[data-mk-mit="${ids.b}"]`).click();
    const warn = await kal.locator("[data-mk-warnung]").first().innerText();
    await kal.locator("[data-mk-speichern]").click();
    await kal.locator("[data-mk-eintrag]", { hasText: "Elternabend" }).first().waitFor({ timeout: 8000 });
    const t = await page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records.find((r) => r.data?.title === "Elternabend")?.data; });
    return soll(/Bernd hat da schon „Fußball“/.test(warn) && t?.vorlaeufig === true && t?.von === ids.a && JSON.stringify(t?.fuer) === JSON.stringify([ids.a, ids.b]), { warn, t });
  });
  const liste = page.locator("#offene-fristen");
  await step("Fristen und Aufgaben: ganze Familie, Bernds privater Termin nur als „belegt“", async () => {
    const text = await liste.innerText();
    return soll(/Fußball/.test(text) && /Elternabend/.test(text) && !/Geheimer Termin/.test(text) && /belegt/.test(text), text.slice(0, 400));
  });
  await step("Filter „Bernd“ zeigt nur Bernds Termine", async () => {
    await liste.locator(`[data-fam-person="${ids.b}"]`).click();
    const n = await liste.locator(".schedule-item").count();
    const text = await liste.innerText();
    await liste.locator("[data-fam-filter] button", { hasText: "Alle" }).click();
    return soll(n === 4 && /Fußball/.test(text), { n });
  });
  await step("Anna sagt zum Kino „passt“ → fest", async () => {
    const kino = liste.locator(".schedule-item", { hasText: "Kino mit Anna" }).first();
    await kino.locator("[data-fam-passt]").click();
    await page.waitForTimeout(1500); // gestellte Uhr: waitForFunction pollt hier nicht
    const stand = await page.evaluate(() => [...document.querySelectorAll("#offene-fristen .schedule-item")].find((e) => /Kino/.test(e.textContent || ""))?.getAttribute("data-fam-stand"));
    const knopf = await liste.locator(".schedule-item", { hasText: "Kino mit Anna" }).first().locator("[data-fam-antwort]").count();
    return soll(stand === "fest" && knopf === 1, { stand, knopf });
  });
  await step("Keine Seitenfehler", async () => soll(errors.length === 0, errors));
} finally { await browser.close(); await app.stop(); }
summary("Kalender je Person");
