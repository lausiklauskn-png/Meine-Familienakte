# Abschluss 2026-11-01: Eingang sichern, Speicherwege abgrenzen

Arbeitszweig: `codex/eingang-sichern`, aus `origin/main` (`f0521f7`). Fassung bleibt 2.28.14, sichtbare „Version 2.28.1“ unverändert.

## Auftrag und vorheriger Stand

Klaus bat um Prüfung der Verbindungen zu seinen anderen Apps und anschließend um sofortige Behebung der gefundenen Fehler.
Der Verlust ließ sich mit einem erfundenen PDF im echten Browser nachstellen: Stapel 1 → Einordnen → Eingang 1 → Neuladen →
Eingang 0 **und** Stapel 0. Die Eingangsliste bestand nur im React-Arbeitsspeicher; der Stapel löschte seine Datei nach einer
Rückmeldung, die wegen `void queueCentralIntakeFiles(...)` nicht auf den Empfang wartete.

Die früheren Codex-Korrekturen (Brückenprobe, vollständiger PWA-Bau im UI-Rahmen) sind bereits auf main.
Die inzwischen erreichbare GitHub-API bestätigt für `f0521f7`: Hauptprüfung, Android-Prüfbau, Windows-Prüfbau und Pages erfolgreich.
Diese früheren Änderungen wurden nicht erneut angewandt.

## Gebaut

- Bestehende Stapel-Datenbank verlustfrei auf Version 2 erweitert. Kleine JSON-fähige Eingangsdaten und vorläufige Dateien liegen
  getrennt; beim Start werden nur die Metadaten geladen. Die ursprüngliche Reihenfolge bleibt erhalten.
- Übernahme in den Eingang und Entfernen aus dem Stapel in **einer** Transaktion. Bestätigung erst nach `oncomplete`.
  Bei Abbruch bleibt die Quelle im Stapel. Auch normale Stapel-Schreibvorgänge warten jetzt auf den Transaktionsabschluss.
- Warteschlange, Auswahl, Bearbeitungsstand, Eltern-/Anlagenverknüpfung und Dokumentkennungen bleiben erhalten.
  Eine abgebrochene Analyse wird beim nächsten Start wieder aufgenommen; Fehler verhindern die manuelle Zuordnungsprüfung nicht mehr.
- Nach bestätigtem Speichern/Wiederverwenden eines Dokumentdatensatzes wird die vorläufige Arbeitsdatei freigegeben.
  E-Mail-Anlagen können anschließend aus dem verbundenen Dokument-Tresor nachgeladen werden. Kein zusätzlicher dauerhafter PDF-Bestand.
- Speicherlogik in `app/eingang-ablage.ts`, React-Anbindung in `app/use-eingang.ts`, statt einer weiteren Speicherwirkung mitten
  im großen Portal. Keine neuen Zeilen, Ränder, Kästen oder Menüpunkte.
- Bestehende Briefkopf-/Dateieingangsproben warten auf den tatsächlich neu gespeicherten Eingang, die fertige Analyse und die
  bestätigte Auswahl. Der erste Gesamtlauf zeigte, dass sie vorher teilweise noch die alte Zeile bzw. den vorläufigen Stand lasen.
  Keine Wartezeit verlängert und keine Probe abgeschaltet.

## Prüfstand

- `npm ci`, vollständiges `npm run build` (Selbsttests, TypeScript, Vite, Service Worker), `npm run lint` (0 Fehler, 10 bestehende Hinweise) und `npm run check:herkunft`: erfolgreich.
- `node tests/run-ui.mjs`: erster Gesamtlauf 29/33. Drei Skripte hatten die oben beschriebenen zu frühen Zustandsabfragen;
  gezielt berichtigt und vollständig wiederholt: Briefkopf-Titel 5/5, Dateieingang 76/76, Dokumenten-Knöpfe 24/24 grün.
  Damit sind 32/33 Skripte nachgewiesen. Die Einzeldatei ist lokal durch die verwaltete `file://`-Richtlinie blockiert
  (`ERR_BLOCKED_BY_ADMINISTRATOR`); keine Umgehung. Der GitHub-PR prüft auch diese Probe.
- Neue Probe `eingang-sichern`: neun Fälle, einschließlich echten Browser-Neustarts mit demselben Profil, alter Stapel-Datenbank,
  bytegleicher Originaldatei, Wiederaufnahme, Freigabe der Arbeitskopie, Reihenfolge und absichtlichem Transaktionsabbruch.
  Abschließend **dreimal hintereinander 9/9 grün**, danach die Wiederaufnahme-Gegenprobe nochmals gefangen.
- Gegenproben `Eingang sichern:` 6/6 gefangen; angepasste bestehende Gegenprobe `Stapel: Einordnen leert` 1/1 gefangen;
  nach der stabilisierten Briefkopf-Probe `Briefkopf:` 2/2 gefangen. Kein Fehler durchgerutscht. Normale Kontrollläufe anschließend grün.
- Ein früher Kontrolllauf wartete einmal vergeblich auf die Beispielfamilien-Startanzeige (120 s); die Ursache ist nicht abschließend
  bewiesen. Der damalige Test hielt die gesamte Web-Kryptografie an. Die Fehlernachstellung hält jetzt ausschließlich das Lesen
  von `Neustart-Probe.txt` an. Diagnose-/Profilaufbewahrung bei Fehlern ergänzt; Diagnosewiederholung und die drei gezielten Läufe grün.
  Keine Wartezeit verlängert. Ein echter Geräteabbruch ist damit weiterhin nicht gemessen.
- Die automatisch erzeugte Inventardatei wurde auf ihren vorherigen Inhalt zurückgelegt. Pins und fremde Bausteine unverändert.

Lokale Logs: `/tmp/fa-eingang-build-vor-pr.log`, `fa-eingang-ui-gesamt.log`, `fa-eingang-*-wiederholung.log`,
`fa-eingang-gegenproben-final.log`, `fa-eingang-gegenprobe-stapel.log`, `fa-eingang-gegenprobe-briefkopf.log`,
`fa-eingang-ui-final.log` (einmalige Start-Wartezeit), `fa-eingang-ui-diagnose.log`, `fa-eingang-ui-stabil-{1,2,3}.log`,
`fa-eingang-gegenprobe-neustart.log`, `fa-eingang-lint-vor-pr.log`, `fa-eingang-herkunft-vor-pr.log` (jeweils unter `/tmp`).
Remote-Prüfung: aktueller Stand am PR mit Kopfzweig `codex/eingang-sichern`; keine Release-Workflows ausgelöst.

## Speicherentscheidung und nächste Integration

Klaus nutzt hauptsächlich native Android-Apps. Für ihn ist die SD-Karte der gewünschte dauerhafte Speicher; andere Nutzer müssen
Gerätespeicher, Ordner auf dem Rechner und andere Laufwerke wählen können. Ein unerreichbarer gewählter Speicher darf keinen
stillen Wechsel oder leeren Ersatzbestand auslösen. Diese Regeln stehen auch in `CLAUDE.md` und `docs/STAPEL.md`.

Der vorhandene gemeinsame Pro-Tresor wird in Workflow-PDF-Pro (`de.familyprojekt.tresor`) gepflegt; Private Brain Pro und
BookLedgerPro übernehmen ihn bytegleich. Dort sind `familienakte` und `eingang-familienakte` vorbereitet. **Die Familienakte-APK
hat den Anschluss noch nicht.** Ihre Anzeige „Pro“ bezeichnet die native Hülle und beweist diese Speicherfunktion nicht.
Die vorliegende Reparatur benutzt den bestehenden Browser-Arbeitsspeicher und ist keine SD-Karten- oder Verschlüsselungsintegration.

Tomys Hub verwendet `tomy-tresor.js` mit dem Kern aus Mein-Tresor für JSON-Arbeitsstände. Rezeptbuch und Mein-Tresor haben ebenfalls
Browser-Speicherwege. Das ist von Originaldokumenten und vom gemeinsamen nativen Pro-Tresor zu unterscheiden.

Private Brain Pro hat bereits Geräteprüfung und getrennte Bedeutungsmodelle: e5-small (384), e5-base (768), e5-large (1024 Werte).
Die Geräteprüfung empfiehlt; ein größeres Modell wird ausdrücklich geladen. Modellquelle laut tatsächlicher Downloadkonfiguration:
zuerst `family-projekt.de`, ersatzweise Hugging Face; Bibliothek jsDelivr/unpkg, jeweils mit festgelegten Fingerabdrücken.
Vektoren sind an Textstand und Modellrevision gebunden. Der Mycel-Knoten bleibt beim kleinen Modell. Größer ist nicht automatisch
als bessere Trefferqualität bewiesen. Die Familienakte hat diese große Modellwahl noch nicht; der eingebettete Workflow-PDF-Klon
hat seine eigene Bedeutungssuche mit e5-small. Die allgemeine Akten-Suche arbeitet bisher mit Begriffen und Synonymen.

Nächste sinnvolle Schritte: vorhandene Pro-Tresor-Technik über einen separaten Adapter anschließen; bestätigte Übergaben mit
Dokumentkennung/Prüfsumme verwenden (im gemeinsamen Pro-Übergabefach eine Übernahmemarke setzen, dessen Originale nicht löschen);
danach die bestehende Geräte-/Modellwahl für die Akten-Suche anbinden. Original, Arbeitsstand
und rekonstruierbaren Suchindex getrennt halten. Sichtbare Auswahl/Bedienung zuerst konkret vorschlagen und Klaus' Ja abwarten.
Keine pauschale Übernahme eines vollständigen fremden App-Oberflächenaufbaus.

## Nicht gemessen / offen

- Keine echte SD-Karte, kein Tablet, kein Windows-PC; kein Entfernen/Wiedereinstecken eines Datenträgers und kein nativer
  Passwort-/Ordnerdialog. Kein großer Bestand, kein Stromausfallversuch. Browserabbruch und Transaktionsabbruch sind simuliert.
- Keine echten Dokumente übertragen; nur erfundene Testdateien. Keine neuen Embedding-Modelle geladen, keine private
  Dokumentensuche über mehrere Apps gefahren und keine Live-Mycel-Sitzung eröffnet.
- Workflow PDF ist über die bestehende Brücke tatsächlich eingebettet. Die gemeinsamen Bausteine sind geprüft; gleiches Quellmaterial
  bedeutet noch keine gemeinsame Dokumentdatenbank. Kimhub bleibt Entwicklungskoordination; Kim-sync/Datei-Post sind mögliche
  Dateiübergabewege, keine bereits gebaute Familienakten-Synchronisierung.
- Briefkopf in Warteschlange/Stapel wartet weiter auf Klaus' Ja; Tablet-Rückmeldungen offen. Kein Android-/Windows-Release beauftragt.
- Klaus' jüngste Anweisung: nichts veröffentlichen. Ein Main-Push würde automatisch Pages veröffentlichen; deshalb diesen neuen
  Stand als überprüfbaren PR-Entwurf bereitstellen und die Veröffentlichung nicht still auslösen.

## Zeiten

Erste erhaltene Prüfspur: 10:58:11 UTC; Verlust-Reproduktion: 11:01 UTC. Lokale Abschluss-/Prüfspur: 11:54:44 UTC.
Spanne bis zur Vorbereitung der Übergabe: 56 Minuten 33 Sekunden; anschließend Übertragung des Entwurfs und GitHub-Prüfung
(deren Beginn/Ende sind im PR-Lauf dokumentiert).
Zeiten sind die Spanne der Werkzeugspuren einschließlich Prüf-/Wartezeiten, keine getrennte Messung reiner Programmierzeit.

## Startauftrag

```text
CLAUDE.md, diesen Brief und docs/STAPEL.md lesen. Zweig codex/eingang-sichern und zugehörigen PR prüfen.
Die früheren Brücken-/PWA-Korrekturen stehen schon auf main; nicht erneut anwenden.
Aktueller neuer Bau: dauerhafter Eingang und atomare Stapelübergabe, noch kein Anschluss an den Pro-SD-Tresor.
Klaus: Speicherort frei wählbar (Gerät, SD/USB, Rechnerordner); bestehende Pro-Tresor-Technik wiederverwenden.
Originale, kleine Arbeitsstände und modellgebundene Vektoren unterscheiden; große Modelle nicht mit Mycel vermischen.
Gemeinsame Fächer familienakte/eingang-familienakte sind vorbereitet, der App-Adapter fehlt noch.
Sichtbare Änderungen je Punkt mit Klaus abstimmen. Nichts ohne neues Wort veröffentlichen; Main-Push löst Pages aus.
Kein Versionssprung oder Android-/Windows-Release ohne veröffentlichtes, freigegebenes Stück.
```
