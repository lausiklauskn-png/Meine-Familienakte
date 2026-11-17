# Abschlussbrief 17.11.2026 – Familienbüro Pro (neue Schwester-App)

Sitzung „Word-Dokumente als HTML“, begonnen in der Familienakte, gearbeitet fast ganz im **neuen Repo
`lausiklauskn-png/Familienbuero-Pro`**. In der Familienakte selbst wurde **kein Programmcode geändert** –
nur dieser Brief und ein Verweis in `CLAUDE.md`.

## Was entstanden ist

- **Auslöser:** Klaus' Wette mit Jens, in einer Nacht ein Büropaket nach Art von Microsoft 365 zu bauen.
- **Familienbüro Pro 0.1.0**, eine eigene App neben der Familienakte: Word-, Excel- und PowerPoint-Dateien
  öffnen, bearbeiten, speichern – ohne Konto, ohne Server, alles auf dem Gerät.
  - Kern: die ONLYOFFICE-Editoren 9.3 samt Umwandler als WebAssembly, Grundlage `ranuts/document`.
  - **Lizenz AGPL-3.0** – darum bewusst eine **eigene App** und kein Einbau in Familienakte oder Private
    Brain Pro: privat frei, bei Weitergabe Quelltext offen und Herkunft genannt. Die Familienakte bleibt
    unberührt, solange beide nur Dateien austauschen.
- **PWA online:** https://lausiklauskn-png.github.io/Familienbuero-Pro/ – von Klaus am Tablet installiert.
- **Geschenkbox für Jens:** https://lausiklauskn-png.github.io/Familienbuero-Pro/geschenk/
- **Windows-Programm und Android-Test-APK** gebaut und als Releases veröffentlicht
  (`windows-v0.1.0`, `android-v0.1.0-test`). **Beide wurden nie gestartet.**
- Stand, Regeln und offene Punkte stehen dort in `CLAUDE.md` (deutsch).

## Was das für die Familienakte heißt (alles offen, nichts gebaut)

- **Anschluss:** an Word- und Excel-Unterlagen ein Knopf „Bearbeiten“, der die Datei im Familienbüro öffnet;
  zurück als neue Fassung, das Original bleibt. Weg: gemeinsamer Tresor bzw. Übergabeordner, wie Private
  Brain Pro → Familienakte.
- **Post:** kein eigener Mail-Teil im Familienbüro; Verweis auf die E-Mail-Wege der Familienakte und auf
  Private Brain Pro (dessen Mail-Kern ist nativ: `MailEngine`, `ProMailPlugin`, `DesktopService`).
- **Updates der Hüllen über family-projekt.de:** Vorgehen wie hier in `docs/UPDATES-EIGENER-SERVER.md`
  (eigene Update-Unterschrift, vorhandener Hochlade-Schlüssel, Ordner `updates/familienbuero/`, dauerhafte
  APK-Signatur). Braucht Klaus' Schlüssel aus Termux.
- **Geschenkbox Pro-Apps:** Familienbüro Pro ist als Karte eingetragen (Android-Test-APK, Windows, „Im Browser“, Geschenkbox
  für Jens). `docs/geschenk/geschenkbox-pro.html` wurde dafür auf den Live-Stand der Box gebracht (dort stand schon
  Familienakte 2.28.73 aus einer anderen Sitzung).

## Nebenprodukt

Ein einzelner **Word-Betrachter als HTML-Datei** (zeigt .docx in Originalformatierung, ohne Internet) – nur im
Chat übergeben, liegt in keinem Repo.

## Grenzen

- Die veröffentlichte Seite konnte ich nicht selbst aufrufen (diese Umgebung erreicht `github.io` nicht);
  dass sie läuft, weiß ich aus Klaus' Bild vom Tablet.
- Windows-Programm und APK sind ungeprüft; die APK trägt einen Wegwerf-Schlüssel.
- Der Knopf-Durchlauf (301 Knöpfe, kein Befund) prüft nur, dass nichts abstürzt.

## Stundennachweis

16.11.2026 20:40 bis 17.11.2026 02:45 Uhr (MEZ), eine Sitzung, rund 6 Stunden.

## Startauftrag für die nächste Sitzung

```
Lies zuerst CLAUDE.md im Repo lausiklauskn-png/Familienbuero-Pro (deutsch, Stand 0.1.0) und in der
Familienakte BRIEF_ABSCHLUSS_2026-11-17_FAMILIENBUERO-PRO.md.

1. Gerätetest mit Klaus: Windows-Programm (Release windows-v0.1.0) und Android-Test-APK
   (android-v0.1.0-test) starten – Editor öffnen, Datei öffnen, speichern. Befunde beheben.
2. Dauerhafte Android-Signatur und Updates über family-projekt.de einrichten (Schritt für Schritt mit
   Klaus, Vorlage BookLedgerPro „Für eine weitere App“).
3. Danach nach Klaus' Wahl: Anschluss an die Familienakte (Unterlagen bearbeiten, als neue Fassung
   zurück), Markieren und Notizen beim Lesen, eigene Schriften importieren, ostasiatische Schriften
   aus dem Paket nehmen, Verlaufsseite im eigenen Stil.
Freibrief für Zusammenführen und Veröffentlichen gilt nur im Repo Familienbuero-Pro.
```
