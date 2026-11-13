# Abschlussbrief 12.11.2026: Fassung 2.28.65 – zweiter Ort, Cloud-Ordner, E-Mail-Wege

Startbrief: `BRIEF_SITZUNG_2026-11-11_CLOUD-ORDNER-2.28.65.md` (jetzt in `docs/briefe-archiv/`). Freibrief von Klaus 11.11.:
durchgehend arbeiten, Fragen selbst entscheiden, Entscheidungen hier festhalten. PR #171 (enthält #170: Nachweis 2.28.64, Startbrief).

## Vor dem Start

2.28.64 war schon ausgegeben (Releases `android-v2.28.64`, `windows-v2.28.64`, Nachweis im Zweig von #170). Nichts erneut ausgegeben.

## Was gebaut ist

| Teil | Dateien | Kern |
|---|---|---|
| Sicherung an einem zweiten Ort | `lib/zweiter-ort.ts`, `app/zweiter-ort.ts`, `app/zweiter-ort-karte.tsx` | Ordner wählen (OneDrive-Ordner, Stick, SD, Netzordner); verschlüsselt (Vorgabe) oder lesbar; von selbst bei Änderung (höchstens einmal am Tag) und „Jetzt sichern“; dort **1**, auf dem Gerät **2** (App-Ordner `sicherungen` bzw. Browser-Dateispeicher); neue Sicherung ganz schreiben, jede Datei per SHA-256 bestätigen, danach `sicherungNachpruefen` (Register-Prüfsumme, jede Datei vorhanden, Größe) – erst dann alte entfernen; nur Ordner mit Kennungsdatei `Zweiter_Ort.json` und eigener Kennung. Android legt die APK bei. |
| Nativer Löschbefehl | `FamilienakteOrdnerPlugin.sicherungEntfernen`, `FamilyFolders` (Windows), `pro_tresor.rs`, `familienakte-windows.js` | nur ein Ordner direkt im gewählten Ordner, Name `Familienakte_Vollsicherung_…`, Kennungsdatei mit passender Kennung; JUnit `SicherungEntfernenTest` |
| „Nur sichern“ / „Synchron halten“ | `app/zweiter-ort.ts`, `laufwerkVorbereiten(…, kopfVorhanden)` | Synchron = gemeinsame Festplatte im selben Ordner, **gleicher Kopf** wie die Sicherung (ein Passwort, ein Notfallblatt); liegt dort schon ein Abgleich, wird er mit demselben Passwort verbunden; die Sicherung läuft immer mit |
| Cloud-Ordner hereinholen | `lib/cloud-ordner.ts`, `app/cloud-ordner.ts`, `app/cloud-ordner-karte.tsx` | nur lesen, mit Unterordnern; jede neue/geänderte Datei **als Kopie** in die Eingangszentrale (Herkunft „OneDrive › Auto › Versicherung“), geänderte Datei = neue Fassung, Bekanntes kommt nicht wieder, Blöcke zu 20, beim Start und alle 15 min, „Trennen“, Platzhalter-Hinweis, je Gerät ein Satz |
| Handy-Schleife | `app/cloud-ordner-karte.tsx`, `app/laufwerk-karte.tsx` (Ereignis `familienakte:paket-datei`) | Pakete `Familienakte-Paket_….fav` im Cloud-Ordner werden erkannt, Format geprüft, dann wie „Paket einlesen …“ zusammengeführt |
| E-Mail-Wege | `lib/mail-wege.ts`, `app/mail-wege.ts`, `app/email-wege-karte.tsx`, `app/mail-versand.tsx` | Kasten „E-Mail“ in der Eingangszentrale (zwei Blöcke: herein / hinaus); Private Brain Pro als Hauptweg mit selbsttätigem Abholen aus `eingang-familienakte`; Microsoft-Postfach (30 Tage, nichts verändert, .eml in den Eingang) und Senden nach Bestätigung; Mail-App mit Anlagen (Android `FamilienakteShare.mailOeffnen`, nur Mail-Apps); Frage „abgeschickt?“; Gesundheitswort-Hinweis; Ansage über 20 MB; eigenes Mail-Programm (Weg H) nur vorbereitet (`EigenesPostfach`) |
| Texte | `lib/fassungen.ts`, `lib/app-stand.ts`, `lib/app-landkarte.ts`, `lib/live-zustand.ts`, `app/neu-knopf.tsx`, `app/aktensicherung-hilfe.tsx`, `app/email-hilfe.tsx`, `public/datenschutz.html`, `docs/KALENDER-EINRICHTUNG.md`, E-Mail-Karte, Landkarte-Datei | neue Kästen „Sicherung an einem zweiten Ort“, „Cloud-Ordner hereinholen“, „Private Brain Pro“; Stand je Kasten; Live-Farben; Datenschutz Abschnitt 5 „E-Mail“ |

## Entscheidungen (Freibrief)

1. **Befund Eingangsordner:** er verweist bis zum Übernehmen nur auf die Datei (`ordnerDatei`). Der Cloud-Ordner kopiert sofort in den Arbeitsspeicher des Eingangs – fällt OneDrive weg, fehlt nichts.
2. **„Auf dem Gerät zwei“** = eigener App-Speicher (Android/Windows `ordnerIntern("sicherungen")`, Browser OPFS). Schützt gegen Fehler in der Akte; der zweite Ort schützt gegen Geräteverlust.
3. **Schlüssel für die selbsttätige Sicherung** bleibt nur auf dem Gerät (wie bei der Festplatte); das Passwort wird nie gespeichert. Ein Kopf je Einrichtung → ein Notfallblatt für alle Sicherungen dort.
4. **Nach einem Fehlschlag** wird von selbst erst am nächsten Tag erneut versucht (keine Schleife); „Jetzt sichern“ geht immer; ist der Ort nicht erreichbar, läuft die Gerätesicherung trotzdem.
5. **„Synchron halten“ ist immer verschlüsselt** (die Festplatte kennt nur das); wer lesbar gewählt hat, wird auf „verschlüsselt“ geführt.
6. **Cloud-Ordner-Quelle** in der Eingangszentrale: vorhandene Quelle `onedrive-inbox` (Anzeige „OneDrive- oder Cloud-Ordner“) statt eines neuen Quellentyps.
7. **Android-Ordnerliste** liefert keine Änderungszeit: dort erkennt der Cloud-Ordner Änderungen nur an der Größe (Windows und Browser an Größe und Zeit).
8. **E-Mail, Notfallweg H:** nicht nötig. Private Brain Pro 1.0.48 hat „An Familienakte teilen“ schon (Übergabe über das Tresor-Fach, verlässlich, mit Quittung); Brain blieb unverändert, keine neue Brain-Fassung. Weg H nur vorbereitet.
9. **Microsoft:** Kalender und Mail in **einer** Anmeldung (sonst überschreibt unter Windows der Mail-Zugang den Kalender-Zugang). Anlagen über Microsoft je Datei bis 3 MB; größer → ehrlicher Hinweis auf die Mail-App.
10. **Windows (e4):** Mail-App öffnet ohne Anlagen; Text in der Zwischenablage, Anlagen gespeichert, mit Satz.
11. **Altes „OneDrive verbinden“** bleibt unverändert, nichts umgezogen. Frage an Klaus: wegfallen lassen oder „Akte liegt in OneDrive (alt)“ nennen?
12. **Korrespondenz:** Anlagen und Hinweise stehen **vor** dem Haken „geprüft“, der Sende-Knopf danach (erst wählen, dann bestätigen).
13. **„Neu“** zeigt nach Klaus' Regel nur die letzten zwei Fassungen: drei Einträge für 2.28.65, einer für 2.28.64.
14. **Sicht-Wörter neu** (ohne Vorschau, Klaus: „Es braucht keine Vorschau“): „Sicherung an einem zweiten Ort“, „Wo liegt die zweite
    Sicherung?“, „Verschlüsselt oder lesbar?“, „Nur sichern oder synchron halten?“, „Cloud-Ordner hereinholen“, „Jetzt nachsehen“,
    „Trennen“, „E-Mail“, „Wie kommen Mails herein?“, „Wie gehen Mails hinaus?“, „In der Mail-App öffnen“, „Über Microsoft senden …“,
    „Hast du die E-Mail in der Mail-App abgeschickt?“.

## Proben

- Neu: `run-zweiter-ort-tests` (8 Gruppen), `run-cloud-ordner-tests` (6), `run-mail-wege-tests` (6), in `build` und `check`;
  UI `zweiter-ort` (11, mit Gegenproben Abbruch/fremde Ordner/falsches Passwort), `cloud-ordner` (9, mit Gegenprobe kaputtes Paket),
  `email-wege` (6, Gegenprobe Tresor zu); JUnit `SicherungEntfernenTest` (eigene/fremde Namen).
- `npm run build`, `npm run check`, `eslint`, `check:herkunft` grün. UI lokal in vier Strängen 111/114; danach behoben: `knoepfe-assistenz`
  (Anlagen nach dem Prüf-Haken), `neu-knopf`, `neu-knopf-ziele` (Sprung zu den E-Mail-Wegen wartet auf die Eingangszentrale);
  `pro-dokumente` lokal bekannt rot, in der CI grün.
- CI auf e8f3f8e grün: pruefung 113/114 im ersten Lauf (Zeitlimit Briefweg `rueckmeldung-d`, lokal 9/9) → zweiter Lauf grün; webview
  erst am Emulator-Download gescheitert → zweiter Lauf grün; windows auf 5322b8b einmal rot (Bedeutungssuche-Knopf 60 s gesperrt,
  bekannte Stelle), auf e8f3f8e grün; android, product 31/35, transport grün.

## Nicht geprüft

- Alles am Gerät: zweiter Ort auf echtem OneDrive-Ordner/Stick/SD (Android-SAF-Freigabe nach Neustart, Löschbefehl auf SD), Windows-Löschbefehl, Platzhalter-Dateien von OneDrive, Cloud-Ordner unter Windows mit Files-On-Demand, Paket vom Handy über die OneDrive-App bis zum PC, Mail-App mit Anlagen am Handy (Auswahl nur Mail-Apps), Private Brain → Familienakte mit echtem Tresor, Microsoft-Mail (Rechte in Entra fehlen noch – e10).
- Proben im Browser: nach einem Neustart des Browsers fragt die App beim gemerkten Ordner neu nach der Erlaubnis; das Test-Chromium stürzt bei dieser Frage an einem Ordner aus dem internen Speicher ab, darum hält die App den Ordner zusätzlich für die Sitzung. Der Weg „nach Neustart“ ist im Browser nicht geprüft.
- Microsoft-Anmeldung und Graph nur als Regeln geprüft (Meldungen, Grenzen), nicht gegen Microsoft.

## Offen

- Klaus: Rechte `Mail.Read`, `Mail.Send` in Entra (Schritt 6 in `docs/KALENDER-EINRICHTUNG.md`); Gmail senden erst nach Googles Zustimmung (e7).
- Klaus: altes „OneDrive verbinden“ – wegfallen oder umbenennen?
- Gemeinsame Rechtstexte `family-project/rechtstexte` (#376) um E-Mail/zweiten Ort ergänzen und verteilen (hier nur `public/datenschutz.html`).
- Weiter offen aus dem Startbrief: graue Wege der Landkarte, Baustand hinter Entwickler-Schalter, Testament-Bildschirmfoto, Gesundheitsschutz je Nutzer, Gerätetests 2.28.48–2.28.65.

## Ausgabe 2.28.65

- #171 auf main zusammengeführt (4d7c6f2). Releases `android-v2.28.65` (Lauf 43099796658) und `windows-v2.28.65` (43099801328), beide
  `server=ja`, Pages 43099769444 – alle grün. Downloads anonym geladen, SHA-256 gleich `SHA256SUMS` (APK `9b03bd44…`, Einzeldatei
  `720e45df…`, Windows-Setup `4becbb58…`), APK enthält 2.28.65 aus 4d7c6f2. Nachweis `docs/VEROEFFENTLICHUNG-2.28.65.json`.
- Geschenkbox (Artefakt XeUMGuSZ49FzsJYjwQznM7) Version 21: Familienakte-Links 2.28.65, Landkarte und Einzeldatei neu gebaut.
- Private Brain Pro: keine neue Fassung nötig.

## Stundennachweis

| Zeit (UTC, 11.11.) | Arbeit |
|---|---|
| 18:25–18:35 | Startbrief, Stand 2.28.64 geprüft, Vollsicherung, Eingangsordner und Laufwerk gelesen |
| 18:35–18:45 | zweiter Ort: Logik, nativer Löschbefehl, Karte, Proben, Synchron halten |
| 18:45–18:55 | Cloud-Ordner, Handy-Schleife, Absturz des Test-Chromiums eingekreist |
| 18:55–19:00 | E-Mail-Wege (Brain-Befund, Mail-App, Microsoft, Versand), Proben |
| 19:00–19:05 | Landkarte, Hilfe, „Neu“, Datenschutz, Entra-Schritte, Fassung 2.28.65 |
| 19:05–21:00 | lokale Proben in vier Strängen, drei Korrekturen, CI mit zwei Neustarts (Wartezeit) |
| 21:00–21:25 | Zusammenführen, Ausgabe, Downloads geprüft, Nachweis, Geschenkbox, Brief, KimHub |

Summe rund 3 Stunden (Hamburger Zeit 19:25–22:25), davon knapp 2 Stunden Warten auf Proben und CI.

## Startauftrag

```
Familienakte (lausiklauskn-png/Meine-Familienakte). CLAUDE.md und BRIEF_ABSCHLUSS_2026-11-12_CLOUD-ORDNER-2.28.65.md lesen.
2.28.65 ist ausgegeben (APK, Windows, PWA). Nächste freie Fassung 2.28.66; sammeln, nicht nach jedem Umbau ausgeben.
Zuerst Klaus' Rückmeldung zum Gerätetest 2.28.65 aufnehmen (zweiter Ort auf Stick/SD/OneDrive, Cloud-Ordner unter Windows,
Paket vom Handy über OneDrive, Mail-App mit Anlagen, Private Brain → Familienakte). Offen bei Klaus: altes „OneDrive verbinden“
(weg oder „alt“), Rechte Mail.Read/Mail.Send in Entra. Danach: gemeinsame Rechtstexte (family-project #376) um E-Mail und
zweiten Ort ergänzen und verteilen.
```
