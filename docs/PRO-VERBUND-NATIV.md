# Ausgewählte Übergaben im gemeinsamen Pro-Tresor

Stand 2. November 2026: Familienakte-Seite für Android und Windows. Der vollständige
App-Verbund ist erst mit den passenden Gegenstellen und App-Updates benutzbar.

In der Dokumentenbibliothek gibt „An Pro-App geben …“ genau eine Unterlage weiter.
Die Auswahl nennt Workflow PDF Pro, Private Brain Pro und BookLedgerPro. Die Quelle
bleibt erhalten. „Weitergegeben“ bezeichnet die geprüfte Ablage im Übergabefach.
Das Sicherheitscenter liest auf ausdrückliche Wahl die Marke der Empfänger-App;
erst diese macht daraus „vom Ziel im Eingang bestätigt“. Endgültige Einordnung
in eine Akte oder Buchhaltung ist ein eigener Schritt.

Der Ausgang merkt seine Kennung vor der nativen Ablage in der bestehenden kleinen
Arbeitsdatenbank. Ein erneuter Versuch mit derselben Datei und demselben Ziel
verwendet sie wieder. Geänderte Bytes ergeben eine eigene Fassung. Eingegangene
Unterlagen behalten den geprüften Vertrag im Eingangsdatensatz und Aktenregister;
eine bearbeitete Rückgabe verweist auf ihre Quelle. Vollsicherungen erhalten diese
Angaben. Es werden keine fremden Metadaten als Arbeitsanweisungen ausgeführt.

Der Empfänger prüft Größe und SHA-256, speichert Datei, Eingang und Quittung in
einer abgeschlossenen Transaktion und setzt danach die native Übernahmemarke.
Scheitert deren Schreiben, bleibt der Vorgang wiederholbar. Eine fremde
Tresorkennung, gesperrter oder umgezogener Speicher führt zu einem Fehler.
Es wird kein Ersatzbestand angelegt; gemeinsame Originale werden nicht gelöscht.

Die Java-Dateien stammen bytegleich aus Workflow-PDF-Pro `f3569f0` (PR #51).
Familienakte-Adapter, Android-Plugin und Windows-Java-Engine verwenden dieselben
Verträge. Tauri erlaubt nur die benannten Methoden. Die Dateigrenze bleibt 20 MiB.
Für Workflow PDF Pro sind PDF und Bilder vorgesehen; für BookLedgerPro zusätzlich
nicht leere EML-Dateien. Die PWA bietet diesen nativen Ordneranschluss nicht an.

Prüfungen dieses Abschnitts: acht Browserfälle mit echter IndexedDB und gestellter
nativer Grenze; sechs absichtlich beschädigte Zusicherungen werden erkannt.
Zehn Dokumentfälle prüfen unter anderem Originalbezug und portable Sicherung.
Die echte Windows-Java-Engine prüft die Hin-/Rückwege mit den drei kanonischen
Java-Akteuren sowie den 20-MiB-Produktionskanal mit 256 MiB Heap. Native Dialoge,
SD-Karte und vollständige fremde App-Oberflächen werden dadurch nicht simuliert
und nicht als am Gerät geprüft ausgewiesen.
