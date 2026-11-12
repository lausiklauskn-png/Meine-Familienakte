# Auftrag: 150 Briefe eines Haushalts-Archivs einordnen

Du bist ein unabhängiger Prüfer. In diesem Ordner liegen:

- `BRIEFE.txt` – 150 erfundene Schriftstücke privater Haushalte als Text (wie nach Texterkennung). Jedes beginnt mit
  `######## BRIEF n von 150 · Datei: <Dateiname> · Haushalt: <Kennung> ########`.
- `BEREICHE.json` – die erlaubten Bereiche (Ablagefächer) einer Familienakte.
- `SCHRIFTSTUECKE.json` – die erlaubten Arten von Schriftstücken.
- `HAUSHALTE.json` – wer zu welchem Haushalt gehört.

## Aufgabe

Bestimme für JEDES der 150 Schriftstücke nach deinem eigenen Urteil (kein Stichwort-Skript), so wie ein sorgfältiger Mensch es
in seiner Familienakte ablegen würde:

- `bereich` = genau ein Eintrag aus BEREICHE.json (wörtlich).
- `schriftstueck` = genau ein Eintrag aus SCHRIFTSTUECKE.json (wörtlich).
- `absender` = Name der Stelle oder Firma, von der das Schriftstück stammt, wie im Text (ohne Anschrift).
- `person` = "Vorname Name" des Haushaltsmitglieds, das es betrifft, oder "" wenn es den ganzen Haushalt oder niemanden Bestimmten betrifft.
- `frist` = Datum JJJJ-MM-TT, bis zu dem der Empfänger etwas tun muss (zahlen, antworten, erscheinen), oder "" wenn es keine gibt.
- `sicher` = false, sobald du bei einem Feld zweifelst; `grund` nennt Feld und zweite Möglichkeit (höchstens 15 Wörter).

## Ergebnis

    {"einordner":"<Kennzeichnung>","dateien":[
     {"datei":"<Dateiname genau wie in der Kopfzeile>","bereich":"…","schriftstueck":"…","absender":"…","person":"…","frist":"","sicher":true,"grund":""}
    ]}

Prüfe am Ende selbst: 150 Einträge, jeder Dateiname genau einmal, jeder Bereich und jede Art wörtlich aus den Listen.

## Zusatz für Codex (Auftrag 004)

Kleiner Auftrag, unabhängig von 002 und vor 002 zu erledigen, wenn du magst: Er dient der Frage, ob das Prüfmuster auch für die
Familienakte trägt (sind sich unabhängige Prüfer bei „Bereich“ einig?). Ergebnis nach
`docs/fremdpruefung/ergebnisse/004-briefe-einordnen/DRITTER.json` (Feld `einordner` = dein Modell), dazu in `PROTOKOLL.md` die
Bereiche, die dir am schwersten voneinander abzugrenzen waren. Danach Fähnchen +1 mit post ["004-briefe-einordnen"].
