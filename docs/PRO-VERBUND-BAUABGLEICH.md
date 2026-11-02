# Bauabgleich zum Pro-Verbund

Stand: 2. November 2026, Veröffentlichungsvorbereitung. Der Auftrag und Klaus' Freibrief
umfassen Android, Windows, geprüfte Übernahmen und Veröffentlichungen. Das Geschenk kommt
zuletzt. Die [feste Abnahmegrenze](ABNAHME-UND-PRAXISTEST.md) ersetzt offene allgemeine Testserien.

| Auftrag | Gebaut und geprüft | Noch vor dem Abschluss |
| --- | --- | --- |
| Dauerhafter Eingang | PR #48; Original, Datensatz und Quittung werden gemeinsam gespeichert; Wiederaufnahme nach Neustart | Grundlage bewahren |
| Gemeinsamer Pro-Tresor | Vorhandenes kanonisches Java-Paket; Android-SAF, Windows-Tauri mit gebündelter Java-Laufzeit; freie Ordnerwahl, keine stille Ersatzablage | Persönliche SD-/USB-Laufwerke gehören zum anschließenden Praxistest |
| Originale und Arbeitsdaten | Ausdrückliche Wahl der Ablage, Prüfsummen, Quelle erhalten, getrennte kleine Arbeitsstände und neu aufbaubarer Suchindex | Keine automatische Gesamtsynchronisierung |
| Eingebettetes Workflow PDF | Unveränderter Kern 1.1.8; bestehende Brücke quittiert erst nach dauerhafter Speicherung, Ausgabe behält Herkunft | PWA-Einzeldatei bleibt gesondert geprüft |
| Eigenständige Pro-Apps | Familienakte, Workflow PDF Pro, Private Brain Pro und BookLedgerPro haben native Anschlüsse, beständige Übergabekennungen und geprüfte Rückwege; Gegenstellen auf main | Die abschließende tatsächliche App-Paar-Abnahme für Android und Windows läuft in PR #59 |
| Metadaten | PR #56: begrenzte optionale Begleitdatei; Angaben bleiben ausdrücklich anzunehmende Vorschläge | Keine fremde automatische Einordnung |
| Geräte und Modelle | PR #55: bestehende Geräteprüfung und drei festgelegte e5-Modelle; bewusster Download, Fortsetzung, offline nutzbarer Index; tatsächliche installierte Android-/Windows-Proben bestanden | PWA hat Geräteprüfung, aber keine native Modellablage |
| Portal aufteilen | Tresoranbindung, Dokumentaktionen, Eingangsablage und Suchergebnisse in abgegrenzten Modulen | Kein zusätzlicher Umbau allein zur Verschönerung des Codes |
| Geräteübergreifende Übergabe | PR #58 auf main: begrenztes Originalpaket und passende Empfangsdatei; wirklicher 20-MiB-Weg über Kim und Datei-Post, korrekte Rückbestätigung; Android- und Windows-Abnahme bestanden | Persönliche Geräte und öffentliche Übertragungswege im Praxistest |
| Speicherabschluss | PR #57: wiederholbarer Speicherfehler, keine doppelte Aufnahme durch Mehrfachklick, Dialog bleibt bis zum Abschluss gesperrt | Erledigt |
| Name und Updates | Sichtbar Familienakte Pro; technische Fassung 2.28.15 vorbereitet; sichtbare Versionszeile 2.28.1, IDs, Signierer und Datenpfade bleiben | Geprüfte Android-/Windows-Updates veröffentlichen |
| Rückgebbare Praxisunterlagen | PR #61 auf main: zehn eigenständig speicherbare HTML-Reihen, sechs erfundene A4-Unterlagen mit Sollwerten, Bildprobe, Fünferstapel, Formular, Status und Notizen, HTML-/JSON-Ergebnisexport; sieben Browserabläufe bestanden | Reale Nutzer führen ihre benötigten Wege durch und geben die ausgefüllten Dateien zurück |
| Geschenk | Hochgeladene Vorlage unverändert; Erläuterungen und tatsächliche Bilder vorgesehen | Erst nach erfolgreicher Veröffentlichung herstellen |

## Konkrete bei der Gegenprüfung behobene Fehler

- Abweichende Größe oder Prüfsumme eines Pro-Verweises wird vor der Nutzung abgelehnt.
- Eine beschädigte Windows-Verbindungsdatei führt zu einem erkennbaren Fehler; bewusstes
  Neuverbinden bewahrt den bisherigen Zustand. Es entsteht kein leerer Ersatzbestand.
- Hüllen quittieren die abgeschlossene Eingangstransaktion. Ungelesene Android-Quellen
  werden nicht als übernommen freigegeben.
- Die installierte Windows-App liefert Modell-Dateien über eine eigene lokale Route.
  Die frühere HTML-Ausweichantwort wird als Fehler erkannt.
- Wiederholtes Speichern und Schließen eines Eingangs erzeugt keinen doppelten Datensatz.
- Übergaben verwenden den Originalnamen aus dem Aktenregister, nicht den internen Speichernamen.
- Kim hat beim Abschluss großer Datei-Post-Übertragungen den erforderlichen Schreibnachweis
  nachgereicht. Der wirkliche Server hatte den vorherigen Aufruf mit 403 abgelehnt.
  Kim #54 behebt das; #55 prüft den tatsächlichen Weg und die gezielte Gegenprobe in CI.

## Aussagekraft und Grenzen

Die gemeinsame Transportprobe verwendet wirkliche Apps im Browser, echte Datenbanken und
Dateien sowie den wirklichen lokalen Datei-Post-Server. Das Relay ist eine lokale Testgegenstelle.
Das ist kein Test eines öffentlichen Raums. Eine Transportquittung von Kim oder Datei-Post
bestätigt weiterhin nicht den Familienakte-Eingang.

Die zusätzliche App-Paar-Probe installiert die zwei Anwendungen getrennt. Die vorbereitete
Prüfablage ist leer; sie sendet nichts und erzeugt keine Empfängermarken. Android verwendet
Emulator und echten SAF-Dialog, Windows tatsächliche NSIS-Installer und WebView2. Aussagen über
persönliche Geräte folgen erst aus dem Nutzertest.

Der lokale Cloud-Browser kann `file://` wegen einer Verwaltungsrichtlinie nicht öffnen.
Chromium 154 stürzt außerdem bei einem Download nach Neustart desselben Profils ab; das tritt
auch bei einer unabhängigen winzigen Testseite auf. Die vollständigen Prüfungen bleiben deshalb
in GitHub mit dem vorgesehenen Browser aktiv. Diese lokalen Grenzen werden nicht als Erfolg gezählt.

## Sichtbare Umbenennung und Update-Zuordnung

Umgestellt werden Android-App- und Fenstertitel, PWA-Name, Browser-Titel und Windows-Fenstertitel.
Der interne Windows-Installationsname „Meine Familienakte“ bleibt für den bisherigen
Installationspfad erhalten. Paketkennungen, Datenbanken, Tresorfächer und Update-Adressen ändern
sich nicht. „Version 2.28.1“ in der Oberfläche bleibt wie beauftragt; die technischen Pakete tragen
2.28.15, damit das Update erkannt wird.
