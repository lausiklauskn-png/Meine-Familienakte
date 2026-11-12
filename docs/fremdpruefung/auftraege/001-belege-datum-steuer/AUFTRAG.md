# Auftrag 001: Datum, Steuersatz, Betrag, Konto von 120 Belegen bestimmen

Du bist ein unabhängiger Prüfer für Buchhaltungsbelege eines kleinen deutschen Betriebs (SKR03). In diesem Ordner liegen:

- `BELEGE.txt` – 120 erfundene Belege als Text (wie nach Texterkennung, mit einzelnen Tippfehlern). Jeder Beleg beginnt mit
  `######## BELEG n von 120 · Datei: <Dateiname> ########`.
- `KONTENLISTE.json` – die erlaubten Konten.

Die Belege gehören zur Buchhaltung des Betriebs **„Blumenwerkstatt Harkort“**. Belege, die dieser Betrieb selbst ausgestellt hat,
sind Einnahmen; Belege anderer an ihn sind Ausgaben.

## Aufgabe

Bestimme für JEDEN der 120 Belege nach deinem eigenen Urteil (kein Stichwort-Skript):

- `datum` = **Belegdatum** (Rechnungs-/Bon-/Abrechnungsdatum) als JJJJ-MM-TT – nicht Liefer-, Leistungs- oder Fälligkeitsdatum.
- `ust` = 19 oder 7 (bei gemischten Belegen der Satz mit dem größeren Betrag); 0, wenn der Beleg ausdrücklich steuerfrei oder nicht
  steuerbar ist oder keine Umsatzsteuer ausweist; null, wo ein Steuersatz keinen Sinn hat (Lohnabrechnung, Privatentnahme/-einlage,
  Eigenbeleg ohne Rechnung).
- `betrag` = der zu zahlende Bruttobetrag des Belegs, deutsch geschrieben wie im Text (z. B. "1.234,56").
- `konto` = genau ein Konto der Liste, aus Sicht der Buchhaltung des Betriebs; `richtung` = einnahme oder ausgabe.
- `sicher` = false, sobald du bei einem der Felder zweifelst; `grund` nennt dann das Feld und den Zweifel (höchstens 15 Wörter).

Diese Festlegungen sind für alle Prüfer gleich. Wo sie einen Fall nicht regeln, entscheide selbst und setze `sicher` auf false.

## Ergebnis

`docs/fremdpruefung/ergebnisse/001-belege-datum-steuer/DRITTER.json`:

    {"einordner":"<dein Modell>","dateien":[
     {"datei":"<Dateiname genau wie in der Kopfzeile>","datum":"JJJJ-MM-TT","ust":19,"betrag":"1.234,56",
      "konto":"<vierstellig>","richtung":"einnahme|ausgabe","sicher":true,"grund":""}
    ]}

Prüfe am Ende selbst: 120 Einträge, jeder Dateiname genau einmal, jedes Konto in der Liste, jedes Datum gültig.
Danach Fähnchen setzen (`ergebnisse/FAEHNCHEN-CODEX.json`: puls +1, post ["001-belege-datum-steuer"], gelesenen Claude-Puls eintragen)
und pushen. Wenn möglich, kurzer Kommentar an Pull Request #174: „Post für Claude: 001“.
