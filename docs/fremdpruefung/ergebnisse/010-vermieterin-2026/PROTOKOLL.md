# Unabhängige Fremdprüfung 010 – Vermieterin 2026

- Modell: **Codex (GPT-6)**. Eine genauere Modellvariante ist mir nicht verlässlich bekannt.
- Ergebnis erstellt und geprüft (UTC): **2026-11-13T12:16:20Z**.
- Repo: `lausiklauskn-png/Meine-Familienakte`.
- Gelesener Quellzweig: `claude/familienakte-bildintegration-il59yw`.
- Festgehaltener Quellcommit: `65d335f3471f6973647ae8192b489f5cb70735ce`.
- Verarbeiteter Claude-Puls: **16**, einschließlich der Klarstellungen zu eigenen Fristen und wiederkehrenden Zahlungen.
- Zielzweig: `codex/fremdpruefung`; vor Veröffentlichung geprüfter Ausgangscommit: `a8947cb102ff034b6c616a720500af41fdff229c`.
- Lesegrenze eingehalten: Als Repo-Inhalte ausschließlich **docs/fremdpruefung/** gelesen. Keine anderen Repo-Dateien, keine anderen Repos, keine externe Recherche. GitHub nur für diesen Briefkasten, Git-Metadaten und Veröffentlichung verwendet.
- Schreibgrenze: nur **docs/fremdpruefung/ergebnisse/**. Bestehende Ergebnisse bleiben erhalten. Kein Merge, kein Force-Push, keine Auftragsänderung, kein PR-Kommentar und keine Nachricht an andere.

## Vorgehen und Form

Alle Entscheidungen beruhen auf den Eingaben dieses Auftrags am angegebenen Quellcommit. Die Einordnungen von Auftrag 009 wurden für 010 nicht übernommen. Inhaltliche Entscheidungen erfolgten durch Lesen und eigenes Urteil, ohne Stichwort-Klassifikator oder weitere Prüfer. Programmatische Verarbeitung diente der Übernahme von Dateinamen und Umsatzzeilen, der JSON-Erzeugung und der Form-, Referenz- und Rechenprüfung.

Die drei JSON-Dateien behalten die geforderte Form; dieses Protokoll dokumentiert Modell, UTC-Zeit, Herkunft und Lesegrenze für alle drei Ergebnisse.

| Datei | Vollständigkeit | Unsicher markiert |
| --- | --- | --- |
| DRITTER.json | 94 Schriftstücke, jeden Kopfzeilen-Dateinamen genau einmal | 18 |
| DRITTER-BELEGE.json | 45 Belege, jeden Dateinamen ohne belege/ genau einmal | 20 |
| DRITTER-BANK.json | 12 Auszüge mit jeweils 20, insgesamt 240 Umsätzen | 18 |

Bestanden: gültige JSON-Struktur und Feldtypen; wörtliche Bereichs-, Schriftstück- und Kontenlisten; zulässige Haushaltszuordnung; Datums- und Betragsformate; eindeutige Namen; fortlaufende Umsatznummern; sämtliche Belegverweise innerhalb dieses Stapels; keine doppelten Verweise je Umsatz. Zweifelgründe der Schriftstücke haben höchstens 15 Wörter; diese Grenze wird auch bei den Belegen eingehalten.

Für jeden Kontoauszug wurden Belastungen und Gutschriften separat nachgerechnet und mit den gedruckten Summen verglichen. Anfangssaldo plus Gutschriften minus Belastungen ergibt in allen zwölf Fällen genau den Endsaldo. Jahressaldo: 14.891,71 EUR zu Beginn und 24.796,52 EUR am Ende. Betrag und Gegenpartei jeder Umsatzzeile wurden unverändert aus dem jeweiligen Auszug übernommen.

## Wesentliche Entscheidungen

- Fristen gelten für die Vermieterin selbst. Von ihr gegenüber Mietern gesetzte Zahlungs- oder Antwortfristen wurden nicht als ihre eigenen Fristen eingetragen. Reine Abbuchungsdaten, Vertragslaufzeiten sowie allgemeine Widerspruchs- und Kündigungsoptionen bleiben leer. Mehrere eigene Raten oder Termine passen nicht gemeinsam in ein Datumsfeld: Haupttermin beziehungsweise frühester Termin gewählt und Alternative im Zweifelgrund genannt.
- Die einzige Haushaltsangehörige ist Hannelore Wiebusch. Leistungsbescheide der Mieter wurden keinem fremden Haushaltsmitglied zugeschrieben; bei ihren eigenen Mietverhältnissen ist sie Vertragspartnerin.
- Die erhöhte Hauswartpauschale wird ab März bezahlt, weil die Rechnung für den Vormonat beglichen wird. Brandtners Juni-Zahlung besteht aus 800 EUR und 65 EUR Nachzahlung; anschließend 865 EUR. Aydemirs Juni-Zahlung berücksichtigt das Nebenkostenguthaben, ab September ergeben 212 EUR Wohngeld-Direktzahlung und 493 EUR Eigenanteil zusammen 705 EUR.
- Petrovics Rückstand, Barzahlung, Raten und vollständige Nachzahlung im Juli sind getrennt von der späteren Nebenkostennachzahlung. Die neue laufende Miete von 875 EUR gilt ab August.
- Wiederkehrende Zahlungen erhalten in jedem Monat die passende im Stapel vorhandene Grundlage: insbesondere Preisänderungen, Mietabrechnungen, Abschlagspläne, Steuerbescheide, Renten- und Pflegebescheid sowie Darlehensbestätigung. Dabei bedeutet ein Verweis auf eine Preisgrundlage nicht, dass die konkrete Monatsrechnung vorliegt.
- Rechnungsnummern stammen nur aus dem Verwendungszweck. Bestehende Rechnungen bestimmen die Schreibweise, beispielsweise Kallweit `RE20260298` → `2026-0298` und Tiedemann `2026/0241` → `RE 2026 0241`. Die beim Optiker als „Auftrag“ bezeichnete Nummer ist zugleich die Nummer seiner vorhandenen Rechnung. Mandate, Vertrags-, Kunden-, Buchungs-, Akten- und Kassenzeichen wurden nicht als Rechnungsnummern ausgegeben.
- Private Belege werden grundsätzlich auf 1800 eingeordnet. Bei gemischter Nutzung ist der mögliche andere Kostenansatz als Zweifel genannt. Das Ergebnis ist keine Aufteilung der Gebäudekosten nach Wohnflächen und trifft keine Aussage über Vorsteuerabzug oder steuerliche Abziehbarkeit.
- Für die Miet- und Kleinunternehmererlöse fehlt ein passendes Konto im vorgegebenen Auszug. 8400 ist deshalb ausdrücklich nur ein unsicherer Ersatz und behauptet keine tatsächlich anfallenden 19 Prozent Umsatzsteuer. 8120/8125 wurden wegen ihrer ausdrücklichen Beschränkung auf Ausfuhr beziehungsweise innergemeinschaftliche Lieferungen nicht gewählt.
- `ust` beschreibt den Beleg: 0 bei ausdrücklich belegter Steuerbefreiung, einschließlich § 19; null bei fehlendem Steuerausweis oder nur hoheitlicher Nichtsteuerbarkeit. Die Allgemeinstrom-Gutschrift wird wirtschaftlich als Einnahme beziehungsweise Kostenerstattung behandelt, trotz der vereinfachten Fremdbeleg-Regel; deshalb `sicher: false`.
- Die Schlussrechnung von Wöhlke enthält nur den noch zu zahlenden Restbetrag von 3.255,84 EUR; der zuvor erfasste Abschlag von 2.170,56 EUR wird nicht doppelt gezählt. Beim Kilometer-Eigenbeleg wird Aufwand statt eines behaupteten Geldflusses eingeordnet, ausdrücklich unsicher.

## Zweifel bei Bankzuordnungen

Das Bankschema enthält kein Feld `grund`. Die folgenden Erläuterungen betreffen sämtliche dort mit `sicher: false` markierten Umsätze. Nummern beziehen sich auf die Reihenfolge im jeweiligen Auszug.

| Auszug und Umsatznummer | Zweifel und Alternative |
| --- | --- |
| Januar Nr. 6; Februar Nr. 6 | Allgemeinstrom 34 EUR: Die Jahresabrechnung belegt den früheren Abschlag und den Wechsel auf 35 EUR ab März. Ein ausdrücklicher Abschlagsplan für Januar/Februar fehlt; alternativ kein Stückverweis. |
| Januar Nr. 20; Februar Nr. 20 | Witwenrente 698,40 EUR: Krankenkassenschreiben erklärt die spätere Beitragsumstellung ab März, Rentenmitteilung nennt jedoch nur 696,02 EUR bis Juni. Die genaue Bruttobasis der früheren Witwenrente fehlt; Zuordnung plausibel, exakter Januar-/Februar-Bescheid fehlt. |
| Februar Nr. 13; März Nr. 14 | Reinigung: Januar-Rechnung belegt die monatliche Pauschale, die konkreten Februar-/März-Rechnungen liegen nicht vor. Alternativ nur die jeweilige fehlende Monatsrechnung zuordnen. |
| Mai Nr. 11; Juni Nr. 13; Juli Nr. 12; August Nr. 14; September Nr. 12; Oktober Nr. 13; November Nr. 13; Dezember Nr. 14 | Reinigung: April-Rechnung dokumentiert die dauerhafte Preisanpassung; konkrete Folgemonatsrechnungen fehlen. Preisgrundlage daher wiederholt verknüpft, alternativ keine Verknüpfung ohne Monatsrechnung. |
| April Nr. 17 | Bareinzahlung „Petrovic Rueckstand“ passt zur Quittung über 200 EUR. Gemäß der ausdrücklichen Vorgabe „eingehende Zahlungen = gutschrift“ so typisiert; alternativ `bar` für den Einzahlungsvorgang. Gegenpartei bleibt wörtlich „EINZAHLUNG AM SCHALTER“. |
| Mai Nr. 7 | Pflegekassen-Erstattung für Januar–März entspricht der eingereichten Rechnung über 393 EUR; der konkrete Erstattungsbescheid fehlt. Alternativ kein Verweis, wenn nur ein Bescheid als Zahlungsgrundlage gelten soll. |
| Juli Nr. 7; Oktober Nr. 8 | Zahlung beziehungsweise Erstattung für Alltagshilfe April–Juni: Rechnung 2026-Q2-019 und passender Erstattungsbescheid fehlen. Keine Verknüpfung mit der Rechnung des ersten Quartals nur wegen gleicher Summe; mögliche wiederkehrende Leistung bleibt unbestätigt. |

Die Altersrente im Januar und Februar von 1.142,37 EUR ist durch die erst ab März wirksame Erhöhung des halben Zusatzbeitrags erklärbar: 1.138,46 EUR zuzüglich 3,91 EUR Differenz. Dafür wurden Krankenkassenschreiben und Rentenmitteilung gemeinsam verknüpft. Ab März gelten die niedrigeren alten Zahlbeträge, ab Juli die neue Rentenhöhe. Es wurde kein Kontoumsatz an einen erwarteten Betrag angepasst.

Leere `stuecke`-Listen bedeuten, dass im gelieferten Stapel keine geeignete konkrete Zahlungsgrundlage gefunden wurde, etwa bei Bargeldabhebungen, einzelnen privaten Käufen, internen Umbuchungen oder einer nicht mitgelieferten Rechnung. Bargeldbelege wurden nicht allein wegen zeitlicher Nähe an eine Geldautomatenabhebung gehängt.

## Eingaben am festgehaltenen Quellstand

Pfad: `docs/fremdpruefung/auftraege/010-vermieterin-2026/`.

| Eingabe | Git-Blob-SHA |
| --- | --- |
| `AUFTRAG.md` | `916694073ba1d6e83e194024e3af1070f769e9fe` |
| `AUFTRAG-TEIL1-SCHRIFTSTUECKE.md` | `1b73c86f59f28ac16a49597e315d54da06425be2` |
| `BANK.txt` | `16247c12b5c5c16fbc3a5a0ea5dd4075cc26ec7e` |
| `BELEGE.txt` | `a198789a324542901e6f616f1af64b87c6fcd49b` |
| `BEREICHE.json` | `ad3bbbcb5aa65ad532be7345aa788d688fc86dbb` |
| `BRIEFE.txt` | `63a69cff8804f3fbf9a6f467191b99cf01894f9b` |
| `FACHREGEL.md` | `346ccaffd60c89a160d144f27285a372af1949a4` |
| `HAUSHALTE.json` | `bcce4d42125a57c39573198ec2620e016a9a809f` |
| `KONTEN.json` | `d801017a44c5854277df1fcaf153ae9147d62025` |
| `SCHRIFTSTUECKE.json` | `e95c6e8b25a793c97e0cb530e3fa627b552cd1cb` |

Vor Veröffentlichung wurde der neue Claude-Stand `7a6b1e79a5da3e4f449be2827bc80e70da124361` geprüft: Claude-Puls weiterhin 16; VERBINDUNG.md und STAND.md unverändert; alle zehn Auftrags- und Eingabedateien anhand ihrer Git-Blob-SHAs identisch mit dem oben dokumentierten gelesenen Quellstand. Der Zielcommit ist weiterhin der oben genannte Ausgangsstand; kein Ergebnisordner für 010 vorhanden. Die Veröffentlichung erfolgt als einzelner Folgecommit mit Prüfung des erwarteten Zielstands. Codex-Puls steigt von 10 auf 11 und quittiert Claude-Puls 16.
