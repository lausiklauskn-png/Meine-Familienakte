// Gemeinsamer Suchtext für Kopfsuche und Assistenz: dieselbe Frage findet an beiden Stellen dieselben Einträge.
import type { FamilyRecordUnion } from "./family-data-model.ts";
import { recordTypeDefinitions } from "./family-data-model.ts";
import { cockpitRecordLabel } from "./family-cockpit.ts";
import { memoryData } from "./family-memory.ts";
import { textauszugVon } from "./document-library.ts";

export type FamilySearchDocument = { id: string; originalName: string; category?: string | null; documentDate?: string | null; notes?: string | null; textauszug?: string | null };

/** Deutscher Name der Art („Frist“, „Aufgabe“, „Tagebuch“) – nie die interne Kennung („task“). */
export function familyRecordKindLabel(record: FamilyRecordUnion) {
  if (memoryData(record)) return "Tagebuch-Eintrag";
  return recordTypeDefinitions[record.recordType]?.label || "Eintrag";
}

/** Text, in dem nach einem Datensatz gesucht wird: Titel, deutsche Art, Status, Quelle, Notiz und gespeicherte Angaben. */
export function familyRecordSearchText(record: FamilyRecordUnion) {
  return [record.id, cockpitRecordLabel(record), familyRecordKindLabel(record), record.status, record.source || "", record.notes || "", JSON.stringify(record.data)].join(" ");
}

/** Text, in dem nach einem Dokument gesucht wird: Name, Kategorie, Notiz und – falls gespeichert – der Textauszug. */
export function familyDocumentSearchText(document: FamilySearchDocument) {
  return ["Dokument Unterlage", document.originalName, document.category || "", document.notes || "", textauszugVon(document)].join(" ");
}
