// 2.28.39 (Punkt 6/7, Entscheidung Klaus 08.11.2026): „Aus der Akte nehmen“ = archivieren, nicht löschen. Die Datei wandert in
// den Ordner „Aussortiert“, die Bibliothek zeigt „Aussortiert (n)“ mit „Zurückholen“; danach liegt die Datei wieder im
// Bereichsordner. Bibliothek als kompakte Zeilen, Karten wählbar. Alle Dokumente erfunden.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();
try {
  for (const [name, geraet] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const page = await (await browser.newContext(geraet)).newPage();
    page.setDefaultTimeout(15000);
    await page.addInitScript(windowStub);
    const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
    const ids = await page.evaluate(async () => {
      const f = window.__vaultFixture; const v = await f.browserVault();
      const neu = async (n, titel, datum) => (await f.saveLocalDocument(v, new File([`Inhalt ${titel} (erfunden)`], n, { type: "text/plain" }), { category: "Haushalt Probe", documentDate: datum, notes: null, titel })).id;
      return { a: await neu("prospekt_moebelhaus.txt", "Prospekt Möbelhaus Eichenblatt", "2026-10-02"), b: await neu("vertrag_internet.txt", "Vertrag Internet Wolkenpost", "2026-09-12") };
    });
    await page.reload({ waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
    const register = () => page.evaluate(async () => { const f = window.__vaultFixture; return f.readLocalVaultData(await f.browserVault()); });
    const vorher = (await register()).documents.find((d) => d.id === ids.a);
    const leiste = page.locator('[data-auswahl-leiste="Dokumente"]');
    await footer(page, "Dokumentenbibliothek");
    await page.locator("button", { hasText: "Alle ansehen" }).first().click();

    await step(`${name}: Bibliothek als kompakte Zeilen mit Datum · Titel · Bereich`, async () => {
      const z = page.locator(`[data-bibliothek-zeile="${ids.a}"]`); await z.waitFor();
      const text = (await z.innerText()).replace(/\s+/g, " ");
      const hoch = (await z.boundingBox()).height;
      return soll(/02\.10\.2026/.test(text) && /Prospekt Möbelhaus Eichenblatt/.test(text) && hoch < 90, { text, hoch });
    });
    await step(`${name}: Haken an einer Zeile zeigt die Auswahl-Leiste mit „Aus der Akte nehmen“`, async () => {
      await page.locator(`[data-bibliothek-wahl="${ids.a}"]`).check();
      const zahl = await leiste.locator("[data-auswahl-zahl]").getAttribute("data-auswahl-zahl");
      const knopf = await leiste.locator('[data-auswahl-aktion="aussortieren"]').isVisible();
      return soll(zahl === "1" && knopf, { zahl, knopf });
    });
    await step(`${name}: „Aus der Akte nehmen“ fragt nach und sagt, dass nichts gelöscht wird`, async () => {
      await leiste.locator('[data-auswahl-aktion="aussortieren"]').click();
      const dialog = page.locator(".page-dialog"); await dialog.waitFor();
      const frage = await dialog.innerText();
      await dialog.locator("button", { hasText: "Ja, fortfahren" }).click();
      return soll(/Nichts wird gelöscht/.test(frage) && /Aussortiert/.test(frage), frage);
    });
    await step(`${name}: „Gespeichert ✓“ an der Stelle; Zeile weg, „Aussortiert (1)“ unten`, async () => {
      const meldung = page.locator("[data-bibliothek-meldung]"); await meldung.waitFor({ timeout: 20000 });
      const text = await meldung.innerText();
      await page.locator(`[data-bibliothek-zeile="${ids.a}"]`).waitFor({ state: "detached" });
      const bereich = await page.locator("[data-aussortiert]").getAttribute("data-aussortiert");
      return soll(/Gespeichert ✓ 1 Dokument aus der Akte genommen/.test(text) && /Ordner „Aussortiert“/.test(text) && bereich === "1", { text, bereich });
    });
    await step(`${name}: Register – archiviert, Datei liegt im Ordner „Aussortiert“, Original am alten Ort entfernt, Inhalt gleich`, async () => {
      const d = (await register()).documents.find((x) => x.id === ids.a);
      const alt = await page.evaluate(async (pfad) => { const f = window.__vaultFixture; try { const teile = pfad.split("/").filter(Boolean); let dir = await f.browserVault(); for (const t of teile.slice(0, -1)) dir = await dir.getDirectoryHandle(t); await dir.getFileHandle(teile.at(-1)); return "noch da"; } catch { return "weg"; } }, vorher.storedPath);
      const inhalt = await page.evaluate(async (id) => { const f = window.__vaultFixture; return (await f.readLocalDocumentFile(await f.browserVault(), id)).text(); }, ids.a);
      return soll(d.aussortiert?.verschoben === true && /\/Aussortiert\//.test(d.storedPath) && d.aussortiert.vorherPfad === vorher.storedPath && alt === "weg" && /Prospekt Möbelhaus/.test(inhalt), { pfad: d.storedPath, aussortiert: d.aussortiert, alt });
    });
    await step(`${name}: Suche und Bibliothek zeigen das aussortierte Dokument nicht mehr in der Akte`, async () => {
      await page.locator('input[placeholder^="Titel, Dateiname"]').fill("Eichenblatt");
      const treffer = await page.locator("[data-bibliothek-zeile]").count();
      await page.locator('button[aria-label="Dokumentensuche löschen"]').click();
      return soll(treffer === 0, { treffer });
    });
    if (name === "Desktop") await step(`${name}: Die Suche oben findet das aussortierte Dokument nicht mehr`, async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.locator(".global-search input").fill("Möbelhaus Eichenblatt");
      await page.locator(".search-results").waitFor();
      const treffer = await page.locator(".search-results button", { hasText: "Prospekt Möbelhaus Eichenblatt" }).count();
      await page.locator(".global-search input").fill("");
      await footer(page, "Dokumentenbibliothek");
      return soll(treffer === 0, { treffer });
    });
    await step(`${name}: Nach Neuladen steht es weiter unter „Aussortiert (1)“; „Zurückholen“ legt es zurück`, async () => {
      await page.reload({ waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
      await footer(page, "Dokumentenbibliothek");
      const box = page.locator("[data-aussortiert]"); await box.waitFor();
      await box.locator("summary").click();
      await box.locator(`[data-aussortiert-wahl="${ids.a}"]`).check();
      await box.locator('[data-auswahl-aktion="zurueckholen"]').click();
      const meldung = page.locator("[data-aussortiert-meldung]"); await meldung.waitFor({ timeout: 20000 });
      const text = await meldung.innerText();
      const d = (await register()).documents.find((x) => x.id === ids.a);
      return soll(/Gespeichert ✓ 1 Dokument wieder in der Akte/.test(text) && !d.aussortiert && d.storedPath === vorher.storedPath, { text, pfad: d.storedPath });
    });
    await step(`${name}: Zurückgeholt steht es wieder in der Bibliothek`, async () => {
      await page.locator("button", { hasText: "Alle ansehen" }).first().click();
      await page.locator(`[data-bibliothek-zeile="${ids.a}"]`).waitFor();
      return soll(await page.locator("[data-aussortiert]").count() === 0, "Bereich „Aussortiert“ ist noch da");
    });
    check(errors.length === 0, `${name}: keine Seitenfehler`, errors.join(" | "));
    await page.context().close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Aus der Akte nehmen"));
