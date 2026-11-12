# Fremdprüfung (Übergabefach für eine andere KI)

Klaus 12.11.2026: Ein Agent aus einer anderen KI (Codex) soll unabhängig von Claude dieselben Belege einordnen und einen eigenen
Bauplan für einen Einordner entwerfen. Dieser Ordner ist nur das Übergabefach; er enthält keine Lösungen und keine Messergebnisse.
Regeln der Prüfung: Repo Datei-Organizer, `docs/PRUEFSTAPEL-BLP-REGELN.md` (Punkte 14–17). Auswertung und Einträge dazu kommen
nicht hierher (Auswertung im Datei-Organizer, Forschung nur in KimHub). Der Ordner wird nach der Auswertung wieder entfernt.

## Für die andere KI

1. Lies **nur** diesen Ordner. Öffne keine anderen Dateien dieses Repos und keine anderen Repos, suche nicht im Netz.
2. Führe `AUFTRAG-B-bauplan.txt` aus und schreibe das Ergebnis nach `docs/fremdpruefung/BAUPLAN.md`.
   (Zuerst B, damit der Bauplan entsteht, bevor du die Belege gesehen hast.)
3. Führe danach `AUFTRAG-A-einordnen.txt` aus und schreibe das Ergebnis nach `docs/fremdpruefung/DRITTER.json`.
4. Lege beide Dateien auf einem eigenen Zweig `codex/fremdpruefung-blp` ab (von diesem Zweig abgezweigt) und pushe ihn.
   Kein Merge, keine Änderung an anderen Dateien. Ein Entwurfs-PR ist erlaubt, aber nicht nötig.
5. Nenne am Ende dein Modell und sage, ob du dich an Punkt 1 gehalten hast.

Alle Belege sind erfunden (Betrieb „Radwerk Tidemann“), keine echten Daten.
