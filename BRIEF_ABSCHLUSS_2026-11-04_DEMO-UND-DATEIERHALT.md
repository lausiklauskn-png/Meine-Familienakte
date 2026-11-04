# Abschluss: getrennte Demo und Dateierhalt, 04.11.2026

Technische Familienakte **2.28.20**, sichtbare Versionszeile weiter **2.28.1**. Klaus' autonomer Bauauftrag aus dem vollständig gelesenen Kimhub-Nachfolgebrief ist umgesetzt. Claudes Tresor-PR #71 und die parallele Testfassung aus #72 bleiben enthalten. Eigene Dateien und historische Nutzerberichte wurden nicht pauschal gelöscht oder als bestanden umgeschrieben.

## Ergebnis

Die alte Gesamt-Kennungsliste ist kein Löschbeleg mehr. Entfernung und Altbestandsbereinigung verwenden belegte Herkunft. Der Demo-Einstieg bearbeitet ausschließlich den aktiven eindeutig zugeordneten alten Beispielbestand. Unklare Einträge und Originale im gemeinsamen Pro-Tresor bleiben erhalten.

**Demo öffnen** führt in einen eigenen lokalen Bestand mit wirklichen erfundenen PDFs, Personen, Vorgängen, Fristen und Erinnerungen. **Demo verlassen** kehrt zur eigenen Akte zurück. **Demo zurücksetzen** erneuert nur den benannten Testbereich; **Demo löschen und verlassen** entfernt ihn einschließlich dortiger Testimporte. Externe Sicherungen bleiben außerhalb dieser Bereinigung. Eigene Akten starten ohne automatisch angelegte neue Beispiele.

Dateien, Register, Eingänge, Stapel, Suchindex und gespeicherte Berichte sind getrennt. Die bisherigen OPFS-/IndexedDB-Adapter werden weiterverwendet. Der native Pro-Tresor und die eingebettete Workflow-PDF-Bibliothek bleiben in der Demo getrennt. Externe Teilen-Eingänge werden dort nicht automatisch übernommen; native und PWA-Warteschlangen behalten ihre Quellen für die eigene Akte.

Bedienung und Grenzen stehen in `docs/DEMO-ARBEITSBEREICH.md`.

## Prüfung

Zusätzlich wurde ein eigener Brief mit gleichem Beispielbetreff und eigenen Texten vor der letzten Korrektur tatsächlich verloren. Die Altbrief-Erkennung verlangt nun auch unveränderten vollständigen Demo-Text und Empfänger; derselbe Ablauf und die beiden Backend-Abnahmen erhalten seinen Text.

Die historische `sample-family.ts` aus eed690a verliert die eigene erfundene TXT-Datei nach dem zweiten Wechsel; die Korrektur erhält Kennung und SHA-256. Die eigene erfundene PDF wurde über die echte Browseroberfläche importiert.

- OPFS: 15/15 gezielte Zusicherungen.
- IndexedDB-Dateiablage: 15/15 gezielte Zusicherungen.
- Bestehende Leeraktenprobe: 25/25, einschließlich eigener Frist nach Demo-Rückkehr.
- Desktop-/schmale Startprobe: 4/4.
- Privater Index: 24; Modelladapter: 25; Signierwerkzeug mit Wegwerfschlüsseln: 7 bestanden.
- Vollständiger Fach-/PWA-/Einzeldatei-Bau, Typprüfung, Lint ohne Fehler und Herkunft unveränderter kanonischer Bausteine geprüft.

Sicherung und Wiederherstellung wurden mit tatsächlichen Browserdateien in einem getrennten leeren Ziel ausgeführt; Dokumentkennungen, Dateihashes, Datensätze und Relationen stimmen überein. Eine gestellte native Brücke prüft die Demo-Trennung, ersetzt aber kein physisches Gerät. Vorläufige Bedien-/Testfehler und ihre Korrekturen sind in den Kimhub-Belegen erhalten. Die vorhandenen Prüfketten wurden dafür nicht abgeschaltet.

Die vollständige CI des endgültigen Commits `a2e7417a1dc38efb87ccfba9a7d3091a30baf90c` ist grün:

- [43/43 Browser-Skripte, Fachprüfung, Bau, Herkunft und Signierprobe](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41754280104).
- [Installierte Android-APK auf API 31 und 35](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41754280094), jeweils drei tatsächliche Produkttests ohne übersprungene oder fehlgeschlagene Fälle.
- [Windows-Installer, installierte Oberfläche, gebündelte Laufzeit und Dateiausgabe](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41754280136), einschließlich 15 Rust-Proben.
- [Gerätetransport](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41754324814): 12/12 und fünf vorhandene Gegenproben.
- [Android-Hülle](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41754279983) und [wirklicher Modellvergleich](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41754321150).

Der lokale System-Chromium bricht beim Transport-Neustart auch mit dem unveränderten Altstand eed690a ab. Dieser lokale Lauf wird nicht als bestanden ausgegeben; der offizielle Transportlauf ist separat nachgewiesen. Lint meldet null Fehler und zehn bestehende Warnungen.

## Verbleibende Nutzerprüfungen

Die bekannten Bilder bleiben als Ausgangsbeleg erhalten: Basic drei, Pro zwei gelbe Bereiche; jeweils 5/15 bestanden, 0 fehlgeschlagen und zehn nicht geprüft. Die Aufnahme und nächste Schritte stehen im Bauauftrag `BRIEF_SITZUNG_2026-11-04_DEMO-UND-SYSTEMMELDUNGEN.md`.

Die technischen eigenen Läufe sind keine Einsicht in Klaus' Browser-/PWA-/APK-Speicher. Eingang, Bestandsanalyse und bewusste Zuordnung/Archivierung/Assistenzfreigabe werden in der tatsächlichen Instanz weitergeführt. Ohne freigegebenen Zugang gibt es keine echte OneDrive-Dienstabnahme. Windows bleibt beim Nutzer praktisch ungeprüft. Die ältere zusätzliche Android-Tresor-Paar-Abnahme ist ein getrennter offener Auftrag. Auch die sechs Gerätefälle aus Claudes erhaltenem `BRIEF_ABSCHLUSS_2026-11-04_TRESOR-PLAN.md` bleiben am Tablet offen.

## Veröffentlichter Stand

[PR #73](https://github.com/lausiklauskn-png/Meine-Familienakte/pull/73) ist zusammengeführt. Der zusätzliche Erhaltungsfall für eigene Altbriefe und die endgültige Fassung 2.28.20 sind mit PR #76 ergänzt. Die ersten 19er APK-/Windows-Bauten wurden vor Taganlage abgebrochen; die bereits automatisch ausgelieferte 19er-PWA ist ein Zwischenstand. Veröffentlichungsquelle: `b54eedc654b38b727aadbaf132c6847112b21902`. Gegenüber dem vollständig geprüften Commit a2e7417 unterscheiden sich ausschließlich Claudes Abschlussbrief und CLAUDE-Nachtrag aus #75. Der Produktcode ist identisch.

Android und Windows sind mit `server=ja` veröffentlicht; die öffentlichen Downloads wurden anonym erneut geladen und gegen Digests und `SHA256SUMS` geprüft. Die heruntergeladene APK enthält tatsächlich 2.28.20, die richtige Quelle und den Demo-Code. Die Android-Zertifikatsidentität bleibt erhalten. PWA-Lauf 41758137231 bestätigt live 2.28.20 und enthält den aktuellen Windows-Installer mit gleicher SHA-256. Der lokale verwaltete Netzwerkzugang erlaubt keinen direkten github.io-Abruf; der öffentliche Rückabruf ist im bestehenden Deployment-Lauf belegt.

[Android und Einzeldatei](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/tag/android-v2.28.20) · [Windows](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/tag/windows-v2.28.20) · [PWA](https://lausiklauskn-png.github.io/Meine-Familienakte/). Vollständige Größen, SHA-256, Quellen und Läufe: `docs/VEROEFFENTLICHUNG-2.28.20.json`.

Der Sitzungs- und Zeitnachweis liegt ausschließlich in Kimhub: `forschung/messungen/familienakte-2026-11-04-demo-bau.md`.

## Startauftrag

```text
Arbeite auf aktuellem main von Meine-Familienakte und hole Kimhub hinzu.
Lies diesen Abschluss und die aktuelle Demo-Anleitung.
Erhalte vorhandene eigene Dateien, Paket-/Signieridentitäten und Herkunftspins.
Nutze zum Vorführen Demo öffnen; echte Unterlagen erst nach Demo verlassen importieren.
Lies in Klaus' tatsächlich verwendeter Instanz den aufgeklappten Prüfbericht mit ID, Zeit und Paketkennung.
Basic-Browser/PWA und Android-Pro getrennt zuordnen; Windows-Nutzerprüfung bleibt bis zur Verfügbarkeit offen.
Mit wenigen bewusst gewählten echten Unterlagen fortfahren. Fehlende Praxisnachweise nicht automatisch grün setzen.
Die vorhandene 15er-Praxisabnahme weiterverwenden. Keine neue allgemeine Testreihe ohne konkreten neuen Befund.
Die ältere zusätzliche Tresor-App-Paar-Abnahme als getrennten Auftrag behandeln.
Keine bereits veröffentlichte technische Fassung erneut ausgeben.
```
