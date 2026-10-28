export const FULL_BACKUP_SCHEMA_VERSION = 1 as const;

export type FamilyBackupFile = {
  path: string;
  sizeBytes: number;
  checksum: string;
};

export type FamilyBackupManifest = {
  schemaVersion: typeof FULL_BACKUP_SCHEMA_VERSION;
  appVersion: string;
  createdAt: string;
  registerChecksum: string;
  counts: {
    documents: number;
    records: number;
    relations: number;
    memoryDrafts: number;
    linkDecisions: number;
    auditEntries: number;
    files: number;
  };
  files: FamilyBackupFile[];
  safeguards: string[];
};

export function createFamilyBackupManifest(input: {
  appVersion: string;
  createdAt: string;
  registerChecksum: string;
  register: { documents?: unknown[]; records?: unknown[]; relations?: unknown[]; memoryDrafts?: unknown[]; linkDecisions?: unknown[]; auditLog?: unknown[] };
  files: FamilyBackupFile[];
}): FamilyBackupManifest {
  return {
    schemaVersion: FULL_BACKUP_SCHEMA_VERSION,
    appVersion: input.appVersion,
    createdAt: input.createdAt,
    registerChecksum: input.registerChecksum,
    counts: {
      documents: input.register.documents?.length || 0,
      records: input.register.records?.length || 0,
      relations: input.register.relations?.length || 0,
      memoryDrafts: input.register.memoryDrafts?.length || 0,
      linkDecisions: input.register.linkDecisions?.length || 0,
      auditEntries: input.register.auditLog?.length || 0,
      files: input.files.length,
    },
    files: [...input.files].sort((a, b) => a.path.localeCompare(b.path, "de")),
    safeguards: [
      "Originaldateien nicht verändert",
      "Register vollständig aufgenommen",
      "Prüfsummen für Register und Dateien gespeichert",
      "Wiederherstellung nur in leerer Testumgebung",
    ],
  };
}

export function verifyFamilyBackupRestore(source: FamilyBackupManifest, restored: FamilyBackupManifest) {
  const sourceFiles = new Map(source.files.map((file) => [file.path, `${file.sizeBytes}:${file.checksum}`]));
  const restoredFiles = new Map(restored.files.map((file) => [file.path, `${file.sizeBytes}:${file.checksum}`]));
  const missingFiles = [...sourceFiles].filter(([path, fingerprint]) => restoredFiles.get(path) !== fingerprint).map(([path]) => path);
  const countKeys = Object.keys(source.counts) as Array<keyof FamilyBackupManifest["counts"]>;
  const countDifferences = countKeys.filter((key) => source.counts[key] !== restored.counts[key]);
  const registerMatches = source.registerChecksum === restored.registerChecksum;
  return {
    ok: registerMatches && !missingFiles.length && !countDifferences.length,
    registerMatches,
    missingFiles,
    countDifferences,
  };
}
