# Familienakte zwischen Geräten

Die zusätzliche Übergabe im Sicherheitscenter verwendet vorhandene Kim-sync-Räume
oder Datei-Post-Codes. Jede Familienakte bleibt unabhängig. Es entsteht kein
weiteres Raumsystem und keine automatische Synchronisierung.

1. Eine gespeicherte Unterlage und genau einen Empfänger oder ein Zielgerät wählen.
2. Das Übergabepaket speichern. Es enthält die lesbare Originaldatei. Erst Kim-sync
   beziehungsweise Datei-Post verschlüsselt seine Übertragung. In Kim-sync über
   die Büroklammer als Originaldatei senden; keine Bildbearbeitung verwenden.
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

## Noch offener Prüfstand dieses Entwurfs

Java-Engine mit echten Dateien: Abbruch, unveränderte Bytes, fehlerhafte Prüfsumme,
Pfad-/Größengrenzen, fehlender Zielordner und Erhalt vorhandener Dateien geprüft.
20 MiB plus Paketkopf laufen durch die Produktions-Pipe mit 256 MiB Java-Heap.
Native Speicherdialoge und die vollständige Paarprobe sind bis zum grünen
CI-Nachweis offen. Androids zusätzliche Produktprobe verwendet die wirkliche
Oberfläche und das native Plugin; allein die Antwort des Systemdialogs ist
im Prüflauf gestellt. Windows bedient den wirklichen Swing-Speicherdialog.

Die lokale Chromium-154-Fassung stürzt nach Neustart beim zweiten Download ab;
das passiert auch mit einer unabhängigen 14-Byte-Testseite ohne Familienakte.
Die vollständige Zweiprofil-Probe bleibt aktiv und läuft mit der zum
Prüfwerkzeug gehörenden Browserfassung in GitHub. Ein solcher lokaler Abbruch
wird nicht als erfolgreiche Probe gezählt. Transport über den wirklichen
Datei-Post-Dienst und die Kim-sync-Anbindung ist noch gesondert nachzuweisen.
