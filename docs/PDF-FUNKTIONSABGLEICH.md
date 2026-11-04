# Gemeinsame PDF-Updates

Workflow-PDF ist die gemeinsame Quelle. Workflow-PDF-Pro übernimmt diesen Kern
bytegleich unter `upstream/workflow-pdf`. Die Familienakte hat einen vollständigen
Klon und einen eigenen React-Ausfülldialog mit ausgewählten Kernbausteinen.
Ein weiteres Repo ist für diesen Weg nicht erforderlich.

## Direkt aus dem Projektordner

Voraussetzung: Quellprojekt mit Git und Node.js (Familienakte ab Node 22.18).
Pro benötigt für das vorhandene Kopierwerkzeug zusätzlich Python 3.

In **beiden** Projektordnern funktioniert:

```sh
npm run update:pdf
```

Das lädt die öffentlichen GitHub-Quellen nach `work/`, prüft ihren Stand und zeigt
eine Vorschau. Es benötigt zum Lesen keinen persönlichen GitHub-Login.
Die eigentliche Übernahme in die Quellkopie lautet:

```sh
npm run update:pdf -- --anwenden
```

Pro verwendet seinen bisherigen kanonischen Kopierer. Die Familienakte bereitet
beide Kopien zuerst außerhalb der Zielordner vor. Sie übernimmt nur, wenn der
Quellbaum von Workflow-PDF mit dem Pro-Kern übereinstimmt. Andernfalls zuerst den
Pro-Updatevorschlag prüfen und übernehmen. Handgeänderte oder zusätzliche Dateien
in den Familienakte-Kopien stoppen das Update. Die vorhandenen Brücken, die eigene
Bibliothek, die Farben und der React-Code werden nicht überschrieben.

Ohne erneutes Herunterladen kann ein Entwickler vorhandene Quellen verwenden:

```sh
# Familienakte
npm run update:pdf -- --quelle /pfad/Workflow-PDF --pro /pfad/Workflow-PDF-Pro --anwenden
# Pro: die Quelle liegt unter work/Workflow-PDF
npm run update:pdf -- --lokal --anwenden
```

Das sind Befehle für den **Quellprojektordner**, nicht für den installierten
App- oder Dokumentenordner. Eine laufende APK/EXE führt keinen Git-Code aus.

## Automatischer Weg auf GitHub

1. Der Pro-Workflow `Gemeinsamen PDF-Kern aktualisieren` prüft täglich um 06:03 UTC (07:03 MEZ bzw. 08:03 MESZ)
   die gemeinsame Quelle. Bei einem neuen Stand bereitet er mit dem vorhandenen
   Kopierwerkzeug einen Updatevorschlag vor und prüft Kern und native Webanbindungen.
2. Der Familienakte-Workflow `PDF-Funktionen abgleichen` prüft täglich um 06:23 UTC (07:23 MEZ bzw. 08:23 MESZ).
   Sobald Pro denselben Quellkern übernommen hat, bereitet er beide Kopien gemeinsam
   vor. API-Vertrag, Updateweg samt Gegenproben, Herkunft, Build und Browserproben
   beider PDF-Zugänge müssen bestehen.
3. Nur erfolgreiche Zeitplan-/manuelle Läufe dürfen einen **Entwurfs-PR** im eigenen
   Repo erstellen. Ein normaler PR-Lauf erhält keine Schreibrechte. Je Quellstand
   gibt es einen eigenen Zweig; vorhandene Vorschläge und eigene Änderungen werden
   nicht überschrieben. Kein automatisches Zusammenführen und keine Veröffentlichung.
4. Da PRs des GitHub-eigenen Tokens keine gewöhnlichen PR-Läufe starten, fordert das
   Werkzeug die vorhandenen Android-/Windows-/CI-Prüfungen ausdrücklich am Updatezweig
   an. Es nutzt den zeitlich begrenzten GitHub-Token des Workflows; keine Zugangsdaten
   gehören in die App. Die Repository-Einstellung muss Actions das Erstellen von PRs
   erlauben. Bei verweigerter Berechtigung bleibt der Lauf mit konkretem Fehler stehen.

Beide Workflows sind auch manuell unter GitHub → Actions startbar. Sie werden nach
Übernahme ihrer Einrichtung auf `main` aktiv. Erfolgreich vorbereitete Patches stehen
zusätzlich als Artefakte bereit. Auch Fehlerläufe laden vorhandene Diagnoseartefakte
hoch; ein Artefakt allein ist keine Freigabe.

## Wie die Gestaltung erhalten bleibt

Es gibt keine automatische Neugestaltung durch KI. Der bisherige, kontrollierte
HTML-Patch setzt weiterhin die Familienakte-Brücke und das vorhandene Theme ein und
entfernt den eigenen Service Worker und den Mycel-Start des eingebetteten Klons.
Zusätzlich blockiert der Updatebefehl Änderungen an HTML, CSS, Manifest und Icons.
Nur technische HTML-Versionsverweise dürfen abweichen. Änderungen in JavaScript
können ebenfalls sichtbare Inhalte erzeugen: deshalb bleiben visuelle/fachliche
Prüfung und Entwurfs-PR erforderlich. Solche Änderungen werden nicht als automatisch
passend ausgegeben.

Neue Kern-APIs müssen zusätzlich im React-Ausfülldialog angebunden werden. Das
aktuelle Beispiel ist `schonBelegt`: Der Kern enthielt den Schutz bereits, der eigene
Dialog rief ihn noch nicht auf. Er filtert jetzt bedruckte Flächen und Bilder anhand
desselben Seitenbilds wie die Linienerkennung. Vorhandene Felder bleiben erhalten.

Die Funktion „★ Als Feldart merken“ existiert bereits im vollständigen Klon unter
Dokumente → Workflow PDF → Felder bearbeiten. Sie ist keine neue Funktion des eigenen
React-Ausfülldialogs. Dessen Eingabe-Speicher und die Klon-Feldarten bleiben getrennt.

## Auslieferung

Erst nach Übernahme und Prüfung wird bei einer gesondert freigegebenen Veröffentlichung
eine neue PWA/APK/Windows-Fassung gebaut. Nutzer erhalten sie über die vorhandenen
Updatewege der jeweiligen App. Quellabgleich, PR, Zusammenführung und installierbares
Update sind vier verschiedene Schritte. Dieser Auftrag richtet den gemeinsamen
Quellupdateweg ein; er ersetzt keine Geräteabnahme und veröffentlicht keine neue App.
