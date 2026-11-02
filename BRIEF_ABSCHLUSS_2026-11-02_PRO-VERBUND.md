# Abschluss: Familienakte Pro 2.28.15

Der vereinbarte Familienakte-Bau ist auf main und als Android-APK, Windows-Setup und
PWA veröffentlicht. Produktquelle beider nativen Pakete:
`d00902f10a5b57902084e42950d62751385a9d93` (PR #63).
Die **vollständige Gesamtabnahme aller App-Paare bleibt offen**: vier von sechs
zusätzlichen Paarwegen sind vollständig belegt, zwei Android-Wege nicht vollständig geprüft.
Das ist ein Abschluss des Familienakte-Baus mit benannten Prüfgrenzen, kein Sechs-Paare-Zertifikat.

## Ergebnis des Bauauftrags

- Vorhandener kanonischer Pro-Tresor auf Android und Windows; ausdrückliche Ordnerwahl,
  Quelle erhalten, Prüfsummen, erkennbare Zugriffsfehler und kein stiller Ersatzbestand.
- Ausgewählte Dateien und bearbeitete Rückgaben zwischen eigenständigen Pro-Apps; stabile
  Übergabekennung, Inhaltsprüfung und Bestätigung erst nach dauerhafter Aufnahme.
- Eingebettetes Workflow PDF mit eigener Bibliothek und bestätigter Brücke bleibt erhalten.
  Es ersetzt die Verbindung zur separat gestarteten Workflow PDF Pro nicht.
- Bestehende Geräteprüfung und e5-Modellwahl übernommen; bewusster Download, Wiederaufnahme,
  privater Index mit Modell-/Textstand und Erhalt des vorher verwendbaren Index.
- Optionaler begrenzter Metadatenvertrag; fremde Angaben bleiben Vorschläge zur Prüfung.
- Gerätepaket und passende Empfangsdatei für Kim-sync/Datei-Post; eine Transportzustellung
  ist keine Familienakte-Empfangsbestätigung. Keine automatische Gesamtsynchronisierung.
- Tresor-, Dokument-, Übergabe- und Suchmodule vom großen Portal abgegrenzt; keine neue
  Oberfläche allein für Codeordnung.
- Sichtbarer Produktname Familienakte Pro. Technische Updatefassung 2.28.15; die gewünschte
  sichtbare Versionszeile 2.28.1, Kennungen, Datenpfade und Signieridentitäten bleiben.

Der vollständige [Bauabgleich](docs/PRO-VERBUND-BAUABGLEICH.md) ordnet jedes Teilstück dem
Auftrag zu. Die Zusammenarbeit folgt Klaus' SAP-Vergleich als Verbund freiwilliger,
eigenständig nutzbarer Apps; es wurde keine SAP-Anbindung oder zusätzliche Pflichtzentrale gebaut.

## Tatsächliche Downloads

[Familienakte im Browser öffnen](https://lausiklauskn-png.github.io/Meine-Familienakte/).
Pages-Veröffentlichung 41533260856 ist erfolgreich.

- [Familienakte-android-v2.28.15.apk](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/download/android-v2.28.15/Familienakte-android-v2.28.15.apk), 19.783.637 Byte; SHA-256 `0106450679554b0d1e9b0bcdb79447b8b9a040636ac089d0d0442141eafe5654`.
- [Familienakte-Einzeldatei-2.28.15.html](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/download/android-v2.28.15/Familienakte-Einzeldatei-2.28.15.html), 3.297.481 Byte; SHA-256 `b4b4a58086ee4fd0cb5feaf1e1891d3b3b0c4365fdee2b6ca44f66db9ce2a54d`.
  Veröffentlichung: [Lauf 41533299440](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41533299440).
- [Familienakte-Windows-2.28.15-x64-setup.exe](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/download/windows-v2.28.15/Familienakte-Windows-2.28.15-x64-setup.exe), 33.931.818 Byte; SHA-256 `57e05c3d683cf2a2bf472426b306dc3bdf51a1387a9c248c0eef947f5fc91397`.
  Veröffentlichung: [Lauf 41533308106](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41533308106).

APK, Einzeldatei und Windows-Setup wurden anonym erneut heruntergeladen. Größe und
SHA-256 stimmen mit den öffentlichen GitHub-Assets überein. Beide Veröffentlichungen
haben die Pakete außerdem auf den bestehenden Update-Server gelegt, die bestehenden
Ed25519-Feed-Unterschriften geprüft und Feed, Unterschrift und Paket von außen verglichen.
Der Cloudzugang zu family-projekt.de ist lokal gesperrt; kein lokaler Serverabruf behauptet.

Android verwendet die dauerhafte Signieridentität. Der bestehende Veröffentlichungsweg
kennzeichnet die APK auf GitHub weiterhin als Testveröffentlichung. Der Windows-Installer
bleibt unsigniert; die Feed-Unterschrift ist keine Windows-Programmsignatur. Der normale
Installer wird vor dem getrennten Modell-Prüfbau gesichert und ausschließlich dieser
normal gebaute Installer veröffentlicht. Ein persönliches Update mit echten Beständen
ist damit noch nicht beobachtet; vor einem eigenen Update eine Sicherung anlegen.

## Prüfungen und Gegenproben

PR #63, exakter Kopf `e9b0bf0326989eb246259133a838546658ab4ea0`:

| Pflichtprüfung | Erfolgreicher Lauf |
| --- | --- |
| Typen, Fachprüfungen, Lint, Herkunft, PWA/Einzeldatei und Browser | 41527487481 |
| Android-Bau | 41527487514 |
| Installierte private Suche auf Android API 31 und 35 | 41527487442 |
| Windows-Bau, installierte Laufzeit, wirkliche Modellsuche und Dateiausgabe | 41527487548, Versuch 2 |

Der erste Windows-Versuch bestand die nativen Tresor-/Ausgabe-/20-MiB-Pipe-Proben,
erreichte aber den lokalen Prüfport 9333 nicht, obwohl die App ansprechbar war.
Genau dieser Job wurde einmal unverändert wiederholt und bestand vollständig
(Job 125569962920). Die Ursache des ersten Startfehlers ist nicht abschließend geklärt.
Auch die spätere Windows-Veröffentlichung mit installierter Probe ist erfolgreich.
Der erste Fehlschlag wird nicht rückwirkend zum Erfolg erklärt.

Lokal: npm ci und vollständiger Bau erfolgreich; Herkunft bytegleich; Lint 0 Fehler
und 10 bestehende Warnungen. Die vollständige Browserprüfung wurde in der vorgesehenen
CI-Fassung bestanden. Lokales file:// ist durch die Cloudrichtlinie gesperrt; diese
Grenze wurde nicht als Erfolg gewertet. Frühere gezielte Gegenproben der gebauten
Speicher-, Übergabe-, Modell- und Transportzusicherungen bleiben in den zugehörigen
PRs und Prüfprotokollen belegt. Keine neue allgemeine Gegenprobenserie im Abschluss.

Die zusätzlichen tatsächlichen Paarberichte stehen im
[Prüfstand](docs/PRO-VERBUND-PRUEFSTAND.md) und in
[Originalberichten](docs/pro-verbund-nachweise.json). Drei Windows-Paare und Android
mit Private Brain Pro sind vollständig. Android mit Workflow PDF Pro und BookLedgerPro
bricht in der Testmaschine während nativer Ordner-/Passwortbedienung ab. Zwei erfasste
Family-triggerEvent-Seitenfehler bleiben benannt. PR #59 bleibt Entwurf.

Die wirkliche 20-MiB-Datei-Post-Probe lief mit lokalem Datei-Post-Server und lokalem
Test-Relay; kein öffentlicher Raum und keine persönlichen Geräte. Die PWA hat nicht
die nativen Tresor-/Modellrechte der installierten Apps. Reale Scanner, SD/USB, Monitore,
Fernrechner und weitere Android-Systeme gehören zur begrenzten Nutzerprobe.

## Gegenstellen und offene Nachweise

Die eigenständigen Gegenstellen sind in ihren eigenen Repositories dokumentiert:
[Workflow PDF Pro](https://github.com/lausiklauskn-png/Workflow-PDF-Pro),
[Private Brain Pro](https://github.com/lausiklauskn-png/Privat-Brain-Pro),
[BookLedgerPro](https://github.com/lausiklauskn-png/BookLedgerPro). Deren tatsächliche
Versions-/Downloadnachweise stehen jeweils in Produktstand und Abschlussunterlagen.
Workflow PDF Pros Android-Freigabe wurde während dieser Abschlussvorbereitung zweimal
durch den Prozesscheck nach Überinstallation gestoppt. PR #55 dort ordnet den Prozesscheck
nach der vorhandenen sichtbaren Startbereitschaft ein und erhält die zwingende Prüfung
eines laufenden Prozesses; tatsächliche Veröffentlichung erst nach regulärer Abnahme.
Die Korrektur ist kein Nachweis einer vollständigen Android-App-Paar-Abnahme.

Kleinere bekannte BookLedger-Anzeigen (roher Vertragsauszug, 01.01.1970 bei fehlender
Übergabezeit) gehören in eine Folgefassung; das ist kein geändertes Originaldatum.
Datenverlust, falsche Empfangsbestätigung oder Startblockaden haben bei konkreten
Rückmeldungen Vorrang vor zusätzlichen Bedienwünschen.

## Praxisunterlagen und Geschenk

Zehn eigenständige Testbögen mit sechs erfundenen A4-Unterlagen, Bildprobe, Formular,
Fünferstapel und festen Sollwerten sind erstellt. Pro Schritt Status und Notiz sowie
Gerät/App-Version; HTML-/JSON-Ergebnis ausdrücklich speichern und erneut öffnen.
Die vorhandenen sieben Browserabläufe und vier Übersichtsprüfungen sind getrennte
Browsernachweise, keine Aussage über Klaus' Scanner oder Gerät.

Klaus bestätigte den Download der separaten reinen HTML-Anleitung ohne Links
(75.740 Byte). Die große Gesamt-HTML mit eingebetteten Dateien (4.614.299 Byte) und
deren eigener Speichern-Knopf scheiterten auf seinem Gerät. Die lokale Browserprobe
beweist keine Reparatur dieses Downloadwegs. Keine weitere Erweiterung des Testpakets.

Das Geschenk wird als `Familienakte-Pro-2.28.15-Geschenk.html` im Chat ausgegeben,
mit ZIP-Alternative, aktuellen tatsächlichen Downloadverweisen, Erläuterungen und
Bildern zur freiwilligen Zusammenarbeit unter Windows und Android. Installer werden
nicht in diese schlanke Datei eingebettet; ihre Downloads benötigen Internet.
Die Ausgabe folgt dem fertigen App-Bau und den Veröffentlichungen. Die benannten
Prüfgrenzen müssen auch im Geschenk sichtbar bleiben. Die Datei liegt außerhalb des Repos.

## PR-Abgleich

PR #63 hat die sinnvollen Veröffentlichungsänderungen aus dem früher auf #59
gestapelten #60 auf main übernommen. #60 ist deshalb geschlossen, #59 bleibt Entwurf.
Praxisunterlagen #61/#62 sind übernommen. Ältere überholte oder fachfremde Entwürfe
werden nicht pauschal gemergt; Entscheidungen: [PR-Abgleich](docs/PR-ABGLEICH-2026-11-02.md).

## Stundennachweis

Belegte gemeinsame Zeitfenster: 1. November 2026, 14:09:02–16:32:52 Uhr MEZ
(13:09:02–15:32:52 UTC); 2. November 2026, ab 08:06:21 Uhr MEZ (07:06:21 UTC)
bis zur Familienakte-Abschlussaufzeichnung um 23:27:05 Uhr MEZ (22:27:05 UTC).
Die Fenster enthalten CI und Wartezeit. Sie begrenzen die innerhalb dieses Fensters
mögliche aktive Arbeit nach oben; aktive Stunden, Vorarbeit außerhalb des Fensters und
Klaus' persönliche Anwesenheit wurden nicht gemessen. Die Nachtpause ist ausgenommen.
Überlappende Repository-Zeiten werden nicht addiert. Der endgültige gemeinsame
Sitzungsdatensatz wird in Kimhub geführt; diese Aufzeichnung ist keine zweite Stundenbuchung.

## Startauftrag zum Einfügen

```text
Repository lausiklauskn-png/Meine-Familienakte, aktuellen main-Stand laden.
Zuerst CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-02_PRO-VERBUND.md und docs/PRO-VERBUND-PRUEFSTAND.md lesen.
Familienakte Android/Windows 2.28.15 und PWA sind veröffentlicht; dieselben Versionen nicht erneut auslösen.
Vier App-Paare sind vollständig geprüft: drei Windows-Paare und Android mit Private Brain Pro.
Android mit Workflow PDF Pro und BookLedgerPro ist nicht vollständig geprüft; PR #59 bleibt Entwurf.
Nächster Schritt ist eine konkrete Nutzer-Rückmeldung aus den vorhandenen Testbögen oder die gezielte VM-Diagnose.
Keine neue allgemeine Testreihe, keine automatische Gesamtsynchronisierung und keine frühe Empfangsbestätigung.
Originale, Identitäten und Datenpfade bewahren. Vor Änderungen git status prüfen; fremde Inventaränderungen nicht übernehmen.
Aktuelle Gegenstellen-Releases in deren eigenen Abschlussunterlagen prüfen. Forschung nur in Kimhub; Zeiten nicht doppelt addieren.
```
