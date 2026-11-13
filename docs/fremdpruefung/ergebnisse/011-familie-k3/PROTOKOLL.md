# Unabhängige Fremdprüfung 011 – Familie mit drei Kindern

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

`DRITTER.json` enthält alle **150 Schriftstücke**, jeden Kopfzeilen-Dateinamen genau einmal. **30 Einordnungen** sind mit `sicher: false` und einem feldbezogenen Grund samt Alternative gekennzeichnet. Die Gründe umfassen jeweils höchstens 15 Wörter.

Bestanden: JSON-Struktur, geforderte Schlüssel und Typen, wörtliche Bereichs- und Schriftstücklisten, Dateinamen und Eindeutigkeit, Datumsformat, Zugehörigkeit der Person zum jeweils angegebenen Haushalt und wörtliches Vorkommen der Absendernamen im betreffenden Schriftstück. Dieses Protokoll hält Modell, UTC-Zeit, Lesegrenze und Herkunft für die JSON-Datei fest.

## Entscheidungen

Alle 150 Texte wurden vollständig gelesen und einzeln nach eigenem Urteil eingeordnet. Es wurde kein Stichwort-Klassifikator eingesetzt, kein anderer Prüfer beauftragt und keine Einordnung eines früheren Stapels übernommen. Programmatische Verarbeitung diente nur der Ausgabe und Überprüfung der manuell getroffenen Entscheidungen.

Die Tabelle der Fachregel bestimmt insbesondere Fahrzeugversicherungen, Krankenkassenpost, Kinder- und Ausbildungsleistungen, objektbezogene Steuern, Gerätegarantien, Mitgliedschaften und Inkassoschreiben. Halbwaisenrenten wurden als Geld beziehungsweise Bescheide fürs Kind unter Familie & persönliche Dokumente mit Zweitfach Steuern & Behörden eingeordnet; die ebenfalls plausible Rentenablage ist als Zweifel genannt. Erwerbsarbeit einer Werkstudentin bleibt im Arbeitsfach.

Personen wurden anhand der beiden Haushalte bestimmt. Bei Schreiben über Gertrud Halbig bleibt sie die betroffene Person, auch wenn ihre Tochter als Bevollmächtigte angeschrieben wird. Thomas Brandauer bleibt bei Schriftstücken über seine Versicherung, Bestattung oder seinen Nachlass als betroffene Person möglich; sein Tod entfernt ihn nicht aus der vorgegebenen Haushaltsliste. Bei einer Erbengemeinschaft beziehungsweise gemeinsamen Angelegenheiten bleibt das Personenfeld leer. Zweifelhafte Abgrenzungen zwischen versicherter Person, Auftraggeberin und Leistungsempfängerin sind ausdrücklich markiert.

Fristen beziehen sich auf eigene Zahlungen, Handlungen und Termine des Haushalts. Ausgehende Bitten um Bestätigung oder Zahlung an andere begründen keine eigene Frist. Abbuchungstage, Laufzeiten, allgemeine Rechtsbehelfsbelehrungen und bloße Werbeaktionen bleiben leer. Bei mehreren eigenen Terminen oder Raten wurde der Haupttermin beziehungsweise die früheste Handlung gewählt und eine relevante Alternative angegeben.

Für Fristen nach Zugang wurde die ausdrücklich vorgegebene Annahme **Zugang = Briefdatum + 3 Kalendertage** verwendet, danach die genannte Frist addiert. Beispielsweise ergibt die Pflegedienstrechnung vom 06.07.2026 mit 14 Tagen nach Erhalt den 23.07.2026; die Witwenrenten-Anforderung vom 07.04.2026 mit vier Wochen nach Zugang den 08.05.2026. Es wurde keine zusätzliche, im Auftrag nicht verlangte Wochenendverschiebung unterstellt. Das Datum im Schriftstück hat Vorrang vor einem abweichenden Scan-Dateinamen.

## Eingaben

Pfad: `docs/fremdpruefung/auftraege/011-familie-k3/`, jeweils am oben genannten Quellcommit.

| Datei | Git-Blob-SHA |
| --- | --- |
| `AUFTRAG-TEIL1-SCHRIFTSTUECKE.md` | `f03d7c8c86fc484091dfbd77150b697eaf89b77f` |
| `AUFTRAG.md` | `b9ef65033c29016df57ac4a5853931971958947f` |
| `BEREICHE.json` | `ad3bbbcb5aa65ad532be7345aa788d688fc86dbb` |
| `BRIEFE.txt` | `278dee5def4fedf5519ed8ff606e97942f12fcf6` |
| `FACHREGEL.md` | `346ccaffd60c89a160d144f27285a372af1949a4` |
| `HAUSHALTE.json` | `fe551fa40621a39189b6bb15f57c0b081d679e3f` |
| `SCHRIFTSTUECKE.json` | `e95c6e8b25a793c97e0cb530e3fa627b552cd1cb` |

Vor Veröffentlichung waren Quelle und Claude-Puls unverändert; im geprüften Zielstand war noch kein Ergebnis für 011 vorhanden. Gemeinsame Ablage mit Auftrag 012: Codex-Puls 12 quittiert Claude-Puls 19.
