# Sitzungsbrief: Kurzhinweise, rote und graue Kästen der Landkarte, restliche Punkte (nach 2.28.56)

Klaus 10.11.2026, Bild vom Tablet (Familienakte Pro 2.28.56, Hilfe, Fenster mit Kopfleiste wie bei Samsung DeX bzw. Freiform-Fenster):
„Kurzhinweise an Knöpfen anzeigen funktioniert nicht.“ Der Haken ist gesetzt, trotzdem sieht er an den Knöpfen keinen Hinweis.

## Wie es heute gebaut ist

- `app/kurzhinweise.ts` (seit 2026-11-04), Haken in `app/kurzhinweise-schalter.tsx`, Probe `tests/ui/kurzhinweise.test.mjs`.
- **An:** Der Hinweis ist nur das `title`-Attribut des Knopfs.
  - Am PC zeigt ihn der Browser beim Darüberfahren.
  - Bei Touch zeigt ein **langer Druck (0,5 s)** eine Blase (`.kurzhinweis-blase`).
- **Aus:** `title` wird nach `data-fa-titel` verschoben.

## Vermutungen (nicht geprüft, am Gerät nachstellen)

1. **Android-WebView zeigt `title` nie an.** In der APK bleibt also nur der lange Druck. Ein normaler Tipp oder ein kurzes Halten zeigt nichts; der Haken wirkt dann wie tot.
2. **Maus oder Trackpad (DeX, Freiform-Fenster):**
   - `pointerType === "mouse"` → der Code steigt aus (`if (!aktiv || e.pointerType === "mouse") return;`).
   - Die WebView zeigt aber auch kein `title` beim Darüberfahren.
   - Ergebnis: mit Maus in der APK **gar kein** Hinweis. Wahrscheinlich Klaus' Fall (Bild zeigt Fensterleiste).
3. Neuere Knöpfe tragen womöglich nur `aria-label` und kein `title`. Dann gibt es dort nichts anzuzeigen.
   - Prüfen, z. B. Kopfleiste „Neu“, Glocke, Kalender, Buch; die Erste-Schritte-Kacheln haben ohnehin sichtbaren Text.
4. Die Probe läuft nur am DESKTOP-Chromium; dort zeigt der Browser `title`. Die APK-Lage misst sie nicht.

## Vorschlag zum Bauen (erst als HTML-Vorschau, Klaus' Ja)

- In der App (Android/Windows-WebView) eine **eigene Blase auch für die Maus**: beim Darüberfahren nach ca. 0,6 s, `title` dabei zurückhalten, damit nichts doppelt erscheint.
- Bei Touch bleibt der lange Druck; dazu im Haken-Text sagen, wie man den Hinweis sieht („am Tablet: Knopf kurz gedrückt halten“).
- Knöpfe ohne `title`, aber mit `aria-label`: den Text der Blase aus `aria-label` nehmen.
- Probe erweitern: Maus-Darüberfahren zeigt die Blase. Und eine Gegenprobe: mit dem alten Code rot. Ein HANDY-Kontext mit langem Druck läuft schon in der Probe.

## Danach: rote und graue Kästen der „Landkarte der App“ (Klaus 10.11.)

Klaus will die roten und die grauen Kästen der Landkarte (Hilfe › Landkarte der App) abarbeiten. Stand der Kästen: `lib/app-stand.ts`,
Texte: `lib/app-landkarte.ts`, Gerätezustand: `lib/live-zustand.ts` / `app/live-zustand.ts`.

**Rot = auf diesem Gerät nicht eingerichtet** (`stand: "aktivieren"`): `datentresor`, `protresor`, `datei-pro`, `kalender`, `glocke`.
- Zuerst klären: Ist ein Kasten rot, obwohl er auf Klaus' Gerät eingerichtet ist? Dann ist das ein Fehler im Live-Zustand.
  Beispiel: Pro-Tresor eingerichtet, Kasten trotzdem rot. Klaus nach einem Bild der Karte fragen und je Kasten nachstellen.
- Ist er wirklich nicht eingerichtet, braucht der Kasten einen klaren Weg „Beheben ›“, der direkt zur Stelle führt.
- Prüfen, ob es diesen Weg je Kasten gibt und ob er dort ankommt.

**Grau gestrichelt = geplant, nicht gebaut** (alle seit 2.28.35, E-Mail-Plan; Karte `docs/landkarte/`):
- Mail herein: `mail-ms` (Microsoft-Postfach abholen/senden), `mail-imap` (GMX · WEB.DE · T-Online mit App-Passwort), `mail-gmail` (Gmail direkt).
- Prüfung: `pruefung` (Prüfung der Anlagen in der Eingangszentrale) und `befund` (Befund: ablegen ohne Vorschau oder weglassen).
- Mail hinaus: `echt`, `programm`, `mailapp` (Mail-App des Geräts vorbereitet öffnen), `mssend` (Microsoft-Postfach senden).

Reihenfolge laut Plan in `CLAUDE.md` (Abschnitt Offen):
1. Anhang-Prüfung (`pruefung`/`befund`), dazu echtes PDF mit einem Tipp und Mail-App öffnen (`echt`, `programm`, `mailapp`).
2. Danach Microsoft mit den Entra-Rechten Mail.Read/Mail.Send (`mail-ms`, `mssend`).
3. Gmail-Abholen auslassen; IMAP über die Technik aus Private Brain Pro.

Offen ist noch die **Entscheidung von Klaus und Jens** aus der E-Mail-Karte. Vor dem Bau eine HTML-Vorschau mit Ja/Nein je Kasten.
Je fertigem Kasten `lib/app-stand.ts` auf „fertig“ mit `seit` setzen.

## Danach: Systemprüfung zeigt veraltete Berichte (Klaus 10.11., Bild Hilfe › Systemprüfung)

- „Vollständige Systemprüfung“ steht auf **13.10.2026, Version 2.28.1**, gelb, mit Bereichen wie „FaWoGa-OneDrive-Integration“.
  Darunter ein Eintrag vom 07.11. mit „5/15 bestanden“. Klaus: „Das ist auch überholt.“
- Quelle: `lib/release-system-check-report.json` (fest eingebaut, Prüf-ID `test-2.28.1-final-readiness-20261013`), angezeigt über
  `app/health-portal.tsx` (Import Zeile ~142, Karte `#pruefberichte` ~3577); `APP_VERSION` 2.28.1 ist laut `CLAUDE.md` der interne Prüfstand.
- Vorschlag (Vorschau, Klaus' Ja):
  - Den fest eingebauten Altbericht nicht mehr als aktuellen Stand zeigen.
  - Stattdessen die Prüfung der laufenden Fassung zeigen, aus `lib/fassungen.ts`, den Nachweisen und der CI.
  - Alternativ als „Archiv“ zugeklappt mit Datum.
  - Bereiche, die es nicht mehr gibt (FaWoGa, OneDrive, „Memory“), streichen.
  - Eigene, auf dem Gerät gespeicherte Prüfberichte bleiben.
- Prüfen, ob die Systemprüfung selbst (Knopf „Systemprüfung“) noch Bereiche mit alten Namen prüft.
- **Falsche Versionsnummer in der praktischen Abnahme** (Klaus 10.11., zweites Bild):
  - Bei Einträgen wie „Mikrofonstatus: Klappt“ steht „Website 40 · Familienakte 2.28.1“, obwohl die App 2.28.56 ist.
  - Ursache im Code: `app/health-portal.tsx` übergibt `websiteVersion="40" familyVersion={APP_VERSION}`; `APP_VERSION` ist 2.28.1, der interne Stand. Die Zeilen liegen bei ~3548.
  - Feste Werte „40“ stehen auch bei ~2549 und ~3451 („40 · private Testfassung 2.28.1“).
  - Künftig die technische Fassung aus `package.json` nehmen, wie die Versionszeile im Kopf; „Website 40“ streichen oder ersetzen.
  - Schon gespeicherte Antworten behalten ihre alte Angabe. Die Anzeige sagt dazu „aus Fassung …“, damit klar ist, dass sie älter sind.

## Danach: übrige Punkte

Aus `BRIEF_SITZUNG_2026-11-11_FAMILIENAKTE-WEITER.md` die Punkte 2–6:
- 2: Sicherheitsseite kürzer.
- 3: Wettlauf in `kalender-einlesen`.
- 4: Basic-Verbund-Karte.
- 5: Landkarten-HTML für die Geschenkbox.
- 6: Vollsicherungsordner.

## Regeln

Nächste freie Fassung **2.28.57**. Neue Oberfläche erst als Vorschau. Vor dem Push ganze UI-Reihe oder `grep -rn` in `tests/ui`.
Ausgabe als APK, Windows, PWA; Geschenkbox nachziehen. Codex auslassen; Forschung nur in KimHub.

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte. Zuerst lesen: CLAUDE.md, BRIEF_SITZUNG_2026-11-11_KURZHINWEISE.md.
Auftrag: Klaus' Befund „Kurzhinweise an Knöpfen anzeigen funktioniert nicht“ (Tablet, APK 2.28.56, wohl mit Maus/DeX) klären und beheben.
Vermutungen im Brief (WebView zeigt title nie; Maus wird übersprungen; Knöpfe nur mit aria-label). Erst Ursache im Code belegen,
dann HTML-Vorschau der Lösung an Klaus, nach seinem Ja bauen, Probe + Gegenprobe, als 2.28.57 (APK, Windows, PWA) ausgeben,
Nachweis, Geschenkbox nachziehen.
Danach: rote und graue Kästen der „Landkarte der App“ (Abschnitt im Brief): rote am Gerät nachstellen (Fehler im Live-Zustand
oder fehlender Weg „Beheben ›“), graue E-Mail-Kästen nach Plan – erst Klaus' und Jens' Entscheidung und eine HTML-Vorschau.
Dann Systemprüfung mit veralteten Berichten (Abschnitt im Brief), danach die Punkte 2–6 aus BRIEF_SITZUNG_2026-11-11_FAMILIENAKTE-WEITER.md. Je Stück eigener Zweig, PR, Fassung, Ausgabe.
Nicht: veröffentlichte Fassungen erneut ausgeben, byte-gleiche Bausteine von Hand ändern, Codex anstoßen.
```
