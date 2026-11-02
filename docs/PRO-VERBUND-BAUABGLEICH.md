# Bauabgleich zum Auftrag vom 1. November 2026

Dieser Stand trennt fertige Teilstücke vom noch offenen Gesamtauftrag. Grundlage sind der Sitzungsbrief,
PR #48 und #49 sowie Klaus' ergänzende Freigabe im Chat: Windows mitziehen, geprüfte Stücke
veröffentlichen, Geschenk-HTML erst nach dem vollständigen Bau.

| Bauabschnitt | Tatsächlicher Stand | Nächster Nachweis / offene Arbeit |
| --- | --- | --- |
| Dauerhafter Eingang | PR #48 auf main; Datei und Datensatz atomar, Neustart vorgesehen | Weiter als Grundlage verwenden |
| Bestehenden Pro-Tresor verbinden | PR #49 auf main; Android-SAF und Windows-Tauri mit kanonischem Java-Paket | Reale Datenträger/Dialoge auf Nutzergeräten bleiben Geräteprobe |
| Originale im Pro-Tresor | In diesem Teilstück: ausdrückliche Wahl je Arbeitsstand, einzelne Übernahme, Quelle erhalten, Prüfsummen, portable Sicherung | Android-/Windows-Prüfbau vor Merge; echter Installer wird zusätzlich installiert und geprüft |
| Hülleneingang | In diesem Teilstück: Erfolg erst nach dauerhafter Eingangstransaktion; fehlgeschlagene Android-Lesevorgänge und PWA-Vorräte behalten | Browserprobe und Gegenprobe; keine Android-Ziel-App-Bestätigung aus OS-Teilen ableiten |
| Geräteprüfung / Modellwahl | Quellen und vorhandene Prüfsummen in Private Brain Pro geprüft; noch nicht angeschlossen | Adapter auf Android und Windows, bewusste Downloads, fortsetzbarer Index mit Modell-/Textstand, bisher nutzbaren Index erhalten |
| Portal aufteilen | Tresoranbindung, Dokumentknopf und Suchergebnisaufbau getrennte Komponenten; Suche in `app/portal-suche.ts` mit ausdrücklichen Eingaben | Bestehende Suchproben und Gegenproben erhalten; keine neue Oberfläche durch die Aufteilung |
| Eingebettetes Workflow PDF | Im Folgeabschnitt: beide Richtungen warten auf tatsächliche Zielablage; korrelierte Quittungen und idempotenter Familienakte-Eingang gebaut | Datenbank-/Brückenproben und Gegenproben grün; vollständige Plattformprüfbauten vor Merge |
| Eigenständige Pro-Apps | Kanonisches Paket mit Private-Brain-Eingang und ausgewählten FPT1-Übergaben in Workflow-PDF-Pro #51 gemergt. Familienakte-Seite für Android/Windows gebaut: gemerkter Ausgang, Zielmarken, atomarer Eingang, Quellbezug | Gegenstellen in BookLedgerPro/Private Brain Pro/Workflow PDF Pro und deren Windows-Anschlüsse noch in Arbeit. Java-Akteure sind keine vollständige App-Paar-Probe |
| Geräteübergreifender Transport | Kim-sync plus Datei-Post empfohlen; kein privater Netzwerkversuch erfolgt | Vorhandene Anbindung und tatsächliche Quittungsgrenze umsetzen; Originaldateimodus für Bilder; kein zweites Raumsystem |
| Name / Updates | Bestehende Kennungen und Versionen erhalten | Sichtbar Familienakte Pro; Update-Zuordnung bewahren; geprüfte Android-/Windows-Veröffentlichung mit steigender technischer Version |
| Geschenk | Vorlage nur gelesen; noch nicht gebaut | Erst zum Schluss tatsächliche Download-Dateien, Erklärungen und belegte Bilder einarbeiten |

## Beim erneuten Prüfen behobene Fehlerquellen

- Ein Pro-Verweis durfte zuvor von Größe/Prüfsumme im Aktenregister abweichen. Lesen und Sicherung
  lehnen diesen Widerspruch jetzt ab; Originalbytes werden zusätzlich geprüft.
- Eine beschädigte Windows-Verbindungsdatei verhinderte zuvor schon den Start der Engine. Jetzt wird
  ein ausdrücklicher Fehlerzustand gezeigt. Bewusstes Neuverbinden bewahrt die alte Datei und stellt
  nur die Verbindung wieder her; weder leerer Ersatzbestand noch stiller Reset.
- Hüllen meldeten das Auslösen eines JavaScript-Ereignisses bereits als Erfolg. Jetzt quittiert die
  bestehende dauerhafte Eingangs-Transaktion. Android gab bei teilweise unlesbaren Stapeln zusätzlich
  auch die ungelesenen Quellen frei; jetzt nur nachweislich gelesene und angenommene Dateien.
- Der Windows-Prüfbau prüfte bisher Bau und einzelne Laufzeitteile, aber nicht die installierte
  Verpackung. Ein eigener Prüfschritt installiert jetzt den wirklichen NSIS-Installer und benutzt
  dessen Java-Laufzeit. Der 20-MiB-Rückweg wird mit dem Produktionslimit von 256 MiB geprüft.

Die Modell-/Übergabeabschnitte sind keine erledigten Funktionen. Ein grüner Teilbau darf sie nicht
als fertig ausweisen. Gestellte native Brücken, echte Java-Dateien, Browser und wirklicher
Windows-Installer werden in den Nachweisen jeweils bezeichnet.

## Grundlage für Geräte- und Suchanbindung (2. November)

Der eingebettete Workflow-Kern folgt der geprüften Fassung 1.1.8 (Quellcommit
`1ef7c6fddbb289893e83d54a5aeb2ada764792cb`). Seine gewöhnliche Ausgabe behält die
Kennungen der tatsächlich beteiligten Dokumente. Die eigene Familienakte-Brücke
und ihre Datenbank bleiben der Zugangsweg. Das Kopierwerkzeug verlangt einen
sauberen, festgelegten Git-Stand und prüft alle Quelldateien vor dem Ersetzen der
bisherigen Kopie. Fehlender Git-Zugriff, lokale Quelländerungen oder ein nicht mehr
passender Einstieg brechen ohne Verlust der bisherigen Kopie ab.

Die Windows-Java-Engine verwendet den festen Laufzeitordner mit relativem
JAR-Klassenpfad. Damit funktionieren auch die von Tauri gelieferten erweiterten
Windows-Pfade. Die Rust-Probe verwendet jetzt selbst einen solchen absoluten
Ressourcenpfad; die installierte Laufzeit wird weiterhin separat geprüft.

Lokal bestehen Bau und 36 der 37 Oberflächenproben. Die Einzeldatei-Probe kann in
dieser Cloud-Umgebung wegen `ERR_BLOCKED_BY_ADMINISTRATOR` bei `file://` nicht
laufen. Sie bleibt unverändert in der vollständigen GitHub-Prüfung. Ein lokaler
Abbruch wegen dieser Richtlinie gilt nicht als bestandene Einzeldatei-Probe.
