# Abschlussbrief 16.11.2026 – Android-Update scheitert auf älteren Handys (2.28.73 vorbereitet)

Anlass (Klaus 16.11.): Das Update über die Versionszeile ging in der Android-App nicht; Meldung sinngemäß „Schlüssel stimmt nicht“.
Betroffen: das Handy des Freundes (älteres Android, Fassung 2.28.55). Bei Klaus ging es danach wieder.

## Gefunden
- Serverseite in Ordnung: APK 2.28.71 trägt das dauerhafte Zertifikat (`1f06819f…`, v2 und v3), versionCode 61 wie in den
  Update-Angaben; deren Unterschrift hat der Freigabelauf gegen den Schlüssel der App geprüft. Inhalt der APK unauffällig.
- Die Update-Prüfung in der App ist seit 2.28.55 unverändert.
- Vermutete Ursache: Android 9 und 10 liefern bei `getPackageArchiveInfo(…, GET_SIGNING_CERTIFICATES)` für eine APK-Datei kein
  `signingInfo`; der Ersatzweg `signatures` ist mit dieser Abfrage leer → immer `UPDATE_ZERTIFIKAT` („nicht mit demselben Schlüssel
  unterschrieben“). Dazu passt Klaus' Rückmeldung: Der Freund konnte die neue Fassung von Hand (GitHub) installieren, nur das Update
  aus der App geht bei ihm nicht.

## Geändert (PR #212, Entwurf, nicht übernommen, nicht ausgegeben)
- `FamilienakteUpdatesPlugin.archiv()`: fehlt `signingInfo` bei der geladenen APK, wird das Zertifikat über `GET_SIGNATURES` nachgeholt.
  Die Prüfung selbst (gleiches Paket, gleiches Zertifikat, höherer versionCode) bleibt.
- main `0fd7cd5` (2.28.72) eingemischt; Fassungsdateien und `lib/fassungen.ts` auf **2.28.73**. 2.28.72 hat eine andere Sitzung
  ausgegeben, sie trägt die Korrektur nicht.

## Grenzen
- Nicht an einem Gerät mit Android 9/10 geprüft; die Android-Version des Freundes und der genaue Wortlaut der Meldung sind nicht bestätigt.
- Proben: `npm run check:android` 22 grün. CI am ersten Stand von #212 (nur die Korrektur) grün; am Stand mit 2.28.73 lief sie beim
  Schreiben noch. Lokal waren Typprüfung und `npm run check` nicht lauffähig (Pakete im Behälter nicht installiert).
- family-projekt.de war aus dem Behälter gesperrt, der Live-Stand des Update-Servers ist nicht selbst geprüft.
- Wirkt erst ab der Fassung mit der Korrektur: Wer auf einem solchen Handy eine ältere Fassung hat, installiert einmal von Hand
  über die vorhandene App (nicht deinstallieren).
- Derselbe Code liegt als Vorlage in BookLedgerPro (f6633c8) und vermutlich in den anderen Pro-Apps – dort nicht nachgezogen.
- Offen bei Klaus: ob er auf dem eigenen Handy deinstalliert hat (App-Speicher wäre dann weg) oder das Update durchlief.

## Stundennachweis
16.11.2026, rund 1 Std. (Fehlersuche an Feed, APK und Freigabelauf; Korrektur; Abgleich mit 2.28.72; Vorbereitung 2.28.73).

## Startauftrag
```
Lies CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-16_ANDROID-UPDATE-2.28.73.md und den Abgleich-Brief. Klaus hat am 16.11. gesagt: Korrektur
in die nächste Fassung und ausgeben. Prüfe, ob im Abgleich-Brief „fertig“ für 2.28.72 steht und ob die CI an PR #212 grün ist,
mische main ein, frage Klaus kurz, ob 2.28.73 jetzt hinaus soll, dann #212 übernehmen und 2.28.73 ausgeben (Android, Windows mit
server=ja, Web-App), Downloads per SHA-256 prüfen, Nachweis, Geschenkbox. Danach die Korrektur in den anderen Pro-Apps nachziehen.
```
