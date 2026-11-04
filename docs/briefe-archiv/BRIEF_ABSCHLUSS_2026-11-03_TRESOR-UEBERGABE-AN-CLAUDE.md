# Übergabe an Claude Code: Datentresor, Speicherort und Abgleich

Klaus übergibt am 03.11.2026 die weitere Tresorprüfung an seine bereits begonnene Claude-Code-Sitzung. Diese Übergabe sichert die Rückmeldung und den vorhandenen Codepfad. Sie enthält keine neue Tresorreparatur und keine erneute App-Veröffentlichung.

## Auftrag und beobachteter Ablauf

Klaus wählt einen Speicherort. Es kommt weder eine verlässliche Bestätigung, dass der Ort dauerhaft gemerkt wurde, noch zunächst eine Fehlermeldung. Erst beim Abgleich erscheinen Fehler. Er berichtet, der Datentresor sei „über den Server“ auf seiner SD-Karte eingerichtet worden. Was der Server in diesem Ablauf genau übernimmt und welcher Ordner bzw. welche Android-URI tatsächlich gewählt wurde, ist noch offen.

Ziel: den tatsächlich verwendeten Speicherort nachvollziehbar anzeigen, seine dauerhafte Verbindung prüfen und den Abgleich mit der richtigen Quelle starten. Die tatsächliche SD-Karten-Konfiguration muss geklärt werden; ein falsch gespeicherter Pfad ist bisher nur eine Vermutung. Vorhandene Akten und Tresore erhalten. Claudes bereits begonnene Änderungen zuerst lesen und weiterverwenden.

## Bildschirmfoto: genauer Wortlaut

Ansicht: Startseite → Dokumente → Bestand prüfen. Sichtbar ist Familienakte Pro, Version 2.28.1. Die installierte technische Paketfassung lässt sich daraus nicht bestimmen. Die alte Datumszeile im Fuß ist ebenfalls kein verlässlicher Paketnachweis. Das Bild liegt in dieser Unterhaltung; die wesentlichen Meldungen stehen hier vollständig.

Rot:

> Fehlgeschlagen: Analyse-Hauptordner und Familienakten-Datentresor sind derselbe Ordner. Bitte als Analysequelle den übergeordneten „SOFTWARE TESTORDNER“ auswählen; der Datentresor wird darin geschützt ausgeschlossen.

Gelb:

> Prüfung erforderlich: Der verbundene Ordner „Browser-Datentresor“ wird jetzt einschließlich aller Unterordner mit der vorhandenen FaWoGa-Bestandsanalyse geprüft.

Info im Inhalt:

> Verwende den bereits vorbereiteten und verbundenen Testbestand. Die ZIP-Ausgangsdatei selbst soll nicht als analysierter Bestand verwendet werden.

Das Foto belegt diese Anzeigen. Es belegt weder die reale SD-URI noch einen Datenverlust. Die Testordner-Empfehlung nicht ungeprüft auf Klaus' produktiven Tresor anwenden.

## Konkrete Einstiegsstellen im abgeglichenen main

Basis dieser Prüfung: `4b4f991baa68d0d88a991b8b17e1f4f6444ac82d`.

- `app/health-portal.tsx`: `startVaultInventoryComparison()` setzt den `vaultHandle` als Analysequelle und ruft `scanInventorySource(vaultHandle)` auf. `scanInventorySource(source)` übergibt an `scanInventoryFolder` zugleich `source` und `register: vaultHandle`. Dieser Aufrufpfad setzt Quelle und Register also gleich. Einstieg im Sicherheitscenter: „Jetzt Abgleich durchführen“. Den Startseitenknopf separat verfolgen; `startComparison()` ist eine andere Funktion.
- `app/local-vault.ts`: `scanInventoryFolder()` prüft `directoryRelationship(source, register)` und wirft bei `relationship.same` exakt die rote Meldung aus dem Foto. Die Schutzprüfung gegen Selbstanalyse und Rekursion erhalten. Nicht einfach entfernen, um den Lauf grün zu bekommen.
- `app/local-vault.ts`: `rememberedVault()`/`chooseVault()` und die getrennten Schlüssel für Aktenordner und Analysequelle prüfen. Ohne gemerkten externen Handle kann der Aktenbestand den Browser-Datentresor verwenden. Die Anzeige „Browser-Datentresor“ ist damit ein konkreter Hinweis auf diesen Pfad, kein Nachweis eines funktionierenden SD-Anschlusses.
- `app/pro-tresor-anschluss.tsx` und `app/pro-tresor.ts`: eigener nativer Pro-Tresor-Anschluss mit Zustand, Ort, Tresor-ID, Entsperrung und Auswahl als Ablage für neue Originale. Diese Verbindung nicht mit dem Browser-Aktenregister oder einem Analyseordner gleichsetzen.
- `android/app/src/main/java/de/familyprojekt/familienakte/FamilienakteTresorPlugin.java`: Android-SAF-Baumwahl, persistierte Lese-/Schreibfreigabe und gemerkte `uri`, `id`, `name` im Speicher `familienakte-pro-tresor`. Zustand und tatsächliche Erreichbarkeit nach Neustart prüfen. Android-`content://`-Verweise nicht durch geratene Windows- oder `/storage/...`-Pfade ersetzen.
- `tests/ui/knoepfe-sicherheit.test.mjs`: Die vorhandene Browserprobe für „Jetzt Abgleich durchführen“ meldet `derselbe Ordner`/`SOFTWARE TESTORDNER` bereits über `bekannt(...)` und fährt fort. Sie belegt damit keine gelungene Tresorprüfung. Nach einer Korrektur den tatsächlich gewünschten Ablauf behaupten und prüfen, nicht nur die Fehlermeldung akzeptieren. Die Probe stellt Ordnerwahl mit OPFS dar und ersetzt keine native SD-Karte.

Die Bildschirmmeldung passt zum statisch gelesenen Gleichheitskonflikt. Die separate Behauptung „Speicherort wurde nicht richtig gemerkt“ wurde hier am Gerät nicht nachgestellt. Beide Fragen getrennt prüfen und erst mit Nachweis verbinden.

## Zuerst klären, dann korrigieren

1. Claudes aktuelle Arbeitskopie und den tatsächlichen installierten Build abgleichen. Sichtbare Version 2.28.1 reicht nicht. Kein Überschreiben paralleler Änderungen.
2. Die Rollen der Speicherorte festhalten: Browser-Aktenregister, nativer Pro-Tresor, Analysequelle sowie gegebenenfalls Netz-/Serververbindung. Erfragen, was „über den Server“ in Klaus' bestehendem Ablauf bedeutet. Update-Server, Netzfreigabe und lokale SD-Auswahl nicht gleichsetzen.
3. Nach bewusster Ordnerwahl sofort den tatsächlich bestätigten Ort und Zustand zeigen: ausgewählt, gespeichert, erreichbar, lesbar/schreibbar, gesperrt oder offen. Einen erfolgreichen Prüfstand erst nach wirklicher Prüfung behaupten; fehlende Freigabe oder abgebrochene Auswahl klar melden. Keine zusätzliche stumme Ablage erzeugen.
4. Neustart und Wiederverbinden nachprüfen. Es muss derselbe Tresor mit derselben Kennung bleiben. Eine fehlende SD-Karte oder entzogene Freigabe darf nicht still zu einem leeren internen Tresor führen.
5. Den Abgleich so führen, dass Quelle und Ziel fachlich passen. Selbstanalyse früh verständlich verhindern bzw. den ausdrücklich gewählten Quellbestand korrekt verwenden. Produktiven Nutzern nicht pauschal „SOFTWARE TESTORDNER“ als Speicherort verordnen. Aus einem gewählten Kindordner nicht still auf alle übergeordneten Dateien zugreifen.

## Begrenztes Abnahmeziel für Claude

Keine neue allgemeine Testmatrix. Eine erfundene PDF und ein kleiner eindeutig benannter Quellordner reichen für den ersten Ablauf. Folgende sechs gezielte Fälle mit Ergebnis und tatsächlichem Gerät dokumentieren; diese Liste ist ein Auftrag, keine bereits bestandene Prüfung:

1. Gewählten SD-Pro-Tresor verbinden: passender Ort/Kennung und ehrliche Bestätigung oder sofort verständlicher Fehler.
2. App neu starten: derselbe gespeicherte Verweis bleibt erreichbar; Kennung und vorhandene Testdatei stimmen.
3. Kleinen getrennten Quellordner prüfen: erfundene PDF wird gefunden, Register/Tresor nicht als eigene Quelle durchlaufen; Original bleibt erhalten.
4. Identischen Quell- und Registerordner absichtlich wählen: klarer früher Hinweis, keine Selbstanalyse oder Rekursion. Ist der Tresor ein Unterordner der ausdrücklich freigegebenen Quelle, muss er geschützt ausgeschlossen bleiben.
5. Freigabe entziehen bzw. SD nicht erreichbar: verständlicher Zustand am richtigen Schritt, gemerkter Ort bleibt sichtbar, kein stiller Speicherwechsel. Danach dieselbe Verbindung wiederherstellen.
6. Gerätespeicher bzw. unterstützter Windows-Ordner als Alternative: SD bleibt optional; die Korrektur darf diese vorhandenen Wege nicht verschlechtern. Browser-/OPFS-Probe getrennt kennzeichnen.

Eine sinnvolle neue Funktionsprobe muss mit dem alten fehlerhaften Ablauf scheitern und mit der Korrektur bestehen. Die bestehende Selbstanalyse-Sperre ist kein zu beseitigender Fehler. Nach gezielter Korrektur die vorhandenen erforderlichen Fach-/Browser-/Plattformprüfungen ausführen; keine Wiederholung allein zum Erzeugen größerer Zahlen. Physisches Android/SD, Emulator, Browser und Windows jeweils klar benennen. Nicht verfügbare Geräte bleiben ungeprüft.

## Bestehenden Produktstand bewahren

Familienakte 2.28.17 ist auf Android/Windows mit bestehender Identität und `server=ja` veröffentlicht; PWA ist ausgeliefert. Workflow PDF Pro 1.0.13 ist ebenfalls auf Android/Windows veröffentlicht. Appwechsel und Zurück-Korrektur sind vorhanden. Dieselben Fassungen nicht erneut veröffentlichen. Vor einem späteren Release den aktuellen Main und die tatsächlichen Releases neu lesen.

Der eingebettete PDF-Kern 1.1.9 bleibt bytegleich. Kanonische Tresorbausteine ausschließlich im Quellrepo ändern und über `tools/tresor-nachziehen.mjs` nachziehen; `native/HERKUNFT.json` und `npm run check:herkunft` erhalten. Andere Herkunftswerkzeuge gelten für ihre eigenen Bausteine. Keine Schlüssel, Passwörter oder privaten Akten in Git, Berichten oder Proben. Keine Tresor-Neuanlage oder Migration als vermeintliche Reparatur.

Die ältere zusätzliche vollständige Android-Tresor-Paar-Abnahme bleibt 4/6; Familienakte PR #59 bleibt Entwurf. Die gewöhnliche Android-Teilen-Korrektur ersetzt diese Prüfung nicht. Geschenk und datierte Sicherung vom 03.11.2026 liegen vor; der erfolgreiche ZIP-Download auf Klaus' Gerät ist noch nicht bestätigt.

## Links für die Übernahme

- Vorangegangener Appabschluss: https://github.com/lausiklauskn-png/Meine-Familienakte/blob/4b4f991baa68d0d88a991b8b17e1f4f6444ac82d/BRIEF_ABSCHLUSS_2026-11-03_APPWECHSEL-UND-ZURUECK.md
- Veröffentlichungsnachweise: https://github.com/lausiklauskn-png/Meine-Familienakte/blob/4b4f991baa68d0d88a991b8b17e1f4f6444ac82d/docs/VEROEFFENTLICHUNG-2.28.17.json
- Zugehöriger aktueller Kimhub-Abschluss: https://github.com/lausiklauskn-png/Kimhub/blob/main/docs/sessions/ABSCHLUSS_2026-11-03_tresor-uebergabe-an-claude.md

## Zeitnachweis dieser Übergabe

Beginn: **03.11.2026 22:41:25 MEZ / 21:41:25 UTC**. Briefstand: **03.11.2026 22:47:09 MEZ**, bis dahin **6 Minuten**. Danach folgen Bereitstellung und vorhandene Prüfketten als Nachlauf. Das endgültige erfasste Übergabefenster steht im zugehörigen Kimhub-Eintrag. Es ist ein Zeitfenster einschließlich CI/Warten, keine gemessene persönliche Anwesenheit. Der bereits erfasste App-Baublock von 185 Minuten wird nicht erneut addiert; der belegte frühere Abschlussnachlauf wird getrennt nachgetragen. Unbelegte Warte- und Beratungslücken nicht als Arbeitszeit auffüllen.

```text
Claude Code: aktuellen main von Meine-Familienakte und Kimhub laden und deine begonnene Tresorarbeit zuerst abgleichen.
BRIEF_ABSCHLUSS_2026-11-03_TRESOR-UEBERGABE-AN-CLAUDE.md vollständig lesen.
Fehlende Bestätigung nach Speicherortwahl und den Gleichheitskonflikt Quelle/Register getrennt untersuchen.
Tatsächliche SD-URI, dauerhafte Freigabe, Tresor-ID, Neustart und den richtigen Analyseweg prüfen.
Den Selbstanalyse-Schutz erhalten; keine Testordner-Empfehlung blind auf Produktivdaten anwenden.
Bestehende Identitäten, Originale, bytegleichen PDF-Kern und Herkunftspins erhalten.
Sechs gezielte Abnahmefälle, alte Fehler-Gegenprobe und erforderliche Prüfungen ehrlich dokumentieren.
Zeit, tatsächlichen Arm und neue ausgeführte Proben ausschließlich nach der vorhandenen Kimhub-Methode ergänzen.
```
