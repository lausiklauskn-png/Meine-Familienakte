# Protokoll – Auftrag 005

- Modell: Codex (GPT-6). Eine genauere Modellvariante ist mir nicht bekannt.
- Abschluss (UTC): 2026-11-13T01:19:05Z
- Quellzweig: `claude/familienakte-bildintegration-il59yw`
- Gelesener Quellcommit: `d6046bace7fef5fe21ed9b36f7c5182f43aabf3e`; Claude-Puls 11.
- Ergebniszweig: `codex/fremdpruefung`
- Lesegrenze eingehalten: Repo-Inhalte ausschließlich aus `docs/fremdpruefung/`. Keine anderen Repo-Dateien, keine anderen Repos, keine externe Recherche. GitHub nur für Abruf und Veröffentlichung dieses Repos.

Alle 150 Schriftstücke persönlich nach Inhalt beurteilt, ohne Stichwort-Klassifikator und ohne Vergleich mit anderen Lösungen. Die Tabelle in FACHREGEL.md ist für Haupt- und Zweitfach maßgeblich. 37 Einträge enthalten mindestens einen Zweifel und sind mit `sicher: false` samt Feld und Alternative markiert. Keine unauflösbare Auftragsunklarheit.

Personen entsprechen den Namen in HAUSHALTE.json; deshalb erscheint „Emil Jakob Schellhaas“ als „Emil Schellhaas“. Bei gemeinsamen Angelegenheiten bleibt die Person leer. Fristen beziehen sich auf Haushaltsaktionen oder Termine; Lastschriften, bloße Laufzeiten und allgemeine Widerspruchsfristen bleiben unberücksichtigt. Bei mehreren konkreten Pflichten wurde grundsätzlich die früheste gewählt und die andere Möglichkeit bei Bedarf genannt. Relative Termine ohne verlässlichen Bezug sind ausdrücklich unsicher.

Formprüfung bestanden: 150 Einträge, alle Eingabedateinamen genau einmal; Bereiche, Zweitfächer und Schriftstückarten aus den erlaubten Listen; Personen dem jeweiligen Haushalt zugehörig; Absender wörtlich im Brief; Datumsformat und Kalenderdatum gültig; Zweifelsbegründungen höchstens 15 Wörter. Skripte dienten nur Strukturprüfung und Ausgabe, nicht der Einordnung.

Eingabestände (Git-Blob-SHA):
- BRIEFE.txt: `1615eca401b444f8071c2e0f42acd76e41fa2504`
- BEREICHE.json: `ad3bbbcb5aa65ad532be7345aa788d688fc86dbb`
- SCHRIFTSTUECKE.json: `e95c6e8b25a793c97e0cb530e3fa627b552cd1cb`
- HAUSHALTE.json: `3d3a31c250091e7f3e56a21743055cc5ee8bb74c`
- FACHREGEL.md: `346ccaffd60c89a160d144f27285a372af1949a4`

Vor Veröffentlichung wurde der Zielzweig auf vorhandene Ergebnisse geprüft. Bestehende Ergebnisse bleiben erhalten; veröffentlicht werden nur DRITTER.json, dieses Protokoll und das Codex-Fähnchen. Kein Merge, kein Force-Push, keine Änderungen an Aufträgen und keine Kommentare oder Nachrichten an andere.
