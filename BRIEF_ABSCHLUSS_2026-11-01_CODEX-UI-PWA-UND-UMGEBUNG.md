# Abschluss: Codex – UI-Bau und Cloud-Umgebung, 2026-11-01

> Aktualisierung: Die Zusammenführung auf `main` ist inzwischen von Klaus angeordnet und ausgeführt.
> Maßgeblich ist `BRIEF_ABSCHLUSS_2026-11-01_CODEX-MAIN.md`; die folgenden offenen Merge-/PR-Punkte beschreiben den vorherigen Stand.

## Übergabestand für Montag

Ausgang beider getrennten Zweige: `origin/main` = `ce83c38`, Fassung **2.28.14**.

1. **`codex/pdf-bruecke`, Commit `96f9c49`:** Brückenprobe wartet auf den tatsächlich geöffneten Editor statt auf die
   kurz sichtbare Bibliothek. Drei unmittelbar aufeinanderfolgende Wiederholungen je 8/8 grün, außerdem Einzellauf und
   Gesamtlauf grün. Gegenprobe `Brückenlauf:` 1/1 gefangen. Einzelheiten und erster Abschlussbrief liegen auf diesem Zweig:
   `BRIEF_ABSCHLUSS_2026-11-01_CODEX-PDF-BRUECKE.md`.
2. **`codex/ui-pwa-build`:** `tests/ui/_harness.mjs` verwendet jetzt `npm run build` statt `npx vite build`.
   Damit laufen sämtliche Selbsttests, TypeScript, Vite und `scripts/build-pwa.mjs`. Auch bei vorhandenem `dist/index.html`
   und fehlendem `dist/sw.js` wird neu gebaut. Die vorhandene PWA-Probe setzt `UI_BUILD=1`, damit dieser Weg künftig
   im normalen Gesamtlauf geprüft wird. Gegenprobe `UI-Bau:` stellt absichtlich den alten Vite-Aufruf her.

Die Zweige sind unabhängig von main abgezweigt. Auf dem zweiten liegt daher noch die ursprüngliche Brückenprobe;
beim späteren Zusammenführen müssen beide Stücke übernommen werden. Keine App-Oberfläche, Versionsnummer oder
byte-gleichen Bausteine verändert. Keine Zusammenführung und keine App-Veröffentlichung.

## Nachweise für das zweite Stück

- `npm ci`: erfolgreich (Node 24.19.0, npm 11.9.0, Chromium 154.0.8037.57).
- `npm run build`: erfolgreich, einschließlich aller Selbsttests, TypeScript und Service Worker.
- `node scripts/build-single-file.mjs`: Einzeldatei erfolgreich erzeugt.
- `npm run lint`: **0 Fehler, 10 bestehende Hinweise** in unveränderten App-Dateien.
- `npm run check:herkunft`: erfolgreich.
- `CHROMIUM_PATH=/usr/bin/chromium node tests/run-ui.mjs`: **31/32 Skripte grün**.
- Darin PWA nach vollständigem Neubau: **11/11 grün**, einschließlich Worker-Anmeldung, gefülltem Vorrat
  und tatsächlichem Offline-Neuladen. Brückenprobe 8/8, Klonprobe 16/16 grün.
- `node tests/gegenprobe-sitzung-b.mjs 'UI-Bau:'`: **1/1 gefangen**; mit dem alten Aufruf scheitern
  Bau-Kennung, version.json, Service Worker und Offline-Neustart. Anschließend Originaldatei wiederhergestellt.
- Zusätzliche Funktionsprüfung: `dist/sw.js` entfernt, `UI_BUILD=0`, `startApp()` gestartet. Vollständiger Bau
  stellt den Worker wieder her; HTTP 200, JavaScript-MIME-Typ und tatsächlicher Worker-Inhalt geprüft.
- `git diff --check`: sauber. Die vom Build erzeugte Änderung an `docs/analyse/inventar-laufend.json`
  wurde jeweils auf den vorherigen Inhalt zurückgelegt.

**Ausfall in beiden Gesamtläufen:** `einzeldatei.test.mjs` erreicht die App nicht. `page.goto(file://…)` wird mit
`net::ERR_BLOCKED_BY_ADMINISTRATOR` abgewiesen. `/etc/chromium/policies/managed/urls.json` erlaubt HTTP/HTTPS,
jedoch keine Datei-URLs. Die Richtlinie wurde nicht verändert oder umgangen, die Probe nicht deaktiviert.
Die Einzeldatei muss in einer dafür freigegebenen Umgebung (z. B. reguläre GitHub-CI) geprüft werden.
**Keine Behauptung von 32/32 oder abgeschlossener Gesamtabnahme.**

Ausführliche Protokolle dieser Instanz: `/workspace/onboarding-nachweise/` (außerhalb des Repositories).

## Wiederverwendbare Cloud-Einrichtung

Installationsskript und Startanweisungen im Umgebungsentwurf gespeichert, einschließlich der Einschränkungen.
Das tatsächlich ausgeführte Installationsskript prüft Node und Chromium, installiert per `npm ci`, baut die PWA
und die Einzeldatei. Es sichert/restauriert die Inventardatei, um vorhandene Nutzeränderungen zu bewahren.

Entwicklungsserver gestartet, später neu gestartet und im Browser funktional geprüft: Beispielfamilie und acht Hauptmenüs.
Start: `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` im Repository. Browserproben:
`export CHROMIUM_PATH=/usr/bin/chromium`. Laufende Prozesse müssen in neuen Aufgaben neu gestartet werden.
Vorhandenen Checkout verwenden; Cloud-Aufgaben sind isoliert, keine zusätzlichen Git-Worktrees ohne Auftrag.

Git-Lesen und Push funktionieren mit der vorhandenen Plattformauthentifizierung. Die GitHub-API wurde mit `Forbidden`
abgewiesen; `api.github.com` fehlt in der aktiven Netzwerkfreigabe. Diese Domain ist im Entwurf ergänzt,
aber noch nicht aktiviert. **Noch keine Entwurfs-PRs angelegt.** Klaus muss die Änderungen unter
„Umgebung bearbeiten“ prüfen/speichern und die Cloud-Umgebung veröffentlichen; danach API-Zugang erneut prüfen
und je Zweig einen Entwurfs-PR anlegen. Das ist keine Veröffentlichung der App.
Gespeicherte Konfiguration, aktuelle Maschine und veröffentlichter Snapshot sind verschiedene Zustände;
Publikation und Wiederherstellung in einer neuen Aufgabe wurden nicht geprüft.

## Sichtbares / noch offen

Klaus wurden zwei getrennte Textvorschläge zur Freigabe vorgelegt; bisher kein Ja erhalten:
- Warteschlange: vorhandene graue Infozeile, z. B. „Stadtwerke Musterstadt · Nr. 471108 · PDF · Wohnen · 84 KB“.
- Stapel: vorhandene Namenszeile, z. B. „Stadtwerke Musterstadt · Nr. 471108 · Brief.pdf“.
Jeweils keine zusätzliche Zeile/Box, lange Angaben gekürzt, fehlende Angaben weglassen.
Vor Umsetzung das Ja je Punkt abwarten. Im Stapel gibt es bisher keine gespeicherten Briefkopfdaten;
Texterkennung geschieht bisher erst beim Einordnen. Den Umgang damit bei Umsetzung ausdrücklich klären,
keine heimliche Umstellung auf automatische OCR. Tablet-Rückmeldungen zu 2.28.14 stehen noch aus.

## Nicht gemessen

Keine echten Geräte, keine echte Amtspost, keine Handschrift/schrägen Originalscans; Android- und Windows-Hüllen
nur in den vorhandenen Browserproben mit Ersatzobjekten. Keine nativen Installationspakete gebaut.
Kein historischer CI-Trace des Brücken-Wettlaufs, keine neue CI-Ausführung und keine browserseitige Prüfung der
Einzeldatei wegen der Richtlinie. Nicht die komplette Gegenproben-Sammlung ausgeführt, sondern nur die zwei genannten Fälle.
`UI_BUILD=1 node tests/run-ui.mjs` nicht zusätzlich als eigener Komplettlauf wiederholt; der Neubau-Weg wird
im regulären Gesamtlauf durch die PWA-Probe ausdrücklich mit `UI_BUILD=1` ausgeführt.

## Stundennachweis

Gesicherte Spuren **09:37:35–10:11:12 UTC / 10:37:35–11:11:12 Berlin**: **33 Minuten 37 Sekunden**, inklusive
Build-/Browserwartezeiten. Früheres Lesen und anfängliche Einrichtung ohne gesicherte Startzeit nicht hinzugerechnet.
09:37–09:54: Brückenprobe, Gegenprobe, drei Wiederholungen, erster Gesamtlauf.
09:55–10:11: zweiter Zweig, UI-Bau/Gegenprobe, zweiter Gesamtlauf, gespeicherte Einrichtung und Wiederanlauf.

Abschlussbrief und Bestätigung beider GitHub-Zweige: bis **10:12:52 UTC / 11:12:52 Berlin**.
Gesamte dokumentierte Spanne ab 09:37:35 UTC damit **35 Minuten 17 Sekunden**, einschließlich Wartezeiten.

## Startauftrag

```text
Klaus, Deutsch und kurz. CLAUDE.md und diesen Abschlussbrief lesen.
Beide Zweige codex/pdf-bruecke und codex/ui-pwa-build enthalten getrennte Stücke von origin/main.
Entwurfs-PRs fehlen wegen gesperrter GitHub-API; api.github.com steht bereits im Umgebungsentwurf.
Nach Aktivierung Zugang prüfen und je Stück einen Entwurfs-PR anlegen. CI abwarten, keine Veröffentlichung ohne Klaus.
Lokal zweimal 31/32; Einzeldatei durch verwaltete file://-Sperre blockiert, nicht als bestanden melden.
Brückenlauf: und UI-Bau: je 1/1 Gegenprobe gefangen, drei Brücken-Wiederholungen grün.
Briefkopf-Vorschläge warten auf Klaus' Ja je Punkt; Stapel hat noch keine Briefkopfdaten/OCR vor dem Einordnen.
Tablet-Befunde abwarten. Keine Versionsanhebung für unveröffentlichten Stand; sichtbar bleibt Version 2.28.1.
```
