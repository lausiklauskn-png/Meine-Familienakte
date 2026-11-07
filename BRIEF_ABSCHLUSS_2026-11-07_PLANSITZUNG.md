# Abschluss 07.11.2026: Übergabe an eine Plansitzung

Kurze Sitzung. Der eingefügte Startauftrag („nach 2.28.29“) war schon erledigt: 2.28.30, 2.28.31 und 2.28.32 liegen auf
`main` und sind als APK, PWA und Windows ausgegeben (Nachweise `docs/VEROEFFENTLICHUNG-2.28.30.json` … `-2.28.32.json`).
Nichts gebaut, nichts veröffentlicht.

## Was getan wurde

- Stand geprüft (origin/main 07a4077, `package.json` 2.28.32) und Klaus gemeldet, dass der Auftrag schon umgesetzt ist.
- Auf Klaus' Wunsch dieser Brief mit Startauftrag für eine **Plansitzung**.
- `BRIEF_ABSCHLUSS_2026-11-06_ANORDNUNG.md` nach `docs/briefe-archiv/` verschoben, CLAUDE.md auf diesen Brief gestellt.

## Auftrag für die Plansitzung

Klaus schreibt zu Beginn eine nummerierte Liste (erster Punkt, zweiter Punkt …) mit zwei Teilen:

1. **Was verbessert werden muss.**
2. **Was noch besprochen werden muss.**

Die Plansitzung baut nichts und gibt nichts aus. Sie:

- liest CLAUDE.md, diesen Brief, `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-06_ANORDNUNG.md` und `docs/VEROEFFENTLICHUNG-2.28.32.json`;
- wartet auf Klaus' Liste und behält seine Nummern bei;
- sucht je Punkt die betroffenen Stellen im Code und schreibt kurz: was heute geschieht, was sich ändern soll, welche Dateien,
  Aufwand (klein/mittel/groß), Gefahren und was am Gerät zu prüfen ist;
- stellt zu den Besprechungspunkten knappe Fragen mit Vorschlag, eine nach der anderen oder als kurze Liste;
- ordnet zum Schluss alles in Pakete (je Paket ein PR, je sichtbare Änderung erst HTML-Vorschau) mit Reihenfolge und Fassung
  (nächste freie 2.28.33);
- legt den Plan als `docs/PLAN_2026-11-<Tag>.md` ab und lässt ihn von Klaus bestätigen, bevor eine Bausitzung beginnt.

Was schon bekannt ist und in die Liste gehören kann:

- Rückmeldung am Handy zu 2.28.30–2.28.32 (Seitenkopf in einer Linie, Knopf „alle“, Auge in den Listen, kleines „?“,
  Zähler-Kästchen, Titel einzeilig, Mikrofon nur auf Tipp) und zu 2.28.29 (Einklappen, Mülleimer, Mikrofon, Ton und Dauer).
- Wünsche für später: Wischen zum Löschen, Gedrückthalten mit Auswahl.
- Zu besprechen: CI-Grenze `pruefung` 30 → 45 min?, KimHub #441 zusammenführen (vorher Lücken-Anzeige prüfen),
  Google-Prüfvideo, Microsoft-Herausgeberprüfung, Gerätefälle am Tablet, Vollsicherung auf Android (20 MB je Datei),
  Ein-Schritt-Tresor in Private Brain Pro, Tresor-Leser.

## Nicht geprüft / offen

Unverändert gegenüber dem Brief vom 06.11.: Die Anordnung 2.28.30–2.28.32 ist am Gerät ungeprüft, ebenso 2.28.29
(Einklappen, Löschen, Ton). Übrige offene Punkte siehe CLAUDE.md, Abschnitt „Offen“.

## Stundennachweis

Spanne aus Reflog- und Commit-Zeiten, Obergrenze; Klaus' eigene Angabe geht vor. Zeiten in MEZ.

| Block | von | bis | Dauer | Inhalt |
|---|---|---|---|---|
| 1 | 08:56 | 09:10 | 14 min | Stand prüfen, Rückmeldung, Brief für die Plansitzung |

Zusammen: 14 min.

## Startauftrag zum Einfügen

```
Familienakte – Plansitzung (Brief vom 07.11.2026).
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-07_PLANSITZUNG.md, docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-06_ANORDNUNG.md.
Stand: 2.28.32 auf main und ausgegeben (APK, PWA, Windows); nächste freie Fassung 2.28.33.
Dies ist eine Plansitzung: nichts bauen, nichts ausgeben. Ich schicke zuerst eine nummerierte Liste
(1., 2., …) mit „Was verbessert werden muss“ und „Was noch besprochen werden muss“. Warte auf die Liste.
Dann je Punkt (meine Nummern behalten): betroffene Stellen im Code, was heute geschieht, was sich ändern soll,
Dateien, Aufwand klein/mittel/groß, Gefahren, Geräteprobe. Zu Besprechungspunkten knappe Fragen mit Vorschlag.
Zum Schluss Pakete bilden (je Paket ein PR, sichtbare Änderungen erst als HTML-Vorschau), Reihenfolge und Fassungen,
als docs/PLAN_2026-11-<Tag>.md ablegen und von mir bestätigen lassen.
Bekannt offen: Rückmeldung zu 2.28.29–2.28.32, Wischen zum Löschen, Gedrückthalten mit Auswahl, CI-Grenze 30→45 min,
KimHub #441, Google-Prüfvideo, Microsoft-Herausgeberprüfung, Tablet-Gerätefälle.
Nicht: Schlüssel/Tokens in Dateien oder Chat, Forschung im Repo (nur KimHub).
Am Ende Abschlussbrief mit Stundennachweis und KimHub-Eintrag.
```
