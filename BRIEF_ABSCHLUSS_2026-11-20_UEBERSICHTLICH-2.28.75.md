# Abschlussbrief: Familienakte übersichtlich – Fassung 2.28.75 (Sitzung 19./20.11.2026)

Auftrag: `docs/BRIEF_SITZUNG_2026-11-20_FAMILIENAKTE-UEBERSICHTLICH.md` im Repo Private-Akte (Punkt 1–14), Freibrief von Klaus
(19.11. nachts): selbst entscheiden, geprüft ausgeben bis 20.11. morgens.

## 1. Die Logik der Familienakte (vor dem Umbau aufgeschrieben, unverändert gelassen)

```
Lebensbereich (Gesundheit & Arbeit, Familie & Personen, Wohnen, Fahrzeuge, Käufe & Garantien, Dokumente, Termine & Aufgaben)
 └─ Unterbereich (z. B. Gesundheit & Arbeit: Diagnosen/AU, Krankenkasse & Leistungen, Arbeit & Arbeitgeber, Anträge & Bescheide)
     └─ Akte = Vorgang (Register: case) ─┬─ gehört einer Person (Verknüpfung „betrifft“)
                                        └─ oder der Familie gemeinsam (keine Person verknüpft)
         └─ darin: Unterlagen (document) · Fristen/Aufgaben/Erinnerungen · Tagebuch-Einträge · Objekte, Verträge, Organisationen
Person (Register: person) ── alles, was mit ihr verknüpft ist, aus allen Bereichen
```

- Die Bereiche ordnen nach **Thema**, die Personen nach **wem es gehört** – beides sind Wege zu denselben Einträgen im Register.
- Eine Unterlage kann zu mehreren Akten und Personen gehören (Verknüpfungen, keine Kopien).
- Neu sichtbar gemacht, nicht neu erfunden: **Familie & Personen** zeigt links alle Personen und „Familie gemeinsam“
  (Akten ohne Person), rechts zur gewählten Person den Steckbrief und „Alles zu …“ (Akten, Unterlagen, Termine & Fristen,
  Tagebuch, Objekte, Organisationen) – aus allen Bereichen, über `buildCockpitDossier` (dieselbe Rechnung wie im Cockpit).

## 2. Was gebaut ist (Punkt für Punkt)

| Punkt | Umsetzung |
| --- | --- |
| 1 Container einklappbar | `app/klapp-karte.tsx` (`KlappKarte`, gemerkt in `fa_klapp`). Startseite: „So fängst du an“ (nur solange offen), „Zuletzt wichtig“, „Datentresor & Sicherung“, „Neue Dokumente erfassen“, „Was ist heute passiert?“ – ab Werk zu, Zahl am Knopf, kurze Zeile darunter („4 überfällig oder heute fällig“, „Noch nie vollständig gesichert“, „3 neue Dateien warten …“, „Gespeichert ✓“). |
| 2 Lebensbereiche klein | `ChipRaster`: flache Knöpfe unter dem Cockpit-Band, 1 Reihe am PC, 2 am Tablet, 3 am Handy, dann seitlich schieben; eigene Bereiche mit Zahl; „Alle Unterbereiche ›“. |
| 3 Akten-Kacheln | Die großen Kacheln „Direkt zur passenden Akte“ sind ersetzt durch die Knöpfe aus 2. Das Cockpit ist ein flaches Band (Titel, „Cockpit · N offen“, Zahlen in einer Reihe). |
| 4 Suche als Hauptweg | `app/portal-suche.ts`: passt ein Personenname, steht oben „Alles zu <Name>“ (öffnet den Steckbrief) und alles mit ihr Verknüpfte kommt in die Treffer („Gehört zu …“). Findet ein zusammengesetztes Wort nichts („Fahrzeuggarantie“), wird es einmal zerlegt („Fahrzeug Garantie“). Kern-Wortsuche unverändert. |
| 5 Personen übersichtlich | `app/personen-ansicht.tsx`; Menü „Familie & Personen“ hat nur noch **einen** Eintrag „Personen“ (statt Familienübersicht + Personen). Organisationen, Objekte, Vorgänge anlegen: eingeklappte Karte darunter. |
| 6 Kopfleiste | Sichtbar: Brief · Internet · Ablegen · Notiz · Kalender · „‹“. Hinter „‹“ (jede Breite): Schrift A··A, Discovery, Installieren, Abmelden. Tagebuch-Knopf „Buch“ heraus (Doppelung, s. u.). |
| 7 Gelbe Hinweise, Systemprüfung | Hinweis-Zeilen (Art „Hinweis“) verschwinden nach 8 s von selbst wie Erfolgsmeldungen; Fehler und laufende Zwischenstände bleiben. Gelbe Sicherungs-Leiste und Systemprüfung stehen nicht mehr auf der Startseite (Sicherung: Karte „Datentresor & Sicherung“; Systemprüfung: Hilfe-Menü und Fuß). „Bsp.-Akten“-Hinweis ist eine flache Zeile. |
| 8 Erklärungen hinter „?“ | Neue Karten tragen ihre Erklärung im „?“; Satz unter der Überschrift der Assistenz entfernt; „Der Kasten verschwindet …“ entfernt. Nicht alle älteren Unterseiten durchgesehen. |
| 9 Steckbrief | Kern: `lib/person-steckbrief.ts` (prüfen, lesen, übernehmen; Proben in `run-ausfuellen-tests`), `updateLocalPersonSteckbrief` in `app/local-vault.ts` (Register, wiederholt bei Konflikt; Protokoll nur mit Anzahl, nie Nummern). Felder an der Person: `ausweise[] {art, nummer, gueltigBis, dokumentIds}`, `eintraege[] {name, wert}` – zusätzlich, nichts Bestehendes geändert. Oberfläche: Kontakt (Straße, PLZ, Ort, E-Mail, Telefon), Ausweise & Nummern (Art mit Vorschlagsliste, Nummer verdeckt bis Tipp, gültig bis mit Marke „abgelaufen“/„läuft bald ab“, Foto → Unterlage „Familie & persönliche Dokumente“ mit Verknüpfung zur Person, Vorschaubild), Weitere Einträge (+ Eintrag). Mikrofon an jedem Textfeld (Diktat des Kerns; braucht „Internet an“). Name, Rolle, Notiz über den Stift. |
| 10 Netz/Mycel | Menüpunkt „Netz (Mycel)“ unter Dokumente entfernt; erreichbar nur noch über den Fuß („Sicherheit und Verwaltung › Netz (Mycel)“). Funktion und gespeicherte Verbindung unverändert. Modul 25 bleibt, wo es war. |
| 11 Versionshistorie | unverändert gelassen. |
| 12 „Neu“ | aus dem Kopf entfernt (Datei `app/neu-knopf.tsx` bleibt, wird nicht mehr gezeigt). |
| 13 „Pseudo“ | Knopf verdeckt (nicht gerendert); der Briefumschlag schaltet Pseudo wie bisher an. Merken: kommt später in den E-Mail-Bereich (in `CLAUDE.md` vermerkt). |
| 14 Doppelungen | siehe 3. |

## 3. Doppelungen – welche Stelle geblieben ist

| Weg | Stellen vorher | Geblieben |
| --- | --- | --- |
| Brief/E-Mail mit KI (Pseudo-Fenster) | Kopf „Pseudo“, Kopf Briefumschlag, Assistenz › „Brief oder E-Mail beantworten“ | **Briefumschlag im Kopf** (dazu „An KI“ an Unterlagen) |
| Tagebuch erfassen | Kopf „Buch“, Startseite „Was ist heute passiert?“, Menü Termine & Aufgaben › Tagebuch | **Startseite (Karte)** und **Menü** (Seite Tagebuch); Kopf-Knopf weg |
| Personen | Menü „Familienübersicht“ und „Personen“ (beide dieselbe Seite), Familienübersicht-Kachel „Personen“ | **ein** Menüeintrag „Personen“ |
| Neuigkeiten | Kopf „Neu“, Hilfe | **Hilfe** |
| Systemprüfung | Startseite unten, Menü Hilfe, Fuß | **Menü Hilfe** und Fuß |
| Sicherung erinnern | gelbe Leiste oben auf der Startseite, Sicherheitscenter | **Karte „Datentresor & Sicherung“** (Zeile darunter) und Sicherheitscenter |
| Dokumenteneingang | Kachel „Dokumenteneingang“ bei den Lebensbereichen, Karte „Neue Dokumente erfassen“, Menü | **Karte** und **Menü Dokumente › Eingangszentrale** |
| Install/Abmelden | Kopf und Handy-Menü | hinter **„‹“** und im Handy-Menü (wie vorher am Handy) |

Nicht angefasst (bewusst): Fuß-Verzeichnis (ist ein Verzeichnis, darf alles nennen), „Mit KI arbeiten“ im Fuß.

## 4. Ausgabe (20.11.2026, 01:30–02:05 UTC)

- PR #222 zusammengeführt: https://github.com/lausiklauskn-png/Meine-Familienakte/pull/222 (main `1355d37`)
- Android: https://github.com/lausiklauskn-png/Meine-Familienakte/releases/tag/android-v2.28.75 (APK, Einzeldatei; Update-Server `server=ja`)
- Windows: https://github.com/lausiklauskn-png/Meine-Familienakte/releases/tag/windows-v2.28.75 (Setup; Update-Server `server=ja`)
- PWA: Pages-Lauf von main grün.
- Downloads per SHA-256 nachgerechnet: `docs/VEROEFFENTLICHUNG-2.28.75.json`. **Nicht erneut ausgeben; nächste Fassung 2.28.76.**
- Android- und Windows-Nutzer bekommen das Update über die Versionszeile (Fähnchen).

## 5. Prüfung

- `npm run check` grün (Startseiten-Referenz in `lib/menu-optimization.ts` und die Startseiten-Prüfungen in
  `run-menu-optimization-tests`, `run-system-check`, `run-document-intake-tests` auf den neuen, von Klaus freigegebenen Aufbau umgestellt).
- Oberflächenproben: in der CI alle grün (neue Probe `uebersichtlich`, 15 Schritte; Proben zum entfernten „Neu“-Knopf herausgenommen, die übrigen an den neuen Aufbau angepasst).
- **Am Gerät ungeprüft:** alles Neue – Klappkarten am Tablet, Steckbrief mit Foto (Kamera, Pro-Tresor), Mikrofon in den Feldern,
  Personensuche mit echten Daten.

## 6. Offen

- Private Akte: Steckbrief unter „Akten › Person“ erst nach dem Nachziehen des Klons (`klone/familienakte`) bauen.
- Unterseiten (Gesundheit, Wohnen, Fahrzeuge …) haben noch ihre großen Kacheln und Regel-Kästen; dort dieselbe Klapp-Darstellung.
- „Pseudo“ in den E-Mail-Bereich (eigener Auftrag). Versionshistorie später weg (eigener Auftrag).
- Bild der Akten-Kacheln von Klaus kam nicht an – falls eine andere Stelle gemeint war, bitte nachreichen.

## 7. Stunden und Startauftrag

Sitzung 19.11. 22:40 – 20.11. 02:10 UTC (rund 3,5 Stunden).

```
Lies CLAUDE.md der Familienakte und BRIEF_ABSCHLUSS_2026-11-20_UEBERSICHTLICH-2.28.75.md. Nimm Klaus' Rückmeldung zu 2.28.75
(Tablet) auf. Danach: dieselbe Klapp-Darstellung auf den Unterseiten (Gesundheit, Wohnen, Fahrzeuge, Käufe), und in der Privaten
Akte den Klon der Familienakte nachziehen und den Steckbrief unter „Akten › Person“ zeigen.
```
