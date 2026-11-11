# Startbrief 11.11.2026: Cloud-Ordner, Sicherung an einem zweiten Ort und E-Mail (Fassung 2.28.65)

Vorgänger: `BRIEF_ABSCHLUSS_2026-11-11_GESAMMELT-2.28.64.md`. Abgestimmt mit Klaus im Chat am 11.11. abends.
**Klaus' Wort: „Es braucht keine Vorschau“** – die Entscheidungen unten gelten als sein Ja für diesen Bau. Neue sichtbare
Wörter darüber hinaus trotzdem kurz nennen. Jens' Antwort wird **nicht** abgewartet: alles, was er entscheiden würde, wird eine
Wahl in der App, die jeder Nutzer selbst trifft.

## Arbeitsweise (Klaus 11.11. abends, Freibrief für diese Sitzung)

- **Durchgehend arbeiten, Fragen selbst beantworten, nicht nachhaken.** Entscheiden nach Logik und Nutzerfreundlichkeit; die
  Entscheidung kurz im Abschlussbrief festhalten. Ziel: **bis morgen früh (12.11.) fertig.**
- **Fertig heißt:** 2.28.65 einmal als **APK, Windows und PWA** ausgegeben (`server=ja`, Downloads per SHA-256 geprüft, Nachweis
  `docs/VEROEFFENTLICHUNG-2.28.65.json`) und die **Geschenkbox** (HTML, Artefakt XeUMGuSZ49FzsJYjwQznM7, `tools/geschenkbox-datei.mjs`)
  mit den neuen Downloads aktualisiert. Das ist für Klaus das Zeichen, dass die Aufgabe erledigt ist. Diese Ausgabe ist von Klaus
  freigegeben (sein Wort vom 11.11.); vorher alle Proben grün, nie eine schon ausgegebene Fassung erneut.
- Inhalt dieser Sitzung: nur **OneDrive/Cloud-Ordner mit Sicherung** (Punkte 1–5) und **E-Mail** (Punkt 6). Nichts anderes anfangen.

## Vor dem Start

- **2.28.64 muss draußen sein.** Prüfen: Releases `android-v2.28.64`, `windows-v2.28.64`, Nachweis `docs/VEROEFFENTLICHUNG-2.28.64.json`
  auf `main`. Stand beim Schreiben: #165 Kopf `058ce09` in der CI. Die Android-Probe `FamilyNavigationProductTest`
  war auf `d03df4a` zweimal rot (einmal kam der Probe-Tipp nicht an, einmal blieb Zurück auf `#help`), im Lauf von #165 grün.
  Vermutete Ursache: der späte Vollbild-Hinweis von Android 15 über der App (nicht belegt, Emulator-Protokoll nicht abrufbar).
  `058ce09` bestätigt ihn vor jedem Tipp und Zurück. Bei grün gibt die alte Sitzung aus; ist es noch nicht geschehen und #165
  grün, selbst ausgeben (Klaus' Freigabe gilt, nie 2.28.63). Ist die Probe wieder rot: nicht ausgeben, Klaus fragen.
- Nächste freie Fassung **2.28.65**. Klaus 11.11.: **sammeln, nicht nach jedem Umbau ausgeben.**

## Was gebaut wird

### 1 · Sicherung an einem zweiten Ort (selbsttätig)

Baut auf der Vollsicherung auf (Sicherheitsseite, verschlüsselt mit Notfallblatt oder lesbar, APK bzw. Lies-mich daneben).

- Einmal einrichten: Ordner wählen (OneDrive-Ordner am PC, USB-Stick, SD-Karte, Netzordner …). Heißt **„Sicherung an einem
  zweiten Ort“**, nicht „OneDrive“ – Klaus nutzt nur Android ohne OneDrive und bekommt denselben Weg mit Stick/SD.
- **Wahl verschlüsselt oder lesbar**, Vorgabe verschlüsselt (gibt es schon). Lesbar = Unterlagen liegen offen beim Speicherort.
- Läuft von selbst, wenn sich etwas geändert hat (Vorschlag: höchstens einmal am Tag und beim Knopf „Jetzt sichern“).
- **Aufbewahrung (Klaus):** am zweiten Ort **genau eine** Sicherung, die neueste; auf dem Gerät **zwei** (neueste und davor),
  die dritte wird gelöscht.
- **Nie zuerst löschen:** neue Sicherung ganz schreiben, zurücklesen und prüfen (Länge, SHA-256 – `pruefenMitGeduld` gibt es),
  erst dann die alte entfernen. Bricht etwas ab, bleibt die alte heil. Gelöscht wird nur, was die App selbst als ihre Sicherung
  erkennt (Kennung im Kopf), nie fremde Dateien.
- Hinter dem „?“: OneDrive hebt frühere Fassungen einer Datei selbst eine Zeit lang auf; Notfallblatt auf Papier, getrennt vom
  Gerät; im Notfall an jedem PC: App installieren (liegt daneben), „Sicherung einlesen“, Passwort.
- Erinnerung „lange nicht gesichert“ (7 Tage) bleibt, zählt die selbsttätige Sicherung mit.
- Berührt die offene Frage „Aufbewahrung alter Sicherungen“ – mit Klaus' Regel 1 dort / 2 auf dem Gerät erledigt.

### 2 · Wahl „Nur sichern“ oder „Synchron halten“

- Beim Einrichten des zweiten Orts: **„Nur sichern“** (Vorgabe, Punkt 1) oder **„Synchron halten“**.
- „Synchron halten“ = die gemeinsame Festplatte (`app/laufwerk.ts`, `app/laufwerk-karte.tsx`, zwei Richtungen, verschlüsselt,
  Kennung, Konflikte werden gefragt) mit dem gewählten Ordner, z. B. im OneDrive-Ordner. **Die Sicherung aus Punkt 1 läuft
  trotzdem mit**, damit ein Fehler im Abgleich nie alles mitreißt.
- Zeigen, was auf welchem Gerät geht; was nicht geht, mit einem Satz statt eines toten Knopfs.

### 3 · Cloud-Ordner hereinholen (Weg B)

Für Jens' eigene OneDrive-Ordner. Baut auf dem Eingangsordner (`chooseInboxFolder`, `lib/eingang-bloecke.ts`) auf.

- Ordner wählen, mit allen Unterordnern; **nur lesen**, im Ordner wird nichts geändert.
- **Jede Datei wird in die Akte kopiert** (Original im Tresor bzw. Speicher der Akte), der Cloud-Ordner ist nur Herkunft
  („OneDrive › Auto › Versicherung“). **Vor dem Bau im Code prüfen, ob der Eingangsordner heute kopiert oder nur verweist.**
  Fällt OneDrive weg, darf in der Akte nichts fehlen.
- Neues und Geändertes kommt in die Eingangszentrale zum Prüfen (Sammelbestätigung, „Zuordnung stimmt“); geänderte Datei =
  neue Fassung, die alte bleibt; schon Bekanntes wird wiedererkannt.
- Selbst nachsehen beim Start und regelmäßig (Vorschlag 15 min, solange offen); „Jetzt nachsehen“ bleibt.
- **„Trennen“**: beendet die Verbindung, die Akte behält alles.
- Platzhalter-Falle: OneDrive hält Dateien oft nur „bei Bedarf“. Hinter dem „?“: Ordner auf „Immer auf diesem Gerät behalten“
  stellen; eine Datei, die sich nicht lesen lässt, wird gemeldet, nicht still übergangen.
- Geht in Windows-App und Chrome/Edge am PC; Android-App: OneDrive hält dort keinen Ordner → Karte sagt es.

### 4 · Handy-Schleife über OneDrive

- Am Handy aufnehmen → „Paket teilen“ (`app/paket.ts`, verschlüsselt, seit 2.28.48) in die OneDrive-App → der PC findet das
  Paket im OneDrive-Ordner und führt es ein (Zusammenführen wie beim Paket-Einlesen in `app/laufwerk-karte.tsx`, nichts wird gelöscht).
- Daheim im WLAN geht es ohne Cloud über den Netz-Abgleich (`app/netz-laufwerk.ts`).

### 5 · Altes „OneDrive verbinden“

Legt heute die ganze Akte unverschlüsselt in den OneDrive-Ordner (`chooseVaultFor`, nur `showDirectoryPicker`). Bleibt, bis
„Synchron halten“ steht; dann prüfen, ob es jemand nutzt (Jens), und mit Klaus klären, ob es wegfällt oder „Akte liegt in OneDrive (alt)“ heißt.
**Nichts an bestehenden Akten still umziehen.**

### 6 · E-Mail: alle Wege offen, wie in der Landkarte geplant

Klaus 11.11.: „genauso wie mit OneDrive, alle Wege offen lassen“ – es gibt sehr verschiedene Nutzer. Gebaut wird, was in den
Kästen der E-Mail-Karte steht (`docs/landkarte/Familienakte-E-Mail-Karte.html`, Plan `docs/landkarte/Familienakte-E-Mail-Plan.html`,
Hilfe-Thema „E-Mail“); die entscheidenden Punkte bleiben eine **Wahl des Nutzers** in der App, in Blöcken wie oben.

- Die Fragen e1–e10 aus dem Plan gelten **mit dem Vorschlag in Klammern** als entschieden (alle „ja“). Was nur Klaus tun kann,
  bleibt beim Gerätetest offen und wird nicht behauptet: e10 (Rechte `Mail.Send`/`Mail.Read` in Entra; den Microsoft-Weg C trotzdem
  bauen, er meldet ehrlich, wenn die Rechte fehlen), e7 (Gmail senden erst nach Googles Zustimmung; bis dahin Weg B).
- **Private Brain als Empfangsmodul (Weg F, e9) – Klaus' Hauptweg:** Private Brain Pro holt die Mails (IMAP/SMTP, Google-Anmeldung
  gibt es dort schon, Zugänge im Android-Keystore bzw. Windows geschützt). Dort „An Familienakte“: Mail mit Anhängen wird **intern**
  übergeben, über das gemeinsame Fach `eingang-familienakte` im Pro-Tresor (Brain kennt das Fach schon: `Fach.java`,
  `native/pro-ueberall.js`). Die Familienakte holt es in die Eingangszentrale zum Prüfen. Einrichten für den Nutzer: einmal im
  Brain am Postfach anmelden, fertig. Repo `lausiklauskn-png/Privat-Brain-Pro` per `add_repo` holen; dortige Regeln (CLAUDE.md,
  byte-gleiche Bausteine) beachten; Brain mit eigener nächster Fassung ausgeben, wenn sich dort etwas ändert.
- Daneben bleiben: Weg A (Teilen → Familienakte, gibt es), Weg B (Mail-App öffnen mit Anlage), Weg C (Microsoft direkt).
- **E-Mail-Programm direkt in der Familienakte (Weg H, IMAP aus Brain übernehmen):** eigener späterer Bauschritt. Jetzt nur
  vorbereiten (Schnittstelle, Platz in der Wahl, Kasten in der Landkarte „geplant“); nicht in den Vordergrund stellen.
- Verschlüsselung beim Mailversand gibt es nicht – im „?“ ehrlich sagen.
- **Notfalls, nur wenn nötig (Klaus 11.11.): Private Brain als 1:1-Klon in die Familienakte**, genau wie Workflow PDF
  (`public/apps/workflow-pdf/` mit Brücke `public/apps/fa-wfpdf-bruecke.js`, eigene DB, Pins in `public/apps/HERKUNFT.json`,
  Nachziehen per Werkzeug, nie von Hand ändern). Dann ein Knopf „E-Mail“ oben im Kopf: Mails direkt in der Familienakte empfangen,
  Anhänge hineinziehen, ablegen, speichern, zuordnen über die Eingangszentrale. „Nötig“ heißt: die interne Übergabe über das
  Tresor-Fach gelingt nicht verlässlich, oder ein Nutzer hat Private Brain nicht installiert (z. B. nur die Web-App). Die Entscheidung
  mit Grund im Abschlussbrief festhalten.

## Zum Schluss (bevor ausgegeben wird)

- **Abgleich Hilfe ↔ Landkarte:** jeden neuen oder geänderten Weg in der Landkarte der App (Kästen, Fäden, Stand in `lib/app-stand.ts`,
  Rahmen fertig/im Bau/geplant), in der E-Mail-Karte und in den Hilfe-Themen nachziehen; die eigene Datei
  `docs/landkarte/Familienakte-Landkarte.html` mit `node tools/landkarte-datei.mjs` neu bauen.
- **Texte nachziehen, wo die neue Fassung etwas ändert:** Dokumentation (`docs/`, `CLAUDE.md`), Erklärungen hinter den „?“,
  „Neu“-Knopf, „Was gibt’s Neues?“ (`lib/fassungen.ts`), Hilfe › Akten sichern, Datenschutz (`public/datenschutz.html`:
  neue Übertragungen wie Sicherung in OneDrive, Mail über Brain/Microsoft) – bei Bedarf auch die gemeinsame Quelle
  `family-project/rechtstexte/rechtstexte.html` (#376) und mit `rechtstexte/verteilen.mjs` kopieren.
- Abschlussbrief mit Stundennachweis und Startauftrag; KimHub-Eintrag zur Sitzung.

## Gestaltung (Klaus 11.11., gilt für App und PC-Ansicht)

- **In Blöcken, je Entscheidung ein Block.** Man soll auf einen Blick sehen: dieser Block gehört zu dieser Entscheidung.
  Keine Reihe von Knöpfen untereinander, bei der man nicht mehr weiß, welchen man drücken soll.
- Vorschlag für die Blöcke (je ein eigener, deutlich abgesetzter Kasten mit Überschrift, Zustand in einer Zeile, nur seine Knöpfe):
  1. **Wo liegt die zweite Sicherung?** – Ordner wählen / ändern.
  2. **Verschlüsselt oder lesbar?** – eine Wahl.
  3. **Nur sichern oder synchron halten?** – eine Wahl.
  4. **Cloud-Ordner hereinholen** – eigener Kasten, getrennt von der Sicherung (Ordner, zuletzt geprüft, „Jetzt nachsehen“, „Trennen“).
- Wahlen als zwei deutlich getrennte Felder (Auswahlfelder/Kacheln), nicht als zwei gleich aussehende Knöpfe nebeneinander.
- Je Block höchstens ein Hauptknopf; Seltenes hinter „Mehr“.
- **Erklärtexte, die wichtig sind, hinter das „?“** (in Punkten, als Frage formuliert, z. B. „Was passiert mit älteren
  Sicherungen?“), sichtbar bleibt nur ein Satz.
- Am Handy untereinander, am PC nebeneinander oder in zwei Spalten – die Blöcke bleiben dieselben.

## Dazu

- Landkarte: Kästen „Sicherung an einem zweiten Ort“ und „Cloud-Ordner“, Stand in `lib/app-stand.ts` eintragen.
- Hilfe › Akten sichern: neuen Weg aufnehmen. „Neu“-Knopf: ein Satz je neuer Funktion. `lib/fassungen.ts` 2.28.65.
- Proben: Aufbewahrung (dritte gelöscht, alte bleibt bei Abbruch, fremde Datei bleibt), Kopieren statt Verweisen, Trennen,
  Paket aus dem Ordner, Gerätehinweise. Gegenprobe je Riegel. `soll()` statt `step()` mit Text.
- Erklärungen kurz, in Punkten, hinter „?“; kein Personenname sichtbar.

## Weiter offen (nicht in diesem Bau)

Rechtstexte in die einzelnen Apps (family-project #376, je App ein PR) · graue Wege der Landkarte ·
Baustand hinter Entwickler-Schalter · Testament-Bildschirmfoto · Gesundheitsschutz je Nutzer · Gerätetests 2.28.48–2.28.64
(Liste „Offen“ in `CLAUDE.md`) · KimHub-Eintrag zur Sitzung 11.11.

## Startauftrag

```
Familienakte, Startbrief BRIEF_SITZUNG_2026-11-11_CLOUD-ORDNER-2.28.65.md lesen (main bzw. Zweig claude/cloud-ordner-plan).
Freibrief: durchgehend arbeiten, Fragen selbst nach Logik und Nutzerfreundlichkeit entscheiden, nicht nachfragen, bis 12.11. früh fertig.
Zuerst prüfen, ob 2.28.64 ausgegeben ist. Dann Fassung 2.28.65: Sicherung an einem zweiten Ort (selbsttätig, verschlüsselt/lesbar,
1 dort, 2 auf dem Gerät), Wahl „Nur sichern“/„Synchron halten“, Cloud-Ordner hereinholen (kopieren, prüfen, Trennen), Handy-Schleife,
E-Mail mit allen Wegen der E-Mail-Karte als Wahl, Private Brain als Empfang mit interner Übergabe an die Familienakte, eigenes
Mail-Programm nur vorbereitet. Gestaltung in Blöcken je Entscheidung, Erklärungen hinter „?“. Zum Schluss Hilfe und Landkarten
abgleichen, Texte nachziehen, dann 2.28.65 als APK, Windows und PWA ausgeben (Klaus' Wort liegt vor), Downloads prüfen,
Geschenkbox aktualisieren, Abschlussbrief.
```
