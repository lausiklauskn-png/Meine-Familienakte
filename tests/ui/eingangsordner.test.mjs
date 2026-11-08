// Stufe E (Plan 08.11.2026, Entscheidung 9): Eingangsordner mit Blöcken. 45 Dateien liegen im Ordner; die App holt sie in drei
// Blöcken zu 20, nacheinander, ohne Zweitkopie im Arbeitsspeicher; schon Geholtes kommt nicht wieder; zu wenig freier Speicher
// hält ehrlich an. Ordnerwahl gestellt (OPFS-Ordner als gewählter Ordner), Dateien erfunden.
import { startApp, launchBrowser, DESKTOP, ready, step, summary, collectErrors, fail } from "./_harness.mjs";
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
  const warteschlange = () => page.evaluate(() => new Promise((ok, nein) => { const r = indexedDB.open("FamilienakteStapel1"); r.onerror = () => nein(r.error); r.onsuccess = () => { const db = r.result; const t = db.transaction(["eingang", "eingang-dateien"]); const a = t.objectStore("eingang").getAll(), b = t.objectStore("eingang-dateien").count(); t.oncomplete = () => { db.close(); ok({ eintraege: a.result.map((e) => ({ status: e.status, name: e.file?.name, ordnerDatei: e.ordnerDatei || null })), kopien: b.result }); }; }; }));
  const warteBis = (fn, ms = 90000) => page.waitForFunction(fn, null, { timeout: ms, polling: 500 });
  const nachrichten = async () => (await page.locator("[aria-live]").allInnerTexts()).join(" | ");

  await step("45 Dateien im Ordner; „Ordner auswählen“ holt den ersten Block zu 20 und sagt, dass 25 folgen", async () => {
    await page.evaluate(async () => { const root = await navigator.storage.getDirectory(); const d = await root.getDirectoryHandle("Eingang-Probe", { create: true }); for (let i = 1; i <= 45; i++) { const h = await d.getFileHandle(`Scan ${String(i).padStart(2, "0")}.txt`, { create: true }); const w = await h.createWritable(); await w.write(`Erfundener Brief Nummer ${i} vom Amt für Proben. Rechnung 12,${i} Euro.`); await w.close(); } window.__naechsterOrdner = "Eingang-Probe"; });
    await page.locator(".intake-desktop button.intake-source", { hasText: "Ordner auswählen" }).first().click();
    await page.waitForFunction(() => /Eingangsordner „Eingang-Probe“/.test([...document.querySelectorAll("[aria-live]")].map((e) => e.textContent).join(" ")), null, { timeout: 30000 });
    const m = await nachrichten();
    soll(/20 Dateien aus dem Eingangsordner/.test(m) && /25 weitere folgen/.test(m), m.slice(0, 300));
    await page.waitForFunction(async () => true, null, { timeout: 1000 }).catch(() => {});
    return m.match(/20 Dateien[^.]*\./)?.[0];
  });
  await step("Block 1 ist analysiert: 20 Einträge, keine Kopie im Arbeitsspeicher (Datei bleibt im Ordner)", async () => {
    await warteBis(() => new Promise((ok) => { const r = indexedDB.open("FamilienakteStapel1"); r.onsuccess = () => { const db = r.result; const t = db.transaction("eingang"); const a = t.objectStore("eingang").getAll(); t.oncomplete = () => { db.close(); ok(a.result.length >= 20 && a.result.every((e) => e.status !== "Analyse läuft")); }; }; r.onerror = () => ok(false); }));
    const w = await warteschlange();
    soll(w.eintraege.length === 20 && w.kopien === 0 && w.eintraege.every((e) => e.ordnerDatei && /^Scan \d\d\.txt$/.test(e.ordnerDatei)), { n: w.eintraege.length, kopien: w.kopien, erster: w.eintraege[0] });
    return `${w.eintraege.length} Einträge · Kopien im Arbeitsspeicher: ${w.kopien}`;
  });
  // Wie der 60-Sekunden-Takt der App: anstoßen, bis alles da ist (ein Anstoß während der Analyse wird bewusst übersprungen).
  const holeBis = async (n) => { const ende = Date.now() + 120000; while (Date.now() < ende) { await page.evaluate(() => window.dispatchEvent(new Event("familienakte:eingangsordner-pruefen"))); await page.waitForTimeout(800); const w = await warteschlange(); if (w.eintraege.length >= n && w.eintraege.every((e) => e.status !== "Analyse läuft")) return w; } throw new Error(`nach 120 s nicht ${n} Einträge`); };
  await step("Nächste Prüfung holt Block 2 (20), dann Block 3 (5); nichts doppelt", async () => {
    const w40 = await holeBis(40); soll(w40.eintraege.length === 40, { n: w40.eintraege.length });
    await holeBis(45);
    await page.evaluate(() => window.dispatchEvent(new Event("familienakte:eingangsordner-pruefen")));
    await page.waitForTimeout(1500);
    const w = await warteschlange();
    const namen = new Set(w.eintraege.map((e) => e.name));
    return soll(w.eintraege.length === 45 && namen.size === 45 && w.kopien === 0, { n: w.eintraege.length, namen: namen.size, kopien: w.kopien }) && "45 Einträge in drei Blöcken, keine Doppelten";
  });
  await step("Arbeitsdatei kommt aus dem Ordner: Vorschau liest den Inhalt", async () => {
    const text = await page.evaluate(async () => {
      const r = await new Promise((ok) => { const q = indexedDB.open("FamilienakteStapel1"); q.onsuccess = () => { const db = q.result; const t = db.transaction("eingang"); const a = t.objectStore("eingang").getAll(); t.oncomplete = () => { db.close(); ok(a.result); }; }; });
      return r.find((e) => e.file?.name === "Scan 07.txt")?.analysis?.plan?.title || r.find((e) => e.file?.name === "Scan 07.txt")?.analysis?.textHint || JSON.stringify(Object.keys(r[0]?.analysis || {}));
    });
    return soll(typeof text === "string" && text.length > 0, text) && String(text).slice(0, 80);
  });
  await step("Zu wenig freier Speicher: neue Dateien werden nicht gelesen, ehrliche Meldung, nichts verloren", async () => {
    await page.evaluate(async () => {
      const root = await navigator.storage.getDirectory(); const d = await root.getDirectoryHandle("Eingang-Probe");
      for (let i = 46; i <= 48; i++) { const h = await d.getFileHandle(`Scan ${i}.txt`, { create: true }); const w = await h.createWritable(); await w.write(`Brief ${i}`); await w.close(); }
      navigator.storage.estimate = async () => ({ usage: 999_000_000, quota: 1_000_000_000 });
      window.dispatchEvent(new Event("familienakte:eingangsordner-pruefen"));
    });
    await page.waitForFunction(() => /Zu wenig freier Speicher/.test([...document.querySelectorAll("[aria-live]")].map((e) => e.textContent).join(" ")), null, { timeout: 30000 });
    const w = await warteschlange();
    const offen = w.eintraege.filter((e) => /Zu wenig freier Speicher/.test(e.error || "") || e.status === "Prüfung erforderlich");
    const m = await nachrichten();
    return soll(w.eintraege.length === 48 && /frei/.test(m) && /nötig/.test(m), { n: w.eintraege.length, offen: offen.length, m: m.slice(0, 200) }) && m.match(/Zu wenig[^.]*\./)?.[0];
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Eingangsordner in Blöcken"));
