import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runFamilyMemorySelfTests, runMemoryQueueSelfTests } from "../lib/family-memory.ts";

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const portal = read("app/health-portal.tsx");
const vault = read("app/local-vault.ts");
const styles = read("app/globals.css");
const manifest = JSON.parse(read("lib/system-check-manifest.json"));

const baseTests = runFamilyMemorySelfTests();
const queueTests = runMemoryQueueSelfTests();
const tests = [...baseTests, ...queueTests];
assert.equal(baseTests.length, 12, "Für die bestehende Memory-Funktion müssen genau zwölf praktische Testfälle vorhanden sein.");
assert.equal(queueTests.length, 10, "Für die Mehrfacherfassung müssen genau zehn zusätzliche praktische Testfälle vorhanden sein.");
for (const test of tests) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}

assert.ok(portal.includes("function MemoryCapturePanel") && portal.includes("function MemoryReviewDialog") && portal.includes("function MemoryCenter"), "Erfassung, Prüfansicht oder Erinnerungszentrum fehlt.");
assert.ok(portal.includes('active === "memory"') && portal.includes('label: "Tagebuch & Erinnerungen"'), "Der Memory-Bereich ist nicht vollständig erreichbar.");
assert.ok(portal.includes("Nächste Eingabe") && portal.includes("Unbehandelte Memory-Ereignisse") && portal.includes("Alle Memory-Ereignisse bearbeitet"), "Mehrfacherfassung, Warteschlange oder Abschlussmeldung fehlt.");
assert.ok(portal.includes("Unbehandelte Erinnerungen:") && portal.includes("Offene Memory-Fragen:") && portal.includes("Bereit zum Speichern"), "Die getrennten Zähler oder Statusanzeigen fehlen.");
assert.ok(vault.includes("createLocalMemoryBundle") && vault.includes("createOrUpdateLocalMemoryDraft") && vault.includes("deleteLocalMemoryDraft") && vault.includes("03_Erinnerungsmedien") && vault.includes("00_Unbehandelt") && vault.includes("updateLocalMemoryOpenPointStatus"), "Lokale Entwurfs-/Endspeicherung, Medienablage oder Statusänderung fehlt.");
assert.ok(styles.includes(".memory-capture") && styles.includes(".memory-history") && styles.includes(".memory-review") && styles.includes(".memory-draft-queue") && styles.includes(".memory-completion"), "Die responsive Memory- und Warteschlangen-Darstellung ist unvollständig.");
assert.ok(manifest.memoryReuse.length >= 7 && manifest.memorySafety.length >= 7, "Wiederverwendung oder Schutzregeln sind unvollständig.");
assert.ok(manifest.completedCapabilities.includes("Memory v1.3 – Mehrfacherfassung und Bearbeitungswarteschlange"), "Memory v1.3 ist nicht im gemeinsamen Systemstand registriert.");
assert.ok(!portal.includes("OPENAI_API_KEY") && !portal.includes("api.openai.com"), "Memory darf keine kostenpflichtige oder externe OpenAI-API verwenden.");
console.log("🟢 22 von 22 Memory-Praxistests bestanden, davon 10 Mehrfacherfassungstests; keine parallele Datenbank und keine kostenpflichtige API.");
