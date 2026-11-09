# Abschluss 09.11.2026: Rückmeldung vom Handy umgesetzt (A–D) – Fassung 2.28.49

Auftrag: Startauftrag im Nachtrag von `BRIEF_ABSCHLUSS_2026-11-09_ABGLEICH-B-I.md` (jetzt im Archiv). Plan:
`docs/PLAN_2026-11-09_GERAETETEST-RUECKMELDUNG.md`. Der Freibrief vom 08.11. galt. Klaus hat in der Sitzung alle sieben Fragen
der Vorschau C/D mit Ja beantwortet. In der Sitzung kamen zwei neue Rückmeldungen von Klaus dazu, beide
behoben: Ein eingesprochenes Datum kam bei der Erinnerung nicht an, und „Ausloggen“ tat sichtbar nichts.

## Was gebaut wurde (PR #142, je Abschnitt ein Commit)

| Abschnitt | Inhalt |
|---|---|
| A · Fehler | **A1** Kacheln im Startkopf deckend statt durchscheinend, kein `backdrop-filter`, Verbergen beim Sprung höchstens 250 ms · **A2** „Zuordnung prüfen“ klappt die erste Verknüpfung auf und markiert sie · **A3** war seit 2.28.39 behoben (Gerät hatte 2.28.37); „Tagebuch öffnen“ auf der Tagebuch-Seite selbst führte ins Leere (seit C ersetzt durch das Buch oben) · **A4** lange Titel in der Assistenz brechen um · **A5** Cockpit öffnet Bearbeitbares direkt als Fenster (Aufgabe/Frist/Erinnerung: `TerminBearbeiten`; Person/Organisation/Objekt/Vorgang: neues `StammBearbeitenFenster`), Schließen lässt die Stelle stehen, „Ganze Akte ansehen ›“ |
| B · Muster | Gemeinsame Bausteine: B1 ein CSS-Block „Schlagwort oben links“ · B2 `InfoZeile` · B3 `SuchFeld` (Mikrofon als eigener Knopf, Lupe nur wo nötig) · B4 Erklärsätze ins „?“ · B5 `HinweisText` (`lib/hinweis-text.ts`: Kern fett, übrige Sätze als Punkte – gilt für alle rund 100 Fragezeichen) · B6 `FlachText ganz` (aufgeklappt keine zweite Kopie) · B7 `quelleAnzeige` (Name und Sprung statt „EVENT-000005“) |
| C · Tagebuch | Kopf: „Erinnerung“ (statt „Notiz“) und Buch (Wort „Buch“, sonst passt der Name am Handy nicht) · ein Erfassungsblock (Feld, Foto, Stimmung als fünf Gesichter, Person/Organisation, „Eintrag prüfen“, klein „Noch einen erfassen“) · Zähler nur auf der Tagebuch-Seite und nur größer null · „Memory“ aus der Oberfläche (gespeicherte Werte wie die Quelle „Tagebuch & Erinnerungsprotokoll“ und die Versionshistorie unverändert) · Stimmung und Vorwahl im Datenmodell, Stimmung in der Suche · „Aus deinem Tagebuch“ beim Termin und in der Akte derselben Person/Organisation |
| D · Assistenz | Drei Wege („In der Akte nachsehen“, „Brief oder E-Mail beantworten“, „Vorgang oder Termin vorbereiten“), Kasten „Aktuell recherchiert“ entfernt · Briefweg (`app/brief-antwort.tsx`, `lib/brief-antwort.ts`) mit dem Weg und Auftrag aus Private Brain Pro („KI beim Schreiben“); Modul 25 lag schon byte-gleich im Repo · Leckprüfung vor jedem Weg; Kopieren, Direktlink ChatGPT/Claude (Klaus' Notiz zu d2), eigener Schlüssel nur Mistral (EU) nach Rückfrage, Schlüssel ab Werk nur im Speicher · Antwort mit echten Angaben zurück, unbekannte Platzhalter gemeldet · als Entwurf speichern oder als PDF in Workflow PDF (`lib/text-pdf.ts`, eigener kleiner PDF-Schreiber), auch je gespeichertem Brief |
| Nachtrag | **Ausloggen schließt die App** (Klaus: „Türchen auf, raus, App schließen“; vorher sperrte es nur den Pro-Tresor und lud neu, die App flackerte): Android `FamilienakteAppPlugin.beenden` (finishAndRemoveTask), Windows schließt das Fenster (`core:window:allow-close`), im Browser und in der Web-App (Klaus' Fall am Android-Handy) deckt eine Abmeldeseite alles zu – am `<body>` eingehängt, weil die Kopfleiste am Handy nach dem Tipp zuklappt und die Seite sonst mit versteckt hätte. |
| Nachtrag | Erinnerung: eingesprochenes Datum („am 15. November“, „am fünfzehnten November“, „15.11“, „am zwanzigsten“, Wochentag allein) kommt als Tag an; „um 10.30 Uhr“ bleibt eine Uhrzeit; Titel ohne Datum. Vorher kannte die Erkennung nur „15.11.“ mit zwei Punkten. |

Entscheidungen nach dem Freibrief:
- Bearbeitung als Fenster statt als eigene Seite. Schließen führt mit einem Tipp an dieselbe Stelle zurück.
- „Erinnerung“-Knopf ohne Rückfrage, weil daneben ein eigener Knopf für das Tagebuch steht.
- Namen aus der Akte werden beim Briefweg immer verdeckt.
- Unter dem Tagebuch-Symbol steht „Buch“ statt „Tagebuch“, weil am Handy (360 px) sonst der Name „FAMILIENAKTE“ nicht ganz hineinpasst.
- Die festen „Import:“/„Ausfüllen:“-Zeilen in der Eingangszentrale bleiben, weil Klaus sie früher so gewollt hat.

## Geprüft

- Neue Proben, alle grün:
  - `rueckmeldung-a` 8
  - `rueckmeldung-b` 12
  - `rueckmeldung-c` 7
  - `rueckmeldung-d` 9 (Mistral und ChatGPT gestellt)
  - `erinnerung-datum` 2
  - `ausloggen` 3 (Handy)
- Neue Fachprüfungen:
  - `run-brief-antwort-tests`: 8 Prüfungen mit dem echten Modul 25, dazu 4 zum PDF. Das PDF wurde zusätzlich mit pypdf gelesen.
  - Erkennung gesprochener Daten in `run-kalender-tests`: 12 Fälle.
- Nachbarproben lokal grün, darunter `pfad`, `sprungweg`, `knoepfe-*`, `hilfe-alle`, `app-landkarte`, `kopf-leiste`, `private-meaning`, `notiz`, `rundgang` und `mein-kalender`.
- `npm run check` grün, Lint 0 Fehler.
- CI-Funde:
  - Lint-Fehler im B-Commit: ich hatte nur die letzte Zeile der Lint-Ausgabe gelesen.
  - Windows-Modellprobe: Die Bedeutungssuche leerte die getippte Frage, wenn der Speicher erst danach bereitstand. Für Nutzer war das ebenfalls ein Fehler. Behoben.
  - Probe A2 maß in der CI direkt nach dem Klick, bevor hingerollt war. Sie wartet jetzt bis 3 s auf denselben Endzustand.
  - Drei ältere Proben gingen noch die alten Wege. Eine davon, `kalender-einlesen`, enthielt eine Zeitbombe: Ein fester Zeitpunkt „09.11.2026 11:00 UTC“ lief ab. Behoben, ohne eine Zusicherung abzuschwächen.
- Startseiten-Prüfwert (`START_PAGE_REFERENCE_SHA256`): neu eingetragen, weil Klaus die Änderungen B4 und C freigegeben hat.

## Ausgabe

Fassung **2.28.49** auf allen drei Wegen, nach dem Merge von #142 (main `942478f`), Nachweis `docs/VEROEFFENTLICHUNG-2.28.49.json`:

| Weg | Lauf | Datei | Bytes | SHA-256 (anonym geladen, = SHA256SUMS) |
|---|---|---|---|---|
| Android | 42628437806 success, Update-Server success | `Familienakte-android-v2.28.49.apk` (innen 2.28.49 / 942478f) | 20 025 377 | `c9c66e84…d020` |
| Android | – | `Familienakte-Einzeldatei-2.28.49.html` | 3 879 584 | `ab888dac…c701` |
| Windows | 42628442354 success, Job `server` success, `latest.json` nennt 2.28.49 | `Familienakte-Windows-2.28.49-x64-setup.exe` | 34 170 636 | `84006151…320f` |
| PWA | Pages Läufe 168 und 169 success auf 942478f | – | – | – |

Die PWA-Seite und family-projekt.de sind aus dem Sitzungsbehälter nicht erreichbar. Die Ausgabeläufe prüfen den Server selbst.

## Nicht geprüft

- **Nichts am Gerät.**
  - A1 (weiße Fläche) ist eine begründete Vermutung (durchscheinende Kacheln, längeres Verbergen beim Sprung), am Galaxy S21 nicht nachgestellt.
  - Kopf mit fünf Knöpfen und Tagebuch-Block nur im Browser bei 360/390 px geprüft.
  - Gesprochenes Datum nur mit gestellter Spracherkennung.
  - Ausloggen: dass sich die APK wirklich beendet und das Windows-Fenster wirklich schließt, ist nur gestellt bzw. im Bau geprüft.
- Briefweg:
  - nie mit einer echten KI und nie mit einem echten Mistral-Schlüssel benutzt;
  - ob ChatGPT/Claude den Text aus der Adresse übernehmen, hängt von deren Seiten ab (Weg aus dem KI-Auftrag);
  - Straßen ohne Hausnummer und freie Beschreibungen werden nicht erkannt (wie in Private Brain Pro).
- Gerätetest 2.28.48 (Plan Abschnitt E): Rückmeldungen von Klaus stehen aus.

## Stundennachweis

Spanne aus Nachrichten-, Commit- und Laufzeiten, Obergrenze, Pausen nicht abgezogen; Klaus' eigene Angabe geht vor.

| Block | Inhalt | Dauer |
|---|---|---|
| 1 | Lesen, Releases prüfen, Plan aus #141, Helfer für Private Brain Pro und Bestandsaufnahme B, Fehler A, Vorschau C/D (bis 0d0a8af 09:56) | ca. 30 min (09:30–10:00) |
| 2 | Muster B, Proben, PR #142 (87d23ea 10:05); Klaus' Antworten; Tagebuch C (793e153 10:27) | ca. 30 min |
| 3 | Assistenz D, PDF-Schreiber, Kopf am Handy, Fassung 2.28.49 (e8eae32 10:48, 82ed20f 10:50) | ca. 25 min |
| 4 | CI-Funde Windows und drei Proben (5eb52d5 11:04, 68133ce 11:48), Nachtrag gesprochenes Datum (1d7340e 12:03) | ca. 75 min |
| 5 | Probe A2 (0e90b27 12:43), Klaus' Rückmeldung Ausloggen (8b4f90a 13:07), CI-Läufe, Merge #142 (13:46), Ausgabe, Downloads geprüft, Nachweis, Brief | ca. 130 min (12:03–14:15) |

Gesamt: **ca. 4 h 45 min** (09:30–14:15 UTC, deutsche Zeit 10:30–15:15, Obergrenze). Davon entfielen grob 2 h auf Warten auf CI-Läufe (volle Probensuite je 30–40 min, viermal neu wegen eigener Pushes).

## Startauftrag zum Einfügen

```
Familienakte – Gerätetest 2.28.49 und 2.28.48 (Plan Rückmeldung Abschnitt E), Brief vom 09.11.2026 (Rückmeldung A–D).
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-09_RUECKMELDUNG-A-D.md, docs/PLAN_2026-11-09_GERAETETEST-RUECKMELDUNG.md,
docs/VEROEFFENTLICHUNG-2.28.49.json. Erst die tatsächlichen Releases prüfen; nächste freie Fassung 2.28.50.

Reihenfolge (Freibrief vom 08.11. gilt):
1. Rückmeldungen von Klaus zum Gerät (2.28.49 und offen aus 2.28.48: Vollsicherung, Festplatte, Netz-Abgleich, Kalender holen,
   Eingangsordner, Bedeutungssuche, Teilen, Paket) Punkt für Punkt: Fehler zuerst, je Fehler eine Probe mit soll().
2. Nachfassen 2.28.49 am Gerät: weiße Fläche (A1) am Galaxy S21, Cockpit-Bearbeitung, Kopf mit Buch am Handy,
   gesprochenes Datum bei der Erinnerung, Ausloggen (APK beendet sich, Windows-Fenster schließt, Web-App zeigt „Abgemeldet“),
   Brief beantworten mit echter KI (Kopieren und Direktlink).
3. Danach die E-Mail-Abstimmung (Plan 2.28.35, Entscheidungen Klaus/Jens) – zuerst Vorschau.
Am Ende APK, Windows und PWA ausgeben (Nachweis docs/VEROEFFENTLICHUNG-<fassung>.json), am Ende jeder Antwort Fortschritt in Prozent.

Regeln: Lint vor dem Push (ganze Ausgabe lesen, nicht nur die letzte Zeile); Oberfläche nur mit Klaus' Ja je sichtbarer Änderung
(Vorschau zuerst); keine Schlüssel in Dateien oder Chat; Forschung nur in KimHub. Am Ende Abschlussbrief mit Stundennachweis und
Startauftrag; Briefe archivieren, CLAUDE.md kürzen.
```
