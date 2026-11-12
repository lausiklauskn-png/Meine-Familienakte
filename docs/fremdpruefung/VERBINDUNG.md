# Briefkasten Claude ⟷ Codex (unabhängige Prüfung)

Klaus 12.11.2026: Codex arbeitet als unabhängiger zweiter Prüfer mit Claude zusammen. Dieser Ordner ist die einzige Verbindung.
Keiner von beiden kann den anderen wecken. Darum sieht **jeder von selbst regelmäßig nach** (Klaus 12.11.):

- **Claude** holt den Zweig `codex/fremdpruefung` bei jedem eigenen Arbeitsschritt und sonst etwa alle 10 Minuten, solange ein Auftrag
  offen ist; nach zwei Stunden ohne Neuigkeit hört das Nachsehen auf, bis Klaus sich meldet.
- **Codex** holt den Zweig `claude/familienakte-bildintegration-il59yw` genauso: vor jedem Schritt und sonst etwa alle 10 Minuten,
  solange seine Sitzung läuft, und liest `STAND.md`.
- Klaus kann jederzeit zusätzlich das Zeichen geben („sieh in den Briefkasten“).
- Wer nachgesehen hat und nichts tun kann, schreibt nichts. Wer etwas ablegt, trägt Datum und Uhrzeit (UTC) in `STAND.md` bzw. in sein Ergebnis ein.

## So läuft es

| Wer | tut was | wo |
| --- | --- | --- |
| Claude | legt einen Auftrag ab: `auftraege/<Nummer>-<Name>/AUFTRAG.md` (+ Dateien dazu) und trägt ihn in `STAND.md` ein | Zweig `claude/familienakte-bildintegration-il59yw` |
| Codex | holt diesen Zweig, liest `STAND.md`, führt jeden Auftrag mit Stand „offen“ aus | – |
| Codex | schreibt das Ergebnis nach `ergebnisse/<Nummer>-<Name>/` und pusht | Zweig `codex/fremdpruefung` (ein fester Zweig; vor jedem Auftrag den Claude-Zweig hineinholen) |
| Claude | holt `codex/fremdpruefung`, prüft die Form, übernimmt das Ergebnis unverändert in die Auswertung (Repo Datei-Organizer) und setzt den Stand auf „ausgewertet“ | – |

## Regeln für Codex

1. Lies **nur** `docs/fremdpruefung/`. Keine anderen Dateien dieses Repos (auch nicht CLAUDE.md oder Briefe), keine anderen Repos,
   kein Netz. Der Wert der Prüfung liegt darin, dass du die Lösungen und Claudes Vorgehen nicht kennst.
2. Ändere nur Dateien unter `docs/fremdpruefung/ergebnisse/`. Kein Merge, kein PR nötig, keine Änderung an Aufträgen.
3. Entscheide selbst, wie du vorgehst. Rate nicht still: was unsicher ist, als unsicher kennzeichnen.
4. Jedes Ergebnis nennt dein Modell und ob du Regel 1 eingehalten hast. Wenn ein Auftrag unklar ist, schreib das in
   `ergebnisse/<Nummer>-<Name>/RUECKFRAGE.md`, statt zu raten.
5. Keine Schlüssel, Passwörter oder echten Personendaten in irgendeiner Datei. Alle Belege hier sind erfunden.

## Regeln für Claude

1. In diesen Ordner kommen nie Lösungen, Messergebnisse oder eigene Regeln.
2. Ergebnisse von Codex werden unverändert übernommen; Formfehler werden gemeldet, nicht still repariert.
3. Auswertung und Zahlen stehen im Repo Datei-Organizer (`docs/PRUEFSTAPEL-BLP-REGELN.md`, `ergebnisse/`), Forschung nur in KimHub.
   Erledigte Aufträge werden hier nach der Auswertung entfernt (STAND.md behält die Zeile).

## Das ist kein Code-Review

„@codex review“ an Pull Requests bleibt abgeschaltet (Klaus 09.11.). Hier geht es nur um unabhängiges Einordnen und Entwerfen.
