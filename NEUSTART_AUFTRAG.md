# Auftrag für eine neue Sitzung: „Meine Familienakte“ neu aufbauen

Bitte baue in diesem Repository eine neue Web-App „Meine Familienakte“ von Grund auf.
Es gibt keine Vorlage und keinen alten Code – alles wird neu geschrieben.

## Ziel

Eine private Familienakte im Browser, die Unterlagen, Termine und Aufgaben einer
Familie übersichtlich ordnet. Sie soll am PC und auf dem Handy gut bedienbar sein
und auf Deutsch sein.

## Funktionen

1. **Startseite** mit Suche (inkl. Spracheingabe über das Mikrofon), „Zuletzt wichtig“,
   anstehenden Fristen und schnellen Aktionen.
2. **Bereiche** mit eigener Übersichtsseite:
   Familie & Personen, Gesundheit, Arbeit, Wohnen, Fahrzeuge, Käufe & Garantien,
   Versicherungen, Finanzen, Dokumente, Hilfe.
3. **Dokumenteneingang**: Dateien hineinziehen oder auswählen, Kategorie vorschlagen,
   Benutzer bestätigt die Zuordnung.
4. **Dokumentenbibliothek** mit Filter und Suche.
5. **Tagebuch, Erinnerungen und Fristen** mit Kalenderansicht.
6. **Assistent**, der Schreiben und E-Mails als Entwurf vorbereitet (der Benutzer entscheidet).
7. **Lokaler Datentresor**: Daten bleiben im Browser bzw. in einem selbst gewählten
   Ordner; Sicherung und Wiederherstellung als Datei.
8. **Export** der Akte als Datei.
9. **Hilfe** mit kurzen Erklärungen zu jedem Bereich.

## Technik

- Moderne Web-App (z. B. React/Next.js oder Vite), ohne Abhängigkeit von einem
  bestimmten Hosting-Anbieter.
- Läuft lokal mit `npm install` und `npm run dev`.
- Später optional als installierbare App (PWA) oder Desktop-App.

## Beispieldaten – strenge Regeln

Alle Inhalte sind **frei erfunden** und müssen eindeutig als Beispiel erkennbar sein.

- Eine erfundene Beispielfamilie mit erfundenen Namen.
- **Orte, Straßen und Postleitzahlen, die es nicht gibt.**
- **Fahrzeuge mit erfundenen Marken- und Modellnamen** und erfundenen Kennzeichen.
- **Keine Ärzte, Praxen, Kliniken oder Fachrichtungen nennen** – auch nichts Verwandtes.
  Gesundheit nur ganz allgemein (z. B. „Vorsorgetermin“, „Impfpass“, „Brille“).
- **Keine echten Firmen, Krankenkassen, Versicherungen, Behörden oder Arbeitgeber.**
  Stattdessen Fantasienamen oder Oberbegriffe wie „Privatversicherung“ oder „Arbeitgeber“.
- **Alle Nummern erfunden** und in abweichender Länge bzw. offensichtlich ungültig
  (Kontonummern, Versicherungsnummern, Vertragsnummern, Telefonnummern).
- Keine echten Diagnosen oder Diagnosecodes.
- Erfundene Beispielgeschichten, z. B. eine kaputte Waschmaschine mit Garantiefall,
  ein Umzug, ein Fahrradkauf, eine Nebenkostenabrechnung, ein Schulausflug.
- Keine Bilder oder Dokumente aus echten Quellen; Platzhalterbilder selbst erzeugen.
- Hinweis in der App: „Alle Daten sind Beispieldaten.“

## Abgabe

Code committen und pushen, kurze README mit Startanleitung und einige Screenshots
der App (mit Beispieldaten) unter `docs/screenshots/`.
