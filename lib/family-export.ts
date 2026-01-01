import type { FamilyRecordUnion, FamilyRelation } from "./family-data-model";

export const FAMILY_EXPORT_VERSION = 1 as const;

export type FamilyExportScope =
  | "health"
  | "documents"
  | "peopleOrganisations"
  | "objectsCases"
  | "schedules"
  | "reports"
  | "history";

export const familyExportScopeLabels: Record<FamilyExportScope, string> = {
  health: "Gesundheits- und Leistungsakte",
  documents: "Dokumentenübersicht",
  peopleOrganisations: "Personen und Organisationen",
  objectsCases: "Objekte und Vorgänge",
  schedules: "Aufgaben, Fristen und Erinnerungen",
  reports: "Prüfberichte",
  history: "Versionshistorie / Changelog",
};

export const allFamilyExportScopes = Object.keys(familyExportScopeLabels) as FamilyExportScope[];

export type ExportDocumentReference = {
  id: string;
  originalName: string;
  category: string;
  documentDate: string | null;
  status: string;
  storageType?: string | null;
  storedPath?: string | null;
  relativePath?: string | null;
  source?: string | null;
};

export type FamilyArchiveExportInput = {
  appVersion: string;
  exportedAt: string;
  selectedScopes: FamilyExportScope[];
  includeOriginals: boolean;
  storageName: string;
  healthData: unknown;
  documents: ExportDocumentReference[];
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  auditLog: unknown[];
  systemReports: unknown[];
  versionHistory: unknown[];
};

export type FamilyArchiveExportData = {
  format: "Me, Myself and I – Familienakte Export";
  formatVersion: typeof FAMILY_EXPORT_VERSION;
  appVersion: string;
  exportedAt: string;
  selectedScopes: Array<{ id: FamilyExportScope; label: string }>;
  privacy: {
    storageName: string;
    encryptedByApplication: false;
    originalsRequested: boolean;
    note: string;
  };
  data: {
    health?: unknown;
    documents?: ExportDocumentReference[];
    records?: FamilyRecordUnion[];
    relations?: FamilyRelation[];
    auditLog?: unknown[];
    systemReports?: unknown[];
    versionHistory?: unknown[];
  };
};

const recordScopes: Record<FamilyExportScope, FamilyRecordUnion["recordType"][]> = {
  health: [],
  documents: ["document"],
  peopleOrganisations: ["person", "organisation"],
  objectsCases: ["object", "case", "event", "payment", "contract", "warranty"],
  schedules: ["deadline", "task", "reminder"],
  reports: [],
  history: [],
};

function selectedRecordTypes(scopes: FamilyExportScope[]) {
  return new Set(scopes.flatMap((scope) => recordScopes[scope]));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderRows(items: Array<{ label: string; value: string | number }>) {
  return items.map((item) => `<tr><th>${escapeHtml(item.label)}</th><td>${escapeHtml(item.value)}</td></tr>`).join("");
}

export function buildFamilyArchiveExport(input: FamilyArchiveExportInput): { data: FamilyArchiveExportData; json: string; html: string } {
  const selected = new Set(input.selectedScopes);
  const recordTypes = selectedRecordTypes(input.selectedScopes);
  const records = input.records.filter((record) => recordTypes.has(record.recordType));
  const includedIds = new Set(records.map((record) => record.id));
  const relations = input.relations.filter((relation) => includedIds.has(relation.fromId) || includedIds.has(relation.toId));
  const data: FamilyArchiveExportData = {
    format: "Me, Myself and I – Familienakte Export",
    formatVersion: FAMILY_EXPORT_VERSION,
    appVersion: input.appVersion,
    exportedAt: input.exportedAt,
    selectedScopes: input.selectedScopes.map((id) => ({ id, label: familyExportScopeLabels[id] })),
    privacy: {
      storageName: input.storageName,
      encryptedByApplication: false,
      originalsRequested: input.includeOriginals,
      note: "Der Export wird von der Familienakte nicht verschlüsselt. Ein geschützter Datenträger muss außerhalb der Familienakte eingerichtet werden.",
    },
    data: {},
  };
  if (selected.has("health")) data.data.health = input.healthData;
  if (selected.has("documents")) data.data.documents = input.documents;
  if (records.length) {
    data.data.records = records;
    data.data.relations = relations;
    data.data.auditLog = input.auditLog;
  }
  if (selected.has("reports")) data.data.systemReports = input.systemReports;
  if (selected.has("history")) data.data.versionHistory = input.versionHistory;

  const sections = [
    ["Dokumente", data.data.documents?.length || 0],
    ["Datensätze", data.data.records?.length || 0],
    ["Verknüpfungen", data.data.relations?.length || 0],
    ["Prüfberichte", data.data.systemReports?.length || 0],
    ["Versionseinträge", data.data.versionHistory?.length || 0],
  ] as Array<[string, number]>;
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Familienakte Export</title><style>body{font-family:Arial,sans-serif;max-width:960px;margin:36px auto;padding:0 20px;color:#17344d}h1{color:#0b4f78}table{border-collapse:collapse;width:100%;margin:18px 0}th,td{border:1px solid #cbd8e2;padding:9px;text-align:left}th{background:#eef5f9}.note{padding:14px;background:#fff7d6;border-left:4px solid #d7a400}small{color:#536b7b}</style></head><body><h1>Me, Myself and I – Familienakte</h1><p>Lesbare Exportübersicht. Die maschinenlesbaren vollständigen Daten stehen in <strong>Familienakte_Daten.json</strong>.</p><table>${renderRows([
    { label: "Anwendungsversion", value: data.appVersion },
    { label: "Exportzeitpunkt", value: data.exportedAt },
    { label: "Speicherort", value: data.privacy.storageName },
    { label: "Originaldateien angefordert", value: data.privacy.originalsRequested ? "Ja" : "Nein" },
    { label: "Verschlüsselung durch die Familienakte", value: "Nein" },
  ])}</table><h2>Ausgewählte Bereiche</h2><ul>${data.selectedScopes.map((scope) => `<li>${escapeHtml(scope.label)}</li>`).join("")}</ul><h2>Umfang</h2><table>${sections.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${value}</td></tr>`).join("")}</table><p class="note">${escapeHtml(data.privacy.note)}</p><small>Originalunterlagen bleiben verbindlich. Der Export verändert den Ausgangsbestand nicht.</small></body></html>`;
  return { data, json: JSON.stringify(data, null, 2), html };
}

export function runFamilyExportSelfTest() {
  const input: FamilyArchiveExportInput = {
    appVersion: "TEST-1.0",
    exportedAt: "2026-10-07T12:00:00.000Z",
    selectedScopes: ["documents", "peopleOrganisations", "schedules", "reports", "history"],
    includeOriginals: false,
    storageName: "Testordner",
    healthData: { private: true },
    documents: [{ id: "DOC-TEST", originalName: "Test.pdf", category: "Test", documentDate: "2026-10-01", status: "geprüft", storedPath: "Test.pdf" }],
    records: [
      { id: "PER-000001", recordType: "person", createdAt: "2026-10-01", updatedAt: "2026-10-01", status: "aktiv", source: "Test", notes: null, data: { displayName: "Testperson" } },
      { id: "FRIST-000001", recordType: "deadline", createdAt: "2026-10-01", updatedAt: "2026-10-01", status: "offen", source: "Test", notes: null, data: { title: "Testfrist", dueAt: "2026-10-10" } },
    ],
    relations: [{ id: "REL-1", fromType: "person", fromId: "PER-000001", toType: "deadline", toId: "FRIST-000001", relationType: "betrifft", createdAt: "2026-10-01", source: "Test", notes: null }],
    auditLog: [{ action: "test" }],
    systemReports: [{ overall: "green" }],
    versionHistory: [{ version: "TEST-1.0" }],
  };
  const before = JSON.stringify(input);
  const result = buildFamilyArchiveExport(input);
  const parsed = JSON.parse(result.json) as FamilyArchiveExportData;
  const passed = parsed.appVersion === input.appVersion
    && parsed.exportedAt === input.exportedAt
    && parsed.data.documents?.length === 1
    && parsed.data.records?.length === 2
    && parsed.data.relations?.length === 1
    && result.html.includes("Familienakte_Daten.json")
    && parsed.privacy.encryptedByApplication === false
    && JSON.stringify(input) === before;
  return { passed, summary: passed ? "Auswahl, Version, Datum, Datensätze, Verknüpfungen und unveränderter Ausgangsbestand praktisch geprüft." : "Der Export-Selbsttest ist fehlgeschlagen." };
}
