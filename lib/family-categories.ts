export const FAMILY_CATEGORIES = [
  "Familie & persönliche Dokumente",
  "Finanzen & Konten",
  "Versicherungen",
  "Steuern & Behörden",
  "Haus & Wohnung",
  "Energie & Versorgung",
  "Garten & Grundstück",
  "Einkäufe, Rechnungen & Garantien",
  "Gesundheit & Pflege",
  "Rente, Arbeit & Sozialversicherung",
  "Auto & Mobilität",
  "Motorrad",
  "Technik, Geräte & Reparaturen",
  "Verträge & Abonnements",
  "Erbschaft, Vollmachten & Vorsorge",
  "Reisen & Freizeit",
  "Korrespondenz",
  "Archiv",
] as const;

export type FamilyCategory = (typeof FAMILY_CATEGORIES)[number];

export const FAMILY_CATEGORY_DEFINITIONS: ReadonlyArray<{
  id: string;
  label: FamilyCategory;
  aliases: readonly string[];
  privacy: "allgemein" | "vertraulich" | "besonders geschützt";
}> = FAMILY_CATEGORIES.map((label, index) => ({
  id: `CAT-${String(index + 1).padStart(2, "0")}`,
  label,
  aliases: ({
    "Haus & Wohnung": ["Wohnen"],
    "Auto & Mobilität": ["Auto", "Pkw", "Kfz"],
    "Gesundheit & Pflege": ["Gesundheit", "Pflege"],
    "Rente, Arbeit & Sozialversicherung": ["Arbeit", "Rente", "Sozialversicherung"],
    "Einkäufe, Rechnungen & Garantien": ["Käufe", "Rechnungen", "Garantien"],
  } as Partial<Record<FamilyCategory, string[]>>)[label] || [],
  privacy: label === "Gesundheit & Pflege" || label === "Erbschaft, Vollmachten & Vorsorge"
    ? "besonders geschützt"
    : ["Finanzen & Konten", "Steuern & Behörden", "Versicherungen"].includes(label)
      ? "vertraulich"
      : "allgemein",
}));

const normalize = (value: string) => value.toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();

const ambiguousAliases = new Set([normalize("Gesundheit & Arbeit"), normalize("Fahrzeuge")]);

export function canonicalFamilyCategory(value: string): {
  category: FamilyCategory | null;
  matchedBy: "canonical" | "alias" | "none";
  needsReview: boolean;
} {
  const input = normalize(value);
  if (!input || ambiguousAliases.has(input)) return { category: null, matchedBy: "none", needsReview: true };
  for (const definition of FAMILY_CATEGORY_DEFINITIONS) {
    if (normalize(definition.label) === input) return { category: definition.label, matchedBy: "canonical", needsReview: false };
    if (definition.aliases.some((alias) => normalize(alias) === input)) return { category: definition.label, matchedBy: "alias", needsReview: false };
  }
  return { category: null, matchedBy: "none", needsReview: true };
}

export function isCanonicalFamilyCategory(value: string): value is FamilyCategory {
  return FAMILY_CATEGORIES.includes(value as FamilyCategory);
}
