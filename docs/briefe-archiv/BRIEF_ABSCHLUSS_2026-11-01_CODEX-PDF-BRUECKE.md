# Abschluss: Codex – Brückenprobe, 2026-11-01

## Gebaut

Zweig `codex/pdf-bruecke`, Ausgang `origin/main` = `ce83c38` (2.28.14).
Die Probe `tests/ui/workflow-pdf-bruecke.test.mjs` wartete auf die sichtbare Bibliothek `#sc-bib`.
Der Klon öffnet eine einzelne empfangene Datei automatisch im Editor und blendet dabei die Bibliothek aus
(`importDateien` / `oeffneDok` im unveränderten Klon). Bei schnellem Import konnte die Probe diesen sichtbaren
Zwischenzustand verpassen. Sie wartet jetzt auf den Editor, prüft die vorhandene Bibliothek und geht anschließend
zurück, um den tatsächlichen Garantiebeleg und das Teilen an die Akte zu prüfen. Wartezeit weiterhin 30 Sekunden.
Die Brücke puffert Dateien bis `launchQueue.setConsumer`; ein Verlust der Datei vor dieser Anmeldung wurde nicht nachgewiesen.

Keine Änderung an App-Oberfläche, Produktionscode, Versionsnummern oder byte-gleichen Bausteinen.

## Proben und Gegenprobe

- `npm ci`: erfolgreich, Node 24.19.0 / npm 11.9.0.
- `npm run build`: alle enthaltenen Selbsttests, TypeScript, Vite und Service Worker erfolgreich.
- `node scripts/build-single-file.mjs`: erfolgreich.
- `npm run lint`: 0 Fehler; `npm run check:herkunft`: erfolgreich.
- Brückenprobe nach Korrektur: erster Einzellauf grün, danach **3 unmittelbar aufeinanderfolgende Läufe je 8/8 grün**;
  zusätzlich im Gesamtlauf **8/8 grün**.
- `CHROMIUM_PATH=/usr/bin/chromium node tests/gegenprobe-sitzung-b.mjs 'Brückenlauf:'`:
  **1/1 gefangen**. Absichtlicher Rückfall auf die Sichtbarkeit der schon ausgeblendeten Bibliothek wird rot.
- `node tests/run-ui.mjs`: **31/32 Skripte grün**. `einzeldatei.test.mjs` bricht bei `page.goto(file://…)`
  mit `net::ERR_BLOCKED_BY_ADMINISTRATOR` ab. Die verwaltete Chromium-Richtlinie erlaubt HTTP/HTTPS,
  aber keine lokalen Datei-URLs. Kein Fehler der gebauten Einzeldatei nachgewiesen; deren Verhalten blieb ungeprüft.
- Die automatisch beim Build geänderte Inventardatei `docs/analyse/inventar-laufend.json` wurde auf ihren vorherigen Stand zurückgelegt.

## Einrichtung / Grenzen / Offenes

PWA-Entwicklungsserver gestartet und im Browser geprüft: Beispielfamilie und acht Hauptmenüs vorhanden.
Installationsskript und Startanweisungen im Cloud-Entwurf gespeichert. `api.github.com` als benötigte Domain ergänzt;
das Speichern des Entwurfs aktiviert die Freigabe nicht. Git-Lesen funktioniert, GitHub-API meldet bisher `Forbidden`.
Entwurfs-PR erst anlegbar, wenn dieser Zugang funktioniert. Keine Zusammenführung, Veröffentlichung oder Fassungsanhebung.

Nicht gemessen: ursprünglicher CI-Lauf als Trace, echte Tablet-/Windows-/Android-Geräte, echte Post,
Wiederherstellung in einer neuen Cloud-Aufgabe, Einzeldatei im Browser wegen obiger Richtlinie.
Nächster Punkt: Testrahmen mit vollständigem PWA-Build statt nur Vite; danach Vorschlag für sichtbaren Briefkopf.

## Zeiten

Erste dauerhaft datierte Arbeitsspur: **09:37:35 UTC / 10:37:35 Berlin** (Zweig und Build).
Letzte Prüfspur dieses Stücks: **09:54:38 UTC / 10:54:38 Berlin** (Ende Gesamtlauf).
Spanne **17 Minuten 3 Sekunden**, einschließlich automatischer Wartezeiten; frühere Einrichtung/Lesen ohne gesicherte Startzeit nicht hinzugerechnet.

## Startauftrag

```text
CLAUDE.md und beide jüngsten CODEX-Abschlussbriefe lesen.
Brücken-Korrektur auf codex/pdf-bruecke prüfen; Gegenprobe Brückenlauf: und drei Wiederholungen sind grün.
Gesamtlauf 31/32: Einzeldatei wird von der verwalteten Chromium-Datei-URL-Richtlinie blockiert.
Richtlinie nicht umgehen; die Prüfung in einer dafür freigegebenen Umgebung nachholen.
GitHub-API-Zugang für Entwurfs-PR herstellen, keinen Release ohne Klaus' Wort.
UI_BUILD-Korrektur als eigenes Stück; Briefkopf sichtbar nur nach Klaus' Ja je Punkt.
```
