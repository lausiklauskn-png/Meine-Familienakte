# Abschluss 08.11.2026: Prüfbericht, Plan Abgleich und Stufe A (Zusammenführen) – Fassung 2.28.40

Sitzung auf Klaus' Frage: „Was ist notwendig, damit die App arbeitet?“ Zuerst nur der Bericht (nichts gebaut). Danach hat Klaus alle
Fragen beantwortet, den Plan freigegeben und einen **Freibrief** erteilt: ohne Rückfrage umsetzen, Fragen selbst nach Logik und
Benutzerfreundlichkeit entscheiden, je Stufe mindestens die PWA ausgeben.

## Prüfbericht (Kurzfassung)

- Vorhanden: Scannen mit Stapel und Kantenerkennung (von Klaus mit echtem Beleg geprüft), OCR offline, Einordnungs-Vorschläge,
  Dublettenprüfung, Wortsuche, Bedeutungssuche (nur Android/Windows), Erinnerungen und Glocke, Teilen an die App, Drucken,
  SD/USB über den Ordnerdialog, Vollsicherung, Pro-Tresor.
- Fehlte: Abgleich zwischen Geräten (jeder Weg), Einlesen in eine benutzte Akte, Wiedererkennen der Festplatte, dauerhaft gemerkter
  Sicherungsordner, Massenimport (Analyse läuft für alle Dateien zugleich, keine Speicherprüfung), Bedeutungssuche in der PWA und
  für Scans, Kalender nur in eine Richtung (die App schreibt, liest aber nicht ein), Original-Foto im Stapel wird nicht behalten.
- GoBD: für Privatunterlagen meist nicht anwendbar. Für Belege die Regel aus BookLedgerPro übernehmen („Scan + Original behalten“,
  Original-Foto mit Prüfsumme daneben) – Stufe H.

## Was getan wurde (PR #131)

- `docs/PLAN_2026-11-08_ABGLEICH.md`: Entscheidungen 1–12, Kalender beidseitig, Stufen A–I. Punkt 10 im alten Plan und CLAUDE.md
  verweisen darauf.
- **Stufe A** `lib/abgleich.ts`: Zusammenführen-Kern, rein und ohne Dateizugriff.
  - Gleiche Kennung = derselbe Eintrag. Laufende Nummern (`PER-000001`) zählen nur bei gleicher Anlagezeit als derselbe; sonst
    neue Nummer, Verweise wandern mit, ein späterer Abgleich findet ihn über Art + Anlagezeit wieder.
  - Mit gemerktem Stand (`basisAus`): nur eine Seite geändert → still, beide → Frage. Ohne gemerkten Stand ist jeder Unterschied
    eine Frage; vorgewählt die jüngere Änderung.
  - Gleiche Prüfsumme = dieselbe Datei. Nichts wird gelöscht. Protokolle vereinigt.
- **Sicherung einlesen** führt in eine benutzte Akte zusammen (`sicherungZusammenfuehren` in `app/local-vault.ts`, Fenster
  `app/sicherung-einlesen.tsx`): „Was kommt dazu?“, Wahl je Unterschied, „Alle: meine“/„Alle: aus der Sicherung“; vorhandene
  Dateien nie ersetzt; Revision vor dem Schreiben geprüft; Register vorher gesichert.
- Hilfe (Umzug, Aktensicherung, Sicherheitscenter), Landkarte (`sicherungsordner`, `aus-sicherung` golden), Versionshistorie.

## Geprüft

- `scripts/run-abgleich-tests.mjs` 8 grün (in `build` und `check` aufgenommen); `npm run build`, `npm run check` grün; Lint 0 Fehler.
- UI: `sicherung-einlesen` 8/0, `sicherung-warnung` 4/0, `vollsicherung` 6/0, `app-landkarte` 48/0, `hilfe-alle` 30/0, `demo-kopie` 7/0.
- Am Gerät ungeprüft.

## Ausgabe

- Nur die **PWA** (Pages beim Zusammenführen auf main). APK und Windows bleiben auf 2.28.39; die Versionsdateien stehen schon auf
  2.28.40 – die nächste native Ausgabe nimmt die dann nächste freie Fassung (erst Releases prüfen).

## Offen

- Gemerkter Stand je Partner kommt mit Stufe C; bis dahin ist beim Einlesen jeder Unterschied eine Frage.
- `inventoryItems` (Bestandsanalyse) gleicht der Kern bewusst nicht ab, sie bleiben je Gerät.
- KimHub-Eintrag dieser Sitzung nicht angelegt (KimHub nicht in der Sitzung).

## Stundennachweis

Spanne aus Nachrichten- und Commitzeiten (UTC), Obergrenze, Pausen nicht abgezogen; Klaus' eigene Angabe geht vor.

| Block | Inhalt | Dauer |
|---|---|---|
| 1 | Prüfung des Repos (drei Suchhelfer), Bericht, GoBD-Abgleich mit BookLedgerPro, Fragen | ca. 60 min |
| 2 | Plan schreiben, Kern `lib/abgleich.ts` mit Proben | ca. 30 min |
| 3 | Einlesen mit Zusammenführen, Fenster, Hilfe, UI-Proben, Bau, PR | ca. 40 min |

## Startauftrag zum Einfügen

```
Familienakte – Stufe B des Plans Abgleich, Brief vom 08.11.2026.
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, docs/PLAN_2026-11-08_ABGLEICH.md (Freibrief: ohne Rückfrage umsetzen), BRIEF_ABSCHLUSS_2026-11-08_ABGLEICH-A.md.
Erst die tatsächlichen Releases prüfen; nächste freie Fassung nehmen (Versionsdateien stehen auf 2.28.40, PWA 2.28.40 ist aus).

Stufe B bauen:
- Vollsicherung verschlüsselt (AES-GCM-256, PBKDF2-SHA256 600 000 Runden, Passwort ≥ 10 Zeichen; vorhandene Technik in
  BookLedgerPro src/core/crypto.js bzw. Private Brain Pro VaultCrypto wiederverwenden), mit Notfallblatt zum Ausdrucken.
- Lesbare Vollsicherung bleibt wählbar, an jedem Ort, mit deutlichem Hinweis.
- Einlesen erkennt verschlüsselte Sicherungen, fragt das Passwort, dann Probe und Zusammenführen wie Stufe A (lib/abgleich.ts).
- Erinnerung „lange nicht gesichert“ nach 7 Tagen. „Papierkorb leeren“: archivierte Dokumente endgültig löschen, nur von Hand.
Ausgabe: PWA, APK und Windows (Klaus' Freibrief). Danach Stufe C laut Plan.

Regeln: Je Paket ein Commit; Lint vor dem Push; keine Prüfungen abschalten. Proben mit soll() (step() wertet Text als grün).
Nicht: Schlüssel/Tokens in Dateien oder Chat, Forschung im Repo (nur KimHub).
Am Ende Abschlussbrief mit Stundennachweis und Startauftrag für die nächste Stufe; im Plan die Stufe abhaken.
```
