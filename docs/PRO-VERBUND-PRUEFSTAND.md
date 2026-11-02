# Tatsächlicher Prüfstand des Pro-Verbunds

Stand: 2. November 2026. Dieser Nachweis trennt Produktprüfungen, zusätzliche App-Paare
und den späteren Versuch am persönlichen Gerät. Die vollständige Gesamtabnahme ist offen.

## Vollständig gelaufene Paare

Lauf [41506243317](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41506243317),
Familienakte-Prüfquelle `caffdd1758c6a786e595af4a2b2e0afcf2c8842c`:

| Plattform und Gegenstelle | Job | Ergebnis |
| --- | --- | --- |
| Windows / Workflow PDF Pro | 125490024575 | Vollständig, sechs Prüfabschnitte, keine erfassten Seitenfehler |
| Windows / BookLedgerPro | 125490024327 | Vollständig, sechs Prüfabschnitte, keine erfassten Seitenfehler |
| Windows / Private Brain Pro | 125490024310 | Vollständig, sechs Prüfabschnitte, keine erfassten Seitenfehler |
| Android API 35 / Private Brain Pro | 125488987065 | Vollständig, sechs Prüfabschnitte, keine erfassten Seitenfehler |

Geprüft wurden zwei wirkliche Originaldateien, Kalt- und Warmstart, stabile Kennung beim
erneuten Senden, dauerhafte Aufnahme in die gewöhnliche Bibliothek, Prozessneustart,
bearbeitete Rückgabe mit Quellbezug und Zurückweisung einer verfälschten Bestätigung.
Die leere vorbereitete Tresorablage erzeugte keine Übergaben oder Empfangsmarken.
Maschinenlesbare Originalberichte: [pro-verbund-nachweise.json](pro-verbund-nachweise.json).

Gegenstellen: Workflow PDF Pro `e2c57b3f514c0c3f118c23f243bf5ee9fe756bb7`,
BookLedgerPro `3ca7bb919245bb0ff7a293fe93beee92fbd28f61`,
Private Brain Pro `326dc3d4ba1c709c0f818247e01bfb383c063ad3`.
Der letztgenannte Stand hat denselben Git-Baum wie die veröffentlichte Quelle
`1da44dee7171d2f998a06047e8c05c181752c320`.

Die Paarproben installierten Prüf-APKs beziehungsweise Installer mit Prüfzugang auf
GitHub-Rechnern. Produktionspakete haben keinen solchen Prüfzugang und werden durch
die vorgesehenen Veröffentlichungsprüfungen zusätzlich installiert. Ein CI-Emulator
ist kein persönliches Tablet; ein CI-Windows-Rechner ist nicht Klaus' Rechner.

## Pflichtprüfungen und tatsächliche Veröffentlichung 2.28.15

PR #63 am Kopf e9b0bf0326989eb246259133a838546658ab4ea0 ist vollständig grün:
Browser/Fach/Herkunft 41527487481, Android-Bau 41527487514, installierte Android-Suche
API 31/35 41527487442, Windows 41527487548 Versuch 2. Im ersten Windows-Job
125558855602 war der Prüfport 9333 trotz ansprechbarer App und bestandener nativer
Proben nicht erreichbar. Eine unveränderte gezielte Wiederholung 125569962920 bestand;
Ursache des ersten Startfehlers unbewiesen. Kein rückwirkend behaupteter Erfolg.

Die Produktquelle d00902f10a5b57902084e42950d62751385a9d93 ist auf Android
(41533299440), Windows einschließlich Server-Feed (41533308106) und Pages
(41533260856) veröffentlicht. Die spätere Windows-Installationsprobe besteht ebenfalls.
[Öffentliche Downloads und Hashnachweise](VEROEFFENTLICHUNG-2.28.15.json).
Das ändert den offenen vollständigen Sechs-Paare-Nachweis nicht.

## Zwei offene Android-Paare

Der letzte begrenzte Diagnoseversuch ist Lauf
[41514065036](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41514065036),
Quelle `fb3cb6130d11c26b6d7dc3ad2e52dfadd2544665`:

| Gegenstelle | Job | Tatsächliches Ergebnis |
| --- | --- | --- |
| Private Brain Pro | 125515602724 | Wieder vollständig bestanden; API 31 |
| Workflow PDF Pro | 125515603016 | Nach erstem Prüfabschnitt abgebrochen; native Passworteingabe nicht mehr erreichbar, Android-Testmaschine nicht erreichbar |
| BookLedgerPro | 125515602769 | Nach erstem Prüfabschnitt abgebrochen; native Ordnerwahl nicht mehr erreichbar, Android-Testmaschine nicht erreichbar |

Zuvor wurden API 35 und 31 sowie der aktuelle Software-Grafikweg gezielt verglichen.
Die beiden offenen Läufe sind keine erfolgreichen Paarproben. Ausreichender freier
Hostspeicher und fehlende OOM-/Absturzmeldungen in den ausgewerteten Protokollen lösen
die Ursache nicht auf. Beim letzten BookLedger-Lauf wurden außerdem zwei Seitenfehler
`Cannot read properties of undefined (reading 'triggerEvent')` der Familienakte erfasst.
Auch sie werden nicht verschwiegen oder als nachweislich harmlos eingestuft.

PR #59 bleibt als reproduzierbarer Entwurf offen. Keine weitere allgemeine Testserie
in diesem Abschluss. Nächster belastbarer Schritt: denselben Weg aus der vorhandenen
Testreihe 04 mit erfundenen Originalen auf einem persönlichen Android-Gerät ausführen,
Versionen notieren und Ergebnisdatei zurückgeben; alternativ die Ursache des VM-Abbruchs
gezielt klären. Bis dahin keine Behauptung, alle sechs App-Paare seien abgenommen.

## Download-Rückmeldung

Die vollständige HTML mit eingebetteten Testdateien ist 4.614.299 Byte groß. Klaus meldete
sowohl den äußeren Chat-Download als auch den eigenen Speichern-Knopf als fehlgeschlagen.
Die lokale Browserprobe ist dafür kein Gegenbeweis. Am 2. November bestätigte Klaus nur
den erfolgreichen Download der separaten reinen HTML-Anleitung ohne Links (75.740 Byte).
Das beweist keine Reparatur des großen Paketdownloads auf seinem Gerät.

## Weitere Grenzen

Scannen mit Klaus' Scanner, seine Monitore, SD-/USB-Laufwerke, Android-Varianten und ein
öffentlicher Kim-/Datei-Post-Weg werden erst im wirklichen Gebrauch geprüft. Die vorhandene
Transportprobe nutzte den wirklichen lokalen Datei-Post-Server und ein lokales Test-Relay.
Eine Transportquittung ist weiterhin keine Familienakte-Empfangsbestätigung. Die PWA hat
keine identischen nativen Tresor- und Modellrechte wie die installierten Apps.
