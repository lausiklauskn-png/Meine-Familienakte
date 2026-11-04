# Abschluss 04.11.2026 – Basic-Name der Web-App und Versionszeile 2.28.21

## Anlass (Klaus)
- Bildschirmfoto Tablet: Chrome fragte „Namensaktualisierung prüfen: Familienakte → Familienakte Pro“ für die
  installierte Web-App (Basic). Klaus: Basic soll Basic heißen, sonst nicht unterscheidbar.
- Danach: „Passe bitte oben die Versionsnummer an auf die aktuelle Nummer der App Familienakte Pro.“ und
  „Ja, bitte mache das“ zu einer neuen Android-/Windows-Fassung.

## Ergebnis
- **#78 (gemergt, Pages grün):** `public/manifest.webmanifest` name/short_name = „Familienakte Basic“.
  Android (`strings.xml`) und Windows (`tauri.conf.json`) bleiben „Familienakte Pro“. Ursache war die
  Umbenennung in 2.28.15, die das Web-Manifest mit erfasst hatte.
- **#79:** Kopf- und Fußzeile zeigen `version` aus `package.json` (statt fester 2.28.1); Fußzeile ohne das
  veraltete Datum. `APP_VERSION = "2.28.1"` bleibt interner Prüf-/Hilfe-/Changelog-Stand (Versionsseite zeigt ihn).
  Fassung 2.28.20 → 2.28.21 in denselben 7 Dateien wie beim letzten Sprung. Proben in `tests/ui/pwa.test.mjs`.
- **Veröffentlicht 2.28.21** (Quelle 3869c77, Prüfungen auf main grün): `android-v2.28.21` (Lauf 41820269181) und
  `windows-v2.28.21` (Lauf 41820274052), beide server=ja; PWA über Pages (Lauf 41818330431). Öffentliche Downloads
  anonym geladen, Größe und SHA-256 gleich den GitHub-Digests und SHA256SUMS. Update-Server im Ablauf per
  Rücklesen bestätigt. Nachweis `docs/VEROEFFENTLICHUNG-2.28.21.json`. **Nicht erneut ausgeben.**
- PR #79 bekam wegen einer GitHub-Störung keine PR-Prüfung; auf Klaus' Wort („oder führen sie auf Main“)
  zusammengeführt, die Prüfungen auf main waren vor der Ausgabe grün.

## Aufräumen der Briefe (Klaus: „Ja, Briefe archivieren und CLAUDE.md kürzen“)
- 25 ältere Briefe/Aufträge (bis 03.11., inkl. Codex-Briefe und `NEUSTART_AUFTRAG.md`) mit `git mv` nach
  `docs/briefe-archiv/`; Verweise in README, `docs/`, `tests/testdateien/` und Briefen angepasst. Nichts gelöscht.
- `CLAUDE.md` auf aktuellen Stand, Offenes, Veröffentlichungs- und feste Regeln gekürzt; Einzelheiten im Archiv.

## Prüfungen und Grenzen
- Lokal: typecheck, check, build grün; PWA-Probe 13/13; UI 42/43 – `pro-dokumente` scheitert in der Sandbox
  auch auf unverändertem main gleich („Target page … closed“ beim Neuladen).
- Auf Klaus' Tablet nicht geprüft: Chrome fragt beim nächsten Manifest-Abgleich erneut („Familienakte Basic“ → OK).
- Installierte Android-/Windows-Apps zeigen die neue Zeile erst nach Update auf 2.28.21
  (Update: Tipp auf die Versionszeile → Update-Server family-projekt.de).

## Stundennachweis
- 04.11.2026, ca. 09:55–12:45 (Ursache, Manifest, Merge #78, Versionszeile, Fassungssprung, GitHub-Störung, Ausgabe 2.28.21, Briefe archiviert).

## Startauftrag nächste Sitzung
```
Lies CLAUDE.md und BRIEF_ABSCHLUSS_2026-11-04_BASIC-NAME-UND-VERSIONSZEILE.md.
2.28.21 ist veröffentlicht (docs/VEROEFFENTLICHUNG-2.28.21.json) – nicht erneut ausgeben.
Offen: Klaus' Rückmeldung zum Basic-Namen am Tablet und zur neuen Versionszeile.
```
