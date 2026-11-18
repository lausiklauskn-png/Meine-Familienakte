# CLAUDE.md — Meine Familienakte

Diese Datei liest jede Sitzung zuerst. Was hier steht, gilt für jede Arbeit in diesem Repo.
Sie enthält nur den aktuellen Stand und die festen Regeln. Ältere Briefe und Zwischenstände liegen in
`docs/briefe-archiv/` (Klaus 2026-11-04: archivieren statt löschen); die Veröffentlichungsnachweise in
`docs/VEROEFFENTLICHUNG-<fassung>.json`.

## Aktueller Stand (16.11.2026, nach 2.28.71)

- **Android-Update auf älteren Handys (Klaus 16.11.; PR #212 Entwurf, Fassung 2.28.73 vorbereitet, nicht übernommen, nicht ausgegeben;
  Brief `BRIEF_ABSCHLUSS_2026-11-16_ANDROID-UPDATE-2.28.73.md`):** Update über die Versionszeile endete auf Android 9/10 vermutlich immer
  mit `UPDATE_ZERTIFIKAT`, weil `getPackageArchiveInfo` dort für eine APK-Datei kein `signingInfo` liefert. `FamilienakteUpdatesPlugin.archiv()`
  holt das Zertifikat dann über `GET_SIGNATURES`. Klaus' Wort: in die nächste Fassung und ausgeben. Nicht am Gerät; ältere Installationen
  einmal von Hand über die App installieren; in den anderen Pro-Apps (Vorlage BookLedgerPro) nicht nachgezogen.

- **Fassung 2.28.71 ausgegeben (16.11.; #199, #200, #203; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.71.json`), nicht erneut
  ausgeben.** Enthält die drei folgenden Punkte (Übernahme aus dem Datei-Organizer, Vorsortierung aus Private Brain Pro mit Kern @ `e4205fa`,
  Discovery @ `b3517cc` mit Fernrohr im Kopf). **Erste Ausgabe mit Discovery im Paket: APK 20,4 → 82,0 MB, Windows 34,6 → 96,5 MB.**
  Abgestimmt mit der Sitzung Private Brain Pro über `BRIEF_ABGLEICH_2026-11-16_PRIVATE-BRAIN-PRO.md` (vor Übernahmen und Ausgaben dort lesen
  und eintragen). Geschenkbox Version 36 (Familienakte 2.28.71, Datei-Organizer 0.4.12, Organizer-Landkarte auf dem Stand).
  Offene Punkte der Übernahme (Unterordner, Frist als Vorgabe): Datei-Organizer `docs/BRIEF_SITZUNG_2026-11-16_OFFENE-PUNKTE-LANDKARTE.md`.

- **Übernahme aus dem Datei-Organizer (Klaus 16.11., Freibrief ohne Vorschau: „passt ins Design, keine Doppelung, an der passenden Stelle“;
  #203, in Fassung 2.28.71):** liegt im Eingangsordner die `organizer-index.json` des Datei-Organizers, reisen seine
  Angaben (Bereich, Art, Absender, Datum, Frist, Betrag, Archivnummer; „von dir bestätigt“/„noch unsicher“) als `UebergabeVorschlag` mit –
  dieselbe Karte „Vorschläge aus …“ im Prüf-Fenster wie bei anderen Apps, kein neuer Knopf. Der Index ist keine Unterlage (`scanDirectory`);
  was der Organizer als doppelt markiert hat, bleibt im Ordner, wenn das Gegenstück dort liegt; Gesperrtes kommt mit Warnung. Nur Dateien
  direkt im Ordner (Name + Größe), nichts wird ohne Tipp übernommen. Kern `lib/organizer-uebernahme.ts`, Anschluss `scanSelectedInbox` in
  `app/health-portal.tsx`. Proben `scripts/run-organizer-uebernahme-tests.mjs` (6), UI `organizer-uebernahme` (4). Landkarte: Kasten
  „Aus dem Datei-Organizer“. Nicht am Gerät; die Frist des Organizers steht nur im Hinweis, sie wird nicht als Frist angelegt.

- **Neue Kategorie aus dem Datei-Organizer (Klaus 16.11.; nicht ausgegeben, geht in 2.28.72):** eine im Organizer von Hand angelegte Kategorie
  (dort „+ Neue Kategorie erstellen …“, im Index „von dir“ oder „gelernt“) reist als Lebensbereich im Vorschlag mit, auch wenn die Akte sie
  nicht kennt; der Hinweis nennt „Neuer Bereich aus dem Organizer“. Sie entsteht erst mit „Vorschläge in das Formular übernehmen“ und dem
  Ablegen (eigener Lebensbereich wie von Hand eingetragen). Gleicher Name in anderer Schreibweise = vorhandener Bereich, kein zweiter.
  Vom Kern geratene unbekannte Bereiche bleiben draußen. Probe `run-organizer-uebernahme-tests` (7).

- **Vorsortierung aus Private Brain Pro (Klaus 16.11.; #199 aus der Sitzung Private Brain Pro, in Fassung 2.28.71; Gegenstück Private Brain Pro ab 1.0.53):**
  Private Brain Pro legt nach der Mail eine zweite Übergabe `familienakte-uebergabe.json` ins Fach `eingang-familienakte` (Einordnung aus
  dem Sortier-Kern). Sie wird **nie ein Dokument oder Eingang**: merken, quittieren, über Name + SHA-256 der Mail als Vorschlag zuordnen
  (`lib/pro-begleitdatei.ts`, `app/pro-begleit.ts`; Abzweig in `proEingangAufnehmen`; Prüfung nur `begleitdateiLesen`/`uebergabeVorschlaege`).
  Reihenfolge egal; geprüfte oder abgelegte Mails bleiben unverändert; ohne passende Mail entfällt sie nach 30 Tagen; unlesbare werden
  quittiert und nicht verwendet. Anzeige wie „Vorschläge der anderen App“, Quelle fest „Private Brain Pro“. Dieselbe Datei aus einer
  anderen App läuft wie bisher. Proben `run-uebergabe-vorschlaege-tests` (20), UI `pro-uebergabe`, `pro-verbund`. Nativ unverändert. Nicht am Gerät.

- **Discovery in der Hilfe (Klaus 15.11.: „Da wo der Sortierkern drin ist, Discovery nachziehen“; Zweig `claude/discovery-hilfe`, nicht ausgegeben,
  Fassung nicht erhöht):** Hilfe-Thema „Discovery“ direkt hinter „Pro-App-Verbund (Vorschau)“ (`app/discovery-hilfe.tsx`, Ordnung in
  `lib/hilfe-ordnung.ts`); „Discovery öffnen“ zeigt die Seite des Datei-Organizers („so lernte der Sortier-Kern“) im selben Vollbild-Rahmen
  wie die Verbund-Karte (Schließen, Esc, Android-Zurück; kein neues Fenster). Die Seite liegt byte-gleich unter `public/discovery/`
  (seit 16.11. 43 Dateien, rund 60 MB: Seite, three.js r128, Filme, Standbilder, 15 Tonspuren; Datei-Organizer @ `b3517cc` = Stand 0.4.12 (16.11.: Leiste des Intro-Videos antippbar, Übersicht behält das Baum-Bild, Knopf „Intro“, Start immer mit der Übersicht), mit neuer Kiosk-Szene, Film bei „Führung starten“, Untertiteln, Zugabe-Murmel; Pin `HERKUNFT.json`; **macht APK und Windows-Paket um rund 55 MB größer**; dazu das Fernrohr in der Kopfleiste, `DiscoveryKnopf`, bis 900 px hinter „‹“) – **nie von Hand
  ändern, nur `node tools/discovery-nachziehen.mjs [--quelle ../Datei-Organizer]`** (`--pruefen` vergleicht; auch in `check:herkunft`).
  Worker (`scripts/build-pwa.mjs`): Film und Tonspuren nicht im Installations-Vorrat, sie kommen beim Gebrauch hinein; Ausschnitte
  (Range) bedient der Worker aus dem Vorrat als 206. APK und Windows tragen alles im Paket. Probe UI `discovery`. Nicht am Gerät.

- **Fassung 2.28.70 ausgegeben (15.11.; #191/#192; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.70.json`), nicht erneut ausgeben. Sortier-Kern nachgezogen (Klaus' Ja):** Datei-Organizer @ `4ce27d2` (rekursive Verbesserung: gelernte Art,
  Absender- und Frist-Wahl; dort an zwei unabhängigen Welten gesichert besser als 0.4.4). `tools/sortierkern-nachziehen.mjs` kennt die neuen
  Dateien (`artmodell*.ts`, `absenderwahl*.ts`, `fristwahl*.ts`). Hier gemessen an Welt 4 (Datei-Organizer `pruefstapel-stadt-4`):
  Bereich 79,0 → 82,5 %, Absender 63,5 → 65,0 %. Paket +≈0,6 MB (Art-Modell als Daten).

- **Fassung 2.28.69 ausgegeben (14.11. abends; #186; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.69.json`;
  Brief `BRIEF_ABSCHLUSS_2026-11-14_PSEUDO-RESTARBEITEN.md`), nicht erneut ausgeben. Enthält Stufe C, das Pseudo-Fenster nach PseudoDoc und:** Zuordnung je Auftrag verschlüsselt (`lib/pseudo-auftraege.ts`, `app/pseudo-auftrag-speicher.ts`;
  Schlüssel aus dem Profil, 90 Tage, „✓ erledigt“), „An KI“ (`anKi()`) an Bibliothekszeile, Auswahl-Leisten und Eingang, Briefweg der
  Assistenz nur noch Einstieg ins Fenster (Mistral mit eigenem Schlüssel jetzt im Fenster, einziger Netzweg `app/mistral-senden.ts`;
  Beträge/Daten bleiben jetzt lesbar), PDF-Seitenbild mit Kästen (`app/pseudo-pdf-seite.tsx`, `lib/pdf-kaesten.ts`), ZIP
  (`lib/zip-schreiben.ts`) und Austauschordner, Kontraste der KI-Knöpfe kräftiger (Klaus 14.11.). Vorschau
  `docs/vorschau/pseudo-auftraege-2.28.69.html`. Proben `run-pseudo-auftraege-tests`, UI `pseudo-auftraege`, `rueckmeldung-d` umgestellt.

- **Stufe C (14.11., ausgegeben mit 2.28.69, Brief `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-14_MASKE-PROFILE-STUFE-C.md`): Profile für die Maske.**
  Fach `profile` im Tresor-Paket (Quelle Workflow PDF Pro #77, `Profile.java`, Ordner „Maske-Profile“, gemeinsam: je App eine Datei, alle
  lesen, nichts gelöscht), nativ `profilLesen`/`profilSchreiben`. Kern `lib/maske-profil.ts` (verknüpft mit der Akte, Schreibweisen,
  Nummern nur HMAC, feste Platzhalter ⟦ICH-1⟧/⟦FAMILIE-n⟧/⟦KONTAKT-n⟧/⟦STELLE-n⟧, Übernehmen, Korrigieren), Speicher
  `app/maske-profil-speicher.ts` (Tresor offen → Fach; gesperrt → nichts; Pro ohne Tresor → App-Speicher; Basic → nichts), Profilseite
  `app/maske-profile.tsx` im Sicherheitscenter, Pseudo-Fenster merkt Korrekturen ins Profil. Vorschau `docs/vorschau/maske-profile-stufe-c.html`.
  Proben `run-maske-profil-tests`, UI `maske-profile`. Nicht am Gerät.
- **Pseudo-Fenster nach dem Muster PseudoDoc (14.11., #184, ausgegeben mit 2.28.69; Vorschau `docs/vorschau/pseudo-ansicht-kompakt.html`):**
  Klaus: einfach, Handy zuerst, kleine Knöpfe, eine Zeile je Datei, Ansicht im Dokument, **ein** KI-Knopf mit Wahl (blass mit Verlauf, gute
  Kontraste), alle Erklärungen hinter „?“. `app/pseudo-knopf.tsx`: Kopf mit dem PseudoDoc-Zeichen (`public/pseudo/pseudodoc.svg`, byte-gleich,
  Pin `native/HERKUNFT.json`), „1 Zur KI · 2 Zurück“, Zeile D01 … mit ⚑/👁/✎/mit/🗑, Ansicht (KI sieht/Original, markieren = verdecken,
  antippen = darf bleiben, ⚑ springt), Bild abdecken (schwarz, ohne Metadaten), „Alle zu einer Datei“, Dateinamen nur D01 ….
  **Briefumschlag** im Kopf (`BriefKnopf`): „Brief mit KI schreiben“ öffnet das Fenster mit Antwortbrief und Textfeld. PseudoDoc
  (Repo `PseudoDoc`, https://lausiklauskn-png.github.io/PseudoDoc/) ist das Muster; Bedienung dort und hier gleich halten.

- **Fassung 2.28.68 ausgegeben (14.11.; #181; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.68.json`), nicht erneut ausgeben.
  Knopf „Pseudo“ im Kopf (Klaus 14.11.: grün „an“, rot „aus“; am Handy liegt „Neu“ dafür hinter „‹“):** an = Fenster
  „Pseudonymisieren“ (`app/pseudo-knopf.tsx`): Dateien (Text, PDF, Foto/Scan mit OCR, `.eml` mit Anhängen) oder Text → Fassung mit Marke
  `⟦PSEUDONYMISIERT v1⟧`, Kopieren, Textdatei, Zurückführen. Maske `lib/maske.ts` = Schicht über Modul 25 (das byte-gleich bleibt):
  Steuer-ID, KVNR, RV-Nr., Ausweis mit Prüfziffer, USt-IdNr., Geburtsdatum, ICD mit Gruppe; Daten, Beträge, Firmen, Organisationen der
  Akte bleiben; kein Netzweg (Probe `run-maske-tests`). Basic speichert keine Profile. **Plan** `docs/PLAN_PSEUDONYMISIEREN.md` (Marktanalyse,
  Stufen B–H, Entscheidungen P1–P15 mit Klaus' Freibrief 14.11.), Vorschau `docs/vorschau/pseudonymisieren-plan.html`. **Bauplan Modul 25
  Gen. 3** liegt in Sage (`docs/components/25_pseudonym-gen3-bauplan.md`, Sage #1165) – Ausgangslage für alle weiteren Verbesserungen;
  `lib/maske.ts` wird durch Gen. 3 mit Pin ersetzt, sobald Sage sie gebaut hat. Brief `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-14_PSEUDO-2.28.68.md`.
  Offen: Austauschordner, Bezugsdokumente, „Alles pseudonymisieren“, Bilder schwärzen, danach Pro-Apps.

- **Fassung 2.28.67 ausgegeben (13.11.; #176; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.67.json`), nicht erneut ausgeben.**
  Absender kommt im Eingang aus dem Sortier-Kern (`mitKernAbsender`, nur bei gelesenem Text), Titel weiter nur aus dem Briefkopf-Baustein
  (`briefTitel(kopfRoh)`; der erste Versuch „Brief von …“ aus dem Kern-Absender ersetzte bei Nicht-Briefen den Dateinamen, CI rot, behoben).
  Nachweis mit drei Einordnern (Datei-Organizer `docs/PRUEFSTAPEL-FAMILIE-K3-REGELN.md`): Absender 45 → 97 % (gesichert), Bereich 77 → 83 %
  (p = 0,06, nur Richtung). Brief `BRIEF_ABSCHLUSS_2026-11-13_AUSGABE-2.28.67.md`. Offen: Übernahme aus dem Datei-Organizer (Blöcke kommen
  dazu, nichts überschreiben; Doppelte anzeigen, bei gleichem Fingerabdruck zusammenführen; erst Vorschau).

- **Fassung 2.28.66 ausgegeben (13.11.; #174; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.66.json`), nicht erneut ausgeben.
  Sortier-Kern eingebaut (Klaus 13.11.):** Der Kern des Datei-Organizers liegt
  byte-gleich unter `lib/sortierkern/` (Pin `HERKUNFT.json`, nur über `node tools/sortierkern-nachziehen.mjs`, geprüft von
  `check:herkunft`; **nie von Hand ändern**). Anschluss `lib/sortier-vorschlag.ts`: ab 200 Zeichen gelesenem Text entscheidet der Kern
  den Bereich (`buildDocumentIntakePlan`) und liest die Frist (`erkenneFristen`); ohne Text alles wie bisher. **Ersetzt „Dateiname
  zuerst“ (31.10./01.11.) für Stücke mit Text.** Nachweis an sechs fremden Stapeln (Datei-Organizer
  `docs/PRUEFSTAPEL-VERMIETERIN-REGELN.md`, „Einbau in die Familienakte“): Bereich 38–57 % → 77–87 %, Frist 51 % → 86 %.
  Offen: Absender/Titel aus dem Kern, Zweitfach, eigene Muster des Nutzers (erst Vorschau), Gerätetest.

- **Plan Bilder** `docs/PLAN_2026-11-12_BILDER.md` (Klaus 12.11.; Brief `BRIEF_ABSCHLUSS_2026-11-12_PLAN-BILDER.md`): Fotos als eigene Art mit
  Metadaten (Aufnahme, Gerät, Einstellungen, Ort), Nacharbeit im Hintergrund (erst ablegen, dann OCR/Prüfung), Kennzeichen →
  Fahrzeug, Barcodes mit Prüfung nur bei Code-Fund, Teilen ohne Ort. Nichts gebaut; Fragen F1–F8 an Klaus offen, dann Vorschau.
- **Plan Datei-Organizer** (Arbeitsname war Sortiersieb) `docs/PLAN_2026-11-12_DATEI-ORGANIZER.md` (Verweis; Plan im Repo Datei-Organizer, `docs/PLAN.md`) (Klaus 12.11.): Prüf- und Sortierwerkzeug neben Auslieferungs- und Sende-Prüfer;
  Eingangsordner, dann Klick für Klick feiner (Art → Kopf → Kategorie/Nummern → Absender → Inhalt), nur Teile lesen, schnelle
  Modelle statt Sprachmodell, lernt aus Korrekturen, Verlauf mit Rückgängig. Klaus 12.11.: eigene App, alles in einem Ordner mit selbstsortierendem Baum (Sichten), Ordner wird in die Familienakte nur übernommen und dort automatisch zugeordnet. Lehrer = Claude Haiku 5.5 über Server oder freigegebenen Ordner, nie über das Repo. **Fassung 0.1.0 dort gebaut** (12.11., PR #1 Entwurf: Kern, Oberfläche im Familienakte-Design, 101 erfundene Testdateien, Archivnummern erst wenn nichts mehr zu prüfen ist); Index-Übernahme hier noch nicht gebaut. S11 entschieden: Weg A über den Hetzner-Server (KimHub `schicht/api.mjs`) mit Schlüssel und Pseudonymisierung; S3–S6 entschieden wie vorgeschlagen; S8 offen, Repo `Datei-Organizer` angelegt, Plan, Regeln und Vorschau (Stufe A) dort auf Zweig claude/familienakte-bildintegration-il59yw; Zweck: Vorarbeit für andere Programme und KI (Steckbrief, Text, Abschnitte für Vektoren).
- **Fassung 2.28.65** (#171 mit #170; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.65.json`; Brief
  `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-12_CLOUD-ORDNER-2.28.65.md`): **Sicherung an einem zweiten Ort** (`app/zweiter-ort*.ts(x)`, `lib/zweiter-ort.ts`;
  selbsttätig bei Änderung höchstens einmal am Tag, verschlüsselt/lesbar, dort 1, auf dem Gerät 2 im App-Ordner `sicherungen`; erst
  schreiben und `sicherungNachpruefen`, dann alte eigene entfernen – nur mit Kennungsdatei `Zweiter_Ort.json`; nativ nur über
  `sicherungEntfernen`, Android/Windows/Rust, JUnit `SicherungEntfernenTest`), **„Synchron halten“** (Festplatte im selben Ordner mit
  demselben Kopf, `laufwerkVorbereiten(…, kopfVorhanden)`), **Cloud-Ordner hereinholen** (`app/cloud-ordner*.ts(x)`, `lib/cloud-ordner.ts`;
  Kopie statt Verweis, Herkunft, neue Fassung, Trennen, Pakete vom Handy → `familienakte:paket-datei`), **E-Mail-Wege** (Kasten in der
  Eingangszentrale `app/email-wege-karte.tsx`; Private Brain Pro holt die Familienakte von selbst aus `eingang-familienakte`; Mail-App
  mit Anlagen `FamilienakteShare.mailOeffnen`; Microsoft-Postfach mit derselben Anmeldung wie der Kalender plus `Mail.Read`/`Mail.Send`;
  Versand in der Korrespondenz `app/mail-versand.tsx`; eigenes Mail-Programm nur vorbereitet). Altes „OneDrive verbinden“ unverändert.
  **Proben-Hinweis:** Test-Chromium stürzt bei `queryPermission` an einem aus IndexedDB geholten OPFS-Ordner ab – die App hält den
  gewählten Ordner darum zusätzlich für die Sitzung.
- **Fassung 2.28.61** (#164; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.61.json`): **Meine Geräte**
  (`app/meine-geraete.tsx`: dieses Gerät per Knopf Handy/Tablet/PC/Laptop benennen, andere erscheinen von selbst), Paket an ein neues
  Gerät ohne Namensfeld, alte Einzelübergabe nur bei gespeicherten Übergaben (Proben-Schalter `familienakte-alte-einzeluebergabe`),
  **Dateiort** an jeder Unterlage (`app/datei-ort.tsx`, `lib/datei-ort.ts`, Windows `fa_ordner_zeigen`), Erklärungen hinter dem „?“.
- **Fassung 2.28.60** (#161; Nachweis `docs/VEROEFFENTLICHUNG-2.28.60.json`): **Bsp.-Akten** in der Hilfe unter „Demo“ (rotes Dreieck
  `app/bsp-ecke.tsx`, nie in den Pro-Tresor, Vollsicherung ohne sie, sobald eigene Einträge da sind). Hinweisblase schließt beim Sprung.
- **Fassung 2.28.64** (#165; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.64.json`; 2.28.62 und 2.28.63 nie ausgegeben und darin aufgegangen): Schriftgröße „A··A“ im Kopf (`app/schrift-knopf.tsx` auf `public/native/pro-bedienung.js`, byte-gleich aus Private Brain Pro), Textdurchsicht A–E, Rechtstexte (`public/datenschutz.html`), Systemprüfung (Stand der Fassung), Sicherheitsseite kürzer, Startfläche ohne Logo, rote Kästen der Landkarte (Klaus Ja 1–3: gesperrter
  Pro-Tresor gelb „Entsperren“, Akte nur im App-Speicher gelb „Tresor einrichten“/„Ordner wählen“, „Demo verlassen“ am Demo-Kasten),
  Knopf wieder „+ Bsp.-Akten“/„− Bsp.-Akten“ (Klaus: „Bsp.“ allein ist nicht zu erraten). Ausgegeben 11.11.; Geschenkbox Version 20. Nächster Bau: 2.28.65 nach dem Startbrief Cloud-Ordner.

- **Fassung 2.28.59** (#163; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.59.json`): **Android-Ordner** – Capacitors
  `PluginCall.getLong` nimmt nur `Long`, kleine Zahlen kommen als `Integer` → Ersatzwert. `FamilienakteOrdnerPlugin` las so
  offset/laenge/size; jedes Schreiben/Lesen über die Ordnerwahl (Vollsicherung, gemeinsame Festplatte, Eingangsordner) scheiterte
  am Gerät („Größe -1 statt 0“). Jetzt `zahl()`; JUnit `OrdnerZahlTest`. Die UI-Proben stellen die Hülle in JS nach und sahen das nie.
  **Neue Java-Plugins: nie `call.getLong` für kleine Zahlen.** Am Tablet bestätigt (11.11.): Pro-Tresor auf SD-Karte eingerichtet
  (`SD/USB (3039-3234)/Family_Projekt_de`), neue Originale verschlüsselt im Tresor.
- **Fassung 2.28.58** (#160; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.58.json`), aus dem Gerätetest 11.11.:
  verschlüsselte Vollsicherung auf SD-Karte brach ab („kam beim Zurücklesen nicht unverändert an“, Ordner leer). `FamilienakteOrdnerPlugin`
  prüft jetzt Länge und SHA-256 selbst (`pruefenMitGeduld`, bis zu vier Versuche) statt `COLUMN_SIZE`; Fehler tragen einen Grund
  („Größe … statt …“), `app/nativer-ordner.ts` zeigt ihn. Probe `scripts/run-ordner-fehler-tests.mjs`. Am Tablet ungeprüft.
- **Cloud-Ordner:** entschieden (Klaus 11.11.), Bau in 2.28.65 nach `BRIEF_SITZUNG_2026-11-11_CLOUD-ORDNER-2.28.65.md`; Jens' Antwort nicht mehr nötig (alles als Wahl in der App).
- **Fassung 2.28.57** (#158; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.57.json`): **Tooltips** (Klaus 10.11.:
  „einfach nur Tooltips“): Maus/Stift über einem Knopf zeigt nach 0,5 s eine eigene Blase (`app/kurzhinweise.ts`), auch in der
  Android-WebView (zeigt `title` nie – Ursache des Befunds); kein langer Druck mehr, Finger-Tipp löst sofort aus; nur wo der Hinweis
  mehr sagt als die Beschriftung. Haken „Tooltips an Knöpfen anzeigen“ mit „?“ (ein-/ausschaltbar). **Landkarte**: Zahl in jedem
  Legenden-Kästchen, keine Trefferliste; eigene Datei `docs/landkarte/Familienakte-Landkarte.html` (`node tools/landkarte-datei.mjs`,
  Einstieg `app/landkarte-allein.tsx`), in der Geschenkbox als `familienakte-landkarte.html` neben `pro-verbund.html` (beim
  Neuveröffentlichen mitgeben; `tools/geschenkbox-datei.mjs` nimmt beide). „Nur Neues prüfen“ statt „Inkrementell“; „Neu“ › E-Mail
  öffnet die E-Mail-Karte (Probe `neu-knopf-ziele`). Vorschau `docs/vorschau/kurzhinweise-2.28.57.html`.
- **Cloud-Ordner:** gebaut in 2.28.65 (siehe oben). Offen bei Klaus: altes „OneDrive verbinden“ wegfallen lassen oder „Akte liegt in
  OneDrive (alt)“ nennen; Rechte `Mail.Read`/`Mail.Send` in Entra – Plan mit Anleitung `docs/PLAN_2026-11-12_MICROSOFT-MAIL-ENTRA.md` (Termin bei Jens).
- **Fassung 2.28.56** (#155; Android, Windows, PWA; Nachweis `docs/VEROEFFENTLICHUNG-2.28.56.json`; Brief
  `BRIEF_ABSCHLUSS_2026-11-10_NUR-LAUFWERK-2.28.56.md`): **Tresor einrichten – nur Laufwerk wählen** (Ordnerwahl öffnet am gemerkten Tresor
  oder oben auf dem Gerätespeicher, `EXTRA_INITIAL_URI`; kein Namensfenster, „Family-Projekt“, bei Belegung „Family-Projekt 2…9“; nur
  `FamilienakteTresorPlugin.java`). Alle Pro-Apps finden den Tresor am Inhalt (`tresorordner.json`), nicht am Namen. **Adresse
  `?ansicht=landkarte`** öffnet die Landkarte der App direkt (Merker in `sessionStorage` übersteht das Neuladen beim ersten Besuch); die
  Geschenkbox nutzt sie. Geschenkbox mit Knopf „Als eine Datei speichern“ (Download-Freigabe). Seit 14.11.: zusätzlich die HTML-Datei direkt im Chat (siehe feste Regeln).
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
- **Fassungen und Nachweise:** `docs/VEROEFFENTLICHUNG-<fassung>.json` für 2.28.74, 2.28.71, 2.28.70, 2.28.69, 2.28.68, 2.28.67, 2.28.66, 2.28.65, 2.28.64, 2.28.61, 2.28.60, 2.28.59, 2.28.58, 2.28.57, 2.28.56, 2.28.55, 2.28.54, 2.28.53, 2.28.52, 2.28.51, 2.28.49, 2.28.48, 2.28.39 … 2.28.22
  (2.28.50 ausgegeben, aber ohne eigenen Nachweis; 2.28.40–2.28.47 waren Zwischenstände). Keine davon erneut ausgeben;
  **nächste freie Fassung 2.28.75** (2.28.62 und 2.28.63 nie ausgegeben). **Klaus 11.11.: nicht nach jedem Umbau veröffentlichen** – Änderungen
  sammeln, Proben laufen lassen, gesammelt als eine Fassung ausgeben (ersetzt „jede neue Funktion gleich ausgeben“ vom 06.11.).
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
  Geschenkbox mit den veröffentlichten Downloads: `docs/geschenk/geschenkbox-pro.html` (https://claude.ai/artifact/XeUMGuSZ49FzsJYjwQznM7, Version 36 (16.11.) mit 2.28.71, Datei-Organizer 0.4.12, Discovery als Weg über den Fernrohr-Knopf mit Bild der Kopfleiste (Klaus 16.11.: keine Videos in die Box, nur der Verweis – so bekommt man immer die neueste Fassung) und Sage·Protokol; vor dem Neuveröffentlichen den Live-Stand lesen – andere Sitzungen ziehen dort ihre Apps nach). Klaus will danach alle Pro-Apps neu installieren
  und frische Tresorräume anlegen.
- **Aktensicherung (Klaus 2026-11-05):** Hilfe → „Akten sichern – Plan zum Abhaken“, Orte als Baum, rot/grün/grau je Gerät gemerkt,
  Kästen mit › springen zur Akte bzw. Sicherheitscenter (`app/aktensicherung-hilfe.tsx`). Ordner im Dateimanager öffnen kann die App nicht.
- Aktuelle Briefe im Hauptordner (ältere unter `docs/briefe-archiv/`):
  - `BRIEF_ABSCHLUSS_2026-11-16_ANDROID-UPDATE-2.28.73.md` (Android-Update unter Android 9/10, 2.28.73 vorbereitet, Startauftrag Ausgabe)
  - Nächste Sitzung (Repo Datei-Organizer): `docs/BRIEF_SITZUNG_2026-11-14_NEEDS-RUECKWAERTSTEST.md` (Rückwärtstest Workflow Needs, nichts ändern)
  - `BRIEF_ABSCHLUSS_2026-11-14_PSEUDO-RESTARBEITEN.md` (letzter Stand: Pseudo-Restarbeiten, Startauftrag Gerätetest/Stufe E-Rest)
  - Vorheriger: `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-14_MASKE-PROFILE-STUFE-C.md` (Stufe C)
  - Vorheriger: `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-14_PSEUDO-2.28.68.md` (2.28.68)
  - `BRIEF_SITZUNG_2026-11-11_CLOUD-ORDNER-2.28.65.md` (nächster Bau: Sicherung an einem zweiten Ort, Nur sichern/Synchron halten, Cloud-Ordner hereinholen; Klaus: keine Vorschau nötig)
  - `BRIEF_ABSCHLUSS_2026-11-12_PLAN-BILDER.md` (Plan Bilder, Fragen F1–F8)
  - Vorheriger: `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-11_GESAMMELT-2.28.64.md` (2.28.57 bis 2.28.64)
  - `BRIEF_CODEX_2026-11-04_NACH-2.28.24.md` (Abstimmung mit Codex: welche Dateien Claude gehören)
  - `BRIEF_ABSCHLUSS_2026-11-04_PDF-ARBEITSRAUM.md`, `BRIEF_ABSCHLUSS_2026-11-04_PDF-FUNKTIONSABGLEICH.md` (Codex)

## Offen

- **Erinnerung aus dem Text (Klaus 18.11., aus der Sitzung „Kalender und Notizen“ der Privaten Akte; nicht ausgegeben, Fassung nicht
  erhöht):** `erinnerungAusText` (`lib/family-memory.ts`) kennt jetzt „am nächsten Tag“, „am folgenden Tag“, „tags darauf“ (der Tag nach
  heute – stand vorher auf heute) und „um halb drei“ (14:30; eine Stunde vor 7 gilt als Nachmittag, „um halb 8“ = 07:30). Ein Satz nur
  mit Uhrzeit ohne „erinnere“ ergibt weiter keinen Vorschlag (so entschieden 05.11.). Probe `run-kalender-tests` (Kalender-Kern 22).
  Die Private Akte zieht ihren Klon danach nach. Am Gerät ungeprüft.
- **Löschen im Kalender meldete „Register wurde zwischenzeitlich geändert“ (Klaus 17.11., Tablet 2.28.73; #218, **Fassung 2.28.74 ausgegeben
  17.11. als Android, Windows und PWA, Nachweis `docs/VEROEFFENTLICHUNG-2.28.74.json`, nicht erneut ausgeben**; 2.28.72 und 2.28.73 sind ausgegeben (Tags vorhanden, Nachweise fehlen);
  dazu Papierkorb: beim Wiederherstellen ist nur die angetippte Zeile gesperrt, Klaus' Ja 17.11.):** Lesen–Ändern–Schreiben am Register ist
  nicht ein Schritt; schrieb der Kalender-Abgleich im Hintergrund zur selben Zeit wie Löschen/Abhaken/Ändern, wurde einer von beiden mit
  `REGISTER_CONFLICT` abgewiesen (Löschen dann ohne jede Meldung). Jetzt wiederholen `deleteLocalScheduleRecord`,
  `updateLocalScheduleStatus`, `updateLocalScheduleTermin`, `updateLocalScheduleKalender`, `deleteLocalMemoryRecord`,
  `papierkorbWiederherstellen`, `papierkorbEndgueltig` den Vorgang mit frischem Stand
  (`beiKonfliktErneut` in `app/local-vault.ts`, höchstens viermal). Probe `run-vault-safety-tests` (1 neu, Gegenprobe rot). Am Gerät
  ungeprüft; die übrigen Register-Vorgänge (rund 100 Stellen) haben denselben Aufbau und sind nicht umgestellt.
  **Eigentliche Ursache (Klaus' Bilder 17.11.: Stand 1439 → 2108 → 2447 in sechs Minuten):** ein aus dem Kalender geholter Termin, in der
  Akte geändert, wurde endlos hinausgeschrieben – `standLokal` der `kalenderQuelle` ändert sich erst beim Einlesen, der Plan blieb
  „aendern“, jeder Lauf schrieb Kalender, Register und Sicherung (rund drei Mal je Sekunde). Jetzt: `abgleichPlan` schreibt nur, wenn
  die Zuordnung nicht schon diesen Stand trägt (`lib/kalender.ts`); dazu eine Sicherung in `useKalenderAutoAbgleich`
  (`zuletztGelaufen`: derselbe Plan läuft nach fehlerfreiem Lauf nicht von selbst noch einmal). Probe `run-kalender-einlesen-tests`
  (1 neu, Gegenprobe rot). Am Gerät ungeprüft; ob bei Klaus genau dieser Termin die Schleife auslöste, ist aus den Bildern geschlossen.
- **Pseudo-Fenster, Kopieren (Klaus 16.11., nicht ausgegeben, Fassung nicht erhöht; Brief `BRIEF_ABSCHLUSS_2026-11-16_PSEUDO-KOPIEREN.md`):**
  Meldung unter den Knöpfen statt über der Liste, erst kopieren dann Auftrag sichern (Ersatzweg `textKopieren`), Austauschordner in
  Android/Windows über `nativenOrdnerWaehlen`. Am Gerät ungeprüft (43 PDFs: Grenze der Android-Zwischenablage rund 1 MB).
- **2.28.71 am Gerät ungeprüft:** Eingangsordner mit `organizer-index.json` (Vorschlag im Prüf-Fenster, Doppelte bleiben im Ordner), Vorsortierung
  aus Private Brain Pro mit echtem Tresor (auch: nimmt Windows eine Übergabe mit `application/json` an?), Update über die Versionszeile bei 82 MB.
  Neue Meldungen der Vorsortierung nur Deutsch, von Klaus noch nicht gesehen.
- **Discovery am Gerät ungeprüft:** Rahmen in APK und Windows (Ton, Film, 3D im Rahmen, Android-Zurück), PWA ohne Netz nach dem ersten Ansehen.
- **2.28.69 / Pseudo-Fenster am Gerät ungeprüft:** Ansicht mit langem PDF (Seitenbild), Markieren am Handy (Finger), Bild abdecken mit dem Finger,
  KI-Knopf mit Internet an, Zwischenablage Text+Bild am Handy, Aufträge nach Neustart mit echtem Tresor, Mistral mit echtem Schlüssel,
  Austauschordner unter Windows (Android-WebView kann keine Ordnerwahl → nur ZIP), „An KI“ an echten Unterlagen/Mails.
- **Stufe C am Gerät ungeprüft:** Profilseite mit echtem Tresor (Android/Windows), Korrigieren ins Profil, Übernehmen aus einer anderen Pro-App
  (dort gibt es noch keine Profile). Workflow PDF Pro #77 (Fach `profile`) danach auch in BookLedgerPro und Private Brain Pro nachziehen.
- **2.28.68 am Gerät ungeprüft:** Pseudo-Knopf an echten Unterlagen (OCR, Mail mit Anhängen), Kopf am Handy mit „Neu“ hinter „‹“.
- **2.28.67 am Gerät ungeprüft:** Absender und Titel an echten Unterlagen.
- **2.28.66 am Gerät ungeprüft:** Vorschlag für Bereich und Frist an echten Unterlagen; Geschenkbox und `lib/app-stand.ts` nicht nachgezogen.
- **2.28.65 am Gerät ungeprüft:** zweiter Ort auf OneDrive-Ordner/Stick/SD (Freigabe nach Neustart, Löschen alter Sicherungen auf SD),
  Cloud-Ordner unter Windows mit OneDrive-Platzhaltern, Paket vom Handy über die OneDrive-App bis zum PC, Mail-App mit Anlagen am Handy,
  Private Brain → Familienakte mit echtem Tresor, Microsoft-Mail (erst nach den Rechten in Entra).
- **2.28.59 am Gerät ungeprüft:** Vollsicherung auf SD-Karte/USB, Eingangsordner, gemeinsame Festplatte in der APK.
- **2.28.57 am Gerät ungeprüft:** Tooltips mit Maus am Tablet (DeX/Fenster) und unter Windows, Zahlen in der Legende.
- **2.28.56 am Gerät ungeprüft:** Ordnerwahl mit Startort, „Family-Projekt 2“, Pro-Apps im selben Tresor, Direktlink zur Landkarte.
- **2.28.55 am Gerät ungeprüft:** Meldungen oben (Hinweis, verschwindet), kurze Tresor-Karte, „Mehr“.
- **2.28.54 am Gerät ungeprüft:** Fäden der Landkarte am Tablet mit großer Schrift, Legenden-Knöpfe.
- **2.28.53 am Gerät ungeprüft:** Papierkorb (Löschen → Zurückholen → endgültig), Glocken-Probe mit gewähltem Ton, Haken
  „Zuordnung stimmt“ und Kartenfarbe nach eigener Wahl.
- **2.28.52 am Gerät ungeprüft:** Tresor-Leser mit echtem Tresor auf SD/USB (Ordnerwahl, Öffnen im Handy-Browser), Update-Fähnchen
  beim Zurückholen der App, Zusammenspiel der Pro-Apps im selben Tresor (alle gelben Wege der Karte). BookLedger Basic seit 11.11. mit der neuen Karte (#45).
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

- **Geschenkbox immer als eine HTML-Datei geben, nie als ZIP (Klaus 14.11.2026: „keine ZIP mehr, die HTML-Datei, 600 KB ist nicht so groß“).**
  Nach jeder Änderung `node tools/geschenkbox-datei.mjs` und `docs/geschenk/Geschenkbox-Pro-Apps.html` direkt im Chat als einzelne Datei
  mitgeben (nicht gebündelt mit anderen Dateien), dazu das Artefakt mit dem Knopf „Als eine Datei speichern“ neu veröffentlichen.
  Ersetzt den Satz „kein Chat-Anhang, der wird als ZIP verpackt“ (2.28.56).

- Oberfläche und Wortlaut des Freundes nur mit Klaus' Ja je sichtbarer Änderung. Beispieldaten erfunden.
- Keine Schlüssel, PINs, Passwörter oder Chefcodes in Dateien oder im Chat.
- **Codex-Prüfungen auslassen (Klaus 09.11.):** Codex ist nicht mehr aktiv, der Zugang ist gesperrt. Kein „@codex review“ anstoßen,
  Codex-Kommentare (auch „Failed“/„usage limits“) nicht abwarten und nicht als Befund behandeln.
- **Codex als unabhängiger Prüfer (Klaus 12.11.):** Codex ordnet Prüfstapel unabhängig ein und entwirft eigene Vorgehensweisen. Einzige
  Verbindung ist der Briefkasten `docs/fremdpruefung/` (`VERBINDUNG.md`, `STAND.md`); Klaus gibt das Zeichen. Dort nie Lösungen oder
  Messergebnisse ablegen. Das hebt den Punkt darüber nicht auf: kein „@codex review“ an Pull Requests.
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
