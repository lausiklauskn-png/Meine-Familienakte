# Auftrag an Codex: Abgleich der Familienakte

**Deine Fassung (V40 mit M1-Stand) ↔ die neue Fassung 2.28.3 von Klaus (Browser, Windows, Android, Einzeldatei)**

Diese Datei ist eine Arbeitsanweisung für Codex. Sie wird zusammen mit dem Quellcode der neuen Fassung
(`familienakte-2.28.3-quelle.zip`) weitergegeben. Codex soll beide Fassungen vergleichen und eine
Rückmeldung als Markdown-Datei schreiben, die Klaus zurückbekommt.

## Worum es geht

- Die neue Fassung 2.28.3 wurde aus deiner Oberfläche V40 gebaut und läuft im Browser, unter Windows und auf
  Android. Oben im Programm steht weiter „Version 2.28.1“.
- Beim Bau lag **deine Vorlage V40 mit dem M1-Stand nicht vor**, nur das Übergabepaket (Masterakte M0.2,
  Architekturreferenz, Bildschirmfotos). Deshalb konnte nicht alles abgeglichen werden.
- Ziel: herausfinden, was in 2.28.3 **fehlt**, **anders** ist oder **zu viel verändert** wurde, und daraus
  Anweisungen machen, mit denen Klaus' Seite die Lücken schließen kann, ohne deine Vorlage zu besitzen.

## Vorbereitung (macht der Mensch, nicht Codex)

1. Einen neuen Ordner anlegen, z. B. `Abgleich/`.
2. Darin `v40/` = eine **Kopie** deiner Fassung (nie das Original).
3. Darin `neu-2.28.3/` = den entpackten Inhalt von `familienakte-2.28.3-quelle.zip`.
4. Diese Datei nach `Abgleich/` legen.
5. Codex im Ordner `Abgleich/` starten und als erste Nachricht schreiben:
   `Lies CODEX-ABGLEICH-FAMILIENAKTE.md und arbeite den Auftrag Schritt für Schritt ab.`

## Regeln für Codex

- **Nur lesen.** In `v40/` und `neu-2.28.3/` nichts ändern, nichts löschen, nichts installieren, nichts hochladen,
  keine Netzzugriffe. Geschrieben wird nur die Rückmeldedatei.
- **Keine persönlichen Daten** in der Rückmeldung: keine Namen von Personen, Krankenkassen, Arbeitgebern, Ärzten,
  keine Diagnosen, Adressen, Kontonummern. Fundstellen nur als Dateipfad und neutrale Beschreibung.
- Keine Schlüssel, Passwörter oder Zugangsdaten.
- Unsicheres als **„unsicher“** kennzeichnen statt zu raten. Nichts als „bestanden“ werten, was nicht geprüft wurde.

## Schritt 1: zuerst fragen

Stelle vor jeder Arbeit **genau diese eine Frage** und warte auf die Antwort:

> Wie soll ich abgleichen?
> **A — nur technisch:** Funktionen, Daten, Register, Sicherung, Prüfungen, Sicherheit.
> **B — technisch und optisch:** zusätzlich Aufbau, Wortlaut, Menüs, Farben, Abstände, Startseite.

Schreibe die Antwort oben in die Rückmeldung.

## Schritt 2: abgleichen

Orientierung in `neu-2.28.3/`: `app/` ist die Oberfläche (aus V40 übernommen), `lib/` die Fachlogik,
`android/`, `windows/` und `public/native/` sind neue Hüllen für Android und Windows (gibt es in V40 nicht).
`docs/FUER-DEN-VERGLEICH.md` und `docs/analyse/ABGLEICH-UEBERGABEPAKET-2026-10-28.md` sagen, was Klaus' Seite
schon als Abweichung kennt.

**Technisch (immer):**
1. Register `00_Register/Familienakte_Register.json` (V5): Felder, Lesen, Schreiben, Migration – gleich?
2. Dokumentenweg aus M1: Eingang → Inhalt erkennen (TXT, EML, digitales PDF) → bestätigte Zuordnung → Ablage →
   Wiederfinden. Was davon fehlt oder arbeitet anders?
3. Korrekturen **B1 bis B15** aus M1: für jede Nummer „vorhanden / fehlt / anders“ mit Fundstelle.
4. Sicherung und Wiederherstellung (V1/V2) und ihre Sperren.
5. Systemprüfung, die drei Fünferblöcke, Selbsttests.
6. Neues in 2.28.3 (Internetschalter, Register mit Revision, gemerkter Stammordner, Prüfsummen, Updates):
   verträgt sich das mit M1, oder widerspricht es etwas?

**Optisch (nur bei B):** Menüwörter, Kopfzeile, Breite des Inhalts, Startseite, Texte, Hilfen, Farben.

## Schritt 3: Rückmeldung schreiben

Lege im Ordner `Abgleich/` die Datei `RUECKMELDUNG-ABGLEICH-<JJJJ-MM-TT>.md` an, mit diesem Aufbau:

1. **Kopf:** Datum, Abgleichsart (A oder B), Stand v40 (Version, wenn vorhanden Commit), Stand neu (2.28.3).
2. **Kurzfassung** in höchstens fünf Sätzen.
3. **Tabelle „fehlt / anders“:** Nr · Bereich · in V40 (Datei) · in 2.28.3 (Datei) ·
   gilt für Browser / Windows / Android / alle · Wichtigkeit (hoch / mittel / niedrig).
4. **Anweisungen zur Umsetzung:** je Punkt ein Abschnitt „Anweisung N“ mit
   - Ziel in einem Satz,
   - betroffene Dateien in `neu-2.28.3/`,
   - was genau zu tun ist – das Verhalten aus V40 so genau beschrieben, dass eine andere KI es **ohne V40**
     umsetzen kann (Codeausschnitte aus V40 nur wo nötig und ohne persönliche Daten),
   - woran man den Erfolg prüft (ein konkreter Prüffall),
   - für welche Fassung es gilt (Browser, Windows, Android oder alle).
5. **Zu viel verändert:** was in 2.28.3 zurück zum Stand von V40 soll, mit Begründung.
6. **Offene Fragen an Klaus.**

Gib zum Schluss den Pfad der Rückmeldedatei aus. Der Mensch schickt sie an Klaus.
