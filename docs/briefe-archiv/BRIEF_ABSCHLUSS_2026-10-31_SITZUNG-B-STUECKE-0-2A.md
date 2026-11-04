# Abschluss 2026-10-31: Sitzung B — Stücke 0, 1, 1b und 2a veröffentlicht

Schließt an `BRIEF_SITZUNG_2026-11-01_SITZUNG-B-NETZ-UND-RELEASE.md` (PR #34) und `BRIEF_ABSCHLUSS_2026-10-31_AUSFUELLEN-SITZUNG-F.md` an.
Klaus' Wort: in Stücken bauen, nur ein fertiges Stück veröffentlichen (Probe + Gegenprobe + alle Proben + CI grün, Altes geht weiter).

## Klaus' Antworten in dieser Sitzung

| Frage | Antwort |
| --- | --- |
| Sitzung F, 1: Knopf „Formular scannen und ausfüllen“ in der Eingangszentrale | **Ja** |
| Sitzung F, 2: Gesundheitsunterlagen ausfüllbar | **Ja** |
| Sitzung F, 3: Anschrift, E-Mail, Telefon an Personen | **Ja** |
| Sitzung F, 4: Kern ohne Texterkennung in die Einzeldatei | **Ja** |
| Stück 1: „Überall suchen“ | **Vorhandene Suche nutzen** (findet schon Dokumente, Memory, Vorgänge); im eigenen Netz bekommt sie in Stück 3 einen Haken |
| Wann die vier Punkte aus F | **Gleich als Stück 1b** |
| Stück 2: Ort des Mycels | **Eigene Seite „Netz“**, kein schwebender Knopf |
| Siegel/Lampen | **Nur auf der Netz-Seite** (Stück 2b) |

## Ergebnis

| Stück | Inhalt | Fassung | PR | veröffentlicht |
| --- | --- | --- | --- | --- |
| 0 | main nach Sitzung F | 2.28.4 | #35 | Android Bau 5 + Windows, beide auf family-projekt.de (Läufe haben Feed und Datei von außen verglichen) |
| 1 + 1b | Suche abgesichert (Probe) · Formular scannen und ausfüllen · Ausfüllen für Gesundheitsunterlagen (ohne KI-Weg) · Anschrift/Kontakt an Personen · Kern in der Einzeldatei | 2.28.5 | #36 | Android Bau 6 + Windows, server = ja |
| 2a | Seite „Netz (Mycel)“, Kanon-Module byte-1:1 (`public/sbkim/`), nichts beim Laden, Verbinden nur auf Tipp | 2.28.6 | #37 | Android Bau 7 + Windows, server = ja |

Sichtbar bleibt überall „Version 2.28.1“ (Oberfläche des Freundes). Bedienung: `docs/AUSFUELLEN.md` (Abschnitte 2.28.5), `docs/MYCEL.md`.

**Kein Doppelbau:** offen war nur PR #34 (der Plan-Brief dieser Sitzung); die Pro-Umbau-Sitzung hat in der Familienakte nichts begonnen.
Das Tresor-Paket mit den Fächern „Familienakte“/„Eingang-Familienakte“ ist in den Repos dieser Sitzung noch nicht da — Stück 4 wartet darauf.

## Proben (gemessen in diesem Behälter, Chromium)

- je Stück: `npm run build` grün · `npm run lint` 0 Fehler · `node tests/run-ui.mjs` 18/18 → 22/22 → 23/23 · `check:android` 21 · `check:windows` 14 · `check:herkunft` · CI grün vor jedem Merge.
- neu: `tests/ui/suche.test.mjs` 9 · `ausfuellen-gesundheit` 5 · `formular-scannen` 6 · `person-kontakt` 6 · `einzeldatei` 6 · `netz-mycel` 14 · `run-ausfuellen-tests` +3.
- **Gegenprobe** `node tests/gegenprobe-sitzung-b.mjs`: 14 Fälle, **14 gefangen** (9 für 1/1b, 5 für 2a). Einer war zuerst durchgerutscht: „Netz verbindet von selbst“ — der Zähler für Verbindungen saß innerhalb des Internetschalters, der den Versuch schon vorher abwies. Der Zähler sitzt jetzt außen.

**Beim Bau gefunden:** (1) Der Service Worker liefert Workflow-PDF-Dateien aus dem Vorrat, Umleitungen im Prüfbrowser greifen dann nicht — die Scan-Probe sperrt ihn. (2) `local-vault.ts` braucht für Node die Dateiendung im Import (`../lib/person-kontakt.ts`). (3) Ein Bau nur mit Vite ohne PWA-Schritt erzeugt Seitenfehler (veralteter Vorrat) — immer ganz bauen.

## Nicht gemessen / Grenzen

Tablet, Windows-PC · echte Kamera (Scan bis PDF nur mit Stellvertreter) · Vorbelegen mit Kontaktangaben nur in der reinen Rechnung · echte Verbindung zum Relais ·
Kontaktangaben liegen im Register (wie Eingabe-Speicher, nicht zusätzlich verschlüsselt) · Einzeldatei ohne Scanner/Texterkennung/Noto · Kanon-Fenster in dessen Farben.

## Fragen an Klaus

1. **Gesundheitsunterlagen ausfüllen ohne „Mit KI benennen“** — so gebaut (nichts Gesundheitliches geht an eine KI, auch nicht unkenntlich). Recht so, oder soll der KI-Weg dort auch angeboten werden?
2. **Stück 2b:** Siegel und Lampen auf der Netz-Seite brauchen weitere Kanon-Module (07 Apoptose, 15 Membran, 16 Siegel, 16b Wizard) — einverstanden?
3. **Stück 3 (Chefcode):** im eigenen Netz antwortet die Familienakte mit Titel und Datum, mit Ausschnitt nur auf Schalter (wie BookLedgerPro)? Gesundheitsunterlagen nie?

## Nachtrag: Klaus' Tablet-Test am Abend (2.28.7, 2.28.8)

| Befund (Klaus) | Ursache | Fassung |
| --- | --- | --- |
| „finde nicht mal das Wort Eingangszentrale“ | Menüleiste lief bei 901–1000 px auf 1090 px hinaus (Dokumente/Hilfe unsichtbar, Querrollen) | 2.28.7 (#39), Probe `menue-breite` 24 |
| Mikrofon „es es könnte es könnte sein …“ | Chrome Android wiederholt im Dauer-Diktat den bisherigen Satz in jedem fertigen Stück | 2.28.7, `diktatZusammenfuegen` |
| „Möglicher vorhandener Zusammenhang“ springt zurück | „Verknüpfen“ setzte den Vorschlag, Automatik überschrieb leere Auswahl, Überschrift nannte nur den Vorschlag | 2.28.7, Probe `kontext-auswahl` 6 |
| nicht das ganze Werkzeug von Workflow PDF beim Fotografieren | „Dokument fotografieren“ war der alte Fotodialog | 2.28.8: öffnet den Scanner von Workflow PDF (Klaus: „überall der volle Scanner“) |
| Texterkennung nur „Dokumentscan“ + Datum | der Eingang las PDFs und Fotos gar nicht | 2.28.8: Textebene, sonst Texterkennung; Zusammenhang aus dem Inhalt. Probe `eingang-liest` 6 |

Briefkopf („Brief von …“) und die ganze Übernahme von Workflow PDF: neuer Brief `BRIEF_SITZUNG_2026-11-01_WORKFLOW-PDF-IN-FAMILIENAKTE.md`.
Gegenproben dazu: Menü 1 · Zusammenhang 3 · Diktat 1 · Eingang 2 — alle gefangen.

## Stundennachweis (UTC; Ortszeit +1)

| Zeit | Arbeit |
| --- | --- |
| 15:12–15:30 | Briefe gelesen, offene Fragen, Prüfung auf Parallel-Arbeit, Fassung 2.28.4, PR #35 |
| 15:30–15:50 | Stück 1 (Probe + Gegenprobe), 1b Gesundheitsunterlagen; Merge #35, Veröffentlichung 2.28.4, Lauf-Logs geprüft |
| 15:50–16:16 | 1b Kontakt an Personen, Formular scannen, Einzeldatei, Gegenprobe 9/9, voller Lauf, PR #36 |
| 16:16–16:40 | Stück 2a (Kanon-Module, Klebstoff, Seite, Probe, Gegenprobe), Merge #36, Veröffentlichung 2.28.5, PR #37 |
| 16:40–17:10 | Brief, CI #37, Merge, Veröffentlichung 2.28.6 und Prüfung der Lauf-Logs, Brief nachgetragen |

Erste Spur 15:12 (Checkout), letzte ≈ 17:10: **≈ 2 h** (Obergrenze). Abend: 19:20–20:50 (Befunde 2.28.7/2.28.8, Brief) ≈ 1 h 30; zusammen **≈ 3 h 30** (Obergrenze, inkl. CI-Wartezeit). Wartezeit auf CI in den Blöcken enthalten (je ≈ 10 min). Klaus' eigene Angabe geht vor.

## Startauftrag zum Einfügen

```
Familienakte Sitzung B, Fortsetzung (Stücke 2b, 3, 4). Repo lausiklauskn-png/Meine-Familienakte (bauen), dazu Sage-Protokol (Kanon-Module, nur kopieren über tools/sbkim-nachziehen.mjs), Privat-Brain-Pro (pro-chefcode/pro-bedienung, nur kopieren), BookLedgerPro (Vorbild antwortFilter, Nachzieh-Werkzeuge), Workflow-PDF-Pro (Tresor-Paket, nur kopieren). Branch wie vorgegeben, Deutsch.
Zuerst lesen: Meine-Familienakte/CLAUDE.md, BRIEF_ABSCHLUSS_2026-10-31_SITZUNG-B-STUECKE-0-2A.md, docs/MYCEL.md, BRIEF_SITZUNG_2026-11-01_SITZUNG-B-NETZ-UND-RELEASE.md.
Draußen ist 2.28.6 (Netz-Seite). Meine Antworten auf die 3 Fragen im Abschlussbrief: [hier eintragen]. Gerätebefund Tablet/Windows: [falls vorhanden].
Weiter in Stücken, nur fertige Stücke veröffentlichen (Probe + Gegenprobe tests/gegenprobe-sitzung-b.mjs erweitern + alle Proben + CI grün), Fassung je Stück +1 (2.28.7 …), sichtbar bleibt „Version 2.28.1“. Repo muss für CI öffentlich sein – vorher nachsehen/fragen.
2b Siegel + Lampen nur auf der Netz-Seite · 3 Chefcode (pro-chefcode Fassung 2) + Antworten/Suche im eigenen Netz (Korpus als Float32Array!) · 4 Tresorordner-Anbindung erst, wenn das Paket die Fächer Familienakte/Eingang-Familienakte hat.
Sichtbare Änderungen nur mit meinem Ja je Punkt. Nicht: Forschung in diesem Repo (nur Kimhub), Schlüssel/PINs/Chefcodes in Dateien oder im Chat, Kanon-Module oder Bausteine von Hand ändern.
Am Ende Abschlussbrief mit Stundennachweis und Startauftrag.
```
