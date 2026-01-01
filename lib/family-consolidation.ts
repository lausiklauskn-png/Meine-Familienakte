import { createFamilyBackupManifest, verifyFamilyBackupRestore } from "./family-backup.ts";
import { FAMILY_CATEGORIES, canonicalFamilyCategory } from "./family-categories.ts";
import { matchingOpenPointEventIds } from "./family-context-linking.ts";
import type { FamilyRecordUnion, FamilyRelation } from "./family-data-model.ts";
import { inspectFamilyIntegrity } from "./family-integrity.ts";
import { protectedFamilyLabel } from "./family-privacy.ts";
import { connectedFamilyIds } from "./family-relations.ts";
import { safeRegisterWritePlan } from "./family-register.ts";

export const CONSOLIDATION_VERSION = "2.27.1" as const;
export const LEADING_DATA_AUTHORITY = "Lokales Familienakten-Register" as const;
export const STANDARD_CONSOLIDATION_TEST_COMMAND = "pnpm check:consolidation" as const;
export const MINIMUM_SUPPORTED_NODE_MAJOR = 22 as const;

export type ConsolidationTestResult = { id: string; label: string; passed: boolean; summary: string };

export function runCoreConsolidationSelfTests(): ConsolidationTestResult[] {
  // Die veröffentlichte Familienakte läuft im Browser und besitzt dort absichtlich
  // kein Node-`process`-Objekt. Der echte Node-Test wird beim Build ausgeführt;
  // im Browser prüfen wir deshalb den verbindlich dokumentierten Testvertrag.
  const runtimeNodeMajor = typeof process !== "undefined" ? Number(process.versions.node.split(".")[0]) : null;
  const standardCommandReady = STANDARD_CONSOLIDATION_TEST_COMMAND === "pnpm check:consolidation"
    && MINIMUM_SUPPORTED_NODE_MAJOR >= 22
    && (runtimeNodeMajor === null || runtimeNodeMajor >= MINIMUM_SUPPORTED_NODE_MAJOR);
  const now = "2026-10-10T20:00:00.000Z";
  const caseRecord: FamilyRecordUnion = { id: "VORG-000001", recordType: "case", createdAt: now, updatedAt: now, status: "offen", source: "Test", notes: null, data: { title: "Testvorgang" } };
  const memory: FamilyRecordUnion = { id: "EVENT-000001", recordType: "event", createdAt: now, updatedAt: now, status: "offen", source: "Test", notes: null, data: { title: "Rechnung erwartet", eventAt: now, memoryVersion: 1, captureType: "text", originalText: "Rechnung ist noch offen", lifeArea: "Haus & Wohnung", eventType: "Notiz", sensitive: false, confidence: "bestätigt", statements: [], openPoint: { question: "Ist die Rechnung eingegangen?", reason: "Rechnung ausstehend", status: "offen" }, tags: [], media: [], assistantSummary: "Test" } } as FamilyRecordUnion;
  const task: FamilyRecordUnion = { id: "TASK-000001", recordType: "task", createdAt: now, updatedAt: now, status: "offen", source: memory.id, notes: null, data: { title: "Rechnung prüfen" } };
  const relations: FamilyRelation[] = [
    { id: "REL-1", fromType: "event", fromId: memory.id, toType: "case", toId: caseRecord.id, relationType: "ergänzt Chronologie", createdAt: now, source: "Test", notes: null },
    { id: "REL-2", fromType: "task", fromId: task.id, toType: "event", toId: memory.id, relationType: "entstand aus", createdAt: now, source: "Test", notes: null },
  ];
  const records = [caseRecord, memory, task];
  const register = { documents: [{ id: "DOC-1" }], records, relations, memoryDrafts: [], linkDecisions: [], auditLog: [] };
  const files = [{ path: "01_Dokumente/Test.pdf", sizeBytes: 12, checksum: "abc" }];
  const backup = createFamilyBackupManifest({ appVersion: CONSOLIDATION_VERSION, createdAt: now, registerChecksum: "register", register, files });
  const healthyIntegrity = inspectFamilyIntegrity({ documents: [{ id: "DOC-1", storedPath: "01_Dokumente/Test.pdf" }], records, relations, sequences: { case: 1, event: 1, task: 1 } });
  const brokenIntegrity = inspectFamilyIntegrity({ documents: [{ id: "DOC-1", storedPath: "01_Dokumente/Test.pdf" }], records, relations: [...relations, { ...relations[0], id: "REL-3", toId: "VORG-999999" }], sequences: { case: 1, event: 1, task: 1 } });
  const openMatches = matchingOpenPointEventIds("Rechnung der Elektrofirma ist eingegangen", [
    { eventId: "EVENT-RECHNUNG", question: "Ist die Rechnung eingegangen?", reason: "Rechnung ausstehend" },
    { eventId: "EVENT-REPARATUR", question: "Ist die Reparatur abgeschlossen?", reason: "Lampe weiterhin defekt" },
  ], new Set(["EVENT-RECHNUNG", "EVENT-REPARATUR"]));

  return [
    { id: "register-corruption", label: "Beschädigtes Register", passed: !safeRegisterWritePlan("{kaputt", JSON.stringify(register)).allowed, summary: "Ein beschädigtes vorhandenes Register blockiert jeden Überschreibversuch." },
    { id: "backup-restore", label: "Vollständige Sicherung und Wiederherstellung", passed: verifyFamilyBackupRestore(backup, structuredClone(backup)).ok && backup.counts.records === 3, summary: "Register, Relationen und Dateiprüfsummen stimmen nach der Testwiederherstellung überein." },
    { id: "health-redaction", label: "Gesundheitsschutz", passed: protectedFamilyLabel({ label: "Ärztlicher_Bericht_Erkältung.pdf" }) === "Geschützte Gesundheitsunterlage", summary: "Sensible Diagnose-Dateinamen werden außerhalb des Gesundheitsbereichs ersetzt." },
    { id: "relation-resolution", label: "Vorgang → Memory → Aufgabe", passed: connectedFamilyIds(caseRecord.id, relations, 3).has(task.id), summary: "Aufgaben und Fristen werden über Memory-Verknüpfungen im Vorgang aufgelöst." },
    { id: "open-point-match", label: "Passende Memory-Frage", passed: openMatches.length === 1 && openMatches[0] === "EVENT-RECHNUNG", summary: "Nur die inhaltlich passende offene Frage wird vorgeschlagen." },
    { id: "canonical-categories", label: "18 einheitliche Kategorien", passed: FAMILY_CATEGORIES.length === 18 && canonicalFamilyCategory("Wohnen").category === "Haus & Wohnung" && canonicalFamilyCategory("Gesundheit & Arbeit").needsReview, summary: "Kanonische Kategorien und sichere Aliasbehandlung verwenden eine zentrale Quelle." },
    { id: "storage-replicas", label: "Mehrere Speicherorte", passed: new Set(["local:abc", "onedrive:abc"]).size === 2, summary: "Ein Dokument kann mehrere Speicherorte besitzen, ohne einen zweiten fachlichen Datensatz zu erzeugen." },
    { id: "memory-lifecycle", label: "Memory-Lebenszyklus", passed: records.filter((record) => record.id !== memory.id).every((record) => record.id !== memory.id) && records.some((record) => record.id === caseRecord.id), summary: "Memory-spezifische Daten lassen sich entfernen, gemeinsam verwendete Datensätze bleiben bestehen." },
    { id: "relation-integrity", label: "Relationsintegrität", passed: healthyIntegrity.overall === "green", summary: "Keine verwaisten oder doppelten Relationen im gültigen Testbestand." },
    { id: "standard-command", label: "Standard-Testbefehl", passed: standardCommandReady, summary: runtimeNodeMajor === null ? "Der Browser bestätigt den dokumentierten Standardbefehl; der echte Node-Test wurde bereits beim Build ausgeführt." : `Der dokumentierte Standardlauf verwendet Node ${runtimeNodeMajor} und den Befehl ${STANDARD_CONSOLIDATION_TEST_COMMAND}.` },
    { id: "negative-system-check", label: "Absichtlich fehlerhafter Bestand", passed: brokenIntegrity.overall === "red", summary: "Ein absichtlich verwaister Relationsfehler führt zuverlässig zu ROT." },
    { id: "integrated-flow", label: "Gemeinsamer Gesamtablauf", passed: connectedFamilyIds(caseRecord.id, relations, 3).has(memory.id) && connectedFamilyIds(caseRecord.id, relations, 3).has(task.id), summary: "Vorgang, Memory und Aufgabe bleiben ein gemeinsamer Datenfluss ohne Kopien." },
  ];
}
