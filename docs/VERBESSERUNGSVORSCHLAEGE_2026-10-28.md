# Verbesserungsvorschläge für „Meine Familienakte“

Stand: 28.10.2026, Version 2.28.1, Branch `main` (Commit 22d0b40).
Nur Analyse und Vorschläge, kein Code. Reihenfolge innerhalb der Abschnitte nach Dringlichkeit.

## Wie geprüft wurde

- Vollständige Durchsicht von `app/`, `lib/`, `scripts/`, Konfiguration und Dokumentation.
- `npm install`, `npm run typecheck`, `npm run check` (alle 25 Prüfskripte grün), `vite build`.
- Lighthouse 12 gegen den Produktionsbuild (`vite preview`), einmal Handy-Simulation, einmal Desktop.
- Playwright-Rundgang durch den Produktionsbuild: Startseite, Menüs, Systemprüfung, Tastaturfokus, Seitenbreiten 390 bis 1366 px.
- Bundle-Analyse über Source Maps.

## Lighthouse-Ergebnis (Produktionsbuild)

| Kategorie | Handy | Desktop |
| --- | --- | --- |
| Leistung | 90 | 100 |
| Barrierefreiheit | 91 | 91 |
| Best Practices | 100 | 100 |
| SEO | 91 | 91 |

| Messwert (Handy) | Wert | Einordnung |
| --- | --- | --- |
| First Contentful Paint | 2,5 s | zu langsam, Ziel unter 1,8 s |
| Largest Contentful Paint | 2,6 s | knapp an der Grenze (2,5 s) |
| Cumulative Layout Shift | 0,11 | Grenzwert ist 0,1, Verursacher: Startseiten-Hero |
| JavaScript-Ausführung beim Start | 1,7 s | zu viel für eine Startseite |
| JavaScript gesamt | 306 KB gzip (1,08 MB entpackt) | ein einziges Paket, 202 KB davon beim Start ungenutzt |
| CSS gesamt | 27 KB gzip (141 KB entpackt) | ein Teil davon ist tot (siehe unten) |

Das Ergebnis ist für eine lokal laufende App ordentlich. Die Punkte unten zeigen, wo die letzten Zehntel und vor allem die Wartbarkeit herkommen.

---

## A. Fehler und Risiken (zuerst beheben)

### A1. Die eingebaute Systemprüfung ist im fertigen Build rot, im Entwicklungsmodus grün
In `app/local-vault.ts` (ab Zeile 1867) und `lib/family-assistant.ts` (Zeile 195) prüfen Selbsttests den eigenen Quelltext per `Funktion.toString().includes("scanInventoryFolder")`. Der Produktionsbuild benennt Funktionen um, deshalb finden diese Tests ihre Wörter nicht mehr. Im gebauten Stand meldet „Hilfe → Systemprüfung → Abschlussprüfung starten“ deshalb **ROT, 4 offene Prüfpunkte, Update nicht freigeben**, obwohl `npm run check` grün ist. Empfehlung: Tests, die Quelltext auf Wörter prüfen, entfernen oder durch echte Verhaltenstests ersetzen.

### A2. Stiller Wechsel des Speicherorts (Eindruck von Datenverlust)
`app/local-vault.ts` Zeilen 195 bis 213: Schlägt die Schreibprobe im Browser-Dateispeicher (OPFS) einmal fehl, egal warum, wechselt die App ohne Meldung auf IndexedDB. Der Nutzer sieht dann einen leeren Tresor, neue Daten landen im zweiten Speicher, beim nächsten Start sind sie womöglich wieder getrennt. Empfehlung: die einmal getroffene Wahl dauerhaft speichern, den Wechsel sichtbar melden, nie automatisch zurückwechseln.

### A3. Verlorene Änderungen bei gleichzeitigen Schreibvorgängen
Die Schreibsperre (`withRegisterWriteLock`, Zeile 741) schützt nur das Schreiben der Registerdatei. Jede Aktion liest aber zuerst das Register, arbeitet (bei Bestandsscans minutenlang) und schreibt dann das Ganze zurück. Eine Bedienung während eines Scans wird vom Scan-Ergebnis überschrieben. Zwei offene Tabs auf demselben Tresor überschreiben sich gegenseitig. Empfehlung: Lesen und Schreiben gemeinsam sperren, für mehrere Tabs die Web Locks API nutzen.

### A4. Falscher Stammordner kann aktuelle Daten verdecken
`existingVaultRoot` (Zeile 379) wählt bei verschachtelten Stammordnern den mit den meisten Einträgen. Nach „Beispieldaten entfernen“ sinkt die Zahl, und ein älteres Register kann gewinnen. Empfehlung: den gewählten Stammordner merken, statt bei jedem Start neu zu raten.

### A5. Keine Transaktionen, verwaiste Dateien
Dokumente und Scan-Originale werden vor dem Register geschrieben (Zeilen 2506 bis 2522). Schlägt das Registerschreiben fehl, bleiben Dateileichen. `removeVaultEntries` (ab Zeile 3463) löscht Dokumentdateien, aber nicht die zugehörigen Scan-Original- und Erinnerungsmedien-Ordner. Empfehlung: Schreibreihenfolge umdrehen oder beim Start eine Aufräumprüfung ergänzen.

### A6. Große Dateien landen komplett im Arbeitsspeicher
Prüfsummen lesen jede Datei vollständig ein (Zeile 811), beim Backup sogar zweimal pro Datei. Videos bis 200 MB sind erlaubt, Dokumente nur 20 MB. Auf dem Handy führt das zu Abstürzen. Empfehlung: streamen, einheitliche Größenlimits, Fortschrittsanzeige.

### A7. Waagerechter Scrollbalken am PC zwischen 1024 und 1366 px Breite
Die Hauptnavigation (`.nav-cluster`) ragt bei diesen Breiten über den rechten Rand. Bei 1366 px entstehen 97 px Überhang. Das ist die häufigste Notebook-Breite.

### A8. pdf.js wird zur Laufzeit von einem fremden Server geladen
`app/file-viewer.tsx` Zeile 49 lädt die PDF-Vorschau von cdnjs, ohne Integritätsprüfung. Offline gibt es keine PDF-Vorschau, und ein lokaler Datentresor spricht beim Öffnen eines Dokuments mit dem Internet. Empfehlung: pdf.js als Paket einbauen (passt auch zum geplanten Internetschalter).

### A9. Start-Effekte ohne Abbruch
In `app/health-portal.tsx` (Zeilen 557 bis 585) laufen zwei Start-Effekte parallel ohne Abbruch-Flag und schreiben konkurrierend in den Zustand. Mehrere `setTimeout` ohne Aufräumen (Zeilen 955, 1053, 1058, 1062, 3196).

### A10. Identität geht bei Lesefehlern verloren
`vaultIdentity` (Zeile 775) und `archiveIdentity` (Zeile 2255) erzeugen bei jedem Lesefehler, auch bei fehlender Berechtigung, eine neue Kennung und überschreiben die alte.

### A11. Keine Fehlergrenze
`src/main.tsx` hat keine ErrorBoundary. Ein einziger Renderfehler ergibt eine weiße Seite ohne Hinweis. Empfehlung: Fehlergrenze mit Meldung „Seite neu laden, Daten sind sicher“.

---

## B. Datenschutz und Sicherheit

### B1. Gesundheitsdaten liegen im Klartext
Register, Dokumente, Backups und Exporte sind unverschlüsselt, auch im OneDrive-Ordner. Zusätzlich hält die App fünf Vollkopien des Registers in `00_Register/Sicherungen`, also sechs Klartextkopien aller Inhalte. Der „Gesundheitsschutz“ (`lib/family-privacy.ts`) ist nur eine Anzeigemaske per Wortliste. Empfehlung: Verschlüsselung mit Passphrase (WebCrypto) für Register, Backup und Export, oder zumindest ein deutlicher Hinweis im Sicherheitscenter. Kopienzahl reduzieren.

### B2. Entwicklungs- und Testwerkzeuge im Produktpaket
Rund 630 Zeilen „Automatische Testumgebung“ und Windows-Diagnose (`app/local-vault.ts` 1276 bis 1903) mit festem Pfad `G:\01GPT-SOFTWARE\…` (Zeile 160), „Website-Version 40 · private Testfassung“, `sites-project://appgprj_demo` im ChatGPT-Prompt (Zeile 81 in `health-portal.tsx`) und der Bereich „Bestand prüfen“ mit „Windows-Dateisystem diagnostizieren“. Für Privatnutzer unverständlich, für Dritte ein Einblick in den Entwicklungsrechner. Empfehlung: in ein eigenes, nur im Entwicklungsmodus geladenes Modul verschieben oder hinter einen Expertenschalter.

### B3. Reste der Vorgänger-App
„Ausloggen“ lädt nur die Seite neu, es gibt kein Login (Zeile 1074). `app/browser-uploads.ts` ist ein leerer Stub, trotzdem wird `fetch(item.downloadUrl)` aufgerufen (Zeile 687). `"use client"` in allen neun Komponenten, `eslint-disable @next/next` ohne ESLint. `pnpm check:consolidation` als Testbefehl in `lib/family-consolidation.ts`, obwohl npm genutzt wird.

Positiv: kein `eval`, kein `dangerouslySetInnerHTML`, keine Datenübertragung nach außen außer dem Link zu chatgpt.com, alle Löschaktionen mit Bestätigung.

---

## C. Code-Qualität und Architektur

### C1. Zwei Riesendateien
`app/health-portal.tsx` hat 3524 Zeilen, 175 `useState`, 29 Komponenten und Zeilen mit bis zu 5800 Zeichen. Sie allein macht 413 KB des Bundles aus. `app/local-vault.ts` hat 3489 Zeilen und vereint mindestens acht Belange (Handles, Register, Bestand, Testumgebung, Textdekodierung, Backup, Erinnerungen, Sync). Empfehlung: Aufteilung in Feature-Ordner (`features/cockpit`, `features/inventory`, `features/memory`, `features/security`, `features/system-check`) und in `vault-register.ts`, `vault-inventory.ts`, `vault-backup.ts`, `vault-memory.ts`, `text-decoding.ts`.

### C2. Gott-Komponente
`HealthPortalContent` (Zeile 440 bis 1336) hält 63 `useState`. Jeder Tastendruck im Suchfeld rendert den gesamten Baum neu. `Overview` bekommt 36 Props, `SecurityCenter` 23, `InventoryCenter` 20. Empfehlung: zusammengehörige Zustände in `useReducer` oder eigene Hooks (Tresor, Upload, Erinnerungen, Inventar, Eingang, Systemprüfung), gemeinsame Dinge wie Navigation und Hinweise in einen Context.

### C3. Fehlende Memoisierung
`buildFamilyCockpit`, `buildStoredPersonalLifeAreas`, `buildScheduleItems` und Sortierungen laufen bei jedem Render. Die Suche macht pro Tastendruck `JSON.stringify` über alle Datensätze (Zeile 429).

### C4. Kein Routing
`go()` schreibt nur `replaceState("#…")`, es gibt keinen `hashchange`-Handler. Zurück-Taste und Links auf Unterseiten funktionieren nicht, die App startet immer auf der Übersicht.

### C5. Fokus und Dialoge
Sechs von neun Modals haben weder Fokusfalle noch Escape noch Fokus-Rückgabe (Upload, Export, ChatGPT, zwei Erinnerungs-Dialoge, Scan-Dialog).

### C6. Wiederholungen und Totes
- `error instanceof Error ? … : "…"` rund 70-mal, `Intl.DateTimeFormat("de-DE")` rund 15-mal inline.
- Berechtigungsabfrage sechsfach, Pfad-zu-Handle-Auflösung vierfach, IDB-`put` dreifach.
- Unbenutzte Importe und Funktionen: `MicOff`, `MessageSquarePlus`, `useId`, `createLocalFamilyRelation`, `checkRecommended`, `VoiceTextarea`, über 60 nicht importierte Exporte in `lib/`.
- Tote CSS-Familien (`.topbar`, `.sidebar`, `.nav-item`, `.page-grid`, `.workflow`, `.stats-grid`, `.toast`, `.vault-pill`, `.status-light`), schätzungsweise ein Viertel der 1674 Zeilen.
- Tailwind ist eingebunden, aber nur rund 33 Utility-Klassen werden benutzt. Entweder konsequent nutzen oder entfernen.

### C7. Typisierung
Kein `any`, das ist gut. Aber 58 `as`-Umwandlungen in `local-vault.ts`, 48 in `health-portal.tsx`. `FamilyRecordStatus = … | string` hebt die Literaltypen auf. Keine Schemamigration: `normalizeIndex` setzt `version: 5` hart, egal was gelesen wurde.

### C8. Magische Zahlen und Zeichenketten
Version „2.28.1“ rund 30-mal hart im Code statt aus `package.json`. Zwei Versionssysteme nebeneinander („Website-Version 40“ und „2.28.1“), zehn Einträge der Versionshistorie mit derselben Nummer. Größenlimits (20 MB, 25 MB, 200 MB, 12 Medien, 30 Originale, 300 000 Zeichen) verstreut statt an einer Stelle. Zählungen über Freitext wie `notes.includes("Eingangszentrale 2.28.0")`.

### C9. Benennung
Deutsch und Englisch gemischt (`fawoga`, `mmi-`, `QUELLE_ANALYSIERT`, `status-geprüft` als CSS-Klasse mit Umlaut). Stammordner heißt `Me_Myself_and_I_Familienakte`, Seitentitel „Me, Myself and I – Meine Familienakte“, Logo „MMI FAMILIENAKTE“, Paketname „meine-familienakte“. Empfehlung: einen Namen festlegen und überall durchziehen.

---

## D. Werkzeuge, Tests, Betrieb

### D1. Kein Linter, kein Formatierer, keine CI
Keine ESLint-, Prettier- oder EditorConfig-Datei, kein `.github/workflows`, kein `.nvmrc`. Empfehlung: ESLint mit `typescript-eslint`, `react-hooks` und `jsx-a11y`, Prettier, ein Workflow, der `typecheck`, `check`, Lint und Build bei jedem PR ausführt.

### D2. Prüfskripte
25 Einzelskripte mit eigenem Mini-Framework auf `node:assert`. Die Kommandozeile in `package.json` ist 1400 Zeichen lang und zweimal vorhanden (`build` und `check`). Viele Prüfungen testen Wortvorkommen im Quelltext statt Verhalten (`run-system-check.mjs`). `lib/release-system-check-report.json` ist ein handgepflegter Schnappschuss, der exakt „gelb, 29 Bereiche, 1 Problem“ sein muss. Nicht abgedeckt: `idb-directory.ts`, OPFS, Mehrfachzugriff, Oberfläche. Empfehlung: Vitest als Testläufer, ein `npm test`, Playwright für drei bis fünf Kernabläufe (Start, Dokument ablegen, Suche, Backup, Beispieldaten entfernen).

### D3. Node-Mindestversion
Die Skripte importieren `.ts` direkt und brauchen Node 22.18 oder neuer. `engines` sagt 22.13, README sagt „Node 22“.

### D4. Veraltete Abhängigkeiten
Vite 6 (aktuell 8), TypeScript 5.9 (aktuell 7), `@vitejs/plugin-react` 5 (aktuell 6), lucide 1.31 (aktuell 1.63). Nicht dringend, aber vor dem PWA-Umbau sinnvoll.

### D5. Dokumentation
README sagt „Oberfläche unverändert aus der bisherigen App“, `NEUSTART_AUFTRAG.md` sagt „keine Vorlage, kein alter Code“. Drei Auftrags- und Briefdateien liegen im Wurzelverzeichnis, besser unter `docs/`. `lib/system-check-manifest.json` und `release-system-check-report.json` sind Artefakte, kein Quellcode. Es fehlt eine kurze `CONTRIBUTING.md` (wie testen, wie bauen, Branch-Regeln) und eine `CHANGELOG.md` statt der Versionshistorie im Komponentencode.

---

## E. Leistung (Lighthouse-Themen)

1. **Ein einziges JavaScript-Paket mit 1,08 MB.** 202 KB sind beim Start ungenutzt. Empfehlung: `React.lazy` für Systemprüfung, Benutzerabnahme, Hilfe, Versionshistorie, Scan-Dialog, Dateivorschau und die Testumgebung. React und lucide als eigener Vendor-Chunk (`manualChunks`), damit sie beim nächsten Update gecacht bleiben.
2. **1,7 s Skriptausführung beim Start auf dem Handy.** Ursache ist die Größe der Hauptkomponente und die Anlage der Beispielfamilie beim ersten Start (rund 6 s bis der Tresor steht). Empfehlung: Beispielfamilie erst auf Knopfdruck oder im Hintergrund nach dem ersten Bild anlegen, Startbildschirm mit Skelett zeigen.
3. **Layout-Sprung 0,11 im Hero.** Hero-Höhe und Cockpit-Karte vor dem Laden der Daten reservieren (feste Mindesthöhe).
4. **Keine Virtualisierung** in Inventarliste, Bibliothek, Chronologie und Prüfberichten. Ab ein paar hundert Einträgen wird das Scrollen zäh. Empfehlung: Seitenweise laden oder eine Listen-Virtualisierung.
5. **Event-Listener-Inflation:** `InfoPopover` meldet drei und `DictationButton` vier Window-Listener pro Instanz an. Auf der Startseite gibt es Dutzende. Besser ein gemeinsamer Listener.
6. **Kein Service Worker, keine Cache-Header.** Ohne Offline-Cache ist die App nicht wirklich installierbar und nach dem ersten Start nicht schneller. Manifest hat nur ein SVG-Symbol, es fehlen 192 und 512 px PNG, `maskable` und `apple-touch-icon`.
7. **Source Maps** für den Produktionsbuild fehlen (Lighthouse-Hinweis). Für ein privates Projekt vertretbar, hilft aber bei Fehlerberichten.
8. **robots.txt**: der Vorschau-Server liefert für `/robots.txt` die Startseite. Bei echtem Hosting eine leere `public/robots.txt` beilegen, dann ist SEO 100.

---

## F. Barrierefreiheit

Lighthouse meldet 91, die Prüfung von Hand findet mehr:

1. **Kontrast unter 4,5:1** bei kleinen Texten: `.topic-number` 2,45:1, deaktivierte Buttons 2,6:1, `.area-arrow` 2,7:1, `.eyebrow.dark` 4,3:1, `small` in Status-Buttons 4,0:1, `--muted` auf `--canvas` 4,6:1 (knapp). Lighthouse selbst beanstandet vier Elemente auf der Startseite.
2. **Zu kleine Schrift für die Zielgruppe:** über 60 CSS-Regeln zwischen 0,63 und 0,78 rem, also 10 bis 12,5 px. Für Privatnutzer und ältere Menschen sollte nichts unter 14 px liegen, Hinweistexte nicht unter 13 px.
3. **Touch-Ziele unter 44 px:** Icon-Buttons 38 px, Eingangs-Tabs 28 px breit, Hilfe-Auslöser 24 px, Scan-Steuerung 34 px, Fußzeilen-Links und Breadcrumb mit 3 bis 5 px Innenabstand.
4. **Drei Datei-Eingabefelder ohne Beschriftung**, Drucken-Button nur mit `title`, Download-Link nur mit `title`, sechs Buttons, deren sichtbarer Text nicht im `aria-label` vorkommt (Lighthouse `label-content-name-mismatch`).
5. **Fokus:** `outline: 0` an den Suchfeldern, nur acht `:focus-visible`-Regeln, Buttons haben keinen eigenen Fokusstil. Mobile-Menü ohne `aria-expanded`, Mega-Menü ohne `aria-haspopup` und ohne Escape.
6. **Emoji-Ampeln** 🟢🟡🔴 in Überschriften werden vom Screenreader vorgelesen, brauchen `aria-hidden` plus Text.
7. **Tabellen** ohne `caption` und `scope`, Fehlermeldungen ohne `role="alert"`, kein Skip-Link, mehrere `<header>`-Landmarks.

---

## G. Nutzerfreundlichkeit

### G1. Zu viele Wege zum selben Ziel
Vier Navigationssysteme (Hauptmenü mit 8 Bereichen und 32 Einträgen, Fußzeile mit 16 Links, Hilfe-Schnellzugriffe, Lebensbereiche-Karten). Im Menü 13 Duplikate: „Korrespondenz“ und „Anfragen & Antworten“ führen zum selben Ziel, „Familie“ dreimal, „Wohnen“, „Fahrzeuge“, „Käufe“ je dreimal, „Hilfe“ zweimal. Empfehlung: ein Hauptmenü mit höchstens sieben Bereichen, Fußzeile auf Impressum, Hilfe, Version reduzieren.

### G2. Uneinheitliche Begriffe
„Tagebuch & Erinnerungen“, „Erinnerungsprotokoll“, „Memory“ für dasselbe. „Dokumenteneingang“ gegen „Eingangszentrale“. „Datentresor“, „Tresor“, „Sicherheitscenter“, „Datentresor-Hilfe“. „Objekt-Cockpit“, „Interaktives Cockpit“, „Arbeitsübersicht“. „Abgleich durchführen“ meint an drei Stellen drei verschiedene Dinge. Empfehlung: ein Glossar mit einem Begriff pro Ding, dann alle Texte danach prüfen.

### G3. Fachjargon in Nutzertexten
„FaWoGa“, „Prüfsumme“, „Relationsmodell“, „Referenz-Hash“, „Regressionstests“, „Sites-Quellstand“, `ASSISTENZ_FREIGEGEBEN`, „Website-Version 40“. Ein Familienmitglied versteht das nicht.

### G4. Rückmeldungen gehen unter
Erfolg und Fehler erscheinen nur in zwei Aktivitätszeilen unter der Suche, nicht haftend. Auf langen Seiten sieht man sie nicht. Es existiert ein `.toast`-Stil im CSS, der nie benutzt wird. Empfehlung: Toast-Hinweise unten rechts (am Handy unten mittig), Fehler zusätzlich an der Stelle der Aktion.

### G5. Startseite ist überladen
Vor dem eigentlichen Inhalt stehen: Suchzeile, zwei leere Aktivitätszeilen mit „Copy“-Knöpfen (englisch), ein Beispieldaten-Banner, ein Breadcrumb „Startseite“ auf der Startseite. Erst dann der Hero. Empfehlung: Aktivitätszeilen nur zeigen, wenn es etwas gibt; Banner einmal schließbar; Breadcrumb auf der Startseite weglassen.

### G6. Hilfe als Textwand
44 Aufklapp-Abschnitte, 28 davon standardmäßig offen. Empfehlung: alle zu, Suche in der Hilfe, drei Einstiegsfragen oben („Wie lege ich ein Dokument ab?“).

### G7. Löschen durch Tippen von Schlüsselwörtern
„VERBLEIBEN / MITLÖSCHEN / ABBRECHEN“ eintippen ist ungewöhnlich und fehleranfällig. Besser drei klar beschriftete Knöpfe.

### G8. Beispieldaten erscheinen wie echte Akte
Die fest eingebauten Gesundheitsbeispiele aus `health-data.json` tauchen in Suche und Fachseiten als echte Einträge auf („Gesundheitskontakt Nord“, „1 Beispielfall“), auch nach „Beispieldaten entfernen“. Empfehlung: alle Beispieldaten über denselben Weg laden und entfernen.

### G9. Reparaturlauf ohne Reparatur
Der „Reparaturdurchlauf“ zeigt einen Fortschrittsbalken, wartet aber nur per `setTimeout` und schreibt dann in localStorage. Das wirkt wie ein Vorgang, ist aber keiner. Entweder echte Reparaturschritte oder ehrlich „Prüfung wiederholen“ nennen.

### G10. Handy
Zehn verschiedene Breakpoints im CSS, zwei parallele Systeme (altes 860/610 für ungenutzte Klassen). Tabellen mit `min-width: 780px` scrollen seitlich. Ansonsten ist die mobile Umsetzung sorgfältig. Empfehlung: auf drei Breakpoints (Handy, Tablet, Desktop) reduzieren, Tabellen am Handy als Karten darstellen.

---

## H. Nachtmodus: ja, der gehört hinein

**Warum:** Die App wird abends am Küchentisch und im Bett am Handy genutzt (Fristen nachsehen, Dokument fotografieren). Ein weißer Bildschirm mit 16 px Text blendet dann. Das Betriebssystem meldet die Vorliebe des Nutzers bereits (`prefers-color-scheme`), die App ignoriert sie. Lighthouse prüft das nicht, aber die Chrome-Installationsprüfung und die Nutzer merken es sofort. Alle Apps der Zielgruppe (Banking, Krankenkasse, Kalender) haben inzwischen einen Dunkelmodus.

**Ist-Zustand:** Nur 17 Farbvariablen in `:root`, daneben 321 verschiedene feste Hex-Werte und 59 `rgba()` im CSS. Ab Zeile 1459 (Assistenz, Benutzerabnahme) fast nur noch feste Werte. Die TSX-Dateien enthalten keine festen Farben, das ist gut. Icons nutzen `currentColor`, auch gut.

**Vorschlag, in dieser Reihenfolge:**
1. Farbsystem auf 25 bis 30 semantische Tokens zurückführen: Flächen (Seite, Karte, erhöht, eingesenkt), Linien (leicht, stark), Text (Haupt, gedämpft, invertiert), Marke (Navy, Teal), je Status (Erfolg, Warnung, Fehler, Info) eine weiche und eine starke Farbe, Schatten, Fokusring. Alle 321 Hex-Werte auf diese Tokens abbilden.
2. Dunkle Werte unter `@media (prefers-color-scheme: dark)` und unter `[data-theme="dark"]` definieren. `<meta name="color-scheme" content="light dark">` ergänzen, `theme-color` im Manifest und in `index.html` je Schema.
3. Schalter mit drei Stellungen „Automatisch / Hell / Dunkel“ in der Kopfleiste neben Drucken. Wahl in localStorage. Beim Start vor dem ersten Render anwenden, damit es nicht flackert.
4. Sonderfälle: die weiß hinterlegten Überschriftenkästen (Zeile 1518), die gelben Eingabefelder (1552), die PDF-Vorschau (weißes Canvas bleibt weiß, Rahmen anpassen), Bilder und Scans unverändert lassen, Hero-Verlauf dunkler abstufen.
5. Kontraste in beiden Schemata prüfen (automatisiert in einem Playwright-Test mit axe).

**Aufwand:** Schritt 1 ist die eigentliche Arbeit, zwei bis drei Tage, zahlt sich aber auch ohne Nachtmodus aus, weil das CSS danach wartbar ist. Schalter und dunkle Werte danach unter einem Tag.

**Dazu passt:** Schriftgröße-Schalter (normal / groß) mit derselben Technik, weil die Zielgruppe ältere Augen hat.

---

## I. Empfohlene Reihenfolge

1. **Sofort, klein:** A1 (Quelltext-Selbsttests entfernen), A7 (Navigation überlaufen), A11 (ErrorBoundary), B3 (Ausloggen, Stubs, `use client`), robots.txt, drei unbeschriftete Datei-Eingaben, Drucken-Button benennen.
2. **Werkzeuge:** D1 (ESLint, Prettier, CI), D3 (Node-Version), ein `npm test`.
3. **Datensicherheit:** A2, A3, A4, A5 (Speicherwahl merken, Sperre, Stammordner, Reihenfolge), B2 (Testumgebung aus dem Produkt).
4. **Struktur:** C1, C2 (Aufteilung der beiden Riesendateien), C4 (Routing), C5 (Dialoge), E1 (Code-Splitting). Dabei tote CSS-Klassen und Tailwind-Frage klären.
5. **Oberfläche:** Farbtokens und Nachtmodus (H), Schriftgrößen und Kontraste (F), Menü-Duplikate und Glossar (G1, G2), Toasts (G4), Startseite entrümpeln (G5).
6. **Dann erst** PWA mit Service Worker, Icons und Offline-Cache, danach APK und Windows wie im Brief geplant. Die Punkte 1 bis 5 sind die Grundlage, sonst werden die Probleme in drei Hüllen dreifach ausgeliefert.
