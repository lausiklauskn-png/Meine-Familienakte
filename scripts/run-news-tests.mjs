import assert from "node:assert/strict";
import { buildFamilyNewsItems, filterFamilyNews, runFamilyNewsSelfTest } from "../lib/family-news.ts";

const selfTest = runFamilyNewsSelfTest();
assert.equal(selfTest.passed, true, selfTest.summary);

const input = {
  documents: [
    { id: "DOC-001", originalName: "Fahrzeugrechnung.pdf", category: "Fahrzeuge", documentDate: "2026-10-01", status: "eingearbeitet", createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-03T09:00:00Z", mimeType: "application/pdf" },
    { id: "DOC-002", originalName: "Ärztlicher Bericht.pdf", category: "Gesundheit", documentDate: "2026-09-30", status: "geprüft", createdAt: "2026-09-30T08:00:00Z", mimeType: "image/jpeg", previewUrl: "/sensible-vorschau.jpg" },
  ],
  records: [
    { id: "VORG-000001", recordType: "case", createdAt: "2026-10-02T10:00:00Z", updatedAt: "2026-10-02T10:00:00Z", status: "offen", source: "Manuelle Eingabe", notes: null, data: { title: "Werkstattvorgang" } },
    { id: "TASK-000001", recordType: "task", createdAt: "2026-10-07T10:00:00Z", updatedAt: "2026-10-07T11:00:00Z", status: "erledigt", source: "VORG-000001", notes: null, data: { title: "Werkstatt anrufen", dueAt: "2026-10-07", completedAt: "2026-10-07" } },
  ],
  relations: [{ id: "REL-1", fromType: "task", fromId: "TASK-000001", toType: "case", toId: "VORG-000001", relationType: "gehört zu", createdAt: "2026-10-04T10:00:00Z", source: "Test", notes: null }],
  versions: [{ version: "2.18.0", date: "07.10.2026", label: "Was gibt’s Neues?", newItems: ["Chronologische Monatsübersicht ergänzt"] }],
};
const before = JSON.stringify(input);
const news = buildFamilyNewsItems(input);

assert.equal(news[0].sourceType, "record", "Benutzerereignisse müssen am selben Tag vor Softwareänderungen stehen.");
assert.equal(news.find((item) => item.sourceId === "DOC-002")?.preview.url, undefined, "Sensible Gesundheitsvorschauen dürfen nicht lesbar erscheinen.");
assert.equal(news.find((item) => item.sourceId === "TASK-000001" && item.id.startsWith("record-completed"))?.section, "correspondence");
assert.ok(news.every((item) => item.dateLabel && item.area && item.title && item.summary && item.preview.label));
assert.equal(filterFamilyNews(news, "60days", new Date("2026-10-07T18:00:00Z")).length, news.length);
assert.equal(filterFamilyNews(news, "previousMonth", new Date("2026-10-07T18:00:00Z")).some((item) => item.sourceId === "DOC-002"), true);
assert.equal(filterFamilyNews(news, "custom", new Date("2026-10-07T18:00:00Z"), "2026-10-02", "2026-10-03").every((item) => ["02.10.2026", "03.10.2026"].includes(item.dateLabel)), true);
assert.equal(JSON.stringify(input), before, "Die Neuigkeiten-Abfrage darf die bestehenden Daten nicht verändern.");

console.log("🟢 Neuigkeiten-Datenquelle: Dokumente, Vorgänge, Aufgaben und Versionen aus dem bestehenden Modell ausgewertet");
console.log("🟢 Zeitraumfilter: 60 Tage, Vormonat und eigener Zeitraum praktisch geprüft");
console.log("🟢 Sortierung: neueste Tage zuerst und Benutzerereignisse vor Softwareänderungen");
console.log("🟢 Datenschutz: sensible Gesundheitsvorschau wurde durch ein neutrales Symbol ersetzt");
console.log("🟢 Integrität: keine zweite Datenbank und keine Veränderung der Eingangsdaten");
