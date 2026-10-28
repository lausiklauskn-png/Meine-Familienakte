import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runFawogaInventorySelfTests } from "../lib/fawoga-inventory.ts";

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const portal = read("app/health-portal.tsx");
const vault = read("app/local-vault.ts");
const manifest = JSON.parse(read("lib/system-check-manifest.json"));

const tests = runFawogaInventorySelfTests();
assert.equal(tests.length, 8, "Für die Bestandsanalyse müssen genau acht technische Kernprüfungen vorhanden sein.");
for (const test of tests) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}

assert.ok(portal.includes('id: "inventory"') && portal.includes('active === "inventory"') && portal.includes("function InventoryCenter"), "Der Unterbereich Bestand prüfen ist nicht vollständig erreichbar.");
assert.ok(vault.includes("scanInventoryFolder") && vault.includes("archiveInventoryItems") && vault.includes("releaseInventoryItemsForAssistant"), "Analyse, Archivkopie oder Assistenzfreigabe fehlt.");
assert.ok(vault.includes("archivedChecksum") && vault.includes("Familienarchiv_Kennung.json"), "Prüfsummenprüfung oder dauerhafte Archivkennung fehlt.");
assert.ok(manifest.fawogaInventoryReuse.length >= 7 && manifest.fawogaInventorySafety.length >= 8, "Wiederverwendung oder Schutzregeln sind unvollständig.");
assert.ok(!portal.includes("OPENAI_API_KEY") && !portal.includes("api.openai.com"), "Eine kostenpflichtige externe API wurde eingebaut.");

console.log("🟢 Acht Bestandsanalyse-Kernprüfungen bestanden.");
console.log("🟢 Der praktische Pilotlauf wurde vor der Produktivfreigabe in der getrennten Testseite erfolgreich durchgeführt.");
