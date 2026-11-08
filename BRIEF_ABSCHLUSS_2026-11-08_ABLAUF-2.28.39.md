# Abschluss 08.11.2026: Sitzung 6 (Ablaufprüfung und Neugestaltung) – Fassung 2.28.39

Startauftrag aus `BRIEF_ABSCHLUSS_2026-11-08_GERAETETEST.md` (jetzt `docs/briefe-archiv/`). Klaus begann mit einer Beobachtung am
Tablet: eine Aufgabe mit Erinnerung stand zweimal da (Aufgabe und „Erinnerung: …“), beim Abhaken sprang die Seite, ein Eintrag
verschwand. Daraus wurde der Auftrag, **die ganze App auf solche Ungereimtheiten zu prüfen** – gemessen am Ziel: rund 1000
eigene Dokumente ablegen, oben eine Frage stellen und Dokument, Termin oder Erinnerung finden, an Eingetragenes erinnert werden,
ohne Sprünge, mit berechnetem nächsten Schritt. Erst Bewertung und Bericht, dann Vorschau, dann Bau, dann Ausgabe
(„du kannst es danach ausgeben“).

## Prüfung (nichts gebaut)

- Elf Prüfer als KI-Agenten, jeder mit eigenem Bereich oder eigener Rolle, in frisch gebauter App (2.28.38) im Browser, Desktop
  und Handy, nichts verändert: Eingang · Erinnerungen · Suche · Geräte · Navigation · Hilfe-Abgleich (59 Themen, 44 Landkarten-
  Kästen) · drei Nutzerrollen (Neuling 70 J., erfahren und App neu, erfahrener Nutzer mit viel Bestand) · Orientierung (Pfade,
  Rückwege) · Regelprüfung (Professor-Rolle, 30 Regeln gegen Regeln und Ziel). Zuerst meine eigene Bewertung, wie gewünscht.
- Ergebnis: rund 240 gemessene Klicks, 113 Ungereimtheiten in den Abläufen, 89 Fragen und Funde der Rollen, 27 Regelkonflikte;
  Pfad stimmte in 3 von 18 Wegen. Vier Muster: Springen statt Zeigen · ein Ding, mehrere Einträge · Schutz ohne Gegenweg ·
  Erkanntes wird weggeworfen.
- Bericht `docs/vorschau/pruefung-ablauf-2026-11-08.html` (https://claude.ai/artifact/JbNN9JuTz39eXKUWnMNZgF): wenig Text,
  Prüfverfahren als Baum mit Rückpfeil, Stationen ① Eingang … ⑥ Anderes Gerät, Muster mit Lösung in Stufen, Fragen an Klaus
  mit Stift und Speichern (Antworten liegen in der Datenbank des Artefakts; aus der heruntergeladenen Datei gespeicherte Antworten
  bleiben nur lokal – Klaus' Antworten wurden aus seinen Bildern übertragen). Klaus: f1 Gesundheitsschutz je Nutzer wählbar,
  f2–f8 Ja.
- Vorschauen: `docs/vorschau/zusammenhang-2.28.39.html` (A–E, Erinnerung als Teil der Aufgabe sofort, da nur Testdaten; E
  „Erledigt“ mit Rückgängig) und `docs/vorschau/neugestaltung-2.28.39.html` (zehn Punkte, alle Ja mit Anmerkungen; Aussehen
  bleibt im Großen und Ganzen).

## Was gebaut wurde (PR #129, main 48c16fe)

- **Erinnerung als Teil der Aufgabe**: kein zweiter Datensatz „Erinnerung: …“, einmaliger Umzug alter Einträge beim Start mit
  Sicherung (`lib/erinnerung-umzug.ts`); Detailansicht klappt im Cockpit auf statt Seitenwechsel; „Erledigt“ mit Rückgängig;
  Handy-Knöpfe (Speichern nicht mehr ausgeblendet), ✓ überall. Glocke für alle offenen Fristen.
- **Ein Sprungweg** für alle Bereiche (`app/sprung.ts`): einmal zum Ziel, markieren, kein Hoch-Runter; Pfad = gegangener Weg,
  bleibt sichtbar (`app/vorgang-offen.tsx`); eine Zuordnung je Datensatzart.
- **Eingang**: Titel, Datum und Textauszug werden gespeichert, erkannte Frist übernommen, keine ungefragte Verknüpfung, Startseite
  nimmt alle Dateien an (nichts mehr still verworfen); Prüfdialog nach Bericht. Sammelbestätigung („✓ N ausgewählte ablegen“,
  sichere Vorschläge angehakt), gemeinsame **Auswahl-Leiste** mit „Alle“, Einzelabwahl und „Auswahl aufheben“ (`app/auswahl-
  leiste.tsx`), „Aus der Akte nehmen“ mit Zurückholen (Aussortiert). Knopf „Ablegen“ im Kopf (Fotografieren · Dateien · Ordner).
- **Suche**: Alltagswörter, Monate, Daten, UND-Verknüpfung, Synonyme (`lib/family-search-text.ts`), Inhalt wird gelesen; alle
  Treffer als Zeilen nach Art, „Weitere Ergebnisse“; keine Beispieldaten in der eigenen Akte. Bibliothek als Zeilen (Datum · Titel ·
  Bereich; Auge klappt die volle Karte mit allen Knöpfen auf; Kartenansicht wählbar), Listen in Seiten zu 50; Fristenliste mit
  Suchfeld und Filtern (Offen · Diese Woche · Überfällig · Erledigt).
- **Personen, Organisationen, Objekte, Vorgänge anlegen** („+ Neu“, `app/familie-anlegen.tsx`); Namen statt Kennnummern in der
  Oberfläche.
- **Startseite „So fängst du an“** (drei Schritte, überspringbar), Menügruppe „Termine & Aufgaben“ (jetzt neun Hauptbereiche),
  ein Cockpit, Update-Fähnchen statt ⟳ (`app/update-fahne.tsx`), Kopf-Symbole am Handy mit Wort.
- **Glocke**: grün, wenn an; aus = keine Meldung mehr in der Android-Leiste (`cancelAll`), Meldungsfarbe grün; die Erlaubnis für
  Meldungen fragt Android erst, wenn eine Erinnerung zu planen ist (nicht beim leeren ersten Start).
- **Geräte/Hilfe ehrlich**: kein Abgleich zweier Akten behauptet, Knöpfe nur, wo sie gehen; Hilfe und Landkarte mit der App
  abgeglichen (neues Thema „Internet für die App“), Stand der Kästen in `lib/app-stand.ts`, Versionshistorie 2.28.39.

## Geprüft

- tsc, eslint (0 Fehler), `npm run build`, `npm run check`, `npm run check:herkunft` grün.
- Voller UI-Lauf im Behälter auf dem Stand vor den Proben-Anpassungen: 75/85 grün. Alle zehn roten waren **Fehler der Proben**
  (altes Bild der Oberfläche: Liste zeigt den Titel statt des Dateinamens, Knöpfe hinter dem Auge der Zeile, Kamera-Eingabe des
  Kopf-Knopfs, neun Hauptbereiche, ein Wettlauf beim Lesen von „Gespeichert ✓“); kein Fehler der App. Danach alle 85 einzeln grün
  (Einzeldatei nur unter Last rot, 4× einzeln grün). Neue Proben: `auswahl-leiste`, `aussortiert`, `sammelablage`, `sprungweg`,
  `suche-finden`, `erinnerung-aufgabe`; `knoepfe-dokumente` mit Auge-Schritt.
- CI #129 auf 2befd9a: pruefung, webview, android, windows, transport, abgleich, product (31, pixel_c), product (35, pixel_2) grün.
  Die Android-Produktprobe war zweimal rot: erst lag das Erlaubnisfenster für Meldungen beim leeren Start obenauf (App
  geändert), dann bei der Beispielfamilie (sie bringt Erinnerungen mit) – die Produktproben erteilen die Erlaubnis jetzt vorab,
  wie jedes Laufzeitrecht im Emulator; ein von Hand gestarteter Lauf war grün.

## Ausgabe 2.28.39

- APK `android-v2.28.39` (Lauf 42506245415, `server=ja`, Upload und Prüfung von außen im Lauf grün): anonym geladen,
  SHA-256 = SHA256SUMS (`d508f59d…1d03d`, 19 959 841 Bytes), innen 2.28.39 / 48c16fe. Einzeldatei 3 713 708 Bytes, SHA stimmt.
- Windows `windows-v2.28.39` (Lauf 42506247322, `server=ja`, Job „server“ grün): Setup anonym geladen, SHA-256 = SHA256SUMS
  (`32375a73…7ace`, 34 116 075 Bytes), `latest.json` nennt 2.28.39.
- PWA: Pages Lauf 153 (42506215109) auf 48c16fe grün.
- Nachweis `docs/VEROEFFENTLICHUNG-2.28.39.json`.

## Nicht geprüft / offen

- Kein Gerät: Erinnerung als Teil der Aufgabe am Tablet (Klaus' Ausgangsfall), Sprungweg und Pfad, Sammelbestätigung,
  Auswahl-Leiste, „Aus der Akte nehmen“ auf Android/Windows/Pro-Tresor, Glocke grün und Entfernen der Meldung, Erlaubnis-Frage
  beim ersten geplanten Termin, Update-Fähnchen nativ, „So fängst du an“.
- Umzug alter Erinnerungen nur mit Testdaten geprüft (Klaus: „nichts großartig reingegeben“).
- Aus dem Bericht nicht gebaut (Stufe 3 oder Entscheidung offen): Abgleich zweier Akten (Punkt 10, Fragen u–z), Sichern am
  Handy in frei gewählten Ordner ist seit 2.28.34 da, Verschlüsselung beim Mailversand von Gesundheitsunterlagen (nur Pro-Tresor
  verschlüsselt), Gesundheitsschutz je Nutzer wählbar (f1) als Einstellung.
- Übrig aus dem Startauftrag: E-Mail (Entscheidungen Klaus/Jens), ältere UI-Proben auf `soll()`, Gerätetest 2.28.37/2.28.38.

## Stundennachweis

Spanne aus Nachrichten-, Commit- und Laufzeiten; Obergrenze, Pausen nicht abgezogen, Klaus' eigene Angabe geht vor. Zeiten in MEZ.
Sitzung 5 endete 13:04; die Sitzung 6 beginnt mit Klaus' erster Nachricht 13:14.

| Block | von | bis | Dauer | Inhalt |
|---|---|---|---|---|
| 1 | 13:14 | 13:52 | 38 min | Ursache Aufgabe/Erinnerung, Vorschau A–E, Prüfauftrag, elf Prüfer gestartet |
| 2 | 13:52 | 14:33 | 41 min | Bericht (Baum, Stationen, Muster, Stift), Klaus' Antworten f1–f8, Rückfragen |
| 3 | 14:33 | 15:28 | 55 min | Lösungen schwer/mittel/klein, Fragen der Rollen beantwortet, Vorschau zehn Punkte, abgehakt |
| 4 | 15:28 | 16:46 | 78 min | Bau in Paketen (Agenten in Arbeitsbäumen), Mehrfachauswahl, Glocke grün, Freigabe der Ausgabe |
| 5 | 16:46 | 17:42 | 56 min | Zusammenführen der Pakete, Fassung 2.28.39, Bibliothek-Auge, PR #129 |
| 6 | 17:42 | 18:41 | 59 min | Rote Proben (alle Probenfehler), Android-Produktprobe, CI, Zusammenführen auf main |
| 7 | 18:41 | 19:15 | 34 min | Ausgabe APK/Windows/PWA, Downloads prüfen, Nachweis, Abschlussbrief, KimHub |

Zusammen: 13:14 bis 19:15 = **6 h 01 min** (davon rund 50 min Warten auf CI und Ausgabe-Läufe).

## Startauftrag zum Einfügen

```
Familienakte – Sitzung 7, Brief vom 08.11.2026.
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-08_ABLAUF-2.28.39.md, docs/vorschau/pruefung-ablauf-2026-11-08.html
(Bericht der Ablaufprüfung; Antworten von Klaus f1–f8), docs/vorschau/neugestaltung-2.28.39.html (zehn Punkte, alle gebaut).
Stand: 2.28.39 auf main und ausgegeben (APK, PWA, Windows; Nachweis docs/VEROEFFENTLICHUNG-2.28.39.json).
Erst die tatsächlichen Releases prüfen. Nächste freie Fassung 2.28.40.

Vorlagen (wiederverwenden, nichts doppelt bauen):
- Sprung und Pfad: app/sprung.ts, app/vorgang-offen.tsx. Auswahl in Listen: app/auswahl-leiste.tsx (AuswahlLeiste, AuswahlKaestchen).
- Listenzeile: app/flach-zeile.tsx; Bibliothek-Zeile mit Auge (DocumentLibraryZeile in app/health-portal.tsx).
- Suche: lib/family-search-text.ts, app/seiten.tsx. Anlegen: app/familie-anlegen.tsx, lib/familie-stamm.ts.
- Stand der Landkarte: lib/app-stand.ts – bei jeder Fassung eintragen.

Auftrag (erst Klaus fragen, was zuerst; sichtbare Änderungen erst als HTML-Vorschau):
1. Gerätetest 2.28.39 einarbeiten: Erinnerung als Teil der Aufgabe (Klaus' Ausgangsfall), Sprungweg/Pfad, Sammelbestätigung,
   Auswahl-Leiste, Aussortiert, Glocke grün/Erlaubnis-Frage, Update-Fähnchen, „So fängst du an“.
2. Aus dem Bericht offen: Gesundheitsschutz je Nutzer wählbar (f1) als Einstellung; Stufe 3 (Abgleich zweier Akten) erst nach
   Klaus' Antworten u–z in docs/vorschau/daten-2.28.34.html.
3. E-Mail bauen, sobald Klaus' und Jens' Entscheidungen aus der E-Mail-Karte vorliegen (zuerst Anhang-Prüfung, echtes PDF mit
   einem Tipp, Mail-App öffnen; danach Microsoft). Gmail-Abholen auslassen.
4. Ältere UI-Proben von `cond ? true : text` auf soll() umstellen – eigener PR.

Regeln: Je Paket ein Commit; Lint vor dem Push; keine Prüfungen abschalten. Proben suchen Einträge am Titel (Liste zeigt den
Titel, nicht den Dateinamen); Knöpfe der Bibliothekskarte liegen in der Zeilenansicht hinter dem Auge ([data-bibliothek-auge]).
Android-Produktproben erteilen POST_NOTIFICATIONS vorab (FamilyDemoFixture.allowNotifications). Die Produktprobe
„Private Bedeutungssuche“ läuft nur bei Änderungen an bestimmten Pfaden – bei Android-Änderungen von Hand starten.
Nicht: Schlüssel/Tokens in Dateien oder Chat, Forschung im Repo (nur KimHub).
Am Ende Abschlussbrief mit Stundennachweis und Startauftrag, KimHub-Eintrag.
```
