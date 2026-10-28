import type { FamilyRecordType, FamilyRecordUnion } from "./family-data-model";
import { canonicalFamilyCategory, type FamilyCategory } from "./family-categories.ts";

export const FAMILY_ASSIGNMENT_VERSION = 1 as const;

export const assignmentSequence = [
  "document",
  "person",
  "area",
  "subarea",
  "object",
  "case",
  "organisation",
  "deadline",
  "task",
  "storage",
] as const;

export type AssignmentStage = (typeof assignmentSequence)[number];
export type AssignmentConfidence = "hoch" | "mittel" | "niedrig";
export type AssignmentDecision = "vorgeschlagen" | "auswahl_erforderlich" | "nicht_eindeutig" | "nicht_vorhanden";

export type AssignmentRecord = {
  id: string;
  recordType: FamilyRecordType;
  label: string;
  aliases?: string[];
  identifiers?: string[];
};

export type AssignmentDocumentReference = {
  id: string;
  originalName: string;
  documentDate?: string | null;
  identifiers?: string[];
};

export type AssignmentInput = {
  title: string;
  fileName?: string;
  documentType?: string;
  documentDate?: string | null;
  sourceName?: string;
  recipientName?: string;
  personHints?: string[];
  areaHint?: string;
  subareaHint?: string;
  objectHints?: string[];
  caseHints?: string[];
  organisationHints?: string[];
  identifiers?: string[];
  amount?: number;
  currency?: string;
  paid?: boolean;
  deadline?: string;
  deadlineType?: string;
  requiredAction?: string;
  contractNumber?: string;
  contractStart?: string;
  contractEnd?: string;
  cancellationDeadline?: string;
  purchaseDate?: string;
  warrantyEnd?: string;
  suggestedStorageRoot?: string;
  sensitive?: boolean;
};

export type AssignmentCandidate = {
  id: string;
  label: string;
  confidence: AssignmentConfidence;
  reasons: string[];
};

export type AssignmentStep = {
  stage: AssignmentStage;
  decision: AssignmentDecision;
  selectedId?: string;
  selectedLabel?: string;
  confidence: AssignmentConfidence;
  message: string;
  candidates: AssignmentCandidate[];
};

export type AssignmentProposal = {
  version: typeof FAMILY_ASSIGNMENT_VERSION;
  sequence: readonly AssignmentStage[];
  createdAt: string;
  steps: AssignmentStep[];
  duplicateWarnings: string[];
  deadlineProposal: null | { date: string; type: string; options: readonly ["übernehmen", "ändern", "ignorieren"] };
  taskProposal: null | { title: string; options: readonly ["Aufgabe übernehmen", "bearbeiten", "keine Aufgabe"] };
  paymentProposal: null | { amount: number; currency: string; status: "bezahlt" | "offen" | "nicht geklärt" };
  contractProposal: null | { number?: string; startsOn?: string; endsOn?: string; cancellationDeadline?: string };
  warrantyProposal: null | { purchaseDate?: string; expiresOn?: string };
  storageProposal: null | { path: string; suggestionOnly: true };
  protectedHealthArea: boolean;
  sensitiveReferenceOnly: boolean;
  requiresConfirmation: true;
  canApplyAutomatically: false;
  forbiddenAutomaticActions: readonly ["verschieben", "kopieren", "umbenennen", "löschen", "Datensätze zusammenführen"];
};

export type AssignmentContext = {
  records: AssignmentRecord[];
  documents?: AssignmentDocumentReference[];
  now?: string;
};

const areaAliases: Record<string, FamilyCategory> = {
  gesundheit: "Gesundheit & Pflege",
  krankheit: "Gesundheit & Pflege",
  medizin: "Gesundheit & Pflege",
  pflege: "Gesundheit & Pflege",
  arbeit: "Rente, Arbeit & Sozialversicherung",
  rente: "Rente, Arbeit & Sozialversicherung",
  sozialversicherung: "Rente, Arbeit & Sozialversicherung",
  familie: "Familie & persönliche Dokumente",
  person: "Familie & persönliche Dokumente",
  wohnen: "Haus & Wohnung",
  haushalt: "Haus & Wohnung",
  wohnung: "Haus & Wohnung",
  haus: "Haus & Wohnung",
  fahrzeug: "Auto & Mobilität",
  auto: "Auto & Mobilität",
  kfz: "Auto & Mobilität",
  motorrad: "Motorrad",
  kauf: "Einkäufe, Rechnungen & Garantien",
  rechnung: "Einkäufe, Rechnungen & Garantien",
  garantie: "Einkäufe, Rechnungen & Garantien",
  elektronik: "Technik, Geräte & Reparaturen",
  technik: "Technik, Geräte & Reparaturen",
  gerat: "Technik, Geräte & Reparaturen",
  reparatur: "Technik, Geräte & Reparaturen",
  dokument: "Archiv",
};

const normalize = (value: string) => value
  .toLocaleLowerCase("de")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/ß/g, "ss")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const tokens = (value: string) => new Set(normalize(value).split(" ").filter((part) => part.length > 1));
const unique = (values: Array<string | undefined>) => [...new Set(values.filter((value): value is string => !!value?.trim()).map((value) => value.trim()))];

function confidenceFor(score: number): AssignmentConfidence {
  if (score >= 90) return "hoch";
  if (score >= 55) return "mittel";
  return "niedrig";
}

function scoreRecord(record: AssignmentRecord, hints: string[], identifiers: string[]) {
  const reasons: string[] = [];
  let score = 0;
  const normalizedIdentifiers = identifiers.map(normalize);
  const recordIdentifiers = (record.identifiers || []).map(normalize);
  if (normalizedIdentifiers.some((value) => value && recordIdentifiers.includes(value))) {
    score += 100;
    reasons.push("eindeutige vorhandene Kennung");
  }
  const names = [record.label, ...(record.aliases || [])];
  for (const hint of hints) {
    const normalizedHint = normalize(hint);
    if (!normalizedHint) continue;
    if (names.some((name) => normalize(name) === normalizedHint)) {
      score += 90;
      reasons.push("Name oder Bezeichnung stimmt überein");
      continue;
    }
    const hintTokens = tokens(hint);
    const nameTokens = new Set(names.flatMap((name) => [...tokens(name)]));
    const shared = [...hintTokens].filter((part) => nameTokens.has(part)).length;
    if (shared) {
      score += Math.min(60, shared * 25);
      reasons.push("mehrere passende Begriffe");
    }
  }
  return { score, reasons: [...new Set(reasons)] };
}

function chooseExisting(
  stage: AssignmentStage,
  recordType: FamilyRecordType,
  records: AssignmentRecord[],
  hints: string[],
  identifiers: string[],
  emptyMessage: string,
): AssignmentStep {
  const candidates = records
    .filter((record) => record.recordType === recordType)
    .map((record) => ({ record, ...scoreRecord(record, hints, identifiers) }))
    .filter((item) => item.score >= 25)
    .sort((a, b) => b.score - a.score || a.record.label.localeCompare(b.record.label, "de"));
  const visible = candidates.slice(0, 5).map((item) => ({
    id: item.record.id,
    label: item.record.label,
    confidence: confidenceFor(item.score),
    reasons: item.reasons,
  }));
  if (!visible.length) return {
    stage,
    decision: hints.length ? "nicht_vorhanden" : "nicht_eindeutig",
    confidence: "niedrig",
    message: emptyMessage,
    candidates: [],
  };
  const top = candidates[0];
  const tied = candidates.length > 1 && candidates[1].score === top.score;
  if (tied || top.score < 55) return {
    stage,
    decision: "auswahl_erforderlich",
    confidence: confidenceFor(top.score),
    message: "Mehrere oder nicht ausreichend eindeutige Treffer – bitte selbst auswählen.",
    candidates: visible,
  };
  return {
    stage,
    decision: "vorgeschlagen",
    selectedId: top.record.id,
    selectedLabel: top.record.label,
    confidence: confidenceFor(top.score),
    message: "Vorhandenen Datensatz wiederverwenden; keinen zweiten Datensatz anlegen.",
    candidates: visible,
  };
}

function resolveArea(hint?: string) {
  if (!hint) return null;
  const canonical = canonicalFamilyCategory(hint);
  if (canonical.category) return canonical.category;
  const normalizedHint = normalize(hint);
  const alias = Object.entries(areaAliases).find(([key]) => normalizedHint.includes(key));
  return alias?.[1] || null;
}

function cleanPathPart(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").replace(/\s+/g, " ").trim().slice(0, 100);
}

function recordLabel(record: FamilyRecordUnion): string {
  const data = record.data as Record<string, unknown>;
  const value = data.displayName || data.name || data.title || data.fileName || data.contractNumber;
  return typeof value === "string" && value.trim() ? value : record.id;
}

export function familyRecordToAssignmentRecord(record: FamilyRecordUnion): AssignmentRecord {
  const data = record.data as Record<string, unknown>;
  const identifiers = [data.contractNumber, data.serialNumber, data.registrationNumber]
    .filter((value): value is string => typeof value === "string" && !!value.trim());
  return { id: record.id, recordType: record.recordType, label: recordLabel(record), identifiers };
}

export function proposeFamilyAssignment(input: AssignmentInput, context: AssignmentContext): AssignmentProposal {
  const identifiers = unique([...(input.identifiers || []), input.contractNumber]);
  const personHints = unique([...(input.personHints || []), input.recipientName]);
  const organisationHints = unique([...(input.organisationHints || []), input.sourceName]);
  const objectHints = unique(input.objectHints || []);
  const caseHints = unique(input.caseHints || []);
  const resolvedArea = resolveArea(input.areaHint);
  const protectedHealthArea = input.sensitive === true || resolvedArea === "Gesundheit & Pflege";

  const documentDuplicates = (context.documents || []).filter((document) => {
    const sameName = input.fileName && normalize(document.originalName) === normalize(input.fileName);
    const sameDate = !input.documentDate || !document.documentDate || input.documentDate === document.documentDate;
    const sharedIdentifier = identifiers.some((identifier) => (document.identifiers || []).map(normalize).includes(normalize(identifier)));
    return (sameName && sameDate) || sharedIdentifier;
  });

  const steps: AssignmentStep[] = [
    {
      stage: "document",
      decision: documentDuplicates.length ? "auswahl_erforderlich" : "vorgeschlagen",
      selectedLabel: input.fileName || input.title,
      confidence: documentDuplicates.length ? "mittel" : "hoch",
      message: documentDuplicates.length ? "Mögliche bereits erfasste Unterlage gefunden – bitte vor einer Neuanlage prüfen." : "Dokumentangaben für eine spätere bestätigte Zuordnung vorbereitet.",
      candidates: documentDuplicates.map((item) => ({ id: item.id, label: item.originalName, confidence: "hoch", reasons: ["gleicher Dateiname, gleiches Datum oder gleiche Kennung"] })),
    },
    chooseExisting("person", "person", context.records, personHints, identifiers, "Person noch nicht eindeutig zugeordnet"),
    {
      stage: "area",
      decision: resolvedArea ? "vorgeschlagen" : "nicht_eindeutig",
      selectedLabel: resolvedArea || undefined,
      confidence: resolvedArea ? "hoch" : "niedrig",
      message: resolvedArea ? "Vorhandenen Hauptbereich verwenden; keine neue Hauptkategorie erzeugen." : "Bereich noch nicht eindeutig zugeordnet.",
      candidates: [],
    },
    {
      stage: "subarea",
      decision: input.subareaHint ? "vorgeschlagen" : "nicht_eindeutig",
      selectedLabel: input.subareaHint,
      confidence: input.subareaHint ? "mittel" : "niedrig",
      message: input.subareaHint ? "Unterbereich als Vorschlag übernehmen und vor Verwendung prüfen." : "Unterbereich noch nicht eindeutig zugeordnet.",
      candidates: [],
    },
    chooseExisting("object", "object", context.records, objectHints, identifiers, objectHints.length ? "Kein passendes vorhandenes Objekt gefunden – Neuanlage nur nach Bestätigung." : "Kein Objekt erforderlich oder noch nicht eindeutig zugeordnet."),
    chooseExisting("case", "case", context.records, caseHints, identifiers, caseHints.length ? "Kein passender vorhandener Vorgang gefunden – „Neuen Vorgang anlegen?“ nur als Vorschlag anzeigen." : "Vorgang noch nicht eindeutig zugeordnet."),
    chooseExisting("organisation", "organisation", context.records, organisationHints, identifiers, organisationHints.length ? "Keine vorhandene Organisation eindeutig erkannt – Neuanlage nur nach Bestätigung." : "Organisation noch nicht eindeutig zugeordnet."),
  ];

  const deadlineDate = input.deadline || input.cancellationDeadline || input.warrantyEnd;
  const deadlineProposal = deadlineDate ? {
    date: deadlineDate,
    type: input.deadlineType || (input.cancellationDeadline ? "Kündigungsfrist" : input.warrantyEnd ? "Garantieende" : "Frist"),
    options: ["übernehmen", "ändern", "ignorieren"] as const,
  } : null;
  steps.push({
    stage: "deadline",
    decision: deadlineProposal ? "vorgeschlagen" : "nicht_vorhanden",
    selectedLabel: deadlineProposal ? `${deadlineProposal.type}: ${deadlineProposal.date}` : undefined,
    confidence: deadlineProposal ? "hoch" : "niedrig",
    message: deadlineProposal ? "Frist nur als Vorschlag anzeigen; FRIST-ID erst nach Bestätigung erzeugen." : "Keine ausdrücklich angegebene Frist erkannt.",
    candidates: [],
  });

  const taskProposal = input.requiredAction ? { title: input.requiredAction, options: ["Aufgabe übernehmen", "bearbeiten", "keine Aufgabe"] as const } : null;
  steps.push({
    stage: "task",
    decision: taskProposal ? "vorgeschlagen" : "nicht_vorhanden",
    selectedLabel: taskProposal?.title,
    confidence: taskProposal ? "hoch" : "niedrig",
    message: taskProposal ? "Aufgabe nur als Vorschlag anzeigen; TASK-ID erst nach Bestätigung erzeugen." : "Keine ausdrücklich erforderliche Handlung angegeben.",
    candidates: [],
  });

  const objectStep = steps.find((step) => step.stage === "object");
  const caseStep = steps.find((step) => step.stage === "case");
  const root = input.suggestedStorageRoot || "Familienakte";
  const pathParts = [root, resolvedArea, objectStep?.selectedLabel, caseStep?.selectedLabel, input.subareaHint]
    .filter((value): value is string => !!value)
    .map(cleanPathPart);
  const storageProposal = resolvedArea ? { path: pathParts.join("\\"), suggestionOnly: true as const } : null;
  steps.push({
    stage: "storage",
    decision: storageProposal ? "vorgeschlagen" : "nicht_eindeutig",
    selectedLabel: storageProposal?.path,
    confidence: storageProposal ? "mittel" : "niedrig",
    message: storageProposal ? "Nur Zielpfad vorschlagen; keine Datei verschieben, kopieren, umbenennen oder löschen." : "Speicherort kann erst nach eindeutiger Bereichszuordnung vorgeschlagen werden.",
    candidates: [],
  });

  return {
    version: FAMILY_ASSIGNMENT_VERSION,
    sequence: assignmentSequence,
    createdAt: context.now || new Date().toISOString(),
    steps,
    duplicateWarnings: documentDuplicates.map((item) => `Mögliche Dokumentdublette: ${item.originalName} (${item.id})`),
    deadlineProposal,
    taskProposal,
    paymentProposal: typeof input.amount === "number" ? { amount: input.amount, currency: input.currency || "EUR", status: input.paid === true ? "bezahlt" : input.paid === false ? "offen" : "nicht geklärt" } : null,
    contractProposal: input.contractNumber || input.contractStart || input.contractEnd || input.cancellationDeadline ? { number: input.contractNumber, startsOn: input.contractStart, endsOn: input.contractEnd, cancellationDeadline: input.cancellationDeadline } : null,
    warrantyProposal: input.purchaseDate || input.warrantyEnd ? { purchaseDate: input.purchaseDate, expiresOn: input.warrantyEnd } : null,
    storageProposal,
    protectedHealthArea,
    sensitiveReferenceOnly: protectedHealthArea,
    requiresConfirmation: true,
    canApplyAutomatically: false,
    forbiddenAutomaticActions: ["verschieben", "kopieren", "umbenennen", "löschen", "Datensätze zusammenführen"],
  };
}

export function assignmentProposalHasNoAutomaticWrites(proposal: AssignmentProposal) {
  return proposal.requiresConfirmation
    && !proposal.canApplyAutomatically
    && proposal.forbiddenAutomaticActions.length === 5
    && (proposal.storageProposal === null || proposal.storageProposal.suggestionOnly);
}
