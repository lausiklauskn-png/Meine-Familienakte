# Abschluss 06.11.2026: Anordnung flach und breit – Fassung 2.28.30

Auftrag aus dem Abschluss vom 06.11. (`docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-06_VERBESSERUNGEN.md`, Abschnitt
„Nächste Wünsche“): am Handy flach und breit statt hoch und schmal. Erst HTML-Vorschau, nach Klaus' Ja bauen, als 2.28.30 ausgeben.

## Was getan wurde

- **Vorschau** `docs/vorschau/anordnung-2.28.30.html` (https://claude.ai/artifact/XvWrBBb2Ye6kHKapSp8iK9), Klaus' Ja mit Nachträgen:
  - Ein einziger Knopf „alle“ statt „Alle zu“/„Alle auf“; darin stehen die Pfeile dessen, was ein Tipp bewirkt.
  - Das „?“ klein rechts oben an der Schrift, wie ein ©. Symbol, Titel und Knopf auf einer Linie.
  - Dieses Muster für alle Überschriften mit „?“; Knöpfe des Kastens bleiben rechts in der Reihe.
- **Gebaut und ausgegeben als 2.28.30** (#111; Nachweis `docs/VEROEFFENTLICHUNG-2.28.30.json`):
  - Seitenkopf (`PageTitle`, Klasse `kopf-flach`) und `.ui-heading-help`: „?“ 22 px sichtbar, Tippfläche unsichtbar größer.
  - `app/klapp.tsx`: ein Knopf `data-klapp-alle` (Wert „auf“ oder „zu“). Ist etwas zu, klappt er alle auf, sonst alle zu.
    Er steht im Seitenkopf rechts; die Seite findet er über `.page-title`.
  - Glocken-Hinweis breit in einer Zeile, Auge statt „Ansehen“ (überdeckte vorher den Text).
  - `app/flach-zeile.tsx`: `FlachText` („Anfang … Ende“, Endworte höchstens etwa 14 Zeichen) und `AugeKnopf`.
    Genutzt in Mein Kalender, Fristenliste, Tagebuch-Chronologie und Notiz-Liste. Ändern und Löschen liegen hinter dem Auge;
    die Fristenliste behält den Haken „erledigt“ in der Zeile; ein angesprungener Eintrag steht offen.
  - Zähler Überfällig/Bald fällig/Offen: drei Kästchen nebeneinander, am Handy quadratisch, ohne „Anzeigen“.

## Geprüft

- `npm run build` (alle Fachprüfungen, tsc, vite, PWA): grün.
- UI-Proben:

  | Probe | Ergebnis |
  |---|---|
  | mein-kalender | 14/0 |
  | kalender | 26/0 |
  | notiz | 17/0 |
  | memory-bearbeiten | 6/0 |
  | knoepfe-cockpit | 27/0 |
  | menue-breite | 31/0 |
  | hilfe-zu | 7/0 |
  | knoepfe-leer | 25/0 |
  | aktensicherung | 20/0 |
  | datenschutz | 5/0 |
  | zurueck-und-hinweise | 12/0 |

- Proben angepasst, wo Knöpfe jetzt hinter dem Auge liegen. Neu geprüft: der Knopf „alle“ zeigt „auf“, solange etwas zu ist
  („Erledigte“ ist ab Werk zu), danach „zu“; er steht im Seitenkopf.
- Bildschirmfotos in 390 px angesehen. Dabei zwei Fehler gefunden und behoben: lange Titel liefen aus dem Kasten
  (Textspalte ohne `minmax(0,1fr)`), und das „?“ wurde durch eine alte 44-px-Regel oval.
- CI auf #111: 6/6 grün. Downloads anonym geladen, SHA-256 gegen SHA256SUMS geprüft; in der APK steht 2.28.30, in `latest.json` 2.28.30.
  Pages-Läufe auf 46b95d5 grün.

## Nicht geprüft / offen

- Kein Gerät: die neue Anordnung, der Knopf „alle“, das Auge und das kleine „?“ sind am Handy ungeprüft.
- Klaus' Rückmeldung zu 2.28.29 (Einklappen, Mülleimer, Mikrofon, Ton und Dauer) steht noch aus.
- Später (Klaus): Wischen zum Löschen, Gedrückthalten mit Auswahl.
- CI-Prüfung `pruefung` diesmal 22 min (Grenze 30 min). KimHub #441 noch Entwurf. Google-Prüfvideo, Microsoft-Herausgeberprüfung offen.
- Die automatische Codex-Prüfung lief nicht (Nutzungsgrenze); Klaus: Codex muss nicht weiter prüfen.
- Ein erzwungenes Überschreiben des Sitzungszweigs wurde abgelehnt; der alte Zweigstand ist per Zusammenführung aufgenommen.

## Stundennachweis

Spanne aus Reflog-, Commit- und Laufzeiten. Das ist eine Obergrenze; Pausen sind nicht abgezogen, und Klaus' eigene Angabe geht vor.
Zeiten in MEZ.

| Block | von | bis | Dauer | Inhalt |
|---|---|---|---|---|
| 1 | 16:42 | 17:15 | 33 min | Lesen, Vorschau, Entwurfs-PR |
| 2 | 17:15 | 19:31 | 2 h 16 min | Klaus' Nachträge, Bau, Proben, Bildschirmfotos, Korrekturen |
| 3 | 19:31 | 19:56 | 25 min | CI, Zusammenführen |
| 4 | 19:56 | 20:25 | 29 min | Ausgabe 2.28.30, Downloads prüfen, Nachweis, Abschluss, KimHub |

Zusammen: 3 h 43 min.

## Startauftrag zum Einfügen

```
Familienakte – nach 2.28.30 (Brief vom 06.11.2026, Anordnung).
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-06_ANORDNUNG.md, docs/VEROEFFENTLICHUNG-2.28.30.json.
Zuerst Klaus' Rückmeldung am Handy zu 2.28.30 (Seitenkopf in einer Linie, Knopf „alle“, Auge in den Listen, kleines „?“,
Zähler-Kästchen) und zu 2.28.29 (Einklappen, Mülleimer, Mikrofon, Ton und Dauer) aufnehmen und umsetzen; Entwürfe erst als
HTML-Vorschau zeigen. Wünsche für später: Wischen zum Löschen, Gedrückthalten mit Auswahl.
Weiter offen: CI-Grenze `pruefung` (30 min) anheben?, KimHub #441 zusammenführen (vorher Lücken-Anzeige prüfen),
Google-Prüfvideo, Microsoft-Herausgeberprüfung.
Neue Funktionen immer gleich als APK, PWA und Windows ausgeben (Klaus 06.11.), nächste freie Fassung 2.28.31.
Nicht: Schlüssel/Tokens in Dateien oder Chat, Forschung im Repo (nur KimHub).
Am Ende Abschlussbrief mit Stundennachweis und KimHub-Eintrag.
```
