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
- **Fertige, geprüfte Stücke auf `main` zusammenführen** (Klaus 2026-11-01), damit Klaus und die nächste Claude-Code-Sitzung auf dieselben Dateien zugreifen können. Arbeit auf eigenem Zweig; je Stück ein PR, soweit der Zugang verfügbar ist. Zusammenführung und App-Veröffentlichung sind getrennte Schritte; Einschränkungen der Prüfungen offen benennen.
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
2.28.9 = #41 und 2.28.11 = #42 gemergt und veröffentlicht (Android, Windows, server = ja; Pages).

**Klaus' Antworten auf die 4 Fragen (2026-11-01) — gebaut als Fassung 2.28.12** (Proben stapel 19 · stapel-pruefen 5 ·
briefkopf-titel 5, Gegenproben 8 + 2 + 2 gefangen; danach PR, CI, Merge, Veröffentlichung):
1. Stapel zusammenfassen: beim Einscannen wählbar („ein Brief“); sonst einzeln, und von Hand zusammenfügen — Auswahl + „Zusammenfügen“
   und eine Zeile per Ziehen auf eine andere legen (wie Dateien in einen Ordner). Code: `pdfsZusammenfuegen` in `app/stapel.ts`.
2. Filter wählbar wie Workflow PDF (Original · Farbe verbessern · Graustufen · Dokument · Schwarzweiß) und Schärfe — `StapelEinst`,
   `ScanBild.filtern`. Vorgabe Original, Schärfe 40.
3. Prüfbericht (versteckter Text, KI-Anweisungen) **nur auf manuelle Wahl** (Amtspost braucht ihn nicht) — Prüfkern aus dem Klon
   (`apps/workflow-pdf/assets/pruefer-*.js`), eigener Klebstoff (eingang.js lädt relativ und passt nicht in die Akte).
4. Titel-Vorschlag „Brief von <Absender>, <Datum>“ im Eingang — `briefkopf.js` byte-1:1 nach `public/wfpdf/` (wfpdf-nachziehen), Titel in
   `lib/central-intake.ts`/Eingang-Fenster.

**Briefkopf im Eingang — Fassung 2.28.13 (Klaus 2026-11-01: „ja“).** Der Eingang zeigt „Aus dem Briefkopf“ (`[data-briefkopf]`):
Absender, Empfänger, Kunden-/Aktennummer änderbar, Thema; Briefdatum füllt das Dokumentdatum, wenn es leer ist. Daraus: Empfänger → Person
der Akte (`recipientName` in der vorhandenen Zuordnung), Absender → Organisation, Thema → Lebensbereich (nur, wenn der Dateiname nichts sagt),
Nummer → frühere Unterlage mit derselben Nummer (≥ 5 Zeichen) und deren Vorgang als Vorschlag. Gemerkt in der Notiz („Briefkopf: …“).
Rechnung rein in `lib/briefkopf-titel.ts`; Eingangszentrale und Stapel laufen beim „Zuordnung prüfen“ durch denselben Eingang.
Proben: `scripts/run-ausfuellen-tests.mjs` (+14), `tests/ui/briefkopf-eingang.test.mjs` (10), Gegenprobe `Briefkopf2:` 5 gefangen.
Grenzen: nur erfundene Briefe; die Warteschlange selbst zeigt den Briefkopf noch nicht in ihrer Liste; schräge Scans/Handschrift.

**Paket für den Freund (2.28.13, Klaus 2026-11-01):** eine HTML-Datei mit APK, Windows-Setup, Einzeldatei, Quellcode und Codex-Auftrag
eingebettet (Speichern mit SHA-256-Prüfung) und „Was neu ist“ mit markierten Bildschirmfotos. Bilder: `node tools/paket/bilder-aufnehmen.mjs <ordner>`
(nach `npm run build`; Zeigehand `tools/paket/zeigehand.png` von Klaus), Seite: `python3 -I tools/paket/paketseite.py <fassung> <apk> <exe>
<einzeldatei> <quelle.zip> <ordner> <ausgabe.html>`; statt der vier Dateien je „-“ = schlanke Fassung mit Links (≈ 2 MB). Die Datei liegt nicht im Repo.

**Stand nach 2.28.14 (Kacheln sagen Import/Ausfüllen, #45; Paket-Werkzeug #46):** Abschluss `BRIEF_ABSCHLUSS_2026-11-01_BRIEFKOPF-UND-PAKET.md`
(Offenes und Startauftrag dort).

**Aktualisierung Codex, 2026-11-01:** Brückenprobe und vollständiger PWA-Bau für UI-Proben auf Klaus' Auftrag lokal auf `main` zusammengeführt; Remote-Übertragung wegen der automatischen Pages-Veröffentlichung noch durch die Freigabeprüfung blockiert. Gemeinsamer Stand: `codex/main-uebergabe`. Maßgeblicher neuer Übergabestand: `BRIEF_ABSCHLUSS_2026-11-01_CODEX-MAIN.md` (Prüfungen und verbleibende Cloud-Einschränkung).
