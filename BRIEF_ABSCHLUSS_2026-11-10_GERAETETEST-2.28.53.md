# Abschluss 10.11.2026: Gerätetest 2.28.52 → Fassungen 2.28.53, 2.28.54 und 2.28.55, Geschenkbox

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

## Danach: Landkarte (Klaus' Bilder, 10.11. ca. 10:47 Ortszeit) → 2.28.54

| Befund | Ursache | Behoben |
|---|---|---|
| „Die Fäden in der Landkarte passen nicht … falsch zugeordnet“ | Chip-Lage relativ zu `.lk-chips` (offsetParent) gemessen statt zur Gruppe: die Kopfhöhe der Gruppe fehlte (am Tablet mit großer Schrift 50–90 px); dazu nur Neurechnen bei Breitenänderung des ersten Kastens | Lage bis zur Gruppe aufsummiert, Neurechnen bei jeder Größenänderung (`app/landkarte.tsx`) |
| Farbfelder „sollten als Button ausgeformt sein … sichtbar, welche rot, welche grün, welche Pfade gelb“ | – | Legende als Knöpfe: Tipp hebt alle Kästen und Wege dieser Art hervor, darunter die Liste, zweiter Tipp hebt auf |
| Landkarten aus der Geschenkbox „in einem separaten HTML-Fenster, nicht in der App“ | die Pages-Adresse liegt im Bereich der installierten Familienakte-Web-App | Verbund-Karte als eigene Datei im Artefakt |

Probe `app-landkarte` 52 grün (neu: Fäden beginnen/enden an ihrem Kasten nach Höhenänderung, Gegenprobe alter Code 2 rot; Legende).
Eigener Fehler beim Bau: die neue Probe maß zuerst gegen das falsche SVG (Symbol im Kopf); erst eine Messung von Hand zeigte es.

## Danach: Seite „Sicherheit & lokaler Tresor“ (Klaus' Bilder 2.28.54, ca. 12:00 UTC) → 2.28.55

| Befund | Ursache | Behoben |
|---|---|---|
| Tresor angelegt, oben trotzdem „Fehlgeschlagen: Ordnerzugriff fehlgeschlagen“ | stammt von einer Vollsicherung: rohe Android-Meldung, Schreiben/Lesen im nativen Ordner lief nicht durch die Übersetzung | übersetzt, „Vollsicherung nicht erstellt: …“ mit Grund und nächstem Schritt |
| gelb „Prüfung erforderlich: Sicherung läuft …“ blieb stehen | jede info-Meldung hieß „Prüfung erforderlich“ und blieb | „Hinweis“; Zwischenstände weichen der nächsten Meldung |
| rot „Ordnerwahl oder Passwort abgebrochen“ unter „Entsperrt“ | Abbruch als Alarm | ruhiger Hinweis |
| Tresorkennung dreimal im Blick, viel Text | lange Bestätigungen | Karte kürzer, Kennung hinter „Mehr“ (Vorschau, Klaus: Ja) |
| „Wird die Hilfe nach dem Anlegen von selbst grün?“ | ungeprüft | ja – neue Probe zeigt es ohne Neuladen |
| „Nur das Laufwerk wählen, Ordner automatisch“ | Android ab 11 lässt die oberste Ebene von Gerätespeicher/SD nicht wählen | Vorschlag im Startbrief `BRIEF_SITZUNG_2026-11-11_FAMILIENAKTE-WEITER.md`, nicht gebaut |

Die Hilfe-Tresorkarte brauchte keine Änderung: sie zeigt keine Kennung und färbt sich über den Live-Zustand von selbst.

## Ausgabe

Familienakte **2.28.53** Android, Windows, PWA (Läufe 42792885539 / 42792889787, `server=ja`), Nachweis `docs/VEROEFFENTLICHUNG-2.28.53.json`.
Familienakte **2.28.54** Android, Windows, PWA (`server=ja`), Nachweis `docs/VEROEFFENTLICHUNG-2.28.54.json`.
Familienakte **2.28.55** Android, Windows, PWA (`server=ja`), Nachweis `docs/VEROEFFENTLICHUNG-2.28.55.json`.

## Geprüft

- UI-Proben: `zuordnung-pruefen` 7 grün (Gegenprobe alter Code 5 rot), `mein-kalender` 17 grün (Gegenprobe 3/3 rot), dazu
  tresor-leser, update-fahne-auto, briefkopf-titel, knoepfe-cockpit. CI #150 alle sechs Prüfungen grün.
- **CI-Fund (eigener Fehler):** der erste Push war rot – `briefkopf-titel` (zweites `<strong>` im Kartenkopf durch den Haken) und
  `knoepfe-cockpit` (Löschfrage ohne Wort „löschen“). Lokal liefen nur die Proben zu den geänderten Stellen. Lehre: vor dem Push
  die Proben nach geänderten Selektoren und Texten durchsuchen (`grep -rn` in `tests/ui`) oder die ganze UI-Reihe fahren.
- Nebenbei: `windows/src-tauri/Cargo.lock` stand auf main noch auf 2.28.51 – jetzt 2.28.53.

## Nicht geprüft

- Nichts davon am Gerät: Papierkorb, Probe mit gewähltem Ton (Android-Kanal), Haken und Kartenfarbe, Fäden und Legenden-Knöpfe der
  Landkarte, Öffnen der Verbund-Karte aus der Geschenkbox am Tablet.
- Probe `kalender-einlesen` ist einmal an einem Wettlauf rot geworden (#149, `sync:"tok1"`), beim zweiten Lauf grün – nicht behoben.

## Stundennachweis

| | |
|---|---|
| Erste Spur | 10.11.2026 07:42 UTC (Klaus' Bilder vom Gerätetest) |
| Letzte Spur | 10.11.2026 ca. 14:15 UTC (Ausgabe 2.28.55, Geschenkbox-Datei, Briefe, KimHub) |
| Blöcke | 07:42–08:15 Befunde, Bau, Proben, Gegenproben · 08:15–08:25 Geschenkbox · 08:25–09:40 CI, Fund, Wiederholung · 09:40–09:58 Ausgabe 2.28.53, Briefe · 09:48–10:05 Landkarte bauen, Proben · 10:05–10:47 CI #151, Geschenkbox · 10:47–11:15 Ausgabe 2.28.54, Briefe, KimHub · 11:45–12:30 Befunde Sicherheitsseite, Vorschau, Bau 2.28.55 · 12:30–13:42 Proben, CI #153, Geschenkbox-Datei · 13:42–14:15 Ausgabe 2.28.55, Briefe, KimHub |
| Obergrenze | gut 6½ h mit Pausen ohne Nachrichten (ca. 11:15–11:45); die Nacht davor (21:34–ca. 01:00 UTC) steht im anderen Abschlussbrief |

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte (dazu je nach Punkt BookLedgerPro, Privat-Brain-Pro, Workflow-PDF-Pro, BookLedger-Basic mit add_repo).
Zuerst lesen: CLAUDE.md, BRIEF_SITZUNG_2026-11-11_FAMILIENAKTE-WEITER.md, BRIEF_SITZUNG_2026-11-10_VERBUND-GEPLANTE-PUNKTE.md,
BRIEF_ABSCHLUSS_2026-11-10_GERAETETEST-2.28.53.md, Karte public/pro-verbund/pro-verbund.html (Quelle BookLedgerPro assets/pro-verbund.html).
Zuerst klein: BookLedger Basic auf die neue Karte ziehen; Wettlauf in tests/ui kalender-einlesen beheben.
Dann die grauen/roten Wege der Karte in der Reihenfolge des Briefs; vor jedem Punkt die Frage aus „Vorher klären“ an Klaus,
neue Oberfläche erst als HTML-Vorschau. Je Punkt eigener Zweig und PR, Proben + Gegenprobe, vor dem Push die ganze UI-Reihe
oder grep nach geänderten Selektoren. Nächste freie Fassungen: FA 2.28.56, BLP 0.1.15, PB 1.0.49, WPP 1.0.17.
Nicht: veröffentlichte Fassungen erneut ausgeben, byte-gleiche Bausteine von Hand ändern, Codex anstoßen, Forschung hier ablegen.
```
