# CLAUDE.md — Meine Familienakte

Diese Datei liest jede Sitzung zuerst. Was hier steht, gilt für jede Arbeit in diesem Repo.
Sie enthält nur den aktuellen Stand und die festen Regeln. Ältere Briefe und Zwischenstände liegen in
`docs/briefe-archiv/` (Klaus 2026-11-04: archivieren statt löschen); die Veröffentlichungsnachweise in
`docs/VEROEFFENTLICHUNG-<fassung>.json`.

## Aktueller Stand (08.11.2026)

- **Plan Abgleich** `docs/PLAN_2026-11-08_ABGLEICH.md` (Klaus 08.11., **Freibrief**: ohne Rückfrage umsetzen, Fragen selbst nach
  Logik und Benutzerfreundlichkeit entscheiden; je Stufe mindestens PWA ausgeben, APK/Windows bei nativen Änderungen oder jede zweite
  Stufe). **Stufe A erledigt** (2.28.40, #131, nur PWA): `lib/abgleich.ts`, Sicherung einlesen führt in benutzte Akte zusammen. Stufen A–I: Zusammenführen, verschlüsselte Vollsicherung, gemeinsame Festplatte, Kalender beidseitig, Eingangsordner in
  Blöcken, WLAN/LAN/USB, Bedeutungssuche in der PWA, Scan-Original, Paket. Ersetzt Punkt 10 und die Fragen u–z.
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
- **Fassung 2.28.38** (Android, Windows, PWA; #127; Vorschau `docs/vorschau/geraetetest-2.28.38.html`): Gerätetest-Rückmeldung.
  Listenzeilen (Fristen und Aufgaben, Mein Kalender, Tagebuch, Notiz-Liste) „Datum/Uhrzeit · Anfang … Hauptwort · Art und Glocke“
  (`FlachText`/`hauptwort` in `app/flach-zeile.tsx`); ✓ ✎ 🗑 👁 in `KnopfLeiste` (Pfeil ‹ auf, › zu, Wischen, nur eine offen), ab 600 px
  Zeilenbreite direkt in der Zeile (Containerabfrage `.fz-voll`); Stift ändert auch reine Erinnerungen (`updateLocalScheduleTermin`,
  `TerminBearbeiten`). Hilfe oben ein Kasten (`AppLandkarteHilfe` mit `demo`): blauer Knopf „Demo starten“, Landkarten-Symbol, „?“
  oben rechts; Landkarte immer als Karte, **Listenansicht entfernt**. Kopf bis 900 px: Drucken/Installieren/Abmelden hinter ‹ (Kopfleiste),
  Name per `useEinzeilig` (ganz ab 360 px). Android: Abstand zu sichtbaren Systemleisten im geteilten Bildschirm (`freiVonLeisten`).
  „Installieren“ weg, wenn die Web-App installiert ist (`app/installiert.ts`, Manifest `related_applications`). Gradle-Wrapper 120 s.
  Proben neu: `zeilen-leiste`, `kopf-leiste`, `installiert`.
- **Fassung 2.28.37** (Android, Windows, PWA; #125): alle Hilfe-Themen als Bild zum Antippen (`app/hilfe-bilder.tsx`: `BildThema`,
  `KastenReihe`, `DatenmodellKarte`, `sprung`), höchstens drei Kernpunkte mit dem Wichtigsten fett, langer Text unter „Ausführlich“;
  Vorschaufenster „Wo in der App?“ (`app/hilfe-vorschau.tsx`, Maus oder ▣, Skizze aus gemessenen Kartentiteln `lib/hilfe-seiten.ts`,
  Stelle rot, „Hingehen ›“); „?“-Erklärfenster bis 560 px, „Neu“ ab Tablet bis 960 px quer. Seitentitel sind keine Sprungziele
  (Rahmen säße auf dem „?“). Proben `hilfe-alle`, `app-landkarte` nutzen `soll()`: `step()` wertet einen zurückgegebenen Text als grün.
- **Fassung 2.28.36** (Android, Windows, PWA; #123): Landkarte der App ganz oben in der Hilfe (`app/app-landkarte-hilfe.tsx`, Daten
  `lib/app-landkarte.ts`, **Stand je Kasten in `lib/app-stand.ts` – bei jeder Fassung eintragen**; Gold bis Antippen, höchstens
  14 Tage; am Handy als Liste). Android immer Vollbild und `fullUser` (dreht in alle Lagen, Drehsperre gilt; beim ersten Start
  einmal der Android-Hinweis „Vollbild“), Windows maximiert und F11 (`app/vollbild.ts`), Web-App `orientation: any`, bleibt
  standalone (gepinntes `installieren.js` erkennt nur das als installiert).
- **Fassung 2.28.35** (Android, Windows, PWA; #121, #122): Hilfe „E-Mail in die Familienakte“ als Landkarte (`app/landkarte.tsx`,
  `app/email-hilfe.tsx`; Vorbild Sage-Modul-Topologie: Container mit Wege-Knöpfen, Äste direkt am Kasten, → eine Richtung, ⇄ hin und
  zurück, Tipp nennt woher/wohin; Stand als Rahmen grün fertig · gelb gestrichelt im Bau · rot einschalten · grau gestrichelt
  geplant, Fläche blass, ⚠ Vorsicht), Knopf „Neu“ mit „E-Mail in der Hilfe“, „● Neu“ im Hilfe-Thema, Hilfe zu Fehlendem berichtigt.
  E-Mail-Plan: `docs/vorschau/email-2.28.35.html`; zur Abstimmung (Klaus mit Jens) eigenständige Dateien mit Stift-Notizen in
  `docs/landkarte/` (ganze App, E-Mail-Karte mit Empfehlung und Entscheidung je Kasten, E-Mail-Plan). Geplant, nicht gebaut:
  Anhang-Prüfung mit `dateiPruefen` (Prüfkern aus Workflow PDF), echtes PDF ohne Befund mit einem Tipp, Mail-App öffnen, Microsoft.
- **Fassung 2.28.34** (Android, Windows, PWA; #119): sichere Dateigröße je Gerät aus der Geräteprüfung (`lib/geraete-grenze.ts`: unter 3 GB 15 MB, 3–6 GB 20 MB, ab 6 GB 40 MB, Pro-Tresor höchstens 20 MB), Ansage nur „Verkleinern“ · „Abbrechen“, Verkleinern ≥ 300 dpi mit Tesseract-Gegenprobe 98 % (`app/verkleinern.ts`), Dateiausgabe 100 MB; Vollsicherung in der Android- und Windows-App in frei gewählten Ordner (`app/nativer-ordner.ts`, Android `FamilienakteOrdnerPlugin`, Windows `FamilyFolders.java` in der Java-Engine; nur selbst angelegte Dateien entfernbar, kein allgemeines Löschen), APK bzw. Windows-Lies-mich mit SHA-256 (`fa_setup_angaben`) daneben; „Sicherung einlesen“ mit Probe ohne Schreiben, nur in leere Akte (`sicherungProben`/`sicherungEinlesen`, `app/sicherung-einlesen.tsx`); Demo = Kopie der eigenen Daten (nur im Dateispeicher, sonst Beispielfamilie), „Übernehmen …“ mit Liste „Was ändert sich?“ (`lib/demo-kopie.ts`, `app/demo-uebernahme.tsx`). Vergleich mit BookLedgerPro/Private Brain Pro: `docs/SICHERUNG-VERGLEICH.md`.
- **Fassung 2.28.33** (Android, Windows, PWA; #117): Hilfe neu – 13 neue Themen (`app/hilfe-themen.tsx`), „Wie kann ich dir helfen?“ und Gruppen/A–Z (`app/hilfe-ordnung.tsx`, `lib/hilfe-ordnung.ts`), Sprung mit rotem Rahmen (grün bei erledigt) und Zurück an die Stelle markiert (`app/ruecksprung.ts`), Kartenhilfe mit Sprung (`lib/ui-help-ziele.ts`), Benutzerabnahme als Bild mit vier Antworten, mitwandernde Seitenleiste (`app/seitenleiste.tsx`), Versionshistorie mit echter Fassung (`lib/fassungen.ts`, neue Fassung oben eintragen), Demo-Kasten nur „Demo starten“ (`data-demo-start`). CI-Grenze `pruefung` 45 min. Davor **2.28.32** (#113): Mikrofon in der Notiz startet nicht mehr von selbst, nur auf Tipp. Davor **2.28.31** (#112): Seitentitel immer einzeilig (`useEinzeilig` in `app/flach-zeile.tsx`, Schrift wird kleiner); Zähler-Kästchen klappen „Offene Fristen und Aufgaben“ auf und springen dorthin. Davor **2.28.30** (#111): flach und breit – Seitenkopf mit Symbol, Titel und Knopf auf einer Linie, „?“ klein rechts oben an der Schrift (`PageTitle`, `.ui-heading-help` auf allen Seiten); ein Knopf „alle“ (`app/klapp.tsx`) zeigt die Pfeile dessen, was ein Tipp bewirkt; Glocken-Hinweis breit mit Auge; Listen (Mein Kalender, Fristenliste, Tagebuch, Notiz-Liste) als Zeile „Anfang … Ende“ mit Auge (`app/flach-zeile.tsx`), Ändern/Löschen hinter dem Auge, Fristenliste mit Haken in der Zeile; Zähler als drei Kästchen. Davor **2.28.29** (#108): Abschnitte auf „Fristen und Aufgaben“ einklappbar (`app/klapp.tsx`), Mülleimer an Erinnerungen und Notizen (`app/loesch-knopf.tsx`; Löschen = archiviert, Kalender-Abgleich entfernt den Eintrag), Mikrofon bei „Woran erinnern“, Glocke mit Dauer und Android-Kanal-Einstellung. Davor **2.28.28** (#106): Kamera in der Notiz, App-Glocke nach dem Speichern von selbst an, Android-Benachrichtigung der Glocke auch bei geschlossener App (`FamilienakteGlockePlugin`, `GlockeEmpfaenger`). Davor **2.28.27** (#104): Kalender-Erinnerung (Google, Microsoft, Android-Gerätekalender, .ics),
  Knopf „Notiz“ mit erkannter Erinnerung, Memory bearbeiten, „Mein Kalender“ (Kalender-Knopf im Kopf), App-Glocke (ab Werk aus,
  läutet nur bei offener App), Termin an Ort und Stelle ändern. Nachweise `docs/VEROEFFENTLICHUNG-2.28.39.json`, `-2.28.38.json`, `-2.28.37.json`, `-2.28.36.json`, `-2.28.35.json`, `-2.28.34.json`, `-2.28.33.json`, `-2.28.32.json`, `-2.28.31.json`, `-2.28.30.json`, `-2.28.29.json`, `-2.28.28.json` und `-2.28.27.json`, darunter 2.28.26
  und 2.28.25 … 2.28.22. Keine davon erneut ausgeben; nächste freie Fassung 2.28.40. Klaus 2026-11-06: neue Funktionen immer gleich als APK, PWA und Windows ausgeben. Die Versionszeile zeigt die technische
  Fassung aus `package.json`; `APP_VERSION` 2.28.1 in `app/health-portal.tsx` bleibt interner Prüf-, Hilfe- und Changelog-Stand.
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
  Tresor-Leser (HTML auf der Karte, ohne Installation, nur lesend) Workflow-PDF-Pro #68 auf main, in keiner App verdrahtet.
  Geschenkbox mit den veröffentlichten Downloads: `docs/geschenk/geschenkbox-pro.html` (https://claude.ai/artifact/XeUMGuSZ49FzsJYjwQznM7). Klaus will danach alle Pro-Apps neu installieren
  und frische Tresorräume anlegen.
- **Aktensicherung (Klaus 2026-11-05):** Hilfe → „Akten sichern – Plan zum Abhaken“, Orte als Baum, rot/grün/grau je Gerät gemerkt,
  Kästen mit › springen zur Akte bzw. Sicherheitscenter (`app/aktensicherung-hilfe.tsx`). Ordner im Dateimanager öffnen kann die App nicht.
- Aktuelle Briefe im Hauptordner (ältere unter `docs/briefe-archiv/`):
  - `BRIEF_ABSCHLUSS_2026-11-08_ABGLEICH-A.md` (jüngster Abschluss: Prüfbericht, Plan Abgleich, Stufe A, PWA 2.28.40; Startauftrag Stufe B)
  - Vorheriger: `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-08_ABLAUF-2.28.39.md` (Startauftrag Sitzung 7: Gerätetest 2.28.39, f1, E-Mail, soll())
  - `BRIEF_CODEX_2026-11-04_NACH-2.28.24.md` (Abstimmung mit Codex: welche Dateien Claude gehören)
  - `BRIEF_ABSCHLUSS_2026-11-04_PDF-ARBEITSRAUM.md`, `BRIEF_ABSCHLUSS_2026-11-04_PDF-FUNKTIONSABGLEICH.md` (Codex)

## Offen

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
- PWA-Updates nach Codex #89, Ein-Schritt-Tresor in Private Brain Pro, Tresor-Leser.

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
