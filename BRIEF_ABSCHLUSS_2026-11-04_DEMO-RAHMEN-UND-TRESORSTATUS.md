# Abschluss: Demo-Rahmen und eigener Tresorstatus, 04.11.2026

Klaus' direkter Folgeauftrag ist als **2.28.22** umgesetzt, geprüft und veröffentlicht. [#81](https://github.com/lausiklauskn-png/Meine-Familienakte/pull/81) zuerst zusammengeführt, Quelle `70f87f5a33325ee78801ef821de365cf8c5b40db`.

In der Demo stehen ein roter Rahmen um Kopf/Navigation und das Wort DEMO auch bei geschlossenem Mobilmenü. Die Demo zeigt „Demo-Ablage bereit“ und erklärt den getrennten lokalen Testbestand. Ungeeignete eigene Ordnerverbindungen werden dort nicht angeboten. Außerhalb der Demo bleibt automatischer Browserspeicher neutral: „Eigenen Datentresor wählen“. Eine vorhandene eigene Auswahl bleibt über Demo-Wechsel und Neuladen erhalten. Eigene Dateien und gespeicherte Berichte werden nicht gelöscht oder überschrieben.

Ein natives Pro-Originalziel wird erst grün, wenn seine gespeicherte Zuordnung mit dem tatsächlich offenen nativen Tresor übereinstimmt. Auswahl, Sperrung und Entsperrung aktualisieren die Anzeige. Der Anschluss erhält lediglich einen optionalen onChange-Callback; bestehende Brückenbefehle bleiben unverändert.

## Prüfung und Veröffentlichung

Zehn gezielte Bedienfälle grün; vorhandener Dateierhalt je 15/15 mit OPFS und IndexedDB sowie Sicherheitscenter 33/33. Endgültige vollständige Browserkette 44/44, Android-Hülle, installierte Android-Proben auf API 31/35, Windows sowie Modell-/Transportketten erfolgreich. Modell-/Transportcommit und endgültiger Prüfcommit unterscheiden sich nur in zwei Browserprüfdateien. Der Merge enthält zusätzlich nur Claudes Dokumentation für21. Produktcode identisch. [Konkrete Läufe und Nachweise](docs/VEROEFFENTLICHUNG-2.28.22.json).

Der erste CI-Vorlauf 42/44 zeigte veraltete Erwartungen an automatisch grünen Browserspeicher und ein Problem mit flüchtigen Browserprofilen beim Handle-Wechsel. Die Prüfdateien verwenden nun dauerhafte Profile und bereiten einen ausdrücklich gewählten eigenen Ordner vor. Die ursprünglichen Integritäts-, Export-, Sicherungs- und Wiederherstellungszusicherungen bleiben bestehen. Der App-Code wurde dafür nicht verändert. Vorläufe bleiben in Kimhub dokumentiert.

OS-Ordnerdialog und native Brücke der gezielten Browserprobe sind gestellt; Handle, Register und Browserdateien tatsächlich verwendet. Das ersetzt keine physische Tablet-/SD-/USB-Abnahme. Die installierten Plattformketten verwenden ihre nativen Wege. Lint ohne Fehler, zehn vorhandene Warnungen.

- [android-v2.28.22](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/tag/android-v2.28.22): öffentliche Paketbytes und SHA-256 geprüft.
- [windows-v2.28.22](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/tag/windows-v2.28.22): öffentliche Paketbytes und SHA-256 geprüft.

Android mit unveränderter dauerhafter Signieridentität; signierte Serverfeeds beider Plattformen samt öffentlichen Paketbytes von den Release-Runnern geprüft. Einzeldatei und PWA veröffentlicht. Abschließender PWA-Lauf enthält22 einschließlich des richtigen Windows-Installers und bestätigt live version.json. Technische Versionszeile 22, interner Hilfe-/Prüfstand 2.28.1 unverändert. PWA-Name Familienakte Basic und verkürzter Sitzungsanker aus #79/#80 bleiben erhalten.

## Vereinbarte Übergabe an Claude

Codex änderte app/health-portal.tsx, app/globals.css, app/pro-tresor-anschluss.tsx und ergänzte app/use-pro-destination.ts. Nach Merge #81 keine weiteren parallelen UI-Änderungen durch Codex. app/pro-tresor.ts, FamilienakteTresorPlugin.java, de.familyprojekt.tresor und tools/tresor/tresor-pins.json bleiben unangetastet.

Claude übernimmt anschließend Hauptordner/UnterAblage aus Workflow-PDF-Pro#65, native Speicherwahl samt Neuanlage, Scanner-Standard „Durchsuchbar“ und Android-Sicherung; seine folgende Fassung 2.28.23. Dieser Abschluss beansprucht diese Folgearbeit nicht als erledigt.

Klaus bestätigt die ersten fünf Praxispunkte; zehn weitere bleiben ungeprüft. Berichte nicht automatisch umschreiben. Sechs Gerätefälle aus #70, SD-Prüfung, OneDrive-Geräteabnahme und ältere zusätzliche Android-Paarabnahme bleiben offen. Forschung und ein neuer tatsächlicher Zeitblock ausschließlich in Kimhub; frühere 147 Minuten und sämtliche alten Einträge unverändert.
