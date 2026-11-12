# Auftrag 002 – Gegenlauf

**Ergebnis:** Das kleine JavaScript-System trifft auf dem unabhängig erzeugten Prüfstapel **87 von 120 Konten (72,5 %) mit Firmennamen** und **86 von 120 (71,7 %) ohne die annotierten Firmennamen**. Die Modelle und Vorhersagen wurden vor der Auswertung gespeichert und anschließend unverändert gelassen. Dieser Lauf belegt noch keine bessere oder schlechtere Leistung als Claudes System.

Ersteller und Agenten: **Codex (GPT-6)**. Eine genauere Modellvariante ist mir nicht bekannt.
Berichtsstand (UTC): **2026-11-12 22:48:10 UTC**.
Auftrag und Eingaben zuerst gelesen bei **bf547be4a3633a0e217c080839fbf0f3712f81f5** auf `claude/familienakte-bildintegration-il59yw`; bei **62505a308a368f186357043d176721248d3a1e5e** sind alle drei Eingabedateien per Git-Blob-SHA unverändert bestätigt. Verarbeiteter Claude-Puls: **6**. Details in `QUELLSTAND.json`.

**Lesegrenze eingehalten:** Als Repo-Inhalte ausschließlich `docs/fremdpruefung/`; keine anderen Dateien dieses Repos, keine anderen Repos, keine externe Recherche. Geschrieben wird ausschließlich unter `docs/fremdpruefung/ergebnisse/` auf `codex/fremdpruefung`. Kein Merge, keine PR-Kommentare oder Nachrichten an Claude.

## Daten und Trennung

Drei getrennte Agenten erzeugten **342 Lehrbelege**: je 114 aus Fahrradwerkstatt/Handel, Büroservice/Schreibwaren/Gestaltung und Feinkostküche/Catering. Jedes der 38 erlaubten Konten hat je Agent drei, insgesamt neun Lehrbelege. Es wurde keine Buchhandlung als Lehrbetrieb verwendet. Die Texte sind vollständig synthetisch, ungefähr 400–530 Zeichen lang, und enthalten jeweils einen begründbaren Hauptvorgang.

Ein eigener Agent ohne Gesprächsverlauf, Systembeschreibung oder Lehrdaten schrieb **120 Belege der Töpferei Windkiesel**, Inhaberin Mara Lindner. Dieses Gewerbe kommt in den Lehrdaten nicht vor. Der Stapel deckt alle 38 Konten mit je ein bis neun Fällen ab, enthält 98 Ausgaben und 22 Einnahmen sowie 36 gezielt erschwerte Dokumente. Die Texte sind 499–588 Zeichen lang. Erschwernisse umfassen OCR, Gutschriften, irreführende Betreffe, private Vorgänge und die Unterscheidung von Mitarbeiter- und Inhaberreisen.

Der Prüfagent legte sein Soll während der Erzeugung fest. Ein weiterer Agent erstellte die reine Firmenmaske von Claudes Stapel 4; es vergab keine Konten. Aufgaben und Grenzen stehen in `AGENTEN.md`. Alle Agenten nutzen dieselbe bekannte Modellfamilie und teilten ein Dateisystem. Die Trennung erfolgte durch getrennte Kontexte und enge Leseaufträge, nicht durch einen abgeschotteten Prüfserver.

Die Hauptinstanz hatte Stapel 4 bereits in Auftrag 003 manuell gelesen. Diese Kenntnis wird offengelegt. Das kleine System wurde ausschließlich aus den neuen Lehrbelegen gelernt; weder Texte noch frühere Kontenzuordnungen aus 003 gingen in Training, Vokabular, IDF oder Konto-Gewichte ein. Die Systemparameter waren vor Empfang der fertigen Lehrdaten festgelegt. Es erfolgte keine Anpassung an Testfehler.

## System und Nachbau

`SYSTEM/klassifikator.mjs` enthält einen TF-IDF-Zentroid-Klassifikator in reinem JavaScript. Wörter, benachbarte Wortpaare und Zeichenfolgen von drei bis fünf Zeichen werden gezählt. Das Vokabular umfasst höchstens 6000 Merkmale aus den Lehrdaten. Dokumentvektoren werden normalisiert; je Konto bleiben die 160 stärksten Zentroidmerkmale, auf ganzzahlige Gewichte quantisiert. Die höchste Ähnlichkeit entscheidet.

Die Inferenz benötigt kein Sprachmodell, keine Bibliothek und keine Netzabfrage. Es gibt keine manuell aus dem Prüfstapel abgeleiteten Buchungsregeln. Dateinamen aus Sammelkopfzeilen werden nicht als OCR-Inhalt verwendet. `README.md` beschreibt die Befehle und die Browser-Schnittstelle.

Beide Namensvarianten wurden mit denselben Parametern getrennt trainiert. „Ohne Firmennamen“ bedeutet: die vom jeweiligen Erzeuger bzw. Namen-Agenten annotierten wörtlichen Unternehmens-/Organisationsnamen werden entfernt. Personen bleiben erhalten. Die Maske ist eine Hilfsannotation für den Versuch, keine automatische Entitätserkennung des Systems. Vollständigkeit aller indirekten Firmen- und Branchenhinweise ist nicht gemessen.

Die gespeicherten Modelle sind **181.467 bzw. 181.670 Byte** groß; das Inferenzmodul rund 4 kB. Ein einzelnes Modell samt Modul bleibt damit unter 200 kB. Gemessene Node-Inferenz nach zehn Aufwärmfällen: Median 0,58 bzw. 0,59 ms je Beleg, 95. Perzentil 2,00 bzw. 2,13 ms. Das ist ein einzelner Durchgang in der Ausführungsumgebung mit Node v24.19.0. **Echte Smartphone-/Browserleistung, RAM-Verbrauch und Akkubedarf: nicht gemessen.**

## Eigene Messung

| Variante | richtig / 120 | Trefferquote | rechnerisches Wilson-95%-Band | Makro-Recall über 38 Konten |
| --- | ---: | ---: | ---: | ---: |
| Mit Firmennamen | 87 | 72,5 % | 63,9–79,7 % | 80,3 % |
| Ohne annotierte Firmennamen | 86 | 71,7 % | 63,0–79,0 % | 77,9 % |

Die Bänder setzen vereinfacht unabhängige Bernoulli-Fälle voraus. Tatsächlich sind dies gezielt erzeugte Unterlagen eines einzigen Betriebs und eines einzigen Soll-Autors. Die Bänder sind daher **keine belastbare Fehlerspanne für echte Belege oder andere Gewerbe**. Konten mit nur einem oder zwei Fällen erlauben kaum stabile Aussagen. Makro-Recall gewichtet diese kleinen Klassen ebenso stark wie häufige Klassen.

82 Fälle treffen beide Varianten, fünf nur die Variante mit Namen, vier nur die ohne; 29 treffen beide nicht. 13 Kontovorschläge ändern sich durch die Variante. Ein Nettounterschied von einem Treffer rechtfertigt hier keine Behauptung einer überlegenen Namenstrategie.

Von den 36 gezielt erschwerten Fällen treffen die Varianten 24 bzw. 25; von den übrigen 84 Fällen 63 bzw. 61. Die Markierungen sind teilweise überlappend und nicht zufällig gezogen. Besonders auffällig: private/betriebliche Vorgänge jeweils nur 1/4; Mitarbeiterreisen mit Namen 1/3, ohne Namen 3/3; Gutschriften jeweils 2/4.

Zusätzlich wurden drei Gewerbewechsel innerhalb der Lehrdaten ohne Parameteroptimierung gerechnet: jeweils zwei Lehrgewerbe trainieren, das dritte bleibt vollständig draußen. Mit Namen: 95/114, 88/114, 84/114; ohne Namen: 95/114, 86/114, 84/114. Das sind Beschreibungen synthetischer Lehrdatenübertragung, keine weitere unabhängige Schlussprüfung. Alle Einzelwerte, Konten, Verwechslungen und Fehlerdateien stehen in `MESSWERTE.json` und `LEHRDATEN-KREUZVALIDIERUNG.json`.

## Was schiefging

Das System verwechselt Sachgegenstand, Rollen und Verneinungen. Beispiel P003: Eine Lieferantengutschrift für zurückgegebene Handelsware gehört laut unverändertem Soll zu 3300. Der Text schließt Vermittlungsleistungen ausdrücklich aus; das Modell schlägt trotzdem 8500 vor. P006 nennt eine Mitarbeiterreise und ausdrücklich keine Reise der Inhaberin; die Variante mit Namen entscheidet dennoch 4670. P017 beschreibt eine Bargeldentnahme, wird aber als Einlage eingeordnet.

Weitere Beispiele: P010 verwechselt Handelsware mit Rauminstandhaltung, P026 Handelsware mit einem geringwertigen Wirtschaftsgut. P029 ordnet die Rückzahlung eines eigenen Verkaufs als Provision ein. P032 hält einen eigenen Buchverkauf für Fachliteraturaufwand. Die stärkste einzelne Verwechslung mit Namen ist 3400 → 3300 (drei Fälle).

Diese Fehler passen zur Bauart: kurze Wortfolgen ersetzen keine zuverlässige Erkennung von „wer liefert wem“, Geldfluss, Verneinung, Verwendungszweck oder Betragsgrenzen. Der Ausdruck „keine Vermittlung“ trägt weiterhin das Wort Vermittlung bei. Die Zahlenaufbereitung berechnet keine GWG- oder Geschenkgrenze. Ich habe das Modell nach diesen Befunden nicht nachgebessert.

Auch die Datenerzeugung ist eine Schwäche: Viele Texte erklären fast lehrbuchartig, warum etwas keine andere Fallart ist. Ihre Länge ist eng begrenzt. Alle 38 Klassen sind gezielt abgedeckt; die Verteilung stammt nicht aus einer realen Buchhaltung. OCR-Schäden sind Textänderungen, keine durch eine Kamerakette gemessenen Fehler. Der Prüfagent hat zugleich das Soll erzeugt; eine unabhängige steuerfachliche Sollprüfung fehlt. Formale Richtigkeit darf nicht mit fachlicher Wahrheit gleichgesetzt werden.

Als technische Integrationskorrektur wurden ERWARTUNG.json und METADATEN.json vom Ergebnis-Hauptordner in PRUEFSTAPEL verschoben. Der Inhalt blieb unverändert; SHA-256 des Solls ist weiterhin `153e703869ccc5b18130aa41d461707f996f935e933e1bcb7163cbfac6a8e87f`. Es wurden keine misslungenen Testfälle entfernt.

## Kreuztest und offene Messungen

- **Unser System → unser Stapel:** oben vollständig gemessen, beide Varianten veröffentlicht.
- **Unser System → Claude-Stapel 4:** beide Dateien mit je 120 Kontovorschlägen liegen vor. Vergleich gegen Claudes Mehrheits-Soll: **nicht gemessen**, weil dieses Soll bewusst ungelesen bleibt.
- **Claudes System → unser Stapel:** **nicht gemessen**, Rücklauf von Claude erforderlich. Die 120 Einzeltexte und das eingefrorene Soll liegen dafür bereit.
- **Direkte Sprachmodell-Einordnung als Obergrenze:** **nicht gemessen**, optionalen Zusatzlauf nicht durchgeführt.
- **Besseres/schlechteres Training als Claude:** **nicht gemessen**. Dafür müssen dieselben Stapel, Varianten und Sollregeln gegenübergestellt werden.

Für eine nächste Version würde ich zuerst Geschäftspartnerrolle, Ein-/Ausgang, Verwendung und Negation explizit abbilden und Verzicht auf einen automatischen Vorschlag ermöglichen. Schwellen müssten an separaten Entwicklungsdaten festgelegt werden. Der nun ausgewertete Stapel darf nicht anschließend als unabhängiger Test für solche Verbesserungen dienen. Der ergänzende Entwurf `ENTWURF-ECHTERE-PRUEFUNG.md` beschreibt auf drei geplanten Seiten den Weg zu konsistenten Lebensläufen, Bild/OCR-Prüfungen und Suche über Apps und Netz.

## Prüfbarkeit

`SYSTEM/EINGEFROREN.json` hält Hashes von Code, Plan, Lehrdaten und Modellen vor der Schlussvorhersage fest. `VORHERSAGEN-MANIFEST.json` hält die Vorhersagen vor Öffnen des Solls fest. Alle vier Dateien enthalten je 120 eindeutige Dateinamen und zulässige Konten. Der Prüfstapel enthält exakt 120 Textdateien; seine Sollwerte bleiben unverändert. Code, Lehrdaten, Modelle, Vorhersagen, Messwerte, Quellverweis und Firmenmaske werden gemeinsam unter der vorgegebenen Grenze von 5 MB abgelegt.

## Anpassung des Veröffentlichungsumfangs

Die automatische Freigabe lehnte die zusätzliche Rohkopie von Claudes Stapel 4 wegen möglicherweise sensibler Beleginhalte und nicht eindeutiger Freigabe für diesen zusätzlichen Export ab. Diese Rohkopie wird deshalb nicht veröffentlicht. Stattdessen werden Quellcommit, Blob-Prüfsumme und die reine Firmenmaske abgelegt; `SYSTEM/stapel4-vorbereiten.mjs` kann aus der autorisiert bereitgestellten Originaldatei dieselbe lokale Eingabe herstellen. Modelle, Lehrdaten, Sollwerte, Vorhersagen und Messungen bleiben unverändert.
