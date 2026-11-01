# Dauerhafte Quittung im Pro-Verbund

## Dieses Teilstück

`app/pro-uebergabe.ts` prüft einen einzelnen Übergabevertrag gegen die wirklichen Dateibytes:
stabile Kennung, Quell-/Ziel-App, Quelldokument, Name/Typ, Größe und SHA-256. Die Familienakte
nimmt hier höchstens 20 MiB je Datei an. Ein falsches Ziel, veränderter Inhalt oder eine bereits
mit anderem Inhalt verwendete Kennung wird abgewiesen.

Die vorhandene Datenbank `FamilienakteStapel1` steigt kompatibel auf Fassung 3. Neue kleine
Quittungen liegen in `uebergaben`; Eingangsdatensatz, Originaldatei und Quittung werden in
einer einzigen Transaktion geschrieben. Paralleles oder späteres erneutes Senden liefert dieselbe
Quittung. Sie bleibt nach Einordnung oder Entfernung des Arbeitsfalls erhalten; die Originaldatei
wird dadurch nicht ein zweites Mal dauerhaft gesammelt. Browserdaten ausdrücklich löschen
löscht auch diese Quittungen.

Der Status heißt **im Eingang**, nicht endgültig in die Akte übernommen. Eine Quelle darf allein
wegen eines erfolgreichen Betriebssystem-Teilen-Fensters keine Zielablage behaupten.

## Bestehende Workflow-PDF-Brücke

Die Nachrichten prüfen weiterhin Ursprung und tatsächliches Rahmenfenster. Die Teilennachricht
hat eine eigene Anfragekennung und pro Datei einen stabilen, inhaltsbezogenen Vertrag. Das
Teilen-Promise löst sich erst nach der passenden dauerhaften Familienakte-Quittung auf. Fehlende
oder falsche Quittung ist kein Erfolg. Die Quelle im Klon bleibt erhalten; erneutes Teilen derselben
Fassung erzeugt keinen zweiten Eingang. Ein Scan wird zuerst dauerhaft aufgenommen und erst
danach mit dessen Eingangskennung zur Zuordnung geöffnet.

In Gegenrichtung ruft dieselbe Brücke den bereits offengelegten normalen Workflow-PDF-Importer
auf und wartet auf sein tatsächliches Ergebnis. Der bisher gestellte `launchQueue`-Verbraucher
reichte den Import unbestätigt weiter. Der kanonische Klon bleibt bytegleich. Vor der Quittung
liest die Brücke Dokumentdatensatz und Originalbytes wieder; bei Fotos zusätzlich das aufgehobene
Original. Wiederholungen suchen dieselben gespeicherten Originalbytes, bevor ein neuer Import
angelegt wird. Der Parent behält seine offene Übergabe bis zur passenden Bestätigung und bietet
bei Ablehnung „Erneut übergeben“ an.

## Nachweise und Grenzen

Vier Browser-Datenbankproben: falsche Daten/Ziele, kompletter Rücklauf bei Transaktionsabbruch,
parallele Wiederholung und Konflikt, Quittung nach Entfernen und Neustart. Vier gezielte
Fehler-Gegenproben gefangen. Vorhandene Brückenbedienprobe erweitert: absichtlich verzögerter
Import hält die Quelle offen; Teilen wartet; falsche Quittung wird ignoriert; erneutes Teilen
bleibt einfach. Zwei weitere Gegenproben für die früheren verfrühten Bestätigungen wurden gefangen. Brückenprobe 10/10, bestehende Klon-/Speichertrennung 16/16 im isolierten Prüfstand.

Eigenständige APK-/Windows-App-Paare und der gemeinsame Tresor-Rückkanal sind weitere
Bauabschnitte. Diese Browser-Brücke ist kein Nachweis ihrer vollständigen Gerätewege.
Der ältere optionale Zuordnungs-JSON-Vertrag aus `UEBERGABE.md` ist damit noch nicht ausgewertet.
