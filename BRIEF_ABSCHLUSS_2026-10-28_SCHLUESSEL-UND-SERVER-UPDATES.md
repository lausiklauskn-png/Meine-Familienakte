# Abschluss 2026-10-28 (abends bis 29.10. nachts): Darstellung, Windows 2.28.2, fester APK-Schlüssel, Server-Updates

## Ergebnis

- **PR #18** (übernommen): volle Breite, APK-Text wie Chrome (`setTextZoom(100)`), Diktat in der APK auch bei Internet aus,
  Hinweis in der PWA, 11 zuvor immer grüne Proben werden jetzt rot. Abgleich mit dem Übergabepaket:
  `docs/analyse/ABGLEICH-UEBERGABEPAKET-2026-10-28.md` (sechs Fragen an Klaus offen).
- **Android test.2** veröffentlicht (Wegwerf-Schlüssel), **Windows 2.28.2** veröffentlicht (PR #20, Paketfassung; sichtbar bleibt
  „2.28.1“). Links und Prüfsummen: `docs/PLATTFORMEN.md`.
- **Neu in diesem PR:** fester APK-Schlüssel (Werkzeug + Lauf, noch nicht erzeugt) und Updates vom eigenen Server für Windows und
  Android: `docs/UPDATES-EIGENER-SERVER.md`, Forschung Kimhub forschung/messungen/familienakte-2026-10-28-schluessel-und-server-updates.md.
- Bei Klaus erledigt (Termux): Server-Ordner `familienakte`, `UPDATE_SIGNING_KEY`, `UPDATE_UPLOAD_KEY`, Umgebung
  `android-production` mit `FA_SIGNING_UNLOCK`, Sicherung `~/familienakte-update-schluessel.age`.

## Offen

1. Sicherung `~/fa-signing-freigabe.age` (zweite `age`-Zeile) – Bestätigung von Klaus steht aus.
2. Lauf „Dauerhafte Familienakte-Signieridentität“ → initialize, PR `signing/android-identity` übernehmen.
3. Erste dauerhaft signierte APK und Windows 2.28.3 mit **server = ja** – nur auf Klaus' Wort. Danach am Tablet und PC einmal über
   die Versionszeile aktualisieren (nicht gemessen).
4. Die sechs Fragen aus dem Abgleich (M1-Stand des Freundes, öffentliche Pages-Adresse, Menüwörter, Masterakte).

## Stundennachweis (Ortszeit, UTC+1, aus PR-Zeiten)

| Zeit | Arbeit |
| --- | --- |
| 22:07–22:38 | Abschlussbrief #16, Installieren-Knopf #17 |
| 22:38–23:48 | Breite, APK-Zoom, Diktat, strengere Proben, Abgleich Übergabepaket (#18) |
| 23:48–00:17 | Android test.2, Doku #19, Paketfassung #20, Windows 2.28.2 |
| 00:17–01:00 | APK-Schlüssel, Server-Updates (Rust, Android, Läufe), Proben, Termux-Begleitung, Doku |

Etwa 2 Stunden 55 Minuten.

## Startauftrag zum Einfügen

```
Meine Familienakte, Branch wie vorgegeben. Zuerst lesen: BRIEF_ABSCHLUSS_2026-10-28_SCHLUESSEL-UND-SERVER-UPDATES.md,
docs/UPDATES-EIGENER-SERVER.md, docs/PLATTFORMEN.md, docs/analyse/ABGLEICH-UEBERGABEPAKET-2026-10-28.md.
Erste Schritte: 1) Prüfen, ob signing/android-release.enc.json auf main liegt; wenn nicht, Klaus bitten, den Lauf
„Dauerhafte Familienakte-Signieridentität“ (initialize) zu starten, und den PR signing/android-identity übernehmen.
2) Auf Klaus' Wort: Paketfassung erhöhen, Android und Windows mit server = ja veröffentlichen, von außen prüfen.
3) Klaus' Antworten auf die sechs Abgleich-Fragen einarbeiten.
Nicht: Schlüssel im Chat (nur öffentliche), Klaus ein privates PEM einfügen lassen, ohne Klaus' Wort veröffentlichen,
Oberfläche/Wortlaut des Freundes ändern, sichtbare Version 2.28.1 ändern.
```
