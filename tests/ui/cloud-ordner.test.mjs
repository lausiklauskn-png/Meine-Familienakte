// 2.28.65: Cloud-Ordner hereinholen (PC, Chrome/Edge – Ordnerwahl gestellt mit einem Ordner im Browser-Dateispeicher).
// Unterordner als Herkunft, Kopie statt Verweis, Bekanntes kommt nicht wieder, geänderte Datei = neue Fassung, Paket vom Handy,
// eigene Sicherungsordner übergangen, „Trennen“ behält alles. Dateien erfunden.
import { startApp, launchBrowser, DESKTOP, ready, footer, step, soll, summary, collectErrors, fail } from "./_harness.mjs";
import { directoryPickerStub } from "./_stubs.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage(); page.setDefaultTimeout(15000);
  await page.addInitScript(directoryPickerStub);
  const errors = collectErrors(page);
  page.on("crash", () => console.log("ABSTURZ der Seite"));
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  const schreiben = (pfad, text) => page.evaluate(async ([pfad, text]) => {
    let d = await (await navigator.storage.getDirectory()).getDirectoryHandle("OneDrive", { create: true });
    const teile = pfad.split("/"); const name = teile.pop(); for (const t of teile) d = await d.getDirectoryHandle(t, { create: true });
    const w = await (await d.getFileHandle(name, { create: true })).createWritable(); await w.write(text); await w.close();
  }, [pfad, text]);
  const loeschen = (pfad) => page.evaluate(async (pfad) => { let d = await (await navigator.storage.getDirectory()).getDirectoryHandle("OneDrive"); const teile = pfad.split("/"); const name = teile.pop(); for (const t of teile) d = await d.getDirectoryHandle(t); await d.removeEntry(name); }, pfad);
  const warteschlange = () => page.evaluate(() => new Promise((ok, nein) => { const r = indexedDB.open("FamilienakteStapel1"); r.onerror = () => nein(r.error); r.onsuccess = () => { const db = r.result; const t = db.transaction(["eingang", "eingang-dateien"]); const a = t.objectStore("eingang").getAll(), b = t.objectStore("eingang-dateien").getAllKeys(); t.oncomplete = () => { db.close(); const kopien = new Set(b.result); ok(a.result.map((e) => ({ name: e.file?.name, hinweis: e.uebergabeHinweis || "", ordnerDatei: e.ordnerDatei || null, kopie: kopien.has(e.id) }))); }; }; }));
  const meldung = async () => (await page.locator("[aria-live], .notice").allInnerTexts()).join(" ").replace(/\s+/g, " ");
  const karte = page.locator("[data-cloud-ordner]");
  const nachsehen = async (re) => { await karte.locator("[data-cloud-nachsehen]").click(); await page.waitForFunction((q) => new RegExp(q).test(document.body.innerText), re.source, { timeout: 30000 }); };

  await schreiben("Auto/Versicherung/Police.txt", "Erfundene Police Nummer 1 der Probe-Versicherung.");
  await schreiben("Arzt/Befund.txt", "Erfundener Befund aus der Probe-Praxis.");
  await schreiben(".versteckt.txt", "nicht holen");
  await schreiben("Familienakte_Vollsicherung_2026-11-11T08-00-00-000Z/Vollsicherung_Manifest.json", "{}");
  await schreiben("Familienakte-Paket_Galaxy_2026-11-11-10-00.fav", "kein echtes Paket");

  await step("Kasten „Cloud-Ordner hereinholen“ eigenständig, ein Hauptknopf, Erklärung hinter dem „?“", async () => {
    await footer(page, "Sicherheitscenter"); await karte.waitFor();
    return soll(await karte.locator(".button.primary").count() === 1 && /Noch kein Cloud-Ordner/.test(await karte.innerText()) && await karte.locator("[aria-label='Cloud-Ordner hereinholen erklären']").count() === 1, await karte.innerText());
  });
  await step("Ordner wählen: zwei Dateien aus Unterordnern als Kopie in die Eingangszentrale, Herkunft dabei; Verstecktes und eigene Sicherungen übergangen", async () => {
    await page.evaluate(() => { window.__naechsterOrdner = "OneDrive"; });
    await karte.locator("[data-cloud-waehlen]").click();
    await page.waitForFunction(() => /2 Dateien als Kopie/.test(document.body.innerText), null, { timeout: 30000 });
    const w = await warteschlange();
    const police = w.find((e) => e.name === "Police.txt");
    return soll(w.length === 2 && w.every((e) => e.kopie && !e.ordnerDatei) && /OneDrive › Auto › Versicherung/.test(police?.hinweis || ""), w) && police.hinweis;
  });
  await step("Paket vom Handy wird erkannt und zum Einlesen angeboten (nicht in den Eingang)", async () => soll(await karte.locator("[data-cloud-paket-einlesen]").count() === 1 && !(await warteschlange()).some((e) => /\.fav$/.test(e.name)), await karte.innerText()));
  await step("Gegenprobe: ein kaputtes Paket wird gemeldet und bleibt in der Liste", async () => {
    await karte.locator("[data-cloud-paket-einlesen]").click();
    await page.waitForFunction(() => /Paket|Format|lesen/.test([...document.querySelectorAll("[aria-live], .notice")].map((e) => e.textContent).join(" ")), null, { timeout: 15000 });
    return soll(await karte.locator("[data-cloud-paket-einlesen]").count() === 1, await karte.innerText());
  });
  await step("Kopie statt Verweis: Datei im Ordner gelöscht – die Kopie im Eingang bleibt", async () => {
    await loeschen("Arzt/Befund.txt");
    const w = await warteschlange();
    return soll(w.find((e) => e.name === "Befund.txt")?.kopie === true, w);
  });
  await step("Noch einmal nachsehen: Bekanntes kommt nicht wieder", async () => { await nachsehen(/Nichts Neues im Cloud-Ordner/); return soll((await warteschlange()).length === 2, await warteschlange()); });
  await step("Geänderte Datei = neue Fassung, die bisherige bleibt", async () => {
    await page.waitForTimeout(1100);
    await schreiben("Auto/Versicherung/Police.txt", "Erfundene Police Nummer 1 der Probe-Versicherung – Nachtrag 2027 mit neuem Beitrag.");
    await nachsehen(/1 Datei als Kopie/);
    const w = await warteschlange();
    return soll(w.filter((e) => e.name === "Police.txt").length === 2 && w.some((e) => /neue Fassung/.test(e.hinweis)), w);
  });
  await step("„Trennen“ (hinter „Mehr“): Verbindung weg, die Eingangszentrale behält alles", async () => {
    page.once("dialog", (d) => d.accept());
    await karte.locator("[data-cloud-mehr] summary").click(); await karte.locator("[data-cloud-trennen]").click();
    await karte.locator("[data-cloud-waehlen]").waitFor();
    return soll((await warteschlange()).length === 3, await warteschlange());
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
  void meldung;
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Cloud-Ordner"));
