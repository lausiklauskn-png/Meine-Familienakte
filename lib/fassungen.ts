/**
 * Ausgegebene Fassungen seit 2.28.1 (Android, Windows, PWA), je eine Zeile, neueste oben.
 * Die ältere Liste `versionHistory` in app/health-portal.tsx bleibt der interne Prüfstand (APP_VERSION 2.28.1).
 * Quelle: Release-Tags und docs/VEROEFFENTLICHUNG-<fassung>.json. Neue Fassung: oben eine Zeile ergänzen.
 */
export type Fassung = { fassung: string; datum: string; inhalt: string };

export const FASSUNGEN: Fassung[] = [
  { fassung: "2.28.38", datum: "08.11.2026", inhalt: "Listen mit Aufklappleiste (Pfeil ‹ auf, › zu): Haken, Stift, Mülleimer und Auge am Handy hinter dem Pfeil, breit direkt in der Zeile; „Anfang … Hauptwort“, Datum und Uhrzeit zusammen; Stift ändert auch Erinnerungen. Hilfe oben ein Kasten mit „Demo starten“ und Landkarten-Symbol, Landkarte immer als Karte. Kopf im geteilten Bildschirm ohne Überlagerung, weitere Knöpfe hinter dem Pfeil; „Installieren“ nur, solange die Web-App fehlt" },
  { fassung: "2.28.37", datum: "07.11.2026", inhalt: "Alle Hilfe-Themen als Bild zum Antippen mit höchstens drei fett hervorgehobenen Kernpunkten, langer Text eingeklappt unter „Ausführlich“; Vorschaufenster „Wo in der App?“ (Maus auf das Thema oder ▣) mit Skizze der Seite, Stelle rot, „Hingehen ›“" },
  { fassung: "2.28.36", datum: "07.11.2026", inhalt: "Landkarte der App ganz oben in der Hilfe (Stand je Kasten, Geändertes golden, am Handy als Liste), zehn Hilfe-Themen als Bild mit kurzen Merkpunkten, Android-App im Vollbild und in allen Lagen drehbar, Windows startet maximiert (F11 für ganz)" },
  { fassung: "2.28.35", datum: "07.11.2026", inhalt: "Hilfe „E-Mail in die Familienakte“ als Karte mit Verbindungen und Stand (fertig, geplant), Knopf „Neu“ mit „● Neu“ in der Hilfe, Hilfe-Text zu Fehlendem berichtigt" },
  { fassung: "2.28.34", datum: "07.11.2026", inhalt: "Daten: sichere Dateigröße je Gerät, Fotos verkleinern mit Texterkennungs-Gegenprobe, Ausgabe bis 100 MB, Vollsicherung auf Android und Windows mit Programm daneben, Sicherung einlesen, Demo als Kopie der eigenen Daten" },
  { fassung: "2.28.33", datum: "07.11.2026", inhalt: "Hilfe neu: 13 neue Themen, veraltete Texte berichtigt, „Wie kann ich dir helfen?“, Ordnung nach Schritten und A–Z, Sprung mit rotem Rahmen, Zurück an die Stelle markiert, Benutzerabnahme als Bild mit vier Antworten, Seitenleiste rechts" },
  { fassung: "2.28.32", datum: "06.11.2026", inhalt: "Mikrofon in der Notiz startet nur auf Tipp" },
  { fassung: "2.28.31", datum: "06.11.2026", inhalt: "Seitentitel immer einzeilig; Zähler-Kästchen springen zur Liste" },
  { fassung: "2.28.30", datum: "06.11.2026", inhalt: "Flach und breit: Seitenkopf in einer Linie, kleines „?“, Knopf „alle“, Listen mit Auge, Zähler als Kästchen" },
  { fassung: "2.28.29", datum: "06.11.2026", inhalt: "Abschnitte einklappen, Mülleimer an Erinnerungen und Notizen, Mikrofon bei „Woran erinnern“, Ton und Dauer der Glocke" },
  { fassung: "2.28.28", datum: "06.11.2026", inhalt: "Kamera in der Notiz, Glocke nach dem Speichern an, Android-Benachrichtigung auch bei geschlossener App" },
  { fassung: "2.28.27", datum: "05.11.2026", inhalt: "Mein Kalender, App-Glocke, Termin an Ort und Stelle ändern, Memory bearbeiten" },
  { fassung: "2.28.26", datum: "05.11.2026", inhalt: "Kalender schlanker, Knopf „Notiz“ mit erkannter Erinnerung, eigener Kalender je Erinnerung" },
  { fassung: "2.28.25", datum: "04.11.2026", inhalt: "Demo-Knopf, Scanner durchsuchbar, Sprung im Ordnerbaum, Tresor-Paket" },
  { fassung: "2.28.24", datum: "04.11.2026", inhalt: "Wo liegt was mit Zahlen, Private Bedeutungssuche, Bestand prüfen sichtbar, Kurzhinweise" },
  { fassung: "2.28.23", datum: "04.11.2026", inhalt: "Tresor-Erklärungen auf einen Blick, Kopfleiste am Handy, Demo-Schalter, Drucken, Aus- und Einloggen" },
  { fassung: "2.28.22", datum: "04.11.2026", inhalt: "Demo rot gekennzeichnet, ehrlicher Tresorstatus" },
  { fassung: "2.28.20–2.28.21", datum: "04.11.2026", inhalt: "Gesamtausgabe, Ordnung der Briefe" },
  { fassung: "2.28.18", datum: "04.11.2026", inhalt: "Prüfausgabe für Android" },
  { fassung: "2.28.17", datum: "03.11.2026", inhalt: "Android: App-Wechsel und Zurück, ohne die Arbeit wegzulegen" },
  { fassung: "2.28.16", datum: "03.11.2026", inhalt: "Basic erkennen, freie Menüs, Rückwege, kurze Hinweise" },
  { fassung: "2.28.15", datum: "02.11.2026", inhalt: "Pro: Update über den Update-Server" },
  { fassung: "2.28.11–2.28.14", datum: "01.11.2026", inhalt: "Workflow PDF in der App, Stapel, Briefkopf im Eingang" },
  { fassung: "2.28.9", datum: "01.11.2026", inhalt: "Workflow PDF als eigene Seite" },
  { fassung: "2.28.8", datum: "31.10.2026", inhalt: "Scanner beim Fotografieren, Eingang liest Text" },
  { fassung: "2.28.7", datum: "31.10.2026", inhalt: "Menüleiste bei mittlerer Breite, Diktat ohne Echo" },
  { fassung: "2.28.6", datum: "31.10.2026", inhalt: "Seite „Netz (Mycel)“" },
  { fassung: "2.28.5", datum: "31.10.2026", inhalt: "Suche abgesichert, Formular scannen, Gesundheit ausfüllen, Kontakt an Personen" },
  { fassung: "2.28.3–2.28.4", datum: "29.10.2026", inhalt: "Android-Ausgabe mit fester Signatur" },
];
