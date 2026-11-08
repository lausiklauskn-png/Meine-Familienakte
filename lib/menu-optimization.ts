import type { FamilyRecordType } from "./family-data-model";

export const MENU_OPTIMIZATION_VERSION = 1 as const;
// Klaus 04.11.2026: Demo-Ablage und bewusst gewählten eigenen Tresor auf der Startseite unterscheiden.
// Entscheidung 08.11.2026 (2.28.39): interne Angaben aus der Oberfläche – kein mitgelieferter Prüfbericht vom 13.10., keine Fassung 2.28.1 auf der Startseite.
// Klaus 08.11.2026 (Vorschau neugestaltung-2.28.39, Punkte 1 und 4): „So fängst du an“ ganz oben; ein Name „Cockpit“ statt „Objekt-Cockpit“.
// 2.28.39 Navigation (U6, U10, U11): Punkte im Cockpit-Kasten und in „Zuletzt wichtig“ öffnen genau diesen Punkt.
export const START_PAGE_REFERENCE_SHA256 = "cdefceadf2739015da6c6317895a1d6ca6f5ea21d5c61a92d8d64a6ac984bdf2";

export type MenuSection =
  | "documents" | "inbox" | "medical" | "benefits" | "work" | "assessment"
  | "correspondence" | "sources" | "health" | "family" | "home" | "vehicles"
  | "purchases" | "reminders" | "cockpit" | "directory" | "security" | "help"
  | "changelog" | "versions" | "systemcheck" | "memory";

// 2.28.39 (Klaus 08.11.2026, Vorschau neugestaltung Punkt 4): ein Cockpit; „Im Cockpit anzeigen“ öffnet es auf den Bereich
// gefiltert. Die Kennung „bereich:<seite>“ läuft als Ziel durch die Navigation (Zurück/Vorwärts behalten den Filter).
export const COCKPIT_BEREICH = "bereich:";
export type CockpitBereich = { name: string; sections: string[]; woerter: RegExp; geschuetzt?: boolean };
export const cockpitBereiche: Record<string, CockpitBereich> = {
  health: { name: "Gesundheit & Arbeit", sections: ["health", "medical", "benefits", "work", "assessment", "correspondence"], woerter: /(arzt|ärzt|kranken|gesund|befund|arbeit|antrag|bescheid|rente|leistung|behörd)/i, geschuetzt: true },
  medical: { name: "Diagnosen, AU & ICD-Codes", sections: ["health", "medical"], woerter: /(arzt|ärzt|befund|diagnos|krankschreib|arbeitsunfähig|praxis|klinik)/i, geschuetzt: true },
  benefits: { name: "Krankenkasse & Leistungen", sections: ["benefits"], woerter: /(krankenkasse|krankengeld|leistung|kasse)/i, geschuetzt: true },
  work: { name: "Arbeit & Arbeitgeber", sections: ["work"], woerter: /(arbeitgeber|arbeit|urlaub|lohn|gehalt|anwesenheit)/i },
  assessment: { name: "Anträge & Bescheide", sections: ["assessment"], woerter: /(antrag|bescheid|behörd|amt\b|rente|widerspruch)/i },
  correspondence: { name: "Anfragen & Antworten", sections: ["correspondence"], woerter: /(anfrage|antwort|schreiben|brief|e-mail|mail)/i },
  inbox: { name: "Neue Unterlagen", sections: ["documents", "inbox"], woerter: /(dokument|unterlage|eingang|scan)/i },
  home: { name: "Wohnen", sections: ["home"], woerter: /(haus|wohnung|miete|vermiet|nebenkosten|garten)/i },
  vehicles: { name: "Fahrzeuge", sections: ["vehicles"], woerter: /(fahrzeug|auto|motorrad|tüv|kfz|werkstatt)/i },
  purchases: { name: "Käufe & Garantien", sections: ["purchases"], woerter: /(kauf|garantie|gerät|rechnung|reparatur)/i },
  family: { name: "Familie & Personen", sections: ["family"], woerter: /(familie|person|vollmacht|vorsorge)/i },
};
export function cockpitBereichAus(ziel?: string | null) {
  if (!ziel?.startsWith(COCKPIT_BEREICH)) return null;
  const id = ziel.slice(COCKPIT_BEREICH.length);
  const bereich = cockpitBereiche[id];
  return bereich ? { id, ...bereich } : null;
}
/** Gehört ein Cockpit-Eintrag zum Bereich? Nach Bereich (Abschnitt), geschütztem Gesundheitseintrag oder Wort im Titel. */
export function passtZumBereich(bereich: CockpitBereich, eintrag: { section?: string; sensitive?: boolean; text: string }) {
  return (!!eintrag.section && bereich.sections.includes(eintrag.section)) || (!!bereich.geschuetzt && !!eintrag.sensitive) || bereich.woerter.test(eintrag.text);
}

export type MenuTarget = { section: MenuSection; targetId?: string };
/** anker: Stelle auf der Zielseite, zu der der gemeinsame Sprungweg rollt (U2, 2.28.39). */
export type MenuAction = MenuTarget & { label: string; detail: string; query?: string; area?: string; anker?: string };

// Bereichsnamen der Dokument-Knöpfe = Lebensbereiche des Eingangs (lib/family-categories.ts) bzw. die Sammelbereiche
// „Fahrzeuge“ und „Käufe & Garantien“ aus lib/document-library.ts. Mehrere Suchwörter mit „oder“ verbinden.
export const menuPageActions = {
  health: [
    { label: "Diagnosen, AU & ICD-Codes", detail: "Medizinische Akte: Diagnosen, AU-Zeiten und Ärzte", section: "medical" },
    { label: "Gesundheitsdokumente", detail: "Geschützte Unterlagen in der Bibliothek", section: "documents", area: "Gesundheit & Pflege" },
    { label: "Fristen und Aufgaben", detail: "Offene gesundheitliche und berufliche Punkte", section: "reminders" },
    { label: "Im Cockpit anzeigen", detail: "Datensparsame Arbeitsübersicht", section: "cockpit", targetId: `${COCKPIT_BEREICH}health` },
  ],
  family: [
    { label: "Tagebuch und Erinnerungen", detail: "Ereignisse festhalten und offene Punkte klären", section: "memory" },
    { label: "Personen", detail: "Personen, Organisationen und Objekte – anlegen und öffnen", section: "family", anker: "#familie-stamm" },
    { label: "Gemeinsame Vorgänge", detail: "Offene Vorgänge im Cockpit", section: "cockpit", anker: "#cockpit-cases" },
    { label: "Termine und Fristen", detail: "Offene, fällige und erledigte Punkte", section: "reminders" },
    { label: "Familienunterlagen", detail: "Dokumente dieses Lebensbereichs", section: "documents", area: "Familie & persönliche Dokumente" },
  ],
  home: [
    { label: "Dokumente", detail: "Unterlagen zu Haus und Wohnung", section: "documents", area: "Haus & Wohnung" },
    { label: "Vorgänge und Objekte", detail: "Offene Vorgänge und Objektakten – im Cockpit auf diesen Bereich gefiltert", section: "cockpit", targetId: `${COCKPIT_BEREICH}home`, anker: "#cockpit-cases" },
    { label: "Fristen und Aufgaben", detail: "Termine und Wiedervorlagen", section: "reminders" },
  ],
  vehicles: [
    { label: "Dokumente", detail: "Fahrzeug- und Motorradunterlagen", section: "documents", area: "Fahrzeuge" },
    { label: "Fahrzeugakten", detail: "Objektakten im Cockpit, auf Fahrzeuge gefiltert", section: "cockpit", targetId: `${COCKPIT_BEREICH}vehicles`, anker: "#cockpit-objects" },
    { label: "Fristen und Aufgaben", detail: "TÜV, Wartung und Wiedervorlagen", section: "reminders" },
  ],
  purchases: [
    { label: "Dokumente", detail: "Rechnungen, Garantien und Geräteunterlagen", section: "documents", area: "Käufe & Garantien" },
    { label: "Objektakten im Cockpit", detail: "Geräte- und Reparaturakten – im Cockpit auf diesen Bereich gefiltert", section: "cockpit", targetId: `${COCKPIT_BEREICH}purchases`, anker: "#cockpit-objects" },
    { label: "Fristen und Aufgaben", detail: "Garantieenden und Wiedervorlagen", section: "reminders" },
  ],
  medical: [
    { label: "Gesundheitsdokumente", detail: "Geschützte Originalunterlagen anzeigen", section: "documents", area: "Gesundheit & Pflege" },
    { label: "Krankenkasse und Leistungen", detail: "Leistungszeiten und offene Klärungen", section: "benefits" },
    { label: "Arbeit und Arbeitgeber", detail: "Arbeitsverlauf und Arbeitszeiten", section: "work" },
    { label: "Im Cockpit anzeigen", detail: "Datensparsame Aufgabenübersicht", section: "cockpit", targetId: `${COCKPIT_BEREICH}medical` },
  ],
  benefits: [
    { label: "Krankenkasse-Unterlagen", detail: "Leistungsauskunft und Antworten suchen", section: "documents", query: "Krankenkasse oder Leistung" },
    { label: "Anfragen und Antworten", detail: "Schriftverkehr chronologisch öffnen", section: "correspondence" },
    { label: "Fristen und Aufgaben", detail: "Offene Antworten und Wiedervorlagen", section: "reminders" },
    { label: "Im Cockpit anzeigen", detail: "Aktuelle Vorgänge und Aufgaben", section: "cockpit", targetId: `${COCKPIT_BEREICH}benefits` },
  ],
  work: [
    { label: "Arbeitsunterlagen", detail: "Arbeitgeber- und Anwesenheitsdokumente", section: "documents", query: "Arbeitgeber oder Arbeit oder Anwesenheit" },
    { label: "Bescheinigung und Anträge", detail: "Anträge, Bescheide und Behördenpost", section: "assessment" },
    { label: "Anfragen und Antworten", detail: "Arbeitsbezogenen Schriftverkehr öffnen", section: "correspondence" },
    { label: "Im Cockpit anzeigen", detail: "Vorgänge, Aufgaben und Fristen", section: "cockpit", targetId: `${COCKPIT_BEREICH}work` },
  ],
  assessment: [
    { label: "Antragsunterlagen", detail: "Anträge und Bescheide", section: "documents", query: "Antrag oder Bescheid" },
    { label: "Anfragen und Antworten", detail: "Rentenversicherung-, Arbeitsagentur- und Arbeitgeber-Schriftverkehr", section: "correspondence" },
    { label: "Fristen und Aufgaben", detail: "Nachreichungen und Termine", section: "reminders" },
    { label: "Im Cockpit anzeigen", detail: "Laufende Vorgänge öffnen", section: "cockpit", targetId: `${COCKPIT_BEREICH}assessment` },
  ],
  correspondence: [
    { label: "Schriftverkehr", detail: "Anfragen und Antworten als Dokumente", section: "documents", query: "Anfrage oder Antwort oder Schreiben" },
    { label: "Krankenkasse und Leistungen", detail: "Leistungszeiten und offene Klärungen", section: "benefits" },
    { label: "Fristen und Aufgaben", detail: "Offene Antworten und Wiedervorlagen", section: "reminders" },
    { label: "Im Cockpit anzeigen", detail: "Vorgänge und nächste Schritte", section: "cockpit", targetId: `${COCKPIT_BEREICH}correspondence` },
  ],
  sources: [
    { label: "Alle Dokumente", detail: "Zentrale Bibliothek vollständig öffnen", section: "documents" },
    { label: "Neue Unterlagen", detail: "Dokumente lokal ablegen und prüfen", section: "inbox" },
    { label: "Sicherheit", detail: "Lokalen Datentresor verwalten", section: "security" },
  ],
  inbox: [
    { label: "Dokumentenbibliothek", detail: "Vorhandene Unterlagen suchen", section: "documents" },
    { label: "Sicherheit", detail: "Lokalen Datentresor verbinden", section: "security" },
    { label: "Im Cockpit anzeigen", detail: "Neue und offene Dokumentvorgänge", section: "cockpit", targetId: `${COCKPIT_BEREICH}inbox` },
  ],
} satisfies Record<string, MenuAction[]>;

export function targetForRelation(type: FamilyRecordType | "document", id: string): MenuTarget {
  if (type === "document") return { section: "documents", targetId: id };
  if (["deadline", "task", "reminder"].includes(type)) return { section: "reminders", targetId: id };
  return { section: "cockpit", targetId: id };
}

/**
 * Eine Zuordnung „Datensatzart → Bereich“ für Suche, Startseite, Cockpit und Verknüpfungen (U6, 2.28.39):
 * Fristen, Aufgaben und Erinnerungen → „Fristen und Aufgaben“ mit Ziel; Tagebuch-Einträge → Tagebuch mit Ziel;
 * Dokumente → Bibliothek mit Direkttreffer; Geschütztes → Gesundheitsbereich ohne Kennung; alles andere → Cockpit-Akte.
 */
export function zielFuerDatensatz(art: FamilyRecordType | "document", id: string, merkmale: { geschuetzt?: boolean; tagebuch?: boolean } = {}): MenuTarget {
  if (merkmale.geschuetzt) return { section: "health" };
  if (merkmale.tagebuch) return { section: "memory", targetId: id };
  return targetForRelation(art, id);
}

const commonDossierOrder: Array<FamilyRecordType | "document"> = [
  "task", "deadline", "document", "person", "organisation", "object", "case",
  "contract", "warranty", "payment", "event", "reminder",
];

export function dossierTypeOrder(ownerType: FamilyRecordType | "document") {
  const preferred: Partial<Record<FamilyRecordType | "document", Array<FamilyRecordType | "document">>> = {
    case: ["task", "deadline", "document", "person", "organisation", "object", "event", "contract", "warranty", "payment", "reminder"],
    object: ["case", "task", "deadline", "document", "contract", "warranty", "payment", "event", "person", "organisation", "reminder"],
    person: ["case", "task", "deadline", "object", "document", "contract", "warranty", "organisation", "payment", "event", "reminder"],
    document: ["case", "object", "person", "organisation", "deadline", "task", "contract", "warranty", "payment", "event", "reminder"],
  };
  return preferred[ownerType] || commonDossierOrder;
}

export function runMenuOptimizationSelfTests() {
  const allowedSections = new Set<MenuSection>([
    "documents", "inbox", "medical", "benefits", "work", "assessment", "correspondence",
    "sources", "health", "family", "home", "vehicles", "purchases", "reminders", "cockpit",
    "directory", "security", "help", "changelog", "versions", "systemcheck", "memory",
  ]);
  const actionTests = Object.entries(menuPageActions).map(([page, actions]) => ({
    id: `menu-${page}`,
    label: `${page} – Hauptaktionen`,
    passed: actions.length >= 3 && actions.every((action) => allowedSections.has(action.section) && !!action.label && !!action.detail),
    summary: `${actions.length} sichtbare Aktionen führen zu registrierten Bereichen.`,
  }));
  const relationTests = [
    { id: "menu-document-link", label: "Dokumentverknüpfung", passed: targetForRelation("document", "DOC-1").section === "documents" && targetForRelation("document", "DOC-1").targetId === "DOC-1", summary: "Dokument führt mit Kennung in die Dokumentenbibliothek." },
    { id: "menu-case-link", label: "Vorgangsverknüpfung", passed: targetForRelation("case", "VORG-1").section === "cockpit" && targetForRelation("case", "VORG-1").targetId === "VORG-1", summary: "Vorgang führt mit Kennung in die Vorgangsakte." },
    { id: "menu-object-link", label: "Objektverknüpfung", passed: targetForRelation("object", "OBJ-1").section === "cockpit" && targetForRelation("object", "OBJ-1").targetId === "OBJ-1", summary: "Objekt führt mit Kennung in die Objektakte." },
    { id: "menu-person-link", label: "Personenverknüpfung", passed: targetForRelation("person", "PER-1").section === "cockpit" && targetForRelation("person", "PER-1").targetId === "PER-1", summary: "Person führt mit Kennung in die Personenakte." },
    { id: "menu-deadline-link", label: "Fristenverknüpfung", passed: targetForRelation("deadline", "FRIST-1").section === "reminders", summary: "Frist führt in die aktive Fristenansicht." },
    { id: "menu-dossier-order", label: "Vorgangs-, Objekt- und Personenpriorität", passed: dossierTypeOrder("case")[0] === "task" && dossierTypeOrder("object")[0] === "case" && dossierTypeOrder("person")[0] === "case", summary: "Detailakten ordnen aktuellen Status, Aufgaben, Fristen und Dokumente vor Zusatzinformationen." },
  ];
  return [...actionTests, ...relationTests];
}
