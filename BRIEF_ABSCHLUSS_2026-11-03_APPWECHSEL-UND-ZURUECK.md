# Familienakte 2.28.17: Appwechsel und Zurück, Abschluss 03.11.2026

Familienakte bleibt in der Android-App am Anfang des Zurück-Verlaufs geöffnet. Eine Dokumentvorschau schließt zuerst; danach führen die vorhandenen Ansichten samt Position zurück. Der eigenständig installierte Workflow-PDF-Editor und Familienakte behalten beim Android-System-Teilen getrennte App-Aufgaben. Auch Familienakte enthält den korrigierten kanonischen Ausgabeadapter.

## Quellen und Erhalt

PR #67 ist als `be07bbfd913cfbd271e037d009604c2b2aa17924` auf main. Der letzte PR-Stand `f831fc07dabc4be5ef12188c13049a56166e113b` war vollständig grün; der Main-Merge hat denselben Dateibaum. Der parallele Kern-Nachzug PR #68/d7f9703 ist enthalten. PDF-Kern 1.1.9 aus Workflow-PDF main 0ed15e5 bleibt bytegleich, eigene Datenbank und Brücke mit fa_wfpdf-Schlüsseln bleiben erhalten. Der Ausgabeadapter wurde nach Workflow-PR #59 ausschließlich über tools/pro-ausgabe-nachziehen.mjs von main 1ea49db übernommen; native/HERKUNFT.json ist geprüft. Kennungen, Datenpfade und Signieridentitäten bleiben unverändert.

Technische Updatefassung **2.28.17** auf Android/Windows/PWA; die sichtbare Zeile bleibt wie gewünscht **2.28.1**. Ein Appwechsel erfolgt über Taskleiste/App-Übersicht, Zurück bedient die aktuelle App. Vor dem Update begonnene Bearbeitungen speichern, beide APKs über die vorhandenen Fassungen installieren und beide Apps einmal über ihre eigenen Symbole öffnen.

## Abgegrenzte Prüfung

Neue Browserprobe3/0 und bestehende Verlauf-/Hinweisprobe 12/0; vollständiger Bau, Herkunft und endgültige komplette PR-Pipeline einschließlich Windows und installierter Android-APIs 31/35 grün. Die alte Android-Root-Funktion wird in 41685691916 CREATED statt RESUMED; die neue bleibt nach zehn Back-Ereignissen geöffnet. Reale Eingabe und tatsächlicher Fensterfokus sind Voraussetzungen der Geräteprobe.

Workflow-Teilen: alter Adapter41687211768 reproduziert Sender und Empfänger in Aufgabe 8. Neuer Adapter und vollständige Freigaben auf beiden APIs mit je 51 Fällen, 0 Fehlern, 0 übersprungen und Überinstallation mit erhaltenen Daten. Source- und Empfängeraufgaben bleiben getrennt, warmer Empfänger wird wiederverwendet. Das ersetzt keine persönliche Samsung-/DeX-/Maus-Probe und keine vollständige zusätzliche verschlüsselte App-Paar-Abnahme. Deren alter Stand bleibt 4/6; Familienakte PR #59 bleibt Entwurf. Die kleine bestätigte manuelle HTML-Anleitung bleibt unverändert. Keine weitere allgemeine Testreihe.

## Tatsächlich veröffentlicht

Android android-v2.28.17: Lauf 41701561146; Windows windows-v2.28.17: 41701571209. Beide mit server=ja, bestehender Identität und erfolgreichen Serverprüfungen. Tags zeigen auf be07bbf. Öffentliche Downloads wurden anonym erneut geladen und gegen die GitHub-Digests geprüft. PWA nach fertigem Windows-Release erneut mit dem aktuellen 17er Installer gebaut: Lauf 41704899961. Nachweise in docs/VEROEFFENTLICHUNG-2.28.17.json.

| Datei | Bytes | SHA-256 |
|---|---:|---|
| Familienakte-android-v2.28.17.apk | 19795925 | `41c9b149887a1750b965e1d268d1c583b4d5211ecee77508d7abaef439901b83` |
| Familienakte-Einzeldatei-2.28.17.html | 3307325 | `64e693a93a8cf9d7b6e5e0af89f4f5a64a46e71857e5a7cc446094cfee241212` |
| Familienakte-Windows-2.28.17-x64-setup.exe | 33950766 | `97e3a2dec9cc36b7cce9ee93b02d8ff8122157503af4abbd792da2711e65b1b5` |

Workflow PDF Pro 1.0.13 ist in beiden nativen Fassungen getrennt veröffentlicht. Geschenk und datierte Übergabesicherung entstehen nach diesem Bauabschluss und enthalten die aktuellen Erklärungen. Frühere Geschenke, Sicherungen und die bestätigte Anleitung bleiben erhalten.

## Zeit und Weiterarbeit

Belegbarer Zweigbeginn: **03.11.2026 16:44:19 UTC / 17:44:19 MEZ**. Diese Aufzeichnung: **03.11.2026 20:45:10 MEZ**. Verstrichenes Fenster **3.01 Stunden**, einschließlich CI, Freigaben und Wartezeit; keine persönliche oder aktive Arbeitsstundenmessung. Nachfolgende reine Dokumentations-/Geschenk-/Sicherungsarbeiten sind ein Nachlauf, Repozeiten werden nicht addiert.

```text
Aktuellen main von Meine-Familienakte und Workflow-PDF-Pro laden.
Zuerst CLAUDE.md bzw. AGENTS.md und die aktuellen Appwechsel-Abschlussbriefe lesen.
Familienakte 2.28.17 und Workflow PDF Pro 1.0.13 sind veröffentlicht; diese Versionen nicht erneut ausgeben.
Bytegleichen PDF-Kern 1.1.9, Herkunftspins, Paketkennungen und Signieridentitäten erhalten.
Konkrete Geräte-Rückmeldung mit vorhandenen Testunterlagen auswerten; keine neue allgemeine Testmatrix.
Familienakte PR #59 bleibt Entwurf: ältere vollständige Android-Tresor-Paar-Abnahme separat offen.
```
