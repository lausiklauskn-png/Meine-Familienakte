# CLAUDE.md — Meine Familienakte

Diese Datei liest jede Sitzung zuerst. Was hier steht, gilt für jede Arbeit in diesem Repo.

## Feste Regel: keine Forschung in diesem Repo (Klaus 2026-10-31)

Klaus: „Forschungsaufträge, Forschungseinträge haben in Familienakte nichts zu suchen. KimHub ist die Quelle, wo es hinkommt,
maximal noch Sage-Protokoll-Abgleich, da sind die Aufträge für die Forschung. Aber da kommen auch keine Forschungseinträge hin,
sondern nur KimHub.“

- **Forschungseinträge** (Befunde, Erkenntnisse, Forschungs-Paragraphen) kommen **nur nach KimHub**.
- **Forschungsaufträge** stehen in KimHub, höchstens noch im **Sage-Protokoll-Abgleich**. Dort kommen aber **keine Forschungseinträge** hin.
- In der Familienakte entsteht **nichts davon**: keine Dateien unter `docs/forschung/`, kein Abschnitt „Forschung“ in Briefen, im
  Abschlussbrief oder in PR-Beschreibungen, kein Verweis „Forschung § …“. Ein Befund aus einer Sitzung wird hier nur so weit
  beschrieben, wie er für den Bau nötig ist (Grenzen, Proben). Der Forschungsteil geht nach KimHub, oder er wird Klaus genannt,
  wenn KimHub in der Sitzung nicht erreichbar ist.
- Die zwei älteren Dateien unter `docs/forschung/` (2026-10-28) stammen von vor dieser Regel. Ob sie nach KimHub umziehen und
  hier gelöscht werden, entscheidet Klaus.

## Weitere Regeln (Kurzfassung, Einzelheiten in den Briefen)

- Oberfläche und Wortlaut des Freundes nur mit Klaus' Ja je sichtbarer Änderung. Beispieldaten erfunden.
- Kein Release ohne Klaus' Wort. Keine Schlüssel, PINs, Passwörter oder Chefcodes in Dateien oder im Chat.
- Byte-1:1-Bausteine nie von Hand ändern: Workflow PDF über `tools/wfpdf-nachziehen.mjs` (Pins `public/wfpdf/HERKUNFT.json`),
  übrige über `native/HERKUNFT.json` (`npm run check:herkunft`), Modul 25 per Pin in `scripts/run-ki-auftrag-tests.mjs`.
- Jede Sitzung endet mit einem Abschlussbrief (`BRIEF_ABSCHLUSS_<Datum>_….md`) mit Stundennachweis und Startauftrag als Codeblock.
- Aktueller Stand: der jüngste `BRIEF_ABSCHLUSS_*.md`; Plan der nächsten Schritte im jüngsten `BRIEF_SITZUNG_*.md`.
