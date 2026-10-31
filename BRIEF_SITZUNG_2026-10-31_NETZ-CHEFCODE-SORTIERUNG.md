# Brief: Familienakte ins Netz der Pro-Apps und Briefkopf-Sortierung (Klaus 2026-10-31)

Der ganze Plan steht zentral in **BookLedgerPro `BRIEF_SITZUNG_PRO-UMBAU-14.md`** (Sitzungen A–D). Für dieses Repo gilt daraus:

- **Sitzung B** (nach dem Chef-PIN-Umbau in Private Brain Pro):
  - **Aktualisieren oben**: Knopf in der Kopfleiste neben dem Internetschalter (`app/netz-schalter.tsx`), dieselbe Prüfung wie heute der Tipp
    auf die Versionszeile (`docs/UPDATES-EIGENER-SERVER.md`), nur bei Internet an.
  - **Mycel/SBKIM** (Kanon-Module byte-1:1 aus Sage unter `public/sbkim/`, eigene Schublade), **Chefcode** und **„Überall suchen“** über die
    gemeinsamen Bausteine der Pro-Apps (Quelle Private Brain Pro), Quellen hier: Dokumente, Memory, Vorgänge.
- **Sitzung D**: Briefkopf lesen (Briefdatum, Absender, Empfänger, Kunden-/Auftrags-/Rechnungsnummer, Aktenzeichen, Wichtigkeit) und danach
  sortieren, dazu **nach Thema** — die 18 Lebensbereiche in `lib/family-categories.ts` (mit Aliassen und Zuordnungsvorschlag) sind schon da und
  werden das Vorbild für die anderen Apps. Baustein aus Workflow-PDF, hier zuletzt; `documentDate` (heute von Hand) und Mailkopf (`lib/central-intake.ts`) werden Vorgabe/Quelle.

Geprüft am 2026-10-31 (Stand `cdcd3b4`): Aktualisieren oben, Mycel, Chefcode, Überall suchen und Briefkopf sind hier noch nicht gebaut; die Themen (Lebensbereiche) schon. Es gelten die Regeln dieses Repos (Oberfläche des Freundes bleibt,
sichtbare Änderungen nur mit Klaus' Ja je Punkt, Beispieldaten erfunden, kein Release ohne sein Wort).

## Startauftrag zum Einfügen

```
Familienakte ins Netz: zuerst BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-14.md lesen (Sitzung B), dazu CLAUDE.md und BRIEF_ABSCHLUSS_2026-10-29_FASSUNG-2.28.3-UND-ABGLEICH.md hier.
Repos: Meine-Familienakte, Privat-Brain-Pro (Bausteine), Sage-Protokol (Kanon-Module, nur lesen/kopieren). Branch wie vorgegeben.
Aktualisieren-Knopf oben, Mycel, Chefcode, Überall suchen. Oberfläche des Freundes nur mit meinem Ja je sichtbarer Änderung.
Kein Release ohne mein Wort, keine Schlüssel/PINs/Chefcodes in Dateien oder im Chat, Kanon-Module byte-1:1.
Am Ende Abschlussbrief mit Startauftrag.
```
