# Abschluss 2026-10-29: Fassung 2.28.3 veröffentlicht, Paket für den Abgleich mit dem Freund

Schließt an `BRIEF_ABSCHLUSS_2026-10-28_SCHLUESSEL-UND-SERVER-UPDATES.md` an; dessen „Offen“ 1–3 sind erledigt.

## Ergebnis

| Was | Stand | Fundstelle |
| --- | --- | --- |
| Fester APK-Schlüssel | erzeugt im Lauf „Dauerhafte Familienakte-Signieridentität“, verschlüsselt in `signing/` (PR #22), `check` auf main grün; Zertifikat SHA-256 `1f06819ff85a4a48c0bfc2c24409094141b5f86e9ac5e0bf715aa87a5fbf8f19`; Freigabe `FA_SIGNING_UNLOCK` (Umgebung `android-production`), Sicherung bei Klaus `~/fa-signing-freigabe.age` | `docs/UPDATES-EIGENER-SERVER.md` |
| Einzeldatei von der Platte | war seit dem Code-Splitting leer (eigener Fehler aus PR #11), behoben mit eigenem Bau ohne Teile; Probe öffnet per `file://` (PR #23) | `tests/ui/einzeldatei.test.mjs` |
| **Fassung 2.28.3** | Android (erste APK mit festem Schlüssel), Windows, Einzeldatei, PWA; beide auf dem Update-Server; sichtbar bleibt „Version 2.28.1“ (PR #24, #26) | `docs/PLATTFORMEN.md` |
| Signierfehler beim ersten Android-Lauf | Ursache neueste build-tools; jetzt fest 36.0.0, jeder Signierer zählt einmal, echte Signierprobe in `android.yml` (6 Fälle, PR #25) | `tools/signing/test-apk.mjs` |
| Vergleichsblatt und Codex-Auftrag | `docs/FUER-DEN-VERGLEICH.md`, `docs/CODEX-ABGLEICH-FAMILIENAKTE.md` (PR #27): Codex fragt zuerst „A nur technisch / B technisch und optisch“, schreibt `RUECKMELDUNG-ABGLEICH-<Datum>.md` mit Anweisungen je Fassung | docs/ |
| Paket für den Freund | `Familienakte-2.28.3-Abgleich.html` (14 MB, nicht im Repo): alle Fassungen + Quellcode-Zip + Codex-Auftrag eingebettet, SHA-256 vor dem Speichern geprüft; Klaus hat die Datei | Bauer `tools/paket/abgleichsseite.py` |

Öffentliche Links (ohne Anmeldung): `https://family-projekt.de/updates/familienakte/Familienakte-android-v2.28.3.apk` ·
`…/Familienakte-Windows-2.28.3-x64-setup.exe` · PWA `https://lausiklauskn-png.github.io/Meine-Familienakte/`.

## Entschieden (Klaus 2026-10-29)

- Erst diese Fassung an den Freund, **seine Rückmeldung abwarten**, dann weiter.
- **Notfall-Platte** (später): verschlüsselter Tresor im **gleichen Format wie der Tresorordner der Pro-Apps**, aber **eigener Ordner**
  und **eigener Weg neben der Fassung des Freundes** (seine Idee: eigene Festplatte, mit Schlüssel öffnen, mit oder ohne App).
  Dazu auf der Platte: Einzeldatei, APK, Quellcode, LIESMICH, kleiner Öffner ohne App.

## Offen

1. Rückmeldung des Freundes (`RUECKMELDUNG-ABGLEICH-*.md`) – kommt über Klaus.
2. Fragen an Klaus: 17 aus `BRIEF_ABSCHLUSS_2026-10-28_ANALYSE-UND-ERSTBAU.md`, 6 aus `docs/analyse/ABGLEICH-UEBERGABEPAKET-2026-10-28.md`.
3. Gerätebefunde: Tablet (APK 2.28.3: alte Test-App einmal deinstallieren), Windows-PC, Update über die Versionszeile. Nicht gemessen.
4. Aus dem älteren Brief `BRIEF_SITZUNG_2026-10-29_ANTWORTEN-FARBTOKEN-POSTFACH.md`: Farb-Token (H Schritt 1), Postfach-Boden 3a.
   Punkt 4 dort (Signatur) ist erledigt.

## Technische Notizen für den Tresor (nicht gebaut)

- Format: `de.familyprojekt.tresor` (gepflegt in Workflow PDF Pro, Kopie z. B. in BookLedgerPro `android/…/tresor/`), PBV1:
  PBKDF2-SHA256 600 000, AES-256-GCM in 256-KiB-Stücken, Kopf `tresorordner.json`, Passwort- und Ersatzplätze (5/3).
- Weg: WebCrypto-Fassung in JS (läuft in Einzeldatei, PWA, Windows, Android-WebView), mit Gegenprobe gegen die Java-Fassung
  auf der JVM (beide Richtungen); als verschlüsselnder Ordner-Handle nach dem Muster `app/idb-directory.ts`, damit
  `app/local-vault.ts` und das Register V5 unverändert bleiben. Android braucht für USB/SD einen eigenen Ordnerzugang (SAF).
- Geprüft: `file://` in Chromium hat sicheren Kontext, `showDirectoryPicker` und AES-GCM; Firefox nicht geprüft.

## Stundennachweis (Ortszeit UTC+1, aus PR-Zeiten)

| Zeit | Arbeit |
| --- | --- |
| 00:50–01:05 | Signieridentität mit Klaus (Umgebung, Geheimnis, Sicherung), PR #22, `check` |
| 01:05–01:25 | Prüfung USB-Platte/Verschlüsselung, Einzeldatei-Fehler gefunden und behoben (PR #23) |
| 01:25–02:05 | Fassung 2.28.3 (PR #24), Releases, Signierfehler (PR #25), Doku (PR #26) |
| 07:00–07:25 | Abgleichsseite, Codex-Auftrag (PR #27), Bauer im Repo, dieser Brief |

Etwa 1 Stunde 40 Minuten.

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte, Branch wie vorgegeben, Deutsch. Freibrief: eigene PRs mergen, wenn grün; Releases nur auf mein Wort.
Zuerst lesen: BRIEF_ABSCHLUSS_2026-10-29_FASSUNG-2.28.3-UND-ABGLEICH.md, docs/PLATTFORMEN.md, docs/FUER-DEN-VERGLEICH.md,
docs/CODEX-ABGLEICH-FAMILIENAKTE.md, docs/analyse/ABGLEICH-UEBERGABEPAKET-2026-10-28.md.
Hier ist die Rückmeldung meines Freundes (RUECKMELDUNG-ABGLEICH-….md): [anhängen oder einfügen]
Dann: 1) Rückmeldung lesen, je Anweisung kurz sagen: übernehmen / verwerfen / Frage an mich; sichtbare Änderungen nur mit meinem Ja.
2) Freigegebene Anweisungen umsetzen, je Anweisung ein PR mit Prüffall. 3) Danach (nur auf mein Wort) Fassung 2.28.4 für Android und
Windows mit server = ja. 4) Erst wenn ich es sage: Notfall-Platte mit Tresor (gleiches Format wie die Pro-Apps, eigener Ordner).
Nicht: Oberfläche/Wortlaut des Freundes ohne Ja ändern, echte Daten, Schlüssel im Chat oder Repo (nur öffentliche), andere Repos ändern,
Prüfungen abschalten, etwas auf „bestanden“ setzen, ohne mein Wort veröffentlichen, die sichtbare „Version 2.28.1“ ändern.
Am Ende: Abschlussbrief mit Tabelle (Anweisung / umgesetzt / verworfen / an mich) und Startauftrag als Codeblock.
```
