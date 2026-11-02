# Begrenzte Abnahme und anschließender Praxistest

Klaus hat am 2. November 2026 eine feste Grenze für die technischen Prüfungen verlangt.
Das Ziel bleibt eine vollständige Abnahme aller sechs App-Paare. Der aktuelle, davon
abweichende Prüfstand ist unten ausdrücklich festgehalten. Danach werden konkrete
Rückmeldungen aus dem wirklichen Gebrauch ausgewertet.

## Tatsächlicher Abschlussstand am 2. November 2026

Vier der sechs zusätzlichen App-Paar-Proben sind vollständig bestanden: alle drei
Windows-Paare und Familienakte ↔ Private Brain Pro unter Android. Die Android-Paare
mit Workflow PDF Pro und BookLedgerPro sind **nicht bestanden beziehungsweise nicht
vollständig geprüft**. Im letzten gezielten Lauf verschwindet die Android-Testmaschine
während der nativen Ordner-/Passwortbedienung. Die ausgewerteten Gast- und Hostprotokolle
belegen keine Ursache. Ein fehlender App-Absturzbericht beweist keine fehlerfreie App.

PR #59 bleibt deshalb Entwurf. Seine fehlgeschlagenen Proben werden weder abgeschaltet
noch als Erfolg gewertet. Die regulären Produktprüfungen, native Aufnahmeproben und die
vier erfolgreichen Paare bleiben separat gültige Nachweise. Weitere allgemeine
Emulatorvarianten werden in dieser Sitzung nicht angehängt. Für die beiden offenen Wege
stehen die bereits erstellten manuellen Testreihen mit erfundenen Dateien bereit.

Klaus hat die Veröffentlichung geprüfter Teilstücke ausdrücklich beauftragt. Die
Veröffentlichung der regulär geprüften App-Stände ist daher von einer **noch offenen
Gesamtabnahme des Pro-Verbunds** zu unterscheiden. Download, Geschenk und Abschluss dürfen
keinen vollständigen Sechs-Paare-Nachweis behaupten. Einzelne Ergebnisse und Quellstände:
[PRO-VERBUND-PRUEFSTAND.md](PRO-VERBUND-PRUEFSTAND.md).

## Ende der technischen Abnahme

1. Der Bau und die vorhandenen Pflichtprüfungen bestehen für Android und Windows.
2. Je eigenständiger Gegenstelle funktioniert ein Hin- und Rückweg mit tatsächlichen,
   erfundenen PDF-Dateien: Workflow PDF Pro, Private Brain Pro und BookLedgerPro.
   Dabei zählen Originalinhalt, Prozessneustart, wiederholtes Senden und eine Bestätigung
   erst nach dauerhafter Aufnahme. Emulator und installierte Windows-App auf CI werden
   ausdrücklich von einem Test auf dem persönlichen Gerät unterschieden.
3. Es gibt keinen bekannten Fehler, der Daten verliert, eine nicht erfolgte Aufnahme
   bestätigt oder den normalen Start blockiert.
4. Die Veröffentlichungen verwenden die bisherigen Paketkennungen und Signieridentitäten.
   Downloads und Prüfsummen werden kontrolliert. Erst dann wird das Geschenk fertiggestellt.

Keine zusätzlichen allgemeinen Testserien nach diesem Ziel. Eine neue Gegenprobe entsteht
nur für einen konkret gefundenen Fehler. Bereits bestandene Proben werden nur nach einer
relevanten Änderung, einem Fehlschlag oder einer offenen konkreten Frage wiederholt.
Kleinere Bedienprobleme und zusätzliche Sonderfälle gehen in die nächste Fassung.

## Kurzer Versuch am eigenen Gerät

Zuerst eine Sicherung anlegen und mit Kopien arbeiten. Geeignet sind ein gewöhnlicher
PDF-Brief, ein Foto als Originaldatei und eine mehrseitige PDF. Vertrauliche Inhalte bleiben
auf dem eigenen Gerät; für eine Fehlermeldung genügt zunächst die Beschreibung des Ablaufs.

| Schritt | Erwartetes Ergebnis |
| --- | --- |
| Familienakte starten und eine Testdatei öffnen | Richtiger Name und lesbarer Inhalt |
| Dieselbe Datei an eine verbundene Pro-App geben | Nur diese Datei wird bereitgestellt; Quelle bleibt erhalten |
| In der Ziel-App aufnehmen | Datei ist dort dauerhaft vorhanden; Familienakte kann den Empfang bestätigen |
| Beide Apps schließen und wieder öffnen | Datei und Übergabestand bleiben erhalten |
| Eine bearbeitete Fassung zurückgeben | Eigener Eingang mit Bezug zur früheren Fassung; bisheriges Original bleibt |
| Ein zweites Mal dieselbe Fassung senden | Kein zweiter Eingang allein durch Wiederholung |
| Optional ein Gerätepaket über Kim/Datei-Post übertragen | Erst die zurückgegebene Familienakte-Empfangsdatei bestätigt die Aufnahme |

Für den Start genügt ein vollständiger Ablauf pro tatsächlich genutzter Verbindung.
Weitere Fälle ergeben sich aus dem normalen Gebrauch, nicht aus einer immer längeren Pflichtliste.

## Rückmeldung und Auswertung

Pro Fehler festhalten: Gerät und Betriebssystem, App und technische Version, Dateityp und
ungefähre Größe, ausgeführte Schritte, erwartetes Ergebnis und tatsächliche Anzeige.
Dazu: wiederholbar ja/nein, Original noch vorhanden ja/nein. Bei Bedarf einen bereinigten
Bildschirmausschnitt ergänzen. Keine Passwörter, Freigabecodes oder privaten Originale in die Liste.
Eine leere Vorlage liegt in [PRAXISTEST.csv](PRAXISTEST.csv).

Das zusätzliche [HTML-Praxispaket](../tools/praxistest/README.md) enthält zehn getrennte
Reihen mit Downloads und Notizfeld je Schritt. Sechs erfundene Dokumente decken Kauf,
Rechnung, zugehörige Zahlung, Gesundheit, Schule und Fahrzeug ab; feste Sollwerte nennen
Person, Absender, Kunden-/Dokumentnummer, Datum und Betrag. Dazu kommen Bild, Formular
und ein absichtlich ungeordneter Fünferstapel. Automatisches Öffnen wird separat von
manuellem Import erfasst. Windows, Android, beide Übertragungsrichtungen, Fernrechner
und die Pro-Apps haben eigene Reihen. Die ausgefüllte HTML oder JSON ausdrücklich
herunterladen; der Browser überschreibt die ursprünglich geöffnete Datei nicht.

Datenverlust, falsche Empfangsbestätigung und Startblockaden werden zuerst untersucht.
Ein reproduzierbarer Fehler erhält eine gezielte Gegenprobe, die Korrektur und denselben
Praxisschritt zur Bestätigung. Bedienwünsche und seltene Sonderfälle werden für das nächste
Update gesammelt. Es gibt keine ungefragte Telemetrie oder automatische Übermittlung privater Dateien.
