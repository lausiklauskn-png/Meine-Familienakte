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
// C (09.11.): Stimmung eines Tagebuch-Eintrags als Wort, damit „gute Tage“ oder „Stimmung schlecht“ ihn findet.
const STIMMUNG_WORT: Record<number, string> = { 1: "Stimmung schlecht schlechter Tag", 2: "Stimmung eher schlecht", 3: "Stimmung mittel", 4: "Stimmung gut guter Tag gute Tage", 5: "Stimmung sehr gut sehr guter Tag gute Tage" };
export function familyRecordSearchText(record: FamilyRecordUnion) {
  const stimmung = record.recordType === "event" ? STIMMUNG_WORT[Number((record.data as { stimmung?: number }).stimmung)] || "" : "";
  return [record.id, cockpitRecordLabel(record), familyRecordKindLabel(record), record.status, record.source || "", record.notes || "", JSON.stringify(record.data), stimmung].join(" ");
}

/** Text, in dem nach einem Dokument gesucht wird: Name, Kategorie, Notiz und – falls gespeichert – der Textauszug. */
export function familyDocumentSearchText(document: FamilySearchDocument) {
  return ["Dokument Unterlage", document.originalName, document.category || "", document.notes || "", textauszugVon(document)].join(" ");
}
