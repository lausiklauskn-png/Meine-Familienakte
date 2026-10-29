# Die Familienakte auf drei Plattformen (Stand 2026-10-28)

Eine Web-App (Vite + React, Oberfläche des Freundes unverändert, Fassung 2.28.1), drei Hüllen. Alle drei laden dieselben
gebauten Dateien aus `dist/`; die Hüllen unterscheiden sich nur in Diktat, Dateieingang und Update-Weg. Der
**Internetschalter** (byte-gleich aus Private Brain Pro, `public/native/native-network.js`) ist überall gleich: Standard
**aus**, Knopf in der Kopfleiste, überlebt den Neustart; bei „aus“ geht nichts ins Netz (`APP_OFFLINE`).

| | PWA (Browser) | Android (APK) | Windows (Installer) |
| --- | --- | --- | --- |
| Adresse / Datei | https://lausiklauskn-png.github.io/Meine-Familienakte/ (Pages aus `pages.yml`) | Release `android-v…`, `Familienakte-<tag>.apk` | Release `windows-v…`, `Familienakte-Windows-<Fassung>-x64-setup.exe` |
| Hülle | Service Worker `dist/sw.js` (`scripts/build-pwa.mjs`), Manifest mit PNG-Symbolen | Capacitor 8, Paket `de.familyprojekt.familienakte`, `android/` | Tauri 2, NSIS pro Benutzer, `windows/` |
| Diktat | Browser-Erkennung (Chrome/Edge), **nur bei Internet an** (Audio geht zum Browser-Hersteller) | Android-Sprachfenster (`RecognizerIntent`), auch offline wenn Sprachpaket da | Windows SAPI auf dem Rechner, auch bei Internet aus |
| Dateien hinein | Dateiauswahl, Kamera, **Teilen** (Web Share Target `./teilen-empfang`) | Dateiauswahl, Kamera, **„Teilen → Familienakte“**, „Öffnen mit“ | Dateiauswahl, **„Öffnen mit“** / Datei auf das Symbol ziehen (Startargumente) |
| Speicher | Browser-Datentresor (OPFS, Rückfall IndexedDB) oder eigener Ordner | WebView-Speicher der App | WebView2-Speicher der App (`%LOCALAPPDATA%`) |
| Installieren | Knopf „⬇ Installieren“ hinten in der Kopfleiste (Kanon `installieren.js` aus Private Brain Pro, byte-gleich): Browser-Dialog, sonst Erklärung; **weg, sobald die Seite als installierte App läuft** (Klaus 2026-10-28) | kein Knopf (APK) | kein Knopf (Installer) |
| Update | von selbst: neue Fassung im Vorrat, Hinweis „Neu laden“ | **Tipp auf die Versionszeile** → unterschriebener Feed auf family-projekt.de → APK prüfen → Androids Installieren-Fenster (ab der ersten dauerhaft signierten APK) | **Tipp auf die Versionszeile** → unterschriebener Feed auf family-projekt.de → Setup laden, prüfen, starten (ab 2.28.3; bis 2.28.2 über `windows/latest.json` auf Pages) |
| Probe | `tests/ui/pwa.test.mjs` | `tools/native/test-android.mjs`, `tests/ui/android.test.mjs` | `tools/native/test-windows.mjs`, `tests/ui/windows.test.mjs` |
| Workflow | `pages.yml` (jeder Merge nach main) | `android.yml` (Prüf-Bau), `android-release.yml` (von Hand) | `windows-app.yml` (Prüf-Bau), `windows-release.yml` (von Hand) |

## Was Klaus selbst tun muss

1. **Pages-Quelle auf „GitHub Actions“** stellen (Repo → Settings → Pages → Build and deployment → Source), falls der
   Pages-Lauf das nicht selbst geschafft hat (`configure-pages` versucht es mit `enablement: true`).
2. **Android-Signatur** (vorbereitet 2026-10-28, `docs/UPDATES-EIGENER-SERVER.md`): Freigabe `FA_SIGNING_UNLOCK` liegt in der
   Umgebung `android-production`. Einmal Actions → „Dauerhafte Familienakte-Signieridentität“ → **initialize** auf main, danach
   den PR `signing/android-identity` übernehmen. Bis dahin signiert `android-release.yml` mit einem Wegwerfschlüssel.
3. **Windows**: der Installer ist unsigniert. Windows SmartScreen fragt beim ersten Start („Weitere Informationen → Trotzdem
   ausführen“). Das ist bei Private Brain Pro genauso.
4. **Veröffentlichen** heißt: `android-release.yml` bzw. `windows-release.yml` von Hand auf `main` starten (Actions → Workflow →
   „Run workflow“, Tag z. B. `android-v2.28.1-test.1` / `windows-v2.28.1`). Beide prüfen vorher Typen, Fachprüfungen und Hülle.

## Veröffentlicht am 2026-10-28 (Klaus' Wort), Quelle `7124c4b`

- **PWA**: https://lausiklauskn-png.github.io/Meine-Familienakte/ (Pages-Lauf grün; aus dem Behälter nicht abrufbar, Netzrichtlinie).
- **Android**: [Familienakte-android-v2.28.1-test.1.apk](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/download/android-v2.28.1-test.1/Familienakte-android-v2.28.1-test.1.apk),
  3.929.310 Bytes, SHA-256 `6c2afba830abe240a55b0fb41cd6faae04d5be24becd7bc4c4e5fa77b7bc610d`, Wegwerfschlüssel (siehe oben), Vorab-Release.
- **Windows**: [Familienakte-Windows-2.28.1-x64-setup.exe](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/download/windows-v2.28.1/Familienakte-Windows-2.28.1-x64-setup.exe) – Release-Lauf 40767264852, Quelle `7124c4b`, 2.194.018 Bytes, SHA-256 `24e7df51f9b76a3fdb1ee1d588f4271913bad7769a1230b47df21ab1471c947d`, unabhängig über die API geladen und gleich `SHA256SUMS`; `latest.json` zeigt auf die Pages-Adresse `windows/…` (Pages-Lauf 40769147047 legt Installer und `latest.json` bei). Unsigniert: SmartScreen einmal mit „Trotzdem ausführen“ bestätigen.
- Das Repo ist privat: Release-Downloads verlangen eine GitHub-Anmeldung im Browser; die Pages-Adresse ist öffentlich lesbar.

## Nachtrag 2026-10-28 abends, Quelle `459401a` (PR #18)

- **Android**: [Familienakte-android-v2.28.1-test.2.apk](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/download/android-v2.28.1-test.2/Familienakte-android-v2.28.1-test.2.apk),
  Release-Lauf 40782725441, 3.937.584 Bytes, SHA-256 `95f3b8e70ffc02c457b14e289a1eb2959c6e6692cd38aad54e5836487d8cd787`,
  über die API geladen und gleich `SHA256SUMS`. Neu: Schrift wie im Browser (WebView-Textzoom fest 100 %), volle Breite,
  Diktat auch bei ausgeschaltetem Internet. Wieder ein Wegwerfschlüssel: **test.1 erst deinstallieren**, dann installieren.
- **PWA**: dieselben Änderungen über Pages (volle Breite, Hinweis am Mikrofon, wenn das Internet der App aus ist).
- **Windows**: unverändert 2.28.1. Die neue Breite kommt erst mit einer neuen Fassung (Tag `windows-v2.28.1` ist vergeben,
  dafür muss die Version steigen).

## Nachtrag 2026-10-29 nachts, Quelle `a49c2d8` (PR #20)

- **Windows 2.28.2**: [Familienakte-Windows-2.28.2-x64-setup.exe](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/download/windows-v2.28.2/Familienakte-Windows-2.28.2-x64-setup.exe),
  Release-Lauf 40786176514, 2.200.407 Bytes, SHA-256 `bca319034526cd60d2615c56ba2435ba1b535da774789a93b0caa940352d2cca`, über die
  API geladen und gleich `SHA256SUMS`. Volle Breite und Diktat-Hinweis wie Android test.2. Sichtbare Version bleibt „2.28.1“
  (Code des Freundes), nur die Paketfassung ist 2.28.2. Wer 2.28.1 hat, findet sie über die Versionszeile (Pages `latest.json`).

## Fassung 2.28.3 zum Vergleich (2026-10-29, Quelle `f3fdf5c` / Android `138f292`)

Erste Fassung mit **festem APK-Schlüssel** (Zertifikat SHA-256 `1f06819ff85a4a48c0bfc2c24409094141b5f86e9ac5e0bf715aa87a5fbf8f19`,
aus der geladenen APK nachgemessen) und **Updates vom eigenen Server**. Sichtbar bleibt „Version 2.28.1“.

| Was | Öffentlich (ohne Anmeldung) | Release (mit GitHub-Anmeldung) | Größe · SHA-256 |
| --- | --- | --- | --- |
| Android | https://family-projekt.de/updates/familienakte/Familienakte-android-v2.28.3.apk | [android-v2.28.3](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/tag/android-v2.28.3) | 3.970.352 B · `35f0190ba05a84bf9298ff23e60f92100c9df1c2407cd60f114a32bd53131ed2` |
| Windows | https://family-projekt.de/updates/familienakte/Familienakte-Windows-2.28.3-x64-setup.exe | [windows-v2.28.3](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/tag/windows-v2.28.3) | 2.806.559 B · `9f3320b49926e602bf4733f8da4b5faf47cd46a92c4b4dbd1b2b46a9dc02b04c` |
| Einzeldatei | – | im Android-Release: `Familienakte-Einzeldatei-2.28.3.html` | 2.509.336 B · `f9ca9b334f218e7bbd51e4e5858b11e1786159cc87687e59109b1626a6b2374e` |
| PWA | https://lausiklauskn-png.github.io/Meine-Familienakte/ | – | – |

Release-Läufe: Windows 40793912684 (mit Server-Job), Android 40796279917 (erster Versuch 40793910294 brach beim Signieren ab:
neueste build-tools; behoben in PR #25, Werkzeug fest 36.0.0, echte Signierprobe in `android.yml`). Alle Dateien über die API
geladen und gleich `SHA256SUMS`; beide Läufe haben Feed und Datei auf family-projekt.de von außen verglichen (aus dem Behälter
nicht erreichbar, Netzsperre). **Android test.1/test.2 einmal deinstallieren**, dann 2.28.3 installieren; ab da Updates über die
Versionszeile. Vergleichsblatt für den Freund: `docs/FUER-DEN-VERGLEICH.md`.

## Grenzen

- Kein Gerät im Behälter: APK und Installer sind nur in den Workflows gebaut, nicht auf Tablet oder PC gestartet.
- Die PWA braucht für das Mikrofon eine https-Adresse (Pages). Firefox hat keine Spracherkennung.
- Mikrofonauswahl unter Windows: nur Plan (`docs/MIKROFONAUSWAHL-WINDOWS-PLAN.md`).
- Der Android-Speicher liegt in der App; „Eigenen Ordner wählen“ (File-System-Access-API) gibt es in der WebView nicht.
  Export/Sicherung über die vorhandenen Knöpfe der Akte; Teilen-Ziel ist der Weg hinein.
