import type { FamilyRecordType, FamilyRecordUnion, FamilyRelation } from "./family-data-model.ts";
import { buildMemoryOpenPoints, isMemoryRecord, memoryData } from "./family-memory.ts";
import { connectedFamilyIds } from "./family-relations.ts";

export const FAMILY_CONTEXT_LINKING_VERSION = 1 as const;

export type ContextLinkConfidence = "sicher" | "wahrscheinlich" | "unklar";
export type ContextSourceType = "document" | "event";

export type ContextDocument = {
  id: string;
  originalName: string;
  category?: string;
  documentDate?: string | null;
  addedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  notes?: string | null;
};

export type ContextLinkDecision = {
  id: string;
  sourceType: ContextSourceType;
  sourceId: string;
  caseId: string;
  decision: "nicht_verknuepfen";
  contextHash: string;
  decidedAt: string;
};

export type ContextLinkSuggestion = {
  id: string;
  sourceType: ContextSourceType;
  sourceId: string;
  sourceLabel: string;
  caseId: string;
  caseLabel: string;
  confidence: ContextLinkConfidence;
  score: number;
  reasons: string[];
  contextHash: string;
  relatedMemoryIds: string[];
  relatedDocumentIds: string[];
  openPointEventIds: string[];
  sensitive: boolean;
  requiresConfirmation: true;
};

export type CaseTimelineItem = {
  id: string;
  sourceId: string;
  type: "Memory" | "Dokument" | "Foto" | "Termin" | "Aufgabe" | "Frist";
  title: string;
  at: string;
  recordType: FamilyRecordType | "document";
  sensitive: boolean;
};

type ContextInput = {
  documents: ContextDocument[];
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  decisions?: ContextLinkDecision[];
};

type SourceDescriptor = {
  sourceType: ContextSourceType;
  sourceId: string;
  label: string;
  text: string;
  date: string;
  sensitive: boolean;
};

const normalize = (value: string) => value
  .toLocaleLowerCase("de")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/ß/g, "ss")
  .replace(/[^a-z0-9+]+/g, " ")
  .trim();

const stopWords = new Set(["aber", "dann", "dass", "diese", "dieser", "einem", "einen", "eine", "heute", "jetzt", "mein", "meine", "noch", "oder", "seine", "sowie", "ueber", "unter", "wurde", "wird"]);
const wordTokens = (value: string) => [...new Set(normalize(value).split(" ").filter((word) => word.length >= 4 && !stopWords.has(word)))];
const openPointKeyTerms = new Set(["rechnung", "termin", "antwort", "lieferung", "zahlung", "reparatur", "garantie", "vertrag", "unterlagen", "bescheid", "rueckmeldung", "ruckmeldung"]);

export function matchingOpenPointEventIds(sourceText: string, openPoints: Array<{ eventId: string; question: string; reason: string }>, linkedIds: Set<string>) {
  const sourceWords = wordTokens(sourceText);
  return openPoints.filter((point) => {
    const pointWords = wordTokens(`${point.question} ${point.reason}`);
    const shared = pointWords.filter((word) => sourceWords.includes(word));
    const keyMatch = shared.some((word) => openPointKeyTerms.has(word));
    if (linkedIds.has(point.eventId)) return keyMatch || shared.length >= 2;
    return keyMatch && shared.length >= 1;
  }).map((point) => point.eventId);
}
const phoneTokens = (value: string) => [...new Set((value.match(/(?:\+49|0)[\d\s()\-/]{7,}/g) || []).map((item) => item.replace(/\D/g, "")).filter((item) => item.length >= 8))];
const identifierTokens = (value: string) => [...new Set((value.match(/\b[A-ZÄÖÜ]{1,8}[-/]?[A-Z0-9]{3,}(?:[-/][A-Z0-9]+)*\b/gi) || []).map((item) => normalize(item).replaceAll(" ", "")).filter((item) => item.length >= 5))];
const dateValue = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
};

function recordLabel(record: FamilyRecordUnion) {
  const data = record.data as Record<string, unknown>;
  const value = data.title || data.name || data.displayName || data.originalName || data.fileName;
  return typeof value === "string" && value.trim() ? value.trim() : record.id;
}

function recordText(record: FamilyRecordUnion) {
  const data = record.data as Record<string, unknown>;
  return [recordLabel(record), record.notes || "", record.source || "", ...Object.values(data).filter((value): value is string => typeof value === "string")].join(" ");
}

function recordDate(record: FamilyRecordUnion) {
  const data = record.data as Record<string, unknown>;
  const value = data.eventAt || data.dueAt || data.remindAt || record.updatedAt || record.createdAt;
  return dateValue(typeof value === "string" ? value : record.updatedAt);
}

function documentText(document: ContextDocument) {
  return [document.originalName, document.category || "", document.notes || ""].join(" ");
}

function documentDate(document: ContextDocument) {
  return dateValue(document.documentDate || document.updatedAt || document.addedAt || document.createdAt);
}

function isSensitiveText(value: string) {
  return /(gesund|arzt|klinik|diagnos|krank|pflege|therap|physio|erkält|heuschnupfen|heuschnupfen|krankenkasse|leistung|rente)/i.test(value);
}

function relatedIds(id: string, relations: FamilyRelation[]) {
  return relations.flatMap((relation) => {
    if (relation.fromId === id) return [relation.toId];
    if (relation.toId === id) return [relation.fromId];
    return [];
  });
}

function isDirectlyLinkedToCase(sourceId: string, caseId: string, relations: FamilyRelation[]) {
  return relations.some((relation) => (relation.fromId === sourceId && relation.toId === caseId) || (relation.toId === sourceId && relation.fromId === caseId));
}

function caseContext(caseRecord: FamilyRecordUnion, input: ContextInput) {
  const direct = new Set(relatedIds(caseRecord.id, input.relations));
  const records = input.records.filter((record) => direct.has(record.id));
  const documents = input.documents.filter((document) => direct.has(document.id));
  const text = [recordText(caseRecord), ...records.map(recordText), ...documents.map(documentText)].join(" ");
  const dates = [recordDate(caseRecord), ...records.map(recordDate), ...documents.map(documentDate)].filter(Boolean);
  const types = new Map<FamilyRecordType, string[]>();
  for (const record of records) types.set(record.recordType, [...(types.get(record.recordType) || []), record.id]);
  return { text, dates, records, documents, types };
}

function contextHash(source: SourceDescriptor, caseId: string, caseText: string) {
  const compact = normalize(`${source.text}|${source.date}|${caseId}|${caseText}`).slice(0, 480);
  let hash = 2166136261;
  for (let index = 0; index < compact.length; index += 1) {
    hash ^= compact.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `ctx-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function scoreAgainstCase(source: SourceDescriptor, caseRecord: FamilyRecordUnion, input: ContextInput) {
  const context = caseContext(caseRecord, input);
  const sourceNormalized = normalize(source.text);
  const caseNormalized = normalize(context.text);
  const reasons: string[] = [];
  let score = 0;
  let strongReasons = 0;

  const caseName = normalize(recordLabel(caseRecord));
  if (caseName.length >= 5 && sourceNormalized.includes(caseName)) {
    score += 70; strongReasons += 1; reasons.push("passende Vorgangsbezeichnung");
  }

  const sourcePhones = phoneTokens(source.text);
  if (sourcePhones.some((value) => phoneTokens(context.text).includes(value))) {
    score += 55; strongReasons += 1; reasons.push("gleiche Telefonnummer");
  }

  const sourceIdentifiers = identifierTokens(source.text);
  if (sourceIdentifiers.some((value) => identifierTokens(context.text).includes(value))) {
    score += 75; strongReasons += 1; reasons.push("gleiche Kennung oder Nummer");
  }

  for (const [type, label, points] of [["organisation", "gleiche Organisation", 48], ["object", "gleiches Objekt", 48], ["person", "gleiche Person", 28]] as const) {
    const matching = context.records.filter((record) => record.recordType === type).some((record) => {
      const candidate = normalize(recordLabel(record));
      return candidate.length >= 4 && sourceNormalized.includes(candidate);
    });
    if (matching) { score += points; strongReasons += type === "person" ? 0 : 1; reasons.push(label); }
  }

  const sourceWords = wordTokens(source.text);
  const overlap = sourceWords.filter((word) => caseNormalized.includes(word));
  if (overlap.length >= 3) { score += 42; reasons.push("mehrere passende Begriffe"); }
  else if (overlap.length === 2) { score += 28; reasons.push("zwei passende Begriffe"); }
  else if (overlap.length === 1) { score += 10; reasons.push("ein passender Begriff"); }

  const sourceTime = source.date ? new Date(source.date).getTime() : Number.NaN;
  const minimumDays = context.dates.reduce((minimum, value) => {
    const delta = Math.abs(new Date(value).getTime() - sourceTime) / 86400000;
    return Number.isNaN(delta) ? minimum : Math.min(minimum, delta);
  }, Number.POSITIVE_INFINITY);
  if (minimumDays <= 7) { score += 12; reasons.push("zeitliche Nähe"); }
  else if (minimumDays <= 30) { score += 6; reasons.push("naher Zeitraum"); }

  const nonTimeReasons = reasons.filter((reason) => !["zeitliche Nähe", "naher Zeitraum"].includes(reason));
  if (!nonTimeReasons.length) score = 0;
  const confidence: ContextLinkConfidence = score >= 100 && strongReasons >= 2 ? "sicher" : score >= 55 ? "wahrscheinlich" : "unklar";
  return { score, confidence, reasons, context };
}

function sourceFromRecord(record: FamilyRecordUnion): SourceDescriptor | null {
  if (!isMemoryRecord(record)) return null;
  const data = memoryData(record)!;
  return {
    sourceType: "event",
    sourceId: record.id,
    label: data.title,
    text: [data.title, data.originalText, data.followUpAnswer || "", data.lifeArea, data.eventType, ...(data.tags || [])].join(" "),
    date: dateValue(data.eventAt),
    sensitive: data.sensitive,
  };
}

function sourceFromDocument(document: ContextDocument): SourceDescriptor {
  const text = documentText(document);
  return { sourceType: "document", sourceId: document.id, label: document.originalName, text, date: documentDate(document), sensitive: isSensitiveText(text) };
}

function proposalsForSource(source: SourceDescriptor, input: ContextInput) {
  const cases = input.records.filter((record) => record.recordType === "case");
  const openPoints = buildMemoryOpenPoints(input.records);
  const scored = cases
    .filter((record) => !isDirectlyLinkedToCase(source.sourceId, record.id, input.relations))
    .map((record) => ({ record, ...scoreAgainstCase(source, record, input) }))
    .filter((item) => item.score >= 24)
    .sort((a, b) => b.score - a.score || recordLabel(a.record).localeCompare(recordLabel(b.record), "de"));

  return scored.slice(0, 4).flatMap((item, index) => {
    const contextHashValue = contextHash(source, item.record.id, item.context.text);
    const rejected = (input.decisions || []).some((decision) => decision.sourceType === source.sourceType && decision.sourceId === source.sourceId && decision.caseId === item.record.id && decision.contextHash === contextHashValue);
    if (rejected) return [];
    const closeCompetitor = index === 0 && scored[1] && Math.abs(item.score - scored[1].score) <= 10;
    const confidence: ContextLinkConfidence = closeCompetitor ? "unklar" : item.confidence;
    const linkedIds = new Set(relatedIds(item.record.id, input.relations));
    const relatedMemoryIds = input.records.filter((record) => linkedIds.has(record.id) && isMemoryRecord(record)).map((record) => record.id);
    const relatedDocumentIds = input.documents.filter((document) => linkedIds.has(document.id)).map((document) => document.id);
    const openPointEventIds = matchingOpenPointEventIds(source.text, openPoints, linkedIds);
    return [{
      id: `${source.sourceType}:${source.sourceId}:${item.record.id}`,
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      sourceLabel: source.label,
      caseId: item.record.id,
      caseLabel: recordLabel(item.record),
      confidence,
      score: item.score,
      reasons: item.reasons,
      contextHash: contextHashValue,
      relatedMemoryIds,
      relatedDocumentIds,
      openPointEventIds,
      sensitive: source.sensitive || isSensitiveText(item.context.text),
      requiresConfirmation: true as const,
    }];
  });
}

export function buildContextLinkSuggestions(input: ContextInput): ContextLinkSuggestion[] {
  const sources: SourceDescriptor[] = [
    ...input.documents.map(sourceFromDocument),
    ...input.records.map(sourceFromRecord).filter((source): source is SourceDescriptor => !!source),
  ];
  return sources.flatMap((source) => proposalsForSource(source, input)).sort((a, b) => b.score - a.score || a.sourceLabel.localeCompare(b.sourceLabel, "de"));
}

export function suggestIncomingDocumentContext(input: ContextInput & { fileName: string; notes?: string; date?: string }) {
  const source: SourceDescriptor = { sourceType: "document", sourceId: `incoming-document:${normalize(input.fileName)}`, label: input.fileName, text: `${input.fileName} ${input.notes || ""}`, date: dateValue(input.date) || new Date().toISOString(), sensitive: isSensitiveText(`${input.fileName} ${input.notes || ""}`) };
  return proposalsForSource(source, input);
}

export function suggestIncomingMemoryContext(input: ContextInput & { text: string; eventAt?: string }) {
  const source: SourceDescriptor = { sourceType: "event", sourceId: `incoming-event:${normalize(input.text).slice(0, 80)}`, label: input.text.slice(0, 90) || "Neue Erinnerung", text: input.text, date: dateValue(input.eventAt) || new Date().toISOString(), sensitive: isSensitiveText(input.text) };
  return proposalsForSource(source, input);
}

export function buildCaseTimeline(caseId: string, input: ContextInput): CaseTimelineItem[] {
  const linked = connectedFamilyIds(caseId, input.relations, 3);
  const records = input.records.filter((record) => linked.has(record.id) && ["event", "task", "deadline"].includes(record.recordType));
  const documents = input.documents.filter((document) => linked.has(document.id));
  const recordItems = records.flatMap<CaseTimelineItem>((record) => {
    const memory = memoryData(record);
    const type: CaseTimelineItem["type"] = record.recordType === "task" ? "Aufgabe" : record.recordType === "deadline" ? "Frist" : memory?.eventType === "Termin" ? "Termin" : "Memory";
    const sensitive = memory?.sensitive || isSensitiveText(recordText(record));
    const base: CaseTimelineItem = { id: record.id, sourceId: record.id, type, title: sensitive ? "Geschützter Gesundheitseintrag" : recordLabel(record), at: recordDate(record), recordType: record.recordType, sensitive };
    const media = memory?.media.map((item) => ({ id: `${record.id}:${item.id}`, sourceId: record.id, type: "Foto" as const, title: sensitive ? "Geschütztes Medium" : item.name, at: dateValue(memory.eventAt), recordType: "event" as const, sensitive })) || [];
    return [base, ...media];
  });
  const documentItems: CaseTimelineItem[] = documents.map((document) => ({ id: document.id, sourceId: document.id, type: "Dokument", title: isSensitiveText(documentText(document)) ? "Geschütztes Dokument" : document.originalName, at: documentDate(document), recordType: "document", sensitive: isSensitiveText(documentText(document)) }));
  return [...recordItems, ...documentItems].sort((a, b) => (a.at || "9999").localeCompare(b.at || "9999") || a.title.localeCompare(b.title, "de"));
}

export function buildCaseOpenSummary(caseId: string, input: ContextInput) {
  const linked = connectedFamilyIds(caseId, input.relations, 3);
  const openMemory = buildMemoryOpenPoints(input.records).filter((point) => linked.has(point.eventId));
  const tasks = input.records.filter((record) => linked.has(record.id) && record.recordType === "task" && !["erledigt", "zurückgestellt"].includes(record.status));
  const deadlines = input.records.filter((record) => linked.has(record.id) && record.recordType === "deadline" && !["erledigt", "zurückgestellt"].includes(record.status));
  return { memoryQuestions: openMemory.length, tasks: tasks.length, deadlines: deadlines.length, total: openMemory.length + tasks.length + deadlines.length };
}

export function buildRelatedContext(sourceId: string, input: ContextInput) {
  const direct = relatedIds(sourceId, input.relations);
  const recordMap = new Map(input.records.map((record) => [record.id, record]));
  const documentMap = new Map(input.documents.map((document) => [document.id, document]));
  return direct.flatMap((id) => {
    const record = recordMap.get(id);
    if (record) return [{ id, type: record.recordType, label: recordLabel(record), sensitive: isMemoryRecord(record) ? !!memoryData(record)?.sensitive : isSensitiveText(recordText(record)) }];
    const document = documentMap.get(id);
    if (document) return [{ id, type: "document" as const, label: document.originalName, sensitive: isSensitiveText(documentText(document)) }];
    return [];
  });
}

export function runContextLinkingSelfTests() {
  const now = "2026-10-13T10:00:00Z";
  const caseA: FamilyRecordUnion = { id: "VORG-000001", recordType: "case", createdAt: now, updatedAt: now, status: "offen", source: "Test", notes: null, data: { title: "Wandleuchte / Elektroarbeiten", caseType: "Reparatur" } };
  const caseB: FamilyRecordUnion = { id: "VORG-000002", recordType: "case", createdAt: now, updatedAt: now, status: "offen", source: "Test", notes: null, data: { title: "Küchenlicht / Elektroarbeiten", caseType: "Reparatur" } };
  const organisation: FamilyRecordUnion = { id: "ORG-000001", recordType: "organisation", createdAt: now, updatedAt: now, status: "aktiv", source: "Test", notes: "Telefon 040 12345678", data: { name: "Elektro Funkel" } };
  const memory: FamilyRecordUnion = { id: "EVENT-000001", recordType: "event", createdAt: "2026-10-08T10:00:00Z", updatedAt: "2026-10-08T10:00:00Z", status: "offen", source: "Memory", notes: null, data: { title: "Elektriker vereinbart Termin für Wandleuchte", eventAt: "2026-10-08T10:00:00Z", memoryVersion: 1, captureType: "text", originalText: "Elektro Funkel 040 12345678 vereinbart einen Termin für die Wandleuchte.", lifeArea: "Haus & Wohnung", eventType: "Telefonat", sensitive: false, confidence: "bestätigt", statements: [], openPoint: { question: "Ist die Rechnung inzwischen eingegangen?", reason: "Rechnung noch ausstehend", status: "offen" }, tags: ["offen"], media: [{ id: "M-1", name: "Montagezustand.jpg", mimeType: "image/jpeg", sizeBytes: 10, kind: "foto", role: "nachher", order: 0, storedPath: "lokal" }], assistantSummary: "Termin vereinbart" } } as FamilyRecordUnion;
  const partial: FamilyRecordUnion = { id: "EVENT-000002", recordType: "event", createdAt: "2026-10-10T10:00:00Z", updatedAt: "2026-10-10T10:00:00Z", status: "offen", source: "Memory", notes: null, data: { title: "Elektriker war da", eventAt: "2026-10-10T10:00:00Z", memoryVersion: 1, captureType: "text", originalText: "Elektro Funkel war da, eine Lampe funktioniert weiterhin nicht.", lifeArea: "Haus & Wohnung", eventType: "Handwerkerbesuch", sensitive: false, confidence: "bestätigt", statements: [], openPoint: { question: "Ist die Reparatur vollständig abgeschlossen?", reason: "Lampe funktioniert weiterhin nicht", status: "teilweise_erledigt" }, tags: ["offen"], media: [], assistantSummary: "Teilweise erledigt" } } as FamilyRecordUnion;
  const document: ContextDocument = { id: "DOC-000001", originalName: "Rechnung Elektro Funkel Wandleuchte.pdf", category: "Haus & Wohnung", documentDate: "2026-10-13", notes: "Telefon 040 12345678" };
  const baseRelations: FamilyRelation[] = [
    { id: "REL-1", fromType: "event", fromId: memory.id, toType: "case", toId: caseA.id, relationType: "ergänzt Chronologie", createdAt: now, source: "Test", notes: null },
    { id: "REL-2", fromType: "event", fromId: partial.id, toType: "case", toId: caseA.id, relationType: "ergänzt Chronologie", createdAt: now, source: "Test", notes: null },
    { id: "REL-3", fromType: "organisation", fromId: organisation.id, toType: "case", toId: caseA.id, relationType: "beteiligt", createdAt: now, source: "Test", notes: null },
  ];
  const input = { documents: [document], records: [caseA, organisation, memory, partial], relations: baseRelations };
  const documentSuggestion = buildContextLinkSuggestions(input).find((item) => item.sourceId === document.id);
  const memoryAfterDocument = suggestIncomingMemoryContext({ ...input, text: "Der Handwerker war heute wegen der Wandleuchte da.", eventAt: "2026-10-10" })[0];
  const ambiguous = suggestIncomingMemoryContext({ documents: [], records: [caseA, caseB], relations: [], text: "Der Elektriker war da.", eventAt: now });
  const openSummary = buildCaseOpenSummary(caseA.id, input);
  const timeline = buildCaseTimeline(caseA.id, { ...input, relations: [...baseRelations, { id: "REL-4", fromType: "document", fromId: document.id, toType: "case", toId: caseA.id, relationType: "gehört zu", createdAt: now, source: "Test", notes: null }] });
  const rejected = buildContextLinkSuggestions({ ...input, decisions: documentSuggestion ? [{ id: "DEC-1", sourceType: "document", sourceId: document.id, caseId: caseA.id, decision: "nicht_verknuepfen", contextHash: documentSuggestion.contextHash, decidedAt: now }] : [] });
  return [
    { id: "context-memory-before-document", label: "Memory vor Dokument", passed: documentSuggestion?.caseId === caseA.id && documentSuggestion.relatedMemoryIds.includes(memory.id), summary: "Eine spätere Rechnung schlägt den vorhandenen Memory-Vorgang vor." },
    { id: "context-document-before-memory", label: "Dokument vor Memory", passed: memoryAfterDocument?.caseId === caseA.id, summary: "Ein späteres Memory erkennt den bereits dokumentierten Vorgang." },
    { id: "context-ambiguous", label: "Falscher Zusammenhang", passed: ambiguous.length === 0 || ambiguous[0].confidence === "unklar", summary: "Zeitliche oder allgemeine Nähe allein führt nicht zu einer automatischen Zuordnung." },
    { id: "context-open-point", label: "Offene Memory-Frage", passed: !!documentSuggestion?.openPointEventIds.includes(memory.id), summary: "Eine passende Rechnung kann die Klärung eines offenen Memory-Punkts vorschlagen." },
    { id: "context-partial", label: "Teilweise erledigt", passed: openSummary.memoryQuestions === 2 && memoryData(partial)?.openPoint?.status === "teilweise_erledigt", summary: "Rechnung und Besuch schließen einen teilweise offenen Vorgang nicht automatisch." },
    { id: "context-unlink", label: "Verbindung lösen", passed: rejected.every((item) => item.sourceId !== document.id || item.caseId !== caseA.id), summary: "Eine ausdrücklich abgelehnte Verbindung wird bei unverändertem Kontext nicht erneut vorgeschlagen." },
    { id: "context-timeline", label: "Gemeinsamer Verlauf", passed: timeline.some((item) => item.type === "Dokument") && timeline.filter((item) => item.type === "Memory").length === 2 && timeline.some((item) => item.type === "Foto"), summary: "Dokumente, Memories und Fotos bleiben getrennte Datensätze und erscheinen gemeinsam chronologisch." },
  ];
}
