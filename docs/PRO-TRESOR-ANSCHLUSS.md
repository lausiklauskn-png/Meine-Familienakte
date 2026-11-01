# Pro-Tresor: erster Anschluss für Android und Windows

Abhängig von der dauerhaften Eingangsspeicherung aus PR #48. Quelle des gemeinsamen Pakets:
`Workflow-PDF-Pro` @ `5e78919de6dfb04cf65cec1dce884f4bc628c274`.
Die zehn Dateien `de.familyprojekt.tresor` und deren Originalprobe sind bytegleich übernommen,
gepinnt in `native/HERKUNFT.json`. Aktualisieren: `node tools/tresor-nachziehen.mjs /pfad/Workflow-PDF-Pro`.

## Sichtbares Teilstück

In Android und Windows, unter „Sicherheit und lokaler Tresor“: vorhandenen Pro-Tresor wählen, mit nativem
Passwortdialog öffnen, Ort/Kennung/Zustand sehen, sperren und erneut entsperren. Kein Passwort in der
Web-Brücke oder in Einstellungen. Gemerkt werden nur der Ordnerort und die Tresorkennung. Nach Neustart
bleibt der Anschluss gesperrt. Androids dauerhafte Lese-/Schreibfreigabe wird kontrolliert; ungenutzte
Freigaben werden nach Abbruch oder Wechsel gelöst.

Dieser erste Anschluss stellt die bestehende Dokumentablage **noch nicht** um. Das steht auch auf der
Oberfläche. Die PWA bekommt keinen vorgetäuschten nativen Anschluss. Keine neue Raumverwaltung,
keine Modell-Downloads und keine Änderung an Paketkennung, Tresorkennungen, Datenbanken oder Version.

## Windows-Brücke

Tauri verwendet denselben Java-Kanon und denselben `ProTresorAdapter` über eine private Prozess-Pipe.
Der Installer bündelt eine mit Java 21/jlink gebaute Laufzeit (`java.base`, `java.desktop`); keine separate
Java-Installation beim Nutzer. Die Engine öffnet native Ordner-/Kennwortdialoge, speichert Ort/Kennung
atomar im App-Arbeitsstand und bleibt bis Sperren oder App-Ende geöffnet. Keine TCP-Ports, keine
Kennwörter in WebView oder Kommandozeile. Prozessanforderungen und Antworten sind größenbegrenzt;
ein fehlender oder abgestürzter Prozess erzeugt keinen Ersatzbestand. Der Installer wird dadurch größer.

Die Engine greift über `DateiAblage` auf lokale Ordner, USB/SD und freigegebene Laufwerke zu, soweit
Windows Zugriff gewährt. Ein entfernter Datenträger bleibt mit Ort/Kennung als nicht erreichbar sichtbar.
Ein beschädigter gespeicherter Anschluss wird gemeldet und niemals als neuer leerer Anschluss behandelt.

## Adapterkern und nächster Anschluss

`ProTresorAdapter` öffnet ausschließlich einen vorhandenen Tresor mit erwarteter Kennung; nie Neuanlage
oder Ersatzspeicher. Jede Operation prüft Kopf und Umzugsvermerk erneut. Gespeichert wird ausschließlich
im Familienakte-Fach, im gemeinsamen `fpt1`-Format. Ein Dokumentpfad enthält die Dokumentkennung;
identische Bytes und Metadaten unter derselben Kennung werden wiederverwendet, geänderte Bytes bleiben
als neue Fassung neben dem Original. Vor Erfolg bestätigt der Kanon Datei und Inhaltsverzeichnis.

Migration ist zunächst eine einzelne, bewusst ausgewählte Datei: Quelle bleibt bis zur dauerhaften
Bestätigung des Aktenregisters erhalten. Keine automatische Migration eines Bestands. Bis 20 MiB werden
Originalbytes im Arbeitsspeicher verarbeitet; es gibt keine native Klartextdatei oder interne PDF-Sammlung.
Die Brücke begrenzt auch die Base64-Eingabe. Für die spätere Stapelanbindung sollte die Brücke stückweise
übertragen, um die mehrfachen Speicherkopien einer 20-MiB-Datei zu verringern.

**Offen:** Aktenregister mit Tresorverweis verbinden, ausgewählte bestehende Dateien einziehen und ihre
Quellen erst nach Registerbestätigung bereinigen; Sicherung/Export auf diese Verweise abstimmen.
Die nativen Methoden `speichern` und `lesen` sind vorbereitet, werden von der jetzigen Oberfläche nicht
aufgerufen. Kein behaupteter App-zu-App-Empfang: gemeinsame Übergabefächer, Übernahmemarken und
bestätigte Rückwege folgen separat. Private Brain hat im Kanon weiterhin kein eigenes Übergabefach.

## Proben

`node tools/native/test-pro-tresor.mjs`: echte JVM-Dateien mit echter Kanon-Kryptografie; erfundener
Workflow-Tresor wird über den vorhandenen Umzugskern kopiert. Originale bleiben bytegleich. Geprüft:
Fehlzugang, falsche Kennung, wiederholte Ablage, neue Fassung, 20-MiB-Grenze, Leseabbruch, Neustart,
Kanon-Leser einer anderen App, Bitfehler, Sperre, fehlender Kopf, ausgetauschter Tresor und Umzugsvermerk.
Die Originalprobe `TresorOrdnerTest` läuft zusätzlich in Androids Unit-Tests.

`node tools/native/test-pro-tresor-engine.mjs`: echte Windows-Engine mit gestellten Dialogen, echte
Kanon-Dateien; Zustand, Originalbytes, falsche Kennung, Fehlwechsel/Abbruch, Sperre, gesperrter Neustart,
entfernter Speicher, kanonischer Leser einer anderen App, beschädigter Arbeitsstand. Zusätzlich echter
Unterprozess mit Produktionsprotokoll, geschlossener Eingabe und ungültiger Aktion.

`tests/ui/pro-tresor.test.mjs`: gestellte Android-/Tauri-Brücke, bewusste Verbindung, Ort/Kennung, Sperre,
abgebrochener Wechsel, entfernte SD-Karte, Windows-Bedienung und kein nativer Anschluss in der PWA.
Gegenproben in `tests/gegenprobe-sitzung-b.mjs` (Filter `Pro-Tresor`).

Kein echtes Android-/Windows-Gerät, keine echte SD-Karte und keine Ordnerwahl am Gerät gemessen.
Native Übersetzung/Lint und Windows-Installer müssen in den jeweiligen Prüfbauten bestehen.
Die lokale Cloud enthält Java-Compilermodule, aber keine jmods zum Bauen der zugeschnittenen Laufzeit;
deren Bau läuft mit dem vollständigen Temurin-JDK im Windows-Workflow. Ein Build ersetzt keine Geräteprobe.
