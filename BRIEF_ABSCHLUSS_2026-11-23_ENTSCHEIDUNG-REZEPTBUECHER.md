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
  18 Emoji-Zeichen in allen App-Dateien, Capacitor/Windows, API 36. Muttis und Mein Rezeptbuch sind **nicht** gleich (Nachmessung 23.11., gegen die Projektregeln dort): Mein Rezeptbuch hat 697 Funktionen, Muttis 558; nur in Muttis sind drei kleine (`_rcardHdCheck`, `_tddPendingMove`, `_tddPendingEnd`). Mein Rezeptbuch ist damit die Grundlage, Muttis wird Ausgabe daraus.
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

Zwei Sitzungen, parallel (Klaus 23.11.). Je ein eigener Brief mit Startauftrag am Ende:

- **Sitzung A – Mein Rezeptbuch (mit Muttis als Ausgabe):** `docs/BRIEF_SITZUNG_2026-11-23_REZEPTBUCH-KUECHEN-KERN.md`
- **Sitzung B – Mein Mixarium:** `docs/BRIEF_SITZUNG_2026-11-23_MIXARIUM-KUECHEN-KERN.md`

Beide beginnen mit Funktionsliste und HTML-Vorschau und warten auf Klaus' Ja. A baut den gemeinsamen Küchen-Kern, B übernimmt ihn
byte-gleich mit Pin und baut bis dahin nur Getränke-Eigenes. **Muttis Rezeptbuch:** keine eigene Sitzung und kein bloßes Umbenennen,
sondern eine Ausgabe des Rezeptbuch-Kerns (anderer Name, Symbol, Farben, übernimmt die Daten der alten Muttis-App); das Repo
Muttis-Rezeptbuch bleibt unverändert online, bis Klaus die neue Ausgabe abgenommen hat.
