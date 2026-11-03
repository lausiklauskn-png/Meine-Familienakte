# Familienakte 2.28.16 – Bedienung, 3. November 2026

## Gebaut

- Basic/PWA trägt auch oben links den dunkelblauen Symbolhintergrund (#0b3154). Die installierten Android-/Windows-Pro-Apps behalten das helle Zeichen und die Bezeichnung Pro.
- Im geteilten Bildschirm liegt das aufgeklappte Menü unter der gesamten Navigationsleiste. Auch Fahrzeuge sowie Käufe & Garantien bleiben direkt zum Auf- und Zuklappen erreichbar. Das seitliche Handymenü bleibt erhalten.
- Der vorhandene klickbare Pfad bleibt. Daneben stehen Zurück/Vorwärts, sobald es einen Verlauf gibt. Die Objektansicht besitzt einen direkten Zurückknopf. Browser-/Maus-Zurück, Vorwärts und Strg+Z bzw. Strg+Umschalt+Z führen durch die Ansichten. In Textfeldern bleibt die normale Text-Rücknahme erhalten. Es werden keine gespeicherten Aktenänderungen rückgängig gemacht.
- Die bisherige Position wird wiederhergestellt; die Dokumentenbibliothek behält zusätzlich Suche, Filter und Sortierung. Die Ansichtsstände bleiben ausschließlich im Arbeitsspeicher. Browserhistorie und Adressen enthalten keine Suchtexte oder Objektkennungen. Neuladen beginnt einen neuen internen Verlauf; ältere Browsereinträge öffnen weiter ihren Bereich, ohne private Ansichtsstände wiederherstellen zu behaupten.
- Keine leeren Aktionszeilen mehr. Der konkrete Hinweis zum fehlenden Pro-Tresor verschwindet nach tatsächlichem Verbinden/Entsperren. Andere Fehler werden dadurch nicht erledigt. Erfolgsmeldungen verschwinden nach acht Sekunden; Hinweise können außerdem einzeln ausgeblendet werden. Der Beispieldaten-Hinweis verschwindet nach dem Entfernen der Beispiele, eigene Einträge bleiben erhalten.

Technische Updatefassung: **2.28.16**, angezeigte Versionszeile auf Klaus' Wunsch weiterhin **2.28.1**. Bestehende Paketkennungen, Speicherorte und Signieridentitäten bleiben erhalten.

## Abgegrenzte Prüfung

- Menü: 31 Browserprüfungen grün, 0 rot; 901, 960, 1000, 1024, 1280, 1440 und 390 Pixel. Gegenprobe vor der Korrektur: die neue Prüfung fängt die Überdeckung bei fünf geteilten Breiten.
- Verlauf und Hinweise: 12 grün, 0 rot; darunter echte Browser-History, per CDP ausgelöste Maus-Zurücktaste, zehn Rückschritte, Text-Undo, Objektposition, Bibliotheksfilter, Neuladen und Entfernen der erfundenen Beispiele.
- Bestehendes Kopieren 11/0, Pro-Anschluss mit Android-/Windows-Ersatzschnittstellen 11/0, Cockpit/Fristen/Tagebuch 27/0. Insgesamt **92/0 gezählte Browserprüfungen** in diesen fünf Skripten; keine Aussage über physisch bediente Nutzergeräte.
- Vollständiger npm-Bau einschließlich Fachprüfungen/TypeScript grün; Aktivitätskern/React-Ausgabe 29/0. Lint ohne Fehler (10 bereits vorhandene Warnungen), Herkunft der geschützten Bausteine unverändert, Android-Hüllenprüfung 21/0 und Windows-Versionsabgleich grün.
- Nach diesen gezielten Proben folgt einmal die vorhandene PR-Pipeline einschließlich Android-/Windows-Bau. Keine zusätzliche allgemeine Geräte-Testmatrix. Veröffentlichungsnachweise werden nach Abschluss ergänzt; dieser Baustand behauptet noch keine neue Veröffentlichung.

Die getrennte Pro-Verbund-Gesamtabnahme bleibt bei vier von sechs vollständigen App-Paaren; PR #59 bleibt Entwurf. Die beiden früher abgebrochenen Android-Paarproben werden durch diese Bedienkorrektur nicht nachträglich als bestanden gewertet. PR #34 ist ein älterer Aufgabenbrief für 2.28.4/2.28.5, keine aktuelle Baukorrektur; nicht ungeprüft übernehmen.

## Zeit und Übergabe

Belegbarer Beginn dieses Arbeitszweigs: **2026-11-03 08:22:14 UTC** (09:22:14 MEZ, Git-Reflog). Dieser Baustand wurde bis **2026-11-03T09:18:47+00:00** bearbeitet; verstrichenes Fenster **0.94 Stunden**, kein Nachweis persönlicher Aktivzeit. Laufzeiten der anschließenden CI und Veröffentlichung werden im Nachtrag getrennt ausgewiesen.

Die von Klaus erfolgreich heruntergeladene manuelle HTML-Anleitung bleibt unverändert. Frühere Geschenke und datierte Sicherungen werden nicht überschrieben.

```text
Lies CLAUDE.md und BRIEF_ABSCHLUSS_2026-11-03_BASIC-UND-NAVIGATION.md sowie den Veröffentlichungsnachtrag, falls vorhanden. Gleiche main und offene PRs ab. Für 2.28.16 müssen die vorhandenen PR-Prüfungen grün sein; erst danach zusammenführen und Android/Windows mit vorhandener Signieridentität und server=ja veröffentlichen. PWA-Veröffentlichung und tatsächliche Download-Prüfsummen kontrollieren. Keine Geräte-Gesamtabnahme erfinden; PR #59 bleibt Entwurf. Abgeschlossene Fassungen nicht erneut veröffentlichen. Gift und datierte Sicherung erst nach dem Bau erstellen.
```
