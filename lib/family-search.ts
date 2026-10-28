export type FamilySearchIntent = {
  id: string;
  label: string;
  section: string;
  detail: string;
  kind: string;
  reason: string;
  triggerTerms: string[];
};

export type FamilySearchInterpretation = {
  original: string;
  normalized: string;
  terms: string[];
  intents: FamilySearchIntent[];
  labels: string[];
};

const stopWords = new Set([
  "zeige", "zeigen", "such", "suche", "suchen", "finde", "finden", "offne", "oeffne", "öffne",
  "mir", "bitte", "alle", "die", "der", "das", "den", "dem", "eine", "einer", "einen", "und", "oder",
  "von", "vom", "zum", "zur", "im", "in", "aus", "mit", "meine", "meiner", "meinen", "mein", "unser",
  "unserer", "letzten", "welche", "welcher", "welches", "wann", "was", "wo", "wie", "ist", "sind", "gibt",
  "es", "ich", "mochte", "möchte", "brauche", "benotige", "benötige", "kann", "muss", "fur", "für", "zu",
]);

const synonyms: Record<string, string[]> = {
  krankenkasse: ["krankenkasse", "versicherung"],
  leistung: ["krankenkasse", "leistung", "zahlung"],
  aussteuerung: ["leistung", "leistung", "krankenkasse"],
  arztbericht: ["befund", "attest", "stellungnahme"],
  arztberichte: ["befund", "attest", "stellungnahme"],
  arzte: ["arzt", "praxis", "behandler"],
  rente: ["rentenversicherung", "altersvorsorge", "rentenantrag"],
  rentenantrag: ["rente", "rentenversicherung", "altersvorsorge"],
  arbeitsunfahigkeit: ["au", "krankmeldung"],
  arbeitsunfaehigkeit: ["au", "krankmeldung"],
  krankgeschrieben: ["au", "arbeitsunfahigkeit"],
  psyche: ["erkältung", "angst", "heuschnupfen", "aerztlie"],
  schlaf: ["heuschnupfen", "osas", "impfpass"],
  arbeit: ["arbeitgeber", "arbeitszeit", "leistungsfaehigkeit"],
  uni: ["arbeitgeber", "arbeit", "arbeitszeit"],
  todo: ["aufgabe", "frist", "erledigen"],
  aufgaben: ["aufgabe", "todo", "erledigen"],
  unterlagen: ["dokument", "datei"],
  briefe: ["schreiben", "schriftverkehr"],
  antworten: ["antwort", "schriftverkehr"],
  anfragen: ["anfrage", "schriftverkehr"],
};

export function normalizeFamilySearch(value: string) {
  return value.toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9.]+/g, " ").trim();
}

const intentDefinitions: FamilySearchIntent[] = [
  { id: "search-help", label: "Interaktive Suche", section: "help", detail: "Hilfe zur Suche per Tastatur oder Mikrofon", kind: "Hilfe", reason: "Die Frage betrifft die Bedienung der Suche", triggerTerms: ["interaktive suche", "sprachsuche", "mikrofon", "diktieren", "suchfunktion"] },
  { id: "benefits", label: "Krankenkasse & Leistungen", section: "benefits", detail: "Zahlungen, Leistungszeiten und offene Klärungen", kind: "Bereich", reason: "Erkannter Themenbereich Krankenkasse oder Leistungen", triggerTerms: ["krankenkasse", "krankenkasse", "leistung", "aussteuerung", "leistung", "zahlung"] },
  { id: "correspondence", label: "Anfragen & Antworten", section: "correspondence", detail: "Gespeicherter Schriftverkehr und Antworten", kind: "Bereich", reason: "Erkannter Wunsch nach Schreiben, Anfrage oder Antwort", triggerTerms: ["schreiben", "brief", "briefe", "anfrage", "anfragen", "antwort", "antworten", "schriftverkehr", "anschreiben"] },
  { id: "medical", label: "Diagnosen, AU & ICD-Codes", section: "medical", detail: "Diagnosen, Ärzte, Praxen, Befunde und AU-Zeiten", kind: "Bereich", reason: "Erkannter medizinischer Suchbereich", triggerTerms: ["diagnose", "diagnosen", "icd", "arzt", "arzte", "praxis", "befund", "krankheit", "au", "arbeitsunfahigkeit", "erkältung", "heuschnupfen", "heuschnupfen"] },
  { id: "work", label: "Arbeit & Arbeitgeber", section: "work", detail: "Arbeitszeiten, Urlaub und Krankmeldungen", kind: "Bereich", reason: "Erkannter Themenbereich Arbeit oder Arbeitgeber", triggerTerms: ["arbeit", "arbeitszeit", "arbeitgeber", "uni", "kranktag", "kranktage", "leistungsfahigkeit", "leistungsfaehigkeit"] },
  { id: "assessment", label: "Anträge & Bescheide", section: "assessment", detail: "Anträge, Bescheide und Behördenpost", kind: "Bereich", reason: "Erkannter Antrag oder Bescheinigungsvorgang", triggerTerms: ["rente", "rentenantrag", "altersvorsorge", "rentenversicherung", "teilzeit", "bescheid", "bescheinigung"] },
  { id: "reminders", label: "Fristen und Aufgaben", section: "reminders", detail: "Offene, bald fällige und überfällige Punkte", kind: "Arbeitsbereich", reason: "Erkannter Wunsch nach Aufgaben, Terminen oder Fristen", triggerTerms: ["frist", "fristen", "termin", "termine", "erinnerung", "erinnerungen", "aufgabe", "aufgaben", "todo", "erledigen", "fallig", "faellig", "uberfallig"] },
  { id: "cockpit", label: "Interaktives Cockpit", section: "cockpit", detail: "Aktuelle Prioritäten, offene Vorgänge und To-dos", kind: "Arbeitsbereich", reason: "Erkannter Wunsch nach offenen oder wichtigen Punkten", triggerTerms: ["vorgang", "vorgange", "vorgaenge", "offen", "wichtig", "prioritat", "prioritaet", "aktuell", "handlungsbedarf"] },
  { id: "news", label: "Was gibt’s Neues?", section: "changelog", detail: "Neue Dokumente und wichtige Veränderungen", kind: "Übersicht", reason: "Erkannter Wunsch nach neuen oder zuletzt geänderten Inhalten", triggerTerms: ["neu", "neues", "neuigkeiten", "hinzugekommen", "zuletzt", "geandert", "geaendert"] },
  { id: "documents", label: "Dokumentenbibliothek", section: "documents", detail: "Vorhandene Unterlagen, Dateien und Dokumente durchsuchen", kind: "Bereich", reason: "Erkannter Wunsch nach Dokumenten oder Dateien", triggerTerms: ["dokument", "dokumente", "dokumentenbibliothek", "unterlage", "unterlagen", "datei", "dateien", "pdf", "hochladen", "ablegen"] },
  { id: "vehicles", label: "Fahrzeuge", section: "vehicles", detail: "Fahrzeugpapiere, Werkstatt, Wartung und TÜV", kind: "Lebensbereich", reason: "Erkannter Fahrzeugbezug", triggerTerms: ["fahrzeug", "fahrzeuge", "auto", "motorrad", "tuv", "werkstatt", "wartung"] },
  { id: "home", label: "Haus & Wohnung", section: "home", detail: "Miete, Vermieter, Nebenkosten und Reparaturen", kind: "Lebensbereich", reason: "Erkannter Wohnungs- oder Hausbezug", triggerTerms: ["haus", "wohnung", "miete", "vermieter", "nebenkosten", "reparatur"] },
  { id: "purchases", label: "Käufe & Garantien", section: "purchases", detail: "Rechnungen, Verträge, Käufe und Garantien", kind: "Lebensbereich", reason: "Erkannter Kauf-, Vertrags- oder Garantiebezug", triggerTerms: ["kauf", "kaufe", "kaeufe", "rechnung", "rechnungen", "vertrag", "vertrage", "vertraege", "garantie", "garantien"] },
  { id: "security", label: "Sicherheitscenter", section: "security", detail: "Datenschutz, Tresor, Sicherung und Zugriff", kind: "Verwaltung", reason: "Erkannter Sicherheits- oder Speicherbezug", triggerTerms: ["sicherheit", "datenschutz", "tresor", "usb", "onedrive", "sicherung", "passwort", "zugriff"] },
  { id: "systemcheck", label: "Systemprüfung", section: "systemcheck", detail: "Prüfstatus, Berichte und sichere Reparatur", kind: "Verwaltung", reason: "Erkannter Wunsch nach Systemprüfung oder Prüfbericht", triggerTerms: ["systemprufung", "systempruefung", "prufbericht", "pruefbericht", "fehler", "reparatur"] },
];

function triggerMatches(normalized: string, tokenSet: Set<string>, trigger: string) {
  const normalizedTrigger = normalizeFamilySearch(trigger);
  return normalizedTrigger.includes(" ") ? normalized.includes(normalizedTrigger) : tokenSet.has(normalizedTrigger);
}

export function interpretFamilySearchQuery(value: string): FamilySearchInterpretation {
  const normalized = normalizeFamilySearch(value);
  if (!normalized) return { original: value, normalized, terms: [], intents: [], labels: [] };
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const tokenSet = new Set(tokens);
  const intents = intentDefinitions.filter((intent) => intent.triggerTerms.some((trigger) => triggerMatches(normalized, tokenSet, trigger)));
  const meaningful = tokens.filter((word) => word.length > 1 && !stopWords.has(word));
  const expanded = meaningful.flatMap((word) => [word, ...(synonyms[word] || [])]).map(normalizeFamilySearch).filter(Boolean);
  const intentTerms = intents.flatMap((intent) => intent.triggerTerms.map(normalizeFamilySearch).filter((term) => !term.includes(" ")));
  const terms = [...new Set([...expanded, ...intentTerms])];
  return { original: value, normalized, terms, intents, labels: intents.map((intent) => intent.label) };
}

export function scoreFamilySearchText(text: string, interpretation: FamilySearchInterpretation) {
  const normalizedText = normalizeFamilySearch(text);
  let score = interpretation.terms.reduce((total, term) => total + (normalizedText.includes(term) ? 2 : 0), 0);
  if (interpretation.normalized.length > 2 && normalizedText.includes(interpretation.normalized)) score += 6;
  return score;
}

export function runFamilySearchSelfTests() {
  const tests = [
    { id: "search-speech" as const, label: "Gesprochene Krankenkasse-Suche", query: "Zeige mir bitte meine Schreiben von der Krankenkasse zum Zuschuss", expected: ["benefits", "correspondence"] },
    { id: "search-tasks" as const, label: "Offene Aufgaben und Fristen", query: "Welche Aufgaben muss ich heute erledigen?", expected: ["reminders"] },
    { id: "search-help" as const, label: "Hilfe zur interaktiven Suche", query: "Interaktive Suche mit Mikrofon", expected: ["search-help"] },
    { id: "search-health" as const, label: "Ärzte und ICD-Codes", query: "Finde meine Ärzte und ICD-Codes", expected: ["medical"] },
  ];
  return tests.map((test) => {
    const result = interpretFamilySearchQuery(test.query);
    const found = new Set(result.intents.map((intent) => intent.id));
    const passed = test.expected.every((intent) => found.has(intent)) && result.terms.length > 0;
    return { id: test.id, label: test.label, status: passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: passed ? `Alltagssatz wurde lokal als ${result.labels.join(" und ")} verstanden.` : "Der Alltagssatz wurde nicht eindeutig in den erwarteten Bereich übersetzt." };
  });
}
