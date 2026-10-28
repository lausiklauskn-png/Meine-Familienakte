# Updates vom eigenen Server und fester APK-Schlüssel (Klaus 2026-10-28)

Vorlage: BookLedgerPro `docs/UPDATES-EIGENER-SERVER.md` (Stand f6633c8), Abschnitt „Für eine weitere App“. Gilt nur für die
**installierten** Fassungen (Windows-Setup, Android-APK). Die PWA braucht das nicht: Pages + Service Worker liefern neue Stände
von selbst.

## Was wo liegt

| Teil | Ort |
| --- | --- |
| Server | `167.233.204.72` (Hetzner, Caddy), Ordner `/srv/family-project/updates/familienakte/`, von außen `https://family-projekt.de/updates/familienakte/` (Probe `probe.json` am 2026-10-28 von außen gelesen) |
| Feed | je Plattform `aktuell-windows.json` / `aktuell-android.json` + `.sig` (Base64 der Ed25519-Unterschrift über genau diese Bytes), dazu Setup bzw. APK |
| Unterschrift | Geheimnis `UPDATE_SIGNING_KEY` (Klaus' `~/familienakte-update/signatur.pem`, Sicherung `~/familienakte-update-schluessel.age`). Öffentlicher Teil fest in `windows/src-tauri/src/update.rs` und `android/…/UpdateFeed.java`: `MCowBQYDK2VwAyEAVPL7YyoS3LRmr3pgJcjXOPIH1puFG7wAwPIRSKMA5uc=` |
| Hochladen | Geheimnis `UPDATE_UPLOAD_KEY` (= `~/blp-update/upload`, darf per `rrsync` nur in `/srv/family-project/updates` schreiben), Server-Kennung fest im Lauf |
| APK-Schlüssel | verschlüsselt in `signing/android-release.enc.json` (entsteht im Lauf „Dauerhafte Familienakte-Signieridentität“), Freigabe `FA_SIGNING_UNLOCK` in der Umgebung `android-production` (Sicherung `~/fa-signing-freigabe.age`) |
| Feed bauen | `tools/native/update-feed.mjs` |

## Wie die Apps prüfen (Tipp auf die Versionszeile, nur bei Internet an)

1. Feed + `.sig` holen (höchstens 64 KB / 1 KB, keine Weiterleitungen).
2. Unterschrift gegen den eingebauten Schlüssel; sonst „nicht richtig unterschrieben“, nichts wird geladen.
3. `app` = `familienakte`, Version X.Y.Z **echt neuer** als die installierte (Android zusätzlich höherer `versionCode`).
4. Dateiname nach festem Muster (`Familienakte-Windows-<v>-x64-setup.exe` bzw. `Familienakte-android-v<v>.apk`), Adresse =
   feste Basis + dieser Name. Größe und SHA-256 beim Laden; abweichend → verworfen.
5. Windows startet das Setup und schließt sich. Android öffnet sein Installieren-Fenster erst, wenn die APK **dasselbe Paket,
   dasselbe Zertifikat und einen höheren versionCode** hat (beim ersten Mal führt die App in „Apps installieren erlauben“).

Warum so: ein geknackter Server kann kein fremdes Programm unterschieben, keinen alten echten Stand als neu ausgeben und auf
keine fremde Adresse umleiten.

## Veröffentlichen (nur auf Klaus' Wort)

- Windows: Actions → „Windows-Installer veröffentlichen“ → Tag `windows-vX.Y.Z`, Feld **server = ja**.
- Android: Actions → „Android-APK veröffentlichen“ → Tag `android-vX.Y.Z[-…]`, Feld **server = ja** (geht nur mit dauerhafter
  Signatur). Für ein Update muss die Fassung X.Y.Z steigen, sonst sieht die App nichts Neues.
- Einmalig vorher: Actions → „Dauerhafte Familienakte-Signieridentität“ → **initialize** auf main, dann den PR
  `signing/android-identity` übernehmen. Danach jederzeit **check**.

## Übergang

- Windows 2.28.1 und 2.28.2 fragen noch `windows/latest.json` auf Pages; `pages.yml` legt das weiter bei. Ab der ersten Fassung
  mit diesem Stand (2.28.3) fragt die App den Server.
- Android test.1/test.2 tragen Wegwerf-Schlüssel: **einmal deinstallieren**, dann die erste dauerhaft signierte APK
  installieren. Ab da gehen Updates über die Versionszeile.

## Proben

`cargo test` in `windows/src-tauri` (9: neuer/aktuell, fremde Unterschrift, veränderter Feed, fremder Name/andere App/Größe,
ohne Schlüssel, Versionen, openssl-Gegenprobe, Größe + SHA-256 beim Speichern) · `UpdateFeedTest` (11, JVM, in `android.yml`)
· `tests/ui/windows.test.mjs` und `tests/ui/android.test.mjs` (Ablauf mit gestellter Hülle) · `tools/native/test-*.mjs` ·
`npm run check:signing` (7, Wegwerf-Schlüssel). Gegenproben von Hand: Unterschrift immer gültig · `>=` statt `>` · ohne SHA ·
ohne Namensprüfung (Rust, je eigene rote Zeile) und Unterschrift · versionCode · Name (Java, je eigene rote Zeile).

## Grenzen

- Nicht an echtem Windows-PC oder Tablet gemessen; der erste echte Lauf kommt mit der nächsten Veröffentlichung.
- Das Setup bleibt unsigniert (SmartScreen fragt); das ist die Code-Signatur, nicht die Update-Unterschrift.
- Der Hochlade-Schlüssel darf alle Apps unter `updates/` beschreiben; die Unterschrift je App hält trotzdem fremde Setups ab.
