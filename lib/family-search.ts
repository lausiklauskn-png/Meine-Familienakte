export type FamilySearchIntent = {
  id: string;
  label: string;
  section: string;
  detail: string;
  kind: string;
  reason: string;
  triggerTerms: string[];
};

/** Ein Suchwort mit seinen gleichbedeutenden Formen; ein Treffer braucht jedes Pflichtwort (UND). */
export type FamilySearchGroup = { word: string; alternatives: string[]; optional: boolean };
/** Aus der Frage erkannter Zeitraum (Monat, Tag, Jahr). */
export type FamilySearchDate = { year?: number; month?: number; day?: number; label: string };

export type FamilySearchInterpretation = {
  original: string;
  normalized: string;
  /** Alle Suchformen flach (Übersicht); entscheidend sind groups und date. */
  terms: string[];
  groups: FamilySearchGroup[];
  date: FamilySearchDate | null;
  /** „Kontoauszug oder Bankauszug“: jede Teilfrage einzeln, ein Treffer in einer davon reicht. */
  alternatives: FamilySearchInterpretation[];
  intents: FamilySearchIntent[];
  labels: string[];
};

const stopWords = new Set([
  "zeige", "zeigen", "such", "suche", "suchen", "finde", "finden", "offne", "oeffne", "öffne",
  "mir", "bitte", "alle", "die", "der", "das", "den", "dem", "des", "ein", "eine", "einer", "einen", "einem", "eines", "und", "oder",
  "von", "vom", "zum", "zur", "im", "in", "aus", "mit", "meine", "meiner", "meinen", "meinem", "mein", "unser", "unsere",
  "unserer", "letzten", "letzte", "letzter", "welche", "welcher", "welches", "wann", "was", "wo", "wie", "ist", "sind", "gibt",
  "es", "ich", "mochte", "möchte", "brauche", "benotige", "benötige", "kann", "muss", "fur", "für", "zu",
  "am", "an", "um", "auf", "bei", "bis", "ab", "nach", "seit", "uber", "ueber", "hat", "habe", "haben", "hatte", "war", "wir", "uns",
  "mal", "noch", "schon", "denn", "nachste", "naechste", "nachsten", "naechsten", "nachster", "naechster", "neueste", "neuesten",
  "aktuelle", "aktuellen", "dein", "deine", "wieder", "wird", "werden",
]);

/** Kleine Liste gleichbedeutender Wörter (Alltagswort → Formen, die in Akte und Dateinamen stehen).
 *  Eine Form mit Leerzeichen verlangt alle ihre Wörter (Arzttermin ↔ „Arzt“ und „Termin“). */
const synonyms: Record<string, string[]> = {
  bankauszug: ["kontoauszug", "kontoauszuge", "bankauszuge"],
  bankauszuge: ["kontoauszug", "bankauszug"],
  kontoauszug: ["bankauszug"],
  kontoauszuge: ["kontoauszug", "bankauszug"],
  arzttermin: ["arzt termin", "praxis termin", "vorsorgetermin", "vorsorge", "untersuchung", "sprechstunde"],
  zahnarzttermin: ["zahnarzt"],
  kfz: ["auto", "fahrzeug", "pkw"],
  auto: ["kfz", "fahrzeug", "pkw"],
  pkw: ["auto", "kfz", "fahrzeug"],
  gehaltsabrechnung: ["lohnabrechnung", "gehalt", "lohn"],
  lohnabrechnung: ["gehaltsabrechnung", "gehalt", "lohn"],
  handyvertrag: ["mobilfunk", "handy"],
  handy: ["mobilfunk", "smartphone"],
  miete: ["mietvertrag", "vermieter"],
  police: ["versicherungsschein"],
  versicherungsschein: ["police"],
  krankenkasse: ["krankenkasse", "versicherung"],
  leistung: ["krankenkasse", "leistung", "zahlung"],
  aussteuerung: ["leistung", "krankenkasse"],
  arztbericht: ["befund", "attest", "stellungnahme"],
  arztberichte: ["befund", "attest", "stellungnahme"],
  arzte: ["arzt", "praxis", "behandler"],
  rente: ["rentenversicherung", "altersvorsorge", "rentenantrag"],
  rentenantrag: ["rente", "rentenversicherung", "altersvorsorge"],
  arbeitsunfahigkeit: ["au", "krankmeldung"],
  arbeitsunfaehigkeit: ["au", "krankmeldung"],
  krankgeschrieben: ["au", "arbeitsunfahigkeit"],
  arbeit: ["arbeitgeber", "arbeitszeit", "leistungsfaehigkeit"],
  todo: ["aufgabe", "frist", "erledigen"],
  aufgaben: ["aufgabe", "todo", "erledigen"],
  unterlagen: ["dokument", "datei", "unterlage"],
  briefe: ["schreiben", "schriftverkehr", "brief"],
  antworten: ["antwort", "schriftverkehr"],
  anfragen: ["anfrage", "schriftverkehr"],
};

const MONTHS: Array<[number, string[]]> = [
  [1, ["januar", "jaenner", "janner"]], [2, ["februar", "feb"]], [3, ["marz", "maerz", "mrz"]], [4, ["april", "apr"]],
  [5, ["mai"]], [6, ["juni", "jun"]], [7, ["juli", "jul"]], [8, ["august", "aug"]], [9, ["september", "sept", "sep"]],
  [10, ["oktober", "okt"]], [11, ["november", "nov"]], [12, ["dezember", "dez"]],
];
const MONTH_BY_WORD = new Map(MONTHS.flatMap(([month, words]) => words.map((word) => [word, month] as const)));
const MONTH_NAMES = ["", "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

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

const year4 = (value: string) => { const n = Number(value.length === 2 ? `20${value}` : value); return n >= 1900 && n <= 2099 ? n : undefined; };
const pad = (value: string | number) => String(value).padStart(2, "0");

/** Deutsche Datumsangaben aus der rohen Frage lesen (15.03.2026, 03/2026, 2026-03, „März 2026“, heute) und herausnehmen. */
function readQueryDate(raw: string, now = new Date()): { date: FamilySearchDate | null; rest: string } {
  let rest = raw.toLocaleLowerCase("de");
  let date: FamilySearchDate | null = null;
  const valid = (d?: number, m?: number) => (!m || (m >= 1 && m <= 12)) && (!d || (d >= 1 && d <= 31));
  const patterns: Array<[RegExp, (m: RegExpMatchArray) => FamilySearchDate | null]> = [
    [/(?<!\d)(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})(?!\d)/, (m) => valid(+m[1], +m[2]) && year4(m[3]) ? { day: +m[1], month: +m[2], year: year4(m[3]), label: `${pad(m[1])}.${pad(m[2])}.${year4(m[3])}` } : null],
    [/(?<!\d)(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/, (m) => valid(+m[3], +m[2]) && year4(m[1]) ? { year: year4(m[1]), month: +m[2], day: +m[3], label: `${pad(m[3])}.${pad(m[2])}.${m[1]}` } : null],
    [/(?<!\d)(\d{4})-(\d{1,2})(?!\d)/, (m) => valid(undefined, +m[2]) && year4(m[1]) ? { year: year4(m[1]), month: +m[2], label: `${MONTH_NAMES[+m[2]]} ${m[1]}` } : null],
    [/(?<!\d)(\d{1,2})[./](\d{4})(?!\d)/, (m) => valid(undefined, +m[1]) && year4(m[2]) ? { month: +m[1], year: year4(m[2]), label: `${MONTH_NAMES[+m[1]]} ${m[2]}` } : null],
    [/(?<!\d)(\d{1,2})\.(\d{1,2})\.(?!\d)/, (m) => valid(+m[1], +m[2]) ? { day: +m[1], month: +m[2], label: `${pad(m[1])}.${pad(m[2])}.` } : null],
  ];
  for (const [pattern, make] of patterns) {
    const m = rest.match(pattern);
    const found = m ? make(m) : null;
    if (m && found) { date = found; rest = rest.replace(m[0], " "); break; }
  }
  if (!date) {
    const words = normalizeFamilySearch(rest).split(/\s+/).filter(Boolean);
    const relative = words.find((word) => ["heute", "morgen", "gestern"].includes(word));
    const monthWord = words.find((word) => MONTH_BY_WORD.has(word));
    if (relative) {
      const day = new Date(now); day.setDate(day.getDate() + (relative === "morgen" ? 1 : relative === "gestern" ? -1 : 0));
      date = { year: day.getFullYear(), month: day.getMonth() + 1, day: day.getDate(), label: relative };
      rest = words.filter((word) => word !== relative).join(" ");
    } else if (monthWord) {
      const month = MONTH_BY_WORD.get(monthWord) as number;
      const yearWord = words.find((word) => /^\d{4}$/.test(word) && !!year4(word));
      date = { month, ...(yearWord ? { year: year4(yearWord) } : {}), label: `${MONTH_NAMES[month]}${yearWord ? ` ${yearWord}` : ""}` };
      rest = words.filter((word) => word !== monthWord && word !== yearWord).join(" ");
    }
  }
  return { date, rest };
}

/** Einfache Grundform: „Termine“ → „termin“, „Kontoauszüge“ → „kontoauszug“. */
function stem(word: string) {
  if (word.length < 6) return null;
  const suffix = ["en", "er", "e"].find((ending) => word.endsWith(ending) && word.length - ending.length >= 5);
  return suffix ? word.slice(0, -suffix.length) : null;
}

function interpretSingle(value: string, intents: FamilySearchIntent[], now?: Date): FamilySearchInterpretation {
  const { date, rest } = readQueryDate(value, now);
  const normalized = normalizeFamilySearch(value);
  const tokens = normalizeFamilySearch(rest).split(/\s+/).filter(Boolean);
  const intentWords = new Set(intents.flatMap((intent) => intent.triggerTerms.map(normalizeFamilySearch)));
  const meaningful = [...new Set(tokens.filter((word) => word.length > 1 && !stopWords.has(word)))];
  const groups = meaningful.map((word): FamilySearchGroup => {
    const base = stem(word);
    const alternatives = [...new Set([word, ...(base ? [base] : []), ...(synonyms[word] || []), ...(base ? synonyms[base] || [] : [])].map(normalizeFamilySearch).filter(Boolean))];
    return { word, alternatives, optional: intentWords.has(word) };
  });
  // Bereichswörter („Erinnerung“, „Dokumente“) helfen nur beim Einordnen; Pflicht werden sie, wenn sonst nichts gesucht wird.
  if (!groups.some((group) => !group.optional) && !date) groups.forEach((group) => { group.optional = false; });
  const terms = [...new Set(groups.flatMap((group) => group.alternatives))];
  return { original: value, normalized, terms, groups, date, alternatives: [], intents, labels: intents.map((intent) => intent.label) };
}

export function interpretFamilySearchQuery(value: string, now?: Date): FamilySearchInterpretation {
  const normalized = normalizeFamilySearch(value);
  if (!normalized) return { original: value, normalized, terms: [], groups: [], date: null, alternatives: [], intents: [], labels: [] };
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const tokenSet = new Set(tokens);
  const intents = intentDefinitions.filter((intent) => intent.triggerTerms.some((trigger) => triggerMatches(normalized, tokenSet, trigger)));
  const parts = value.split(/\s+oder\s+/i).map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) {
    const alternatives = parts.map((part) => interpretSingle(part, intents, now)).filter((part) => part.groups.length || part.date);
    return { original: value, normalized, terms: [...new Set(alternatives.flatMap((part) => part.terms))], groups: [], date: null, alternatives, intents, labels: intents.map((intent) => intent.label) };
  }
  return interpretSingle(value, intents, now);
}

/** Hat die Frage etwas zu suchen (Wörter, Datum oder Teilfragen)? */
export function hasFamilySearchContent(interpretation: FamilySearchInterpretation) {
  return interpretation.groups.length > 0 || !!interpretation.date || interpretation.alternatives.length > 0;
}

function wordMatches(normalizedText: string, tokens: Set<string>, word: string) {
  // Zwei Buchstaben („au“) nur als ganzes Wort, sonst trifft „au“ jedes „Kontoauszug“ und „Auto“.
  return word.length <= 2 ? tokens.has(word) : normalizedText.includes(word);
}

function alternativeMatches(normalizedText: string, tokens: Set<string>, alternative: string) {
  return alternative.split(" ").every((part) => wordMatches(normalizedText, tokens, part));
}

type DatePart = { year?: number; month?: number; day?: number };

/** Datumsangaben im Text (ISO, 15.03.2026, 03/2026, 2026_03, „März 2026“) als Jahr/Monat/Tag. */
function datesInText(raw: string): DatePart[] {
  const found: DatePart[] = [];
  for (const m of raw.matchAll(/(?<!\d)(\d{4})[-_.](\d{1,2})(?:[-_.](\d{1,2}))?(?!\d)/g)) found.push({ year: +m[1], month: +m[2], day: m[3] ? +m[3] : undefined });
  for (const m of raw.matchAll(/(?<!\d)(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})(?!\d)/g)) found.push({ day: +m[1], month: +m[2], year: year4(m[3]) });
  for (const m of raw.matchAll(/(?<!\d)(\d{1,2})[/_-](\d{4})(?!\d)/g)) found.push({ month: +m[1], year: +m[2] });
  const words = normalizeFamilySearch(raw).split(/\s+/);
  words.forEach((word, index) => {
    const month = MONTH_BY_WORD.get(word);
    if (month && word.length > 3) {
      const next = words[index + 1];
      found.push({ month, year: next && /^\d{4}$/.test(next) ? +next : undefined });
    }
  });
  return found;
}

function dateMatches(wanted: FamilySearchDate, raw: string, dates: Array<string | null | undefined>) {
  const fromFields = dates.flatMap((value): DatePart[] => {
    const m = value?.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    return m ? [{ year: +m[1], month: +m[2], day: m[3] ? +m[3] : undefined }] : [];
  });
  return [...fromFields, ...datesInText(raw)].some((candidate) =>
    (!wanted.year || candidate.year === wanted.year)
    && (!wanted.month || candidate.month === wanted.month)
    && (!wanted.day || candidate.day === wanted.day));
}

/** Punktzahl eines Textes: 0, wenn ein Pflichtwort oder das Datum fehlt (mehr Wörter = weniger Treffer).
 *  dates: Datumsfelder des Eintrags (ISO), die nicht im Text stehen müssen. */
export function scoreFamilySearchText(text: string, interpretation: FamilySearchInterpretation, dates: Array<string | null | undefined> = []): number {
  if (interpretation.alternatives.length) return Math.max(0, ...interpretation.alternatives.map((part) => scoreFamilySearchText(text, part, dates)));
  if (!interpretation.groups.length && !interpretation.date) return 0;
  const normalizedText = normalizeFamilySearch(text);
  const tokens = new Set(normalizedText.split(/[\s.]+/).filter(Boolean));
  let score = 0;
  let required = 0;
  for (const group of interpretation.groups) {
    const direct = wordMatches(normalizedText, tokens, group.word);
    const matched = direct || group.alternatives.some((alternative) => alternativeMatches(normalizedText, tokens, alternative));
    if (!matched) { if (group.optional) continue; return 0; }
    if (!group.optional) required += 1;
    score += direct ? 3 : 2;
  }
  if (interpretation.date) {
    if (!dateMatches(interpretation.date, text, dates)) return 0;
    score += 3; required += 1;
  }
  if (!required) return 0;
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
