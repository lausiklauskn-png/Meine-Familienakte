// Proben für „Ausfüllen“ (Sitzung F): Pins des Workflow-PDF-Kerns und die reine Rechnung in lib/ausfuellen.ts.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { runAusfuellenSelfTests } from "../lib/ausfuellen.ts";
import { runPersonKontaktSelfTests } from "../lib/person-kontakt.ts";
import { runBriefkopfTitelSelfTests } from "../lib/briefkopf-titel.ts";
import { buildDocumentIntakePlan } from "../lib/document-intake.ts";

const herkunft = JSON.parse(readFileSync("public/wfpdf/HERKUNFT.json", "utf8"));
assert.equal(herkunft.repo, "lausiklauskn-png/Workflow-PDF");
assert.match(herkunft.commit, /^[0-9a-f]{40}$/, "HERKUNFT.json nennt keinen Commit.");
const dateien = Object.entries(herkunft.dateien);
for (const pflicht of ["scanner.js", "scan-bild.js", "blatt.js", "erkennung.js", "export.js", "reinigung.js", "schluesseltresor.js", "pdf-lib.min.js"]) {
  assert.ok(herkunft.dateien[`public/wfpdf/${pflicht}`], `HERKUNFT.json pinnt ${pflicht} nicht.`);
}
for (const [ziel, { sha256 }] of dateien) {
  assert.ok(existsSync(ziel), `${ziel} fehlt.`);
  assert.equal(createHash("sha256").update(readFileSync(ziel)).digest("hex"), sha256, `${ziel} weicht vom Pin ab — nie von Hand ändern, sondern node tools/wfpdf-nachziehen.mjs.`);
}
console.log(`🟢 Workflow-PDF-Kern: ${dateien.length} Dateien byte-gleich mit ${herkunft.commit.slice(0, 7)}`);
// Gleich mit der Quelle daneben, wenn ein Klon da ist (wie BookLedgerPro).
const klon = process.env.WFPDF_KLON || "../Workflow-PDF";
if (existsSync(`${klon}/assets/scanner.js`)) {
  let anders = 0;
  for (const [ziel, { quelle }] of dateien) if (existsSync(`${klon}/${quelle}`) && !readFileSync(`${klon}/${quelle}`).equals(readFileSync(ziel))) { anders++; console.log(`🟡 ${ziel} ist im Klon inzwischen anders (nachziehen?)`); }
  if (!anders) console.log("🟢 Gleich mit dem Workflow-PDF-Klon daneben");
}
// Klon der ganzen App Workflow PDF (2026-11-01, Weg B): byte-1:1, nur index.html mit der kontrollierten Abweichung.
{
  const { istGepatcht, patchIndex } = await import("../tools/wfpdf-app-patch.mjs");
  const klonPins = JSON.parse(readFileSync("public/apps/HERKUNFT.json", "utf8")).apps["workflow-pdf"];
  assert.equal(klonPins.repo, "lausiklauskn-png/Workflow-PDF");
  assert.match(klonPins.commit, /^[0-9a-f]{40}$/, "Klon: HERKUNFT nennt keinen Commit.");
  const pins = Object.entries(klonPins.dateien);
  for (const [rel, pin] of pins) {
    const ziel = `${klonPins.ordner}/${rel}`;
    assert.ok(existsSync(ziel), `${ziel} fehlt.`);
    assert.equal(createHash("sha256").update(readFileSync(ziel)).digest("hex"), pin, `${ziel} weicht vom Pin ab — nie von Hand ändern, sondern node tools/wfpdf-app-nachziehen.mjs.`);
  }
  for (const pflicht of ["index.html", "assets/app.js", "assets/db.js", "assets/eingang.js", "assets/briefkopf.js", "vendor/pdfjs/pdf.min.js", "vendor/tesseract/tesseract.min.js", "vendor/tesseract/lang/deu.traineddata", "vendor/scanic/scanic.js"])
    assert.ok(klonPins.dateien[pflicht], `Klon pinnt ${pflicht} nicht.`);
  assert.ok(!Object.keys(klonPins.dateien).some((r) => r === "sw.js" || r.startsWith("sbkim/")), "Klon trägt eigenen Service Worker oder Mycel-Knoten.");
  assert.ok(istGepatcht(readFileSync(`${klonPins.ordner}/index.html`, "utf8")), "Klon: index.html ohne die vier Abweichungen (Brücke, Farben, kein Service Worker, kein Mycel).");
  console.log(`🟢 Klon Workflow PDF: ${pins.length} Dateien byte-gleich mit ${klonPins.commit.slice(0, 7)}, index.html mit Brücke/Farben, ohne Service Worker/Mycel`);
  if (existsSync(`${klon}/index.html`)) {
    let anders = 0;
    for (const [rel] of pins) {
      if (!existsSync(`${klon}/${rel}`)) { anders++; continue; }
      const q = readFileSync(`${klon}/${rel}`);
      const soll = rel === "index.html" ? Buffer.from(patchIndex(q.toString("utf8")).html, "utf8") : q;
      if (!soll.equals(readFileSync(`${klonPins.ordner}/${rel}`))) anders++;
    }
    console.log(anders ? `🟡 Klon: ${anders} Dateien im Workflow-PDF-Klon daneben inzwischen anders (nachziehen?)` : "🟢 Klon gleich mit dem Workflow-PDF-Klon daneben");
  }
}
for (const test of [...runAusfuellenSelfTests(), ...runPersonKontaktSelfTests(), ...runBriefkopfTitelSelfTests()]) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}

// Briefkopf → Zuordnung (Klaus 2026-11-01): Empfänger findet die Person der Akte, Thema den Lebensbereich — nur, wenn der Name nichts sagt.
{
  const person = { id: "PER-000009", recordType: "person", createdAt: "2026-10-01", updatedAt: "2026-10-01", status: "aktiv", source: "Test", notes: null, data: { displayName: "Erika Probe" } };
  const brief = { absender: "Stadtwerke Lindwurm GmbH", empfaenger: "Erika Probe", datum: "2026-10-12", nummern: [{ art: "Kundennummer", wert: "KD-48213" }], thema: "Energie & Versorgung", betreff: "" };
  const datei = { name: "Dokumentscan 2026-11-01.pdf", size: 10, type: "application/pdf", textHint: "Sehr geehrte Frau Probe", brief };
  const mit = buildDocumentIntakePlan({ file: datei, source: "camera-scan", documents: [], records: [person] });
  const ohne = buildDocumentIntakePlan({ file: { ...datei, brief: null }, source: "camera-scan", documents: [], records: [person] });
  const benannt = buildDocumentIntakePlan({ file: { ...datei, name: "Arztbrief Befund.pdf" }, source: "camera-scan", documents: [], records: [person] });
  const pSchritt = (p) => p.assignment.steps.find((s) => s.stage === "person");
  const proben = [
    ["Briefkopf-Empfänger findet die Person der Akte", pSchritt(mit)?.selectedId === "PER-000009" || pSchritt(mit)?.candidates?.[0]?.id === "PER-000009"],
    ["ohne Briefkopf keine Person geraten", !pSchritt(ohne)?.selectedId],
    ["Thema aus dem Briefkopf wird Lebensbereich", mit.lifeArea === "Energie & Versorgung"],
    ["ein sprechender Dateiname geht vor dem Thema", benannt.lifeArea === "Gesundheit & Pflege"],
  ];
  for (const [label, ok] of proben) { assert.equal(ok, true, label); console.log(`🟢 ${label}`); }
}
