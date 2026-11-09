// 2.28.39 (Vorschau A–E, angenommen; Ablaufprüfung U1–U17): Die Erinnerung gehört zur Aufgabe. Umzug alter Erinnerungen
// beim Start (Sicherung vorher, archiviert statt gelöscht), Detailansicht klappt Verknüpftes auf statt die Seite zu wechseln,
// ✓ ✎ 🗑 „Im Kalender ›“ unter Direkte Aktionen, „Erledigt“ bleibt mit „Rückgängig“ stehen, Notiz-Knöpfe am Handy.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, footer, collectErrors, internetAn } from "./_harness.mjs";
import { speechStub } from "./_stubs.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };
const app = await startApp();
const browser = await launchBrowser();
const register = async (page) => { await vaultFixture(page); return page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records; }); };

/** Alter Stand (bis 2.28.38): Aufgabe + eigener Datensatz „Erinnerung: …“ mit Verknüpfung „erinnert an“, direkt ins Register. */
async function alterStand(page) {
  return page.evaluate(async () => {
    const finde = async (dir) => { for await (const [name, h] of dir.entries()) { if (h.kind === "file" && name === "Familienakte_Register.json") return { dir, h }; if (h.kind === "directory" && name !== "Sicherungen") { const t = await finde(h); if (t) return t; } } return null; };
    const t = await finde(await navigator.storage.getDirectory());
    if (!t) return null;
    const index = JSON.parse(await (await t.h.getFile()).text());
    const jetzt = "2026-11-01T10:00:00.000Z";
    index.records.push(
      { id: "TASK-990001", recordType: "task", createdAt: jetzt, updatedAt: jetzt, status: "offen", source: "Probe", notes: null, data: { title: "Steuerbelege Wolkenpost sortieren", dueAt: "2026-11-20", dueTime: "10:00" } },
      { id: "REM-990001", recordType: "reminder", createdAt: jetzt, updatedAt: jetzt, status: "offen", source: "TASK-990001", notes: null, data: { title: "Erinnerung: Steuerbelege Wolkenpost sortieren", remindAt: "2026-11-18T08:30" } },
      { id: "REM-990002", recordType: "reminder", createdAt: jetzt, updatedAt: jetzt, status: "offen", source: "Probe", notes: null, data: { title: "Freie Erinnerung Kleiderkammer", remindAt: "2026-11-19" } });
    index.relations.push({ id: "REL-990001", fromType: "reminder", fromId: "REM-990001", toType: "task", toId: "TASK-990001", relationType: "erinnert an", createdAt: jetzt, source: "Probe", notes: null });
    const w = await t.h.createWritable(); await w.write(JSON.stringify(index, null, 2)); await w.close();
    return t.dir.name;
  });
}
async function umzugSicherungen(page) {
  return page.evaluate(async () => {
    const finde = async (dir) => { for await (const [name, h] of dir.entries()) { if (h.kind === "directory" && name === "Sicherungen-Umzug") { const n = []; for await (const [f] of h.entries()) n.push(f); return n; } if (h.kind === "directory") { const t = await finde(h); if (t) return t; } } return null; };
    return finde(await navigator.storage.getDirectory());
  });
}

try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.clock.install({ time: new Date(2026, 10, 10, 14, 0) });
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await internetAn(page);

  await step("Umzug: alte Erinnerung zieht beim Start in ihre Aufgabe, Sicherung vorher, alter Eintrag archiviert; freie bleibt", async () => {
    const ordner = await alterStand(page);
    if (!ordner) return soll(false, "Register im Browser-Speicher nicht gefunden");
    await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector(".site-brand-version");
    await page.waitForFunction(() => document.body.innerText.includes("stehen jetzt direkt in ihrer Aufgabe"), null, { timeout: 15000 });
    const r = await register(page);
    const t = r.find((x) => x.id === "TASK-990001"); const alt = r.find((x) => x.id === "REM-990001"); const frei = r.find((x) => x.id === "REM-990002");
    const sicherung = await umzugSicherungen(page);
    return soll((t?.data.erinnerungen || []).includes("@2026-11-18T08:30") && alt?.status === "archiviert" && alt?.data.umgezogenIn === "TASK-990001" && frei?.status === "offen" && sicherung?.length === 1,
      { erinnerungen: t?.data.erinnerungen, alt: alt?.status, frei: frei?.status, sicherung });
  });
  await step("Umzug: zweiter Start ändert nichts mehr (keine zweite Sicherung)", async () => {
    await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector(".site-brand-version"); await page.waitForTimeout(1500);
    return soll((await umzugSicherungen(page))?.length === 1, await umzugSicherungen(page));
  });

  await footer(page, "Fristen und Aufgaben");
  await step("Fristenliste: eine Zeile je Aufgabe mit Erinnerungszeit, keine Zeile „Erinnerung: …“; Leerzeichen vor dem Hauptwort bleibt", async () => {
    const zeile = page.locator("#termin-TASK-990001"); await zeile.waitFor({ timeout: 10000 });
    const klein = await zeile.locator(".mk-text small").innerText();
    const alt = await page.locator("#termin-REM-990001").count();
    const text = await zeile.locator(".flach").evaluate((el) => el.textContent.replace(/\u00a0/g, " "));
    // sichtbarer Abstand zwischen Anfang und Hauptwort/Endwort (vorher klebten „Wolkenpost“ und „sortieren“ zusammen)
    const luecke = await zeile.locator(".flach").evaluate((el) => el.querySelector(".flach-e").getBoundingClientRect().left - el.querySelector(".flach-a").getBoundingClientRect().right);
    return soll(/18\.11\., 08:30 Uhr/.test(klein) && alt === 0 && text.trim() === "Steuerbelege Wolkenpost sortieren" && luecke >= 2, { klein, alt, text, luecke });
  });
  await step("Fristenliste: ✓ lässt „Erledigt … Rückgängig“ an der Stelle stehen; „Rückgängig“ öffnet wieder", async () => {
    const zeile = page.locator("#termin-TASK-990001");
    await zeile.locator('[data-termin-erledigt="TASK-990001"]').click();
    const meldung = page.locator('[data-erledigt-meldung="TASK-990001"]'); await meldung.waitFor({ timeout: 8000 });
    const imBlick = await meldung.evaluate((el) => { const b = el.getBoundingClientRect(); return b.top >= 0 && b.bottom <= window.innerHeight; });
    await meldung.locator("[data-erledigt-rueckgaengig]").click();
    await page.waitForFunction(() => !document.querySelector('[data-erledigt-meldung="TASK-990001"]'), null, { timeout: 8000 });
    await page.locator("#offene-fristen #termin-TASK-990001").waitFor({ timeout: 8000 });
    const r = (await register(page)).find((x) => x.id === "TASK-990001");
    return soll(imBlick && r?.status === "offen", { imBlick, status: r?.status });
  });
  await step("Stift: Erinnerungsdatum ist im Fenster sichtbar und zieht beim Verschieben mit; bloßes Umbenennen schaltet Kalender nicht ein", async () => {
    await page.locator('#termin-TASK-990001 [data-termin-aendern="TASK-990001"]').click();
    const f = page.locator("[data-termin-bearbeiten]"); await f.waitFor();
    const chip = await f.locator('[data-erinnerung="@2026-11-18T08:30"]').count();
    await f.locator("[data-tb-tag]").fill("2026-11-22");
    const neu = await f.locator('[data-erinnerung="@2026-11-20T08:30"]').count();
    await f.locator("[data-tb-speichern]").click(); await f.waitFor({ state: "detached", timeout: 8000 });
    const t = (await register(page)).find((x) => x.id === "TASK-990001");
    return soll(chip === 1 && neu === 1 && (t?.data.erinnerungen || []).includes("@2026-11-20T08:30") && t?.data.dueAt === "2026-11-22" && t?.data.kalenderEintragen === undefined, { chip, neu, data: t?.data });
  });
  await step("Formular: Person, Objekt, Vorgang und Dokument als Auswahl mit Namen (keine Kennung eintippen)", async () => {
    const felder = await page.locator("[data-frist-bezug]").count();
    const optionen = await page.locator('[data-frist-bezug="person"] option').allInnerTexts();
    return soll(felder === 4 && optionen.length > 1 && !optionen.some((o) => /^PER-\d+$/.test(o)), { felder, optionen });
  });

  // ---------- Cockpit-Detailansicht ----------
  const fall = (await register(page)).find((x) => x.recordType === "case" && x.status !== "archiviert");
  await page.evaluate(async (fallId) => { const f = window.__vaultFixture; await f.createLocalScheduleBundle(await f.browserVault(), { recordType: "task", title: "Probe Zuordnung Aufklappen", dueAt: "2026-11-12", reminderAt: "2026-11-11T18:00", references: [{ recordType: "case", id: fallId, relationType: "gehört zu" }] }); }, fall.id);
  await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector(".site-brand-version");
  const aufgabe = (await register(page)).find((x) => x.data?.title === "Probe Zuordnung Aufklappen");
  await footer(page, "Cockpit");
  await page.locator(".cockpit-todo-main", { hasText: "Probe Zuordnung Aufklappen" }).first().click();
  await page.locator("[data-termin-akte]").click(); // A5 (09.11.): Tipp öffnet die Bearbeitung, die ganze Akte liegt einen Tipp weiter
  const d = page.locator("#cockpit-dossier"); await d.waitFor();
  await step("Detail (A): Aufgabe zeigt alle ihre Erinnerungen mit Zeit", async () => {
    const zeiten = await d.locator(`[data-termin-erinnerungen="${aufgabe.id}"] [data-erinnerung-zeit]`).count();
    const hat = await d.locator('[data-erinnerung-zeit="@2026-11-11T18:00"]').count();
    return soll(zeiten >= 2 && hat === 1, { zeiten, hat });
  });
  await step("Detail (B): Tipp auf den Vorgang klappt auf, die Seite bleibt bei der Aufgabe", async () => {
    const ref = d.locator(`[data-dossier-ref="${fall.id}"]`);
    await ref.scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
    const y = await page.evaluate(() => window.scrollY);
    await ref.click();
    await d.locator(`[data-dossier-auf="${fall.id}"]`).waitFor({ timeout: 5000 });
    // 2.28.39 Punkt 8: der Kopf nennt den Namen der Aufgabe, keine Kennnummer.
    const kopf = await d.locator(".card-heading h2").first().innerText();
    const y2 = await page.evaluate(() => window.scrollY);
    return soll(kopf.includes("Probe Zuordnung Aufklappen") && Math.abs(y2 - y) < 40, { kopf, y, y2 });
  });
  await step("Detail (C): Direkte Aktionen ✓ ✎ 🗑 „Im Kalender ›“, „Zuordnung prüfen“ nicht mehr", async () => {
    const a = d.locator(".dossier-actions");
    const n = { erledigt: await a.locator("[data-dossier-erledigt]").count(), aendern: await a.locator("[data-dossier-aendern]").count(), loeschen: await a.locator("[data-erinnerung-loeschen]").count(), kalender: await a.locator("[data-dossier-kalender]").count(), zuordnung: await a.locator("button", { hasText: "Zuordnung prüfen" }).count() };
    return soll(n.erledigt === 1 && n.aendern === 1 && n.loeschen === 1 && n.kalender === 1 && n.zuordnung === 0, n);
  });
  await step("Detail (E): ✓ erledigt bleibt mit „Rückgängig“ stehen; „Rückgängig“ öffnet wieder", async () => {
    await d.locator("[data-dossier-erledigt]").click();
    const m = d.locator("[data-erledigt-meldung]"); await m.waitFor({ timeout: 8000 });
    const nach = (await register(page)).find((x) => x.id === aufgabe.id)?.status;
    await m.locator("[data-erledigt-rueckgaengig]").click(); await page.waitForTimeout(800);
    const zurueck = (await register(page)).find((x) => x.id === aufgabe.id)?.status;
    return soll(nach === "erledigt" && zurueck === "offen", { nach, zurueck });
  });
  await step("Detail: „Im Kalender ›“ öffnet Mein Kalender am Tag und hebt den Eintrag hervor", async () => {
    await d.locator("[data-dossier-kalender]").click();
    const z = page.locator(`[data-mk-eintrag="${aufgabe.id}"]`); await z.waitFor({ timeout: 8000 });
    await page.waitForTimeout(400);
    return soll(await page.locator('[data-mk-tag="2026-11-12"]').getAttribute("aria-pressed") === "true" && (await z.locator("[data-mk-offen]").count()) === 1, "Eintrag nicht aufgeklappt");
  });
  await step("Mein Kalender: ✓ in der Zeile mit „Rückgängig“", async () => {
    const z = page.locator(`[data-mk-eintrag="${aufgabe.id}"]`);
    await z.locator(`[data-mk-erledigt="${aufgabe.id}"]`).click();
    await page.locator("[data-mk-erledigt-meldung]").waitFor({ timeout: 8000 });
    await page.locator("[data-mk-rueckgaengig]").click(); await page.waitForTimeout(800);
    return soll((await register(page)).find((x) => x.id === aufgabe.id)?.status === "offen", "nicht wieder offen");
  });
  check(errors.length === 0, "Desktop: keine Seitenfehler", errors.join(" | "));
  await context.close();

  // ---------- Handy: Notiz-Fenster behält seine Knöpfe ----------
  const handy = await browser.newContext(HANDY);
  const p2 = await handy.newPage(); const err2 = collectErrors(p2);
  await p2.clock.install({ time: new Date(2026, 10, 10, 14, 0) });
  await p2.addInitScript(speechStub("x"));
  await p2.goto(app.base, { waitUntil: "networkidle" }); await ready(p2); await internetAn(p2);
  await step("Handy (U1): im Notiz-Fenster sind „Abbrechen/Fertig“, „Auch in der App läuten“ und nach dem Speichern „Im Kalender“ sichtbar", async () => {
    await p2.locator("[data-notiz-knopf]").click();
    const f = p2.locator("[data-notiz-fenster]"); await f.waitFor();
    await f.locator("[data-notiz-eingabe]").fill("Erinnere mich morgen um 9 Uhr, den Zahnarzt Wolkenpost anzurufen");
    await f.locator("[data-memory-erinnern] [data-glocke]").waitFor();
    const fertig = await f.locator("[data-notiz-fertig]").isVisible();
    const glocke = await f.locator("[data-memory-erinnern] [data-glocke]").isVisible();
    await f.locator("[data-notiz-speichern]").click(); await f.locator("[data-notiz-liste] li").first().waitFor();
    const li = f.locator("[data-notiz-liste] li").first();
    await li.locator("[data-fz-griff]").click();
    await li.locator("[data-notiz-auge]").click();
    const kal = await li.locator("[data-notiz-im-kalender]").isVisible();
    return soll(fertig && glocke && kal, { fertig, glocke, kal });
  });
  await step("Handy (U1): „Notiz bearbeiten“ zeigt „Speichern“ und „Abbrechen“", async () => {
    const f = p2.locator("[data-notiz-fenster]");
    const li = f.locator("[data-notiz-liste] li").first();
    if (!(await li.locator("[data-fz-leiste=auf]").count())) await li.locator("[data-fz-griff]").click();
    await li.locator("[data-notiz-aendern]").click();
    const m = p2.locator("[data-memory-bearbeiten]"); await m.waitFor();
    const knoepfe = await m.locator(".modal-actions .button").evaluateAll((l) => l.filter((b) => b.getBoundingClientRect().width > 0).map((b) => b.textContent.trim()));
    return soll(knoepfe.some((t) => /Speichern/.test(t)) && knoepfe.some((t) => /Abbrechen/.test(t)), knoepfe);
  });
  check(err2.length === 0, "Handy: keine Seitenfehler", err2.join(" | "));
  await handy.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Erinnerung als Teil der Aufgabe"));
