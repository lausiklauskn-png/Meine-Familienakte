import type { UserAcceptanceRun } from "./practical-acceptance";

export type SystemCheckLevel = "green" | "yellow" | "red";

export type SystemCheckAreaId =
  | "interface"
  | "navigation"
  | "data"
  | "health"
  | "documents"
  | "documentlibrary"
  | "documentintake"
  | "centralintake"
  | "documentscan"
  | "memory"
  | "contextlinking"
  | "model"
  | "relations"
  | "search"
  | "export"
  | "news"
  | "cockpit"
  | "assistantcorrespondence"
  | "changelog"
  | "help"
  | "reminders"
  | "reports"
  | "repair"
  | "consolidation"
  | "assignment"
  | "menuoptimization"
  | "coreconsolidation"
  | "fawogainventory"
  | "fawogaonedrive"
  | "systemcheck";

export type SystemCheckArea = {
  id: SystemCheckAreaId;
  label: string;
  level: SystemCheckLevel;
  summary: string;
  details: string[];
};

export type SystemCheckReport = {
  id: string;
  version: string;
  checkedAt: string;
  mode: "full" | "changes";
  kind: "check" | "repair" | "acceptance";
  overall: SystemCheckLevel;
  areas: SystemCheckArea[];
  repairs: string[];
  greenPoints: SystemCheckGreenPoint[];
  testCases: SystemCheckTestCase[];
  openProblems: SystemCheckProblem[];
  releaseStatus: SystemCheckReleaseStatus;
  sourceReportId?: string;
  automatic?: boolean;
  attempt?: number;
  improved?: boolean;
  backupCreated?: boolean;
  releaseSummary?: SystemCheckReleaseSummary;
  userAcceptance?: UserAcceptanceRun;
};

export type StoredSystemCheck = Pick<SystemCheckReport, "version" | "checkedAt" | "overall"> & {
  id?: string;
  mode?: SystemCheckReport["mode"];
  kind?: SystemCheckReport["kind"];
  areas?: SystemCheckArea[];
  repairs?: string[];
  greenPoints?: SystemCheckGreenPoint[];
  testCases?: SystemCheckTestCase[];
  openProblems?: SystemCheckProblem[];
  releaseStatus?: SystemCheckReleaseStatus;
  sourceReportId?: string;
  automatic?: boolean;
  attempt?: number;
  improved?: boolean;
  backupCreated?: boolean;
  releaseSummary?: SystemCheckReleaseSummary;
  userAcceptance?: UserAcceptanceRun;
};

export type SystemCheckReleaseSummary = {
  websiteVersion: string;
  sourceReference: string;
  analyzedFiles: number;
  newFiles: number;
  unchangedFiles: number;
  changedFiles: number;
  movedFiles: number;
  unavailableFiles: number;
  duplicateFiles: number;
  versionFiles: number;
  recommendedFiles: number;
  reviewFiles: number;
  archivedFiles: number;
  assistantReleasedFiles: number;
  learningStatus: "bestanden" | "offen";
  previewStatus: "bestanden" | "offen";
  relationStatus: "bestanden" | "offen";
  privacyStatus: "bestanden" | "offen";
  originalProtection: "bestanden" | "offen";
  buildStatus: "bestanden" | "offen";
};

export type SystemCheckGreenPoint = {
  areaId: SystemCheckAreaId;
  areaLabel: string;
  summary: string;
};

export type SystemCheckTestCase = {
  id: "fahrzeug" | "haushalt" | "kauf" | "gesundheit" | "export" | "reminders" | "news" | "cockpit-task" | "cockpit-deadline" | "cockpit-vehicle" | "cockpit-health" | "cockpit-news" | "search-speech" | "search-tasks" | "search-help" | "search-health" | "document-library"
    | "menu-health" | "menu-family" | "menu-home" | "menu-vehicles" | "menu-purchases" | "menu-medical" | "menu-benefits" | "menu-work" | "menu-assessment" | "menu-correspondence" | "menu-sources" | "menu-inbox"
    | "menu-document-link" | "menu-case-link" | "menu-object-link" | "menu-person-link" | "menu-deadline-link" | "menu-dossier-order"
    | "intake-drag-drop" | "intake-existing-case" | "intake-unclear" | "intake-local-folder" | "intake-onedrive" | "intake-duplicate" | "intake-health" | "intake-cockpit" | "intake-news" | "intake-search" | "intake-interactivity" | "intake-reparaturservice" | "intake-canonical-area" | "intake-vertragsportal" | "intake-outlook-msg" | "intake-sleep-lab" | "intake-sleep-provider" | "intake-neutral-photo" | "intake-personal-medical" | "intake-record-inspection" | "intake-assessment-confirmation"
    | "scan-one-page" | "scan-multi-page" | "scan-retake" | "scan-rotate" | "scan-reorder" | "scan-abort" | "scan-separate-documents" | "scan-shared-pipeline"
    | "memory-speech" | "memory-photo" | "memory-series" | "memory-unclear" | "memory-open" | "memory-resolution" | "memory-partial" | "memory-task" | "memory-document" | "memory-writing" | "memory-health" | "memory-interactivity"
    | "context-memory-before-document" | "context-document-before-memory" | "context-ambiguous" | "context-open-point" | "context-partial" | "context-unlink" | "context-timeline"
    | "register-corruption" | "backup-restore" | "health-redaction" | "relation-resolution" | "open-point-match" | "canonical-categories" | "storage-replicas" | "memory-lifecycle" | "relation-integrity" | "standard-command" | "negative-system-check" | "integrated-flow"
    | "fawoga-source" | "fawoga-recommended" | "fawoga-duplicate" | "fawoga-low" | "fawoga-photo-series" | "fawoga-summary" | "fawoga-safety" | "fawoga-shared-pipeline"
    | `fawoga-od-${string}`
    | `central-${string}`
    | `assistant-${string}`;
  label: string;
  status: "bestanden" | "warnung" | "fehlgeschlagen";
  summary: string;
};

export type SystemCheckReleaseStatus = "freigegeben" | "prüfung_empfohlen" | "nicht_freigegeben";

export type SystemCheckProblem = {
  areaId: SystemCheckAreaId;
  areaLabel: string;
  level: Exclude<SystemCheckLevel, "green">;
  summary: string;
  cause: string;
  nextStep: string;
};

export function systemCheckOverall(areas: SystemCheckArea[]): SystemCheckLevel {
  if (areas.some((area) => area.level === "red")) return "red";
  if (areas.some((area) => area.level === "yellow")) return "yellow";
  return "green";
}

export const systemCheckLevelLabel: Record<SystemCheckLevel, string> = {
  green: "GRÜN",
  yellow: "GELB",
  red: "ROT",
};

export const systemCheckOverallLabel: Record<SystemCheckLevel, string> = {
  green: "SYSTEM FUNKTIONSFÄHIG",
  yellow: "PRÜFUNG EMPFOHLEN",
  red: "UPDATE NICHT FREIGEBEN",
};
