# Appwechsel und Zurück in Familienakte 2.28.17

Klaus meldet die eigenständig installierte Workflow-PDF-Pro-App: Nach Android-Teilen
erscheint Familienakte in deren Arbeitsbereich. Der integrierte PDF-Klon funktioniert
und bleibt integriert. Zusätzlich legt die Android-Zurücktaste Familienakte am Anfang
des Verlaufs weg; dort soll sie stattdessen geöffnet bleiben. Den Browser-Rückweg
bestätigt Klaus als tadellos. Schließen bleibt seine eigene Entscheidung.

## Gebauter Stand

- Der Android-Host verwendet zuerst den bestehenden Ansichtsverlauf. Am Anfang gibt es
  keinen moveTaskToBack-Aufruf mehr. Eine Dokumentvorschau konsumiert Zurück vor dem
  Ansichtswechsel. Offene Eingabe-/Bestätigungsfenster werden nicht durch Navigation verlassen.
- Maus-Zurück führt durch Ansichten und endet am Anfang. Position und bestehende
  Bibliotheksfilter bleiben wie in 2.28.16 erhalten. Die privaten Ansichtsstände liegen
  weiterhin nur im Arbeitsspeicher; in Browserhistorie und Adressen stehen keine Objektkennungen.
- Workflow-PDF-Pro PR #59 wurde nach vollständiger grüner Prüfung als 1ea49db auf main
  zusammengeführt. Über `tools/pro-ausgabe-nachziehen.mjs` wurden ProFilesPlugin,
  PluginWorker und PdfPrintAdapter von genau diesem Commit bytegleich übernommen.
  Der neue Pin steht in native/HERKUNFT.json. Auch beim Android-Teilen aus Familienakte
  öffnet der Ausgabeadapter die Ziel-App in deren eigenem Task, ohne Aktivitäts-Rückkanal.
  Geöffnetes Teilen bestätigt weiterhin keine Zustellung. Normales Speichern behält seinen Rückkanal.
- Der parallele Familienakte-PR #68 liegt als d7f9703 auf main und wurde in PR #67 übernommen.
  PDF-Kern 1.1.9 stammt bytegleich von Workflow-PDF main 0ed15e5. Die Brücke bleibt erhalten;
  auch wfpdf_notstand_v1 und wfpdf_weiter_v1 erhalten den eigenen fa_wfpdf-Namensraum.

Paketfassung Android/Windows/PWA 2.28.17, sichtbare Zeile weiterhin 2.28.1.
Bestehende Kennungen, Signieridentitäten, Akteninhalte und Datenpfade bleiben erhalten.

## Konkrete Nachweise und Grenze

Die neue Browserprobe ist 3/0, die bestehende Verlauf-/Hinweisprobe 12/0. Herkunft,
vollständiger Bau und Klonprobe sind grün. Auf dem Main-Abgleich f742a07 liefen alle
vorhandenen PR-Prüfungen grün, einschließlich Windows und installierter Android-APIs 31/35.
Nach dem kanonischen Adapter-Nachzug ist der endgültige PR-Stand erneut vollständig zu prüfen.

Die echte Android-Zurück-Probe verwendet eine tatsächliche Eingabe und danach Ansichtswechsel
mit wiederholten Android-Zurück-Ereignissen. Neuer Host: 41686869818 grün. Bisheriger Host:
41685691916 rot, am Anfang CREATED statt RESUMED. Die früheren Vorläufe ohne reale
Eingabe sowie die versehentlich mitgestarteten leeren Plugin-Testmodule sind keine wirksamen Gegenproben.

Workflow-PDF-Pro: vollständige Freigabe 41693054268 auf d30deb4 grün, 51 Fälle auf jeder
Android-API 31/35, ohne Fehler oder übersprungene Fälle, Überinstallation mit Datenerhalt.
Das Telefon-Protokoll zeigt Senderaufgabe 8, Empfängeraufgabe 9 und Wiederverwendung 9.
Bisheriger Adapter in 41687211768: beide in Aufgabe 8, die konkrete Gegenprobe wird rot.
Das ist eine echte Android-OS-Probe mit veröffentlichter Empfänger-APK, keine physische
Samsung-/DeX-/Maus-Probe und keine vollständige verschlüsselte Tresor-App-Paar-Abnahme.
Die ältere zusätzliche Paar-Abnahme bleibt bei vier von sechs; PR #59 bleibt Entwurf.

## Weiter bis zur Veröffentlichung

Nach endgültig grüner PR-Pipeline PR #67 zusammenführen. Android und Windows 2.28.17
vom geprüften Main mit server=ja veröffentlichen. Öffentliche Dateien neu laden und
SHA-256 prüfen; PWA nach fertiger Windows-Veröffentlichung mit aktuellem Installer ausliefern.
Workflow PDF Pro 1.0.13 veröffentlicht diese Sitzung getrennt; Version 1.0.12 nicht erneut auslösen.
Danach Abschluss, neue Erklärungen im Geschenk und datierte Übergabesicherung erstellen.

Belegbarer gemeinsamer Zweigbeginn 2026-11-03T16:44:19Z (17:44:19 MEZ).
Das verstrichene Fenster enthält CI und Warten und ist keine persönliche Aktivstundenmessung.

```text
Aktuellen main-Stand laden und CLAUDE.md sowie den neuesten Appwechsel-Abschluss lesen.
Den bytegleichen Kern1.1.9 und die Herkunftspins erhalten. Keine schon veröffentlichte Fassung erneut ausgeben.
Eigene konkrete Geräte-Rückmeldungen mit vorhandenen Testunterlagen auswerten.
Familienakte PR #59 bleibt als zusätzliche unvollständige Android-Tresor-Paar-Abnahme Entwurf.
```
