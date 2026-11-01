// Gegenprobe zu Stück 1 und 1b (Sitzung B, 2026-10-31): baut je eine Stelle absichtlich kaputt, prüft, dass die zugehörige Probe
// ROT wird (und zwar an der erwarteten Zeile), und legt die Datei danach zurück. Während des Laufs NICHT committen.
// Aufruf: node tests/gegenprobe-sitzung-b.mjs [Filter]
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const HP = "app/health-portal.tsx";
const faelle = [
  { name: "Suche: Memory und Vorgänge fehlen", datei: HP, alt: "  records.forEach((record) => {\n    const title = cockpitRecordLabel(record);", neu: "  [].forEach((record: FamilyRecordUnion) => {\n    const title = cockpitRecordLabel(record);", probe: "suche", rot: /Memory|Vorgang/ },
  { name: "Suche: Dokumente fehlen", datei: HP, alt: "  [...localDocuments, ...documents].forEach((item) => add(", neu: "  ([] as typeof documents).forEach((item) => add(", probe: "suche", rot: /Dokument/ },
  { name: "Suche: Diagnose zeigt ihren Inhalt", datei: HP, alt: 'title: "Geschützte Diagnose", detail: "Einzelheiten im geschützten Gesundheitsbereich"', neu: 'title: item.diagnosis, detail: "Einzelheiten im geschützten Gesundheitsbereich"', probe: "suche", rot: /Gesundheit datensparsam/ },
  { name: "Gesundheit: Knopf wieder gesperrt", datei: HP, alt: "fuellbar: (/^application", neu: "fuellbar: !isSensitiveHealthText(item.originalName, item.category, item.notes) && (/^application", probe: "ausfuellen-gesundheit", rot: /hat jetzt „Ausfüllen“/ },
  { name: "Gesundheit: KI-Knopf trotzdem da", datei: HP, alt: "geschuetzt={isSensitiveHealthText(fillDocument.originalName, fillDocument.category, fillDocument.notes)}", neu: "geschuetzt={false}", probe: "ausfuellen-gesundheit", rot: /kein „Mit KI benennen“/ },
  { name: "Kontakt: Speichern schreibt nichts", datei: "app/local-vault.ts", alt: "  record.data = kontaktUebernehmen((record.data || {}) as Record<string, unknown>, sauber) as typeof record.data;\n", neu: "", probe: "person-kontakt", rot: /Angaben speichern|Neuladen/ },
  { name: "Kontakt: falsche E-Mail geht durch", datei: "lib/person-kontakt.ts", alt: 'if (k === "email" && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(w))', neu: "if (false)", probe: "person-kontakt", rot: /Falsche E-Mail/ },
  { name: "Formular scannen: Ausfüllen öffnet nicht", datei: HP, alt: "        setFillDocId(neu.id);\n", neu: "", probe: "formular-scannen", rot: /Ausfüllen öffnet sich/ },
  { name: "Einzeldatei: Kern nicht eingebettet", datei: "scripts/build-single-file.mjs", alt: "<script>\n${kern}\n</script>", neu: "", probe: "einzeldatei", rot: /byte-gleich in der Einzeldatei|rechnet/, einzel: true },
  { name: "Netz: SBKIM schon beim Start geladen", datei: "index.html", alt: '<script defer src="./native/familienakte-android.js"></script>', neu: '<script defer src="./native/familienakte-android.js"></script>\n    <script src="./sbkim/01_storage.js" data-familienakte-sbkim="01"></script>', probe: "netz-mycel", rot: /Start: kein SBKIM/ },
  { name: "Netz: verbindet von selbst", datei: "public/native/familienakte-mycel.js", alt: "try { window.SbkimRendezvousUI.hide(); }", neu: "try { new WebSocket('wss://relay.family-projekt.de'); window.SbkimRendezvousUI.hide(); }", probe: "netz-mycel", rot: /keine Verbindung/ },
  { name: "Netz: schwebender Knopf sichtbar", datei: "app/globals.css", alt: "#sbkim-rdv-btn { display: none !important; }", neu: "", probe: "netz-mycel", rot: /Kein schwebender/ },
  { name: "Netz: Gerätename fehlt im Fenster", datei: "public/native/familienakte-mycel.js", alt: "if (panel.querySelector('[data-sbkim-geraetename]')) return true;", neu: "return true;", probe: "netz-mycel", rot: /Gerätename steht darin/ },
  { name: "Netz: ein Byte im Kanon-Modul 23", datei: "public/sbkim/23_rendezvous.js", alt: "Rendezvous", neu: "Rendezvouz", befehl: [process.execPath, ["tools/herkunft-pruefen.mjs"]], rot: /23_rendezvous\.js weicht ab/ },
  { name: "Menü: Leiste bei 1000 px abgeschnitten (alter Stand)", datei: "app/globals.css", alt: "@media (min-width: 901px) and (max-width: 1439px)", neu: "@media (min-width: 1001px) and (max-width: 1439px)", probe: "menue-breite", rot: /1000 px: alle acht Menüs/ },
  { name: "Zusammenhang: Verknüpfen setzt wieder den Vorschlag", datei: HP, alt: "onClick={() => { waehle(selectedCaseId || contextSuggestions[0].caseId);", neu: "onClick={() => { waehle(contextSuggestions[0].caseId);", probe: "kontext-auswahl", rot: /behält die eigene Wahl/ },
  { name: "Zusammenhang: Automatik setzt leere Auswahl zurück", datei: HP, alt: "if (selbstGewaehlt.current) return;", neu: "if (false) return;", probe: "kontext-auswahl", rot: /Nicht verknüpfen|Noch nicht verknüpfen/ },
  { name: "Zusammenhang: Überschrift nennt nur den Vorschlag", datei: HP, alt: "{selectedCaseId && selectedCaseId !== contextSuggestions[0].caseId ?", neu: "{false ?", probe: "kontext-auswahl", rot: /Überschrift nennt die Wahl/ },
  { name: "Diktat: Android-Echo wieder angehängt", datei: "lib/browser-dictation.ts", alt: "  return aus;\n}", neu: "  return teile.map((t) => t.trim()).filter(Boolean);\n}", befehl: [process.execPath, ["scripts/run-ui-orientation-tests.mjs"]], rot: /.*/, rotStderr: /AssertionError/ },
  { name: "Eingang: Foto-Knopf wieder ohne Workflow-PDF-Scanner", datei: "app/central-intake-center.tsx", alt: "onClick={() => storageReady ? onStartDocumentScan([]) : onGo(\"security\")} data-dokument-scannen", neu: "onClick={() => storageReady ? cameraRef.current?.click() : onGo(\"security\")} data-dokument-scannen", probe: "eingang-liest", rot: /öffnet den Scanner von Workflow PDF/ },
  { name: "Eingang: liest PDFs/Fotos nicht", datei: HP, alt: "if (!value.trim() && (istPdf || istBild)) {", neu: "if (false) {", probe: "eingang-liest", rot: /liest den Text/ },
  { name: "Eingang: langer Text überstimmt den Dateinamen", datei: "lib/document-intake.ts", alt: "kurzerHinweis || nachName.lifeArea === \"Archiv\" ? classifyFile(input.file.name, input.file.textHint) : nachName", neu: "classifyFile(input.file.name, input.file.textHint)", probe: "dateieingang", rot: /Übernommenes Dokument/ },
  // Stück 1 „Workflow PDF als Klon“ (2026-11-01)
  { name: "Klon: Datenbank nicht umgeleitet", datei: "public/apps/fa-wfpdf-bruecke.js", alt: "var open = IF.open; IF.open = function (n, v) { return arguments.length > 1 ? open.call(this, dbUm(n), v) : open.call(this, dbUm(n)); };", neu: "", probe: "workflow-pdf-klon", rot: /Eigene Datenbank|unberührt/ },
  { name: "Klon: Einstellungen nicht umgeleitet", datei: "public/apps/fa-wfpdf-bruecke.js", alt: "var set = SP.setItem; SP.setItem = function (k, v) { return set.call(this, um(k), v); };", neu: "", probe: "workflow-pdf-klon", rot: /fa_wfpdf_/ },
  { name: "Klon: ⟳ sieht Vorräte der Akte", datei: "public/apps/fa-wfpdf-bruecke.js", alt: "return l.filter(function (n) { return n.indexOf(VORRAT) === 0; });", neu: "return l;", probe: "workflow-pdf-klon", rot: /⟳-Weg/ },
  { name: "Klon: Mycel-Knoten wieder geladen", datei: "public/apps/workflow-pdf/index.html", alt: "<!-- Familienakte: kein Mycel-Knoten im Klon — die Akte hat ihre eigene Netz-Seite -->", neu: '<script defer src="assets/sbkim-init.js?v=1"></script>', probe: "workflow-pdf-klon", rot: /Mycel/ },
  { name: "Klon: Farben der Akte fehlen", datei: "public/apps/workflow-pdf/index.html", alt: '<link rel="stylesheet" href="../fa-wfpdf-thema.css?v=1">', neu: "", probe: "workflow-pdf-klon", rot: /Farben der Familienakte/ },
  { name: "Klon: Worker der Akte liefert die Akte statt des Klons", datei: "scripts/build-pwa.mjs", alt: 'const eigeneSeite = url.pathname.startsWith(new URL("./apps/", self.registration.scope).pathname);', neu: "const eigeneSeite = false;", probe: "workflow-pdf-klon", rot: /Klon erscheint im Rahmen/ },
  { name: "Klon: ein Byte in app.js", datei: "public/apps/workflow-pdf/assets/app.js", alt: "Workfloh", neu: "Workfloq", befehl: [process.execPath, ["scripts/run-ausfuellen-tests.mjs"]], rot: /.*/, rotStderr: /weicht vom Pin ab/ },
  // Stück 2 „Brücke Akte ⟷ Workflow PDF“ (2026-11-01)
  { name: "Brücke: Teilen geht am Akte vorbei", datei: "public/apps/fa-wfpdf-bruecke.js", alt: "N.share = function (daten) {", neu: "N.shareAlt = function (daten) {", probe: "workflow-pdf-bruecke", rot: /Teilen/ },
  { name: "Brücke: Unterlage kommt im Klon nicht an", datei: "public/apps/fa-wfpdf-bruecke.js", alt: 'Object.defineProperty(W, "launchQueue",', neu: 'Object.defineProperty(W, "launchQueueAlt",', probe: "workflow-pdf-bruecke", rot: /In Workflow PDF öffnen/ },
  { name: "Brücke: Scan geht nicht an die Akte", datei: "public/apps/fa-wfpdf-bruecke.js", alt: 'melde({ typ: "fa-wfpdf-ablegen", quelle: "scan",', neu: 'void ({ typ: "fa-wfpdf-ablegen", quelle: "scan",', probe: "workflow-pdf-bruecke", rot: /Fotofunktion/ },
  { name: "Brücke: Gesundheitsunterlage geht in den Klon", datei: HP, alt: "{onWfpdf && !sensitive && fillStateOf(item).fuellbar &&", neu: "{onWfpdf && fillStateOf(item).fuellbar &&", probe: "workflow-pdf-bruecke", rot: /Geschützte/ },
  { name: "Brücke: Fotofunktion wieder ohne Klon", datei: HP, alt: "if (!files.length && !wfpdfAlt()) {", neu: "if (false) {", probe: "workflow-pdf-bruecke", rot: /Fotofunktion/ },
  // Stück 3 „Stapel direkt übernehmen“ (2026-11-01)
  { name: "Stapel: unsicheres Blatt wird trotzdem zugeschnitten", datei: "app/stapel.ts", alt: "const ecken = e.sicher ? e.ecken : SB.ganz(c.width, c.height);", neu: "const ecken = e.ecken;", probe: "stapel", rot: /Bild ohne Blatt/ },
  { name: "Stapel: Anhalten wirkt nicht", datei: "app/stapel.ts", alt: 'if (jetzt() === "angehalten") await new Promise', neu: 'if (jetzt() === "nie") await new Promise', probe: "stapel", rot: /Anhalten/ },
  { name: "Stapel: Liste mit Vorschaubildern", datei: "app/stapel-seite.tsx", alt: "<small>{groesse(e.groesse)}</small>", neu: '<small>{groesse(e.groesse)}</small><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt=""/>', probe: "stapel", rot: /ohne Vorschaubilder/ },
  { name: "Stapel: Einordnen leert den Stapel nicht", datei: "app/stapel-seite.tsx", alt: "try { await onEinordnen(eintraege.map(stapelDatei)); for (const e of eintraege) await stapelWeg(e.id); ", neu: "try { await onEinordnen(eintraege.map(stapelDatei)); ", probe: "stapel", rot: /Stapel ist leer/ },
  // 2.28.12 (Klaus' Antworten 1 und 2): Filter, Zusammenfügen, Ziehen, „ein Brief“
  { name: "Stapel: Farbwahl wird nicht angewandt", datei: "app/stapel.ts", alt: 'if (einst.filter !== "original" || einst.schaerfe > 0) SB.filtern(', neu: "if (false) SB.filtern(", probe: "stapel", rot: /Schwarzweiß/ },
  { name: "Stapel: Zusammenfügen lässt die Quellen stehen", datei: "app/stapel-seite.tsx", alt: "  for (const e of eintraege) await stapelWeg(e.id);\n  window.dispatchEvent", neu: "  window.dispatchEvent", probe: "stapel", rot: /Zusammenfügen/ },
  { name: "Stapel: Ziehen fügt nicht zusammen", datei: "app/stapel-seite.tsx", alt: "if (a && b) void fuegen([a, b]);", neu: "if (false) void fuegen([a, b]);", probe: "stapel", rot: /Ziehen/ },
  { name: "Stapel: Haken „ein Brief“ wirkungslos", datei: "app/stapel-seite.tsx", alt: "ende: einst.zusammen ?", neu: "ende: false ?", probe: "stapel", rot: /ein Brief/ },
];
const filter = process.argv[2] || "";
const bauen = (einzel) => {
  for (const [cmd, args] of [["npx", ["vite", "build"]], [process.execPath, ["scripts/build-pwa.mjs"]], ...(einzel ? [[process.execPath, ["scripts/build-single-file.mjs"]]] : [])]) {
    const r = spawnSync(cmd, args, { stdio: "ignore" }); if (r.status !== 0) return false;
  }
  return true;
};
let gefangen = 0, durch = 0;
for (const f of faelle.filter((x) => x.name.includes(filter))) {
  const original = readFileSync(f.datei, "utf8");
  if (!original.includes(f.alt)) { console.log(`⚠ toter Anker: ${f.name}`); durch++; continue; }
  try {
    writeFileSync(f.datei, original.replace(f.alt, f.neu));
    if (readFileSync(f.datei, "utf8") === original) { console.log(`⚠ nichts geändert: ${f.name}`); durch++; continue; }
    const gebaut = f.befehl ? true : bauen(f.einzel);
    const r = !gebaut ? { status: 1, stdout: "🔴 Bau scheiterte" } : f.befehl ? spawnSync(f.befehl[0], f.befehl[1], { encoding: "utf8" }) : spawnSync(process.execPath, [`tests/ui/${f.probe}.test.mjs`], { encoding: "utf8" });
    const rote = (r.stdout || "").split("\n").filter((z) => z.startsWith("🔴"));
    const ok = gebaut && r.status !== 0 && (f.rotStderr ? f.rotStderr.test(r.stderr || "") : rote.some((z) => f.rot.test(z)));
    if (ok) gefangen++; else durch++;
    console.log(`${ok ? "✔ gefangen" : "✗ DURCHGERUTSCHT"}: ${f.name}${rote.length ? ` – ${rote.map((z) => z.slice(2, 60)).join(" | ")}` : ""}`);
  } finally { writeFileSync(f.datei, original); }
}
bauen(true);
console.log(`Gegenprobe Sitzung B: ${gefangen} gefangen · ${durch} durchgerutscht`);
process.exit(durch ? 1 : 0);
