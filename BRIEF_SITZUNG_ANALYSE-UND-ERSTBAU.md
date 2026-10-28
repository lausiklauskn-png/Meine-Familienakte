# Brief für die nächste Sitzung: Analyse und erster Bau (PWA · APK · Windows)

Geschrieben am 28.10.2026 am Ende der Neuaufbau-Sitzung, auf Klaus’ Wort:
*„Mach dann hier einen Abschluss, einen Eintrag in die Forschungsunterlagen und den Brief für
die nächste Sitzung, die dann die Analyse macht und den ersten Bau einer offline-fähigen
PWA-App, einer offline-fähigen APK-App und einer offline-fähigen Windows-App, die nach Bedarf
online gehen kann, so wie Private Brain auch mit einem Knopf vom Netz genommen werden kann
oder auch wieder eingeschaltet werden kann.“*

**Sprache:** durchgehend Deutsch. **Freibrief:** Klaus hat für dieses Repo das Zusammenführen
(Merge) eigener PRs freigegeben, sobald die Prüfungen grün sind.

## Zuerst lesen (in dieser Reihenfolge)

1. `BRIEF_ABSCHLUSS_2026-10-28_NEUAUFBAU.md`: was es gibt, was offen ist
2. `docs/forschung/FORSCHUNG-2026-10-28-NEUAUFBAU-UND-PLATTFORMEN.md`: Befunde,
   Browser-Grenzen, Vorlagen in den anderen Repos
3. `docs/ANALYSE_AUFTRAG.md`: die Analyse in den Paketen A bis G (gilt vollständig)
4. `README.md` und `NEUSTART_AUFTRAG.md`: Start, Regeln für Beispieldaten
5. **Vorlagen** (mit `add_repo` dazunehmen, nur lesen):
   - `Privat-Brain-Pro`:
     - `native/native-network.js` (Internetschalter)
     - `docs/KOMPAKTE-ANSICHT-UND-OFFLINE.md`
     - `windows/` und `docs/BAUSTAND-WINDOWS.md`
     - `docs/MIKROFON-WAHL-WINDOWS.md`
     - `android/`, `docs/ANDROID.md`, `docs/SIGNIERUNG-UND-GITHUB.md`, `docs/PRUEFSTAND-ANDROID.md`
     - `.github/workflows/android*.yml`, `windows*.yml`, `signing-*.yml`, `pages.yml`
   - `BookLedgerPro`:
     - `capacitor.config.json`, `android/`, `.github/workflows/android*.yml`
     - `docs/design/PLAN-TRESORORDNER-2026-10-26.md`
     - `docs/design/PLAN-SUCHE-MIKRO-ANONYM-2026-10-26.md`
   - `Kim-sync`: Geräte-Kopplung (für Paket G)

## Teil 1: Analyse (zuerst)

Pakete A bis G aus `docs/ANALYSE_AUFTRAG.md` abarbeiten. Ergebnisse liegen unter
`docs/analyse/`. Als eigener PR, zusammenführen, dann Klaus die fünf wichtigsten Befunde kurz
im Chat nennen.

Die Analyse ist die Grundlage für Teil 2: Was dort als defekt oder plattformabhängig auffällt
(Ordnerauswahl, Mikrofon, Downloads, Drucken, Kamera), muss der Bau je Plattform lösen.

## Teil 2: Erster Bau, alle drei offline-fähig, mit Internetschalter

### Gemeinsame Grundsätze

- **Offline zuerst:** Die App startet und arbeitet ohne Netz vollständig. Beispieldaten,
  Tresor, Suche, Fristen und Tagebuch funktionieren offline. Nichts wird beim Start aus dem
  Netz nachgeladen. Bibliotheken wie pdf.js gehören ins Paket, nicht ans CDN.
- **Internetschalter wie in Private Brain Pro:** ein Knopf im App-Menü „Internet für die App:
  aus / an“.
  - Standard ist **aus**, der Zustand überlebt einen Neustart.
  - Ist er aus, werden alle Verbindungen nach außen abgewiesen und laufende abgebrochen,
    nach dem Muster `native/native-network.js` mit `fetch`/`XMLHttpRequest`-Hülle.
  - Ist er an, gehen nur die Funktionen ins Netz, die es brauchen: Spracherkennung des
    Browsers, „Mit ChatGPT arbeiten“, später KI, Recherche und Geräte-Kopplung.
  - Der Zustand ist sichtbar (Lampe bzw. Symbol in der Kopfleiste).
  - Die Oberfläche bleibt sonst unverändert: Der Schalter kommt in bestehende Bedienmuster
    (Kopfleiste oder Sicherheitscenter), passend zum Design des Freundes.
- **Ein Quellstand für alle drei:** derselbe Vite-Build (`dist/`). Die Plattformen sind nur
  Hüllen. Plattformunterschiede liegen in kleinen Adaptern: Datentresor, Dateiwahl, Diktat,
  Download/Teilen, Drucken.
- **Aktualisierung über das Repo:** Jeder Merge nach `main` baut alle drei Fassungen. Jede
  Fassung zeigt ihre Versionsnummer und meldet „Neue Version verfügbar“. Die Abfrage geschieht
  nur bei eingeschaltetem Internet.

### a) PWA (Browser-App)

- Service Worker mit Offline-Cache (Versionsstempel, sauberer Wechsel bei neuer Version),
  Manifest mit PNG-Symbolen (192/512, maskable), installierbar auf Android und Windows.
- Die **https-Adresse** ist nötig für Mikrofon und Installation. Vor dem Anlegen Klaus fragen:
  ein öffentliches Auslieferungs-Repo (z. B. `familienakte-app`) nur mit dem Build und GitHub
  Pages, Workflow nach dem Muster `pages.yml` aus Private Brain Pro. Den Pages-Schalter legt
  Klaus einmal selbst um.
- Die Einzeldatei (`npm run build:single`) und der claude.ai-Link bleiben als Vorschau
  bestehen.

### b) APK (Android, zuerst für Klaus’ eigene Tests)

- Capacitor-Hülle um `dist/`, Aufbau und Workflows nach BookLedgerPro bzw. Private Brain Pro.
  Die APK liegt als Release-Datei mit Versionsnummer im Repo. Zuerst reicht eine
  Debug-/Testsignatur, Schlüssel nur als GitHub-Secret, nie im Repo.
- **Diktat:** In der WebView gibt es keine Web Speech API. Natives Diktat über ein Plugin
  (wie in Private Brain Pro) mit `RECORD_AUDIO`, angeschlossen an die bestehenden Diktatknöpfe
  (`lib/browser-dictation.ts` bekommt einen zweiten Weg, die Oberfläche bleibt gleich).
- **Datentresor** im App-Speicher; eine Ordnerwahl über das Android-Speicherframework nur, wenn
  sie sich einfach übernehmen lässt. Sonst später, zusammen mit dem gemeinsamen Tresorordner.
- **Dateieingang:** Kamera bzw. „Dokument fotografieren“, Dateiwahl und **„Teilen →
  Familienakte“** (Android-Intent) für Fotos, PDFs und Scanner-Apps (Paket G, Variante a).
- Herunterladen und Teilen von Sicherungen bzw. Exporten nativ.

### c) Windows

- Tauri-Hülle nach `Privat-Brain-Pro/windows` (NSIS-Installer pro Benutzer, Workflows
  `windows-app.yml` / `windows-release.yml`). Zunächst unsigniert, wie dort.
- Datentresor als Ordner auf der Festplatte bzw. dem USB-Stick (die Ordnerlogik des Freundes
  ist dafür gemacht).
- **Mikrofonauswahl:** Der Freund hat mehrere Mikrofone unter Windows. Im ersten Bau reicht
  das Diktat der eingebauten WebView2. Die feste Mikrofonauswahl nach
  `docs/MIKROFON-WAHL-WINDOWS.md` (SAPI `SetInput`) als **Plan** festhalten; Klaus sagt
  „später, jetzt noch nicht“. Den Windows-Umbau nicht vorziehen.

### Reihenfolge und Abgabe

1. Analyse (Teil 1) → PR, zusammenführen
2. Internetschalter und Offline-Fähigkeit im gemeinsamen Quellstand → PR
3. PWA mit Service Worker (Auslieferungs-Repo erst nach Klaus’ Ja) → PR
4. APK → PR, Release mit herunterladbarer APK, Link an Klaus
5. Windows → PR, Release mit Installer, Link an Klaus
6. `docs/PLATTFORMEN.md` (Bedienung, Aktualisierung, Grenzen je Plattform) und am Ende ein
   eigener `BRIEF_ABSCHLUSS_…` sowie bei Bedarf der nächste Brief

Vor jedem Push: `npm run check`, Typprüfung, Build und die neuen Tests (Playwright für PWA und
Offline sowie den Schalter; Android- und Windows-Prüfung in der CI wie in den Vorlagen).
**Tests nie abschalten,** nur anpassen, wenn sich der geprüfte Wortlaut bewusst ändert.

## Regeln

- Gestaltung, Aufbau und Wortlaut der Oberfläche des Freundes bleiben. Neue Bedienelemente
  fügen sich in die vorhandenen Muster ein.
- Nur erfundene Beispieldaten (Regeln in `NEUSTART_AUFTRAG.md`). Keine echten Personen,
  Firmen, Ärzte oder Nummern.
- Keine Schlüssel, Passwörter oder Signaturdateien im Repo.
- Andere Repos nur lesen. Gemeinsame Bausteine (Schloss, Internetschalter, Diktat) byte-gleich
  übernehmen und die Herkunft (Repo, Datei, Commit) im Code vermerken, statt neu zu erfinden.
- Was Klaus selbst tun muss (Pages-Schalter, APK installieren, Windows-Setup ausführen), steht
  am Ende kurz und als Schrittliste im Chat.

## Offene Entscheidungen (in der Sitzung kurz fragen, nicht raten)

1. Öffentliches Auslieferungs-Repo plus GitHub Pages für die PWA: ja oder nein?
2. Familienakte in den gemeinsamen Tresorordner der Pro-Apps (eigenes Fach) oder eigener
   Tresor? Für den ersten Bau: eigener Tresor. Die Anbindung ist ein späterer Schritt.
3. KI: das Anonymisierungs-Schloss aus BookLedgerPro übernehmen (Empfehlung) – erst nach der
   Analyse in Paket C entscheiden.
