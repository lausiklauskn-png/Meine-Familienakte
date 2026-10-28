# Abgleich: Übergabepaket des Freundes ↔ Neuaufbau in diesem Repo (2026-10-28)

Klaus (2026-10-28): „Da stehen die Anleitungen drin und die MD-Dateien für den ursprünglichen Bau. Prüft das mal bitte
mit dem, was am Anfang gestartet wurde.“ Das Paket wurde gelesen, nicht ins Repo übernommen (es ist Material des
Freundes und nennt selbst, was nicht öffentlich werden soll).

## 1. Was das Paket ist

`FAMAKT_2.28.1_KLAUS_UEBERGABEPAKET_2026-10-28.zip`, 8 Dateien:

| Datei | Stand | Rang laut Paket |
| --- | --- | --- |
| `README_ZUERST_LESEN.txt` | 2026-10-28 | Lesereihenfolge, fünf Regeln |
| `FAMAKT_2.28.1_ARCHITEKTURANLEITUNG_FUER_KLAUS` | 2026-10-28 | verständliche Umsetzungshilfe, **keine** neue Masterakte |
| `FAMAKT_2.28.1_ENTWICKLUNGSMASTER_FUER_KLAUS` | 2026-10-28 | Anleitung + Masterakte M0.2 im Originalwortlaut |
| `FAMILIENAKTE_Projekt-Masterakte_M0.2` | 2026-10-20 | **höchste verbindliche Grundlage** |
| `FAMILIENAKTE_ZENTRALE_ARCHITEKTURREFERENZ_M0.2_REV1.1_M1-ABNAHME` | 2026-10-25 | ergänzende Referenz, belegter Stand M1 |
| `Eingefügtes Markdown(2).md` | ohne Datum | Gestaltungsbeschreibung „für deinen Freund“ |
| 2 Bildschirmfotos V40 | 2026-10-27/28 | Startseite und Menü „Gesundheit & Arbeit“ |

Begriffe: **V40** = private ChatGPT-Website-Version 40 der Familienakte 2.28.1 (Git `2d028df…`). **M0.2** = Masterakte
vom 2026-10-20 (eine Familienakte, eine Architektur, Phasen 0–7). **M1** = Dokumentenweg (Eingang → Inhalt →
bestätigte Zuordnung → Ablage → Wiederfinden), am 2026-10-25 **nur mit künstlichen Dateien technisch abgenommen**.
**M2** = begrenzter echter Windows-Fachbetrieb, offen. Der V40-Quellcode selbst liegt **nicht** im Paket
(README Punkt 3: „separat und nur privat aus ChatGPT-Bibliothek“).

## 2. Vorgabe des Freundes → Stand hier

| Vorgabe (Fundstelle) | Stand hier | Begründung |
| --- | --- | --- |
| Eine Familienakte, ein Fachkern, keine zweite Datenwelt (M0.2 §1, §13) | eingehalten | Ein Repo, ein Register; Browser, APK und Windows laden dieselben Dateien aus `dist/`. |
| V5-Register `Familienakte_Register.json` erhalten (M0.2 §4, §13) | eingehalten | `app/local-vault.ts` schreibt weiter `version: 5` in `00_Register/Familienakte_Register.json`; kein neues Datenmodell. |
| Oberfläche, Beschriftungen, Navigation 1:1 (Anleitung Leitsatz, §2–4) | **teils** | Aufbau, Farben, Menüreihenfolge, Startseite gleich. Abweichungen siehe Abschnitt 3 (Menüwörter, Kopfzeile, Breite). |
| Weiße Kopfzeile „rechts Drucken und Ausloggen“ (Anleitung §2.1) | abgewichen | Zusätzlich Internetschalter (Klaus' Auftrag) und in der PWA „Installieren“ (Klaus' Auftrag). |
| Inhalt „mittig mit seitlichen Abständen“ (Eingefügtes Markdown §2) | **abgewichen (PR #18)** | Klaus 2026-10-28: „nutzt nicht die volle Bildschirmbreite“. Jetzt 20 px Rand statt 1320-px-Spalte. |
| Mobile Navigation ab ≤ 900 px, einspaltig < 620 px (Anleitung §2, Markdown §8) | eingehalten | `app/globals.css` unverändert bei diesen Grenzen. |
| „Keine eigenmächtige PWA-/Datenmodell-Neuentwicklung“ (README 4) | **abgewichen, mit Klaus' Auftrag** | Technik darunter getauscht (Next.js/Cloudflare → Vite, PR #2), PWA/APK/Windows gebaut (PR #11, #14, #15). Datenmodell nicht neu. |
| „PWA nur als freigegebene Ergänzung, nicht Ersatz für M1/M2 oder den Datentresor“ (Anleitung §9.6) | teils | Der Tresor ist derselbe; die PWA ersetzt aber die private ChatGPT-Website als Laufumgebung. |
| „Windows offline zuerst; Android als dieselbe Anwendung“ (Anleitung §9.6, M0.2 §5) | teils | Windows (Tauri) und Android (Capacitor) gleichzeitig gebaut; beide laufen ohne Website. **Keine** reale Geräteprüfung → M2 bleibt offen. |
| Keine Personen-/Gesundheitsdaten, Schlüssel, ungeprüften Quellen auf öffentliche Pages (README 5, Anleitung §9.7) | eingehalten | Ausgeliefert werden nur Code und frei erfundene Beispieldaten; keine Schlüssel. „BARMER“ und „TUHH“ stehen weder im Bau noch im Code noch in der Git-Historie (geprüft 2026-10-28). Die Pages-Adresse selbst ist öffentlich lesbar. |
| Phase 1A zuerst: technischer Rückkehrpunkt (M0.2 §10) | teils | Jeder Stand ist ein Git-Commit, jeder Merge rücknehmbar. Ein Sicherungspaket im Ordner `Familienakte_Technische_Sicherungen` gibt es nicht. |
| Nur **ein** freigegebener Schritt je Auftrag (M0.2 §9.5, §17) | abgewichen | Klaus hat in dieser Sitzung mehrere Schritte zugleich freigegeben (Analyse, Schalter, PWA, APK, Windows, Datensicherheit). |
| Bestehende Systemprüfung und Fünferblöcke weiterverwenden, keine zweite Prüfverwaltung (M0.2 §15) | eingehalten | `app/practical-acceptance.tsx` unverändert (5 Tests, Ja/Nein/Nicht geprüft). Die neuen Playwright-Proben sind Entwicklerwerkzeug, keine Benutzerabnahme. |
| „Kein grüner Status ohne bestandenen Nachtest“ (Anleitung §8) | eingehalten | Nichts auf „bestanden“ gesetzt; Systemprüfung zeigt weiter gelb. Dabei gefunden: 11 eigene Proben waren im Fehlerfall grün (behoben in PR #18). |
| Gesperrte Funktionen nicht durch Entfernen der Schutzregeln „reparieren“ (Anleitung §7) | eingehalten | OneDrive, produktive Ordner und Assistenzfreigabe unverändert gesperrt; der Internetschalter sperrt zusätzlich. |
| P0-Befunde B1–B4, B8, B11, B12, B15 (M0.2 §6) | **unklar** | Siehe Abschnitt 3.1. |

## 3. Die wichtigsten Abweichungen

### 3.1 Quellstand: hier V40, beim Freund V40 + M1 (wichtigster Befund)

- **Freund:** Der neueste belegte Stand ist V40 **plus 48 Commits und ungecommittete Patches** mit den Korrekturen
  B1–B12, B15-A bis V, Restore/UI und M1 (Manifest 276 Dateien, 1.945 Node-Tests; Architekturreferenz §14.1).
- **Hier:** Der Neuaufbau (PR #2) beruht auf der V40-Oberfläche. Ob die M1-Korrekturen enthalten sind, lässt sich
  nicht belegen; ein Hinweis spricht dagegen: Die Lese-/Schreib-Sperre des Registers (entspricht B12) fehlte und wurde
  in PR #12 (A3) neu gebaut. Die Datei `M1_Gegen_Restore_UI_20261025.patch` liegt weder im Paket noch hier.
- **Folge:** Doppelarbeit möglich (A2–A6 hier, B1–B12 dort) und beim Zusammenführen Konflikte im Tresor-Code.
- **Vorschlag:** Klaus fragt den Freund nach dem M1-Quellstand (276er-Manifest, Patch, Prüfnachweis). Danach Abgleich
  Datei für Datei, bevor weiter an `app/local-vault.ts` gebaut wird.

### 3.2 Laufumgebung getauscht, öffentliche Auslieferung

- **Freund:** „Keine eigenmächtige PWA-/Datenmodell-Neuentwicklung“; „keine ungeprüften Original-Quellen in öffentlich
  erreichbare GitHub Pages“.
- **Hier:** Next.js/Cloudflare durch Vite ersetzt, Datenmodell gleich. PWA öffentlich unter Pages, APK und Windows als
  Release (privates Repo). Alles auf Klaus' ausdrückliches Wort.
- **Folge:** Nach M0.2 §13 gilt die jüngste ausdrückliche Benutzerentscheidung. Wessen Entscheidung hier gilt (Klaus
  oder der Freund), steht nicht im Paket.
- **Vorschlag:** Klaus fragen, ob das mit dem Freund abgestimmt ist; sonst Pages auf privat stellen oder abschalten.

### 3.3 Menüwörter verallgemeinert

- **Original (Bildschirmfoto, Anleitung §3):** „BARMER & Krankengeld“, „Arbeit & TUHH“, „Begutachtung & Anträge“,
  Suchbeispiel „Zeige mir meine BARMER-Schreiben“, Anfragen „BARMER-, DRV- und TUHH-Schriftverkehr“.
- **Hier:** „Krankenkasse & Leistungen“, „Arbeit & Arbeitgeber“, „Anträge & Bescheide“, „Krankenkasse-Schreiben“.
- **Folge:** Widerspricht „Namen und Navigation nicht ändern“; dient der Regel „Beispieldaten erfunden, nichts
  Persönliches öffentlich“ (Krankenkasse und Arbeitgeber des Freundes).
- **Vorschlag:** behalten und benennen, solange die App öffentlich ausgeliefert wird; für eine private Fassung Klaus fragen.

### 3.4 Kopfzeile und Breite

- **Original:** rechts nur Drucken und Ausloggen; Inhalt mittig.
- **Hier:** Internetschalter und „Installieren“ zusätzlich; volle Breite (PR #18).
- **Vorschlag:** behalten (Klaus' Aufträge), im Abschlussbrief als bewusste Abweichung führen.

### 3.5 Arbeitsweise

- **Freund:** ein freigegebener Schritt je Sitzung, Masterakte am Ende fortschreiben, Phase 1A vor allem anderen.
- **Hier:** viele PRs in einer Sitzung, eigene Briefe statt Masterakte.
- **Vorschlag:** Klaus fragen, ob künftig die Masterakte M0.2 fortgeschrieben werden soll (dann ein Nachtrag je Sitzung).

## 4. Was fehlt, was hier dazukam

**Im Paket beschrieben, hier nicht vorhanden oder nicht belegt:** M1-Dokumentenweg mit Inhaltsauswertung von TXT/EML/
digitalem PDF (hier liest die Eingangszentrale laut Analyse nur Dateinamen, `docs/analyse/DATEIEINGANG.md`); V1/V2-
Sicherung mit B15-Sperren (`DEPLOYMENT_PUBLICATION_UNPROVEN` u. a., hier nicht im Code gefunden); Sicherungspaket
Phase 1A; die 1.945 Tests des Freundes (hier 26 Prüfskripte + 14 Oberflächenproben).

**Hier zusätzlich gebaut (alles auf Klaus' Wort):** Internetschalter (Standard aus), Offline-PWA mit Service Worker,
Datensicherheit A2–A6 (Speicherwahl merken, Register-Konflikt, Stammordner, Rücknahme, gestreamte Prüfsumme),
Android-APK (Diktat, Teilen), Windows-Installer (SAPI-Diktat, „Öffnen mit“, Update-Knopf), Installieren-Knopf, CI.
Nichts davon ist auf echten Geräten geprüft; nach dem Paket ist das „technisch geprüft“, nicht „praktisch geprüft“.

## 5. Fragen an Klaus

1. Ist der Neuaufbau (andere Technik, PWA/APK/Windows, öffentliche Pages-Adresse) mit deinem Freund abgestimmt?
2. Kannst du vom Freund den M1-Stand bekommen (276er-Manifest, `M1_Gegen_Restore_UI_20261025.patch`, Prüfnachweis)?
3. Soll die öffentliche Pages-Adresse bleiben, oder soll die PWA nur privat erreichbar sein?
4. Sollen die echten Menüwörter (BARMER, TUHH, Begutachtung) zurück, wenn die App privat bleibt?
5. Soll künftig die Masterakte M0.2 mit einem Nachtrag je Sitzung fortgeschrieben werden?
6. Gilt die volle Bildschirmbreite auch gegen die Vorgabe „Inhalt mittig“ deines Freundes?
