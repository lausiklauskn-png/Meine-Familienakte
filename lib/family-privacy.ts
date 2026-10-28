const HEALTH_TERMS = /(gesund|arzt|ärzt|medizin|diagnos|krank|krankenkasse|pflege|physio|erkält|heuschnupfen|angst|rücken|zahn|niere|heuschnupfen|icd|therap|medikament|reha)/i;

export function isSensitiveHealthText(...values: Array<string | null | undefined>) {
  return values.some((value) => Boolean(value && HEALTH_TERMS.test(value)));
}

export function protectedFamilyLabel(input: {
  label: string;
  category?: string | null;
  notes?: string | null;
  sensitive?: boolean;
  protectedHealthContext?: boolean;
}) {
  if (input.protectedHealthContext) return input.label;
  if (input.sensitive || isSensitiveHealthText(input.label, input.category, input.notes)) {
    return "Geschützte Gesundheitsunterlage";
  }
  return input.label;
}

export function protectedFamilySummary(input: {
  text: string;
  sensitive?: boolean;
  protectedHealthContext?: boolean;
}) {
  if (input.protectedHealthContext || !input.sensitive) return input.text;
  return "Gesundheitsbezogene Unterlage – Einzelheiten sind nur im geschützten Gesundheitsbereich sichtbar.";
}
