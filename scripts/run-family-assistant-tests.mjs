import assert from "node:assert/strict";
import { runFamilyAssistantSelfTests } from "../lib/family-assistant.ts";

const results = runFamilyAssistantSelfTests();
assert.equal(results.length, 5, "Für die Assistenz- und Korrespondenzzentrale müssen fünf Kernprüfungen vorhanden sein.");
for (const result of results) {
  assert.equal(result.passed, true, `${result.id}: ${result.summary}`);
  console.log(`🟢 Assistenz ${result.id}: ${result.summary}`);
}
console.log("🟢 Assistenz-Integrität: gemeinsames Register, vorhandene Relationen, bestätigungspflichtige Ablage und kein automatischer Versand");
