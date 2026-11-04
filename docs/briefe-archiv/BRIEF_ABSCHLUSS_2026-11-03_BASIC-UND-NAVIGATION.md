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
- Nach diesen gezielten Proben folgt die vorhandene PR-Pipeline einschließlich Android-/Windows-Bau. Keine zusätzliche allgemeine Geräte-Testmatrix. Veröffentlichungsnachweise werden nach Abschluss ergänzt; dieser Baustand behauptet noch keine neue Veröffentlichung.

Die getrennte Pro-Verbund-Gesamtabnahme bleibt bei vier von sechs vollständigen App-Paaren; PR #59 bleibt Entwurf. Die beiden früher abgebrochenen Android-Paarproben werden durch diese Bedienkorrektur nicht nachträglich als bestanden gewertet. PR #34 ist ein älterer Aufgabenbrief für 2.28.4/2.28.5, keine aktuelle Baukorrektur; nicht ungeprüft übernehmen.

## Gezielte Korrektur vor Veröffentlichung

Die zusätzliche Folge Neuladen → Zurück → Vorwärts zeigte noch einen echten Randfehler im ersten PR-Stand: Adresse und Bereich konnten auseinanderlaufen. Die erweiterte vorhandene Browserprobe wird dafür rot (11/1). Ältere Historieneinträge beginnen jetzt bei Bedarf einen eigenen Sitzungstoken, statt denselben Index für unterschiedliche Bereiche wiederzuverwenden. Dieselbe Probe ist danach 12/0, einschließlich Vorwärts nach Neuladen. Vollständiger npm-Bau und Lint erneut grün. Diese tatsächliche Codekorrektur begründet die erneute vorhandene PR-Pipeline; keine zusätzliche allgemeine Testserie.

Weiterbearbeitung dieses konkreten Falls bis **2026-11-03 09:35:11 UTC** (10:35:11 MEZ). Das gesamte bisher belegte Zweigfenster ab 08:22:14 UTC umfasst **1,22 Stunden**, einschließlich CI und Wartezeit, keine Aktivstundenmessung.

## Zeit und Übergabe

Belegbarer Beginn dieses Arbeitszweigs: **2026-11-03 08:22:14 UTC** (09:22:14 MEZ, Git-Reflog). Dieser Baustand wurde bis **2026-11-03T09:18:47+00:00** bearbeitet; verstrichenes Fenster **0.94 Stunden**, kein Nachweis persönlicher Aktivzeit. Laufzeiten der anschließenden CI und Veröffentlichung werden im Nachtrag getrennt ausgewiesen.

Die von Klaus erfolgreich heruntergeladene manuelle HTML-Anleitung bleibt unverändert. Frühere Geschenke und datierte Sicherungen werden nicht überschrieben.

```text
Lies CLAUDE.md und BRIEF_ABSCHLUSS_2026-11-03_BASIC-UND-NAVIGATION.md sowie den Veröffentlichungsnachtrag, falls vorhanden. Gleiche main und offene PRs ab. Für 2.28.16 müssen die vorhandenen PR-Prüfungen grün sein; erst danach zusammenführen und Android/Windows mit vorhandener Signieridentität und server=ja veröffentlichen. PWA-Veröffentlichung und tatsächliche Download-Prüfsummen kontrollieren. Keine Geräte-Gesamtabnahme erfinden; PR #59 bleibt Entwurf. Abgeschlossene Fassungen nicht erneut veröffentlichen. Gift und datierte Sicherung erst nach dem Bau erstellen.
```

## Vorhandene Startseitenprobe nachziehen

Der vollständige CI-Lauf 41612327922 (Quelle 05b6627, 40/41 Skripte grün) fand noch einen alten Textvergleich: Der Markenknopf führte korrekt zur Startseite, aber der Test erwartete den gesamten Breadcrumb-Inhalt ausschließlich als „Startseite“ und zählte die neuen Verlaufsschalter mit. Die bestehende Prüfung kontrolliert jetzt zusätzlich die Zieladresse #startseite und den eigentlichen Pfadknopf, wie bereits die entsprechende Tagebuchprobe. Gezielte komplette Startseitenprobe danach **35/0**; keine Anwendung geändert, keine Prüfung entfernt. Diese 35 Schritte werden separat von den oben abgegrenzten 92 gezählt. Windows und Android (einschließlich API31/35) auf unverändertem Anwendungscode bestanden; der endgültige PR-Stand durchläuft weiter die vorhandenen Pflichtprüfungen.


## Quellengebundene Freigaben und Übergabe

Der endgültige Bau ist mit PR #65 auf main: **7db47ed4e2a082b78d3f9e5d94906c104cb8297b**. Der geprüfte PR-Kopf **3bc39e07062ff24a1a19257a4b462154fb3b3368** und dieser Merge enthalten denselben Anwendungscode. Alle Pflichtprüfungen bestanden: vollständige CI mit **41/41 Browser-Skripten**, regulärer Android-Bau, WebView und installierte API31-/API35-Proben sowie die installierte Windows-App.

Die regulären Freigaben verwenden dieselbe Mainquelle und die bestehenden Identitäten:

- Android: Lauf [41617153030](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41617153030), Tag `android-v2.28.16`, `server=ja`.
- Windows: Lauf [41617158394](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41617158394), Tag `windows-v2.28.16`, `server=ja`.
- Erste PWA-Veröffentlichung: Lauf [41617071360](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41617071360). Nach dem Zusammenführen dieses Nachtrags wird Pages mit dem dann aktuellen Windows-Installer erneut erzeugt.

Downloadadressen und unveränderte SHA256SUMS-Dateien: `docs/VEROEFFENTLICHUNG-2.28.16.json`. Dieser Nachtrag wird erst nach beiden erfolgreichen Freigaben einschließlich Serverprüfung und erneut geladenen, gehashten öffentlichen Installationsdateien auf main übernommen. Damit bezeichnet sein Mainstand den abgeschlossenen Freigabeschritt. Die datierte Übergabesicherung enthält die konkreten Dateigrößen und SHA-256-Werte.

Das Geschenk wird nach diesem Bau erstellt und ergänzt die bisherigen Erklärungen/Bilder um Basic-Erkennung, die freien Menüzeilen, Rückwege und Hinweise. Frühere Geschenke und Sicherungen bleiben unverändert. Die bestätigte Anleitung ohne Links bleibt bytegleich. Zeitfenster bis zur abschließenden Aufzeichnung und CI-Wartezeiten stehen in der datierten Sicherung; keine persönlichen Aktivstunden daraus ableiten.

```text
Aktuellen main-Stand laden, CLAUDE.md und diesen Abschluss samt docs/VEROEFFENTLICHUNG-2.28.16.json lesen. Vor jedem Release prüfen, ob android-v2.28.16 und windows-v2.28.16 bereits existieren; dieselbe Fassung nicht erneut veröffentlichen. Die datierte Übergabesicherung mit STATUS.json und Prüfsummen ist der Einstieg. Nur eine konkrete Nutzer-Rückmeldung nachstellen, keine neue allgemeine Testmatrix. PR59 bleibt Entwurf; zwei historische Android-Paarproben weiterhin unvollständig. Eigene Akten und Signieridentitäten bewahren, fremde Inventaränderungen nicht übernehmen.
```
