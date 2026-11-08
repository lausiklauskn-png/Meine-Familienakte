# Abschluss 08.11.2026: Sitzung 5 (Gerätetest-Rückmeldung) – Fassung 2.28.38

Startauftrag aus `BRIEF_ABSCHLUSS_2026-11-07_HILFE-BAUM.md` (jetzt `docs/briefe-archiv/`). Klaus wählte als Erstes Punkt 1
(Gerätetest 2.28.36/2.28.37) und lieferte Tablet-Bilder. Alles Sichtbare lief zuerst über die Vorschau
`docs/vorschau/geraetetest-2.28.38.html` (https://claude.ai/artifact/GSXMJD8gCfX7osE5PzuEzH), Fragen A–K, von Klaus Schritt für
Schritt entschieden. Freigabe der Ausgabe: „F ja“, dann „ausgeben, sobald alles grün ist“.

## Was getan wurde (PR #127, main 38f0087)

- **Listenzeilen** in Fristen und Aufgaben, Mein Kalender, Tagebuch (Chronologie) und Notiz-Liste: Datum und Uhrzeit links,
  „erste Worte … Hauptwort“ (häufigstes großgeschriebenes Wort, mindestens zweimal, ohne Füllwörter; sonst Endworte wie bisher),
  darunter Art und Glocke. ✓ ✎ 🗑 👁 in einer Aufklappleiste am rechten Rand (`KnopfLeiste`, `app/flach-zeile.tsx`): Pfeil ‹ öffnet,
  › schließt, Wischen geht auch, Tipp daneben schließt, immer nur eine offen. Ist die Zeile mindestens 600 px breit
  (Containerabfrage), stehen die Knöpfe direkt darin. Klaus: am Handy Leiste, groß egal.
- **Stift** öffnet sofort „Ändern“, auch für reine Erinnerungen (neu: Titel, Tag, Uhrzeit über `updateLocalScheduleTermin`).
  In der Notiz-Liste öffnet er „Eintrag bearbeiten“ mit frisch gelesenem Stand. **Mülleimer** löscht nach zwei Tipps. **Auge** bleibt
  für ganzen Text und Extras (Quelle, Zurückstellen, „Im Kalender“).
- **Hilfe oben ein Kasten**: blauer Knopf „Demo starten“ (das Wort „Demo“ als Überschrift entfällt), Landkarten-Symbol, „?“ oben
  rechts erklärt die Demo. Das Symbol klappt die „Interaktive Landkarte der App“ im Kasten auf, mit eigenem „?“, ohne den Satz
  „Woher etwas kommt …“. **Listenansicht der Landkarte ganz entfernt** (Klaus: sagt ohne Wege wenig), auch am Handy Karte.
- **Kopf / geteilter Bildschirm**: zwischen 621 und 900 px lag „Neu“ über dem Namen (gemessen bei 640 px). Drucken, Installieren
  und Abmelden stehen bis 900 px hinter dem Pfeil ‹ in einer Leiste (› schließt, Tipp daneben, Esc); breiter wie bisher. Der Name
  wird bei Enge kleiner (`useEinzeilig`), ab 360 px (Galaxy S21) ganz.
- **Android**: im geteilten Bildschirm hält die Hülle Abstand zu den sichtbaren Systemleisten (`freiVonLeisten`,
  `onMultiWindowModeChanged`); im Vollbild 0.
- **„Installieren“** verschwindet auch im Browser-Tab, wenn die Web-App installiert ist (`app/installiert.ts`,
  `getInstalledRelatedApps`, Manifest `related_applications`). Die APK kann eine Webseite nicht erkennen.
- **CI**: Gradle-Wrapper wartet 120 s statt 10 s auf den Download.
- Hilfe-Thema „Listen mit Leiste“ (statt „Listen mit Auge“), Suchwörter ergänzt. Versionshistorie 2.28.38.

## Entschieden ohne Änderung

- A: Verschwinden beim Scrollen unter dem Kopf ist normal.
- Drehen am Galaxy Tab S6: die App ist richtig eingestellt (Galaxy S21 dreht). Auf den Bildern lief Samsung DeX, dort dreht Android
  nie. Weg für Klaus: Schnellleiste → DeX aus → „Automatisch drehen“. Rückmeldung offen.
- Vollbild und volle Breite: laut Klaus in Ordnung. Wischen der Landkarte: in Ordnung.

## Geprüft

- Lint 0 Fehler, `npm run build`, `npm run check` grün.
- Voller UI-Lauf im Behälter: 70/71 grün; rot nur `pro-dokumente` (im Behälter auch auf unverändertem main rot, in der CI grün).
- Neu: `zeilen-leiste` 10/0, `kopf-leiste` 22/0 (360, 390, 640, 1280 px), `installiert` 5/0. Angepasst: `notiz` 17/0,
  `mein-kalender` 14/0, `app-landkarte` 48/0, `hilfe-zu` 7/0.
- Breiten 520/640/800 px: kein waagerechter Überlauf; Bildschirmfotos von Zeile, Leiste, Hilfe-Kasten und Kopf angesehen.
- CI #127 (b357f60): pruefung, webview, android, windows, product (31, pixel_c), product (35, pixel_2) grün – nach mehreren
  Neustarts: GitHub lieferte von etwa 08:40 bis 11:00 UTC Release-Dateien (Gradle-Wrapper, NSIS) mit HTTP 504 aus.

## Ausgabe 2.28.38

- APK `android-v2.28.38` (Lauf 42476552670, `server=ja`, Upload und Prüfung von außen im Lauf grün): anonym geladen,
  SHA-256 = SHA256SUMS (`953abb93…ea5e`, 19 918 881 Bytes), innen 2.28.38 / 38f0087.
- Windows `windows-v2.28.38` (Lauf 42476554508, `server=ja`): erster Versuch am NSIS-Download (504) gescheitert, zweiter grün;
  Setup anonym geladen, SHA-256 = SHA256SUMS (`ad9a509c…bf2a`, 34 076 148 Bytes), `latest.json` nennt 2.28.38.
- PWA: Pages Lauf 149 (42476536556) grün.
- Nachweis `docs/VEROEFFENTLICHUNG-2.28.38.json`.

## Nicht geprüft / offen

- Kein Gerät: Aufklappleiste (Listen, Kopf), Stift an Erinnerungen, Hilfe-Kasten, geteilter Bildschirm am Tab S6 (Systemleisten),
  „Installieren“ bei installierter Web-App, Drehen am Tab S6 ohne DeX.
- Android-Abstand zu den Systemleisten nur gebaut und im Emulator-Lauf mitgefahren, nicht im geteilten Bildschirm gesehen.
- Übrige Punkte aus dem Startauftrag unverändert offen: alte UI-Proben auf `soll()` umstellen, E-Mail (Entscheidungen Klaus/Jens),
  Punkt 10 (Fragen u–z).

## Stundennachweis

Spanne aus Reflog (Sitzungsbeginn 22:34 UTC am 07.11.), Commit-, Lauf- und Nachrichtenzeiten; Obergrenze, Pausen nicht abgezogen,
Klaus' eigene Angabe geht vor. Zeiten in MEZ. Die Nacht zwischen Block 1 und 2 zählt nicht.

| Block | von | bis | Dauer | Inhalt |
|---|---|---|---|---|
| 1 | 07.11. 23:34 | 23:40 | 6 min | Lesen, Releases prüfen, Frage „was zuerst“ |
| 2 | 08.11. 08:55 | 10:15 | 80 min | Gerätetest-Bilder, Vorschau A–F, Zeile mit Leiste, Bausteine |
| 3 | 10:15 | 10:30 | 15 min | Hilfe-Kasten, Kopf, Installieren, Proben, UI-Gesamtlauf gestartet |
| 4 | 10:30 | 11:00 | 30 min | CI-Ausfälle (GitHub 504), Gradle-Wartezeit, Fassung 2.28.38 |
| 5 | 11:00 | 12:37 | 97 min | Warten auf GitHub (504), Neustarts, Zusammenführen #127 |
| 6 | 12:37 | 13:10 | 33 min | Ausgabe APK/Windows/PWA, Downloads prüfen, Nachweis, Abschlussbrief, KimHub |

Zusammen: 6 min am 07.11. und 08:55 bis 13:10 am 08.11. = **4 h 21 min**, davon rund 2 h Warten auf GitHub.

## Startauftrag zum Einfügen

```
Familienakte – Sitzung 6, Brief vom 08.11.2026.
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-08_GERAETETEST.md, docs/PLAN_2026-11-07.md (Punkt 10, „Weiter zu besprechen“).
Stand: 2.28.38 auf main und ausgegeben (APK, PWA, Windows; Nachweis docs/VEROEFFENTLICHUNG-2.28.38.json).
Erst die tatsächlichen Releases prüfen. Nächste freie Fassung 2.28.39.

Vorlagen (wiederverwenden, nichts doppelt bauen):
- Listenzeile: app/flach-zeile.tsx (FlachText mit Hauptwort, KnopfLeiste ‹/›, StiftKnopf), Kopf-Leiste in app/health-portal.tsx.
- Hilfe-Bausteine: app/hilfe-bilder.tsx, app/ablaufbild.tsx, app/landkarte.tsx (nur Karte), app/app-landkarte-hilfe.tsx (Kasten mit Demo).
- Stand der Landkarte: lib/app-stand.ts – bei jeder Fassung eintragen, was sich am Stand eines Kastens ändert.

Auftrag (erst Klaus fragen, was zuerst; sichtbare Änderungen erst als HTML-Vorschau):
1. Gerätetest-Rückmeldung zu 2.28.38 einarbeiten (Leiste in Listen und Kopf, Stift an Erinnerungen, Hilfe-Kasten, geteilter
   Bildschirm am Tab S6, Drehen ohne DeX).
2. Ältere UI-Proben von `cond ? true : text` auf soll() umstellen (step() wertet Text als grün) – eigener PR, Funde benennen.
3. E-Mail bauen, sobald Klaus' und Jens' Entscheidungen aus der E-Mail-Karte vorliegen: zuerst Anhang-Prüfung mit dateiPruefen,
   echtes PDF ohne Befund mit einem Tipp, Mail-App öffnen; danach Microsoft (Mail.Read/Mail.Send). Gmail-Abholen auslassen.
4. Punkt 10 (Abgleich zwischen Geräten) erst nach Klaus' Antworten auf u–z in docs/vorschau/daten-2.28.34.html.

Regeln: Je Paket ein Commit; Lint vor dem Push; keine Prüfungen abschalten. Codex-Durchsicht am PR auslassen.
Bei HTTP 504 von github.com in der CI (Gradle/NSIS): GitHub-Störung, Jobs neu starten, nicht am Code suchen.
Nicht: Schlüssel/Tokens in Dateien oder Chat, Forschung im Repo (nur KimHub).
Am Ende Abschlussbrief mit Stundennachweis und Startauftrag, KimHub-Eintrag.
```
