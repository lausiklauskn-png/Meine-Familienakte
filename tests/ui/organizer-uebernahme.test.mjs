// Übernahme aus dem Datei-Organizer (Klaus 16.11.2026): im Eingangsordner liegt organizer-index.json. Die Angaben des Organizers
// reisen als Vorschlag mit („Vorschläge aus Datei-Organizer“ im Prüf-Fenster), der Index selbst ist keine Unterlage, und was der
// Organizer als doppelt markiert hat, bleibt im Ordner. Ordnerwahl gestellt (OPFS-Ordner), Dateien erfunden.
import { startApp, launchBrowser, DESKTOP, ready, footer, step, summary, collectErrors, fail } from "./_harness.mjs";
import { directoryPickerStub } from "./_stubs.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage(); page.setDefaultTimeout(15000);
  await page.addInitScript(directoryPickerStub);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  const eintraege = () => page.evaluate(() => new Promise((ok, nein) => { const r = indexedDB.open("FamilienakteStapel1"); r.onerror = () => nein(r.error); r.onsuccess = () => { const db = r.result; const t = db.transaction("eingang"); const a = t.objectStore("eingang").getAll(); t.oncomplete = () => { db.close(); ok(a.result.map((e) => ({ name: e.file?.name || e.ordnerDatei, status: e.status, vorschlag: e.uebergabeVorschlag || null, hinweis: e.uebergabeHinweis || "" }))); }; }; }));
  const nachrichten = async () => (await page.locator("[aria-live]").allInnerTexts()).join(" | ");

  await step("Ordner mit Index: zwei Unterlagen geholt, Doppelte bleibt, der Index ist keine Unterlage", async () => {
    await page.evaluate(async () => {
      const root = await navigator.storage.getDirectory(); const d = await root.getDirectoryHandle("Eingang-Probe", { create: true });
      const schreib = async (name, text) => { const h = await d.getFileHandle(name, { create: true }); const w = await h.createWritable(); await w.write(text); await w.close(); return (await h.getFile()).size; };
      const a = await schreib("Unterlage A.txt", "Erfundene Unterlage A ohne erkennbaren Bereich."), b = await schreib("Unterlage B.txt", "Erfundene Unterlage B, im Organizer gesperrt."), c = await schreib("Unterlage A Kopie.txt", "Erfundene Unterlage A ohne erkennbaren Bereich.");
      const e = (pfad, groesse, mehr) => ({ pfad, name: pfad, groesse, pruefstand: "frei", gesiebt_bis: "Inhalt", dringlichkeit: "keine", nummern: [], sicherheit: {}, gruende: {}, kurzfassung: "", paperless: { tags: [] }, ...mehr });
      await schreib("organizer-index.json", JSON.stringify({ format: "datei-organizer-index", fassung: 1, erstellt: "2026-11-16T08:00:00.000Z", app: "Datei-Organizer Pro", hinweis: "", lernregeln: [], verlauf: [], dateien: [
        e("Unterlage A.txt", a, { kategorie: "Versicherungen", schriftstueck: "Bescheinigung", absender: "Musterversicherung Beispielstadt", frist: "2026-12-01", sicherheit: { kategorie: "von dir" } }),
        e("Unterlage B.txt", b, { pruefstand: "auffällig", auffaellig: "Endung passt nicht zum Inhalt" }),
        e("Unterlage A Kopie.txt", c, { pruefstand: "doppelt", doppeltVon: "Unterlage A.txt" }) ] }));
      window.__naechsterOrdner = "Eingang-Probe";
    });
    await page.locator(".intake-desktop button.intake-source", { hasText: "Ordner auswählen" }).first().click();
    await page.waitForFunction(() => /Eingangsordner „Eingang-Probe“/.test([...document.querySelectorAll("[aria-live]")].map((x) => x.textContent).join(" ")), null, { timeout: 30000 }).catch(async () => { throw new Error("Meldung fehlt: " + (await nachrichten()).slice(0, 500)); });
    const m = await nachrichten();
    soll(/2 Dateien aus dem Eingangsordner/.test(m) && /2 mit Vorschlag aus dem Datei-Organizer/.test(m) && /1 dort als doppelt markiert und nicht geholt/.test(m), m.slice(0, 400));
    const w = await eintraege();
    soll(w.length === 2 && !w.some((x) => /organizer-index|Kopie/.test(x.name)), w.map((x) => x.name));
    const a = w.find((x) => x.name === "Unterlage A.txt"), b = w.find((x) => x.name === "Unterlage B.txt");
    soll(a?.vorschlag?.quelle === "Datei-Organizer" && a.vorschlag.lebensbereich === "Versicherungen" && a.vorschlag.dokumentart === "Bescheinigung" && /Frist: 01\.12\.2026/.test(a.vorschlag.hinweis) && /von dir bestätigt: Bereich/.test(a.vorschlag.hinweis), a);
    soll(/gesperrt: Endung passt nicht zum Inhalt/.test(b?.hinweis || ""), b);
    return m.match(/2 Dateien[^.]*\./)?.[0];
  });
  await step("Nächste Prüfung holt die Doppelte nicht nach", async () => {
    await page.evaluate(() => window.dispatchEvent(new Event("familienakte:eingangsordner-pruefen"))); await page.waitForTimeout(2500);
    const w = await eintraege(); return soll(w.length === 2, w.map((x) => x.name)) && "weiter 2 Einträge";
  });
  await step("Prüf-Fenster zeigt „Vorschläge aus Datei-Organizer“; Übernehmen setzt Bereich und Art", async () => {
    await page.waitForFunction(() => new Promise((ok) => { const r = indexedDB.open("FamilienakteStapel1"); r.onsuccess = () => { const db = r.result; const t = db.transaction("eingang"); const a = t.objectStore("eingang").getAll(); t.oncomplete = () => { db.close(); ok(a.result.every((e) => e.status !== "Analyse läuft")); }; }; }), null, { timeout: 60000, polling: 500 });
    await footer(page, "Eingangszentrale");
    const zeilen = page.locator(".intake-queue-item", { hasText: "Fremde Einordnungsvorschläge aus „Datei-Organizer“" });
    await zeilen.first().waitFor().catch(async () => { throw new Error("Zeile fehlt: " + (await page.locator(".intake-queue-item").allInnerTexts()).join(" ## ").slice(0, 900) + " || " + (await page.locator("main").innerText()).slice(0, 300)); }); soll(await zeilen.count() === 2, await zeilen.count());
    const karte = page.locator("[data-uebergabe-vorschlag]"); let text = "";
    for (let i = 0; i < 2; i++) {
      await zeilen.nth(i).getByRole("button", { name: "Zuordnung prüfen", exact: true }).click(); await karte.waitFor().catch(async () => { throw new Error("Karte fehlt: " + (await page.locator(".intake-modal").innerText().catch(() => "kein Fenster")).slice(0, 700) + " || " + (await nachrichten()).slice(0, 300)); }); text = await karte.innerText();
      if (/Versicherungen/.test(text)) break;
      soll(/Im Organizer gesperrt: Endung passt nicht zum Inhalt/.test(text), text.slice(0, 300));
      await page.locator(".modal-backdrop").click({ position: { x: 4, y: 4 } }); await karte.waitFor({ state: "detached" });
    }
    soll(/Vorschläge aus „Datei-Organizer“/.test(text) && /Versicherungen/.test(text) && /Bescheinigung/.test(text) && /Musterversicherung Beispielstadt/.test(text), text.slice(0, 400));
    await karte.getByRole("button", { name: "Vorschläge in das Formular übernehmen" }).click();
    const formular = await page.locator(".intake-modal").innerText();
    return soll(/Vorschläge im Formular/.test(formular) && /Versicherungen/.test(formular), formular.slice(0, 300)) && "Bereich und Art im Formular";
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Übernahme aus dem Datei-Organizer"));
