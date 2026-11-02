# Übergabe an die Familienakte: offener Vertrag für andere Apps

Klaus (2026-10-28): „Auch das Verbinden anderer Apps, die noch nachgebaut werden oder noch ebenso gebaut werden,
muss möglich sein, ob sie mit Codex oder mit sonst irgendjemandem gebaut wurden.“ Deshalb ist die Übergabe nicht
auf bestimmte Apps festgelegt. Jede App, die eine der drei Standardwege beherrscht, kann Dateien an die Familienakte
geben; die Familienakte legt sie in die **Eingangszentrale** (Quelle wie Dateiauswahl) und übernimmt nichts ohne
Bestätigung. Den quittierten Hin- und Rückweg der eigenständigen Pro-Apps beschreibt
[PRO-VERBUND-NATIV.md](PRO-VERBUND-NATIV.md). Die optionale Begleitdatei unten ergänzt die manuelle Einordnung.

## Weg 1 · Android: Teilen und „Öffnen mit“

- Intent `android.intent.action.SEND` oder `SEND_MULTIPLE` mit `EXTRA_STREAM` (content://-Adressen der sendenden App)
  oder `ACTION_VIEW` mit `content://`-Daten. Angenommene Typen: `application/pdf`, `image/*`, `message/rfc822`,
  `text/plain`, `application/zip`, DOCX, XLSX.
- Geteilter Text ohne Datei (`EXTRA_TEXT`, optional `EXTRA_SUBJECT`) wird eine Textdatei.
- Abgewiesen: `file://`-Pfade und Adressen aus dem eigenen Provider der Familienakte. Höchstens 30 Dateien je Teilen,
  200 MB je Datei; die Dokumentgrenze der Akte (20 MB) gilt beim Speichern.
- Kein Paketname nötig: die Familienakte steht in Androids Teilen-Liste für jede App.

## Weg 2 · PWA (Browser-App): Web Share Target

- Manifest `share_target`: `POST ./teilen-empfang`, `multipart/form-data`, Feld `dateien` (mehrere), dazu `title`,
  `text`, `url`. Der Service Worker legt die Dateien ab und leitet auf `./?geteilt=1` weiter.
- Andere Web-Apps nutzen `navigator.share({ files })`; Android zeigt die Familienakte dann in der Auswahl.

## Weg 3 · Windows: „Öffnen mit“ und Kommandozeile

- Die App registriert sich pro Benutzer für `.pdf`, `.jpg`, `.png`, `.eml`, `.txt`, `.docx`, `.xlsx`, `.zip`;
  Dateipfade als Startargumente werden in die Eingangszentrale gelegt. Eine zweite Instanz reicht die Argumente an die
  laufende weiter.

## Datenvertrag (optional, für Metadaten)

Eine App kann neben der Datei eine JSON-Datei `familienakte-uebergabe.json` mitgeben:

```json
{
  "vertrag": "familienakte-uebergabe/1",
  "quelle": "Name der sendenden App",
  "dateien": [{ "name": "Rechnung.pdf", "lebensbereich": "Wohnen", "dokumentart": "Rechnung", "vorgang": "Nebenkosten 2025", "hinweis": "frei" }]
}
```

Die Felder sind Vorschläge für die Zuordnung; die Familienakte zeigt sie im Ablage-Dialog, der Mensch bestätigt.
Unbekannte Felder werden bei der Auswertung ignoriert, fehlende Felder sind erlaubt. Die Begleitdatei und die
Originalunterlagen bleiben unverändert im dauerhaften Eingang. Auch nach einem Neustart stehen die Vorschläge
bei „Zuordnung prüfen“ bereit. „Vorschläge in das Formular übernehmen“ füllt nur das änderbare Formular;
erst „Geprüft lokal speichern“ legt die Unterlage in der Akte ab. Ein fremder Vorgang ist ein Hinweis,
keine fremde Datenbankkennung oder automatische Verknüpfung. Die Datenschutzstufe wird nicht aus der Begleitdatei übernommen.

Die Zuordnung gilt ausschließlich für Dateien derselben Auswahl bzw. desselben Teilen-Vorgangs. Der Name muss
genau und eindeutig passen; Pfade und mehrfach vorkommende Namen werden nicht zugeordnet. Optional kann jeder
Eintrag `sha256` mit 64 kleinen Hex-Zeichen enthalten. Dann müssen die tatsächlichen Bytes übereinstimmen;
Dateien über 20 MiB erhalten keinen solchen Vorschlag. Die Dokumentgrenze wird durch Metadaten nie erweitert.
Mehrere Vorschläge für dieselbe Datei bleiben zur manuellen Prüfung offen.

Grenzen: höchstens 64 KiB pro Begleitdatei, 30 Einträge, 100 Zeichen für Quelle und Einordnungsfelder,
255 Zeichen für den Dateinamen, 1000 Zeichen für den Hinweis, keine Steuerzeichen. Fehler werden am Eingang
erklärt; auch eine fehlerhafte Begleitdatei bleibt als Original erhalten. HTML wird als Text angezeigt.
Der Vertrag erteilt keine Zugriffsrechte, löst keine Netzverbindung aus und ist keine Empfangsquittung.

Proben: `scripts/run-uebergabe-vorschlaege-tests.mjs` prüft Zuordnung, Prüfsumme, Mehrdeutigkeit, Grenzen
und Lesefehler. `tests/ui/uebergabe-vorschlaege.test.mjs` prüft die echte Eingangsablage, Browser-Neustart,
unveränderte Originale, manuelle Übernahme, Dateiaustausch und ausdrückliches Speichern.

## Was nicht passiert

Keine automatische Übernahme, kein Netz, keine Pfade von außen, keine Änderung an Originalen der sendenden App.
