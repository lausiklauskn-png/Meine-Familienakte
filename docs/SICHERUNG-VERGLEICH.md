# Vollsicherung im Vergleich mit BookLedgerPro und Private Brain Pro (07.11.2026, nur gelesen)

**BookLedgerPro** – `src/core/backup.js`, `src/ui/datensicherung.js`, `src/domain/backupStrategie.js`, `src/core/crypto.js`, `src/core/durability.js`
- Format: eine Datei `bookledgerpro-backup-<Zeit>.blpr.json`; Umschlag `{magic:"BLPR-BACKUP", format:1, sealed}`, innen `dumpAll()` = kv + records + files (Belege inline im JSON, keine getrennten Originale). Keine Prüfsumme je Datei; Echtheit nur über AES-GCM.
- Verschlüsselung: Pflicht, Passwort, AES-GCM-256 + PBKDF2-SHA256 (600 000 Runden).
- Ziel: gemerkter Ordner (File System Access) oder Download als Rückfall; Erinnerung nach 7 Tagen ohne Sicherung; Onboarding verlangt die erste Sicherung.
- Einlesen: Vorfilter am Namen/Magic, dann entschlüsseln (`readBackup`, ohne Schreiben); UI führt danach `importSnapshot(…, 'merge')` aus = Zusammenführen nach id, **gleiche id wird überschrieben** („letzter gewinnt“); Einstellungen nur bei 'replace'. Keine Probe-Anzeige vor dem Schreiben.
- Selbsttest: `backupRoundtripSelbsttest` (Sichern → Entschlüsseln → Probespeicher → byte-genauer Vergleich).
- Programm beigelegt: nein.

**Private Brain Pro** – `native/native-vault.js`, `android/…/pro/Vault.java` (+ `VaultCrypto`), `modules/02_spore.js`
- Kein Einmal-Export, sondern laufender Spiegel in einen gewählten Tresorordner `Private Brain/` (Gerät, SD, Windows über `ProVault`): `Originale/` (je Datei verschlüsselt, Verzeichnis mit SHA-256), `Katalog/katalog-<n>.pbv` (Katalog-JSON ohne Vektoren), `Mails/`, `Anhänge/`, `tresor.json`.
- Prüfsummen: SHA-256 je Original/Anhang, beim Schreiben und Lesen geprüft. Kleine Dokumente versioniert (letzte 3; unlesbare neueste → vorige).
- Verschlüsselung: Pflicht, Passwort (min. 10 Zeichen) → PBKDF2-HMAC-SHA256, AES-GCM; Android-Keystore merkt den Schlüssel nur zusätzlich.
- Automatik: jede Katalogänderung löst nach 5 s eine Sicherung aus, auch beim Verlassen der App; erste Sicherung beim Anlegen; „Jetzt sichern“-Knopf.
- Einlesen: vorhandenen Tresor öffnen → `restoreCatalog` **nur Zusammenführen**, vorhandene Einträge (gleicher Hash) nie ersetzt; Originale werden bei Bedarf einzeln zurückgeholt (`restoreOriginal`, Fingerabdruck geprüft). Keine Probe ohne Schreiben.
- Zusätzlich Identitäts-Sicherung (`exportBackup`/`importBackup`, verschlüsselt, Versionsprüfung, Überschreibschutz je Eintrag, nur mit `force`).
- Programm beigelegt: nein.

| | Familienakte | BookLedgerPro | Private Brain Pro |
|---|---|---|---|
| Form | Ordner: `Dateien/` + Register-JSON + Manifest | eine JSON-Datei, Belege inline | laufender Tresorordner, je Datei + Katalog |
| Originale getrennt | ja | nein | ja |
| SHA-256 je Datei | ja (Manifest) | nein | ja (Verzeichnis) |
| Verschlüsselt | nein (bewusst) | ja, Pflicht | ja, Pflicht |
| Auslösen | von Hand | von Hand + Erinnerung 7 Tage | automatisch bei Änderung |
| Probe ohne Schreiben | ja (`sicherungProben`) | nur Entschlüsseln, kein Bericht | nein |
| Einlesen | nur in leere Akte | Zusammenführen, gleiche id überschrieben | Zusammenführen, nie ersetzt |
| Versionen | je Sicherung ein Ordner | je Sicherung eine Datei | letzte 3 je kleinem Dokument |
| Programm beigelegt | APK bzw. Lies-mich mit Download + SHA-256 | nein | nein |

**Lücken in der Familienakte** (sachlich)
1. Kein Einlesen in eine nicht leere Akte (beide anderen führen zusammen; Private Brain Pro ohne Überschreiben, nach Hash).
2. Keine automatische Sicherung bzw. Erinnerung „lange nicht gesichert“ (BookLedgerPro 7 Tage, Private Brain Pro bei jeder Änderung).
3. Kein Rundlauf-Selbsttest wie `backupRoundtripSelbsttest`; keine Verschlüsselungsoption (bewusst nicht gewählt).
