# Erzeugungsrollen und Grenzen der Unabhängigkeit

Codex (GPT-6), UTC 2026-11-12 22:40:59 UTC. Repo-Inhalte ausschließlich unter `docs/fremdpruefung/`; keine anderen Repos, keine externe Recherche. Auftrag 002 verlangte ausdrücklich eigene Agenten.

Alle Hilfsagenten starteten ohne geerbten Gesprächsverlauf. Sie erhielten dieselbe erlaubte Kontenliste. Der Name bezeichnet eine getrennte Arbeitsinstanz, keinen nachweislich anderen Modelltyp.

| Instanz | Aufgabe | freigegebener Lesestoff |
| --- | --- | --- |
| lehrdaten_a | 114 Lehrbelege Fahrradwerkstatt/Handel, drei je Konto | Kontenliste und eigene Ausgabedatei |
| lehrdaten_b | 114 Lehrbelege Büroservice/Schreibwaren/Gestaltung, drei je Konto | Kontenliste und eigene Ausgabedatei |
| lehrdaten_c | 114 Lehrbelege Feinkostküche/Catering, drei je Konto | Kontenliste und eigene Ausgabedatei |
| blind_pruefstapel | 120 Prüfbelege Töpferei mit Soll und Metadaten | Kontenliste und selbst erzeugte Dateien |
| stapel4_namen | unveränderte Texte aus Stapel 4 und wörtliche Firmenmaske | ausschließlich die freigegebene Quelldatei BELEGE-STAPEL-4.txt |
| Hauptinstanz | Modellcode, Training, Vorhersagen, spätere Auswertung und Bericht | Briefkasten gemäß Nutzerauftrag; Prüfsoll erst nach Vorhersage im Auswertungsschritt |

Die Lehragenten sollten 250–700 Zeichen je eigenständig erfundenem Beleg schreiben; der Prüfagent 300–1000 Zeichen. Vorgegeben waren plausible Geschäftsvorfälle, variierte Formen, die Kontenliste, keine Kontonummer als Textlabel und korrekt dokumentierte Unterschiede etwa bei Privatnutzung oder Reisen. Es wurden keine Firmen, Texte oder Lösungswerte aus Claudes Stapel zum Lehrdatenauftrag mitgegeben.

Der Prüfagent erhielt weder Systembeschreibung noch Lehrdaten. Sein vorab genanntes Gewerbe war die Töpferei; die anderen Gewerbe wurden dem Trainingsbereich zugewiesen. Seine Aufgabe verlangte ungefähr 25–40 schwierigere Belege mit OCR-Störungen, unpassenden Betreffen, Gutschriften und ähnlichen Geschäftsvorfällen. Das Soll entstand mit den Texten, vor Einsicht in Vorhersagen. Es wurde nicht nach dem Modellergebnis korrigiert.

Eine spätere reine Metadaten-Ergänzung verlangte bei allen Erzeugern eine Liste der wörtlichen Firmennamen, getrennt von Personennamen. Sie änderte weder Geschäftsvorfälle noch Sollwerte. Diese Listen ermöglichen nur einen kontrollierten Vergleich ohne Firmen; sie sind keine Leistung des kleinen Klassifikators.

Die Trennung war durch Aufgaben und getrennte Kontexte organisiert. Die Agenten teilten ein Dateisystem; es gab keinen technisch abgeschotteten Prüfserver. Alle Instanzen stammen aus derselben bekannten Modellfamilie. Gemeinsame Vorlieben, Formulierungen und Fehler sind daher möglich. „Unabhängig“ bedeutet hier: kein Einblick des Prüferzeugers in Lehrdaten oder System, keine nachträgliche Anpassung an die Vorhersagen.

Die Hauptinstanz hatte Claudes Stapel 4 bereits für Auftrag 003 gelesen. Deshalb wird für diesen Teil keine vollständige menschliche Blindheit behauptet. Das kleine Modell erhält ausschließlich neue Lehrdaten. Ein Training auf den 003-Zuordnungen oder ein Abgleich mit ihnen findet in Auftrag 002 nicht statt.
