# Auftrag 010: Stapel „Vermieterin 2026“ (Folgejahr) einordnen (drei Teile)

Erfundenes Jahr 2026 derselben privaten Vermieterin (Rentnerin, vermietet drei Wohnungen in ihrem Haus, Einkünfte aus Vermietung und
Verpachtung, keine Umsatzsteuer). Alles erfunden. Du bist der dritte, unabhängige Einordner; eigenes Urteil, kein Stichwort-Skript.
Ergebnisse nach `ergebnisse/010-vermieterin-2026/`.

## Teil 1 – Schriftstücke

Wie bei Auftrag 009: `AUFTRAG-TEIL1-SCHRIFTSTUECKE.md` genau ausführen (BRIEFE.txt, BEREICHE.json, SCHRIFTSTUECKE.json,
HAUSHALTE.json, FACHREGEL.md). Ergebnis: `DRITTER.json`.

## Teil 2 – Belege

`BELEGE.txt` enthält 45 Belege („######## BELEG n von 45 · Datei: belege/<Name> ########“), `KONTEN.json` die erlaubten Konten
(SKR03-Auszug). Ordne jeden Beleg aus Sicht der Buchhaltung der Vermieterin zu. Belege, die sie selbst ausgestellt hat, sind
Einnahmen (zahlt sie jemandem etwas aus: Ausgabe); Belege anderer an sie sind Ausgaben. Passt kein Konto wirklich, nimm das
nächstliegende und setze `sicher` auf false. Ergebnis `DRITTER-BELEGE.json`:

    {"einordner":"<Modell>","dateien":[{"datei":"<Name ohne belege/>","konto":"<vierstellig>","richtung":"einnahme|ausgabe",
      "betrag":"1.234,56","datum":"JJJJ-MM-TT","ust":19,"aussteller":"…","rechnungsnummer":null,"sicher":true,"grund":""}]}

`betrag` = der zu zahlende bzw. gezahlte Betrag dieses Belegs; `datum` = Belegdatum; `ust` = 19, 7, 0 (nur wenn ausdrücklich
steuerfrei) oder null (kein Steuerausweis üblich oder vorhanden).

## Teil 3 – Kontoauszüge

`BANK.txt` enthält 12 Kontoauszüge („######## KONTOAUSZUG · Datei: bank/2026-MM.txt ########“). Nummeriere je Auszug die Umsätze in
der Reihenfolge des Auszugs ab 1 (alter und neuer Kontostand zählen nicht). Je Umsatz:

- `betrag` mit Vorzeichen, minus = Abgang, Form „-1.234,56“; `gegenpartei` wie im Auszug
- `art`: ueberweisung | lastschrift | dauerauftrag | gutschrift | entgelt | bar | karte (eingehende Zahlungen = gutschrift;
  dauerauftrag nur für eigene Daueraufträge der Kontoinhaberin)
- `rechnungsnummern`: alle im Verwendungszweck genannten Rechnungsnummern, in der sauberen Schreibweise der zugehörigen Rechnung, wenn
  du sie im Stapel findest (sonst wie im Zweck); Kundennummern, Mandate und Kassenzeichen zählen nicht; sonst []
- `stuecke`: die Dateien des Stapels (aus BRIEFE.txt der Dateiname der Kopfzeile, aus BELEGE.txt „belege/<Name>“), zu denen der Umsatz
  gehört (die Rechnung, der Bescheid, Vertrag oder Abschlagsplan, der den Betrag festlegt); sonst []

Ergebnis `DRITTER-BANK.json`:

    {"einordner":"<Modell>","auszuege":[{"datei":"2026-01.txt","umsaetze":[
      {"nr":1,"betrag":"…","gegenpartei":"…","art":"…","rechnungsnummern":[],"stuecke":[],"sicher":true}]}]}

Prüfe am Ende: Teil 1 jedes Schriftstück genau einmal, Listenwerte wörtlich; Teil 2 45 Einträge; Teil 3 zwölf Auszüge, jede unter
`stuecke` genannte Datei kommt in BRIEFE.txt oder BELEGE.txt vor.
