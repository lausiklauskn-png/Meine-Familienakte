# Abschluss 10.11.2026 (Vormittag): Gerätetest 2.28.52 → Fassung 2.28.53, Geschenkbox

Fortsetzung derselben Sitzung wie `BRIEF_ABSCHLUSS_2026-11-10_VERBUND-OHNE-ORANGE.md` (Nacht 09./10.11.). Klaus hat 2.28.52 am
Tablet geprüft und Bilder geschickt; daraus wurde 2.28.53.

## Klaus' Befunde und was daraus wurde

| Befund (Klaus 10.11.) | Ursache | Behoben in 2.28.53 |
|---|---|---|
| Karte „Zuordnung prüfen“ bleibt rot/„unklar“ mit Dateinummer, auch nach eigener Wahl | Farbe und Titel hingen nur am Vorschlag der Erkennung, nie an der eigenen Wahl | Farbe folgt der Wahl (`confidence-angepasst`), Titel = eingegebener Titel, Marke „bestätigt / von dir angepasst / bitte prüfen“ |
| „Vorgang wählen hat keinen Inhalt“ | ohne angelegte Vorgänge stand eine leere Auswahl da | Hinweis „Noch kein Vorgang angelegt …“ statt leerer Liste |
| „Ein Haken, damit ich gleich bestätigen kann“ | – | Haken **„Zuordnung stimmt“** übernimmt alle vier Vorschläge auf einmal |
| „Ein sichtbarer Papierkorb wie in jedem E-Mail-Programm“ | Löschen war endgültig | **Papierkorb** bei Fristen/Aufgaben und im Tagebuch: Zurückholen, einzeln endgültig, leeren; höchstens 200; Medien erst beim endgültigen Löschen weg |
| Glocke: „Probe hören“ spielt nicht den in Android gewählten Ton | die Probe spielte einen eigenen Webton | in der APK schickt „Probe hören“ eine echte Meldung über den Kanal mit dem gewählten Ton (`FamilienakteGlockePlugin.probe`); ohne Plugin wie bisher |

Dazu die **Geschenkbox** (Klaus: „Vorversion“): `docs/geschenk/geschenkbox-pro.html` mit allen aktuellen Pro-Apps, den Web-Apps und
einem Abschnitt „Landkarten“ (Pro-Verbund-Karte über Pages, Hinweis auf die Landkarte in der Familienakte, Farberklärung).
Artefakt https://claude.ai/artifact/XeUMGuSZ49FzsJYjwQznM7, nach der Ausgabe auf 2.28.53 gezogen.

## Ausgabe

Familienakte **2.28.53** Android, Windows, PWA (Läufe 42792885539 / 42792889787, `server=ja`), Nachweis `docs/VEROEFFENTLICHUNG-2.28.53.json`.

## Geprüft

- UI-Proben: `zuordnung-pruefen` 7 grün (Gegenprobe alter Code 5 rot), `mein-kalender` 17 grün (Gegenprobe 3/3 rot), dazu
  tresor-leser, update-fahne-auto, briefkopf-titel, knoepfe-cockpit. CI #150 alle sechs Prüfungen grün.
- **CI-Fund (eigener Fehler):** der erste Push war rot – `briefkopf-titel` (zweites `<strong>` im Kartenkopf durch den Haken) und
  `knoepfe-cockpit` (Löschfrage ohne Wort „löschen“). Lokal liefen nur die Proben zu den geänderten Stellen. Lehre: vor dem Push
  die Proben nach geänderten Selektoren und Texten durchsuchen (`grep -rn` in `tests/ui`) oder die ganze UI-Reihe fahren.
- Nebenbei: `windows/src-tauri/Cargo.lock` stand auf main noch auf 2.28.51 – jetzt 2.28.53.

## Nicht geprüft

- Nichts davon am Gerät: Papierkorb, Probe mit gewähltem Ton (Android-Kanal), Haken und Kartenfarbe am Tablet.
- Probe `kalender-einlesen` ist einmal an einem Wettlauf rot geworden (#149, `sync:"tok1"`), beim zweiten Lauf grün – nicht behoben.

## Stundennachweis

| | |
|---|---|
| Erste Spur | 10.11.2026 07:42 UTC (Klaus' Bilder vom Gerätetest) |
| Letzte Spur | 10.11.2026 ca. 10:30 UTC (Ausgabe, Nachweis, Briefe, KimHub) |
| Blöcke | 07:42–08:15 Befunde, Bau, Proben, Gegenproben · 08:15–08:25 Geschenkbox · 08:25–09:40 CI, Fund, Wiederholung · 09:40–10:30 Ausgabe, Prüfsummen, Briefe |
| Obergrenze | knapp 3 h; die Nacht davor (21:34–ca. 01:00 UTC) steht im anderen Abschlussbrief |

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte (dazu je nach Punkt BookLedgerPro, Privat-Brain-Pro, Workflow-PDF-Pro, BookLedger-Basic mit add_repo).
Zuerst lesen: CLAUDE.md, BRIEF_SITZUNG_2026-11-10_VERBUND-GEPLANTE-PUNKTE.md (Punkte + Abschnitt „Offen aus 2.28.53“),
BRIEF_ABSCHLUSS_2026-11-10_GERAETETEST-2.28.53.md, Karte public/pro-verbund/pro-verbund.html (Quelle BookLedgerPro assets/pro-verbund.html).
Zuerst klein: BookLedger Basic auf die neue Karte ziehen; Wettlauf in tests/ui kalender-einlesen beheben.
Dann die grauen/roten Wege der Karte in der Reihenfolge des Briefs; vor jedem Punkt die Frage aus „Vorher klären“ an Klaus,
neue Oberfläche erst als HTML-Vorschau. Je Punkt eigener Zweig und PR, Proben + Gegenprobe, vor dem Push die ganze UI-Reihe
oder grep nach geänderten Selektoren. Nächste freie Fassungen: FA 2.28.54, BLP 0.1.15, PB 1.0.49, WPP 1.0.17.
Nicht: veröffentlichte Fassungen erneut ausgeben, byte-gleiche Bausteine von Hand ändern, Codex anstoßen, Forschung hier ablegen.
```
