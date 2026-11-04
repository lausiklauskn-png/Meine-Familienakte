# Abschluss: Handy-Oberfläche, Tresor-Erklärungen, Aus-/Einloggen – 2.28.23 (04.11.2026)

Claude Code, Sitzung „Tresor-Ordnerstruktur organisation“. Auftrag kam schrittweise im Chat von Klaus, mit Bildern vom Tablet.
Grundlage: Codex' 2.28.22 (#81, #83) und dessen Übergabe (`BRIEF_ABSCHLUSS_2026-11-04_DEMO-RAHMEN-UND-TRESORSTATUS.md`).
Codex hat nach #81 keine Oberflächenänderungen mehr gemacht; keine Überschneidung.

## Gebaut (Familienakte #84, auf main `95586e8`)

- **Erklärungen hinter Fragezeichen:** Gemeinsamer Pro-Tresor, Zusammenarbeit mit Pro-Apps, Lokaler Browserspeicher,
  Geräteübergabe. „Wo liegt was?“ als Ordnerbaum (`app/ablaufbild.tsx`, `app/pro-tresor-hilfe.tsx`) mit drei Merkpunkten
  und Pfadangabe; „Tresor-Hauptordner“ und „Verbinden …“ springen zum Verbinden-Knopf. Kein Personenname in der Oberfläche
  (vorher „bei Klaus: SD-Karte …“).
- **Geräteübergabe** als sechs verbundene Schritte (`app/pro-geraetetransport-panel.tsx`), Felder in den Kästchen,
  „Dieses Gerät“ / „Anderes Gerät“. Beschriftungen und Knopftexte unverändert.
- **Hinweisfenster am Fragezeichen** (`InfoPopover`, `app/ui-controls.tsx`): Portal am `<body>`, folgt dem Knopf beim Rollen,
  liegt über allen Karten, derselbe Knopf schließt. Vorher stand es am Handy unten am Bildschirm und wurde überdeckt.
- **Kopfleiste am Handy:** Logo links, Menü rechts (30 px), „FAMILIENAKTE“ oben, Variante und Nummer darunter
  (`Version ` nur für Vorleser). Drucken, Aus-/Einloggen, Installieren im Menü (nur bei offenem Menü erzeugt).
  Demo als Schalter oben (rot „DEMO“ = an), Zurücksetzen/Löschen im Menü; am großen Bildschirm bleibt der Demo-Kasten.
- **Suchfeld** ohne Unterzeile; Mikrofon-Hinweis nur noch als Tipp-Text.
- **Drucken in Android:** `FamilienakteDruckPlugin` (Androids Druckdienst, auch „Als PDF speichern“); die WebView
  führt `window.print()` nicht aus.
- **Aus-/Einloggen** (`app/anmelde-knopf.tsx`): Ausloggen sperrt den Pro-Tresor und lädt neu (vorher nur Neuladen, der
  Tresor blieb in der App offen). Bei gesperrtem Tresor „Einloggen“ (Pfeil hinein) → Passwort im nativen Fenster.
  Ohne Pro-Tresor (PWA) nur Neuladen.

## Gemeinsamer Tresor (Workflow-PDF-Pro #65, Entwurf, CI grün)

`Hauptordner.java` + `UnterAblage.java` im Paket `de.familyprojekt.tresor`: Nutzer wählt nur den Speicher; Tresor wird am
Inhalt (`tresorordner.json`) erkannt, Name frei (Vorschlag „Family-Projekt“); Fächer/Eingänge/Verwaltung nie als Speicher;
mehrere Tresore → nicht raten; nie in einen Ordner mit Inhalt. JVM `HauptordnerTest` 9 + `TresorOrdnerTest` 15 grün,
Gegenprobe 6/6. **In keiner App verdrahtet** – nächster Schritt.

## Proben

- `npm run build`, `npm run check`, `npm run check:herkunft` grün.
- CI auf dem Merge-Stand: alle 44 Oberflächenproben, Android- und Windows-Bau, Android-Aktensuche (zweiter Anlauf; im
  ersten fuhr der Emulator nicht hoch, keine Probe lief), Geräteübergabe-Gegenproben.
- Neu: Ausloggen sperrt / Einloggen entsperrt (`tests/ui/pro-tresor.test.mjs`); Gegenprobe ohne Sperr-Aufruf → rot.
- Angepasst (gewollte Änderung): Fragezeichen-Fachprobe (Testdoubles `useLayoutEffect`/`createPortal`), Handy-Demo-Proben
  auf den Schalter, Dateieingang findet das Suchfeld über die Beschriftung.
- Im Behälter ist `pro-dokumente` auch auf unverändertem main rot (Browser schließt beim Neuladen); in der CI grün.

## Veröffentlicht (Klaus' Wort vom 04.11.: Android und Windows, mit Update-Server)

Nachweis `docs/VEROEFFENTLICHUNG-2.28.23.json`. Beide Läufe von main `95586e8`, je mit Update-Server (family-projekt.de,
unterschrieben, von außen geprüft). Downloads anonym geladen, SHA-256 gleich `SHA256SUMS`:

| Ausgabe | Lauf | Größe | SHA-256 |
|---|---|---|---|
| [Android-APK](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/download/android-v2.28.23/Familienakte-android-v2.28.23.apk) | 41856008597 | 19.808.213 B | `7c1e9362…2e3f` |
| Einzeldatei (HTML) | 41856008597 | 3.329.511 B | `5a9d122c…c16e` |
| [Windows-Setup](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/download/windows-v2.28.23/Familienakte-Windows-2.28.23-x64-setup.exe) | 41856014812 | 33.954.692 B | `021de56b…4196` |

Die PWA kommt über Pages. Diese Fassung nicht erneut ausgeben.

## Grenzen

- Nichts am Tablet oder Windows-Rechner geprüft; Drucken über den Android-Druckdienst nicht am Gerät gedruckt.
- Sprünge „Familienakte → Dokumentenbibliothek“ und „andere Pro-Apps öffnen“ im Ordnerbaum nicht verdrahtet.
- Die sechs Gerätefälle aus #70 und die SD-Prüfung bleiben offen.

## Stundennachweis

Erste Spur dieser Sitzung etwa 11:20 UTC (Antwort auf die Tresor-Frage), letzte Spur nach der Veröffentlichung etwa 15:45 UTC;
Obergrenze rund 4 h 25 min einschließlich CI-Wartezeiten. Die genaue Zeit gehört nach Kimhub (Regel); Kimhub war in dieser
Sitzung nicht angehängt – in der nächsten Sitzung dort nachtragen. Klaus' eigene Angabe geht vor.

## Startauftrag zum Einfügen

```text
Familienakte & Pro-Tresor – Fortsetzung nach 2.28.23 (Claude Code, 04.11.2026)

Repos: lausiklauskn-png/Meine-Familienakte, Workflow-PDF-Pro, BookLedgerPro, Privat-Brain-Pro.
Zuerst lesen: Meine-Familienakte CLAUDE.md und BRIEF_ABSCHLUSS_2026-11-04_HANDY-UND-TRESOR-ERKLAERUNGEN.md,
Workflow-PDF-Pro PR #65 und docs/TRESORORDNER.md (letzter Abschnitt). Frisch von origin/main abzweigen;
tatsächliche Releases prüfen, veröffentlichte Fassungen nie erneut ausgeben. Offene Codex-PRs/Zweige zuerst prüfen.

Als Nächstes (Reihenfolge)
1. WPP: Ordnerwahl auf Hauptordner umstellen; eigene Ablage und Einzug in EINEM Schritt mit EINEM Passwort;
   „Speichern unter“ in den Tresor sperren statt fragen; Lies-mich-Datei im Hauptordner. Danach #65 fertig machen.
2. Paket nachziehen: Familienakte (tools/tresor-nachziehen.mjs), BookLedgerPro, Private Brain Pro.
   Familienakte darf einen neuen Tresor anlegen (Klaus' Ja vom 04.11.).
3. Familienakte: „Durchsuchbar“ im Scanner ab Werk an (nur über die Brücke); Vollsicherung auf Android.
4. Familienakte: Sprünge im Ordnerbaum verdrahten; weitere Ablaufbilder nur nach HTML-Vorschau und Klaus' Ja.
5. Klaus' Tablet-Rückmeldung zu 2.28.23 abholen (Kopfleiste, Fragezeichen, Drucken, Aus-/Einloggen, Demo-Schalter).
6. Zeit dieser und der neuen Sitzung in Kimhub nachtragen.

Danach (Klaus): alle Pro-Apps deinstallieren, alten Hauptablageordner löschen, mit den neuen Fassungen frische
Tresorräume anlegen. Vorher wichtige PDFs außerhalb des Tresors sichern lassen.

Nicht tun: keine Forschung in App-Repos; Byte-1:1-Bausteine nie von Hand; Tresor-Paket nur in Workflow PDF Pro;
nichts veröffentlichen ohne Klaus' Wort; keine Geräteprüfung behaupten, die nicht stattfand.
```
