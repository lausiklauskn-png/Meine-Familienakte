# Übergabe an die Familienakte: offener Vertrag für andere Apps

Klaus (2026-10-28): „Auch das Verbinden anderer Apps, die noch nachgebaut werden oder noch ebenso gebaut werden,
muss möglich sein, ob sie mit Codex oder mit sonst irgendjemandem gebaut wurden.“ Deshalb ist die Übergabe nicht
auf bestimmte Apps festgelegt. Jede App, die eine der drei Standardwege beherrscht, kann Dateien an die Familienakte
geben; die Familienakte legt sie in die **Eingangszentrale** (Quelle wie Dateiauswahl) und übernimmt nichts ohne
Bestätigung. Rückweg (Familienakte → andere App) folgt in einer späteren Sitzung mit demselben Grundsatz.

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

## Weg 3 · Windows: „Öffnen mit“ und Kommandozeile (geplant im Windows-PR)

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
Unbekannte Felder werden ignoriert, fehlende Felder sind erlaubt. (Auswertung der JSON folgt in einer späteren Sitzung;
heute kommt sie wie jede andere Datei in den Eingang.)

## Was nicht passiert

Keine automatische Übernahme, kein Netz, keine Pfade von außen, keine Änderung an Originalen der sendenden App.
