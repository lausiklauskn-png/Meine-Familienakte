# Abschluss: Auftrag für den Pro-Verbund festgehalten

1. November 2026. Ergänzung der Übergabe auf `codex/eingang-sichern`, [Entwurf #48](https://github.com/lausiklauskn-png/Meine-Familienakte/pull/48).
Der neue Arbeitsplan steht in [BRIEF_SITZUNG_2026-11-01_PRO-VERBUND.md](BRIEF_SITZUNG_2026-11-01_PRO-VERBUND.md).

Nachtrag: Klaus hat danach die Übernahme des Briefs nach `main` und die automatische Veröffentlichung freigegeben.
Der folgende Abschluss beschreibt den vorherigen Entwurfsstand; der Sitzungsbrief enthält den aktualisierten Startauftrag.

## Ergebnis

Klaus' gewünschte Hin- und Rückwege zu den eigenständigen Workflow PDF Pro, Private Brain Pro und BookLedgerPro festgehalten.
„Familienakte Pro“ ist die gewünschte Bezeichnung; eine sichtbare Umbenennung wurde hier noch nicht durchgeführt.
Gewünschte Pro-Varianten von Kim-sync und Datei-Post ebenfalls aufgenommen. Jede App soll einzeln benutzbar bleiben.
Der Vergleich „SAP für Privatleute“ beschreibt die Zusammenarbeit; einfache Bedienung bleibt das Ziel.

Reihenfolge: vorhandenen Pro-Tresor mit freier Speicherwahl anschließen, vorhandene Geräte-/Modellwahl übernehmen,
Portal weiter aufteilen, Dateiübergaben mit bestätigter dauerhafter Annahme abschließen. Separate Originale, Arbeitsstände
und Suchvektoren sowie die Grenzen von APK, Windows und PWA sind im Plan benannt.

Empfehlung für den Transport: lokal gemeinsamer Tresor beziehungsweise Betriebssystem-Teilen; zwischen Geräten Kim-sync
für Räume und Empfänger, ergänzt durch Datei-Post für große Dateien und Abhol-/Abgabecodes. Beide arbeiten bereits zusammen.
Eine zweite Raumverwaltung ist dafür nicht nötig. Ob eine eigene native Datei-Post-Hülle sinnvoll ist, bleibt zu entscheiden.

Für den Bau entscheidende Grenzen im Plan: Ein Messenger-Empfang oder Browser-Download bestätigt keine Ablage in der Familienakte;
Private Brain hat im gelesenen gemeinsamen Paket noch kein eigenes Übergabefach; Dokumentannahme der Familienakte derzeit 20 MB.
Ende-zu-Ende-Verschlüsselung von Inhalten macht Verbindungsdaten nicht unsichtbar. Herkunft und Schutz der App selbst bleiben relevant.

## Geprüft und nicht gemessen

- Aktuelle Kim-sync- und Datei-Post-Quellen über GitHub gelesen; unveränderliche Revisionen und Bauquellen im Sitzungsbrief verlinkt.
- Kim-sync `modules/krypto.js` und Datei-Post `public/krypto.js` auf Bytegleichheit geprüft: gleich.
- Lokale Dokumentverweise geprüft; `git diff --check` ohne Fehler. Nur Dokumentation ergänzt, kein App-Code verändert.
- Keine neue Funktionsprobe ergänzt, daher keine neue Gegenprobe. Build und Browserproben für diese reine Dokumentation nicht erneut ausgeführt.
- Der unveränderte App-Code `eeaa61a2354168b1f81362addc945277af21e1ac` wurde zuvor vollständig geprüft:
  [GitHub-Hauptprüfung](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41304054526),
  [Android](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41304054671) und
  [Windows](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41304054775) erfolgreich.
  Lokale Proben, Gegenproben und deren Einschränkungen stehen im vorherigen Abschluss zum Eingang.
- Kein echter App-zu-App-Transport, kein Relay-Raum und kein Datei-Post-Livebetrieb geprüft. Keine SD-Karte,
  kein Tablet und kein Windows-Gerät verwendet, keine Modelle geladen. Keine vollständige Sicherheitsprüfung.

Keine Änderung anderer Repositories, keine Versionsanhebung, kein Main-Merge, keine App-/Umgebungsveröffentlichung.
Die Dokumente ergänzen den vorhandenen Entwurf, damit die nächste Sitzung den Auftrag übernehmen kann.
Briefkopf in Warteschlange/Stapel und Klaus' Tablet-Rückmeldungen bleiben offen.

## Zeiten

Berliner Zeit (MEZ, UTC+1): erste archivierte Spur dieser Planergänzung 13:33:21, Dokument-/Bytegleichheitsprüfung 13:37:45;
Spanne 4 Minuten 24 Sekunden. Das sind Werkzeugspuren einschließlich Lesen und Schreiben, keine Messung reiner Programmierzeit.
Die anschließende Sicherung des Briefs ist am Git-Commit und PR nachvollziehbar. Frühere Reparaturzeiten stehen im vorherigen Brief.

## Startauftrag

```text
CLAUDE.md, diesen Abschluss und BRIEF_SITZUNG_2026-11-01_PRO-VERBUND.md lesen.
Entwurf #48 prüfen; vorhandene Eingangskorrektur nicht neu bauen.
Mit dem Adapter zum bestehenden Pro-Tresor beginnen, Android zuerst, Speicherort frei wählbar.
Danach Geräte-/Modellwahl, Portal aufteilen, quittierte Hin- und Rückwege zu den eigenständigen Pro-Apps.
Kim-sync plus Datei-Post ist die vorgeschlagene Netz-Lösung; lokal braucht es kein Relay.
Sichtbare Änderungen konkret mit Klaus abstimmen; nichts ohne neues Wort veröffentlichen.
```
