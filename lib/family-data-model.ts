export const FAMILY_DATA_MODEL_VERSION = 1 as const;

export const recordTypeDefinitions = {
  person: { prefix: "PER", label: "Person" },
  organisation: { prefix: "ORG", label: "Organisation / Kontaktstelle" },
  object: { prefix: "OBJ", label: "Objekt" },
  case: { prefix: "VORG", label: "Vorgang" },
  document: { prefix: "DOC", label: "Dokument" },
  deadline: { prefix: "FRIST", label: "Frist" },
  task: { prefix: "TASK", label: "Aufgabe" },
  reminder: { prefix: "REM", label: "Erinnerung" },
  event: { prefix: "EVENT", label: "Ereignis" },
  payment: { prefix: "PAY", label: "Zahlung / Kosten" },
  contract: { prefix: "VERTRAG", label: "Vertrag" },
  warranty: { prefix: "GAR", label: "Garantie" },
} as const;

export type FamilyRecordType = keyof typeof recordTypeDefinitions;
export type FamilyRecordPrefix = (typeof recordTypeDefinitions)[FamilyRecordType]["prefix"];
export type FamilyRecordStatus = "aktiv" | "offen" | "erledigt" | "archiviert" | string;
export type DocumentStorageType = "onedrive" | "local" | "usb" | "online-r2" | "external";
export type DocumentStorageLocation = {
  id: string;
  storageType: DocumentStorageType;
  path: string;
  source: string;
  checksum?: string | null;
  fileSize?: number | null;
  verifiedAt?: string | null;
};

export type FamilyRecordPayloadMap = {
  person: { displayName?: string; birthDate?: string; street?: string; postalCode?: string; city?: string; email?: string; phone?: string };
  organisation: { name?: string; contactType?: string };
  object: { name?: string; objectType?: string };
  case: { title?: string; caseType?: string };
  document: {
    fileName?: string;
    originalName?: string;
    storageType?: DocumentStorageType;
    oneDrivePath?: string;
    relativePath?: string;
    checksum?: string;
    storageLocations?: DocumentStorageLocation[];
  };
  deadline: { title?: string; dueAt?: string };
  task: { title?: string; dueAt?: string; completedAt?: string };
  reminder: { title?: string; remindAt?: string };
  event: {
    title?: string;
    eventAt?: string;
    memoryVersion?: number;
    captureType?: string;
    originalText?: string;
    originalTranscript?: string;
    followUpAnswer?: string;
    lifeArea?: string;
    eventType?: string;
    sensitive?: boolean;
    confidence?: string;
    statements?: unknown[];
    openPoint?: unknown;
    tags?: string[];
    media?: unknown[];
    assistantSummary?: string;
    entryKind?: "memory" | "assistant_session" | "correspondence";
    recipient?: string;
    recipientEmail?: string;
    subject?: string;
    body?: string;
    correspondenceType?: string;
    correspondenceStatus?: "Entwurf" | "Versandbereit" | "Versendet" | "Antwort ausstehend" | "Antwort eingegangen" | "Erledigt";
    sentAt?: string;
    deliveryMethod?: string;
    caseReference?: string;
    attachmentDocumentIds?: string[];
    sourceDocumentIds?: string[];
    researchStatus?: "not_configured" | "completed";
    researchSources?: string[];
  };
  payment: { title?: string; amountCents?: number; currency?: string };
  contract: { title?: string; contractNumber?: string; startsOn?: string; endsOn?: string };
  warranty: { title?: string; startsOn?: string; expiresOn?: string };
};

export type FamilyRecord<T extends FamilyRecordType = FamilyRecordType> = {
  id: string;
  recordType: T;
  createdAt: string;
  updatedAt: string;
  status: FamilyRecordStatus;
  source: string | null;
  notes: string | null;
  data: FamilyRecordPayloadMap[T];
};

export type FamilyRecordUnion = {
  [T in FamilyRecordType]: FamilyRecord<T>;
}[FamilyRecordType];

export type FamilyRelation = {
  id: string;
  fromType: FamilyRecordType;
  fromId: string;
  toType: FamilyRecordType;
  toId: string;
  relationType: string;
  createdAt: string;
  source: string | null;
  notes: string | null;
};

export type FamilyIdSequences = Partial<Record<FamilyRecordType, number>>;

export function formatFamilyRecordId(type: FamilyRecordType, sequence: number): string {
  if (!Number.isSafeInteger(sequence) || sequence < 1 || sequence > 999999) {
    throw new Error("Die laufende Nummer muss zwischen 1 und 999999 liegen.");
  }
  return `${recordTypeDefinitions[type].prefix}-${String(sequence).padStart(6, "0")}`;
}

export function isFamilyRecordId(value: string, type?: FamilyRecordType): boolean {
  const prefixes = type
    ? [recordTypeDefinitions[type].prefix]
    : Object.values(recordTypeDefinitions).map((definition) => definition.prefix);
  return prefixes.some((prefix) => new RegExp(`^${prefix}-\\d{6}$`).test(value));
}

export function nextFamilyRecordId(
  type: FamilyRecordType,
  sequences: FamilyIdSequences,
): { id: string; sequences: FamilyIdSequences } {
  const next = (sequences[type] || 0) + 1;
  return { id: formatFamilyRecordId(type, next), sequences: { ...sequences, [type]: next } };
}

export function createFamilyRecord<T extends FamilyRecordType>(input: {
  id: string;
  recordType: T;
  status?: FamilyRecordStatus;
  source?: string | null;
  notes?: string | null;
  data: FamilyRecordPayloadMap[T];
  now?: string;
}): FamilyRecord<T> {
  const now = input.now || new Date().toISOString();
  return {
    id: input.id,
    recordType: input.recordType,
    createdAt: now,
    updatedAt: now,
    status: input.status || "aktiv",
    source: input.source ?? null,
    notes: input.notes ?? null,
    data: input.data,
  };
}
