import assert from "node:assert/strict";
import { interpretFamilySearchQuery, runFamilySearchSelfTests } from "../lib/family-search.ts";

const results = runFamilySearchSelfTests();
assert.equal(results.length, 4, "Für die interaktive Suche müssen vier praktische Alltagssätze geprüft werden.");
for (const result of results) {
  assert.equal(result.status, "bestanden", `${result.label}: ${result.summary}`);
  console.log(`🟢 Suche ${result.label}: ${result.summary}`);
}

const before = "Zeige mir bitte meine Schreiben von der Krankenkasse zum Zuschuss";
const interpretation = interpretFamilySearchQuery(before);
assert.equal(interpretation.original, before, "Der ursprüngliche Suchsatz muss unverändert erhalten bleiben.");
assert.ok(interpretation.terms.includes("krankenkasse") && interpretation.terms.includes("leistung"));
assert.ok(interpretation.intents.some((intent) => intent.id === "benefits"));
assert.ok(interpretation.intents.some((intent) => intent.id === "correspondence"));

console.log("🟢 Suchschutz: lokale Auswertung ohne zweite Datenbank, externe KI oder Veränderung des Suchsatzes");
