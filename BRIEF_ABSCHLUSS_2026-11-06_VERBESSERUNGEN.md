# Abschluss 06.11.2026: Verbesserungen nach Klaus' Gegenprobe – Fassungen 2.28.28 und 2.28.29

Fortsetzung der Kalender-Sitzung vom 05.11. (Abschluss dazu: `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-05_KALENDER.md`).
Auftrag von Klaus: Verbesserungen in der App nach seiner Gegenprobe am Handy, jede Fassung gleich als APK, PWA und Windows.

## Was getan wurde

**2.28.28** (#106; Nachweis `docs/VEROEFFENTLICHUNG-2.28.28.json`)
- **Notiz-Fenster:**
  - Kamera zwischen Mikrofon und Haken, größeres Textfeld.
  - Bis 12 Fotos mit Vorschau. Ein Foto lässt sich auch ohne Text speichern, wie im Tagebuch.
- **App-Glocke:**
  - „Auch in der App läuten“ steht direkt im Erinnern-Teil.
  - Beim Speichern einer Erinnerung geht sie von selbst an.
- **Android:**
  - `FamilienakteGlockePlugin` und `GlockeEmpfaenger` planen die Glocken als Handy-Benachrichtigung, auch bei geschlossener App.
  - Kanal „Erinnerungen (App-Glocke)“. Das Benachrichtigungsrecht wird erst beim Einschalten erfragt.

**2.28.29** (#108; Nachweis `docs/VEROEFFENTLICHUNG-2.28.29.json`)
- **Fristen und Aufgaben einklappbar:**
  - Tipp auf eine Überschrift klappt den Abschnitt zu oder auf; oben „Alle zu“ und „Alle auf“.
  - Der Stand wird gemerkt. Der Kalender-Knopf im Kopf öffnet „Mein Kalender“ wieder (`app/klapp.tsx`).
- **Mülleimer** (`app/loesch-knopf.tsx`):
  - An jeder Erinnerung: Mein Kalender, Fristenliste, Termin-Fenster. Erster Tipp „Löschen?“, zweiter löscht.
  - An jeder Notiz im Tagebuch, samt ihrer Erinnerung.
  - Gelöscht = archiviert und von den Verknüpfungen gelöst; der Kalender-Abgleich entfernt den Eintrag auch aus Google/Gerät.
- **Mikrofon** im Feld „Woran erinnern“.
- **Glocke:**
  - Läuten in der App einmal, 30 s oder bis „OK“; „Probe hören“.
  - Android: Knopf „Ton am Handy einstellen“ öffnet den Benachrichtigungskanal. Ton und Vibration legt Android fest.
- „Als Nächstes“ ohne die Einträge des gewählten Tages.

## Geprüft

- Klaus' Gegenprobe am Samsung-Handy (2.28.28): Notiz mit Foto, Erinnerung aus Sprache, Mein Kalender, Gerätekalender,
  App-Glocke und „erledigt“ funktionieren.
- Proben:

  | Probe | Ergebnis |
  |---|---|
  | Kalender-Kern | 18/0 |
  | notiz | 17/0 |
  | mein-kalender | 14/0 |
  | memory-bearbeiten | 6/0 |
  | kalender | 26/0 |
  | knoepfe-cockpit | 27/0 |
  | hilfe-zu | 7/0 |
  | menue-breite | 31/0 |

- Gegenproben (Schalter fehlt; kein automatisches Einschalten; Löschen ohne Archivieren): alle rot.
- CI je Fassung: 6/6 grün.
- Downloads anonym geladen, SHA-256 gegen SHA256SUMS geprüft; in APK und `latest.json` steht die jeweilige Fassung.

## Nicht geprüft / offen

- **2.28.29 am Gerät:** Einklappen, Löschen und Ton-Einstellung sind ungeprüft.
- **Android-Benachrichtigung:**
  - Geplant mit `setAndAllowWhileIdle`; im Ruhemodus kann sie um Minuten verschoben kommen.
  - Nach einem Geräteneustart plant die App erst beim nächsten Öffnen neu.
- **Später** (Klaus: „arbeiten wir später dran“): Wischen zum Löschen, Gedrückthalten mit Auswahl.
- **CI-Prüfung `pruefung`** liegt bei 19–30 Minuten. #105 brach einmal an der 30-Minuten-Grenze ab. Grenze anheben?
- **KimHub #441** (Forschungseinträge 405–408) ist noch Entwurf. Die Lücken-Anzeige wurde nur aus zwei Depots gebaut; vor dem
  Zusammenführen kurz ansehen oder in einer Sitzung mit allen Repos neu bauen.
- Google-Prüfvideo und Microsoft-Herausgeberprüfung (MPN-ID) offen.

## Nächste Wünsche (Klaus 06.11., 16:35, mit drei Handy-Screenshots von 2.28.29)

Grundsatz: am Handy lieber flach und breit als hoch und schmal; wenig Höhe verschwenden, wenig Text auf Knöpfen.
1. **Glocken-Hinweis oben** (`app/app-glocke.tsx`, `.app-glocke`):
   - Der Text läuft in einer schmalen Spalte sehr hoch, und „Ansehen“ liegt über dem Text (Fehler).
   - Neu: breit und flach. „Ansehen“ wird ein Auge-Symbol ohne Text.
2. **„Alle zu“ und „Alle auf“** (`app/klapp.tsx`): nur die Pfeil-Symbole, ohne Text.
3. **Seitenkopf** (z. B. „Fristen und Aufgaben“):
   - Der Titel rückt neben das Symbol (Logo-Kachel) in dieselbe Zeile.
   - Das „?“ sitzt höher, schräg über dem Titel.
   - Alles enger zusammen. Gilt für `PageTitle` auf allen Seiten.
4. **Erinnerungen und Notizen in Listen** (Mein Kalender, Fristenliste, Tagebuch, Notiz-Liste):
   - Eine flache Zeile: Anfangsworte … Endworte, statt schmaler hoher Spalte; die Zusatzzeile ebenfalls kurz.
   - Ganz ansehen über ein Auge-Symbol.
   - Die Titelspalte in „Mein Kalender“ ist am Handy zu schmal, weil Zeit, Kalender-Symbol, Stift und Mülleimer daneben Platz nehmen.
5. **Zähler-Kästen „Überfällig“, „Bald fällig“, „Offen“** (`.schedule-summary`, Klaus 16:38 mit Screenshot): Sie stehen am
   Handy untereinander, je eine ganze Breite für eine Zahl. Neu: drei quadratische Kästchen nebeneinander, damit weniger
   gescrollt werden muss.
6. Vorher eine HTML-Vorschau zeigen (CLAUDE.md: „Neue Entwürfe erst als HTML-Vorschau zeigen“).

## Stundennachweis

Spanne aus Nachrichten-, Reflog- und Commit-Zeiten. Das ist eine Obergrenze; Pausen sind nicht abgezogen, und Klaus' eigene Angabe geht vor.
Zeiten in MEZ.

| Block | von | bis | Dauer | Inhalt |
|---|---|---|---|---|
| 1 | 05.11. 13:14 | 05.11. 23:50 | 10 h 36 min | Kalender-Sitzung bis 2.28.27 (siehe Abschluss 05.11.) |
| 2 | 05.11. 23:50 | 06.11. 01:05 | 1 h 15 min | Nachweis 2.28.27, #105 nach CI-Wiederholung zusammengeführt |
| 3 | 06.11. 08:40 | 06.11. 10:00 | 1 h 20 min | 2.28.28: Kamera, Glocke automatisch, Android-Benachrichtigung |
| 4 | 06.11. 12:45 | 06.11. 14:20 | 1 h 35 min | 2.28.29: Einklappen, Mülleimer, Mikrofon, Ton und Dauer |
| 5 | 06.11. 16:35 | 06.11. 17:00 | 25 min | Abschluss, KimHub |

Davon am 06.11. (Blöcke 3–5): 3 h 20 min. Ganze Sitzung (Blöcke 1–5): 15 h 11 min.

## Startauftrag zum Einfügen

```
Familienakte – nach 2.28.29 (Brief vom 06.11.2026).
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-06_VERBESSERUNGEN.md, docs/VEROEFFENTLICHUNG-2.28.29.json.
Zuerst Klaus' Anordnungswünsche vom 06.11. (Abschnitt „Nächste Wünsche“ im Abschlussbrief, Screenshots 2.28.29): flach und
breit statt hoch und schmal; Glocken-Hinweis breit, „Ansehen“ als Auge (überdeckt bisher den Text); „Alle zu/auf“ nur Pfeile;
Seitentitel neben das Symbol, „?“ schräg darüber, enger; Erinnerungen und Notizen als eine flache Zeile „Anfang … Ende“ mit
Auge zum Ansehen (Mein Kalender, Fristenliste, Tagebuch, Notiz-Liste); Zähler „Überfällig/Bald fällig/Offen“ als drei
Kästchen nebeneinander. Erst HTML-Vorschau zeigen, nach Klaus' Ja bauen,
dann als 2.28.30 ausgeben. Danach seine Rückmeldung zu 2.28.29 (Einklappen, Mülleimer, Mikrofon, Ton und Dauer).
Wünsche für später (Klaus): Wischen zum Löschen, Gedrückthalten mit Auswahl. Weiter offen: Grenze der CI-Prüfung (30 min)
anheben?, KimHub #441 zusammenführen (vorher Lücken-Anzeige prüfen), Google-Prüfvideo, Microsoft-Herausgeberprüfung.
Neue Funktionen immer gleich als APK, PWA und Windows ausgeben (Klaus 06.11.), nächste freie Fassung 2.28.30.
Nicht: Schlüssel/Tokens in Dateien oder Chat, Forschung im Repo (nur KimHub).
Am Ende Abschlussbrief mit Stundennachweis und KimHub-Eintrag.
```
