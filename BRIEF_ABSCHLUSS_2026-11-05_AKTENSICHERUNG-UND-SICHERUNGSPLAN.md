# Abschluss 05.11.2026: Geschenkbox, Basic nachgezogen, Sicherungspläne, Aktensicherung in der Hilfe

## Was getan wurde

- **Geschenkbox** (https://claude.ai/artifact/XeUMGuSZ49FzsJYjwQznM7): Pro-Apps mit Android, Windows und Basic in einer Karte,
  Web-Apps und Marktplätze getrennt, je eine Zeile, Zweierraster ab 700 px, echte Download-Knöpfe (neues Fenster statt
  `download`-Attribut, das im Artefakt nicht wirkt). BookLedgerPro Windows 0.1.8 (41 MB, eigener Update-Server) geprüft.
- **Basic-Fassungen geprüft:** Familienakte-PWA, Workflow-PDF 1.1.9 und Private-Brain-Pro-PWA aktuell; **BookLedger-Basic**
  auf Pro `9d65da7` nachgezogen (BookLedger-Basic #40, gemergt).
- **Download-Liste aller Repos als ZIP** zur Sicherung (https://claude.ai/artifact/FUtT4uX7U1MvSoxJtmMybL). Größenangaben dort
  sind GitHubs Repo-Größe mit ganzem Verlauf; die ZIP ist nur der heutige Stand und kleiner (z. B. 84 MB → 11,2 MB).
- **Sicherungsplan Pro-Apps** (https://claude.ai/artifact/5oSCRrVQjAUnxsSGjYcCtq): Orte als Baum (GitHub, Termux, Speicher,
  Apps, Papier, zweiter Ort), rot zu tun · grün erledigt · grau nicht nötig, Notfälle „GitHub fällt aus“ und
  „Signierschlüssel verloren“, Hell ab Werk, Dunkel umschaltbar. Antwort auf Klaus' Frage: Tresor und Sicherungen hängen am
  Tresor-Passwort, nicht am Signierschlüssel; App-interne Daten vor dem Deinstallieren sichern.
- **docs/sicherung/** (#95): beide Pläne als HTML, README.
- **Hilfe → „Akten sichern – Plan zum Abhaken“** (#96, Klaus' Ja): `app/aktensicherung-hilfe.tsx`, Orte als Baum nach den
  echten Funktionen „Vollständige Sicherung erstellen“/„Wiederherstellung testen“, Abhaken je Gerät (Demo getrennt),
  Kästen mit › springen zur Akte, PC/USB-Karte, Pro-Tresor-Karte oder Vollsicherung; verbundener Datentresor grün mit Namen.
  Lange Wörter brechen in allen Ablauf-Kästen um (gemessen 320–1920 px, normale und 150 % Schrift).
- **Kalender:** Vorschau https://claude.ai/artifact/Wb2o7TKPzXXik5oDC4aoyB von Klaus freigegeben; gebaut wird in der nächsten
  Sitzung nach `BRIEF_SITZUNG_2026-11-05_KALENDER.md` (mit Google-, Microsoft-, Android-Gerätekalender inkl. Samsung, .ics,
  Datumsfenster an jedem Datumsfeld, „Was ist neu“).

## Geprüft

`tests/ui/aktensicherung.test.mjs` 20/0 (Desktop + Handy, Neuladen, Sprünge), `hilfe-zu` 7/0, `knoepfe-sicherheit` 33/0,
`pro-tresor` 21/0, `npm run build` (Fachprüfungen, tsc, Vite, PWA). Randmessung aller Kästen in App und Plänen bei 6 Breiten,
zweimal (normal/150 %): 0 Überläufe. GitHub-CI für #96 lief beim Schreiben noch.

## Nicht geprüft / offen

- Nichts am Tablet. „Sicherung zurückholen und als neuen Datentresor verbinden“ nicht am Gerät durchgespielt.
- Ordner im Dateimanager öffnen kann die Familienakte nicht (kein nativer Weg); Links führen nur innerhalb der App.
- Bereits verschenkte Direkt-Download-Links zeigen fest auf ihre Fassung; die Apps holen Neues über die Versionszeile.
  Eine feste „immer neueste“-Adresse auf dem Update-Server ist vorgeschlagen, nicht gebaut.
- Codex-Prüfung der PRs entfiel (Kontingent aufgebraucht). Nichts veröffentlicht.

## Stundennachweis

Spanne aus Nachrichten- und Commit-Zeiten dieser Sitzung (Obergrenze, Pausen nicht abgezogen; Klaus' eigene Angabe geht vor).
Zeiten MEZ (UTC+1).

| Block | von | bis | Dauer | Inhalt |
|---|---|---|---|---|
| 1 | 05.11. 00:19 | 00:51 | 32 min | Private Brain Pro Tresor in einem Schritt, Tresor-Leser (schon in KimHub, 402. Eintrag) |
| 2 | 05.11. 00:59 | 02:01 | 62 min | Hilfe zugeklappt, Demo oben (#94) |
| 3 | 05.11. 11:09 | 13:05 | 1 h 56 min | Geschenkbox, Basic, Sicherungspläne, Aktensicherung, Kalender-Vorschau und -Brief |

Obergrenze der ganzen Sitzung: 3 h 30 min (ohne die Nachtpause 02:01–11:09).

## Startauftrag zum Einfügen

Steht in `BRIEF_SITZUNG_2026-11-05_KALENDER.md` unter „Startauftrag zum Einfügen“.
