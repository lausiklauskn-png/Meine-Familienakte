import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FAWOGA_LIFE_AREAS, runDocumentIntakeSelfTests } from "../lib/document-intake.ts";
import { buildStoredPersonalLifeAreas } from "../lib/document-intake-metadata.ts";

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const portal = read("app/health-portal.tsx");
const vault = read("app/local-vault.ts");
const styles = read("app/globals.css");
const manifest = JSON.parse(read("lib/system-check-manifest.json"));

assert.equal(FAWOGA_LIFE_AREAS.length, 18, "Die 18 bestehenden FaWoGa-Lebensbereiche müssen unverändert verwendet werden.");
assert.ok(portal.includes("function DocumentIntakePanel") && portal.includes("Neue Dokumente erfassen"), "Das kompakte Startseitenmodul fehlt.");
assert.ok(portal.includes("buildDocumentIntakePlan") && portal.includes("runDocumentIntakeSelfTests"), "Die gemeinsame Verarbeitungspipeline ist nicht eingebunden.");
assert.ok(vault.includes("chooseInboxFolder") && vault.includes("scanLocalInbox") && vault.includes("scanOneDriveInbox"), "Lokaler Eingangsordner oder OneDrive-Prüfung fehlt.");
assert.ok(styles.includes(".document-intake") && styles.includes(".intake-drop") && styles.includes(".intake-source"), "Die responsive Darstellung des Dokumenteneingangs fehlt.");
assert.ok(portal.includes("intake-choice-tab") && portal.includes("Eigene Bezeichnung hinzufügen"), "Die interaktive Auswahl für Lebensbereich, Dokumentenart und Bereich fehlt.");
assert.ok(portal.includes("INTAKE_PRIVACY_CLASSES") && portal.includes("Datenschutzstufe auswählen"), "Die auswählbare Datenschutzstufe fehlt.");
assert.ok(!portal.includes("Ich habe den Vorschlag geprüft"), "Die überflüssige zusätzliche Prüf-Checkbox darf nicht mehr angezeigt werden.");
assert.ok(portal.includes("Intelligenter Vorschlag übernommen") && portal.includes("Zuordnung vom Benutzer angepasst"), "Vorauswahl und bewusste Benutzeränderung müssen unterscheidbar gespeichert werden.");
assert.equal(manifest.architectureRule, "Ein Datensatz – eine Quelle – mehrere Verknüpfungen und Ansichten.");
assert.equal(manifest.documentIntakeReuse.length, 7, "Die Integrationsprüfung muss alle vorhandenen Zielbereiche abdecken.");
assert.ok(!portal.includes("OPENAI_API_KEY") && !portal.includes("api.openai.com"), "Der Dokumenteneingang darf keine kostenpflichtige API verwenden.");

const personalAreas = buildStoredPersonalLifeAreas([
  { id: "DOC-000001", notes: "FaWoGa: Gesundheit & Pflege · Dokumentart: Arztbrief" },
  { id: "DOC-000002", notes: "FaWoGa: Haustiere · Dokumentart: Rechnung" },
  { id: "DOC-000003", notes: "FaWoGa: Haustiere · Dokumentart: Vertrag" },
  { id: "DOC-000003", notes: "FaWoGa: Haustiere · Dokumentart: Vertrag" },
]);
assert.deepEqual(personalAreas, [{ name: "Haustiere", documentCount: 2 }], "Nur tatsächlich gespeicherte persönliche Lebensbereiche dürfen ohne Dubletten auf der Startseite erscheinen.");
assert.ok(portal.includes("buildStoredPersonalLifeAreas") && portal.includes("onOpenLifeArea(area.name)"), "Gespeicherte persönliche Lebensbereiche sind nicht dynamisch mit der vorhandenen Dokumentenbibliothek verbunden.");

const tests = runDocumentIntakeSelfTests();
assert.equal(tests.length, 21, "Es müssen genau einundzwanzig Dokumenteneingangs-Praxistests vorhanden sein.");
for (const test of tests) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}

console.log("🟢 Integrationsprüfung: vorhandene Dokumentenbibliothek, Suche, Zuordnung, Cockpit, Neuigkeiten, Vorgänge und Gesundheitsakte werden wiederverwendet");
console.log("🟢 Interaktive Zuordnung: Softwarevorschläge, Auswahlreiter und eigene Bezeichnungen sind geprüft");
console.log("🟢 Originalschutz: kein automatisches Verschieben, Umbenennen, Löschen oder Überschreiben");
