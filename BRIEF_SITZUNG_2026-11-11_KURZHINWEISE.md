# Sitzungsbrief: „Kurzhinweise an Knöpfen anzeigen“ wirkt nicht (Gerätetest 2.28.56)

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

## Regeln

Nächste freie Fassung **2.28.57**. Neue Oberfläche erst als Vorschau. Vor dem Push ganze UI-Reihe oder `grep -rn` in `tests/ui`.
Ausgabe als APK, Windows, PWA; Geschenkbox nachziehen. Codex auslassen; Forschung nur in KimHub.

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte. Zuerst lesen: CLAUDE.md, BRIEF_SITZUNG_2026-11-11_KURZHINWEISE.md.
Auftrag: Klaus' Befund „Kurzhinweise an Knöpfen anzeigen funktioniert nicht“ (Tablet, APK 2.28.56, wohl mit Maus/DeX) klären und beheben.
Vermutungen im Brief (WebView zeigt title nie; Maus wird übersprungen; Knöpfe nur mit aria-label). Erst Ursache im Code belegen,
dann HTML-Vorschau der Lösung an Klaus, nach seinem Ja bauen, Probe + Gegenprobe, als 2.28.57 (APK, Windows, PWA) ausgeben,
Nachweis, Geschenkbox nachziehen. Danach weiter mit BRIEF_SITZUNG_2026-11-11_FAMILIENAKTE-WEITER.md.
Nicht: veröffentlichte Fassungen erneut ausgeben, byte-gleiche Bausteine von Hand ändern, Codex anstoßen.
```
