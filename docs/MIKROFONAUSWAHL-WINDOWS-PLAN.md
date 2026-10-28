# Mikrofonauswahl für das Diktat unter Windows – nur Plan (Klaus 2026-10-28)

Klaus: „Windows … Mikrofonauswahl nur als Plan.“ Hier steht, was die Windows-App heute tut, was Private Brain Pro
dafür gebaut hat und wie es in die Familienakte käme. **Gebaut ist davon nichts**; die Probe `tools/native/test-windows.mjs`
hält fest, dass der Diktat-Befehl keinen Geräte-Zweig hat.

## Heute

- Das Diktat in der Windows-App läuft über Windows SAPI (`windows/src-tauri/src/speech.rs`, Befehl `fa_diktat`).
- SAPI hört auf das **Windows-Standardmikrofon**. Windows wechselt dieses Gerät selbst, zum Beispiel beim Verbinden
  eines Bluetooth-Headsets. Der Freund hat mehrere Mikrofone (Forschung 2026-10-28, Abschnitt 3).
- Die Oberfläche kennt keine Mikrofonauswahl (`lib/browser-dictation.ts`, `app/ui-controls.tsx`: kein `enumerateDevices`).

## Vorlage: Private Brain Pro

`docs/MIKROFON-WAHL-WINDOWS.md` dort (1.0.40, Klaus 2026-10-27): Einstellungen → Diktatsprache → „Mikrofon fürs Diktat“.

| Baustein | Private Brain Pro | Übertragbar? |
| --- | --- | --- |
| Geräteliste | SAPI-Kategorie `SpeechAudioInput` aufzählen (`ProSpeech.inputs`), Name + Kennung | ja, als Befehl `fa_mikrofone` in `speech.rs` |
| Festes Gerät | `ISpRecognizer::SetInput` mit dem gewählten Audio-Token statt des Standards | ja, als Feld `input_id` an `fa_diktat` |
| Wiederfinden | gespeichert wird die Kennung; fehlt das Gerät beim Start, klare Meldung, **kein stiller Rückfall** | ja, Speicherung im localStorage der Hülle (`familienakte-mikrofon`) |
| Hinweis | Verbindungsart aus dem Namen (Bluetooth, USB) nur als Hinweis; das Sprechfenster nennt das Mikrofon | ja |
| Oberfläche | Auswahl in den App-Einstellungen | **hier die Hürde** |

## Warum es hier noch Plan ist

1. **Oberfläche des Freundes.** Eine Auswahl braucht ein sichtbares Element. Die Regel „Design, Aufbau und Wortlaut
   der Oberfläche nicht verändern“ erlaubt das nicht ohne Klaus' Ja. Möglicher Platz ohne Umbau: der Hinweisstreifen
   der Hülle (`familienakte-app.js`, `hinweis()`), zum Beispiel beim ersten Diktat „Mikrofon: Windows-Standard – ändern“.
2. **Nicht gemessen.** Private Brain Pro hat die Auswahl selbst noch nicht an echter Hardware gemessen; die Familienakte
   würde dieselbe offene Messung erben.
3. **Zweites Repo.** Der Rust-Teil ließe sich aus Private Brain Pro `windows/src-tauri/src/speech.rs` übernehmen, aber die
   Familienakte hat dort eine eigene, kleinere Fassung (nur ein Satz je Tipp). Ein Nachziehen hieße: Datei vergleichen,
   nicht blind kopieren.

## Schritte, wenn Klaus Ja sagt

1. `speech.rs`: Befehl `fa_mikrofone` (Liste) und Feld `input_id` an `fa_diktat` (`SetInput`), Fehler `MIKROFON_FEHLT`
   wenn die Kennung nicht mehr da ist.
2. `familienakte-windows.js`: Kennung merken, beim Diktat mitgeben, bei `MIKROFON_FEHLT` Hinweis mit „Windows-Standard
   verwenden“ (ein Tipp, nicht automatisch).
3. Ort der Auswahl mit Klaus festlegen (Hinweisstreifen oder ein Eintrag in den Einstellungen des Freundes).
4. Probe: `tools/native/test-windows.mjs` dreht den Wächter „kein SetInput-Zweig“ um; `tests/ui/windows.test.mjs` stellt
   zwei Geräte und prüft, dass das gewählte beim Diktat mitgeht.
5. Erst dann der Nachzug für BookLedgerPro und Workflow PDF Pro (dort gibt es noch keine Windows-App; Klaus 2026-10-28).
