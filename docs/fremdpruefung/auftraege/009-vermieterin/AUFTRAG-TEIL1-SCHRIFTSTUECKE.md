# Auftrag: 93 Schriftstücke eines Haushalts-Archivs einordnen

Du bist ein unabhängiger Prüfer. In diesem Ordner liegen:

- `BRIEFE.txt` – 93 erfundene Schriftstücke privater Haushalte als Text (wie nach Texterkennung). Jedes beginnt mit
  `######## BRIEF n von 93 · Datei: <Dateiname> · Haushalt: <Kennung> ########`.
- `BEREICHE.json` – die erlaubten Bereiche (Ablagefächer) einer Familienakte.
- `SCHRIFTSTUECKE.json` – die erlaubten Arten von Schriftstücken.
- `HAUSHALTE.json` – wer zu welchem Haushalt gehört.
- `FACHREGEL.md` – die vereinbarte Regel für Schriftstücke, die in zwei Fächer passen (nur der Abschnitt mit der Tabelle zählt
  für dich; was dort über die Bedienung steht, ist Hintergrund).

## Aufgabe

Bestimme für JEDES der 93 Schriftstücke nach deinem eigenen Urteil (kein Stichwort-Skript), so wie ein sorgfältiger Mensch es
in seiner Familienakte ablegen würde, und halte dich bei Grenzfällen an die Fachregel:

- `bereich` = genau ein Eintrag aus BEREICHE.json (wörtlich).
- `zweitfach` = ein weiterer Eintrag aus BEREICHE.json, wenn die Fachregel eines nennt oder ein zweites Fach gleich gut passt, sonst "".
- `schriftstueck` = genau ein Eintrag aus SCHRIFTSTUECKE.json (wörtlich). Die Hauptsache entscheidet.
- `absender` = Name der Stelle, Firma oder Person, von der das Schriftstück stammt, wörtlich wie im Text (ohne Anschrift).
- `person` = "Vorname Name" des Haushaltsmitglieds, um das es geht (Patient, Kind, Versicherter, Vertragspartner), oder "" bei
  gemeinsamen Sachen oder niemand Bestimmtem.
- `frist` = Datum JJJJ-MM-TT, bis zu dem der Haushalt etwas tun muss (zahlen ohne Lastschrift, antworten) oder ein Termin
  wahrzunehmen ist, oder "" wenn es keine gibt. Bloße Widerspruchsfristen, Laufzeiten und Abbuchungstermine sind keine Frist.
- `sicher` = false, sobald du bei einem Feld zweifelst; `grund` nennt Feld und zweite Möglichkeit (höchstens 15 Wörter).

## Ergebnis

    {"einordner":"<Kennzeichnung>","dateien":[
     {"datei":"<Dateiname genau wie in der Kopfzeile>","bereich":"…","zweitfach":"","schriftstueck":"…","absender":"…","person":"…","frist":"","sicher":true,"grund":""}
    ]}

Prüfe am Ende selbst: 93 Einträge, jeder Dateiname genau einmal, jeder Bereich und jede Art wörtlich aus den Listen.
