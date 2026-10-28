# Erfundene Testdateien für den Dateieingang (Paket D)

Alle Dateien hier sind **frei erfunden** und dienen nur der Prüfung des Dateieingangs der
Familienakte. Es gibt keine echten Personen, Orte, Firmen, Ärzte oder gültigen Nummern
(Regeln aus `NEUSTART_AUFTRAG.md`). Erzeugt werden sie reproduzierbar mit

```
node tests/testdateien/erzeugen.mjs
```

ohne fremde Pakete. Nur das JPEG entsteht über das vorinstallierte Chromium (Playwright), weil
Node keinen JPEG-Encoder mitbringt.

| Datei | Was sie darstellt | Besonderheit |
| --- | --- | --- |
| `Nebenkostenabrechnung_2025_Arenberg-Hof.pdf` | PDF mit Textebene (Hausverwaltung Pustelblume, erfunden) | Frist im Text („bis zum 30.11.2026“) |
| `Kopie_Abrechnung_Pustelblume.pdf` | **Dublette**: byte-gleich zur Nebenkostenabrechnung, anderer Name | prüft Dublettenerkennung über Inhalt |
| `Garantiebeleg_Waschautomat_Lavorix.pdf` | PDF mit Textebene (Rechnung + Garantie, erfundene Marke) | Seriennummer offensichtlich ungültig |
| `Scan_Garantiebeleg_nur_Bild.pdf` | PDF **ohne** Textebene (nur ein gezeichnetes Bild) | wie ein Scan |
| `Foto_Garantiebeleg_Lavorix.png` | selbst gezeichnetes „Belegfoto“ 240 × 320 | Fotoserie mit dem JPG |
| `Foto_Garantiebeleg_Lavorix_Seite2.jpg` | dasselbe Motiv als JPEG | zweite Seite für „Dokument fotografieren“ |
| `Mietvertrag_Arenberg-Hof_Nachtrag.docx` | minimales gültiges Word-Dokument (ZIP mit `word/document.xml`) | Inhalt lesbar in „Bestand prüfen“ |
| `Nebenkosten_Uebersicht_2025.xlsx` | minimale gültige Excel-Datei (ein Blatt) | Tabelle |
| `Notiz_Fahrradkauf_Velotrix.txt` | Textnotiz | Datum und Frist im Text |
| `Protokoll_Schulausflug.vtt` | Untertitel-/Protokolldatei (WebVTT) | Text wird gelesen |
| `Mail_Garantiefall_mit_PDF.eml` | E-Mail mit PDF-Anhang (base64, multipart) | Frist und „Antwort erforderlich“ im Text |
| `Mail_Schulausflug_mit_Foto.eml` | E-Mail mit PNG- und TXT-Anhang | zwei Anlagen |
| `Outlook_Nachricht_Stromtarif.msg` | **Minimaldatei**: UTF-16LE-Text mit Betreff und Inhalt | kein echtes OLE/CFB-Format (ohne Bibliothek nicht erzeugbar); die App liest `.msg` ohnehin nur als UTF-16-Text |
| `Unterlagen_Umzug_Paket.zip` | ZIP mit TXT, PDF und PNG | wird von der App **nicht** entpackt |
| `Programm_nicht_erlaubt.exe` | nur ein Name mit `MZ`-Kennung, kein Programm | nicht erlaubter Typ |
| `.laufzeit/Zu_gross_21MB.pdf` | 21 MB, entsteht erst beim Lauf der Probe | über der 20-MB-Grenze; nicht im Repo (`.gitignore`) |

Die Probe `tests/ui/dateieingang.test.mjs` verwendet diese Dateien (`node tests/run-ui.mjs dateieingang`).
Ergebnisse: `docs/analyse/DATEIEINGANG.md`.
