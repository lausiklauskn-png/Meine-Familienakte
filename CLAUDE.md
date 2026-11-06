# CLAUDE.md — Meine Familienakte

Diese Datei liest jede Sitzung zuerst. Was hier steht, gilt für jede Arbeit in diesem Repo.
Sie enthält nur den aktuellen Stand und die festen Regeln. Ältere Briefe und Zwischenstände liegen in
`docs/briefe-archiv/` (Klaus 2026-11-04: archivieren statt löschen); die Veröffentlichungsnachweise in
`docs/VEROEFFENTLICHUNG-<fassung>.json`.

## Aktueller Stand (05.11.2026, nachts)

- **Fassung 2.28.29** (Android, Windows, PWA; #108): Abschnitte auf „Fristen und Aufgaben“ einklappbar (`app/klapp.tsx`), Mülleimer an Erinnerungen und Notizen (`app/loesch-knopf.tsx`; Löschen = archiviert, Kalender-Abgleich entfernt den Eintrag), Mikrofon bei „Woran erinnern“, Glocke mit Dauer und Android-Kanal-Einstellung. Davor **2.28.28** (#106): Kamera in der Notiz, App-Glocke nach dem Speichern von selbst an, Android-Benachrichtigung der Glocke auch bei geschlossener App (`FamilienakteGlockePlugin`, `GlockeEmpfaenger`). Davor **2.28.27** (#104): Kalender-Erinnerung (Google, Microsoft, Android-Gerätekalender, .ics),
  Knopf „Notiz“ mit erkannter Erinnerung, Memory bearbeiten, „Mein Kalender“ (Kalender-Knopf im Kopf), App-Glocke (ab Werk aus,
  läutet nur bei offener App), Termin an Ort und Stelle ändern. Nachweise `docs/VEROEFFENTLICHUNG-2.28.29.json`, `-2.28.28.json` und `-2.28.27.json`, darunter 2.28.26
  und 2.28.25 … 2.28.22. Keine davon erneut ausgeben; nächste freie Fassung 2.28.30. Klaus 2026-11-06: neue Funktionen immer gleich als APK, PWA und Windows ausgeben. Die Versionszeile zeigt die technische
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
- **Demo (Klaus 2026-11-04):** aus = oben nichts von „Demo“, Start hinten in der Hilfe; an = roter Knopf „DEMO ▾“ hinter
  dem Namen mit Menü (verlassen · zurücksetzen · löschen). Kein Demo-Kasten. Proben über `tests/ui/_demo.mjs`.
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
  - `BRIEF_ABSCHLUSS_2026-11-05_KALENDER.md` (jüngster Abschluss mit Startauftrag: Rückmeldung zu 2.28.27, Glocke bei geschlossener App)
  - `BRIEF_CODEX_2026-11-04_NACH-2.28.24.md` (Abstimmung mit Codex: welche Dateien Claude gehören)
  - `BRIEF_ABSCHLUSS_2026-11-04_PDF-ARBEITSRAUM.md`, `BRIEF_ABSCHLUSS_2026-11-04_PDF-FUNKTIONSABGLEICH.md` (Codex)

## Offen

- Gerätefälle am Tablet: die sechs Fälle aus #70/#75 (Tresor-Plan), SD-Verweis/Freigabe und Neustart, fehlende
  Speicherbestätigung. Keine SD-Pfad-Reparatur oder Geräteprüfung behaupten, die nicht stattgefunden hat.
- Ältere zusätzliche Android-Tresor-Paar-Abnahme (Workflow PDF Pro, BookLedgerPro) nicht vollständig geprüft;
  Maßstab `docs/PRO-VERBUND-PRUEFSTAND.md`, Berichte `docs/pro-verbund-nachweise.json`. Keine vollständige
  Gesamtabnahme behaupten, keine fehlgeschlagenen Prüfungen abschalten. Workflow-PDF-Pro PR #59 bleibt Entwurf.
- Eigene Berichte und ungeprüfte Nutzergeräte; Tablet-Rückmeldung zu 2.28.23/2.28.24 und zum Demo-Knopf. Drucken über den
  Android-Druckdienst ist am Gerät ungeprüft.
- Kalender am Gerät: Mein Kalender, App-Glocke, Kamera in der Notiz und die Android-Benachrichtigung (2.28.28) am Handy
  von Klaus bestätigt (06.11.); Einklappen, Löschen und Ton-Einstellung (2.28.29) ungeprüft (Android kann im Ruhemodus um Minuten verschieben; nach Neustart erst beim Öffnen neu geplant); Google-Prüfvideo und
  Microsoft-Herausgeberprüfung (MPN-ID) offen.
- Vollsicherung auf Android (Dateiausgabe nimmt nur 20 MB je Datei), PWA-Updates nach Codex #89, Ein-Schritt-Tresor in Private Brain Pro, Tresor-Leser.

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
