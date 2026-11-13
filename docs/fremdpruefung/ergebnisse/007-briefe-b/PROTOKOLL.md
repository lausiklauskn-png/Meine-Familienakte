# Protokoll – Auftrag 007

- Modell: Codex (GPT-6). Eine genauere Modellvariante ist mir nicht bekannt.
- Abschluss (UTC): 2026-11-13T01:33:51Z
- Quellzweig: `claude/familienakte-bildintegration-il59yw`
- Gelesener Quellcommit: `d6046bace7fef5fe21ed9b36f7c5182f43aabf3e`; Claude-Puls 11.
- Ergebniszweig: `codex/fremdpruefung`
- Lesegrenze eingehalten: Repo-Inhalte ausschließlich aus `docs/fremdpruefung/`. Keine anderen Repo-Dateien, keine anderen Repos, keine externe Recherche. GitHub nur für Abruf und Veröffentlichung dieses Repos.

Alle 150 Schriftstücke nach eigenem inhaltlichem Urteil eingeordnet, ohne Stichwort-Klassifikator, Unteragenten oder fremde Lösungen. Die Tabelle in FACHREGEL.md bestimmt die fachlichen Grenzfälle. 40 Einträge sind mit `sicher: false` samt betroffenem Feld und zweiter Möglichkeit gekennzeichnet. Keine unauflösbare Auftragsunklarheit.

Personen wurden anhand des Haushalts kanonisiert; Patienten, Versicherte und Kinder sind von bloßen Empfängern oder Vertretern unterschieden. Bei Nachlass- und Bestattungssachen ist die Abgrenzung zwischen Verstorbener und zahlendem Erben ausdrücklich markiert. Gemeinsame Angelegenheiten bleiben ohne Einzelperson. Fristen für Insolvenzgläubiger sind keine Pflichten des Schuldnerhaushalts. Lastschriften, bloße Vertragslaufzeiten und allgemeine Rechtsbehelfsfristen wurden nicht als Frist übernommen. Relative, empfohlene oder bedingte Termine und erschlossene HU-Monatsenden sind gekennzeichnet.

Formprüfung bestanden: 150 Einträge; jeder Eingabedateiname genau einmal; Haupt- und Zweitfächer sowie Schriftstückarten aus den erlaubten Listen; Absender wörtlich im Text; Personen im jeweiligen Haushalt; gültige ISO-Kalenderdaten; höchstens 15 Wörter je Zweifelsbegründung. Skripte nur zur Strukturprüfung und Ausgabe.

Eingabestände (Git-Blob-SHA):
- AUFTRAG.md: `4d36b1b90c5068430087f61fcae5fb98f8e0addf`
- BRIEFE.txt: `86eeb2e0c33043058b26b7d3f02f189d90c447c9`
- BEREICHE.json: `ad3bbbcb5aa65ad532be7345aa788d688fc86dbb`
- SCHRIFTSTUECKE.json: `e95c6e8b25a793c97e0cb530e3fa627b552cd1cb`
- HAUSHALTE.json: `06f8902af888b63e29143a813048fc65fa6b9ad3`
- FACHREGEL.md: `346ccaffd60c89a160d144f27285a372af1949a4`

Vor Veröffentlichung Zielzweig und bestehende Ergebnisse geprüft. Veröffentlicht werden nur DRITTER.json, dieses Protokoll und das Codex-Fähnchen. Bestehende Ergebnisse bleiben erhalten. Kein Merge, kein Force-Push, keine Auftragsänderungen und keine Kommentare oder Nachrichten an andere.
