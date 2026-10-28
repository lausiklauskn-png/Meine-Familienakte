# Analysebericht „Meine Familienakte“ (Stand 2026-10-28, Version 2.28.1, main `22d0b40`)

Für Klaus und seinen Freund. Die Einzelheiten stehen in den verlinkten Dateien; hier steht, was man wissen muss.

## 1. In einem Absatz

Die App tut, was die Oberfläche verspricht: von 400 Bedienelementen im Code funktionieren am PC (Chrome) 381
gemessen, 5 teilweise, 2 sind defekt, 11 ließen sich ohne Entwicklungsordner nicht auslösen. Am Handy sind
zusätzlich 42 Knöpfe gesperrt, weil sie die Ordnerauswahl des Browsers brauchen (gibt es nur in Chrome/Edge
am PC). Hinter keinem Beispiel, Tipp oder keiner Rückfrage steckt eine KI; alles sind feste Wortlisten und Regeln.
Eine Anonymisierung gibt es nicht, nur eine Anzeige-Maskierung für Gesundheitsbegriffe. Der von Klaus vermutete
Weg „anonymisieren → KI → zurückführen“ ist in BookLedgerPro und Private Brain Pro fertig gebaut und lässt sich
übernehmen. Offline ist die App noch nicht: pdf.js kam vom CDN, kein Service Worker, keine PNG-Symbole; dazu
kommen Datensicherheitslücken im Tresor (stiller Speicherwechsel, verlorene Änderungen bei zwei Tabs). Beides
wird im ersten Bau (Teil 2) behoben.

## 2. Was funktioniert (gemessen, Playwright gegen den Build)

| Bereich | Stand | Probe |
| --- | --- | --- |
| Navigation: 8 Hauptmenüs, 35 Menüeinträge, 16 Fußzeilen-Einträge, Handy-Menü | alle Zielseiten fehlerfrei | `rundgang` 73 grün |
| Suche mit „Verstanden als:“, Diktat (gestellt), Drucken, Ausloggen, Objekt-Cockpit, Beispieldaten entfernen/laden | funktioniert | `knoepfe-start` 33 |
| Cockpit (Statuswechsel, Notiz, Verknüpfen/Lösen), Fristen anlegen/erledigen, Tagebuch (Entwurf, Prüfen, Speichern, Löschen) | funktioniert | `knoepfe-cockpit` 27 |
| Bibliothek, Ablage-Dialog, Eingangszentrale (PDF, Bild, DOCX, XLSX, TXT, EML, ZIP, VTT), Dublettenschutz, Scan zu PDF | funktioniert | `knoepfe-dokumente` 24, `dateieingang` 76 |
| Sicherung, Wiederherstellung per Prüfsumme, Export, OneDrive-Abgleich (mit gestellten Ordnern) | funktioniert | `knoepfe-sicherheit` 29 |
| Copy-Knöpfe (Aktivitätszeilen, ChatGPT-Auftrag, Assistenz-Entwurf), auch ohne Berechtigung | richtiger Text, klare Meldung | `kopieren` 11 |
| Assistenz, Korrespondenz, Unterseiten, Verzeichnis, Hilfe, Versionen | funktioniert | `knoepfe-assistenz` 22 |
| Akte ohne Beispieldaten (16 Seiten) | keine Fehler, Beispieldaten wieder ladbar | `knoepfe-leer` 25 |

Alle Proben: `npm run test:ui`. Umgebungen: Desktop-Chrome und Handy-Ansicht gemessen; Firefox, Safari, Einzeldatei
und claude.ai aus dem Code beurteilt (Spalten in der [Funktionsmatrix](FUNKTIONSMATRIX.md)).

## 3. Die wichtigsten Fehler (Reproduktion in der Funktionsmatrix, D1–D10)

1. **„Beispieldaten entfernen“ ist mit der Maus nicht erreichbar** (ab ca. 1130 px Breite): der Zierkreis des
   Startbanners liegt über dem Knopf (`app/globals.css`, `.family-hero:after` ohne `pointer-events: none`). Tastatur
   geht. Entstanden mit dem Neuaufbau (PR #2). Wird mit den Sofortfixen behoben.
2. **PDF-Vorschau brauchte Netz** (pdf.js von cdnjs). Behoben im Sofortfix-PR (A8): liegt jetzt im Paket.
3. **Systemprüfung „Abschlussprüfung 2.28.1“ war in jeder gebauten Fassung ROT**: Selbsttests prüften den eigenen
   Quelltext per `toString()`, den der Build umbenennt; dazu zwei echte Testdefekte („freien/freier Speicher“,
   EML-Testdatei ohne Markierung). Behoben im Sofortfix-PR (A1), ohne etwas auf „bestanden“ zu setzen. Die
   gelben Punkte (praktischer OneDrive-Pilot) bleiben ehrlich gelb, weil sie den Entwicklungsordner des Freundes brauchen.
4. **„Jetzt Abgleich durchführen“** (Sicherheitscenter) scheitert mit dem Browser-Datentresor und nennt den
   Testordner des Freundes („SOFTWARE TESTORDNER“); **„Testumgebung automatisch einrichten“** setzt `G:\01GPT-SOFTWARE\…`
   voraus. Beides gehört zur Entwicklungsumgebung des Freundes; im PWA-PR (B2) erscheint es nur noch im Expertenmodus.
5. **Dateieingang:** Inhalts-Dubletten, die später kommen, werden nicht gewarnt und beim Speichern ohne Bestätigungsweg
   abgelehnt (Sackgasse); die Eingangszentrale liest PDF/DOCX/XLSX-Inhalte nicht, nur Dateinamen („Nebenkostenabrechnung“
   landet bei Einkäufen); 20-MB-Grenze erst beim Speichern; `.exe` speicherbar; ZIP wird nicht entpackt; MSG nur als
   Text; der Startseiten-Dialog nimmt nur eine Datei und kennt `.eml` nicht ([Dateieingang](DATEIEINGANG.md)).
6. **Gesundheit & Arbeit** zeigt feste Beispieldaten aus `app/health-data.json`, nicht den Tresor; „Beispieldaten
   entfernen“ wirkt dort nicht; der Kasten „Antwort der Krankenkasse steht noch aus“ bleibt immer.
7. Kleinere: „Ausloggen“ lädt nur neu (kein Konto; Wortlaut des Freundes, bleibt), „Online-Bestand lokal kopieren“
   immer gesperrt (Cloudflare-Rest), Fristen-Formular verlangt Kennungen wie `PER-000001`, Memory löschen per Tippwort,
   Aktivitätszeilen nach Systemprüfung doppelt.

## 4. Datensicherheit des Tresors (aus Paket E und der parallelen Repo-Analyse, PR #8)

Stiller Wechsel OPFS → IndexedDB bei einem Fehlschlag, Lesen außerhalb der Schreibsperre (zwei Tabs oder ein
langer Bestandslauf überschreiben sich), Stammordner wird bei jedem Start neu geraten, Dateien vor dem Register
ohne Rücknahme, große Dateien komplett im Arbeitsspeicher. Alles im PR „Datensicherheit“ (A2–A6) behoben; die
Verschlüsselung (B1) ist Klaus’ Entscheidung. Tresor-Aufbau und Wege: [technischer Baum](TECHNISCHER-BAUM.md).

## 5. KI und Anonymisierung (Paket C)

- Die Familienakte hat **keine KI-Schnittstelle**. „Mit ChatGPT arbeiten“ kopiert den eingetippten Wunsch (ohne
  Aktendaten) und öffnet chatgpt.com; die Recherche ist fest `not_configured`; „für den Assistenten freigeben“ ist eine
  Registerfunktion, keine KI-Freigabe. Nichts verlässt das Gerät außer dem Browser-Diktat (Web Speech).
- Es gibt **keine Anonymisierung**, nur Anzeige-Maskierung per Wortmuster; Datenschutzklassen kommen aus dem Dateinamen.
- **Fertig in Klaus’ Repos:** Modul 25 (Pseudonymisierung mit Rückführung, byte-gleich in Private Brain Pro, V3,
  Sende-Prüfer), Anker/Muster/Namensmuster, Halt bei KI-Anweisungen, Vorschau „Das sieht die KI“, Mistral EU (BookLedgerPro
  „Frage an die Belege“, Private Brain Pro „KI beim Schreiben“). Sende- und Auslieferungsprüfer sind die Ausgangskontrolle.
  „KI füllt Formulare aus“ gibt es nirgends; Workflow PDF erkennt Felder per KI, der Mensch füllt aus.
- **Empfehlung:** KI-Schloss aus dem Kanon übernehmen (`25_pseudonym.js`, `pruefer-mail.js`, `reinigung.js`,
  `ki-reinigung.js` byte-gleich; `namensmuster.js`, `ner.js` aus BookLedgerPro) plus Klebstoff `lib/ki-schloss.ts` und
  Vorschau-Dialog im Stil des ChatGPT-Dialogs. Erster Weg: Kopieren ins eigene Abo; Senden an Mistral EU opt-in bei
  Internet an. Aufwand zwei Sitzungen. Reifegrad-Tabelle und Datenfluss: [KI und Anonymisierung](KI-UND-ANONYMISIERUNG.md).

## 6. Plattformen und Geräte-Eingang (Pakete F, G)

- Keine Mikrofon-Auswahl im Code; Diktat fest `de-DE`. Die Windows-Lösung (SAPI `SetInput`) und die Android-Weiche
  liegen in Private Brain Pro; Mikrofonauswahl bleibt Plan ([Plattformen](PLATTFORMEN.md)).
- Pages geht im privaten Repo (Kim-sync macht es so): kein öffentliches Auslieferungs-Repo nötig.
- Kein Weg von anderen Geräten in die Akte (kein `share_target`, kein Intent). Empfohlene Reihenfolge: a) Teilen →
  Familienakte, g) Werkzeug-Übergabe mit vorhandenen Verträgen, d) Scanner, c) Tresorordner-Fach, f) eigenes Postfach,
  b/e) Kim-sync/QR ([Geräte-Eingang](DATEI-EINGANG-GERAETE.md)).

## 7. Empfehlungen in Reihenfolge

1. Sofortfixe (PR #9) und Datensicherheit (PR #12) übernehmen; Internetschalter (PR #10) und PWA (PR #11) sind der erste Bau.
2. APK und Windows-App aus demselben Quellstand (Teil 2.3/2.4), Teilen → Familienakte in der APK.
3. Dateieingang: Dubletten-Bestätigung, Inhaltslesen in der Eingangszentrale, Grenzen vor dem Speichern, ZIP entpacken.
4. KI-Schloss aus dem Kanon (nach Klaus’ Entscheidung), danach Werkzeug-Übergabe (BookLedgerPro, Workflow PDF Pro).
5. Sichtbare Punkte (Kontraste, Schriftgrößen, Menü-Duplikate, Begriffe, Nachtmodus) je Punkt mit Klaus’ Ja.

## 8. Was Klaus selbst prüfen muss

[Handprüfung](HANDPRUEFUNG.md): echtes Mikrofon und Dauerdiktat, Kamera, Ordnerauswahl des Betriebssystems, Drucken,
Downloads am Handy, Firefox/Safari.
