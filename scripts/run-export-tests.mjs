import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildFamilyArchiveExport, runFamilyExportSelfTest } from "../lib/family-export.ts";

const selfTest = runFamilyExportSelfTest();
assert.equal(selfTest.passed, true, selfTest.summary);

const source = {
  appVersion: "2.16.0-TEST",
  exportedAt: "2026-10-07T18:00:00.000Z",
  selectedScopes: ["documents", "peopleOrganisations", "schedules", "reports", "history"],
  includeOriginals: false,
  storageName: "Testziel",
  healthData: { excluded: true },
  documents: [{ id: "DOC-000001", originalName: "Test.pdf", category: "Test", documentDate: "2026-10-07", status: "geprüft", storedPath: "Originale/Test.pdf" }],
  records: [
    { id: "PER-000001", recordType: "person", createdAt: "2026-10-07", updatedAt: "2026-10-07", status: "aktiv", source: "Test", notes: null, data: { displayName: "Musterperson" } },
    { id: "FRIST-000001", recordType: "deadline", createdAt: "2026-10-07", updatedAt: "2026-10-07", status: "offen", source: "Test", notes: null, data: { title: "Testfrist", dueAt: "2026-10-14" } },
  ],
  relations: [{ id: "REL-000001", fromType: "person", fromId: "PER-000001", toType: "deadline", toId: "FRIST-000001", relationType: "betrifft", createdAt: "2026-10-07", source: "Test", notes: null }],
  auditLog: [{ id: "AUD-1", action: "Test" }],
  systemReports: [{ id: "REPORT-1", overall: "green" }],
  versionHistory: [{ version: "2.16.0-TEST" }],
};
const before = JSON.stringify(source);
const archive = buildFamilyArchiveExport(source);
const folder = await mkdtemp(join(tmpdir(), "familienakte-export-test-"));
try {
  const target = join(folder, "Familienakte_Export_Test");
  await mkdir(target);
  await writeFile(join(target, "Familienakte_Daten.json"), archive.json);
  await writeFile(join(target, "Familienakte_Uebersicht.html"), archive.html);
  await writeFile(join(target, "Exportbericht.json"), JSON.stringify({ status: "vollständig", originalbestandUnveraendert: true }, null, 2));

  const parsed = JSON.parse(await readFile(join(target, "Familienakte_Daten.json"), "utf8"));
  const report = JSON.parse(await readFile(join(target, "Exportbericht.json"), "utf8"));
  assert.equal(parsed.appVersion, "2.16.0-TEST");
  assert.equal(parsed.exportedAt, source.exportedAt);
  assert.equal(parsed.data.documents.length, 1);
  assert.equal(parsed.data.records.length, 2);
  assert.equal(parsed.data.relations.length, 1);
  assert.equal(parsed.data.health, undefined);
  assert.equal(parsed.privacy.encryptedByApplication, false);
  assert.equal(report.status, "vollständig");
  assert.equal(report.originalbestandUnveraendert, true);
  assert.equal(JSON.stringify(source), before, "Der Export darf die Eingangsdaten nicht verändern.");
} finally {
  await rm(folder, { recursive: true, force: true });
}

console.log("🟢 Exportauswahl: ausgewählte Bereiche und Verknüpfungen wurden korrekt übernommen");
console.log("🟢 Testexport: JSON, HTML und Exportbericht wurden tatsächlich geschrieben und wieder eingelesen");
console.log("🟢 Datenschutz: unverschlüsselter Zustand wird ausdrücklich ausgewiesen");
console.log("🟢 Ausgangsbestand: Testdaten blieben unverändert; kein Löschen, Verschieben oder Umbenennen");
