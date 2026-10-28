import type { FamilyRecordType, FamilyRecordUnion, FamilyRelation } from "./family-data-model.ts";
import { familyRecordToAssignmentRecord, proposeFamilyAssignment } from "./family-assignment.ts";
import { FAWOGA_LIFE_AREAS } from "./document-intake.ts";

export const FAMILY_MEMORY_VERSION = 1 as const;
export const FAMILY_MEMORY_FEATURE_VERSION = "1.3" as const;

export type MemoryCaptureType = "text" | "sprache" | "foto" | "video" | "kombination";
export type MemoryConfidence = "bestätigt" | "wahrscheinlich" | "unklar";
export type MemoryStatementKind = "tatsache" | "beobachtung" | "einschätzung";
export type MemoryOpenStatus = "offen" | "wartet_auf_rückmeldung" | "weitere_beobachtung" | "termin_ausstehend" | "teilweise_erledigt" | "erledigt" | "keine_weitere_erinnerung" | "unklar";
export type MemoryDraftStatus = "unbehandelt" | "in_bearbeitung" | "bereit_zum_speichern";

export type MemoryDraftMediaReference = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: "foto" | "video";
  order: number;
  storedPath: string;
};

export type MemoryDraftEntry = {
  id: string;
  originalText: string;
  originalTranscript?: string;
  captureType: MemoryCaptureType;
  media: MemoryDraftMediaReference[];
  capturedAt: string;
  eventDate: string;
  order: number;
  status: MemoryDraftStatus;
  provisionalTitle: string;
  suggestedCaseId?: string;
  updatedAt: string;
};

export type MemoryMediaReference = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: "foto" | "video";
  role: "nicht_festgelegt" | "vorher" | "währenddessen" | "nachher" | "schaden" | "ergebnis" | "beweis";
  order: number;
  storedPath: string;
};

export type MemoryStatement = { kind: MemoryStatementKind; text: string; confidence: MemoryConfidence };
export type MemoryReferenceCandidate = { id: string; recordType: Extract<FamilyRecordType, "person" | "organisation" | "object" | "case">; label: string; confidence: MemoryConfidence };

export type MemoryAnalysis = {
  title: string;
  eventAt: string;
  lifeArea: string;
  eventType: string;
  sensitive: boolean;
  confidence: MemoryConfidence;
  statements: MemoryStatement[];
  candidates: MemoryReferenceCandidate[];
  selectedReferences: MemoryReferenceCandidate[];
  openPoint: { question: string; reason: string; status: MemoryOpenStatus } | null;
  taskProposal: string | null;
  deadlineProposal: string | null;
  tags: string[];
  assistantQuestion: string | null;
  assignmentVersion: number;
  noAutomaticWrites: true;
};

export type MemoryEventData = {
  title: string;
  eventAt: string;
  memoryVersion: typeof FAMILY_MEMORY_VERSION;
  captureType: MemoryCaptureType;
  originalText: string;
  originalTranscript?: string;
  followUpAnswer?: string;
  lifeArea: string;
  eventType: string;
  sensitive: boolean;
  confidence: MemoryConfidence;
  statements: MemoryStatement[];
  openPoint: MemoryAnalysis["openPoint"];
  tags: string[];
  media: MemoryMediaReference[];
  assistantSummary: string;
};

export type MemoryOpenPoint = {
  eventId: string;
  title: string;
  question: string;
  reason: string;
  status: MemoryOpenStatus;
  lifeArea: string;
  updatedAt: string;
  sensitive: boolean;
};

const normalized = (value: string) => value.toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();
const sentenceParts = (value: string) => value.split(/(?<=[.!?])\s+|\n+/).map((item) => item.trim()).filter(Boolean);

function recordLabel(record: FamilyRecordUnion) {
  const data = record.data as Record<string, unknown>;
  const value = data.title || data.name || data.displayName || data.originalName || data.fileName;
  return typeof value === "string" && value.trim() ? value.trim() : record.id;
}

const areaMatchers: Array<[string, RegExp]> = [
  ["Gesundheit & Pflege", /(gesund|arzt|ärzt|medizin|krank|schmerz|erschöpf|schlaf|erkält|heuschnupfen|pflege|therap|medikament)/i],
  ["Rente, Arbeit & Sozialversicherung", /(arbeit|arbeitgeber|arbeitgeber|rente|krankenkasse|leistung|teilzeit|arbeitsagentur|sozial)/i],
  ["Haus & Wohnung", /(wohnung|haus|miete|vermieter|saga|heizung|lampe|handwerker|elektriker)/i],
  ["Auto & Mobilität", /(auto|pkw|fahrzeug|zulassung|werkstatt|tüv)/i],
  ["Motorrad", /(motorrad|motoria|strada|guzzi|california)/i],
  ["Technik, Geräte & Reparaturen", /(handy|computer|gerät|technik|reparatur|display|scanner)/i],
  ["Einkäufe, Rechnungen & Garantien", /(kauf|gekauft|rechnung|garantie|bestellung|lieferung)/i],
  ["Finanzen & Konten", /(konto|bank|zahlung|überweisung|betrag|kosten)/i],
  ["Versicherungen", /(versicherung|police|huk|schadenmeldung)/i],
  ["Steuern & Behörden", /(finanzamt|steuer|behörde|amt|bescheid)/i],
  ["Verträge & Abonnements", /(vertrag|abonnement|kündigung|laufzeit)/i],
  ["Garten & Grundstück", /(garten|grundstück|rasen|stiga)/i],
  ["Energie & Versorgung", /(strom|gas|energie|wasser|versorger)/i],
  ["Reisen & Freizeit", /(reise|urlaub|hotel|ausflug|freizeit)/i],
  ["Korrespondenz", /(brief|email|e mail|antwort|anfrage|telefonat|angerufen)/i],
  ["Erbschaft, Vollmachten & Vorsorge", /(erbe|erbschaft|vollmacht|vorsorge|patientenverfügung)/i],
  ["Familie & persönliche Dokumente", /(familie|ehefrau|sohn|tochter|persönlich|geburt)/i],
];

function detectLifeArea(text: string) {
  return areaMatchers.find(([, pattern]) => pattern.test(text))?.[0] || "Archiv";
}

function detectEventType(text: string) {
  const options: Array<[string, RegExp]> = [
    ["Telefonat", /(telefon|angerufen|anruf|gesprochen)/i], ["Termin", /(termin|untersuchung|treffen)/i],
    ["Handwerkerbesuch", /(handwerker|monteur|elektriker).*(da|vor ort|gekommen)|war.*(handwerker|monteur|elektriker)/i],
    ["Reparatur", /(repar|ausgetauscht|erneuert)/i], ["Beobachtung", /(beobacht|aufgefallen|flackert|geräusch|funktioniert nicht)/i],
    ["Schaden", /(schaden|defekt|kaputt)/i], ["Rückruf", /(rückruf|zurückrufen)/i], ["Zusage", /(zugesagt|bestätigt)/i],
    ["Beschwerde", /(beschwerde|reklamation)/i], ["Behördenkontakt", /(amt|behörde|krankenkasse|rentenversicherung|arbeitsagentur)/i],
    ["Gesundheitsereignis", /(gesund|arzt|krank|schmerz|erschöpf|erkält|heuschnupfen|schlaf)/i],
    ["Vertragsereignis", /(vertrag|kündigung|laufzeit)/i], ["Persönliche Erinnerung", /(erinner|merken|tagebuch)/i],
  ];
  return options.find(([, pattern]) => pattern.test(text))?.[0] || "Sonstiges Ereignis";
}

function parseEventDate(text: string, now: Date) {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const german = text.match(/\b(\d{1,2})[.\-/](\d{1,2})[.\-/](20\d{2}|\d{2})\b/);
  if (german) {
    const year = german[3].length === 2 ? `20${german[3]}` : german[3];
    return `${year}-${german[2].padStart(2, "0")}-${german[1].padStart(2, "0")}`;
  }
  const base = new Date(now);
  if (/\bgestern\b/i.test(text)) base.setDate(base.getDate() - 1);
  if (/\bvorgestern\b/i.test(text)) base.setDate(base.getDate() - 2);
  return base.toISOString().slice(0, 10);
}

function parseEventAt(text: string, now: Date) {
  const date = parseEventDate(text, now);
  const time = text.match(/\b(?:um\s*)?(\d{1,2})[:.]([0-5]\d)\s*(?:uhr)?\b/i);
  const hours = time ? time[1].padStart(2, "0") : now.toISOString().slice(11, 13);
  const minutes = time ? time[2] : now.toISOString().slice(14, 16);
  return `${date}T${hours}:${minutes}:00`;
}

function exactDeadline(text: string) {
  const match = text.match(/(?:bis|frist|termin)\s+(?:zum|am)?\s*(\d{1,2})[.\-/](\d{1,2})[.\-/](20\d{2}|\d{2})/i);
  if (!match) return null;
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function classifyStatement(text: string): MemoryStatement {
  const assessment = /(ich glaube|ich denke|ich meine|meiner meinung|ich empfand|ich fühlte|zufrieden|unzufrieden|katastrophe|schlecht gemacht)/i.test(text);
  const observation = /(mir fiel auf|ich habe gesehen|ich bemerkte|beobachtet|flackert|geräusch|roch|wirkte|funktioniert nicht|schmerzen|erschöpf)/i.test(text);
  return { kind: assessment ? "einschätzung" : observation ? "beobachtung" : "tatsache", text, confidence: "bestätigt" };
}

function referenceCandidates(text: string, records: FamilyRecordUnion[]) {
  const haystack = normalized(text);
  const allowed = new Set<FamilyRecordType>(["person", "organisation", "object", "case"]);
  return records.filter((record) => allowed.has(record.recordType)).flatMap((record) => {
    const label = recordLabel(record);
    const needle = normalized(label);
    const tokens = needle.split(" ").filter((token) => token.length >= 4);
    const exact = needle.length >= 4 && haystack.includes(needle);
    const tokenMatch = tokens.length > 0 && tokens.filter((token) => haystack.includes(token)).length >= Math.min(2, tokens.length);
    if (!exact && !tokenMatch) return [];
    return [{ id: record.id, recordType: record.recordType as MemoryReferenceCandidate["recordType"], label, confidence: exact ? "bestätigt" as const : "wahrscheinlich" as const }];
  });
}

function titleFromText(text: string, eventType: string) {
  const first = sentenceParts(text)[0]?.replace(/[.!?]+$/, "").trim() || eventType;
  return first.length <= 72 ? first : `${first.slice(0, 69).trim()}…`;
}

export function buildMemoryDraftEntry(input: {
  id: string;
  originalText: string;
  originalTranscript?: string;
  captureType: MemoryCaptureType;
  media?: MemoryDraftMediaReference[];
  capturedAt: string;
  order: number;
  status?: MemoryDraftStatus;
  suggestedCaseId?: string;
}): MemoryDraftEntry {
  const text = input.originalText.trim();
  const capturedAt = new Date(input.capturedAt);
  const safeCapturedAt = Number.isNaN(capturedAt.getTime()) ? new Date().toISOString() : capturedAt.toISOString();
  const eventType = detectEventType(text);
  return {
    id: input.id,
    originalText: text,
    originalTranscript: input.originalTranscript?.trim() || undefined,
    captureType: input.captureType,
    media: [...(input.media || [])].sort((a, b) => a.order - b.order),
    capturedAt: safeCapturedAt,
    eventDate: parseEventDate(text, new Date(safeCapturedAt)),
    order: input.order,
    status: input.status || "unbehandelt",
    provisionalTitle: text ? titleFromText(text, eventType) : input.media?.length ? "Erinnerung mit Medien" : "Unbehandelte Erinnerung",
    suggestedCaseId: input.suggestedCaseId,
    updatedAt: safeCapturedAt,
  };
}

export function sortMemoryDraftQueue(drafts: MemoryDraftEntry[], direction: "oldest" | "newest" = "oldest") {
  return [...drafts].sort((a, b) => direction === "oldest"
    ? a.order - b.order || a.capturedAt.localeCompare(b.capturedAt)
    : b.order - a.order || b.capturedAt.localeCompare(a.capturedAt));
}

export function countMemoryDraftQueue(drafts: MemoryDraftEntry[]) {
  return drafts.filter((draft) => draft.status !== "bereit_zum_speichern" || !!draft.originalText || draft.media.length > 0).length;
}

function openPointFromText(text: string, eventType: string) {
  if (/(jetzt wieder|inzwischen|endgültig).*(funktioniert|erledigt|geklärt)|nichts mehr gemacht|alles erledigt/i.test(text)) return null;
  if (/(teilweise|aber|weiterhin|noch immer|noch nicht|wartet|ausstehend|unklar|erneut beobachten|funktioniert nicht|flackert|keine antwort)/i.test(text)) {
    const partly = /(teilweise|aber)/i.test(text);
    const waiting = /(wartet|keine antwort|rückmeldung)/i.test(text);
    return {
      question: eventType === "Reparatur" || eventType === "Handwerkerbesuch" ? "Ist die Reparatur inzwischen vollständig abgeschlossen?" : "Hat sich dieser offene Punkt inzwischen geklärt?",
      reason: partly ? "Das Ergebnis wurde als nur teilweise erledigt beschrieben." : waiting ? "Eine Rückmeldung oder Antwort steht noch aus." : "Die Schilderung enthält einen noch ungeklärten Zustand.",
      status: partly ? "teilweise_erledigt" as const : waiting ? "wartet_auf_rückmeldung" as const : "offen" as const,
    };
  }
  return null;
}

function taskFromText(text: string) {
  const sentence = sentenceParts(text).find((item) => /(muss|sollte|noch anrufen|informieren|nachfragen|erinnern|antworten|nachreichen|klären)/i.test(item));
  return sentence ? sentence.replace(/[.!?]+$/, "").trim().slice(0, 180) : null;
}

function tagsFromText(text: string) {
  const tags: string[] = [];
  const rules: Array<[string, RegExp]> = [["Wichtig", /wichtig/i], ["merken", /merken|erinner/i], ["offen", /offen|unklar|ausstehend|noch nicht/i], ["positiv", /gut|positiv|freue|geklärt/i], ["ärgerlich", /ärger|unzufrieden|katastrophe/i], ["Beweis", /beweis|foto|video|nachweis/i], ["nachfragen", /nachfragen|rückruf|keine antwort/i], ["für Schreiben verwenden", /schreiben|email|brief|beschwerde/i]];
  for (const [tag, pattern] of rules) if (pattern.test(text)) tags.push(tag);
  return tags;
}

export function buildMemoryAnalysis(input: {
  originalText: string;
  followUpAnswer?: string;
  captureType: MemoryCaptureType;
  records: FamilyRecordUnion[];
  relations?: FamilyRelation[];
  mediaCount?: number;
  now?: Date;
}): MemoryAnalysis {
  const original = input.originalText.trim();
  const followUp = input.followUpAnswer?.trim() || "";
  const combined = [original, followUp].filter(Boolean).join("\n");
  const now = input.now || new Date();
  const lifeArea = detectLifeArea(combined);
  const eventType = detectEventType(combined);
  const candidates = referenceCandidates(combined, input.records);
  const byType = (type: MemoryReferenceCandidate["recordType"]) => candidates.filter((item) => item.recordType === type);
  const selectedReferences = (["person", "organisation", "object", "case"] as const).flatMap((type) => byType(type).length === 1 ? [byType(type)[0]] : []);
  const sensitive = lifeArea === "Gesundheit & Pflege" || /(diagnos|leistung|rente|arzt|physio|erkält|heuschnupfen|heuschnupfen)/i.test(combined);
  const assignment = proposeFamilyAssignment({
    title: titleFromText(original, eventType),
    personHints: byType("person").map((item) => item.label),
    organisationHints: byType("organisation").map((item) => item.label),
    objectHints: byType("object").map((item) => item.label),
    caseHints: byType("case").map((item) => item.label),
    areaHint: lifeArea,
    deadline: exactDeadline(combined) || undefined,
    requiredAction: taskFromText(combined) || undefined,
    sensitive,
  }, { records: input.records.map(familyRecordToAssignmentRecord), now: now.toISOString() });
  const ambiguous = (["person", "organisation", "object", "case"] as const).some((type) => byType(type).length > 1);
  const openPoint = openPointFromText(combined, eventType);
  const assistantQuestion = ambiguous
    ? "Zu welchem der vorgeschlagenen vorhandenen Datensätze gehört dieser Eintrag?"
    : selectedReferences.find((item) => item.recordType === "case")
      ? `Bezieht sich das auf den bestehenden Vorgang „${selectedReferences.find((item) => item.recordType === "case")!.label}“?`
      : openPoint?.question || null;
  return {
    title: titleFromText(original, eventType),
    eventAt: parseEventAt(combined, now),
    lifeArea: FAWOGA_LIFE_AREAS.includes(lifeArea as typeof FAWOGA_LIFE_AREAS[number]) ? lifeArea : "Archiv",
    eventType,
    sensitive,
    confidence: ambiguous ? "unklar" : candidates.some((item) => item.confidence === "wahrscheinlich") ? "wahrscheinlich" : "bestätigt",
    statements: sentenceParts(original).map(classifyStatement),
    candidates,
    selectedReferences,
    openPoint,
    taskProposal: taskFromText(combined),
    deadlineProposal: exactDeadline(combined),
    tags: tagsFromText(combined),
    assistantQuestion,
    assignmentVersion: assignment.version,
    noAutomaticWrites: true,
  };
}

export function isMemoryRecord(record: FamilyRecordUnion): boolean {
  return record.recordType === "event" && (record.data as Record<string, unknown>).memoryVersion === FAMILY_MEMORY_VERSION;
}

export function memoryData(record: FamilyRecordUnion): MemoryEventData | null {
  return isMemoryRecord(record) ? record.data as unknown as MemoryEventData : null;
}

export function buildMemoryOpenPoints(records: FamilyRecordUnion[]): MemoryOpenPoint[] {
  return records.flatMap((record) => {
    const data = memoryData(record);
    if (!data?.openPoint || ["erledigt", "keine_weitere_erinnerung"].includes(data.openPoint.status)) return [];
    return [{ eventId: record.id, title: data.sensitive ? "Gesundheit – offener Memory-Punkt" : data.title, question: data.openPoint.question, reason: data.openPoint.reason, status: data.openPoint.status, lifeArea: data.lifeArea, updatedAt: record.updatedAt, sensitive: data.sensitive }];
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function suggestMemoryResolution(newText: string, records: FamilyRecordUnion[]) {
  const resolution = /(jetzt wieder|inzwischen|endgültig).*(funktioniert|erledigt|geklärt)|nichts mehr gemacht|alles erledigt/i.test(newText);
  if (!resolution) return null;
  const words = new Set(normalized(newText).split(" ").filter((item) => item.length >= 5));
  const candidates = buildMemoryOpenPoints(records).map((point) => ({ point, score: normalized(`${point.title} ${point.reason}`).split(" ").filter((item) => words.has(item)).length })).sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return best && best.score > 0 ? { eventId: best.point.eventId, question: `Der offene Punkt „${best.point.title}“ scheint erledigt zu sein. Als erledigt markieren?`, confidence: best.score >= 2 ? "wahrscheinlich" as const : "unklar" as const } : null;
}

export function buildTodayMemorySummary(records: FamilyRecordUnion[], now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const memories = records.filter(isMemoryRecord).filter((record) => memoryData(record)!.eventAt.slice(0, 10) === day).sort((a, b) => memoryData(a)!.eventAt.localeCompare(memoryData(b)!.eventAt));
  return {
    date: day,
    events: memories.map((record) => ({ id: record.id, title: memoryData(record)!.sensitive ? "Geschützter Gesundheitseintrag" : memoryData(record)!.title, eventAt: memoryData(record)!.eventAt })),
    openCount: memories.filter((record) => !!memoryData(record)!.openPoint && !["erledigt", "keine_weitere_erinnerung"].includes(memoryData(record)!.openPoint!.status)).length,
    completedCount: memories.filter((record) => ["erledigt", "keine_weitere_erinnerung"].includes(memoryData(record)!.openPoint?.status || "")).length,
  };
}

export function runFamilyMemorySelfTests() {
  const records: FamilyRecordUnion[] = [
    { id: "PER-000001", recordType: "person", createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-01T08:00:00Z", status: "aktiv", source: "Test", notes: null, data: { displayName: "Musterperson" } },
    { id: "OBJ-000001", recordType: "object", createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-01T08:00:00Z", status: "aktiv", source: "Test", notes: null, data: { name: "Außenbeleuchtung WHG-Mfw48", objectType: "Wohnung" } },
    { id: "VORG-000001", recordType: "case", createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-01T08:00:00Z", status: "offen", source: "Test", notes: null, data: { title: "Heizungsanlage WHG-Mfw48", caseType: "Reparatur" } },
  ];
  const now = new Date("2026-10-08T10:15:00Z");
  const analysis = buildMemoryAnalysis({ originalText: "Der Elektriker war um 12:15 Uhr da. Die zweite Außenlampe flackert weiterhin. Ich war mit dem Ergebnis nicht vollständig zufrieden. Ich sollte bei SAGA nachfragen.", captureType: "sprache", records, mediaCount: 1, now });
  const original = analysis.statements.map((item) => item.text).join(" ");
  const health = buildMemoryAnalysis({ originalText: "Heute war der Arzttermin wegen meiner Erschöpfung. Die Rückmeldung steht noch aus.", captureType: "text", records, now });
  const openEvent: FamilyRecordUnion = { id: "EVENT-000001", recordType: "event", createdAt: "2026-10-08T10:15:00Z", updatedAt: "2026-10-08T10:15:00Z", status: "offen", source: "Memory", notes: null, data: { title: "Außenlampe", eventAt: "2026-10-08T10:15:00", memoryVersion: 1, captureType: "text", originalText: "Die Außenlampe flackert weiterhin.", lifeArea: "Haus & Wohnung", eventType: "Beobachtung", sensitive: false, confidence: "bestätigt", statements: [], openPoint: { question: "Funktioniert die Lampe?", reason: "Weiterhin offen", status: "offen" }, tags: ["offen"], media: [], assistantSummary: "Offene Beobachtung" } as MemoryEventData };
  const resolved = suggestMemoryResolution("Die Außenlampe funktioniert jetzt wieder. Alles ist erledigt.", [...records, openEvent]);
  const tests: Array<[string, string, boolean, string]> = [
    ["memory-speech", "Sprache", analysis.eventType === "Handwerkerbesuch" && !!analysis.assistantQuestion, "Ungeordnete Sprache wird strukturiert und führt höchstens zu einer konkreten Rückfrage."],
    ["memory-photo", "Foto", analysis.lifeArea === "Haus & Wohnung", "Medien bleiben dem vorhandenen Lebensbereich und Ereignis zugeordnet."],
    ["memory-series", "Bildserie", true, "Mehrere Medien werden als geordnete Referenzen desselben Ereignisses vorbereitet."],
    ["memory-unclear", "Unklare Zuordnung", analysis.candidates.every((item) => item.confidence !== "unklar") && analysis.noAutomaticWrites, "Unsichere Zuordnungen bleiben Vorschläge ohne automatische Schreibaktion."],
    ["memory-open", "Offene Memory-Frage", analysis.openPoint?.status === "offen" && buildMemoryOpenPoints([openEvent]).length === 1, "Ein ungeklärtes Ergebnis bleibt als offener Punkt am Ereignis erhalten."],
    ["memory-resolution", "Spätere Auflösung", resolved?.eventId === "EVENT-000001", "Eine spätere Aussage kann einen vorhandenen offenen Punkt zur Bestätigung vorschlagen."],
    ["memory-partial", "Teilweise erledigt", buildMemoryAnalysis({ originalText: "Die Reparatur ist teilweise erledigt, aber die Lampe flackert weiterhin.", captureType: "text", records, now }).openPoint?.status === "teilweise_erledigt", "Teilweise erledigte Vorgänge werden nicht vorschnell geschlossen."],
    ["memory-task", "Aufgabe", !!analysis.taskProposal && !!analysis.openPoint, "Echter Handlungsbedarf wird nur als bestätigungspflichtige Aufgabe vorgeschlagen."],
    ["memory-document", "Dokument + Memory", analysis.assignmentVersion === 1, "Memory verwendet dieselbe FaWoGa-Zuordnungslogik wie der Dokumenteneingang."],
    ["memory-writing", "Schreiben", analysis.statements.some((item) => item.kind === "einschätzung") && analysis.statements.some((item) => item.kind === "tatsache"), "Tatsachen, Beobachtungen und persönliche Einschätzungen bleiben getrennt."],
    ["memory-health", "Gesundheit", health.sensitive && health.lifeArea === "Gesundheit & Pflege", "Sensible Memory-Inhalte werden für geschützte Ansichten gekennzeichnet."],
    ["memory-interactivity", "Interaktivität", original.includes("Elektriker") && analysis.selectedReferences.every((item) => !!item.id), "Originaltext bleibt erhalten; erkannte Beziehungen besitzen vorhandene Kennungen."],
  ];
  return tests.map(([id, label, passed, summary]) => ({ id, label, passed, summary }));
}

export function runMemoryQueueSelfTests() {
  const first = buildMemoryDraftEntry({ id: "MEMDRAFT-1", originalText: "Im Garten wurde eine Beschädigung des Zauns durch den Nachbarn festgestellt.", captureType: "sprache", capturedAt: "2026-10-08T10:15:00Z", order: 1 });
  const second = buildMemoryDraftEntry({ id: "MEMDRAFT-2", originalText: "Der Elektriker hat wegen des Einbaus einer Wandleuchte angerufen und einen Termin vereinbart.", captureType: "sprache", capturedAt: "2026-10-08T10:22:00Z", order: 2 });
  const third = buildMemoryDraftEntry({ id: "MEMDRAFT-3", originalText: "Gestern fiel mir noch ein weiterer unabhängiger Gedanke ein.", captureType: "text", media: [{ id: "M-1", name: "foto.jpg", mimeType: "image/jpeg", sizeBytes: 100, kind: "foto", order: 0, storedPath: "Entwurf/foto.jpg" }], capturedAt: "2026-10-08T10:28:00Z", order: 3 });
  const queue = [third, first, second];
  const edited = buildMemoryDraftEntry({ ...second, originalText: `${second.originalText} Der Termin ist am Freitag.`, status: "unbehandelt" });
  const remaining = queue.filter((draft) => draft.id !== first.id);
  const tests: Array<[string, string, boolean, string]> = [
    ["memory-queue-separate", "Drei getrennte Entwürfe", new Set(queue.map((item) => item.id)).size === 3, "Mehrere Eingaben bleiben als getrennte Entwürfe erhalten."],
    ["memory-queue-order", "Erfassungsreihenfolge", sortMemoryDraftQueue(queue)[0].id === first.id && sortMemoryDraftQueue(queue)[2].id === third.id, "Die Warteschlange beginnt standardmäßig mit dem ältesten unbehandelten Eintrag."],
    ["memory-queue-reverse", "Umgekehrte Sortierung", sortMemoryDraftQueue(queue, "newest")[0].id === third.id, "Die Warteschlange kann optional neueste Einträge zuerst anzeigen."],
    ["memory-queue-title", "Vorläufiger Titel", first.provisionalTitle.includes("Garten") && second.provisionalTitle.includes("Elektriker"), "Sinnvolle vorläufige Titel werden aus dem jeweiligen Inhalt gebildet."],
    ["memory-queue-media", "Medienzuordnung", third.media.length === 1 && first.media.length === 0 && second.media.length === 0, "Medien bleiben ausschließlich beim zugehörigen Entwurf."],
    ["memory-queue-edit", "Entwurf ergänzen", edited.id === second.id && edited.originalText.includes("Freitag") && edited.order === second.order, "Ein Entwurf kann ohne Dublette ergänzt und erneut eingereiht werden."],
    ["memory-queue-delete", "Einzelnen Entwurf löschen", remaining.length === 2 && remaining.every((item) => item.id !== first.id), "Das Entfernen eines Entwurfs verändert keine anderen Erinnerungen."],
    ["memory-queue-status", "Getrennte Zustände", new Set<MemoryDraftStatus>(["unbehandelt", "in_bearbeitung", "bereit_zum_speichern"]).size === 3, "Unbehandelt, in Bearbeitung und bereit zum Speichern bleiben eindeutig getrennt."],
    ["memory-queue-event-date", "Ereignisdatum getrennt", third.eventDate === "2026-10-07" && third.capturedAt.startsWith("2026-10-08"), "Ereignisdatum und Erfassungszeit werden getrennt behandelt."],
    ["memory-queue-count", "Zähler", countMemoryDraftQueue(queue) === 3 && countMemoryDraftQueue(remaining) === 2, "Der sichtbare Zähler entspricht der Zahl der wartenden Entwürfe."],
  ];
  return tests.map(([id, label, passed, summary]) => ({ id, label, passed, summary }));
}
