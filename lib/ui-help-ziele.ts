import type { SectionId } from "../app/portal-types";

/**
 * Wo jede Karte aus „Hilfe zu Karten und Funktionen“ (lib/ui-help.ts) in der App steht (Plan 07.11.2026, 6a Stufe 1).
 * Ein Tipp öffnet die Seite und rahmt die Karte rot, deren „?“ den gleichen Titel trägt. Fehlt die Karte gerade
 * (leere Liste, Fenster noch zu, gesperrter Bereich), bleibt es bei der Seite.
 */
export const UI_HELP_ZIEL: Readonly<Record<string, SectionId>> = {
  "Diagnosen und ICD-Codes": "medical", "Behandelnde Ärzte und AU-Zuordnung": "medical", "Arbeitsunfähigkeitszeiten": "medical",
  "Leistungen der Krankenkasse": "medical", "Fristdiagnosen": "medical",
  "Arbeitsverlauf": "work", "Zugeordnete Arbeitsunterlagen": "work",
  "Vorhandene Notizen": "cockpit", "Gemeinsame Vorgangschronologie": "cockpit", "Was ist noch offen?": "cockpit",
  "Was ist jetzt wichtig?": "cockpit", "To-do-Liste": "cockpit", "Dokumente, Memories und Vorgänge": "cockpit",
  "Offene Vorgänge": "cockpit", "Objektakten": "cockpit", "Neu hinzugekommen": "cockpit",
  "Vorhandene Datensätze verknüpfen": "memory", "Erkannte Aussagen prüfen": "memory", "Nur nach Bestätigung anlegen": "memory",
  "Unbehandelte Memory-Ereignisse": "memory", "Zwei getrennte Arbeitslisten": "memory", "Offene Memory-Punkte": "memory", "Chronologie": "memory",
  "Zuordnung prüfen und bestätigen": "inventory", "Testakte für Weiterentwicklung": "inventory", "Inkrementell prüfen": "inventory",
  "Was möchtest du tun?": "help", "Wie suche ich etwas?": "overview", "Technische Änderungen": "changelog",
  "Andere Lebensbereiche": "family", "Neue Unterlage": "home",
  "Alle ansehen": "documents", "Lokale Unterlagen": "inbox", "Online-Altbestand": "inbox",
  "OneDrive auf PC oder USB sichern": "security", "Familienakte exportieren": "security",
  "Frist oder Aufgabe anlegen": "reminders", "Offene Fristen und Aufgaben": "reminders",
  "Dokumentenbibliothek": "sources", "Zentrale Unterlagen": "sources",
  "Neue Unterlage prüfen und lokal ablegen": "inbox", "Neue Unterlagen erfassen": "inbox", "Eingänge prüfen": "inbox", "Dokument fotografieren": "inbox",
  "Was möchtest du klären?": "assistant", "Praktische Einordnung": "assistant", "Schreiben / E-Mail erstellen": "assistant", "Gespeicherte Korrespondenz": "assistant",
};
