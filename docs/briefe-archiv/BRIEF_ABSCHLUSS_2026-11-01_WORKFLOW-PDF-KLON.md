# Abschluss 2026-11-01: Workflow PDF als Klon, Brücke, Stapel direkt übernehmen

Schließt an `BRIEF_SITZUNG_2026-11-01_WORKFLOW-PDF-IN-FAMILIENAKTE.md` an. Forschung dazu nur in Kimhub (PR #421).

## Klaus' Antworten in dieser Sitzung

| Frage | Antwort |
| --- | --- |
| Weg | **B zuerst** (Klon der ganzen App), A später, wo die Akte tiefer greifen muss |
| Bibliothek des Klons | **getrennt** von der Workflow-PDF-PWA |
| Mycel im Klon | **weglassen** |
| Einstiege | **alle drei**: Menüpunkt „Workflow PDF“, „In Workflow PDF öffnen“ an Unterlagen, „Dokument fotografieren“ öffnet den Klon |
| Nachtrag Stapel | Massenscan direkt übernehmen: Ecken automatisch, gerade ziehen, nur Unklares nacharbeiten; Anhalten/Weiter/Abbrechen; schlanke Liste, große Vorschau erst beim Antippen; „Einordnen“ rechts oben; erst ablegen, später einordnen |

## Ergebnis

| Stück | Inhalt | Fassung | PR | veröffentlicht |
| --- | --- | --- | --- | --- |
| 1 | Klon `public/apps/workflow-pdf/` (byte-1:1, 77 Dateien, Workflow-PDF `fb85507`), Brücke (eigene DB `FamilienakteWFPDF1`, `fa_wfpdf_*`, kein Worker, ⟳ ohne fremde Vorräte), Akte-Farben, kein Mycel, Menü Dokumente → „Workflow PDF“; Tesseract/Scanic nur einmal im Paket | 2.28.9 | #41 | Android ✓ (server = ja), Windows ausgelöst (server = ja) |
| 2 | Brücke: Teilen im Klon → Eingangszentrale · „In Workflow PDF öffnen“ (nicht bei Gesundheit) · „Dokument fotografieren“ → Klon mit Scanner, Scan gleich in die Prüfung | 2.28.11 | #42 | nach CI |
| 3 | Stapel direkt übernehmen: Seite „Stapel (noch einordnen)“, Eingangszentrale-Knopf, IndexedDB `FamilienakteStapel1` | 2.28.11 | #42 | nach CI |

Stücke 2 und 3 gehen gemeinsam als 2.28.11 hinaus (2.28.10 wurde nicht einzeln veröffentlicht). Sichtbar bleibt „Version 2.28.1“.
Bedienung: `docs/WORKFLOW-PDF-KLON.md`, `docs/STAPEL.md`.

## Proben (gemessen in diesem Behälter, Chromium)

`workflow-pdf-klon` 16 · `workflow-pdf-bruecke` 8 · `stapel` 13 · `node tests/run-ui.mjs` **29/29** · `npm run build` grün · lint 0 Fehler ·
`check:android` · `check:windows` · `check:herkunft` grün · `scripts/run-ausfuellen-tests.mjs` prüft Pins und Patch des Klons.
Gegenprobe `node tests/gegenprobe-sitzung-b.mjs "Klon:"` 7/7 · `"Brücke:"` 5/5 · `"Stapel:"` 4/4. CI #41 grün.

## Beim Bau gefunden

Gleicher Ursprung → gleiche Datenbank (Brücke leitet um) · ⟳ im Klon hätte Vorräte/Worker der Akte gelöscht · der Worker der Akte lieferte im
Rahmen die Akte aus · Präfix doppelt (`fa_wfpdf_wfpdf_*`, Probe) · `entzerren` liefert kein `ImageData` (jedes Blatt fiel still auf „Ecken prüfen“,
Probe) · Force-Push nach Squash abgelehnt → main in den Zweig gemergt.

## Nicht gemessen / Grenzen

Tablet, Windows-PC · echte Fotos im Stapel (nur gezeichnete Blätter) · echtes Teilen in der WebView · der Internetschalter der Akte wirkt im
Rahmen nicht (der Klon geht nur auf eigenen Tipp ins Netz) · der Klon spricht Workflow PDFs Wortlaut · Stapel: eine Seite je Bild, ohne Filter,
200 dpi.

## Nachtrag: Klaus' Antworten → Fassung 2.28.12

| Frage | Antwort | gebaut |
| --- | --- | --- |
| 1 Stapel mehrseitig | Ja, wählbar; sonst einzeln, von Hand per Ziehen/Zusammenfügen | Haken „ein Brief“, „Zusammenfügen (N)“, Griff ⠿ ziehen |
| 2 Filter | wählbar wie Workflow PDF, dazu Schärfe | Original · Farbe verbessern · Graustufen · Dokument · Schwarzweiß, Schärfe 0–100 |
| 3 Prüfbericht | ja, aber nur auf manuelle Wahl | „Prüfen“ an der Zeile und über die Auswahl; beim Einlesen nichts |
| 4 Briefkopf-Titel | ja | „Brief von <Absender>, <Datum>“ im Eingangs-Fenster |

Proben: `stapel` 19 · `stapel-pruefen` 5 · `briefkopf-titel` 5 · Gegenproben `Stapel:` 8/8 · `Prüfen2:` 2/2 · `Briefkopf:` 2/2.
Freigaben in dieser Sitzung (zum Prüfen): 2.28.11 als PWA, APK, Windows und Einzeldatei (Links im Chat).

## Fragen an Klaus (beantwortet, siehe Nachtrag)

1. **Stapel mehrseitig:** soll ein Stapel aus aufeinanderfolgenden Blättern eines Briefes zu **einer** Unterlage zusammengefasst werden können
   (Haken „zusammenfügen“ an der Auswahl)? Heute ist jedes Blatt eine Unterlage.
2. **Stapel-Filter:** Farbe wie fotografiert lassen, oder Workflow PDFs Filter „Dokument“ (Schatten weg, Papier weiß) als Vorgabe?
3. **Prüfbericht in der Akte** (Stück 4 des Briefs): beim „Einordnen“ den Prüfbericht von Workflow PDF (versteckter Text, Anweisungen an KI)
   gleich mitlaufen lassen — ja?
4. **Briefkopf** (in Workflow PDF schon fertig, 1.1.6): als Titel-Vorschlag „Brief von …, Datum“ im Eingang übernehmen — ja?

## Stundennachweis (UTC; Ortszeit +1)

| Zeit | Arbeit |
| --- | --- |
| 00:45–01:00 | Briefe gelesen, Workflow-PDF/BookLedgerPro angesehen, Weg A/B mit Klaus geklärt |
| 01:00–01:20 | Stück 1: Nachziehen, Patch, Brücke, Farben, Seite, Probe, Gegenprobe, voller Lauf, PR #41 |
| 01:20–01:50 | Stück 2 (Brücke, Probe, Gegenprobe) und Stück 3 entworfen; CI #41, Merge, Veröffentlichung 2.28.9 |
| 01:50–02:15 | Stück 3 nach Klaus' Nachtrag (Liste, Vorschau, Anhalten/Weiter, Einordnen), Probe, Gegenprobe, voller Lauf, PR #42, Kimhub, Brief |

Erste Spur 00:45 (Reflog), letzte ≈ 02:15: **≈ 1 h 30** (Obergrenze, inkl. Wartezeit auf CI und Proben). Klaus' eigene Angabe geht vor.

## Startauftrag zum Einfügen

```
Familienakte: Workflow PDF – nach Stück 3. Repo lausiklauskn-png/Meine-Familienakte (bauen), dazu Workflow-PDF (Quelle, nur kopieren über tools/wfpdf-app-nachziehen.mjs und tools/wfpdf-nachziehen.mjs). Branch wie vorgegeben, Deutsch.
Zuerst lesen: CLAUDE.md (Abschnitt „Zwischenstand“), BRIEF_ABSCHLUSS_2026-11-01_WORKFLOW-PDF-KLON.md, docs/WORKFLOW-PDF-KLON.md, docs/STAPEL.md.
Prüfen: ist PR #42 (2.28.11, Stücke 2+3) gemergt und Android/Windows mit server=ja veröffentlicht? Wenn nicht: CI ansehen, fertig machen, veröffentlichen.
Meine Antworten auf die 4 Fragen im Abschlussbrief: [hier eintragen]. Gerätebefund Tablet/Windows: [falls vorhanden].
Dann weiter in Stücken (Probe + Gegenprobe in tests/gegenprobe-sitzung-b.mjs + alle Proben + CI grün, Fassung +1): Prüfbericht beim Einordnen, Briefkopf-Vorschlag im Eingang, ggf. Stapel mehrseitig/Filter.
Sichtbare Änderungen nur mit meinem Ja je Punkt. Nicht: Kern oder Klon von Hand ändern, Forschung hier (nur Kimhub), Schlüssel/PINs in Dateien oder Chat, „Version 2.28.1“ ändern.
Am Ende Abschlussbrief mit Stundennachweis und Startauftrag.
```
