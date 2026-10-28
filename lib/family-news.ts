import type { FamilyRecordUnion, FamilyRelation } from "./family-data-model";
import { memoryData } from "./family-memory.ts";
import { protectedFamilyLabel, protectedFamilySummary } from "./family-privacy.ts";

export const FAMILY_NEWS_VERSION = 1 as const;

export type FamilyNewsSection = "inbox" | "health" | "medical" | "benefits" | "work" | "assessment" | "correspondence" | "family" | "home" | "vehicles" | "purchases" | "reminders" | "memory" | "directory" | "versions";
export type FamilyNewsPeriod = "7days" | "30days" | "60days" | "currentMonth" | "previousMonth" | "custom";

export type FamilyNewsDocument = {
  id: string;
  originalName: string;
  category: string;
  documentDate: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  mimeType?: string | null;
  previewUrl?: string | null;
  notes?: string | null;
};

export type FamilyNewsVersion = {
  version: string;
  date: string;
  label: string;
  newItems: string[];
};

export type FamilyNewsItem = {
  id: string;
  occurredAt: string;
  dateLabel: string;
  area: string;
  title: string;
  summary: string;
  section: FamilyNewsSection;
  sourceType: "document" | "record" | "version";
  sourceId: string;
  sensitive: boolean;
  preview: { kind: "image" | "document" | "area" | "software"; url?: string | null; label: string };
  relevance: number;
};

export type FamilyNewsInput = {
  documents: FamilyNewsDocument[];
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  versions: FamilyNewsVersion[];
};

const sensitivePattern = /(gesund|arzt|ärzt|medizin|diagnos|krank|krankenkasse|rente|behörd|finanz|rechnung|bank|versicherung|persönlich|physio|pflege)/i;

function parseGermanDate(value: string) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!match) return null;
  return new Date(`${match[3]}-${match[2]}-${match[1]}T12:00:00Z`).toISOString();
}

function validIso(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function classifyDocument(document: FamilyNewsDocument) {
  const text = `${document.category} ${document.originalName} ${document.notes || ""}`;
  if (/(gesund|arzt|ärzt|medizin|diagnos|krank|krankenkasse|pflege|physio)/i.test(text)) return { area: "GESUNDHEIT", section: "health" as const, sensitive: true };
  if (/(rente|teilzeit|behörd|antrag)/i.test(text)) return { area: "ANTRÄGE", section: "assessment" as const, sensitive: true };
  if (/(fahrzeug|motorrad|auto|tüv|werkstatt|motoria|guzzi)/i.test(text)) return { area: "FAHRZEUGE", section: "vehicles" as const, sensitive: false };
  if (/(wohnung|haus|miete|vermieter|nebenkosten)/i.test(text)) return { area: "HAUS & WOHNUNG", section: "home" as const, sensitive: false };
  if (/(kauf|garantie|gerät|technik|reparatur)/i.test(text)) return { area: "KÄUFE & GARANTIEN", section: "purchases" as const, sensitive: false };
  if (/(rechnung|zahlung|vertrag|versicherung)/i.test(text)) return { area: "VERTRÄGE & KOSTEN", section: "family" as const, sensitive: true };
  return { area: "DOKUMENTE", section: "inbox" as const, sensitive: sensitivePattern.test(text) };
}

function recordTitle(record: FamilyRecordUnion) {
  const data = record.data as Record<string, unknown>;
  return String(data.title || data.name || data.displayName || data.fileName || data.originalName || record.id);
}

function linkedSection(record: FamilyRecordUnion, relations: FamilyRelation[]) {
  const links = relations.filter((relation) => relation.fromId === record.id || relation.toId === record.id);
  const linkedTypes = links.map((relation) => relation.fromId === record.id ? relation.toType : relation.fromType);
  if (linkedTypes.includes("case")) return "correspondence" as const;
  if (linkedTypes.includes("object")) return "directory" as const;
  if (linkedTypes.includes("document")) return "inbox" as const;
  if (linkedTypes.includes("person")) return "family" as const;
  return null;
}

function classifyRecord(record: FamilyRecordUnion, relations: FamilyRelation[]) {
  const memory = memoryData(record);
  if (memory) return { area: memory.lifeArea.toLocaleUpperCase("de"), section: memory.sensitive ? "health" as const : "memory" as const, sensitive: memory.sensitive };
  const title = recordTitle(record);
  const text = `${title} ${record.source || ""} ${record.notes || ""}`;
  const linked = linkedSection(record, relations);
  if (sensitivePattern.test(text)) return { area: "GESUNDHEIT & PERSÖNLICHES", section: linked || "health" as const, sensitive: true };
  switch (record.recordType) {
    case "deadline": return { area: "FRISTEN", section: linked || "reminders" as const, sensitive: false };
    case "task": return { area: "AUFGABEN", section: linked || "reminders" as const, sensitive: false };
    case "reminder": return { area: "ERINNERUNGEN", section: linked || "reminders" as const, sensitive: false };
    case "warranty": return { area: "KÄUFE & GARANTIEN", section: "purchases" as const, sensitive: false };
    case "contract": return { area: "VERTRÄGE", section: linked || "family" as const, sensitive: false };
    case "payment": return { area: "ZAHLUNGEN", section: linked || "family" as const, sensitive: true };
    case "object": return { area: "OBJEKTE", section: linked || "directory" as const, sensitive: false };
    case "case": return { area: "VORGÄNGE", section: "correspondence" as const, sensitive: sensitivePattern.test(text) };
    case "event": return { area: "EREIGNISSE", section: linked || "directory" as const, sensitive: sensitivePattern.test(text) };
    case "document": return { area: "DOKUMENTE", section: linked || "inbox" as const, sensitive: sensitivePattern.test(text) };
    default: return { area: "FAMILIE", section: "family" as const, sensitive: sensitivePattern.test(text) };
  }
}

function recordSummary(record: FamilyRecordUnion, completed: boolean) {
  const title = recordTitle(record);
  const memory = memoryData(record);
  if (memory) {
    if (completed) return `Der Erinnerungspunkt „${title}“ wurde abgeschlossen; der ursprüngliche Eintrag bleibt erhalten.`;
    return memory.openPoint ? `„${title}“ wurde im Erinnerungsprotokoll festgehalten; ein offener Punkt ist noch zu klären.` : `„${title}“ wurde als neues Ereignis im Erinnerungsprotokoll festgehalten.`;
  }
  if (completed) return `„${title}“ wurde als erledigt abgeschlossen; die vorhandenen Verknüpfungen bleiben erhalten.`;
  const descriptions: Record<FamilyRecordUnion["recordType"], string> = {
    person: "Die Person wurde in der Familienakte angelegt.",
    organisation: "Die Organisation oder Kontaktstelle wurde in der Familienakte angelegt.",
    object: `Das Objekt „${title}“ wurde neu aufgenommen.`,
    case: `Der Vorgang „${title}“ wurde neu angelegt.`,
    document: `Das Dokument „${title}“ wurde neu registriert.`,
    deadline: `Die Frist „${title}“ wurde bestätigt angelegt.`,
    task: `Die Aufgabe „${title}“ wurde bestätigt angelegt.`,
    reminder: `Die Erinnerung „${title}“ wurde mit ihrer Quelle verknüpft.`,
    event: `Das Ereignis „${title}“ wurde neu aufgenommen.`,
    payment: `Die Zahlung oder Kostenangabe „${title}“ wurde neu aufgenommen.`,
    contract: `Der Vertrag „${title}“ wurde neu aufgenommen.`,
    warranty: `Die Garantie „${title}“ wurde neu aufgenommen.`,
  };
  return descriptions[record.recordType];
}

export function buildFamilyNewsItems(input: FamilyNewsInput): FamilyNewsItem[] {
  const items: FamilyNewsItem[] = [];
  const documentIds = new Set(input.documents.map((document) => document.id));
  for (const document of input.documents) {
    const createdAt = validIso(document.createdAt);
    if (!createdAt) continue;
    const classification = classifyDocument(document);
    const imageAvailable = !classification.sensitive && !!document.previewUrl && !!document.mimeType?.startsWith("image/");
    items.push({
      id: `document-created-${document.id}`,
      occurredAt: createdAt,
      dateLabel: formatDate(createdAt),
      area: classification.area,
      title: protectedFamilyLabel({ label: document.originalName, category: document.category, notes: document.notes, sensitive: classification.sensitive }),
      summary: protectedFamilySummary({ text: `Das Dokument wurde neu in „${document.category}“ aufgenommen und bleibt mit seinem gespeicherten Bearbeitungsstand verknüpft.`, sensitive: classification.sensitive }),
      section: classification.section,
      sourceType: "document",
      sourceId: document.id,
      sensitive: classification.sensitive,
      preview: imageAvailable ? { kind: "image", url: document.previewUrl, label: "Dokumentvorschau" } : { kind: classification.sensitive ? "area" : "document", label: classification.sensitive ? "Datenschutzgerechtes Bereichssymbol" : "Dokumentsymbol" },
      relevance: 4,
    });
    const updatedAt = validIso(document.updatedAt);
    if (document.status === "eingearbeitet" && updatedAt && updatedAt !== createdAt) items.push({
      id: `document-integrated-${document.id}`,
      occurredAt: updatedAt,
      dateLabel: formatDate(updatedAt),
      area: classification.area,
      title: protectedFamilyLabel({ label: document.originalName, category: document.category, notes: document.notes, sensitive: classification.sensitive }),
      summary: protectedFamilySummary({ text: "Das Dokument wurde geprüft und in die Familienakte eingearbeitet.", sensitive: classification.sensitive }),
      section: classification.section,
      sourceType: "document",
      sourceId: document.id,
      sensitive: classification.sensitive,
      preview: { kind: classification.sensitive ? "area" : "document", label: classification.sensitive ? "Datenschutzgerechtes Bereichssymbol" : "Dokumentsymbol" },
      relevance: 5,
    });
  }
  for (const record of input.records) {
    if (record.recordType === "document" && documentIds.has(record.id)) continue;
    if (["person", "organisation"].includes(record.recordType)) continue;
    const occurredAt = validIso(record.createdAt);
    if (!occurredAt) continue;
    const classification = classifyRecord(record, input.relations);
    const title = protectedFamilyLabel({ label: recordTitle(record), notes: record.notes, sensitive: classification.sensitive });
    items.push({ id: `record-created-${record.id}`, occurredAt, dateLabel: formatDate(occurredAt), area: classification.area, title, summary: protectedFamilySummary({ text: recordSummary(record, false), sensitive: classification.sensitive }), section: classification.section, sourceType: "record", sourceId: record.id, sensitive: classification.sensitive, preview: { kind: "area", label: "Bereichssymbol" }, relevance: 5 });
    const updatedAt = validIso(record.updatedAt);
    if (record.status === "erledigt" && updatedAt && updatedAt !== occurredAt) items.push({ id: `record-completed-${record.id}`, occurredAt: updatedAt, dateLabel: formatDate(updatedAt), area: classification.area, title, summary: protectedFamilySummary({ text: recordSummary(record, true), sensitive: classification.sensitive }), section: classification.section, sourceType: "record", sourceId: record.id, sensitive: classification.sensitive, preview: { kind: "area", label: "Bereichssymbol" }, relevance: 6 });
  }
  for (const version of input.versions) {
    const occurredAt = parseGermanDate(version.date);
    if (!occurredAt) continue;
    items.push({ id: `version-${version.version}`, occurredAt, dateLabel: formatDate(occurredAt), area: "FAMILIENAKTE", title: `Version ${version.version} veröffentlicht`, summary: version.newItems[0] ? `${version.label}: ${version.newItems[0]}.` : `${version.label} wurde veröffentlicht.`, section: "versions", sourceType: "version", sourceId: version.version, sensitive: false, preview: { kind: "software", label: "Familienakten-Symbol" }, relevance: 1 });
  }
  return items.sort((a, b) => {
    const dayOrder = b.occurredAt.slice(0, 10).localeCompare(a.occurredAt.slice(0, 10));
    return dayOrder || b.relevance - a.relevance || new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime() || a.title.localeCompare(b.title, "de");
  });
}

export function familyNewsRange(period: FamilyNewsPeriod, now = new Date(), customStart?: string, customEnd?: string) {
  const end = new Date(now);
  let start = new Date(now);
  if (period === "7days") start.setDate(start.getDate() - 7);
  if (period === "30days") start.setDate(start.getDate() - 30);
  if (period === "60days") start.setDate(start.getDate() - 60);
  if (period === "currentMonth") start = new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "previousMonth") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end.setTime(new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime());
  }
  if (period === "custom") {
    start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(0);
    end.setTime(customEnd ? new Date(`${customEnd}T23:59:59.999`).getTime() : now.getTime());
  }
  return { start, end };
}

export function filterFamilyNews(items: FamilyNewsItem[], period: FamilyNewsPeriod, now = new Date(), customStart?: string, customEnd?: string) {
  const { start, end } = familyNewsRange(period, now, customStart, customEnd);
  return items.filter((item) => { const time = new Date(item.occurredAt).getTime(); return time >= start.getTime() && time <= end.getTime(); });
}

export function runFamilyNewsSelfTest() {
  const input: FamilyNewsInput = {
    documents: [{ id: "DOC-TEST", originalName: "TÜV-Bericht.pdf", category: "Fahrzeuge", documentDate: "2026-10-06", status: "eingearbeitet", createdAt: "2026-10-06T09:00:00Z", updatedAt: "2026-10-07T10:00:00Z", mimeType: "application/pdf" }, { id: "DOC-HEALTH", originalName: "Arztbericht.pdf", category: "Gesundheit", documentDate: "2026-10-05", status: "geprüft", createdAt: "2026-10-05T09:00:00Z", mimeType: "application/pdf", previewUrl: "/private-preview" }],
    records: [{ id: "FRIST-000001", recordType: "deadline", createdAt: "2026-10-07T11:00:00Z", updatedAt: "2026-10-07T11:00:00Z", status: "offen", source: "DOC-TEST", notes: null, data: { title: "Nächste HU", dueAt: "2028-10-01" } }],
    relations: [{ id: "REL-1", fromType: "deadline", fromId: "FRIST-000001", toType: "document", toId: "DOC-TEST", relationType: "basiert auf", createdAt: "2026-10-07T11:00:00Z", source: "Test", notes: null }],
    versions: [{ version: "2.18.0", date: "07.10.2026", label: "Neuigkeiten", newItems: ["Monatsübersicht ergänzt"] }],
  };
  const before = JSON.stringify(input);
  const items = buildFamilyNewsItems(input);
  const visible = filterFamilyNews(items, "60days", new Date("2026-10-07T18:00:00Z"));
  const health = items.find((item) => item.sourceId === "DOC-HEALTH");
  const passed = visible.length === 5
    && items[0]?.sourceId === "FRIST-000001"
    && items.some((item) => item.id === "document-integrated-DOC-TEST")
    && health?.sensitive === true
    && health.preview.url === undefined
    && items.every((item) => !!item.dateLabel && !!item.area && !!item.title && !!item.summary && !!item.preview.label)
    && filterFamilyNews(items, "7days", new Date("2026-12-31T18:00:00Z")).length === 0
    && JSON.stringify(input) === before;
  return { passed, summary: passed ? "Gemeinsame Datenquellen, 60-Tage-Filter, Sortierung, Verlinkung und datenschutzgerechte Vorschau praktisch geprüft." : "Der Neuigkeiten-Selbsttest ist fehlgeschlagen." };
}
