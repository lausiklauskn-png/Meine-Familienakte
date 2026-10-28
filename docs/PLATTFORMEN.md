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
| Update | von selbst: neue Fassung im Vorrat, Hinweis „Neu laden“ | neue APK über die alte installieren (gleiches Zertifikat) | **Tipp auf die Versionszeile** → `windows/latest.json` auf Pages → Installer laden und ausführen |
| Probe | `tests/ui/pwa.test.mjs` | `tools/native/test-android.mjs`, `tests/ui/android.test.mjs` | `tools/native/test-windows.mjs`, `tests/ui/windows.test.mjs` |
| Workflow | `pages.yml` (jeder Merge nach main) | `android.yml` (Prüf-Bau), `android-release.yml` (von Hand) | `windows-app.yml` (Prüf-Bau), `windows-release.yml` (von Hand) |

## Was Klaus selbst tun muss

1. **Pages-Quelle auf „GitHub Actions“** stellen (Repo → Settings → Pages → Build and deployment → Source), falls der
   Pages-Lauf das nicht selbst geschafft hat (`configure-pages` versucht es mit `enablement: true`).
2. **Android-Signatur**: ohne die Secrets `FA_ANDROID_KEYSTORE_B64`, `FA_ANDROID_KEYSTORE_PASSWORD`, `FA_ANDROID_KEY_ALIAS`
   signiert `android-release.yml` mit einem **Wegwerfschlüssel** (steht so im Release-Text). Eine so signierte APK lässt
   sich später nicht über eine anders signierte aktualisieren (deinstallieren nötig). Für die Dauer braucht es einen festen
   Schlüssel wie bei BookLedgerPro (`signing/`), nie im Repo.
3. **Windows**: der Installer ist unsigniert. Windows SmartScreen fragt beim ersten Start („Weitere Informationen → Trotzdem
   ausführen“). Das ist bei Private Brain Pro genauso.
4. **Veröffentlichen** heißt: `android-release.yml` bzw. `windows-release.yml` von Hand auf `main` starten (Actions → Workflow →
   „Run workflow“, Tag z. B. `android-v2.28.1-test.1` / `windows-v2.28.1`). Beide prüfen vorher Typen, Fachprüfungen und Hülle.

## Veröffentlicht am 2026-10-28 (Klaus' Wort), Quelle `7124c4b`

- **PWA**: https://lausiklauskn-png.github.io/Meine-Familienakte/ (Pages-Lauf grün; aus dem Behälter nicht abrufbar, Netzrichtlinie).
- **Android**: [Familienakte-android-v2.28.1-test.1.apk](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/download/android-v2.28.1-test.1/Familienakte-android-v2.28.1-test.1.apk),
  3.929.310 Bytes, SHA-256 `6c2afba830abe240a55b0fb41cd6faae04d5be24becd7bc4c4e5fa77b7bc610d`, Wegwerfschlüssel (siehe oben), Vorab-Release.
- **Windows**: __EXE__
- Das Repo ist privat: Release-Downloads verlangen eine GitHub-Anmeldung im Browser; die Pages-Adresse ist öffentlich lesbar.

## Grenzen

- Kein Gerät im Behälter: APK und Installer sind nur in den Workflows gebaut, nicht auf Tablet oder PC gestartet.
- Die PWA braucht für das Mikrofon eine https-Adresse (Pages). Firefox hat keine Spracherkennung.
- Mikrofonauswahl unter Windows: nur Plan (`docs/MIKROFONAUSWAHL-WINDOWS-PLAN.md`).
- Der Android-Speicher liegt in der App; „Eigenen Ordner wählen“ (File-System-Access-API) gibt es in der WebView nicht.
  Export/Sicherung über die vorhandenen Knöpfe der Akte; Teilen-Ziel ist der Weg hinein.
