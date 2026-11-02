# Endliche Praxisprobe mit erfundenen Unterlagen

Auftrag von Klaus, 2. November 2026: druckbare Vorlagen, dieselben Wege mit digitalen
Dateien und eigenen Scans, getrennte Gerätewege, Antworten und Notizen als rückgebbare HTML.

Der Bauer erzeugt eine eigenständig nutzbare Übersicht, zehn eigenständige HTML-Bögen,
sechs A4-Unterlagen, eine Bildfassung, ein leeres PDF-Formular, fünf gemischte Seiten sowie
dieselben Seiten als einzelne PDFs. Die Vorlage enthält feste Sollwerte für Absender,
Person, Kunden-/Akten-/Datennummer, Datum und Betrag. Rechnung B und Zahlungsbeleg E
gehören zusammen. Familien-/Schulbrief und medizinische Unterlage betreffen das Kind.
Bank- und Fahrzeugkennungen sind ungültige Platzhalter. Es werden keine Zahlungen ausgelöst.

```sh
python3 tools/praxistest/paket.py /gewünschter/ausgabeordner
```

Zum Bauen werden Python, ReportLab, Pillow, PyMuPDF und DejaVu-Sans-Schriften benötigt.
Die fertigen HTML-Dateien benötigen nur einen Browser; keine Installation dieser Werkzeuge,
kein Konto, keine externen Skripte und keine automatische Übermittlung.
Das komplette ZIP liegt neben dem Ausgabeordner. Der Bauer nimmt ausschließlich seine
benannten leeren Vorlagen auf, niemals fremde Dateien oder ausgefüllte Ergebnisbögen.

Die Übersicht hat oben einen eigenen Knopf **„Gesamte HTML zum Weitergeben speichern“**.
Er speichert `Familienakte-Praxistest-Komplett.html` mit allen zehn eingebetteten Bögen und
Druckvorlagen. Diese eine Datei kann als Anhang weitergegeben und im Browser geöffnet werden.
Sie braucht keine Nachbardateien. Das zusätzliche `Familienakte-Praxistest-Weitergeben.zip`
neben dem Ausgabeordner enthält ausschließlich dieselbe komplette HTML. Der Downloadknopf
einer externen Vorschau ist dafür nicht erforderlich. Ausgefüllte Ergebnisbögen bleiben
separate Dateien und werden nicht in die leere Übersicht aufgenommen.

## Reihen und Grenze

1. Windows: digitale Originale, Papier, Scan, automatische Öffnung, Eingang, Anzeige, Neustart.
2. Android: Dateien, Kamera/Scan-App, automatische Öffnung, Teilen, Eingang, Ausrichtung, Neustart.
3. Fünferstapel: gemischt 04–01–05–02–03, vollständige Ausgabe und bewusste Sortierung.
4. Auf einem Gerät: Familienakte und jeweils eine eigenständige Pro-App, Hin- und Rückweg.
5. Android → Windows: Paket, Aufnahme, zurückgegebene Empfangsdatei.
6. Windows → Android: derselbe Ablauf in Gegenrichtung.
7. Fernes Gerät: ein vorhandener Kim-/Datei-Post-Weg mit echter Familienakte-Rückdatei.
8. BookLedgerPro: Rechnung, zugehöriger Zahlungsbeleg, Felder, Zuordnung, Rückgabe.
9. Familienakte: Personen, Briefkopf, Gesundheit, Familie, Wohnen, Kauf, Zahlung, Fahrzeug.
10. Alltag: Suche, Erinnerungen, optionale Bedeutungssuche/Diktat, Fristenstand, Ausfüllen, Sicherung.

Zunächst nur die genutzten Wege ausführen, keine vollständige Kombination aller Geräte.
Die Fachproben sind optional. Fehlende oder nur vorbereitete Funktionen werden so erfasst;
die Anleitung behauptet keine vollständige Fristenautomatik, Bankanbindung oder automatische
Scanner-Weitergabe. Mehrere Monitore sind Anzeigevarianten desselben Rechners.

## Ergebnisse

Je Schritt: offen, Ja, Nein, Nicht geprüft und eine Notiz. Für andere Geräte oder Gegenstellen
einen neuen Durchlauf verwenden. JSON trägt Schema, Vorlagenfassung, Reihenkennung und
Durchlaufkennung; HTML bettet denselben Ergebnisstand ein. Browser-Zwischenspeicherung ist
ergänzend. Erst das ausdrückliche Herunterladen sichert eine rückgebbare Datei. Ergebnisse
werden nicht automatisch hochgeladen oder in das Repository geschrieben.

## Durchgeführte Abnahme des Bogens

Chromium 154 unter Linux über einen lokalen HTTP-Server: sieben vollständige Prüfabläufe
bestanden. Dazu gehören exakte PDF-/HTML-Downloads, Wiederaufnahme nach Neuladen,
Ergebnis-HTML in einem frischen Browserkontext mit 390 Pixel Breite, unveränderte Notizen,
übereinstimmende JSON-Antworten, Zurückweisung einer fremden Reihe und Speicherung trotz
gesperrtem Browser-Zwischenspeicher. Notiztext mit HTML-Zeichen wird nicht ausgeführt.
Die sechs PDFs sind jeweils einseitig; der Stapel enthält die fünf vorgesehenen Seitencodes.
Bild- und Zahlungsseite sowie der mobile Bogen wurden visuell kontrolliert.

Zusatzprobe für die Weitergabe (Übersicht Ausgabe 2): eigener Gesamtdownload bei 390 Pixel
Breite, erneutes Öffnen in einem frischen Browserkontext, alle zehn enthaltenen Bögen und
das Dokumenten-ZIP bytegleich heruntergeladen bei gesperrten Netzanforderungen. Erneutes
Speichern der weitergegebenen Übersicht bleibt bytegleich, ohne rekursives Wachstum.
Der automatische Prüfer lässt zwischen den Einzelklicks 300 ms, damit er nicht in Chromiums
Begrenzung von mehr als zehn Downloads pro Sekunde läuft. Das zusätzliche Ein-Datei-ZIP
wurde entpackt und mit der erzeugten HTML verglichen.

Das ist eine Prüfung des bereitgestellten Pakets, kein behaupteter Scanner-/Tablet-Test.
Die Cloud-Richtlinie blockiert lokale `file://`-Navigation; dieser Geräteweg wird ehrlich
erst beim Öffnen der heruntergeladenen HTML auf dem Nutzergerät bestätigt.
