# Gegenlauf 002: nachbauen und ausführen

Ersteller: Codex (GPT-6). Repo-Lesegrenze: ausschließlich docs/fremdpruefung/, keine externe Recherche. Quellcommit des Auftrags: bf547be4a3633a0e217c080839fbf0f3712f81f5. Zeitpunkte stehen in SYSTEM/EINGEFROREN.json und BERICHT.md.

## Dateien und Reihenfolge

Die drei Dateien unter LEHRDATEN enthalten zusammen 342 von getrennten Agenten erzeugte Belege mit Soll-Konto. PRUEFSTAPEL enthält 120 unabhängig erzeugte TXT-Dateien, ERWARTUNG.json und Metadaten. STAPEL-4-NAMEN.json enthält ausschließlich die separat annotierte Firmenmaske und den Quellverweis. Claudes vollständige Rohbelege werden nicht zusätzlich als Ergebnis veröffentlicht. Der ursprüngliche Text bleibt über den angegebenen Quellcommit abrufbar. STAPEL-4-EINGABE.json ist eine lokale, unveröffentlichte Arbeitsdatei für den Vorhersagelauf.

SYSTEM/klassifikator.mjs ist das vollständige System. Es verwendet keine Bibliotheken, kein Netz und kein Sprachmodell zur Vorhersage. SYSTEM/lauf.mjs ist nur der Node.js-Treiber für Dateizugriffe, Training und Auswertung. Es sind keine npm-Pakete nötig. Getestete Laufzeit: Node.js v24.19.0.

Aus dem Ergebnisordner:

```sh
node SYSTEM/lauf.mjs selftest
node SYSTEM/lauf.mjs train
node SYSTEM/stapel4-vorbereiten.mjs ../../auftraege/002-gegenlauf/BELEGE-STAPEL-4.txt
node SYSTEM/lauf.mjs predict
node SYSTEM/lauf.mjs evaluate
```

Train liest ausschließlich Kontenliste und Lehrdaten. Der folgende Vorhersageschritt prüft die eingefrorenen SHA-256-Werte und öffnet keine ERWARTUNG.json. Erst evaluate öffnet das Soll und wertet zuvor gespeicherte Vorhersagen aus. Die Schlussmessung ist kein Anlass, Lehrdaten oder Regeln anzupassen.

Für die veröffentlichten Ergebnisse wurden beide Namensvarianten verwendet. Die Dateien ohne Suffix enthalten `mitFirmenname: true`; die Dateien mit Suffix `-OHNE-FIRMENNAME.json` enthalten `false`. Modell und Vorhersagen beider Varianten bleiben vollständig erhalten. Claudes Stapel 4 wird hier nicht gegen ein Soll ausgewertet.

## Im Browser

Das Modul klassifikator.mjs enthält nur Standard-JavaScript und lässt sich direkt als ES-Modul importieren. Nach dem Laden der lokalen Modelldaten:

```js
import {prepare, predict} from "./SYSTEM/klassifikator.mjs";
const prepared = prepare(modelJson);
const vorschlag = predict(prepared, ocrText, firmennamen);
console.log(vorschlag.konto);
```

`modelJson` ist eines der beiden gespeicherten Modelle. `firmennamen` ist bei der Variante ohne Firmen erforderlich: eine extern bereitgestellte Liste wörtlicher Firmen-/Organisationsnamen. Die Testmasken wurden von den Erzeugern bzw. einem separaten Agenten geliefert. Das System enthält keine produktive automatische Entitätserkennung. Personen werden nicht maskiert. E-Mail-Adressen und URLs werden in beiden Varianten entfernt; Dateinamen aus den Stapel-Kopfzeilen sind keine Merkmale.

Das Ergebnis ist genau ein Konto aus der übergebenen Kontenliste. Score und Abstand zum zweitbesten Konto sind Ähnlichkeitswerte, keine kalibrierten Wahrscheinlichkeiten. Die Inferenz erkennt weder rechtlich sichere Buchungen noch fehlende Informationen zuverlässig und ersetzt keine vollständigen Buchungssätze.

Das verwendete Konto 4540 folgt der vorgegebenen Liste („Kfz-Versicherungen“); dies ist kein Anspruch auf Übereinstimmung mit jeder externen SKR03-Ausgabe.

## Grenzen der Reproduktion

Exakt reproduzierbar sind die gespeicherten Belege, Modellparameter, Vorhersagen und Messungen. Eine erneute Belegerzeugung durch Sprachmodelle würde einen neuen Datensatz ergeben. Die ursprünglichen Agentenaufgaben und ihre Isolation beschreibt SYSTEM/PRUEFPLAN.md. Eigene Zahlen, Fehler, Modellgröße und nicht gemessene Vergleiche stehen in BERICHT.md.

Die reine JavaScript-Inferenz ist browserfähig konstruiert. Eine Messung auf einem echten Smartphone wurde in diesem Auftrag nicht durchgeführt; etwaige Node-Zeiten sind dafür kein Ersatz.

Der Vorbereitungsbefehl benötigt die Originaldatei bei Commit `bf547be4a3633a0e217c080839fbf0f3712f81f5`; die veraltete Auftragskopie auf dem Ergebniszweig genügt nicht. Er prüft Git-Blob-SHA `95f7439c61283243979f433194f9b8b424e3fe17` und ergänzt die veröffentlichte Namenliste. Die Rohkopie bleibt lokal. Die ursprünglichen Modelle, Lehrdaten, Vorhersagen und Messungen wurden für diese Veröffentlichungsanpassung nicht verändert.
