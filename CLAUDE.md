# CLAUDE.md — Meine Familienakte

Diese Datei liest jede Sitzung zuerst. Was hier steht, gilt für jede Arbeit in diesem Repo.
Sie enthält nur den aktuellen Stand und die festen Regeln. Ältere Briefe und Zwischenstände liegen in
`docs/briefe-archiv/` (Klaus 2026-11-04: archivieren statt löschen); die Veröffentlichungsnachweise in
`docs/VEROEFFENTLICHUNG-<fassung>.json`.

## Laufender Bau: Demo-Kennzeichnung und Tresorstatus 2.28.22

Klaus beauftragt die direkte Umsetzung in dieser Sitzung: `BRIEF_SITZUNG_2026-11-04_DEMO-RAHMEN-UND-TRESORSTATUS.md`.
Automatischen Browserspeicher nicht als gewählten eigenen Tresor grün anzeigen. Demo-Ablage und eigene Auswahl trennen;
oben roter Rahmen und DEMO-Wort, auch mobil. Dateien, bestehende eigene Auswahl und Berichte erhalten.
Die parallelen #79/#80 bleiben enthalten: sichtbare technische Versionszeile und archivierte ältere Briefe.
Deshalb neue Zielfassung 2.28.22; erst nach vollständigen Prüfketten veröffentlichen.
Klaus bestätigt erste fünf Praxispunkte, zehn weitere bleiben ungeprüft. Forschungs-/Zeitblock nur in Kimhub.

## Aktueller Stand (04.11.2026)

- **Fassung 2.28.21** (Android, Windows, PWA). Die Versionszeile oben/unten zeigt die technische Fassung aus
  `package.json`; `APP_VERSION` 2.28.1 in `app/health-portal.tsx` bleibt interner Prüf-, Hilfe- und Changelog-Stand.
- **Namen:** Web-App (PWA, Browser) = „Familienakte Basic“ (`public/manifest.webmanifest`), native Apps
  (Android `strings.xml`, Windows `tauri.conf.json`) = „Familienakte Pro“. Nicht wieder angleichen – Klaus muss
  beide auf dem Startbildschirm unterscheiden können. Die Anzeige Basic/Pro im Kopf folgt `APP_VARIANTE`.
- **Updates:** Tipp auf die Versionszeile prüft in Android und Windows den Update-Server family-projekt.de
  (Ausgabe mit `server=ja`); die PWA aktualisiert sich über Pages.
- Aktuelle Briefe im Hauptordner:
  - `BRIEF_ABSCHLUSS_2026-11-04_BASIC-NAME-UND-VERSIONSZEILE.md` (jüngster Abschluss, Stand der Ausgabe 2.28.21)
  - `BRIEF_ABSCHLUSS_2026-11-04_DEMO-UND-DATEIERHALT.md` mit `docs/DEMO-ARBEITSBEREICH.md` (getrennte Demo, Dateierhalt)
  - `BRIEF_SITZUNG_2026-11-04_DEMO-UND-SYSTEMMELDUNGEN.md`
  - `BRIEF_ABSCHLUSS_2026-11-04_TRESOR-PLAN.md`, `BRIEF_ABSCHLUSS_2026-11-03_TRESOR-UEBERGABE-AN-CLAUDE.md`,
    `BRIEF_SITZUNG_2026-11-03_TRESOR-PFAD-UND-ABGLEICH.md` (Tresor-Pfad, Abgleich)
  - `BRIEF_SITZUNG_2026-11-01_PRO-VERBUND.md`, `BRIEF_ABSCHLUSS_2026-11-02_PRO-VERBUND.md` (Grundlage Pro-Verbund)

## Offen

- Gerätefälle am Tablet: die sechs Fälle aus #70/#75 (Tresor-Plan), SD-Verweis/Freigabe und Neustart, fehlende
  Speicherbestätigung. Keine SD-Pfad-Reparatur oder Geräteprüfung behaupten, die nicht stattgefunden hat.
- Ältere zusätzliche Android-Tresor-Paar-Abnahme (Workflow PDF Pro, BookLedgerPro) nicht vollständig geprüft;
  Maßstab `docs/PRO-VERBUND-PRUEFSTAND.md`, Berichte `docs/pro-verbund-nachweise.json`. Keine vollständige
  Gesamtabnahme behaupten, keine fehlgeschlagenen Prüfungen abschalten. Workflow-PDF-Pro PR #59 bleibt Entwurf.
- Eigene Berichte und ungeprüfte Nutzergeräte; Rückmeldung zum Basic-Namen und zur Versionszeile am Tablet.

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

- **Workflow PDF (Klon):** `public/apps/workflow-pdf/` byte-1:1; Brücke `public/apps/fa-wfpdf-bruecke.js` **nie umgehen**
  (eigene DB `FamilienakteWFPDF1`, kein Worker, ⟳ ohne fremde Vorräte); Seite `app/workflow-pdf-seite.tsx`.
  Tesseract/Scanic liegen nur im Klon (`vendorBasis()`).
- **Stapel:** `app/stapel*.ts(x)`, `docs/STAPEL.md` (Zusammenfügen `pdfsZusammenfuegen`, Filter/Schärfe `StapelEinst`).
- **Briefkopf im Eingang:** Rechnung in `lib/briefkopf-titel.ts`, `briefkopf.js` byte-1:1 im Klon (`public/apps/workflow-pdf/assets/`),
  Titel in `lib/central-intake.ts`. Prüfbericht nur auf manuelle Wahl.
- **Paket für den Freund:** `tools/paket/bilder-aufnehmen.mjs` und `tools/paket/paketseite.py`
  (Aufruf siehe `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-01_BRIEFKOPF-UND-PAKET.md`); die Datei liegt nicht im Repo.
- **Proben:** `npm run build` (inkl. Fachprüfungen), `npm run check`, `node tests/run-ui.mjs [filter]`.
