# Abschlussbrief 13.11.2026 – Fassung 2.28.67 (Absender und Titel aus dem Sortier-Kern)

Sitzung mit Freibrief (Klaus 13.11.: selbst mergen, selbst veröffentlichen). Hauptarbeit lag im Datei-Organizer
(`docs/BRIEF_ABSCHLUSS_2026-11-13_PUNKTE-3-9.md` dort); hier nur der Teil, der die Familienakte betrifft.

## Ergebnis zuerst

- **2.28.67 ausgegeben** (#176; Android, Windows mit `server=ja`, PWA über Pages). Nachweis `docs/VEROEFFENTLICHUNG-2.28.67.json`.
- Eingang: der **Absender** kommt aus dem Sortier-Kern (`mitKernAbsender`), der **Titel** weiter nur aus dem Briefkopf-Baustein.
- Gemessen am fremden Stapel „Familie mit drei Kindern“ mit **drei Einordnern** (Stapel-Autor, Claude-Agent, Codex 011):
  Absender **45 → 97 %** (gesichert), Lebensbereich 77 → 83 % (p = 0,06, **nur Richtung**, nicht gesichert).

## Befund unterwegs

Der erste Stand setzte den Titel „Brief von …“ aus dem Kern-Absender. Bei Nicht-Briefen ersetzte das den Dateinamen; die Prüfung war rot
(`dateieingang` 73/3, `workflow-pdf-raum` 3/2). Titel jetzt nur aus `briefTitel(kopfRoh)`; danach 76/0 und 5/0, CI auf dem PR ganz grün.

## Offen

- **Übernahme aus dem Datei-Organizer** (Klaus 13.11.): mehrere Blöcke kommen dazu, nichts wird überschrieben; doppelte Stücke als Doppelung
  zeigen; bei gleichem Fingerabdruck „auf eine Datei bringen“ anbieten. Erst als Vorschau.
- 2.28.67 am Gerät ungeprüft (Absender/Titel an echten Unterlagen). Geschenkbox und `lib/app-stand.ts` nicht nachgezogen.

## Stundennachweis

Sitzung 13.11.2026, erste Spur 13:52 UTC (Klon Datei-Organizer), letzte Spur dieses Briefs ca. 17:15 UTC – Obergrenze **3 h 23 min**
(alle Repos zusammen, nicht nur Familienakte; Zeitraum gemessen, Anwesenheit Klaus' Auskunft, Pausen nicht abgezogen).
Forschungseintrag: KimHub #460.

## Startauftrag zum Einfügen

```
Repo Datei-Organizer, Brief docs/BRIEF_SITZUNG_2026-11-14_NEEDS-RUECKWAERTSTEST.md zuerst lesen (dort der eigentliche Startauftrag).
Familienakte nur lesend; nächste freie Fassung 2.28.68. Danach (eigene Sitzung): Übernahme aus dem Datei-Organizer als Vorschau.
```
