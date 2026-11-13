# Auftrag 012: Belege und Kontoauszüge „Vermieter 2“ einordnen (zwei Teile)

Erfundenes Jahr 2026 eines Ehepaars (beide angestellt), das privat ein Zweifamilienhaus (zwei Wohnungen) und zwei Garagen vermietet;
Einkünfte aus Vermietung und Verpachtung, keine Umsatzsteuer. Alles erfunden. Du bist ein unabhängiger Einordner; eigenes Urteil,
kein Stichwort-Skript. Ergebnisse nach `ergebnisse/012-vermieter-2/`.

## Teil 1 – Belege

`BELEGE.txt` enthält 50 Belege („######## BELEG n von 50 · Datei: belege/<Name> ########“), `KONTEN.json` die erlaubten Konten
(SKR03-Auszug). Ordne jeden Beleg aus Sicht der Buchhaltung des Ehepaars zu. Belege, die das Ehepaar selbst ausgestellt hat, sind
Einnahmen (zahlt es jemandem etwas aus: Ausgabe); Belege anderer an das Ehepaar sind Ausgaben. Passt kein Konto wirklich, nimm das
nächstliegende und setze `sicher` auf false. Ergebnis `DRITTER-BELEGE.json`:

    {"einordner":"<Modell>","dateien":[{"datei":"<Name ohne belege/>","konto":"<vierstellig>","richtung":"einnahme|ausgabe",
      "betrag":"1.234,56","datum":"JJJJ-MM-TT","ust":19,"aussteller":"…","rechnungsnummer":null,"sicher":true,"grund":""}]}

`betrag` = der zu zahlende bzw. gezahlte Betrag dieses Belegs; `datum` = Belegdatum; `ust` = 19, 7, 0 (nur wenn ausdrücklich
steuerfrei) oder null (kein Steuerausweis üblich oder vorhanden); `aussteller` = wer den Beleg ausgestellt hat, wörtlich wie im Beleg
(ohne Anschrift); `rechnungsnummer` = die Rechnungs- bzw. Belegnummer, wörtlich (Kunden-, Vertrags-, Auftragsnummern zählen nicht), sonst null.

## Teil 2 – Kontoauszüge

`BANK.txt` enthält 12 Kontoauszüge („######## KONTOAUSZUG · Datei: bank/2026-MM.txt ########“). Nummeriere je Auszug die Umsätze in
der Reihenfolge des Auszugs ab 1 (alter und neuer Kontostand und Überträge zählen nicht). Je Umsatz:

- `betrag` mit Vorzeichen, minus = Abgang, Form „-1.234,56“; `gegenpartei` wie im Auszug
- `art`: ueberweisung | lastschrift | dauerauftrag | gutschrift | entgelt | bar | karte (eingehende Zahlungen = gutschrift;
  dauerauftrag nur für eigene Daueraufträge der Kontoinhaber)
- `rechnungsnummern`: alle im Verwendungszweck genannten Rechnungsnummern, in der Schreibweise der zugehörigen Rechnung, wenn du sie
  in BELEGE.txt findest (sonst wie im Zweck); Kundennummern, Mandate und Kassenzeichen zählen nicht; sonst []
- `stuecke`: die Belege („belege/<Name>“), zu denen der Umsatz gehört (die Rechnung, der Bescheid, die Abrechnung, die den Betrag
  festlegt); bei monatlich wiederkehrenden Zahlungen jedes Mal angeben; sonst []

Ergebnis `DRITTER-BANK.json`:

    {"einordner":"<Modell>","auszuege":[{"datei":"2026-01.txt","umsaetze":[
      {"nr":1,"betrag":"…","gegenpartei":"…","art":"…","rechnungsnummern":[],"stuecke":[],"sicher":true}]}]}

Prüfe am Ende: Teil 1 50 Einträge, jeder Dateiname genau einmal, Konten aus KONTEN.json; Teil 2 zwölf Auszüge, jede unter `stuecke`
genannte Datei kommt in BELEGE.txt vor.
