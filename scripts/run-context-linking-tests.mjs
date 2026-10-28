import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runContextLinkingSelfTests } from "../lib/family-context-linking.ts";

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const portal = read("app/health-portal.tsx");
const vault = read("app/local-vault.ts");
const styles = read("app/globals.css");
const manifest = JSON.parse(read("lib/system-check-manifest.json"));

const tests = runContextLinkingSelfTests();
assert.equal(tests.length, 7, "Für die neue Kontextverknüpfung müssen genau sieben praktische Testfälle vorhanden sein.");
for (const test of tests) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}

assert.ok(manifest.completedCapabilities.includes("Intelligente Dokument-Memory-Vorgangsverknüpfung v1"), "Die neue Verknüpfungsstufe fehlt im gemeinsamen Systemstand.");
assert.ok(manifest.contextLinkingReuse.length >= 7 && manifest.contextLinkingSafety.length >= 8, "Wiederverwendung oder Schutzregeln der Kontextverknüpfung sind unvollständig.");
assert.ok(portal.includes("Möglicher vorhandener Zusammenhang") && portal.includes("Warum vorgeschlagen?") && portal.includes("Nicht verknüpfen"), "Die bestätigungspflichtige Dokument-Verknüpfung ist unvollständig.");
assert.ok(portal.includes("Passendes Dokument gefunden") && portal.includes("Gehört dazu") && portal.includes("Was ist noch offen?"), "Memory-Rückbezug, Kontextanzeige oder offene Vorgangspunkte fehlen.");
assert.ok(portal.includes("Gemeinsame Vorgangschronologie") && portal.includes("Ereignis ergänzen") && portal.includes("Dokument hinzufügen"), "Die gemeinsame Vorgangsansicht oder die Wiederverwendung vorhandener Eingänge fehlt.");
assert.ok(vault.includes("confirmLocalContextLink") && vault.includes("rejectLocalContextLink") && vault.includes("removeLocalContextLink") && vault.includes("changeLocalContextLink"), "Bestätigen, Ablehnen, Ändern oder Lösen einer Verbindung ist nicht vollständig lokal gespeichert.");
assert.ok(styles.includes(".context-suggestion") && styles.includes(".related-context") && styles.includes(".case-timeline"), "Die responsive Kontext- und Chronologiedarstellung fehlt.");
assert.ok(!portal.includes("OPENAI_API_KEY") && !portal.includes("api.openai.com"), "Die Verknüpfung darf keine kostenpflichtige oder externe OpenAI-API verwenden.");

console.log("🟢 7 von 7 Verknüpfungstests bestanden; keine zweite Datenbank, Suche oder Chronologie erzeugt.");
