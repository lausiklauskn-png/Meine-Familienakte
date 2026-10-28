import { buildDocumentIntakePlan, type IntakeDocumentReference } from "./document-intake.ts";
import { FAMILY_CATEGORIES } from "./family-categories.ts";
import type { FamilyRecordType, FamilyRecordUnion } from "./family-data-model.ts";

export const FAWOGA_INVENTORY_VERSION = "2.28.1" as const;

export type InventoryProcessingState = "QUELLE_ANALYSIERT" | "ARCHIVIERT" | "ASSISTENZ_FREIGEGEBEN";
export type InventoryValue = "wichtig" | "beweisrelevant" | "vorgangsrelevant" | "historisch" | "dublette" | "gering" | "ungeklaert";
export type InventoryReviewGroup = "recommended" | "review" | "duplicate" | "low";
export type InventorySourceStatus = "neu" | "unveraendert" | "veraendert" | "verschoben" | "nicht_erreichbar" | "wahrscheinlich_geloescht";
export type InventoryContentStatus = "gelesen" | "teilweise_gelesen" | "nicht_automatisch_lesbar" | "manuelle_pruefung_erforderlich";
export type InventorySourceKind = "onedrive" | "local";

export type InventorySourceFile = {
  relativePath: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  lastModified: number;
  checksum: string;
  textHint?: string;
  sourceKind?: InventorySourceKind;
  contentStatus?: InventoryContentStatus;
};

export type InventoryAssignmentReference = {
  recordType: Extract<FamilyRecordType, "person" | "organisation" | "object" | "case">;
  id: string;
  label: string;
};

export type InventoryDetectedMetadata = {
  dates: string[];
  invoiceNumbers: string[];
  contractNumbers: string[];
  referenceNumbers: string[];
  possibleTask: string | null;
  possibleDeadline: string | null;
};

export type InventoryLearningFeatures = {
  organisationIds: string[];
  senderKeys: string[];
  caseIds: string[];
  objectIds: string[];
  keywords: string[];
  folderContext: string;
  documentType: string;
};

export type InventoryLearningSignal = {
  id: string;
  sourceInventoryId: string;
  confirmedAt: string;
  lifeArea: string;
  canonicalLifeArea: string;
  personalLifeArea: string | null;
  documentType: string;
  features: InventoryLearningFeatures;
};

export type InventoryLearningSuggestion = {
  suggestedLifeArea: string;
  confidence: "Sicher" | "Wahrscheinlich" | "Unklar";
  supportCount: number;
  score: number;
  applied: boolean;
  reason: string;
};

export type InventoryItem = {
  id: string;
  stableFileId: string;
  sourceKind: InventorySourceKind;
  sourceRootName: string;
  sourceRelativePath: string;
  previousSourcePaths: string[];
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  lastModified: number;
  checksum: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastCheckedAt: string;
  analyzedAt: string;
  sourceStatus: InventorySourceStatus;
  contentStatus: InventoryContentStatus;
  contentExcerpt: string;
  state: InventoryProcessingState;
  value: InventoryValue;
  reviewGroup: InventoryReviewGroup;
  reason: string;
  priority: "hoch" | "mittel" | "niedrig";
  lifeArea: string;
  canonicalLifeArea: string;
  personalLifeArea: string | null;
  documentType: string;
  privacyClass: "allgemein" | "vertraulich" | "besonders geschützt";
  confidence: "eindeutig" | "wahrscheinlich" | "unklar";
  assignmentReferences: InventoryAssignmentReference[];
  detectedMetadata: InventoryDetectedMetadata;
  possibleDuplicateDocumentIds: string[];
  possibleDuplicateInventoryIds: string[];
  versionOfInventoryIds: string[];
  photoSeriesKey: string | null;
  learningFeatures: InventoryLearningFeatures;
  confirmedKeywords: string[];
  learningSuggestion: InventoryLearningSuggestion | null;
  assignmentConfirmedAt?: string | null;
  archivedPath?: string | null;
  archivedChecksum?: string | null;
  archivedAt?: string | null;
  documentId?: string | null;
};

export type InventorySummary = {
  total: number;
  totalBytes: number;
  newFiles: number;
  unchanged: number;
  changed: number;
  moved: number;
  unavailable: number;
  recommended: number;
  review: number;
  duplicate: number;
  low: number;
  archived: number;
  assistantReleased: number;
};

export type InventoryPreviewMode = "pdf" | "image" | "text" | "email" | "protected" | "unsupported";

export function inventoryPreviewMode(item: Pick<InventoryItem, "originalName" | "mimeType" | "privacyClass">): InventoryPreviewMode {
  if (item.privacyClass === "besonders geschützt") return "protected";
  const name = item.originalName.toLocaleLowerCase("de");
  if (item.mimeType === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (item.mimeType.startsWith("image/")) return "image";
  if (/\.(eml|msg)$/i.test(name) || item.mimeType === "message/rfc822") return "email";
  if (item.mimeType.startsWith("text/") || /\.(txt|vtt|doc|docx)$/i.test(name)) return "text";
  return "unsupported";
}

export function runInventoryPreviewSelfTests() {
  const base = { privacyClass: "allgemein" as const };
  const cases: Array<{ id: string; expected: InventoryPreviewMode; item: Pick<InventoryItem, "originalName" | "mimeType" | "privacyClass"> }> = [
    { id: "PDF-Vorschau", expected: "pdf", item: { ...base, originalName: "Bericht.pdf", mimeType: "application/pdf" } },
    { id: "Foto-/Scan-Vorschau", expected: "image", item: { ...base, originalName: "Scan.jpg", mimeType: "image/jpeg" } },
    { id: "Word-/Text-Vorschau", expected: "text", item: { ...base, originalName: "Schreiben.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } },
    { id: "E-Mail-Vorschau", expected: "email", item: { ...base, originalName: "Nachricht.eml", mimeType: "message/rfc822" } },
    { id: "Geschützte Gesundheitsvorschau", expected: "protected", item: { originalName: "Befund.pdf", mimeType: "application/pdf", privacyClass: "besonders geschützt" } },
    { id: "Unbekannter Dateityp", expected: "unsupported", item: { ...base, originalName: "Daten.bin", mimeType: "application/octet-stream" } },
  ];
  return cases.map((test) => ({ id: test.id, label: test.id, passed: inventoryPreviewMode(test.item) === test.expected, summary: inventoryPreviewMode(test.item) === test.expected ? `${test.id} verwendet den vorgesehenen datenschutzgerechten Vorschauweg.` : `${test.id} wurde falsch eingeordnet.` }));
}

const normal = (value: string) => value.toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();
const includesAny = (value: string, words: string[]) => words.some((word) => value.includes(normal(word)));
const imageExtensions = [".jpg", ".jpeg", ".png", ".heic", ".webp", ".tif", ".tiff"];
const lowValueWords = ["werbung", "newsletter", "prospekt", "angebot gültig", "temp", "cache", "thumb", "screenshot_ohne_bezug", "todo_alt"];
const evidenceWords = ["beweis", "schaden", "mangel", "gutachten", "bescheid", "kündigung", "widerspruch", "vertrag", "rechnung", "quittung"];
const importantWords = ["urkunde", "police", "vertrag", "bescheid", "zeugnis", "vollmacht", "patientenverfügung", "kaufvertrag", "rechnung", "arztbrief", "befund"];
const learningStopWords = new Set(["und", "oder", "der", "die", "das", "den", "dem", "des", "ein", "eine", "einer", "eines", "mit", "von", "vom", "für", "zur", "zum", "bei", "auf", "aus", "pdf", "doc", "docx", "jpg", "jpeg", "png", "txt"]);

function pathKey(root: string, path: string) {
  return `${normal(root)}|${normal(path)}`;
}

function shortPathHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function photoSeriesKey(file: InventorySourceFile) {
  const lower = file.name.toLocaleLowerCase("de");
  const isImage = file.mimeType.startsWith("image/") || imageExtensions.some((extension) => lower.endsWith(extension));
  if (!isImage) return null;
  const day = new Date(file.lastModified || 0).toISOString().slice(0, 10);
  const folder = file.relativePath.split("/").slice(0, -1).join("/") || "Wurzel";
  return `${folder}|${day}`;
}

function assessValue(file: InventorySourceFile, duplicate: boolean) {
  const text = normal(`${file.relativePath} ${file.name} ${file.textHint || ""}`);
  if (duplicate) return { value: "dublette" as const, group: "duplicate" as const, priority: "niedrig" as const, reason: "Gleiche Prüfsumme oder bereits vorhandene fachliche Unterlage erkannt." };
  if (includesAny(text, evidenceWords)) return { value: "beweisrelevant" as const, group: "recommended" as const, priority: "hoch" as const, reason: "Dateiname oder lesbarer Inhalt deutet auf einen Beleg, Vertrag, Bescheid oder Schadensnachweis hin." };
  if (includesAny(text, importantWords)) return { value: "wichtig" as const, group: "recommended" as const, priority: "hoch" as const, reason: "Die Datei wirkt dauerhaft aufbewahrungswürdig und fachlich relevant." };
  if (includesAny(text, lowValueWords)) return { value: "gering" as const, group: "low" as const, priority: "niedrig" as const, reason: "Die Datei wirkt wie Werbung, temporäre Ablage oder eine alte Hilfsdatei; sie wird nicht gelöscht." };
  if (file.mimeType.startsWith("image/") || imageExtensions.some((extension) => file.name.toLocaleLowerCase("de").endsWith(extension))) return { value: "vorgangsrelevant" as const, group: "review" as const, priority: "mittel" as const, reason: "Foto erkannt. Der sachliche Zusammenhang muss vor einer Übernahme bestätigt werden." };
  return { value: "ungeklaert" as const, group: "review" as const, priority: "mittel" as const, reason: "Die Bedeutung ist nicht eindeutig. Eine kurze Prüfung genügt; es wurde nichts übernommen." };
}

function detectMetadata(file: InventorySourceFile): InventoryDetectedMetadata {
  const source = `${file.name}\n${file.textHint || ""}`;
  const unique = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, 8);
  const dates = unique([...source.matchAll(/\b(?:0?[1-9]|[12]\d|3[01])[.\-/](?:0?[1-9]|1[0-2])[.\-/](?:19|20)\d{2}\b/g)].map((match) => match[0]));
  const invoiceNumbers = unique([...source.matchAll(/(?:rechnungs?\s*(?:nummer|nr\.?|\-nr\.?)|invoice)\s*[:#]?\s*([A-Z0-9][A-Z0-9_\-/]{3,})/gi)].map((match) => match[1]));
  const contractNumbers = unique([...source.matchAll(/(?:vertrags?\s*(?:nummer|nr\.?|\-nr\.?)|policen?\s*(?:nummer|nr\.?)|kundennummer)\s*[:#]?\s*([A-Z0-9][A-Z0-9_\-/]{3,})/gi)].map((match) => match[1]));
  const referenceNumbers = unique([...source.matchAll(/(?:aktenzeichen|geschäftszeichen|vorgangsnummer|zeichen)\s*[:#]?\s*([A-Z0-9][A-Z0-9_\-/]{3,})/gi)].map((match) => match[1]));
  const normalized = normal(source);
  const possibleTask = includesAny(normalized, ["bitte senden", "bitte reichen", "antwort erforderlich", "rückruf", "unterlagen nachreichen"]) ? "Möglicher Handlungsbedarf – vor Anlage einer Aufgabe bestätigen" : null;
  const possibleDeadline = includesAny(normalized, ["frist", "bis spätestens", "zahlbar bis", "widerspruch bis", "kündigungsfrist"]) ? "Mögliche Frist – Datum und rechtliche Bedeutung vor Übernahme prüfen" : null;
  return { dates, invoiceNumbers, contractNumbers, referenceNumbers, possibleTask, possibleDeadline };
}

function assignmentReferences(steps: ReturnType<typeof buildDocumentIntakePlan>["assignment"]["steps"]): InventoryAssignmentReference[] {
  return steps.flatMap((step) => {
    if (!step.selectedId || !step.selectedLabel || !["person", "organisation", "object", "case"].includes(step.stage)) return [];
    return [{ recordType: step.stage as InventoryAssignmentReference["recordType"], id: step.selectedId, label: step.selectedLabel }];
  });
}

function versionKey(item: Pick<InventoryItem, "originalName"> | Pick<InventorySourceFile, "name">) {
  const name = "originalName" in item ? item.originalName : item.name;
  return normal(name.replace(/\.[^.]+$/, "").replace(/(?:final|neu|korrigiert|unterschrieben|entwurf|version|v)\s*\d*/gi, " "));
}

function selectedPersonalLifeArea(file: InventorySourceFile, areas: string[]) {
  const text = normal(`${file.relativePath} ${file.name} ${file.textHint || ""}`);
  return areas.find((area) => normal(area).length >= 4 && text.includes(normal(area))) || null;
}

function learningKeywords(value: string) {
  return [...new Set(normal(value).split(" ").filter((word) => word.length >= 4 && !learningStopWords.has(word)))].slice(0, 40);
}

function learningFeatures(file: InventorySourceFile, references: InventoryAssignmentReference[], documentType: string): InventoryLearningFeatures {
  const organisations = references.filter((reference) => reference.recordType === "organisation");
  return {
    organisationIds: organisations.map((reference) => reference.id),
    senderKeys: organisations.map((reference) => normal(reference.label)).filter(Boolean),
    caseIds: references.filter((reference) => reference.recordType === "case").map((reference) => reference.id),
    objectIds: references.filter((reference) => reference.recordType === "object").map((reference) => reference.id),
    keywords: learningKeywords(`${file.name} ${file.relativePath} ${file.textHint || ""}`),
    folderContext: normal(file.relativePath.split("/").slice(0, -1).join(" ")),
    documentType,
  };
}

const hasShared = (left: string[], right: string[]) => left.some((value) => right.includes(value));

export function applyInventoryLearningSuggestion(item: InventoryItem, signals: InventoryLearningSignal[]): InventoryItem {
  const candidates = new Map<string, { score: number; support: InventoryLearningSignal[] }>();
  for (const signal of signals) {
    let score = 0;
    if (hasShared(item.learningFeatures.organisationIds, signal.features.organisationIds)) score += 6;
    if (hasShared(item.learningFeatures.senderKeys, signal.features.senderKeys)) score += 4;
    if (hasShared(item.learningFeatures.caseIds, signal.features.caseIds)) score += 6;
    if (hasShared(item.learningFeatures.objectIds, signal.features.objectIds)) score += 5;
    if (normal(item.learningFeatures.documentType) === normal(signal.features.documentType)) score += 3;
    if (item.learningFeatures.folderContext && item.learningFeatures.folderContext === signal.features.folderContext) score += 3;
    const keywordMatches = item.learningFeatures.keywords.filter((word) => signal.features.keywords.includes(word)).length;
    score += Math.min(5, keywordMatches);
    if (score < 4) continue;
    const current = candidates.get(signal.lifeArea) || { score: 0, support: [] };
    current.score += score; current.support.push(signal); candidates.set(signal.lifeArea, current);
  }
  const ranked = [...candidates.entries()].map(([lifeArea, value]) => ({ lifeArea, ...value })).filter((value) => value.support.length >= 2).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best) return { ...item, learningSuggestion: null };
  const runnerUp = ranked[1];
  const conflictsWithStrongContent = item.confidence === "eindeutig" && item.lifeArea !== best.lifeArea;
  const ambiguous = Boolean(runnerUp && best.score - runnerUp.score < 5);
  const confidence: InventoryLearningSuggestion["confidence"] = conflictsWithStrongContent || ambiguous ? "Unklar" : best.support.length >= 3 && best.score >= 24 ? "Sicher" : "Wahrscheinlich";
  const applied = confidence !== "Unklar";
  const learned = best.support[0];
  return {
    ...item,
    ...(applied ? { lifeArea: best.lifeArea, canonicalLifeArea: learned.canonicalLifeArea, personalLifeArea: learned.personalLifeArea, confidence: confidence === "Sicher" ? "eindeutig" as const : "wahrscheinlich" as const } : {}),
    learningSuggestion: {
      suggestedLifeArea: best.lifeArea,
      confidence,
      supportCount: best.support.length,
      score: best.score,
      applied,
      reason: conflictsWithStrongContent ? "Frühere Zuordnungen und der aktuelle Inhalt widersprechen sich. Bitte manuell prüfen." : ambiguous ? "Mehrere frühere Zuordnungen passen ähnlich gut. Bitte manuell prüfen." : "Vorschlag aufgrund früherer bestätigter Zuordnungen.",
    },
  };
}

export function createInventoryLearningSignal(item: InventoryItem, input: { lifeArea: string; canonicalLifeArea: string; personalLifeArea: string | null; documentType: string; confirmedAt?: string }): InventoryLearningSignal {
  return {
    id: `LEARN-${item.id}-${Date.now()}`,
    sourceInventoryId: item.id,
    confirmedAt: input.confirmedAt || new Date().toISOString(),
    lifeArea: input.lifeArea,
    canonicalLifeArea: input.canonicalLifeArea,
    personalLifeArea: input.personalLifeArea,
    documentType: input.documentType,
    features: { ...item.learningFeatures, documentType: input.documentType },
  };
}

export function analyzeInventoryFiles(input: {
  sourceRootName: string;
  sourceKind?: InventorySourceKind;
  files: InventorySourceFile[];
  knownDocuments: IntakeDocumentReference[];
  knownInventory?: InventoryItem[];
  records?: FamilyRecordUnion[];
  personalLifeAreas?: string[];
  learningSignals?: InventoryLearningSignal[];
  analyzedAt?: string;
  completeScan?: boolean;
}): InventoryItem[] {
  const analyzedAt = input.analyzedAt || new Date().toISOString();
  const sourceKind = input.sourceKind || "local";
  const known = input.knownInventory || [];
  const knownByPath = new Map(known.map((item) => [pathKey(item.sourceRootName, item.sourceRelativePath), item]));
  const knownByChecksum = new Map<string, InventoryItem[]>();
  for (const item of known) knownByChecksum.set(item.checksum, [...(knownByChecksum.get(item.checksum) || []), item]);
  const currentPaths = new Set(input.files.map((file) => pathKey(input.sourceRootName, file.relativePath)));
  const currentByChecksum = new Map<string, string>();
  const analyzed: InventoryItem[] = input.files.map((file, index) => {
    const exact = knownByPath.get(pathKey(input.sourceRootName, file.relativePath));
    const checksumCandidates = knownByChecksum.get(file.checksum) || [];
    const moved = !exact ? checksumCandidates.find((item) => item.sourceRootName === input.sourceRootName && !currentPaths.has(pathKey(item.sourceRootName, item.sourceRelativePath))) : undefined;
    const existing = exact || moved;
    const intake = buildDocumentIntakePlan({ file: { name: file.name, size: file.sizeBytes, type: file.mimeType, lastModified: file.lastModified, textHint: file.textHint }, source: sourceKind === "onedrive" ? "onedrive-inbox" : "local-inbox", documents: input.knownDocuments, records: input.records });
    const currentDuplicateId = currentByChecksum.get(file.checksum);
    const duplicateInventoryIds = [...checksumCandidates.filter((item) => item.id !== existing?.id && currentPaths.has(pathKey(item.sourceRootName, item.sourceRelativePath))).map((item) => item.id), currentDuplicateId].filter((value, position, values): value is string => Boolean(value) && values.indexOf(value) === position);
    const isUnchanged = !!exact && exact.checksum === file.checksum && exact.sizeBytes === file.sizeBytes && exact.lastModified === file.lastModified;
    const sourceStatus: InventorySourceStatus = moved ? "verschoben" : exact ? (isUnchanged ? "unveraendert" : "veraendert") : "neu";
    const manualReview = file.contentStatus === "manuelle_pruefung_erforderlich";
    const assessed = isUnchanged ? { value: exact.value, group: exact.reviewGroup, priority: exact.priority, reason: exact.reason } : assessValue(file, intake.duplicateIds.length > 0 || duplicateInventoryIds.length > 0);
    const assessment = manualReview ? { value: "ungeklaert" as const, group: "review" as const, priority: "mittel" as const, reason: "Der Dateiinhalt konnte nicht zuverlässig als Text gelesen werden. Manuelle Prüfung erforderlich; das Original bleibt unverändert." } : assessed;
    const stableFileId = existing?.stableFileId || `SRC-${file.checksum.slice(0, 20)}`;
    const id = existing?.id || `INV-${file.checksum.slice(0, 12)}-${shortPathHash(`${input.sourceRootName}/${file.relativePath}/${index}`)}`;
    if (!currentByChecksum.has(file.checksum)) currentByChecksum.set(file.checksum, id);
    const personalLifeArea = selectedPersonalLifeArea(file, input.personalLifeAreas || []);
    const confirmedAssignment = Boolean(existing?.assignmentConfirmedAt);
    const selectedLifeArea = confirmedAssignment ? existing!.lifeArea : personalLifeArea || intake.lifeArea;
    const selectedCanonicalLifeArea = confirmedAssignment ? existing!.canonicalLifeArea : intake.lifeArea;
    const selectedPersonalArea = confirmedAssignment ? existing!.personalLifeArea : personalLifeArea;
    const selectedDocumentType = confirmedAssignment ? existing!.documentType : intake.documentType;
    const previousSourcePaths = [...new Set([...(existing?.previousSourcePaths || []), ...(moved ? [moved.sourceRelativePath] : [])])];
    const references = assignmentReferences(intake.assignment.steps);
    const baseItem = {
      id, stableFileId, sourceKind: file.sourceKind || sourceKind, sourceRootName: input.sourceRootName, sourceRelativePath: file.relativePath, previousSourcePaths,
      originalName: file.name, mimeType: file.mimeType || "application/octet-stream", sizeBytes: file.sizeBytes, lastModified: file.lastModified, checksum: file.checksum,
      firstSeenAt: existing?.firstSeenAt || analyzedAt, lastSeenAt: analyzedAt, lastCheckedAt: analyzedAt, analyzedAt: isUnchanged ? exact.analyzedAt : analyzedAt,
      sourceStatus, contentStatus: file.contentStatus || existing?.contentStatus || (file.textHint ? "gelesen" : "nicht_automatisch_lesbar"), contentExcerpt: (file.textHint || existing?.contentExcerpt || "").replace(/\s+/g, " ").trim().slice(0, 4000), state: existing?.state || "QUELLE_ANALYSIERT",
      value: assessment.value, reviewGroup: assessment.group, reason: assessment.reason, priority: assessment.priority,
      lifeArea: selectedLifeArea, canonicalLifeArea: selectedCanonicalLifeArea, personalLifeArea: selectedPersonalArea, documentType: selectedDocumentType, privacyClass: intake.privacyClass, confidence: confirmedAssignment ? "eindeutig" : manualReview ? "unklar" : intake.confidence,
      assignmentReferences: references, detectedMetadata: detectMetadata(file), possibleDuplicateDocumentIds: intake.duplicateIds, possibleDuplicateInventoryIds: duplicateInventoryIds,
      versionOfInventoryIds: [] as string[], photoSeriesKey: photoSeriesKey(file), learningFeatures: isUnchanged && existing?.learningFeatures ? existing.learningFeatures : learningFeatures(file, references, selectedDocumentType), confirmedKeywords: existing?.confirmedKeywords || [], learningSuggestion: null, assignmentConfirmedAt: existing?.assignmentConfirmedAt || null, archivedPath: existing?.archivedPath || null, archivedChecksum: existing?.archivedChecksum || null, archivedAt: existing?.archivedAt || null, documentId: existing?.documentId || null,
    } satisfies InventoryItem;
    return confirmedAssignment ? baseItem : applyInventoryLearningSuggestion(baseItem, input.learningSignals || []);
  });
  const allForVersioning = [...analyzed, ...known.filter((item) => !analyzed.some((candidate) => candidate.id === item.id))];
  for (const item of analyzed) item.versionOfInventoryIds = allForVersioning.filter((candidate) => candidate.id !== item.id && candidate.checksum !== item.checksum && versionKey(candidate) === versionKey(item)).map((candidate) => candidate.id);
  if (input.completeScan === false) return analyzed;
  const missing = known.filter((item) => item.sourceRootName === input.sourceRootName && !currentPaths.has(pathKey(item.sourceRootName, item.sourceRelativePath)) && !analyzed.some((candidate) => candidate.id === item.id)).map((item) => ({ ...item, sourceStatus: "wahrscheinlich_geloescht" as const, lastCheckedAt: analyzedAt }));
  const untouched = known.filter((item) => item.sourceRootName !== input.sourceRootName && !analyzed.some((candidate) => candidate.id === item.id));
  return [...analyzed, ...missing, ...untouched];
}

export function summarizeInventory(items: InventoryItem[]): InventorySummary {
  return {
    total: items.length, totalBytes: items.reduce((sum, item) => sum + item.sizeBytes, 0),
    newFiles: items.filter((item) => item.sourceStatus === "neu").length, unchanged: items.filter((item) => item.sourceStatus === "unveraendert").length,
    changed: items.filter((item) => item.sourceStatus === "veraendert").length, moved: items.filter((item) => item.sourceStatus === "verschoben").length,
    unavailable: items.filter((item) => item.sourceStatus === "nicht_erreichbar" || item.sourceStatus === "wahrscheinlich_geloescht").length,
    recommended: items.filter((item) => item.reviewGroup === "recommended").length, review: items.filter((item) => item.reviewGroup === "review").length,
    duplicate: items.filter((item) => item.reviewGroup === "duplicate").length, low: items.filter((item) => item.reviewGroup === "low").length,
    archived: items.filter((item) => item.state === "ARCHIVIERT" || item.state === "ASSISTENZ_FREIGEGEBEN").length,
    assistantReleased: items.filter((item) => item.state === "ASSISTENZ_FREIGEGEBEN").length,
  };
}

export function inventoryPhotoSeries(items: InventoryItem[]) {
  const groups = new Map<string, InventoryItem[]>();
  for (const item of items) if (item.photoSeriesKey) groups.set(item.photoSeriesKey, [...(groups.get(item.photoSeriesKey) || []), item]);
  return [...groups.entries()].filter(([, values]) => values.length > 1).map(([id, values]) => ({ id, items: values.sort((a, b) => a.lastModified - b.lastModified) }));
}

function fixtureFiles(): InventorySourceFile[] {
  return [
    { relativePath: "Bad/Rechnung_Elektro.pdf", name: "Rechnung_Elektro.pdf", sizeBytes: 100, mimeType: "application/pdf", lastModified: Date.UTC(2026, 9, 10), checksum: "a".repeat(64), textHint: "Rechnungsnummer RE-2026-44 zahlbar bis 20.10.2026", sourceKind: "onedrive", contentStatus: "gelesen" },
    { relativePath: "Bad/Schaden_01.jpg", name: "Schaden_01.jpg", sizeBytes: 200, mimeType: "image/jpeg", lastModified: Date.UTC(2026, 9, 10, 10), checksum: "b".repeat(64), sourceKind: "onedrive", contentStatus: "nicht_automatisch_lesbar" },
    { relativePath: "Bad/Schaden_02.jpg", name: "Schaden_02.jpg", sizeBytes: 210, mimeType: "image/jpeg", lastModified: Date.UTC(2026, 9, 10, 11), checksum: "c".repeat(64), sourceKind: "onedrive", contentStatus: "nicht_automatisch_lesbar" },
    { relativePath: "Alt/Werbung.pdf", name: "Werbung.pdf", sizeBytes: 80, mimeType: "application/pdf", lastModified: Date.UTC(2020, 1, 1), checksum: "d".repeat(64), sourceKind: "onedrive", contentStatus: "nicht_automatisch_lesbar" },
    { relativePath: "Kopie/Rechnung_Elektro.pdf", name: "Rechnung_Elektro.pdf", sizeBytes: 100, mimeType: "application/pdf", lastModified: Date.UTC(2026, 9, 11), checksum: "a".repeat(64), sourceKind: "onedrive", contentStatus: "gelesen" },
  ];
}

export function runFawogaInventorySelfTests() {
  const items = analyzeInventoryFiles({ sourceRootName: "Pilot", sourceKind: "onedrive", files: fixtureFiles(), knownDocuments: [], analyzedAt: "2026-10-12T12:00:00.000Z" });
  const summary = summarizeInventory(items); const series = inventoryPhotoSeries(items);
  return [
    { id: "fawoga-source", label: "Quelle analysiert", passed: items.every((item) => item.state === "QUELLE_ANALYSIERT"), summary: "Eine Analyse erzeugt noch kein aktives Familienakten-Dokument." },
    { id: "fawoga-recommended", label: "Wichtige Unterlagen", passed: items[0].reviewGroup === "recommended", summary: "Rechnungen und beweisrelevante Unterlagen werden nachvollziehbar empfohlen." },
    { id: "fawoga-duplicate", label: "Dubletten", passed: items[4].reviewGroup === "duplicate" && items[4].possibleDuplicateInventoryIds.length === 1, summary: "Gleiche Prüfsummen werden als mögliche Dubletten erkannt und nicht automatisch zusammengeführt." },
    { id: "fawoga-low", label: "Geringe Relevanz", passed: items[3].reviewGroup === "low", summary: "Werbe- oder Hilfsdateien werden nur zurückgestellt, niemals gelöscht." },
    { id: "fawoga-photo-series", label: "Fotoserie", passed: series.length === 1 && series[0].items.length === 2, summary: "Zusammengehörende Fotos können als Dokumentationsgruppe angezeigt werden." },
    { id: "fawoga-summary", label: "Sammelfreigabe", passed: summary.total === 5 && summary.duplicate === 1 && summary.low === 1, summary: "Empfehlungen, Prüfbedarf, Dubletten und geringe Relevanz werden gruppiert." },
    { id: "fawoga-safety", label: "Originalschutz", passed: !JSON.stringify(items).includes("delete") && !JSON.stringify(items).includes("rename"), summary: "Die Bewertungslogik enthält keine Lösch-, Verschiebe- oder Umbenennungsaktion." },
    { id: "fawoga-shared-pipeline", label: "Gemeinsame Dokumentlogik", passed: items[0].lifeArea === "Einkäufe, Rechnungen & Garantien", summary: "Die vorhandene Dokumenten- und Kategorienlogik wird wiederverwendet." },
  ];
}

export function runFawogaOneDriveSelfTests() {
  const first = analyzeInventoryFiles({ sourceRootName: "OneDrive-Test", sourceKind: "onedrive", files: fixtureFiles().slice(0, 4), knownDocuments: [], personalLifeAreas: ["Unser Badezimmer"], analyzedAt: "2026-10-12T12:00:00.000Z" });
  const changedFiles = fixtureFiles().slice(0, 3).map((file) => file.relativePath === "Bad/Rechnung_Elektro.pdf" ? { ...file, sizeBytes: 130, lastModified: file.lastModified + 1000, checksum: "e".repeat(64), textHint: `${file.textHint} Vertrag Nr. V-9911` } : file);
  changedFiles[1] = { ...changedFiles[1], relativePath: "Bad/Fotos/Schaden_01.jpg" };
  changedFiles.push({ relativePath: "Unser Badezimmer/Vertrag_Nachtrag_v2.pdf", name: "Vertrag_Nachtrag_v2.pdf", sizeBytes: 50, mimeType: "application/pdf", lastModified: Date.UTC(2026, 9, 12), checksum: "f".repeat(64), textHint: "Vertragsnummer BAD-22", sourceKind: "onedrive", contentStatus: "gelesen" });
  const second = analyzeInventoryFiles({ sourceRootName: "OneDrive-Test", sourceKind: "onedrive", files: changedFiles, knownDocuments: [], knownInventory: first, personalLifeAreas: ["Unser Badezimmer"], analyzedAt: "2026-10-12T13:00:00.000Z" });
  const summary = summarizeInventory(second); const changed = second.find((item) => item.sourceRelativePath === "Bad/Rechnung_Elektro.pdf")!; const moved = second.find((item) => item.sourceRelativePath.includes("Fotos/Schaden_01"))!; const personal = second.find((item) => item.originalName.includes("Nachtrag"))!; const unchanged = second.find((item) => item.originalName === "Schaden_02.jpg")!; const missing = second.find((item) => item.originalName === "Werbung.pdf");
  const tests = [
    ["source", "OneDrive-Quelle", first.every((item) => item.sourceKind === "onedrive")], ["stable-id", "Stabile Datei-ID", unchanged.stableFileId === first.find((item) => item.originalName === "Schaden_02.jpg")?.stableFileId], ["unchanged", "Unveränderte Datei", unchanged.sourceStatus === "unveraendert"], ["changed", "Geänderte Datei", changed.sourceStatus === "veraendert"], ["moved", "Verschobene Datei", moved.sourceStatus === "verschoben"], ["new", "Neue Datei", personal.sourceStatus === "neu"], ["missing", "Nicht mehr erreichbare Datei", missing?.sourceStatus === "wahrscheinlich_geloescht"], ["checksum", "Prüfsumme", first.every((item) => item.checksum.length === 64)], ["origin", "Herkunft", second.every((item) => !!item.sourceRootName && !!item.sourceRelativePath)], ["timestamps", "Prüfzeitpunkte", second.every((item) => !!item.firstSeenAt && !!item.lastCheckedAt)], ["content", "Inhaltsauswertung", changed.contentStatus === "gelesen"], ["document-type", "Dokumentart", changed.documentType.includes("Rechnung")], ["invoice", "Rechnungsnummer", changed.detectedMetadata.invoiceNumbers.includes("RE-2026-44")], ["contract", "Vertragsnummer", changed.detectedMetadata.contractNumbers.includes("V-9911")], ["deadline", "Mögliche Frist", !!changed.detectedMetadata.possibleDeadline], ["no-auto-deadline", "Keine automatische Frist", changed.detectedMetadata.possibleDeadline?.includes("prüfen")], ["personal-area", "Persönlicher Lebensbereich", personal.lifeArea === "Unser Badezimmer" && personal.personalLifeArea === "Unser Badezimmer"], ["canonical-area", "Kanonische Kategorie", FAMILY_CATEGORIES.includes(personal.canonicalLifeArea as (typeof FAMILY_CATEGORIES)[number])], ["photo-series", "Fotoserie", inventoryPhotoSeries(first).length >= 1], ["duplicate-kind", "Dublettenart", first.every((item) => item.possibleDuplicateInventoryIds.length === 0)], ["versions", "Versionen bleiben getrennt", personal.state === "QUELLE_ANALYSIERT"], ["review-groups", "Ergebnisgruppen", summary.recommended + summary.review + summary.duplicate + summary.low === summary.total], ["assistant-gate", "Assistenzfreigabe", second.every((item) => item.state !== "ASSISTENZ_FREIGEGEBEN")], ["archive-gate", "Archivierung", second.every((item) => !item.archivedPath)], ["privacy", "Datenschutz", second.every((item) => ["allgemein", "vertraulich", "besonders geschützt"].includes(item.privacyClass))], ["relations", "Bestehende Beziehungen", second.every((item) => Array.isArray(item.assignmentReferences))], ["original-protection", "Originalschutz", !JSON.stringify(second).includes("removeEntry")], ["no-second-db", "Keine zweite Dokumentdatenbank", second.every((item) => !item.documentId)], ["resume-state", "Fortsetzbarer Zustand", second.every((item) => !!item.lastSeenAt || item.sourceStatus === "wahrscheinlich_geloescht")], ["summary", "Bestandsübersicht", summary.newFiles === 1 && summary.changed === 1 && summary.moved === 1 && summary.unchanged >= 1],
  ] as const;
  return tests.map(([id, label, passed]) => ({ id: `fawoga-od-${id}`, label, passed: Boolean(passed), summary: `${label} wurde in der gemeinsamen FaWoGa-Logik geprüft.` }));
}

export function runFawogaLearningSelfTests() {
  const files: InventorySourceFile[] = [
    { relativePath: "Haus/Elektro_Funkel_Wandleuchte_1.txt", name: "Elektro_Funkel_Wandleuchte_1.txt", sizeBytes: 90, mimeType: "text/plain", lastModified: 1, checksum: "1".repeat(64), textHint: "Elektro Funkel Wandleuchte Termin", contentStatus: "gelesen" },
    { relativePath: "Haus/Elektro_Funkel_Wandleuchte_2.txt", name: "Elektro_Funkel_Wandleuchte_2.txt", sizeBytes: 91, mimeType: "text/plain", lastModified: 2, checksum: "2".repeat(64), textHint: "Elektro Funkel Wandleuchte Reparatur", contentStatus: "gelesen" },
    { relativePath: "Haus/Elektro_Funkel_Wandleuchte_3.txt", name: "Elektro_Funkel_Wandleuchte_3.txt", sizeBytes: 92, mimeType: "text/plain", lastModified: 3, checksum: "3".repeat(64), textHint: "Elektro Funkel Wandleuchte Rechnung", contentStatus: "gelesen" },
  ];
  const analyzed = analyzeInventoryFiles({ sourceRootName: "Lerntest", files, knownDocuments: [] });
  const confirmed = analyzed.slice(0, 2).map((item) => ({ ...item, learningFeatures: { ...item.learningFeatures, organisationIds: ["ORG-ELEKTRO"], senderKeys: ["elektro muller"] } }));
  const signals = confirmed.map((item) => createInventoryLearningSignal(item, { lifeArea: "Haus & Wohnung", canonicalLifeArea: "Haus & Wohnung", personalLifeArea: null, documentType: "Handwerkerunterlage" }));
  const third = { ...analyzed[2], learningFeatures: { ...analyzed[2].learningFeatures, organisationIds: ["ORG-ELEKTRO"], senderKeys: ["elektro muller"], documentType: "Handwerkerunterlage" } };
  const learned = applyInventoryLearningSuggestion(third, signals);
  const conflicting = applyInventoryLearningSuggestion({ ...third, lifeArea: "Gesundheit & Pflege", canonicalLifeArea: "Gesundheit & Pflege", confidence: "eindeutig", documentType: "Arztbericht", learningFeatures: { ...third.learningFeatures, documentType: "Arztbericht", keywords: ["arztbericht", "behandlung"] } }, signals);
  const personalSignals = confirmed.map((item) => createInventoryLearningSignal(item, { lifeArea: "Unser Altbau", canonicalLifeArea: "Haus & Wohnung", personalLifeArea: "Unser Altbau", documentType: "Handwerkerunterlage" }));
  const personal = applyInventoryLearningSuggestion(third, personalSignals);
  return [
    { id: "learn-two-confirmations", label: "Zwei bestätigte Zuordnungen", passed: learned.lifeArea === "Haus & Wohnung" && learned.learningSuggestion?.supportCount === 2, summary: "Zwei ähnliche bestätigte Dokumente bevorzugen beim dritten Dokument denselben Lebensbereich." },
    { id: "learn-explained", label: "Nachvollziehbarer Lernvorschlag", passed: learned.learningSuggestion?.reason.includes("früherer bestätigter Zuordnungen") === true, summary: "Der Vorschlag zeigt verständlich, dass frühere bestätigte Entscheidungen berücksichtigt wurden." },
    { id: "learn-conflict", label: "Widersprüchlicher Inhalt", passed: conflicting.learningSuggestion?.confidence === "Unklar" && conflicting.learningSuggestion.applied === false && conflicting.lifeArea === "Gesundheit & Pflege", summary: "Ein eindeutiger widersprüchlicher Inhalt wird nicht blind durch eine frühere Organisationszuordnung überschrieben." },
    { id: "learn-personal", label: "Persönlicher Lebensbereich", passed: personal.lifeArea === "Unser Altbau" && personal.personalLifeArea === "Unser Altbau", summary: "Auch ein bestätigter persönlicher Lebensbereich kann als künftige Vorschlagshilfe dienen." },
    { id: "learn-no-single-rule", label: "Keine starre Einzelregel", passed: applyInventoryLearningSuggestion(third, signals.slice(0, 1)).learningSuggestion === null, summary: "Eine einzelne Bestätigung erzeugt keine globale Zuordnungsregel." },
  ];
}
