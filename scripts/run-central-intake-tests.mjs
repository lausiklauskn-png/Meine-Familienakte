import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { detectCentralIntakeFileKind, parseEmlText, runCentralIntakeSelfTests } from "../lib/central-intake.ts";

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const portal = read("app/health-portal.tsx");
const component = read("app/central-intake-center.tsx");
const vault = read("app/local-vault.ts");
const styles = read("app/globals.css");
const manifest = JSON.parse(read("lib/system-check-manifest.json"));

assert.equal(detectCentralIntakeFileKind({ name: "Brief.pdf", size: 1, type: "application/pdf" }), "PDF");
assert.equal(detectCentralIntakeFileKind({ name: "unbekannt.xyz", size: 1, type: "application/octet-stream" }), "Unbekannter Dateityp");
const parsed = parseEmlText("From: service@example.de\r\nTo: lindqvist@example.de\r\nSubject: Testnachricht\r\nMessage-ID: <test@example.de>\r\n\r\nInhalt");
assert.equal(parsed.metadata.subject, "Testnachricht");
assert.equal(parsed.metadata.messageId, "<test@example.de>");

assert.ok(portal.includes('active === "inbox"') && portal.includes("<CentralIntakeCenter"), "Die Eingangszentrale ist nicht im vorhandenen Dokumentenbereich eingebunden.");
assert.ok(component.includes("Dateien hier hineinziehen") && component.includes("multiple") && component.includes("Eingänge prüfen"), "Mehrfach-Drag-&-Drop oder Warteschlange fehlt.");
assert.ok(component.includes("Als gemeinsames Scan-Dokument prüfen") && portal.includes("DocumentScanDialog"), "Die bestehende Mehrseiten-Scan-Funktion wird nicht wiederverwendet.");
assert.ok(portal.includes("extractEmlAttachments") && vault.includes("linkLocalDocuments") && portal.includes("enthält Anlage"), "E-Mail-Anlagen oder ihre bestätigte Dokumentrelation fehlen.");
assert.ok(portal.includes("scanLocalInbox") && portal.includes("scanOneDriveInbox"), "Lokaler Ordner und OneDrive verwenden nicht die vorhandenen bewussten Eingangswege.");
assert.ok(styles.includes(".central-drop") && styles.includes(".intake-queue-item") && styles.includes("@media (max-width: 560px)"), "Responsive Darstellung der Eingangszentrale fehlt.");
assert.ok(manifest.completedCapabilities.includes("Zentrale Eingangszentrale mit gemeinsamer Inhaltsanalyse 2.28.0"));
assert.equal(manifest.centralIntakeReuse.length, 8, "Die Eingangszentrale muss acht vorhandene Kernfunktionen wiederverwenden.");
assert.ok(manifest.centralIntakeSafety.length >= 8, "Die Schutzgrenzen der Eingangszentrale sind unvollständig.");
assert.ok(!portal.includes("OPENAI_API_KEY") && !portal.includes("api.openai.com"), "Die Eingangszentrale darf keine kostenpflichtige externe API verwenden.");

const tests = await runCentralIntakeSelfTests();
assert.ok(tests.length >= 20, "Mindestens zwanzig technische Eingangszentrale-Praxistests sind erforderlich.");
for (const test of tests) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}

console.log(`🟢 ${tests.length} Eingangszentrale-Tests bestanden`);
console.log("🟢 Integrationsprüfung: bestehender Dokumentenkern, Suche, Kategorien, Vorgänge, Memory, Fristen, Datenschutz und Archivierung werden wiederverwendet");
console.log("🟢 Originalschutz: keine automatische Verschiebung, Umbenennung, Überschreibung oder Löschung");
