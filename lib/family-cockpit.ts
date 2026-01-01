import type { FamilyRecordType, FamilyRecordUnion, FamilyRelation } from "./family-data-model.ts";
import { buildScheduleItems, classifyDateUrgency, scheduleStatusLabels, type ScheduleDisplayStatus } from "./family-reminders.ts";
import { buildFamilyNewsItems, filterFamilyNews, type FamilyNewsDocument, type FamilyNewsItem, type FamilyNewsVersion } from "./family-news.ts";
import { isMemoryRecord, memoryData } from "./family-memory.ts";
import { connectedFamilyIds } from "./family-relations.ts";

export const FAMILY_COCKPIT_VERSION = 1 as const;

export type FamilyCockpitDocument = FamilyNewsDocument & {
  storageType?: string | null;
  storedPath?: string | null;
  relativePath?: string | null;
  oneDrivePath?: string | null;
  downloadUrl?: string | null;
};

export type CockpitSection = "cockpit" | "documents" | "inbox" | "health" | "medical" | "benefits" | "work" | "assessment" | "correspondence" | "family" | "home" | "vehicles" | "purchases" | "reminders" | "memory" | "directory" | "versions";
export type CockpitUrgency = "overdue" | "today" | "dueSoon" | "attention" | "open" | "new";

export type CockpitReference = {
  id: string;
  type: FamilyRecordType | "document";
  label: string;
  section: CockpitSection;
  sensitive: boolean;
};

export type CockpitPriorityItem = {
  id: string;
  sourceId: string;
  sourceType: FamilyRecordType | "document";
  title: string;
  detail: string;
  urgency: CockpitUrgency;
  section: CockpitSection;
  sensitive: boolean;
};

export type CockpitTodoItem = {
  id: string;
  title: string;
  dueAt: string | null;
  priority: "hoch" | "mittel" | "normal";
  status: string;
  statusLabel: string;
  displayStatus: ScheduleDisplayStatus;
  references: CockpitReference[];
  sensitive: boolean;
};

export type CockpitCaseItem = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  persons: CockpitReference[];
  objects: CockpitReference[];
  organisations: CockpitReference[];
  documents: CockpitReference[];
  nextTask: CockpitTodoItem | null;
  nextDeadline: CockpitPriorityItem | null;
  sensitive: boolean;
};

export type CockpitObjectItem = {
  id: string;
  title: string;
  objectType: string;
  updatedAt: string;
  caseCount: number;
  documentCount: number;
  taskCount: number;
  deadlineCount: number;
  costCount: number;
  warrantyCount: number;
  contractCount: number;
  sensitive: boolean;
};

export type CockpitDossier = {
  id: string;
  type: FamilyRecordType | "document";
  title: string;
  status: string;
  source: string | null;
  notes: string | null;
  updatedAt: string;
  sensitive: boolean;
  storageReference: string | null;
  related: CockpitReference[];
  groups: Partial<Record<FamilyRecordType | "document", CockpitReference[]>>;
};

export type FamilyCockpitSnapshot = {
  priorities: CockpitPriorityItem[];
  todos: CockpitTodoItem[];
  cases: CockpitCaseItem[];
  objects: CockpitObjectItem[];
  healthNotices: CockpitPriorityItem[];
  memoryOpenPoints: CockpitPriorityItem[];
  relevantNews: FamilyNewsItem[];
  completedTaskCount: number;
};

export type FamilyCockpitInput = {
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  documents: FamilyCockpitDocument[];
  versions: FamilyNewsVersion[];
  now?: Date;
};

const sensitivePattern = /(gesund|arzt|ärzt|medizin|diagnos|krank|krankenkasse|rente|behörd|finanz|bank|persönlich|physio|pflege|heuschnupfen|erkält|rücken|heuschnupfen)/i;

function dataOf(record: FamilyRecordUnion) {
  return record.data as unknown as Record<string, unknown>;
}

export function cockpitRecordLabel(record: FamilyRecordUnion) {
  const data = dataOf(record);
  const value = data.title || data.name || data.displayName || data.originalName || data.fileName || data.contractNumber;
  return typeof value === "string" && value.trim() ? value : record.id;
}

function documentLabel(document: FamilyCockpitDocument) {
  return document.originalName || document.id;
}

function documentSensitive(document: FamilyCockpitDocument) {
  return sensitivePattern.test(`${document.category} ${document.originalName} ${document.notes || ""}`);
}

function directIds(id: string, relations: FamilyRelation[]) {
  return relations.flatMap((relation) => {
    if (relation.fromId === id) return [relation.toId];
    if (relation.toId === id) return [relation.fromId];
    return [];
  });
}

function contextIds(id: string, relations: FamilyRelation[], depth = 1) {
  const found = new Set<string>([id]);
  let frontier = [id];
  for (let level = 0; level < depth; level++) {
    const next: string[] = [];
    for (const current of frontier) for (const linked of directIds(current, relations)) {
      if (!found.has(linked)) { found.add(linked); next.push(linked); }
    }
    frontier = next;
  }
  found.delete(id);
  return [...found];
}

function sectionForObject(record: FamilyRecordUnion): CockpitSection {
  const text = `${cockpitRecordLabel(record)} ${String(dataOf(record).objectType || "")}`;
  if (/(fahrzeug|auto|motorrad|motoria|guzzi)/i.test(text)) return "vehicles";
  if (/(haus|wohnung|garten|miete)/i.test(text)) return "home";
  if (/(gerät|technik|kauf|garantie)/i.test(text)) return "purchases";
  return "cockpit";
}

export function cockpitSectionForRecord(record: FamilyRecordUnion, sensitive = false): CockpitSection {
  if (sensitive) return "health";
  if (isMemoryRecord(record)) return "memory";
  if (record.recordType === "document") return "documents";
  if (record.recordType === "person" || record.recordType === "organisation") return "family";
  if (record.recordType === "object") return sectionForObject(record);
  if (record.recordType === "case") return "cockpit";
  if (["deadline", "task", "reminder"].includes(record.recordType)) return "reminders";
  if (record.recordType === "warranty") return "purchases";
  return "cockpit";
}

function referenceForId(id: string, input: FamilyCockpitInput, sensitiveIds: Set<string>): CockpitReference | null {
  const record = input.records.find((item) => item.id === id);
  if (record) {
    const sensitive = sensitiveIds.has(id);
    return { id, type: record.recordType, label: sensitive ? "Geschützter Gesundheitseintrag" : cockpitRecordLabel(record), section: cockpitSectionForRecord(record, sensitive), sensitive };
  }
  const document = input.documents.find((item) => item.id === id);
  if (document) {
    const sensitive = sensitiveIds.has(id);
    return { id, type: "document", label: sensitive ? "Geschütztes Dokument" : documentLabel(document), section: sensitive ? "health" : "documents", sensitive };
  }
  return null;
}

function buildSensitiveIds(input: FamilyCockpitInput) {
  const sensitive = new Set<string>();
  for (const document of input.documents) if (documentSensitive(document)) sensitive.add(document.id);
  for (const record of input.records) {
    if (sensitivePattern.test(`${cockpitRecordLabel(record)} ${record.source || ""} ${record.notes || ""}`)) sensitive.add(record.id);
  }
  const mayInheritSensitivity = (id: string) => {
    if (input.documents.some((document) => document.id === id)) return true;
    const type = input.records.find((record) => record.id === id)?.recordType;
    return !!type && ["case", "task", "deadline", "reminder", "event"].includes(type);
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (const relation of input.relations) {
      if (sensitive.has(relation.fromId) && !sensitive.has(relation.toId) && mayInheritSensitivity(relation.toId)) { sensitive.add(relation.toId); changed = true; }
      if (sensitive.has(relation.toId) && !sensitive.has(relation.fromId) && mayInheritSensitivity(relation.fromId)) { sensitive.add(relation.fromId); changed = true; }
    }
  }
  return sensitive;
}

function statusLabel(status: string) {
  const normalized = status.toLocaleLowerCase("de").replaceAll(" ", "_");
  if (normalized === "in_bearbeitung") return "in Bearbeitung";
  if (normalized === "wartet_auf_antwort") return "wartet auf Antwort";
  if (normalized === "zurückgestellt") return "zurückgestellt";
  if (normalized === "erledigt") return "erledigt";
  return "offen";
}

function isToday(value: string | null, now: Date) {
  if (!value) return false;
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function urgencyForSchedule(displayStatus: ScheduleDisplayStatus, date: string | null, now: Date, status: string): CockpitUrgency {
  if (displayStatus === "overdue") return "overdue";
  if (isToday(date, now)) return "today";
  if (displayStatus === "dueSoon") return "dueSoon";
  if (statusLabel(status) === "wartet auf Antwort") return "attention";
  return "open";
}

function priorityForUrgency(urgency: CockpitUrgency): CockpitTodoItem["priority"] {
  if (urgency === "overdue" || urgency === "today") return "hoch";
  if (urgency === "dueSoon" || urgency === "attention") return "mittel";
  return "normal";
}

function safeScheduleTitle(recordType: "deadline" | "task" | "reminder", sensitive: boolean) {
  if (!sensitive) return null;
  if (recordType === "task") return "Gesundheit – Aufgabe offen";
  if (recordType === "deadline") return "Gesundheit – Frist prüfen";
  return "Gesundheit – Erinnerung";
}

function scheduleReferences(id: string, input: FamilyCockpitInput, sensitiveIds: Set<string>) {
  return directIds(id, input.relations).map((linkedId) => referenceForId(linkedId, input, sensitiveIds)).filter((item): item is CockpitReference => !!item);
}

function schedulePriorityDetail(recordType: "deadline" | "task" | "reminder", displayStatus: ScheduleDisplayStatus, date: string | null, sensitive: boolean) {
  const kind = recordType === "deadline" ? "Frist" : recordType === "task" ? "Aufgabe" : "Erinnerung";
  const dateText = date ? new Intl.DateTimeFormat("de-DE").format(new Date(`${date.slice(0, 10)}T12:00:00`)) : "ohne Datum";
  return sensitive ? `${kind} · ${scheduleStatusLabels[displayStatus]} · ${dateText}` : `${kind} · ${scheduleStatusLabels[displayStatus]} · ${dateText}`;
}

function buildTodo(item: ReturnType<typeof buildScheduleItems>[number], input: FamilyCockpitInput, sensitiveIds: Set<string>, now: Date): CockpitTodoItem {
  const sensitive = sensitiveIds.has(item.id);
  const urgency = urgencyForSchedule(item.displayStatus, item.date, now, item.status);
  return {
    id: item.id,
    title: safeScheduleTitle(item.recordType, sensitive) || item.title,
    dueAt: item.date,
    priority: priorityForUrgency(urgency),
    status: item.status,
    statusLabel: statusLabel(item.status),
    displayStatus: item.displayStatus,
    references: scheduleReferences(item.id, input, sensitiveIds),
    sensitive,
  };
}

function dueDateForRecord(record: FamilyRecordUnion) {
  const data = dataOf(record);
  if (record.recordType === "warranty") return typeof data.expiresOn === "string" ? data.expiresOn : null;
  if (record.recordType === "contract") return typeof data.endsOn === "string" ? data.endsOn : null;
  if (record.recordType === "event" && !isMemoryRecord(record)) return typeof data.eventAt === "string" ? data.eventAt : null;
  return null;
}

function daysUntil(value: string, now: Date) {
  const target = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.ceil((new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime() - today) / 86400000);
}

function refsOfType(id: string, type: CockpitReference["type"], input: FamilyCockpitInput, sensitiveIds: Set<string>, depth = 1) {
  return contextIds(id, input.relations, depth).map((linkedId) => referenceForId(linkedId, input, sensitiveIds)).filter((item): item is CockpitReference => !!item && item.type === type);
}

export function buildCockpitDossier(input: FamilyCockpitInput, targetId: string): CockpitDossier | null {
  const sensitiveIds = buildSensitiveIds(input);
  const record = input.records.find((item) => item.id === targetId);
  const document = input.documents.find((item) => item.id === targetId);
  if (!record && !document) return null;
  const related = contextIds(targetId, input.relations, record?.recordType === "object" ? 2 : 1)
    .map((id) => referenceForId(id, input, sensitiveIds))
    .filter((item): item is CockpitReference => !!item);
  const groups: CockpitDossier["groups"] = {};
  for (const reference of related) (groups[reference.type] ||= []).push(reference);
  const sensitive = sensitiveIds.has(targetId);
  return {
    id: targetId,
    type: record?.recordType || "document",
    title: sensitive ? "Geschützter Gesundheitsvorgang" : record ? cockpitRecordLabel(record) : documentLabel(document!),
    status: record?.status || document?.status || "gespeichert",
    source: record?.source || document?.notes || null,
    notes: record?.notes || null,
    updatedAt: record?.updatedAt || document?.updatedAt || document?.createdAt || "",
    sensitive,
    storageReference: document?.oneDrivePath || document?.relativePath || document?.storedPath || null,
    related,
    groups,
  };
}

export function buildFamilyCockpit(input: FamilyCockpitInput): FamilyCockpitSnapshot {
  const now = input.now || new Date();
  const sensitiveIds = buildSensitiveIds(input);
  const schedules = buildScheduleItems(input.records, input.relations, now);
  const activeSchedules = schedules.filter((item) => !["done", "postponed"].includes(item.displayStatus));
  const todos = activeSchedules.filter((item) => item.recordType === "task").map((item) => buildTodo(item, input, sensitiveIds, now));
  const schedulePriorities: CockpitPriorityItem[] = activeSchedules.map((item) => {
    const sensitive = sensitiveIds.has(item.id);
    const record = input.records.find((candidate) => candidate.id === item.id)!;
    const urgency = urgencyForSchedule(item.displayStatus, item.date, now, item.status);
    return {
      id: `schedule-${item.id}`,
      sourceId: item.id,
      sourceType: item.recordType,
      title: safeScheduleTitle(item.recordType, sensitive) || item.title,
      detail: schedulePriorityDetail(item.recordType, item.displayStatus, item.date, sensitive),
      urgency,
      section: sensitive ? "health" : cockpitSectionForRecord(record),
      sensitive,
    };
  });

  const modelDatePriorities: CockpitPriorityItem[] = input.records.flatMap((record) => {
    const date = dueDateForRecord(record);
    if (!date || ["erledigt", "archiviert"].includes(record.status)) return [];
    const remaining = daysUntil(date, now);
    if (remaining > 30) return [];
    const display = classifyDateUrgency(date, now);
    const sensitive = sensitiveIds.has(record.id);
    const kind = record.recordType === "warranty" ? "Garantie" : record.recordType === "contract" ? "Vertrag" : "Termin";
    return [{ id: `dated-${record.id}`, sourceId: record.id, sourceType: record.recordType, title: sensitive ? "Geschützter Termin" : cockpitRecordLabel(record), detail: `${kind} · ${scheduleStatusLabels[display]} · ${new Intl.DateTimeFormat("de-DE").format(new Date(`${date.slice(0, 10)}T12:00:00`))}`, urgency: display === "overdue" ? "overdue" as const : isToday(date, now) ? "today" as const : display === "dueSoon" ? "dueSoon" as const : "open" as const, section: sensitive ? "health" as const : cockpitSectionForRecord(record), sensitive }];
  });

  const memoryOpenPoints: CockpitPriorityItem[] = input.records.filter(isMemoryRecord).flatMap((record) => {
    const memory = memoryData(record);
    if (!memory?.openPoint || ["erledigt", "keine_weitere_erinnerung"].includes(memory.openPoint.status)) return [];
    const sensitive = memory.sensitive || sensitiveIds.has(record.id);
    return [{
      id: `memory-${record.id}`,
      sourceId: record.id,
      sourceType: "event" as const,
      title: sensitive ? "Geschützter Erinnerungspunkt" : memory.title,
      detail: sensitive ? "Offener Punkt im geschützten Erinnerungsprotokoll" : (memory.openPoint.question || "Offener Erinnerungspunkt"),
      urgency: memory.openPoint.status === "wartet_auf_rückmeldung" || memory.openPoint.status === "termin_ausstehend" ? "attention" as const : "open" as const,
      section: sensitive ? "health" as const : "memory" as const,
      sensitive,
    }];
  });

  const caseRecords = input.records.filter((record): record is Extract<FamilyRecordUnion, { recordType: "case" }> => record.recordType === "case" && !["erledigt", "archiviert"].includes(record.status));
  const cases: CockpitCaseItem[] = caseRecords.map((record) => {
    const sensitive = sensitiveIds.has(record.id);
    const connectedToCase = connectedFamilyIds(record.id, input.relations, 3);
    const caseSchedules = activeSchedules.filter((item) => connectedToCase.has(item.id));
    const caseTasks = caseSchedules.filter((item) => item.recordType === "task").map((item) => buildTodo(item, input, sensitiveIds, now));
    const caseDeadline = caseSchedules.find((item) => item.recordType === "deadline");
    return {
      id: record.id,
      title: sensitive ? "Geschützter Gesundheitsvorgang" : cockpitRecordLabel(record),
      status: record.status,
      updatedAt: record.updatedAt,
      persons: refsOfType(record.id, "person", input, sensitiveIds),
      objects: refsOfType(record.id, "object", input, sensitiveIds),
      organisations: refsOfType(record.id, "organisation", input, sensitiveIds),
      documents: refsOfType(record.id, "document", input, sensitiveIds),
      nextTask: caseTasks[0] || null,
      nextDeadline: caseDeadline ? schedulePriorities.find((item) => item.sourceId === caseDeadline.id) || null : null,
      sensitive,
    };
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const objects: CockpitObjectItem[] = input.records.filter((record): record is Extract<FamilyRecordUnion, { recordType: "object" }> => record.recordType === "object").map((record) => {
    const related = contextIds(record.id, input.relations, 2);
    const types = related.map((id) => input.records.find((candidate) => candidate.id === id)?.recordType || (input.documents.some((document) => document.id === id) ? "document" : null));
    const sensitive = sensitiveIds.has(record.id);
    return {
      id: record.id,
      title: sensitive ? "Geschütztes Objekt" : cockpitRecordLabel(record),
      objectType: String(dataOf(record).objectType || "Objekt"),
      updatedAt: record.updatedAt,
      caseCount: types.filter((type) => type === "case").length,
      documentCount: types.filter((type) => type === "document").length,
      taskCount: types.filter((type) => type === "task").length,
      deadlineCount: types.filter((type) => type === "deadline").length,
      costCount: types.filter((type) => type === "payment").length,
      warrantyCount: types.filter((type) => type === "warranty").length,
      contractCount: types.filter((type) => type === "contract").length,
      sensitive,
    };
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const news = filterFamilyNews(buildFamilyNewsItems({ documents: input.documents, records: input.records, relations: input.relations, versions: input.versions }), "30days", now);
  const documentStatus = new Map(input.documents.map((document) => [document.id, document.status]));
  const recordStatus = new Map(input.records.map((record) => [record.id, record.status]));
  const relevantNews = news.filter((item) => item.sourceType !== "version" && (item.sourceType === "document" ? ["hochgeladen", "abgleich_offen", "geprüft"].includes(documentStatus.get(item.sourceId) || "") : !["erledigt", "archiviert"].includes(recordStatus.get(item.sourceId) || ""))).slice(0, 5);

  const newsPriorities: CockpitPriorityItem[] = relevantNews.filter((item) => item.sourceType === "document").map((item) => ({ id: `news-${item.id}`, sourceId: item.sourceId, sourceType: "document", title: item.sensitive ? "Neue geschützte Unterlage" : item.title, detail: item.sensitive ? "Neue Unterlage im geschützten Fachbereich" : item.summary, urgency: "new", section: item.sensitive ? "health" : item.section as CockpitSection, sensitive: item.sensitive }));
  const casePriorities: CockpitPriorityItem[] = cases.filter((item) => item.nextTask || item.nextDeadline || statusLabel(item.status) === "wartet auf Antwort").map((item) => ({ id: `case-${item.id}`, sourceId: item.id, sourceType: "case", title: item.title, detail: item.nextTask ? `Nächste Aufgabe: ${item.nextTask.title}` : item.nextDeadline ? `Nächste Frist: ${item.nextDeadline.title}` : "Vorgang wartet auf Antwort", urgency: "attention", section: item.sensitive ? "health" : "cockpit", sensitive: item.sensitive }));
  const urgencyWeight: Record<CockpitUrgency, number> = { overdue: 0, today: 1, dueSoon: 2, attention: 3, new: 4, open: 5 };
  const priorities = [...schedulePriorities, ...modelDatePriorities, ...memoryOpenPoints, ...casePriorities, ...newsPriorities]
    .filter((item, index, all) => all.findIndex((candidate) => candidate.sourceId === item.sourceId && candidate.sourceType === item.sourceType) === index)
    .sort((a, b) => urgencyWeight[a.urgency] - urgencyWeight[b.urgency] || a.title.localeCompare(b.title, "de"));
  const healthNotices = priorities.filter((item) => item.sensitive).map((item) => ({ ...item, title: item.sourceType === "task" ? "Gesundheit – Aufgabe offen" : item.sourceType === "deadline" ? "Gesundheit – Frist prüfen" : "Gesundheit – Hinweis vorhanden", detail: item.detail.replace(/Quelle:.*/i, "").trim(), section: "health" as const }));

  return { priorities, todos, cases, objects, healthNotices, memoryOpenPoints, relevantNews, completedTaskCount: schedules.filter((item) => item.recordType === "task" && item.displayStatus === "done").length };
}

export type CockpitTestResult = {
  id: "cockpit-task" | "cockpit-deadline" | "cockpit-vehicle" | "cockpit-health" | "cockpit-news";
  label: string;
  status: "bestanden" | "fehlgeschlagen";
  summary: string;
};

export function runFamilyCockpitSelfTests(): CockpitTestResult[] {
  const records: FamilyRecordUnion[] = [
    { id: "PER-000001", recordType: "person", createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-01T08:00:00Z", status: "aktiv", source: "Test", notes: null, data: { displayName: "Testperson" } },
    { id: "OBJ-000001", recordType: "object", createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-02T08:00:00Z", status: "aktiv", source: "Test", notes: null, data: { name: "Testmotorrad", objectType: "Fahrzeug" } },
    { id: "VORG-000001", recordType: "case", createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-06T08:00:00Z", status: "offen", source: "Test", notes: null, data: { title: "TÜV-Vorgang", caseType: "Fahrzeug" } },
    { id: "TASK-000001", recordType: "task", createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-01T08:00:00Z", status: "offen", source: "VORG-000001", notes: null, data: { title: "Werkstatt anrufen", dueAt: "2026-10-07" } },
    { id: "FRIST-000001", recordType: "deadline", createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-01T08:00:00Z", status: "offen", source: "DOC-000001", notes: null, data: { title: "TÜV-Frist", dueAt: "2026-10-06" } },
    { id: "PAY-000001", recordType: "payment", createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-01T08:00:00Z", status: "offen", source: "DOC-000001", notes: null, data: { title: "Werkstattkosten", amountCents: 12500, currency: "EUR" } },
    { id: "TASK-000002", recordType: "task", createdAt: "2026-10-02T08:00:00Z", updatedAt: "2026-10-02T08:00:00Z", status: "offen", source: "DOC-HEALTH", notes: "Ärztliche Unterlage", data: { title: "Heuschnupfen-Unterlagen nachreichen", dueAt: "2026-10-10" } },
  ];
  const documents: FamilyCockpitDocument[] = [
    { id: "DOC-000001", originalName: "TÜV-Bericht.pdf", category: "Fahrzeuge", documentDate: "2026-10-05", status: "hochgeladen", createdAt: "2026-10-05T08:00:00Z", mimeType: "application/pdf", storedPath: "Fahrzeuge/TÜV-Bericht.pdf" },
    { id: "DOC-HEALTH", originalName: "Ärztlicher Bericht.pdf", category: "Gesundheit", documentDate: "2026-10-05", status: "geprüft", createdAt: "2026-10-05T09:00:00Z", mimeType: "application/pdf", storedPath: "Gesundheit/Bericht.pdf" },
  ];
  const relations: FamilyRelation[] = [
    { id: "REL-1", fromType: "person", fromId: "PER-000001", toType: "object", toId: "OBJ-000001", relationType: "gehört zu", createdAt: "2026-10-01", source: "Test", notes: null },
    { id: "REL-2", fromType: "object", fromId: "OBJ-000001", toType: "case", toId: "VORG-000001", relationType: "hat Vorgang", createdAt: "2026-10-01", source: "Test", notes: null },
    { id: "REL-3", fromType: "case", fromId: "VORG-000001", toType: "document", toId: "DOC-000001", relationType: "enthält", createdAt: "2026-10-01", source: "Test", notes: null },
    { id: "REL-4", fromType: "task", fromId: "TASK-000001", toType: "case", toId: "VORG-000001", relationType: "gehört zu", createdAt: "2026-10-01", source: "Test", notes: null },
    { id: "REL-5", fromType: "task", fromId: "TASK-000001", toType: "document", toId: "DOC-000001", relationType: "basiert auf", createdAt: "2026-10-01", source: "Test", notes: null },
    { id: "REL-6", fromType: "deadline", fromId: "FRIST-000001", toType: "case", toId: "VORG-000001", relationType: "gehört zu", createdAt: "2026-10-01", source: "Test", notes: null },
    { id: "REL-7", fromType: "deadline", fromId: "FRIST-000001", toType: "document", toId: "DOC-000001", relationType: "basiert auf", createdAt: "2026-10-01", source: "Test", notes: null },
    { id: "REL-8", fromType: "payment", fromId: "PAY-000001", toType: "case", toId: "VORG-000001", relationType: "gehört zu", createdAt: "2026-10-01", source: "Test", notes: null },
    { id: "REL-9", fromType: "task", fromId: "TASK-000002", toType: "document", toId: "DOC-HEALTH", relationType: "basiert auf", createdAt: "2026-10-02", source: "Test", notes: null },
    { id: "REL-10", fromType: "document", fromId: "DOC-HEALTH", toType: "person", toId: "PER-000001", relationType: "betrifft", createdAt: "2026-10-02", source: "Test", notes: null },
  ];
  const base: FamilyCockpitInput = { records, relations, documents, versions: [{ version: "2.19.0", date: "07.10.2026", label: "Cockpit", newItems: ["Arbeitsübersicht ergänzt"] }], now: new Date("2026-10-07T12:00:00Z") };
  const before = JSON.stringify(base);
  const cockpit = buildFamilyCockpit(base);
  const completedRecords = structuredClone(records);
  const completedTask = completedRecords.find((record) => record.id === "TASK-000001")!;
  completedTask.status = "erledigt"; completedTask.updatedAt = "2026-10-07T13:00:00Z";
  const afterCompletion = buildFamilyCockpit({ ...base, records: completedRecords });
  const vehicleDossier = buildCockpitDossier(base, "OBJ-000001");
  const health = cockpit.priorities.find((item) => item.sourceId === "TASK-000002");
  const news = cockpit.relevantNews.find((item) => item.sourceId === "DOC-000001");
  const results: Array<[CockpitTestResult["id"], string, boolean, string]> = [
    ["cockpit-task", "Aufgabe", cockpit.todos.some((item) => item.id === "TASK-000001" && item.references.some((ref) => ref.id === "VORG-000001") && item.references.some((ref) => ref.id === "DOC-000001")) && !afterCompletion.todos.some((item) => item.id === "TASK-000001") && afterCompletion.completedTaskCount === 1, "Aufgabe, Vorgang und Dokument bleiben verknüpft; erledigte Aufgaben verlassen die aktive Liste und bleiben in der Historie."],
    ["cockpit-deadline", "Frist", cockpit.priorities.some((item) => item.sourceId === "FRIST-000001" && item.urgency === "overdue") && !!cockpit.cases[0]?.nextDeadline, "Dokument, Frist, Zuletzt-wichtig-Priorität, Vorgang und Quelle sind nachvollziehbar."],
    ["cockpit-vehicle", "Fahrzeug", !!vehicleDossier && !vehicleDossier.sensitive && vehicleDossier.title === "Testmotorrad" && ["person", "case", "document", "task", "deadline", "payment"].every((type) => !!vehicleDossier.groups[type as keyof typeof vehicleDossier.groups]?.length), "Person, Fahrzeug, Vorgang, Dokument, Frist, Aufgabe und Kosten sind ohne Datenduplikat verbunden; ein Gesundheitshinweis derselben Person verdeckt die Fahrzeugakte nicht."],
    ["cockpit-health", "Gesundheit", !!health && health.sensitive && health.section === "health" && !/Heuschnupfen|aerztl/i.test(`${health.title} ${health.detail}`), "Der Cockpit-Hinweis bleibt datensparsam und führt in den geschützten Gesundheitsbereich."],
    ["cockpit-news", "Was gibt’s Neues?", !!news && news.sourceId === "DOC-000001" && cockpit.priorities.some((item) => item.sourceId === news.sourceId), "Neuigkeiten und Cockpit verwenden denselben Ursprungsdatensatz; nur ein aktuell relevanter Eintrag wird hervorgehoben."],
  ];
  return results.map(([id, label, passed, summary]) => ({ id, label, status: passed && JSON.stringify(base) === before ? "bestanden" : "fehlgeschlagen", summary }));
}
