import assert from "node:assert/strict";
import { organizerUebernahme, organizerSchluessel, ORGANIZER_INDEX_MAX } from "../lib/organizer-uebernahme.ts";

// Erfundene Beispiele. Der Index hat die Form, die der Datei-Organizer schreibt (lib/index-format.ts dort).
const BEREICHE = ["Wohnen", "Versicherungen", "Archiv"];
const eintrag = (pfad, groesse, mehr = {}) => ({ pfad, name: pfad, groesse, pruefstand: "frei", gesiebt_bis: "Inhalt", dringlichkeit: "keine", nummern: [], sicherheit: {}, gruende: {}, kurzfassung: "", paperless: { tags: [] }, ...mehr });
const index = (dateien, extra = {}) => JSON.stringify({ format: "datei-organizer-index", fassung: 1, erstellt: "2026-11-16T08:00:00.000Z", app: "Datei-Organizer Pro 0.4.12", hinweis: "", dateien, lernregeln: [], verlauf: [], ...extra });
const brief = { name: "Nebenkosten 2025.pdf", size: 1200 }, kopie = { name: "Nebenkosten 2025 (1).pdf", size: 1200 }, fremd = { name: "Urlaub.jpg", size: 99 };
let count = 0;
const test = (name, fn) => { fn(); count++; console.log(`🟢 ${name}`); };

test("Organizer: Bereich, Art und Hinweis reisen als Vorschlag mit", () => {
  const r = organizerUebernahme(index([eintrag(brief.name, 1200, { kategorie: "Wohnen", schriftstueck: "Abrechnung", absender: "Hausverwaltung Musterhof", datum: "2026-03-04", frist: "2026-04-01", betrag: "214,50 €", archivnummer: "A-0007", sicherheit: { kategorie: "von dir", absender: "sicher", frist: "bitte prüfen" } })]), [brief, fremd], BEREICHE);
  assert.equal(r.ok, true); assert.equal(r.vorschlaege.size, 1);
  const v = r.vorschlaege.get(organizerSchluessel(brief));
  assert.equal(v.vorschlag.quelle, "Datei-Organizer"); assert.equal(v.vorschlag.lebensbereich, "Wohnen"); assert.equal(v.vorschlag.dokumentart, "Abrechnung");
  assert.match(v.vorschlag.hinweis, /Absender: Hausverwaltung Musterhof · Datum: 04\.03\.2026 · Frist: 01\.04\.2026 · Betrag: 214,50 € · Archivnummer: A-0007/);
  assert.match(v.vorschlag.hinweis, /von dir bestätigt: Bereich/); assert.match(v.vorschlag.hinweis, /noch unsicher: Frist/);
  assert.equal(v.hinweis, "");
});
test("Organizer: unbekannter Bereich wird nicht vorgeschlagen, Größe muss passen", () => {
  const r = organizerUebernahme(index([eintrag(brief.name, 1200, { kategorie: "Erfundener Bereich", schriftstueck: "Rechnung" }), eintrag(fremd.name, 100, { kategorie: "Wohnen" })]), [brief, fremd], BEREICHE);
  assert.equal(r.vorschlaege.get(organizerSchluessel(brief)).vorschlag.lebensbereich, undefined);
  assert.equal(r.vorschlaege.has(organizerSchluessel(fremd)), false, "andere Größe = andere Datei");
});
test("Organizer: eigene Kategorie reist nur mit, wenn sie dort von Hand gesetzt wurde", () => {
  const neu = { kategorie: "Ehrenamt Musterverein", sicherheit: { kategorie: "von dir" } };
  const r = organizerUebernahme(index([eintrag(brief.name, 1200, neu), eintrag(kopie.name, 1200, { kategorie: "Ehrenamt Musterverein", sicherheit: { kategorie: "sicher" } }), eintrag(fremd.name, 99, { kategorie: "wohnen", sicherheit: { kategorie: "von dir" } })]), [brief, kopie, fremd], BEREICHE);
  const v = r.vorschlaege.get(organizerSchluessel(brief)).vorschlag;
  assert.equal(v.lebensbereich, "Ehrenamt Musterverein");
  assert.match(v.hinweis, /Neuer Bereich aus dem Organizer: „Ehrenamt Musterverein“/);
  assert.equal(r.vorschlaege.get(organizerSchluessel(kopie))?.vorschlag.lebensbereich, undefined, "nicht von Hand = kein neuer Bereich");
  const w = r.vorschlaege.get(organizerSchluessel(fremd)).vorschlag;
  assert.equal(w.lebensbereich, "Wohnen", "vorhandener Bereich in seiner Schreibweise, kein zweiter");
  assert.doesNotMatch(w.hinweis || "", /Neuer Bereich/);
  const lang = organizerUebernahme(index([eintrag(brief.name, 1200, { kategorie: "x".repeat(61), sicherheit: { kategorie: "von dir" } })]), [brief], BEREICHE);
  assert.equal(lang.vorschlaege.get(organizerSchluessel(brief))?.vorschlag.lebensbereich, undefined);
});
test("Organizer: Doppelte bleiben im Ordner, wenn das Gegenstück dort liegt", () => {
  const liste = [eintrag(brief.name, 1200, { kategorie: "Wohnen" }), eintrag(kopie.name, 1200, { pruefstand: "doppelt", doppeltVon: brief.name })];
  const r = organizerUebernahme(index(liste), [brief, kopie], BEREICHE);
  assert.deepEqual([...r.doppelt], [organizerSchluessel(kopie)]); assert.equal(r.vorschlaege.has(organizerSchluessel(kopie)), false);
  const ohne = organizerUebernahme(index(liste), [kopie], BEREICHE);
  assert.equal(ohne.doppelt.size, 0, "fehlt das Gegenstück im Ordner, wird die Datei geholt");
});
test("Organizer: gesperrte Datei kommt mit Warnung", () => {
  const r = organizerUebernahme(index([eintrag(brief.name, 1200, { pruefstand: "auffällig", auffaellig: "Endung passt nicht zum Inhalt" })]), [brief], BEREICHE);
  assert.match(r.vorschlaege.get(organizerSchluessel(brief)).hinweis, /gesperrt: Endung passt nicht zum Inhalt/);
});
test("Organizer: Unterordner, Pfade, Steuerzeichen und doppelte Einträge bleiben wirkungslos", () => {
  const r = organizerUebernahme(index([eintrag("Unter/" + brief.name, 1200, { kategorie: "Wohnen" }), eintrag("..\\" + brief.name, 1200, { kategorie: "Wohnen" }), eintrag(fremd.name, 99, { kategorie: "Wohnen" }), eintrag(fremd.name, 99, { kategorie: "Archiv" }), eintrag(kopie.name, 1200, { kategorie: "Wohnen\u0007", schriftstueck: "x".repeat(101) })]), [brief, kopie, fremd], BEREICHE);
  assert.equal(r.ok, true); assert.equal(r.vorschlaege.size, 0);
});
test("Organizer: fremde, neuere, kaputte und zu große Indexe werden abgewiesen", () => {
  for (const t of ["{", JSON.stringify({ format: "anders", fassung: 1, dateien: [] }), index([], { fassung: 2 }), index([], { dateien: "nein" }), " ".repeat(ORGANIZER_INDEX_MAX + 1)]) {
    const r = organizerUebernahme(t, [brief], BEREICHE);
    assert.equal(r.ok, false); assert.ok(r.grund); assert.equal(r.vorschlaege.size, 0); assert.equal(r.doppelt.size, 0);
  }
});
console.log(`Organizer-Übernahme: ${count} grün`);
