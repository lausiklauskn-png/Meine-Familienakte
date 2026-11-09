# Plan Gerätetest-Rückmeldung – Bausitzung nach dem 09.11.2026

Klaus’ Rückmeldungen vom 09.11.2026 (Handy, Fassung 2.28.37 auf dem Gerät; main steht auf 2.28.48). Jeder Punkt ist eine
Notiz für die nächste Bausitzung. Reihenfolge und Zuschnitt der Pakete entscheidet die Sitzung nach Logik und
Benutzerfreundlichkeit (Freibrief vom 08.11.). Sichtbare Änderungen an der Oberfläche zuerst als HTML-Vorschau zeigen, wo
unten „Vorschau“ steht. Jedes Paket ein eigener PR auf `main`, Proben mit `soll()`, keine Prüfung abschalten.

## A · Fehler (zuerst)

| Nr | Was | Wo gesehen |
|---|---|---|
| A1 | **Weiße Fläche beim Scrollen und Tab-Wechsel**: Karte (z. B. Objekt-Cockpit) bleibt weiß und erscheint erst nach einem Moment wieder. Ursache im Rendering der Glas-Karten (Transparenz, Unschärfe, `backdrop-filter`) suchen, nicht dem Gerät zuschreiben. Mit 2.28.48 am Galaxy S21 nachstellen. | Startseite, Bild 1 |
| A2 | **„Zuordnung prüfen“** im Vorgang (Direkte Aktionen) tut nichts. | Vorgang-Detail, Bild 5 |
| A3 | **Tagebucheintrag öffnen** tut nichts. | Tagebuch |
| A4 | **Textüberlauf** in der Assistenz, Kasten „A · Aus meiner Familienakte“: Text ragt über den Container hinaus. | Assistenz |
| A5 | **Cockpit → Bearbeiten fehlt**: Tipp auf einen Eintrag im Cockpit scrollt hin, öffnet aber nicht die Bearbeitung. Regel für Cockpit und alle Listen: bearbeitbare Objekte (Aufgabe, Erinnerung, Vorgang, Projekt, Person) öffnen direkt die Bearbeitung; Dokumente öffnen Vorschau oder Ablageort. Der Zurück-Knopf der Bearbeitungsseite führt mit einem Tipp an die Stelle zurück, von der man kam (Cockpit an der Stelle, nicht Seitenanfang). Weg über Logo → Cockpit bleibt. | Cockpit |

## B · Muster in der ganzen App (einmal durchziehen, nicht einzeln)

| Nr | Regel | Belege |
|---|---|---|
| B1 | **Schlagwort oben links, Text darunter volle Breite.** Überall, wo heute eine Kennzeichnung (AUFGABEN, ARCHIV, „Termin / Ereignis“, Dokumentart …) links neben dem Text steht und ihn schmal macht. Am Handy wird der Container dadurch flacher. Alle Stellen mit diesem Aufbau zusammensuchen (ein gemeinsamer Baustein) und in einem Zug umstellen. | „Neu hinzugekommen“ (Bild 2), „Zugehörige Informationen“ im Vorgang (Bild 4) |
| B2 | **Info-Zeile statt Info-Kasten.** Beispiel Dokumentenbibliothek: nur eine Zeile „Info · Dokumentenvorschau“; Tipp auf „Info“ klappt den Text darunter auf. Kein Fragezeichen, nur Informationstext. Gleiches Muster für alle festen Info-Kästen. | Bild 3 |
| B3 | **Suchfelder einheitlich wie „In der Familienakte suchen“**: ein Eingabefeld, daneben das Mikrofon als eigener Knopf. Keine Lupe im Feld, wenn Überschrift oder Zusammenhang schon sagt, dass gesucht wird („Dokumente durchsuchen“ trägt die Lupe bereits in der Überschrift). Lupe nur, wo sonst unklar wäre, dass das Feld sucht. Alle Suchfelder der App durchgehen. | Bild 3 |
| B4 | **Erklärtexte hinter das Fragezeichen.** Fest sichtbare Erklärsätze unter Überschriften („Überfällige und heute fällige Punkte stehen zuerst …“) und kleine Untertexte in Knöpfen („einzeln prüfen und speichern“, „Ordner kontrolliert prüfen“ …) kommen weg, wo Überschrift oder Knopftext allein tragen oder das „?“ es schon erklärt. Ausnahme: Untertext, der einen Zustand meldet, den man sonst nicht sieht („Noch kein eigener Datentresor gewählt“). | Startseite (Bild 6), „Neue Dokumente erfassen“ |
| B5 | **Alle „?“-Texte in einer Form**: Hauptpunkte fett, Aufzählung mit Punkten statt Fließtext, kurz; von dort hinspringen können. Gilt für alle Fragezeichen der App (`InfoPopover`, `UI_HELP`). | überall |
| B6 | **Keine Doppelung beim Aufklappen einer Zeile** (Notiz-Liste, Fristen und Aufgaben, Mein Kalender, Tagebuch): heute stehen gekürzter Titel und Zeit oben und noch einmal voll im aufgeklappten Detail. Beim Aufklappen wird die Zeile selbst zur vollen Ansicht (Titel ganz, darunter Datum, Kalender, Knöpfe); kein zweiter Titel, keine zweite Zeit. Zuklappen kürzt wieder. | Notiz-Fenster (Bild 7) |
| B7 | **Keine internen Kennnummern sichtbar** („EVENT-000005“ als Quelle). Stattdessen Name der Quelle (z. B. „Aus deiner Notiz vom 06.11.2026“) mit Sprung dorthin. Seit 2.28.39 an vielen Stellen erledigt, Rest nachziehen. | Vorgang-Detail, Bild 4 |

## C · Tagebuch, Erinnerung, Memory klar trennen (Vorschau zuerst)

Heute drei Dinge mit fast gleichem Namen:
1. **Erinnerung** (Glocke): Weckzeit an Termin, Aufgabe, Frist; über Notiz-Knopf oder beim Speichern einer Aufgabe; landet in „Mein Kalender“, geht in Google/Microsoft/Gerätekalender.
2. **Memory** (technischer Name): Eintrag im Erinnerungsprotokoll („was ist passiert“), mit Datum, Fotos, Bezug; erst Entwurf (Warteschlange), dann endgültig gespeichert.
3. **Tagebuch**: nur die Zeitansicht der Memory-Einträge.

Entscheidungen von Klaus (09.11.):
- **Zwei Namen, sauber getrennt**: „Erinnerung“ nur noch für die Glocke. „Memory“ verschwindet aus der Oberfläche, heißt überall „Tagebuch-Eintrag“.
- **Tagebuch = privates Notizbuch**: pro Tag Einträge, einsprechen oder tippen, Foto möglich, Stimmung/Empfinden; keine Glocke, keine Frist; in der Suche auffindbar; mit Person oder Organisation verknüpfbar, damit es beim nächsten Besuch wieder auftaucht. Beispiel: „Besuch bei Firma X, nächstes Mal eine Flasche Wein als Dankeschön mitbringen.“
- **Zwei Knöpfe oben in der Leiste**: Kalender wie bisher für Termine/Erinnerungen, daneben ein **Buch** für das Tagebuch. Tipp auf das Buch öffnet direkt „Was ist heute passiert?“ mit Mikrofon und Kamera, darunter die letzten Einträge.
- **Notiz-Knopf** bleibt der schnelle Weg für Erinnerungen, sagt aber „Erinnerung“ statt „Notiz“ (oder fragt nach dem Einsprechen: Erinnerung oder Tagebuch?).
- **Erfassungsseite: ein Block statt drei Karten.** Heute: „Nächste Eingabe“ (Entwurf in Warteschlange, Feld leeren) und „Eintrag prüfen“ (dasselbe plus Prüfung öffnen) als zwei Karten mit Erklärtext; dazu die Zähler „Unbehandelte Erinnerungen“ / „Offene Memory-Fragen“ zweimal (Erfassungsseite und Tagebuch-Seite). Neu: Eingabefeld, darunter ein Knopf „Eintrag prüfen“ und ein kleiner Zweitweg „Noch einen erfassen“; Erklärtexte ins „?“; Zähler nur einmal auf der Tagebuch-Seite, Wortlaut „Noch zu prüfende Tagebuch-Einträge“ und „Rückfragen zu gespeicherten Einträgen“; Zähler mit null werden nicht angezeigt.

## D · Assistenz neu durchdenken – nächster Bauschritt vor der E-Mail-Abstimmung (Vorschau zuerst)

Stand im Code (`app/assistant-center.tsx`, `lib/family-assistant.ts`): **ohne KI**, kein Text geht nach draußen. Fünf Wege
(Frage, Beratung, Schreiben/E-Mail, Termin vorbereiten, Vorgang weiterbearbeiten). A „Aus meiner Familienakte“ = Aktensuche;
B „Aktuell recherchiert“ = fest „nicht verfügbar“; C „Einschätzung“ = Regeltexte; Korrespondenzzentrale = Briefentwurf aus
Vorlagen mit Tonfall-Schalter, gespeichert mit Status Entwurf/Versandbereit/Versendet; senden kann sie nicht.

Entscheidungen von Klaus (09.11.):
- Name **Assistenz bleibt** (darunter Aktenkern, praktische Einordnung, Korrespondenzzentrale, gespeicherte Korrespondenz).
- **Gespeicherte Korrespondenz** = Antwortbriefe, die in Workflow PDF eingefügt oder bearbeitet werden können; Brücke prüfen.
- **Weg aus Private Brain Pro übernehmen** (E-Mail-Generator): Brief/E-Mail eingeben → Namen, Adressen, Nummern, Beträge werden
  durch Platzhalter ersetzt → anonymisierter Text zum Kopieren in die eigene KI (Abo) oder mit eigenem Schlüssel direkt → Antwort
  zurück, Platzhalter wieder eingesetzt. Technik aus Private Brain Pro übernehmen, nicht neu bauen. Zweck: wem Briefe schwerfallen,
  bekommt leichter Antworten auf E-Mails und Briefe.
- Kasten B ehrlich entfernen oder als „keine Internetsuche“ kennzeichnen; die Wege „Frage“ und „Beratung“ ehrlich als Aktensuche
  beschriften oder zusammenlegen.
- Die **Assistenz als Ganzes neu durchdenken**: zuerst HTML-Vorschau mit neuem Aufbau, dann bauen. Danach erst die Abstimmung zur
  E-Mail-Anbindung (Plan 2.28.35, Entscheidungen Klaus/Jens).

## E · Weiter offen aus dem Brief vom 09.11.

Gerätetest 2.28.48 (Vollsicherung verschlüsselt, Festplatte, Netz-Abgleich, Kalender holen, Eingangsordner, Bedeutungssuche,
Teilen, Paket) steht weiter aus; Rückmeldungen dazu kommen von Klaus, sobald 2.28.48 auf den Geräten ist. Die Bilder vom 09.11.
zeigen noch 2.28.37.

## Antworten von Klaus zur Vorschau C/D (09.11.2026)

Vorschau `docs/vorschau/tagebuch-assistenz-2.28.49.html` (https://claude.ai/artifact/438M5ZpFE2xtUnre9yrKUZ). Alle sieben Fragen mit **Ja**:
c1 Buch-Knopf oben · c2 Stimmung als fünf Gesichter, freiwillig · c3 Tagebuch erscheint beim nächsten Termin mit der verknüpften
Person/Organisation (Termin-Ansicht, nicht die Glocke) · d1 drei Wege statt fünf, Kasten B weg · d2 eigener Schlüssel nur Mistral (EU) –
Notiz: „Auch hier gibt es bereits einen Weg sein Abo zu benutzen. Direktlink mit Text kopie wie in Tomys Vorlagengenerator“ (also neben
„Kopieren“ ein Direktlink, der die KI mit dem verdeckten Text öffnet; die Familienakte hat diesen Weg im KI-Auftrag, `lib/ki-auftrag.ts`)
· d3 Schlüssel ab Werk nur für die Sitzung, „auf diesem Gerät merken“ wählbar, nie im Pro-Tresor · d4 „In Workflow PDF öffnen“.
