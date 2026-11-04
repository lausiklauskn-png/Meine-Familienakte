# Abschluss: Tresor in einem Schritt in der Familienakte (04.11.2026, spät)

Claude Code, Fortsetzung nach 2.28.25. Vorgänger: `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-04_DEMO-KNOPF-UND-TRESOR-EIN-SCHRITT.md`.

## Gebaut

- **#91 übernommen** (Nachweis 2.28.25 der vorigen Sitzung, CI grün).
- **#92 (Entwurf, wartet auf Klaus' Ja zur Vorschau https://claude.ai/artifact/M6FxJcNQF5GugVvwrqgPv9):**
  Sicherheitscenter › Gemeinsamer Pro-Tresor zeigt auf Android **„Tresor einrichten – nur Speicher wählen …“**.
  Speicher wählen → Tresor am Inhalt finden (auch „Privat Brain Pro Hauptablageordner“) oder Hauptordner anlegen
  (Name frei, Vorschlag „Family-Projekt“) → ein Passwort-Fenster → `LIES-MICH.txt`. Familienakte legt jetzt selbst einen
  Tresor an (Klaus 04.11.). Abgewiesen, bevor etwas entsteht: Ordner im Tresor, mehrere Tresore, ungültiger oder belegter
  Name, Passwort < 10 Zeichen; falsches Passwort → Fenster bleibt offen, nichts geschrieben.
  Logik gerätefrei in `ProTresorAdapter.einrichtenPruefen/einrichten`, Plugin (`FamilienakteTresorPlugin.einrichten`) nur
  Speicherwahl und Fenster. Gemerkt wird zusätzlich der Hauptordner-Pfad (`pfad`, über `UnterAblage`); alte Verbindungen
  (Pfad leer) unverändert. Windows behält „Vorhandenen Pro-Tresor verbinden“.

## Proben

JVM `tools/native/test-pro-tresor.mjs` grün (neuer Block Ein-Schritt-Tresor) · Gegenprobe von Hand 4/4 gefangen (ein
Eingriff traf zuerst seinen Anker nicht – erst mit Ankerprüfung gemessen) · UI `pro-tresor-einrichten` 9, `pro-tresor` 21,
`pwa` 13 grün · `npm run build`, `check:herkunft` grün. Das Plugin übersetzt erst die Android-CI (kein SDK im Behälter).

## Nicht gebaut / offen

- BookLedgerPro und Private Brain Pro: Ein-Schritt-Weg nicht verdrahtet (erst nach Klaus' Ja zu #92, gleicher Aufbau).
- PWA: Service Worker, Offline-Start und Versionszeile geprüft; ein Updateweg per Tipp auf die Versionszeile in der PWA
  ist nicht geprüft. Befund: offline gestartete PWA trägt den Seitentitel „Familienakte Pro“ (Manifest: „Basic“), nicht geändert.
- Vollsicherung auf Android (20-MB-Grenze): nicht gebaut.
- Kein Ersatzschlüssel-Angebot beim Anlegen eines neuen Tresors.
- Tablet-Rückmeldung zu 2.28.25: nicht abgeholt. Nichts am Gerät geprüft, nichts veröffentlicht; nächste Fassung 2.28.26.

## Stundennachweis

Erste Spur 21:56 UTC (Zweig von main), letzte Spur ca. 22:25 UTC (dieser Commit). Obergrenze aus Git-Spuren, Pausen nicht
abgezogen; Klaus' eigene Angabe geht vor. Forschungseintrag: Kimhub #437, `2026-11-04-claude-familienakte-tresor-ein-schritt`.

## Startauftrag zum Einfügen

```text
Familienakte & Pro-Tresor – Fortsetzung nach dem Ein-Schritt-Tresor (Claude Code)

Repos: lausiklauskn-png/Meine-Familienakte, Workflow-PDF-Pro, BookLedgerPro, Privat-Brain-Pro, Kimhub.
Zuerst lesen: Meine-Familienakte CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-04_TRESOR-EIN-SCHRITT-FAMILIENAKTE.md,
BRIEF_CODEX_2026-11-04_NACH-2.28.24.md. Frisch von origin/main; Releases prüfen; 2.28.22–2.28.25 nie erneut ausgeben,
nächste Fassung 2.28.26. Offene Codex-PRs zuerst prüfen.

Als Nächstes:
1. Familienakte #92 (Entwurf): Android-CI prüfen; Klaus' Antwort zur Vorschau https://claude.ai/artifact/M6FxJcNQF5GugVvwrqgPv9
   abholen; bei Ja übernehmen.
2. Danach denselben Ein-Schritt-Weg in BookLedgerPro und Private Brain Pro (Vorbild Workflow PDF Pro tresorEinrichten).
3. PWA: Updateweg per Tipp auf die Versionszeile prüfen; Seitentitel „Familienakte Pro“ in der PWA mit Klaus klären.
4. Vollsicherung auf Android stückweise in einen gewählten Ordner.
5. Tablet-Rückmeldung zu 2.28.25 abholen. Veröffentlichung 2.28.26 nur auf Klaus' Wort. Sitzung in Kimhub eintragen.

Nicht tun: Kim-sync nicht einbauen; keine Forschung in App-Repos; Byte-1:1-Bausteine nie von Hand; Tresor-Paket nur in
Workflow PDF Pro ändern; nichts veröffentlichen ohne Klaus' Wort; keine Geräteprüfung behaupten, die nicht stattfand.
```
