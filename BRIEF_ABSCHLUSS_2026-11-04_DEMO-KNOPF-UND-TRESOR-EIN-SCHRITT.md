# Abschluss: Demo-Knopf, Tresor in einem Schritt, Paket nachgezogen (04.11.2026, abends)

Claude Code, Fortsetzung nach 2.28.24. Auftrag aus dem Startauftrag des vorigen Abschlusses, im Chat von Klaus ergänzt
(Demo in der Hilfe verstecken; Kim-sync aus der Geräteübergabe nehmen; PWA muss Workflow PDF Pro und Updates wie APK/Windows
können). Codex arbeitete parallel an #89 (PWA aus dem gebauten Paket) – nicht berührt.

## Gebaut

**Familienakte #90** (Zweig `ccr-d81c852d-eimcky`)
- **Demo nur noch als roter Knopf** (Vorschau https://claude.ai/artifact/DkTM3QNsbtfG7CjaSRoSab, Klaus: „in der Hilfe
  verstecken“): Demo aus = oben nichts von „Demo“; gestartet wird sie hinten in der Hilfe („Demo ansehen“). Läuft sie, steht
  direkt hinter „FAMILIENAKTE“ der rote Knopf „DEMO ▾“ mit Menü: Demo verlassen · Demo zurücksetzen · Demo löschen und verlassen.
  Entfallen: Demo-Kasten, Demo-Schalter, DEMO-Schild am Namen (der Name wird am Handy nicht mehr abgeschnitten), Demo-Punkte im
  Handy-Menü, Fußzeilen-Link „Beispieldaten laden“. Dateien `app/demo-knopf.tsx`, Kopfleiste in `app/health-portal.tsx`,
  CSS-Block in `app/globals.css`. Kopfleiste trägt `data-demo-bereit` / `data-demo-beispiele` für die Proben (`tests/ui/_demo.mjs`).
- **Scanner „Durchsuchbar“ ab Werk an** – einmal je Gerät über die Brücke (`fa-wfpdf-bruecke.js` 1c, Marke
  `fa_scan_durchsuchbar_ab_werk_v1`); danach gilt die eigene Wahl. Der Klon bleibt byte-1:1.
- **Ordnerbaum „Wo liegt was?“:** Kasten „Familienakte“ springt zur Dokumentenbibliothek (Hilfe und Sicherheitscenter).
- **Geräteübergabe ohne Kim-sync** (Klaus: „Text allgemeiner machen, Kim-sync raus“): Weg frei wählbar (Datei-Post, Mail,
  USB …), Hinweis, dass das Paket selbst nicht verschlüsselt ist. Doku `docs/GERAETEUEBERGABE.md` nachgezogen.
- **Tresor-Paket** aus Workflow-PDF-Pro 066498d byte-gleich nachgezogen; `tools/tresor-nachziehen.mjs` kennt jetzt
  `Hauptordner`, `UnterAblage`, `HauptordnerTest`. **In der Familienakte noch nicht verdrahtet.**

**Workflow-PDF-Pro #67 (auf main, 066498d; #65 darin aufgegangen und geschlossen)**
- Einstellungen › Tresor & Ablage › **„Tresor einrichten – nur Speicher wählen …“**: Speicher wählen → Hauptordner finden (am
  Inhalt) oder anlegen (Name frei, Vorschlag „Family-Projekt“) → **ein** Passwort für Tresor und eigene Ablage → Einzug →
  `LIES-MICH.txt` im Hauptordner. Fach/Eingang/Verwaltung/mehrere Tresore werden abgewiesen, bevor etwas entsteht; falsches
  Tresor-Passwort darf neu versucht werden, nichts geschrieben; alte Ablage mit anderem Passwort → klare Meldung, nichts verändert.
- **„Speichern unter“ in den Tresor gesperrt** statt gefragt (auch Ersatzschlüssel-Datei), erkannt am Inhalt der Ordner über
  dem Ziel – der Rest der SD-Karte bleibt frei, auch wenn der ganze Speicher freigegeben ist.
- Paket: `Hauptordner.liesMich*`, `SafAblage.kennung`, Pins neu. Windows hat den Ein-Schritt-Weg noch nicht.

**BookLedgerPro #453, Private Brain Pro #129** (Entwürfe): dasselbe Paket byte-gleich nachgezogen, nicht verdrahtet.

## Nicht gebaut (bewusst, mit Grund)

- **Vollsicherung auf Android:** die Android-Dateiausgabe (`WorkflowFiles`, `app/dateiausgabe.ts`) nimmt höchstens 20 MB je
  Datei; eine Vollsicherung mit PDFs ist größer. Braucht einen eigenen, stückweise schreibenden Weg (z. B. Zielordner per
  Ordnerwahl und nativer Schreibweg). Nicht halb gebaut.
- **Geräteliste aus Kim-sync:** Kim-sync gibt anderen Apps keine Geräte heraus. Klaus nach Rückfrage: Kim-sync ist noch nicht
  die App, von der er sich etwas verspricht → Kim-sync bleibt draußen. Im Kim-sync-Repo wurde nichts geändert (nur gelesen).
- **PWA-Updates / Workflow PDF in der PWA:** wartet, bis Codex #89 abgeschlossen hat (Klaus: „Codex ist noch nicht ganz fertig“).
- **Tablet-Rückmeldung zu 2.28.23/2.28.24:** noch nicht abgeholt.

## Proben

- Familienakte: `npm run build`, `check:herkunft` grün. UI im Behälter grün: demo-tresor-status 10, demo-workspace 15,
  knoepfe-leer 25, knoepfe-start 35, knoepfe-sicherheit 33, pro-uebergabe 4, pro-verbund 8, workflow-pdf-bruecke 11,
  pro-tresor 21. Gegenprobe: Vorgabe „durchsuchbar“ auf aus → genau diese Zeile rot. geraetetransport ist im Behälter 6 rot
  (Browser schließt), auf unverändertem main genauso – CI entscheidet.
- Workflow PDF Pro: JVM HauptordnerTest 10, TresorOrdnerTest 15, OrdnerWahlTest 8 · test-tresorordner 15, weitere native Web
  30 · Gegenprobe 4 neue Fälle gefangen · CI auf main-Stand alle grün (erster Android-Bau scheiterte an einem
  Kompilierfehler `JSONException`, behoben).
- BookLedgerPro `test-native` 62 grün. Private Brain Pro: Pin-Prüfung grün, Browser-Probe im Behälter nicht lauffähig.

## Grenzen

Nichts am Tablet oder Windows-Rechner geprüft. Der Ein-Schritt-Weg ist nur in Workflow PDF Pro (Android) verdrahtet; in
Familienakte, BookLedgerPro und Private Brain Pro liegt nur das Paket. Nichts veröffentlicht; nächste freie Fassung 2.28.25.

## Stundennachweis

Gemessen an Git-Spuren dieser Sitzung: erste Spur 19:01 UTC (Checkout Familienakte), letzte Spur beim Abschluss-Commit
(Zeit im Kimhub-Eintrag). Einschließlich CI-Wartezeiten, Pausen nicht abgezogen; Obergrenze. Forschung und genaue Zeit:
Kimhub `forschung/sitzungen.json`, Eintrag `2026-11-04-claude-demo-knopf-tresor-ein-schritt`. Klaus' eigene Angabe geht vor.

## Startauftrag zum Einfügen

```text
Familienakte & Pro-Tresor – Fortsetzung nach dem Demo-Knopf (Claude Code)

Repos: lausiklauskn-png/Meine-Familienakte, Workflow-PDF-Pro, BookLedgerPro, Privat-Brain-Pro, Kimhub.
Zuerst lesen: Meine-Familienakte CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-04_DEMO-KNOPF-UND-TRESOR-EIN-SCHRITT.md,
BRIEF_CODEX_2026-11-04_NACH-2.28.24.md, Workflow-PDF-Pro docs/TRESORORDNER.md (letzter Abschnitt).
Frisch von origin/main abzweigen; Releases prüfen; 2.28.22–2.28.24 nie erneut ausgeben, nächste Fassung 2.28.25.
Offene Codex-PRs zuerst prüfen (#89 PWA-Paket).

Als Nächstes:
1. Status von Familienakte #90, BookLedgerPro #453, Private Brain Pro #129 prüfen (CI grün → übernehmen, falls noch offen).
2. Ein-Schritt-Weg „Tresor einrichten – nur Speicher wählen“ in der Familienakte (Android) verdrahten, Vorbild
   Workflow-PDF-Pro ProVaultPlugin.tresorEinrichten; Familienakte darf einen neuen Tresor anlegen (Klaus' Ja vom 04.11.).
   Danach BookLedgerPro und Private Brain Pro. Oberfläche erst als HTML-Vorschau.
3. PWA (nach Codex #89): Aktualisieren-Knopf oben und Workflow PDF in der PWA prüfen, Updates wie bei APK/Windows.
4. Vollsicherung auf Android: stückweise in einen gewählten Ordner (20-MB-Grenze der Dateiausgabe umgehen).
5. Tablet-Rückmeldung zu 2.28.23/2.28.24 und zum Demo-Knopf abholen.
6. Veröffentlichung 2.28.25 nur auf Klaus' Wort. Sitzung am Ende in Kimhub eintragen.

Nicht tun: Kim-sync nicht in die Familienakte einbauen (Klaus 04.11.); keine Forschung in App-Repos;
Byte-1:1-Bausteine nie von Hand; Tresor-Paket nur in Workflow PDF Pro ändern; nichts veröffentlichen ohne Klaus' Wort;
keine Geräteprüfung behaupten, die nicht stattfand.
```
