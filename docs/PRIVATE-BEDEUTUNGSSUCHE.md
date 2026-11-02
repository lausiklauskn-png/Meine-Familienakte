# Private Geräte- und Suchanbindung

Dieser Baustein verwendet die Geräteprüfung, den fortsetzbaren nativen
Modell-Downloader und die festen e5-Quellen aus Private Brain Pro, Quellstand
`326dc3d4ba1c709c0f818247e01bfb383c063ad3`. Übernahme:
`node tools/pro-modelle-nachziehen.mjs <Private-Brain-Pro-Checkout>`. Die sechs
unveränderten Dateien sind in `native/HERKUNFT.json` festgehalten. Eigene Brücken
liegen daneben; die kanonischen Dateien werden hier nicht angepasst.

In der Suche und im Sicherheitscenter stehen Geräteprüfung, bewusster Download,
Indexaufbau und Suche als getrennte Aktionen. Die vorhandene Wortsuche bleibt
erhalten. Das Modell wird nicht beim App-Start geladen. Der vorhandene
Internetschalter steuert auch den nativen Download; Abschalten schließt laufende
Verbindungen. Abgebrochene Dateien werden beim nächsten ausdrücklichen Versuch
fortgesetzt. Jede Modelldatei wird vor Verwendung frisch gegen ihren festen
SHA-256 geprüft, auch wenn ein früherer Prüfvermerk existiert.

Android liefert geprüfte Dateien als lokale WebView-Streams. Windows verwendet
dieselbe Java-Downloadlogik und Geräteprüfung in einer privaten Prozess-Pipe mit
der gebündelten Laufzeit. WebView2 liest Modelldateien als Streams aus dieser
lokalen Ablage. Es gibt keinen lokalen Netzwerkserver und keine große
Base64-Modellübertragung. Der Windows-Internetschalter synchronisiert seinen
bestehenden Zustand mit dieser Engine. Eine fehlende Modellroute deaktiviert
die optionale Modellfunktion, nicht die Familienakte.

Der private Worker verwendet ausschließlich die lokale Modellroute, einen
WASM-Thread und die feste Bibliotheksfassung 2.17.2. Remote-Modelle und deren
automatischer Nachladeweg sind abgeschaltet. Dokumenttexte und Suchfragen gehen
weder an Mycel noch an einen externen Dienst.

Der neu aufbaubare Index liegt getrennt von Originalen und Modell-Dateien in
`FamilienakteBedeutung1`. Seine Vektoren tragen Aktenkennung, Dokumentkennung,
Text-Hash, Modellkennung, Revision und Dimension. Originaltexte werden dort
nicht zusätzlich gespeichert. Ein Modellwechsel sammelt wiederaufnehmbar die
neuen Vektoren; erst eine abgeschlossene IndexedDB-Transaktion aktiviert den
vollständig geprüften Stand. Abbruch oder Fehler lassen den bisherigen Stand
erhalten. Geänderte, gelöschte und fremde Akteninhalte liefern keine alten Treffer.

Der Aufbau liest die tatsächlich gespeicherten Unterlagen und Akteneinträge.
PDFs werden über ihre Textebene gelesen, höchstens 60 verteilte Seiten und
300.000 Zeichen. Es startet keine OCR. Bilder ohne Textebene werden über ihre
Angaben gefunden. Lange Texte werden auf höchstens 60 Abschnitte verteilt;
begrenzte Abdeckung wird angezeigt. Treffer sind Ähnlichkeitsvorschläge, keine
behaupteten Antworten auf den Akteninhalt.

## Prüfstand

Die Java-Adapterprobe verwendet erfundene HTTP-Antworten mit echten Dateien:
25 Prüfungen zu Offline-Sperre, Wiederaufnahme, beschädigten Bytes, Abbruch und
Erhalt des bisherigen Modells. Die Browser-Indexprobe verwendet wirkliche
IndexedDB mit synthetischen Vektoren. Je drei absichtliche Verletzungen im
Downloadadapter und Index werden erkannt. Die gebaute Oberfläche besteht zwölf
Bedienproben; Geräte-/Downloadantworten und e5-Vektoren sind dabei gestellt.
Die bestehende Windows-Brückenprobe besteht weiterhin acht Fälle.

Die wirklichen drei Modelle wurden mit dem produktiven Java-Downloader,
Worker und IndexedDB auf acht erfundenen Unterlagen mit zehn Fragen geprüft
(darunter zwei englische Fragen). Alle drei trafen zehn von zehn erwarteten
Unterlagen; während Indexaufbau und Suche gab es keine externen Anfragen.
Das ist ein kleiner Abnahmesatz, kein Nachweis allgemeiner Suchqualität.

| Modell | Abgelegte Bytes einschließlich Laufzeit | Zeit je Abschnitt | Höchster gemessener Renderer-Speicher |
| --- | ---: | ---: | ---: |
| e5-small | 155.527.856 | 51 ms | 741 MiB |
| e5-base | 315.867.266 | 128 ms | 1.313 MiB |
| e5-large | 598.988.472 | 436 ms | 2.230 MiB |

Gemessen auf dem Linux-CI-Rechner, nicht auf Klaus' Tablet oder PC. Quelle:
[Modellprobe 41462584350](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41462584350),
wiederholt mit [41464815367](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41464815367).
Ein größeres Modell brachte in diesen Fällen keinen zusätzlichen richtigen Treffer.

Die installierte Android-App besteht auf API 31 und 35 die Probe mit echtem
kleinem Modell, ausdrücklichem Download, Offline-Index, erneuter Activity und
Trefferöffnung: [41474036543, Versuch 2](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41474036543/attempts/2).
Die installierte Windows-App besteht denselben tatsächlichen Modellweg einschließlich
Offline-Suche nach Neuladen und Trefferöffnung:
[41474036536](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41474036536).
Die dafür korrigierte lokale Modelladresse ist ein ausschließlich von WebView2
bedienter virtueller Host; es wird kein Modellserver im Netz kontaktiert.

Der Browser bietet die gemeinsame Geräteprüfung. Die dauerhafte Modellablage
ist an die Android- und Windows-Hüllen angebunden; die PWA bietet hier noch keine
Gleichheit der Speicherrechte. Auf einem persönlichen Tablet oder Windows-PC sind
Reaktionszeit und Speicherbedarf noch im Praxistest zu beurteilen. Dafür gilt die
[begrenzte Abnahme mit anschließendem Nutzertest](ABNAHME-UND-PRAXISTEST.md).
