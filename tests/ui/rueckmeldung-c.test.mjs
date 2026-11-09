// Rückmeldung 09.11., Abschnitt C (Klaus: alle Fragen Ja): Tagebuch und Erinnerung getrennt. Buch-Knopf oben öffnet
// „Was ist heute passiert?“, Notiz-Knopf heißt „Erinnerung“, ein Erfassungsblock (Feld, Foto, Stimmung, Person),
// Zähler nur auf der Tagebuch-Seite und nur wenn nicht null, „Memory“ verschwindet aus der Oberfläche, und ein mit einer
// Person verknüpfter Eintrag steht beim nächsten Termin mit ihr wieder da. Am Handy (390 px).
import { startApp, launchBrowser, HANDY, ready, step, soll, check, summary, collectErrors, footer } from "./_harness.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
import { schliesseDialoge } from "./_stubs.mjs";

const register = async (page) => { await vaultFixture(page); return page.evaluate(async () => { const f = window.__vaultFixture; return f.readLocalVaultData(await f.browserVault()); }); };
const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(HANDY);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  const TEXT = "Besuch bei der Probe-Firma. Nächstes Mal eine Flasche Wein als Dankeschön mitbringen.";

  await step("Kopf: Knopf „Erinnerung“ (statt „Notiz“) und daneben das Buch „Tagebuch“", async () => {
    const r = { erinnerung: await page.locator('[data-notiz-knopf][aria-label="Erinnerung"]').count(), buch: await page.locator("[data-tagebuch-knopf]").count(), notiz: await page.locator('.site-header button[aria-label="Notiz"]').count() };
    return soll(r.erinnerung === 1 && r.buch === 1 && r.notiz === 0, r);
  });
  await step("Startseite: ein Erfassungsblock ohne Karten und ohne Zähler", async () => {
    const r = await page.evaluate(() => ({ block: document.querySelectorAll("main [data-tagebuch-erfassen]").length, karten: document.querySelectorAll("main .memory-function-grid").length, zaehler: document.querySelectorAll("main [data-tagebuch-zaehler], main .memory-counters").length }));
    return soll(r.block === 1 && r.karten === 0 && r.zaehler === 0, r);
  });
  await step("Buch-Knopf öffnet das Tagebuch oben, Feld „Was ist heute passiert?“ hat den Fokus", async () => {
    await page.evaluate(() => scrollTo(0, 2000));
    await page.locator("[data-tagebuch-knopf]").click(); await page.waitForTimeout(700);
    const r = await page.evaluate(() => ({ pfad: document.querySelector(".breadcrumb")?.textContent || "", fokus: document.activeElement?.hasAttribute("data-tagebuch-text") || false, y: scrollY }));
    return soll(/Tagebuch/.test(r.pfad) && r.fokus && r.y < 50, r);
  });
  await step("Tagebuch-Seite ohne das Wort „Memory“, Zähler nur mit Zahl größer null", async () => {
    const t = await page.locator("main").innerText();
    const zahlen = await page.locator("[data-tagebuch-zaehler] strong").allInnerTexts();
    return soll(!/Memory/.test(t) && zahlen.every((z) => Number(z) > 0) && !/Zwei getrennte Arbeitslisten/.test(t), { memory: t.match(/.{30}Memory.{30}/)?.[0], zahlen });
  });
  let person = "";
  await step("Eintrag mit Stimmung „gut“ und Person/Organisation schreiben, „Eintrag prüfen“ zeigt die Person vorgewählt, speichern", async () => {
    await page.locator("main [data-tagebuch-text]").fill(TEXT);
    await page.locator('main [data-stimmung="4"]').click();
    const wahl = page.locator("main [data-tagebuch-person]");
    const opt = await wahl.locator("option").nth(1); person = await opt.getAttribute("value");
    await wahl.selectOption(person);
    await page.locator(`main [data-tagebuch-verknuepft="${person}"]`).waitFor();
    await page.locator("main [data-tagebuch-pruefen]").click();
    const dialog = page.locator(".modal").last(); await dialog.waitFor();
    const vorgewaehlt = await dialog.locator(`input[type=checkbox][value="${person}"]`).isChecked().catch(() => null);
    if ((await dialog.locator("button", { hasText: "Nicht verknüpfen" }).count()) > 0) await dialog.locator("button", { hasText: "Nicht verknüpfen" }).click();
    await dialog.getByLabel("Ja, diesen Eintrag lokal speichern", { exact: false }).check();
    await dialog.locator("button", { hasText: "Bestätigt speichern" }).click();
    await page.locator(".memory-completion").waitFor({ timeout: 10000 });
    await schliesseDialoge(page);
    const daten = await register(page);
    const ev = daten.records.find((x) => x.recordType === "event" && x.data.originalText === TEXT);
    const rel = daten.relations.some((r) => (r.fromId === ev?.id && r.toId === person) || (r.toId === ev?.id && r.fromId === person));
    return soll(ev && ev.data.stimmung === 4 && rel && vorgewaehlt !== false, { ev: !!ev, stimmung: ev?.data.stimmung, rel, vorgewaehlt });
  });
  await step("Termin mit derselben Person/Organisation zeigt „Aus deinem Tagebuch“ mit dem Eintrag", async () => {
    const art0 = (await register(page)).records.find((x) => x.id === person)?.recordType;
    await page.evaluate(async ({ pid, art }) => { const f = window.__vaultFixture; await f.createLocalScheduleBundle(await f.browserVault(), { recordType: "task", title: "Probe Besuch Firma", dueAt: "2026-11-20", references: [{ recordType: art, id: pid, relationType: "betrifft" }] }); }, { pid: person, art: art0 });
    await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector(".site-brand-version");
    await footer(page, "Fristen und Aufgaben");
    const art = page.locator("article.schedule-flach", { hasText: "Probe Besuch Firma" }).first(); await art.scrollIntoViewIfNeeded();
    await art.locator("[data-fz-griff]").click().catch(() => {}); await art.locator("[data-termin-auge]").click();
    const h = art.locator("[data-tagebuch-hinweise]"); await h.waitFor({ timeout: 5000 });
    return soll(/Flasche Wein/.test(await h.innerText()), await h.innerText());
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
  await context.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Rückmeldung C"));
