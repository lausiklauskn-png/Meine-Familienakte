import type { KartenChip, KartenGruppe, KartenKante, KartenKnoten } from "../app/landkarte";
import type { SectionId } from "../app/portal-types";

/**
 * Landkarte der ganzen App (Klaus 07.11.2026, Sitzung 4). Quelle: docs/landkarte/Familienakte-Landkarte.html, ohne Stift.
 * Eine Liste für alle Karten: die E-Mail-Hilfe nimmt ihre Wege hinein (MAIL_WEGE) von hier.
 * Der Stand steht nicht hier, sondern in lib/app-stand.ts. `seite` = wohin „Hingehen ›“ führt.
 */
export type KartenSeite = { seite?: SectionId };

export const MAIL_WEGE: Array<KartenChip & KartenSeite> = [
  { id: "mail-text", titel: "Mail teilen", wo: "Mail-App › Teilen", nach: "eingang", mehr: "Gmail- und Outlook-App teilen nur den Text; Anhänge gehen so nicht mit." },
  { id: "mail-anhang", titel: "Anhang teilen", wo: "Anhang antippen › Teilen", nach: "eingang", mehr: "Der übliche Weg für Briefe als PDF." },
  { id: "mail-pdf", titel: "Mail als PDF", wo: "Drucken › Als PDF › Teilen", nach: "eingang", mehr: "Geht mit jeder Mail-App." },
  { id: "mail-eml", titel: "Mail als Datei (.eml)", wo: "am Rechner hineinziehen", nach: "eingang", mehr: "Gmail oder Outlook im Browser: „Herunterladen“; Thunderbird: „Speichern unter“. Outlook-Dateien (.msg) werden angenommen, ihre Anhänge noch nicht herausgelöst." },
  { id: "mail-ms", titel: "Microsoft-Postfach", wo: "abholen und senden", nach: "eingang", beide: true, mehr: "Gleiche Anmeldung wie beim Kalender. Abholen nur auf Tipp; im Postfach wird nichts gelöscht oder verschoben." },
  { id: "mail-imap", titel: "GMX · WEB.DE · T-Online", wo: "mit App-Passwort", nach: "eingang", mehr: "Die Technik liegt in Private Brain Pro. Das Passwort bliebe verschlüsselt auf dem Gerät." },
  { id: "mail-gmail", titel: "Gmail direkt", wo: "Google-Prüfung kostet jährlich", nach: "eingang", mehr: "Bis zu einer Entscheidung: Anhang teilen oder Mail als PDF." },
];

export const APP_SPALTEN = ["Hinein", "Werkzeuge", "Eingang", "Prüfen", "Lesen", "Akte", "Speicher und Ausgabe", "Ziele"];
export const APP_BREITEN = [236, 172, 172, 172, 172, 172, 236, 172];

type Gruppe = Omit<KartenGruppe, "chips"> & { chips: Array<KartenChip & KartenSeite> };
export const APP_GRUPPEN: Gruppe[] = [
  { id: "g-mail", titel: "Mail einfügen", wo: "aus der Mail-App oder dem Postfach", spalte: 0, chips: MAIL_WEGE },
  { id: "g-datei", titel: "Datei einfügen", wo: "Kopf › Ablegen · Dokumente › Eingangszentrale", spalte: 0, chips: [
    { id: "kopf-ablegen", titel: "Ablegen im Kopf", wo: "Kopf › Ablegen › Fotografieren · Dateien · Ordner", nach: "eingang", seite: "inbox", mehr: "Ein Einstieg für alles: Fotos, Dateien oder ein ganzer Ordner landen in der Eingangszentrale zur Prüfung." },
    { id: "datei-waehlen", titel: "Datei wählen", wo: "Knopf in der Eingangszentrale", nach: "eingang", seite: "inbox" },
    { id: "datei-ziehen", titel: "Hineinziehen", wo: "am Rechner mit der Maus", nach: "eingang", seite: "inbox" },
    { id: "datei-teilen", titel: "Teilen aus anderer App", wo: "Galerie, Dateien › Teilen", nach: "eingang" },
    { id: "datei-oeffnen", titel: "Öffnen mit", wo: "Windows: Rechtsklick › Öffnen mit", nach: "eingang" },
    { id: "datei-pro", titel: "Aus anderen Pro-Apps", wo: "gemeinsames Fach im Pro-Tresor", nach: "eingang", seite: "security", mehr: "Braucht einen eingerichteten Pro-Tresor (z. B. mit Private Brain Pro, BookLedgerPro); nur in den Apps." },
  ] },
  { id: "g-scan", titel: "Dokumente scannen", wo: "Papier wird PDF", spalte: 0, chips: [
    { id: "scan-kamera", titel: "Einzelblatt mit der Kamera", wo: "Eingangszentrale › Dokument fotografieren", nach: "wfpdf", seite: "inbox" },
    { id: "scan-wfpdf", titel: "In Workflow PDF scannen", wo: "Dokumente › Workflow PDF", nach: "wfpdf", seite: "workflowpdf" },
    { id: "scan-stapel", titel: "Ganzer Stapel auf einmal", wo: "Eingangszentrale › Stapel direkt übernehmen", nach: "stapel", seite: "inbox" },
    { id: "scan-geraet", titel: "Scanner oder Scanner-App", wo: "PDF in den Stapel", nach: "stapel" },
    { id: "scan-formular", titel: "Formular scannen", wo: "Formular scannen › Ausfüllen", nach: "ausfuellen", seite: "inbox" },
  ] },
  { id: "g-selbst", titel: "Selbst erfassen", wo: "ohne Datei", spalte: 0, chips: [
    { id: "notiz", titel: "Notiz", wo: "Kopf › Notiz", nach: "direkt", mehr: "Schreiben, sprechen (Mikrofon nur auf Tipp), Fotos mit der Kamera. Ein erkanntes Datum wird nur nach Ja zur Erinnerung." },
    { id: "eintrag", titel: "Eintrag anlegen", wo: "in jedem Bereich (Person, Vertrag, Fahrzeug …)", nach: "direkt", seite: "directory" },
    { id: "frist-neu", titel: "Frist oder Aufgabe", wo: "Fristen und Aufgaben · Mein Kalender › + Eintrag", nach: "direkt", seite: "reminders" },
  ] },
  { id: "g-speicher", titel: "Wo es liegt", wo: "Speicher wie gewählt", spalte: 6, chips: [
    { id: "datentresor", titel: "Datentresor", wo: "Gerät, SD-Karte oder Laufwerk", beide: true, seite: "security", mehr: "Einmal wählen. Darin: 00_Register (Einträge, Fristen), 01_Dokumente (Originale), 03_Erinnerungsmedien (Fotos, Videos). Nie von Hand ändern." },
    { id: "browser", titel: "Speicher des Browsers", wo: "Web-App ohne gewählten Ordner", beide: true },
    { id: "protresor", titel: "Pro-Tresor", wo: "Sicherheit › Pro-Tresor · nur in den Apps", beide: true, seite: "security", mehr: "Originale verschlüsselt, gemeinsam mit den anderen Pro-Apps. Ein Passwort. Nur in der Android- und der Windows-App; die Web-App zeigt ihn nicht." },
    { id: "tresor-einschritt", titel: "Tresor einrichten in einem Schritt", wo: "nur Speicher wählen · Android-App", beide: true, seite: "security", mehr: "Hauptordner finden oder anlegen, ein Passwort, Lies-mich. In der Android-App: Sicherheit › Pro-Tresor › „Tresor einrichten – nur Speicher wählen“. In der Web-App gibt es keinen Pro-Tresor." },
  ] },
  { id: "g-aus", titel: "Ausgabe", wo: "von der Akte aus", spalte: 6, chips: [
    { id: "aus-antwort", titel: "Antwort schreiben", wo: "Assistenz › Schreiben / E-Mail", seite: "assistant", mehr: "Entwurf, Prüf-Haken, „Als versendet speichern“. Die App verschickt heute nie selbst." },
    { id: "aus-fristen", titel: "Fristen und Erinnerungen", wo: "Fristen und Aufgaben · Mein Kalender", seite: "reminders" },
    { id: "aus-sicherung", titel: "Vollsicherung", wo: "Sicherheit › sichern und testen", seite: "security", mehr: "Verschlüsselt mit Passwort und Notfallblatt oder lesbar; mit Prüfsummen; Android legt die APK bei, Windows einen Lies-mich mit Download." },
    { id: "aus-demo", titel: "Demo als Kopie", wo: "Hilfe › Demo starten", seite: "help", mehr: "Probieren an einer Kopie der eigenen Daten; das Original bleibt unverändert." },
    { id: "aus-drucken", titel: "Drucken", wo: "Menü › Seite drucken · am PC Strg+P" },
  ] },
];

export const APP_KNOTEN: Array<KartenKnoten & KartenSeite> = [
  { id: "wfpdf", titel: "Workflow PDF", wo: "Dokumente › Workflow PDF", unter: "Blatt finden, gerade ziehen, durchsuchbar", spalte: 1, seite: "workflowpdf", mehr: "Liefert in die Eingangszentrale („Weiter zur Prüfung“ oder Teilen). Bearbeitet auch Dokumente aus der Akte; das Ergebnis geht an denselben Eintrag zurück." },
  { id: "stapel", titel: "Stapel-Liste", wo: "Dokumente › Stapel (noch einordnen)", unter: "gerade gezogen · später einordnen", spalte: 1, seite: "stapel" },
  { id: "ausfuellen", titel: "Formular ausfüllen", wo: "nach „Formular scannen“", unter: "wird zur Unterlage in der Akte", spalte: 1 },
  { id: "direkt", titel: "Direkt in der Akte", wo: "ohne Eingangszentrale", unter: "was du selbst eingibst", spalte: 1 },
  { id: "eingang", titel: "Eingangszentrale", wo: "Dokumente › Eingangszentrale", unter: "alles kommt zuerst hier an · Eingangsordner in Blöcken · Mail-Anhänge einzeln", spalte: 2, mitte: true, seite: "inbox", mehr: "Original bleibt unverändert, Doppeltes wird erkannt. Eine Mail wird nur als Text gezeigt: kein Skript, keine Bilder aus dem Netz, kein Link öffnet sich von selbst." },
  { id: "pruefung", titel: "Prüfung der Anlagen", wo: "in der Eingangszentrale", unter: "Prüfer aus Workflow PDF · heute nur im Stapel", spalte: 3, mehr: "Geplant: Mail-Anhänge immer, sonst auf Wahl. Heute läuft die Prüfung nur auf Wahl im Stapel; bis dahin geht alles ohne diese Prüfung weiter zu „Lesen und Vorschlag“. Sucht Skripte und Startaktionen im PDF, eingebettete Dateien, Makros, getarnte Endungen, Programme. Kein Virenscanner." },
  { id: "vorschlag", titel: "Lesen und Vorschlag", wo: "Eingangszentrale › Zuordnung prüfen", unter: "echtes PDF: Text direkt · Scan: Texterkennung", spalte: 4, seite: "inbox", mehr: "Person, Vorgang, Dokumentart, mögliche Frist. Titel aus dem Briefkopf. Geplant: ein echtes PDF ohne Befund mit einem Tipp übernehmen." },
  { id: "befund", titel: "Befund", wo: "in der Eingangszentrale", unter: "nicht geöffnet · du entscheidest", spalte: 4, warn: true, mehr: "Als Datei ablegen (ohne Vorschau) oder weglassen. Programme werden nicht übernommen." },
  { id: "akte", titel: "In der Akte", wo: "Gesundheit, Familie, Wohnen, Fahrzeuge, Käufe …", unter: "nach deinem Tipp · verknüpft", spalte: 5, mitte: true, seite: "documents", mehr: "Mail und Anhänge bleiben eigene Dokumente und werden verknüpft." },
  { id: "mailapp", titel: "Mail-App des Geräts", wo: "öffnet sich vorbereitet", unter: "abschicken tust du dort", spalte: 7 },
  { id: "mssend", titel: "Microsoft-Postfach", wo: "nach „Jetzt senden?“", unter: "liegt dann in „Gesendete Elemente“", spalte: 7 },
  { id: "kalender", titel: "Kalender", wo: "Fristen › Kalender verbinden", unter: "Google, Microsoft, Gerät, .ics", spalte: 7, seite: "reminders", mehr: "Einmal verbinden. Fristen gehen hinaus; auf Wunsch kommen die Termine des Kalenders als Fristen herein (Schritt 5). Gesundheitsfristen mit echtem Titel, Notizen nie." },
  { id: "glocke", titel: "App-Glocke", wo: "Mein Kalender › App-Glocke", unter: "ab Werk an ohne Kalender · Android meldet auch bei geschlossener App", spalte: 7, seite: "reminders" },
  { id: "sicherungsordner", titel: "Sicherungsordner", wo: "frei gewählt, getrennt vom Datentresor", unter: "sichern · einlesen · gemeinsame Festplatte", spalte: 7, seite: "security" },
  { id: "anderes-geraet", titel: "Anderes Gerät", wo: "Sicherheit › Unterlage an ein anderes Gerät geben", unter: "gemeinsame Festplatte mit Kennung · im eigenen Netz (WLAN, Kabel) · Unterlage als Paket", spalte: 7, seite: "security", mehr: "Heute geht eine einzelne Datei als Paket (ohne Einträge und Fristen) oder die ganze Akte per Vollsicherung in eine leere Akte. Einträge zwischen zwei benutzten Geräten abgleichen: geplant." },
];

export const APP_KANTEN: KartenKante[] = [
  { von: "wfpdf", nach: "eingang" }, { von: "stapel", nach: "eingang" }, { von: "stapel", nach: "wfpdf", beide: true },
  { von: "wfpdf", nach: "akte", beide: true, unten: true }, { von: "ausfuellen", nach: "akte", unten: true }, { von: "direkt", nach: "akte", unten: true },
  { von: "eingang", nach: "pruefung" }, { von: "pruefung", nach: "vorschlag" }, { von: "pruefung", nach: "befund" }, { von: "vorschlag", nach: "akte" },
  { von: "akte", nach: "datentresor", beide: true }, { von: "akte", nach: "browser", beide: true }, { von: "akte", nach: "protresor", beide: true }, { von: "akte", nach: "tresor-einschritt", beide: true },
  { von: "akte", nach: "aus-antwort" }, { von: "akte", nach: "aus-fristen" }, { von: "akte", nach: "aus-sicherung" }, { von: "akte", nach: "aus-demo" }, { von: "akte", nach: "aus-drucken" },
  { von: "aus-antwort", nach: "mailapp" }, { von: "aus-antwort", nach: "mssend" }, { von: "aus-fristen", nach: "kalender", beide: true }, { von: "aus-fristen", nach: "glocke" },
  { von: "aus-sicherung", nach: "sicherungsordner", beide: true }, { von: "akte", nach: "anderes-geraet" },
  // Heutiger Weg ohne die geplante Anlagen-Prüfung (U13): direkt zu „Lesen und Vorschlag“.
  { von: "eingang", nach: "vorschlag", unten: true },
];

/** Alle Kennungen der Karte (für die Probe „Stand-Liste ↔ Karte“). */
export function appKartenIds(): string[] {
  return [...APP_GRUPPEN.flatMap((g) => g.chips.map((c) => c.id)), ...APP_KNOTEN.map((k) => k.id)];
}
