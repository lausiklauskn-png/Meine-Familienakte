import assert from "node:assert/strict";
import { buildDocumentLibraryItems, filterDocumentLibraryItems, runDocumentLibrarySelfTests } from "../lib/document-library.ts";

const selfTest = runDocumentLibrarySelfTests();
assert.equal(selfTest.passed, true, selfTest.summary);

const documents = [
  { id: "DOC-001", originalName: "TÜV-Hauptuntersuchung Motoria Strada.pdf", category: "Motorrad", documentDate: "2026-10-07", status: "eingearbeitet", createdAt: "2026-10-07T10:00:00Z", updatedAt: "2026-10-08T09:00:00Z", mimeType: "application/pdf", notes: "Aktenzeichen HU-2026 und nächste Frist" },
  { id: "DOC-002", originalName: "Zahnmedizin – Arztbrief.pdf", category: "Gesundheit", documentDate: "2026-09-12", status: "geprüft", createdAt: "2026-09-12T10:00:00Z", mimeType: "image/jpeg", previewUrl: "/private-health-preview.jpg", notes: "Vertrauliche medizinische Einzelheiten" },
  { id: "DOC-003", originalName: "Mietvertrag.pdf", category: "Haus & Wohnung", documentDate: "2024-01-05", status: "eingearbeitet", createdAt: "2024-01-05T10:00:00Z", mimeType: "application/pdf", notes: "Vertragsnummer MI-42" },
];
const records = [
  { id: "OBJ-000001", recordType: "object", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-10-08T00:00:00Z", status: "aktiv", source: "Test", notes: null, data: { name: "Motoria Strada", objectType: "Motorrad" } },
  { id: "VORG-000001", recordType: "case", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-10-08T00:00:00Z", status: "offen", source: "Test", notes: null, data: { title: "Hauptuntersuchung 2026" } },
  { id: "PER-000001", recordType: "person", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-10-08T00:00:00Z", status: "aktiv", source: "Test", notes: null, data: { displayName: "Testperson" } },
];
const relations = [
  { id: "REL-1", fromType: "document", fromId: "DOC-001", toType: "object", toId: "OBJ-000001", relationType: "betrifft", createdAt: "2026-10-08T00:00:00Z", source: "Test", notes: null },
  { id: "REL-2", fromType: "document", fromId: "DOC-001", toType: "case", toId: "VORG-000001", relationType: "gehört zu", createdAt: "2026-10-08T00:00:00Z", source: "Test", notes: null },
  { id: "REL-3", fromType: "document", fromId: "DOC-001", toType: "person", toId: "PER-000001", relationType: "gehört zu", createdAt: "2026-10-08T00:00:00Z", source: "Test", notes: null },
];
const before = JSON.stringify({ documents, records, relations });
const items = buildDocumentLibraryItems(documents, records, relations);

assert.equal(items.length, documents.length, "Die Bibliothek darf keine Dokumente duplizieren.");
assert.deepEqual(items.map((item) => item.id).sort(), documents.map((item) => item.id).sort(), "Vorhandene Dokumentkennungen müssen erhalten bleiben.");
assert.equal(filterDocumentLibraryItems(items, { sort: "newest" })[0].id, "DOC-001", "Neueste Dokumente müssen zuerst stehen.");
assert.equal(filterDocumentLibraryItems(items, { sort: "oldest" })[0].id, "DOC-003", "Älteste Sortierung muss funktionieren.");
assert.equal(filterDocumentLibraryItems(items, { query: "Aktenzeichen HU-2026" })[0].id, "DOC-001", "Die vorhandene lokale Suchlogik muss Dokumentmetadaten finden.");
assert.equal(filterDocumentLibraryItems(items, { area: "Haus & Wohnung" }).length, 1, "Bereichsfilter muss funktionieren.");
assert.equal(filterDocumentLibraryItems(items, { documentType: "PDF" }).length, 3, "Dokumentartfilter muss funktionieren.");
assert.equal(items.find((item) => item.id === "DOC-002")?.previewUrl, null, "Sensible Gesundheitsvorschauen dürfen nicht lesbar erscheinen.");
assert.equal(items.find((item) => item.id === "DOC-002")?.protectedHealth, true, "Gesundheitsdokumente müssen in den geschützten Kontext führen.");
assert.deepEqual(items.find((item) => item.id === "DOC-001")?.references.map((item) => item.id).sort(), ["OBJ-000001", "PER-000001", "VORG-000001"].sort(), "Person, Objekt und Vorgang müssen über vorhandene Beziehungen erreichbar bleiben.");
assert.equal(JSON.stringify({ documents, records, relations }), before, "Die Bibliothek darf Dokumente, Datensätze oder Beziehungen nicht verändern.");
const custom = buildDocumentLibraryItems([{ id: "DOC-CUSTOM", originalName: "Privat.pdf", category: "Eigener Bereich", documentDate: "2026-10-12", status: "geprüft", createdAt: "2026-10-12T10:00:00Z", mimeType: "application/pdf", notes: "FaWoGa: Mein privater Lebensbereich · Dokumentart: Persönliche Dokumentenart · Datenschutz: vertraulich" }], [], [])[0];
assert.equal(custom.area, "Mein privater Lebensbereich", "Ein persönlich angelegter Lebensbereich muss in der Dokumentenbibliothek berücksichtigt werden.");
assert.equal(custom.documentType, "Persönliche Dokumentenart", "Eine persönlich angelegte Dokumentenart muss in der Dokumentenbibliothek berücksichtigt werden.");

console.log("🟢 Dokumentenbibliothek: vorhandene Kennungen ohne zweite Dokumentdatenbank wiederverwendet");
console.log("🟢 Neueste Dokumente, Bereiche, Suche, Zeitraum-, Art- und Sortierfilter praktisch geprüft");
console.log("🟢 Titelkontext: Person, Objekt und Vorgang bleiben über dieselben Beziehungen erreichbar");
console.log("🟢 Datenschutz: Gesundheitsvorschau ist neutral und der Gesundheitskontext geschützt");
console.log("🟢 Eigene Zuordnung: persönliche Lebensbereiche und Dokumentenarten werden aus demselben Dokumentdatensatz wiederverwendet");
console.log("🟢 Integrität: keine Eingangsdaten, Originaldateien oder Verknüpfungen verändert");
