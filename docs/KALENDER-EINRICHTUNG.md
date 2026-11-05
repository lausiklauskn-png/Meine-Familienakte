# Kalender-Konten einrichten (Google, Microsoft)

Stand 05.11.2026. Ohne diese Einrichtung funktionieren **Android-Gerätekalender** (Samsung, Google- und Outlook-Konten des
Geräts) und die **Kalenderdatei (.ics)** schon. Google und Microsoft zeigen bis dahin „Noch nicht eingerichtet.“

Ergebnis der Einrichtung sind **Client-IDs**. Sie sind öffentlich und kommen in `lib/kalender-konten.ts`. Geheim bleibt nur
das Google-Client-Geheimnis des Desktop-Clients: es kommt **nur** als GitHub-Secret `FA_GOOGLE_DESKTOP_SECRET` in das Repo
(Settings → Secrets and variables → Actions), nie in eine Datei, nie in den Chat.

Feste Adressen:

| Wofür | Adresse |
|---|---|
| Browser (PWA), Ursprung | `https://lausiklauskn-png.github.io` |
| Browser (PWA), Rücksprung | `https://lausiklauskn-png.github.io/Meine-Familienakte/` |
| Windows, Rücksprung Microsoft | `http://localhost` (der Anschluss wechselt; Microsoft erlaubt das bei localhost) |
| Windows, Rücksprung Google | nichts eintragen (Desktop-Clients dürfen auf 127.0.0.1 zurück) |

## Google (Google Cloud Console)

1. https://console.cloud.google.com öffnen, oben das Projekt wählen: vorhandenes „privat-brain-pro“ oder **Neues Projekt**
   „Familienakte“.
2. **APIs & Dienste → Bibliothek** → „Google Calendar API“ → **Aktivieren**.
3. **Google Auth Platform** (früher „OAuth-Zustimmungsbildschirm“) → **Branding**: App-Name „Familienakte“,
   Support-E-Mail wählen, Speichern.
4. **Zielgruppe**: Nutzertyp **Extern**, Veröffentlichungsstatus **Test** lassen. Unter **Testnutzer** die eigenen
   Google-Konten und die der Familie eintragen (höchstens 100).
5. **Datenzugriff** → **Bereiche hinzufügen**: `.../auth/calendar.events` und `.../auth/calendar.calendarlist.readonly`.
   Beide sind „sensibel“: ohne Prüfung durch Google warnt die Anmeldung („Google hat diese App nicht überprüft“) – für
   Testnutzer ist das in Ordnung („Weiter“).
6. **Clients → Client erstellen**, Typ **Webanwendung**, Name „Familienakte Browser“.
   - Autorisierte JavaScript-Quellen: `https://lausiklauskn-png.github.io`
   - Autorisierte Weiterleitungs-URIs: `https://lausiklauskn-png.github.io/Meine-Familienakte/`
   - Erstellen. Die **Client-ID** (endet auf `.apps.googleusercontent.com`) notieren. Ein Geheimnis braucht dieser Client
     nicht.
7. Noch einmal **Client erstellen**, Typ **Desktop-App**, Name „Familienakte Windows“. Erstellen.
   - **Client-ID** notieren.
   - Das **Client-Geheimnis** sofort als GitHub-Secret `FA_GOOGLE_DESKTOP_SECRET` hinterlegen und nirgends sonst.
8. Ein Android-Client ist nicht nötig: die Android-App schreibt über den Gerätekalender.

## Microsoft (Entra-Portal)

1. https://entra.microsoft.com öffnen und mit dem Microsoft-Konto anmelden. Meldet das Portal, dass kein Verzeichnis
   (Mandant) da ist: zuerst ein kostenloses Azure-Konto anlegen (https://azure.microsoft.com/free), das legt eins an.
   Die App gilt danach trotzdem für alle privaten Outlook.com-Konten der Familie.
2. **App-Registrierungen → Neue Registrierung**:
   - Name „Familienakte“
   - Unterstützte Kontotypen: **Konten in einem beliebigen Organisationsverzeichnis und persönliche Microsoft-Konten**
   - Umleitungs-URI: Plattform **Single-Page-Anwendung (SPA)**, `https://lausiklauskn-png.github.io/Meine-Familienakte/`
   - Registrieren.
3. In der neuen App: **Authentifizierung → Plattform hinzufügen → Mobile und Desktopanwendungen**, eigene URI
   `http://localhost`, Speichern. „Öffentliche Clientflows zulassen“ auf **Ja**.
4. **API-Berechtigungen → Berechtigung hinzufügen → Microsoft Graph → Delegierte Berechtigungen**: `Calendars.ReadWrite`
   (dazu sind `openid`, `profile`, `offline_access` und `User.Read` schon da oder werden ergänzt). Keine Administrator-
   zustimmung nötig.
5. **Übersicht**: die **Anwendungs-ID (Client-ID)** notieren. Ein Geheimnis wird **nicht** angelegt.

## Danach

- Die drei Client-IDs (Google Web, Google Desktop, Microsoft) an Claude geben – sie sind öffentlich – oder selbst in
  `lib/kalender-konten.ts` eintragen. Das Google-Geheimnis nur als GitHub-Secret.
- Ein neuer Bau (PWA über Pages, Windows über `windows-release.yml`) nimmt sie auf. Veröffentlichen nur mit Klaus' Wort.
- Probe am Gerät: Fristen und Aufgaben → Kalender verbinden → Google bzw. Microsoft → Konto wählen → Kalender wählen →
  Frist mit Haken anlegen → im Kalender nachsehen, Erinnerung prüfen → Frist erledigen → Termin verschwindet.

## Grenzen

- Browser: Die Anmeldung gilt bis zum Schließen oder Neuladen (Google etwa eine Stunde); danach „Neu anmelden“. Gespeichert
  wird kein Zugang.
- Windows: Der Erneuerungsschlüssel liegt nur im Speicher des laufenden Programms; nach einem Neustart neu anmelden.
- Samsung-Kalender gibt es nur über die Android-App (Samsung hat keine öffentliche Schnittstelle für Windows oder Browser).
