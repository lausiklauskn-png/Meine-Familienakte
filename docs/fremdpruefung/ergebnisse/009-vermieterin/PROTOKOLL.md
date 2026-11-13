# Protokoll – Auftrag 009-vermieterin

- Modell: Codex (GPT-6); eine genauere Modellvariante ist mir nicht bekannt.
- UTC: 2026-11-13T10:12:26Z
- Quellzweig: `claude/familienakte-bildintegration-il59yw`.
- Gelesener und vor Veröffentlichung erneut abgeglichener Quellstand: `8caf291d453e1277cce30782ff9cbc72f62be0e9`.
- Verarbeiteter Claude-Puls: 13.
- Zielzweig: `codex/fremdpruefung`; abgeglichener vorheriger Stand: `8bebcf1256439fe81dd20bab890e119ba8853412`.

## Bearbeitung und Formprüfung

Alle 93 Schriftstücke, 45 Belege und zwölf Kontoauszüge wurden vollständig gelesen. Die Einordnungen und Verknüpfungen beruhen auf eigenem Urteil, ohne Stichwort-Klassifikator, fremde Einordnungen oder externe Recherche. Skripte dienten ausschließlich dem Aufteilen der Texte, der Übernahme unveränderter Bankfelder, dem Zusammensetzen der manuell festgelegten Entscheidungen und der Prüfung.

- `DRITTER.json`: 93 Einträge, jeder Kopfzeilen-Dateiname genau einmal; Bereiche, Zweitfächer und Schriftstückarten wörtlich aus den Listen. 21 Einträge sind als unsicher markiert.
- `DRITTER-BELEGE.json`: 45 Einträge, jeder Beleg genau einmal, Dateinamen ohne `belege/`; ausschließlich Konten aus KONTEN.json. 21 Einträge sind als unsicher markiert.
- `DRITTER-BANK.json`: zwölf Auszüge mit insgesamt 223 Umsätzen, je Auszug fortlaufend ab 1. 54 Umsätze sind als unsicher markiert. Alle referenzierten Dateien existieren im gelesenen Stapel.
- JSON-Form, Pflichtfelder, Listenzugehörigkeit, Datums- und Betragsformate sowie Zweifelgründe geprüft. Die Gründe in den ersten beiden Teilen bleiben bei höchstens 15 Wörtern.
- In allen zwölf Auszügen stimmt alter Kontostand plus erfasste Umsätze centgenau mit dem neuen Kontostand überein. Kontostände wurden nicht als Umsätze gezählt.

## Auslegungen und gekennzeichnete Zweifel

Schriftstücke werden aus Sicht des einzigen Haushaltsmitglieds Hannelore Wiebusch eingeordnet. Die Mieter sind in HAUSHALTE.json gesondert aufgeführt und werden nicht zu Haushaltsmitgliedern gemacht. Zahlungs- und Antwortfristen, die Wiebusch ihren Mietern oder einem Inkassounternehmen setzt, sind keine Handlungsfrist ihres Haushalts. Bei mehreren eigenen Pflichten wurde die gewählte Frist mit Alternativen gekennzeichnet. Abbuchungen, Laufzeiten und bloße Rechtsbehelfsfristen bleiben leer.

In der Kontenliste fehlen Mieterlöse ohne Umsatzsteuer und mehrere spezifische Vermietungskonten. Konto 8400 ist deshalb bei vier Vorgängen nur ein ausdrücklich unsicherer Ersatz für Miet- bzw. Nebenkostenerträge und deren Rückzahlung. Der Kontoname begründet keinen Steuerausweis. Privat erkennbare Ausgaben sind auf 1800 eingeordnet; ein möglicher Vermietungsanteil bei Pkw oder Telefon ist als Alternative genannt. Gemischte Leistungen wurden nicht in erfundene Teilbelege zerlegt. Bei ausdrücklich nicht steuerbaren Beiträgen/Gebühren wurde `ust: null` gewählt und 0 als alternative Darstellung genannt; ausdrücklich steuerfreie Leistungen erhielten 0. Der gemischte Apothekenbon ist als unsicher gekennzeichnet.

Gutschriften von Dröge und Stadtwerken sind wirtschaftlich Zuflüsse (`einnahme`), trotz Ausstellung durch Dritte; alternativ wäre eine negative Ausgabe auf dem ursprünglichen Kostenkonto darstellbar. Die Ausgabeanweisung für eingehende Fremdbelege wurde nicht als Aussage ausgelegt, dass eine ausdrücklich zugesagte Rückzahlung ein Geldabgang sei. Bei Abschlagsplänen ist der monatliche Abschlag erfasst; bei der Schlussrechnung nur der noch zu zahlende Rest, bei der Nebenkostenabrechnung nur Nachforderung oder Guthaben.

Bei den Bankverknüpfungen gelten folgende Grenzen:

- Fehlende Monatsrechnungen wurden nicht durch andere Monatsrechnungen gleichen Betrags ersetzt. Beispielsweise passt Brinkmeiers Januar-Rechnung zum Februar-Umsatz, die Juni-Rechnung zum Juli-Umsatz.
- Alte Gasabschläge, Allgemeinstrom vor März, die frühere Brandtner-Miete, die regulären Petrović-Mieten und die Scholten-Mieten sind teilweise nur rückblickend oder mittelbar dokumentiert; entsprechende Verknüpfungen tragen `sicher: false`.
- Für privaten Strom (58 Euro) fehlt der eigene Abschlagsplan. Die beiläufige Erwähnung im Allgemeinstromplan wurde nicht als vollständiger Zahlungsbeleg verknüpft; die Umsätze sind unsicher markiert. Auch die Zeitungsabbuchung für das erste Quartal hat keinen passenden Periodenbeleg.
- Bei Telvia fehlen die meisten Einzelrechnungen. Preisbriefe belegen den Tarif, aber nicht jede konkret genannte Rechnung; diese Zuordnungen sind unsicher. Im April passen der im Verwendungszweck genannte März-Zeitraum und die ab April geltende Preiserhöhung nicht eindeutig zusammen. Die vorhandene Oktober-Rechnung und der Glasfaservertrag wurden gesondert zugeordnet.
- Bei Quartalsentgelten ist die Bank aus dem Auszugskopf als Gegenpartei eingesetzt; die Umsatzzeile selbst nennt nur eine Entgeltbeschreibung. Für Q2 bis Q4 wurde die Q1-Abrechnung nicht als periodengleicher Beleg verknüpft. Diese vier Umsätze sind unsicher markiert.
- Alle Eingänge heißen `gutschrift`, auch bei einem Dauerauftrag des Mieters. Nur Wiebuschs eigene wiederkehrende Überweisungen heißen `dauerauftrag`. Bargeldabhebungen wurden nicht ohne Nachweis einzelnen Barbelegen zugerechnet.
- Rechnungsnummern wurden nur aus dem Verwendungszweck übernommen und gegebenenfalls am vorhandenen Beleg bereinigt (etwa `RE 2025 0113` und `RG 0688`). Kunden-, Vertrags-, Mandats-, Buchungs-, Liefer- und Urkundenverzeichnisnummern sind keine Rechnungsnummern.
- Bei der Schlusszahlung stehen beide im Verwendungszweck genannten Rechnungsnummern, als zahlungsbegründendes Stück aber nur die Schlussrechnung. Bei der Rückerstattung gilt entsprechend die Gutschrift. Die Sammelzahlung 264,18 Euro ist beiden Rechnungen über 189,21 und 74,97 Euro zugeordnet. Doppelte Unterlagen zur selben Nebenkostenforderung sind beide verknüpft, ohne den Umsatz zu verdoppeln.

Die Zweifel sind Feld- und Belegzweifel; es besteht keine unauflösbare Unklarheit über die Durchführung des Auftrags.

## Eingehaltene Grenze

Gelesene Repo-Inhalte ausschließlich unter `docs/fremdpruefung/`. Keine anderen Repo-Dateien, keine anderen Repos, keine externe Recherche. Verweise auf Pfade außerhalb dieses Ordners wurden nicht verfolgt. GitHub wurde nur für dieses Repo, die erforderlichen Git-Metadaten und die Veröffentlichung benutzt.

Geschrieben ausschließlich unter `docs/fremdpruefung/ergebnisse/`: die drei Ergebnis-JSON-Dateien, dieses Protokoll und das Codex-Fähnchen. Bestehende Ergebnisse werden erhalten. Veröffentlichung als einzelner neuer Commit auf dem abgeglichenen Zielzweig, mit Prüfung des erwarteten Vorgängerstands; kein Merge, kein Force-Push, keine Auftragsänderung, keine PR-Kommentare oder Nachrichten an andere.

## Eingaben am festgehaltenen Quellstand

- `AUFTRAG-TEIL1-SCHRIFTSTUECKE.md`: Blob `070230b856f945ab4737ee812f43dc079c1d38a0`.
- `AUFTRAG.md`: Blob `c0de0090d14295bcd855d863e6325e627e2893cc`.
- `BANK.txt`: Blob `501ab1d2120d53a4e833e89496ecd3c8b79af74c`.
- `BELEGE.txt`: Blob `181116cf69cf0ef821ec697850067ec10bb11a4d`.
- `BEREICHE.json`: Blob `ad3bbbcb5aa65ad532be7345aa788d688fc86dbb`.
- `BRIEFE.txt`: Blob `3e8dd053e8eb73e06d8d076132bc144899edbed2`.
- `FACHREGEL.md`: Blob `346ccaffd60c89a160d144f27285a372af1949a4`.
- `HAUSHALTE.json`: Blob `474bcfd20ffd150938050d8b62c522e566a01ab4`.
- `KONTEN.json`: Blob `d801017a44c5854277df1fcaf153ae9147d62025`.
- `SCHRIFTSTUECKE.json`: Blob `e95c6e8b25a793c97e0cb530e3fa627b552cd1cb`.
