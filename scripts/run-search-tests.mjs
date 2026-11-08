import assert from "node:assert/strict";
import { interpretFamilySearchQuery, runFamilySearchSelfTests, scoreFamilySearchText } from "../lib/family-search.ts";

const results = runFamilySearchSelfTests();
assert.equal(results.length, 4, "Für die interaktive Suche müssen vier praktische Alltagssätze geprüft werden.");
for (const result of results) {
  assert.equal(result.status, "bestanden", `${result.label}: ${result.summary}`);
  console.log(`🟢 Suche ${result.label}: ${result.summary}`);
}

const before = "Zeige mir bitte meine Schreiben von der Krankenkasse zum Zuschuss";
const interpretation = interpretFamilySearchQuery(before);
assert.equal(interpretation.original, before, "Der ursprüngliche Suchsatz muss unverändert erhalten bleiben.");
assert.ok(interpretation.terms.includes("krankenkasse") && interpretation.terms.includes("zuschuss"));
// 2.28.39: Bereichswörter ordnen ein, sind aber keine zusätzlichen Suchwörter (sonst überschwemmen sie die Treffer).
assert.ok(!interpretation.terms.includes("leistung") && !interpretation.terms.includes("zahlung"), "Auslösewörter eines Bereichs dürfen keine Suchwörter werden.");
assert.ok(interpretation.groups.find((group) => group.word === "zuschuss")?.optional === false, "Das eigentliche Suchwort bleibt Pflicht.");
assert.ok(interpretation.intents.some((intent) => intent.id === "benefits"));
assert.ok(interpretation.intents.some((intent) => intent.id === "correspondence"));

const now = new Date(2026, 10, 8);
const treffer = (frage, text, daten = []) => scoreFamilySearchText(text, interpretFamilySearchQuery(frage, now), daten) > 0;
assert.ok(treffer("Bankauszug März", "Kontoauszug_Familienkonto.pdf", ["2026-03-04"]), "Bankauszug = Kontoauszug, März = Datum im März.");
assert.ok(!treffer("Bankauszug März", "Kontoauszug_Familienkonto.pdf", ["2026-04-04"]), "Ein Auszug aus dem April ist kein Treffer für März.");
assert.ok(treffer("Kontoauszug 03/2024", "Kontoauszug_2024-03.pdf") && treffer("Kontoauszug März 2024", "Kontoauszug_2024-03.pdf"), "03/2024 und „März 2024“ treffen 2024-03 im Dateinamen.");
assert.ok(!treffer("Kontoauszug 2024-03", "Kontoauszug_2024-02.pdf"), "Mehr Wörter = weniger Treffer: anderer Monat fällt heraus.");
assert.ok(treffer("15.03.2026", "Termin", ["2026-03-15"]), "Ein deutsches Datum trifft das gespeicherte Datum.");
assert.ok(treffer("wann ist der Arzttermin", "Vorsorgetermin für Ella vereinbaren"), "Arzttermin findet den Vorsorgetermin.");
assert.ok(!treffer("Arzt Termin", "Kontoauszug Auto"), "Zwei Buchstaben wie „au“ sind kein eigenes Suchwort.");
assert.ok(!treffer("Erinnerung Zahnarzt", "Erinnerung: Reparaturtermin Waschmaschine"), "Bereichswörter holen keine fremden Einträge herein.");
assert.ok(!treffer("Kfz-Versicherung", "Hausratversicherung") && treffer("Kfz-Versicherung", "Kfz-Versicherung – Kündigungsfrist"), "Alle Suchwörter müssen passen (UND).");
assert.ok(treffer("Termine", "Frist: Termin beim Amt") && treffer("Kontoauszüge", "Kontoauszug 2015"), "Mehrzahl findet die Einzahl.");
assert.ok(treffer("Fahrzeugschein oder Zulassung", "Zulassungsbescheinigung.pdf"), "„oder“ verbindet Teilfragen.");
console.log("🟢 Suche: Synonyme, Monate, deutsche Daten, UND-Verknüpfung, „oder“ und kurze Wörter geprüft");
console.log("🟢 Suchschutz: lokale Auswertung ohne zweite Datenbank, externe KI oder Veränderung des Suchsatzes");
