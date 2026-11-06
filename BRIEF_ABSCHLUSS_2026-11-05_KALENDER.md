# Abschluss 05.11.2026: Kalender-Erinnerung, Notiz, Mein Kalender, App-Glocke – Fassungen 2.28.26 und 2.28.27

## Was getan wurde

**Gebaut nach `docs/briefe-archiv/BRIEF_SITZUNG_2026-11-05_KALENDER.md`, je Stück ein PR**
- #97 Datumsfenster: jedes Datumsfeld öffnet beim Antippen die Auswahl.
- #98 Kalender-Kern: Eintrag mit Erinnerung, ICS, Abgleich und Zuordnung am Datensatz.
- #99–#102 Knopf „Neu“ mit „Was ist neu“, die Anbieter und die Bedienung:
  - Android-Gerätekalender, Google (veröffentlicht), Microsoft (Entra-App), .ics
  - Kalender-Karte einklappbar, Auswahl als ein schmales Feld
  - Ampel rot/grün
  - eigener Kalender je Erinnerung
  - Erinnerung zur Uhrzeit oder Minuten vorher
- Hilfe zum Kalender.

**Notiz-Knopf im Kopf (Symbol wie die übrigen)**
- Das Mikrofon startet von selbst.
- Tag und Uhrzeit werden aus dem Text erkannt: „heute um 20 Uhr“, „morgen“, „übermorgen“, „in 5 Stunden“, Wochentag, Datum.
- ✓ speichert. Die Liste darunter hat je Eintrag einen Mülleimer; × leert Text und Erinnerung.

**Memory bearbeiten**
- Eigenes Fenster: Text und Titel mit Mikrofon, Lebensbereich, Aufnahmezeit, Einordnung.
- Erinnerung änderbar oder nachträglich anlegen.
- Kasten „🔔 Erinnerung aktiv“ und eine Glocke in der Chronologie.

**Eigene Erinnerungszeit (Tag und Uhrzeit frei)**
- „Erinnerungsuhrzeit“ im Fristformular.

**Hinweis „Kalender: neu anmelden“**
- Im Browser gilt die Anmeldung nur etwa 1 Stunde.

**Nachtauftrag (kein Hin und Her, eigener Kalender, eigene Glocke)**
- **Mein Kalender:** Kalender-Knopf im Kopf. Monat mit Zähler je Tag, Tagesliste mit Uhrzeit und Erinnerung, „Als Nächstes“.
  „+ Eintrag“ am Tag nimmt Titel (einsprechbar), Uhrzeit und Erinnerung. Der Stift öffnet „Termin und Erinnerung“ zum Ändern.
- **App-Glocke**, ab Werk aus, damit es mit dem Gerätekalender nicht doppelt klingelt:
  - läutet zu denselben Zeiten wie der Kalender, solange die App offen ist
  - Ton, Vibration, Hinweis oben; mit Erlaubnis zusätzlich eine Systemmeldung
- **Kein Springen mehr:**
  - Tagebuch → „Gehört dazu“ öffnet die Aufgabe im selben Fenster.
  - Die Fristenliste zeigt Uhrzeit und Erinnerung, „Ändern“ bearbeitet dort.
  - Angesprungene Einträge werden hervorgehoben.
  - Die Notiz-Liste nennt, wohin die Erinnerung ging, und springt zum Tag im Kalender.

**Veröffentlicht**
- 2.28.26: Nachweis `docs/VEROEFFENTLICHUNG-2.28.26.json`.
- 2.28.27 (Android, Windows mit `server=ja`, PWA), Klaus' Wort: „bau den Hinweis und gib 2.28.27 aus“, nachts „bringst all
  meine PWA-Version heraus, APK und eine Windows-Version“. Nachweis `docs/VEROEFFENTLICHUNG-2.28.27.json`.

## Geprüft

- Kalender-Kern 18/0 (mit Selbsttest der App-Glocke).
- UI-Proben:
  - mein-kalender 9/0 (neu, mit gestellter Uhr)
  - kalender 26/0, notiz 14/0, memory-bearbeiten 5/0, neu-knopf 13/0, menue-breite 31/0, knoepfe-cockpit 27/0, kurzhinweise,
    hilfe-zu
- Voller Lauf 54/56:
  - einzeldatei: einzeln grün
  - pro-dokumente: der Browser schließt beim Neuladen, auch auf dem Stand vor dieser Arbeit, also ein Fehler dieses Behälters
- Gegenproben:
  - Glocke läutet nie → mein-kalender rot
  - Hinweis „neu anmelden“ nie gezeigt → kalender rot
- GitHub-CI an #104 vor dem Zusammenführen grün.

## Nicht geprüft / offen

- **Am Gerät nur Klaus:**
  - Google-Eintrag und Erinnerung am Samsung-Handy kamen an (Klaus 05.11. abends).
  - Microsoft nur angemeldet.
  - App-Glocke, Mein Kalender und 2.28.27 am Tablet sind ungeprüft.
- **Glocke bei geschlossener App:** In Android und Windows läutet die App-Glocke nur bei offener App. Bei geschlossener App
  erinnert der verbundene Kalender. Eine eigene Android-Weckfunktion bräuchte ein natives Modul (AlarmManager,
  Benachrichtigungsrecht) und ist nicht gebaut.
- **Systemmeldung:** Nur wo der Browser sie erlaubt; im Android-WebView meist nicht. Dort bleiben Ton, Vibration und der
  Hinweis oben.
- **Microsoft:** Der Herausgeber ist nicht verifiziert (MPN-ID fehlt). Fremde Konten sehen deshalb eine Warnung.
- **Google:** Das Prüfvideo für die Google-Verifizierung steht noch aus.
- **Samsung:** „Angepasst“-Erinnerungen kommen an. Was Klaus von Hand ergänzt hatte (6 Wochen, 28 Std.), stammte nicht aus
  der App.
- Google Maps hat Klaus zurückgestellt.

## Stundennachweis

Spanne aus Nachrichten- und Commit-Zeiten, Obergrenze; Pausen sind nicht abgezogen, Klaus' eigene Angabe geht vor.
Zeiten in MEZ.

| Block | von | bis | Dauer | Inhalt |
|---|---|---|---|---|
| 1 | 05.11. 13:14 | 05.11. 21:40 | 8 h 26 min | Kalender in 6 Stücken, Einrichtung Google und Entra mit Klaus, Notiz, 2.28.26 |
| 2 | 05.11. 21:40 | 05.11. 23:50 | 2 h 10 min | Memory bearbeiten, eigene Zeit, neu anmelden, Mein Kalender, App-Glocke, 2.28.27 |

Obergrenze der Sitzung: 10 h 36 min (05.11. 13:14 bis 23:50 MEZ).

## Startauftrag zum Einfügen

```
Familienakte – nach 2.28.27 (Brief vom 05.11.2026).
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-05_KALENDER.md, docs/VEROEFFENTLICHUNG-2.28.27.json.
Erst Klaus' und Jens' Rückmeldung zu 2.28.27 auswerten (Mein Kalender, App-Glocke, Notiz, „Ändern“ ohne Springen).
Offene Wünsche: Glocke auch bei geschlossener Android-App (natives Modul AlarmManager + Benachrichtigung, Recht
POST_NOTIFICATIONS) nur nach Klaus' Ja; Google-Prüfvideo; Microsoft-Herausgeberprüfung (MPN-ID); Google Maps später.
Nicht: Schlüssel/Tokens in Dateien oder Chat, Release ohne Klaus' Wort, Forschung im Repo (nur KimHub).
Am Ende Abschlussbrief mit Stundennachweis und KimHub-Eintrag.
```
