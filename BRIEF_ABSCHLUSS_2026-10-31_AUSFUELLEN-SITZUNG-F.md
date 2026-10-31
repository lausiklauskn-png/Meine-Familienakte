# Abschluss 2026-10-31: Sitzung F — Workflow PDF in der Familienakte („Ausfüllen“)

Schließt an `BRIEF_SITZUNG_2026-10-31_NETZ-CHEFCODE-SORTIERUNG.md` (Abschnitt „Sitzung F“) an. Bedienung, Aufbau und Grenzen:
**`docs/AUSFUELLEN.md`**.

## Klaus' Antworten zu Beginn (2026-10-31)

| Frage | Antwort |
| --- | --- |
| Felder aus der Akte vorbelegen? | **Ja, als Vorschlag** (gelb, änderbar) |
| Unterschrift einmal speichern? | **Ja, je Person verschlüsselt** |
| Scanner von Workflow PDF? | **Nur im Ausfüllen-Weg** — „Dokument fotografieren“ des Freundes bleibt unverändert |
| Sichtbare Änderungen | **Ja** zu allen vier: Knopf „Ausfüllen“ an der Unterlage · Cockpit „Muss noch ausgefüllt werden“ · Marke an der Unterlage · „Mit KI arbeiten“: Scans mit Texterkennung |
| Nachtrag (während des Baus) | **Eingabe-Speicher**: „E-Mail … mit den ersten zwei Buchstaben … Autoausfüllung. Ausschalten oder einschalten.“ |

## Ergebnis

| Was | Stand | Fundstelle |
| --- | --- | --- |
| Kern von Workflow PDF, byte-1:1 gepinnt (31 Dateien, Stand `2ac96d4`) | gebaut | `public/wfpdf/`, `public/wfpdf/HERKUNFT.json`, `tools/wfpdf-nachziehen.mjs` |
| Ausfüllen-Fenster: Seiten, Felder erkennen (offline, Texterkennung bei Scans), PDF-Formularfelder übernehmen, Felder setzen/ziehen/Größe, ausfüllen | gebaut | `app/ausfuellen-dialog.tsx`, `app/wfpdf-kern.ts` |
| KI benennt Felder über den Text-Weg (unkenntlich, ohne Werte, versteckter Text entfernt) | gebaut | dto. + `lib/ausfuellen.ts` (`kiFelderAuftrag`, `kiFelderAntwort`) |
| Vorbelegen aus einer Person (gelb) | gebaut | `vorbelegen` |
| Eingabe-Speicher (Autoausfüllen, an/aus, löschen) | gebaut | `merken`, `vorschlaege`; im Register `ausfuellSpeicher` |
| Unterschrift zeichnen, mit eigenem Passwort verschlüsselt merken, einsetzen | gebaut | Schloss `public/wfpdf/schluesseltresor.js`; im Register `ausfuellUnterschriften` |
| Festes / ausfüllbares PDF als **neue** Unterlage neben dem Original, Verknüpfungen übernommen, Teilen | gebaut | `saveFillResult` in `app/health-portal.tsx` |
| Vormerken → Cockpit „Muss noch ausgefüllt werden“, Marken an der Unterlage | gebaut | `InteractiveCockpit`, `DocumentLibraryCard`, `Inbox` |
| Scanner von Workflow PDF („Neu scannen“ im Ausfüllen) | gebaut, im Browser **nicht** geprobt | `scannen()` in `app/wfpdf-kern.ts`, Stil `public/wfpdf-fa/scanner.css` |
| „Mit KI arbeiten“: Fotos und gescannte PDF-Seiten per Texterkennung, unkenntlich | gebaut | `dokumentTextOcr` in `app/ki-auftrag-dialog.tsx` |
| PWA: Texterkennung/Blatterkennung nicht im Installations-Vorrat | gebaut | `scripts/build-pwa.mjs` |

## Proben (gemessen in diesem Behälter, Chromium)

- `npm run build` grün (alle `check`-Skripte, `tsc`, Vite, PWA) · `npm run lint` 0 Fehler (Warnungen wie vorher, zwei neue a11y-Warnungen
  für das Tippen auf die Seite beim Feldsetzen).
- `scripts/run-ausfuellen-tests.mjs`: Pins (31 Dateien, gleich mit dem Klon daneben) + **8 Fälle grün**.
- `tests/ui/ausfuellen.test.mjs` **17 grün**: Formular ablegen → Ausfüllen → 8 Felder erkannt (Vorname, Nachname, Geburtsdatum, E-Mail,
  Kennzeichen, Linie, 2 Kästchen) → KI-Vorschau ohne Werte, Antwort übernommen → Feld von Hand → Vorbelegen „Gerlinde“ (3 gelb) →
  festes PDF (Einträge im entpackten Inhalt gefunden) → Marken → Eingabe-Speicher „to“ → Vorschlag, aus → keiner → Unterschrift
  verschlüsselt (kein PNG im Register) → falsches Passwort abgewiesen, richtiges setzt ein → vormerken → Cockpit → Handy 390 px ohne Querrollen.
- `tests/ui/ki-ocr.test.mjs` **4 grün**: erfundenes Briefbild → Texterkennung → Vorschau mit „Bewohnerparkausweis“, Name als `⟦NAME-2⟧`.
- **Gegenproben** (je absichtlich kaputt, dann zurück): Schalter aus wirkungslos → rot · Vorbelegen überschreibt → rot · ein Byte im Kern →
  rot mit Dateinamen · Unterschrift im Klartext abgelegt → 2 rote Zeilen im Browser.
- Alle Oberflächenproben (`node tests/run-ui.mjs`): 17 von 17 Dateien grün, nachdem `pwa.test.mjs` die neue Vorrats-Regel kennt (`version.json` nennt jetzt `vorrat`); `einzeldatei` 3 · `check:android` 21 · `check:windows` 14 grün.

**Beim Bau gefunden:** (1) Chromium im Behälter legt im Browser-Speicher keine Datei mit Umlaut an („ausgefüllt.pdf“ → TypeMismatchError,
„a (b).pdf“ geht) — die Fassung heißt deshalb „ausgefuellt“. (2) Der Unterschriftsbereich wurde unter den Seiten auf 0 px gedrückt — jetzt
eigenes Feld über den Seiten. (3) Nach falschem Passwort schloss sich das Unterschriftsfeld — jetzt bleibt es offen.

## Nicht gemessen / Grenzen

Tablet, Android-App, Windows · Teilen in der App · echte KI-Antwort · Scanner im Browser dieser Akte · Einzeldatei ohne Kern (Meldung) ·
Register unverschlüsselt (Eingabe-Speicher lesbar) · Vorbelegen nur Name/Geburtsdatum (mehr hat die Person nicht) · Unterschriftslinie mit
Beschriftung darunter heißt „Feld …“ · App-Paket +26 MB · höchstens 20 Seiten. Einzelheiten in `docs/AUSFUELLEN.md`.

## Fragen an Klaus

1. **Direkter Einstieg** „Formular scannen und ausfüllen“ ohne vorhandene Unterlage (z. B. ein Knopf in der Eingangszentrale)? Heute geht
   es nur über eine Unterlage → „Ausfüllen“ → „Neu scannen“. Sichtbare Änderung, braucht dein Ja.
2. **Gesundheitsunterlagen** ausfüllen erlauben? Heute haben geschützte Gesundheitsunterlagen keinen Knopf.
3. **Anschrift, E-Mail, Telefon an Personen** in der Akte speichern (Datenmodell), damit Vorbelegen mehr kann?
4. **Einzeldatei**: Kern ohne Texterkennung (~1 MB) einbetten, damit Ausfüllen auch dort geht?
5. Veröffentlichen (Android/Windows) nur auf dein Wort — nichts ausgelöst.

## Stundennachweis (UTC; Ortszeit +1)

| Zeit | Arbeit |
| --- | --- |
| 12:16–12:30 | Briefe gelesen, Fragen an Klaus, Kern kopiert und gepinnt |
| 12:30–13:00 | Rechnung `lib/ausfuellen.ts` (+ Eingabe-Speicher nach Klaus' Nachtrag), Tresor-Funktionen, Kern-Lader, Fenster |
| 13:00–13:20 | Einbindung (Knopf, Marken, Cockpit, KI-Texterkennung), Browser-Proben, drei Befunde behoben, Gegenproben |
| 13:20–13:40 | Doku, dieser Brief, PR |

Erste Spur 12:16, letzte ~13:40: etwa **1 Stunde 25 Minuten** (Obergrenze; Klaus' eigene Angabe geht vor).

## Startauftrag zum Einfügen

```
Familienakte nach Sitzung F (Ausfüllen mit Workflow PDF). Repo lausiklauskn-png/Meine-Familienakte, Branch wie vorgegeben, Deutsch.
Zuerst lesen: BRIEF_ABSCHLUSS_2026-10-31_AUSFUELLEN-SITZUNG-F.md, docs/AUSFUELLEN.md, BRIEF_SITZUNG_2026-10-31_NETZ-CHEFCODE-SORTIERUNG.md.
Meine Antworten auf die 5 Fragen im Abschlussbrief: [hier eintragen]. Gerätebefund Tablet/Windows: [falls vorhanden].
Dann: freigegebene Punkte umsetzen, je Punkt ein PR mit Prüffall (scripts/run-ausfuellen-tests.mjs, tests/ui/ausfuellen.test.mjs).
Danach weiter mit Sitzung B (Aktualisieren oben, Mycel, Chefcode, Überall suchen) laut BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-14.md.
Workflow-PDF-Dateien nur über tools/wfpdf-nachziehen.mjs, nie von Hand. Oberfläche des Freundes nur mit meinem Ja je sichtbarer Änderung.
Beispieldaten erfunden. Kein Release ohne mein Wort. Keine Schlüssel, PINs oder Passwörter in Dateien oder im Chat.
Am Ende Abschlussbrief mit Stundennachweis und Startauftrag.
```
