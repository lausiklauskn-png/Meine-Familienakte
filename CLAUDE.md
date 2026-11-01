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

## Zwischenstand laufende Sitzung 2026-11-01 „Workflow PDF ganz übernehmen“ (für nahtloses Weiterarbeiten, auch Codex)

Brief: `BRIEF_SITZUNG_2026-11-01_WORKFLOW-PDF-IN-FAMILIENAKTE.md`. Branch `ccr-253d5c30-8i5u1c`. **Klaus' Antworten (2026-11-01):**
Weg **B zuerst, A später** (Klon der ganzen App) · Bibliothek **getrennt** von der Workflow-PDF-PWA · Mycel im Klon **weglassen** ·
Einstiege **alle drei**: Menüpunkt „Workflow PDF“ (Dokumente), Knopf „In Workflow PDF öffnen“ an einer Unterlage, „Dokument fotografieren“
öffnet den Klon. **Neu von Klaus (Stück „Direkt übernehmen“):** ein Knopf für Stapel-/Massenscan: Ecken automatisch abgleichen (deckt das
Blatt ab?), gerade ziehen, verzerrungsfrei wie Workflow PDF darstellen, ohne Einzelprüfung einfügen; nur zum Nacharbeiten einzeln öffnen.
Ausgabe in der Sitzung knapp halten (Token sparen). Forschungseintrag am Ende nach Kimhub `forschung/messungen/familienakte-…`.

Stücke (je: Probe + Gegenprobe in `tests/gegenprobe-sitzung-b.mjs` + alle Proben + CI grün → Fassung +1 → Android/Windows `server = ja`;
sichtbar bleibt „Version 2.28.1“):
1. **Klon + Menüpunkt** — IN ARBEIT. Gebaut: `tools/wfpdf-app-nachziehen.mjs` + `tools/wfpdf-app-patch.mjs` → `public/apps/workflow-pdf/`
   (77 Dateien, Pins `public/apps/HERKUNFT.json`, Workflow-PDF `fb85507`), Brücke `public/apps/fa-wfpdf-bruecke.js` (DB → `FamilienakteWFPDF1`,
   `wfpdf_*` → `fa_wfpdf_*`, kein Service Worker, ⟳ sieht nur `fa-wfpdf-*`-Vorräte), Farben `public/apps/fa-wfpdf-thema.css`, Seite
   `app/workflow-pdf-seite.tsx` (Menü Dokumente → „Workflow PDF“, `active === "workflowpdf"`). Tesseract/Scanic nur noch einmal im Paket
   (Klon-`vendor/`; `public/wfpdf/vendor` gelöscht, `app/wfpdf-kern.ts` `vendorBasis()`). Probe in `scripts/run-ausfuellen-tests.mjs`.
   **Fertig gemessen:** `tests/ui/workflow-pdf-klon.test.mjs` 16 grün · Gegenprobe `"Klon:"` 7/7 · `run-ui` 27/27 · lint 0 Fehler ·
   check:android/windows/herkunft grün · Fassung **2.28.9**. Doku `docs/WORKFLOW-PDF-KLON.md`. Danach: PR, CI, Merge, Veröffentlichung.
2. **Brücke** — fertig gemessen (2.28.10, Commit nach #41): „📤 Teilen“ im Klon → Eingangszentrale, „In Workflow PDF öffnen“ an Unterlagen
   (nicht bei Gesundheit) über gestellte `launchQueue`, „Dokument fotografieren“ → Klon `?scan=1&von=Familienakte`, Scan geht gleich in die Prüfung.
   Probe `tests/ui/workflow-pdf-bruecke.test.mjs` 8 · Gegenprobe `"Brücke:"` 5/5 · run-ui 28/28. Push erst nach Merge von #41.
3. **Stapel** (Klaus' Nachtrag: Anhalten/Weiter/Abbrechen beim Einscannen, schlanke Liste ohne Vorschaubilder, große Vorschau erst beim
   Antippen, dort Workflow PDF/Einordnen/Entfernen, „Einordnen“ rechts oben, erst ungeprüft ablegen und später einordnen) — IN ARBEIT:
   `app/stapel.ts` (Ablauf), `app/stapel-ablage.ts` (IndexedDB `FamilienakteStapel1`), `app/stapel-seite.tsx`, Menü „Stapel (noch einordnen)“.
   Ursprünglicher Plan: „Direkt übernehmen“ (Massenscan, siehe oben) — Klebstoff mit `WFP.Scanner` (`hinzu`, `erkennen`, `pdfBauen`; `entscheiden` in scan-bild.js
   liefert `sicher`), unsichere Seiten markieren statt anhalten.
4. Prüfbericht beim Einlesen in der Akte (`eingang.js` aus dem Klon) · 5. Briefkopf (`briefkopf.js`, in Workflow-PDF schon fertig, 1.1.6).
