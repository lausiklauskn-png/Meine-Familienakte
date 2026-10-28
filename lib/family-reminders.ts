import type { FamilyRecordUnion, FamilyRelation } from "./family-data-model";

export const FAMILY_REMINDERS_VERSION = 1 as const;

export type ScheduleDisplayStatus = "open" | "dueSoon" | "overdue" | "done" | "postponed";

export const scheduleStatusLabels: Record<ScheduleDisplayStatus, string> = {
  open: "offen",
  dueSoon: "bald fällig",
  overdue: "überfällig",
  done: "erledigt",
  postponed: "zurückgestellt",
};

export type ScheduleItem = {
  id: string;
  recordType: "deadline" | "task" | "reminder";
  title: string;
  date: string | null;
  displayStatus: ScheduleDisplayStatus;
  status: string;
  source: string | null;
  notes: string | null;
  links: FamilyRelation[];
  createdAt: string;
  updatedAt: string;
};

function dayStart(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

export function classifyDateUrgency(value: string | null, now = new Date(), soonDays = 7): Extract<ScheduleDisplayStatus, "open" | "dueSoon" | "overdue"> {
  if (!value) return "open";
  const target = new Date(`${value.length === 10 ? `${value}T12:00:00` : value}`);
  if (Number.isNaN(target.getTime())) return "open";
  const today = dayStart(now);
  const dueDay = dayStart(target);
  if (dueDay < today) return "overdue";
  if (dueDay <= today + soonDays * 86400000) return "dueSoon";
  return "open";
}

function recordDate(record: FamilyRecordUnion) {
  if (record.recordType === "deadline" || record.recordType === "task") return record.data.dueAt || null;
  if (record.recordType === "reminder") return record.data.remindAt || null;
  return null;
}

function recordTitle(record: FamilyRecordUnion) {
  if (record.recordType === "deadline" || record.recordType === "task" || record.recordType === "reminder") return record.data.title || record.id;
  return record.id;
}

export function classifyScheduleRecord(record: FamilyRecordUnion, now = new Date(), soonDays = 7): ScheduleDisplayStatus {
  if (record.status === "erledigt") return "done";
  if (record.status === "zurückgestellt") return "postponed";
  return classifyDateUrgency(recordDate(record), now, soonDays);
}

export function buildScheduleItems(records: FamilyRecordUnion[], relations: FamilyRelation[], now = new Date()): ScheduleItem[] {
  const weights: Record<ScheduleDisplayStatus, number> = { overdue: 0, dueSoon: 1, open: 2, postponed: 3, done: 4 };
  return records
    .filter((record): record is Extract<FamilyRecordUnion, { recordType: "deadline" | "task" | "reminder" }> => ["deadline", "task", "reminder"].includes(record.recordType))
    .map((record) => ({
      id: record.id,
      recordType: record.recordType,
      title: recordTitle(record),
      date: recordDate(record),
      displayStatus: classifyScheduleRecord(record, now),
      status: record.status,
      source: record.source,
      notes: record.notes,
      links: relations.filter((relation) => relation.fromId === record.id || relation.toId === record.id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }))
    .sort((a, b) => weights[a.displayStatus] - weights[b.displayStatus] || (a.date || "9999-12-31").localeCompare(b.date || "9999-12-31") || b.createdAt.localeCompare(a.createdAt));
}

export function activeScheduleItems(records: FamilyRecordUnion[], relations: FamilyRelation[], now = new Date()) {
  return buildScheduleItems(records, relations, now).filter((item) => !["done", "postponed"].includes(item.displayStatus));
}

export function runFamilyReminderSelfTest() {
  const unchangedRecords: FamilyRecordUnion[] = [
    { id: "FRIST-000001", recordType: "deadline", createdAt: "2026-10-01", updatedAt: "2026-10-01", status: "offen", source: "DOC-000001", notes: null, data: { title: "Überfällige Antwort", dueAt: "2026-10-06" } },
    { id: "TASK-000001", recordType: "task", createdAt: "2026-10-01", updatedAt: "2026-10-01", status: "offen", source: "VORG-000001", notes: null, data: { title: "Bald erledigen", dueAt: "2026-10-10" } },
    { id: "FRIST-000002", recordType: "deadline", createdAt: "2026-10-01", updatedAt: "2026-10-01", status: "offen", source: "Test", notes: null, data: { title: "Später", dueAt: "2026-12-01" } },
    { id: "TASK-000002", recordType: "task", createdAt: "2026-10-01", updatedAt: "2026-10-01", status: "erledigt", source: "Test", notes: null, data: { title: "Erledigt", dueAt: "2026-10-01", completedAt: "2026-10-02" } },
    { id: "REM-000001", recordType: "reminder", createdAt: "2026-10-01", updatedAt: "2026-10-01", status: "offen", source: "FRIST-000001", notes: null, data: { title: "Frist erinnern", remindAt: "2026-10-07" } },
  ];
  const relations: FamilyRelation[] = [{ id: "REL-1", fromType: "deadline", fromId: "FRIST-000001", toType: "document", toId: "DOC-000001", relationType: "basiert auf", createdAt: "2026-10-01", source: "Test", notes: null }];
  const before = JSON.stringify({ unchangedRecords, relations });
  const items = buildScheduleItems(unchangedRecords, relations, new Date("2026-10-07T12:00:00Z"));
  const active = activeScheduleItems(unchangedRecords, relations, new Date("2026-10-07T12:00:00Z"));
  const passed = items.find((item) => item.id === "FRIST-000001")?.displayStatus === "overdue"
    && items.find((item) => item.id === "TASK-000001")?.displayStatus === "dueSoon"
    && items.find((item) => item.id === "FRIST-000002")?.displayStatus === "open"
    && items.find((item) => item.id === "TASK-000002")?.displayStatus === "done"
    && !active.some((item) => item.id === "TASK-000002")
    && items.find((item) => item.id === "FRIST-000001")?.links[0]?.toId === "DOC-000001"
    && JSON.stringify({ unchangedRecords, relations }) === before;
  return { passed, summary: passed ? "Offen, bald fällig, überfällig, erledigt und Quellenverknüpfung praktisch geprüft." : "Der Fristen- und Erinnerungs-Selbsttest ist fehlgeschlagen." };
}
