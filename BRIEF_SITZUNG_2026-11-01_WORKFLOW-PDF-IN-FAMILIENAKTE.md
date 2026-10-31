# Brief: Workflow PDF ganz in die Familienakte (Stand 2026-10-31 abends)

Vorgänger: `BRIEF_ABSCHLUSS_2026-10-31_SITZUNG-B-STUECKE-0-2A.md` (mit Nachtrag 2.28.7/2.28.8).

## Klaus' Wort (2026-10-31, nach dem Tablet-Test)

> „Gesamte Werkzeug von Workflow PDF in Familienakte übernehmen für den Scan und die Dokumentenerstellung, wo möglich und sinnvoll,
> mit Prüfmechanismen. Ansonsten für dieses Instrument einen Klon von WF PDF integrieren in den Farben von Familienakte.“

Befund dazu (Klaus' Fotos 2026-10-31): Fotografieren ging, aber es fehlte das Werkzeug von Workflow PDF Pro — Zuschneiden mit
beweglichen Ecken (Polygon), Gerade-Richten, Ergebnis, Seitengröße/Qualität, „Durchsuchbar“, Bibliothek, Felder bearbeiten/erkennen,
Ausfüllen, Zuschneiden, Prüfbericht, Speichern/Teilen/PDF ausgeben.

## Stand am 31.10. (gemessen, auf `main` ab 2.28.8)

| Teil | Stand |
| --- | --- |
| Kern byte-1:1 unter `public/wfpdf/` (Scanner, Bild, Blatt, ZIP, Erkennung, Export, Reinigung, Schloss, pdf-lib, fontkit, Noto, Scanic, Tesseract) | da, Pins `public/wfpdf/HERKUNFT.json`, `tools/wfpdf-nachziehen.mjs` (Quelle **Workflow-PDF**, Stand `2ac96d4`) |
| Scanner von Workflow PDF | **2.28.8:** „Dokument fotografieren“ (Startseite + Eingangszentrale) und „Formular scannen und ausfüllen“ öffnen ihn; Ergebnis geht in den Dokumenteneingang bzw. ins Ausfüllen |
| Ausfüllen (Felder erkennen/setzen, KI benennen, Vorbelegen, Unterschrift, festes/ausfüllbares PDF) | da (Sitzung F), eigenes Fenster `app/ausfuellen-dialog.tsx` |
| Eingang liest Text | **2.28.8:** Textebene, sonst Texterkennung (5 Seiten) → Einordnung und Zusammenhang am Inhalt |
| Briefkopf (Absender, Datum, Nummern, Betreff, „Brief von …“) | **fehlt** — Plan BookLedgerPro `BRIEF_SITZUNG_PRO-UMBAU-14.md` Sitzung D: Baustein `briefkopf.js` in **Workflow-PDF** (`assets/`), byte-1:1 kopieren |
| Bibliothek, Zuschneiden einer vorhandenen PDF, Prüfbericht, Seiten ordnen, Übersetzen | fehlen |

## Was zu tun ist

**Zuerst entscheiden (mit Klaus, je sichtbarer Änderung ein Ja):**
- **Weg A — Übernahme**: Teile aus Workflow PDF (PWA, Repo `lausiklauskn-png/Workflow-PDF`) byte-1:1 in `public/wfpdf/` ziehen und in
  der Familienakte als eigene Fenster anbinden (wie Ausfüllen): Zuschneiden/Ergebnis für vorhandene PDFs, Prüfbericht (`reinigung.js`,
  Prüfliste), Seiten ordnen, PDF ausgeben/Teilen. Die Oberfläche des Freundes bleibt, neue Fenster in Familienakte-Farben.
- **Weg B — Klon**: die Workflow-PDF-App (Single-File/`index.html` + Kern) als eingebettete App unter `apps/workflow-pdf/` (Vorbild
  BookLedgerPro `apps/calculate/`, `tools/apps-nachziehen.mjs`, `apps/HERKUNFT.json`, nur `index.html` über eine reine Patch-Funktion:
  Brücke, Familienakte-Thema als letztes Stylesheet, eigener Service Worker entfernt). Ein Menüpunkt öffnet sie; Ergebnis-PDFs gehen über
  eine Brücke (`postMessage`) in den Dokumenteneingang.
- Empfehlung: **B zuerst** (ganzes Werkzeug sofort, wenig Eigenbau, byte-1:1 prüfbar), A nur dort, wo die Akte selbst tiefer greifen
  muss (Eingang, Ausfüllen gibt es schon).

**Dann in Stücken (je Stück: Probe + Gegenprobe in `tests/gegenprobe-sitzung-b.mjs` + alle Proben + CI grün → Fassung +1 → Android/Windows
server = ja):**
1. Klon/Übernahme laut Entscheidung, Farben der Familienakte (Tokens aus `app/globals.css`), Pins + Nachzieh-Werkzeug, Gleichheits-Probe.
2. Brücke: fertiges PDF → Dokumenteneingang (Quelle „Workflow PDF“), Textebene mit; Rückweg: Unterlage aus der Akte → Werkzeug öffnen.
3. Prüfmechanismen: Prüfbericht von Workflow PDF (versteckter Text, Anweisungen an KI, Metadaten) beim Einlesen anzeigen; Gegenprobe mit
   einem präparierten PDF.
4. Briefkopf: zuerst in Workflow-PDF bauen (Sitzung D, mit Klaus' Ja), dann byte-1:1 hierher; Titel „Brief von <Absender>, <Datum>“ als
   Vorschlag im Eingang, Zusammenhang über Kundennummer/Aktenzeichen.

Repos: `Meine-Familienakte` (bauen), `Workflow-PDF` (Quelle; per `add_repo` holen, dort nur mit Klaus' Ja ändern), `BookLedgerPro`
(Vorbild `apps/`-Einbettung). Repo der Familienakte muss für CI öffentlich sein — vorher nachsehen/fragen.

## Was nicht passieren darf

Kern-Dateien von Hand ändern (nur über das Nachzieh-Werkzeug) · Oberfläche des Freundes ohne Ja · Forschung in diesem Repo (nur Kimhub) ·
Schlüssel/PINs in Dateien oder Chat · ein angefangenes Stück veröffentlichen · sichtbare „Version 2.28.1“ ändern.

## Startauftrag zum Einfügen

```
Familienakte: Workflow PDF ganz übernehmen. Repo lausiklauskn-png/Meine-Familienakte (bauen), dazu lausiklauskn-png/Workflow-PDF (Quelle, per add_repo holen, nur kopieren) und BookLedgerPro (Vorbild apps/-Einbettung mit tools/apps-nachziehen.mjs). Branch wie vorgegeben, Deutsch.
Zuerst lesen: Meine-Familienakte/CLAUDE.md, BRIEF_SITZUNG_2026-11-01_WORKFLOW-PDF-IN-FAMILIENAKTE.md, BRIEF_ABSCHLUSS_2026-10-31_SITZUNG-B-STUECKE-0-2A.md, docs/AUSFUELLEN.md.
Mein Wort: gesamtes Werkzeug von Workflow PDF in die Familienakte für Scan und Dokumentenerstellung, wo möglich und sinnvoll, mit Prüfmechanismen; sonst einen Klon von Workflow PDF in den Farben der Familienakte einbinden. Erst Weg A/B mit mir klären (Empfehlung im Brief), dann in Stücken bauen, nur fertige Stücke veröffentlichen (Probe + Gegenprobe + alle Proben + CI grün, Fassung +1, Android/Windows server = ja).
Sichtbare Änderungen nur mit meinem Ja je Punkt. Nicht: Kern von Hand ändern, Forschung hier, Schlüssel/PINs in Dateien oder Chat, „Version 2.28.1“ ändern.
Am Ende Abschlussbrief mit Stundennachweis und Startauftrag.
```
