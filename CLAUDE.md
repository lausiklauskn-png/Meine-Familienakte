# CLAUDE.md — Meine Familienakte

Diese Datei liest jede Sitzung zuerst. Was hier steht, gilt für jede Arbeit in diesem Repo.

## Feste Regel: keine Forschung in diesem Repo (Klaus 2026-10-31)

Klaus: „Forschungsaufträge, Forschungseinträge haben in Familienakte nichts zu suchen. KimHub ist die Quelle, wo es hinkommt,
maximal noch Sage-Protokoll-Abgleich, da sind die Aufträge für die Forschung. Aber da kommen auch keine Forschungseinträge hin,
sondern nur KimHub.“

- **Forschungseinträge** (Befunde, Erkenntnisse, Forschungs-Paragraphen) kommen **nur nach KimHub**.
- **Forschungsaufträge** stehen in KimHub, höchstens noch im **Sage-Protokoll-Abgleich**. Dort kommen aber **keine Forschungseinträge** hin.
- In der Familienakte entsteht **nichts davon**: keine Dateien unter `docs/forschung/`, kein Abschnitt „Forschung“ in Briefen, im
  Abschlussbrief oder in PR-Beschreibungen, kein Verweis „Forschung § …“. Ein Befund aus einer Sitzung wird hier nur so weit
  beschrieben, wie er für den Bau nötig ist (Grenzen, Proben). Der Forschungsteil geht nach KimHub
  (`Kimhub/forschung/messungen/`, Dateien `familienakte-…`).
- Die zwei älteren Forschungsdateien (2026-10-28) sind am 2026-10-31 auf Klaus' Wort nach KimHub umgezogen
  (`Kimhub/forschung/messungen/`, Dateien `familienakte-…`) und hier gelöscht; in der Git-Historie stehen sie weiter.
- Ist KimHub in einer Sitzung nicht verfügbar, wird das Repo `lausiklauskn-png/Kimhub` in die Sitzung geholt und der Eintrag dort
  abgelegt (Klaus 2026-10-31).

## Weitere Regeln (Kurzfassung, Einzelheiten in den Briefen)

- Oberfläche und Wortlaut des Freundes nur mit Klaus' Ja je sichtbarer Änderung. Beispieldaten erfunden.
- Kein Release ohne Klaus' Wort. Keine Schlüssel, PINs, Passwörter oder Chefcodes in Dateien oder im Chat.
- Byte-1:1-Bausteine nie von Hand ändern: Workflow PDF über `tools/wfpdf-nachziehen.mjs` (Pins `public/wfpdf/HERKUNFT.json`),
  übrige über `native/HERKUNFT.json` (`npm run check:herkunft`), Modul 25 per Pin in `scripts/run-ki-auftrag-tests.mjs`.
- Jede Sitzung endet mit einem Abschlussbrief (`BRIEF_ABSCHLUSS_<Datum>_….md`) mit Stundennachweis und Startauftrag als Codeblock.
- Aktueller Stand: der jüngste `BRIEF_ABSCHLUSS_*.md`; Plan der nächsten Schritte im jüngsten `BRIEF_SITZUNG_*.md`.

## Stand nach der Sitzung 2026-11-01 „Workflow PDF ganz übernehmen“

Abschluss: `BRIEF_ABSCHLUSS_2026-11-01_WORKFLOW-PDF-KLON.md` (Ergebnis, Fragen an Klaus, Startauftrag). Weg B (Klon) ist gebaut:
`public/apps/workflow-pdf/` byte-1:1 (`tools/wfpdf-app-nachziehen.mjs`, Pins `public/apps/HERKUNFT.json`, Patch `tools/wfpdf-app-patch.mjs`),
Brücke `public/apps/fa-wfpdf-bruecke.js` (**nie umgehen**: eigene DB `FamilienakteWFPDF1`, kein Worker, ⟳ ohne fremde Vorräte), Seite
`app/workflow-pdf-seite.tsx`; Stapel `app/stapel*.ts(x)` (`docs/STAPEL.md`). Tesseract/Scanic liegen **nur** im Klon (`vendorBasis()`).
2.28.9 = #41 gemergt und veröffentlicht; 2.28.11 (Stücke 2+3) = PR #42.
