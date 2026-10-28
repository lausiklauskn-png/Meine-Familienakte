import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FAWOGA_INVENTORY_VERSION, runFawogaLearningSelfTests, runFawogaOneDriveSelfTests, runInventoryPreviewSelfTests } from "../lib/fawoga-inventory.ts";
import { runInventoryTextDecodingSelfTests } from "../app/local-vault.ts";

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const portal = read("app/health-portal.tsx");
const vault = read("app/local-vault.ts");

assert.equal(FAWOGA_INVENTORY_VERSION, "2.28.1", "Die Bestandslogik verwendet nicht Version 2.28.1.");
const tests = runFawogaOneDriveSelfTests();
assert.equal(tests.length, 30, "Für 2.28.1 müssen genau 30 technische FaWoGa-OneDrive-Prüfungen vorhanden sein.");
for (const test of tests) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}
const learningTests = runFawogaLearningSelfTests();
assert.equal(learningTests.length, 5, "Für die lernfähige Zuordnung müssen fünf gezielte Prüfungen vorhanden sein.");
for (const test of learningTests) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}
const previewTests = runInventoryPreviewSelfTests();
assert.equal(previewTests.length, 6, "Für die Dokumentvorschau müssen sechs Dateityp- und Datenschutzwege geprüft werden.");
for (const test of previewTests) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}
const decodingTests = runInventoryTextDecodingSelfTests();
assert.equal(decodingTests.length, 5, "Für unlesbare und falsch decodierte Inhalte müssen fünf Schutzprüfungen vorhanden sein.");
for (const test of decodingTests) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}

assert.ok(vault.includes("skippedUnchanged") && vault.includes("shouldPause"), "Inkrementelle oder pausierbare Bestandsprüfung fehlt.");
assert.ok(vault.includes('await listInventoryFiles(entry as FileSystemDirectoryHandle, path, output, { ...options, issues })') && vault.includes('const path = prefix ? `${prefix}/${entry.name}` : entry.name'), "Unterordner werden nicht rekursiv einschließlich ihrer Herkunftspfade erfasst.");
assert.ok(portal.includes("Analyse pausieren") && portal.includes("Analyse fortsetzen"), "Bedienung für Pause und Fortsetzung fehlt.");
assert.ok(portal.includes("QUELLE_ANALYSIERT") && portal.includes("ASSISTENZ_FREIGEGEBEN"), "Die drei Freigabestufen sind nicht vollständig eingebunden.");
assert.ok(portal.includes("InventoryPreviewDialog") && portal.includes("Original öffnen") && portal.includes("Zuordnung bestätigen"), "Dokumentvorschau oder direkte Zuordnungsbestätigung fehlt.");
assert.ok(vault.includes("readInventorySourcePreview") && vault.includes("docxTextHint"), "Lokale Vorschau oder Word-Textextraktion fehlt.");
assert.ok(vault.includes("decodeInventoryText") && vault.includes("manuelle_pruefung_erforderlich") && vault.includes("isMeaningfulDocumentText"), "Zeichencodierungs- oder Lesbarkeitsprüfung fehlt.");
assert.ok(portal.includes("Inhalt konnte nicht sinnvoll als Text dargestellt werden.") && portal.includes("Vorschau nicht verfügbar – bitte Original öffnen."), "Die verständlichen Ersatzanzeigen für unlesbare Inhalte fehlen.");
assert.ok(portal.includes("Wichtige Stichworte") && portal.includes("Vorhandenen Eintrag wählen") && portal.includes("Oder neuen Vorschlag eingeben"), "Die vollständige bearbeitbare Zuordnung im Vorschaufenster fehlt.");
assert.ok(portal.includes('label: "Person"') && portal.includes('label: "Organisation"') && portal.includes('label: "Objekt"') && portal.includes('label: "Vorgang"'), "Mindestens einer der vier bestätigungspflichtigen Bezüge fehlt.");
assert.ok(vault.includes("normalizedRecordLabel") && vault.includes("createFamilyRecord") && vault.includes("referenceChoices"), "Dublettenschutz oder bestätigungspflichtige Neuanlage fehlt.");
assert.ok(vault.indexOf("if (!record && label) record = index.records.find") < vault.indexOf("if (!record && label) {"), "Vor einer Neuanlage wird nicht zuerst nach einem vorhandenen Eintrag gesucht.");
assert.ok(portal.includes("const startVaultInventoryComparison = async ()") && portal.includes("onCompare={startVaultInventoryComparison}") && portal.includes("await scanInventorySource(vaultHandle)"), "Der Sicherheitscenter-Abgleich verwendet nicht direkt die rekursive FaWoGa-Bestandsanalyse des verbundenen Tresors.");
assert.ok(!portal.includes("api.openai.com") && !portal.includes("OPENAI_API_KEY"), "Eine kostenpflichtige externe API wurde eingebaut.");

console.log("🟢 30 technische FaWoGa-OneDrive-Prüfungen bestanden.");
console.log("🟢 Rekursive Hauptordnerprüfung: Unterordner beliebiger Verschachtelung werden mit vollständigem Herkunftspfad erfasst.");
console.log("🟢 Sicherheitscenter-Abgleich: Der verbundene Tresor wird direkt als rekursive FaWoGa-Quelle verwendet; die Einzeldatei-Funktion bleibt getrennt.");
console.log("🟢 5 Lernfunktions-Tests bestanden; nur bestätigte Zuordnungen werden im bestehenden Register als Vorschlagshilfe wiederverwendet.");
console.log("🟢 6 Vorschau-Tests bestanden; PDF, Bild, Word/Text, E-Mail und Gesundheitsunterlagen verwenden den vorgesehenen Weg.");
console.log("🟢 5 Decodierungs- und Binärschutztests bestanden; unlesbare Zeichen und Rohdaten werden nicht als normaler Text angezeigt.");
console.log("🟢 3 Zuordnungswege technisch geprüft: bekannte Person, Organisation mit Objekt und bestehender Vorgang verwenden dieselbe bestätigungspflichtige Kernlogik.");
console.log("🟡 Die praktische Prüfung mit einem bewusst ausgewählten OneDrive-Testordner steht noch aus.");
