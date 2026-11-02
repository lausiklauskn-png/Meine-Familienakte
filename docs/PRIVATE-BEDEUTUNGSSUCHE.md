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

## Prüfstand dieses Entwurfs

Die Java-Adapterprobe verwendet erfundene HTTP-Antworten mit echten Dateien:
25 Prüfungen zu Offline-Sperre, Wiederaufnahme, beschädigten Bytes, Abbruch und
Erhalt des bisherigen Modells. Die Browser-Indexprobe verwendet wirkliche
IndexedDB mit synthetischen Vektoren. Je drei absichtliche Verletzungen im
Downloadadapter und Index werden erkannt. Die gebaute Oberfläche besteht zwölf
Bedienproben; Geräte-/Downloadantworten und e5-Vektoren sind dabei gestellt.
Die bestehende Windows-Brückenprobe besteht weiterhin acht Fälle.

Offen vor Freigabe: vollständige native Android-/Windows-Prüfbauten dieses
Standes, tatsächliches Laden aller drei gepinnten e5-Modelle und Vergleich auf
erfundenen passenden Unterlagen. Modellgröße allein ist kein Qualitätsnachweis.
Der Browser hat in diesem Entwurf die gemeinsame Geräteprüfung; die dauerhafte
Modellablage ist zunächst an die beiden nativen Hüllen angebunden. Dieser Stand
ist noch keine abgeschlossene Veröffentlichung und kein fertiges Geschenk.
