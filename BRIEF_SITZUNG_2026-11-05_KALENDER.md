# Brief an die nächste Sitzung: Kalender-Erinnerung, Kalender-Konten, Datumsfenster, „Was ist neu“

Auftrag von Klaus (05.11.2026), wörtlich zusammengefasst: Fristen und Termine, die in der Familienakte eingegeben oder
automatisch erkannt werden, sollen **automatisch in einen Kalender seiner Wahl** eingetragen werden, **mit eingeschalteter
Erinnerung** – Google-Kalender, Microsoft (Outlook/OneDrive-Konto), Samsung-Kalender oder der Standardkalender. Für **PWA,
Android-APK und Windows**. Verbinden mit dem Konto per Klick. Dazu ein Knopf **„Neu“** mit Fenster **„Was ist neu“**, Einträge
mit kleinem **×** wegklickbar, darin „Kalender verbinden“. Außerdem: **jedes Datumsfeld öffnet beim Antippen das ganze
Datumsfenster** (mit Jahreswahl rückwärts), damit niemand ein Datum von Hand tippen muss. Klaus: „gleich fertig machen, das
komplette Programm“. Die Vorschau hat er freigegeben: https://claude.ai/artifact/Wb2o7TKPzXXik5oDC4aoyB („Genauso kannst du
den Kalender bauen“).

## Zuerst lesen

1. `CLAUDE.md` (Regeln: kein Release ohne Klaus' Wort, keine Schlüssel in Dateien/Chat, kein Personenname in der Oberfläche,
   Forschung nur in KimHub).
2. `BRIEF_ABSCHLUSS_2026-11-05_AKTENSICHERUNG-UND-SICHERUNGSPLAN.md` (Stand dieser Sitzung).
3. Bestehende Fristen-Logik: `lib/family-reminders.ts` (ScheduleItem, `buildScheduleItems`, Status), Fristerkennung
   `lib/central-intake.ts` (`possibleDeadline`, „erst nach Bestätigung anlegen“), Datensätze `deadline`/`task`/`reminder`
   in `lib/family-data-model.ts`, Prüfungen `scripts/run-reminder-tests.mjs`.
4. Native Bauart: Android-Plugins wie `FamilienakteTresorPlugin` (android/app/src/main/java/…), Windows-Brücke unter
   `windows/` (Tauri), Gesundheitsschutz in `lib/family-privacy.ts`.

## Bauplan (in dieser Reihenfolge, je Stück ein PR auf main)

1. **Datumsfenster überall.** Alle Datumsfelder (heute 7× `type="date"` in `app/health-portal.tsx`; weitere Datumseingaben
   suchen) öffnen beim Fokus/Tipp sofort den Auswahldialog (`input.showPicker()` im Klick-Handler, try/catch, Rückfall:
   Feld bleibt tippbar). Ein gemeinsamer Baustein (`DatumFeld`) statt sieben Einzelstellen. Jahreswahl rückwärts prüfen:
   Android-WebView und Chrome bringen sie im nativen Dialog mit; Windows-WebView2 ebenso – am Gerät prüfen, sonst eigenen
   Jahr-/Monatswähler ergänzen. Probe: jedes Datumsfeld ruft `showPicker` auf (gestellt), Rückfall ohne Fehler.
2. **„Was ist neu“.** Knopf „Neu“ im Kopf mit rotem Punkt, solange etwas Ungelesenes da ist; Fenster mit Einträgen (Kalender,
   Akten sichern), × je Eintrag, gemerkt je Gerät (`workspaceStorage`, Demo getrennt). Liste versioniert im Code, keine
   Personennamen. Am Handy: Platz im Kopf messen (Kopfleiste ist knapp, siehe CSS „Kopfleiste am Handy“).
3. **Kalender-Kern (rein, in Node geprüft):** aus einem ScheduleItem ein Kalendereintrag (Titel, Datum ganztägig oder mit
   Uhrzeit, Erinnerungen in Minuten, Notiz mit Rückverweis „Familienakte“), stabile Kennung je Frist (UID), Zuordnung
   `kalender: [{ anbieter, kalenderId, eintragId, stand }]` am Datensatz im Register (reist mit Vollsicherung). Ändern/
   Erledigt/Löschen der Frist → Eintrag aktualisieren bzw. entfernen. **Gesundheitsschutz:** Fristen aus geschützten
   Bereichen gehen nur mit neutralem Titel („Frist“) hinaus, Inhalt nie – Klaus fragen, ob er das so will (Vorgabe: neutral).
4. **Anbieter:**
   - **Android-Gerätekalender** (deckt Samsung-Kalender, Google-Konten auf dem Gerät, Outlook-App-Konten): eigenes Plugin
     über `CalendarContract` (Rechte `READ_CALENDAR`/`WRITE_CALENDAR` erst beim Verbinden erfragen), Kalenderliste zur Wahl,
     Events + `Reminders`. Der Abgleich zu Google/Samsung macht dann das Gerät selbst. Kein Konto-Login nötig.
   - **Google-Kalender per Konto** (PWA und Windows; auf Android optional): Google Calendar API, Scope
     `https://www.googleapis.com/auth/calendar.events`. PWA: Google Identity Services (Token-Client, nur im Speicher),
     Windows: OAuth mit PKCE über Loopback im Systembrowser. Erinnerung über `reminders.overrides`.
   - **Microsoft (Outlook.com/OneDrive-Konto, Microsoft 365)**: Microsoft Graph `/me/events`, Scope `Calendars.ReadWrite`,
     MSAL mit PKCE (PWA: SPA-Weiterleitung; Windows: Systembrowser/Loopback). Graph kennt **eine** Erinnerung je Termin
     (`reminderMinutesBeforeStart`) – die früheste gewählte nehmen und das im Fenster sagen.
   - **Kalenderdatei (.ics)** überall als Rückfall und für „anderer Kalender“: alle offenen Fristen mit `VALARM`; PWA über
     Teilen/Speichern, Windows öffnet die Standard-Kalender-App, Android über Teilen.
   - **Samsung-Kalender ohne Android** (Windows/PWA) gibt es nicht: Samsung hat keine öffentliche Kalender-Schnittstelle. Das
     im Fenster ehrlich sagen und auf Google/Microsoft/.ics verweisen.
5. **Bedienung** wie in der Vorschau: Frist-Formular mit Haken „In den Kalender eintragen“ (vorbelegt, wenn verbunden) und
   Erinnerungs-Chips (7 Tage, 1 Tag, am Tag 9 Uhr); erkannte Fristen aus dem Eingang kommen vorausgefüllt, gespeichert und
   eingetragen wird erst nach Bestätigung (wie bisher). Einstellungen „Kalender verbinden“: Anbieter wählen → Konto/Kalender
   → Erinnerung → „Vorhandene offene Fristen übernehmen“. Zustand sichtbar (verbunden mit …, letzter Abgleich, Fehler mit
   Grund). Trennen-Knopf entfernt Token, lässt Einträge im Kalender stehen (fragen, ob mitlöschen).
6. **Hilfe**: Abschnitt „Fristen im Kalender“ als Ablaufbild (`app/ablaufbild.tsx`), kurz, Punkte.

## Was Klaus vorher einrichten muss (Schritt für Schritt anleiten, keine Werte in den Chat)

- **Google:** in der Google Cloud Console (vorhandenes Projekt „privat-brain-pro“ oder neues Projekt „Familienakte“)
  Calendar API aktivieren, OAuth-Zustimmungsbildschirm (Testmodus, Klaus und Familie als Testnutzer; `calendar.events` ist ein
  sensibler Bereich – ohne Google-Prüfung warnt Google beim Anmelden und erlaubt höchstens 100 Testnutzer), Client-IDs:
  „Web“ mit Ursprung `https://lausiklauskn-png.github.io`, „Desktop“ für Windows, „Android“ mit Paketname und SHA-1 des
  Signierzertifikats (nur falls Google-Login auch auf Android gewünscht). Client-IDs sind öffentlich und dürfen ins Repo;
  ein Desktop-Client-Geheimnis nur als GitHub-Secret beim Bau.
- **Microsoft:** App-Registrierung im Entra-Portal („Konten in beliebigen Organisationen und persönliche Microsoft-Konten“),
  Plattform SPA mit Weiterleitung `https://lausiklauskn-png.github.io/Meine-Familienakte/`, „Mobile und Desktop“ mit
  `http://localhost` für Windows, Berechtigung `Calendars.ReadWrite` (delegiert). Client-ID ins Repo, kein Geheimnis.
- Ohne diese Einrichtung trotzdem fertig bauen: Android-Gerätekalender und .ics funktionieren ohne Konto; Google/Microsoft
  zeigen „noch nicht eingerichtet“ statt eines toten Knopfs.

## Prüfen

- Kern in Node (ICS-Format mit VALARM, UID stabil, Änderung/Löschen, neutraler Titel bei Gesundheit).
- UI-Proben mit gestellten Google/Graph-Antworten (Verbinden, Eintragen, Erinnerung gesetzt, Fehler sichtbar, Trennen);
  Datumsfenster; „Was ist neu“ mit × und Punkt; Demo getrennt.
- Android: Plugin-Probe im Emulator der CI (Kalender anlegen, Event + Reminder lesen). Windows: CI-Bau.
- Gegenproben (Riegel weg → eigene rote Zeile). Am Tablet nichts behaupten, was nicht stattfand.

## Nicht tun

- Keine Schlüssel, Tokens, Client-Geheimnisse in Dateien oder Chat. Tokens nur im Speicher bzw. verschlüsselt (Android
  Keystore, Windows DPAPI), nie im Register oder in der Sicherung.
- Keine Gesundheitsinhalte an Google/Microsoft. Nichts still synchronisieren, was der Nutzer nicht eingeschaltet hat.
- Kein Release (nächste Fassung 2.28.26) ohne Klaus' Wort. Kim-sync nicht einbauen. Keine Forschung im Repo (nur KimHub).

## Startauftrag zum Einfügen

```
Familienakte – Kalender-Erinnerung bauen (Brief vom 05.11.2026).
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, BRIEF_SITZUNG_2026-11-05_KALENDER.md, BRIEF_ABSCHLUSS_2026-11-05_AKTENSICHERUNG-UND-SICHERUNGSPLAN.md.
Vorschau (freigegeben): https://claude.ai/artifact/Wb2o7TKPzXXik5oDC4aoyB
Bauen, je Stück ein PR auf main: 1 Datumsfenster an jedem Datumsfeld (showPicker, Jahreswahl), 2 Knopf „Neu“ mit
„Was ist neu“ und ×, 3 Kalender-Kern (ICS mit Erinnerung, Zuordnung am Datensatz, Gesundheit neutral),
4 Anbieter: Android-Gerätekalender (Samsung/Google/Outlook auf dem Gerät), Google-Konto, Microsoft-Konto, .ics,
5 Bedienung wie in der Vorschau, 6 Hilfe-Abschnitt. Klaus Schritt für Schritt durch Google-Cloud- und
Entra-Einrichtung führen; ohne Einrichtung zeigen Google/Microsoft „noch nicht eingerichtet“.
Nicht: Schlüssel/Tokens in Dateien oder Chat, Gesundheitsinhalte nach außen, Release ohne Klaus' Wort,
Forschung im Repo (nur KimHub). Am Ende Abschlussbrief mit Stundennachweis und KimHub-Eintrag.
```
