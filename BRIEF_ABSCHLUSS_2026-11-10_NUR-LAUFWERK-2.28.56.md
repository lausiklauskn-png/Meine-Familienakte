# Abschlussbrief 10.11.2026 (Nachmittag): nur Laufwerk wählen, Landkarte per Adresse – Fassung 2.28.56

Vorher: `BRIEF_ABSCHLUSS_2026-11-10_GERAETETEST-2.28.53.md` (2.28.53–2.28.55, Vormittag).

## Was gebaut und ausgegeben ist

**Fassung 2.28.56** (#155; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.56.json`):

- **Tresor einrichten – nur Laufwerk wählen** (Klaus 10.11.: „Ja zu ‚nur Laufwerk wählen‘, bau das gleich“):
  - Die Ordnerwahl öffnet am gemerkten Tresor, sonst oben auf dem Gerätespeicher (`EXTRA_INITIAL_URI`, ab API 26).
  - Das Namensfenster ist weg. Der Hauptordner heißt immer „Family-Projekt“; ist der Name schon belegt, „Family-Projekt 2“ bis „Family-Projekt 9“.
  - Ein leerer gewählter Ordner wird selbst zum Tresor, wie bisher (`Hauptordner.ANLEGEN_HIER`).
  - Geändert: nur `FamilienakteTresorPlugin.java` und Texte; `Hauptordner.java` (byte-gleich) ist unberührt.
  - Grenze von Android ab 11: die oberste Ebene eines Laufwerks lässt sich nicht wählen. Der Hinweis nennt deshalb den Weg: „Family-Projekt“ antippen oder mit „Neuer Ordner“ anlegen.
- **Absprache der Pro-Apps** (Klaus' Frage, beantwortet):
  - Alle Pro-Apps erkennen den Tresor am Inhalt (`tresorordner.json`), nicht am Namen.
  - Ist ein Tresor da (im gewählten Ordner oder direkt darunter), nimmt jede App genau diesen, mit demselben Passwort, und schreibt in ihr eigenes Fach.
  - Bei mehreren Tresoren hält die App an; einen zweiten Tresor legt sie nie an.
- **Landkarte per Adresse** (Klaus 10.11.: der Knopf in der Geschenkbox landete auf der Startseite):
  - `…/Meine-Familienakte/?ansicht=landkarte` öffnet die Hilfe mit aufgeklappter Landkarte.
  - Der Wunsch übersteht das Neuladen beim ersten Besuch (Merker in der Sitzung, 5 s).
  - Probe `app-landkarte` 53 grün; Gegenprobe ohne den Effekt rot.
- **Geschenkbox:**
  - Der Knopf „Landkarte öffnen“ nutzt die neue Adresse.
  - Neuer Knopf „Als eine Datei speichern“ über die Download-Freigabe des Viewers. Der ZIP vom Chat-Versand ließ sich nicht entpacken; die HTML-Datei kommt jetzt direkt.
  - Fassungen 2.28.56 eingetragen, Download-Datei neu gebaut (`node tools/geschenkbox-datei.mjs`).

## Befunde

- Die erste Probe für den Direktlink war rot, der Code aber richtig: `ready()` im Harness lädt die Seite nach dem Anlegen der Beispielfamilie neu und verliert so die Adresse. Die Probe legt jetzt zuerst an und ruft danach die Adresse auf.
- Dabei gefunden: beim ersten Besuch lädt die App einmal neu (Service Worker). Ein Wunsch, der nur im Speicher stand, ging verloren. Deshalb gibt es den Merker in `sessionStorage`.

## Nicht geprüft

- Kein Gerät: Ordnerwahl mit Startort, „Family-Projekt 2“, Zusammenspiel der Pro-Apps im selben Tresor.
- Direktlink auf github.io nur in der Probe, nicht am Tablet.
- family-projekt.de aus dem Behälter nicht erreichbar; der Freigabelauf prüft den Server selbst.

## Stundennachweis

| | |
|---|---|
| Erste Spur | 10.11.2026 ca. 14:20 UTC (Klaus' Antwort „Ja zu ‚nur Laufwerk wählen‘“) |
| Letzte Spur | 10.11.2026 Ausgabe 2.28.56, Geschenkbox, Briefe, KimHub (Zeit im KimHub-Eintrag) |
| Blöcke | 14:20–14:56 Bau Tresor-Auswahl, Proben · 14:56–15:23 Geschenkbox-Download, Direktlink Landkarte, Proben, Gegenprobe · 15:23–16:02 CI #155 · 16:02– Ausgabe 2.28.56, Nachweis, Geschenkbox, Briefe |
| Obergrenze | gemessen am Zeitraum; Pausen nicht abgezogen |

## Nachtrag Abend (Klaus' Gerätetest mit 2.28.56, nur Befunde, nichts gebaut)

Alle Befunde stehen in `BRIEF_SITZUNG_2026-11-11_KURZHINWEISE.md`:
- Kurzhinweise an Knöpfen wirken am Tablet nicht.
- Die Systemprüfung zeigt veraltete Berichte und „Familienakte 2.28.1 · Website 40“; alte Berichte gelten als abgedeckt.
- OneDrive- bzw. Cloud-Ordner-Abgleich: wichtig, prüfen und sichtbar machen.
- FaWoGa und Memory erklärt.
- Die Trefferliste unter der Landkarte streichen.
- Die Landkarte der App als Datei mit Funktion in die Geschenkbox.

Bestätigt: Der Geschenkbox-Knopf „Landkarte öffnen“ nutzt `?ansicht=landkarte`. Klaus' Bild zeigte noch die alte Datei von 16:00.

- „Neu“ › „E-Mail in der Hilfe“ › „Zur Hilfe“ springt nicht zur E-Mail-Karte.

- Texte im Gesprächston und lange Erklärungen hinter „?“ (erste Funde im Startbrief).

- Alte Bestände und Versionsbezüge suchen; Rechtstexte (Impressum, Datenschutz, Haftungsausschluss) über Family-Projekt – Datenschutz sagt noch „liest keine Termine“.

Stundennachweis, Nachtrag: 16:30–17:30 UTC Befunde aufnehmen, Brief, PR #157 (Obergrenze, Pausen nicht abgezogen).
