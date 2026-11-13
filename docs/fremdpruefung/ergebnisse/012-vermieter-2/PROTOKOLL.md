# Unabhängige Fremdprüfung 012 – Vermieter 2

- Modell: **Codex (GPT-6)**. Eine genauere Modellvariante ist mir nicht verlässlich bekannt.
- Ergebnis erstellt und geprüft (UTC): **2026-11-13T15:09:19Z**.
- Repo: `lausiklauskn-png/Meine-Familienakte`.
- Gelesener Quellzweig: `claude/familienakte-bildintegration-il59yw`.
- Gelesener Quellcommit: `707e7964ea621904ca5c2e35d954268c8077cf97`; verarbeiteter Claude-Puls: **19**.
- Zielzweig: `codex/fremdpruefung`; vor Veröffentlichung geprüfter Ausgangscommit: `fe722409297dffcebbbcac0be834a630f236dcb8`.
- **Lesegrenze eingehalten:** Als Repo-Inhalte ausschließlich `docs/fremdpruefung/` gelesen. Keine anderen Dateien dieses Repos, keine anderen Repos und keine externe Recherche. GitHub nur für dieses Repo, erforderliche Git-Metadaten und Veröffentlichung.
- **Schreibgrenze:** ausschließlich Ergebnisdateien unter `docs/fremdpruefung/ergebnisse/`. Bestehende Ergebnisse bleiben erhalten. Kein Merge, kein Force-Push, keine Änderung an Aufträgen, kein PR-Kommentar und keine Nachricht an andere.
- Die Aufgaben erklären sämtliche Fälle ausdrücklich für erfunden. Die Ergebnisse enthalten Einordnungen dieser fiktiven Testdaten.

## Ergebnis und Prüfung

- `DRITTER-BELEGE.json`: **50 Belege**, jeder Dateiname genau einmal ohne Präfix `belege/`; **26** als unsicher gekennzeichnet.
- `DRITTER-BANK.json`: **12 Kontoauszüge mit 232 Umsätzen** in der ursprünglichen Reihenfolge, je Auszug ab 1 nummeriert; **15** als unsicher gekennzeichnet.

Bestanden: JSON-Struktur, geforderte Schlüssel und Typen, erlaubte Konten und Umsatzarten, Datums- und Betragsformate, Dateinamen und Eindeutigkeit, wörtliches Vorkommen von Ausstellern und Rechnungs-/Belegnummern in den jeweiligen Belegen sowie alle `stuecke`-Verweise innerhalb des gelieferten Belegstapels. Gegenpartei und Betrag jeder Bankzeile wurden unverändert übernommen. Alle Eingänge sind gemäß Auftrag `gutschrift`; `dauerauftrag` wird nur für eigene Aufträge der Kontoinhaber verwendet.

Dieses Protokoll dokumentiert Modell, UTC-Zeit, Herkunft und Lesegrenze für beide JSON-Dateien.

## Vorgehen und fachliche Grenzen

Die 50 Belege und zwölf Auszüge wurden vollständig gelesen und nach eigenem Urteil einzeln zugeordnet. Keine Stichwort-Klassifikation, keine Übernahme früherer Ergebnisse, keine weiteren Prüfer. Programmatische Verarbeitung diente dem Übertragen der Bankzeilen, der Ausgabe und den Form- und Rechenprüfungen.

Der Kontenauszug enthält keine passenden Konten für steuerfreie Mieterlöse, Investitionszuschüsse, Darlehensverbindlichkeiten und manche Gebäudekosten. Solche Zuordnungen sind ausdrücklich unsichere Ersatzlösungen. 8400 behauptet bei den Mieterlösen keine tatsächliche Umsatzsteuer; 8120/8125 passen wegen der ausdrücklich bezeichneten Ausfuhr beziehungsweise innergemeinschaftlichen Lieferungen nicht. Die Tilgung einer Darlehensrate ist kein laufender Aufwand, auch wenn mangels passendem Konto 4980 als unsicherer Ersatz ausgegeben wird.

Bei der Darlehens-Jahresübersicht wurde die wiederkehrende Monatsrate von 1.150,00 EUR als Betrag gewählt; die alternativ mögliche Jahressumme von 13.800,00 EUR ist im Zweifelgrund genannt. Bei der Garagen-Jahresrechnung ist der Rechnungsbetrag 660,00 EUR; die einzelnen Bankzahlungen betragen jeweils 55,00 EUR. Der Grundbesitzabgabenbescheid enthält 612,40 EUR für das Jahr, die vier Bankabbuchungen jeweils 153,10 EUR.

Abschlagsrechnung und Schlussrechnung der Wärmepumpe sind getrennt: 9.000,00 EUR Abschlag, danach 18.370,00 EUR Restbetrag. Der ursprüngliche Gesamtpreis wird nicht nochmals als Schlusszahlbetrag erfasst. Die Frage Erhaltungsaufwand oder Aktivierung ist als Unsicherheit benannt. Die Förderung von 6.900,00 EUR ist wirtschaftlich ein Eingang trotz fremdem Aussteller; ein passendes Zuschusskonto fehlt. Ebenso wird die Gas-Guthabenauszahlung als Eingang beziehungsweise Kostenerstattung eingeordnet. Die an die Mieterin ausgezahlte Nebenkostenerstattung ist eine Ausgabe beziehungsweise Erlösminderung. Diese Abweichungen von der vereinfachten Ausstellerregel sind ausdrücklich gekennzeichnet.

`ust` ist der Beleg-Steuerausweis, keine Aussage zum Vorsteuerabzug. Versicherungsteuer ist keine Umsatzsteuer. Ohne ausdrückliche Steuerbefreiung steht bei Versicherungen, kommunalen Gebühren, Vereinsbeitrag oder nicht steuerbarem Zuschuss `null`; 0 wird nur bei ausdrücklicher Befreiung verwendet. Bei der Garagenrechnung wurde die ausdrücklich angegebene Befreiung übernommen, nicht eine externe steuerrechtliche Prüfung vorgenommen.

Wiederkehrende Zahlungen erhalten in jedem Monat ihre vorhandene Grundlage: Garagenrechnung, Darlehensübersicht, Grundbesitzabgaben, Wasser- und Stromabrechnung, Gas-Schlussabrechnung beziehungsweise neuer Wärmepumpen-Stromvertrag. Die Gas-Schlussabrechnung belegt ausdrücklich die neun Abschläge von je 210 EUR vor dem Heizungstausch. Für Wohnraummieten, Bausparen und private Abonnements fehlen passende Vertrags- oder Rechnungsgrundlagen im Belegstapel; deshalb bleiben ihre Verweislisten leer. Eine frühere Nebenkostenabrechnung oder eine Wohnungsanzeige ersetzt keinen Mietvertrag für den vollständigen laufenden Mietbetrag.

Mietkautions-Eingänge, Anlage auf Kautionskonten, Rückzahlung und Tagesgeld-Umbuchungen wurden nicht als Mieterlöse oder Handwerkerzahlungen verknüpft. Barquittungen wurden keiner Geldautomatenabhebung allein wegen zeitlicher Nähe zugeordnet. Erst die ausdrücklich benannte Einzahlung im Dezember wird mit den beiden Garagenquittungen G1-2026-03 und G1-2026-04 verbunden.

Rechnungsnummern wurden nur aus dem Zweck entnommen und anhand vorhandener Belege normalisiert, etwa `RG26112` zu `26-112`, `RNR 26004471` zu `26-004471` und `Invoice 2026 00457` zu `INV-2026-00457`. Die verkürzte Angabe `G1-2026-03/-04` wurde in beide belegten Nummern aufgelöst. Kunden-, Vertrags-, Mandats-, Auftrags-, Förderantrags- und Kassenzeichen wurden nicht als Rechnungsnummern behandelt.

## Zweifel im Bankschema

Das vorgegebene Bankschema hat kein Feld `grund`. Sämtliche 15 dort als unsicher markierten Einträge sind hier erläutert:

- **FunkNetz Mobil, alle zwölf Monate:** Im Zweck steht jeweils „Rg MM/2026“. Als ausdrücklich benannte Rechnungsreferenz wurde MM/2026 übernommen. Alternative: reine Abrechnungsperiode, dann leere Nummernliste. Eine Rechnung zur Klärung liegt nicht vor; `stuecke` bleibt leer.
- **Wasser Januar Nr. 10 und Februar Nr. 12:** Der frühere Abschlag von 80 EUR ist aus der Jahresabrechnung belegt, der neue Betrag von 85 EUR gilt erst ab März. Ein gesonderter Januar-/Februar-Abschlagsplan fehlt; alternativ kein Verweis.
- **Dezember Nr. 10:** Eingang aus Bareinzahlung mit zwei ausdrücklich genannten Garagenquittungen. Gemäß „eingehende Zahlungen = gutschrift“ so typisiert; Alternative `bar` für die technische Zahlungsart. Gegenpartei bleibt wörtlich „Bareinzahlung“.

## Salden und Seitenüberträge

Anfangssaldo plus sämtliche Gutschriften minus sämtliche Belastungen ergibt in jedem Monat exakt den gedruckten Endsaldo. Alle acht Überträge auf Blatt 2 wurden gegen die ersten elf Umsätze und gegen den Übertrag von Blatt 1 geprüft. Überträge, Anfangs- und Endsalden zählen nicht als Umsätze.

| Auszug | Umsätze | Anfang EUR | Ende EUR | geprüfter Seitenübertrag EUR |
| --- | ---: | ---: | ---: | ---: |
| 2026-01.txt | 17 | 6.842,17 | 6.819,72 | – |
| 2026-02.txt | 21 | 6.819,72 | 5.242,33 | 7.162,39 |
| 2026-03.txt | 18 | 5.242,33 | 5.202,41 | – |
| 2026-04.txt | 22 | 5.202,41 | 4.109,28 | 6.935,11 |
| 2026-05.txt | 21 | 4.109,28 | 2.322,48 | 4.180,52 |
| 2026-06.txt | 22 | 2.322,48 | 1.780,14 | 3.886,38 |
| 2026-07.txt | 19 | 1.780,14 | 923,34 | 2.526,96 |
| 2026-08.txt | 19 | 923,34 | 1.655,20 | 2.232,43 |
| 2026-09.txt | 16 | 1.655,20 | 1.685,80 | – |
| 2026-10.txt | 19 | 1.685,80 | 2.662,65 | 4.188,15 |
| 2026-11.txt | 20 | 2.662,65 | 6.309,00 | 3.929,38 |
| 2026-12.txt | 18 | 6.309,00 | 6.610,77 | – |

## Eingaben

Pfad: `docs/fremdpruefung/auftraege/012-vermieter-2/`, jeweils am oben genannten Quellcommit.

| Datei | Git-Blob-SHA |
| --- | --- |
| `AUFTRAG.md` | `5f07db40d251f932655224023ea91b71fd883807` |
| `BANK.txt` | `46fd436602bdcf78e8da7ca665bfe5de47e1cb26` |
| `BELEGE.txt` | `519fa738f4e0893ea91ed810f3309e6db0ae7790` |
| `KONTEN.json` | `d801017a44c5854277df1fcaf153ae9147d62025` |

Vor Veröffentlichung waren Quelle und Claude-Puls unverändert; im geprüften Zielstand war noch kein Ergebnis für 012 vorhanden. Gemeinsame Ablage mit Auftrag 011: Codex-Puls 12 quittiert Claude-Puls 19.
