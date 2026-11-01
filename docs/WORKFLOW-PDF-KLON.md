# Workflow PDF als Klon in der Familienakte (Weg B, 2026-11-01)

Klaus: „Gesamte Werkzeug von Workflow PDF in Familienakte übernehmen … Ansonsten … einen Klon von WF PDF integrieren in den Farben von
Familienakte.“ Entscheidung 2026-11-01: **Weg B zuerst** (ganzer Klon), A später nur, wo die Akte tiefer greifen muss.

## Bedienung

Menü **Dokumente → „Workflow PDF“**: die ganze App Workflow PDF in der Akte — Bibliothek, PDF/Bild/Ordner einlesen, Scannen (Ecken,
gerade ziehen, Filter, Texterkennung, durchsuchbar), Felder erkennen/setzen, ausfüllen, Unterschrift, Zuschneiden, Prüfbericht,
Suche (Wort, Bedeutung), Briefkopf, Übersetzen, Teilen, PDF ausgeben. Farben der Akte (Petrol/Navy statt Rot).

- **Eigene Bibliothek** (Klaus: „getrennt“): Datenbank `FamilienakteWFPDF1`, Einstellungen `fa_wfpdf_*`. Die Workflow-PDF-PWA am selben
  Ursprung (`lausiklauskn-png.github.io`) behält ihre `WorkflohPDF1` und `wfpdf_*`. In der Android- und Windows-App ohnehin getrennt.
- **Kein Mycel-Knoten** im Klon (Klaus: „Weglassen“), kein Installieren, kein ⟳ — das gehört zur Akte.
- Der Rahmen lädt erst, wenn die Seite geöffnet wird.

## Aufbau

| Teil | Datei |
| --- | --- |
| Klon, **byte-1:1** (77 Dateien, ohne tests/tools/docs/sbkim/sw.js) | `public/apps/workflow-pdf/` · Pins `public/apps/HERKUNFT.json` |
| Nachziehen (Klon `../Workflow-PDF` oder `WFPDF_KLON=…`) | `node tools/wfpdf-app-nachziehen.mjs` — **nie von Hand ändern** |
| Einzige Abweichung: `index.html` (Brücke zuerst, Farben zuletzt, kein Service Worker, kein `sbkim-init.js`) | `tools/wfpdf-app-patch.mjs` (reine Funktion) |
| Brücke (Familienakte-eigen): Datenbank/Schlüssel umleiten, kein Worker, ⟳ sieht nur `fa-wfpdf-*`-Vorräte | `public/apps/fa-wfpdf-bruecke.js` |
| Farben (Familienakte-eigen) | `public/apps/fa-wfpdf-thema.css` |
| Seite | `app/workflow-pdf-seite.tsx` |
| Worker der Akte liefert unter `apps/` die eigene Seite aus, nicht die Akte | `scripts/build-pwa.mjs` (`eigeneSeite`) |

**Texterkennung und Blatterkennung nur einmal im Paket:** Tesseract (21 MB) und Scanic (3,5 MB) liegen nur noch im Klon
(`apps/workflow-pdf/vendor/`); Scanner, Ausfüllen und Eingang der Akte laden sie dort (`app/wfpdf-kern.ts` `vendorBasis()`).
`public/wfpdf/` trägt nur noch den Kern ohne diese Ordner. Nicht im Installations-Vorrat (beim ersten Gebrauch).

## Brücke Akte ⟷ Workflow PDF (Stück 2, 2.28.10)

- **„📤 Teilen“ im Klon** (Karte, Auswahl, Editor) legt PDFs und Bilder in die **Eingangszentrale** der Akte (zur Prüfung), statt das
  Teilen-Fenster des Geräts zu öffnen. Wer nach außen teilen will, teilt die Unterlage aus der Akte.
- **„In Workflow PDF öffnen“** an einer Unterlage (Dokumentenbibliothek, Eingangszentrale): die Datei geht in die Bibliothek des Klons
  (über `launchQueue`, das die Brücke im Klon stellt). Nicht bei geschützten Gesundheitsunterlagen (der Klon hat keinen Gesundheitsschutz).
- **„Dokument fotografieren“** (Startseite, Eingangszentrale) öffnet den Klon mit offenem Scanner (`?scan=1&von=Familienakte`).
  „PDF erstellen“ legt den Scan im Klon ab **und** gibt ihn gleich an die Prüfung der Akte (wie bisher: Einordnen, Text lesen, Zusammenhang).
  In der Einzeldatei (ohne Klon) bleibt der Scanner allein.

## Proben

`scripts/run-ausfuellen-tests.mjs` (Pins, Pflichtdateien, Patch, Gleichheit mit dem Klon daneben) · `tests/ui/workflow-pdf-klon.test.mjs` 16 ·
Gegenprobe `node tests/gegenprobe-sitzung-b.mjs "Klon:"` (7 Fälle) · `tests/ui/workflow-pdf-bruecke.test.mjs` 8 ·
Gegenprobe `"Brücke:"` (5 Fälle).

## Grenzen (benannt)

- Nicht am Tablet, nicht am Windows-PC gemessen.
- Der **Internetschalter** der Akte wirkt im Rahmen nicht; der Klon geht nur auf eigenen Tipp ins Netz (Modell laden für Bedeutungssuche/
  Bildbeschreibung, KI mit eigenem Schlüssel), wie Workflow PDF selbst.
- Der Klon spricht Workflow PDFs Wortlaut (Sprachen DE/EN/RU/AR, Hilfe, Erklärvideo mit Link zur Workflow-PDF-Webseite).
