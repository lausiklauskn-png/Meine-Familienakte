import type { SectionId } from "../app/portal-types";

/**
 * Kartentitel je Seite für das Vorschaufenster der Hilfe (2.28.37, Weg A): die Skizze zeigt nur diese Titel, nie Daten.
 * Gemessen an der laufenden App (Titel der „?“-Erklärungen, leere Akte); die Probe tests/ui/hilfe-alle.test.mjs prüft, dass
 * jeder Titel auf seiner Seite noch vorkommt. Fehlt eine Seite, zeigt die Skizze nur ihren Namen. Seitentitel stehen nicht hier:
 * ein Sprung dorthin führt nur zur Seite (der Rahmen säße sonst auf dem kleinen „?“).
 */
export const SEITEN_KARTEN: Partial<Record<SectionId, string[]>> = {
  overview: ["Cockpit", "Zuletzt wichtig", "Datentresor und Sicherung", "Dokumenteneingang", "Was ist heute passiert?", "Lebensbereiche", "Systemprüfung"],
  inventory: ["Inkrementell prüfen"],
  cockpit: ["Was ist jetzt wichtig?", "To-do-Liste", "Dokumente, Tagebuch-Einträge und Vorgänge", "Offene Vorgänge", "Objektakten", "Neu hinzugekommen"],
  memory: ["Was ist heute passiert?", "Noch zu prüfende Tagebuch-Einträge", "Rückfragen zu gespeicherten Einträgen", "Heute im Überblick", "Chronologie"],
  reminders: ["Mein Kalender", "Frist oder Aufgabe anlegen", "Offene Fristen und Aufgaben"],
  inbox: ["Neue Unterlagen erfassen", "Eingänge prüfen", "Lokale Unterlagen", "Online-Altbestand"],
  security: ["Datentresor prüfen", "Vollständige Sicherung", "Export", "OneDrive auf PC oder USB sichern", "Unterlage an ein anderes Gerät geben", "Private Bedeutungssuche"],
  changelog: ["Was gibt’s Neues in der Familienakte?", "Technische Änderungen"],
  systemcheck: ["Praktische Benutzerabnahme", "Freigabeprüfung", "Gesamtergebnis", "Warnungen und Fehler", "Geprüfte Bereiche", "Prüfberichte"],
};
