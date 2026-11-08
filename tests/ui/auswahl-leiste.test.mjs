// 2.28.39 (Punkt 6/7): eine gemeinsame Auswahl-Leiste für Listen mit mehreren Einträgen. In der Bibliothek: „Alle“ hakt die
// sichtbaren eigenen Dokumente an (halb, wenn nur einige), Sammelaktionen „Bereich ändern“ und „Person zuordnen“ enden mit
// „✓ Speichern“ und „Gespeichert ✓“ an derselben Stelle. Alle Einträge erfunden.
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
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  const ids = await page.evaluate(async () => {
    const f = window.__vaultFixture; const v = await f.browserVault();
    const neu = async (n, titel) => (await f.saveLocalDocument(v, new File([`Inhalt ${titel} (erfunden)`], n, { type: "text/plain" }), { category: "Sammelprobe Ahornweg", documentDate: "2026-10-20", notes: null, titel })).id;
    const person = await f.createLocalFamilyRecord(v, { recordType: "person", data: { displayName: "Mila Sonnenweg" }, status: "aktiv", source: "Probe" });
    return { a: await neu("ahorn_eins.txt", "Ahornweg Brief eins"), b: await neu("ahorn_zwei.txt", "Ahornweg Brief zwei"), c: await neu("ahorn_drei.txt", "Ahornweg Brief drei"), person: person.id };
  });
  await page.reload({ waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  const register = () => page.evaluate(async () => { const f = window.__vaultFixture; return f.readLocalVaultData(await f.browserVault()); });
  await footer(page, "Dokumentenbibliothek");
  await page.locator('input[placeholder^="Titel, Dateiname"]').fill("Ahornweg");
  const leiste = page.locator('[data-auswahl-leiste="Dokumente"]');

  await step("Leiste zeigt die Zahl, „Alle“ ist leer; ein Haken macht „Alle“ halb", async () => {
    await page.locator(`[data-bibliothek-zeile="${ids.a}"]`).waitFor();
    const leer = await leiste.locator("[data-auswahl-zahl]").innerText();
    await page.locator(`[data-bibliothek-wahl="${ids.a}"]`).check();
    const halb = await leiste.locator("[data-auswahl-alle]").evaluate((el) => el.indeterminate);
    return soll(/3 Dokumente/.test(leer) && halb, { leer, halb });
  });
  await step("„Alle“ hakt alle sichtbaren an, zweites Tippen hebt auf", async () => {
    await leiste.locator("[data-auswahl-alle]").click();
    const alle = await leiste.locator("[data-auswahl-zahl]").getAttribute("data-auswahl-zahl");
    await leiste.locator("[data-auswahl-alle]").click();
    const keine = await leiste.locator("[data-auswahl-zahl]").getAttribute("data-auswahl-zahl");
    const aktionen = await leiste.locator("[data-auswahl-aktion]").count();
    return soll(alle === "3" && keine === "0" && aktionen === 0, { alle, keine, aktionen });
  });
  await step("„Bereich ändern“: Auswahl, „✓ Speichern“, „Gespeichert ✓“ an der Stelle, Register geändert", async () => {
    await page.locator(`[data-bibliothek-wahl="${ids.a}"]`).check();
    await page.locator(`[data-bibliothek-wahl="${ids.b}"]`).check();
    await leiste.locator('[data-auswahl-aktion="bereich"]').click();
    const form = leiste.locator('[data-sammel-form="bereich"]');
    const optionen = await form.locator("[data-sammel-wert] option").allInnerTexts();
    const ziel = optionen.find((o) => o === "Versicherungen") || optionen.find((o) => o !== "Bitte wählen" && o !== "Sammelprobe Ahornweg");
    await form.locator("[data-sammel-wert]").selectOption({ label: ziel });
    const knopf = await form.locator("[data-sammel-speichern]").innerText();
    await form.locator("[data-sammel-speichern]").click();
    const meldung = page.locator("[data-bibliothek-meldung]"); await meldung.waitFor();
    const text = await meldung.innerText();
    const d = (await register()).documents;
    const kat = [ids.a, ids.b, ids.c].map((id) => d.find((x) => x.id === id).category);
    return soll(/✓ Speichern/.test(knopf) && /Gespeichert ✓/.test(text) && kat[0] === ziel && kat[1] === ziel && kat[2] === "Sammelprobe Ahornweg", { knopf, text, kat, ziel });
  });
  await step("„Person zuordnen“: Name in der Auswahl (keine Kennung), Verknüpfung „betrifft“ angelegt", async () => {
    await page.locator('input[placeholder^="Titel, Dateiname"]').fill("Ahornweg Brief drei");
    await page.locator(`[data-bibliothek-wahl="${ids.c}"]`).check();
    await leiste.locator('[data-auswahl-aktion="person"]').click();
    const form = leiste.locator('[data-sammel-form="person"]');
    const optionen = await form.locator("[data-sammel-wert] option").allInnerTexts();
    await form.locator("[data-sammel-wert]").selectOption({ value: ids.person });
    await form.locator("[data-sammel-speichern]").click();
    await page.locator("[data-bibliothek-meldung]", { hasText: "Mila Sonnenweg" }).waitFor();
    const r = (await register()).relations.filter((x) => x.fromId === ids.c && x.toId === ids.person && x.relationType === "betrifft");
    return soll(optionen.some((o) => /Mila Sonnenweg/.test(o)) && !optionen.some((o) => o.includes(ids.person)) && r.length === 1, { optionen, r: r.length });
  });
  await step("Eingangszentrale nutzt dieselbe Leiste", async () => {
    await footer(page, "Eingangszentrale");
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([{ name: "Notiz_Ahornweg.txt", mimeType: "text/plain", buffer: Buffer.from("Notiz Ahornweg (erfunden)") }]);
    const l = page.locator('[data-auswahl-leiste="Eingänge"]'); await l.waitFor();
    return soll(await l.locator("[data-auswahl-alle]").count() === 1, "keine gemeinsame Leiste");
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Auswahl-Leiste"));
