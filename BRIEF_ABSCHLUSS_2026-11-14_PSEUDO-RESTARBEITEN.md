# Abschlussbrief 14.11.2026 (Abend) – Pseudo-Fenster: Restarbeiten für 2.28.69 (nicht ausgegeben)

Startauftrag aus `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-14_MASKE-PROFILE-STUFE-C.md`. Erst HTML-Vorschau, dann gebaut (wie in der
Sitzung davor mit Klaus' Freibrief). **Nichts veröffentlicht, Fassung nicht erhöht** – 2.28.69 nur auf Klaus' Wort.

## Ergebnis zuerst

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
**Nicht am Gerät.** Android-/Windows-Hülle nicht geändert.

## Offen

- Am Gerät: Aufträge nach Neustart mit echtem Tresor (Android/Windows), Zwischenablage Text+Bild am Handy, PDF-Seitenbild mit langen
  PDFs, Mistral mit echtem Schlüssel, Austauschordner unter Windows (WebView2: Ordnerwahl ungeprüft; Android-WebView hat keine → nur ZIP).
- Austauschordner merkt nur den Ordner-Griff im Browser-Speicher (IndexedDB), keine Inhalte.
- Nächste Stufen laut Plan: Bezugsdokumente (E), „Alles pseudonymisieren“ (F), Bilder schwärzen (G), Landkarte/Hilfe (H), Sage Gen. 3.
- Mit der Ausgabe 2.28.69: `lib/fassungen.ts`, `lib/app-stand.ts`, Geschenkbox nachziehen.

## Stundennachweis

Sitzung 14.11.2026, erste Spur ca. 20:25 UTC (Lesen, Vorschau ab 20:36), letzte Spur dieses Briefs ca. 21:40 UTC – Obergrenze **1 h 20 min**
(einschließlich Proben). Forschungseintrag nicht angelegt (KimHub nicht in der Sitzung).

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte (eigener Zweig). Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-14_PSEUDO-RESTARBEITEN.md,
docs/PLAN_PSEUDONYMISIEREN.md (Stand 15.11.). Vorschau docs/vorschau/pseudo-auftraege-2.28.69.html.
Auftrag: Rückmeldung von Klaus zum Gerätetest einarbeiten; dann Stufe E-Rest (Bezugsdokumente, vorgeschlagen nach Vorgang/Stelle/Vertrag,
abwählbar, Quellenangabe als Sprung) im Pseudo-Fenster. Kleine Knöpfe, Handy zuerst, gute Kontraste; neue Oberfläche erst als HTML-Vorschau.
Ausgabe 2.28.69 nur auf Klaus' Wort. Nicht: echte Dokumente oder pseudonymisierte Texte ins Repo, keine Schlüssel/PINs.
```
