# Abschlussbrief 11.11.2026: Fassungen 2.28.57 bis 2.28.63, zuletzt gesammelt

Startbriefe dieser Sitzung: `BRIEF_SITZUNG_2026-11-11_KURZHINWEISE.md` und `BRIEF_SITZUNG_2026-11-11_FAMILIENAKTE-WEITER.md`
(jetzt in `docs/briefe-archiv/`). Neue feste Regel (Klaus 11.11.): **nicht nach jedem Umbau veröffentlichen** – sammeln, Proben
laufen lassen, gesammelt ausgeben; bei grün ohne Rückfrage ausgeben, wenn Klaus die Fassung freigegeben hat.

## Was gebaut und ausgegeben ist

| Fassung | PR | Inhalt |
|---|---|---|
| 2.28.57 | #158 | Tooltips mit Maus/Stift (`app/kurzhinweise.ts`), Zahl in der Legende, Landkarte als eigene Datei in der Geschenkbox, „Nur Neues prüfen“, „Neu“ › E-Mail öffnet die Karte |
| 2.28.58 | #160 | Vollsicherung auf SD: Zurücklesen misst Länge und SHA-256 selbst (`pruefenMitGeduld`), Fehler mit Grund |
| 2.28.59 | #163 | Ursache „Größe -1 statt 0“: Capacitors `getLong` verwirft `Integer` → `zahl()`; am Tablet bestätigt |
| 2.28.60 | #161 | Bsp.-Akten unter Hilfe › Demo, rotes Dreieck, nie in den Pro-Tresor, Vollsicherung ohne sie |
| 2.28.61 | #164 | Meine Geräte, Paket ohne Namensfeld, alte Einzelübergabe ausgeblendet, Dateiort mit „Pfad kopieren“ / „Im Explorer zeigen“ |
| 2.28.62 | – | nie ausgegeben, in 2.28.63 aufgegangen |
| 2.28.63 | #165 | rote Kästen (gesperrt → gelb „Entsperren“, App-Speicher → gelb „Tresor einrichten“, „Demo verlassen“), „+ Bsp.-Akten“ wieder lesbar, Textdurchsicht A–E (alte Namen, veraltete Sätze, lange Texte hinter „?“, „Neu“ nur letzte zwei Fassungen, kurze Meldungen), Rechtstexte (Impressum Family-Projekt, Datenschutz je Funktion, Haftungsausschluss), Systemprüfung (Stand dieser Fassung, Bericht 2.28.1 weg, Prüfzettel mit echter Fassung, ältere zugeklappt), Startfläche ohne altes „MMI“-Logo |

Nachweise `docs/VEROEFFENTLICHUNG-2.28.57.json` … `-2.28.61.json` (Downloads anonym, SHA-256 stimmen); 2.28.63 siehe dort.
Außerdem: **BookLedger Basic #45** – Pro nachgezogen auf `a705ed5`, Verbund-Karte jetzt byte-gleich (`eb857a6…`), PWA über Pages.

Nach 2.28.63 bereit (nicht ausgegeben): **#169** Sicherheitsseite kürzer, Probe `kalender-einlesen` ohne Wettlauf.

## Befunde für den Bau

- `call.getLong` in Capacitor-Plugins nie für kleine Zahlen (siehe 2.28.59); die UI-Proben stellen die Hülle in JS nach und sehen das nicht.
- CI `pruefung`: Ubuntu-Paketserver auf den Runnern zeitweise per DNS nicht erreichbar → `.github/workflows/ci.yml` lädt Chromium dann ohne Systempakete; Grenze 60 min.
- Probe `pro-tresor-einrichten` fand eine echte Lücke: Hinweisblase blieb nach dem Sprung offen über dem Zielknopf (in 2.28.60 behoben).
- `tests/ui/rundgang` schreibt `docs/analyse/inventar-laufend.json` neu – nach lokalen Läufen zurücksetzen, nicht committen.
- Startseiten-Prüfsumme `lib/menu-optimization.ts` und `scripts/run-system-check.mjs` prüfen wörtliche Texte; bei Textänderungen mitziehen.

## Nicht geprüft (am Gerät)

- 2.28.60–2.28.63 am Gerät: Bsp.-Akten, Meine Geräte zwischen zwei echten Geräten, Dateiort/Explorer unter Windows, gelbe Kästen am Tablet, neue Systemprüfung, Startfläche.
- Rechtstexte: Entwurf, keine Rechtsberatung; Rechtsform von Family-Projekt offen (heute „Inhaber Klaus Nitzsche“). Vor breiter Veröffentlichung Fachperson.
- „Testament“-Erinnerungen in Klaus' Akte stammen nicht aus den Beispieldaten der App (in keiner Fassung vorhanden); Bild von Klaus steht aus.

## Offen

- Cloud-Ordner (OneDrive für Jens): Antwort von Jens zu Weg A/B und Gerät.
- E-Mail: Entscheidungen e1–e10 aus der E-Mail-Karte.
- Rechtstexte als eine Quelle in alle Pro- und Basic-Apps (BookLedger, Private Brain, Workflow PDF, Workflow Calculate/Needs, Tresor-Leser, Kimboard/Kimseek, Geschenkbox).
- Graue Kästen der Landkarte, Baustand hinter Entwickler-Schalter, Sicherungen: „letzte 3 behalten“ (Frage an Klaus).

## Stundennachweis

| | |
|---|---|
| Erste Spur | 10.11.2026 ca. 17:00 UTC (Startbriefe) |
| Letzte Spur | 11.11.2026, Ausgabe 2.28.63 und dieser Brief (Zeit im KimHub-Eintrag) |
| Blöcke | 10.11. abends: 2.28.57 · 11.11. 07:20–10:50 Gerätetest SD-Sicherung, 2.28.58/2.28.59 · 07:40–12:50 Bsp.-Akten 2.28.60 · 11:00–13:50 Meine Geräte 2.28.61 · 13:20–16:30 rote Kästen, Textdurchsicht, Rechtstexte, Systemprüfung → 2.28.63; dazwischen BookLedger Basic, übrige Punkte |
| Obergrenze | gemessen am Zeitraum; Pausen und Wartezeiten der CI nicht abgezogen |

## Startauftrag

```
Familienakte, Fortsetzung nach 2.28.63 (11.11.2026). Lies CLAUDE.md und BRIEF_ABSCHLUSS_2026-11-11_GESAMMELT-2.28.63.md.
Regel: nicht nach jedem Umbau veröffentlichen – sammeln, Proben laufen lassen, gesammelt ausgeben (nur mit Klaus' Wort).
1. Gerätetest 2.28.63 von Klaus aufnehmen (Bsp.-Akten, Meine Geräte, Dateiort, gelbe Kästen, Systemprüfung, Startfläche, Rechtstexte).
2. PR #169 (Sicherheitsseite kürzer, Kalender-Probe) in die nächste gesammelte Fassung.
3. Rechtstexte: Rechtsform klären, dann eine gemeinsame Quelle für alle Pro- und Basic-Apps (Vorschau, Klaus' Ja, je Repo ein PR).
4. Cloud-Ordner nach Jens' Antwort; E-Mail nach e1–e10; graue Kästen; Baustand-Schalter.
Nicht: veröffentlichte Fassungen erneut ausgeben, byte-gleiche Bausteine von Hand ändern, Codex anstoßen. Forschung nur in KimHub.
```
