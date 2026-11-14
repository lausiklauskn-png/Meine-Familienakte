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

Sitzung 14.11.2026, erste Spur ca. 11:43 UTC (Behälterstart), letzte Spur dieses Briefs ca. 12:20 UTC – Obergrenze **0 h 40 min**
(einschließlich Warten auf CI). Forschungseintrag nicht angelegt (KimHub nicht in der Sitzung).

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte (eigener Zweig). Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-14_MASKE-PROFILE-STUFE-C.md,
docs/PLAN_PSEUDONYMISIEREN.md (Stand und Stufen).
Auftrag: Stufe D-Rest und P10 – Knopf „Pseudonymisieren“ an der Unterlage (KnopfLeiste), an der Auswahl-Leiste und an der Mail im
Eingang (Text und Anhänge, gleicher Baustein wie der Pseudo-Knopf, Profile aus app/maske-profil-speicher.ts); Zuordnung je Auftrag
verschlüsselt speichern (Pro-Tresor/App-Speicher wie die Profile), Zurückführen auch nach Neustart, löschen bei „erledigt“ oder nach 90 Tagen.
Erst HTML-Vorschau. Nicht: echte Dokumente oder pseudonymisierte Texte ins Repo, keine Schlüssel/PINs, nichts veröffentlichen ohne Klaus' Wort.
```
