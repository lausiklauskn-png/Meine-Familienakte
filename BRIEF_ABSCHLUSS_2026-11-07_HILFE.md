# Abschluss 07.11.2026: Plansitzung und Sitzung 1 (Hilfe) – Fassung 2.28.33

Die Sitzung begann als Plansitzung nach Klaus' Liste und wurde nach seiner Freigabe („Du kannst dann mit dem Bau fortfahren …
nach jeder Sitzung einmal online stellen“) zur ersten von drei Bausitzungen. Plan: `docs/PLAN_2026-11-07.md` (#116).

## Was getan wurde

- **Plan** (#116): Klaus' Punkte 1–10, alle Fragen a–t beantwortet. Drei Bausitzungen: 1 Hilfe (2.28.33), 2 Daten (2.28.34),
  3 E-Mail (2.28.35).
- **2.28.33** (#117, je Paket ein Commit, ein PR, weil nur ein Sitzungszweig):
  - **P1 Inhalt:** Bestandsaufnahme als Vorschau (`docs/vorschau/hilfe-bestand-2.28.33.html`,
    https://claude.ai/artifact/JShcdGb1oJTJPr9WkVJFSX); 13 neue Themen (`app/hilfe-themen.tsx`), veraltete Texte berichtigt,
    drei Mikrofon-Themen zu einem, „Wie schützt die Familienakte meine Daten?“ mit Fassung aus `package.json`, Versionshistorie mit
    echter Fassung und Liste der Fassungen (`lib/fassungen.ts`), Knopf „Neu“ mit Eintrag, CI-Grenze `pruefung` 30 → 45 min.
  - **P2 Gestaltung:** Zurück an die Stelle, markiert bis zum nächsten Tipp (`app/ruecksprung.ts`); Sprung aus der Hilfe mit rotem
    Rahmen, grün wenn am Ziel alles erledigt ist (`data-ziel-stand`); 48 Kartenhilfen mit Sprung (`lib/ui-help-ziele.ts`);
    Benutzerabnahme als Bild mit vier Antworten Klappt · Klappt nicht · Noch nicht probiert · Gilt hier nicht
    (`app/benutzerabnahme-hilfe.tsx`); mitwandernde Seitenleiste rechts (`app/seitenleiste.tsx`); „Wo liegt was?“ mit Symbol.
  - **P3 Ordnung:** „Wie kann ich dir helfen?“ oben in der Hilfe, Gruppen (passend zur letzten Seite · Einrichten · Arbeiten
    Schritt für Schritt · Allgemeines · schon eingerichtet · Fachliches), A–Z (`lib/hilfe-ordnung.ts`, `app/hilfe-ordnung.tsx`).
  - **Klaus' Hinweise nach den Bildschirmfotos** (https://claude.ai/artifact/YZYmY1NM8LAuccFB6hSZLs): Demo-Kasten nur
    „Demo starten“, Erklärung hinter dem „?“; Erklärsatz unter „Kurzhinweise“ entfernt; grüner Rahmen bei erledigt.
- **Ausgegeben:** 2.28.33 als APK, Windows (beide `server=ja`) und PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.33.json`.

## Geprüft

- `npm run build` mit allen Fachprüfungen grün; neue Proben ruecksprung 8/0, hilfe-gestaltung 22/0, hilfe-ordnung 26/0;
  Benutzerabnahme-Prüfung 39/39.
- Volle UI-Probe lokal 59/60: `pro-dokumente` rot – genauso auf dem unveränderten `main`; die Umgebung hier schließt den Browser
  beim Neuladen. In der CI grün.
- CI auf #117: 6/6 grün (e3bed4c). Zuvor rot: Android- und Windows-Geräteprobe klickten im Demo-Kasten das neue „?“ statt des
  Start-Knopfs; behoben mit `data-demo-start` und angepassten Proben.
- Bildschirmfotos bei 390 px angesehen; zwei Korrekturen daraus (Frage-Feld nach oben, große Karten mit dem Anfang ins Bild).

## Nicht geprüft / offen

- Kein Gerät: Seitenleiste neben der Android-Randgeste, Rücksprung am Tablet, rote/grüne Rahmen, Hilfe-Suche mit Diktat.
- Grüner Rahmen bei „alles erledigt“ ohne Probe (die Beispielfamilie hat immer offene Punkte).
- Hilfe-Suche ohne Modell (Stichworte); Stufe 2 mit der Bedeutungssuche später.
- Übrige Punkte unverändert: siehe CLAUDE.md „Offen“.

## Für Sitzung 2 (Daten) neu von Klaus

- **Demo = Kopie der eigenen Daten** (Punkt 3): sind eigene Daten da, arbeitet die Demo an einer Kopie; sonst Beispielfamilie.
- **Punkt 10 Abgleich zwischen den eigenen Geräten:** 10a Synchronisierung Handy ⟷ Tablet ⟷ PC ohne Datei (Nähe/WLAN), 10b
  Paket per Teilen (Signal, Mail), **immer mit Passwort verschlüsselt** (Klaus' Entscheidung). Erst Vorschlagsrunde als Vorschau.

## Stundennachweis

Spanne aus Reflog-, Commit- und Laufzeiten, Obergrenze; Pausen nicht abgezogen, Klaus' eigene Angabe geht vor. Zeiten in MEZ.

| Block | von | bis | Dauer | Inhalt |
|---|---|---|---|---|
| 1 | 09:04 | 10:00 | 56 min | Lesen, Klaus' Punkte 1–10 untersuchen, Plan, Fragen |
| 2 | 10:00 | 13:00 | 3 h 00 min | Plan auf main (#116), P1–P3 bauen, Proben, volle UI-Läufe, Bildschirmfotos, CI |
| 3 | 13:00 | 13:39 | 39 min | Klaus' Hinweise, CI-Fehler Demo-Knopf, Zusammenführen (#117) |
| 4 | 13:39 | ENDE | DAUER4 | Ausgabe 2.28.33, Downloads prüfen, Nachweis, Abschluss, KimHub |

Zusammen: 09:04 bis ENDE = **GESAMT**.

## Startauftrag zum Einfügen

```
Familienakte – Sitzung 2 (Daten), Brief vom 07.11.2026.
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-07_HILFE.md, docs/PLAN_2026-11-07.md (Punkte 1, 2, 3, 10; Pakete P4–P7).
Stand: 2.28.33 auf main und ausgegeben (APK, PWA, Windows); nächste freie Fassung 2.28.34. Bau ist freigegeben (Klaus 07.11.),
am Ende der Sitzung einmal ausgeben (APK, PWA, Windows, server=ja).
Reihenfolge: P4 Gerätegrenze aus der vorhandenen Geräteprüfung, Fotos verkleinern nie unter 300 dpi mit Texterkennungs-Gegenprobe,
nur „Verkleinern“ oder „Abbrechen“, Dateiausgabe 100 MB → P5 Vollsicherung auf Android und Windows in frei gewählten Ordner,
Programm dazu (APK; Windows Lies-mich mit Download und SHA-256) → P6 Sicherung einlesen (nur in leere Akte, Probe ohne Schreiben;
mit BookLedgerPro/Private Brain Pro nur vergleichen) → P7 Demo als Kopie der eigenen Daten (ohne eigene Daten Beispielfamilie;
vor dem Übernehmen Liste „Was ändert sich?“) → Punkt 10 Abgleich zwischen den Geräten: erst Vorschlagsrunde als HTML-Vorschau
(10a Synchronisierung ohne Datei, 10b Paket per Teilen, immer mit Passwort verschlüsselt).
Sichtbare Änderungen erst als HTML-Vorschau zeigen. Je Paket ein Commit; keine Prüfungen abschalten.
Nicht: Schlüssel/Tokens in Dateien oder Chat, Forschung im Repo (nur KimHub).
Am Ende Abschlussbrief mit Stundennachweis und KimHub-Eintrag.
```
