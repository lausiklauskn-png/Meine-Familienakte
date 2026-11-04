# PDF-Schutz und KI-Wege

## Gemeinsamer Kern

Am 04.11.2026 wurden die wirklichen Dateien aus Workflow-PDF `0ed15e5`, Pro und
Familienakte verglichen. Neun Bausteine sind bytegleich: Prüfer für Formate, Mail
und Anhänge, Eingang, Reinigung, Felderkennung, Übersetzung, Bildbeschreibung und
Schlüsseltresor. Reinigung, Felderkennung und Schlüsseltresor sind auch in der
zweiten Kopie für den React-Dialog gleich.

`tools/pdf-schutz.mjs` vergleicht diese Bytes. Der gemeinsame Updatebefehl ruft den
Vergleich sowohl bei Gleichstand als auch vor einer Übernahme auf. Der Workflow
speichert den Vergleich als `schutz.json`. Eine Abweichung stoppt das Update.

Das belegt den gemeinsamen Kern, nicht automatisch jeden möglichen Aufrufweg.

| Weg | Schutz und Grenze |
|---|---|
| Vollständiger PDF-Klon und Pro | Gleicher Eingangskern erkennt Muster für KI-Anweisungen, versteckten Text und weitere unterstützte Befunde. Prüfung bleibt manuell; nicht erfolgte Teile werden als ungeprüft benannt. |
| Pro und vollständiger Klon: KI-Felderkennung/Übersetzung | Gemeinsame Reinigung entfernt unterstützte unsichtbare Texte und Bild-Metadaten vor dem Versand; Bestätigung/Abbruch und Vermerke am Dokument. Sichtbarer Text kann weiterhin personenbezogen sein. |
| Familienakte: „Mit KI benennen“ im eigenen Ausfülldialog | Textweg: Beschriftungen, Feldlagen und Seitentext, keine Feldwerte und keine Bilder. Unsichtbarer Text wird mit dem gemeinsamen Reinigungskern gefiltert. Zusätzlich Pseudonymisierung mit Modul 25, Vorschau und Klartext-Leckprüfung. Rückersetzung bleibt lokal. Geschützte Gesundheitsunterlagen haben diesen KI-Weg nicht. |
| Familienakte: allgemeiner KI-Textauftrag | Modul 25 plus Namen aus der Akte und ergänzende Muster; Zuordnung und Rückersetzung lokal, Leckprüfung. Bei „App ändern“ werden keine Dokumente mitgegeben. |

**Bereinigung ist keine Anonymisierung.** Pro-Seitenbilder und Familienakte-Textaufträge
sind keine identischen Übertragungswege. Für Pro wird keine generelle Anonymisierung
aller sichtbaren Namen oder Anschriften behauptet. Der Familienakte-Klon verwendet
die Pro-/Workflow-PDF-Funktionen; die zusätzlichen Schutzregeln des separaten
Familienakte-Dialogs gelten nicht automatisch im Klon. Deshalb öffnet die Familienakte
geschützte Gesundheitsunterlagen nicht über „In Workflow PDF öffnen“ im Klon.

Die Muster erkennen unterstützte Fälle; sie beweisen nicht die Abwesenheit jeder
Manipulation. Originale bleiben unverändert. Keine automatische Dateiprüfung oder
neue Übertragung wurde durch diesen Auftrag eingeschaltet.

## Neue Nachweise

- Hashvergleich der neun gemeinsamen Dateien und der drei doppelten Dialogbausteine.
- Echte Musterprüfungen mit erfundenen deutschen/englischen KI-Anweisungen und normalem
  Formulartext als Gegenrichtung. Versteckter, winziger und außerhalb liegender Text.
- Absichtlich veränderte Reinigungskopie wird vom Vergleich zurückgewiesen.
- Bestehende kanonische Modul-25-Prüfungen: Namen, Anschriften, Mail, Rückersetzung,
  konsistente Platzhalter, Klartextprüfung und kein Dokument im App-Auftrag.
- Unveränderte Original-Browserproben des PDF-Kerns mit installiertem System-Chromium:
  Reinigung 62 grün/0 rot, Eingang 87 grün/0 rot. Die KI-Gegenstellen sind in diesen
  Originaltests ausdrücklich simuliert; keine privaten Dokumente und kein echter KI-Versand.

Das sind Browser-/Rechnungsprüfungen, keine neue Prüfung auf Klaus' Tablet oder PC.
