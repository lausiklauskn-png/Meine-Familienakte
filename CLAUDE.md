# CLAUDE.md — Meine Familienakte

Diese Datei liest jede Sitzung zuerst. Was hier steht, gilt für jede Arbeit in diesem Repo.
Sie enthält nur den aktuellen Stand und die festen Regeln. Ältere Briefe und Zwischenstände liegen in
`docs/briefe-archiv/` (Klaus 2026-11-04: archivieren statt löschen); die Veröffentlichungsnachweise in
`docs/VEROEFFENTLICHUNG-<fassung>.json`.

## Aktueller Stand (10.11.2026, nach 2.28.56)

- **Fassung 2.28.56** (#155; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.56.json`; Brief
  `BRIEF_ABSCHLUSS_2026-11-10_NUR-LAUFWERK-2.28.56.md`): **Tresor einrichten – nur Laufwerk wählen** (Ordnerwahl öffnet am gemerkten Tresor
  oder oben auf dem Gerätespeicher, `EXTRA_INITIAL_URI`; kein Namensfenster, „Family-Projekt“, bei Belegung „Family-Projekt 2…9“; nur
  `FamilienakteTresorPlugin.java`). Alle Pro-Apps finden den Tresor am Inhalt (`tresorordner.json`), nicht am Namen. **Adresse
  `?ansicht=landkarte`** öffnet die Landkarte der App direkt (Merker in `sessionStorage` übersteht das Neuladen beim ersten Besuch); die
  Geschenkbox nutzt sie. Geschenkbox mit Knopf „Als eine Datei speichern“ (Download-Freigabe; kein Chat-Anhang, der wird als ZIP verpackt).
- **Fassung 2.28.55** (#153; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.55.json`; Brief
  `BRIEF_ABSCHLUSS_2026-11-10_GERAETETEST-2.28.53.md`): **Meldungen klarer** – info heißt „Hinweis“, Zwischenstände (`laeuft: true`)
  weichen der nächsten Meldung (`lib/ui-activity.ts`); Ordnerfehler übersetzt (`app/nativer-ordner.ts` `uebersetzt`/`ordnerFehlerText`).
  **Pro-Tresor-Karte kürzer** (Vorschau `docs/vorschau/tresor-karte-kurz-2.28.55.html`, Klaus Ja 1–5): Zustand und Ort in einer Zeile,
  „✓ Tresor eingerichtet“, Abbruch als ruhiger Hinweis, Kennung und Seltenes hinter „Mehr“ (`data-pro-tresor-mehr`). Punkt 5 (übrige
  Karten der Sicherheitsseite) offen. **Geschenkbox als eine Datei**: `node tools/geschenkbox-datei.mjs` →
  `docs/geschenk/Geschenkbox-Pro-Apps.html` (Verbund-Karte als eigene Seite im iframe, byte-gleich).
- **Fassung 2.28.54** (#151; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.54.json`; Brief
  `BRIEF_ABSCHLUSS_2026-11-10_GERAETETEST-2.28.53.md`): **Landkarte der App** – Fäden sitzen wieder an ihren Kästen (Chip-Lage relativ
  zur Gruppe statt zu `.lk-chips`, Neurechnen bei jeder Größenänderung), **Legende als Knöpfe** (`KartenLegende fuer=…`, Ereignis
  `fa-landkarte-filter`; Tipp hebt alle Kästen/Wege einer Art hervor). Probe `app-landkarte` (Fäden oben/unten, Legende).
- **Fassung 2.28.53** (#150; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.53.json`; Brief
  `BRIEF_ABSCHLUSS_2026-11-10_GERAETETEST-2.28.53.md`), aus Klaus' Gerätetest 10.11.: **Zuordnung prüfen** folgt der eigenen Wahl
  (Kartenfarbe, Titel, Marke „bestätigt/von dir angepasst/bitte prüfen“), Haken **„Zuordnung stimmt“** übernimmt alle Vorschläge,
  ohne Vorgänge Hinweis statt leerer Liste (`app/health-portal.tsx`, Probe `zuordnung-pruefen`). **Papierkorb** für Erinnerungen,
  Aufgaben, Fristen und Notizen mit Zurückholen (`app/local-vault.ts` `index.papierkorb`, `app/papierkorb-karte.tsx`; höchstens 200).
  **Glocke „Probe hören“** nutzt in der APK den Android-Kanal mit dem gewählten Ton (`FamilienakteGlockePlugin.probe`).
  Geschenkbox `docs/geschenk/geschenkbox-pro.html` mit Abschnitt „Landkarten“ (Artefakt XeUMGuSZ49FzsJYjwQznM7; die Verbund-Karte liegt dort
  als eigene Datei `pro-verbund.html`, damit Android sie nicht in der installierten Familienakte öffnet – beim Neuveröffentlichen mitgeben).
- **Fassung 2.28.52** (#148 mit #147; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.52.json`; Brief
  `BRIEF_ABSCHLUSS_2026-11-10_VERBUND-OHNE-ORANGE.md`): **Tresor-Leser** in „Wo liegt was?“ (`app/tresor-leser-knopf.tsx`, Datei
  byte-gleich aus Workflow PDF Pro unter `public/tresor-leser/`, Pin im `check:herkunft`; Probe `tresor-leser`), **Update-Fähnchen ohne
  Tipp** (`stillPruefenEinrichten`, Probe `update-fahne-auto`), **Pro-Verbund-Karte ohne Orange** (BookLedgerPro a705ed5). Zugleich
  ausgegeben mit derselben Karte: BookLedgerPro 0.1.14, Private Brain Pro 1.0.48, Workflow PDF Pro 1.0.16. Nächster Brief:
  `BRIEF_SITZUNG_2026-11-10_VERBUND-GEPLANTE-PUNKTE.md` (graue/rote Wege der Karte).
- **Fassung 2.28.51** (#144, Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.51.json`; Brief
  `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-09_AUSGABE-2.28.51.md`): Gerätetest Galaxy S21 – Tresor einrichten in einem eigenen Ordner im Gerätespeicher
  (Ordner mit Fachnamen wie „Familienakte“ direkt im Gerät, ohne Tresorspuren, gilt als Speicher; darin entsteht „Family-Projekt“;
  SD/USB und tiefere Ordner weiter abgewiesen; `ProTresorAdapter`, `Hauptordner.java` unverändert), Meldung unter dem Zustand,
  „Wo liegt was?“ hinter dem „?“. **Hilfekarten live** (`lib/live-zustand.ts`, `app/live-zustand.ts`; Vorschau
  `docs/vorschau/live-zustand-2.28.50.html`): Fläche = Gerätezustand (grün/rot/gelb/grau), Rahmen = Baustand (blau fertig, lila
  gestrichelt im Bau, grau gestrichelt geplant), „neu“ als blauer Punkt, „Beheben ›“, Demo-Band; Zugänge über „Neu“ › „Landkarte
  öffnen“ und Symbol „Akten sichern“. Proben `live-karten`, `scripts/run-live-zustand-tests.mjs`.
- **Fassung 2.28.50** (#145, ausgegeben ohne eigenen Nachweis): Kurzfassung je Dokument im Pro-Tresor (`lib/tresor-kurzfassung.ts`),
  E-Mail-Anlagen beliebig tief, im eigenen Netz antworten (ab Werk aus). Windows-Datei 2.28.50 kam nicht auf family-projekt.de
  (Server-Job nie angelegt), mit 2.28.51 überholt.
- **Pro-App-Verbund (Vorschau)** (#146): Hilfe-Thema mit der Karte `public/pro-verbund/pro-verbund.html`, byte-gleich aus
  BookLedgerPro (Pin `pro-verbund.herkunft.json`, Commit a705ed5; `check:herkunft`). **Karte nie hier ändern, nur in BookLedgerPro pflegen.**

- **Plan Rückmeldung** `docs/PLAN_2026-11-09_GERAETETEST-RUECKMELDUNG.md` (Klaus 09.11., Bilder vom Handy mit 2.28.37): **A–D gebaut**
  (#142, Fassung **2.28.49**; Brief `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-09_RUECKMELDUNG-A-D.md`; Vorschau C/D `docs/vorschau/tagebuch-assistenz-2.28.49.html`,
  alle sieben Fragen Ja). A: Cockpit öffnet Bearbeitbares als Fenster (`StammBearbeitenFenster` in `app/familie-anlegen.tsx`,
  `TerminBearbeiten` mit „Ganze Akte ansehen ›“), Startkopf deckend. B als Bausteine: `InfoZeile`, `SuchFeld`, `HinweisText`
  (`lib/hinweis-text.ts`, jedes „?“) in `app/ui-controls.tsx`, Schlagwort-CSS, `FlachText ganz`, `quelleAnzeige`. C: Kopf
  „Erinnerung“ + „Buch“, ein Erfassungsblock mit Stimmung (`STIMMUNGEN`, `lib/family-memory.ts`) und Person, „Aus deinem Tagebuch“
  beim Termin; „Memory“ nicht mehr sichtbar (gespeicherte Quelle „Tagebuch & Erinnerungsprotokoll“ bleibt). D: Assistenz mit drei Wegen,
  Briefweg verdeckt (`app/brief-antwort.tsx`, `lib/brief-antwort.ts` auf `lib/ki-auftrag.ts`/Modul 25; Mistral EU, Direktlink),
  PDF `lib/text-pdf.ts`. Nachträge: gesprochenes Datum bei der Erinnerung (`erinnerungAusText`); „Ausloggen“ schließt die App
  (`app/anmelde-knopf.tsx`, Android `FamilienakteAppPlugin`, Windows-Recht `core:window:allow-close`, im Browser Abmeldeseite).
  **Ausgegeben** als APK, Windows und PWA (Nachweis `docs/VEROEFFENTLICHUNG-2.28.49.json`). **E (Gerätetest 2.28.48) offen.**
- **Plan Abgleich** `docs/PLAN_2026-11-08_ABGLEICH.md` (Klaus 08.11., **Freibrief**: ohne Rückfrage umsetzen, Fragen selbst nach
  Logik und Benutzerfreundlichkeit entscheiden). **Alle Stufen A–I gebaut und auf main** (Sitzung 7, 08./09.11.): A Zusammenführen
  (2.28.40, #131) · B verschlüsselte Vollsicherung mit Notfallblatt, Papierkorb leeren, Erinnerung nach 7 Tagen (2.28.41, #132) ·
  C gemeinsame Festplatte mit Kennung (`app/laufwerk.ts`, `app/laufwerk-karte.tsx`; 2.28.42, #133) · D Kalender beidseitig
  (`lib/kalender-einlesen.ts`; 2.28.43, #134) · E Eingangsordner in Blöcken zu 20 (`lib/eingang-bloecke.ts`, Android `ArbeitDienst`;
  2.28.44, #135) · F Abgleich im eigenen Netz (`NetzDienst.java` Android/Windows byte-gleich, `app/netz-laufwerk.ts`, Koppeln per Code;
  2.28.45, #136) · G Bedeutungssuche in der PWA (`app/browser-modelle.ts`, OPFS; 2.28.46, #137) · H Original-Foto im Stapel, „Teilen“
  (`app/teilen.ts`), Glocke nach Neustart (`StartEmpfaenger`; 2.28.47, #138) · I Paket per Teilen (`app/paket.ts`; 2.28.48, #139).
  **Fassung 2.28.48** als APK, Windows und PWA ausgegeben (Nachweis `docs/VEROEFFENTLICHUNG-2.28.48.json`). Vier CI-Funde in Java
  (NewApi: `Instances.DIRTY`, Kanal ab API 26, `URLDecoder`/`toString(Charset)` ab API 33) und drei Proben-Wettläufe behoben
  (`waitForFunction(async)` wartet nicht; Eingang zeigt den Titel statt des Dateinamens). Ersetzt Punkt 10 und die Fragen u–z.
- **Plan** `docs/PLAN_2026-11-07.md` (#116, von Klaus bestätigt): drei Bausitzungen – 1 Hilfe (2.28.33, erledigt), 2 Daten (2.28.34, erledigt bis auf Punkt 10), 3 E-Mail (2.28.35: Plan und Hilfe-Thema, Senden/Abholen nicht gebaut). **Punkt 10** (Abgleich zwischen den Geräten): nur Vorschlagsrunde, `docs/vorschau/daten-2.28.34.html` (https://claude.ai/artifact/2wECZ4S96eYLgL9mKkXhDN), Fragen u–z an Klaus offen, nichts gebaut.
- **Fassung 2.28.39** (Android, Windows, PWA; #129; Bericht `docs/vorschau/pruefung-ablauf-2026-11-08.html`, Vorschauen
  `zusammenhang-2.28.39.html` A–E und `neugestaltung-2.28.39.html` zehn Punkte, alle von Klaus mit Ja): Ablaufprüfung mit elf
  KI-Prüfern (Bereiche, drei Nutzerrollen, Orientierung, Regeln), danach gebaut. **Erinnerung ist Teil der Aufgabe** (kein zweiter
  Datensatz; Umzug alter Einträge beim Start `lib/erinnerung-umzug.ts`), Detail klappt im Cockpit auf, „Erledigt“ mit Rückgängig.
  **Ein Sprungweg** `app/sprung.ts` (einmal zum Ziel, markieren), Pfad = gegangener Weg `app/vorgang-offen.tsx`. Eingang speichert
  Titel/Datum/Textauszug (`textAuszug`), übernimmt erkannte Fristen, Startseite nimmt alle Dateien; Sammelbestätigung und gemeinsame
  **Auswahl-Leiste** (`app/auswahl-leiste.tsx`: Alle, Einzelabwahl, „Auswahl aufheben“), „Aus der Akte nehmen“ mit Zurückholen
  (`app/sammel-ablage.ts`, Aussortiert), Knopf „Ablegen“ im Kopf (`app/ablegen-knopf.tsx`). Suche: Alltagswörter, Monate, Daten,
  UND, Synonyme (`lib/family-search-text.ts`), Treffer als Zeilen nach Art, Seiten zu 50 (`app/seiten.tsx`); **Bibliothek als
  Zeilen** (`DocumentLibraryZeile`, Auge klappt die volle Karte mit allen Knöpfen auf, Kartenansicht wählbar); Fristenliste mit
  Suche und Filtern. Personen/Organisationen/Objekte/Vorgänge anlegen (`app/familie-anlegen.tsx`), Namen statt Kennnummern.
  Startseite „So fängst du an“ (`app/erste-schritte.tsx`), Menügruppe „Termine & Aufgaben“ (**neun Hauptbereiche**), ein Cockpit,
  Update-Fähnchen statt ⟳ (`app/update-fahne.tsx`). Glocke grün wenn an, aus = keine Meldung in der Android-Leiste; Erlaubnis für
  Meldungen fragt Android erst beim ersten geplanten Termin. Geräte/Hilfe ehrlich (kein Abgleich behauptet). **Proben suchen
  Einträge am Titel** (Liste zeigt den Titel, nicht den Dateinamen); Karten-Knöpfe in der Zeilenansicht hinter `[data-bibliothek-auge]`;
  Android-Produktproben erteilen POST_NOTIFICATIONS vorab (`FamilyDemoFixture.allowNotifications`); die Produktprobe
  „Private Bedeutungssuche“ läuft nur bei bestimmten Pfaden – bei Android-Änderungen von Hand starten.
- **Ältere Fassungen 2.28.27–2.28.38** (alle als APK, Windows und PWA ausgegeben; Einzelheiten in `lib/fassungen.ts`, den Nachweisen
  und `docs/briefe-archiv/`): Kalender, Glocke, Notiz (2.28.27–2.28.32), Hilfe neu mit Sprung/Rücksprung (2.28.33), Dateigröße je
  Gerät, Vollsicherung in frei gewählten Ordner, Sicherung einlesen, Demo-Kopie (2.28.34, `docs/SICHERUNG-VERGLEICH.md`), E-Mail-Karte
  (2.28.35, `docs/landkarte/`), Landkarte der App mit **Stand je Kasten in `lib/app-stand.ts` – bei jeder Fassung eintragen** (2.28.36),
  Hilfe-Themen als Bild, Vorschaufenster (2.28.37), Listenzeilen mit `KnopfLeiste`, Kopfleiste (2.28.38).
  Proben-Hinweise: `step()` wertet einen zurückgegebenen Text als grün, deshalb `soll()`; Seitentitel sind keine Sprungziele.
- **Fassungen und Nachweise:** `docs/VEROEFFENTLICHUNG-<fassung>.json` für 2.28.56, 2.28.55, 2.28.54, 2.28.53, 2.28.52, 2.28.51, 2.28.49, 2.28.48, 2.28.39 … 2.28.22
  (2.28.50 ausgegeben, aber ohne eigenen Nachweis; 2.28.40–2.28.47 waren Zwischenstände). Keine davon erneut ausgeben;
  **nächste freie Fassung 2.28.57**. Klaus 2026-11-06: neue Funktionen immer gleich als APK, PWA und Windows ausgeben.
  Neue Fassung oben in `lib/fassungen.ts` eintragen. Die Versionszeile zeigt die technische Fassung aus `package.json`;
  `APP_VERSION` 2.28.1 in `app/health-portal.tsx` bleibt interner Prüf-, Hilfe- und Changelog-Stand.
- **Kalender:** Kern `lib/kalender.ts`, Glocke `lib/glocke.ts`, Oberfläche `app/kalender-karte.tsx`, `app/mein-kalender.tsx`,
  `app/termin-bearbeiten.tsx`, Notiz `app/notiz-knopf.tsx`; Einrichtung `docs/KALENDER-EINRICHTUNG.md` (Google veröffentlicht,
  Microsoft-App eingerichtet, Herausgeber nicht verifiziert). Gesundheitsfristen gehen mit echtem Titel hinaus, Notizen nie.
- **Namen:** Web-App (PWA, Browser) = „Familienakte Basic“ (`public/manifest.webmanifest`), native Apps
  (Android `strings.xml`, Windows `tauri.conf.json`) = „Familienakte Pro“. Nicht wieder angleichen. Die Anzeige
  Basic/Pro im Kopf folgt `APP_VARIANTE` (seit 2.28.23 in der Zeile der Versionsnummer).
- **Updates:** Tipp auf die Versionszeile prüft in Android und Windows den Update-Server family-projekt.de
  (Ausgabe mit `server=ja`); die PWA aktualisiert sich über Pages.
- **Oberfläche:** Kein Personenname in sichtbaren Texten (Klaus 2026-11-04: „Nutzer“). Erklärungen kurz, in Punkten, hinter
  Fragezeichen; Ablaufbilder/Ordnerbäume über `app/ablaufbild.tsx`. Neue Entwürfe erst als HTML-Vorschau zeigen.
- **Demo (Klaus 2026-11-04, 07.11.):** aus = oben nichts von „Demo“, Start hinten in der Hilfe; an = roter Knopf „DEMO ▾“ hinter
  dem Namen mit Menü (verlassen · bei Kopie „Übernehmen …“ · zurücksetzen · löschen). Mit eigenen Daten Kopie, sonst Beispielfamilie. Proben über `tests/ui/_demo.mjs`.
- **Kim-sync** gehört nicht in die Familienakte (Klaus 2026-11-04); die Geräteübergabe nennt nur einen frei wählbaren Weg.
- **Gemeinsamer Tresor:** Workflow-PDF-Pro #67 (main 066498d) verdrahtet „Tresor einrichten – nur Speicher wählen“ (Hauptordner
  finden/anlegen, ein Passwort, Lies-mich, Speichern in den Tresor gesperrt). Das Paket liegt byte-gleich in Familienakte,
  BookLedgerPro, Private Brain Pro. Ein-Schritt-Weg verdrahtet in Familienakte #92 (`ProTresorAdapter.einrichten`,
  `FamilienakteTresorPlugin.einrichten`) und BookLedgerPro #454, beide auf main, nicht veröffentlicht; Private Brain Pro #130 auf main (Klaus' Freibrief 05.11.), nicht veröffentlicht.
  Tresor-Leser (HTML auf der Karte, ohne Installation, nur lesend) Workflow-PDF-Pro #68, seit 2.28.52 in der Familienakte eingebaut.
  Geschenkbox mit den veröffentlichten Downloads: `docs/geschenk/geschenkbox-pro.html` (https://claude.ai/artifact/XeUMGuSZ49FzsJYjwQznM7). Klaus will danach alle Pro-Apps neu installieren
  und frische Tresorräume anlegen.
- **Aktensicherung (Klaus 2026-11-05):** Hilfe → „Akten sichern – Plan zum Abhaken“, Orte als Baum, rot/grün/grau je Gerät gemerkt,
  Kästen mit › springen zur Akte bzw. Sicherheitscenter (`app/aktensicherung-hilfe.tsx`). Ordner im Dateimanager öffnen kann die App nicht.
- Aktuelle Briefe im Hauptordner (ältere unter `docs/briefe-archiv/`):
  - `BRIEF_ABSCHLUSS_2026-11-10_NUR-LAUFWERK-2.28.56.md` (jüngster Abschluss: nur Laufwerk wählen, Landkarte per Adresse, Geschenkbox-Download)
  - `BRIEF_ABSCHLUSS_2026-11-10_GERAETETEST-2.28.53.md` (Abschluss Vormittag: Gerätetest 10.11., Fassungen 2.28.53 und 2.28.54, Geschenkbox)
  - `BRIEF_ABSCHLUSS_2026-11-10_VERBUND-OHNE-ORANGE.md` (Abschluss der Nacht: Karte ohne Orange, vier Apps ausgegeben)
  - `BRIEF_SITZUNG_2026-11-11_KURZHINWEISE.md` (Startbrief zuerst: Kurzhinweise am Tablet, rote und graue Kästen der Landkarte, danach die übrigen Punkte)
  - `BRIEF_SITZUNG_2026-11-11_FAMILIENAKTE-WEITER.md` (Startbrief Familienakte: Sicherheitsseite kürzer, Wettlauf, Basic-Karte, Landkarten-HTML, Vollsicherungsordner)
  - `BRIEF_SITZUNG_2026-11-10_VERBUND-GEPLANTE-PUNKTE.md` (Startbrief: graue/rote Wege der Pro-Verbund-Karte und offene Punkte aus 2.28.53)
  - Vorheriger: `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-09_AUSGABE-2.28.51.md` (Ausgabe 2.28.51; Startauftrag Gerätetest)
  - `BRIEF_CODEX_2026-11-04_NACH-2.28.24.md` (Abstimmung mit Codex: welche Dateien Claude gehören)
  - `BRIEF_ABSCHLUSS_2026-11-04_PDF-ARBEITSRAUM.md`, `BRIEF_ABSCHLUSS_2026-11-04_PDF-FUNKTIONSABGLEICH.md` (Codex)

## Offen

- **Kurzhinweise an Knöpfen wirken am Tablet nicht** (Klaus 10.11., APK 2.28.56): Brief `BRIEF_SITZUNG_2026-11-11_KURZHINWEISE.md`.
- **2.28.56 am Gerät ungeprüft:** Ordnerwahl mit Startort, „Family-Projekt 2“, Pro-Apps im selben Tresor, Direktlink zur Landkarte.
- **2.28.55 am Gerät ungeprüft:** Meldungen oben (Hinweis, verschwindet), kurze Tresor-Karte, „Mehr“.
- **2.28.54 am Gerät ungeprüft:** Fäden der Landkarte am Tablet mit großer Schrift, Legenden-Knöpfe.
- **2.28.53 am Gerät ungeprüft:** Papierkorb (Löschen → Zurückholen → endgültig), Glocken-Probe mit gewähltem Ton, Haken
  „Zuordnung stimmt“ und Kartenfarbe nach eigener Wahl.
- **2.28.52 am Gerät ungeprüft:** Tresor-Leser mit echtem Tresor auf SD/USB (Ordnerwahl, Öffnen im Handy-Browser), Update-Fähnchen
  beim Zurückholen der App, Zusammenspiel der Pro-Apps im selben Tresor (alle gelben Wege der Karte). BookLedger Basic hat noch die alte Karte.
- **2.28.51 am Gerät ungeprüft:** Tresor im Ordner „Familienakte“ (SAF-Freigabe), Live-Zustände der Karten (alles nur gestellt).
- **Baustand hinter Schalter (Klaus 09.11.):** Der Rahmen „Baustand“ bleibt sichtbar, solange intern getestet wird; danach hinter einen
  versteckten Schalter bzw. eine Eingabe nur für Entwickler.
- **2.28.49 am Gerät ungeprüft:** weiße Fläche (A1) ist eine Vermutung (Galaxy S21 nachstellen), Cockpit-Fenster, Kopf mit Buch am
  Handy, Tagebuch-Block, gesprochenes Datum, Ausloggen (APK beendet sich?), Briefweg mit echter KI/echtem Mistral-Schlüssel nie benutzt.
- **2.28.48 am Gerät ungeprüft (alle Stufen B–I):** verschlüsselte Vollsicherung und Notfallblatt am Handy (PBKDF2 ein bis zwei
  Sekunden), gemeinsame Festplatte (Android-SAF-Freigabe, Windows-Laufwerkssuche, Erkennen an der Kennung), Kalender holen (Google,
  Microsoft, Gerätekalender), Eingangsordner mit Android-Dauer-Meldung, Netz-Abgleich im echten WLAN/LAN/USB (Port 48200/48201),
  Bedeutungssuche in Chrome/Edge mit echtem Modell-Download, Teilen-Fenster und Boot-Empfänger, Paket per Teilen zwischen zwei echten
  Geräten. Proben nur mit gestellter Hülle. Stufe-G-Modell in der Probe nie echt geladen.
- Android-Produktprobe (Emulator) zweimal an der Infrastruktur gescheitert (TrichromeLibrary/Emulator-Download), nach Neustart grün.
- 2.28.39 am Gerät ungeprüft (Klaus' Ausgangsfall!): Erinnerung als Teil der Aufgabe, Sprungweg und Pfad, Sammelbestätigung,
  Auswahl-Leiste, „Aus der Akte nehmen“ auf Android/Windows/Pro-Tresor, Glocke grün und Entfernen der Meldung, Erlaubnis-Frage beim
  ersten geplanten Termin, Update-Fähnchen nativ, „So fängst du an“. Umzug alter Erinnerungen nur mit Testdaten geprüft.
- Aus dem Bericht offen: Gesundheitsschutz je Nutzer wählbar (Klaus f1) als Einstellung; Stufe 3 (Abgleich zweier Akten = Punkt 10)
  erst nach Antworten u–z; Verschlüsselung beim Mailversand gibt es nicht (nur der Pro-Tresor verschlüsselt).
- Gerätetest 2.28.37 (Klaus 08.11.): Vollbild in Ordnung; Drehen am Galaxy S21 in Ordnung, am Galaxy Tab S6 nicht – dort lief
  Samsung DeX (dreht nie), Rückmeldung ohne DeX offen; Wischen der Landkarte in Ordnung. Ungeprüft: F11, Vorschaufenster (▣).
- 2.28.38 am Gerät ungeprüft: Aufklappleiste in den Listen und im Kopf, Stift an Erinnerungen, Hilfe-Kasten, geteilter Bildschirm
  am Tablet (Android-Abstand zu den Systemleisten), „Installieren“ bei installierter Web-App.
- Ältere UI-Proben mit `cond ? true : text` auf `soll()` umstellen (`step()` wertet Text als grün). Vorschaufenster Weg B
  (echte Stelle mit Beispielfamilie) nur, falls die Skizze zu abstrakt ist.
- E-Mail: Entscheidungen von Klaus und Jens aus der E-Mail-Karte abwarten, dann bauen (zuerst Anhang-Prüfung, echtes PDF mit
  einem Tipp, Mail-App öffnen; danach Microsoft mit Entra-Rechten Mail.Read/Mail.Send; Gmail-Abholen auslassen).
- 2.28.35 am Gerät ungeprüft: Knopf „Neu“. APK 2.28.34 von Klaus grob geprüft: in Ordnung.
- Gerätefälle am Tablet: die sechs Fälle aus #70/#75 (Tresor-Plan), SD-Verweis/Freigabe und Neustart, fehlende
  Speicherbestätigung. Keine SD-Pfad-Reparatur oder Geräteprüfung behaupten, die nicht stattgefunden hat.
- Ältere zusätzliche Android-Tresor-Paar-Abnahme (Workflow PDF Pro, BookLedgerPro) nicht vollständig geprüft;
  Maßstab `docs/PRO-VERBUND-PRUEFSTAND.md`, Berichte `docs/pro-verbund-nachweise.json`. Keine vollständige
  Gesamtabnahme behaupten, keine fehlgeschlagenen Prüfungen abschalten. Workflow-PDF-Pro PR #59 bleibt Entwurf.
- Eigene Berichte und ungeprüfte Nutzergeräte; Tablet-Rückmeldung zu 2.28.23/2.28.24 und zum Demo-Knopf. Drucken über den
  Android-Druckdienst ist am Gerät ungeprüft.
- Kalender am Gerät: Mein Kalender, App-Glocke, Kamera in der Notiz und die Android-Benachrichtigung (2.28.28) am Handy
  von Klaus bestätigt (06.11.); Einklappen, Löschen und Ton-Einstellung (2.28.29) sowie die neue Anordnung (2.28.30–2.28.32) ungeprüft (Android kann im Ruhemodus um Minuten verschieben; nach Neustart erst beim Öffnen neu geplant); Google-Prüfvideo und
  Microsoft-Herausgeberprüfung (MPN-ID) offen.
- CI-Prüfung `pruefung` 19–30 min, Grenze seit 2.28.33 45 min; KimHub #441 (Einträge 405–408) noch Entwurf. Lokal (Sitzungsbehälter) ist die UI-Probe `pro-dokumente` rot, auch auf unverändertem main (Browser schließt beim Neuladen), in der CI grün.
- 2.28.33 am Gerät ungeprüft: Seitenleiste neben der Android-Randgeste, Rücksprung, rote/grüne Rahmen, Hilfe-Suche.
- 2.28.34 am Gerät ungeprüft: Android-Ordnerdialog (SAF) und APK beilegen, Windows-Ordnerdialog (Swing) und Lies-mich, Verkleinern
  an echten Kamerafotos, Einlesen nach Neuinstallation, Demo-Kopie mit großem Bestand. Einlesen in eine volle Akte (Zusammenführen)
  und Erinnerung „lange nicht gesichert“ gibt es nicht (siehe `docs/SICHERUNG-VERGLEICH.md`).
- PWA-Updates nach Codex #89.

## Veröffentlichen

- Kein Release ohne Klaus' Wort. Freigaben gelten für den jeweils genannten Auftrag.
- Vor jeder Ausgabe die tatsächlichen Releases prüfen. **Eine bereits veröffentlichte Fassung nie erneut ausgeben**;
  für eine neue Ausgabe die Fassung erhöhen (`package.json`, `package-lock.json`, `windows/package*.json`,
  `windows/src-tauri/Cargo.toml`, `windows/src-tauri/tauri.conf.json`, `android/app/build.gradle`).
- Android (`android-release.yml`) und Windows (`windows-release.yml`) nur von `main`, mit `server=ja`, bestehenden
  Kennungen und Signieridentitäten. Danach öffentliche Downloads anonym per SHA-256 nachprüfen und in
  `docs/VEROEFFENTLICHUNG-<fassung>.json` festhalten. Zusammenführen und App-Veröffentlichung sind getrennte Schritte.
- Fertige, geprüfte Stücke auf `main` zusammenführen (Klaus 2026-11-01): eigener Zweig, je Stück ein PR.
  Einschränkungen der Prüfungen offen benennen. Parallel geschriebene Übergaben vor dem Merge erneut lesen.

## Feste Regel: keine Forschung in diesem Repo (Klaus 2026-10-31)

Klaus: „Forschungsaufträge, Forschungseinträge haben in Familienakte nichts zu suchen. KimHub ist die Quelle, wo es hinkommt,
maximal noch Sage-Protokoll-Abgleich, da sind die Aufträge für die Forschung. Aber da kommen auch keine Forschungseinträge hin,
sondern nur KimHub.“

- **Forschungseinträge** (Befunde, Erkenntnisse, Forschungs-Paragraphen) kommen **nur nach KimHub**
  (`Kimhub/forschung/messungen/`, Dateien `familienakte-…`). **Forschungsaufträge** stehen in KimHub, höchstens noch im
  Sage-Protokoll-Abgleich (dort keine Einträge).
- In der Familienakte entsteht **nichts davon**: keine Dateien unter `docs/forschung/`, kein Abschnitt „Forschung“ in Briefen,
  Abschlussbriefen oder PR-Beschreibungen, kein Verweis „Forschung § …“. Ein Befund wird hier nur so weit beschrieben,
  wie er für den Bau nötig ist (Grenzen, Proben). Sitzungszeiten ebenfalls nur in KimHub.
- Ist KimHub nicht in der Sitzung, das Repo `lausiklauskn-png/Kimhub` holen und den Eintrag dort ablegen.

## Weitere feste Regeln

- Oberfläche und Wortlaut des Freundes nur mit Klaus' Ja je sichtbarer Änderung. Beispieldaten erfunden.
- Keine Schlüssel, PINs, Passwörter oder Chefcodes in Dateien oder im Chat.
- **Codex-Prüfungen auslassen (Klaus 09.11.):** Codex ist nicht mehr aktiv, der Zugang ist gesperrt. Kein „@codex review“ anstoßen,
  Codex-Kommentare (auch „Failed“/„usage limits“) nicht abwarten und nicht als Befund behandeln.
- Eigene Dateien und eigene Altbriefe bevorzugt erhalten; Beispiele nur nach belegter Herkunft bereinigen.
  Keine automatischen Beispiele im eigenen Bestand (Demo hat einen eigenen Bestand).
- Byte-1:1-Bausteine nie von Hand ändern: Workflow PDF über `tools/wfpdf-nachziehen.mjs` (Pins `public/wfpdf/HERKUNFT.json`),
  App-Klon über `tools/wfpdf-app-nachziehen.mjs` (Pins `public/apps/HERKUNFT.json`, Patch `tools/wfpdf-app-patch.mjs`),
  Pro-Ausgabe über `tools/pro-ausgabe-nachziehen.mjs`, übrige über `native/HERKUNFT.json` (`npm run check:herkunft`),
  Modul 25 per Pin in `scripts/run-ki-auftrag-tests.mjs`. PDF-Kern 1.1.9 und Ausgabepin 1ea49db erhalten.
- Jede Sitzung endet mit einem Abschlussbrief (`BRIEF_ABSCHLUSS_<Datum>_….md`) mit Stundennachweis und Startauftrag als
  Codeblock. Ältere Briefe dabei nach `docs/briefe-archiv/` verschieben und diese Datei auf den aktuellen Stand kürzen.

## Speicherwege (Klaus, 2026-11-01)

- Klaus nutzt vor allem die Android-APK. Dokumente sollen auf Wunsch im vorhandenen Pro-Tresor auf der SD-Karte liegen;
  dafür die bestehende Technik aus Workflow-PDF-Pro, Private Brain Pro und BookLedgerPro wiederverwenden.
- **SD-Karte ist optional.** Gerätespeicher, ein freigegebener Ordner auf dem Rechner und andere Laufwerke müssen möglich bleiben.
  Ein gewählter, gerade nicht erreichbarer Speicher wird nicht still durch einen anderen ersetzt.
- Dauerhafte Dokumente, vorläufige Arbeitskopien, kleine JSON-Arbeitsstände und Suchvektoren unterscheiden. Keine dauerhafte interne
  Zweitsammlung aller PDFs. Vektoren gehören zum jeweiligen Dokument-/Textstand und Embedding-Modell; Modelle nicht vermischen.
  Vorhandene Geräteprüfung und Modellwahl nutzen, keine zweite unabhängige Lösung erfinden.
- Die gemeinsamen Fächer `familienakte` / `eingang-familienakte` sind über den nativen Adapter angeschlossen.
- Selbstanalyse-Schutz und Originale bewahren.

## Technische Wegweiser

- **PDF-Updates:** `npm run update:pdf` lädt die Quellen und prüft; `-- --anwenden` übernimmt mit Designschutz beide Kopien.
  Gemeinsamer Quellstand mit Pro zwingend. Automatische Entwurfs-PRs: `.github/workflows/pdf-abgleich.yml`.
  Ablauf und Grenzen: `docs/PDF-FUNKTIONSABGLEICH.md`. Nie die installierte App oder Nutzerdokumente als Quellordner verwenden.

- **Workflow PDF (Klon):** `public/apps/workflow-pdf/` byte-1:1; Brücke `public/apps/fa-wfpdf-bruecke.js` **nie umgehen**
  (eigene DB `FamilienakteWFPDF1`, kein Worker, ⟳ ohne fremde Vorräte); Seite `app/workflow-pdf-seite.tsx`.
  Tesseract/Scanic liegen nur im Klon (`vendorBasis()`).
- **Stapel:** `app/stapel*.ts(x)`, `docs/STAPEL.md` (Zusammenfügen `pdfsZusammenfuegen`, Filter/Schärfe `StapelEinst`).
- **Briefkopf im Eingang:** Rechnung in `lib/briefkopf-titel.ts`, `briefkopf.js` byte-1:1 im Klon (`public/apps/workflow-pdf/assets/`),
  Titel in `lib/central-intake.ts`. Prüfbericht nur auf manuelle Wahl.
- **Paket für den Freund:** `tools/paket/bilder-aufnehmen.mjs` und `tools/paket/paketseite.py`
  (Aufruf siehe `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-01_BRIEFKOPF-UND-PAKET.md`); die Datei liegt nicht im Repo.
- **Proben:** `npm run build` (inkl. Fachprüfungen), `npm run check`, `node tests/run-ui.mjs [filter]`.
