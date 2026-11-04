# Bibliothek und Datenweg

Die Ansicht bleibt in diesem Auftrag unverändert. Große Dokumentkacheln sind keine
Voraussetzung für Dateiübernahmen; eine spätere kompakte Liste wäre davon unabhängig.

| Bedienweg | Was mit der Datei passiert |
|---|---|
| Familienakte → „Ausfüllen“ | Der eigene Dialog liest die Unterlage aus der Familienakte. Es erfolgt kein Import in die Klon-Bibliothek. Speichern erzeugt eine neue ausgefüllte Fassung neben dem Original. |
| „In Workflow PDF öffnen“ | Die ausdrücklich gewählte Unterlage wird lokal in die eigene Klon-Bibliothek `FamilienakteWFPDF1` importiert. Die Familienakte wartet auf die Bestätigung der dauerhaften Ablage. Die Quelle bleibt erhalten. |
| Klon → „Teilen“ | Die ausgegebene Fassung geht über die lokale Brücke in die Eingangszentrale der Familienakte. Erst nach dauerhafter Speicherung und Quittung wird Erfolg bestätigt. Erneutes Teilen derselben Fassung erzeugt keinen zweiten Eingang. |
| Aus der Familienakte gestarteter Scan → „PDF erstellen“ | Die fertige Fassung wird über dieselbe lokale Brücke in die Eingangsprüfung gegeben. |
| Eigenständige Pro-App | Eigene Bibliothek und bestehender freiwilliger Pro-Tresor-/Teilen-Weg. Keine automatische Gleichsetzung mit der eingebetteten Klon-Bibliothek. |

Die beiden Bibliotheken sind getrennte Ablagen. Es gibt keine allgemeine automatische
Synchronisierung aller Dokumente. Explizites Öffnen im Klon erzeugt dort eine weitere
Arbeitskopie; das kann zusätzliche dauerhafte Ablage bedeuten. Ein Update der PDF-
Funktionsdateien synchronisiert keine Dokumentbestände.

Die eingebettete Brücke benutzt `postMessage` innerhalb desselben Ursprungs und
prüft Ursprung, Absenderfenster, Dateianzahl, Kennung und Empfangsbestätigung. Die
Dokumentübernahme selbst benötigt keinen GitHub-Login und keinen Datei-Upload ins
Internet. Optionale externe KI-Funktionen haben ihre eigenen Übertragungswege und
Schutzgrenzen; siehe `PDF-SCHUTZABGLEICH.md`.

Nachweise: vorhandene Browserprobe `workflow-pdf-bruecke.test.mjs` prüft den noch
offenen Import, das Warten auf die Eingangsquittung, Wiederholung ohne Doppeleingang,
Scan-Rückgabe und Ausschluss geschützter Gesundheitsunterlagen vom Klon. Die
Klon-Probe prüft getrennte Datenbank und Einstellungen sowie Erhalt nach Neuladen.

Eine kompakte Liste oder eine reine, nach bestätigter Rückgabe entfernbarere
Arbeitskopie wären gesonderte Änderungen. In diesem Auftrag wird keine Bibliothek
umgebaut und keine vorhandene Datei entfernt.
