import { FAMILY_CATEGORIES } from "./family-categories.ts";

export type IntakePrivacyClass = "allgemein" | "vertraulich" | "besonders geschützt";

export const INTAKE_DOCUMENT_TYPES = [
  "Dokument",
  "Korrespondenz",
  "Rechnung / Garantie",
  "Vertrag",
  "Gesundheitsunterlage",
  "Betrieblichee Unterlage",
  "Arbeit / Rente / Sozialversicherung",
  "Versicherungsunterlage",
  "Finanz- oder Behördenunterlage",
  "Haus- oder Wohnungsunterlage",
  "Versorgungsunterlage",
  "Fahrzeugunterlage",
  "Motorradunterlage",
  "Technikunterlage",
  "Vorsorgeunterlage",
] as const;

export const INTAKE_PRIVACY_CLASSES: IntakePrivacyClass[] = [
  "allgemein",
  "vertraulich",
  "besonders geschützt",
];

export type IntakeMetadata = {
  lifeArea?: string;
  documentType?: string;
  privacyClass?: IntakePrivacyClass;
};

function taggedValue(notes: string | null | undefined, label: string) {
  if (!notes) return undefined;
  return notes.match(new RegExp(`(?:^|[·\\n])\\s*${label}:\\s*([^·\\n]+)`, "i"))?.[1]?.trim() || undefined;
}

export function readIntakeMetadata(notes: string | null | undefined): IntakeMetadata {
  const privacy = taggedValue(notes, "Datenschutz");
  return {
    lifeArea: taggedValue(notes, "FaWoGa"),
    documentType: taggedValue(notes, "Dokumentart"),
    privacyClass: INTAKE_PRIVACY_CLASSES.includes(privacy as IntakePrivacyClass) ? privacy as IntakePrivacyClass : undefined,
  };
}

function uniqueValues(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    const clean = value?.trim();
    if (!clean || seen.has(clean.toLocaleLowerCase("de"))) return [];
    seen.add(clean.toLocaleLowerCase("de"));
    return [clean];
  });
}

export function buildIntakeChoiceOptions(
  documents: Array<{ category?: string | null; notes?: string | null }>,
  documentCategories: readonly string[],
) {
  const metadata = documents.map((document) => readIntakeMetadata(document.notes));
  return {
    lifeAreas: uniqueValues([...FAMILY_CATEGORIES, ...metadata.map((item) => item.lifeArea)]),
    documentTypes: uniqueValues([...INTAKE_DOCUMENT_TYPES, ...metadata.map((item) => item.documentType)]),
    categories: uniqueValues([...documentCategories, ...documents.map((item) => item.category)]),
  };
}

export type StoredPersonalLifeArea = {
  name: string;
  documentCount: number;
};

export function buildStoredPersonalLifeAreas(
  documents: Array<{ id?: string | null; notes?: string | null }>,
): StoredPersonalLifeArea[] {
  const canonical = new Set(FAMILY_CATEGORIES.map((area) => area.toLocaleLowerCase("de")));
  const countedDocuments = new Set<string>();
  const areas = new Map<string, StoredPersonalLifeArea>();

  documents.forEach((document, index) => {
    const documentKey = document.id?.trim() || `position-${index}`;
    if (countedDocuments.has(documentKey)) return;
    countedDocuments.add(documentKey);

    const name = readIntakeMetadata(document.notes).lifeArea?.trim();
    if (!name) return;
    const normalized = name.toLocaleLowerCase("de");
    if (canonical.has(normalized)) return;

    const current = areas.get(normalized);
    if (current) current.documentCount += 1;
    else areas.set(normalized, { name, documentCount: 1 });
  });

  return [...areas.values()].sort((left, right) => left.name.localeCompare(right.name, "de"));
}
