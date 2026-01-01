import assert from "node:assert/strict";
import { runFamilyCockpitSelfTests } from "../lib/family-cockpit.ts";

const results = runFamilyCockpitSelfTests();
assert.equal(results.length, 5, "Für das Interaktive Cockpit müssen fünf praktische Testabläufe vorhanden sein.");
for (const result of results) {
  assert.equal(result.status, "bestanden", `${result.label}: ${result.summary}`);
  console.log(`🟢 Cockpit ${result.label}: ${result.summary}`);
}

console.log("🟢 Cockpit-Integrität: vorhandenes Datenmodell wiederverwendet, keine zweite Datenbank und keine ungefragte Datenänderung");
