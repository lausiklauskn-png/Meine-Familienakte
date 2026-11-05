# Abschluss: Private Brain Pro Tresor in einem Schritt, Tresor-Leser, Geschenkbox (04./05.11.2026, Nacht)

Claude Code, Fortsetzung nach dem Ein-Schritt-Tresor. Vorgänger: `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-04_TRESOR-EIN-SCHRITT-FAMILIENAKTE.md`.
In der Familienakte selbst wurde **nichts gebaut** und nichts veröffentlicht (nur dieser Brief, CLAUDE.md und die Geschenkbox-Quelle).

## Gebaut

- **Private Brain Pro #130 (auf main nach Klaus' Freibrief 05.11.: „entscheide selbstständig“; Windows-Lauf zuerst rot an einer fremden Lizenz-Probe, Neustart grün; Vorschau https://claude.ai/artifact/48xevPAVyfJXaZJ9BN9BPr):** „Tresor einrichten – nur Speicher wählen …“
  in Zusammenarbeit mit Pro-Apps (nur Android-Brücke). `Vault.find/create/open(tree, base, …)` ab einem Ordner innerhalb der Freigabe,
  `ProTresorordner.baumSetzen(baum, wurzel)`, Entscheidung gerätefrei in `TresorEinrichtung` (JUnit 10). Ein Passwort für Tresor und Ablage
  „Private Brain“ darin; erst prüfen, dann schreiben; eine schon eingerichtete Ablage an anderem Ort zieht nie still um (`VAULT_ANDERER_ORT`).
- **Workflow-PDF-Pro #68 (auf main):** Tresor-Leser `tools/tresor-leser/tresor-leser.html` – Tresor-Ordner wählen, Passwort, Dokumente je Fach
  ansehen/herunterladen, ohne Netz (CSP), nur lesend. Probe mit echtem Testtresor aus dem Paket (`Testtresor.java`). Noch in keiner App verdrahtet.
- **Geschenkbox** (Klaus' Wunsch, Familienakte im Alltag testen): https://claude.ai/artifact/XeUMGuSZ49FzsJYjwQznM7, Quelle
  `docs/geschenk/geschenkbox-pro.html`. Nach Klaus' Liste (05.11.): Familienakte Pro 2.28.25, Workflow PDF Pro 1.0.14/1.0.13, Private Brain
  Pro 1.0.45/1.0.44, je Android, Windows und Browser (Basic: Meine-Familienakte-, Workflow-PDF- und Privat-Brain-Pro-Pages). Nur bereits
  veröffentlichte Fassungen; GitHub-Assets per öffentlicher API geprüft (Name, Größe). Das ältere Repo Privat-Brain ist privat, daher
  Privat-Brain-Pro-Pages als Browser-Fassung. Privat; zum Weitergeben über „Teilen“ freigeben.
- **Hilfe der Familienakte (Klaus 05.11.):** alle Fragen und „Wie suche ich etwas?“ starten zugeklappt; „Demo ansehen“ ganz oben (stand ganz
  unten hinter rund zwanzig offenen Fragen), gesperrt mit Grund („Zuerst im Sicherheitscenter einen Datentresor wählen …“). Probe
  `tests/ui/hilfe-zu` 7 grün, Gegenprobe gefangen; `knoepfe-start` klappt die Suchbeispiele zuerst auf. Erst mit 2.28.26 in der App.
- **Kimhub #439** (auf main): Eintrag `2026-11-04-claude-pb-tresor-ein-schritt-und-tresor-leser`.

## Proben

PB: JUnit `TresorEinrichtungTest` 10 · `test-tresor-ein-schritt` 20 · Gegenprobe 3/3 (ein Fall zuerst am falschen Ort, `native/` statt `www/`) ·
Nachbarn `test-tresor-plan` 24, `test-pro-verbund` 34, `test-tresorordner` 38, Gegenproben 14/0 und 6. `www/` nur teilweise gebaut (OCR-Download
hier gesperrt). Tresor-Leser: 12 grün · Gegenprobe 3/3 (Prüfwert-Fall war blind, jetzt eigene Probe). Nicht geprüft: Android-Übersetzung
(macht die CI), echte SD-Karte, Tablet, Handy-Browser. Kein Ersatzschlüssel-Angebot beim Anlegen.

## Offen

- #130 und #68 sind übernommen; veröffentlichen nur auf Klaus' Wort (Familienakte nächste Fassung 2.28.26).
- Geschenkbox-Tipp zum Tresor nennt den heute veröffentlichten Weg (anlegen in Private Brain Pro, verbinden in der Familienakte); nach den
  nächsten Fassungen auf „nur Speicher wählen“ umstellen.
- PWA-Updateweg per Versionszeile, Seitentitel „Familienakte Pro“ in der PWA, Vollsicherung Android: unverändert offen.

## Stundennachweis

Erste Spur 23:19 UTC (Zweig von main), letzte Spur ca. 23:58 UTC (dieser Commit). Obergrenze aus Git-Spuren, Pausen nicht abgezogen;
ein Neustart des Arbeitsprozesses mittendrin. Klaus' eigene Angabe geht vor. Forschungseintrag: Kimhub #439.

## Startauftrag zum Einfügen

```text
Familienakte & Pro-Tresor – Fortsetzung nach PB-Ein-Schritt und Tresor-Leser (Claude Code)

Repos: lausiklauskn-png/Meine-Familienakte, Workflow-PDF-Pro, BookLedgerPro, Privat-Brain-Pro, Kimhub.
Zuerst lesen: Meine-Familienakte CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-05_PB-TRESOR-LESER-GESCHENKBOX.md. Frisch von origin/main;
Releases prüfen; 2.28.22–2.28.25 nie erneut ausgeben, nächste Fassung 2.28.26.

Als Nächstes:
1. Private Brain Pro #130 und Workflow-PDF-Pro #68 sind auf main. Tresor-Leser in die CI eintragen, dann entscheiden, wie die Apps
   ihn neben den Tresor legen. Familienakte #94 (Hilfe zugeklappt, Demo oben) prüfen/übernehmen, falls noch offen.
2. Tablet-Rückmeldung aus der Geschenkbox (https://claude.ai/artifact/XeUMGuSZ49FzsJYjwQznM7) auswerten; Befunde je App.
3. PWA-Updateweg per Versionszeile prüfen; Seitentitel „Familienakte Pro“ in der PWA mit Klaus klären; Vollsicherung Android stückweise.
4. Veröffentlichungen (Familienakte 2.28.26, BookLedgerPro, Private Brain Pro, Workflow PDF Pro) nur auf Klaus' Wort;
   danach die Geschenkbox auf die neuen Fassungen und den Weg „nur Speicher wählen“ umstellen. Sitzung in Kimhub eintragen.

Nicht tun: Kim-sync nicht einbauen; keine Forschung in App-Repos; Byte-1:1-Bausteine nie von Hand; Tresor-Paket nur in
Workflow PDF Pro ändern; nichts veröffentlichen ohne Klaus' Wort; keine Geräteprüfung behaupten, die nicht stattfand.
```
