# Abschluss der Sitzung vom 28.10.2026: Analyse und erster Bau (PWA, APK, Windows)

## Auftrag (Klaus, `BRIEF_SITZUNG_ANALYSE-UND-ERSTBAU.md` plus Zusätze im Chat)

1. **Teil 1, Analyse** A–G der Familienakte, Ergebnisse unter `docs/analyse/`, die fünf wichtigsten Befunde im Chat.
2. **Teil 2, erster Bau**, je ein PR: Internetschalter wie Private Brain Pro · offline-fähige PWA · APK · Windows.
3. **Zusätze:** Veröffentlichen ist freigegeben („Hiermit hast du mein Wort … selbstständig PR und mergen“) ·
   Verbesserungsvorschläge aus PR #8 in Klaus' Reihenfolge · Update aus der Windows-App über die Versionszeile wie in
   Private Brain Pro · Verbinden beliebiger anderer Apps (auch von Codex gebaut) · Postfach und Werkzeug-Übergabe im
   Hintergrund vorbereiten.

## Ergebnis

| PR | Inhalt | Stand |
| --- | --- | --- |
| #13 | Analyse A–G: `docs/analyse/` (Bericht, Funktionsmatrix, Handprüfung, KI und Anonymisierung, Dateieingang, Geräte, Plattformen, technischer Baum, Beispiele/Tipps/Rückfragen), 12 Playwright-Proben, erfundene Testdateien | übernommen |
| #9 | Sofortfixe A1, A7, A8, A11, B3, D3 (+ Zierkreis fängt keine Klicks mehr) | übernommen |
| #10 | Internetschalter (byte-gleich `native-network.js` aus Private Brain Pro, Standard aus, Knopf in der Kopfleiste, überlebt Neustart) | übernommen |
| #11 | Offline-PWA: Service Worker, PNG-Symbole, Pages- und CI-Workflow, Code-Splitting (E1), Startbild (E2), Manifest (E6), Expertenmodus (B2), ESLint (D1) | übernommen (`59d4e35`) |
| #12 | Datensicherheit A2–A6 (Speicherwahl merken, Register-Konflikt, Stammordner merken, Rücknahme, gestreamte Prüfsumme) | übernommen (`0f5f4b0`) |
| #14 | Android-Hülle (Capacitor): natives Diktat, Internetschalter, „Teilen → Familienakte“, Prüf- und Release-Workflows | übernommen (`91556b1`) |
| #15 | Windows-Hülle (Tauri): NSIS, SAPI-Diktat, „Öffnen mit“, Update über die Versionszeile, Pages liefert `windows/latest.json` | übernommen (`7124c4b`) |

**Veröffentlicht (Klaus' Wort vom 28.10.2026):**

- PWA: https://lausiklauskn-png.github.io/Meine-Familienakte/ (Pages-Lauf auf `7124c4b` grün, bauen + veröffentlichen; Adresse aus dem Behälter nicht abrufbar (Netzrichtlinie), Klaus prüft im Browser)
- Android: [Familienakte-android-v2.28.1-test.1.apk](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/download/android-v2.28.1-test.1/Familienakte-android-v2.28.1-test.1.apk) – Release-Lauf 40766479452, Quelle `7124c4b`, 3.929.310 Bytes, SHA-256 `6c2afba830abe240a55b0fb41cd6faae04d5be24becd7bc4c4e5fa77b7bc610d`, unabhängig über die API geladen und gleich `SHA256SUMS`; `familienakte-android.js` und `native-network.js` in der APK byte-gleich mit main. **Wegwerfschlüssel** (keine Secrets im Repo), Vorab-Release. Das Repo ist privat: der Download verlangt eine GitHub-Anmeldung im Browser des Tablets.
- Windows: __EXE__

**Geprüft:** `tsc` · ESLint 0 Fehler · 26 Prüfskripte (`npm run check`) · `check:herkunft` · `check:android` 16 · `check:windows` 12 ·
14 Oberflächenproben (`npm run test:ui`, 420+ grüne Zeilen) · CI je PR (`ci.yml`, `android.yml`, `windows-app.yml`).
**Nicht geprüft:** kein Tablet, kein Windows-PC, kein echtes Mikrofon; APK und Installer nur in den Workflows gebaut.

## Verbesserungsvorschläge (PR #8): umgesetzt · verworfen · an Klaus

| Nr. | Stand | Warum (ein Satz) |
| --- | --- | --- |
| A1 | umgesetzt (#9) | Selbsttests lesen den Quelltext der Datei statt `Funktion.toString()`; zwei echte Testfehler dabei gefunden und behoben. |
| A2 | umgesetzt (#12) | Speicherwahl wird gemerkt, kein stiller Wechsel mehr, IndexedDB-Betrieb wird einmal gesagt. |
| A3 | umgesetzt (#12) | Register trägt einen Stand; ein älteres Register wird mit `REGISTER_CONFLICT` abgewiesen, Web Locks über Tabs. |
| A4 | umgesetzt (#12) | Der gewählte Stammordner bleibt gewählt, nur das erste Öffnen entscheidet nach Bestand. |
| A5 | umgesetzt (#12) | Datei und Scan-Originale werden zurückgenommen, wenn das Register nicht schreibt; „Entfernen“ räumt Medien mit ab. |
| A6 | umgesetzt (#12) | Prüfsummen ab 8 MB gestreamt, Grenzen in `LIMITS`; keine Fortschrittsanzeige (wäre sichtbar). |
| A7 | umgesetzt (#9) | Navigation bricht zwischen 1001 und 1439 px um; gemessen bei 1024/1280/1366/1440. |
| A8 | umgesetzt (#9) | pdf.js liegt unter `public/vendor/pdfjs/` mit Lizenz und Herkunft; nichts lädt mehr von cdnjs. |
| A9 | an Klaus | Start-Effekte ohne Abbruch sind ein Umbau der Hauptkomponente; nichts Sichtbares, aber tief – gehört zu C2. |
| A10 | an Klaus | Identität bei Lesefehlern: braucht eine Entscheidung, ob ein Lesefehler die Akte sperren darf (sichtbare Meldung). |
| A11 | umgesetzt (#9) | Fehlergrenze in `src/main.tsx` mit „Seite neu laden, Daten sind sicher“. |
| B1 | an Klaus | Verschlüsselung der Gesundheitsdaten erst nach Klaus' Entscheidung (Passwort, Ersatzschlüssel, Tresorordner?). |
| B2 | umgesetzt (#11) | Testakten, automatische Testumgebung und Windows-Diagnose nur noch im Expertenmodus (`?experte=1`); Code und Prüfungen bleiben. |
| B3 | umgesetzt (#9) | Stubs und Next.js-Reste entfernt; „Ausloggen“ bleibt (nur nach Klaus' Wort). |
| C1–C9 | an Klaus | Code-Qualität (Riesendateien, Gott-Komponente, Routing, Typisierung) ist Umbauarbeit ohne sichtbaren Nutzen – nur mit eigenem Auftrag. |
| D1 | umgesetzt (#11) | ESLint 9 (TypeScript, React-Hooks, Barrierefreiheit) und CI bei jedem PR; a11y-Regeln, die das Aussehen berühren, nur als Warnung. |
| D2 | verworfen | Die Prüfskripte lesen bewusst feste Wörter; Klaus: anpassen, nie abschalten – so bleiben sie. |
| D3 | umgesetzt (#9) | `engines.node >= 22.18.0` in package.json. |
| D4 | an Klaus | Abhängigkeiten anheben (React, Vite) ist ein eigener, risikoreicher Schritt. |
| D5 | teils (#13, #15) | README, `docs/PLATTFORMEN.md`, `docs/UEBERGABE.md`, Analyse-Berichte; ARCHITECTURE fehlt. |
| E1 | umgesetzt (#11) | React/lucide als eigene Teile, Eingangszentrale/Assistenz/Scan erst beim Öffnen. |
| E2 | umgesetzt (#11) | Startbild in `index.html`, bis React übernimmt. |
| E3 | an Klaus | Hero-Mindesthöhe ist eine sichtbare Änderung. |
| E4 | an Klaus | Listen-Virtualisierung ändert das Scrollverhalten – erst bei echten Beständen nötig. |
| E5 | verworfen | Gemeinsamer Listener spart wenig, Risiko in der Hauptkomponente. |
| E6 | umgesetzt (#11) | Manifest mit PNG 192/512/maskable, Service Worker, feste `id`. |
| E7 | verworfen | Source Maps für ein privates Projekt nicht nötig. |
| E8 | umgesetzt (#11) | `public/robots.txt` leer beigelegt. |
| F1–F7 | an Klaus | Alles sichtbar (Kontrast, Schriftgröße, Touch-Ziele, Fokus, Emoji-Ampeln): je ein Satz unten, erst nach Ja. |
| G1–G10 | an Klaus | Alles sichtbar (Menü, Begriffe, Jargon, Rückmeldungen, Startseite, Hilfe, Löschdialog, Beispieldaten, Reparaturlauf, Handy): je ein Satz unten. |
| H Schritt 1 | **nicht begonnen** | Farb-Token-Umbau (321 feste Farbwerte) ist 2–3 Tage Arbeit; die Hüllen gingen vor. Nächste Sitzung. |
| H 2–5 | an Klaus | Nachtmodus-Schalter ist sichtbar. |

## Fragen an Klaus, je ein Satz (F/G/H und offene Entscheidungen)

1. F1 Kontrast: Dürfen die blassen Kleinschriften (Themennummer, Pfeile, Status-Kleintext) auf 4,5:1 nachgedunkelt werden?
2. F2 Schrift: Darf nichts mehr unter 14 px liegen (heute 60 Regeln zwischen 10 und 12,5 px)?
3. F3 Touch: Dürfen Symbolknöpfe, Eingangs-Reiter und Hilfe-Auslöser auf 44 px wachsen?
4. F4/F5 Beschriftung und Fokus: Dürfen unsichtbare Beschriftungen (`aria-label`) und ein sichtbarer Fokusrahmen ergänzt werden (ändert das Bild nur bei Tastaturbedienung)?
5. F6/F7 Ampel-Emojis und Tabellen: Dürfen 🟢🟡🔴 einen Text für Vorleser bekommen und Tabellen eine Überschrift?
6. G1/G2/G3: Dürfen doppelte Menüeinträge weg, Begriffe vereinheitlicht und Jargon („FaWoGa“, „Prüfsumme“) übersetzt werden – Wort für Wort mit Klaus?
7. G4: Dürfen Erfolg und Fehler als haftende Meldung (vorhandener `.toast`-Stil) erscheinen?
8. G5: Darf die Startseite die leeren Aktivitätszeilen und den Breadcrumb „Startseite“ verlieren?
9. G6: Darf die Hilfe zugeklappt starten, mit Suche und drei Einstiegsfragen?
10. G7: Dürfen „VERBLEIBEN/MITLÖSCHEN/ABBRECHEN“ drei Knöpfe werden?
11. G8: Dürfen die eingebauten Gesundheitsbeispiele mit „Beispieldaten entfernen“ verschwinden?
12. G9: Soll der Reparaturlauf echte Schritte zeigen oder den Balken verlieren?
13. H: Nachtmodus mit Schalter „Automatisch / Hell / Dunkel“ – ja, nach dem Token-Umbau?
14. B1: Verschlüsselung – eigenes Passwort in der Akte, oder Fach im gemeinsamen Tresorordner der Pro-Apps?
15. KI-Schloss: Anonymisierung aus BookLedgerPro übernehmen (Anker, Muster, „Das sieht die KI“) – Empfehlung ja; welche KI (Mistral EU wie dort)?
16. Pages: bleibt die öffentliche Pages-Adresse der Weg für die PWA (Repo ist privat, Pages ist öffentlich lesbar)?
17. Postfach: Werkzeuge einladen statt eigenes Postfach (`docs/POSTFACH-UND-WERKZEUGE-PLAN.md`, vier Fragen dort)?

## Was Klaus selbst tun muss

1. **Android-Signatur**: die drei Secrets `FA_ANDROID_KEYSTORE_B64`, `FA_ANDROID_KEYSTORE_PASSWORD`, `FA_ANDROID_KEY_ALIAS` im Repo
   anlegen (wie bei BookLedgerPro `signing/`), sonst signiert jeder Release mit einem Wegwerfschlüssel und spätere Updates
   verlangen eine Neuinstallation. Die jetzt veröffentlichte Test-APK trägt einen Wegwerfschlüssel: vor der nächsten Test-APK die alte App deinstallieren.
2. **Windows**: SmartScreen beim ersten Start mit „Weitere Informationen → Trotzdem ausführen“ bestätigen (unsigniert wie Private Brain Pro).
3. **Tablet und PC**: Diktat, Teilen → Familienakte, „Öffnen mit“, Update über die Versionszeile am Gerät prüfen; hier nur gestellt.
4. Die 17 Fragen oben beantworten, am besten mit der Nummer.

## Folgearbeiten (andere Repos, nur notieren)

- BookLedgerPro und Workflow PDF Pro brauchen für ihre künftige Windows-Fassung denselben Update-Knopf in der Versionszeile (Klaus 2026-10-28).
- Private Brain Pro: Knopf „An Familienakte teilen“ neben „An BookLedgerPro teilen“ (`assets/live-mail.js`), eigener PR dort.

## Lehren dieser Sitzung

- Nach dem Internetschalter war das Browser-Diktat bei „aus“ gesperrt; drei Proben aus PR #13 verlangten es noch ohne Schalter.
  Sie schalten jetzt ausdrücklich ein (`internetAn` im Rahmen) – angepasst, nicht abgeschaltet.
- `versionCode (…).toInteger()` liest Gradle als Aufruf `versionCode(…)` → „Value is null“; die Bau-Nummer steht jetzt in einer Variable.
- Fünf Oberflächenproben direkt hintereinander: `dateieingang` einmal rot (Zeitüberschreitung beim Scan-Fenster), allein 76 grün.
- `npm ci --prefix windows` braucht ein eigenes `package-lock.json`; `playwright` muss als Entwicklungsabhängigkeit stehen (im Behälter ist es global).
