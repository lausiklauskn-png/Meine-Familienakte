# Abschluss 09.11.2026: Plan Abgleich, Stufen B–I gebaut und ausgegeben – Fassung 2.28.48

Fortsetzung der Sitzung 7 (`BRIEF_ABSCHLUSS_2026-11-08_ABGLEICH-A.md`, jetzt im Archiv). Klaus hat den Plan
`docs/PLAN_2026-11-08_ABGLEICH.md` mit **vollständigem Freibrief** freigegeben: Stufe für Stufe eigenständig bauen, offene Fragen nach
Logik und Nutzerfreundlichkeit selbst entscheiden, APK/Windows/PWA erst am Ende der letzten Stufe ausgeben, am Ende Abschlussbrief
und KimHub-Eintrag ehrlich ohne Beschönigung. Alles wurde so gemacht; keine Rückfrage war nötig.

## Was gebaut wurde (je Stufe ein PR auf main, Reihenfolge wie im Plan)

| Stufe | Fassung | PR | Inhalt |
|---|---|---|---|
| B | 2.28.41 | #132 | Vollsicherung **verschlüsselt** (AES-GCM-256, PBKDF2 600 000, Passwort ≥ 10) mit **Notfallblatt**; lesbar bleibt wählbar; Einlesen fragt Passwort/Notfallschlüssel; Erinnerung „lange nicht gesichert“ nach 7 Tagen; „Papierkorb leeren“ |
| C | 2.28.42 | #133 | **Gemeinsame Festplatte** (`app/laufwerk.ts`): Ordner `Familienakte-Abgleich/` mit fester Kennung, Stand und Originale verschlüsselt; jedes Gerät erkennt die Platte an der Kennung (Android-Freigabe gemerkt, Windows sucht alle Laufwerke); Abgleich beim Anstecken, Vorschau mit Konfliktwahl, nichts wird gelöscht |
| D | 2.28.43 | #134 | **Kalender beidseitig**: Schritt 5 „Termine aus dem Kalender holen“ (Google syncToken, Microsoft Delta, Android-Gerätekalender); neue Termine werden Fristen, Änderungen gehen zurück, Konflikte werden gefragt |
| E | 2.28.44 | #135 | **Eingangsordner** auch nativ, Verarbeitung in **Blöcken zu 20**, Speicherprüfung, Fortsetzen, keine Zweitkopie; Android-Dauer-Meldung (`ArbeitDienst`) |
| F | 2.28.45 | #136 | **Abgleich im eigenen Netz** (WLAN, LAN-Kabel, USB-Kabel): Gastgeber-Dienst `NetzDienst.java` (Android und Windows byte-gleich, Port 48200, UDP 48201), Koppeln per 9-stelligem Code, Anfragen über die native Hülle; kein Bluetooth, kein NFC, kein fremder Server |
| G | 2.28.46 | #137 | **Bedeutungssuche in der PWA**: Modell im Browser-Speicher (OPFS), Ladebalken in Prozent, Fortsetzen mit Range, Fingerabdruck je Datei; OCR-Text und Eingangs-Textauszug im Index |
| H | 2.28.47 | #138 | **Original-Foto im Stapel** bleibt erhalten („bearbeitet · Original dabei“, nach dem Einordnen als Scan-Original); **„Teilen“** an jeder Unterlage (`app/teilen.ts`, Android über FileProvider); Glocke nach **Geräte-Neustart** (`StartEmpfaenger`) |
| I | 2.28.48 | #139 | **Paket per Teilen**: Änderungen seit dem letzten Paket an ein Gerät als eine verschlüsselte Datei (Originale auf Wunsch bis 100 MB), Einlesen mit demselben Drei-Wege-Abgleich; beim ersten Mal Passwort und Notfallblatt, danach kennen beide Geräte den Schlüssel; auch in der Web-App am Handy |

Hilfe, Landkarte (`lib/app-landkarte.ts`), Stand (`lib/app-stand.ts`) und Versionshistorie (`lib/fassungen.ts`) sind je Stufe
nachgezogen. Entscheidungen, die ich selbst getroffen habe: Kopplung im Netz per Code statt QR (keine QR-Bibliothek im Repo);
Paket-Partner werden an der Gerätekennung oder am gemeinsamen Schlüsselkopf wiedererkannt; nach dem Erstellen eines Pakets gilt der
Stand als übermittelt, „Alles senden“ ist der Weg, wenn ein Paket verloren ging.

## Geprüft

- `npm run build` (mit Fachprüfungen) und `npm run check` grün auf jeder Stufe; Lint 0 Fehler. Neue Fachprüfungen:
  `run-sicherung-krypto-tests` (6), `run-kalender-einlesen-tests` (4), `run-eingang-bloecke-tests` (4), `run-abgleich-tests` (9).
- Neue UI-Proben, alle grün: `sicherung-verschluesselt` 9, `papierkorb` 4, `laufwerk` 8, `kalender-einlesen` 8, `eingangsordner` 6,
  `netz-abgleich` 6, `bedeutung-browser` 6, `teilen-original` 4, `paket` 7. Benachbarte Proben (`knoepfe-sicherheit` 33, `stapel` 20,
  `knoepfe-dokumente` 26, `private-meaning` 12, `app-landkarte` 48, `hilfe-alle` 30, `geraete-ehrlich` 13) grün.
- CI je PR: `pruefung`, `android`, `windows`, `webview`, `product` (31/35), `transport`, `models`, `abgleich` – alle grün auf den
  gemergten Köpfen. Der Java-Dienst `NetzDienst` wurde zusätzlich mit einer lokalen Probe gefahren (401 ohne Token, PUT/GET/Liste/DELETE,
  Pfadprüfung, UDP-Suche).

## Funde unterwegs (ehrlich)

- **Vier Java-Fehler, die nur die CI fand** (kein Android-SDK im Sitzungsbehälter): `CalendarContract.Instances.DIRTY` gibt es nicht
  (Stufe D); `getNotificationChannel` ohne API-26-Riegel (E); `URLDecoder.decode(String, Charset)` und
  `ByteArrayOutputStream.toString(Charset)` erst ab API 33 (F). Alle behoben, Android- und Windows-Kopie des Dienstes blieben byte-gleich.
- **Drei Wettläufe in alten Proben**, die in der CI rot wurden, lokal nie: `neugestaltung-kopf` (15 s zu knapp; außerdem zeigt die
  Eingangszentrale nach der Analyse den Titel „Ablegen Probe Rechnung“ statt des Dateinamens mit Bindestrichen), `knoepfe-sicherheit`
  (las die Meldung „Sicherung läuft“ als Erfolg; danach ein `waitForFunction(async …)`, das in Playwright sofort als wahr gilt –
  dieselbe Falle wie in KimHub am 28.09.). Proben gehärtet, keine Zusicherung abgeschwächt, nichts abgeschaltet.
- Emulator-Infrastruktur zweimal rot (WebView-Bibliothek bzw. Emulator-Download kaputt), nach einmaligem Neustart grün.
- Die Stufen C–I lagen gestapelt in sieben parallelen PRs; Korrekturen aus einer frühen Stufe wurden mit Merge-Commits nach vorn
  gereicht (ein Force-Push wurde vom Sitzungsschutz abgelehnt, einmal ging er durch).

## Ausgabe

Fassung **2.28.48** auf allen drei Wegen, nach dem Merge der letzten Stufe (main `e1d5833`), Nachweis
`docs/VEROEFFENTLICHUNG-2.28.48.json`:

| Weg | Lauf | Datei | Bytes | SHA-256 (anonym geladen, = SHA256SUMS) |
|---|---|---|---|---|
| Android | 42548395388 success, Server-Upload success | `Familienakte-android-v2.28.48.apk` (innen 2.28.48 / e1d5833) | 20 013 089 | `cdc57e58…8684` |
| Android | – | `Familienakte-Einzeldatei-2.28.48.html` | 3 851 551 | `22414d97…1d43` |
| Windows | 42548397739 success, Job `server` success, `latest.json` nennt 2.28.48 | `Familienakte-Windows-2.28.48-x64-setup.exe` | 34 158 986 | `361df12e…c2e1` |
| PWA | Pages Lauf 164 success auf e1d5833 | – | – | – |

Die Zwischenfassungen 2.28.40–2.28.47 wurden absichtlich nicht nativ ausgegeben (Klaus: erst am Ende); die PWA ging mit jedem
Merge über Pages hinaus.

## Nicht geprüft

- **Nichts am Gerät.** Alle nativen Wege (SAF-Freigabe, Laufwerkssuche, Gerätekalender, Dauer-Meldung, Netzdienst im echten WLAN,
  Teilen-Fenster, Boot-Empfänger) nur mit gestellter Hülle geprobt. Google/Microsoft-Kalender nur mit gestellten Antworten.
- Bedeutungssuche in der PWA: ein echtes Modell wurde in der Probe nie geladen (zu groß); gemessen sind Balken, Fortsetzen,
  Fingerabdruck-Prüfung, Entfernen.
- Paket per Teilen und Netz-Abgleich zwischen zwei **echten** Geräten.

## Stundennachweis

Spanne aus Nachrichten-, Commit- und Laufzeiten, Obergrenze, Pausen nicht abgezogen; Klaus' eigene Angabe geht vor.
Sitzung 7 begann nach dem Ende von Sitzung 6 (18:15 UTC, 08.11.); erster Commit 19:15 UTC, letzter Code-Commit 01:16 UTC (09.11.), Release-Läufe bis 02:14 UTC, Nachweis und Briefe bis ca. 02:30 UTC.

| Block | Inhalt | Dauer |
|---|---|---|
| 1 | Bericht, Fragen, Plan, Stufe A (siehe Brief A) | ca. 130 min (18:15–20:25) |
| 2 | Stufen B–F bauen und proben (f40e7d6 21:35 … ca28dc9 22:50) | ca. 145 min (20:25–22:50) |
| 3 | Stufen G, H, I (0106987 23:07 … f8eda2f 23:37) | ca. 50 min |
| 4 | Acht PRs, CI-Funde (Java, Proben), Merges, Ausgabe, Nachweis, Briefe (23:37–02:30) | ca. 175 min |

Gesamt: **ca. 8 h 15 min** (18:15–02:30 UTC, Obergrenze; davon lief die Sitzung ab der Freigabe des Plans weitgehend ohne Klaus’ Zutun; lange Wartezeiten auf CI-Läufe sind enthalten).

## Nachtrag 09.11.2026 – Rückmeldung von Klaus (Handy, Fassung 2.28.37)

Nach dem Abschluss hat Klaus 14 Beobachtungen und Entscheidungen durchgegeben (Bilder vom Handy). Sie stehen vollständig in
`docs/PLAN_2026-11-09_GERAETETEST-RUECKMELDUNG.md`: fünf Fehler (weiße Fläche beim Scrollen, „Zuordnung prüfen“ und
„Tagebuch öffnen“ ohne Wirkung, Textüberlauf in der Assistenz, kein Weg vom Cockpit in die Bearbeitung), sieben Muster für die
ganze App (Schlagwort oben links, Info-Zeile, Suchfelder einheitlich, Erklärtexte ins „?“, „?“-Texte mit fetten Hauptpunkten,
keine Doppelung beim Aufklappen, keine Kennnummern), die Trennung Tagebuch/Erinnerung/Memory mit Buch-Knopf oben, und die
Assistenz als nächster Bauschritt vor der E-Mail-Abstimmung (Anonymisieren wie im E-Mail-Generator von Private Brain Pro).
Spanne der Aufnahme, gemessen: 02:58 UTC (letzte Meldung vor Klaus’ erster Notiz) bis 09:17 UTC (Commit des Plans), also
**6 h 19 min Obergrenze**; Klaus’ Nachrichten kamen mit langen Pausen dazwischen, die nicht abgezogen sind, weil sie keine Spur
hinterlassen. Nichts davon ist gebaut.

## Startauftrag zum Einfügen

```
Familienakte – Rückmeldung 09.11. umsetzen und Gerätetest 2.28.48, Brief vom 09.11.2026.
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, docs/PLAN_2026-11-09_GERAETETEST-RUECKMELDUNG.md, BRIEF_ABSCHLUSS_2026-11-09_ABGLEICH-B-I.md,
docs/VEROEFFENTLICHUNG-2.28.48.json. Erst die tatsächlichen Releases prüfen; nächste freie Fassung 2.28.49.

Reihenfolge (Freibrief vom 08.11. gilt: Fragen selbst nach Logik und Benutzerfreundlichkeit entscheiden):
1. Plan Abschnitt A: die fünf Fehler beheben (je ein PR, Proben mit soll()).
2. Plan Abschnitt B: die sieben Muster einmal über die ganze App ziehen (gemeinsame Bausteine, nicht Einzelstellen).
3. Plan Abschnitt C: Tagebuch/Erinnerung/Memory trennen, Buch-Knopf oben – zuerst HTML-Vorschau an Klaus, dann bauen.
4. Plan Abschnitt D: Assistenz neu durchdenken – zuerst HTML-Vorschau, Anonymisier-Weg aus Private Brain Pro übernehmen
   (Repo lausiklauskn-png/Private-Brain-Pro dazuholen, E-Mail-Generator lesen), dann bauen. Erst danach die E-Mail-Anbindung.
5. Rückmeldungen von Klaus zum Gerätetest 2.28.48 (Plan Abschnitt E) Punkt für Punkt abarbeiten.
Am Ende der letzten Stufe APK, Windows und PWA ausgeben (Nachweis docs/VEROEFFENTLICHUNG-<fassung>.json), am Ende jeder Antwort den
Fortschritt in Prozent nennen.

Regeln: Lint vor dem Push; Oberfläche nur mit Klaus' Ja je sichtbarer Änderung (Vorschau zuerst); keine Schlüssel in Dateien
oder Chat; Forschung nur in KimHub. Am Ende Abschlussbrief mit Stundennachweis und Startauftrag; Briefe archivieren,
CLAUDE.md kürzen.
```
