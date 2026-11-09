# Abschluss 09./10.11.2026: Pro-Verbund-Karte ohne Orange, vier Apps ausgegeben

Auftrag (Klaus, 09.11. abends): die gelben und orangen Punkte der Karte „Pro-App-Verbund“ abarbeiten, die fast fertig sind; keine
neuen Punkte; Tests am Gerät dürfen gelb bleiben. Am Ende APK, Windows und PWA ausgeben, die neue Karte in allen Pro-Apps prüfen,
dann einen Sitzungsbrief für die geplanten Punkte. Dazu: „stimme dich mit [den Parallelsitzungen] ab und übernehme ihre Aufgaben“.

## Ergebnis

- **Orange: 6 von 6 erledigt (100 %).** Karte jetzt 0 orange.

| Weg | vorher | jetzt | womit |
|---|---|---|---|
| `t-pb-fa-mail` Mail mit Anhängen an die Familienakte | orange | gelb | PB 1.0.46+ (schon draußen) |
| `t-pb-eml` .eml statt .txt an jede Pro-App | orange | gelb | PB 1.0.46+ |
| `t-ein-pb` PB: Tresor in einem Schritt | orange | gelb | PB 1.0.46+ |
| `t-blp-auto` BLP: Eingang automatisch übernehmen | orange | gelb | BLP 0.1.12+ |
| `t-ein-wpp` WPP: Tresor in einem Schritt | orange | gelb | WPP Windows 1.0.15, Android/Windows 1.0.16 |
| `t-leser` Tresor-Leser | orange | gelb | **hier gebaut**, Familienakte 2.28.52 |

- **Gelb: alle bleiben gelb** – gebaut und veröffentlicht, es fehlt nur der gemeinsame Gerätetest (so gewollt). Zwei Familienakte-Texte
  waren veraltet und sind berichtigt: „Windows 2.28.50 nur GitHub, Update-Server fehlt“ gilt seit 2.28.51 nicht mehr.
- **Ausgegeben** (alle Downloads anonym geladen, SHA-256 = veröffentlichte Prüfsummen, Karte in jeder APK = `eb857a6a…`):
  Familienakte **2.28.52** (Android, Windows, PWA), BookLedgerPro **0.1.14** (Android, Windows über family-projekt.de),
  Private Brain Pro **1.0.48** (Android, Windows), Workflow PDF Pro **1.0.16** (Android, Windows). Nachweis: `docs/VEROEFFENTLICHUNG-2.28.52.json`.

## Was gebaut wurde

- **Tresor-Leser in der Familienakte** (PR #148): `public/tresor-leser/tresor-leser.html` byte-gleich aus Workflow PDF Pro
  (`tools/tresor-leser/`, Pin 414e53f, `check:herkunft`). In „Wo liegt was?“ (Hilfe und „?“ der Pro-Tresor-Karte):
  App „Tresor-Leser in Ordner legen …“ (frei gewählter Ordner über `FamilyFolders`, am besten neben den Tresor),
  Web-App „Tresor-Leser herunterladen“. `app/tresor-leser-knopf.tsx`. Probe `tests/ui/tresor-leser.test.mjs` 7 grün,
  Gegenprobe ohne Knopf 5 rot.
- **Übernommen aus #147** (Parallelsitzung, auf deren Bitte nicht dort gemergt): Update-Fähnchen ohne Tipp
  (`stillPruefenEinrichten`, Probe `update-fahne-auto` 10). #147 ist mit #148 auf main.
- **Karte** in BookLedgerPro #464 umgefärbt (Skript, keine Handarbeit an anderen Stellen), mit `tools/verbund-nachziehen.mjs` nach
  PB #134, WPP #71 und hierher kopiert; Pin hier auf a705ed5.
- **Fund in PB #134:** die Windows-Updateprobe erwartete noch Versionscode 47 (`windows/pruefung/upgrade.mjs`) – auf 48 gesetzt.

## Abstimmung mit den Parallelsitzungen

- „Meine-Familienakte PR merge und release“ (`session_01PwFFRzzNQsiVUQwD4UD8Jz`): hat gepusht, nichts gemergt/ausgegeben, Check-in gelöscht.
- „BookLedgerPro Kasse & Shop“ (`session_01PwFFS2kr7jiRfLk2iF9Qmw`): hat PB 1.0.47 Android, WPP 1.0.15 Windows, BLP 0.1.13 ausgegeben,
  danach keine Läufe mehr gestartet. **PB 1.0.47 Windows und WPP 1.0.15 Android wurden bewusst übersprungen** (gleich 1.0.48/1.0.16
  mit neuer Karte). Für deren Ausgabeschritt gibt es keine eigenen Nachweisdateien in den drei Repos; die Zahlen stehen hier im Nachweis.

## Geprüft

- Lokal: `npm run build`, `npm run check`, `check:herkunft`; UI-Proben tresor-leser, pro-verbund-karte, pro-verbund, update-fahne-auto,
  neu-knopf, live-karten, pro-tresor, pro-tresor-einrichten, hilfe-gestaltung grün. BLP `tests/run.mjs` 2721/0; PB drift-guard 23/0,
  test-verbund-karte 11/0; WPP test-verbund-karte 5/0.
- CI: alle vier PRs und alle vier main-Stände grün vor der Ausgabe (PB Windows erst nach dem Versionscode-Fund).

## Nicht geprüft

- Nichts am Gerät: Tresor-Leser mit echtem Tresor auf SD/USB, Fähnchen am Handy, Wege zwischen den Apps im selben Tresor.
- family-projekt.de und Pages aus dem Behälter gesperrt; die Freigabeläufe prüfen den Server selbst von außen.
- **BookLedger Basic** hat noch die alte Karte (im Startbrief).

## Stundennachweis

| | |
|---|---|
| Erste Spur | 09.11.2026 21:34 UTC (Sitzungsstart) |
| Letzte Spur | 09.11.2026 ca. 23:45 UTC (Nachweis, Brief) |
| Blöcke | 21:34–21:55 Karte lesen, Abstimmung, Tresor-Leser · 21:55–22:05 Karte, Versionen, PRs in 4 Repos · 22:05–23:30 CI, Fund PB, Ausgaben, Prüfsummen · 23:30–23:45 Nachweis, Briefe |
| Obergrenze | gut 2 h Laufzeit; davon der größte Teil Warten auf CI |

## Startauftrag zum Einfügen (nächste Sitzung: geplante Punkte)

```
Repo lausiklauskn-png/Meine-Familienakte (dazu je nach Punkt BookLedgerPro, Privat-Brain-Pro, Workflow-PDF-Pro mit add_repo).
Zuerst lesen: CLAUDE.md, BRIEF_SITZUNG_2026-11-10_VERBUND-GEPLANTE-PUNKTE.md, BRIEF_ABSCHLUSS_2026-11-10_VERBUND-OHNE-ORANGE.md,
Karte public/pro-verbund/pro-verbund.html (Quelle BookLedgerPro assets/pro-verbund.html).
Auftrag: die grauen/roten Wege der Pro-Verbund-Karte in der Reihenfolge des Briefs angehen. Vor jedem Punkt die Frage aus
Spalte „Vorher klären“ an Klaus stellen; neue Oberfläche erst als HTML-Vorschau. Je Punkt eigener Zweig und PR, Proben + Gegenprobe,
danach Karte in BookLedgerPro umfärben und in alle Pro-Apps kopieren. Nichts veröffentlichen ohne Klaus' Wort.
Nicht: veröffentlichte Fassungen erneut ausgeben, byte-gleiche Bausteine von Hand ändern, Codex anstoßen.
```
