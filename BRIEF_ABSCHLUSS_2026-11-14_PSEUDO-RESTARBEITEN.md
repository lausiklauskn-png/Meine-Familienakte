# Abschlussbrief 14.11.2026 (Abend) – Pseudo-Fenster: Restarbeiten, ausgegeben als 2.28.69

Startauftrag aus `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-14_MASKE-PROFILE-STUFE-C.md`. Erst HTML-Vorschau, dann gebaut (wie in der
Sitzung davor mit Klaus' Freibrief). Auf Klaus' Wort („wenn CI grün, zusammenführen – danach als 2.28.69 ausgeben“) **als Fassung 2.28.69 ausgegeben**.

## Ergebnis zuerst

- **2.28.69 ausgegeben** (#186 auf main a4bb305; Android und Windows mit `server=ja`, PWA über Pages). Nachweis
  `docs/VEROEFFENTLICHUNG-2.28.69.json`: APK 20,2 MB, Einzeldatei, Windows-Setup 34,4 MB – anonym geladen, SHA-256 = SHA256SUMS,
  `version.json` in der APK 2.28.69/a4bb305, `latest.json` 2.28.69. github.io aus dem Behälter gesperrt (403), PWA nur über die Pages-Läufe belegt.
- **Geschenkbox** Version 30 (Artefakt XeUMGuSZ49FzsJYjwQznM7) mit Familienakte 2.28.69 und neu gebauter Landkarte; Grundlage war der
  Live-Stand (Datei-Organizer 0.4.4 – die Datei im Repo stand noch auf 0.4.3 und ist nachgezogen). HTML-Datei im Chat.
- **CI-Funde vor der Ausgabe** (alle behoben, keiner in der App): ESLint (ungenutzte Eigenschaft), Windows-Konsole cp1252 in der
  ZIP-Probe, Wettlauf in der UI-Probe ZIP. Codex-Kommentare („Failed“/Nutzungsgrenze) ausgelassen.

- **Vorschau** `docs/vorschau/pseudo-auftraege-2.28.69.html` (https://claude.ai/artifact/C2TRFwoNiHrtMHYJiFZGNn, Version 2, erfundene Daten).
  Klaus' Rückmeldung während der Sitzung: Kontraste der KI-Knöpfe zu schwach (Mistral im dunklen Modus unlesbar) → Version 2 und App mit
  kräftigeren Farben (Verlauf hell → satt, 1,5 px Rand, dunkle Schrift; dunkler Modus eigene Farben).
- **1 Zuordnung je Auftrag (P10):** `lib/pseudo-auftraege.ts` + `app/pseudo-auftrag-speicher.ts`. AES-GCM-256, Schlüssel per HKDF aus
  dem Geheimnis der eigenen Profile (Pro-Tresor oder App-Speicher), Ablage verschlüsselt auf dem Gerät; Tresor gesperrt → nichts lesbar;
  Basic/Demo nur bis zum Schließen. 90 Tage, höchstens 50, „✓ erledigt“ löscht sofort. Jeder Weg hinaus legt A1, A2 … an.
  „2 Zurück“: Liste klein, Antwort findet ihren Auftrag selbst (meiste bekannte Platzhalter).
- **2 „An KI“:** Bibliothekszeile (Knopf „KI“ neben dem Auge), Auswahl-Leiste Bibliothek und Eingang, jeder Eingang (Arbeitsdatei über
  `eingangDatei` – die Dateien im Eingang sind nach dem Neuladen nur Angaben, nicht der Inhalt; Befund aus der Probe).
- **3 Briefweg:** `app/brief-antwort.tsx` nur noch Einstieg ins Fenster (Unterlage wählen). Fenster neu: Mistral (EU) mit eigenem
  Schlüssel nach Rückfrage (einziger Netzweg, eigene Datei `app/mistral-senden.ts`, Probe prüft „nur Mistral“), Direktlink mit Text in der
  Adresse, „Als Entwurf“, „PDF“, Betreffzeile wird abgetrennt. **Verhaltensänderung:** Beträge und Daten bleiben jetzt lesbar (Maske, P9);
  der alte Briefweg hatte sie verdeckt.
- **4 Ansicht bei PDF:** echtes Seitenbild (pdf.js aus dem Paket), Kästen aus der Textlage (`lib/pdf-kaesten.ts`, Werte über mehrere
  Textstücke), „KI sieht“ schwarz mit Platzhalter, „Original“ gelb, Kasten antippen = darf bleiben; „Text“ als Rückfall, Scan schaltet um.
- **5 Kleinigkeiten:** „Als Datei“ mit Wahl Textdatei / ZIP (`lib/zip-schreiben.ts`, ohne Bibliothek) / Austauschordner (nur wo der
  Browser Ordner wählen kann; `auftraege/<datum>-A<n>/`, „Antworten holen“ liest `antwort.md`). Zwischenablage: nachgelesen, ob Text und
  Bild angekommen sind, sonst „Bild extra kopieren“. Kennungen D01 … zählen nach dem Entfernen weiter (vorher doppelt möglich).

## Proben

`run-pseudo-auftraege-tests` 12 grün (neu, in build/check) · `run-maske-tests` grün (Netzweg-Probe erweitert) · `npm run check` grün ·
`tsc` grün · `npm run build` grün · `check:herkunft` grün · UI: `pseudo-auftraege` 11/11 (neu: Neuladen, erledigt, Mistral gestellt, PDF-Kästen,
ZIP, Eingang mit Mail+Anlage, Assistenz am Handy), `rueckmeldung-d` 9/9 (auf das Fenster umgestellt), `pseudo-knopf` 18/18,
`maske-profile` 10/10, `menue-breite` 31/31, `kopf-leiste` 30/30, `knoepfe-assistenz` 22/22, `knoepfe-dokumente` 26/26,
`auswahl-leiste` 7/7, `aussortiert` 19/19, `sammelablage` 12/12, `eingang-pruefung` 16/16, `dateieingang` 76/76, `teilen-original` 4/4.
**Nicht am Gerät.** Android-/Windows-Hülle nicht geändert. CI auf #186 (2b1b8d6): pruefung (117 UI-Proben), android, windows,
webview, product (31, pixel_c), product (35, pixel_2) – alle grün.

## Offen

- Am Gerät: Aufträge nach Neustart mit echtem Tresor (Android/Windows), Zwischenablage Text+Bild am Handy, PDF-Seitenbild mit langen
  PDFs, Mistral mit echtem Schlüssel, Austauschordner unter Windows (WebView2: Ordnerwahl ungeprüft; Android-WebView hat keine → nur ZIP).
- Austauschordner merkt nur den Ordner-Griff im Browser-Speicher (IndexedDB), keine Inhalte.
- Nächste Stufen laut Plan: Bezugsdokumente (E), „Alles pseudonymisieren“ (F), Bilder schwärzen (G), Landkarte/Hilfe (H), Sage Gen. 3.
- Nächste freie Fassung **2.28.70**.

## Stundennachweis

Sitzung 14.11.2026, erste Spur ca. 20:25 UTC (Lesen; erste Datei im Arbeitsordner 20:36), letzter Commit der Ausgabe-Unterlagen 23:01 UTC
(gemessen, f1b2aa7) – Obergrenze **2 h 36 min** (einschließlich Warten auf CI und Ausgabe, Pausen nicht abgezogen). Forschungseintrag in KimHub
(`forschung/messungen/familienakte-2026-11-14-pseudo-restarbeiten-2-28-69.md`).

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte (eigener Zweig). Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-14_PSEUDO-RESTARBEITEN.md,
docs/PLAN_PSEUDONYMISIEREN.md (Stand 15.11.). Vorschau docs/vorschau/pseudo-auftraege-2.28.69.html.
Auftrag: Rückmeldung von Klaus zum Gerätetest von 2.28.69 einarbeiten; dann Stufe E-Rest (Bezugsdokumente, vorgeschlagen nach Vorgang/Stelle/Vertrag,
abwählbar, Quellenangabe als Sprung) im Pseudo-Fenster. Kleine Knöpfe, Handy zuerst, gute Kontraste; neue Oberfläche erst als HTML-Vorschau.
Nächste Ausgabe (2.28.70) nur auf Klaus' Wort. Nicht: echte Dokumente oder pseudonymisierte Texte ins Repo, keine Schlüssel/PINs.
```
