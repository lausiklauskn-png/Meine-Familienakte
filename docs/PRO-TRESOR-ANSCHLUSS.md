# Pro-Tresor: Anschluss und ausgewählte Originale für Android und Windows

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

Das erste Teilstück (#49) stellt die bisherige Dokumentablage noch nicht um. Das darauf folgende
Dokumentenstück ergänzt die bewusste Wahl „Neue Originale in diesem Pro-Tresor ablegen“ je Akten-Arbeitsstand.
Die PWA bekommt keinen vorgetäuschten nativen Anschluss; sie kann bestehende Pro-Verweise ohne native
Brücke nicht lesen. Keine neue Raumverwaltung, Modell-Downloads oder Änderung der Paket-/Datenbankkennungen.

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

## Dokumentenstück

Die Ablagewahl steht im jeweiligen Aktenregister, nicht in einer globalen Browser-Einstellung. Ein
anderer Arbeitsstand übernimmt sie nicht. Die native Brücke prüft die erwartete Tresorkennung ebenfalls.
Bei gesperrtem, entferntem oder anderem Tresor wird die Quelle behalten; es entsteht kein interner Ersatz.
Eine erfolgreiche native Ablage bestätigt Kennung, Eintrag, Bytezahl und SHA-256. Erst danach wird das
Aktenregister geschrieben. Dessen Erfolg ist Voraussetzung für die bekannte Eingangsbestätigung und
das Freigeben der vorläufigen Arbeitsdatei. Die stabile native Dokumentkennung ermöglicht Wiederaufnahme
nach einem Registerabbruch, ohne noch einmal dieselbe Originalfassung anzulegen.

Originale und bewusst beibehaltene Scan-Bilder liegen verschlüsselt im Familienakte-Fach. Das kleine
Aktenregister trägt Verweise mit Tresorkennung, Eintrag, Größe und Prüfsumme. Beim Lesen werden die
Originalbytes nach dem nativen Prüfen auch gegen den Registerverweis geprüft. Kein dauerhaftes internes
Klartext-Doppel neuer Pro-Dokumente; Register, bisherige Arbeitsstände und spätere Vektoren bleiben getrennt.

Einzelne bisherige Unterlagen können über „In Pro-Tresor übernehmen“ eingezogen werden. Erst geprüfte
native Ablage und Registerschreiben melden Erfolg. Die alte Quelle wird dabei ausdrücklich beibehalten
und als weiterer Speicherort dokumentiert. Kein automatischer Gesamteinzug oder Löschen eines Altbestands.

Export und manuelle Dokumentensicherung lesen Pro-Verweise über denselben Adapter. Eine Vollsicherung
materialisiert geprüfte Originale und Scan-Bilder ausschließlich im bewusst gewählten Sicherungsziel.
Ihr eigenes Register hat gewöhnliche Dateipfade und keine Pflichtbindung an den Pro-Tresor; Wiederherstellen
funktioniert deshalb auch ohne native Brücke. Die aktive Akte bleibt unverändert. Diese Sicherung ist wie
der bisherige Export **lesbar**, nicht eine neue verschlüsselte Pro-Sicherung; die Oberfläche sagt das vor
der Wahl. Zwei Arbeitsstände, die denselben tatsächlichen Pro-Tresor verwenden, gelten nicht als unabhängige
Sicherungen. Das Entfernen eines Akteneintrags löscht keine kanonischen Originale.

**Noch offen:** gemeinsame Übergabefächer mit Übernahmemarken und bestätigte Rückwege zu den drei
eigenständigen Apps. Private Brain hat im bisher übernommenen Kanon weiterhin kein eigenes Übergabefach.

## Proben

`node tools/native/test-pro-tresor.mjs`: echte JVM-Dateien mit echter Kanon-Kryptografie; erfundener
Workflow-Tresor wird über den vorhandenen Umzugskern kopiert. Originale bleiben bytegleich. Geprüft:
Fehlzugang, falsche Kennung, wiederholte Ablage, neue Fassung, 20-MiB-Grenze, Leseabbruch, Neustart,
Kanon-Leser einer anderen App, Bitfehler, Sperre, fehlender Kopf, ausgetauschter Tresor und Umzugsvermerk.
Die Originalprobe `TresorOrdnerTest` läuft zusätzlich in Androids Unit-Tests.

`node tools/native/test-pro-tresor-engine.mjs`: echte Windows-Engine mit gestellten Dialogen, echte
Kanon-Dateien; Zustand, Originalbytes, falsche Kennung, Fehlwechsel/Abbruch, Sperre, gesperrter Neustart,
entfernter Speicher, kanonischer Leser einer anderen App und bewusste Reparatur einer beschädigten Verbindung bei erhaltener Altdatei. Auch die erfolgreiche 20-MiB-Ablage samt Rücklesen läuft mit dem Produktionslimit von 256 MiB Java-Heap. Zusätzlich echter
Unterprozess mit Produktionsprotokoll, geschlossener Eingabe und ungültiger Aktion.

`tests/ui/pro-tresor.test.mjs`: gestellte Android-/Tauri-Brücke, bewusste Verbindung, Ort/Kennung, Sperre,
abgebrochener Wechsel, entfernte SD-Karte, Windows-Bedienung und kein nativer Anschluss in der PWA.
Gegenproben in `tests/gegenprobe-sitzung-b.mjs` (Filter `Pro-Tresor`).

`node scripts/run-pro-tresor-dokumente-tests.mjs` (auch Pflichtteil von Build und Fachprüfung): echter
Akten-Speichercode mit gestellt abgebildetem Dateisystem und nativer Brücke; 9 Fälle für bewusste Wahl,
getrennte Arbeitsstände, Quelldateien, falsche Bestätigung, Bitänderung gleicher Länge, Registerabbruch,
Wiederaufnahme, Einzug, portable Vollsicherung samt Scan-Bildern, getrennte Dokumentensicherung und
Nichtlöschen kanonischer Originale sowie Widersprüche zwischen Register und Originalverweis. 9 gezielte Gegenproben müssen die absichtlichen Vertragsbrüche fangen.
`tests/ui/pro-dokumente.test.mjs` prüft den tatsächlichen Bedienweg im Browser mit gestellter nativer Brücke.

Kein echtes Android-/Windows-Gerät, keine echte SD-Karte und keine Ordnerwahl am Gerät gemessen.
Native Übersetzung/Lint und Windows-Installer müssen in den jeweiligen Prüfbauten bestehen.
Die lokale Cloud enthält Java-Compilermodule, aber keine jmods zum Bauen der zugeschnittenen Laufzeit;
deren Bau läuft mit dem vollständigen Temurin-JDK im Windows-Workflow. Ein Build ersetzt keine Geräteprobe.


Windows-Prüfbau und Veröffentlichung installieren zusätzlich den wirklichen NSIS-Installer in einen
eigenen temporären Weg. Sie vergleichen den installierten Java-Kern, führen die Tresorprobe mit der
installierten zugeschnittenen Laufzeit aus und prüfen deren echte Prozess-Pipe. Das prüft die
Verpackung; native Dialogbedienung und reale Datenträger am Nutzergerät werden damit nicht behauptet.

Die Hüllenfreigabe (Android/PWA/Windows) wartet jetzt auf die bestätigte Eingangs-Transaktion.
Unlesbare Android-Quelldateien und nicht bestätigte PWA-Vorräte werden nicht vorzeitig freigegeben.
Die Browserprobe prüft einen teilweise unlesbaren Stapel und Neustart;
`run-huellen-eingang-tests.mjs` prüft insbesondere, dass der Ereignisversand allein kein Erfolg ist.
