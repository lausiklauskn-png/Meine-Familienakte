# Sitzung A – Mein Rezeptbuch auf den Küchen-Kern (mit Muttis Rezeptbuch als Ausgabe)

Auftrag von Klaus (23.11.2026): Mein Rezeptbuch modern machen – Gestaltung, Technik, Ladezeit, weniger Emojis – auf das Niveau
der Private Akte, und als Android-App, Windows-App und für Google Play vorbereiten. Familien-App, keine Bürosoftware.
Grundlage: `BRIEF_ABSCHLUSS_2026-11-23_ENTSCHEIDUNG-REZEPTBUECHER.md` (Repo Meine-Familienakte, Hauptordner) und das
Entscheidungs-Dashboard Fassung 3 (https://claude.ai/artifact/Q3JLshnxNibqJ1K4icn8k2).

Parallel läuft Sitzung B (Mein Mixarium, `docs/BRIEF_SITZUNG_2026-11-23_MIXARIUM-KUECHEN-KERN.md` in Meine-Familienakte).
Diese Sitzung A baut den Kern; B übernimmt ihn.

## Ausgangslage (gemessen 23.11., origin/main)

- Repo `lausiklauskn-png/Mein-Rezeptbuch`, **immer gegen `origin/main` arbeiten** (siehe CLAUDE.md dort: der GitHub-Default-Branch ist ein
  alter Stand).
- Die App ist **eine Datei**: `index.html` 1,43 MB, gebaut aus `QC_MeinRezb_24_04_26.html` mit `build.py`. 2.827 Emoji-Zeichen,
  507 `onclick`, Speicher in `localStorage` (Schlüssel mit Endung `9m`, z. B. `mms9m`, `mfd9m`, `mlang9m`, `claudeKey9m`) und
  IndexedDB `MeinRzBackup1` (Bilder/Sicherung). Fassung v10.0. Kein Android, kein Windows. Netz-Module SBKIM/Mycel unter `sbkim/`
  und in der Seite. Web-Import über öffentliche Weiterleiter (`api.allorigins.win`, `api.codetabs.com`). KI über eigenen Schlüssel
  (Anthropic, OpenAI, Mistral).
- Am Handy (390 px, leere App): sieben Emoji-Knöpfe im Kopf, Netz-Leiste verdeckt die untere Navigation, Sprache gemischt.

## Muttis Rezeptbuch – so ist es gemeint

**Kein dritter Umbau, keine eigene Sitzung, kein einfaches Umbenennen.** Muttis Rezeptbuch wird eine **Ausgabe** aus demselben Code:

- **Mein Rezeptbuch ist die Grundlage.** Es kann alles, was Muttis kann, und rund 140 Funktionen mehr (Kreativbuch, KI-Buch,
  Food-Zine, freies Foto, Bedeutungssuche, Bild-Sicherung). Muttis hat nur drei kleine eigene Funktionen (`_rcardHdCheck`,
  `_tddPendingMove`, `_tddPendingEnd` – Wischen an der Rezeptkarte, Ziehen und Ablegen). Diese drei prüfen und, wenn sie etwas
  Besseres tun, in den Kern übernehmen.
- **Eine Ausgabe** = derselbe Kern, beim Bauen mit anderem Namen, Symbol, Farben und Begrüßung („Muttis Rezeptbuch“). Gebaut mit
  einem Schalter, z. B. `npm run bau -- --ausgabe=muttis`. Kein zweiter Code, keine doppelte Pflege.
- **Das Repo `Muttis-Rezeptbuch` bleibt unverändert online**, bis Klaus die neue Muttis-Ausgabe abgenommen hat. Erst dann wird die
  gebaute Ausgabe dort veröffentlicht (gleiche Adresse, damit Installationen und Daten bleiben). Diese Sitzung legt dort nichts ab.
- **Daten der Muttis-Nutzer:** stehen im Browser unter Schlüsseln mit Endung `9` (`mrz9`, `mms9`, `mfd9` …) und IndexedDB
  `MrzBackup1`. Die Muttis-Ausgabe übernimmt beim ersten Start diese Schlüssel, die Mein-Ausgabe die mit `9m`. Beide liegen unter
  derselben Herkunft `lausiklauskn-png.github.io` – nur die richtigen Schlüssel lesen, nichts löschen.
- **Store:** nur „Mein Rezeptbuch“ kommt in Google Play. Muttis bleibt Web-App und APK zum Verschenken (Klaus entscheidet später).

## Schritte

1. **Bestand aufnehmen:** Liste aller Funktionen aus `QC_MeinRezb_*.html` (Bereiche, Knöpfe, Dialoge) als `docs/FUNKTIONSLISTE.md`
   mit Spalte „im Kern übernommen / Probe“. Nichts weglassen, was dort geprüft wurde. Netz-Module SBKIM/Mycel als „nicht in die
   Store-Fassung“ markieren.
2. **HTML-Vorschau** `docs/vorschau/rezeptbuch-neu.html` (als Artefakt zeigen), je Handy und Monitor: Startseite mit Rezepten
   (oder Beispielrezept, keine leeren Platzhalter), Rezept-Ansicht mit großem Foto, Kochansicht im Vollbild, Einkaufsliste,
   Wochenplaner. Daneben die Muttis-Ausgabe (andere Farben/Name). **Zwei Symbolstile zur Wahl** (Phosphor Duotone, Lucide).
   **Klaus' Ja je Punkt abwarten, vorher nichts Sichtbares bauen.**
3. **Kern bauen** neben der alten App (die alte `index.html` bleibt bis zur Abnahme online): Vite, Module, IndexedDB mit Übernahme
   aus `localStorage` und aus `.json`-Sicherungen, Proben (npm test, UI-Probe mit Playwright), CI. Aufteilung so, dass Mixarium den
   Kern übernehmen kann: `kern/` (Speicher, Rezeptmodell, Planer, Einkaufsliste, Import, Sicherung, KI-Aufruf, Übersetzung, Symbole,
   Oberflächen-Bausteine) getrennt von `ausgaben/rezeptbuch/`, `ausgaben/muttis/`. Kern-Stand mit Commit festhalten (`KERN.json`),
   damit B ihn per Pin übernimmt.
4. **Android und Windows** nach dem Muster der Private Akte (Capacitor, Ziel API 36; Windows-Paket), Signatur wie in den anderen
   Pro-Apps, Workflow für Test-APK.
5. **Funktionen übernehmen**, in dieser Reihenfolge: Rezept anlegen/ansehen/bearbeiten, Ordner, Suche, Sicherung ein/aus,
   Datenübernahme, Kochansicht, Einkaufsliste, Wochenplaner, Import (Foto, Web, Datei), KI-Funktionen, Teilen, Bücher/EPUB/Zine.
   Jede mit Probe. Erstes Ziel der Sitzung: Test-APK mit Start, Rezept anlegen/ansehen, Übernahme aus Sicherung, Kochansicht.

## Gestaltungsvorgaben (Klaus 23.11.)

- Strichsymbole als eingebettetes SVG statt Emojis (nur genutzte Symbole im Paket, kein Netzabruf); Emojis nur in Nutzertext.
- Handy zuerst, eine Spalte, untere Navigation. Tablet quer und Monitor: Liste links, Rezept rechts; im Rezept Zutaten links,
  Schritte rechts; Navigation als schmale Leiste links. Textbreite höchstens etwa 70 Zeichen.
- Vollbild mit Zweck: Kochansicht (ein Schritt groß, Wischen/Pfeiltasten, Bildschirm bleibt an, Zutaten des Schritts daneben),
  Bild-Vollbild, F11/Esc unter Windows.
- Fotos tragen die Seite; warme eigene Palette als Tokens, hell und dunkel; Schrift mindestens 4,5:1 Kontrast, auch auf Fotos.
- Animationen nur `transform`/`opacity`, 150–250 ms, Seitenwechsel per View Transitions wo vorhanden, nichts dauerhaft im
  Hintergrund, `prefers-reduced-motion` schaltet ab. Ziel: erster Inhalt am Handy unter 1 s nach Installation; messen.
- Sprache folgt dem Gerät, Deutsch vollständig. Große Tippflächen. Erklärungen kurz hinter „?“.

## Technik-Vorgaben

- Netz nur auf Knopfdruck. Keine öffentlichen Weiterleiter: in der App direkt laden (Capacitor-HTTP), im Browser mit Hinweis, wenn
  eine Seite es nicht erlaubt.
- KI nur mit eigenem Schlüssel, Schlüssel nie in Dateien oder im Chat; in der Datenschutzerklärung nennen, was wohin geht.
- Keine Netz-Module SBKIM/Mycel in der Store-Fassung.
- Kein Store-Eintrag und kein Release ohne Klaus' Wort. PR als Entwurf, Abschlussbrief mit Startauftrag.
- Forschungseinträge nur nach Kimhub, nicht in dieses Repo.

## Startauftrag (zum Einfügen)

```
Repo lausiklauskn-png/Mein-Rezeptbuch, gegen origin/main arbeiten. Lies zuerst im Repo lausiklauskn-png/Meine-Familienakte die
Datei docs/BRIEF_SITZUNG_2026-11-23_REZEPTBUCH-KUECHEN-KERN.md und folge ihr, dazu im Repo Private-Akte app.css und index.html
als Maßstab für Gestaltung und Technik. Muttis Rezeptbuch wird Ausgabe dieses Kerns (siehe Brief), das Repo Muttis-Rezeptbuch
bleibt unverändert. Beginne mit Funktionsliste und HTML-Vorschau, zeige die Vorschau als Artefakt und warte auf mein Ja.
Parallel arbeitet eine Sitzung am Mixarium und übernimmt deinen Kern – halte kern/ und ausgaben/ getrennt und pinne den Kern-Stand.
```
