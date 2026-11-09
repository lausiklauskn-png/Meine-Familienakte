# Abschluss 09.11.2026: #144 mit main zusammengeführt, Fassung 2.28.51 ausgegeben

Auftrag (Klaus, 09.11.): PR #144 (Tresor im Ordner „Familienakte“, Hilfekarten live) mit main zusammenführen, nachdem #146
(Hilfe-Thema „Pro-App-Verbund (Vorschau)“) gemergt war, prüfen, mergen, 2.28.51 als APK, Windows und PWA ausgeben,
den Herkunfts-Pin der Verbund-Karte um BookLedgerPro-Commit d6dcacd ergänzen. Gebaut hat #144 die Sitzung
`session_01PwFFRzWUcTs9JHvyuVycK9`; ihre Angaben zum Inhalt sind hier übernommen.

## Was in 2.28.51 steckt (#144)

| Teil | Inhalt |
|---|---|
| Tresor | Gerätetest Galaxy S21 (2.28.49): Ein leerer, selbst angelegter Ordner „Familienakte“ im Gerätespeicher galt wegen seines Namens als Fach; die Einrichtung brach still ab, die Meldung stand unsichtbar unter dem Ordnerbaum. Jetzt gilt so ein Ordner direkt im Gerät (ohne Tresorspuren) als Speicher, darin entsteht „Family-Projekt“. SD-Karte, USB und tiefere Ordner bleiben abgewiesen. Meldung unter dem Zustand, „Wo liegt was?“ hinter dem „?“ (Klaus' Wunsch). |
| Hilfekarten live | Vorschau `docs/vorschau/live-zustand-2.28.50.html`, l1–l5 Ja. Fläche = Gerätezustand (grün eingerichtet, rot fehlt, gelb gesperrt/veraltet, grau freiwillig), Rahmen = Baustand (blau fertig, lila gestrichelt im Bau, grau gestrichelt geplant), „neu“ als blauer Punkt statt Goldrand, immer als Karte auch am Handy und Tablet, „Beheben ›“ springt zum Knopf, Demo-Band mit „Demo verlassen ›“. Zugänge: „Neu“ › „Landkarte öffnen“, Symbol „Akten sichern“ oben in der Hilfe. |
| Von main (#146) | Hilfe-Thema „Pro-App-Verbund (Vorschau)“ mit der Karte aus BookLedgerPro im Vollbild-Rahmen. |

## Was diese Sitzung getan hat

- **Zusammenführen** (`git merge origin/main`, kein Rebase, kein Force-Push): Konflikt in `app/globals.css` und
  `app/health-portal.tsx`. Beides behalten: Live-Karten/Landkarte (Import `landkarteAufmachen`, `useLiveZustand`) und
  `ProVerbundHilfe` samt CSS-Block `.pro-verbund-*`.
- **Herkunfts-Pin** `public/pro-verbund/pro-verbund.herkunft.json`: Commit `d6dcacdc54a6…` ergänzt. Vorher nachgeprüft: Die Datei
  `assets/pro-verbund.html` hat in BookLedgerPro d6dcacd dieselbe SHA-256 wie unsere Kopie. `tools/herkunft-pruefen.mjs` nennt den
  Commit jetzt mit. Die Karte selbst ist unverändert.
- **Versionshistorie** 2.28.51 nennt das neue Hilfe-Thema.
- PR #144: Titel auf 2.28.51, Entwurf aufgehoben, Beschreibung ergänzt, nach grüner CI gemergt (main `d1f5c85`).
- **Codex:** Die Prüfung schlug fehl (Kontingent). Klaus: Codex-Prüfungen künftig auslassen, der Zugang ist gesperrt – als feste
  Regel in CLAUDE.md.

## Geprüft

- Lokal nach dem Zusammenführen: `npm run build`, `npm run check`, `npm run check:herkunft` grün; UI `live-karten`,
  `pro-verbund-karte`, `hilfe-alle`, `hilfe-ordnung`, `app-landkarte` je grün.
- CI auf 62bde2f: `pruefung`, `android`, `windows`, `webview`, `product (31, pixel_c)`, `product (35, pixel_2)` – alle success.
- Auf main d1f5c85: „Android-Hülle (Prüf-Bau)“ (Lauf 42697290597) im ersten Versuch rot – `tools/native/test-models.mjs` brach nach
  unter 1 s beim Start ab, lokal 25/25 und auf dem PR-Zweig grün. Die Bau-Sitzung hat den Job einmal neu gestartet: **zweiter
  Versuch success**. Ursache des ersten Abbruchs nicht geklärt.
- Aus der Bau-Sitzung: `test-pro-tresor.mjs` (JVM) mit neuen Fällen, `run-live-zustand-tests` 11, UI `live-karten` 21 Schritte,
  `neu-knopf` auf sechs Einträge angepasst; Windows-Modellprobe wartet nach dem Neuladen auf die offene Demo-Akte (vorher zweimal
  30 s gesperrter Suchknopf in der CI).

## Ausgabe 2.28.51

Nachweis `docs/VEROEFFENTLICHUNG-2.28.51.json`, alle Dateien anonym geladen, SHA-256 = SHA256SUMS:

| Weg | Lauf | Datei | Bytes | SHA-256 |
|---|---|---|---|---|
| Android | 42697305465 success, Update-Server success | `Familienakte-android-v2.28.51.apk` (innen 2.28.51 / d1f5c85) | 20 054 234 | `94fb8686…c9c0` |
| Android | – | `Familienakte-Einzeldatei-2.28.51.html` | 3 900 209 | `df8ec85b…9204` |
| Windows | 42697312752 success, Job `server` success, `latest.json` nennt 2.28.51 | `Familienakte-Windows-2.28.51-x64-setup.exe` | 34 199 698 | `7b28a189…772e` |
| PWA | Pages Lauf 174 success auf d1f5c85 (175 lief noch) | – | – | – |

**Windows auf family-projekt.de:** Für 2.28.51 lief der Job `server` durch, einschließlich „Auf family-projekt.de hochladen und von
außen prüfen“ (der Job vergleicht `aktuell-windows.json`, Signatur und Setup per SHA-256 von außen). **2.28.50** fehlte dort: Im Lauf
42670438706 wurde der Job `server` nie angelegt (Lauf „failure“ ohne fehlgeschlagenen Job, kein Protokoll; Ursache bei GitHub nicht
sichtbar). Nicht nachgeholt, weil das eine erneute Ausgabe von 2.28.50 wäre; 2.28.51 ersetzt die Datei (rsync entfernt alte Setups).
Für 2.28.50 gibt es keinen eigenen Nachweis.

## Nicht geprüft

- Nichts am Gerät: Tresor im Ordner „Familienakte“ (SAF-Freigabe) und alle Live-Zustände sind gestellt.
- family-projekt.de und die Pages-Seite sind aus dem Sitzungsbehälter nicht erreichbar; die Freigabeläufe prüfen den Server selbst.
- Gerätetest 2.28.48/2.28.49: außer dem Tresor keine Rückmeldung.

## Nachtrag: Update-Fähnchen ohne Tipp (Klaus 09.11., gebaut, nicht ausgegeben)

Klaus: In der APK ging das rote Fähnchen „Update verfügbar“ erst nach dem Tipp auf die Versionszeile an. Befund: Die stille
Prüfung gab es, aber nur beim Kaltstart, nach dem Einschalten des Internets und alle 6 Stunden. Holt man die App aus dem
Hintergrund zurück – am Handy der Normalfall –, wurde nie gefragt; der 6-Stunden-Takt ruht im Hintergrund, und ein Fehlversuch
beim Start (Netz noch nicht da) wurde nicht wiederholt.

- Gemeinsamer Ablauf `stillPruefenEinrichten` in `public/native/familienakte-app.js`, genutzt von Android- und Windows-Hülle:
  Start, Internet an, Rückkehr in die App (höchstens alle 10 min), stündlich, nach einem Fehlversuch bis zu dreimal nach 2 min.
  Meldet der Server nichts Neues mehr, geht das Fähnchen wieder aus. Nur bei Internet an, ohne Hinweisleiste.
- Probe `tests/ui/update-fahne-auto.test.mjs` (Android und Windows gestellt, Zeit über `page.clock`): 10 grün; mit dem alten Code
  5 rot (genau Rückkehr, Wiederholung, stündlich). Nachbarproben `android`, `windows`, `pwa`, `neugestaltung-kopf`, `ausloggen`,
  `test-android.mjs`, `test-windows.mjs`, `npm run check` grün.
- Wirkt erst ab der Fassung, die es enthält: Von 2.28.51 auf die nächste Fassung muss noch einmal getippt werden. Ausgabe als
  2.28.52 wartet auf Klaus' Wort.

## Offen (neu)

- **Baustand hinter Schalter (Klaus 09.11.):** sichtbar, solange intern getestet wird; danach hinter einen versteckten Schalter bzw.
  eine Eingabe nur für Entwickler.

## Stundennachweis

Spanne aus Nachrichten-, Commit- und Laufzeiten, Obergrenze, Pausen nicht abgezogen; Klaus' eigene Angabe geht vor.

| Sitzung | Inhalt | Dauer |
|---|---|---|
| Bau #144 (`…WUcTs9…`) | Gerätetest Tresor, Hilfekarten live, Vorschau, Proben, zwei Fassungswechsel (2.28.50 war vergeben); gut die Hälfte Warten auf CI | ca. 14:35–21:05 UTC (Obergrenze 6,5 h) |
| Diese Sitzung | Lesen, Zusammenführen, Pin nachprüfen, Proben (bis 20:20) · CI abwarten, Grund für fehlendes Windows 2.28.50 suchen (bis 20:53) · Merge, Ausgabe, Downloads prüfen, Nachweis, Brief, CLAUDE.md (bis ca. 21:25) | ca. 20:05–21:25 UTC (1 h 20 min, davon gut 40 min Warten auf CI und Ausgabe) |

## Startauftrag zum Einfügen

```
Familienakte – Gerätetest 2.28.51 und offene Rückmeldungen 2.28.48/2.28.49, Brief vom 09.11.2026 (Ausgabe 2.28.51).
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-09_AUSGABE-2.28.51.md, docs/PLAN_2026-11-09_GERAETETEST-RUECKMELDUNG.md,
docs/VEROEFFENTLICHUNG-2.28.51.json. Erst die tatsächlichen Releases prüfen; nächste freie Fassung 2.28.52.

Reihenfolge (Freibrief vom 08.11. gilt):
1. Rückmeldungen von Klaus zum Gerät Punkt für Punkt, Fehler zuerst, je Fehler eine Probe mit soll():
   2.28.51 Tresor im Ordner „Familienakte“ am Galaxy S21, Live-Farben der Landkarte und von „Akten sichern“;
   2.28.49 weiße Fläche (A1), Cockpit-Fenster, Kopf mit Buch, gesprochenes Datum, Ausloggen, Briefweg mit echter KI;
   2.28.48 Vollsicherung, Festplatte, Netz-Abgleich, Kalender holen, Eingangsordner, Bedeutungssuche, Teilen, Paket.
2. Falls noch nicht ausgegeben: Update-Fähnchen ohne Tipp (PR #147) als 2.28.52 ausgeben, am Handy prüfen (App in den
   Hintergrund, nach über 10 min zurückholen → Fähnchen da).
3. Baustand hinter einen versteckten Entwickler-Schalter, sobald Klaus das interne Testen beendet (vorher Vorschau).
4. Danach die E-Mail-Abstimmung (Plan 2.28.35, Entscheidungen Klaus/Jens) – zuerst Vorschau.
Am Ende APK, Windows und PWA ausgeben (server=ja, Nachweis docs/VEROEFFENTLICHUNG-<fassung>.json, prüfen, dass der Windows-Job
„server“ wirklich lief), am Ende jeder Antwort Fortschritt in Prozent.

Regeln: Codex-Prüfungen auslassen; Lint vor dem Push (ganze Ausgabe lesen); Oberfläche nur mit Klaus' Ja je sichtbarer Änderung
(Vorschau zuerst); Verbund-Karte nur in BookLedgerPro pflegen; keine Schlüssel in Dateien oder Chat; Forschung nur in KimHub.
Am Ende Abschlussbrief mit Stundennachweis und Startauftrag; Briefe archivieren, CLAUDE.md kürzen.
```
