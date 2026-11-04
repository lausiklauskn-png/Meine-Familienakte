# Bibliothek und Datenweg

Eine bestehende Aktenunterlage benutzt Workflow PDF als vorübergehenden Arbeitsraum.
Design, PDF-Kern und Dokumentinhalt werden durch diesen Adapter nicht umgestaltet.

| Bedienweg | Speicherung |
|---|---|
| Familienakte → Ausfüllen | Liest die vorhandene Datei. Speichern aktualisiert denselben Akteneintrag. Die ausfüllbare Fassung enthält echte Formularwerte; die zusätzliche Feldmaske enthält keine Eingaben oder Unterschriftsbilder. |
| Familienakte → In Workflow PDF öffnen | Ein einzelnes gebundenes Dokument wird ausschließlich im Arbeitsspeicher des eingebetteten Frames geöffnet. Keine zusätzliche dauerhafte PDF-Bibliothek und keine gespeicherten Notstandskopien. |
| Gebundener Raum → In Akte zurückspeichern / Teilen | Der unveränderte PDF-Exporter liefert das Ergebnis. Die Brücke prüft die Herkunft. Erst nach bestätigter dauerhafter Speicherung im ursprünglichen Akteneintrag schließt sich der Raum und kehrt zur Herkunftsansicht zurück. |
| Workflow PDF direkt aus dem Menü / Scan | Der bisherige unabhängige Bibliotheks- und Eingangspfad bleibt verfügbar. Neue, dort erzeugte Unterlagen gehen über die Eingangsprüfung. |
| Eigenständige Pro-App | Eigene Bibliothek und Pro-Tresor. Kein allgemeiner Abgleich der Dokumentbestände mit der Familienakte. |

Kennung, Kategorie, Dokumentdatum, Notizen und Verknüpfungen bleiben bei der Rückgabe
bestehen. Der Speicher prüft Aktenkennung, Ausgangspfad und tatsächliche Prüfsumme.
Eine zwischenzeitlich verschobene, geänderte oder gelöschte Quelle wird nicht durch
eine alte Bearbeitung ersetzt. Wiederholte Empfangsbestätigungen sind idempotent.

Im lokalen Ordner wird zunächst eine geprüfte PDF im selben Ordner vorbereitet.
Anschließend wechselt das Register auf diese Datei; erst danach wird die frühere,
anderweitig nicht mehr verwendete Datei entfernt. Der technische Dateiname kann
sich ändern. Es bleibt derselbe sichtbare Akteneintrag. Ein Aufräumjournal wiederholt
unterbrochene Bereinigung; Register und Sicherungsregister verweisen vorher bereits
auf die neue PDF. Ein Speicherfehler vor dem Registerwechsel erhält die Quelle.

Der native Pro-Tresor speichert unveränderliche Revisionen. Die Rückgabe benutzt
denselben Tresor und dieselbe logische Dokumentkennung; interne Revisionen können
bestehen bleiben. Es entsteht kein zweiter Familienakteneintrag und kein stiller
Ersatz im lokalen Ordner, wenn der Pro-Tresor gesperrt ist.

Die vorübergehende Bibliothek gilt nur beim gebundenen Öffnen einer Aktenunterlage.
Früher ausdrücklich in die separate Bibliothek importierte Dokumente werden nicht
gelöscht. Favoriten und Einstellungen dürfen erhalten bleiben. Beim Verlassen des
Raums ohne Rückgabe werden ungespeicherte Änderungen verworfen; die Quelle bleibt.

Die Brücke prüft Ursprung, Absenderfenster, Sitzungsbindung, Dateianzahl und
Exportherkunft. Die Dokumentrückgabe benötigt weder GitHub noch einen Upload.
Optionale KI-Funktionen haben eigene Übertragungswege und Schutzgrenzen; siehe
[PDF-SCHUTZABGLEICH.md](PDF-SCHUTZABGLEICH.md). Insbesondere bedeutet gereinigtes
Seitenbild nicht automatisch anonymisierte sichtbare Personendaten.

Nachweise: `run-pdf-rueckgabe-tests.mjs` prüft den echten Speicherweg mit gestelltem
Dateisystem und nativer Brücke einschließlich Fehlern, Parallelbearbeitung und
Wiederholungen. Die Gegenprobe entfernt den Konfliktschutz und muss scheitern.
`run-pdf-arbeitsraum-tests.mjs` prüft die echte Brücke zusammen mit dem unveränderten
Datenbankmodul einschließlich verbotener dauerhafter Speicherung. Browserproben
prüfen echte PDF-Ausgabe, OPFS-Register, unveränderte Anzahl und Rückkehr zur Akte.
