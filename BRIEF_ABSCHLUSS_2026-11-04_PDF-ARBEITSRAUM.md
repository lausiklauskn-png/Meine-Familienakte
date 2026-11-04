# PDF-Arbeitsraum mit Rückgabe an denselben Akteneintrag

Klaus präzisiert den Auftrag: Bestehende Unterlage zum Prüfen/Ausfüllen öffnen und
an dieselbe Stelle zurückgeben, ohne zweiten Akteneintrag. Merge ausdrücklich
freigegeben; vorher den parallel bearbeiteten Claude-Code-PR #85 prüfen.

Der gebundene Workflow-PDF-Raum verwendet die vorhandene Datenbankschnittstelle
mit einem Adapter im Arbeitsspeicher. Der kanonische PDF-Kern, HTML, CSS und Theme
bleiben unverändert. Der Adapter verhindert auch dauerhafte Notstandsablagen.
Die unabhängige Bibliothek beim direkten Menüaufruf bleibt erhalten.

Beide Ausfüllwege speichern am ursprünglichen logischen Dokument. Die Rückgabe
prüft Akte, Ausgangsdatei und Prüfsumme, verweigert veraltete Bearbeitungen und
bestätigt erst nach dauerhafter Speicherung. Lokale Altdateien werden nach dem
Registerwechsel überprüft entfernt; ein Journal ermöglicht Wiederholung. Der
unveränderliche Pro-Tresor kann interne Revisionen behalten. Details und Grenzen:
`docs/PDF-BIBLIOTHEK-DATENWEG.md`.

Der einfache Dialog bewahrt bei ausfüllbaren PDFs Feldarten/Bezeichnungen in einer
wertfreien Maske; aktuelle Werte werden aus den echten PDF-Formularfeldern gelesen.
Unterschriftsbilder werden nicht als Klartext in die Maske übernommen.

Neue Speicher-/Fehlerprüfungen, Gegenprobe und Arbeitsraumprüfung laufen auch im
allgemeinen CI und beim täglichen PDF-Abgleich. Browserproben prüfen echte Ausgabe,
Rückgabe, erneut geöffneten Inhalt und fehlende dauerhafte Zweitablage. Der vorhandene
Gesundheitsdaten-/KI-Schutz bleibt wirksam; Bildreinigung ist keine automatische
Anonymisierung sichtbarer Daten (`docs/PDF-SCHUTZABGLEICH.md`).

Der zuvor zusammengeführte Updateweg (#86, Pro #66) bleibt: `npm run update:pdf`
prüft aus dem Quellordner online, `-- --anwenden` übernimmt einen passenden Kern
unter Design-/Herkunftsschutz. Geplante Actions erzeugen geprüfte Update-Entwürfe,
keine automatischen Merges. Kein neues Repo erforderlich. Kein neues Android-/Windows-
Release in diesem Stück; vorhandene Versionsdateien bleiben dem parallelen Auftrag.
