# Pro-Tresor: erster Android-Anschluss

Abhängig von der dauerhaften Eingangsspeicherung aus PR #48. Quelle des gemeinsamen Pakets:
`Workflow-PDF-Pro` @ `5e78919de6dfb04cf65cec1dce884f4bc628c274`.
Die zehn Dateien `de.familyprojekt.tresor` und deren Originalprobe sind bytegleich übernommen,
gepinnt in `native/HERKUNFT.json`. Aktualisieren: `node tools/tresor-nachziehen.mjs /pfad/Workflow-PDF-Pro`.

## Sichtbares Teilstück

Nur in Android, unter „Sicherheit und lokaler Tresor“: vorhandenen Pro-Tresor wählen, mit nativem
Passwortdialog öffnen, Ort/Kennung/Zustand sehen, sperren und erneut entsperren. Kein Passwort in der
Web-Brücke oder in Einstellungen. Gemerkt werden nur die Baum-URI und die Tresorkennung. Nach Neustart
bleibt der Anschluss gesperrt. Androids dauerhafte Lese-/Schreibfreigabe wird kontrolliert.

Dieser erste Anschluss stellt die bestehende Dokumentablage **noch nicht** um. Das steht auch auf der
Oberfläche. Windows und PWA bekommen keinen vorgetäuschten Android-Anschluss. Keine neue Raumverwaltung,
keine Modell-Downloads und keine Änderung an Paketkennung, Tresorkennungen, Datenbanken oder Version.

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

`tests/ui/pro-tresor.test.mjs`: gestellte native Brücke, bewusste Verbindung, Ort/Kennung, Sperre,
abgebrochener Wechsel, entfernte SD-Karte und kein nativer Anschluss in der PWA.
Gegenproben in `tests/gegenprobe-sitzung-b.mjs` (Filter `Pro-Tresor`).

Kein echtes Android-Gerät, keine echte SD-Karte, keine Android-Ordnerwahl am Gerät gemessen. Native
Übersetzung/Lint müssen im Android-Prüfbau bestehen. Ein erfolgreicher Build ersetzt keine Geräteprobe.
