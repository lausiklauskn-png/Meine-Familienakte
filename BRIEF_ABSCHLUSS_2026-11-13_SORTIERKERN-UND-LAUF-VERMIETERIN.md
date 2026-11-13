# Abschlussbrief 13.11.2026 – Sortier-Kern in der Familienakte, Lauf „Vermieterin“

## Was getan ist

- **Datei-Organizer 0.2.0** (main `534cc08`, Web-App ausgeliefert): verbesserter Kern, an vier fremden Stapeln mit drei Einordnern
  (darunter Codex) in allen fünf Feldern gesichert besser. **BookLedgerPro 0.1.15** (Android und Windows) ausgegeben, Basic nachgezogen.
- **Lauf „Vermieterin“** (Datei-Organizer `docs/PRUEFSTAPEL-VERMIETERIN-REGELN.md`, Entwurfs-PR #3 dort): erfundene Privatvermieterin,
  Jahre 2025 und 2026, je rund 93 Schriftstücke, 45 Belege, 12 Kontoauszüge; als Text und als gescannte Seiten durch die
  Texterkennung des Workflow-PDF-Klons. 2025 mit drei Einordnern ausgewertet, 2026 vorläufig mit zwei (Codex-Auftrag 010 offen).
- **Sortier-Kern eingebaut** (dieser PR #174, `7c97bb0`, nicht veröffentlicht): `lib/sortierkern/` byte-gleich @ Datei-Organizer
  `534cc08` mit Pin, Anschluss `lib/sortier-vorschlag.ts`; ab 200 Zeichen gelesenem Text kommen Bereich und Frist aus dem Kern.

## Zahlen (erfundene Stücke, Mehrheit der Einordner)

- Familienakte bisher → mit Kern, sechs Stapel (784 Stücke): Bereich je Stapel 38–57 % → 77–87 %; Frist 147/288 → 247/288,
  fälschlich 30 → 35 von 498. Fristenkette Vermieterin gescannt bis zur geplanten Erinnerung: 63 % → 83 % (2025), 63 % → 78 % (2026).
- Texterkennung: Wortfehler rund 5 %; kein gesicherter Verlust bei Bereich und Frist; Absender 2026 gescannt 98 % → 79 %.
  Rund 1,9 s je Seite auf dem Rechner der Sitzung (1000 Seiten rund eine halbe Stunde; Tablet nicht gemessen).
- BookLedgerPro an der Vermietung: Betrag 84 %, Datum 96 %, Konto 62 % (kein Konto für Mieteinnahmen einer Privatvermieterin).
  Kontoauszug als PDF liest keine App; als MT940 gesetzt ordnet der Zahlungsabgleich Umsätze mit einem Beleg richtig zu, wiederkehrende
  Zahlungen ohne Beleg bekommen teils fälschlich einen.
- „Wird es im zweiten Jahr besser?“ (Gemerktes aus 2025, vorläufig): Bereich 70 → 76 von 91, nicht gesichert; Konto und Bank kein Gewinn.

## Entscheidungen und offene Fragen an Klaus

1. „Dateiname zuerst“ (31.10./01.11.) ist für Stücke mit gelesenem Text durch den Kern ersetzt – so lassen?
2. Aussteller in BookLedgerPro aus dem Kern (84 % gegen 44 %) – braucht eine neue Fassung dort. Private Brain Pro kennt keine Fächer:
   erst Vorschau. Basic-Fassung der Familienakte ist derselbe Bau und bekommt den Kern mit der nächsten Ausgabe.
3. Keine neue Fassung der Familienakte ausgegeben (nächste freie 2.28.66); Ausgabe nur auf Klaus' Wort.

## Offen

- Bedienproben im Browser (Eingang, Sammelablage, Fristen) nach dem Einbau: CI von PR #174 abwarten; lokal liefen Fachprüfungen,
  Typprüfung, Bau, Herkunft und Lint grün.
- Codex-Ergebnis 010 übernehmen und 2026 mit drei Einordnern rechnen (`bash scripts/lauf-vermieterin.sh` im Datei-Organizer).
- Absender/Titel aus dem Kern, Zweitfach, „Als festes Muster merken“ (Vorschau), Suche über die Knoten, weitere Lebensläufe
  (Ehemann verstorben, drei Kinder), frischer Stapel nach dem Einbau, Gerätetest.

## Stundennachweis

Erste Spur dieser Sitzung 12.11.2026 07:46 UTC, letzte 13.11.2026 ≈ 11:50 UTC. Fenster rund 28 Stunden mit langen Abschnitten,
in denen Agenten, Messläufe und Ausgaben ohne Klaus liefen (Nacht 12./13.11.). Klaus' Arbeitszeit darin ist nicht gemessen; seine
eigene Angabe geht vor. Eintrag in KimHub.

## Startauftrag zum Einfügen

```
Repo Meine-Familienakte (dazu Datei-Organizer, BookLedgerPro, KimHub). Zuerst lesen: CLAUDE.md,
BRIEF_ABSCHLUSS_2026-11-13_SORTIERKERN-UND-LAUF-VERMIETERIN.md, im Datei-Organizer docs/PRUEFSTAPEL-VERMIETERIN-REGELN.md.
Stand: Sortier-Kern liegt byte-gleich in lib/sortierkern/ (PR #174, Entwurf, nicht veröffentlicht); Lauf „Vermieterin“ 2025
ausgewertet, 2026 vorläufig.
Erste Schritte: 1) CI von PR #174 prüfen, rote Bedienproben beheben. 2) Briefkasten: Codex-Ergebnis 010 holen, 2026 mit drei
Einordnern rechnen. 3) Klaus' Antworten zu „Dateiname zuerst“ und Aussteller in BookLedgerPro umsetzen.
Nicht: Kern von Hand ändern (nur tools/sortierkern-nachziehen.mjs), etwas veröffentlichen ohne Klaus' Wort, verbrauchte Stapel
als Nachweis nehmen, Forschungseinträge außerhalb von KimHub, „@codex review“ an PRs.
```
