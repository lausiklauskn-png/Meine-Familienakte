import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runTestWorkspaceSelfTests } from "../app/local-vault.ts";

const tests = runTestWorkspaceSelfTests();
for (const test of tests) assert.equal(test.passed, true, `${test.id}: ${test.summary}`);

const portal = await readFile(new URL("../app/health-portal.tsx", import.meta.url), "utf8");
const vault = await readFile(new URL("../app/local-vault.ts", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../lib/system-check-manifest.json", import.meta.url), "utf8"));

assert.ok(portal.includes("Testakte für Weiterentwicklung") && portal.includes("Gespeicherte Testakte erneut prüfen"), "Die neue Testakten-Funktion ist nicht vollständig erreichbar.");
assert.ok(portal.includes("keine Online-Verbindung hergestellt") && portal.includes("Dateien werden nicht angelegt, verändert, verschoben oder gelöscht"), "Browsergrenzen oder Originalschutz werden nicht verständlich erklärt.");
assert.ok(vault.includes("rememberedInventorySourceFolder") && vault.includes("INVENTORY_SOURCE_KEY"), "Der vorhandene gespeicherte Testordner wird nicht wiederverwendet.");
assert.ok(vault.includes("inspectTestWorkspace") && vault.includes('listInventoryFiles(handle, "", [], { excludedPaths, issues: accessIssues })'), "Die rekursive lesende Testakten-Prüfung fehlt.");
assert.ok(vault.includes("directoryRelationship") && vault.includes("inventoryPathIsExcluded") && vault.includes("readableDirectoryAccessError"), "Die Trennung von Analysequelle und Datentresor oder die pfadbezogene Fehlerbehandlung fehlt.");
assert.ok(manifest.completedCapabilities.includes("Testakte für Weiterentwicklung 2.28.1"), "Die Funktion fehlt im konsolidierten Entwicklungsstand.");

console.log(`Testakte für Weiterentwicklung: ${tests.length + 6}/${tests.length + 6} Tests bestanden.`);
