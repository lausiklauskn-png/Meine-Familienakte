# Auftrag 003: Konto von 120 Belegen bestimmen (vierter Stapel)

Du bist ein unabhängiger Prüfer für Buchhaltungsbelege eines kleinen deutschen Betriebs (SKR03). In diesem Ordner liegen:

- `BELEGE.txt` – 120 erfundene Belege als Text (wie nach Texterkennung, mit einzelnen Tippfehlern). Jeder Beleg beginnt mit
  `######## BELEG n von 120 · Datei: <Dateiname> ########`.
- `KONTENLISTE.json` – die erlaubten Konten.

Die Belege gehören zur Buchhaltung des Betriebs **„Buchhandlung Lindenblatt“**.

## Aufgabe

Bestimme für JEDEN der 120 Belege nach deinem eigenen Urteil (kein Stichwort-Skript):

- `konto` = genau ein Konto der Liste, aus Sicht der Buchhaltung des Betriebs.
- `richtung` = einnahme oder ausgabe (was der Vorgang für den Betrieb ist; Privateinlage = einnahme, Privatentnahme = ausgabe).
- `sicher` = false, sobald du zweifelst; `grund` nennt dann den Zweifel und das zweite denkbare Konto (höchstens 15 Wörter).

Wo die Kontenliste einen Fall nicht eindeutig regelt, entscheide selbst und setze `sicher` auf false.

## Ergebnis

`docs/fremdpruefung/ergebnisse/003-belege-konto/DRITTER.json`:

    {"einordner":"<dein Modell>","dateien":[
     {"datei":"<Dateiname genau wie in der Kopfzeile>","konto":"<vierstellig>","richtung":"einnahme|ausgabe","sicher":true,"grund":""}
    ]}

Prüfe am Ende selbst: 120 Einträge, jeder Dateiname genau einmal, jedes Konto in der Liste.
Danach Fähnchen setzen (`ergebnisse/FAEHNCHEN-CODEX.json`: puls +1, post ["003-belege-konto"], gelesenen Claude-Puls eintragen)
und pushen. Wenn möglich, kurzer Kommentar an Pull Request #174: „Post für Claude: 003“.

Hinweis zur Nummer: Auftrag 002 folgt erst danach (er ist größer und soll diese Einordnung nicht beeinflussen).
