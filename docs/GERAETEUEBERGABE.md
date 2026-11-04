# Familienakte zwischen Geräten

Die zusätzliche Übergabe im Sicherheitscenter ist an keinen Übertragungsweg gebunden: Das Paket geht auf einem Weg
nach Wahl zum anderen Gerät (Datei-Post, Mail, USB-Stick …). Jede Familienakte bleibt unabhängig; es gibt keine
automatische Synchronisierung. Seit 04.11.2026 (Klaus: „Text allgemeiner machen, Kim-sync raus“) nennt die Oberfläche
Kim-sync nicht mehr; der Weg über Kim-sync funktioniert weiter wie jeder andere Dateiweg.

1. Eine gespeicherte Unterlage und genau einen Empfänger oder ein Zielgerät wählen.
2. Das Übergabepaket speichern und auf einem Weg nach Wahl schicken. Es enthält die lesbare Originaldatei und ist
   selbst nicht verschlüsselt: Datei-Post verschlüsselt beim Senden, Mail und USB-Stick nicht. Immer als Datei
   senden, keine Bildbearbeitung verwenden.
3. Auf dem Zielgerät in der Familienakte das Paket öffnen, Vorschau prüfen und
   ausdrücklich in den Eingang übernehmen. Erst nach Datei, Eingangsdatensatz und
   Quittung in einer abgeschlossenen Transaktion gibt es eine Empfangsdatei.
4. Diese Datei über denselben Weg zurückgeben und in der sendenden Familienakte
   prüfen. Der Eingang wird bestätigt; die endgültige Einordnung bleibt getrennt.

Ein Paket gilt für einen Empfänger. Eine Empfangsdatei ist an Paket, Inhalt,
Quell-/Ziel-App und einen zufälligen Rückkanal gebunden. Sie ist kein
Identitätsnachweis. Für Gruppen je Zielgerät ein eigenes Paket erstellen.
Transportquittungen und ausgelöste Downloads bestätigen keine Familienakte-Ablage.

Das Original bleibt im gewählten Aktenordner oder Pro-Tresor. Gemerkt werden am
Ausgang nur Vertrag und Rückkanal, keine dauerhafte zusätzliche PDF-Sammlung.
Erneutes Speichern prüft das vorhandene Original und verwendet dieselbe Kennung.
Ein inzwischen fehlendes oder geändertes Original kann nicht mit der alten
Kennung ausgegeben werden. Neue Fassungen erhalten eine neue Kennung und gegebenenfalls
Quellbezug. Das Paket begrenzt die Originaldatei auf 20 MiB; Transportdienste können
diese Grenze nicht erweitern. Der JSON-Kopf ist auf 8 KiB begrenzt.

Android übernimmt den vorhandenen Dateiausgabebaustein aus Workflow PDF Pro
bytegleich; `tools/pro-ausgabe-nachziehen.mjs` und `native/HERKUNFT.json` halten die
Herkunft fest. Nach Speichern oder Abbruch wird das private Ausgabeticket entfernt;
Prozessstart bereinigt durch Prozessabbruch zurückgebliebene Ausgabekopien.
Windows benutzt den wirklichen nativen Speicherdialog und dieselbe gebündelte
Java-Laufzeit. Die Seite übergibt keinen Dateisystempfad. Im Browser wird der
Downloadstart ausdrücklich als solcher bezeichnet.

## Prüfstand des Gerätewegs

Java-Engine mit echten Dateien: Abbruch, unveränderte Bytes, fehlerhafte Prüfsumme,
Pfad-/Größengrenzen, fehlender Zielordner und Erhalt vorhandener Dateien geprüft.
20 MiB plus Paketkopf laufen durch die Produktions-Pipe mit 256 MiB Java-Heap.
Der installierte Windows-Prüfbau bedient den wirklichen Swing-Speicherdialog
und prüft Abbruch, Neustart und identische wiederholte Ausgabe. Die Android-
Produktprobe besteht auf API 31 und 35. Quelle: Windowslauf 41479596042 und
Androidlauf 41479595973, Quellstand b56443c. Die vollständigen Paare mit den
anderen drei installierten Pro-Apps bleiben ein eigener Nachweis. Androids zusätzliche Produktprobe verwendet die wirkliche
Oberfläche und das native Plugin; allein die Antwort des Systemdialogs ist
im Prüflauf gestellt. Windows bedient den wirklichen Swing-Speicherdialog.

Die lokale Chromium-154-Fassung stürzt nach Neustart beim zweiten Download ab;
das passiert auch mit einer unabhängigen 14-Byte-Testseite ohne Familienakte.
Die vollständige Zweiprofil-Probe bleibt aktiv und läuft mit der zum
Prüfwerkzeug gehörenden Browserfassung in GitHub: Lauf 41479596065 besteht
zwölf Bedien-/Speicherproben sowie fünf erkannte absichtliche Verletzungen. Ein solcher lokaler Abbruch
wird nicht als erfolgreiche Probe gezählt. Die zusätzliche Integration verwendet zwei wirkliche Kim-sync-Clients, den
wirklichen lokalen Datei-Post-Server und die produktiven Familienakte-Paket- und
Eingangsfunktionen. 20 MiB Original plus Paketkopf laufen über den bestehenden
Großdateiweg, die passende Familienakte-Empfangsdatei kommt zurück. Eine
Transportquittung allein bestätigt den Familienakte-Eingang weiterhin nicht.
Nur das Relay ist eine lokale Testgegenstelle; keine öffentliche Raumprobe.

Dabei wurde ein vorhandener Fehler in Kim-sync behoben: Beim Abschluss des
Uploads fehlte der Schreibnachweis. Der echte Datei-Post-Server lehnte das
korrekt mit 403 ab. Kim-sync #54 sendet ihn nun mit; eine Gegenprobe entfernt
ihn wieder und muss genau an dieser Stelle scheitern. Die Testkette hält beide
Quellen in `.github/workflows/pro-carriers.yml` fest.

Für diesen Weg genügt Datei-Post als vorhandener Dienst mit seiner Web-App,
auch unter Windows. Eine zusätzliche Pflicht-App oder zweite Raumverwaltung
ist dafür nicht nötig. Eigenständige Pro-Hüllen für Kim-sync/Datei-Post bleiben
das im Sitzungsbrief vorgemerkte Ausbauziel; diese Sitzung behauptet dafür
keine neuen APK-/Windows-Installer.
