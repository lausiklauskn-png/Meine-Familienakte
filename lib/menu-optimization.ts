import type { FamilyRecordType } from "./family-data-model";

export const MENU_OPTIMIZATION_VERSION = 1 as const;
// Klaus 04.11.2026: Demo-Ablage und bewusst gewählten eigenen Tresor auf der Startseite unterscheiden.
// 2.28.39 (Navigation U6, U10, U11): Punkte im Objekt-Cockpit-Kasten und in „Zuletzt wichtig“ öffnen genau diesen Punkt.
export const START_PAGE_REFERENCE_SHA256 = "0d028ad02913383883d187c7c57326a17dd3fc35ea0ce1b6af64a0e534af54b4";

export type MenuSection =
  | "documents" | "inbox" | "medical" | "benefits" | "work" | "assessment"
  | "correspondence" | "sources" | "health" | "family" | "home" | "vehicles"
  | "purchases" | "reminders" | "cockpit" | "directory" | "security" | "help"
  | "changelog" | "versions" | "systemcheck" | "memory";

export type MenuTarget = { section: MenuSection; targetId?: string };
/** anker: Stelle auf der Zielseite, zu der der gemeinsame Sprungweg rollt (U2, 2.28.39). */
export type MenuAction = MenuTarget & { label: string; detail: string; query?: string; area?: string; anker?: string };

export const menuPageActions = {
  health: [
    { label: "Diagnosen, AU & ICD-Codes", detail: "Medizinische Akte: Diagnosen, AU-Zeiten und Ärzte", section: "medical" },
    { label: "Gesundheitsdokumente", detail: "Geschützte Unterlagen in der Bibliothek", section: "documents", area: "Gesundheit" },
    { label: "Fristen und Aufgaben", detail: "Offene gesundheitliche und berufliche Punkte", section: "reminders" },
    { label: "Im Cockpit anzeigen", detail: "Datensparsame Arbeitsübersicht", section: "cockpit" },
  ],
  family: [
    { label: "Tagebuch und Erinnerungen", detail: "Ereignisse festhalten und offene Punkte klären", section: "memory" },
    { label: "Personen über ihre Vorgänge", detail: "Noch keine eigene Personenliste – Personen öffnen sich aus ihren Vorgängen", section: "cockpit", anker: "#cockpit-cases" },
    { label: "Gemeinsame Vorgänge", detail: "Offene Vorgänge im Cockpit", section: "cockpit", anker: "#cockpit-cases" },
    { label: "Termine und Fristen", detail: "Offene, fällige und erledigte Punkte", section: "reminders" },
    { label: "Familienunterlagen", detail: "Dokumente dieses Lebensbereichs", section: "documents", area: "Familie & persönliche Unterlagen" },
  ],
  home: [
    { label: "Dokumente", detail: "Unterlagen zu Haus und Wohnung", section: "documents", area: "Haus & Wohnung" },
    { label: "Vorgänge und Objekte", detail: "Offene Vorgänge und Objektakten im Cockpit", section: "cockpit", anker: "#cockpit-cases" },
    { label: "Fristen und Aufgaben", detail: "Termine und Wiedervorlagen", section: "reminders" },
  ],
  vehicles: [
    { label: "Dokumente", detail: "Fahrzeug- und Motorradunterlagen", section: "documents", area: "Fahrzeuge" },
    { label: "Objektakten im Cockpit", detail: "Alle Objekte, auch Fahrzeuge – nicht nach Fahrzeugen gefiltert", section: "cockpit", anker: "#cockpit-objects" },
    { label: "Fristen und Aufgaben", detail: "TÜV, Wartung und Wiedervorlagen", section: "reminders" },
  ],
  purchases: [
    { label: "Dokumente", detail: "Rechnungen, Garantien und Geräteunterlagen", section: "documents", area: "Rechnungen & Garantien" },
    { label: "Objektakten im Cockpit", detail: "Alle Objekte, auch Geräte – nicht nach Geräten gefiltert", section: "cockpit", anker: "#cockpit-objects" },
    { label: "Fristen und Aufgaben", detail: "Garantieenden und Wiedervorlagen", section: "reminders" },
  ],
  medical: [
    { label: "Gesundheitsdokumente", detail: "Geschützte Originalunterlagen anzeigen", section: "documents", area: "Gesundheit" },
    { label: "Krankenkasse und Leistungen", detail: "Leistungszeiten und offene Klärungen", section: "benefits" },
    { label: "Arbeit und Arbeitgeber", detail: "Arbeitsverlauf und Arbeitszeiten", section: "work" },
    { label: "Im Cockpit anzeigen", detail: "Datensparsame Aufgabenübersicht", section: "cockpit" },
  ],
  benefits: [
    { label: "Krankenkasse-Unterlagen", detail: "Leistungsauskunft und Antworten suchen", section: "documents", query: "Krankenkasse Leistung" },
    { label: "Anfragen und Antworten", detail: "Schriftverkehr chronologisch öffnen", section: "correspondence" },
    { label: "Fristen und Aufgaben", detail: "Offene Antworten und Wiedervorlagen", section: "reminders" },
    { label: "Im Cockpit anzeigen", detail: "Aktuelle Vorgänge und Aufgaben", section: "cockpit" },
  ],
  work: [
    { label: "Arbeitsunterlagen", detail: "Arbeitgeber- und Anwesenheitsdokumente", section: "documents", query: "Arbeitgeber Arbeit Anwesenheit" },
    { label: "Bescheinigung und Anträge", detail: "Anträge, Bescheide und Behördenpost", section: "assessment" },
    { label: "Anfragen und Antworten", detail: "Arbeitsbezogenen Schriftverkehr öffnen", section: "correspondence" },
    { label: "Im Cockpit anzeigen", detail: "Vorgänge, Aufgaben und Fristen", section: "cockpit" },
  ],
  assessment: [
    { label: "Antragsunterlagen", detail: "Anträge und Bescheide", section: "documents", query: "Antrag Bescheid" },
    { label: "Anfragen und Antworten", detail: "Rentenversicherung-, Arbeitsagentur- und Arbeitgeber-Schriftverkehr", section: "correspondence" },
    { label: "Fristen und Aufgaben", detail: "Nachreichungen und Termine", section: "reminders" },
    { label: "Im Cockpit anzeigen", detail: "Laufende Vorgänge öffnen", section: "cockpit" },
  ],
  correspondence: [
    { label: "Schriftverkehr", detail: "Anfragen und Antworten als Dokumente", section: "documents", query: "Anfrage Antwort Krankenkasse Rentenversicherung Arbeitgeber" },
    { label: "Krankenkasse und Leistungen", detail: "Leistungszeiten und offene Klärungen", section: "benefits" },
    { label: "Fristen und Aufgaben", detail: "Offene Antworten und Wiedervorlagen", section: "reminders" },
    { label: "Im Cockpit anzeigen", detail: "Vorgänge und nächste Schritte", section: "cockpit" },
  ],
  sources: [
    { label: "Alle Dokumente", detail: "Zentrale Bibliothek vollständig öffnen", section: "documents" },
    { label: "Neue Unterlagen", detail: "Dokumente lokal ablegen und prüfen", section: "inbox" },
    { label: "Sicherheit", detail: "Lokalen Datentresor verwalten", section: "security" },
  ],
  inbox: [
    { label: "Dokumentenbibliothek", detail: "Vorhandene Unterlagen suchen", section: "documents" },
    { label: "Sicherheit", detail: "Lokalen Datentresor verbinden", section: "security" },
    { label: "Im Cockpit anzeigen", detail: "Neue und offene Dokumentvorgänge", section: "cockpit" },
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
