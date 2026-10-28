import type { FamilyRecordType, FamilyRecordUnion, FamilyRelation } from "./family-data-model.ts";
import type { FamilyCockpitDocument } from "./family-cockpit.ts";
import { cockpitRecordLabel } from "./family-cockpit.ts";
import { interpretFamilySearchQuery, normalizeFamilySearch, scoreFamilySearchText } from "./family-search.ts";
import { protectedFamilyLabel } from "./family-privacy.ts";
import { readIntakeMetadata } from "./document-intake-metadata.ts";

export const DOCUMENT_LIBRARY_VERSION = 1 as const;

export type DocumentLibrarySort = "newest" | "oldest" | "title" | "area" | "updated";
export type DocumentLibrarySection = "documents" | "health" | "family" | "cockpit" | "reminders" | "purchases";

export type DocumentLibraryReference = {
  id: string;
  type: FamilyRecordType;
  label: string;
  section: DocumentLibrarySection;
  sensitive: boolean;
};

export type DocumentLibraryItem = {
  id: string;
  title: string;
  area: string;
  documentType: string;
  date: string | null;
  updatedAt: string;
  status: string;
  description: string;
  sensitive: boolean;
  protectedHealth: boolean;
  previewUrl: string | null;
  searchable: string;
  references: DocumentLibraryReference[];
  source: FamilyCockpitDocument;
};

export type DocumentLibraryFilters = {
  query?: string;
  area?: string;
  documentType?: string;
  startDate?: string;
  endDate?: string;
  sort?: DocumentLibrarySort;
};

const healthPattern = /(gesund|arzt|ärzt|medizin|diagnos|krank|krankenkasse|pflege|physio|heuschnupfen|erkält|rücken|heuschnupfen|zahn|klinik|labor)/i;
const sensitivePattern = /(gesund|arzt|ärzt|medizin|diagnos|krank|krankenkasse|rente|behörd|finanz|rechnung|bank|versicherung|persönlich|physio|pflege|steuer|gehalt)/i;

function validDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function textOf(record: FamilyRecordUnion) {
  return `${cockpitRecordLabel(record)} ${record.source || ""} ${record.notes || ""} ${JSON.stringify(record.data)}`;
}

function areaFor(document: FamilyCockpitDocument) {
  const selected = readIntakeMetadata(document.notes).lifeArea;
  if (selected) return selected;
  const text = `${document.category} ${document.originalName} ${document.notes || ""}`;
  if (healthPattern.test(text)) return "Gesundheit";
  if (/(motorrad|motoria|guzzi)/i.test(text)) return "Motorrad";
  if (/(fahrzeug|auto|tüv|werkstatt|wartung)/i.test(text)) return "Fahrzeuge";
  if (/(wohnung|haus|miete|vermieter|nebenkosten|garten)/i.test(text)) return "Haus & Wohnung";
  if (/(versicherung|police)/i.test(text)) return "Versicherungen";
  if (/(behörd|bescheid|amt|antrag)/i.test(text)) return "Behörden";
  if (/(vertrag)/i.test(text)) return "Verträge";
  if (/(rechnung|garantie|kauf|beleg)/i.test(text)) return "Rechnungen & Garantien";
  if (/(technik|gerät|computer|telefon)/i.test(text)) return "Technik & Geräte";
  if (/(arbeit|arbeitgeber|rente|rentenversicherung|sozial|teilzeit)/i.test(text)) return "Arbeit, Rente & Sozialversicherung";
  if (/(finanz|bank|zahlung|kosten)/i.test(text)) return "Finanzen";
  if (/(familie|person|vollmacht|vorsorge)/i.test(text)) return "Familie & persönliche Unterlagen";
  return document.category?.trim() || "Weitere Dokumente";
}

function typeFor(document: FamilyCockpitDocument) {
  const selected = readIntakeMetadata(document.notes).documentType;
  if (selected) return selected;
  const mime = document.mimeType || "";
  const extension = document.originalName.split(".").pop()?.toLocaleLowerCase("de") || "";
  if (mime.includes("pdf") || extension === "pdf") return "PDF";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(extension)) return "Bild";
  if (mime.includes("word") || extension === "doc" || extension === "docx") return "Word";
  if (mime.includes("sheet") || mime.includes("excel") || ["xls", "xlsx", "csv"].includes(extension)) return "Tabelle";
  if (extension === "txt" || mime.startsWith("text/")) return "Text";
  return document.category?.trim() || "Dokument";
}

function sectionForRecord(record: FamilyRecordUnion, sensitive: boolean): DocumentLibrarySection {
  if (sensitive) return "health";
  if (["deadline", "task", "reminder"].includes(record.recordType)) return "reminders";
  if (["case", "object", "organisation", "payment"].includes(record.recordType)) return "cockpit";
  if (["contract", "warranty"].includes(record.recordType)) return "purchases";
  if (record.recordType === "person") return "family";
  return "documents";
}

function documentAliases(document: FamilyCockpitDocument, records: FamilyRecordUnion[]) {
  const normalizedName = normalizeFamilySearch(document.originalName);
  const aliases = new Set([document.id]);
  for (const record of records) {
    if (record.recordType !== "document") continue;
    const data = record.data as Record<string, unknown>;
    const recordName = String(data.originalName || data.fileName || "");
    if (record.id === document.id || (recordName && normalizeFamilySearch(recordName) === normalizedName)) aliases.add(record.id);
  }
  return aliases;
}

function referencesFor(document: FamilyCockpitDocument, records: FamilyRecordUnion[], relations: FamilyRelation[]) {
  const aliases = documentAliases(document, records);
  const relatedIds = new Set<string>();
  for (const relation of relations) {
    if (aliases.has(relation.fromId)) relatedIds.add(relation.toId);
    if (aliases.has(relation.toId)) relatedIds.add(relation.fromId);
  }
  return records
    .filter((record) => relatedIds.has(record.id) && record.recordType !== "document")
    .map((record): DocumentLibraryReference => {
      const sensitive = sensitivePattern.test(textOf(record));
      return {
        id: record.id,
        type: record.recordType,
        label: sensitive ? "Geschützter Eintrag" : cockpitRecordLabel(record),
        section: sectionForRecord(record, sensitive),
        sensitive,
      };
    })
    .sort((a, b) => a.type.localeCompare(b.type, "de") || a.label.localeCompare(b.label, "de"));
}

function shorten(value: string, max = 150) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function buildDocumentLibraryItems(documents: FamilyCockpitDocument[], records: FamilyRecordUnion[], relations: FamilyRelation[]): DocumentLibraryItem[] {
  return documents.map((document) => {
    const text = `${document.category} ${document.originalName} ${document.notes || ""}`;
    const protectedHealth = healthPattern.test(text);
    const sensitive = sensitivePattern.test(text);
    const references = referencesFor(document, records, relations);
    const area = areaFor(document);
    const documentType = typeFor(document);
    const date = document.documentDate || null;
    const updatedAt = document.updatedAt || document.createdAt || document.documentDate || "";
    const description = protectedHealth
      ? "Geschützte Gesundheitsunterlage. Einzelheiten sind nur im Gesundheitsbereich sichtbar."
      : shorten(document.notes || `Das Dokument ist im Bereich „${area}“ gespeichert und mit seinem ursprünglichen Datensatz verknüpft.`);
    const searchable = [
      document.id, document.originalName, document.category, documentType, date || "", document.status,
      document.notes || "", document.storageType || "", document.storedPath || "", document.relativePath || "", document.oneDrivePath || "",
      ...references.flatMap((reference) => [reference.id, reference.type, reference.label]),
    ].join(" ");
    return {
      id: document.id,
      title: protectedFamilyLabel({ label: document.originalName, category: document.category, notes: document.notes, sensitive: protectedHealth }),
      area,
      documentType,
      date,
      updatedAt,
      status: document.status,
      description,
      sensitive,
      protectedHealth,
      previewUrl: !sensitive && document.previewUrl ? document.previewUrl : null,
      searchable,
      references,
      source: document,
    };
  });
}

export function filterDocumentLibraryItems(items: DocumentLibraryItem[], filters: DocumentLibraryFilters = {}) {
  const interpretation = interpretFamilySearchQuery(filters.query || "");
  const query = normalizeFamilySearch(filters.query || "");
  const start = validDate(filters.startDate || null);
  const end = validDate(filters.endDate || null);
  const filtered = items.filter((item) => {
    if (filters.area && item.area !== filters.area) return false;
    if (filters.documentType && item.documentType !== filters.documentType) return false;
    const date = validDate(item.date || item.updatedAt);
    if (start && (!date || date < start)) return false;
    if (end) {
      const endOfDay = new Date(end); endOfDay.setHours(23, 59, 59, 999);
      if (!date || date > endOfDay) return false;
    }
    if (query && scoreFamilySearchText(item.searchable, interpretation) === 0 && !normalizeFamilySearch(item.searchable).includes(query)) return false;
    return true;
  });
  const time = (item: DocumentLibraryItem, updated = false) => validDate(updated ? item.updatedAt : item.date || item.updatedAt)?.getTime() || 0;
  const sort = filters.sort || "newest";
  return [...filtered].sort((a, b) => {
    if (sort === "oldest") return time(a) - time(b) || a.title.localeCompare(b.title, "de");
    if (sort === "title") return a.title.localeCompare(b.title, "de");
    if (sort === "area") return a.area.localeCompare(b.area, "de") || time(b) - time(a);
    if (sort === "updated") return time(b, true) - time(a, true) || a.title.localeCompare(b.title, "de");
    return time(b) - time(a) || a.title.localeCompare(b.title, "de");
  });
}

export function runDocumentLibrarySelfTests() {
  const documents: FamilyCockpitDocument[] = [
    { id: "DOC-A", originalName: "TÜV Motoria Strada.pdf", category: "Motorrad", documentDate: "2026-10-05", status: "eingearbeitet", createdAt: "2026-10-05T12:00:00Z", mimeType: "application/pdf", notes: "Nächste HU ist mit dem Vorgang verknüpft." },
    { id: "DOC-B", originalName: "Zahnmedizin Arztbrief.pdf", category: "Gesundheit", documentDate: "2026-09-01", status: "geprüft", createdAt: "2026-09-01T12:00:00Z", mimeType: "application/pdf", notes: "Vertrauliche Diagnose" },
    { id: "DOC-C", originalName: "Stromrechnung.xlsx", category: "Haus & Wohnung", documentDate: "2025-12-01", status: "eingearbeitet", createdAt: "2025-12-01T12:00:00Z", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", notes: "Rechnungsnummer RG-77" },
  ];
  const records: FamilyRecordUnion[] = [
    { id: "VORG-000001", recordType: "case", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-10-05T00:00:00Z", status: "offen", source: "Test", notes: null, data: { title: "Hauptuntersuchung Motoria" } },
    { id: "OBJ-000001", recordType: "object", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-10-05T00:00:00Z", status: "aktiv", source: "Test", notes: null, data: { name: "Motoria Strada", objectType: "Motorrad" } },
  ];
  const relations: FamilyRelation[] = [
    { id: "REL-1", fromType: "document", fromId: "DOC-A", toType: "case", toId: "VORG-000001", relationType: "gehört zu", createdAt: "2026-10-05T00:00:00Z", source: "Test", notes: null },
    { id: "REL-2", fromType: "document", fromId: "DOC-A", toType: "object", toId: "OBJ-000001", relationType: "betrifft", createdAt: "2026-10-05T00:00:00Z", source: "Test", notes: null },
  ];
  const snapshot = JSON.stringify({ documents, records, relations });
  const items = buildDocumentLibraryItems(documents, records, relations);
  const newest = filterDocumentLibraryItems(items, { sort: "newest" });
  const searched = filterDocumentLibraryItems(items, { query: "Stromrechnung.xlsx" });
  const health = items.find((item) => item.id === "DOC-B");
  const linked = items.find((item) => item.id === "DOC-A");
  const checks = {
    sameCount: items.length === documents.length,
    uniqueIds: new Set(items.map((item) => item.id)).size === documents.length,
    newestFirst: newest[0]?.id === "DOC-A",
    searchable: searched.length === 1 && searched[0]?.id === "DOC-C",
    healthProtected: health?.protectedHealth === true && health.previewUrl === null && health.description.includes("Geschützte Gesundheitsunterlage"),
    caseLinked: !!linked?.references.some((item) => item.id === "VORG-000001"),
    objectLinked: !!linked?.references.some((item) => item.id === "OBJ-000001"),
    unchanged: snapshot === JSON.stringify({ documents, records, relations }),
  };
  const failed = Object.entries(checks).filter(([, value]) => !value).map(([name]) => name);
  const passed = failed.length === 0;
  return {
    passed,
    summary: passed
      ? "Gemeinsame Dokumentdaten, Sortierung, Suche, Datenschutz, Verknüpfungen und unveränderter Ausgangsbestand wurden praktisch geprüft."
      : `Mindestens ein praktischer Bibliothekstest ist fehlgeschlagen: ${failed.join(", ")}.`,
  };
}
