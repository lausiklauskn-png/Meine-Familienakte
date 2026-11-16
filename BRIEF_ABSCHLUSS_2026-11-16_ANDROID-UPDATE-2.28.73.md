# Abschlussbrief 16.11.2026 – Android-Update scheitert auf älteren Handys (Fassung 2.28.73 ausgegeben)

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

## Geändert und ausgegeben (PR #212, main `940c11d`, Fassung 2.28.73)
- `FamilienakteUpdatesPlugin.archiv()`: fehlt `signingInfo` bei der geladenen APK, wird das Zertifikat über `GET_SIGNATURES` nachgeholt.
  Die Prüfung selbst (gleiches Paket, gleiches Zertifikat, höherer versionCode) bleibt.
- 2.28.72 hatte eine andere Sitzung schon ausgegeben (ohne die Korrektur), darum **2.28.73**: Android, Windows (inhaltlich
  unverändert) und Web-App über Pages, beide Läufe mit `server=ja`. Downloads per SHA-256 nachgeprüft, APK trägt das dauerhafte
  Zertifikat; Nachweis `docs/VEROEFFENTLICHUNG-2.28.73.json`. Geschenkbox auf 2.28.73.

## Grenzen
- Nicht an einem Gerät mit Android 9/10 geprüft; die Android-Version des Freundes und der genaue Wortlaut der Meldung sind nicht
  bestätigt. Ob die Korrektur wirkt, zeigt sich erst beim Update von 2.28.73 auf die nächste Fassung.
- Wer auf einem solchen Handy eine ältere Fassung hat, installiert 2.28.73 einmal von Hand über die vorhandene App (nicht deinstallieren).
- CI an #212 (Stand `9ae046d`) grün. Lokal waren Typprüfung und `npm run check` nicht lauffähig (Pakete im Behälter nicht installiert).
- family-projekt.de und github.io waren aus dem Behälter gesperrt; den Server prüft der Freigabelauf selbst, die Web-App ist ungeprüft.
- Derselbe Code liegt als Vorlage in BookLedgerPro (f6633c8) und vermutlich in den anderen Pro-Apps – dort nicht nachgezogen.
- Nachweis und „fertig“ für 2.28.72 (andere Sitzung) fehlten beim Schreiben noch; `lib/app-stand.ts` nicht angefasst.
- Offen bei Klaus: ob er auf dem eigenen Handy deinstalliert hat (App-Speicher wäre dann weg) oder das Update durchlief.

## Stundennachweis
16.11.2026, rund 1,5 Std. (Fehlersuche an Feed, APK und Freigabelauf; Korrektur; Abgleich mit 2.28.72; Ausgabe 2.28.73 mit Nachweis und Geschenkbox).

## Startauftrag
```
Lies CLAUDE.md und BRIEF_ABSCHLUSS_2026-11-16_ANDROID-UPDATE-2.28.73.md. Frage Klaus nach der Rückmeldung vom Handy des Freundes
(Android-Version, 2.28.73 von Hand installiert?). Ziehe die Korrektur aus FamilienakteUpdatesPlugin.archiv() in den anderen Pro-Apps
nach (Vorlage BookLedgerPro), je App ein PR, nichts ausgeben ohne Klaus' Wort. Mit der nächsten Familienakte-Fassung prüfen lassen,
ob das Update über die Versionszeile auf dem alten Handy durchläuft.
```
