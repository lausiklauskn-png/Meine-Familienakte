# Abschluss: beide Codex-Korrekturen auf main zusammengeführt

Klaus hat am 2026-11-01 ausdrücklich die Zusammenführung auf `main` angeordnet, damit er die Dateien prüfen
und die nächste Claude-Code-Sitzung darauf zugreifen kann. Diese Regel steht jetzt in `CLAUDE.md`.
Dieser Brief aktualisiert den Übergabestand der beiden früheren CODEX-Abschlussbriefe.

> Aktueller Übertragungsstand: lokal zusammengeführt und geprüft, **noch nicht nach `origin/main` übertragen**.
> Die automatische Freigabeprüfung blockiert den Main-Push wegen der dadurch ausgelösten öffentlichen
> GitHub-Pages-Veröffentlichung. Dafür wird Klaus' ausdrückliche Zustimmung benötigt.
> Der gemeinsame prüfbare Stand wird auf `codex/main-uebergabe` gesichert.

## Zusammenführung

- Ausgang `origin/main`: `ce83c38`; keine zwischenzeitlichen Änderungen beim Abruf.
- `codex/pdf-bruecke` über Merge-Commit `5752d87` übernommen.
- `codex/ui-pwa-build` über Merge-Commit `b38dce7` übernommen.
- Ein Konflikt in `tests/gegenprobe-sitzung-b.mjs`: beide Zweige hatten am selben Ort einen Fall ergänzt.
  Beide Fälle (`Brückenlauf:` und `UI-Bau:`) sind erhalten. Automatisch verglichen: alle übrigen Zeilen der
  Gegenproben-Datei unverändert; die drei betroffenen UI-Dateien entsprechen exakt ihren geprüften Zweigen.
- Beide früheren Abschlussbriefe sind damit gemeinsam im Hauptzweig enthalten.
- GitHub-API weiterhin gesperrt (`Forbidden`, `api.github.com` noch nicht aktiv freigegeben).
  Deshalb Zusammenführung auf Klaus' Auftrag über Git, ohne GitHub-PR. Keine Schutzregel umgangen, kein Force-Push.

## Prüfung des gemeinsamen Stands

`npm run build` erfolgreich (Selbsttests, TypeScript, Vite, Service Worker), `npm run lint` 0 Fehler
und 10 bestehende Hinweise, `npm run check:herkunft` erfolgreich.

- `node tests/run-ui.mjs workflow-pdf`: 2/2 Skripte grün; Brücke 8/8, Klon 16/16.
- `node tests/run-ui.mjs pwa`: 1/1 Skript, 11/11 Prüfungen grün, einschließlich vollständigem Neubau und Offline-Neustart.
- `node --check tests/gegenprobe-sitzung-b.mjs` und Diff-Prüfung erfolgreich.
- Die erzeugte Inventardatei wurde auf ihren vorherigen Inhalt zurückgelegt.

Die beiden vollständigen Läufe vor der Zusammenführung ergaben jeweils 31/32; die Einzeldatei wird durch die
verwaltete Chromium-Richtlinie bei `file://` blockiert. Diese Einschränkung besteht weiter. Kein dritter Komplettlauf,
keine erneute Installation unveränderter Abhängigkeiten, keine erneuten Gegenproben; die betroffenen Proben wurden
gezielt auf dem gemeinsamen Stand wiederholt. Die bereits nachgewiesenen Gegenproben stehen in den früheren Briefen.
Logs: `/workspace/onboarding-nachweise/fa-main-*.log` in dieser Cloud-Instanz.

Der Push auf main löst die vorhandenen CI- und Pages-Workflows aus. Deren Fernstatus ist über die gesperrte API
hier nicht bestätigt. Android-/Windows-Release-Workflows wurden nicht aufgerufen. Fassung bleibt 2.28.14;
keine sichtbare App-Änderung. Die Briefkopf-Vorschläge warten weiterhin auf Klaus' Ja je Punkt, Tablet-Befunde stehen aus.

## Zeiten und Grenzen

Gesicherte Spuren dieses Nachtrags: 10:24:01–10:26:15 UTC / 11:24:01–11:26:15 Berlin (2 Minuten 14 Sekunden bis Ende der Prüfungen),
anschließend Abschlussbrief und Übertragung. Vorangegangene 35 Minuten 17 Sekunden sind im vorherigen Brief ausgewiesen.
Nicht gemessen: echte Geräte, Einzeldatei im Browser, aktuelle Remote-CI/Pages-Ergebnisse, Wiederherstellung einer neuen Cloud-Aufgabe.

## Startauftrag für Claude Code

```text
CLAUDE.md und BRIEF_ABSCHLUSS_2026-11-01_CODEX-MAIN.md lesen, main aktualisieren.
Beide Codex-Korrekturen sind lokal zusammengeführt; gemeinsamer Stand auf codex/main-uebergabe.
Vor Übernahme nach origin/main Klaus' ausdrückliche Zustimmung zur automatischen Pages-Veröffentlichung einholen.
Klaus' Regel: fertige geprüfte Stücke auf main zusammenführen, damit Dateien für ihn und Folgesitzungen verfügbar sind.
CI und Pages für den Main-Push prüfen; lokal ist die Einzeldatei wegen Browserrichtlinie weiterhin nicht geprüft.
Briefkopf-Vorschläge nur nach Klaus' Ja je Punkt umsetzen; Tablet-Rückmeldungen abwarten.
Main-Zusammenführung ist keine Freigabe für Android-/Windows-Releases. Kein Release ohne Klaus' Wort.
```
