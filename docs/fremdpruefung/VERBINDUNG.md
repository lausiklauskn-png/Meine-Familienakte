# Briefkasten Claude ⟷ Codex (unabhängige Prüfung)

Klaus 12.11.2026: Codex arbeitet als unabhängiger zweiter Prüfer mit Claude zusammen. Dieser Ordner ist die einzige Verbindung.
Keiner von beiden kann den anderen wecken. Darum sieht **jeder von selbst regelmäßig nach** (Klaus 12.11.):

- **Claude** holt den Zweig `codex/fremdpruefung` bei jedem eigenen Arbeitsschritt und sonst etwa alle 10 Minuten, solange ein Auftrag
  offen ist; nach zwei Stunden ohne Neuigkeit hört das Nachsehen auf, bis Klaus sich meldet.
- **Codex** holt den Zweig `claude/familienakte-bildintegration-il59yw` vor jedem Schritt und liest `FAEHNCHEN-CLAUDE.json` und
  `STAND.md`. Von selbst kann Codex nur etwa **alle 60 Minuten** nachsehen (Auskunft 12.11.); für alles Eiligere gibt Klaus das Zeichen.
- Klaus kann jederzeit zusätzlich das Zeichen geben („sieh in den Briefkasten“).
- Wer nachgesehen hat und nichts tun kann, schreibt nichts. Wer etwas ablegt, trägt Datum und Uhrzeit (UTC) in `STAND.md` bzw. in sein Ergebnis ein.

## Fähnchen und Puls (Klaus 12.11.: „wie am amerikanischen Briefkasten“)

Damit keiner den ganzen Ordner durchsehen muss, hat jede Seite **eine kleine Datei**:

| Datei | wer schreibt | wo |
| --- | --- | --- |
| `FAEHNCHEN-CLAUDE.json` | nur Claude | Zweig `claude/familienakte-bildintegration-il59yw` |
| `ergebnisse/FAEHNCHEN-CODEX.json` | nur Codex | Zweig `codex/fremdpruefung` |

Felder: `faehnchen` („oben“ = es liegt Post für den anderen, „unten“ = nichts Neues), `post` (Nummern der Aufträge bzw. Ergebnisse),
`puls` (Zähler, bei jedem eigenen Ablegen oder Quittieren +1), `zeit` (UTC), `zuletztGelesenPuls…` (der Puls des anderen, den man
zuletzt gesehen hat = Quittung).

Nachsehen heißt: **nur die Fähnchen-Datei des anderen holen**. Ist der `puls` höher als der zuletzt gesehene und das Fähnchen oben,
ist Post da. Wer die Post verarbeitet hat, erhöht seinen eigenen Puls und trägt den gesehenen Puls ein. Steht der Puls des anderen
lange still, arbeitet er gerade nicht – dann nicht weiter warten, sondern Klaus Bescheid geben.

Zusätzlich darf Codex beim Ablegen einen kurzen Kommentar an Pull Request #174 schreiben („Post für Claude: <Nummer>“). Das weckt
Claude sofort; der Kommentar ist nur das Klingeln, gelesen wird immer der Briefkasten.

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

6. **Ausnahme vom Netzverbot:** GitHub-Abruf dieses Repos und das Pushen der Ergebnisse sind erlaubt und nötig; sonst kein Netz.
7. Aufträge immer vom **aktuellen Claude-Stand** lesen; auf `codex/fremdpruefung` nur Ergebnisdateien fortschreiben (die Aufträge
   dort dürfen veraltet sein).
8. Nachsehen von selbst geht nur, solange deine Sitzung läuft. Danach gilt Klaus' Zeichen.

## Regeln für Claude

1. In diesen Ordner kommen nie Lösungen, Messergebnisse oder eigene Regeln.
2. Ergebnisse von Codex werden unverändert übernommen; Formfehler werden gemeldet, nicht still repariert.
3. Auswertung und Zahlen stehen im Repo Datei-Organizer (`docs/PRUEFSTAPEL-BLP-REGELN.md`, `ergebnisse/`), Forschung nur in KimHub.
   Erledigte Aufträge werden hier nach der Auswertung entfernt (STAND.md behält die Zeile).

## Das ist kein Code-Review

„@codex review“ an Pull Requests bleibt abgeschaltet (Klaus 09.11.). Hier geht es nur um unabhängiges Einordnen und Entwerfen.
