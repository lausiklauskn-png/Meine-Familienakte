# Plan: Microsoft-Postfach freischalten (Entra) – Anleitung für den Termin bei Jens

Stand 12.11.2026, nach Fassung 2.28.65. Gebaut ist in der App schon alles (E-Mail-Weg C: Mails holen, über Microsoft senden).
Es fehlt nur die Freigabe der zwei Rechte `Mail.Read` und `Mail.Send` in der App-Registrierung bei Microsoft. Bis dahin sagt
die App „noch nicht eingerichtet“ bzw. Microsoft lehnt die Anmeldung ab.

**Dauer:** etwa 10 Minuten Einstellung, 10 Minuten Probe. **Kein neuer Bau, keine neue Fassung nötig** – die Rechte gelten
sofort, die App fragt sie bei der nächsten Anmeldung an.

## Was du brauchst

- Einen PC oder das Tablet mit Browser (das Entra-Portal ist am PC bequemer).
- Das **Microsoft-Konto, mit dem die App „Familienakte“ am 05.11. angelegt wurde** (das mit dem kostenlosen Azure-Konto und dem
  „Standardverzeichnis“). Ein anderes Konto sieht die App nicht.
- Für die Probe: ein Outlook.com-/Hotmail-Postfach (deins oder das von Jens) und die Familienakte als **Web-App** oder **Windows**.
- Kein Passwort und keinen Code an Claude oder in eine Datei geben. Die Anwendungs-ID (siehe unten) ist öffentlich, die darf
  genannt werden.

## Anleitung Schritt für Schritt

1. **Portal öffnen:** https://entra.microsoft.com – mit dem Konto von oben anmelden.
   - Erfolg: links das Menü mit „Identität“, oben rechts dein Name und „Standardverzeichnis“.
   - Steht dort „Microsoft Services“ oder kommt `AADSTS16000`: falsches Konto. Abmelden und mit dem anderen anmelden.
2. **App finden:** links **Identität › Anwendungen › App-Registrierungen** → Reiter **Alle Anwendungen** → **Familienakte**.
   - Prüfen: In der Übersicht steht als Anwendungs-ID (Client-ID) `7a36668e-4325-4533-9649-054c1fbc749c`.
     Steht dort eine andere Nummer, ist es die falsche App – nicht weitermachen, Claude die Nummer sagen.
3. **Rechte hinzufügen:** links **API-Berechtigungen** → **Berechtigung hinzufügen** → **Microsoft Graph** →
   **Delegierte Berechtigungen** (nicht „Anwendungsberechtigungen“!).
   - Ins Suchfeld `Mail` tippen, unter „Mail“ **Mail.Read** und **Mail.Send** anhaken.
   - Unten **Berechtigungen hinzufügen**.
4. **Kontrolle:** Die Liste zeigt jetzt fünf bis sieben Einträge unter „Microsoft Graph“, darunter
   `Calendars.ReadWrite`, `Mail.Read`, `Mail.Send`, `User.Read` (und ggf. `openid`, `profile`, `offline_access`).
   - In der Spalte „Administratorzustimmung erforderlich“ steht bei allen **Nein**. Den Knopf „Administratorzustimmung
     erteilen“ braucht es nicht (für private Konten ohnehin ohne Wirkung).
5. **Nichts sonst ändern:** kein Geheimnis („Zertifikate & Geheimnisse“) anlegen, die Umleitungs-URIs unter
   „Authentifizierung“ so lassen (`https://lausiklauskn-png.github.io/Meine-Familienakte/` als SPA, `http://localhost` als
   Mobile/Desktop).

## Probe danach

Am besten zuerst in der **Web-App** (https://lausiklauskn-png.github.io/Meine-Familienakte/), dann unter **Windows**.

1. **Eingangszentrale › Kasten „E-Mail“** → oben „Wie kommen Mails herein?“ **Microsoft-Postfach** wählen → **Mails holen …**
2. Microsoft fragt nach dem Konto und zeigt eine Zustimmungsseite mit „E-Mails lesen“ und „E-Mails in Ihrem Namen senden“
   → **Akzeptieren**. (Kommt die Seite „App nicht überprüft“ / „nicht verifizierter Herausgeber“: bei privaten Konten trotzdem
   annehmen; siehe Grenzen.)
   - Erfolg: Liste der Mails der letzten 30 Tage. Eine anhaken → in die Eingangszentrale. Im Postfach ändert sich nichts
     (keine Mail wird „gelesen“ oder verschoben).
3. **Senden:** unten „Wie gehen Mails hinaus?“ **Über Microsoft senden** wählen. Dann **Assistenz › Vorgang oder Termin
   vorbereiten › Schreiben vorbereiten**, Art „E-Mail“, als Empfänger **die eigene Adresse**, Betreff „Probe Familienakte“,
   Haken „geprüft“ → **Über Microsoft senden …** → im Fenster Empfänger und Anlagen prüfen → **Jetzt senden**.
   - Erfolg: Meldung „Über Microsoft gesendet“, die Mail kommt an und liegt in Outlook unter „Gesendete Elemente“.
   - Anlagen über 3 MB gehen über Microsoft in dieser Fassung noch nicht – dafür „In der Mail-App öffnen“.
4. Ergebnis (geht / Fehlermeldung wörtlich / Bildschirmfoto) an Claude geben. Claude trägt es in `docs/KALENDER-EINRICHTUNG.md`,
   in `CLAUDE.md` (Abschnitt „Offen“) und in die Hilfe-Landkarte ein.

## Wenn etwas nicht geht

| Meldung | Bedeutung | Was tun |
|---|---|---|
| „noch nicht eingerichtet“ / Microsoft lehnt die Anmeldung ab | Rechte fehlen oder falsche App | Schritt 3–4 prüfen, Anwendungs-ID vergleichen |
| `AADSTS65001` (keine Zustimmung) | Zustimmungsseite abgebrochen | Noch einmal „Mails holen …“, dann „Akzeptieren“ |
| `AADSTS50020` / „Konto ist in diesem Verzeichnis nicht vorhanden“ | Kontotyp der App nicht „alle Microsoft-Konten“ | unter „Authentifizierung“ › unterstützte Kontotypen prüfen – Claude fragen |
| „Administrator muss zustimmen“ | Firmen-/Schulkonto (z. B. Arbeits-Outlook) | mit einem privaten Outlook.com-Konto probieren; Firmenkonten brauchen den verifizierten Herausgeber (MPN-ID), später |
| Anmeldefenster öffnet sich nicht | Pop-up blockiert | Pop-ups für die Seite erlauben |
| Senden bricht mit „Unklar, ob gesendet wurde“ ab | Netz weg während des Sendens | in Outlook unter „Gesendete Elemente“ nachsehen; die App wiederholt nie selbst |

## Grenzen, die schon feststehen

- **Android-App (APK):** dort wird das Microsoft-Postfach voraussichtlich **nicht** gehen. Die APK läuft unter der Adresse
  `https://localhost`, die in Entra nicht als Rücksprung eingetragen ist (deshalb bietet die Kalender-Karte Microsoft in der
  APK gar nicht an). Am Handy bleibt der Weg **Private Brain Pro › „An Familienakte teilen“** bzw. Teilen aus der Mail-App.
  Bei Jens einmal in der APK ausprobieren und das Ergebnis notieren; danach entscheidet Klaus, ob die APK die Wahl
  „Microsoft-Postfach“ ausblendet (kleiner Umbau) oder einen eigenen Android-Anmeldeweg bekommt (größerer Umbau).
- **Browser:** die Anmeldung gilt bis zum Schließen/Neuladen der Seite (etwa eine Stunde), es wird kein Zugang gespeichert.
- **Windows:** nach einem Neustart des Programms neu anmelden.
- **Gmail** (Google-Postfach) ist nicht Teil dieses Termins: Google verlangt dafür eine eigene Prüfung.
- **Verschlüsselung:** Mails sind unterwegs nicht Ende-zu-Ende verschlüsselt; die App weist auf Gesundheitswörter im Betreff hin.

## Startauftrag für Claude am Termin

```
Familienakte: Microsoft-Postfach in Entra freischalten. Lies CLAUDE.md und docs/PLAN_2026-11-12_MICROSOFT-MAIL-ENTRA.md.
Gib mir die Anleitung Schritt für Schritt (immer nur einen Schritt, warte auf mein „erledigt“ oder ein Bildschirmfoto).
Danach die Probe in Web-App, Windows und einmal in der APK. Trag das Ergebnis in docs/KALENDER-EINRICHTUNG.md, CLAUDE.md
(„Offen“) und lib/app-stand.ts ein. Keine neue Fassung ausgeben ohne mein Wort.
```
