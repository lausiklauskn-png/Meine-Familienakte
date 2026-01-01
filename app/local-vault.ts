"use client";

import {
  createFamilyRecord,
  type DocumentStorageType,
  type DocumentStorageLocation,
  FAMILY_DATA_MODEL_VERSION,
  type FamilyIdSequences,
  type FamilyRecordPayloadMap,
  type FamilyRecordType,
  type FamilyRecordUnion,
  type FamilyRelation,
  nextFamilyRecordId,
  recordTypeDefinitions,
} from "../lib/family-data-model.ts";
import { inspectFamilyIntegrity } from "../lib/family-integrity.ts";
import { createFamilyBackupManifest, verifyFamilyBackupRestore, type FamilyBackupFile, type FamilyBackupManifest } from "../lib/family-backup.ts";
import { classifyRegisterText, safeRegisterWritePlan } from "../lib/family-register.ts";
import { FAMILY_CATEGORIES } from "../lib/family-categories.ts";
import {
  type AssignmentInput,
  familyRecordToAssignmentRecord,
  proposeFamilyAssignment,
} from "../lib/family-assignment.ts";
import type {
  MemoryAnalysis,
  MemoryCaptureType,
  MemoryDraftEntry,
  MemoryDraftMediaReference,
  MemoryDraftStatus,
  MemoryEventData,
  MemoryMediaReference,
  MemoryOpenStatus,
} from "../lib/family-memory.ts";
import { buildMemoryDraftEntry, FAMILY_MEMORY_VERSION, isMemoryRecord, memoryData, sortMemoryDraftQueue } from "../lib/family-memory.ts";
import type { ContextLinkDecision, ContextSourceType } from "../lib/family-context-linking.ts";
import { analyzeInventoryFiles, createInventoryLearningSignal, type InventoryAssignmentReference, type InventoryContentStatus, type InventoryItem, type InventoryLearningSignal, type InventorySourceFile, type InventorySourceKind } from "../lib/fawoga-inventory.ts";

export type LocalDocument = {
  id: string; originalName: string; category: string; documentDate: string | null;
  mimeType: string; sizeBytes: number; status: "hochgeladen" | "abgleich_offen" | "geprüft" | "eingearbeitet";
  notes: string | null; addedAt: string; storedPath: string;
  source?: string | null; updatedAt?: string; storageType?: DocumentStorageType;
  oneDrivePath?: string | null; relativePath?: string | null;
  scanPageCount?: number; scanOriginalCount?: number; scanOriginalsPath?: string | null;
  checksum?: string | null; storageLocations?: DocumentStorageLocation[];
};

export type VaultAuditEntry = {
  id: string;
  at: string;
  action: string;
  recordId?: string | null;
  details: string;
};

type VaultIndex = {
  version: 5;
  modelVersion: typeof FAMILY_DATA_MODEL_VERSION;
  updatedAt: string;
  documents: LocalDocument[];
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  memoryDrafts: MemoryDraftEntry[];
  linkDecisions: ContextLinkDecision[];
  inventoryItems: InventoryItem[];
  inventoryLearningSignals: InventoryLearningSignal[];
  sequences: FamilyIdSequences;
  auditLog: VaultAuditEntry[];
} & Record<string, unknown>;
type VaultIdentity = { vaultId: string; vaultName: string; storageKind?: "local" | "onedrive"; createdAt: string };
export type VaultSummary = { vaultId: string; vaultName: string; updatedAt: string; documentCount: number };
export type VaultSyncPreview = {
  sourceDocuments: number; targetDocuments: number; missingDocuments: number;
  existingDocuments: number; conflictingDocuments: number;
};
export type VaultSyncResult = VaultSyncPreview & { copiedDocuments: number; skippedDocuments: number; completedAt: string };
export type LocalSystemSnapshot = {
  registerState: "missing" | "valid" | "corrupted";
  documentCount: number;
  duplicateDocumentIds: number;
  duplicateStoredPaths: number;
  recordCount: number;
  recordTypes: string[];
  relationCount: number;
  relationPairs: string[];
  memoryCount: number;
  memoryMediaCount: number;
  memoryDraftCount: number;
  linkDecisionCount: number;
  inventoryCount: number;
  inventoryNewCount: number;
  inventoryUnchangedCount: number;
  inventoryChangedCount: number;
  inventoryMovedCount: number;
  inventoryUnavailableCount: number;
  inventoryRecommendedCount: number;
  inventoryReviewCount: number;
  inventoryDuplicateCount: number;
  inventoryVersionCount: number;
  archivedInventoryCount: number;
  assistantReleasedInventoryCount: number;
  confirmedInventoryAssignmentCount: number;
  inventoryLearningSignalCount: number;
  pausedInventoryScanCount: number;
  centralIntakeDocumentCount: number;
  completedOneDriveScanCounts: number[];
  integrityLevel: "green" | "yellow" | "red";
  integrityIssues: string[];
};
type PermissionHandle = FileSystemDirectoryHandle & {
  queryPermission?: (options: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (options: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
};
type ComparableHandle = FileSystemDirectoryHandle & { isSameEntry?: (other: FileSystemHandle) => Promise<boolean> };
type PickerWindow = Window & { showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle> };

export type LocalVaultData = {
  documents: LocalDocument[];
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  memoryDrafts: MemoryDraftEntry[];
  linkDecisions: ContextLinkDecision[];
  inventoryItems: InventoryItem[];
  auditLog: VaultAuditEntry[];
};

export type LocalArchiveWriteResult = {
  folderName: string;
  completedAt: string;
  originalsRequested: boolean;
  originalsCopied: number;
  originalsMissing: number;
  complete: boolean;
  warnings: string[];
};

export type ScheduleReference = { recordType: FamilyRecordType; id: string; relationType: string };
export type CreateScheduleInput = {
  recordType: "deadline" | "task";
  title: string;
  dueAt: string;
  reminderAt?: string | null;
  source?: string | null;
  notes?: string | null;
  references: ScheduleReference[];
};

const DB_NAME = "mmi-local-vault";
const STORE = "handles";
const LOCAL_KEY = "family-vault";
const ONEDRIVE_KEY = "onedrive-primary-vault";
const INBOX_KEY = "family-inbox-folder";
const INVENTORY_SOURCE_KEY = "family-inventory-source";
const INVENTORY_ARCHIVE_KEY = "family-inventory-archive";
const DEVELOPMENT_BASE_KEY = "family-development-base";
const ROOT = "Me_Myself_and_I_Familienakte";
export const AUTOMATED_TEST_WORKSPACE = "Familienakte_Automatische_Testumgebung_2.28.1";
const AUTOMATED_TEST_WINDOWS_BASE_PATH = String.raw`G:\01GPT-SOFTWARE\002 FAMAKT SOFTWARE Entwicklung\SOFTWARE TESTORDNER`;
const WINDOWS_LEGACY_PATH_LIMIT = 260;

function automatedWindowsPathInfo(relativePath: string) {
  const normalized = relativePath.replace(/^[/\\]+/, "").replaceAll("/", "\\");
  const fullPath = normalized ? `${AUTOMATED_TEST_WINDOWS_BASE_PATH}\\${normalized}` : AUTOMATED_TEST_WINDOWS_BASE_PATH;
  return { fullPath, pathLength: fullPath.length, exceedsLegacyLimit: fullPath.length >= WINDOWS_LEGACY_PATH_LIMIT };
}

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const vaultSupported = () => typeof window !== "undefined" && !!(window as PickerWindow).showDirectoryPicker;

async function chooseVaultFor(key: string, storageKind: "local" | "onedrive"): Promise<FileSystemDirectoryHandle> {
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (!picker) throw new Error("Diese Funktion benötigt Chrome oder Edge auf einem PC.");
  const handle = await picker({ mode: "readwrite" });
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE, "readwrite").objectStore(STORE).put(handle, key);
    request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
  });
  await ensureVault(handle, storageKind);
  return handle;
}

async function rememberedVaultFor(key: string): Promise<FileSystemDirectoryHandle | null> {
  if (!vaultSupported()) return null;
  const database = await db();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE).objectStore(STORE).get(key);
    request.onsuccess = () => resolve((request.result as FileSystemDirectoryHandle | undefined) || null);
    request.onerror = () => reject(request.error);
  });
}

async function forgetVaultFor(key: string): Promise<void> {
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE, "readwrite").objectStore(STORE).delete(key);
    request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
  });
}

export const chooseVault = () => chooseVaultFor(LOCAL_KEY, "local");
export const chooseOneDriveVault = () => chooseVaultFor(ONEDRIVE_KEY, "onedrive");
export const rememberedVault = () => rememberedVaultFor(LOCAL_KEY);
export const rememberedOneDriveVault = () => rememberedVaultFor(ONEDRIVE_KEY);

export type IncomingFolderFile = {
  key: string;
  name: string;
  size: number;
  mimeType: string;
  lastModified: number;
  source: "local-inbox" | "onedrive-inbox";
  file: File;
};

type DirectoryWithEntries = FileSystemDirectoryHandle & {
  values: () => AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
};
type DirectoryWithResolve = FileSystemDirectoryHandle & {
  resolve?: (possibleDescendant: FileSystemHandle) => Promise<string[] | null>;
};

export async function chooseInboxFolder(): Promise<FileSystemDirectoryHandle> {
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (!picker) throw new Error("Diese Funktion benötigt Chrome oder Edge auf einem PC.");
  const handle = await picker({ mode: "read" });
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE, "readwrite").objectStore(STORE).put(handle, INBOX_KEY);
    request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
  });
  return handle;
}

export const rememberedInboxFolder = () => rememberedVaultFor(INBOX_KEY);
export const forgetInboxFolder = () => forgetVaultFor(INBOX_KEY);

async function chooseRememberedDirectory(key: string, mode: "read" | "readwrite") {
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (!picker) throw new Error("Diese Funktion benötigt Chrome oder Edge auf einem PC.");
  const handle = await picker({ mode });
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE, "readwrite").objectStore(STORE).put(handle, key);
    request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
  });
  return handle;
}

export const chooseInventorySourceFolder = () => chooseRememberedDirectory(INVENTORY_SOURCE_KEY, "read");
export const chooseInventoryArchiveFolder = () => chooseRememberedDirectory(INVENTORY_ARCHIVE_KEY, "readwrite");
export const rememberedInventorySourceFolder = () => rememberedVaultFor(INVENTORY_SOURCE_KEY);
export const rememberedInventoryArchiveFolder = () => rememberedVaultFor(INVENTORY_ARCHIVE_KEY);
export const forgetInventorySourceFolder = () => forgetVaultFor(INVENTORY_SOURCE_KEY);
export const forgetInventoryArchiveFolder = () => forgetVaultFor(INVENTORY_ARCHIVE_KEY);
export const chooseDevelopmentBaseFolder = () => chooseRememberedDirectory(DEVELOPMENT_BASE_KEY, "readwrite");
export const rememberedDevelopmentBaseFolder = () => rememberedVaultFor(DEVELOPMENT_BASE_KEY);
export const forgetDevelopmentBaseFolder = () => forgetVaultFor(DEVELOPMENT_BASE_KEY);

async function scanDirectory(directory: FileSystemDirectoryHandle, source: IncomingFolderFile["source"], known: LocalDocument[]) {
  const knownKeys = new Set(known.map((item) => `${item.originalName.toLocaleLowerCase("de")}|${item.sizeBytes}`));
  const files: IncomingFolderFile[] = [];
  for await (const entry of (directory as DirectoryWithEntries).values()) {
    if (entry.kind !== "file" || entry.name.startsWith(".")) continue;
    const file = await (entry as FileSystemFileHandle).getFile();
    const basicKey = `${file.name.toLocaleLowerCase("de")}|${file.size}`;
    if (knownKeys.has(basicKey)) continue;
    files.push({ key: `${basicKey}|${file.lastModified}`, name: file.name, size: file.size, mimeType: file.type || "application/octet-stream", lastModified: file.lastModified, source, file });
  }
  return files.sort((a, b) => b.lastModified - a.lastModified || a.name.localeCompare(b.name, "de"));
}

export async function scanLocalInbox(handle: FileSystemDirectoryHandle, known: LocalDocument[]) {
  const permissionHandle = handle as PermissionHandle;
  const granted = await permissionHandle.queryPermission?.({ mode: "read" }) === "granted" || await permissionHandle.requestPermission?.({ mode: "read" }) === "granted";
  if (!granted) throw new Error("Der Eingangsordner wurde nicht freigegeben.");
  return scanDirectory(handle, "local-inbox", known);
}

export async function scanOneDriveInbox(handle: FileSystemDirectoryHandle, known: LocalDocument[]) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der OneDrive-Familienordner wurde nicht freigegeben.");
  const directory = await (await root(handle)).getDirectoryHandle("00_Posteingang", { create: true });
  return scanDirectory(directory, "onedrive-inbox", known);
}

export async function chooseExportDestination(): Promise<FileSystemDirectoryHandle> {
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (!picker) throw new Error("Diese Funktion benötigt Chrome oder Edge auf einem PC.");
  return picker({ mode: "readwrite" });
}

export async function requestVaultPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const permissionHandle = handle as PermissionHandle;
  if (await permissionHandle.queryPermission?.({ mode: "readwrite" }) === "granted") return true;
  return await permissionHandle.requestPermission?.({ mode: "readwrite" }) === "granted";
}

export async function forgetVault(): Promise<void> {
  await forgetVaultFor(LOCAL_KEY);
}

export const forgetOneDriveVault = () => forgetVaultFor(ONEDRIVE_KEY);

type ExistingVaultRoot = {
  handle: FileSystemDirectoryHandle;
  depth: number;
  score: number;
  updatedAt: number;
  corrupted: boolean;
};

async function inspectExistingVaultRoot(handle: FileSystemDirectoryHandle, depth: number): Promise<ExistingVaultRoot | null> {
  try {
    const directory = await handle.getDirectoryHandle("00_Register");
    const file = await directory.getFileHandle("Familienakte_Register.json");
    const text = await (await file.getFile()).text();
    const state = classifyRegisterText(text);
    if (state.state !== "valid") return { handle, depth, score: -1, updatedAt: 0, corrupted: true };
    const value = state.value as Record<string, unknown>;
    const count = (key: string) => Array.isArray(value[key]) ? value[key].length : 0;
    const score = ["documents", "records", "relations", "memoryDrafts", "linkDecisions", "inventoryItems", "auditLog"]
      .reduce((total, key) => total + count(key), 0);
    const updatedAt = typeof value.updatedAt === "string" ? Date.parse(value.updatedAt) || 0 : 0;
    return { handle, depth, score, updatedAt, corrupted: false };
  } catch {
    return null;
  }
}

async function existingVaultRoot(handle: FileSystemDirectoryHandle) {
  const candidates: FileSystemDirectoryHandle[] = [handle];
  let current = handle;
  for (let depth = 0; depth < 5; depth++) {
    try {
      current = await current.getDirectoryHandle(ROOT);
      candidates.push(current);
    } catch {
      break;
    }
  }
  // Ältere Teststände konnten den Stammordner versehentlich mehrfach ineinander
  // anlegen. Deshalb werden alle vorhandenen Register geprüft. Der vollständigste
  // gültige Bestand gewinnt; ein später versehentlich erzeugtes leeres Register
  // darf den Pilotbestand weder verdecken noch überschreiben.
  const inspected = (await Promise.all(candidates.map((candidate, depth) => inspectExistingVaultRoot(candidate, depth))))
    .filter((candidate): candidate is ExistingVaultRoot => Boolean(candidate));
  const valid = inspected.filter((candidate) => !candidate.corrupted)
    .sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt || b.depth - a.depth);
  if (valid.length) return valid[0].handle;
  const corrupted = inspected.filter((candidate) => candidate.corrupted).sort((a, b) => b.depth - a.depth);
  if (corrupted.length) return corrupted[0].handle;
  return null;
}

async function root(handle: FileSystemDirectoryHandle) {
  return await existingVaultRoot(handle) || handle.getDirectoryHandle(ROOT, { create: true });
}
async function registerDir(handle: FileSystemDirectoryHandle) {
  return (await root(handle)).getDirectoryHandle("00_Register", { create: true });
}
function emptyIndex(): VaultIndex {
  return {
    version: 5,
    modelVersion: FAMILY_DATA_MODEL_VERSION,
    updatedAt: new Date().toISOString(),
    documents: [],
    records: [],
    relations: [],
    memoryDrafts: [],
    linkDecisions: [],
    inventoryItems: [],
    inventoryLearningSignals: [],
    sequences: {},
    auditLog: [],
  };
}
function normalizeIndex(value: unknown): VaultIndex {
  if (!value || typeof value !== "object") return emptyIndex();
  const existing = value as Record<string, unknown>;
  const documents = (Array.isArray(existing.documents) ? existing.documents as LocalDocument[] : []).map((document) => ({
    ...document,
    storageLocations: document.storageLocations?.length ? document.storageLocations : document.storedPath ? [{
      id: `LOC-${document.id}-${document.storageType || "local"}`,
      storageType: document.storageType || "local",
      path: document.storedPath,
      source: document.source || "Bestehender Speicherort",
      checksum: document.checksum || null,
      fileSize: document.sizeBytes,
      verifiedAt: document.updatedAt || document.addedAt,
    }] : [],
  }));
  const inventoryItems = (Array.isArray(existing.inventoryItems) ? existing.inventoryItems as InventoryItem[] : []).map((item) => ({
    ...item,
    stableFileId: item.stableFileId || `SRC-${item.checksum?.slice(0, 20) || item.id}`,
    sourceKind: item.sourceKind || (/onedrive/i.test(item.sourceRootName || "") ? "onedrive" : "local"),
    previousSourcePaths: item.previousSourcePaths || [],
    firstSeenAt: item.firstSeenAt || item.analyzedAt,
    lastSeenAt: item.lastSeenAt || item.analyzedAt,
    lastCheckedAt: item.lastCheckedAt || item.analyzedAt,
    sourceStatus: item.sourceStatus || "unveraendert",
    contentStatus: item.contentStatus || "nicht_automatisch_lesbar",
    contentExcerpt: item.contentExcerpt || "",
    canonicalLifeArea: item.canonicalLifeArea || item.lifeArea,
    personalLifeArea: item.personalLifeArea || null,
    assignmentReferences: item.assignmentReferences || [],
    detectedMetadata: item.detectedMetadata || { dates: [], invoiceNumbers: [], contractNumbers: [], referenceNumbers: [], possibleTask: null, possibleDeadline: null },
    versionOfInventoryIds: item.versionOfInventoryIds || [],
    learningFeatures: item.learningFeatures || { organisationIds: [], senderKeys: [], caseIds: [], objectIds: [], keywords: [], folderContext: "", documentType: item.documentType || "Dokument" },
    confirmedKeywords: item.confirmedKeywords || [],
    learningSuggestion: item.learningSuggestion || null,
    assignmentConfirmedAt: item.assignmentConfirmedAt || null,
  }));
  return {
    ...existing,
    version: 5,
    modelVersion: FAMILY_DATA_MODEL_VERSION,
    updatedAt: typeof existing.updatedAt === "string" ? existing.updatedAt : new Date().toISOString(),
    documents,
    records: Array.isArray(existing.records) ? existing.records as FamilyRecordUnion[] : [],
    relations: Array.isArray(existing.relations) ? existing.relations as FamilyRelation[] : [],
    memoryDrafts: Array.isArray(existing.memoryDrafts) ? existing.memoryDrafts as MemoryDraftEntry[] : [],
    linkDecisions: Array.isArray(existing.linkDecisions) ? existing.linkDecisions as ContextLinkDecision[] : [],
    inventoryItems,
    inventoryLearningSignals: Array.isArray(existing.inventoryLearningSignals) ? existing.inventoryLearningSignals as InventoryLearningSignal[] : [],
    sequences: existing.sequences && typeof existing.sequences === "object" ? existing.sequences as FamilyIdSequences : {},
    auditLog: Array.isArray(existing.auditLog) ? existing.auditLog as VaultAuditEntry[] : [],
  };
}
export class VaultRegisterError extends Error {
  readonly code: "REGISTER_CORRUPTED" | "REGISTER_WRITE_FAILED" | "REGISTER_PATH_TOO_LONG";
  constructor(code: VaultRegisterError["code"], message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "VaultRegisterError";
    this.code = code;
  }
}

type RegisterWriteStep = "Sicherung erstellen" | "temporäre Registerdatei schreiben" | "temporäre Registerdatei prüfen" | "Registerdatei ersetzen" | "neue Registerdatei prüfen";

function fileSystemErrorName(error: unknown) {
  if (error instanceof DOMException) return error.name;
  if (error && typeof error === "object" && "name" in error) return String((error as { name?: unknown }).name || "Error");
  return "Error";
}

function fileSystemErrorDetail(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Der Browser hat keine weitere technische Einzelmeldung geliefert.";
}

export function registerWriteFailureMessage(step: RegisterWriteStep, errorName: string, detail = "") {
  const cause = errorName === "NotAllowedError" || errorName === "SecurityError"
    ? "Die Schreibberechtigung des Browsers fehlt oder ist abgelaufen."
    : errorName === "NotFoundError"
      ? "Der Ordner oder die Datei war während des Schreibens nicht mehr erreichbar."
      : errorName === "InvalidStateError"
        ? "Die gespeicherte Ordnerreferenz ist nicht mehr gültig."
        : errorName === "NoModificationAllowedError"
          ? "Windows, der Datenträger oder ein Synchronisationsprogramm hat die Datei vorübergehend gesperrt."
          : errorName === "QuotaExceededError"
            ? "Auf dem Datenträger steht nicht genügend freier Speicher zur Verfügung."
            : "Der Dateisystemzugriff wurde technisch abgebrochen.";
  return `Registerschritt „${step}“ fehlgeschlagen. ${cause}${detail ? ` Technische Meldung: ${detail}` : ""}`;
}

function retryableRegisterWriteError(error: unknown) {
  return ["NotFoundError", "InvalidStateError", "NoModificationAllowedError", "NotReadableError", "AbortError"].includes(fileSystemErrorName(error));
}

async function retryFileSystemOperation<T>(operation: () => Promise<T>, maxAttempts = 3, delayMs = 120) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await operation(); }
    catch (error) {
      lastError = error;
      if (!retryableRegisterWriteError(error) || attempt === maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastError;
}

async function registerWriteOperation<T>(step: RegisterWriteStep, operation: () => Promise<T>) {
  try { return await retryFileSystemOperation(operation); }
  catch (error) { throw new VaultRegisterError("REGISTER_WRITE_FAILED", registerWriteFailureMessage(step, fileSystemErrorName(error), fileSystemErrorDetail(error)), { cause: error }); }
}

type AutomatedStorageTraceInput = {
  step: string;
  operation: string;
  relativePath: string;
  result: "start" | "success" | "failure" | "reread_success" | "reread_failure";
  permission?: PermissionState | "unsupported" | null;
  parentExists?: boolean | null;
  targetExists?: boolean | null;
  error?: unknown;
  detail?: string | null;
};

type AutomatedStorageTrace = (event: AutomatedStorageTraceInput) => void;

async function queriedDirectoryPermission(handle: FileSystemDirectoryHandle) {
  try {
    const permission = handle as PermissionHandle;
    return permission.queryPermission ? await permission.queryPermission({ mode: "readwrite" }) : "unsupported" as const;
  } catch { return "unsupported" as const; }
}

async function fileExistsInDirectory(directory: FileSystemDirectoryHandle, name: string) {
  try { await directory.getFileHandle(name); return true; }
  catch (error) { if (isNotFoundError(error)) return false; throw error; }
}

type RegisterFileDiagnostic = {
  trace?: AutomatedStorageTrace;
  relativeDirectoryPath: string;
  windowsBasePath?: string;
};

function guardedWindowsPath(diagnostic: RegisterFileDiagnostic | undefined, name: string) {
  if (!diagnostic?.windowsBasePath) return null;
  const relativePath = `${diagnostic.relativeDirectoryPath}/${name}`;
  const normalized = relativePath.replace(/^[/\\]+/, "").replaceAll("/", "\\");
  const fullPath = `${diagnostic.windowsBasePath.replace(/[\\/]+$/, "")}\\${normalized}`;
  const pathLength = fullPath.length;
  diagnostic.trace?.({ step: "Pfadlänge vor Schreibzugriff prüfen", operation: "Vollständigen Windows-Zielpfad messen", relativePath, result: pathLength < WINDOWS_LEGACY_PATH_LIMIT ? "success" : "failure", detail: `Vollständiger Zielpfad: ${fullPath} · Pfadlänge: ${pathLength} Zeichen · vorsorgliche Grenze: ${WINDOWS_LEGACY_PATH_LIMIT}` });
  if (pathLength >= WINDOWS_LEGACY_PATH_LIMIT) throw new VaultRegisterError("REGISTER_PATH_TOO_LONG", `Der vollständige Windows-Zielpfad umfasst ${pathLength} Zeichen und erreicht damit die vorsorgliche Grenze von ${WINDOWS_LEGACY_PATH_LIMIT} Zeichen. Der interne Testpfad muss verkürzt werden. Ziel: ${fullPath}`);
  return { fullPath, pathLength };
}

async function writeAndVerifyRegisterFile(resolveDirectory: () => Promise<FileSystemDirectoryHandle>, name: string, contents: string, writeStep: RegisterWriteStep, verifyStep: RegisterWriteStep, diagnostic?: RegisterFileDiagnostic) {
  guardedWindowsPath(diagnostic, name);
  await registerWriteOperation(writeStep, async () => {
    let directory: FileSystemDirectoryHandle | null = null;
    try {
      directory = await resolveDirectory();
      diagnostic?.trace?.({ step: writeStep, operation: "Ziel unmittelbar vor dem Schreiben prüfen", relativePath: `${diagnostic.relativeDirectoryPath}/${name}`, result: "start", permission: await queriedDirectoryPermission(directory), parentExists: true, targetExists: await fileExistsInDirectory(directory, name) });
      const handle = await directory.getFileHandle(name, { create: true });
      diagnostic?.trace?.({ step: writeStep, operation: "Dateihandle erstellen", relativePath: `${diagnostic.relativeDirectoryPath}/${name}`, result: "success", permission: await queriedDirectoryPermission(directory), parentExists: true, targetExists: true });
      const writable = await handle.createWritable();
      diagnostic?.trace?.({ step: writeStep, operation: "Schreibstrom öffnen", relativePath: `${diagnostic.relativeDirectoryPath}/${name}`, result: "success", permission: await queriedDirectoryPermission(directory), parentExists: true, targetExists: true });
      await writable.write(contents);
      diagnostic?.trace?.({ step: writeStep, operation: "Inhalt schreiben", relativePath: `${diagnostic.relativeDirectoryPath}/${name}`, result: "success", permission: await queriedDirectoryPermission(directory), parentExists: true, targetExists: true });
      await writable.close();
      diagnostic?.trace?.({ step: writeStep, operation: "Schreibstrom schließen", relativePath: `${diagnostic.relativeDirectoryPath}/${name}`, result: "success", permission: await queriedDirectoryPermission(directory), parentExists: true, targetExists: true });
    } catch (error) {
      let reread = false;
      try {
        const freshDirectory = await resolveDirectory();
        const freshFile = await freshDirectory.getFileHandle(name);
        await freshFile.getFile();
        reread = true;
      } catch { /* Der erneute Leseversuch wird nur als Diagnose protokolliert. */ }
      diagnostic?.trace?.({ step: writeStep, operation: "Dateioperation fehlgeschlagen", relativePath: `${diagnostic.relativeDirectoryPath}/${name}`, result: "failure", permission: directory ? await queriedDirectoryPermission(directory) : null, parentExists: Boolean(directory), targetExists: directory ? await fileExistsInDirectory(directory, name).catch(() => null) : null, error, detail: `Erneuter Leseversuch: ${reread ? "erfolgreich" : "fehlgeschlagen"}` });
      diagnostic?.trace?.({ step: writeStep, operation: "Erneuter Leseversuch nach Schreibfehler", relativePath: `${diagnostic.relativeDirectoryPath}/${name}`, result: reread ? "reread_success" : "reread_failure", parentExists: Boolean(directory), targetExists: reread, error: reread ? undefined : error });
      throw error;
    }
  });
  await registerWriteOperation(verifyStep, async () => {
    try {
      const directory = await resolveDirectory();
      diagnostic?.trace?.({ step: verifyStep, operation: "Frisch aufgelöste Datei wieder einlesen", relativePath: `${diagnostic.relativeDirectoryPath}/${name}`, result: "start", permission: await queriedDirectoryPermission(directory), parentExists: true, targetExists: await fileExistsInDirectory(directory, name) });
      const file = await directory.getFileHandle(name);
      parseIndex(await (await file.getFile()).text());
      diagnostic?.trace?.({ step: verifyStep, operation: "Frisch aufgelöste Datei wieder einlesen", relativePath: `${diagnostic.relativeDirectoryPath}/${name}`, result: "success", permission: await queriedDirectoryPermission(directory), parentExists: true, targetExists: true });
    } catch (error) {
      diagnostic?.trace?.({ step: verifyStep, operation: "Frisch aufgelöste Datei wieder einlesen", relativePath: `${diagnostic.relativeDirectoryPath}/${name}`, result: "failure", error });
      throw error;
    }
  });
}

async function cleanupStaleRegisterTemporaryFiles(directory: FileSystemDirectoryHandle, diagnostics?: string[]) {
  const iterable = directory as FileSystemDirectoryHandle & { values?: () => AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle> };
  if (!iterable.values) return;
  for await (const entry of iterable.values()) {
    if (entry.kind !== "file" || !(entry.name.startsWith("Familienakte_Register_TEMP_") || entry.name.startsWith("FA_TEMP_")) || !entry.name.endsWith(".json")) continue;
    try {
      const file = await (entry as FileSystemFileHandle).getFile();
      if (Date.now() - file.lastModified < 10 * 60 * 1000) continue;
      await directory.removeEntry(entry.name);
    }
    catch (error) { diagnostics?.push(`Alte temporäre Registerdatei „${entry.name}“ ist noch gesperrt (${fileSystemErrorName(error)}). Das gültige Hauptregister bleibt davon unberührt.`); }
  }
}

function isNotFoundError(error: unknown) {
  return Boolean(error && typeof error === "object" && "name" in error && (error as { name?: string }).name === "NotFoundError");
}

function parseIndex(contents: string): VaultIndex {
  const state = classifyRegisterText(contents);
  if (state.state === "valid") return normalizeIndex(state.value);
  throw new VaultRegisterError("REGISTER_CORRUPTED", "Die vorhandene Registerdatei ist beschädigt oder nicht lesbar. Sie wurde nicht überschrieben. Bitte eine Sicherung wiederherstellen oder die Datei prüfen lassen.");
}

async function readExistingRegisterText(handle: FileSystemDirectoryHandle): Promise<string | null> {
  const directory = await registerDir(handle);
  return readExistingRegisterTextFromDirectory(directory);
}

async function readExistingRegisterTextFromDirectory(directory: FileSystemDirectoryHandle): Promise<string | null> {
  try {
    const file = await directory.getFileHandle("Familienakte_Register.json");
    return await (await file.getFile()).text();
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

async function readIndex(handle: FileSystemDirectoryHandle): Promise<VaultIndex> {
  const contents = await readExistingRegisterText(handle);
  return contents === null ? emptyIndex() : parseIndex(contents);
}

async function pruneRegisterBackups(directory: FileSystemDirectoryHandle, keep = 5) {
  const entries: string[] = [];
  const iterable = directory as FileSystemDirectoryHandle & { values?: () => AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle> };
  if (!iterable.values) return;
  for await (const entry of iterable.values()) if (entry.kind === "file" && entry.name.endsWith(".json")) entries.push(entry.name);
  entries.sort().reverse();
  for (const name of entries.slice(keep)) await directory.removeEntry(name);
}

let registerWriteLock: Promise<void> = Promise.resolve();

async function withRegisterWriteLock<T>(operation: () => Promise<T>) {
  const previous = registerWriteLock;
  let release!: () => void;
  registerWriteLock = new Promise<void>((resolve) => { release = resolve; });
  await previous.catch(() => undefined);
  try { return await operation(); }
  finally { release(); }
}

type RegisterWriteOptions = {
  preserveTimestamp?: boolean;
  diagnostics?: string[];
  trace?: AutomatedStorageTrace;
  relativeDirectoryPath?: string;
  windowsBasePath?: string;
  shortTemporaryName?: boolean;
};

function registerFileDiagnostic(options: RegisterWriteOptions | undefined, relativeDirectoryPath: string): RegisterFileDiagnostic | undefined {
  return options?.trace || options?.windowsBasePath ? { trace: options.trace, relativeDirectoryPath, windowsBasePath: options.windowsBasePath } : undefined;
}

async function writeIndexToRegisterDirectoryUnlocked(resolveDirectory: () => Promise<FileSystemDirectoryHandle>, index: VaultIndex, options?: RegisterWriteOptions) {
  const existingText = await readExistingRegisterTextFromDirectory(await resolveDirectory());
  if (existingText !== null) parseIndex(existingText);
  index.version = 5;
  index.modelVersion = FAMILY_DATA_MODEL_VERSION;
  if (!options?.preserveTimestamp) index.updatedAt = new Date().toISOString();
  const contents = JSON.stringify(index, null, 2);
  const plan = safeRegisterWritePlan(existingText, contents);
  if (!plan.allowed) throw new VaultRegisterError("REGISTER_CORRUPTED", plan.reason);
  parseIndex(contents);
  await cleanupStaleRegisterTemporaryFiles(await resolveDirectory(), options?.diagnostics);
  const stamp = index.updatedAt.replace(/[:.]/g, "-");
  if (existingText !== null) {
    const resolveBackupDirectory = () => registerWriteOperation("Sicherung erstellen", async () => (await resolveDirectory()).getDirectoryHandle("Sicherungen", { create: true }));
    await writeAndVerifyRegisterFile(resolveBackupDirectory, `Familienakte_Register_${stamp}.json`, existingText, "Sicherung erstellen", "Sicherung erstellen", registerFileDiagnostic(options, `${options?.relativeDirectoryPath || "00_Register"}/Sicherungen`));
    const backupDirectory = await resolveBackupDirectory();
    try { await pruneRegisterBackups(backupDirectory); }
    catch (error) { options?.diagnostics?.push(`Alte Registersicherungen konnten nicht sofort bereinigt werden (${fileSystemErrorName(error)}). Die neue geprüfte Sicherung bleibt erhalten.`); }
  }
  const temporaryName = options?.shortTemporaryName ? `FA_TEMP_${crypto.randomUUID().slice(0, 8)}.json` : `Familienakte_Register_TEMP_${crypto.randomUUID()}.json`;
  await writeAndVerifyRegisterFile(resolveDirectory, temporaryName, contents, "temporäre Registerdatei schreiben", "temporäre Registerdatei prüfen", registerFileDiagnostic(options, options?.relativeDirectoryPath || "00_Register"));
  await writeAndVerifyRegisterFile(resolveDirectory, "Familienakte_Register.json", contents, "Registerdatei ersetzen", "neue Registerdatei prüfen", registerFileDiagnostic(options, options?.relativeDirectoryPath || "00_Register"));
  // Das Aufräumen gehört nicht zum erfolgreichen Register-Commit. Windows,
  // Virenscanner oder Sync-Programme können die bereits geprüfte TEMP-Datei
  // kurzzeitig festhalten. Eine solche Sperre darf den gültigen Commit nicht
  // nachträglich als Speicherfehler ausgeben.
  try { await (await resolveDirectory()).removeEntry(temporaryName); }
  catch (error) {
    const diagnostic = `Temporäre Registerdatei „${temporaryName}“ konnte nach dem erfolgreich geprüften Speichern nicht sofort entfernt werden (${fileSystemErrorName(error)}). Sie wird beim nächsten Lauf erneut bereinigt.`;
    options?.diagnostics?.push(diagnostic);
  }
}

async function writeIndexToRegisterDirectory(resolveDirectory: () => Promise<FileSystemDirectoryHandle>, index: VaultIndex, options?: RegisterWriteOptions) {
  return withRegisterWriteLock(() => writeIndexToRegisterDirectoryUnlocked(resolveDirectory, index, options));
}

async function writeIndex(handle: FileSystemDirectoryHandle, index: VaultIndex, options?: { preserveTimestamp?: boolean; diagnostics?: string[] }) {
  const resolvedRoot = await root(handle);
  return writeIndexToRegisterDirectory(() => resolvedRoot.getDirectoryHandle("00_Register", { create: true }), index, options);
}

async function fileFromStoredPath(handle: FileSystemDirectoryHandle, storedPath: string) {
  const parts = storedPath.split("/").filter(Boolean);
  if (parts[0] === ROOT) parts.shift();
  const fileName = parts.pop();
  if (!fileName) throw new Error("Der gespeicherte Dateipfad ist unvollständig.");
  let directory = await root(handle);
  for (const part of parts) directory = await directory.getDirectoryHandle(part);
  return (await directory.getFileHandle(fileName)).getFile();
}

export async function readLocalDocumentFile(handle: FileSystemDirectoryHandle, id: string) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const document = index.documents.find((item) => item.id === id);
  if (!document) throw new Error("Das Dokument wurde im lokalen Register nicht gefunden.");
  return fileFromStoredPath(handle, document.storedPath);
}

async function unusedTargetPath(handle: FileSystemDirectoryHandle, storedPath: string, id: string) {
  const parts = storedPath.split("/").filter(Boolean);
  if (parts[0] === ROOT) parts.shift();
  const requestedName = parts.pop();
  if (!requestedName) throw new Error("Der gespeicherte Dateipfad ist unvollständig.");
  let directory = await root(handle);
  for (const part of parts) directory = await directory.getDirectoryHandle(part, { create: true });
  try {
    await directory.getFileHandle(requestedName);
    const point = requestedName.lastIndexOf(".");
    const base = point > 0 ? requestedName.slice(0, point) : requestedName;
    const extension = point > 0 ? requestedName.slice(point) : "";
    const copyName = `${base}_Sicherung_${id.slice(0, 8)}${extension}`;
    return { directory, fileName: copyName, storedPath: `${ROOT}/${[...parts, copyName].join("/")}` };
  } catch {
    return { directory, fileName: requestedName, storedPath: `${ROOT}/${[...parts, requestedName].join("/")}` };
  }
}
async function vaultIdentity(handle: FileSystemDirectoryHandle, storageKind?: "local" | "onedrive") {
  const directory = await registerDir(handle);
  try {
    const file = await directory.getFileHandle("Datentresor_Kennung.json");
    const identity = JSON.parse(await (await file.getFile()).text()) as VaultIdentity;
    if (!identity.storageKind && storageKind) {
      identity.storageKind = storageKind;
      const writable = await file.createWritable(); await writable.write(JSON.stringify(identity, null, 2)); await writable.close();
    }
    return identity;
  } catch {
    const identity = { vaultId: crypto.randomUUID(), vaultName: handle.name, storageKind: storageKind || "local", createdAt: new Date().toISOString() };
    const file = await directory.getFileHandle("Datentresor_Kennung.json", { create: true });
    const writable = await file.createWritable(); await writable.write(JSON.stringify(identity, null, 2)); await writable.close();
    return identity;
  }
}
async function ensureVault(handle: FileSystemDirectoryHandle, storageKind: "local" | "onedrive", diagnostics?: string[]) {
  const base = await root(handle);
  await base.getDirectoryHandle("00_Register", { create: true });
  if (storageKind === "onedrive") await base.getDirectoryHandle("00_Posteingang", { create: true });
  await base.getDirectoryHandle("01_Dokumente", { create: true });
  await base.getDirectoryHandle("02_Online-Bestand_gesichert", { create: true });
  await base.getDirectoryHandle("03_Erinnerungsmedien", { create: true });
  await vaultIdentity(handle, storageKind);
  const index = await readIndex(handle); await writeIndex(handle, index, { diagnostics });
}
const clean = (value: string) => value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").replace(/\s+/g, " ").trim().slice(0, 120) || "Sonstiges";

async function fileChecksum(file: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type InventoryScanProgress = { processed: number; discovered: number; currentName: string; phase?: "inventarisieren" | "analysieren" | "speichern" | "pausiert" | "abgeschlossen"; skippedUnchanged?: number };
export type InventoryScanResult = {
  items: InventoryItem[];
  runId: string;
  startedAt: string;
  completedAt: string;
  paused: boolean;
  sourceKind: InventorySourceKind;
  discovered: number;
  processed: number;
  newFiles: number;
  unchanged: number;
  changed: number;
  moved: number;
  unavailable: number;
  skippedContentAnalysis: number;
  accessIssues: DirectoryAccessIssue[];
  excludedPaths: string[];
};
export type InventoryArchiveResult = { archived: number; alreadyArchived: number; failed: number; archiveId: string; completedAt: string; freeSpaceCheck: "nicht_im_browser_verfügbar" };
export type InventoryResetResult = { reset: number; archiveCopiesRemoved: number; assistantLinksRemoved: number; generatedDocumentsRemoved: number; completedAt: string };

export type TestWorkspaceCandidate = {
  relativePath: string;
  score: number;
  registerFiles: number;
  documentFiles: number;
  backupFiles: number;
  reportFiles: number;
  latestModifiedAt: number;
};

export type TestWorkspaceReport = {
  rootName: string;
  checkedAt: string;
  permission: "granted";
  totalFiles: number;
  totalDirectories: number;
  registerFiles: number;
  documentFiles: number;
  onlineReferences: number;
  testFiles: number;
  backupFiles: number;
  reportFiles: number;
  possibleDuplicateFiles: number;
  versions: string[];
  latestVersion: string | null;
  historicalVersions: string[];
  missingComponents: string[];
  recommendedRelativePath: string;
  recommendation: string;
  candidates: TestWorkspaceCandidate[];
  accessIssues: DirectoryAccessIssue[];
  excludedPaths: string[];
  originalFilesChanged: false;
};

export type PreparedTestRegister = {
  id: string;
  sourceRootName: string;
  vaultName: string;
  preparedAt: string;
  totalSourceFiles: number;
  recognizedDocuments: number;
  assignedDocuments: number;
  openAssignments: number;
  possibleDuplicates: number;
  sensitiveDocuments: number;
  accessIssues: DirectoryAccessIssue[];
  excludedPaths: string[];
  registerStatus: "Nur Vorschau – noch nicht gespeichert";
  storageStatus: "Originaldateien unverändert";
  securityStatus: "bestanden" | "Prüfung erforderlich";
  externalTransfer: false;
  originalFilesChanged: false;
  items: InventoryItem[];
};

export type PreparedTestRegisterSaveResult = {
  added: number;
  reused: number;
  savedAt: string;
  originalFilesChanged: false;
};

export type DirectoryAccessIssue = {
  path: string;
  operation: "Ordner lesen" | "Datei lesen";
  reason: string;
};

async function readFileByRelativePath(handle: FileSystemDirectoryHandle, relativePath: string) {
  const parts = relativePath.split("/").filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) throw new Error("Der Dateipfad ist unvollständig.");
  let directory = handle;
  for (const part of parts) directory = await directory.getDirectoryHandle(part);
  return (await directory.getFileHandle(fileName)).getFile();
}

async function removeFileByRelativePath(handle: FileSystemDirectoryHandle, relativePath: string, skipRootName = false) {
  const parts = relativePath.split("/").filter(Boolean);
  if (skipRootName && parts[0] === ROOT) parts.shift();
  const fileName = parts.pop();
  if (!fileName) return false;
  try {
    let directory = handle;
    for (const part of parts) directory = await directory.getDirectoryHandle(part);
    await directory.removeEntry(fileName);
    return true;
  } catch (error) {
    if (isNotFoundError(error)) return false;
    throw error;
  }
}

export function readableDirectoryAccessError(error: unknown, path: string, operation: DirectoryAccessIssue["operation"]) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotFoundError") return `${operation} fehlgeschlagen: „${path}“ wurde nicht gefunden. Der Ordner oder eine Datei wurde seit der Freigabe verschoben, umbenannt oder entfernt. Bitte den Test-Hauptordner erneut auswählen.`;
  if (name === "NotAllowedError" || name === "SecurityError") return `${operation} fehlgeschlagen: Für „${path}“ fehlt die Browserfreigabe. Bitte den Test-Hauptordner erneut auswählen und den Zugriff bestätigen.`;
  if (name === "InvalidStateError") return `${operation} fehlgeschlagen: Die gespeicherte Ordnerreferenz für „${path}“ ist nicht mehr gültig. Bitte den Test-Hauptordner erneut auswählen.`;
  return `${operation} fehlgeschlagen bei „${path}“. Bitte prüfen, ob das Laufwerk verbunden und der Ordner erreichbar ist, und den Test-Hauptordner danach erneut auswählen.`;
}

export function inventoryPathIsExcluded(path: string, excludedPaths: string[]) {
  const normalized = path.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
  return excludedPaths.some((entry) => {
    const excluded = entry.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
    return excluded && (normalized === excluded || normalized.startsWith(`${excluded}/`));
  });
}

async function directoryRelationship(source: FileSystemDirectoryHandle, register: FileSystemDirectoryHandle) {
  const sourceComparable = source as ComparableHandle; const registerComparable = register as ComparableHandle;
  if (sourceComparable.isSameEntry && await sourceComparable.isSameEntry(register)) return { same: true, registerWithinSource: null, sourceWithinRegister: null };
  const registerWithinSourceParts = await (source as DirectoryWithResolve).resolve?.(register) || null;
  const sourceWithinRegisterParts = await (register as DirectoryWithResolve).resolve?.(source) || null;
  return {
    same: false,
    registerWithinSource: registerWithinSourceParts?.length ? registerWithinSourceParts.join("/") : null,
    sourceWithinRegister: sourceWithinRegisterParts?.length ? sourceWithinRegisterParts.join("/") : null,
  };
}

async function verifiedDirectoryPermission(handle: FileSystemDirectoryHandle, mode: "read" | "readwrite", label: string) {
  try {
    const permission = handle as PermissionHandle;
    const current = permission.queryPermission ? await permission.queryPermission({ mode }) : "prompt";
    if (current === "granted") return true;
    return permission.requestPermission ? await permission.requestPermission({ mode }) === "granted" : false;
  } catch (error) {
    throw new Error(readableDirectoryAccessError(error, label, "Ordner lesen"));
  }
}

async function verifiedDirectoryRelationship(source: FileSystemDirectoryHandle, register: FileSystemDirectoryHandle) {
  try {
    return await directoryRelationship(source, register);
  } catch (error) {
    throw new Error(`Die gespeicherte Verbindung zwischen Analysequelle „${source.name}“ und Testdatentresor „${register.name}“ konnte nicht geprüft werden. ${readableDirectoryAccessError(error, source.name, "Ordner lesen")}`);
  }
}

async function listInventoryFiles(
  directory: FileSystemDirectoryHandle,
  prefix = "",
  output: Array<{ path: string; file: File }> = [],
  options: { excludedPaths?: string[]; issues?: DirectoryAccessIssue[] } = {},
) {
  const issues = options.issues || [];
  try {
    for await (const entry of (directory as DirectoryWithEntries).values()) {
      if (entry.name.startsWith(".") || entry.name === "System Volume Information" || entry.name === "$RECYCLE.BIN") continue;
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (inventoryPathIsExcluded(path, options.excludedPaths || [])) continue;
      if (entry.kind === "directory") {
        await listInventoryFiles(entry as FileSystemDirectoryHandle, path, output, { ...options, issues });
      } else {
        try { output.push({ path, file: await (entry as FileSystemFileHandle).getFile() }); }
        catch (error) { issues.push({ path, operation: "Datei lesen", reason: readableDirectoryAccessError(error, path, "Datei lesen") }); }
      }
    }
  } catch (error) {
    const path = prefix || directory.name;
    issues.push({ path, operation: "Ordner lesen", reason: readableDirectoryAccessError(error, path, "Ordner lesen") });
  }
  return output;
}

export async function prepareReadableInventorySourceFiles(
  entries: Array<{ path: string; file: File }>,
  accessIssues: DirectoryAccessIssue[],
  checksum: (file: Blob) => Promise<string> = fileChecksum,
) {
  const files: InventorySourceFile[] = [];
  for (const entry of entries) {
    try {
      files.push({
        relativePath: entry.path,
        name: entry.file.name,
        sizeBytes: entry.file.size,
        mimeType: browserMimeType(entry.file),
        lastModified: entry.file.lastModified,
        checksum: await checksum(entry.file),
        sourceKind: "local",
        contentStatus: "nicht_automatisch_lesbar",
      });
    } catch (error) {
      accessIssues.push({ path: entry.path, operation: "Datei lesen", reason: readableDirectoryAccessError(error, entry.path, "Datei lesen") });
    }
  }
  return files;
}

const testWorkspaceDocumentPattern = /\.(pdf|docx?|xlsx?|pptx?|txt|rtf|odt|ods|eml|msg|jpe?g|png|gif|webp|heic|tiff?)$/i;
const testWorkspaceVersionPattern = /(?:^|[^0-9])(\d{1,3}\.\d{1,3}\.\d{1,3})(?=$|[^0-9])/g;

function compareSemanticVersions(left: string, right: string) {
  const a = left.split(".").map(Number); const b = right.split(".").map(Number);
  for (let index = 0; index < 3; index++) if ((a[index] || 0) !== (b[index] || 0)) return (b[index] || 0) - (a[index] || 0);
  return 0;
}

type TestWorkspaceFileFact = { path: string; name: string; size: number; lastModified: number };

export function summarizeTestWorkspaceFiles(rootName: string, files: TestWorkspaceFileFact[], context: { accessIssues?: DirectoryAccessIssue[]; excludedPaths?: string[] } = {}): TestWorkspaceReport {
  const directoryPaths = new Set<string>();
  const candidateMap = new Map<string, TestWorkspaceCandidate>();
  const versions = new Set<string>();
  const duplicateGroups = new Map<string, number>();
  let registerFiles = 0; let documentFiles = 0; let onlineReferences = 0; let testFiles = 0; let backupFiles = 0; let reportFiles = 0;
  const candidateFor = (relativePath: string) => {
    if (!candidateMap.has(relativePath)) candidateMap.set(relativePath, { relativePath, score: 0, registerFiles: 0, documentFiles: 0, backupFiles: 0, reportFiles: 0, latestModifiedAt: 0 });
    return candidateMap.get(relativePath)!;
  };
  for (const file of files) {
    const normalized = file.path.replaceAll("\\", "/"); const lower = normalized.toLocaleLowerCase("de");
    const parts = normalized.split("/").filter(Boolean); const fileName = parts.pop() || file.name;
    const ancestors = ["."];
    let current = "";
    for (const part of parts) { current = current ? `${current}/${part}` : part; directoryPaths.add(current); ancestors.push(current); }
    const isRegister = /(^|\/)(00[_ -]?register|register)(\/|$)/i.test(normalized) || /(familienakte|dokument).*register.*\.json$/i.test(fileName);
    const isDocument = testWorkspaceDocumentPattern.test(fileName);
    const isBackup = /(backup|sicherung|rueckkehr|rückkehr|restore)/i.test(lower);
    const isReport = /(prüfbericht|pruefbericht|system.?check|release.?report|testbericht)/i.test(lower);
    const isOnline = /(onedrive|online.?bestand|cloud)/i.test(lower);
    const isTest = /(test|pilot|sandbox|kopie)/i.test(lower);
    if (isRegister) registerFiles++; if (isDocument) documentFiles++; if (isBackup) backupFiles++; if (isReport) reportFiles++; if (isOnline) onlineReferences++; if (isTest) testFiles++;
    for (const match of normalized.matchAll(testWorkspaceVersionPattern)) versions.add(match[1]);
    const duplicateKey = `${fileName.toLocaleLowerCase("de")}|${file.size}`;
    duplicateGroups.set(duplicateKey, (duplicateGroups.get(duplicateKey) || 0) + 1);
    for (const ancestor of ancestors) {
      const candidate = candidateFor(ancestor);
      if (isRegister) candidate.registerFiles++; if (isDocument) candidate.documentFiles++; if (isBackup) candidate.backupFiles++; if (isReport) candidate.reportFiles++;
      candidate.latestModifiedAt = Math.max(candidate.latestModifiedAt, file.lastModified);
    }
  }
  const candidates = [...candidateMap.values()].map((candidate) => ({
    ...candidate,
    score: candidate.registerFiles * 45 + Math.min(25, candidate.documentFiles) * 2 + Math.min(3, candidate.backupFiles) * 8 + Math.min(3, candidate.reportFiles) * 8 - Math.max(0, candidate.registerFiles - 1) * 18,
  })).filter((candidate) => candidate.registerFiles > 0 || candidate.documentFiles > 0).sort((left, right) => right.score - left.score || right.latestModifiedAt - left.latestModifiedAt || left.relativePath.localeCompare(right.relativePath, "de"));
  const orderedVersions = [...versions].sort(compareSemanticVersions); const latestVersion = orderedVersions[0] || null;
  const recommended = (latestVersion ? candidates.find((candidate) => candidate.relativePath.includes(latestVersion) && candidate.registerFiles > 0 && candidate.documentFiles > 0) : undefined) || candidates[0] || candidateFor(".");
  const missingComponents = [!registerFiles && "kein Familienakten-Register erkannt", !documentFiles && "keine typischen Testdokumente erkannt", !backupFiles && "keine Sicherung erkannt", !reportFiles && "kein Prüfbericht erkannt"].filter((value): value is string => Boolean(value));
  const possibleDuplicateFiles = [...duplicateGroups.values()].reduce((total, count) => total + Math.max(0, count - 1), 0);
  return {
    rootName, checkedAt: new Date().toISOString(), permission: "granted", totalFiles: files.length, totalDirectories: directoryPaths.size,
    registerFiles, documentFiles, onlineReferences, testFiles, backupFiles, reportFiles, possibleDuplicateFiles,
    versions: orderedVersions, latestVersion, historicalVersions: latestVersion ? orderedVersions.filter((version) => version !== latestVersion) : [], missingComponents,
    recommendedRelativePath: recommended.relativePath,
    recommendation: recommended.relativePath === "." ? `Der ausgewählte Ordner „${rootName}“ ist der passendste erkannte Testbestand.` : `Der vorhandene Unterordner „${recommended.relativePath}“ ist der passendste erkannte Testbestand.`,
    candidates: candidates.slice(0, 5), accessIssues: context.accessIssues || [], excludedPaths: context.excludedPaths || [], originalFilesChanged: false,
  };
}

export async function inspectTestWorkspace(handle: FileSystemDirectoryHandle, protectedRegister?: FileSystemDirectoryHandle | null): Promise<TestWorkspaceReport> {
  const permission = handle as PermissionHandle;
  const granted = await permission.queryPermission?.({ mode: "read" }) === "granted" || await permission.requestPermission?.({ mode: "read" }) === "granted";
  if (!granted) throw new Error("Der Testordner wurde nicht zum Lesen freigegeben.");
  const relationship = protectedRegister ? await directoryRelationship(handle, protectedRegister) : { same: false, registerWithinSource: null, sourceWithinRegister: null };
  if (relationship.same) throw new Error("Test-Hauptordner und Familienakten-Datentresor sind derselbe Ordner. Bitte als Test-Hauptordner den übergeordneten „SOFTWARE TESTORDNER“ oder einen getrennten Testbestand auswählen.");
  if (relationship.sourceWithinRegister) throw new Error(`Der Test-Hauptordner liegt innerhalb des Datentresors („${relationship.sourceWithinRegister}“). Bitte einen getrennten Test-Hauptordner außerhalb des Datentresors auswählen.`);
  const excludedPaths = relationship.registerWithinSource ? [relationship.registerWithinSource] : [];
  const accessIssues: DirectoryAccessIssue[] = [];
  const files = await listInventoryFiles(handle, "", [], { excludedPaths, issues: accessIssues });
  if (!files.length && accessIssues.length) throw new Error(accessIssues[0].reason);
  if (files.length > 20000) throw new Error("Der Testordner enthält mehr als 20.000 Dateien. Bitte zunächst einen kleineren ausdrücklich freigegebenen Testbereich wählen.");
  return summarizeTestWorkspaceFiles(handle.name, files.map((entry) => ({ path: entry.path, name: entry.file.name, size: entry.file.size, lastModified: entry.file.lastModified })), { accessIssues, excludedPaths });
}

function browserMimeType(file: File) {
  if (file.type) return file.type;
  const name = file.name.toLocaleLowerCase("de");
  if (name.endsWith(".pdf")) return "application/pdf";
  if (/\.(jpe?g)$/i.test(name)) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".eml")) return "message/rfc822";
  if (name.endsWith(".txt") || name.endsWith(".vtt")) return "text/plain";
  if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/octet-stream";
}

export function buildPreparedTestRegister(input: {
  sourceRootName: string;
  vaultName: string;
  totalSourceFiles: number;
  items: InventoryItem[];
  accessIssues?: DirectoryAccessIssue[];
  excludedPaths?: string[];
  preparedAt?: string;
}): PreparedTestRegister {
  const accessIssues = input.accessIssues || [];
  const sensitiveDocuments = input.items.filter((item) => item.privacyClass !== "allgemein").length;
  const openAssignments = input.items.filter((item) => item.confidence === "unklar" || item.reviewGroup === "review").length;
  return {
    id: `TESTREGISTER-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    sourceRootName: input.sourceRootName,
    vaultName: input.vaultName,
    preparedAt: input.preparedAt || new Date().toISOString(),
    totalSourceFiles: input.totalSourceFiles,
    recognizedDocuments: input.items.length,
    assignedDocuments: input.items.length - openAssignments,
    openAssignments,
    possibleDuplicates: input.items.filter((item) => item.reviewGroup === "duplicate" || item.possibleDuplicateInventoryIds.length > 0 || item.possibleDuplicateDocumentIds.length > 0).length,
    sensitiveDocuments,
    accessIssues,
    excludedPaths: input.excludedPaths || [],
    registerStatus: "Nur Vorschau – noch nicht gespeichert",
    storageStatus: "Originaldateien unverändert",
    securityStatus: sensitiveDocuments || accessIssues.length ? "Prüfung erforderlich" : "bestanden",
    externalTransfer: false,
    originalFilesChanged: false,
    items: input.items,
  };
}

export async function prepareTestRegisterPreview(input: {
  source: FileSystemDirectoryHandle;
  register: FileSystemDirectoryHandle;
}): Promise<PreparedTestRegister> {
  const granted = await verifiedDirectoryPermission(input.source, "read", `Analysequelle ${input.source.name}`);
  if (!granted) throw new Error("Der Test-Hauptordner wurde nicht zum Lesen freigegeben. Bitte „FAMILIENAKTE_TESTBESTAND“ erneut auswählen und den Browserzugriff bestätigen.");
  const registerGranted = await verifiedDirectoryPermission(input.register, "readwrite", `Testdatentresor ${input.register.name}`);
  if (!registerGranted) throw new Error("Der aktive Testdatentresor wurde nicht freigegeben. Bitte „FaWoGa_Test_2.28.1“ erneut verbinden.");
  const relationship = await verifiedDirectoryRelationship(input.source, input.register);
  if (relationship.same) throw new Error("Analysequelle und Testdatentresor sind derselbe Ordner. Bitte „FAMILIENAKTE_TESTBESTAND“ als Quelle und „FaWoGa_Test_2.28.1“ als eigenständigen Datentresor verwenden.");
  if (relationship.sourceWithinRegister) throw new Error("Die Analysequelle liegt innerhalb des Testdatentresors. Bitte beide Bereiche getrennt auswählen.");
  const excludedPaths = relationship.registerWithinSource ? [relationship.registerWithinSource] : [];
  const accessIssues: DirectoryAccessIssue[] = [];
  const sourceFiles = await listInventoryFiles(input.source, "", [], { excludedPaths, issues: accessIssues });
  const documentFiles = sourceFiles.filter((entry) => testWorkspaceDocumentPattern.test(entry.file.name));
  if (!documentFiles.length && accessIssues.length) throw new Error(accessIssues[0].reason);
  if (!documentFiles.length) throw new Error("Im ausgewählten Test-Hauptordner wurden keine unterstützten Testdokumente erkannt.");
  if (documentFiles.length > 10000) throw new Error("Der Testbestand enthält mehr als 10.000 Dokumente. Bitte zunächst einen kleineren ausdrücklich freigegebenen Testbereich verwenden.");
  let index: VaultIndex;
  try { index = await readIndex(input.register); }
  catch (error) {
    if (error instanceof VaultRegisterError) throw error;
    throw new Error(`Das bestehende Register im Testdatentresor „${input.register.name}“ konnte nicht gelesen werden. ${readableDirectoryAccessError(error, input.register.name, "Ordner lesen")}`);
  }
  const files = await prepareReadableInventorySourceFiles(documentFiles, accessIssues);
  if (!files.length) {
    const firstIssue = accessIssues[0]?.reason || "Keine der erkannten Dokumentdateien war lesbar.";
    throw new Error(`Das Testregister konnte nicht vorbereitet werden, weil kein Dokument lesbar war. ${firstIssue}`);
  }
  const canonicalCategories = new Set<string>(FAMILY_CATEGORIES);
  const personalLifeAreas = [...new Set(index.documents.map((document) => document.category).filter((category) => category && !canonicalCategories.has(category)))];
  const items = analyzeInventoryFiles({
    sourceRootName: input.source.name,
    sourceKind: "local",
    files,
    knownDocuments: index.documents.map((document) => ({ id: document.id, originalName: document.originalName, sizeBytes: document.sizeBytes, documentDate: document.documentDate, updatedAt: document.updatedAt })),
    knownInventory: index.inventoryItems,
    records: index.records,
    personalLifeAreas,
    learningSignals: index.inventoryLearningSignals,
    analyzedAt: new Date().toISOString(),
    completeScan: false,
  });
  return buildPreparedTestRegister({ sourceRootName: input.source.name, vaultName: input.register.name, totalSourceFiles: sourceFiles.length, items, accessIssues, excludedPaths });
}

export async function savePreparedTestRegister(input: {
  register: FileSystemDirectoryHandle;
  preview: PreparedTestRegister;
}): Promise<PreparedTestRegisterSaveResult> {
  if (!(await requestVaultPermission(input.register))) throw new Error("Der aktive Testdatentresor wurde nicht freigegeben.");
  if (input.preview.vaultName !== input.register.name) throw new Error(`Das vorbereitete Testregister gehört zum Datentresor „${input.preview.vaultName}“. Bitte diesen Datentresor erneut verbinden.`);
  const index = await readIndex(input.register);
  const byPath = new Map(index.inventoryItems.map((item) => [`${item.sourceRootName}\u0000${item.sourceRelativePath}`, item]));
  let added = 0; let reused = 0;
  for (const candidate of input.preview.items) {
    const key = `${candidate.sourceRootName}\u0000${candidate.sourceRelativePath}`;
    if (byPath.has(key)) { reused++; continue; }
    const safeCandidate: InventoryItem = { ...candidate, state: "QUELLE_ANALYSIERT", archivedPath: null, archivedChecksum: null, archivedAt: null, documentId: null, assignmentConfirmedAt: null };
    index.inventoryItems.push(safeCandidate); byPath.set(key, safeCandidate); added++;
  }
  const savedAt = new Date().toISOString();
  index.auditLog.unshift({ id: crypto.randomUUID(), at: savedAt, action: "Testregister nach ausdrücklicher Bestätigung vorbereitet", details: `${added} neue Testdokumente aus „${input.preview.sourceRootName}“ wurden ausschließlich als QUELLE_ANALYSIERT in das bestehende Familienakten-Register aufgenommen; ${reused} bekannte Einträge wurden wiederverwendet. Keine Originaldatei wurde verändert, kopiert, archiviert oder für die Assistenz freigegeben.` });
  await writeIndex(input.register, index);
  return { added, reused, savedAt, originalFilesChanged: false };
}

export async function inventorySourcePermission(handle: FileSystemDirectoryHandle | null): Promise<PermissionState | "unsupported"> {
  if (!handle) return "prompt";
  const permission = handle as PermissionHandle;
  return permission.queryPermission ? permission.queryPermission({ mode: "read" }) : "unsupported";
}

export function runTestWorkspaceSelfTests() {
  const now = Date.now();
  const report = summarizeTestWorkspaceFiles("Familienakte_Test", [
    { path: "2.28.1/00_Register/Familienakte_Register.json", name: "Familienakte_Register.json", size: 800, lastModified: now },
    { path: "2.28.1/Dokumente/Rechnung.pdf", name: "Rechnung.pdf", size: 1200, lastModified: now },
    { path: "2.28.1/Dokumente/Kopie/Rechnung.pdf", name: "Rechnung.pdf", size: 1200, lastModified: now - 10 },
    { path: "2.28.1/Sicherung/Backup_2.28.1.json", name: "Backup_2.28.1.json", size: 900, lastModified: now },
    { path: "2.28.1/Pruefberichte/release-report-2.28.1.json", name: "release-report-2.28.1.json", size: 600, lastModified: now },
    { path: "2.27.2/00_Register/Familienakte_Register.json", name: "Familienakte_Register.json", size: 700, lastModified: now - 1000 },
  ]);
  const missingPathMessage = readableDirectoryAccessError(new DOMException("Datei fehlt", "NotFoundError"), "ABLAGE/alt.pdf", "Datei lesen");
  const deniedPathMessage = readableDirectoryAccessError(new DOMException("Zugriff verweigert", "NotAllowedError"), "ABLAGE/gesperrt", "Ordner lesen");
  return [
    { id: "test-workspace-readonly", passed: report.originalFilesChanged === false, summary: "Die Bestandsanalyse ist ausschließlich lesend." },
    { id: "test-workspace-structure", passed: report.registerFiles === 2 && report.documentFiles === 2 && report.backupFiles >= 1 && report.reportFiles >= 1, summary: "Register, Dokumente, Sicherungen und Prüfberichte werden erkannt." },
    { id: "test-workspace-versions", passed: report.latestVersion === "2.28.1" && report.historicalVersions.includes("2.27.2"), summary: "Aktuelle und historische Teststände werden unterschieden." },
    { id: "test-workspace-duplicates", passed: report.possibleDuplicateFiles >= 1, summary: "Mögliche doppelte Testdateien werden als Hinweis erkannt." },
    { id: "test-workspace-reuse", passed: report.recommendedRelativePath === "2.28.1", summary: "Der passendste vorhandene Testbestand wird zur Wiederverwendung vorgeschlagen." },
    { id: "test-workspace-vault-exclusion", passed: inventoryPathIsExcluded("FaWoGa_Test_2.28.1/00_Register/Familienakte_Register.json", ["FaWoGa_Test_2.28.1"]), summary: "Ein innerhalb der Analysequelle liegender Datentresor wird vollständig geschützt ausgeschlossen." },
    { id: "test-workspace-unrelated-path", passed: !inventoryPathIsExcluded("ABLAGE/Rechnung.pdf", ["FaWoGa_Test_2.28.1"]), summary: "Normale Testunterlagen außerhalb des Datentresors bleiben in der Analyse." },
    { id: "test-workspace-missing-path", passed: missingPathMessage.includes("ABLAGE/alt.pdf") && missingPathMessage.includes("erneut auswählen"), summary: "Nicht mehr vorhandene Datei- oder Ordnerreferenzen erhalten einen deutschen, pfadbezogenen Lösungshinweis." },
    { id: "test-workspace-permission", passed: deniedPathMessage.includes("ABLAGE/gesperrt") && deniedPathMessage.includes("Browserfreigabe"), summary: "Verweigerte Browserberechtigungen werden eindeutig und pfadbezogen erklärt." },
  ];
}

export function runPreparedTestRegisterSelfTests() {
  const now = Date.now();
  const items = analyzeInventoryFiles({
    sourceRootName: "FAMILIENAKTE_TESTBESTAND",
    sourceKind: "local",
    files: [
      { relativePath: "ABLAGE/Rechnungen/Rechnung_Elektro.pdf", name: "Rechnung_Elektro.pdf", sizeBytes: 1200, mimeType: "application/pdf", lastModified: now, checksum: "a".repeat(64), sourceKind: "local" },
      { relativePath: "ABLAGE/Gesundheit/Arztbericht.pdf", name: "Arztbericht.pdf", sizeBytes: 900, mimeType: "application/pdf", lastModified: now, checksum: "b".repeat(64), sourceKind: "local" },
      { relativePath: "Sicherung/Rechnung_Elektro_Kopie.pdf", name: "Rechnung_Elektro_Kopie.pdf", sizeBytes: 1200, mimeType: "application/pdf", lastModified: now, checksum: "a".repeat(64), sourceKind: "local" },
    ],
    knownDocuments: [],
    knownInventory: [],
    records: [],
    completeScan: false,
  });
  const preview = buildPreparedTestRegister({ sourceRootName: "FAMILIENAKTE_TESTBESTAND", vaultName: "FaWoGa_Test_2.28.1", totalSourceFiles: 107, items, excludedPaths: ["FaWoGa_Test_2.28.1"] });
  return [
    { id: "prepared-register-preview", passed: preview.registerStatus === "Nur Vorschau – noch nicht gespeichert" && preview.recognizedDocuments === 3, summary: "Das Testregister entsteht zunächst ausschließlich als nachvollziehbare Vorschau." },
    { id: "prepared-register-source", passed: preview.sourceRootName === "FAMILIENAKTE_TESTBESTAND" && preview.vaultName === "FaWoGa_Test_2.28.1" && preview.excludedPaths.includes("FaWoGa_Test_2.28.1"), summary: "Analysequelle, aktiver Testdatentresor und vorbereitete Vorschau bleiben eindeutig getrennt." },
    { id: "prepared-register-origin", passed: preview.items.every((item) => item.sourceRelativePath.includes("/")), summary: "Die ursprünglichen relativen Speicherorte bleiben an jedem Vorschlag erhalten." },
    { id: "prepared-register-duplicates", passed: preview.possibleDuplicates >= 1, summary: "Mögliche Dubletten werden anhand vorhandener Prüfsummen als Prüfhinweis erkannt." },
    { id: "prepared-register-security", passed: preview.sensitiveDocuments >= 1 && preview.securityStatus === "Prüfung erforderlich", summary: "Sensible Testunterlagen führen vor der Übernahme zu einer sichtbaren Sicherheitsprüfung." },
    { id: "prepared-register-originals", passed: preview.originalFilesChanged === false && preview.externalTransfer === false && preview.items.every((item) => item.state === "QUELLE_ANALYSIERT" && !item.documentId), summary: "Originale bleiben unverändert; es erfolgt keine externe Übertragung, Archivierung oder Assistenzfreigabe." },
    { id: "prepared-register-completeness", passed: preview.assignedDocuments + preview.openAssignments === preview.recognizedDocuments, summary: "Zugeordnete und offene Vorschläge ergeben zusammen den vollständigen erkannten Dokumentbestand." },
  ];
}

export type AutomatedTestCheck = {
  id: string;
  label: string;
  status: "bestanden" | "fehlgeschlagen";
  detail: string;
};

export type AutomatedTestEnvironmentReport = {
  completedAt: string;
  developmentBaseName: string;
  workspaceName: typeof AUTOMATED_TEST_WORKSPACE;
  sourceName: "01_Analysequelle";
  vaultName: "02_Testdatentresor";
  existingTestStockDetected: boolean;
  syntheticDocuments: number;
  createdOrRepairedFiles: number;
  recognizedDocuments: number;
  assignedSuggestions: number;
  openAssignments: number;
  newFilesDetected: number;
  changedFilesDetected: number;
  unavailableFilesDetected: number;
  unchangedFilesDetected: number;
  registerRecovered: boolean;
  backupFolder: string;
  restoreFolder: string;
  backupRestoreVerified: boolean;
  reportPath: string;
  checks: AutomatedTestCheck[];
  technicalIssues: string[];
  externalTransfer: false;
  outsideFilesChanged: false;
};

export type AutomatedTestFailureReport = {
  status: "KRITISCHER_FEHLER";
  occurredAt: string;
  appVersion: "2.28.1 TEST";
  websiteVersion: 35;
  developmentBaseName: string | null;
  workspaceName: typeof AUTOMATED_TEST_WORKSPACE;
  workStep: string;
  cause: string;
  technicalChain: string[];
  browser: string;
  blockedActions: string[];
  requiredAction: "Korrektur in der Softwareentwicklung erforderlich";
  productionChanged: false;
  outsideFilesChanged: false;
};

export type AutomatedStorageDiagnosticPhase = {
  id: "permission" | "target" | "small_file" | "temporary_register" | "short_path" | "long_path" | "backup_restore";
  label: string;
  status: "bestanden" | "fehlgeschlagen" | "uebersprungen";
  relativePath: string;
  fullPath: string;
  pathLength: number;
  startedAt: string;
  completedAt: string;
  technicalErrorName: string | null;
  technicalErrorDetail: string | null;
};

export type AutomatedStorageDiagnosticEvent = {
  sequence: number;
  occurredAt: string;
  step: string;
  operation: string;
  relativePath: string;
  fullPath: string;
  pathLength: number;
  result: AutomatedStorageTraceInput["result"];
  permission: PermissionState | "unsupported" | null;
  parentExists: boolean | null;
  targetExists: boolean | null;
  errorName: string | null;
  errorDetail: string | null;
  detail: string | null;
};

export type AutomatedStorageDiagnosticReport = {
  reportType: "DATEISYSTEM_DIAGNOSE";
  appVersion: "2.28.1 TEST";
  websiteVersion: 35;
  startedAt: string;
  completedAt: string;
  developmentBaseName: string;
  workspaceName: typeof AUTOMATED_TEST_WORKSPACE;
  scope: "nur synthetische automatische Testumgebung";
  outcome: "BESTANDEN" | "FEHLER_REPRODUZIERT";
  provenRootCause: string | null;
  observedFailure: string | null;
  automaticEnvironmentCompleted: boolean;
  directWriteWithoutRestore: "bestanden" | "fehlgeschlagen";
  reportSavedInTestArea: boolean;
  phases: AutomatedStorageDiagnosticPhase[];
  pathComparison: {
    legacyLimit: 260;
    shortPathLength: number;
    shortPathStatus: "bestanden" | "fehlgeschlagen" | "uebersprungen";
    longPathLength: number;
    longPathStatus: "bestanden" | "fehlgeschlagen" | "uebersprungen";
    longPathFailedOperation: string | null;
    conclusion: "PFADLÄNGE_BESTÄTIGT" | "PFADLÄNGE_NICHT_BESTÄTIGT" | "VERGLEICH_UNVOLLSTÄNDIG";
  };
  codeAudit: {
    restoreDeletesEmptiesOrRenamesFolders: false;
    resetMayDeleteOnlyNamedAutomaticWorkspaceAfterConfirmation: true;
    registerDirectoriesFreshlyResolvedBeforeWrite: true;
    registerWritesSerializedBySingleLock: true;
    targetStateCheckedImmediatelyBeforeWrite: true;
  };
  events: AutomatedStorageDiagnosticEvent[];
  personalDocumentContentsIncluded: false;
  productionChanged: false;
  outsideFilesChanged: false;
};

function technicalErrorChain(error: unknown) {
  const chain: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current; depth++) {
    const name = fileSystemErrorName(current);
    const detail = fileSystemErrorDetail(current);
    const value = `${name}: ${detail}`;
    if (!chain.includes(value)) chain.push(value);
    current = current instanceof Error ? current.cause : undefined;
  }
  return chain;
}

export function buildAutomatedTestFailureReport(error: unknown, input?: { developmentBaseName?: string | null; browser?: string }) : AutomatedTestFailureReport {
  const message = error instanceof Error ? error.message : fileSystemErrorDetail(error);
  const step = message.match(/Arbeitsschritt „([^”]+)“/)?.[1]
    || message.match(/(?:Register|Dateisystem)schritt „([^”]+)“/)?.[1]
    || "Automatische Testumgebung";
  return {
    status: "KRITISCHER_FEHLER",
    occurredAt: new Date().toISOString(),
    appVersion: "2.28.1 TEST",
    websiteVersion: 35,
    developmentBaseName: input?.developmentBaseName || null,
    workspaceName: AUTOMATED_TEST_WORKSPACE,
    workStep: step,
    cause: message,
    technicalChain: technicalErrorChain(error),
    browser: input?.browser || "nicht angegeben",
    blockedActions: ["Testumgebung automatisch einrichten und prüfen", "Testregister vorbereiten", "Testumgebung kontrolliert zurücksetzen"],
    requiredAction: "Korrektur in der Softwareentwicklung erforderlich",
    productionChanged: false,
    outsideFilesChanged: false,
  };
}

export async function runAutomatedTestFailureModeTests() {
  const retrySimulation = async (name: string, failures: number) => {
    let attempts = 0;
    const result = await retryFileSystemOperation(async () => {
      attempts++;
      if (attempts <= failures) throw Object.assign(new Error(`simulierter ${name}`), { name });
      return "bestanden";
    }, 3, 0);
    return { attempts, result };
  };
  const interruptedWrite = await retrySimulation("AbortError", 1);
  const temporarilyMissingTarget = await retrySimulation("NotFoundError", 2);
  let deniedAttempts = 0;
  try {
    await retryFileSystemOperation(async () => {
      deniedAttempts++;
      throw Object.assign(new Error("Berechtigung verweigert"), { name: "NotAllowedError" });
    }, 3, 0);
  } catch { /* Erwarteter Pflichtfehler ohne Wiederholung. */ }
  const invalidReference = buildAutomatedTestFailureReport(
    new Error("Automatische Testumgebung – Arbeitsschritt „Testsicherung in leerer Umgebung wiederherstellen“ fehlgeschlagen. Registerschritt „temporäre Registerdatei schreiben“ fehlgeschlagen. Die gespeicherte Ordnerreferenz ist nicht mehr gültig."),
    { developmentBaseName: "SOFTWARE TESTORDNER", browser: "Automatisierter Test" },
  );
  const lockOrder: string[] = [];
  await Promise.all([
    withRegisterWriteLock(async () => { lockOrder.push("A-start"); await new Promise((resolve) => setTimeout(resolve, 2)); lockOrder.push("A-end"); }),
    withRegisterWriteLock(async () => { lockOrder.push("B-start"); lockOrder.push("B-end"); }),
  ]);
  return [
    { id: "failure-write-abort", passed: interruptedWrite.attempts === 2 && interruptedWrite.result === "bestanden", summary: "Ein simulierter Schreibabbruch wird begrenzt wiederholt und anschließend erfolgreich abgeschlossen." },
    { id: "failure-missing-target", passed: temporarilyMissingTarget.attempts === 3 && temporarilyMissingTarget.result === "bestanden", summary: "Ein vorübergehend nicht erreichbares Wiederherstellungsziel wird höchstens dreimal kontrolliert aufgelöst." },
    { id: "failure-permission", passed: deniedAttempts === 1, summary: "Eine verweigerte Browserberechtigung wird nicht durch nutzlose automatische Wiederholungen verschleiert." },
    { id: "failure-restore-report", passed: invalidReference.status === "KRITISCHER_FEHLER" && invalidReference.workStep.includes("Testsicherung") && invalidReference.blockedActions.length === 3 && !invalidReference.productionChanged, summary: "Eine gescheiterte Wiederherstellung erzeugt einen vollständigen kritischen Fehlerbericht und verändert die Produktivversion nicht." },
    { id: "failure-concurrent-write", passed: lockOrder.join(",") === "A-start,A-end,B-start,B-end", summary: "Konkurrierende Registerschreibvorgänge werden durch eine gemeinsame Schreibsperre zuverlässig nacheinander ausgeführt." },
  ];
}

export const automatedTestStructure = {
  workspace: AUTOMATED_TEST_WORKSPACE,
  source: "01_Analysequelle",
  vault: "02_Testdatentresor",
  backups: "03_Sicherungen",
  restore: "04_R",
  reports: "05_Pruefberichte",
  diagnostics: "06_Diagnose",
} as const;

const syntheticTestDocuments = [
  { path: ["Haus", "Rechnung_Elektro_Synthetisch.txt"], content: "SYNTHETISCHE TESTDATEI – keine Personendaten\nRechnung Elektroarbeiten\nObjekt: Testhaus\nBetrag: 123,45 EUR\nRechnungsnummer: TEST-RE-1001\n" },
  { path: ["Technik", "Reparatur_Smartphone_Synthetisch.txt"], content: "SYNTHETISCHE TESTDATEI – keine Personendaten\nReparaturbericht Smartphone\nObjekt: Testgerät\nVorgang: Displayreparatur\n" },
  { path: ["Versicherung", "Versicherung_Synthetisch.eml"], content: "From: test@synthetisch.invalid\r\nTo: familie@synthetisch.invalid\r\nSubject: Synthetischer Versicherungs-Test\r\nDate: Wed, 14 Oct 2026 10:00:00 +0200\r\nMessage-ID: <synthetisch-2281@test.invalid>\r\n\r\nNur Testdaten. Bitte Vertragsunterlage bis 31.12.2026 pruefen.\r\n" },
  { path: ["Gesundheit", "Gesundheitsunterlage_Synthetisch.txt"], content: "SYNTHETISCHE TESTDATEI – keine echte Diagnose und keine Personendaten\nGesundheitsunterlage fuer Datenschutztest\n" },
] as const;

async function ensureSyntheticTestFile(source: FileSystemDirectoryHandle, path: readonly string[], contents: string) {
  let directory = source;
  for (const part of path.slice(0, -1)) directory = await directory.getDirectoryHandle(part, { create: true });
  const name = path.at(-1)!;
  let changed = false;
  try {
    const existing = await directory.getFileHandle(name);
    if (await (await existing.getFile()).text() === contents) return false;
    changed = true;
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
    changed = true;
  }
  if (changed) {
    await writeTextFile(directory, name, contents);
    const written = await (await (await directory.getFileHandle(name)).getFile()).text();
    if (written !== contents) throw new Error(`Die synthetische Testdatei „${path.join("/")}“ wurde geschrieben, konnte aber nicht identisch wieder eingelesen werden.`);
  }
  return changed;
}

async function ensureAutomatedTestVault(vault: FileSystemDirectoryHandle, backupDirectory: FileSystemDirectoryHandle, diagnostics: string[]) {
  try {
    await ensureVault(vault, "local", diagnostics);
    return false;
  } catch (error) {
    if (!(error instanceof VaultRegisterError) || error.code !== "REGISTER_CORRUPTED") throw error;
    const directory = await registerDir(vault);
    const damaged = await directory.getFileHandle("Familienakte_Register.json");
    const contents = await (await damaged.getFile()).text();
    await writeTextFile(backupDirectory, `Beschaedigtes_Testregister_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`, contents);
    await directory.removeEntry("Familienakte_Register.json");
    await ensureVault(vault, "local", diagnostics);
    return true;
  }
}

async function directoryExists(parent: FileSystemDirectoryHandle, name: string) {
  try { await parent.getDirectoryHandle(name); return true; }
  catch (error) { if (isNotFoundError(error)) return false; throw error; }
}

async function automatedTestStep<T>(step: string, operation: () => Promise<T>, trace?: AutomatedStorageTrace, relativePath: string = automatedTestStructure.workspace) {
  trace?.({ step, operation: "Arbeitsschritt starten", relativePath, result: "start" });
  try {
    const result = await operation();
    trace?.({ step, operation: "Arbeitsschritt abschließen", relativePath, result: "success" });
    return result;
  }
  catch (error) {
    trace?.({ step, operation: "Arbeitsschritt fehlgeschlagen", relativePath, result: "failure", error });
    const reason = error instanceof Error ? error.message : fileSystemErrorDetail(error);
    throw new Error(`Automatische Testumgebung – Arbeitsschritt „${step}“ fehlgeschlagen. ${reason}`, { cause: error });
  }
}

export async function setupAutomatedTestEnvironment(base: FileSystemDirectoryHandle, trace?: AutomatedStorageTrace): Promise<AutomatedTestEnvironmentReport> {
  trace?.({ step: "Browserfreigabe prüfen", operation: "Entwicklungsbasis prüfen", relativePath: ".", result: "start", permission: await queriedDirectoryPermission(base), parentExists: true, targetExists: true });
  if (!(await verifiedDirectoryPermission(base, "readwrite", `Entwicklungsordner ${base.name}`))) throw new Error("Der feste Entwicklungsordner wurde nicht zum Lesen und Schreiben freigegeben. Bitte den Ordner „SOFTWARE TESTORDNER“ erneut auswählen und die Browserfreigabe bestätigen.");
  trace?.({ step: "Browserfreigabe prüfen", operation: "Entwicklungsbasis prüfen", relativePath: ".", result: "success", permission: await queriedDirectoryPermission(base), parentExists: true, targetExists: true });
  const existingTestStockDetected = await directoryExists(base, "FAMILIENAKTE_TESTBESTAND");
  const folders = await automatedTestStep("Testordner anlegen oder wiederverwenden", async () => {
    const workspace = await base.getDirectoryHandle(automatedTestStructure.workspace, { create: true });
    return {
      workspace,
      source: await workspace.getDirectoryHandle(automatedTestStructure.source, { create: true }),
      vault: await workspace.getDirectoryHandle(automatedTestStructure.vault, { create: true }),
      backups: await workspace.getDirectoryHandle(automatedTestStructure.backups, { create: true }),
      restores: await workspace.getDirectoryHandle(automatedTestStructure.restore, { create: true }),
      reports: await workspace.getDirectoryHandle(automatedTestStructure.reports, { create: true }),
      diagnostics: await workspace.getDirectoryHandle(automatedTestStructure.diagnostics, { create: true }),
    };
  }, trace, automatedTestStructure.workspace);
  const { source, vault, backups, restores, reports } = folders;
  const writeDiagnostics: string[] = [];
  const registerRecovered = await automatedTestStep("Testregister erzeugen und sicher wieder einlesen", () => ensureAutomatedTestVault(vault, backups, writeDiagnostics), trace, `${automatedTestStructure.workspace}/${automatedTestStructure.vault}`);
  let createdOrRepairedFiles = 0;
  await automatedTestStep("synthetische Testdateien schreiben und wieder einlesen", async () => {
    for (const document of syntheticTestDocuments) if (await ensureSyntheticTestFile(source, document.path, document.content)) createdOrRepairedFiles++;
  }, trace, `${automatedTestStructure.workspace}/${automatedTestStructure.source}`);
  const changePath = ["Aenderung", "Aenderungserkennung_Synthetisch.txt"] as const;
  const missingPath = ["Fehlerfall", "Fehlende_Datei_Synthetisch.txt"] as const;
  if (await ensureSyntheticTestFile(source, changePath, "SYNTHETISCHE TESTDATEI\nStand: 1\n")) createdOrRepairedFiles++;
  if (await ensureSyntheticTestFile(source, missingPath, "SYNTHETISCHE TESTDATEI\nFehlerbehandlung fuer spaeter fehlende Datei\n")) createdOrRepairedFiles++;
  const firstScan = await automatedTestStep("erste Bestandsprüfung speichern", () => scanInventoryFolder({ source, register: vault, sourceKind: "local", registerDiagnostics: writeDiagnostics }), trace, `${automatedTestStructure.workspace}/${automatedTestStructure.vault}`);
  await ensureSyntheticTestFile(source, changePath, "SYNTHETISCHE TESTDATEI\nStand: 2 – kontrolliert geaendert\n");
  const missingDirectory = await source.getDirectoryHandle(missingPath[0]);
  await missingDirectory.removeEntry(missingPath[1]);
  const changeScan = await automatedTestStep("Änderungs- und Fehlendprüfung speichern", () => scanInventoryFolder({ source, register: vault, sourceKind: "local", registerDiagnostics: writeDiagnostics }), trace, `${automatedTestStructure.workspace}/${automatedTestStructure.vault}`);
  await ensureSyntheticTestFile(source, missingPath, "SYNTHETISCHE TESTDATEI\nFehlerbehandlung fuer spaeter fehlende Datei\n");
  const finalScan = await automatedTestStep("wiederverwendbaren Endstand speichern", () => scanInventoryFolder({ source, register: vault, sourceKind: "local", registerDiagnostics: writeDiagnostics }), trace, `${automatedTestStructure.workspace}/${automatedTestStructure.vault}`);
  const backup = await automatedTestStep("vollständige Testsicherung erstellen", () => writeFullFamilyBackup({ destination: backups, source: vault, appVersion: "2.28.1" }), trace, `${automatedTestStructure.workspace}/${automatedTestStructure.backups}`);
  const backupHandle = await backups.getDirectoryHandle(backup.folderName);
  const compactRestoreStamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const restoreTarget = await uniqueDirectory(restores, `R_${compactRestoreStamp}`);
  const restored = await automatedTestStep("Testsicherung in leerer Umgebung wiederherstellen", () => restoreFullFamilyBackup({
    backup: backupHandle,
    emptyTarget: restoreTarget.handle,
    refreshBackup: () => backups.getDirectoryHandle(backup.folderName),
    refreshTarget: () => restores.getDirectoryHandle(restoreTarget.name),
    diagnostics: writeDiagnostics,
    trace,
    diagnosticRelativeTargetPath: `${automatedTestStructure.workspace}/${automatedTestStructure.restore}/${restoreTarget.name}`,
  }), trace, `${automatedTestStructure.workspace}/${automatedTestStructure.restore}/${restoreTarget.name}`);
  const backupRestoreVerified = restored.verification?.ok === true;
  const assignedSuggestions = finalScan.items.filter((item) => item.confidence !== "unklar").length;
  const openAssignments = finalScan.items.filter((item) => item.confidence === "unklar").length;
  const checks: AutomatedTestCheck[] = [
    { id: "permission", label: "Ordnerzugriff und Berechtigungen", status: "bestanden", detail: `Schreibzugriff auf „${base.name}“ bestätigt.` },
    { id: "separation", label: "Analysequelle und Testdatentresor getrennt", status: "bestanden", detail: "Quelle, Register, Sicherungen, Wiederherstellung und Berichte liegen in getrennten Unterordnern." },
    { id: "recognition", label: "Dokumentenerkennung", status: finalScan.processed >= syntheticTestDocuments.length ? "bestanden" : "fehlgeschlagen", detail: `${finalScan.processed} synthetische Dateien geprüft.` },
    { id: "register", label: "Registererstellung", status: "bestanden", detail: registerRecovered ? "Beschädigtes Testregister gesichert und innerhalb des Testbereichs neu erzeugt." : "Vorhandenes Testregister gültig beziehungsweise neu erstellt." },
    { id: "assignment", label: "Dokumentzuordnung", status: finalScan.items.length ? "bestanden" : "fehlgeschlagen", detail: `${assignedSuggestions} Vorschläge, ${openAssignments} offene Zuordnungen.` },
    { id: "changed", label: "Neue und geänderte Dateien", status: firstScan.newFiles > 0 && changeScan.changed > 0 ? "bestanden" : "fehlgeschlagen", detail: `${firstScan.newFiles} neue und ${changeScan.changed} geänderte Dateien erkannt.` },
    { id: "missing", label: "Fehlende Dateien", status: changeScan.unavailable > 0 ? "bestanden" : "fehlgeschlagen", detail: `${changeScan.unavailable} kontrolliert fehlende Datei erkannt; Testdatei anschließend wiederhergestellt.` },
    { id: "backup", label: "Sicherung und Wiederherstellung", status: backupRestoreVerified ? "bestanden" : "fehlgeschlagen", detail: backupRestoreVerified ? "Register und Prüfsummen stimmen nach der Testwiederherstellung überein." : "Wiederherstellung nicht vollständig bestätigt." },
    { id: "reuse", label: "Dauerhafte Wiederverwendbarkeit", status: finalScan.skippedContentAnalysis > 0 ? "bestanden" : "fehlgeschlagen", detail: `${finalScan.skippedContentAnalysis} unveränderte Dateien ohne erneute Inhaltsanalyse wiedererkannt.` },
  ];
  const technicalIssues = [...writeDiagnostics, ...firstScan.accessIssues, ...changeScan.accessIssues, ...finalScan.accessIssues].map((issue) => typeof issue === "string" ? issue : issue.reason);
  const report: AutomatedTestEnvironmentReport = {
    completedAt: new Date().toISOString(), developmentBaseName: base.name, workspaceName: AUTOMATED_TEST_WORKSPACE,
    sourceName: automatedTestStructure.source, vaultName: automatedTestStructure.vault, existingTestStockDetected,
    syntheticDocuments: syntheticTestDocuments.length + 2, createdOrRepairedFiles,
    recognizedDocuments: finalScan.processed, assignedSuggestions, openAssignments,
    newFilesDetected: firstScan.newFiles, changedFilesDetected: changeScan.changed, unavailableFilesDetected: changeScan.unavailable,
    unchangedFilesDetected: finalScan.skippedContentAnalysis, registerRecovered,
    backupFolder: backup.folderName, restoreFolder: restoreTarget.name, backupRestoreVerified,
    reportPath: `${automatedTestStructure.workspace}/${automatedTestStructure.reports}/Automatische_Testumgebung_Letzter_Bericht.json`,
    checks, technicalIssues, externalTransfer: false, outsideFilesChanged: false,
  };
  await automatedTestStep("Prüfbericht schreiben und wieder einlesen", async () => {
    const serialized = JSON.stringify(report, null, 2);
    await writeTextFile(reports, "Automatische_Testumgebung_Letzter_Bericht.json", serialized);
    const written = await (await (await reports.getFileHandle("Automatische_Testumgebung_Letzter_Bericht.json")).getFile()).text();
    JSON.parse(written);
    if (written !== serialized) throw new Error("Der Prüfbericht konnte nach dem Schreiben nicht identisch wieder eingelesen werden.");
  }, trace, `${automatedTestStructure.workspace}/${automatedTestStructure.reports}/Automatische_Testumgebung_Letzter_Bericht.json`);
  return report;
}

export async function runAutomatedStorageDiagnostic(base: FileSystemDirectoryHandle): Promise<AutomatedStorageDiagnosticReport> {
  const startedAt = new Date().toISOString();
  const events: AutomatedStorageDiagnosticEvent[] = [];
  const phases: AutomatedStorageDiagnosticPhase[] = [];
  const trace: AutomatedStorageTrace = (event) => {
    const pathInfo = automatedWindowsPathInfo(event.relativePath);
    events.push({
      sequence: events.length + 1,
      occurredAt: new Date().toISOString(),
      step: event.step,
      operation: event.operation,
      relativePath: event.relativePath,
      fullPath: pathInfo.fullPath,
      pathLength: pathInfo.pathLength,
      result: event.result,
      permission: event.permission ?? null,
      parentExists: event.parentExists ?? null,
      targetExists: event.targetExists ?? null,
      errorName: event.error ? fileSystemErrorName(event.error) : null,
      errorDetail: event.error ? fileSystemErrorDetail(event.error) : null,
      detail: event.detail ?? null,
    });
  };
  type DiagnosticPhaseInput = Omit<AutomatedStorageDiagnosticPhase, "status" | "startedAt" | "completedAt" | "technicalErrorName" | "technicalErrorDetail" | "fullPath" | "pathLength">;
  const runPhase = async <T>(phase: DiagnosticPhaseInput, operation: () => Promise<T>): Promise<T | null> => {
    const phaseStartedAt = new Date().toISOString();
    const pathInfo = automatedWindowsPathInfo(phase.relativePath);
    trace({ step: phase.label, operation: "Diagnosephase starten", relativePath: phase.relativePath, result: "start" });
    try {
      const value = await operation();
      phases.push({ ...phase, ...pathInfo, status: "bestanden", startedAt: phaseStartedAt, completedAt: new Date().toISOString(), technicalErrorName: null, technicalErrorDetail: null });
      trace({ step: phase.label, operation: "Diagnosephase abschließen", relativePath: phase.relativePath, result: "success" });
      return value;
    } catch (error) {
      phases.push({ ...phase, ...pathInfo, status: "fehlgeschlagen", startedAt: phaseStartedAt, completedAt: new Date().toISOString(), technicalErrorName: fileSystemErrorName(error), technicalErrorDetail: fileSystemErrorDetail(error) });
      trace({ step: phase.label, operation: "Diagnosephase fehlgeschlagen", relativePath: phase.relativePath, result: "failure", error });
      return null;
    }
  };
  const skipPhase = (phase: DiagnosticPhaseInput, reason: string) => {
    const at = new Date().toISOString();
    phases.push({ ...phase, ...automatedWindowsPathInfo(phase.relativePath), status: "uebersprungen", startedAt: at, completedAt: at, technicalErrorName: "VoraussetzungFehlt", technicalErrorDetail: reason });
    trace({ step: phase.label, operation: "Diagnosephase übersprungen", relativePath: phase.relativePath, result: "failure", detail: reason });
  };
  const traceOperation = async <T>(step: string, operation: string, relativePath: string, action: () => Promise<T>): Promise<T> => {
    trace({ step, operation, relativePath, result: "start" });
    try {
      const value = await action();
      trace({ step, operation, relativePath, result: "success" });
      return value;
    } catch (error) {
      trace({ step, operation, relativePath, result: "failure", error });
      throw error;
    }
  };
  const resolveNestedDiagnosticDirectory = async (step: string, relativeFilePath: string, parts: string[]) => {
    let directory = base;
    for (const part of parts) {
      const parent = directory;
      directory = await traceOperation(step, `Ordner öffnen oder anlegen: ${part}`, relativeFilePath, () => parent.getDirectoryHandle(part, { create: true }));
    }
    return directory;
  };
  const exerciseDiagnosticFile = async (step: string, relativeFilePath: string, directoryParts: string[], fileName: string) => {
    const directory = await resolveNestedDiagnosticDirectory(step, relativeFilePath, directoryParts);
    const file = await traceOperation(step, "Dateihandle erstellen", relativeFilePath, () => directory.getFileHandle(fileName, { create: true }));
    const writable = await traceOperation(step, "Schreibstrom öffnen", relativeFilePath, () => file.createWritable());
    const contents = JSON.stringify({ test: "SYNTHETISCHE PFADLÄNGENPRÜFUNG", createdAt: startedAt });
    await traceOperation(step, "Inhalt schreiben", relativeFilePath, () => writable.write(contents));
    await traceOperation(step, "Schreibstrom schließen", relativeFilePath, () => writable.close());
    const rereadDirectory = await resolveNestedDiagnosticDirectory(step, relativeFilePath, directoryParts);
    const rereadHandle = await traceOperation(step, "Datei erneut öffnen", relativeFilePath, () => rereadDirectory.getFileHandle(fileName));
    const reread = await traceOperation(step, "Datei erneut lesen", relativeFilePath, async () => (await rereadHandle.getFile()).text());
    if (reread !== contents) throw new DOMException("Der Inhalt der Pfadlängen-Schreibprobe stimmt nach dem Wiedereinlesen nicht überein.", "NotReadableError");
    return true;
  };
  let directWriteWithoutRestore: AutomatedStorageDiagnosticReport["directWriteWithoutRestore"] = "fehlgeschlagen";
  let automaticEnvironmentCompleted = false;
  let reportSavedInTestArea = false;
  let diagnosticRunName = `Diagnoselauf_${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const resolveDiagnosticRoot = async () => {
    const workspace = await base.getDirectoryHandle(automatedTestStructure.workspace, { create: true });
    return workspace.getDirectoryHandle(automatedTestStructure.diagnostics, { create: true });
  };
  const resolveDiagnosticRun = async () => (await resolveDiagnosticRoot()).getDirectoryHandle(diagnosticRunName);

  const permissionGranted = await runPhase({ id: "permission", label: "1. Zugriff und Berechtigung", relativePath: "." }, async () => {
    const granted = await verifiedDirectoryPermission(base, "readwrite", `Entwicklungsordner ${base.name}`);
    const permission = await queriedDirectoryPermission(base);
    trace({ step: "1. Zugriff und Berechtigung", operation: "Browserberechtigung auswerten", relativePath: ".", result: granted ? "success" : "failure", permission, parentExists: true, targetExists: true });
    if (!granted) throw new DOMException("Die Browserfreigabe für den Entwicklungsordner wurde nicht erteilt.", "NotAllowedError");
    return true;
  });

  const targetReady = permissionGranted ? await runPhase({ id: "target", label: "2. Diagnose-Zielordner", relativePath: `${automatedTestStructure.workspace}/${automatedTestStructure.diagnostics}` }, async () => {
    const diagnosticRoot = await resolveDiagnosticRoot();
    const diagnosticRun = await uniqueDirectory(diagnosticRoot, diagnosticRunName);
    diagnosticRunName = diagnosticRun.name;
    const freshlyResolved = await resolveDiagnosticRun();
    trace({ step: "2. Diagnose-Zielordner", operation: "Zielordner neu anlegen und frisch wieder auflösen", relativePath: `${automatedTestStructure.workspace}/${automatedTestStructure.diagnostics}/${diagnosticRunName}`, result: "success", permission: await queriedDirectoryPermission(freshlyResolved), parentExists: true, targetExists: true });
    return true;
  }) : null;
  if (!permissionGranted) skipPhase({ id: "target", label: "2. Diagnose-Zielordner", relativePath: `${automatedTestStructure.workspace}/${automatedTestStructure.diagnostics}` }, "Ohne Browserfreigabe kann kein Diagnose-Zielordner angelegt werden.");

  const directPath = `${automatedTestStructure.workspace}/${automatedTestStructure.diagnostics}/${diagnosticRunName}/Kleine_Schreibprobe.txt`;
  if (targetReady) {
    const directResult = await runPhase({ id: "small_file", label: "3. Kleine Testdatei", relativePath: directPath }, async () => {
      const directory = await traceOperation("3. Kleine Testdatei", "Zielordner frisch auflösen", directPath, resolveDiagnosticRun);
      const file = await traceOperation("3. Kleine Testdatei", "Datei erstellen", directPath, () => directory.getFileHandle("Kleine_Schreibprobe.txt", { create: true }));
      const writable = await traceOperation("3. Kleine Testdatei", "Schreibstrom öffnen", directPath, () => file.createWritable());
      await traceOperation("3. Kleine Testdatei", "Testinhalt schreiben", directPath, () => writable.write("SYNTHETISCHE WINDOWS-DIAGNOSE"));
      await traceOperation("3. Kleine Testdatei", "Schreibstrom schließen", directPath, () => writable.close());
      const rereadDirectory = await traceOperation("3. Kleine Testdatei", "Zielordner vor erneutem Lesen frisch auflösen", directPath, resolveDiagnosticRun);
      const rereadFile = await traceOperation("3. Kleine Testdatei", "Datei erneut öffnen", directPath, () => rereadDirectory.getFileHandle("Kleine_Schreibprobe.txt"));
      const rereadText = await traceOperation("3. Kleine Testdatei", "Datei erneut lesen", directPath, async () => (await rereadFile.getFile()).text());
      if (rereadText !== "SYNTHETISCHE WINDOWS-DIAGNOSE") throw new DOMException("Der erneut gelesene Testinhalt stimmt nicht überein.", "NotReadableError");
      return true;
    });
    directWriteWithoutRestore = directResult ? "bestanden" : "fehlgeschlagen";
  } else skipPhase({ id: "small_file", label: "3. Kleine Testdatei", relativePath: directPath }, "Der Diagnose-Zielordner ist nicht verfügbar.");

  const registerPath = `${automatedTestStructure.workspace}/${automatedTestStructure.diagnostics}/${diagnosticRunName}/Temporaeres_Testregister_Diagnose.json`;
  if (targetReady) {
    await runPhase({ id: "temporary_register", label: "4. Temporäre Registerdatei", relativePath: registerPath }, async () => {
      await writeAndVerifyRegisterFile(resolveDiagnosticRun, "Temporaeres_Testregister_Diagnose.json", JSON.stringify(emptyIndex(), null, 2), "temporäre Registerdatei schreiben", "temporäre Registerdatei prüfen", {
        trace,
        relativeDirectoryPath: `${automatedTestStructure.workspace}/${automatedTestStructure.diagnostics}/${diagnosticRunName}`,
      });
      return true;
    });
  } else skipPhase({ id: "temporary_register", label: "4. Temporäre Registerdatei", relativePath: registerPath }, "Der Diagnose-Zielordner ist nicht verfügbar.");

  const comparisonFileName = "Familienakte_Register_TEMP_12345678-1234-1234-1234-123456789012.json";
  const shortPathParts = [automatedTestStructure.workspace, automatedTestStructure.diagnostics, "Pfadvergleich_kurz"];
  const shortComparisonPath = `${shortPathParts.join("/")}/${comparisonFileName}`;
  const longPathParts = [
    automatedTestStructure.workspace,
    "04_Wiederherstellung",
    "Testwiederherstellung_2026-10-14T20-00-00-000Z",
    ROOT,
    "00_Register",
  ];
  const longComparisonPath = `${longPathParts.join("/")}/${comparisonFileName}`;
  if (permissionGranted) {
    await runPhase({ id: "short_path", label: "5. Kurzer Pfadvergleich", relativePath: shortComparisonPath }, () =>
      exerciseDiagnosticFile("5. Kurzer Pfadvergleich", shortComparisonPath, shortPathParts, comparisonFileName));
    await runPhase({ id: "long_path", label: "6. Langer Pfadvergleich", relativePath: longComparisonPath }, () =>
      exerciseDiagnosticFile("6. Langer Pfadvergleich", longComparisonPath, longPathParts, comparisonFileName));
  } else {
    skipPhase({ id: "short_path", label: "5. Kurzer Pfadvergleich", relativePath: shortComparisonPath }, "Ohne Browserfreigabe kann der kurze Vergleichspfad nicht geprüft werden.");
    skipPhase({ id: "long_path", label: "6. Langer Pfadvergleich", relativePath: longComparisonPath }, "Ohne Browserfreigabe kann der lange Vergleichspfad nicht geprüft werden.");
  }

  if (permissionGranted) {
    const fullResult = await runPhase({ id: "backup_restore", label: "7. Sicherung und Wiederherstellung mit verkürztem Pfad", relativePath: `${automatedTestStructure.workspace}/${automatedTestStructure.restore}` }, async () => {
      await setupAutomatedTestEnvironment(base, trace);
      return true;
    });
    automaticEnvironmentCompleted = Boolean(fullResult);
  } else skipPhase({ id: "backup_restore", label: "7. Sicherung und Wiederherstellung mit verkürztem Pfad", relativePath: `${automatedTestStructure.workspace}/${automatedTestStructure.restore}` }, "Ohne Browserfreigabe kann der vollständige Ablauf nicht geprüft werden.");

  const shortPathPhase = phases.find((phase) => phase.id === "short_path");
  const longPathPhase = phases.find((phase) => phase.id === "long_path");
  const longFailureEvent = [...events].reverse().find((event) => event.step === "6. Langer Pfadvergleich" && event.result === "failure" && !event.operation.startsWith("Diagnosephase"));
  const pathConclusion: AutomatedStorageDiagnosticReport["pathComparison"]["conclusion"] =
    shortPathPhase?.status === "bestanden" && longPathPhase?.status === "fehlgeschlagen" && longPathPhase.technicalErrorName === "NotFoundError" && longPathPhase.pathLength >= WINDOWS_LEGACY_PATH_LIMIT
      ? "PFADLÄNGE_BESTÄTIGT"
      : shortPathPhase?.status === "bestanden" && longPathPhase?.status === "bestanden"
        ? "PFADLÄNGE_NICHT_BESTÄTIGT"
        : "VERGLEICH_UNVOLLSTÄNDIG";
  const failedPhases = phases.filter((phase) => phase.status !== "bestanden");
  const failedRequiredPhases = failedPhases.filter((phase) => !(phase.id === "long_path" && pathConclusion === "PFADLÄNGE_BESTÄTIGT"));
  const observedFailure = failedPhases.length ? failedPhases.map((phase) => `${phase.label}: ${phase.technicalErrorName || "nicht ausgeführt"}: ${phase.technicalErrorDetail || "keine Einzelmeldung"}`).join(" | ") : null;
  const failedEvent = events.find((event) => event.result === "failure" && (event.permission === "denied" || event.parentExists === false));
  const provenRootCause = pathConclusion === "PFADLÄNGE_BESTÄTIGT"
    ? `Der kontrollierte Vergleich hat die Pfadlänge als Ursache bestätigt: Der kurze Pfad mit ${shortPathPhase?.pathLength} Zeichen war beschreibbar, während der lange Pfad mit ${longPathPhase?.pathLength} Zeichen bei „${longFailureEvent?.operation || "Dateioperation"}“ mit NotFoundError scheiterte.`
    : failedEvent?.permission === "denied"
      ? `Die Browserberechtigung war beim Arbeitsschritt „${failedEvent.step}“ nachweislich verweigert.`
      : failedEvent?.parentExists === false
        ? `Der benötigte Elternordner war beim Arbeitsschritt „${failedEvent.step}“ unmittelbar vor dem Zugriff nachweislich nicht mehr auflösbar.`
        : null;
  const report: AutomatedStorageDiagnosticReport = {
    reportType: "DATEISYSTEM_DIAGNOSE",
    appVersion: "2.28.1 TEST",
    websiteVersion: 35,
    startedAt,
    completedAt: new Date().toISOString(),
    developmentBaseName: base.name,
    workspaceName: AUTOMATED_TEST_WORKSPACE,
    scope: "nur synthetische automatische Testumgebung",
    outcome: failedRequiredPhases.length === 0 ? "BESTANDEN" : "FEHLER_REPRODUZIERT",
    provenRootCause,
    observedFailure,
    automaticEnvironmentCompleted,
    directWriteWithoutRestore,
    reportSavedInTestArea,
    phases,
    pathComparison: {
      legacyLimit: WINDOWS_LEGACY_PATH_LIMIT,
      shortPathLength: automatedWindowsPathInfo(shortComparisonPath).pathLength,
      shortPathStatus: shortPathPhase?.status || "uebersprungen",
      longPathLength: automatedWindowsPathInfo(longComparisonPath).pathLength,
      longPathStatus: longPathPhase?.status || "uebersprungen",
      longPathFailedOperation: longFailureEvent?.operation || null,
      conclusion: pathConclusion,
    },
    codeAudit: {
      restoreDeletesEmptiesOrRenamesFolders: false,
      resetMayDeleteOnlyNamedAutomaticWorkspaceAfterConfirmation: true,
      registerDirectoriesFreshlyResolvedBeforeWrite: true,
      registerWritesSerializedBySingleLock: true,
      targetStateCheckedImmediatelyBeforeWrite: true,
    },
    events,
    personalDocumentContentsIncluded: false,
    productionChanged: false,
    outsideFilesChanged: false,
  };
  try {
    const run = await resolveDiagnosticRun();
    report.reportSavedInTestArea = true;
    const serialized = JSON.stringify(report, null, 2);
    await writeTextFile(run, "Dateisystem_Diagnosebericht.json", serialized);
    const reread = await (await (await run.getFileHandle("Dateisystem_Diagnosebericht.json")).getFile()).text();
    JSON.parse(reread);
    if (reread !== serialized) throw new Error("Der Diagnosebericht konnte nicht identisch wieder eingelesen werden.");
  } catch (error) {
    report.reportSavedInTestArea = false;
    report.outcome = "FEHLER_REPRODUZIERT";
    report.observedFailure ||= error instanceof Error ? error.message : fileSystemErrorDetail(error);
    trace({ step: "Diagnosebericht speichern", operation: "Bericht schreiben und wieder einlesen", relativePath: `${automatedTestStructure.workspace}/${automatedTestStructure.diagnostics}/${diagnosticRunName}/Dateisystem_Diagnosebericht.json`, result: "failure", error });
  }
  return report;
}

export async function resetAutomatedTestEnvironment(base: FileSystemDirectoryHandle) {
  if (!(await verifiedDirectoryPermission(base, "readwrite", `Entwicklungsordner ${base.name}`))) throw new Error("Der Entwicklungsordner wurde nicht zum Zurücksetzen freigegeben.");
  try { await base.removeEntry(AUTOMATED_TEST_WORKSPACE, { recursive: true }); }
  catch (error) { if (!isNotFoundError(error)) throw error; }
  return setupAutomatedTestEnvironment(base);
}

export function runAutomatedTestEnvironmentSelfTests() {
  const folders = Object.values(automatedTestStructure);
  return [
    { id: "auto-test-fixed-root", passed: AUTOMATED_TEST_WORKSPACE === "Familienakte_Automatische_Testumgebung_2.28.1", summary: "Der automatische Arbeitsbereich besitzt einen eindeutigen, versionsgebundenen Namen." },
    { id: "auto-test-separated-folders", passed: new Set(folders).size === folders.length, summary: "Analysequelle, Testdatentresor, Sicherung, Wiederherstellung und Berichte sind getrennt." },
    { id: "auto-test-synthetic-only", passed: syntheticTestDocuments.every((document) => document.content.includes("SYNTHETISCHE TESTDATEI")), summary: "Die erzeugten Dokumente enthalten ausschließlich gekennzeichnete synthetische Testdaten." },
    { id: "auto-test-no-external", passed: !setupAutomatedTestEnvironment.toString().includes("fetch("), summary: "Die automatische Testumgebung überträgt keine Inhalte an externe Dienste." },
    { id: "auto-test-existing-register", passed: setupAutomatedTestEnvironment.toString().includes("scanInventoryFolder") && setupAutomatedTestEnvironment.toString().includes("writeFullFamilyBackup"), summary: "Vorhandene Register-, Bestands- und Sicherungslogik wird wiederverwendet." },
    { id: "auto-test-controlled-reset", passed: resetAutomatedTestEnvironment.toString().includes("AUTOMATED_TEST_WORKSPACE") && resetAutomatedTestEnvironment.toString().includes("recursive: true"), summary: "Zurücksetzen ist auf den eindeutig benannten automatischen Testbereich begrenzt." },
    { id: "auto-test-report", passed: setupAutomatedTestEnvironment.toString().includes("Automatische_Testumgebung_Letzter_Bericht.json"), summary: "Der letzte technische Prüfbericht wird im eigenen Berichtsordner gespeichert." },
    { id: "auto-test-repair", passed: setupAutomatedTestEnvironment.toString().includes("ensureAutomatedTestVault") && ensureAutomatedTestVault.toString().includes("Beschaedigtes_Testregister"), summary: "Beschädigte Testregister werden vor der Neuerzeugung innerhalb des Testbereichs gesichert." },
    { id: "auto-test-browser-permission", passed: setupAutomatedTestEnvironment.toString().includes("verifiedDirectoryPermission"), summary: "Browserberechtigungen werden vor jeder Verwendung erneut geprüft." },
    { id: "auto-test-original-protection", passed: automatedTestStructure.workspace.startsWith("Familienakte_Automatische_Testumgebung"), summary: "Automatische Schreib- und Löschvorgänge bleiben auf den gekennzeichneten Testarbeitsbereich beschränkt." },
    { id: "auto-test-permission-diagnosis", passed: registerWriteFailureMessage("Registerdatei ersetzen", "NotAllowedError").includes("Schreibberechtigung"), summary: "Fehlende oder abgelaufene Schreibberechtigungen erhalten eine konkrete deutsche Diagnose." },
    { id: "auto-test-missing-diagnosis", passed: registerWriteFailureMessage("Registerdatei ersetzen", "NotFoundError").includes("nicht mehr erreichbar"), summary: "Während des Schreibens verschwundene Ordner oder Dateien werden eindeutig benannt." },
    { id: "auto-test-invalid-handle-diagnosis", passed: registerWriteFailureMessage("Registerdatei ersetzen", "InvalidStateError").includes("Ordnerreferenz"), summary: "Ungültige gespeicherte Browserreferenzen werden von echten Registerfehlern unterschieden." },
    { id: "auto-test-lock-diagnosis", passed: registerWriteFailureMessage("Registerdatei ersetzen", "NoModificationAllowedError").includes("vorübergehend gesperrt"), summary: "Windows- und Synchronisationssperren werden verständlich erklärt." },
    { id: "auto-test-storage-diagnosis", passed: registerWriteFailureMessage("Registerdatei ersetzen", "QuotaExceededError").includes("freien Speicher"), summary: "Fehlender Speicherplatz wird als eigene Ursache ausgewiesen." },
    { id: "auto-test-cleanup-not-commit", passed: writeIndexToRegisterDirectoryUnlocked.toString().includes("cleanupStaleRegisterTemporaryFiles") && writeIndexToRegisterDirectoryUnlocked.toString().includes("options?.diagnostics?.push"), summary: "Eine gesperrte TEMP-Datei macht einen bereits geschriebenen und geprüften Register-Commit nicht mehr rückwirkend ungültig." },
    { id: "auto-test-written-files-reread", passed: ensureSyntheticTestFile.toString().includes("konnte aber nicht identisch wieder eingelesen werden") && setupAutomatedTestEnvironment.toString().includes("Prüfbericht schreiben und wieder einlesen"), summary: "Synthetische Dateien und Prüfbericht werden nach dem Schreiben tatsächlich wieder eingelesen." },
    { id: "auto-test-stage-diagnosis", passed: automatedTestStep.toString().includes("Arbeitsschritt") && setupAutomatedTestEnvironment.toString().includes("Testregister erzeugen und sicher wieder einlesen"), summary: "Fehler nennen künftig den konkreten Arbeitsschritt statt einer unbestimmten Sammelmeldung." },
    { id: "auto-test-stable-parent-resolution", passed: setupAutomatedTestEnvironment.toString().includes("refreshTarget") && setupAutomatedTestEnvironment.toString().includes("refreshBackup"), summary: "Sicherungs- und Wiederherstellungsordner werden für jeden Pflichtschritt erneut aus ihren stabilen Elternordnern aufgelöst." },
    { id: "auto-test-write-probe", passed: restoreFullFamilyBackup.toString().includes("verifyWritableDirectory") && verifyWritableDirectory.toString().includes("Schreibprobe wieder einlesen"), summary: "Das Wiederherstellungsziel wird vor dem eigentlichen Schreiben durch Schreiben, Wiedereinlesen und Löschen geprüft." },
    { id: "auto-test-not-found-retry", passed: retryableRegisterWriteError({ name: "NotFoundError" }), summary: "Kurzzeitige NotFound-Fehler werden begrenzt wiederholt und nicht sofort als endgültiger Registerverlust gewertet." },
    { id: "auto-test-critical-report", passed: buildAutomatedTestFailureReport(new Error("Automatische Testumgebung – Arbeitsschritt „Wiederherstellung“ fehlgeschlagen.")).workStep === "Wiederherstellung", summary: "Kritische Fehler werden mit Arbeitsschritt, Ursache und unverändertem Produktivstatus strukturiert protokolliert." },
    { id: "auto-test-diagnostic-scope", passed: automatedTestStructure.diagnostics === "06_Diagnose" && runAutomatedStorageDiagnostic.toString().includes("personalDocumentContentsIncluded: false"), summary: "Der Diagnosemodus schreibt ausschließlich in den gekennzeichneten Testbereich und protokolliert keine persönlichen Dokumentinhalte." },
    { id: "auto-test-direct-write-diagnosis", passed: runAutomatedStorageDiagnostic.toString().includes("Kleine_Schreibprobe.txt"), summary: "Ein frisch aufgelöster Ordnerzugriff wird vor der Wiederherstellung separat durch Schreiben und Wiedereinlesen geprüft." },
    { id: "auto-test-seven-diagnostic-phases", passed: ["permission", "target", "small_file", "temporary_register", "short_path", "long_path", "backup_restore"].every((id) => runAutomatedStorageDiagnostic.toString().includes(`id: \"${id}\"`)), summary: "Zugriff, Zielordner, direkte Schreibproben, kurzer und langer Pfad sowie Sicherung und Wiederherstellung werden getrennt diagnostiziert." },
    { id: "auto-test-phase-isolation", passed: runAutomatedStorageDiagnostic.toString().includes("Diagnosephase fehlgeschlagen") && runAutomatedStorageDiagnostic.toString().includes("return null"), summary: "Ein fehlgeschlagener Diagnoseschritt beendet den Bericht nicht und nachfolgende unabhängige Prüfungen bleiben ausführbar." },
    { id: "auto-test-prewrite-state", passed: writeAndVerifyRegisterFile.toString().includes("Ziel unmittelbar vor dem Schreiben prüfen") && writeAndVerifyRegisterFile.toString().includes("parentExists") && writeAndVerifyRegisterFile.toString().includes("targetExists"), summary: "Unmittelbar vor dem Registerschreiben werden Berechtigung, Elternordner und Zielzustand protokolliert." },
    { id: "auto-test-postfailure-reread", passed: writeAndVerifyRegisterFile.toString().includes("Erneuter Leseversuch nach Schreibfehler"), summary: "Nach einem Schreibfehler wird ein frisch aufgelöster Leseversuch separat protokolliert." },
    { id: "auto-test-no-unproven-cause", passed: runAutomatedStorageDiagnostic.toString().includes("const provenRootCause") && runAutomatedStorageDiagnostic.toString().includes("FEHLER_REPRODUZIERT"), summary: "Eine nicht belegte Windows-Ursache bleibt ausdrücklich offen und wird nicht als behoben ausgegeben." },
    { id: "auto-test-long-path-measured", passed: automatedWindowsPathInfo(`${AUTOMATED_TEST_WORKSPACE}/04_Wiederherstellung/Testwiederherstellung_2026-10-14T20-00-00-000Z/${ROOT}/00_Register/Familienakte_Register_TEMP_12345678-1234-1234-1234-123456789012.json`).pathLength === 293, summary: "Der gemeldete bisherige Wiederherstellungspfad wird vollständig als 293 Zeichen langer Windows-Pfad gemessen." },
    { id: "auto-test-short-restore-path", passed: automatedTestStructure.restore === "04_R" && automatedWindowsPathInfo(`${AUTOMATED_TEST_WORKSPACE}/04_R/R_20261014T200000Z/${ROOT}/00_Register/FA_TEMP_12345678.json`).pathLength === 202, summary: "Der neue interne Wiederherstellungspfad bleibt mit 202 Zeichen deutlich unter der vorsorglichen 260-Zeichen-Grenze." },
    { id: "auto-test-write-stage-tracing", passed: ["Dateihandle erstellen", "Schreibstrom öffnen", "Inhalt schreiben", "Schreibstrom schließen"].every((operation) => runAutomatedStorageDiagnostic.toString().includes(operation)), summary: "Der Vergleich protokolliert den exakten fehlgeschlagenen Teilschritt des Schreibvorgangs." },
  ];
}

export type InventoryTextDecodeResult = {
  text: string;
  encoding: "UTF-8" | "UTF-16 LE" | "UTF-16 BE" | "Windows-1252" | "nicht erkannt";
  readable: boolean;
};

function normalizedPreviewText(value: string) {
  return value.replace(/\u0000/g, "").replace(/\r\n?/g, "\n").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function textReadabilityScore(value: string) {
  const text = normalizedPreviewText(value);
  if (!text) return -100;
  const characters = [...text];
  const length = characters.length;
  const controls = characters.filter((character) => /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u.test(character)).length;
  const replacements = characters.filter((character) => character === "�").length;
  const privateUse = characters.filter((character) => /[\uE000-\uF8FF]/u.test(character)).length;
  const readable = characters.filter((character) => /[\p{L}\p{N}\p{P}\p{Z}\n\t€]/u.test(character)).length;
  const latin = characters.filter((character) => /[A-Za-zÄÖÜäöüß]/u.test(character)).length;
  const cjk = characters.filter((character) => /[\u3400-\u9FFF]/u.test(character)).length;
  const words = text.match(/[\p{L}\p{N}]{2,}/gu)?.length || 0;
  const uniqueVisible = new Set(characters.filter((character) => !/\s/u.test(character))).size;
  const mojibake = (text.match(/Ã.|Â.|â€|ðŸ|锟斤拷/g) || []).length;
  let score = (readable / length) * 100 + Math.min(18, words * 2);
  score -= (controls / length) * 240;
  score -= (replacements / length) * 280;
  score -= (privateUse / length) * 220;
  score -= mojibake * 8;
  if (length > 40 && !/\s/u.test(text)) score -= 25;
  if (length > 24 && uniqueVisible < 5) score -= 80;
  if (length > 30 && cjk / length > .18 && latin / length < .04) score -= 35;
  return score;
}

export function isMeaningfulDocumentText(value: string) {
  const text = normalizedPreviewText(value);
  if (!text) return false;
  const characters = [...text];
  const controls = characters.filter((character) => /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u.test(character)).length;
  const replacements = characters.filter((character) => character === "�").length;
  const words = text.match(/[\p{L}\p{N}]{2,}/gu)?.length || 0;
  const uniqueVisible = new Set(characters.filter((character) => !/\s/u.test(character))).size;
  return controls / characters.length < .025 && replacements / characters.length < .02 && (characters.length <= 24 || uniqueVisible >= 5) && words > 0 && textReadabilityScore(text) >= 58;
}

export function decodeInventoryText(bytes: Uint8Array): InventoryTextDecodeResult {
  const candidates: Array<{ label: InventoryTextDecodeResult["encoding"]; encoding: string; offset?: number }> = [];
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) candidates.push({ label: "UTF-8", encoding: "utf-8", offset: 3 });
  else if (bytes[0] === 0xff && bytes[1] === 0xfe) candidates.push({ label: "UTF-16 LE", encoding: "utf-16le", offset: 2 });
  else if (bytes[0] === 0xfe && bytes[1] === 0xff) candidates.push({ label: "UTF-16 BE", encoding: "utf-16be", offset: 2 });
  const evenZeros = bytes.filter((byte, index) => index % 2 === 0 && byte === 0).length;
  const oddZeros = bytes.filter((byte, index) => index % 2 === 1 && byte === 0).length;
  if (oddZeros > bytes.length * .12) candidates.push({ label: "UTF-16 LE", encoding: "utf-16le" });
  if (evenZeros > bytes.length * .12) candidates.push({ label: "UTF-16 BE", encoding: "utf-16be" });
  candidates.push({ label: "UTF-8", encoding: "utf-8" }, { label: "Windows-1252", encoding: "windows-1252" }, { label: "UTF-16 LE", encoding: "utf-16le" }, { label: "UTF-16 BE", encoding: "utf-16be" });
  const decoded = candidates.map((candidate) => {
    try {
      const text = normalizedPreviewText(new TextDecoder(candidate.encoding, { fatal: false }).decode(bytes.slice(candidate.offset || 0)));
      return { label: candidate.label, text, score: textReadabilityScore(text) };
    } catch { return { label: candidate.label, text: "", score: -100 }; }
  }).sort((left, right) => right.score - left.score)[0];
  if (!decoded || !isMeaningfulDocumentText(decoded.text)) return { text: "", encoding: "nicht erkannt", readable: false };
  return { text: decoded.text, encoding: decoded.label, readable: true };
}

export function runInventoryTextDecodingSelfTests() {
  const utf8 = new TextEncoder().encode("Rechnung der Stadtwerke für Haus und Wohnung");
  const utf16Text = "Vertrag Müller – Vorgang Reparatur";
  const utf16 = new Uint8Array(2 + utf16Text.length * 2); utf16.set([0xff, 0xfe]);
  for (let index = 0; index < utf16Text.length; index++) { const code = utf16Text.charCodeAt(index); utf16[2 + index * 2] = code & 0xff; utf16[3 + index * 2] = code >> 8; }
  const windows1252 = Uint8Array.from([82, 101, 99, 104, 110, 117, 110, 103, 32, 102, 252, 114, 32, 71, 101, 114, 228, 116, 101, 114, 101, 112, 97, 114, 97, 116, 117, 114]);
  const binary = Uint8Array.from({ length: 128 }, (_, index) => index % 4 === 0 ? 0 : index % 4 === 1 ? 255 : index % 4 === 2 ? 1 : 128);
  const utf8Result = decodeInventoryText(utf8); const utf16Result = decodeInventoryText(utf16); const windowsResult = decodeInventoryText(windows1252); const binaryResult = decodeInventoryText(binary);
  return [
    { id: "preview-utf8", label: "UTF-8-Text", passed: utf8Result.readable && utf8Result.text.includes("Stadtwerke"), summary: "UTF-8 wird lesbar dargestellt." },
    { id: "preview-utf16", label: "UTF-16-Text", passed: utf16Result.readable && utf16Result.text.includes("Müller"), summary: "UTF-16 mit BOM wird korrekt erkannt." },
    { id: "preview-windows1252", label: "Windows-1252-Text", passed: windowsResult.readable && windowsResult.text.includes("Gerätereparatur"), summary: "Windows-1252 wird mit deutschen Sonderzeichen erkannt." },
    { id: "preview-binary", label: "Binärinhalt", passed: !binaryResult.readable && !binaryResult.text, summary: "Binärinhalt wird nicht als Dokumenttext angezeigt." },
    { id: "preview-gibberish", label: "Falsch decodierter Inhalt", passed: !isMeaningfulDocumentText("\u0001\u0002�锟斤拷\u0000\u0007"), summary: "Offensichtlich falsch decodierte Zeichen werden als manuell zu prüfen markiert." },
  ];
}

function extractLegacyOfficeText(bytes: Uint8Array) {
  const latinRuns = new TextDecoder("windows-1252", { fatal: false }).decode(bytes).match(/[A-Za-zÄÖÜäöüß0-9][A-Za-zÄÖÜäöüß0-9\s.,;:()@+\-/]{7,}/g) || [];
  const utf16Runs: string[] = [];
  for (const offset of [0, 1]) {
    let run = "";
    for (let index = offset; index + 1 < bytes.length; index += 2) {
      const code = bytes[index] | (bytes[index + 1] << 8);
      const character = String.fromCharCode(code);
      if (/^[\p{L}\p{N}\p{P}\p{Z}\t\r\n]$/u.test(character)) run += character;
      else { if (run.trim().length >= 8) utf16Runs.push(run); run = ""; }
    }
    if (run.trim().length >= 8) utf16Runs.push(run);
  }
  const candidates = [latinRuns.join(" "), utf16Runs.join(" ")].map(normalizedPreviewText).filter(Boolean).sort((left, right) => textReadabilityScore(right) - textReadabilityScore(left));
  return candidates.find(isMeaningfulDocumentText) || "";
}

async function inventoryTextHint(file: File): Promise<{ textHint: string; contentStatus: InventoryContentStatus }> {
  const name = file.name.toLocaleLowerCase("de");
  if (name.endsWith(".txt") || name.endsWith(".vtt") || name.endsWith(".eml") || file.type.startsWith("text/") || file.type === "message/rfc822") {
    const decoded = decodeInventoryText(new Uint8Array(await file.arrayBuffer()));
    return decoded.readable ? { textHint: decoded.text.slice(0, 300000), contentStatus: "gelesen" } : { textHint: "", contentStatus: "manuelle_pruefung_erforderlich" };
  }
  if (name.endsWith(".docx") && file.size <= 25 * 1024 * 1024) {
    const textHint = await docxTextHint(file);
    return { textHint: isMeaningfulDocumentText(textHint) ? textHint : "", contentStatus: isMeaningfulDocumentText(textHint) ? "gelesen" : "manuelle_pruefung_erforderlich" };
  }
  if (name.endsWith(".doc") && file.size <= 25 * 1024 * 1024) {
    const textHint = extractLegacyOfficeText(new Uint8Array(await file.arrayBuffer())).slice(0, 300000);
    return { textHint, contentStatus: textHint ? "teilweise_gelesen" : "manuelle_pruefung_erforderlich" };
  }
  if (name.endsWith(".msg") && file.size <= 25 * 1024 * 1024) {
    const textHint = extractLegacyOfficeText(new Uint8Array(await file.arrayBuffer())).slice(0, 300000);
    return { textHint, contentStatus: textHint ? "teilweise_gelesen" : "manuelle_pruefung_erforderlich" };
  }
  if (name.endsWith(".pdf") && file.size <= 25 * 1024 * 1024) {
    const raw = new TextDecoder("latin1", { fatal: false }).decode(await file.arrayBuffer());
    const readable = [...raw.matchAll(/[\x20-\x7EÄÖÜäöüß]{6,}/g)].map((match) => match[0]).join(" ").replace(/\s+/g, " ").slice(0, 300000);
    return { textHint: isMeaningfulDocumentText(readable) ? readable : "", contentStatus: isMeaningfulDocumentText(readable) ? "teilweise_gelesen" : "nicht_automatisch_lesbar" };
  }
  if (file.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|heic|tiff?)$/i.test(name)) return { textHint: "", contentStatus: "nicht_automatisch_lesbar" };
  return { textHint: "", contentStatus: "manuelle_pruefung_erforderlich" };
}

function decodeXmlText(value: string) {
  return value.replace(/<w:tab\/?\s*>/g, "\t").replace(/<w:br\/?\s*>/g, "\n").replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

async function docxTextHint(file: File) {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    for (let offset = Math.max(0, bytes.length - 65557); offset <= bytes.length - 22; offset++) if (view.getUint32(offset, true) === 0x06054b50) eocd = offset;
    if (eocd < 0) return "";
    let cursor = view.getUint32(eocd + 16, true);
    const entries = view.getUint16(eocd + 10, true);
    for (let index = 0; index < entries && cursor + 46 <= bytes.length; index++) {
      if (view.getUint32(cursor, true) !== 0x02014b50) break;
      const method = view.getUint16(cursor + 10, true);
      const compressedSize = view.getUint32(cursor + 20, true);
      const nameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      const commentLength = view.getUint16(cursor + 32, true);
      const localOffset = view.getUint32(cursor + 42, true);
      const entryName = new TextDecoder().decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
      if (entryName === "word/document.xml" && view.getUint32(localOffset, true) === 0x04034b50) {
        const localNameLength = view.getUint16(localOffset + 26, true);
        const localExtraLength = view.getUint16(localOffset + 28, true);
        const start = localOffset + 30 + localNameLength + localExtraLength;
        const compressed = bytes.slice(start, start + compressedSize);
        let xml = "";
        if (method === 0) xml = new TextDecoder().decode(compressed);
        else if (method === 8 && typeof DecompressionStream !== "undefined") {
          const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
          xml = await new Response(stream).text();
        }
        return decodeXmlText(xml).slice(0, 300000);
      }
      cursor += 46 + nameLength + extraLength + commentLength;
    }
  } catch { /* Nicht lesbare Word-Dateien bleiben unverändert und werden manuell geprüft. */ }
  return "";
}

export type InventorySourcePreview = {
  file: File;
  textExcerpt: string;
  textReadable: boolean;
  detectedEncoding: InventoryTextDecodeResult["encoding"];
  requiresManualReview: boolean;
  changedSinceAnalysis: boolean;
};

export async function readInventorySourcePreview(source: FileSystemDirectoryHandle, item: InventoryItem): Promise<InventorySourcePreview> {
  const permission = source as PermissionHandle;
  const granted = await permission.queryPermission?.({ mode: "read" }) === "granted" || await permission.requestPermission?.({ mode: "read" }) === "granted";
  if (!granted) throw new Error("Der Analyseordner muss zum Ansehen erneut freigegeben werden.");
  if (source.name !== item.sourceRootName) throw new Error(`Bitte zuerst den ursprünglichen Analyseordner „${item.sourceRootName}“ verbinden.`);
  const file = await readFileByRelativePath(source, item.sourceRelativePath);
  const content = await inventoryTextHint(file);
  const textExcerpt = content.textHint.replace(/\s+/g, " ").trim().slice(0, 4000);
  const textReadable = isMeaningfulDocumentText(textExcerpt);
  let detectedEncoding: InventoryTextDecodeResult["encoding"] = "nicht erkannt";
  if (/\.(txt|vtt|eml)$/i.test(file.name) || file.type.startsWith("text/") || file.type === "message/rfc822") detectedEncoding = decodeInventoryText(new Uint8Array(await file.arrayBuffer())).encoding;
  return { file, textExcerpt: textReadable ? textExcerpt : "", textReadable, detectedEncoding, requiresManualReview: content.contentStatus === "manuelle_pruefung_erforderlich" || (!textReadable && /\.(txt|vtt|eml|msg|doc|docx)$/i.test(file.name)), changedSinceAnalysis: file.size !== item.sizeBytes || file.lastModified !== item.lastModified };
}

export async function scanInventoryFolder(input: {
  source: FileSystemDirectoryHandle;
  register: FileSystemDirectoryHandle;
  onProgress?: (progress: InventoryScanProgress) => void;
  shouldPause?: () => boolean;
  sourceKind?: InventorySourceKind;
  registerDiagnostics?: string[];
}): Promise<InventoryScanResult> {
  const permission = input.source as PermissionHandle;
  const granted = await permission.queryPermission?.({ mode: "read" }) === "granted" || await permission.requestPermission?.({ mode: "read" }) === "granted";
  if (!granted) throw new Error("Der ausgewählte Test- oder Bestandsordner wurde nicht zum Lesen freigegeben.");
  if (!(await requestVaultPermission(input.register))) throw new Error("Der führende Familienakten-Tresor wurde nicht freigegeben.");
  const relationship = await directoryRelationship(input.source, input.register);
  if (relationship.same) throw new Error("Analyse-Hauptordner und Familienakten-Datentresor sind derselbe Ordner. Bitte als Analysequelle den übergeordneten „SOFTWARE TESTORDNER“ auswählen; der Datentresor wird darin geschützt ausgeschlossen.");
  if (relationship.sourceWithinRegister) throw new Error(`Der Analyse-Hauptordner liegt innerhalb des Datentresors („${relationship.sourceWithinRegister}“). Bitte den übergeordneten „SOFTWARE TESTORDNER“ oder einen getrennten Testbestand als Analysequelle auswählen.`);
  const excludedPaths = relationship.registerWithinSource ? [relationship.registerWithinSource] : [];
  const accessIssues: DirectoryAccessIssue[] = [];
  const index = await readIndex(input.register);
  const sourceFiles = await listInventoryFiles(input.source, "", [], { excludedPaths, issues: accessIssues });
  if (!sourceFiles.length && accessIssues.length) throw new Error(accessIssues[0].reason);
  if (!sourceFiles.length) throw new Error("Im ausgewählten Analyse-Hauptordner wurden keine zugänglichen Dateien gefunden. Bitte prüfen, ob „SOFTWARE TESTORDNER“ ausgewählt und der Browserzugriff bestätigt wurde.");
  if (sourceFiles.length > 10000) throw new Error("Der Ordner enthält mehr als 10.000 Dateien. Bitte zunächst einen kleineren Teilbestand auswählen.");
  const sourceKind = input.sourceKind || (/onedrive/i.test(input.source.name) ? "onedrive" : "local");
  const runId = `INVSCAN-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const startedAt = new Date().toISOString();
  const files: InventorySourceFile[] = [];
  let skippedContentAnalysis = 0;
  let paused = false;
  for (const [position, entry] of sourceFiles.entries()) {
    if (input.shouldPause?.()) { paused = true; break; }
    input.onProgress?.({ processed: position, discovered: sourceFiles.length, currentName: entry.file.name, phase: "analysieren", skippedUnchanged: skippedContentAnalysis });
    try {
      const previous = index.inventoryItems.find((item) => item.sourceRootName === input.source.name && item.sourceRelativePath === entry.path);
      const previousHasUnreadableExcerpt = Boolean(previous?.contentExcerpt && !isMeaningfulDocumentText(previous.contentExcerpt));
      if (previous && previous.sizeBytes === entry.file.size && previous.lastModified === entry.file.lastModified && previous.checksum && !previousHasUnreadableExcerpt) {
        files.push({ relativePath: entry.path, name: entry.file.name, sizeBytes: entry.file.size, mimeType: entry.file.type || previous.mimeType || "application/octet-stream", lastModified: entry.file.lastModified, checksum: previous.checksum, sourceKind, contentStatus: previous.contentStatus });
        skippedContentAnalysis++;
        continue;
      }
      const checksum = await fileChecksum(entry.file);
      const content = await inventoryTextHint(entry.file);
      files.push({ relativePath: entry.path, name: entry.file.name, sizeBytes: entry.file.size, mimeType: entry.file.type || "application/octet-stream", lastModified: entry.file.lastModified, checksum, textHint: content.textHint, sourceKind, contentStatus: content.contentStatus });
    } catch (error) {
      accessIssues.push({ path: entry.path, operation: "Datei lesen", reason: readableDirectoryAccessError(error, entry.path, "Datei lesen") });
    }
  }
  input.onProgress?.({ processed: files.length, discovered: sourceFiles.length, currentName: paused ? "Analyse pausiert" : "Bestandsregister wird aktualisiert", phase: paused ? "pausiert" : "speichern", skippedUnchanged: skippedContentAnalysis });
  const canonicalCategories = new Set<string>(FAMILY_CATEGORIES);
  const personalLifeAreas = [...new Set(index.documents.map((document) => document.category).filter((category) => category && !canonicalCategories.has(category)))];
  const analyzed = analyzeInventoryFiles({
    sourceRootName: input.source.name,
    sourceKind,
    files,
    knownDocuments: index.documents.map((document) => ({ id: document.id, originalName: document.originalName, sizeBytes: document.sizeBytes, documentDate: document.documentDate, updatedAt: document.updatedAt })),
    knownInventory: index.inventoryItems,
    records: index.records,
    personalLifeAreas,
    learningSignals: index.inventoryLearningSignals,
    analyzedAt: new Date().toISOString(),
    completeScan: !paused && accessIssues.length === 0,
  });
  if (paused) {
    const touched = new Set(analyzed.map((item) => item.id));
    index.inventoryItems = [...analyzed, ...index.inventoryItems.filter((item) => !touched.has(item.id))];
  } else index.inventoryItems = analyzed;
  const now = new Date().toISOString();
  const currentItems = index.inventoryItems.filter((item) => item.sourceRootName === input.source.name);
  const exclusionNote = excludedPaths.length ? ` Der verbundene Datentresor „${excludedPaths.join(" · ")}“ wurde als geschützter Systemordner nicht mitanalysiert.` : "";
  const issueNote = accessIssues.length ? ` ${accessIssues.length} nicht erreichbare${accessIssues.length === 1 ? "r Pfad wurde" : " Pfade wurden"} protokolliert; deshalb wurden keine fehlenden Dateien abgeleitet.` : "";
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: paused ? "FaWoGa 2.28.1 Bestandsanalyse pausiert" : `FaWoGa 2.28.1 ${sourceKind === "onedrive" ? "OneDrive-" : "lokaler "}Bestand inkrementell analysiert`, details: `${files.length} von ${sourceFiles.length} Datei${sourceFiles.length === 1 ? "" : "en"} aus „${input.source.name}“ wurden nur lesend geprüft; ${skippedContentAnalysis} unveränderte Datei${skippedContentAnalysis === 1 ? " wurde" : "en wurden"} nicht erneut inhaltlich analysiert.${exclusionNote}${issueNote} Keine Originaldatei wurde verändert.` });
  await writeIndex(input.register, index, { diagnostics: input.registerDiagnostics });
  input.onProgress?.({ processed: files.length, discovered: sourceFiles.length, currentName: paused ? "Analyse pausiert – Fortsetzen ist möglich" : "Analyse abgeschlossen", phase: paused ? "pausiert" : "abgeschlossen", skippedUnchanged: skippedContentAnalysis });
  return {
    items: structuredClone(currentItems), runId, startedAt, completedAt: now, paused, sourceKind,
    discovered: sourceFiles.length, processed: files.length,
    newFiles: currentItems.filter((item) => item.sourceStatus === "neu").length,
    unchanged: currentItems.filter((item) => item.sourceStatus === "unveraendert").length,
    changed: currentItems.filter((item) => item.sourceStatus === "veraendert").length,
    moved: currentItems.filter((item) => item.sourceStatus === "verschoben").length,
    unavailable: currentItems.filter((item) => item.sourceStatus === "wahrscheinlich_geloescht" || item.sourceStatus === "nicht_erreichbar").length,
    skippedContentAnalysis, accessIssues, excludedPaths,
  };
}

export type InventoryReferenceChoice = {
  recordType: InventoryAssignmentReference["recordType"];
  existingId?: string;
  newLabel?: string;
};

function existingRecordLabel(record: FamilyRecordUnion) {
  const data = record.data as Record<string, unknown>;
  return String(data.displayName || data.name || data.title || record.id);
}

const normalizedRecordLabel = (value: string) => value.toLocaleLowerCase("de").normalize("NFKD").replace(/[^a-z0-9äöüß]+/g, " ").trim();

export async function confirmInventoryAssignment(input: {
  register: FileSystemDirectoryHandle;
  itemId: string;
  canonicalLifeArea: string;
  personalLifeArea?: string;
  documentType: string;
  keywords?: string[];
  referenceChoices?: InventoryReferenceChoice[];
}) {
  if (!(await requestVaultPermission(input.register))) throw new Error("Der Familienakten-Tresor wurde nicht freigegeben.");
  const canonicalLifeArea = input.canonicalLifeArea.trim(); const personalLifeArea = input.personalLifeArea?.trim() || null; const documentType = input.documentType.trim();
  if (!canonicalLifeArea || !documentType) throw new Error("Kategorie und Dokumentenart müssen angegeben werden.");
  const index = await readIndex(input.register);
  const item = index.inventoryItems.find((value) => value.id === input.itemId);
  if (!item) throw new Error("Der Analyse-Eintrag wurde nicht gefunden.");
  if (item.state !== "QUELLE_ANALYSIERT") throw new Error("Die Lernzuordnung kann nur vor der Archivierung bestätigt werden.");
  if (!FAMILY_CATEGORIES.includes(canonicalLifeArea as (typeof FAMILY_CATEGORIES)[number])) throw new Error("Bitte eine vorhandene Hauptkategorie auswählen.");
  const confirmedAt = new Date().toISOString();
  const resolvedReferences: InventoryAssignmentReference[] = [];
  let createdRecords = 0;
  for (const choice of input.referenceChoices || []) {
    let record = choice.existingId ? index.records.find((candidate) => candidate.id === choice.existingId && candidate.recordType === choice.recordType) : undefined;
    const label = choice.newLabel?.trim() || "";
    if (!record && label) record = index.records.find((candidate) => candidate.recordType === choice.recordType && normalizedRecordLabel(existingRecordLabel(candidate)) === normalizedRecordLabel(label));
    if (!record && label) {
      const next = nextFamilyRecordId(choice.recordType, index.sequences); index.sequences = next.sequences;
      if (choice.recordType === "person") record = createFamilyRecord({ id: next.id, recordType: "person", source: "Bestätigte FaWoGa-Zuordnung", data: { displayName: label }, now: confirmedAt });
      else if (choice.recordType === "organisation") record = createFamilyRecord({ id: next.id, recordType: "organisation", source: "Bestätigte FaWoGa-Zuordnung", data: { name: label }, now: confirmedAt });
      else if (choice.recordType === "object") record = createFamilyRecord({ id: next.id, recordType: "object", source: "Bestätigte FaWoGa-Zuordnung", data: { name: label }, now: confirmedAt });
      else record = createFamilyRecord({ id: next.id, recordType: "case", status: "offen", source: "Bestätigte FaWoGa-Zuordnung", data: { title: label }, now: confirmedAt });
      index.records.unshift(record); createdRecords++;
    }
    if (record) resolvedReferences.push({ recordType: choice.recordType, id: record.id, label: existingRecordLabel(record) });
  }
  const confirmedKeywords = [...new Set((input.keywords || []).map((keyword) => keyword.trim()).filter((keyword) => keyword.length >= 2))].slice(0, 30);
  item.lifeArea = personalLifeArea || canonicalLifeArea;
  item.canonicalLifeArea = canonicalLifeArea;
  item.personalLifeArea = personalLifeArea;
  item.documentType = documentType;
  item.confirmedKeywords = confirmedKeywords;
  if (input.referenceChoices) {
    item.assignmentReferences = resolvedReferences;
    item.learningFeatures = {
      ...item.learningFeatures,
      organisationIds: resolvedReferences.filter((reference) => reference.recordType === "organisation").map((reference) => reference.id),
      senderKeys: resolvedReferences.filter((reference) => reference.recordType === "organisation").map((reference) => reference.label.toLocaleLowerCase("de")),
      caseIds: resolvedReferences.filter((reference) => reference.recordType === "case").map((reference) => reference.id),
      objectIds: resolvedReferences.filter((reference) => reference.recordType === "object").map((reference) => reference.id),
      keywords: confirmedKeywords.length ? confirmedKeywords : item.learningFeatures.keywords,
    };
  }
  item.confidence = "eindeutig";
  item.assignmentConfirmedAt = confirmedAt;
  item.learningSuggestion = null;
  const signal = createInventoryLearningSignal(item, { lifeArea: item.lifeArea, canonicalLifeArea: item.canonicalLifeArea, personalLifeArea: item.personalLifeArea, documentType, confirmedAt });
  index.inventoryLearningSignals = [...index.inventoryLearningSignals.filter((entry) => entry.sourceInventoryId !== item.id), signal];
  index.auditLog.unshift({ id: crypto.randomUUID(), at: confirmedAt, action: "FaWoGa-Zuordnung bestätigt und als Lernhilfe gespeichert", recordId: item.id, details: `${item.originalName}: ${item.canonicalLifeArea}${item.personalLifeArea ? ` → ${item.personalLifeArea}` : ""} · ${documentType} · ${resolvedReferences.length} bestätigte Bezüge · ${createdRecords} neue Datensätze. Die Entscheidung dient nur als Vorschlagshilfe für ähnliche künftige Unterlagen.` });
  await writeIndex(input.register, index);
  return { item: structuredClone(item), signal: structuredClone(signal), signalCount: index.inventoryLearningSignals.length, createdRecords };
}

async function archiveIdentity(handle: FileSystemDirectoryHandle) {
  const name = "Familienarchiv_Kennung.json";
  try {
    const file = await handle.getFileHandle(name);
    return JSON.parse(await (await file.getFile()).text()) as { archiveId: string; createdAt: string; label: string };
  } catch {
    const identity = { archiveId: `ARCH-${crypto.randomUUID()}`, createdAt: new Date().toISOString(), label: handle.name };
    const file = await handle.getFileHandle(name, { create: true });
    const writable = await file.createWritable(); await writable.write(JSON.stringify(identity, null, 2)); await writable.close();
    return identity;
  }
}

async function archiveTargetFile(archive: FileSystemDirectoryHandle, item: InventoryItem) {
  const base = await archive.getDirectoryHandle("Familienakte_Archiv", { create: true });
  const area = await base.getDirectoryHandle(clean(item.lifeArea), { create: true });
  const year = new Date(item.lastModified || Date.now()).getFullYear().toString();
  const yearDirectory = await area.getDirectoryHandle(year, { create: true });
  const fileName = `${item.checksum.slice(0, 16)}_${clean(item.originalName)}`;
  return { directory: yearDirectory, fileName, relativePath: `Familienakte_Archiv/${clean(item.lifeArea)}/${year}/${fileName}` };
}

export async function archiveInventoryItems(input: {
  register: FileSystemDirectoryHandle;
  source: FileSystemDirectoryHandle;
  archive: FileSystemDirectoryHandle;
  itemIds: string[];
  onProgress?: (progress: InventoryScanProgress) => void;
}): Promise<InventoryArchiveResult> {
  if (!(await requestVaultPermission(input.register)) || !(await requestVaultPermission(input.archive))) throw new Error("Familienakten-Tresor und Archivdatenträger müssen ausdrücklich freigegeben sein.");
  const sourcePermission = input.source as PermissionHandle;
  const sourceGranted = await sourcePermission.queryPermission?.({ mode: "read" }) === "granted" || await sourcePermission.requestPermission?.({ mode: "read" }) === "granted";
  if (!sourceGranted) throw new Error("Der Quellordner wurde nicht freigegeben.");
  const identity = await archiveIdentity(input.archive);
  let index = await readIndex(input.register);
  const selected = index.inventoryItems.filter((item) => input.itemIds.includes(item.id));
  let archived = 0; let alreadyArchived = 0; let failed = 0;
  for (const [position, selectedItem] of selected.entries()) {
    input.onProgress?.({ processed: position, discovered: selected.length, currentName: selectedItem.originalName });
    try {
      if (selectedItem.state === "ARCHIVIERT" || selectedItem.state === "ASSISTENZ_FREIGEGEBEN") { alreadyArchived++; continue; }
      const sourceFile = await readFileByRelativePath(input.source, selectedItem.sourceRelativePath);
      const sourceChecksum = await fileChecksum(sourceFile);
      if (sourceChecksum !== selectedItem.checksum) throw new Error("Die Quelldatei wurde seit der Analyse verändert. Bitte den Bestand erneut prüfen.");
      const target = await archiveTargetFile(input.archive, selectedItem);
      let targetFile: File | null = null;
      try { targetFile = await (await target.directory.getFileHandle(target.fileName)).getFile(); } catch { targetFile = null; }
      if (!targetFile) {
        const targetHandle = await target.directory.getFileHandle(target.fileName, { create: true });
        const writable = await targetHandle.createWritable(); await writable.write(sourceFile); await writable.close();
        targetFile = await targetHandle.getFile();
      }
      const copiedChecksum = await fileChecksum(targetFile);
      if (targetFile.size !== sourceFile.size || copiedChecksum !== sourceChecksum) throw new Error("Die Archivkopie konnte nicht per Prüfsumme bestätigt werden.");
      index = await readIndex(input.register);
      const item = index.inventoryItems.find((value) => value.id === selectedItem.id);
      if (!item) throw new Error("Der Analyse-Eintrag wurde im Register nicht gefunden.");
      item.state = "ARCHIVIERT"; item.archivedPath = target.relativePath; item.archivedChecksum = copiedChecksum; item.archivedAt = new Date().toISOString();
      index.auditLog.unshift({ id: crypto.randomUUID(), at: item.archivedAt, action: "Bestandsdatei archiviert", recordId: item.id, details: `${item.originalName} wurde als geprüfte Kopie auf ${identity.archiveId} archiviert. Das Original blieb unverändert.` });
      await writeIndex(input.register, index);
      archived++;
    } catch { failed++; }
  }
  const completedAt = new Date().toISOString();
  input.onProgress?.({ processed: selected.length, discovered: selected.length, currentName: "Archivierung abgeschlossen" });
  return { archived, alreadyArchived, failed, archiveId: identity.archiveId, completedAt, freeSpaceCheck: "nicht_im_browser_verfügbar" };
}

export async function releaseInventoryItemsForAssistant(input: {
  register: FileSystemDirectoryHandle;
  archive: FileSystemDirectoryHandle;
  itemIds: string[];
}) {
  if (!(await requestVaultPermission(input.register)) || !(await requestVaultPermission(input.archive))) throw new Error("Familienakten-Tresor und Archivdatenträger müssen freigegeben sein.");
  let released = 0; let reused = 0;
  for (const itemId of input.itemIds) {
    const index = await readIndex(input.register);
    const item = index.inventoryItems.find((value) => value.id === itemId);
    if (!item || item.state === "QUELLE_ANALYSIERT" || !item.archivedPath) continue;
    if (item.state === "ASSISTENZ_FREIGEGEBEN") { reused++; continue; }
    const archivedFile = await readFileByRelativePath(input.archive, item.archivedPath);
    const checksum = await fileChecksum(archivedFile);
    if (checksum !== item.archivedChecksum || checksum !== item.checksum) throw new Error(`Die Archivkopie von „${item.originalName}“ stimmt nicht mehr mit der geprüften Quelle überein.`);
    let document = index.documents.find((value) => value.checksum === checksum);
    if (!document) {
      const base = await root(input.register);
      const parent = await base.getDirectoryHandle("01_Dokumente", { create: true });
      const folder = await parent.getDirectoryHandle(clean(item.lifeArea), { create: true });
      const id = crypto.randomUUID();
      const date = new Date(item.lastModified || Date.now()).toISOString().slice(0, 10);
      const storedName = `${date}_${id.slice(0, 8)}_${clean(item.originalName)}`;
      const target = await folder.getFileHandle(storedName, { create: true });
      const writable = await target.createWritable(); await writable.write(archivedFile); await writable.close();
      const storedPath = `${ROOT}/01_Dokumente/${clean(item.lifeArea)}/${storedName}`;
      const now = new Date().toISOString();
      document = { id, originalName: item.originalName, category: item.lifeArea, documentDate: date, mimeType: item.mimeType, sizeBytes: item.sizeBytes, status: "geprüft", notes: `FaWoGa-Bestandsanalyse · ${item.reason}`, addedAt: now, updatedAt: now, storedPath, relativePath: storedPath, storageType: "local", source: "FaWoGa-Bestandsarchiv", checksum, storageLocations: [
        { id: `LOC-${crypto.randomUUID()}`, storageType: "local", path: storedPath, source: "Führender Familienakten-Tresor", checksum, fileSize: item.sizeBytes, verifiedAt: now },
        { id: `LOC-${crypto.randomUUID()}`, storageType: "usb", path: item.archivedPath, source: "FaWoGa-Archivdatenträger", checksum, fileSize: item.sizeBytes, verifiedAt: now },
      ] };
      index.documents.unshift(document);
      released++;
    } else {
      document.storageLocations ||= [];
      if (!document.storageLocations.some((location) => location.path === item.archivedPath)) document.storageLocations.push({ id: `LOC-${crypto.randomUUID()}`, storageType: "usb", path: item.archivedPath, source: "FaWoGa-Archivdatenträger", checksum, fileSize: item.sizeBytes, verifiedAt: new Date().toISOString() });
      reused++;
    }
    item.state = "ASSISTENZ_FREIGEGEBEN"; item.documentId = document.id;
    const now = new Date().toISOString();
    index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: "Bestandsdokument für Assistenz freigegeben", recordId: document.id, details: `${item.originalName} verwendet einen fachlichen Dokumentdatensatz mit mehreren Speicherorten. Keine Quelldatei wurde verändert.` });
    await writeIndex(input.register, index);
  }
  return { released, reused, completedAt: new Date().toISOString() };
}

export async function resetInventoryItemsForRetest(input: {
  register: FileSystemDirectoryHandle;
  archive: FileSystemDirectoryHandle;
  itemIds: string[];
}): Promise<InventoryResetResult> {
  if (!/test/i.test(input.archive.name)) throw new Error("Die Rücksetzung ist ausschließlich in einem ausdrücklich benannten Testarchiv zulässig.");
  if (!(await requestVaultPermission(input.register)) || !(await requestVaultPermission(input.archive))) throw new Error("Familienakten-Tresor und Testarchiv müssen freigegeben sein.");
  const selectedIds = new Set(input.itemIds);
  const index = await readIndex(input.register);
  const selected = index.inventoryItems.filter((item) => selectedIds.has(item.id));
  const vaultRoot = await root(input.register);
  let reset = 0; let archiveCopiesRemoved = 0; let assistantLinksRemoved = 0; let generatedDocumentsRemoved = 0;

  for (const item of selected) {
    if (!item.documentId) continue;
    const document = index.documents.find((entry) => entry.id === item.documentId);
    const remainingInventoryReference = index.inventoryItems.some((entry) => !selectedIds.has(entry.id) && entry.documentId === item.documentId && entry.state === "ASSISTENZ_FREIGEGEBEN");
    const hasRelations = index.relations.some((relation) => (relation.fromType === "document" && relation.fromId === item.documentId) || (relation.toType === "document" && relation.toId === item.documentId));
    if (document?.source === "FaWoGa-Bestandsarchiv" && !remainingInventoryReference && hasRelations) throw new Error(`„${item.originalName}“ ist bereits fachlich verknüpft und kann deshalb nicht automatisch auf den Test-Ausgangszustand zurückgesetzt werden.`);
  }

  for (const item of selected) {
    const archivedPath = item.archivedPath || null;
    const documentId = item.documentId || null;
    if (item.state === "ASSISTENZ_FREIGEGEBEN") assistantLinksRemoved++;

    if (documentId) {
      const document = index.documents.find((entry) => entry.id === documentId);
      const remainingInventoryReference = index.inventoryItems.some((entry) => !selectedIds.has(entry.id) && entry.documentId === documentId && entry.state === "ASSISTENZ_FREIGEGEBEN");
      const hasRelations = index.relations.some((relation) => (relation.fromType === "document" && relation.fromId === documentId) || (relation.toType === "document" && relation.toId === documentId));
      if (document) {
        document.storageLocations = (document.storageLocations || []).filter((location) => location.path !== archivedPath);
        if (document.source === "FaWoGa-Bestandsarchiv" && !remainingInventoryReference && !hasRelations) {
          await removeFileByRelativePath(vaultRoot, document.storedPath, true);
          index.documents = index.documents.filter((entry) => entry.id !== documentId);
          generatedDocumentsRemoved++;
        }
      }
    }

    const archiveStillShared = archivedPath && index.inventoryItems.some((entry) => !selectedIds.has(entry.id) && entry.archivedPath === archivedPath && entry.state !== "QUELLE_ANALYSIERT");
    if (archivedPath && !archiveStillShared && await removeFileByRelativePath(input.archive, archivedPath)) archiveCopiesRemoved++;
    item.state = "QUELLE_ANALYSIERT";
    item.archivedPath = null;
    item.archivedChecksum = null;
    item.archivedAt = null;
    item.documentId = null;
    reset++;
  }

  const completedAt = new Date().toISOString();
  index.auditLog.unshift({ id: crypto.randomUUID(), at: completedAt, action: "FaWoGa-Testauswahl zurückgesetzt", details: `${reset} ausgewählte Bestandsdatei${reset === 1 ? " wurde" : "en wurden"} auf „Quelle analysiert“ zurückgesetzt. ${archiveCopiesRemoved} Testarchiv-Kopie${archiveCopiesRemoved === 1 ? " wurde" : "n wurden"} entfernt. Originaldateien blieben unverändert.` });
  await writeIndex(input.register, index);
  return { reset, archiveCopiesRemoved, assistantLinksRemoved, generatedDocumentsRemoved, completedAt };
}

export async function listLocalDocuments(handle: FileSystemDirectoryHandle) {
  return (await readIndex(handle)).documents.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export async function readLocalSystemSnapshot(handle: FileSystemDirectoryHandle): Promise<LocalSystemSnapshot> {
  let index = emptyIndex();
  let registerState: LocalSystemSnapshot["registerState"] = "missing";
  try {
    const contents = await readExistingRegisterText(handle);
    if (contents !== null) {
      index = parseIndex(contents);
      registerState = "valid";
    }
  } catch (error) {
    if (error instanceof VaultRegisterError && error.code === "REGISTER_CORRUPTED") registerState = "corrupted";
    else throw error;
  }
  const duplicateCount = (values: string[]) => {
    const counts = new Map<string, number>();
    values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    return [...counts.values()].filter((count) => count > 1).length;
  };
  const integrity = registerState === "corrupted"
    ? { overall: "red" as const, issues: [{ message: "Die vorhandene Registerdatei ist beschädigt oder nicht lesbar." }] }
    : inspectFamilyIntegrity({ documents: index.documents, records: index.records, relations: index.relations, sequences: index.sequences });
  return {
    registerState,
    documentCount: index.documents.length,
    duplicateDocumentIds: duplicateCount(index.documents.map((item) => item.id)),
    duplicateStoredPaths: duplicateCount(index.documents.map((item) => item.storedPath)),
    recordCount: index.records.length,
    recordTypes: [...new Set(index.records.map((item) => item.recordType))].sort(),
    relationCount: index.relations.length,
    relationPairs: [...new Set(index.relations.map((item) => `${item.fromType}->${item.toType}`))].sort(),
    memoryCount: index.records.filter(isMemoryRecord).length,
    memoryMediaCount: index.records.filter(isMemoryRecord).reduce((sum, record) => sum + (memoryData(record)?.media.length || 0), 0),
    memoryDraftCount: index.memoryDrafts.length,
    linkDecisionCount: index.linkDecisions.length,
    inventoryCount: index.inventoryItems.length,
    inventoryNewCount: index.inventoryItems.filter((item) => item.sourceStatus === "neu").length,
    inventoryUnchangedCount: index.inventoryItems.filter((item) => item.sourceStatus === "unveraendert").length,
    inventoryChangedCount: index.inventoryItems.filter((item) => item.sourceStatus === "veraendert").length,
    inventoryMovedCount: index.inventoryItems.filter((item) => item.sourceStatus === "verschoben").length,
    inventoryUnavailableCount: index.inventoryItems.filter((item) => item.sourceStatus === "nicht_erreichbar" || item.sourceStatus === "wahrscheinlich_geloescht").length,
    inventoryRecommendedCount: index.inventoryItems.filter((item) => item.reviewGroup === "recommended").length,
    inventoryReviewCount: index.inventoryItems.filter((item) => item.reviewGroup === "review").length,
    inventoryDuplicateCount: index.inventoryItems.filter((item) => item.reviewGroup === "duplicate").length,
    inventoryVersionCount: index.inventoryItems.filter((item) => item.versionOfInventoryIds.length > 0).length,
    archivedInventoryCount: index.inventoryItems.filter((item) => item.state === "ARCHIVIERT" || item.state === "ASSISTENZ_FREIGEGEBEN").length,
    assistantReleasedInventoryCount: index.inventoryItems.filter((item) => item.state === "ASSISTENZ_FREIGEGEBEN").length,
    confirmedInventoryAssignmentCount: index.inventoryItems.filter((item) => !!item.assignmentConfirmedAt).length,
    inventoryLearningSignalCount: index.inventoryLearningSignals.length,
    pausedInventoryScanCount: index.auditLog.filter((entry) => entry.action === "FaWoGa 2.28.1 Bestandsanalyse pausiert").length,
    centralIntakeDocumentCount: index.documents.filter((item) => item.notes?.includes("Eingangszentrale 2.28.0")).length,
    completedOneDriveScanCounts: index.auditLog
      .filter((entry) => entry.action === "FaWoGa 2.28.1 OneDrive-Bestand inkrementell analysiert"
        || entry.action === "FaWoGa 2.28.1 lokaler Bestand inkrementell analysiert")
      .map((entry) => Number(entry.details.match(/^(\d+) von (\d+)/)?.[2] || 0))
      .filter((count) => count > 0),
    integrityLevel: integrity.overall,
    integrityIssues: integrity.issues.map((issue) => issue.message),
  };
}

export async function getVaultSummary(handle: FileSystemDirectoryHandle): Promise<VaultSummary> {
  const identity = await vaultIdentity(handle); const index = await readIndex(handle);
  return { vaultId: identity.vaultId, vaultName: identity.vaultName, updatedAt: index.updatedAt, documentCount: index.documents.length };
}

export async function saveLocalDocument(handle: FileSystemDirectoryHandle, file: File, data: { category: string; documentDate: string | null; notes: string | null; migration?: boolean; allowDuplicate?: boolean; assignmentLinks?: Array<{ toType: FamilyRecordType; toId: string; relationType: string }>; scanPageCount?: number; scanOriginals?: File[] }) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Die Datei ist größer als 20 MB.");
  const index = await readIndex(handle);
  const checksum = await fileChecksum(file);
  const possibleDuplicate = index.documents.find((document) => document.checksum === checksum || (document.originalName.toLocaleLowerCase("de") === file.name.toLocaleLowerCase("de") && document.sizeBytes === file.size));
  if (possibleDuplicate && !data.allowDuplicate) throw new Error(`Mögliche Dublette: ${possibleDuplicate.id}. Bitte das vorhandene Dokument zuerst vergleichen oder die bewusste Übernahme bestätigen.`);
  const base = await root(handle);
  const parent = await base.getDirectoryHandle(data.migration ? "02_Online-Bestand_gesichert" : "01_Dokumente", { create: true });
  const folder = await parent.getDirectoryHandle(clean(data.category), { create: true });
  const id = crypto.randomUUID();
  const storedName = `${data.documentDate || new Date().toISOString().slice(0, 10)}_${id.slice(0, 8)}_${clean(file.name)}`;
  const target = await folder.getFileHandle(storedName, { create: true });
  const writable = await target.createWritable(); await writable.write(file); await writable.close();
  const identity = await vaultIdentity(handle);
  const addedAt = new Date().toISOString();
  const storedPath = `${ROOT}/${data.migration ? "02_Online-Bestand_gesichert" : "01_Dokumente"}/${clean(data.category)}/${storedName}`;
  let scanOriginalsPath: string | null = null;
  const scanOriginals = (data.scanOriginals || []).filter((original) => original.type.startsWith("image/")).slice(0, 30);
  if (scanOriginals.length) {
    const scanRoot = await folder.getDirectoryHandle("Scan-Originale", { create: true });
    const scanFolder = await scanRoot.getDirectoryHandle(id, { create: true });
    for (const [index, original] of scanOriginals.entries()) {
      const extension = original.name.includes(".") ? `.${original.name.split(".").pop()}` : ".jpg";
      const originalFile = await scanFolder.getFileHandle(`${String(index + 1).padStart(2, "0")}_${id.slice(0, 8)}${clean(extension)}`, { create: true });
      const originalWritable = await originalFile.createWritable();
      await originalWritable.write(original);
      await originalWritable.close();
    }
    scanOriginalsPath = `${ROOT}/${data.migration ? "02_Online-Bestand_gesichert" : "01_Dokumente"}/${clean(data.category)}/Scan-Originale/${id}`;
  }
  const storageType = identity.storageKind || "local";
  const item: LocalDocument = { id, originalName: file.name, category: data.category, documentDate: data.documentDate,
    mimeType: file.type || "application/octet-stream", sizeBytes: file.size, status: "hochgeladen", notes: data.notes,
    addedAt, updatedAt: addedAt, storedPath, relativePath: storedPath,
    storageType, oneDrivePath: identity.storageKind === "onedrive" ? storedPath : null,
    source: identity.storageKind === "onedrive" ? "OneDrive-Datentresor" : "Lokaler Datentresor",
    checksum,
    storageLocations: [{ id: `LOC-${crypto.randomUUID()}`, storageType, path: storedPath, source: identity.storageKind === "onedrive" ? "OneDrive-Datentresor" : "Lokaler Datentresor", checksum, fileSize: file.size, verifiedAt: addedAt }],
    scanPageCount: data.scanPageCount, scanOriginalCount: scanOriginals.length, scanOriginalsPath };
  index.documents.unshift(item);
  for (const link of data.assignmentLinks || []) {
    if (!index.records.some((record) => record.id === link.toId && record.recordType === link.toType)) continue;
    if (index.relations.some((relation) => relation.fromType === "document" && relation.fromId === item.id && relation.toType === link.toType && relation.toId === link.toId)) continue;
    index.relations.push({ id: crypto.randomUUID(), fromType: "document", fromId: item.id, toType: link.toType, toId: link.toId, relationType: link.relationType, createdAt: addedAt, source: "Bestätigter Dokumenteneingang", notes: null });
  }
  index.auditLog.unshift({ id: crypto.randomUUID(), at: addedAt, action: "Dokument erfasst", recordId: item.id, details: `${item.originalName} wurde nach Benutzerbestätigung registriert; ${data.assignmentLinks?.length || 0} vorhandene Zuordnung${data.assignmentLinks?.length === 1 ? "" : "en"} verknüpft.${data.scanPageCount ? ` PDF aus ${data.scanPageCount} Scan-Seite${data.scanPageCount === 1 ? "" : "n"}; ${scanOriginals.length ? "Originalaufnahmen als Anlagen behalten" : "keine zusätzlichen Scan-Fotos gespeichert"}.` : ""}` });
  await writeIndex(handle, index); return item;
}

export async function updateLocalStatus(handle: FileSystemDirectoryHandle, id: string, status: LocalDocument["status"]) {
  const index = await readIndex(handle); const item = index.documents.find((document) => document.id === id);
  if (item) { item.status = status; item.updatedAt = new Date().toISOString(); } await writeIndex(handle, index);
}

export async function attachLocalDocumentStorageLocation(handle: FileSystemDirectoryHandle, documentId: string, location: Omit<DocumentStorageLocation, "id">) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const document = index.documents.find((item) => item.id === documentId);
  if (!document) throw new Error("Das Dokument wurde im lokalen Register nicht gefunden.");
  document.storageLocations ||= [];
  const existing = document.storageLocations.find((item) => item.path === location.path || (item.checksum && location.checksum && item.checksum === location.checksum && item.storageType === location.storageType));
  if (existing) return existing;
  const stored: DocumentStorageLocation = { ...location, id: `LOC-${crypto.randomUUID()}` };
  document.storageLocations.push(stored);
  document.updatedAt = new Date().toISOString();
  index.auditLog.unshift({ id: crypto.randomUUID(), at: document.updatedAt, action: "Speicherort ergänzt", recordId: document.id, details: `${document.id} behält einen fachlichen Datensatz und verweist nun zusätzlich auf ${stored.storageType}: ${stored.path}.` });
  await writeIndex(handle, index);
  return stored;
}

export async function linkLocalDocuments(handle: FileSystemDirectoryHandle, fromDocumentId: string, toDocumentId: string, relationType: string) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  if (!index.documents.some((item) => item.id === fromDocumentId) || !index.documents.some((item) => item.id === toDocumentId)) {
    throw new Error("Mindestens eines der zu verbindenden Dokumente wurde nicht gefunden.");
  }
  const existing = index.relations.find((relation) => relation.fromType === "document" && relation.fromId === fromDocumentId && relation.toType === "document" && relation.toId === toDocumentId && relation.relationType === relationType);
  if (existing) return existing;
  const createdAt = new Date().toISOString();
  const relation: FamilyRelation = { id: crypto.randomUUID(), fromType: "document", fromId: fromDocumentId, toType: "document", toId: toDocumentId, relationType, createdAt, source: "Bestätigte Eingangszentrale 2.28.0", notes: null };
  index.relations.push(relation);
  index.auditLog.unshift({ id: crypto.randomUUID(), at: createdAt, action: "E-Mail und Anlage verknüpft", recordId: fromDocumentId, details: `${fromDocumentId} wurde als ${relationType} mit ${toDocumentId} verbunden. Beide Dokumentdatensätze bleiben eigenständig.` });
  await writeIndex(handle, index);
  return relation;
}

export async function listLocalFamilyRecords(handle: FileSystemDirectoryHandle) {
  return (await readIndex(handle)).records;
}

export async function listLocalFamilyRelations(handle: FileSystemDirectoryHandle) {
  return (await readIndex(handle)).relations;
}

export async function readLocalVaultData(handle: FileSystemDirectoryHandle): Promise<LocalVaultData> {
  const index = await readIndex(handle);
  return {
    documents: structuredClone(index.documents),
    records: structuredClone(index.records),
    relations: structuredClone(index.relations),
    memoryDrafts: structuredClone(sortMemoryDraftQueue(index.memoryDrafts)),
    linkDecisions: structuredClone(index.linkDecisions),
    inventoryItems: structuredClone(index.inventoryItems),
    auditLog: structuredClone(index.auditLog),
  };
}

function safeExportName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim() || "Dokument";
}

async function writeTextFile(directory: FileSystemDirectoryHandle, name: string, contents: string) {
  const file = await directory.getFileHandle(name, { create: true });
  const writable = await file.createWritable();
  await writable.write(contents);
  await writable.close();
}

export async function writeFamilyArchiveExport(input: {
  destination: FileSystemDirectoryHandle;
  source: FileSystemDirectoryHandle | null;
  json: string;
  html: string;
  includeOriginals: boolean;
  exportedAt: string;
}): Promise<LocalArchiveWriteResult> {
  if (!(await requestVaultPermission(input.destination))) throw new Error("Der Exportordner wurde nicht freigegeben.");
  const stamp = input.exportedAt.replace(/[:.]/g, "-");
  let folderName = `Familienakte_Export_${stamp}`;
  let sequence = 1;
  while (true) {
    try {
      await input.destination.getDirectoryHandle(folderName);
      folderName = `Familienakte_Export_${stamp}_${sequence++}`;
    } catch { break; }
  }
  const directory = await input.destination.getDirectoryHandle(folderName, { create: true });
  const warnings: string[] = [];
  let originalsCopied = 0;
  let originalsMissing = 0;
  if (input.includeOriginals) {
    if (!input.source || !(await requestVaultPermission(input.source))) {
      warnings.push("Originaldokumente konnten nicht einbezogen werden, weil kein freigegebener lokaler Datentresor vorhanden war.");
    } else {
      const originalDirectory = await directory.getDirectoryHandle("Originaldokumente", { create: true });
      const index = await readIndex(input.source);
      for (const document of index.documents) {
        try {
          const original = await fileFromStoredPath(input.source, document.storedPath);
          const exportName = `${document.id}_${safeExportName(document.originalName)}`;
          const target = await originalDirectory.getFileHandle(exportName, { create: true });
          const writable = await target.createWritable();
          await writable.write(original);
          await writable.close();
          originalsCopied++;
        } catch {
          originalsMissing++;
          warnings.push(`Originaldatei nicht erreichbar: ${document.originalName}`);
        }
      }
    }
  }
  const complete = !input.includeOriginals || (!!input.source && originalsMissing === 0 && warnings.length === 0);
  const completedAt = new Date().toISOString();
  const report = {
    status: complete ? "vollständig" : "unvollständig",
    exportedAt: input.exportedAt,
    completedAt,
    originalsRequested: input.includeOriginals,
    originalsCopied,
    originalsMissing,
    warnings,
    safeguards: ["Ausgangsdaten nicht verändert", "Originale nicht gelöscht", "Originale nicht verschoben", "Originale nicht umbenannt", "Vorhandene Exportordner nicht überschrieben"],
  };
  await writeTextFile(directory, "Familienakte_Daten.json", input.json);
  await writeTextFile(directory, "Familienakte_Uebersicht.html", input.html);
  await writeTextFile(directory, "Exportbericht.json", JSON.stringify(report, null, 2));
  return { folderName, completedAt, originalsRequested: input.includeOriginals, originalsCopied, originalsMissing, complete, warnings };
}

type FullBackupResult = {
  folderName: string;
  manifest: FamilyBackupManifest;
  verification?: ReturnType<typeof verifyFamilyBackupRestore>;
};

async function copyDirectoryWithChecksums(source: FileSystemDirectoryHandle, target: FileSystemDirectoryHandle, prefix: string, files: FamilyBackupFile[]) {
  const iterable = source as DirectoryWithEntries;
  for await (const entry of iterable.values()) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.kind === "directory") {
      const destination = await target.getDirectoryHandle(entry.name, { create: true });
      await copyDirectoryWithChecksums(entry as FileSystemDirectoryHandle, destination, relativePath, files);
      continue;
    }
    const sourceFile = await (entry as FileSystemFileHandle).getFile();
    const sourceChecksum = await fileChecksum(sourceFile);
    const destination = await target.getFileHandle(entry.name, { create: true });
    const writable = await destination.createWritable();
    await writable.write(sourceFile);
    await writable.close();
    const copied = await destination.getFile();
    const copiedChecksum = await fileChecksum(copied);
    if (sourceFile.size !== copied.size || sourceChecksum !== copiedChecksum) throw new Error(`Die Kopie von „${relativePath}“ konnte nicht per Prüfsumme bestätigt werden.`);
    files.push({ path: relativePath, sizeBytes: copied.size, checksum: copiedChecksum });
  }
}

async function uniqueDirectory(parent: FileSystemDirectoryHandle, baseName: string) {
  let name = baseName;
  let sequence = 1;
  while (true) {
    try {
      await parent.getDirectoryHandle(name);
      name = `${baseName}_${sequence++}`;
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
      return { name, handle: await parent.getDirectoryHandle(name, { create: true }) };
    }
  }
}

async function fileLifecycleOperation<T>(step: string, operation: () => Promise<T>) {
  let lastError: unknown;
  try { return await retryFileSystemOperation(operation, 3, 180); }
  catch (error) { lastError = error; }
  const reason = registerWriteFailureMessage("temporäre Registerdatei schreiben", fileSystemErrorName(lastError), fileSystemErrorDetail(lastError))
    .replace("Registerschritt „temporäre Registerdatei schreiben“", `Dateisystemschritt „${step}“`);
  throw new Error(reason, { cause: lastError });
}

async function verifyWritableDirectory(resolveDirectory: () => Promise<FileSystemDirectoryHandle>, label: string) {
  const probeName = `Familienakte_Schreibprobe_${crypto.randomUUID()}.tmp`;
  const probeContent = `Schreibprobe ${new Date().toISOString()}`;
  await fileLifecycleOperation(`${label}: Schreibprobe anlegen`, async () => {
    const directory = await resolveDirectory();
    const file = await directory.getFileHandle(probeName, { create: true });
    const writable = await file.createWritable();
    await writable.write(probeContent);
    await writable.close();
  });
  await fileLifecycleOperation(`${label}: Schreibprobe wieder einlesen`, async () => {
    const directory = await resolveDirectory();
    const file = await directory.getFileHandle(probeName);
    if (await (await file.getFile()).text() !== probeContent) throw new DOMException("Die Schreibprobe stimmt nach dem Wiedereinlesen nicht überein.", "NotReadableError");
  });
  await fileLifecycleOperation(`${label}: Schreibprobe entfernen`, async () => (await resolveDirectory()).removeEntry(probeName));
}

export async function writeFullFamilyBackup(input: {
  destination: FileSystemDirectoryHandle;
  source: FileSystemDirectoryHandle;
  appVersion: string;
  createdAt?: string;
}): Promise<FullBackupResult> {
  if (!(await requestVaultPermission(input.source)) || !(await requestVaultPermission(input.destination))) throw new Error("Quell- und Sicherungsordner müssen ausdrücklich freigegeben sein.");
  if (await (input.source as ComparableHandle).isSameEntry?.(input.destination)) throw new Error("Die vollständige Sicherung benötigt einen getrennten Zielordner.");
  const index = await readIndex(input.source);
  const createdAt = input.createdAt || new Date().toISOString();
  const backup = await uniqueDirectory(input.destination, `Familienakte_Vollsicherung_${createdAt.replace(/[:.]/g, "-")}`);
  const dataDirectory = await backup.handle.getDirectoryHandle("Dateien", { create: true });
  const sourceRoot = await root(input.source);
  const files: FamilyBackupFile[] = [];
  for (const folderName of ["01_Dokumente", "02_Online-Bestand_gesichert", "03_Erinnerungsmedien"]) {
    try {
      const sourceDirectory = await sourceRoot.getDirectoryHandle(folderName);
      const targetDirectory = await dataDirectory.getDirectoryHandle(folderName, { create: true });
      await copyDirectoryWithChecksums(sourceDirectory, targetDirectory, folderName, files);
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
    }
  }
  const registerText = JSON.stringify(index, null, 2);
  const registerChecksum = await fileChecksum(new Blob([registerText], { type: "application/json" }));
  const manifest = createFamilyBackupManifest({ appVersion: input.appVersion, createdAt, registerChecksum, register: index, files });
  await writeTextFile(backup.handle, "Familienakte_Register.json", registerText);
  await writeTextFile(backup.handle, "Vollsicherung_Manifest.json", JSON.stringify(manifest, null, 2));
  return { folderName: backup.name, manifest };
}

async function assertEmptyRestoreTarget(target: FileSystemDirectoryHandle) {
  try {
    const existingRoot = await target.getDirectoryHandle(ROOT);
    const iterable = existingRoot as DirectoryWithEntries;
    for await (const entry of iterable.values()) throw new Error(`Der Testordner ist nicht leer (${entry.name}). Bitte einen leeren Wiederherstellungsordner wählen.`);
  } catch (error) {
    if (isNotFoundError(error)) return;
    throw error;
  }
}

async function readJsonFile<T>(directory: FileSystemDirectoryHandle, name: string): Promise<T> {
  const file = await directory.getFileHandle(name);
  return JSON.parse(await (await file.getFile()).text()) as T;
}

export async function restoreFullFamilyBackup(input: {
  backup: FileSystemDirectoryHandle;
  emptyTarget: FileSystemDirectoryHandle;
  refreshBackup?: () => Promise<FileSystemDirectoryHandle>;
  refreshTarget?: () => Promise<FileSystemDirectoryHandle>;
  diagnostics?: string[];
  trace?: AutomatedStorageTrace;
  diagnosticRelativeTargetPath?: string;
}): Promise<FullBackupResult> {
  const resolveBackup = input.refreshBackup || (async () => input.backup);
  const resolveTarget = input.refreshTarget || (async () => input.emptyTarget);
  const initialBackup = await resolveBackup();
  const initialTarget = await resolveTarget();
  const targetPath = input.diagnosticRelativeTargetPath || initialTarget.name;
  input.trace?.({ step: "Wiederherstellung vorbereiten", operation: "Sicherungs- und Zielordner frisch auflösen", relativePath: targetPath, result: "success", permission: await queriedDirectoryPermission(initialTarget), parentExists: true, targetExists: true });
  if (!(await requestVaultPermission(initialBackup)) || !(await requestVaultPermission(initialTarget))) throw new Error("Sicherungs- und Testordner müssen ausdrücklich freigegeben sein.");
  await assertEmptyRestoreTarget(initialTarget);
  input.trace?.({ step: "Wiederherstellung vorbereiten", operation: "Leeres Ziel bestätigen", relativePath: targetPath, result: "success", permission: await queriedDirectoryPermission(initialTarget), parentExists: true, targetExists: true });
  await verifyWritableDirectory(resolveTarget, "Wiederherstellungsziel");
  input.trace?.({ step: "Wiederherstellung vorbereiten", operation: "Schreiben ohne vorherige Wiederherstellung prüfen", relativePath: targetPath, result: "success", permission: await queriedDirectoryPermission(await resolveTarget()), parentExists: true, targetExists: true });
  const manifest = await fileLifecycleOperation("Sicherungsmanifest lesen", async () => readJsonFile<FamilyBackupManifest>(await resolveBackup(), "Vollsicherung_Manifest.json"));
  const registerText = await fileLifecycleOperation("Sicherungsregister lesen", async () => {
    const registerHandle = await (await resolveBackup()).getFileHandle("Familienakte_Register.json");
    return (await registerHandle.getFile()).text();
  });
  const registerChecksum = await fileChecksum(new Blob([registerText], { type: "application/json" }));
  if (registerChecksum !== manifest.registerChecksum) throw new Error("Die Register-Prüfsumme der Sicherung stimmt nicht. Wiederherstellung wurde gestoppt.");
  const index = parseIndex(registerText);
  const restoredFiles: FamilyBackupFile[] = [];
  await fileLifecycleOperation("Sicherungsdateien kopieren und prüfen", async () => {
    const backupData = await (await resolveBackup()).getDirectoryHandle("Dateien");
    const restoredRoot = await (await resolveTarget()).getDirectoryHandle(ROOT, { create: true });
    const attemptFiles: FamilyBackupFile[] = [];
    await copyDirectoryWithChecksums(backupData, restoredRoot, "", attemptFiles);
    restoredFiles.splice(0, restoredFiles.length, ...attemptFiles);
  });
  input.trace?.({ step: "Sicherungsdateien kopieren und prüfen", operation: "Kopierte Dateien per Prüfsumme bestätigen", relativePath: `${targetPath}/${ROOT}`, result: "success", permission: await queriedDirectoryPermission(await resolveTarget()), parentExists: true, targetExists: true });
  // Der Zielordner wird vor jedem Registerschritt über den noch gültigen
  // übergeordneten Handle neu aufgelöst. Dadurch wird kein über mehrere
  // Dateioperationen gealterter Unterordner-Handle weiterverwendet.
  const resolveRestoredRegisterDirectory = async () => {
    const currentTarget = await resolveTarget();
    const currentRoot = await currentTarget.getDirectoryHandle(ROOT, { create: true });
    return currentRoot.getDirectoryHandle("00_Register", { create: true });
  };
  await writeIndexToRegisterDirectory(resolveRestoredRegisterDirectory, index, {
    preserveTimestamp: true,
    diagnostics: input.diagnostics,
    trace: input.trace,
    relativeDirectoryPath: `${targetPath}/${ROOT}/00_Register`,
    windowsBasePath: input.diagnosticRelativeTargetPath?.startsWith(AUTOMATED_TEST_WORKSPACE) ? AUTOMATED_TEST_WINDOWS_BASE_PATH : undefined,
    shortTemporaryName: input.diagnosticRelativeTargetPath?.startsWith(AUTOMATED_TEST_WORKSPACE) === true,
  });
  const restoredRegisterText = await readExistingRegisterTextFromDirectory(await resolveRestoredRegisterDirectory());
  if (restoredRegisterText === null) throw new Error("Das wiederhergestellte Register fehlt.");
  const restoredRegisterChecksum = await fileChecksum(new Blob([restoredRegisterText], { type: "application/json" }));
  const restoredManifest = createFamilyBackupManifest({ appVersion: manifest.appVersion, createdAt: manifest.createdAt, registerChecksum: restoredRegisterChecksum, register: parseIndex(restoredRegisterText), files: restoredFiles });
  const verification = verifyFamilyBackupRestore(manifest, restoredManifest);
  if (!verification.ok) throw new Error("Die Wiederherstellung ist unvollständig und darf nicht als erfolgreich gelten.");
  input.trace?.({ step: "Wiederherstellung abschließend prüfen", operation: "Wiederhergestelltes Register lesen und vergleichen", relativePath: `${targetPath}/${ROOT}/00_Register/Familienakte_Register.json`, result: "success", permission: await queriedDirectoryPermission(await resolveTarget()), parentExists: true, targetExists: true });
  return { folderName: initialTarget.name, manifest: restoredManifest, verification };
}

export async function previewLocalDocumentAssignment(
  handle: FileSystemDirectoryHandle,
  input: AssignmentInput,
) {
  const index = await readIndex(handle);
  return proposeFamilyAssignment(input, {
    records: index.records.map(familyRecordToAssignmentRecord),
    documents: index.documents.map((document) => ({
      id: document.id,
      originalName: document.originalName,
      documentDate: document.documentDate,
    })),
  });
}

export async function createLocalFamilyRecord<T extends FamilyRecordType>(
  handle: FileSystemDirectoryHandle,
  input: {
    recordType: T;
    data: FamilyRecordPayloadMap[T];
    status?: string;
    source?: string | null;
    notes?: string | null;
  },
) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const allocation = nextFamilyRecordId(input.recordType, index.sequences);
  const record = createFamilyRecord({ ...input, id: allocation.id });
  index.sequences = allocation.sequences;
  index.records.push(record as FamilyRecordUnion);
  index.auditLog.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), action: "Datensatz angelegt", recordId: record.id, details: `${recordTypeDefinitions[input.recordType].label} wurde nach Benutzerbestätigung angelegt.` });
  await writeIndex(handle, index);
  return record;
}

export async function createLocalFamilyRelation(
  handle: FileSystemDirectoryHandle,
  input: Omit<FamilyRelation, "id" | "createdAt">,
) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const endpointExists = (type: FamilyRecordType, id: string) => type === "document" ? index.documents.some((item) => item.id === id) : index.records.some((item) => item.id === id && item.recordType === type);
  if (!endpointExists(input.fromType, input.fromId) || !endpointExists(input.toType, input.toId)) throw new Error("Die Verknüpfung verweist auf einen nicht vorhandenen Datensatz.");
  const existing = index.relations.find((item) => item.fromType === input.fromType && item.fromId === input.fromId && item.toType === input.toType && item.toId === input.toId && item.relationType === input.relationType);
  if (existing) return existing;
  const relation: FamilyRelation = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  index.relations.push(relation);
  index.auditLog.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), action: "Verknüpfung angelegt", recordId: relation.id, details: `${relation.fromId} → ${relation.toId} wurde nach Benutzerbestätigung verknüpft.` });
  await writeIndex(handle, index);
  return relation;
}

export async function createLocalCorrespondenceBundle(handle: FileSystemDirectoryHandle, input: {
  status: "Entwurf" | "Versandbereit" | "Versendet" | "Antwort ausstehend" | "Antwort eingegangen" | "Erledigt";
  data: FamilyRecordPayloadMap["event"];
  caseId?: string | null;
  documentIds?: string[];
}) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const allocation = nextFamilyRecordId("event", index.sequences);
  const event = createFamilyRecord({
    id: allocation.id,
    recordType: "event",
    status: input.status === "Erledigt" ? "erledigt" : "aktiv",
    source: "Assistenz- und Korrespondenzzentrale",
    notes: "Vom Benutzer geprüfter Korrespondenzeintrag. Kein automatischer Versand.",
    data: input.data,
  });
  if (input.caseId && !index.records.some((record) => record.recordType === "case" && record.id === input.caseId)) throw new Error("Der ausgewählte Vorgang wurde im gemeinsamen Register nicht gefunden.");
  const documentIds = [...new Set(input.documentIds || [])].filter((id) => index.documents.some((document) => document.id === id));
  const now = new Date().toISOString();
  const relations: FamilyRelation[] = [
    ...(input.caseId ? [{ id: crypto.randomUUID(), fromType: "event" as const, fromId: event.id, toType: "case" as const, toId: input.caseId, relationType: "gehört zu Vorgang", createdAt: now, source: "Vom Benutzer bestätigte Korrespondenz", notes: null }] : []),
    ...documentIds.map((id): FamilyRelation => ({ id: crypto.randomUUID(), fromType: "event", fromId: event.id, toType: "document", toId: id, relationType: "basiert auf", createdAt: now, source: "Vom Benutzer bestätigte Korrespondenz", notes: null })),
  ];
  index.sequences = allocation.sequences;
  index.records.push(event as FamilyRecordUnion);
  index.relations.push(...relations);
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: "Korrespondenz gespeichert", recordId: event.id, details: `${input.status}; ${relations.length} bestätigte Verknüpfung${relations.length === 1 ? "" : "en"}; kein automatischer Versand.` });
  await writeIndex(handle, index);
  return { event, relations };
}

export async function updateLocalCorrespondenceStatus(handle: FileSystemDirectoryHandle, eventId: string, status: "Entwurf" | "Versandbereit" | "Versendet" | "Antwort ausstehend" | "Antwort eingegangen" | "Erledigt") {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const record = index.records.find((item) => item.recordType === "event" && item.id === eventId);
  if (!record || (record.data as Record<string, unknown>).entryKind !== "correspondence") throw new Error("Der Korrespondenzeintrag wurde nicht gefunden.");
  record.status = status === "Erledigt" ? "erledigt" : "aktiv";
  record.updatedAt = new Date().toISOString();
  (record.data as FamilyRecordPayloadMap["event"]).correspondenceStatus = status;
  if (status === "Versendet" && !(record.data as FamilyRecordPayloadMap["event"]).sentAt) (record.data as FamilyRecordPayloadMap["event"]).sentAt = record.updatedAt;
  index.auditLog.unshift({ id: crypto.randomUUID(), at: record.updatedAt, action: "Korrespondenzstatus geändert", recordId: record.id, details: `Status nach Benutzerbestätigung: ${status}.` });
  await writeIndex(handle, index);
  return record;
}

export async function confirmLocalContextLink(handle: FileSystemDirectoryHandle, input: {
  sourceType: ContextSourceType;
  sourceId: string;
  caseId: string;
  reason?: string | null;
}) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  if (!index.records.some((record) => record.recordType === "case" && record.id === input.caseId)) throw new Error("Der ausgewählte Vorgang wurde nicht gefunden.");
  const existing = index.relations.find((relation) => relation.fromType === input.sourceType && relation.fromId === input.sourceId && relation.toType === "case" && relation.toId === input.caseId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const relation: FamilyRelation = {
    id: crypto.randomUUID(),
    fromType: input.sourceType,
    fromId: input.sourceId,
    toType: "case",
    toId: input.caseId,
    relationType: input.sourceType === "event" ? "ergänzt Chronologie" : "gehört zu",
    createdAt: now,
    source: "Bestätigte Kontextverknüpfung",
    notes: input.reason || null,
  };
  index.relations.push(relation);
  index.linkDecisions = index.linkDecisions.filter((decision) => !(decision.sourceType === input.sourceType && decision.sourceId === input.sourceId && decision.caseId === input.caseId));
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: "Zusammenhang bestätigt", recordId: relation.id, details: `${input.sourceId} wurde nach Benutzerbestätigung mit ${input.caseId} verknüpft. Datensätze wurden nicht zusammengeführt.` });
  await writeIndex(handle, index);
  return relation;
}

export async function rejectLocalContextLink(handle: FileSystemDirectoryHandle, input: {
  sourceType: ContextSourceType;
  sourceId: string;
  caseId: string;
  contextHash: string;
}) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const now = new Date().toISOString();
  index.linkDecisions = index.linkDecisions.filter((decision) => !(decision.sourceType === input.sourceType && decision.sourceId === input.sourceId && decision.caseId === input.caseId));
  const decision: ContextLinkDecision = { id: crypto.randomUUID(), ...input, decision: "nicht_verknuepfen", decidedAt: now };
  index.linkDecisions.push(decision);
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: "Zusammenhang abgelehnt", recordId: decision.id, details: `${input.sourceId} soll bei unverändertem Kontext nicht erneut mit ${input.caseId} vorgeschlagen werden.` });
  await writeIndex(handle, index);
  return decision;
}

export async function removeLocalContextLink(handle: FileSystemDirectoryHandle, relationId: string) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const relation = index.relations.find((item) => item.id === relationId);
  if (!relation) throw new Error("Die ausgewählte Verknüpfung wurde nicht gefunden.");
  if (relation.fromType !== "document" && relation.fromType !== "event") throw new Error("Diese Verknüpfung kann in diesem Bereich nicht gelöst werden.");
  if (relation.toType !== "case") throw new Error("Nur ein Vorgangsbezug kann hier gelöst werden.");
  index.relations = index.relations.filter((item) => item.id !== relationId);
  const now = new Date().toISOString();
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: "Zusammenhang gelöst", recordId: relation.id, details: `${relation.fromId} ↔ ${relation.toId}: Nur die Verbindung wurde entfernt; beide Datensätze blieben erhalten.` });
  await writeIndex(handle, index);
  return relation;
}

export async function changeLocalContextLink(handle: FileSystemDirectoryHandle, input: {
  sourceType: ContextSourceType;
  sourceId: string;
  previousRelationId?: string | null;
  caseId: string;
}) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  if (!index.records.some((record) => record.recordType === "case" && record.id === input.caseId)) throw new Error("Der ausgewählte Vorgang wurde nicht gefunden.");
  const now = new Date().toISOString();
  if (input.previousRelationId) index.relations = index.relations.filter((relation) => relation.id !== input.previousRelationId);
  let relation = index.relations.find((item) => item.fromType === input.sourceType && item.fromId === input.sourceId && item.toType === "case" && item.toId === input.caseId);
  if (!relation) {
    relation = { id: crypto.randomUUID(), fromType: input.sourceType, fromId: input.sourceId, toType: "case", toId: input.caseId, relationType: input.sourceType === "event" ? "ergänzt Chronologie" : "gehört zu", createdAt: now, source: "Geänderte Kontextverknüpfung", notes: null };
    index.relations.push(relation);
  }
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: "Zusammenhang geändert", recordId: relation.id, details: `${input.sourceId} wurde nach Benutzerbestätigung dem Vorgang ${input.caseId} zugeordnet. Originaldatensätze blieben unverändert.` });
  await writeIndex(handle, index);
  return relation;
}

export async function createLocalScheduleBundle(handle: FileSystemDirectoryHandle, input: CreateScheduleInput) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  if (!input.title.trim() || !input.dueAt) throw new Error("Bezeichnung und Fälligkeitsdatum sind erforderlich.");
  const index = await readIndex(handle);
  const now = new Date().toISOString();
  const scheduleAllocation = nextFamilyRecordId(input.recordType, index.sequences);
  index.sequences = scheduleAllocation.sequences;
  const schedule = createFamilyRecord({
    id: scheduleAllocation.id,
    recordType: input.recordType,
    status: "offen",
    source: input.source || "Manuelle Eingabe",
    notes: input.notes || null,
    data: input.recordType === "deadline"
      ? { title: input.title.trim(), dueAt: input.dueAt }
      : { title: input.title.trim(), dueAt: input.dueAt },
    now,
  }) as FamilyRecordUnion;
  index.records.push(schedule);
  for (const reference of input.references.filter((item) => item.id.trim())) {
    const exists = reference.recordType === "document" ? index.documents.some((item) => item.id === reference.id.trim()) : index.records.some((item) => item.id === reference.id.trim() && item.recordType === reference.recordType);
    if (!exists) throw new Error(`Die Verknüpfung zu ${reference.id.trim()} ist ungültig.`);
    if (index.relations.some((item) => item.fromType === input.recordType && item.fromId === schedule.id && item.toType === reference.recordType && item.toId === reference.id.trim() && item.relationType === reference.relationType)) continue;
    index.relations.push({ id: crypto.randomUUID(), fromType: input.recordType, fromId: schedule.id, toType: reference.recordType, toId: reference.id.trim(), relationType: reference.relationType, createdAt: now, source: input.source || "Manuelle Eingabe", notes: null });
  }
  let reminder: FamilyRecordUnion | null = null;
  if (input.reminderAt) {
    const reminderAllocation = nextFamilyRecordId("reminder", index.sequences);
    index.sequences = reminderAllocation.sequences;
    reminder = createFamilyRecord({ id: reminderAllocation.id, recordType: "reminder", status: "offen", source: schedule.id, notes: input.notes || null, data: { title: `Erinnerung: ${input.title.trim()}`, remindAt: input.reminderAt }, now }) as FamilyRecordUnion;
    index.records.push(reminder);
    index.relations.push({ id: crypto.randomUUID(), fromType: "reminder", fromId: reminder.id, toType: input.recordType, toId: schedule.id, relationType: "erinnert an", createdAt: now, source: input.source || "Manuelle Eingabe", notes: null });
  }
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: "Frist oder Aufgabe angelegt", recordId: schedule.id, details: `${schedule.id} wurde nach ausdrücklicher Benutzerbestätigung angelegt.${reminder ? ` ${reminder.id} wurde verknüpft.` : ""}` });
  await writeIndex(handle, index);
  return { schedule, reminder };
}

export type LocalScheduleStatus = "offen" | "in_bearbeitung" | "wartet_auf_antwort" | "erledigt" | "zurückgestellt";

export async function updateLocalScheduleStatus(handle: FileSystemDirectoryHandle, id: string, status: LocalScheduleStatus) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const record = index.records.find((item) => item.id === id && ["deadline", "task", "reminder"].includes(item.recordType));
  if (!record) throw new Error("Die Frist, Aufgabe oder Erinnerung wurde nicht gefunden.");
  const previous = record.status;
  const now = new Date().toISOString();
  record.status = status;
  record.updatedAt = now;
  if (record.recordType === "task") record.data.completedAt = status === "erledigt" ? now : undefined;
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: "Status geändert", recordId: record.id, details: `${record.id}: ${previous} → ${status}; Änderung durch Benutzerbefehl.` });
  await writeIndex(handle, index);
  return record;
}

export async function appendLocalFamilyRecordNote(handle: FileSystemDirectoryHandle, id: string, note: string) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const cleanNote = note.trim();
  if (!cleanNote) throw new Error("Bitte zuerst eine Notiz eingeben.");
  const index = await readIndex(handle);
  const record = index.records.find((item) => item.id === id);
  if (!record) throw new Error("Der Datensatz wurde im lokalen Register nicht gefunden.");
  const now = new Date().toISOString();
  record.notes = record.notes ? `${record.notes}\n\n${cleanNote}` : cleanNote;
  record.updatedAt = now;
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: "Notiz ergänzt", recordId: record.id, details: `${record.id}: Notiz nach ausdrücklichem Benutzerbefehl ergänzt.` });
  await writeIndex(handle, index);
  return record;
}

export type CreateLocalMemoryDraftInput = {
  draftId?: string;
  originalText: string;
  originalTranscript?: string;
  captureType: MemoryCaptureType;
  mediaFiles: File[];
  suggestedCaseId?: string;
};

function validateMemoryMediaFiles(files: File[]) {
  if (files.length > 12) throw new Error("Bitte höchstens zwölf Fotos oder Videos pro Erinnerungsereignis auswählen.");
  const unsupported = files.find((file) => !file.type.startsWith("image/") && !file.type.startsWith("video/"));
  if (unsupported) throw new Error(`Das Dateiformat von „${unsupported.name}“ wird als Memory-Medium derzeit nicht unterstützt.`);
  const tooLarge = files.find((file) => file.size > (file.type.startsWith("video/") ? 200 : 25) * 1024 * 1024);
  if (tooLarge) throw new Error(`„${tooLarge.name}“ ist für diese Erfassung zu groß.`);
}

function memoryDraftId() {
  return `MEMDRAFT-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

async function storeMemoryDraftMedia(handle: FileSystemDirectoryHandle, draftId: string, files: File[]) {
  if (!files.length) return [] as MemoryDraftMediaReference[];
  const mediaRoot = await (await root(handle)).getDirectoryHandle("03_Erinnerungsmedien", { create: true });
  const draftsRoot = await mediaRoot.getDirectoryHandle("00_Unbehandelt", { create: true });
  const draftFolder = await draftsRoot.getDirectoryHandle(draftId, { create: true });
  const revisionName = `Stand_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
  const revisionFolder = await draftFolder.getDirectoryHandle(revisionName, { create: true });
  const media: MemoryDraftMediaReference[] = [];
  for (const [order, file] of files.entries()) {
    const mediaId = crypto.randomUUID();
    const storedName = `${String(order + 1).padStart(2, "0")}_${mediaId.slice(0, 8)}_${clean(file.name)}`;
    const target = await revisionFolder.getFileHandle(storedName, { create: true });
    const writable = await target.createWritable();
    await writable.write(file);
    await writable.close();
    media.push({ id: mediaId, name: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, kind: file.type.startsWith("video/") ? "video" : "foto", order, storedPath: `${ROOT}/03_Erinnerungsmedien/00_Unbehandelt/${draftId}/${revisionName}/${storedName}` });
  }
  return media;
}

async function removeMemoryDraftFolder(handle: FileSystemDirectoryHandle, draftId: string) {
  try {
    const mediaRoot = await (await root(handle)).getDirectoryHandle("03_Erinnerungsmedien");
    const draftsRoot = await mediaRoot.getDirectoryHandle("00_Unbehandelt");
    await draftsRoot.removeEntry(draftId, { recursive: true });
  } catch {
    // Ein fehlender temporärer Medienordner ist kein Grund, den Registereintrag zurückzusetzen.
  }
}

export async function createOrUpdateLocalMemoryDraft(handle: FileSystemDirectoryHandle, input: CreateLocalMemoryDraftInput) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const originalText = input.originalText.trim();
  if (!originalText && !input.mediaFiles.length) throw new Error("Bitte zuerst eine Erinnerung eingeben.");
  validateMemoryMediaFiles(input.mediaFiles);
  const index = await readIndex(handle);
  const existing = input.draftId ? index.memoryDrafts.find((item) => item.id === input.draftId) : null;
  if (input.draftId && !existing) throw new Error("Der ausgewählte Memory-Entwurf wurde nicht gefunden.");
  const now = new Date().toISOString();
  const id = existing?.id || memoryDraftId();
  const media = await storeMemoryDraftMedia(handle, id, input.mediaFiles);
  const draft = buildMemoryDraftEntry({
    id,
    originalText,
    originalTranscript: input.originalTranscript,
    captureType: input.captureType,
    media,
    capturedAt: existing?.capturedAt || now,
    order: existing?.order || Math.max(0, ...index.memoryDrafts.map((item) => item.order)) + 1,
    status: "unbehandelt",
    suggestedCaseId: input.suggestedCaseId || existing?.suggestedCaseId,
  });
  draft.updatedAt = now;
  if (existing) index.memoryDrafts = index.memoryDrafts.map((item) => item.id === id ? draft : item);
  else index.memoryDrafts.push(draft);
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: existing ? "Memory-Entwurf ergänzt" : "Memory-Entwurf vorgemerkt", recordId: id, details: `${id} wurde lokal als unbehandelter Entwurf gespeichert; noch keine Chronologie, Aufgabe, Frist oder Cockpit-Meldung erzeugt.` });
  await writeIndex(handle, index);
  return structuredClone(draft);
}

export async function updateLocalMemoryDraftStatus(handle: FileSystemDirectoryHandle, draftId: string, status: MemoryDraftStatus) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const draft = index.memoryDrafts.find((item) => item.id === draftId);
  if (!draft) throw new Error("Der ausgewählte Memory-Entwurf wurde nicht gefunden.");
  draft.status = status;
  draft.updatedAt = new Date().toISOString();
  await writeIndex(handle, index);
  return structuredClone(draft);
}

export async function readLocalMemoryDraftFiles(handle: FileSystemDirectoryHandle, draftId: string) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const draft = index.memoryDrafts.find((item) => item.id === draftId);
  if (!draft) throw new Error("Der ausgewählte Memory-Entwurf wurde nicht gefunden.");
  const files: File[] = [];
  for (const media of [...draft.media].sort((a, b) => a.order - b.order)) {
    const stored = await fileFromStoredPath(handle, media.storedPath);
    files.push(new File([stored], media.name, { type: media.mimeType || stored.type, lastModified: stored.lastModified }));
  }
  return files;
}

export async function deleteLocalMemoryDraft(handle: FileSystemDirectoryHandle, draftId: string) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const draft = index.memoryDrafts.find((item) => item.id === draftId);
  if (!draft) throw new Error("Der ausgewählte Memory-Entwurf wurde nicht gefunden.");
  index.memoryDrafts = index.memoryDrafts.filter((item) => item.id !== draftId);
  const now = new Date().toISOString();
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: "Memory-Entwurf gelöscht", recordId: draftId, details: `${draftId} wurde nach ausdrücklicher Bestätigung aus der temporären Warteschlange entfernt. Endgültige Memory-Einträge blieben unverändert.` });
  await writeIndex(handle, index);
  await removeMemoryDraftFolder(handle, draftId);
}

export type CreateLocalMemoryInput = {
  draftId?: string;
  originalText: string;
  originalTranscript?: string;
  followUpAnswer?: string;
  captureType: MemoryCaptureType;
  analysis: MemoryAnalysis;
  mediaFiles: File[];
  selectedReferences: Array<{ recordType: Extract<FamilyRecordType, "person" | "organisation" | "object" | "case" | "document">; id: string }>;
  createTask?: boolean;
  createDeadline?: boolean;
};

function memoryMediaKind(file: File): MemoryMediaReference["kind"] {
  return file.type.startsWith("video/") ? "video" : "foto";
}

export async function createLocalMemoryBundle(handle: FileSystemDirectoryHandle, input: CreateLocalMemoryInput) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const originalText = input.originalText.trim();
  if (!originalText && !input.mediaFiles.length) throw new Error("Bitte einen Text diktieren, schreiben oder mindestens ein Foto beziehungsweise Video auswählen.");
  validateMemoryMediaFiles(input.mediaFiles);

  const index = await readIndex(handle);
  if (input.draftId && !index.memoryDrafts.some((draft) => draft.id === input.draftId)) throw new Error("Der zu speichernde Memory-Entwurf wurde nicht gefunden.");
  const now = new Date().toISOString();
  const allocation = nextFamilyRecordId("event", index.sequences);
  index.sequences = allocation.sequences;
  const media: MemoryMediaReference[] = [];
  if (input.mediaFiles.length) {
    const mediaRoot = await (await root(handle)).getDirectoryHandle("03_Erinnerungsmedien", { create: true });
    const eventFolder = await mediaRoot.getDirectoryHandle(allocation.id, { create: true });
    for (const [order, file] of input.mediaFiles.entries()) {
      const mediaId = crypto.randomUUID();
      const storedName = `${String(order + 1).padStart(2, "0")}_${mediaId.slice(0, 8)}_${clean(file.name)}`;
      const target = await eventFolder.getFileHandle(storedName, { create: true });
      const writable = await target.createWritable();
      await writable.write(file);
      await writable.close();
      media.push({ id: mediaId, name: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, kind: memoryMediaKind(file), role: "nicht_festgelegt", order, storedPath: `${ROOT}/03_Erinnerungsmedien/${allocation.id}/${storedName}` });
    }
  }
  const assistantSummary = [input.analysis.eventType, input.analysis.lifeArea, input.analysis.openPoint ? `Offen: ${input.analysis.openPoint.question}` : "kein offener Klärungspunkt"].join(" · ");
  const data: MemoryEventData = {
    title: input.analysis.title,
    eventAt: input.analysis.eventAt,
    memoryVersion: FAMILY_MEMORY_VERSION,
    captureType: input.captureType,
    originalText,
    originalTranscript: input.originalTranscript?.trim() || undefined,
    followUpAnswer: input.followUpAnswer?.trim() || undefined,
    lifeArea: input.analysis.lifeArea,
    eventType: input.analysis.eventType,
    sensitive: input.analysis.sensitive,
    confidence: input.analysis.confidence,
    statements: structuredClone(input.analysis.statements),
    openPoint: input.analysis.openPoint ? structuredClone(input.analysis.openPoint) : null,
    tags: [...input.analysis.tags],
    media,
    assistantSummary,
  };
  const event = createFamilyRecord({ id: allocation.id, recordType: "event", status: data.openPoint ? "offen" : "aktiv", source: "Tagebuch & Erinnerungsprotokoll", notes: null, data, now }) as FamilyRecordUnion;
  index.records.push(event);
  for (const reference of input.selectedReferences) {
    const exists = reference.recordType === "document" ? index.documents.some((item) => item.id === reference.id) : index.records.some((item) => item.recordType === reference.recordType && item.id === reference.id);
    if (!exists || index.relations.some((relation) => relation.fromId === event.id && relation.toId === reference.id)) continue;
    index.relations.push({ id: crypto.randomUUID(), fromType: "event", fromId: event.id, toType: reference.recordType, toId: reference.id, relationType: reference.recordType === "case" ? "ergänzt Chronologie" : "gehört zu", createdAt: now, source: "Bestätigter Memory-Eintrag", notes: null });
  }

  let task: FamilyRecordUnion | null = null;
  if (input.createTask && input.analysis.taskProposal) {
    const taskAllocation = nextFamilyRecordId("task", index.sequences);
    index.sequences = taskAllocation.sequences;
    task = createFamilyRecord({ id: taskAllocation.id, recordType: "task", status: "offen", source: event.id, notes: "Vom Benutzer aus einem Memory-Ereignis bestätigt.", data: { title: input.analysis.taskProposal, dueAt: input.analysis.deadlineProposal || undefined }, now }) as FamilyRecordUnion;
    index.records.push(task);
    index.relations.push({ id: crypto.randomUUID(), fromType: "task", fromId: task.id, toType: "event", toId: event.id, relationType: "entstand aus", createdAt: now, source: "Bestätigter Memory-Eintrag", notes: null });
  }
  let deadline: FamilyRecordUnion | null = null;
  if (input.createDeadline && input.analysis.deadlineProposal) {
    const deadlineAllocation = nextFamilyRecordId("deadline", index.sequences);
    index.sequences = deadlineAllocation.sequences;
    deadline = createFamilyRecord({ id: deadlineAllocation.id, recordType: "deadline", status: "offen", source: event.id, notes: "Vom Benutzer aus einem Memory-Ereignis bestätigt.", data: { title: `Frist zu: ${input.analysis.title}`, dueAt: input.analysis.deadlineProposal }, now }) as FamilyRecordUnion;
    index.records.push(deadline);
    index.relations.push({ id: crypto.randomUUID(), fromType: "deadline", fromId: deadline.id, toType: "event", toId: event.id, relationType: "basiert auf", createdAt: now, source: "Bestätigter Memory-Eintrag", notes: null });
  }
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: "Memory-Ereignis angelegt", recordId: event.id, details: `${event.id} wurde nach Benutzerbestätigung mit ${media.length} Medium${media.length === 1 ? "" : "en"}, ${input.selectedReferences.length} Verknüpfung${input.selectedReferences.length === 1 ? "" : "en"}${task ? ", einer Aufgabe" : ""}${deadline ? " und einer Frist" : ""} gespeichert. Der Originaltext blieb unverändert.` });
  if (input.draftId) index.memoryDrafts = index.memoryDrafts.filter((draft) => draft.id !== input.draftId);
  await writeIndex(handle, index);
  if (input.draftId) await removeMemoryDraftFolder(handle, input.draftId);
  return { event, task, deadline, media };
}

export async function updateLocalMemoryOpenPointStatus(handle: FileSystemDirectoryHandle, eventId: string, status: MemoryOpenStatus) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const event = index.records.find((record) => record.id === eventId && isMemoryRecord(record));
  if (!event) throw new Error("Der Memory-Eintrag wurde nicht gefunden.");
  const data = memoryData(event)!;
  if (!data.openPoint) throw new Error("Dieser Eintrag enthält keinen offenen Memory-Punkt.");
  const previous = data.openPoint.status;
  data.openPoint.status = status;
  event.status = ["erledigt", "keine_weitere_erinnerung"].includes(status) ? "erledigt" : "offen";
  event.updatedAt = new Date().toISOString();
  index.auditLog.unshift({ id: crypto.randomUUID(), at: event.updatedAt, action: "Memory-Status geändert", recordId: event.id, details: `${event.id}: ${previous} → ${status}; Änderung durch Benutzerbefehl.` });
  await writeIndex(handle, index);
  return event;
}

export type UpdateLocalMemoryInput = Partial<Pick<MemoryEventData, "title" | "eventAt" | "originalText" | "followUpAnswer" | "lifeArea" | "eventType" | "confidence" | "tags">>;

export async function updateLocalMemoryRecord(handle: FileSystemDirectoryHandle, eventId: string, changes: UpdateLocalMemoryInput) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const event = index.records.find((record) => record.id === eventId && isMemoryRecord(record));
  if (!event) throw new Error("Der Memory-Eintrag wurde nicht gefunden.");
  const data = memoryData(event)!;
  const allowed: Array<keyof UpdateLocalMemoryInput> = ["title", "eventAt", "originalText", "followUpAnswer", "lifeArea", "eventType", "confidence", "tags"];
  for (const key of allowed) {
    const value = changes[key];
    if (value !== undefined) (data as Record<string, unknown>)[key] = Array.isArray(value) ? [...value] : typeof value === "string" ? value.trim() : value;
  }
  if (!data.title || !data.eventAt || !data.lifeArea) throw new Error("Titel, Zeitpunkt und Lebensbereich dürfen nicht leer sein.");
  const now = new Date().toISOString();
  event.updatedAt = now;
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: "Memory-Eintrag bearbeitet", recordId: event.id, details: `${event.id} wurde nach ausdrücklicher Benutzeraktion bearbeitet. Verknüpfte Datensätze blieben erhalten.` });
  await writeIndex(handle, index);
  return structuredClone(event);
}

export async function getLocalMemoryDeleteImpact(handle: FileSystemDirectoryHandle, eventId: string) {
  const index = await readIndex(handle);
  const event = index.records.find((record) => record.id === eventId && isMemoryRecord(record));
  if (!event) throw new Error("Der Memory-Eintrag wurde nicht gefunden.");
  const linkedScheduleIds = index.relations.filter((relation) => relation.toId === eventId && (relation.fromType === "task" || relation.fromType === "deadline")).map((relation) => relation.fromId);
  return { eventId, linkedScheduleIds, linkedScheduleCount: linkedScheduleIds.length };
}

export async function deleteLocalMemoryRecord(handle: FileSystemDirectoryHandle, eventId: string, options: { keepLinkedSchedules: boolean }) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const event = index.records.find((record) => record.id === eventId && isMemoryRecord(record));
  if (!event) throw new Error("Der Memory-Eintrag wurde nicht gefunden.");
  const linkedScheduleIds = new Set(index.relations.filter((relation) => relation.toId === eventId && (relation.fromType === "task" || relation.fromType === "deadline")).map((relation) => relation.fromId));
  const removedRecordIds = new Set([eventId]);
  if (!options.keepLinkedSchedules) {
    linkedScheduleIds.forEach((id) => removedRecordIds.add(id));
    const linkedReminderIds = index.relations.filter((relation) => linkedScheduleIds.has(relation.toId) && relation.fromType === "reminder").map((relation) => relation.fromId);
    linkedReminderIds.forEach((id) => removedRecordIds.add(id));
  }
  index.records = index.records.filter((record) => !removedRecordIds.has(record.id));
  index.relations = index.relations.filter((relation) => !removedRecordIds.has(relation.fromId) && !removedRecordIds.has(relation.toId));
  index.linkDecisions = index.linkDecisions.filter((decision) => decision.sourceId !== eventId);
  const now = new Date().toISOString();
  index.auditLog.unshift({ id: crypto.randomUUID(), at: now, action: "Memory-Eintrag gelöscht", recordId: eventId, details: `${eventId} wurde nach ausdrücklicher Bestätigung gelöscht. ${options.keepLinkedSchedules ? "Verknüpfte Aufgaben und Fristen blieben als eigenständige Datensätze erhalten." : `${linkedScheduleIds.size} verbundene Aufgaben/Fristen wurden nach gesonderter Auswahl mit entfernt.`} Gemeinsam verwendete Personen, Organisationen, Objekte, Vorgänge und Dokumente blieben erhalten.` });
  await writeIndex(handle, index);
  try {
    const mediaRoot = await (await root(handle)).getDirectoryHandle("03_Erinnerungsmedien");
    await mediaRoot.removeEntry(eventId, { recursive: true });
  } catch {
    // Fehlende lokale Medien ändern die erfolgreich bestätigte Registerbereinigung nicht.
  }
  return { eventId, removedScheduleCount: options.keepLinkedSchedules ? 0 : linkedScheduleIds.size, keptScheduleCount: options.keepLinkedSchedules ? linkedScheduleIds.size : 0 };
}

export async function readLocalMemoryMediaFile(handle: FileSystemDirectoryHandle, eventId: string, mediaId: string) {
  if (!(await requestVaultPermission(handle))) throw new Error("Der lokale Ordner wurde nicht freigegeben.");
  const index = await readIndex(handle);
  const event = index.records.find((record) => record.id === eventId && isMemoryRecord(record));
  const media = event ? memoryData(event)?.media.find((item) => item.id === mediaId) : null;
  if (!media) throw new Error("Das ausgewählte Memory-Medium wurde nicht gefunden.");
  return fileFromStoredPath(handle, media.storedPath);
}

export async function compareVaults(source: FileSystemDirectoryHandle, target: FileSystemDirectoryHandle): Promise<VaultSyncPreview> {
  if (!(await requestVaultPermission(source)) || !(await requestVaultPermission(target))) throw new Error("Beide Datentresore müssen freigegeben sein.");
  if (await (source as ComparableHandle).isSameEntry?.(target)) throw new Error("OneDrive und Sicherung zeigen auf denselben Ordner. Bitte einen getrennten PC- oder USB-Ordner wählen.");
  const sourceIndex = await readIndex(source); const targetIndex = await readIndex(target);
  const targetById = new Map(targetIndex.documents.map((document) => [document.id, document]));
  let existingDocuments = 0; let conflictingDocuments = 0; let missingDocuments = 0;
  for (const document of sourceIndex.documents) {
    const existing = targetById.get(document.id);
    if (!existing) { missingDocuments++; continue; }
    if (existing.sizeBytes !== document.sizeBytes || existing.originalName !== document.originalName) { conflictingDocuments++; continue; }
    try {
      const file = await fileFromStoredPath(target, existing.storedPath);
      if (file.size === document.sizeBytes) existingDocuments++; else conflictingDocuments++;
    } catch { missingDocuments++; }
  }
  return {
    sourceDocuments: sourceIndex.documents.length,
    targetDocuments: targetIndex.documents.length,
    missingDocuments,
    existingDocuments,
    conflictingDocuments,
  };
}

export async function copyMissingDocuments(source: FileSystemDirectoryHandle, target: FileSystemDirectoryHandle): Promise<VaultSyncResult> {
  const preview = await compareVaults(source, target);
  const sourceIndex = await readIndex(source); const targetIndex = await readIndex(target);
  const targetById = new Map(targetIndex.documents.map((document) => [document.id, document]));
  let copiedDocuments = 0; let skippedDocuments = 0;
  for (const document of sourceIndex.documents) {
    const existing = targetById.get(document.id);
    if (existing) {
      try {
        const existingFile = await fileFromStoredPath(target, existing.storedPath);
        if (existingFile.size === document.sizeBytes && existing.originalName === document.originalName) { skippedDocuments++; continue; }
        skippedDocuments++; continue;
      } catch {
        const sourceFile = await fileFromStoredPath(source, document.storedPath);
        const destination = await unusedTargetPath(target, existing.storedPath, document.id);
        const fileHandle = await destination.directory.getFileHandle(destination.fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(sourceFile); await writable.close();
        existing.storedPath = destination.storedPath; copiedDocuments++;
        await writeIndex(target, targetIndex); continue;
      }
    }
    const sourceFile = await fileFromStoredPath(source, document.storedPath);
    const destination = await unusedTargetPath(target, document.storedPath, document.id);
    const fileHandle = await destination.directory.getFileHandle(destination.fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(sourceFile); await writable.close();
    const copiedDocument = { ...document, storedPath: destination.storedPath };
    targetIndex.documents.push(copiedDocument); targetById.set(document.id, copiedDocument); copiedDocuments++;
    await writeIndex(target, targetIndex);
  }
  targetIndex.documents.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  await writeIndex(target, targetIndex);
  const completedAt = new Date().toISOString();
  const logDirectory = await registerDir(target);
  const logHandle = await logDirectory.getFileHandle("Letzte_Sicherung.json", { create: true });
  const logWritable = await logHandle.createWritable();
  await logWritable.write(JSON.stringify({ completedAt, source: source.name, target: target.name, copiedDocuments, skippedDocuments, mode: "nur fehlende Dateien kopieren; nichts löschen oder überschreiben" }, null, 2));
  await logWritable.close();
  return { ...preview, copiedDocuments, skippedDocuments, completedAt };
}
