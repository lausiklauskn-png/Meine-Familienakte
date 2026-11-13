# Fachregel: in welches Fach ein Schriftstück gehört, das in zwei passt

Entschieden von Klaus am 13.11.2026 (Vorschau `docs/vorschau/fachregel-2026-11-12.html`, alle acht Punkte Ja). Gilt für die ganze
Gruppe (Datei-Organizer, Familienakte, Private Brain, BookLedger – Pro und Basic), für den Sortier-Kern, für Lehrdaten und für jedes
Soll in einem Prüfstapel.

**Grundsatz: Die Sache entscheidet, nicht der Absender.** Ein Schriftstück liegt in dem Fach, um dessen Gegenstand es geht. Das
zweite passende Fach wird als **Zweitfach** („auch zu finden unter“) gemerkt: abgelegt wird einmal, gefunden wird es in beiden.

| Nr. | Fall | Fach | Zweitfach |
| --- | --- | --- | --- |
| 1 | Versicherung für ein Fahrzeug (Police, Beitrag, Wechsel, Saisonkennzeichen) | Auto & Mobilität bzw. Motorrad | Versicherungen |
| 2 | Post von der Krankenkasse (Mitgliedschaft, Beitrag, Krankengeld, Kinderkrankengeld) | Gesundheit & Pflege | Rente, Arbeit & Sozialversicherung |
| 3 | Geld und Bescheide fürs Kind (Kindergeld, Elterngeld, Unterhaltsvorschuss, Kita), Schule, Ausbildung, Studium, BAföG | Familie & persönliche Dokumente | Steuern & Behörden |
| 4 | Steuer, die an einer Sache hängt: Kfz-Steuer → Auto & Mobilität; Erbschaftsteuer → Erbschaft, Vollmachten & Vorsorge; Grundsteuer → Haus & Wohnung; Rentenbezugsmitteilung, Riester-Zulage → Rente, Arbeit & Sozialversicherung | Fach der Sache | Steuern & Behörden |
| 5 | Gerät gekauft, mit Garantie (Fernseher, Drucker, Waschmaschine); Gartengeräte → Garten & Grundstück | Technik, Geräte & Reparaturen | Einkäufe, Rechnungen & Garantien |
| 6 | Abo oder Mitgliedschaft (Fitness, Zeitung, Streaming, Mobilfunk, Monatskarte) – Ausnahme vom Grundsatz, weil die Kündigungsfrist zählt | Verträge & Abonnements | Fach der Sache |
| 7 | Inkasso, letzte Mahnung eines fremden Büros; die erste Mahnung des Händlers bleibt bei dessen Rechnung | Finanzen & Konten | Fach der ursprünglichen Rechnung |
| 8 | Fächerliste | die 18 Fächer der Familienakte (`lib/kategorien.ts`) gelten überall | – |

Was unter den allgemeinen Fächern bleibt: „Versicherungen“ = Haftpflicht, Hausrat, Leben, Rechtsschutz und alles ohne eigenes
Sachfach; „Steuern & Behörden“ = Einkommensteuer, Steuerbescheide, Ausweise, Meldeamt; „Einkäufe, Rechnungen & Garantien“ =
Kassenbons, Bestellungen, Rücksendungen ohne Gerät.

Herkunft: Vier unabhängige Einordner (drei Claude-Agenten, Codex) an 150 erfundenen Briefen, 24 nicht einstimmig, immer an diesen
Stellen; die Regel folgt bis auf Punkt 2 (dort uneinig) der Mehrheit. Das Zweitfach hat Codex vorgeschlagen.

## Die Fachregel ist die Vorgabe ab Werk, nicht Zwang (Klaus 13.11.2026)

Klaus: Wer anders ablegen will – zum Beispiel die Kfz-Versicherung unter „Versicherungen“ statt beim Auto –, muss das können:
eigene Regeln festlegen oder ändern, von Hand zuordnen, und der Kern in der App lernt daraus beim jeweiligen Nutzer von selbst.

Folgen für den Bau:

1. **Regel als Daten, nicht als Code.** Die Punkte 1–7 liegen als Tabelle im Kern (Fall → Fach, Zweitfach). Je Punkt kann der
   Nutzer Fach und Zweitfach tauschen oder ein anderes Fach wählen; die Wahl liegt bei seinen Einstellungen, nie im Repo.
2. **Von Hand zuordnen geht immer** und gewinnt gegen jede Regel. Ein bestätigtes oder geändertes Feld fasst der Kern nie wieder an
   (gilt schon: `bestaetigt` in `lib/siebe.ts`).
3. **Der Kern lernt beim Nutzer** aus Korrekturen (`lib/lernen.ts`): Wer zweimal dieselbe Art Schriftstück umlegt, bekommt den
   Vorschlag, daraus eine eigene Regel zu machen; sie gilt nur auf seinem Gerät und lässt sich ansehen, ändern und löschen.
4. **Zweitfach bleibt.** Wer umstellt, findet das Schriftstück weiter in beiden Fächern und über die Suche.
5. **Messung:** Blindtests messen die Vorgabe ab Werk. Dass eine eigene Regel wirkt und nichts anderes verstellt, wird eigens
   geprüft (Probe: Regel umstellen → betroffene Fälle wechseln das Fach, alle anderen bleiben).

**Wortlaut (Klaus 13.11.):** Der Knopf nach einer Handzuordnung heißt sinngemäß „Als festes Muster merken“ bzw. „Ergebnis als
Muster merken“; der genaue Wortlaut steht in der Vorschau zur Wahl.

**Idee (Klaus 13.11.), noch nicht entschieden:** in den Einstellungen eine Seite „Ablage- und Suchregeln“, auf der genau die
Fälle stehen, die mehrdeutig sind (die sieben Punkte oben und was der Nutzer selbst als Muster gemerkt hat) – je Fall wählbar,
wo es liegt und wo es zusätzlich gefunden wird. Nur die strittigen Fälle, keine Liste aller Regeln.

Sichtbare Bedienung dafür erst als Vorschau, Klaus sagt Ja je Punkt.
