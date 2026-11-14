# Abschlussbrief 14.11.2026 – Stufe C: Profile für die Maske (nicht ausgegeben)

Startauftrag aus `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-14_PSEUDO-2.28.68.md`, mit Klaus' Freibrief (14.11.: „selbstständiges Merken und
Beenden der Aufgabe, soweit es möglich ist in dieser Sitzung“). Erst HTML-Vorschau, dann gebaut. **Nichts veröffentlicht**, Fassung nicht erhöht.

## Ergebnis zuerst

- **Vorschau** `docs/vorschau/maske-profile-stufe-c.html` (Artefakt https://claude.ai/artifact/VkEA57UKaH2DBn3zd7RRz7, erfundene Daten):
  Profilseite, erster Start, Übernehmen, Korrigieren, Speicherort, fünf Entscheidungen.
- **Workflow PDF Pro #77** (Quelle des Tresor-Pakets): gemeinsames Fach `profile` (Ordner „Maske-Profile“, `Fach.istGemeinsam()`) und
  `Profile.java` (je App eine eigene Datei, alle lesen alle, neueste gilt, nichts gelöscht, 1 MiB, Prüfsumme, beschädigte Datei hält andere
  nicht auf). JUnit 16 grün, Gegenprobe Profil 4/4. Byte-gleich in die Familienakte (`tools/tresor-nachziehen.mjs` kennt `Profile`).
- **Familienakte:** `lib/maske-profil.ts` (Kern, kein Netzweg), `lib/maske.ts` (`feste` Platzhalter), `app/maske-profil-speicher.ts`
  (Tresor/App-Speicher/gesperrt/Basic), `app/maske-profile.tsx` (Sicherheitscenter), Pseudo-Fenster mit Profilen und „Korrigieren → ins
  Profil“, nativ `profilLesen`/`profilSchreiben` (Android-Plugin, `ProTresorAdapter`, Windows-Engine, `pro_tresor.rs`, Windows-Brücke),
  Datenschutzseite Abschnitt 3, Plan-Stand.

## Nachtrag: Pseudo-Fenster nach dem Muster PseudoDoc (gleiche Sitzung, mit Klaus)

Klaus wollte die verdeckten Stellen im Dokument sehen statt in einer langen Liste, dann PseudoDoc als Muster (einfach, Handy zuerst,
kleine Knöpfe), einen einzigen KI-Knopf mit Wahl, blasse Farben mit Verlauf, gute Kontraste, das PseudoDoc-Zeichen und einen
Briefumschlag „Brief mit KI schreiben“. Vorschau `docs/vorschau/pseudo-ansicht-kompakt.html` (https://claude.ai/artifact/RPUDGXJnKZ91uzV3UB8Lqh,
Version 6), gegen PseudoDoc bei 390 px geprüft, dann gebaut. Zusammen mit Stufe C in **#184 auf main** (Klaus' Wort zum Zusammenführen).
Workflow PDF Pro #77 (Fach `profile`) ebenfalls auf main. Befunde: KI-Knopf öffnete nichts, weil der Internet-Schalter der App aus war
(jetzt: kopiert und sagt es); Schriftangaben `font: … inherit` greifen nicht, und `.app-shell :is(button …)` schlägt einfache Klassen –
die Pseudo-Regeln stehen deshalb unter `.pseudo-fenster`. Windows-Job einmal rot an der bekannten Wartestelle der Bedeutungssuche
(`test-model-installed.mjs:72`), im zweiten Lauf grün.

## Entscheidungen (mit Freibrief)

1. Slug `profile`, Ordner „Maske-Profile“ (ein Ordner „Profile“ wäre mit eigenen Ordnern zu verwechseln).
2. Gemeinsames Fach statt Übergabefach: jede App schreibt ihre Datei, alle lesen; nichts wird gelöscht.
3. Platzhalter ⟦ICH-1⟧, ⟦FAMILIE-n⟧, ⟦KONTAKT-n⟧, ⟦STELLE-n⟧ mit fester Nummer (Form ⟦TYP-n⟧ bleibt).
4. Schreibweisen ohne Rücksicht auf Groß-/Kleinschreibung, Nachname allein zählt bei Personen (nicht, wenn er in einer „darf bleiben“-Wendung steht).
5. „Darf bleiben“ schlägt Namensmuster, nie eine gültige Prüfziffer.
6. Pro ohne Tresor: Profile im App-Speicher (gleicher Schutz wie die Akte); Tresor gesperrt: nichts lesen, nichts woanders speichern.

## Befunde unterwegs

- **Fingerabdrücke mit verschiedenen Schlüsseln sind nicht vergleichbar** (liegt am Verfahren). Übernimmt eine App Profile, behält sie den
  Schlüssel (`alsEigene`); zwei unabhängig begonnene Apps finden nur über den Namen zusammen, ihre Nummern bleiben aber erkennbar.
- Werte aus früheren Texten (Sitzungs-Zuordnung) wurden auch nach „darf bleiben“ wieder verdeckt – behoben in `lib/maske.ts`.
- Tresor-Gegenprobe in Workflow PDF Pro: zwei „Verbund“-Fälle rutschen schon auf main durch (die Probe wird rot, aber der Testname mit „ä“
  passt nicht zum Suchmuster der Gegenprobe). Nicht angefasst.

## Proben

`run-maske-profil-tests` 10 Gruppen grün (Gegenprobe 5/5 gefangen) · `run-maske-tests` grün · `npm run check` grün · `tsc` grün ·
`check:herkunft` grün · UI `maske-profile` 9/9 · `pseudo-knopf` 10/10 · `pfad` 40/40 · `pro-verbund` 8/8 · `email-wege` 6/6 ·
`zurueck-und-hinweise` 12/12 · Windows-Engine-Probe mit Profil-Fall grün. Nicht im Behälter: Android-Plugin (kein SDK; CI), Rust-Test (CI).
**Nicht am Gerät.**

## Offen

- Am Gerät: Profilseite mit echtem Tresor (Android SAF, Windows), Übernehmen aus einer echten anderen Pro-App (die anderen Apps schreiben
  noch keine Profile – erst mit dem Pseudo-Knopf dort).
- Nächste Stufen laut Plan: Knopf an Unterlage/Auswahl/Mail (D-Rest), Zuordnung je Auftrag gespeichert (P10), Austauschordner und
  Bezugsdokumente (E), „Alles pseudonymisieren“ (F), Bilder schwärzen (G), Landkarte/Hilfe-Thema (H). Sage Gen. 3 mit Profilen.
- `lib/app-stand.ts`, Geschenkbox, `lib/fassungen.ts` erst mit der nächsten Ausgabe nachziehen.

## Stundennachweis

Sitzung 14.11.2026, erste Spur ca. 11:43 UTC (Behälterstart), letzte Spur dieses Briefs ca. 12:20 UTC – Obergrenze **3 h 30 min** (mit Nachtrag bis ca. 15:10 UTC)
(einschließlich Warten auf CI). Forschungseintrag nicht angelegt (KimHub nicht in der Sitzung).

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte (eigener Zweig). Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-14_MASKE-PROFILE-STUFE-C.md,
docs/PLAN_PSEUDONYMISIEREN.md (Stand und Stufen).
Auftrag: Pseudo-Fenster (app/pseudo-knopf.tsx, Muster PseudoDoc) weiter: Zuordnung je Auftrag verschlüsselt speichern (P10, Zurück auch
nach Neustart, 90 Tage), „An KI“ an jeder Unterlage und an der Mail im Eingang (füllt das Fenster), Briefweg (Assistenz) auf dasselbe
Fenster umstellen, echtes PDF-Seitenbild in der Ansicht. Kleine Knöpfe, Handy zuerst; neue Oberfläche erst als HTML-Vorschau. Nicht: echte Dokumente oder pseudonymisierte Texte ins Repo, keine Schlüssel/PINs, nichts veröffentlichen ohne Klaus' Wort.
```
