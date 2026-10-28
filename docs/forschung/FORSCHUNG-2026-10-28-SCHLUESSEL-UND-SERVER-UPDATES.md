# Forschung 2026-10-28: fester APK-Schlüssel und Updates vom eigenen Server

## Gefragt

Klaus: „bereite den festen Signaturschlüssel vor … so wie immer“, „wir hatten den Schlüssel ja über den Server machen wollen“
(Vorlage BookLedgerPro „Updates vom eigenen Server“), „dasselbe gleich für den Windows-Schlüssel, falls der einen benötigt“.

## Befunde

1. **Zwei verschiedene Schlüssel.** Der APK-Schlüssel entscheidet, ob Android eine neue APK über die alte lässt (gleiches
   Zertifikat). Die Update-Unterschrift (Ed25519) entscheidet, ob die App einem Feed auf dem Server glaubt. Der Server-Weg
   ersetzt den APK-Schlüssel nicht, er setzt ihn voraus (die App prüft vor dem Installieren dasselbe Zertifikat).
2. **Windows braucht keinen eigenen Schlüssel.** Für die Updates reicht die Ed25519-Unterschrift. Eine Code-Signatur gegen
   SmartScreen bräuchte ein gekauftes Zertifikat; Private Brain Pro und BookLedgerPro lassen das ebenso weg.
3. **Die Windows-Hülle ist hier Tauri (Rust), nicht Java** wie bei BookLedgerPro. Die Regel wurde nach Rust übertragen
   (`update.rs`, `ed25519-dalek` mit `verify_strict`, `ureq` ohne Weiterleitungen); der Java-Hinweis „jlink braucht
   java.net.http + jdk.crypto.ec“ aus BookLedgerPro trifft hier nicht zu.
4. **Android 12 (Tab S6) prüft Ed25519 nicht selbst** → wie BookLedgerPro `net.i2p.crypto:eddsa:0.3.0`, nur zum Prüfen.
5. **Repo privat:** Releases sind von außen nicht lesbar; deshalb der Server. Pages bleibt für die PWA und als Übergang für
   Windows ≤ 2.28.2 (`windows/latest.json`).
6. **GitHub-Umgebung muss vor dem Geheimnis existieren:** `gh secret set --env android-production` gab 404, solange die Umgebung
   fehlte. Erst anlegen (Link), dann setzen.

## Lehren aus dem Bau

- Eine Probe fand „trotzdem Laden angeboten“, obwohl die App richtig war: die Hinweisleiste versteckt den Knopf nur (`hidden`).
  Gezählt werden jetzt nur sichtbare Knöpfe.
- Rote PWA-Proben kamen von einem Bau ohne `scripts/build-pwa.mjs` (`UI_BUILD=1` baut nur Vite). Mit vollständigem Bau 11/11.
  Vor Oberflächenproben immer `npx vite build && node scripts/build-pwa.mjs`.
- Gegenproben je Regel (Rust 4, Java 3) fielen jeweils mit genau ihrer Zeile; kein blinder Wächter.
