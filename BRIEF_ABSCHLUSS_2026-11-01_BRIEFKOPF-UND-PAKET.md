# Abschluss 2026-11-01 (Fortsetzung): Fassungen 2.28.12–2.28.14, Briefkopf im Eingang, Paket für den Freund

Fortsetzung derselben Sitzung wie `BRIEF_ABSCHLUSS_2026-11-01_WORKFLOW-PDF-KLON.md` (dort Stück 1–3, 2.28.9–2.28.11).

## Klaus' Wünsche und Antworten in diesem Teil

| Wunsch / Frage | Antwort | gebaut |
| --- | --- | --- |
| Vier Fragen zum Stapel | ein Brief wählbar, Filter + Schärfe, Prüfbericht nur auf Wahl, Titel „Brief von …“ | 2.28.12 (#43) |
| Absender/Empfänger unterscheiden und einordnen | „ja“ zum Vorschlag | 2.28.13 (#44) |
| Unterschied Ausfüllen/Import war ein Rätsel | Unterzeile der Kacheln, **Design nicht brechen** | 2.28.14 (#45) |
| Alle Dateien in einer HTML wie das Geschenk für Jens, mit Bildern, eingekreist, Zeigehand, gespiegelt, Hände nicht übereinander | ja | Werkzeuge #45/#46, Datei nicht im Repo |

## Ergebnis

| Fassung | Inhalt | PR | veröffentlicht |
| --- | --- | --- | --- |
| 2.28.12 | Stapel: „ein Brief“, Zusammenfügen (Auswahl, Ziehen), Filter wie Workflow PDF + Schärfe, Prüfbericht auf Wahl, Titel aus dem Briefkopf | #43 | Android + Windows, server = ja |
| 2.28.13 | Eingang „Aus dem Briefkopf“: Absender, Empfänger, Nummer änderbar, Thema; Empfänger → Person, Absender → Organisation, Thema → Lebensbereich, gleiche Nummer → frühere Unterlage und deren Vorgang; Notiz merkt den Briefkopf | #44 | Android + Windows, server = ja |
| 2.28.14 | Kacheln: „Import: …“ (Foto, Stapel), „Ausfüllen: …“ (Formular); Höhe vorher/nachher 78/90 px gemessen gleich | #45 | Android + Windows, server = ja |
| — | `tools/paket/paketseite.py` (alle Fassungen eingebettet oder mit „-“ als Links), `tools/paket/bilder-aufnehmen.mjs` (Rahmen, Nummer, Zeigehand `zeigehand.png`) | #45, #46 | — |

Paket für den Freund: `Familienakte-2.28.14-Paket.html` (82 MB, alles eingebettet, Speichern mit SHA-256-Prüfung) und die schlanke
`Familienakte-2.28.14-Downloads.html` (1,8 MB, Links). Klaus hat die große Datei über den Download-Pfeil geladen. Beide nicht im Repo.

## Proben

- Lokal `npm run build` + `node tests/run-ui.mjs`: **32/32 grün**; lint 0 Fehler; check:android/windows/herkunft 0; `run-ausfuellen-tests` grün (+14 Briefkopf).
- Neu: `tests/ui/briefkopf-eingang.test.mjs` (10), Zeile „Kacheln sagen, wofür“ in `stapel.test.mjs`.
- Gegenproben `tests/gegenprobe-sitzung-b.mjs`: `Briefkopf2:` 5/5, `Kacheln:` 1/1 gefangen.
- Paket im Browser: 9 Bilder, 4 Downloads mit passender Prüfsumme, keine Seitenfehler.

## Nicht gemessen / Grenzen

- Briefkopf nur an erfundenen Briefen; schräge Scans und Handschrift; die Liste der Warteschlange zeigt den Briefkopf noch nicht.
- Kein Tablet, keine echte Amtspost.
- `workflow-pdf-bruecke` war auf #46 einmal in der CI rot (Wartezeit auf die Bibliothek des Klons), nach Neustart grün — Ursache nicht gesucht.
- `UI_BUILD=1 node tests/run-ui.mjs` baut nur `vite build` ohne `sw.js` → viele Proben rot an Seitenfehlern. Vorher `npm run build`.

## Stundennachweis (UTC; Ortszeit +1)

| Zeit | Arbeit |
| --- | --- |
| 02:15–03:20 | 2.28.12 fertig, voller Lauf, CI, Merge, Veröffentlichung |
| 03:20–04:20 | Briefkopf: Rechnung, Eingang, Proben, Gegenprobe, 2.28.13, CI, Merge, Veröffentlichung |
| 04:20–05:00 | Paket: Vorlage gelesen, Bildschirmfotos mit Markierung und Zeigehand, Bauer, Prüfung im Browser; Kachel-Unterzeilen 2.28.14 |
| 05:00–05:40 | 2.28.14 Proben, CI, Merge, Veröffentlichung, Paket 2.28.14, schlanke Fassung, #46 |
| 09:10–09:25 | Abschluss, Kimhub-Eintrag |

Dieser Teil ≈ **3 h 40** (Obergrenze, inkl. Warten auf CI und Proben); mit dem ersten Teil (≈ 1 h 30) ≈ **5 h 10**. Pause 05:40–09:10 nicht gezählt.
Klaus' eigene Angabe geht vor. Forschungseintrag: Kimhub `2026-11-01-familienakte-briefkopf-paket` (PR #421).

## Startauftrag zum Einfügen

```
Familienakte weiterbauen. Repo lausiklauskn-png/Meine-Familienakte, Branch wie vorgegeben, Deutsch.
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-01_BRIEFKOPF-UND-PAKET.md (Stand 2.28.14), docs/STAPEL.md.
Offen (je mit Klaus' Ja, sichtbare Änderungen nur mit Ja je Punkt):
1. Probe workflow-pdf-bruecke war in der CI einmal rot (Wartezeit auf #sc-bib) — Ursache suchen, nicht nur neu starten.
2. Briefkopf (Absender · Nummer) auch in der Liste der Warteschlange und im Stapel zeigen?
3. UI_BUILD=1 in tests/ui/_harness.mjs baut sw.js nicht mit — Rahmen auf npm run build umstellen.
4. Klaus' Tablet-Befunde zu 2.28.14 (Briefkopf mit echter Post, Stapel, Kacheln).
Paket für den Freund bei neuer Fassung: node tools/paket/bilder-aufnehmen.mjs <ordner> (nach npm run build), dann
python3 -I tools/paket/paketseite.py <fassung> <apk|-> <exe|-> <einzeldatei|-> <zip|-> <ordner> <ausgabe.html> („-“ = schlanke Fassung mit Links).
Nur fertige Stücke veröffentlichen (Probe + Gegenprobe + alle Proben + CI grün, Fassung +1, Android/Windows server = ja).
Nicht: Kern von Hand ändern, Forschung hier (nur Kimhub), Schlüssel/PINs in Dateien oder Chat, „Version 2.28.1“ ändern.
Am Ende Abschlussbrief mit Stundennachweis und Startauftrag.
```
