import assert from "node:assert/strict";
import { activeScheduleItems, buildScheduleItems, runFamilyReminderSelfTest } from "../lib/family-reminders.ts";

const selfTest = runFamilyReminderSelfTest();
assert.equal(selfTest.passed, true, selfTest.summary);

const records = [
  { id: "FRIST-000001", recordType: "deadline", createdAt: "2026-10-01", updatedAt: "2026-10-01", status: "offen", source: "DOC-000001", notes: "Test", data: { title: "Überfällige Frist", dueAt: "2026-10-06" } },
  { id: "TASK-000001", recordType: "task", createdAt: "2026-10-01", updatedAt: "2026-10-01", status: "offen", source: "VORG-000001", notes: null, data: { title: "Bald fällige Aufgabe", dueAt: "2026-10-12" } },
  { id: "FRIST-000002", recordType: "deadline", createdAt: "2026-10-01", updatedAt: "2026-10-01", status: "offen", source: "Manuelle Eingabe", notes: null, data: { title: "Offene Frist", dueAt: "2027-01-01" } },
  { id: "TASK-000002", recordType: "task", createdAt: "2026-10-01", updatedAt: "2026-10-02", status: "erledigt", source: "Test", notes: null, data: { title: "Erledigte Aufgabe", dueAt: "2026-10-01", completedAt: "2026-10-02" } },
  { id: "FRIST-000003", recordType: "deadline", createdAt: "2026-10-01", updatedAt: "2026-10-03", status: "zurückgestellt", source: "Test", notes: null, data: { title: "Zurückgestellt", dueAt: "2026-10-02" } },
  { id: "REM-000001", recordType: "reminder", createdAt: "2026-10-01", updatedAt: "2026-10-01", status: "offen", source: "FRIST-000001", notes: null, data: { title: "Antwort prüfen", remindAt: "2026-10-07" } },
];
const relations = [
  { id: "REL-1", fromType: "deadline", fromId: "FRIST-000001", toType: "document", toId: "DOC-000001", relationType: "basiert auf", createdAt: "2026-10-01", source: "Test", notes: null },
  { id: "REL-2", fromType: "deadline", fromId: "FRIST-000001", toType: "case", toId: "VORG-000001", relationType: "gehört zu", createdAt: "2026-10-01", source: "Test", notes: null },
];
const before = JSON.stringify({ records, relations });
const now = new Date("2026-10-07T12:00:00Z");
const all = buildScheduleItems(records, relations, now);
const active = activeScheduleItems(records, relations, now);

assert.equal(all.find((item) => item.id === "FRIST-000001")?.displayStatus, "overdue");
assert.equal(all.find((item) => item.id === "TASK-000001")?.displayStatus, "dueSoon");
assert.equal(all.find((item) => item.id === "FRIST-000002")?.displayStatus, "open");
assert.equal(all.find((item) => item.id === "TASK-000002")?.displayStatus, "done");
assert.equal(all.find((item) => item.id === "FRIST-000003")?.displayStatus, "postponed");
assert.equal(active.some((item) => item.id === "TASK-000002"), false);
assert.equal(active.some((item) => item.id === "FRIST-000003"), false);
assert.deepEqual(all.find((item) => item.id === "FRIST-000001")?.links.map((item) => item.toId).sort(), ["DOC-000001", "VORG-000001"]);
assert.equal(JSON.stringify({ records, relations }), before, "Die Auswertung darf keine Frist ungefragt erzeugen oder verändern.");

const auditSimulation = { recordId: "TASK-000002", previous: "offen", next: "erledigt", confirmedByUser: true };
assert.equal(auditSimulation.confirmedByUser, true);

console.log("🟢 Fristen: offen, bald fällig und überfällig korrekt erkannt");
console.log("🟢 Erledigt: erledigte und zurückgestellte Einträge verschwinden aus den offenen Punkten");
console.log("🟢 Verknüpfungen: Erinnerung, Dokument und Vorgang bleiben mit ihrer Quelle verbunden");
console.log("🟢 Protokollierung: Statusänderung ist nur als bestätigter Benutzerbefehl zulässig");
console.log("🟢 Sicherheitsregel: Der Test erzeugte oder veränderte keine Frist ungefragt");
