# Abschlussbrief 23.11.2026 – Entscheidungs-Dashboard Fassung 3, Rezeptbücher und Mixarium

Sitzung ohne Bau an der Familienakte. Auftrag (Klaus 23.11.): das Entscheidungs-Dashboard vom 04.11. nachführen (neue Repos,
vor allem die Private Akte), Entwicklungsstand je Vorhaben, Bewertung von Mein Rezeptbuch, Muttis Rezeptbuch und Mein Mixarium,
Entscheidungshilfe für den Umbau zu Android- und Windows-App und für Google Play. Die Modernisierung selbst beginnt in der
nächsten Sitzung (ab 11 Uhr).

## Ergebnis

- **Dashboard Fassung 3:** https://claude.ai/artifact/Q3JLshnxNibqJ1K4icn8k2 (privat; liegt nicht im Repo, weil es Forschungszahlen
  aus Kimhub vom 04.11. enthält). Neu: „Neu seit 04.11.“, „Woran weiter“, „Rezeptbücher und Mixarium“, „Weg in die Stores“,
  „Sitzung ab 11 Uhr“; Projektdaten, Rechner-Voreinstellungen und Fahrplan nachgeführt. Geldzahlen sind vom 04.11., nicht neu erhoben.
- **Messwerte (main, 23.11.):** Mein Rezeptbuch / Muttis Rezeptbuch / Mein Mixarium sind je eine HTML-Datei mit 1,43 / 1,17 / 1,23 MB,
  2.827 / 2.366 / 2.483 Emoji-Zeichen, 507 / 412 / 448 `onclick`, Speicher in `localStorage`, kein Android/Windows, Web-Import über die
  öffentlichen Weiterleiter allorigins.win und codetabs.com, Netz-Module SBKIM/Mycel eingebaut. Private Akte zum Vergleich: Hülle 2 KB,
  18 Emoji-Zeichen in allen App-Dateien, Capacitor/Windows, API 36. Muttis und Mein Rezeptbuch sind laut Projektregeln funktional gleich.
- **Im Handyformat angesehen (leere App, 390 px):** Kopf mit sieben Emoji-Knöpfen, Netz-Leiste verdeckt die untere Navigation, in Muttis
  zehn leere Platzhalter je Kategorie und schwebender Knopf „Mycel“, Englisch/Deutsch gemischt; Mixarium beginnt mit Intro-Animation.
- **Empfehlung:** Option B „gemeinsamer Küchen-Kern“: eine Codebasis für Rezeptbuch und Mixarium, gebaut wie Private Akte/PseudoDoc
  (Module, IndexedDB, Proben, Capacitor, Windows), Funktionen Stück für Stück mit Probe übernommen. Muttis Rezeptbuch wird Ausgabe des
  Rezeptbuchs (eigener Titel und Thema), keine eigene Store-App. Schätzung 80–160 h Rezeptbuch, 30–60 h Mixarium dazu.
- **Store-Fakten (recherchiert 23.11.):** privates Google-Play-Konto = je App geschlossener Test mit 12 Testern über 14 Tage;
  Organisationskonto ausgenommen (D-U-N-S, Gewerbe). Ab 31.08.2026 Ziel API 36. Microsoft Store für Einzelentwickler kostenlos
  (seit 09/2025), für Unternehmen seit 05/2026.
- **Offen bei Klaus:** Konto-Frage (privat oder Organisation), welche Akte in den Store (Vorschlag: Private Akte, Familienakte als Kern
  und Web-App Basic), Einfrieren der täglichen Netz-Pflege in `family-project`.

## Gestaltungsvorgaben (Klaus 23.11., gelten für V, A und B)

Klaus: „nicht diese plumpen WhatsApp-Emojis … sinnvolle Vollbilddarstellung … bessere Aufteilung der Container … nimm das, was am
besten aussieht … Animationen, die die App nicht verlangsamen.“

- **Symbole statt Emojis:** ein einheitlicher Satz Strichsymbole als eingebettetes SVG (Vorschlag: Phosphor-Icons, Lizenz MIT, in den
  Stärken „Regular“ und „Duotone“ – Duotone mit zarter Zweitfarbe wirkt freundlicher als reine Striche; Ausweichwahl Lucide, ISC).
  Nur die genutzten Symbole ins Paket, kein Schriftsymbol-Font, kein Netzabruf. Emojis höchstens im Inhalt, den Nutzer selbst schreiben.
  In der Vorschau zwei Symbolstile nebeneinander zeigen und Klaus wählen lassen.
- **Handy zuerst, großer Bildschirm sinnvoll:** Handy = eine Spalte, untere Navigation. Tablet quer und Monitor (Windows-App) =
  Liste links, Rezept rechts (Master-Detail), Navigation als schmale Leiste links; breite Fläche nicht strecken, sondern in Spalten
  teilen (Rezept: Zutaten links, Schritte rechts). Textbreite höchstens etwa 70 Zeichen.
- **Vollbild mit Zweck:** Kochansicht als Vollbild (ein Schritt groß, Wischen/Pfeiltasten, Bildschirm bleibt an, Zutaten des Schritts
  daneben); Bild-Vollbild mit ⤢ wie in der Private Akte 0.9.8; F11 und Esc unter Windows.
- **Farben und Text:** je App eine warme Palette als Tokens, hell und dunkel; Schrift dunkel auf hell mit mindestens 4,5:1 Kontrast
  (auch auf Fotos: Verlauf hinter dem Text), keine hellen Pastell-Schriften. Systemschrift, klare Größenstufen.
- **Animationen, die nichts kosten:** nur `transform` und `opacity`, 150–250 ms; Seitenwechsel über die View-Transitions-Schnittstelle,
  wo vorhanden; Karten erscheinen ohne Verzögerung des Inhalts; Bilder mit festen Maßen und `loading="lazy"`; nichts läuft dauerhaft
  im Hintergrund; `prefers-reduced-motion` schaltet alles ab. Messen: Start bis erster Inhalt am Handy, Ziel unter 1 s nach Installation.
- **Fable 5.2:** welche neuen Fähigkeiten das Modell hat, ist hier nicht geprüft. Die Aufträge sind so geschnitten, dass mehrere
  Sitzungen parallel laufen können (V zuerst, dann A und B); die Sitzung prüft zu Beginn selbst, was sie zusätzlich kann (z. B.
  Bildschirmfotos der eigenen Vorschau ansehen), und nutzt es für die Abnahme der Gestaltung.

## Stundennachweis

| Datum | Von–bis | Dauer | Was |
|---|---|---|---|
| 23.11.2026 | etwa 06:45–07:30 | ca. 0,75 h | Repos geholt und gemessen, Handy-Ansichten, Recherche Stores, Dashboard Fassung 3, dieser Brief |

## Startauftrag für die nächste Sitzung (ab 11 Uhr)

Zuerst Sitzung V (Vorschau), nach Klaus' Ja die Sitzungen A und B parallel. Muttis Rezeptbuch bekommt keine eigene Sitzung.

### Sitzung V – Vorschau (Repo Mein-Rezeptbuch)

```
Repo lausiklauskn-png/Mein-Rezeptbuch, gegen origin/main prüfen (der Default-Branch dort ist ein alter Stand, siehe CLAUDE.md).
Lies zuerst im Repo Meine-Familienakte BRIEF_ABSCHLUSS_2026-11-23_ENTSCHEIDUNG-REZEPTBUECHER.md und im Repo Private-Akte app.css und
index.html (Maßstab für Gestaltung: Milchglas-Kopf, Linien-Symbole als SVG, ruhige Palette, Systemschrift).
Auftrag: HTML-Vorschau der neuen Gestaltung für Mein Rezeptbuch und Mein Mixarium, je vier Bildschirme am Handy und am Tablet:
Startseite mit Rezepten (oder einem Beispielrezept, keine leeren Platzhalter), Rezept-Ansicht mit großem Foto, Kochansicht
(große Schrift, Schritt für Schritt), Einkaufsliste. Familien-App, keine Bürosoftware: Fotos tragen die Seite, kaum Emojis,
große Tippflächen, warme eigene Palette je App, Muttis Rezeptbuch als Ausgabe mit eigenem Titel/Thema zeigen.
Datei docs/vorschau/kueche-neu.html, als Artefakt zeigen, Klaus' Ja je Punkt abwarten. Nichts an der App ändern.
```

### Sitzung A – Küchen-Kern (Repo Mein-Rezeptbuch), erst nach Klaus' Ja zur Vorschau

```
Repo lausiklauskn-png/Mein-Rezeptbuch, gegen origin/main. Lies BRIEF_ABSCHLUSS_2026-11-23_ENTSCHEIDUNG-REZEPTBUECHER.md (Repo
Meine-Familienakte) und die freigegebene Vorschau docs/vorschau/kueche-neu.html.
Auftrag: Option B „gemeinsamer Küchen-Kern“. Neuer Aufbau neben der alten App (alte index.html bleibt bis zur Abnahme online):
Vite-Projekt mit Modulen, Daten in IndexedDB mit Übernahme aus dem alten localStorage und aus .json-Sicherungen, Proben (npm test,
UI-Probe mit Playwright), Capacitor für Android (Ziel API 36) und Windows-Paket nach dem Muster der Private Akte. Funktionen aus
der Quell-Datei QC_MeinRezb_*.html Stück für Stück übernehmen, jede mit Probe; nichts weglassen, was dort geprüft wurde. Netz-Module
SBKIM/Mycel nicht in den neuen Aufbau; Web-Import in der App ohne öffentliche Weiterleiter (nativ direkt, im Browser mit Hinweis).
KI nur mit eigenem Schlüssel und auf Knopfdruck. Muttis Rezeptbuch als Ausgabe (Titel, Thema, Symbol) im selben Kern.
Erstes Ziel: Test-APK mit Startseite, Rezept anlegen/ansehen, Import aus Sicherung, Kochansicht. Fassung, PR als Entwurf,
Abschlussbrief mit Startauftrag. Kein Store-Eintrag ohne Klaus' Wort.
```

### Sitzung B – Mixarium auf den Kern (Repo Mein-Mixarium), sobald A den Kern auf main hat

```
Repo lausiklauskn-png/Mein-Mixarium. Lies BRIEF_ABSCHLUSS_2026-11-23_ENTSCHEIDUNG-REZEPTBUECHER.md (Repo Meine-Familienakte), die
freigegebene Vorschau und den Abschlussbrief von Sitzung A im Repo Mein-Rezeptbuch.
Auftrag: den Küchen-Kern aus Mein-Rezeptbuch mit Pin (Commit) byte-gleich übernehmen, nur Gestaltung und Getränke-Eigenheiten
(Kategorien, Mengen in ml/cl, Gläser) in der Mixarium-Schicht. Funktionen aus QC_Mixarium_20_04_26.html mit Probe übernehmen.
Intro nur beim ersten Start und überspringbar. Beispielsammlung ohne Alkohol (Altersfreigabe). Test-APK, PR als Entwurf,
Abschlussbrief.
```
