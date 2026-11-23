# Sitzung B – Mein Mixarium auf den Küchen-Kern

Auftrag von Klaus (23.11.2026): Mein Mixarium modern machen – Gestaltung, Technik, Ladezeit, weniger Emojis – auf das Niveau der
Private Akte, und als Android-App, Windows-App und für Google Play vorbereiten. Familien-App, keine Bürosoftware.
Grundlage: `BRIEF_ABSCHLUSS_2026-11-23_ENTSCHEIDUNG-REZEPTBUECHER.md` (Repo Meine-Familienakte, Hauptordner) und das
Entscheidungs-Dashboard Fassung 3 (https://claude.ai/artifact/Q3JLshnxNibqJ1K4icn8k2).

**Parallel läuft Sitzung A** (Mein Rezeptbuch, `docs/BRIEF_SITZUNG_2026-11-23_REZEPTBUCH-KUECHEN-KERN.md` in Meine-Familienakte).
A baut den gemeinsamen Küchen-Kern. Diese Sitzung baut **keinen eigenen Kern**, sondern übernimmt den von A per Pin, sobald er auf
main im Repo Mein-Rezeptbuch liegt. Bis dahin arbeitet B an allem, was nur das Mixarium betrifft (Schritte 1–3).

## Ausgangslage (gemessen 23.11., main)

- Repo `lausiklauskn-png/Mein-Mixarium`. Die App ist **eine Datei**: `index.html` 1,23 MB, byte-gleich mit
  `QC_Mixarium_20_04_26.html` (von Hand gespiegelt, kein Build). 2.483 Emoji-Zeichen, 448 `onclick`, Speicher in `localStorage`
  (Schlüssel `mix9m`, `mxfd9m`, `mxNoAlc9` …) und IndexedDB `MeinMxBackup1`. Fassung v9.5. Kein Android, kein Windows. Netz-Module
  SBKIM/Mycel (`sbkim/`, darunter `23_rendezvous_ui.js` 230 KB). Web-Import über öffentliche Weiterleiter. 8 Themen, 8 Sprachen.
- Am Handy: starkes eigenes Bild (Kolben, Sternenhimmel), startet aber mit Intro-Animation statt Inhalt.
- Kein Schwesterprojekt; `Me-Mixarium` ist ein leeres Nebenrepo (nur Lizenz und Regeln), `mr-*.html` stammen aus Muttis Rezeptbuch.
- Ein Schalter „ohne Alkohol“ existiert schon (`mxNoAlc9`) – übernehmen.

## Schritte

1. **Bestand aufnehmen:** Liste aller Funktionen aus `QC_Mixarium_*.html` als `docs/FUNKTIONSLISTE.md` mit Spalte „aus dem Kern /
   nur Mixarium / Probe“. Abgleich mit der Funktionsliste von Sitzung A, sobald sie im Repo Mein-Rezeptbuch liegt: was gleich ist,
   kommt aus dem Kern; nur Getränke-Eigenes bleibt hier.
2. **HTML-Vorschau** `docs/vorschau/mixarium-neu.html` (als Artefakt), je Handy und Monitor: Startseite mit Getränken,
   Getränk mit großem Foto, Mix-Ansicht im Vollbild (Schritt für Schritt), Einkaufsliste, Menü-Ansicht. Eigene Bildwelt behalten
   (Glas, Licht, Farbe), aber ruhiger: eine Palette statt acht Themen (hell und dunkel), Strichsymbole statt Emojis, zwei
   Symbolstile zur Wahl wie bei A. **Klaus' Ja je Punkt abwarten.**
3. **Getränke-Schicht vorbereiten:** Mengen in ml/cl/Spritzer, Gläser, Kategorien (Mocktail, Smoothie, Cocktail, Limonade, Tee,
   Sirup), Alkohol-Kennzeichen und Schalter „ohne Alkohol“, Datenübernahme aus `mix9m`/`MeinMxBackup1` und aus `.json`-Sicherungen –
   als Module mit Proben, noch ohne Kern.
4. **Kern übernehmen**, sobald A ihn auf main hat: `kern/` aus Mein-Rezeptbuch **byte-gleich** mit Pin (Commit) übernehmen, wie die
   Klone der Private Akte (Werkzeug zum Nachziehen und Prüfen, z. B. `tools/kern-nachziehen.mjs` mit `--pruefen`). **Den Kern nie hier
   von Hand ändern**; was im Kern fehlt, als Wunsch im Repo Mein-Rezeptbuch beschreiben (Brief) oder Klaus melden.
5. **Android und Windows** wie A (Capacitor, Ziel API 36; Windows-Paket). Test-APK.

## Gestaltungsvorgaben (Klaus 23.11.) – dieselben wie bei A

- Strichsymbole als eingebettetes SVG statt Emojis; Emojis nur in Nutzertext.
- Handy zuerst; Tablet quer und Monitor: Liste links, Getränk rechts, Zutaten und Schritte nebeneinander.
- Vollbild mit Zweck: Mix-Ansicht, Bild-Vollbild, F11/Esc unter Windows.
- Intro nur beim ersten Start, überspringbar; danach sofort Inhalt.
- Schrift mindestens 4,5:1 Kontrast, auch auf dunklem Grund und auf Fotos; keine hellen Pastell-Schriften.
- Animationen nur `transform`/`opacity`, 150–250 ms, View Transitions, nichts dauerhaft im Hintergrund (auch kein bewegter
  Sternenhimmel im Dauerlauf), `prefers-reduced-motion` schaltet ab. Ziel: erster Inhalt am Handy unter 1 s nach Installation.

## Store-Hinweise

- Beispielsammlung ohne Alkohol; Alkohol-Rezepte verändern die Altersfreigabe im Fragebogen von Google Play.
- Keine Netz-Module SBKIM/Mycel in der Store-Fassung; Netz nur auf Knopfdruck; keine öffentlichen Weiterleiter.
- Kein Store-Eintrag und kein Release ohne Klaus' Wort. PR als Entwurf, Abschlussbrief mit Startauftrag.
- Forschungseinträge nur nach Kimhub.

## Startauftrag (zum Einfügen)

```
Repo lausiklauskn-png/Mein-Mixarium. Lies zuerst im Repo lausiklauskn-png/Meine-Familienakte die Datei
docs/BRIEF_SITZUNG_2026-11-23_MIXARIUM-KUECHEN-KERN.md und folge ihr, dazu im Repo Private-Akte app.css und index.html als Maßstab.
Parallel baut eine Sitzung im Repo Mein-Rezeptbuch den gemeinsamen Küchen-Kern; du baust keinen eigenen Kern, sondern übernimmst
ihn später byte-gleich mit Pin. Beginne mit Funktionsliste und HTML-Vorschau, zeige die Vorschau als Artefakt und warte auf mein Ja;
danach die Getränke-Schicht mit Proben, bis der Kern auf main von Mein-Rezeptbuch liegt.
```
