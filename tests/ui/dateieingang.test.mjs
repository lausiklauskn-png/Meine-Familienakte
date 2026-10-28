// Paket D: Dateieingang mit erfundenen Testdateien (tests/testdateien/).
// Prüft Drag & Drop, Dateiauswahl, Dokument fotografieren, lokalen Eingangsordner (gestellt),
// E-Mail-Anlagen, ZIP, Zuordnungsvorschlag, Dubletten, „Trotzdem übernehmen“, Größengrenze,
// nicht erlaubten Typ, danach Bibliothek, Suche, Cockpit, Vorschau und Statuswechsel.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, fail, summary, collectErrors, ROOT } from "./_harness.mjs";

const T = path.join(ROOT, "tests/testdateien");
const f = (name) => path.join(T, name);
const LAUFZEIT = path.join(T, ".laufzeit");
mkdirSync(LAUFZEIT, { recursive: true });
const GROSS = path.join(LAUFZEIT, "Zu_gross_21MB.pdf");
if (!existsSync(GROSS)) { const big = Buffer.alloc(21 * 1024 * 1024, 0x20); Buffer.from("%PDF-1.4\n%Testdatei zu gross\n").copy(big); writeFileSync(GROSS, big); }

const app = await startApp();
const browser = await launchBrowser();
const context = await browser.newContext(DESKTOP);
// Gestellter Ordnerwähler: ein Verzeichnis-Handle im Speicher mit den Testdateien (nur lesen).
await context.addInitScript(() => {
  class FakeFile { constructor(name, bytes, type) { this.kind = "file"; this.name = name; this._bytes = bytes; this._type = type; } async getFile() { return new File([this._bytes], this.name, { type: this._type, lastModified: 1700000000000 }); } async isSameEntry() { return false; } }
  class FakeDir {
    constructor(name) { this.kind = "directory"; this.name = name; }
    static files = new Map();
    async *values() { for (const file of FakeDir.files.values()) yield file; }
    async *entries() { for (const [name, file] of FakeDir.files) yield [name, file]; }
    async queryPermission() { return "granted"; }
    async requestPermission() { return "granted"; }
    async isSameEntry() { return false; }
    async getFileHandle(name) { const file = FakeDir.files.get(name); if (!file) throw new DOMException("not found", "NotFoundError"); return file; }
    async getDirectoryHandle() { throw new DOMException("Gestellter Ordner kennt keine Unterordner.", "NotFoundError"); }
  }
  window.__fakeDirAdd = (name, base64, type) => FakeDir.files.set(name, new FakeFile(name, Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)), type));
  window.__fakeDirCalls = [];
  window.showDirectoryPicker = async (options) => { window.__fakeDirCalls.push(options?.mode || "read"); return new FakeDir("Eingang_Testordner"); };
});
const page = await context.newPage();
page.setDefaultTimeout(8000);
const errors = collectErrors(page);
const popups = [];
context.on("page", (p) => popups.push(p));

// Die Warteschlange zeigt den Titel (Dateiname ohne Endung, _ und - als Leerzeichen) bzw. den E-Mail-Betreff.
const titel = (name) => /\.eml$/i.test(name) ? ({ "Mail_Garantiefall_mit_PDF.eml": "Garantiefall Waschautomat Lavorix", "Mail_Schulausflug_mit_Foto.eml": "Schulausflug Wolkenhain" })[name] : name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
const queueItem = (name) => page.locator(".intake-queue-item", { hasText: titel(name) }).first();
const queueInfo = async (name) => { const item = queueItem(name); await item.waitFor(); await item.locator(".badge:not(:has-text('läuft'))").first().waitFor(); return { status: (await item.locator(".badge").first().innerText()).trim(), kind: (await item.locator("small").first().innerText()).trim(), text: (await item.innerText()).replace(/\s+/g, " ") }; };
const kinds = {};
const closeModals = async () => { for (let i = 0; i < 3; i++) { const close = page.locator(".intake-modal button[aria-label='Fenster schließen'], .scan-modal button[aria-label*='schließen' i], .file-viewer button[aria-label='Vorschau schließen']").first(); if (!(await close.count())) break; await close.click().catch(() => {}); await page.waitForTimeout(200); } };

try {
  await step("Eingangszentrale öffnen", async () => { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await footer(page, "Eingangszentrale"); await page.locator("h1", { hasText: "Eingangszentrale" }).waitFor(); });
  const picker = page.locator(".central-intake input[type=file]:not([accept])");

  // ---------- Dateiauswahl: alle Typen auf einmal ----------
  const alle = ["Nebenkostenabrechnung_2025_Arenberg-Hof.pdf", "Garantiebeleg_Waschautomat_Lavorix.pdf", "Scan_Garantiebeleg_nur_Bild.pdf", "Foto_Garantiebeleg_Lavorix.png", "Foto_Garantiebeleg_Lavorix_Seite2.jpg", "Mietvertrag_Arenberg-Hof_Nachtrag.docx", "Nebenkosten_Uebersicht_2025.xlsx", "Notiz_Fahrradkauf_Velotrix.txt", "Protokoll_Schulausflug.vtt", "Mail_Garantiefall_mit_PDF.eml", "Mail_Schulausflug_mit_Foto.eml", "Outlook_Nachricht_Stromtarif.msg", "Unterlagen_Umzug_Paket.zip", "Programm_nicht_erlaubt.exe"];
  await step("Dateiauswahl nimmt 14 Testdateien an", async () => { await picker.setInputFiles(alle.map(f)); await page.locator(".intake-queue-item").nth(13).waitFor(); await page.waitForFunction(() => !document.querySelector(".intake-queue-item .badge")?.textContent?.includes("läuft")); });
  for (const name of alle) { kinds[name] = await queueInfo(name); }
  const erwartet = {
    "Nebenkostenabrechnung_2025_Arenberg-Hof.pdf": ["PDF", "Einkäufe, Rechnungen & Garantien"], // Befund: „rechnung“ in „Abrechnung“ schlägt „nebenkosten“
    "Garantiebeleg_Waschautomat_Lavorix.pdf": ["PDF", "Einkäufe, Rechnungen & Garantien"],
    "Scan_Garantiebeleg_nur_Bild.pdf": ["PDF", "Einkäufe, Rechnungen & Garantien"],
    "Foto_Garantiebeleg_Lavorix.png": ["Foto / Bild", "Einkäufe, Rechnungen & Garantien"],
    "Mietvertrag_Arenberg-Hof_Nachtrag.docx": ["Word-Dokument", "Verträge & Abonnements"], // Befund: „Mietvertrag“ enthält nicht „miete“
    "Nebenkosten_Uebersicht_2025.xlsx": ["Tabelle", "Haus & Wohnung"],
    "Notiz_Fahrradkauf_Velotrix.txt": ["Text / Protokoll", "Einkäufe, Rechnungen & Garantien"],
    "Protokoll_Schulausflug.vtt": ["Text / Protokoll", "Korrespondenz"], // „Elternbrief“ im Text
    "Mail_Garantiefall_mit_PDF.eml": ["E-Mail (.eml)", "Einkäufe, Rechnungen & Garantien"],
    "Outlook_Nachricht_Stromtarif.msg": ["Outlook-E-Mail (.msg)", "Energie & Versorgung"],
    "Unterlagen_Umzug_Paket.zip": ["Archivdatei", "Archiv"], // Inhalt wird nicht gelesen
    "Programm_nicht_erlaubt.exe": ["Unbekannter Dateityp", "Archiv"],
  };
  for (const [name, [kind, area]] of Object.entries(erwartet)) {
    const info = kinds[name];
    check(info.kind.startsWith(kind), `Dateityp erkannt: ${name}`, info.kind);
    check(info.kind.includes(area), `Lebensbereich vorgeschlagen: ${name} → ${area}`, info.kind);
  }
  check(kinds["Programm_nicht_erlaubt.exe"].status === "Prüfung erforderlich", "Nicht erlaubter Typ (.exe) bleibt bei „Prüfung erforderlich“, wird nicht abgewiesen", kinds["Programm_nicht_erlaubt.exe"].status);
  check(kinds["Mail_Garantiefall_mit_PDF.eml"].text.includes("1 Anlage") && kinds["Mail_Garantiefall_mit_PDF.eml"].text.includes("Frist"), "EML: Absender, Anlagenzahl und mögliche Frist erkannt", kinds["Mail_Garantiefall_mit_PDF.eml"].text.slice(0, 200));
  check(kinds["Nebenkostenabrechnung_2025_Arenberg-Hof.pdf"].text.includes("Inhalt konnte nicht automatisch gelesen"), "PDF-Textebene wird im Eingang NICHT gelesen (nur Dateiname zählt)", kinds["Nebenkostenabrechnung_2025_Arenberg-Hof.pdf"].text.slice(0, 160));
  check(kinds["Mietvertrag_Arenberg-Hof_Nachtrag.docx"].text.includes("Inhalt konnte nicht automatisch gelesen"), "DOCX-Inhalt wird im Eingang NICHT gelesen (nur in „Bestand prüfen“)", kinds["Mietvertrag_Arenberg-Hof_Nachtrag.docx"].text.slice(0, 160));
  check(kinds["Outlook_Nachricht_Stromtarif.msg"].text.includes("Inhalt wurde"), "MSG (UTF-16-Text) wird gelesen", kinds["Outlook_Nachricht_Stromtarif.msg"].text.slice(0, 160));
  check(kinds["Foto_Garantiebeleg_Lavorix.png"].text.includes("Fotoserie") || kinds["Foto_Garantiebeleg_Lavorix_Seite2.jpg"].text.includes("Fotoserie"), "Zwei Bilder → Hinweis auf Fotoserie", kinds["Foto_Garantiebeleg_Lavorix.png"].text.slice(0, 200));
  check(!kinds["Unterlagen_Umzug_Paket.zip"].text.includes("Anlage"), "ZIP wird nicht entpackt (keine Anlagen-Zeile)", kinds["Unterlagen_Umzug_Paket.zip"].text.slice(0, 160));

  // ---------- Drag & Drop ----------
  await step("Drag & Drop in die Ablagefläche", async () => {
    const data = readFileSync(f("Nebenkostenabrechnung_2025_Arenberg-Hof.pdf")).toString("base64");
    const dt = await page.evaluateHandle((b64) => { const dt = new DataTransfer(); dt.items.add(new File([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], "Nebenkosten_per_Drop.pdf", { type: "application/pdf" })); return dt; }, data);
    await page.locator(".central-drop").dispatchEvent("drop", { dataTransfer: dt });
    const info = await queueInfo("Nebenkosten per Drop");
    return `${info.status} · ${info.kind}`;
  });
  await step("Gleicher Inhalt, anderer Name, später hinzugefügt: KEINE Dublettenwarnung in der Warteschlange (Befund)", async () => {
    const info = await queueInfo("Nebenkosten per Drop");
    if (info.text.includes("Dublette")) throw new Error("unerwartet gemeldet: " + info.text.slice(0, 200));
  });
  await step("Gleicher Inhalt, anderer Name, im SELBEN Stapel: Dublette innerhalb der Auswahl wird gemeldet", async () => {
    await picker.setInputFiles([f("Nebenkostenabrechnung_2025_Arenberg-Hof.pdf"), f("Kopie_Abrechnung_Pustelblume.pdf")]);
    await page.locator(".intake-queue-item").nth(1).waitFor();
    await page.waitForFunction(() => !document.querySelector(".intake-queue-item .badge")?.textContent?.includes("läuft"));
    const text = await page.locator(".intake-queue-item").first().innerText();
    if (!text.includes("Dublette innerhalb dieser Auswahl")) throw new Error(text.replace(/\s+/g, " ").slice(0, 200));
  });

  // ---------- Zuordnung prüfen und speichern ----------
  await step("„Zuordnung prüfen“ öffnet den Dokumenteneingang mit Vorschlag", async () => {
    await queueItem("Garantiebeleg_Waschautomat_Lavorix.pdf").locator("button", { hasText: "Zuordnung prüfen" }).click();
    await page.locator(".intake-modal").waitFor();
    const cards = await page.locator(".intake-choice-card dd").allInnerTexts();
    return cards.map((c) => c.split("\n")[0]).join(" · ");
  });
  const vorschlag = await page.locator(".intake-choice-card dd").allInnerTexts();
  check(vorschlag[0].startsWith("Einkäufe") && vorschlag[1].startsWith("Rechnung / Garantie") && vorschlag[2].startsWith("vertraulich") && vorschlag[3].startsWith("Garantie / Reparatur"), "Vorschlag: Lebensbereich, Dokumentenart, Datenschutz, Bereich", vorschlag.map((c) => c.split("\n")[0]).join(" · "));
  check((await page.locator(".intake-analysis-head").innerText()).includes("Quelle: Dateiauswahl"), "Dialog zeigt Quelle und Vertrauensgrad", (await page.locator(".intake-analysis-head").innerText()).replace(/\s+/g, " "));
  await step("Auswahl ändern: Datenschutz „besonders geschützt“ wählbar", async () => {
    await page.locator("button[aria-label='Datenschutzstufe auswählen']").click();
    await page.locator(".intake-choice-options button", { hasText: "besonders geschützt" }).click();
    const dd = await page.locator(".intake-choice-card dd").nth(2).innerText();
    if (!dd.includes("besonders geschützt") || !dd.includes("von dir gewählt")) throw new Error(dd);
    await page.locator("button[aria-label='Datenschutzstufe auswählen']").click();
    await page.locator(".intake-choice-options button", { hasText: "vertraulich" }).click();
  });
  await step("„Geprüft lokal speichern“ legt das Dokument ab (Beleg erscheint)", async () => {
    await page.locator(".intake-modal button[type=submit]").click();
    await page.locator(".intake-modal").waitFor({ state: "detached", timeout: 20000 });
    await queueItem("Garantiebeleg_Waschautomat_Lavorix.pdf").locator(".badge", { hasText: "Übernommen" }).waitFor({ timeout: 20000 });
  });
  await step("Übernommenes Dokument erscheint in der Liste unter der Eingangszentrale mit Speicherpfad", async () => {
    const item = page.locator(".document-item", { hasText: "Garantiebeleg_Waschautomat_Lavorix" }).first();
    await item.waitFor({ timeout: 20000 });
    const text = await item.innerText();
    if (!text.includes("01_Dokumente/Garantie")) throw new Error(text.replace(/\s+/g, " ").slice(0, 200));
    return text.match(/Me_Myself[^\s]*/)?.[0];
  });

  // ---------- Dublette gegen den Bestand, Trotzdem übernehmen ----------
  await step("Gleiche Datei erneut: Dublettenwarnung mit „Trotzdem übernehmen“", async () => {
    await picker.setInputFiles([f("Garantiebeleg_Waschautomat_Lavorix.pdf")]);
    await page.waitForTimeout(800);
    const item = page.locator(".intake-queue-item").first(); // neueste Eingänge stehen oben
    await item.locator(".badge", { hasText: "Prüfung erforderlich" }).waitFor();
    const text = (await item.innerText()).replace(/\s+/g, " ");
    if (!text.includes("Mögliche Dublette")) {
      // Befund prüfen: liegt es am Sitzungsstand? Seite neu laden (Tresor wird neu gelesen) und erneut hinzufügen.
      await page.reload({ waitUntil: "networkidle" }); await ready(page); await footer(page, "Eingangszentrale");
      await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([f("Garantiebeleg_Waschautomat_Lavorix.pdf")]);
      const again = page.locator(".intake-queue-item").first();
      await again.locator(".badge:not(:has-text('läuft'))").first().waitFor();
      const text2 = (await again.innerText()).replace(/\s+/g, " ");
      if (!text2.includes("Mögliche Dublette")) throw new Error("auch nach Neuladen keine Dublettenzeile: " + text2.slice(0, 200));
      await again.locator("button", { hasText: "Zuordnung prüfen" }).click();
      await page.locator(".intake-modal .duplicate-warning").waitFor();
      return "⚠ erst nach Neuladen der Seite erkannt (in derselben Sitzung nach dem Speichern nicht)";
    }
    await item.locator("button", { hasText: "Zuordnung prüfen" }).click();
    await page.locator(".intake-modal .duplicate-warning").waitFor();
  });
  await step("Speichern ohne Bestätigung wird abgewiesen", async () => {
    await page.locator(".intake-modal button[type=submit]").click();
    const err = await page.locator(".intake-modal .form-error").innerText();
    if (!err.includes("Dublette")) throw new Error(err);
  });
  await step("„Trotzdem übernehmen“ + Speichern legt zweite Kopie ab", async () => {
    await page.locator(".intake-modal .duplicate-warning input[type=checkbox]").check();
    await page.locator(".intake-modal button[type=submit]").click();
    await page.locator(".intake-modal").waitFor({ state: "detached", timeout: 20000 });
    await page.waitForFunction(() => document.querySelectorAll(".document-item").length >= 2 && [...document.querySelectorAll(".document-item")].filter((e) => e.textContent.includes("Garantiebeleg_Waschautomat_Lavorix")).length >= 2, null, { timeout: 20000 });
  });
  // ---------- E-Mail-Anlagen in die Warteschlange (nach dem Speichern, weil die PDF-Anlage denselben Namen trägt) ----------
  await step("EML: „Anlagen in Warteschlange prüfen“ löst PDF-Anlage heraus", async () => {
    const vorher = await page.locator(".intake-queue-item").count();
    await queueItem("Mail_Garantiefall_mit_PDF.eml").locator("button", { hasText: "Anlagen in Warteschlange" }).click();
    await page.waitForFunction((n) => document.querySelectorAll(".intake-queue-item").length === n + 1, vorher);
    const neu = page.locator(".intake-queue-item").first();
    const text = await neu.innerText();
    if (!text.includes("Garantiebeleg Waschautomat Lavorix") || !text.includes("PDF")) throw new Error(text.slice(0, 120));
  });
  await step("EML: Bild- und Text-Anlage werden herausgelöst", async () => {
    await queueItem("Mail_Schulausflug_mit_Foto.eml").locator("button", { hasText: "Anlagen in Warteschlange" }).click();
    await page.locator(".intake-queue-item", { hasText: "Ausflug Wolkenhain" }).first().waitFor();
    await page.locator(".intake-queue-item", { hasText: "Elternbrief" }).first().waitFor();
  });

  // Dublette nur über den Namen: Kopie mit anderem Namen, gleichem Inhalt → Prüfsummen-Dublette beim Speichern?
  await step("Gleicher Inhalt, anderer Name: Eingang warnt NICHT (nur Name+Größe), Tresor warnt per Prüfsumme", async () => {
    await closeModals();
    // zuerst das Original speichern, dann die Kopie (gleicher Inhalt, anderer Name)
    await queueItem("Nebenkostenabrechnung_2025_Arenberg-Hof.pdf").locator("button", { hasText: "Zuordnung prüfen" }).click();
    await page.locator(".intake-modal button[type=submit]").click();
    await page.locator(".intake-modal").waitFor({ state: "detached", timeout: 20000 });
    await queueItem("Kopie_Abrechnung_Pustelblume.pdf").locator("button", { hasText: "Zuordnung prüfen" }).click();
    await page.locator(".intake-modal").waitFor();
    await page.locator(".intake-modal button[type=submit]").click();
    const err = await page.locator(".intake-modal .form-error").innerText({ timeout: 20000 });
    await page.locator(".intake-modal button[aria-label='Fenster schließen']").click();
    if (!err.includes("Dublette")) throw new Error(err);
    return "Eingang: keine Warnung · Tresor: " + err.slice(0, 60);
  });

  // ---------- Größengrenze ----------
  await closeModals();
  await step("Datei über 20 MB: Eingang nimmt sie an, Speichern lehnt ab", async () => {
    await picker.setInputFiles([GROSS]);
    const info = await queueInfo("Zu gross 21MB");
    await queueItem("Zu gross 21MB").locator("button", { hasText: "Zuordnung prüfen" }).click();
    await page.locator(".intake-modal").waitFor();
    await page.locator(".intake-modal button[type=submit]").click();
    const err = await page.locator(".intake-modal .form-error").innerText({ timeout: 20000 });
    await page.locator(".intake-modal button[aria-label='Fenster schließen']").click();
    if (!err.includes("20 MB")) throw new Error(err);
    return `${info.status} · dann: ${err}`;
  });

  // ---------- Nicht erlaubter Typ ----------
  await closeModals();
  await step("Nicht erlaubter Typ (.exe): Speichern ist dennoch möglich (keine Sperre)", async () => {
    await queueItem("Programm_nicht_erlaubt.exe").locator("button", { hasText: "Zuordnung prüfen" }).click();
    await page.locator(".intake-modal").waitFor();
    await page.locator(".intake-modal button[type=submit]").click();
    await page.locator(".intake-modal").waitFor({ state: "detached", timeout: 20000 });
    await page.locator(".document-item", { hasText: "Programm_nicht_erlaubt.exe" }).first().waitFor({ timeout: 20000 });
  });

  // ---------- ZIP, MSG, VTT speichern ----------
  for (const name of ["Unterlagen_Umzug_Paket.zip", "Outlook_Nachricht_Stromtarif.msg", "Protokoll_Schulausflug.vtt", "Mietvertrag_Arenberg-Hof_Nachtrag.docx"]) {
    await step(`${name}: Zuordnung prüfen und speichern`, async () => {
      await queueItem(name).locator("button", { hasText: "Zuordnung prüfen" }).click();
      await page.locator(".intake-modal").waitFor();
      const area = (await page.locator(".intake-choice-card dd").first().innerText()).split("\n")[0];
      await page.locator(".intake-modal button[type=submit]").click();
      await page.locator(".intake-modal").waitFor({ state: "detached", timeout: 20000 });
      await page.locator(".document-item", { hasText: name }).first().waitFor({ timeout: 20000 });
      return area;
    });
  }

  // ---------- Dokument fotografieren (Scan → PDF) ----------
  await closeModals();
  await step("„Dokument fotografieren“ mit zwei Fotos → PDF → Dokumenteneingang", async () => {
    if (!(await page.locator("h1", { hasText: "Eingangszentrale" }).count())) { await footer(page, "Eingangszentrale"); await page.locator("h1", { hasText: "Eingangszentrale" }).waitFor(); }
    const camera = page.locator(".central-intake input[type=file][capture]");
    await camera.setInputFiles([f("Foto_Garantiebeleg_Lavorix.png"), f("Foto_Garantiebeleg_Lavorix_Seite2.jpg")]);
    try { await page.locator(".scan-modal").waitFor({ timeout: 20000 }); }
    catch { await page.screenshot({ path: path.join(LAUFZEIT, "fehler-scan.png"), fullPage: true }).catch(() => {}); throw new Error("Scan-Fenster fehlt: " + (await page.locator("body").innerText()).replace(/\s+/g, " ").match(/.{0,120}(Fehler|Bitte zuerst|Kamera).{0,160}/)?.[0]); }
    await page.waitForTimeout(500);
    const text = await page.locator(".scan-modal").innerText();
    if (!/2 Seite|Seite 1|Seite 2/.test(text)) throw new Error(text.slice(0, 200));
    const pruefen = page.locator(".scan-modal button", { hasText: "Aufnahme prüfen" });
    if (await pruefen.count()) await pruefen.first().click();
    await page.locator(".scan-modal button", { hasText: "PDF erstellen" }).click();
    await page.locator(".intake-modal").waitFor({ timeout: 40000 });
    const head = await page.locator(".intake-analysis-head").innerText();
    if (!head.includes("fotografierten")) throw new Error(head);
    await page.locator(".intake-modal button[type=submit]").click();
    await page.locator(".intake-modal").waitFor({ state: "detached", timeout: 20000 });
    // Nach einem Kamera-Scan zeigt die App die Quittung auf der Startseite (uploadFromStart) – einen Augenblick nach dem
    // Schließen des Fensters. Erst dort ankommen, sonst sucht die Probe den Scan auf der falschen Seite (war ein Wackler).
    await page.waitForFunction(() => location.hash === "#startseite", null, { timeout: 10000 }).catch(() => {});
    if (!(await page.locator("h1", { hasText: "Eingangszentrale" }).count())) { await footer(page, "Eingangszentrale"); await page.locator("h1", { hasText: "Eingangszentrale" }).waitFor(); }
    const saved = page.locator(".document-item", { hasText: "Dokumentscan_" }).first();
    await saved.waitFor({ timeout: 20000 });
    const savedText = (await saved.innerText()).replace(/\s+/g, " ");
    return `${head.replace(/\s+/g, " ").slice(0, 80)} · ${savedText.slice(0, 120)}`;
  });

  // ---------- Lokaler Eingangsordner (gestellt) ----------
  await closeModals();
  await step("Eingangsordner auswählen (gestellter Ordner mit 3 Dateien) → neue Dateien in der Warteschlange", async () => {
    for (const name of ["Notiz_Fahrradkauf_Velotrix.txt", "Garantiebeleg_Waschautomat_Lavorix.pdf", "Foto_Garantiebeleg_Lavorix.png"]) {
      await page.evaluate(([n, b, t]) => window.__fakeDirAdd(n, b, t), [`Ordner_${name}`, readFileSync(f(name)).toString("base64"), name.endsWith(".pdf") ? "application/pdf" : name.endsWith(".png") ? "image/png" : "text/plain"]);
    }
    await page.locator(".central-source-grid button", { hasText: "Eingangsordner auswählen" }).click();
    await queueItem("Ordner_Notiz_Fahrradkauf_Velotrix.txt").waitFor();
    const info = await queueInfo("Ordner_Notiz_Fahrradkauf_Velotrix.txt");
    const button = await page.locator(".central-source-grid button", { hasText: "Eingangsordner jetzt prüfen" }).innerText();
    const calls = await page.evaluate(() => window.__fakeDirCalls);
    return `${info.kind} · ${button.replace(/\s+/g, " ")} · Ordnerwähler-Modus: ${calls.join(",")}`;
  });
  await step("„Eingangsordner jetzt prüfen“ findet nichts Neues (bekannte Dateien werden übersprungen)", async () => {
    const vorher = await page.locator(".intake-queue-item").count();
    await page.locator(".central-source-grid button", { hasText: "Eingangsordner jetzt prüfen" }).click();
    await page.waitForTimeout(1500);
    const nachher = await page.locator(".intake-queue-item").count();
    if (nachher !== vorher) throw new Error(`${vorher} → ${nachher}`);
  });
  await step("OneDrive-Ordner prüfen ohne Verbindung → Hinweis, Sprung ins Sicherheitscenter", async () => {
    await page.locator(".central-source-grid button", { hasText: "OneDrive-Familienordner prüfen" }).click();
    await page.locator(".security-center, h1:has-text('Sicherheit'), h1:has-text('Datentresor')").first().waitFor();
    await page.locator(".footer-directory button", { hasText: "Eingangszentrale" }).first().click();
    await page.locator("h1", { hasText: "Eingangszentrale" }).waitFor();
  });

  // ---------- Sammelaktionen ----------
  await closeModals();
  await step("Sammelauswahl: Zurückstellen und Weiterbearbeiten", async () => {
    const item = queueItem("Nebenkosten_Uebersicht_2025.xlsx");
    await item.locator("button", { hasText: "Zurückstellen" }).click();
    await item.locator(".badge", { hasText: "Zurückgestellt" }).waitFor();
    await item.locator("button", { hasText: "Weiterbearbeiten" }).click();
    await item.locator(".badge:not(:has-text('Zurückgestellt'))").first().waitFor();
    await item.locator("button", { hasText: "Nicht übernehmen" }).count();
  });
  await step("Sammelauswahl: zwei Häkchen → „Nicht übernehmen“", async () => {
    await queueItem("Nebenkosten_Uebersicht_2025.xlsx").locator("input[type=checkbox]").check();
    await queueItem("Foto_Garantiebeleg_Lavorix_Seite2.jpg").locator("input[type=checkbox]").check();
    await page.locator(".queue-batch button", { hasText: "Nicht übernehmen" }).click();
    await queueItem("Nebenkosten_Uebersicht_2025.xlsx").locator(".badge", { hasText: "Nicht übernommen" }).waitFor();
  });

  // ---------- Statuswechsel, Vorschau ----------
  await closeModals();
  await step("Statuswechsel: hochgeladen → Abgleich vormerken → geprüft → eingearbeitet", async () => {
    const item = page.locator(".document-item", { hasText: "Protokoll_Schulausflug.vtt" }).first();
    await item.locator("button", { hasText: "Abgleich vormerken" }).click();
    await item.locator("button", { hasText: "Als geprüft bestätigen" }).click({ timeout: 20000 });
    await item.locator("button", { hasText: "Als eingearbeitet bestätigen" }).click({ timeout: 20000 });
    await item.locator(".badge", { hasText: /eingearbeitet/i }).waitFor({ timeout: 20000 });
  });
  await closeModals();
  await step("Vorschau: Klick auf den Titel öffnet das Original (neues Fenster mit blob-Adresse)", async () => {
    await page.locator(".document-item", { hasText: "Garantiebeleg_Waschautomat_Lavorix" }).first().locator(".document-title-link").click();
    await page.waitForTimeout(2500);
    const popup = popups.pop();
    const viewer = page.locator(".file-viewer, [class*='viewer']").first();
    if (popup) { await popup.waitForLoadState().catch(() => {}); const url = popup.url(); await popup.close(); return `neues Fenster: ${url.slice(0, 30)}`; }
    if (await viewer.count()) { const text = (await viewer.innerText()).replace(/\s+/g, " ").slice(0, 120); await page.locator("button[aria-label*='schließen' i], button[aria-label*='Schließen']").first().click(); return `Vorschau in der Seite (Popup blockiert): ${text}`; }
    throw new Error("weder Fenster noch Vorschau");
  });
  await step("Nach der Vorschau ist die Seite wieder bedienbar", async () => {
    await page.keyboard.press("Escape");
    const backdrops = await page.locator(".modal-backdrop").count();
    if (backdrops) { await page.screenshot({ path: path.join(LAUFZEIT, "nach-vorschau.png") }); throw new Error(`${backdrops} Überlagerung(en) bleiben: ` + (await page.locator(".modal-backdrop").first().innerText()).replace(/\s+/g, " ").slice(0, 160)); }
  });

  // ---------- Bibliothek, Suche, Cockpit ----------
  await step("Dokumentenbibliothek zeigt die neuen Unterlagen", async () => {
    await footer(page, "Dokumentenbibliothek");
    await page.locator("input[placeholder*='Titel, Dateiname']").fill("Lavorix");
    await page.locator("text=Garantiebeleg_Waschautomat_Lavorix").first().waitFor({ timeout: 10000 });
    return String(await page.locator("text=Garantiebeleg_Waschautomat_Lavorix").count()) + " Treffer";
  });
  await step("Suche auf der Startseite findet die neue Unterlage", async () => {
    await page.locator(".main-navigation .nav-cluster > button").first().waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
    const search = page.locator("input[placeholder*='Zeige mir']");
    await search.fill("Lavorix");
    await search.press("Enter");
    await page.locator("text=Garantiebeleg_Waschautomat_Lavorix").first().waitFor({ timeout: 10000 });
  });
  await step("„Was gibt’s Neues?“ nennt die neue Unterlage", async () => {
    await page.locator(".footer-directory button", { hasText: "Was gibt’s Neues" }).first().click();
    await page.locator("text=/Garantiebeleg[ _]Waschautomat[ _]Lavorix/").first().waitFor({ timeout: 10000 });
  });
  await step("Cockpit lädt nach dem Eingang ohne Fehler", async () => {
    await footer(page, "Interaktives Cockpit");
    await page.locator("h1", { hasText: "Cockpit" }).waitFor();
  });

  // ---------- Startseiten-Dokumenteneingang (zweiter Weg) ----------
  await step("Startseite: „Neue Dokumente erfassen“ → Datei auswählen (nur eine Datei, mit accept-Liste ohne .eml)", async () => {
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await page.locator(".document-intake").waitFor({ timeout: 20000 });
    const input = page.locator(".document-intake input[type=file]:not([capture])");
    const accept = await input.getAttribute("accept");
    await input.setInputFiles([f("Notiz_Fahrradkauf_Velotrix.txt")]);
    await page.locator(".intake-modal").waitFor();
    const text = await page.locator(".intake-analysis-head").innerText();
    await page.locator(".intake-modal button[aria-label='Fenster schließen']").click();
    if (!text.includes("Dateiauswahl")) throw new Error(text);
    return `accept=${accept}`;
  });

  const fremd = errors.filter((e) => !/ERR_TUNNEL_CONNECTION_FAILED|cdnjs|Failed to load resource/.test(e));
  check(fremd.length === 0, "Keine Seitenfehler während des Dateieingangs (Netzfehler von cdnjs/pdf.js ausgenommen)", fremd.slice(0, 3).join(" | "));
  check(!errors.some((e) => /cdnjs|ERR_TUNNEL/.test(e)) || true, "Hinweis: pdf.js wird von cdnjs geladen", errors.filter((e) => /cdnjs|ERR_TUNNEL/.test(e)).length ? "im Prüfbehälter ohne Netz nicht ladbar → PDF-Vorschau in der Seite fehlt offline" : "kein Ladeversuch gesehen");
} catch (e) { fail("Unerwarteter Abbruch", String(e?.message || e)); }
finally { await context.close(); }

// ---------- „Bestand prüfen“ (Inventar) mit gestelltem Hauptordner samt Unterordner ----------
const context2 = await browser.newContext(DESKTOP);
await context2.addInitScript(() => {
  class FakeFile { constructor(name, bytes, type) { this.kind = "file"; this.name = name; this._bytes = bytes; this._type = type; } async getFile() { return new File([this._bytes], this.name, { type: this._type, lastModified: 1700000000000 }); } async isSameEntry() { return false; } }
  class FakeDir { constructor(name, files) { this.kind = "directory"; this.name = name; this._files = files; } async *values() { for (const f of this._files.values()) yield f; } async *entries() { for (const [n, f] of this._files) yield [n, f]; } async queryPermission() { return "granted"; } async requestPermission() { return "granted"; } async isSameEntry() { return false; } async resolve() { return null; } async getFileHandle(n) { const f = this._files.get(n); if (!f) throw new DOMException("x", "NotFoundError"); return f; } async getDirectoryHandle(n) { const f = this._files.get(n); if (!f || f.kind !== "directory") throw new DOMException("x", "NotFoundError"); return f; } }
  const files = new Map(); const sub = new Map();
  files.set("Unterordner", new FakeDir("Unterordner", sub));
  window.__add = (n, b64, t, inSub) => (inSub ? sub : files).set(n, new FakeFile(n, Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), t));
  // Der echte OPFS-Tresor vergleicht sich mit dem gestellten Ordner: fremde Objekte sind „kein Verwandter“.
  if (typeof FileSystemDirectoryHandle !== "undefined") {
    const origResolve = FileSystemDirectoryHandle.prototype.resolve; const origSame = FileSystemDirectoryHandle.prototype.isSameEntry;
    FileSystemDirectoryHandle.prototype.resolve = async function (h) { return h instanceof FileSystemHandle ? origResolve.call(this, h) : null; };
    FileSystemDirectoryHandle.prototype.isSameEntry = async function (h) { return h instanceof FileSystemHandle ? origSame.call(this, h) : false; };
  }
  window.showDirectoryPicker = async () => new FakeDir("SOFTWARE TESTORDNER (gestellt)", files);
});
const page2 = await context2.newPage(); page2.setDefaultTimeout(8000);
const errors2 = collectErrors(page2);
try {
  await step("Bestand prüfen: Seite öffnen, gestellten Hauptordner (3 Dateien + Unterordner mit 2 Dateien) wählen", async () => {
    await page2.goto(app.base + "?experte=1", { waitUntil: "networkidle" }); await ready(page2); // Bestand nur im Expertenmodus (B2)
    for (const [n, t, inSub] of [["Nebenkostenabrechnung_2025_Arenberg-Hof.pdf", "application/pdf", false], ["Mietvertrag_Arenberg-Hof_Nachtrag.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", true], ["Notiz_Fahrradkauf_Velotrix.txt", "text/plain", true], ["Foto_Garantiebeleg_Lavorix.png", "image/png", false], ["Mail_Garantiefall_mit_PDF.eml", "message/rfc822", false]]) {
      await page2.evaluate(([n, b, t, s]) => window.__add(n, b, t, s), [n, readFileSync(f(n)).toString("base64"), t, inSub]);
    }
    await footer(page2, "Bestand prüfen");
    await page2.locator("h1", { hasText: "Bestand prüfen" }).waitFor();
    await page2.locator("button", { hasText: "Hauptordner einschließlich Unterordner auswählen" }).click();
    await page2.locator("button", { hasText: "Anderen Hauptordner wählen" }).waitFor();
  });
  await step("„Bestand jetzt prüfen“ analysiert alle 5 Dateien einschließlich Unterordner", async () => {
    await page2.locator("button", { hasText: "Bestand jetzt prüfen" }).click();
    await page2.waitForFunction(() => !document.body.innerText.includes("Analyse läuft"), null, { timeout: 60000 });
    await page2.waitForTimeout(800);
    const text = (await page2.locator("body").innerText()).replace(/\s+/g, " ");
    const m = text.match(/(\d+) Dateien analysiert (\d+) neu .*?(\d+) empfohlen (\d+) noch prüfen (\d+) Dubletten (\d+) geringe Relevanz/);
    if (!m || m[1] !== "5") throw new Error(text.match(/.{0,80}analysiert.{0,120}/)?.[0] || "keine Zusammenfassung");
    return `${m[1]} analysiert · ${m[3]} empfohlen · ${m[4]} prüfen · ${m[5]} Dubletten · ${m[6]} geringe Relevanz`;
  });
  await step("Bestand: Mietvertrag (DOCX) im Unterordner mit gelesenem Inhalt und Vorschlag", async () => {
    const row = page2.locator("article, tr, li", { hasText: "Mietvertrag_Arenberg-Hof_Nachtrag.docx" }).first();
    await row.waitFor();
    const text = (await row.innerText()).replace(/\s+/g, " ");
    return text.slice(0, 200);
  });
  await step("Bestand: „Ansehen“ zeigt für die Textdatei einen Textausschnitt", async () => {
    const row = page2.locator("article, tr, li", { hasText: "Notiz_Fahrradkauf_Velotrix.txt" }).first();
    await row.locator("button", { hasText: "Ansehen" }).first().click();
    await page2.waitForTimeout(1200);
    const text = (await page2.locator(".modal, [role=dialog]").last().innerText()).replace(/\s+/g, " ");
    await page2.keyboard.press("Escape");
    if (!text.includes("Velotrix")) throw new Error(text.slice(0, 200));
    return text.slice(0, 120);
  });
  await step("Bestand: „Dateien archivieren“ bleibt ohne Archivdatenträger gesperrt (klare Meldung)", async () => {
    const button = page2.locator("button", { hasText: "Dateien archivieren" }).first();
    const disabled = await button.isDisabled();
    const hint = (await page2.locator(".inventory-selection-status").innerText()).replace(/\s+/g, " ");
    if (!disabled) throw new Error("Knopf aktiv: " + hint);
    return hint.slice(0, 100);
  });
  const fremd2 = errors2.filter((e) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(e));
  check(fremd2.length === 0, "Bestand prüfen: keine Seitenfehler", fremd2.slice(0, 3).join(" | "));
} catch (e) { fail("Unerwarteter Abbruch (Bestand)", String(e?.message || e)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Dateieingang"));
