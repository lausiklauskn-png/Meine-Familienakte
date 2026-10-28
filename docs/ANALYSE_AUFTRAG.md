# Auftrag für eine neue Sitzung: „Meine Familienakte“ analysieren und Funktionen prüfen

> Einstieg für die Sitzung: zuerst `BRIEF_SITZUNG_ANALYSE-UND-ERSTBAU.md` lesen. Dieser Auftrag ist dessen Teil 1.

**Sprache:** Bitte durchgehend auf Deutsch antworten und alle Ergebnisse auf Deutsch schreiben.

## Hintergrund

Die Familienakte ist die App eines Freundes. Ich soll ihm helfen, sie weiterzuentwickeln.
Ich habe keine Zeit, mit ihm jeden Knopf durchzugehen. Deshalb soll diese Sitzung selbst
herausfinden, **was jeder Knopf tun soll, ob er es tut und wie die Technik dahinter
zusammenhängt** – und ob bzw. wie Künstliche Intelligenz (KI) mit anonymisierten Dokumenten
eingeplant ist.

Diese Sitzung **analysiert und prüft**. Fehler werden dokumentiert. Kleine, eindeutige
Korrekturen sind erlaubt, aber jeweils in einem eigenen, kleinen Pull Request und erst
nachdem der Bericht steht.

## Ausgangslage (Stand 28.10.2026)

- Repository `lausiklauskn-png/Meine-Familienakte`, Branch `main`.
- Die ursprüngliche App des Freundes (Version 2.28.1, Next.js/Cloudflare) liegt unverändert
  auf dem Branch `claude/analyze-zip-app-overview-v09o9j`. Sie ist die **Referenz**: Was dort
  ein Knopf tun sollte, ist die Absicht des Freundes.
- `main` enthält dieselbe Oberfläche als reine Browser-App (Vite + React), mit diesen
  Abweichungen:
  - Datentresor im Browser-Speicher (OPFS, Rückfall IndexedDB) statt Cloudflare-Server
  - erfundene Beispielfamilie „Lindqvist-Arenberg“ mit Knopf „Beispieldaten entfernen“
  - Rückfragen als Dialog in der Seite statt `confirm()`/`prompt()`
  - Dokumentvorschau in der Seite
  - das Mikrofon ist dort ausgeschaltet, wo der Browser es grundsätzlich sperrt
- Start: `npm install`, dann `npm run dev`. Prüfungen: `npm run check` (24 Prüfskripte plus
  Systemprüfung). `npm run build:single` erzeugt die ganze App als eine HTML-Datei.
- Online-Ansicht (privat): https://claude.ai/artifact/QeYH2B9qwU5tqphrCAtQhc

### Schon bekannte Befunde

| Funktion | Befund |
| --- | --- |
| Mikrofon / Diktat | Nutzt die Web-Speech-Schnittstelle des Browsers. Geht nur auf **https** (oder localhost) in Chrome/Edge/Safari. Gesperrt bei lokal geöffneter Datei (`content://…` auf dem Handy) und auf der claude.ai-Seite. Firefox hat keine Spracherkennung. |
| Drucken | `window.print()` – auf der claude.ai-Seite ohne Wirkung. |
| Ordner wählen (Tresor, OneDrive, Eingangsordner, Bestand, Export, Sicherung) | Braucht die Ordnerauswahl des Browsers: nur Chrome/Edge am PC, nicht eingebettet, nicht auf dem Handy. |
| „Mit ChatGPT arbeiten“ | Kopiert einen Änderungsauftrag und öffnet chatgpt.com. **Keine** KI-Schnittstelle in der App („Hier wird keine OpenAI-API verwendet“). |
| Assistenz „B · Aktuell recherchiert“ | Recherche ist vorgesehen, aber `researchStatus: "not_configured"`. |
| Systemprüfung | Die Liste `pausedCapabilities` enthält „kostenpflichtige APIs“, „OneDrive-Automatik“ und „automatische Dateiverschiebung“, also bewusst zurückgestellte Funktionen. |
| Datenschutz | `lib/family-privacy.ts` und `lib/family-cockpit.ts` **verbergen** Gesundheitsangaben in Übersichten (z. B. „Geschützte Gesundheitsunterlage“). Das ist eine Maskierung in der Anzeige, **keine Anonymisierung** von Dokumentinhalten. |
| Freigabe für den Assistenten | `releaseInventoryItemsForAssistant` / `assistantReleased` – Dokumente werden ausdrücklich für den Assistenten freigegeben. Noch klären, was danach mit ihnen geschieht. |
| Testumgebung | `app/local-vault.ts` enthält einen festen Windows-Pfad `G:\01GPT-SOFTWARE\…` – vermutlich der Entwicklungsrechner des Freundes. |

## Arbeitspakete

### A · Inventar aller Bedienelemente und Funktionsprüfung

Die App hat rund 350 Knöpfe (`<button>`, über 200 `onClick`-Handler), dazu Eingabefelder,
Auswahllisten, Datei-Eingänge und Ablageflächen.

1. **Inventar erstellen**, und zwar auf zwei Wegen, die sich gegenseitig abgleichen:
   - aus dem Code: jeder Knopf mit Beschriftung, Datei/Zeile, Handler und aufgerufener
     Funktion in `lib/` bzw. `app/local-vault.ts`
   - aus der laufenden App: ein Playwright-Rundgang durch alle Menüs, Seiten, Dialoge und
     Unterseiten, der alle sichtbaren Bedienelemente einsammelt
2. **Absicht bestimmen** – ohne den Freund zu fragen. Quellen:
   - Beschriftung, `title` und `aria-label`
   - Hilfetexte in `lib/ui-help.ts` (`UI_HELP`) und die `InfoPopover`-Texte
   - die Seite „Hilfe“ und die Versionshistorie („Was gibt’s Neues?“) in `app/health-portal.tsx`
   - `lib/system-check-manifest.json` (fertige, pausierte und geplante Fähigkeiten)
   - die Prüfskripte in `scripts/`, die zeigen, was der Freund als „muss funktionieren“ ansieht
3. **Jeden Knopf prüfen** (automatisch mit Playwright, wo möglich), und zwar mit Beispieldaten
   und mit leerer Akte. Ergebnis je Knopf: ✅ funktioniert · ⚠️ teilweise ·
   ❌ defekt · 🔒 in dieser Umgebung gesperrt · ❓ Absicht unklar.
4. **Umgebungen** getrennt bewerten:
   - lokal `npm run dev` am PC (Chrome)
   - gebaute App über https
   - Einzeldatei auf dem Android-Handy
   - claude.ai-Link
   - Firefox
   - Safari/iPhone (soweit ohne Gerät beurteilbar)
5. **Besonders prüfen:**
   - **Mikrofon/Diktat:** alle Diktatknöpfe, Dauerdiktat, Fehlermeldungen. Die Web Speech API
     lässt sich headless nicht echt testen. Dafür eine kurze Handy-Checkliste schreiben.
   - **„Copy“-Knöpfe:** in den beiden Aktivitätszeilen oben, „Auftrag kopieren“, Diagnose- und
     Prüfberichte. Mit Playwright und Zwischenablage-Berechtigung prüfen, ob der richtige Text
     ankommt, und das Verhalten ohne Berechtigung prüfen.
   - Ausloggen, Drucken, Suche (inklusive „Verstanden als:“), Statuswechsel im Cockpit,
     Fristen anlegen und erledigen, Tagebuch (Entwurf, Prüfen, Speichern, Löschen),
     Korrespondenz (Entwurf, versendet, Antwort), Verknüpfen und Lösen von Zusammenhängen,
     Export, Sicherung/Wiederherstellung, Systemprüfung, „Praktische Abnahme“,
     „Beispieldaten entfernen/laden“.

### B · Beispiele, Tipps und Rückfragen

Alle Stellen sammeln, an denen die App ein **Beispiel** zeigt („Zum Beispiel: …“), einen
**Tipp** gibt (Info-Knöpfe, Hinweiskästen) oder **nachfragt** (Bestätigungsdialoge,
Rückfragen im Tagebuch, „Offene Memory-Fragen“). Je Stelle festhalten:

- Text und Ort
- ob der Text zur Funktion passt
- ob dahinter eine automatische Auswertung steckt (Regeln, Schlüsselwörter) oder eine
  **KI vorgesehen** ist

### C · KI-Einsatz und Anonymisierung

Meine Vermutung: Dokumente sollen **anonymisiert** an eine KI gehen, von der KI
**ausgefüllt bzw. bearbeitet** und danach **wieder mit den echten Angaben versehen**
werden. Die Sitzung soll prüfen, wie weit das vorbereitet ist.

1. **In dieser App:** alle Stellen mit KI-Bezug auflisten (ChatGPT-Dialog, Assistenz und
   Recherche, Freigabe für den Assistenten, Datenschutzklassen `allgemein / vertraulich /
   besonders geschützt`, Maskierung von Gesundheitsangaben). Klären, was heute wirklich passiert
   und was nur vorbereitet ist.
2. **In meinen anderen Repos** (nur lesen; mit `add_repo` hinzufügen):
   - PDF-Workflow: `Workflow-PDF`, `Workflow-PDF-Pro`, `Workfloh-PDF-Page`
   - Private Brain: `Privat-Brain`, `Privat-Brain-Pro`, `Privat-Brain-Pro-V3`
   - Sendeprüfer: `Sende-Pruefer`, `Sendepruefer-Made-GPT`
   - Auslieferungsprüfer: `Auslieferung-Pruefer`, `Auslieferungspruefer-Made-GPT`
   - zusätzlich `BookLedgerPro` („KI On-Device-first, externe KI strikt opt-in (BYOK). Kein
     Klartext verlässt das Gerät ohne ausdrückliche Bestätigung.“) und `Kim-sync`

   Gesucht wird:
   - **Anonymisierung / Pseudonymisierung:** Namen, Adressen, Nummern und Daten erkennen,
     durch Platzhalter ersetzen, Zuordnungstabelle speichern
   - **Rückführung:** Platzhalter nach der KI-Bearbeitung wieder durch die echten Angaben
     ersetzen
   - **Ausfüllen:** PDF-Formularfelder (AcroForm), Vorlagen, Briefe oder Antworten, die
     eine KI befüllt
   - **Prüfung vor dem Versand:** Sendeprüfer und Auslieferungsprüfer könnten eine
     Ausgangskontrolle sein, also prüfen, ob noch echte Daten im Text stehen, bevor er zur
     KI oder zum Empfänger geht
   - welche KI angebunden ist oder werden soll (API, ChatGPT von Hand, lokal), welche Daten
     das Gerät verlassen und wo Schlüssel liegen
3. **Ergebnis:** eine Reifegrad-Tabelle je Baustein (nicht vorhanden · Idee/Text ·
   Teil-Code · funktionsfähig · getestet) und ein Vorschlag, wie die Bausteine aus den
   anderen Repos in die Familienakte passen würden: Datenfluss Dokument → Anonymisierung →
   KI → Prüfung → Rückführung → Datentresor.

### D · Dateieingang

Alle Wege prüfen, auf denen Dateien in die Akte kommen. Dazu einen eigenen Satz
**erfundener Testdateien** anlegen (PDF, Bild, DOCX, XLSX, TXT, EML mit Anhang, MSG,
ZIP, VTT). Der Satz enthält auch eine Dublette, eine zu große Datei und einen nicht
erlaubten Dateityp.

- Drag & Drop, Dateiauswahl, „Dokument fotografieren“ (Scan zu PDF)
- lokaler Eingangsordner, OneDrive-Ordner, „Bestand prüfen“ (Inventar)
- E-Mail-Dateien mit Anhängen (`extractEmlAttachments`), ZIP
- Zuordnungsvorschlag (Lebensbereich, Dokumentart, Datenschutz, Bereich), Dubletten-Warnung,
  Vorgangsvorschlag, „Trotzdem übernehmen“
- danach: Bibliothek, Suche, Cockpit, Vorschau, Statuswechsel, Löschen/Archivieren

### E · Technischer Baum

Für jede Hauptfunktion den Weg aufzeichnen: **Knopf → Handler → Fachlogik in `lib/` →
Speicherfunktion in `app/local-vault.ts` → Datei im Tresor** (`00_Register`,
`01_Dokumente`, …). Als Mermaid-Diagramme, gegliedert nach den Hauptmenüs (Assistenz,
Gesundheit & Arbeit, Familie & Personen, Wohnen, Fahrzeuge, Käufe & Garantien,
Dokumente, Hilfe).

### F · Mikrofon-Auswahl und Plattformen (PWA, APK, später Windows)

**Hintergrund:** Mein Freund arbeitet am **Windows-PC** und hat **mehrere Mikrofone**, die er
beim Bedienen der App auswählen kann. Ich selbst teste zunächst auf dem **Android-Handy**.

1. **Mikrofon-Auswahl prüfen:** Der Code enthält bisher **keine eigene Mikrofonauswahl**
   (kein `enumerateDevices` / `deviceId`, weder auf `main` noch in der Referenz-Version).
   Das Diktat nutzt die Spracherkennung des Browsers (Web Speech API), und die nimmt immer
   das Standardmikrofon des Systems bzw. das Mikrofon, das in den Browser-Einstellungen
   gewählt ist. Zu klären und zu dokumentieren:
   - Wie wählt er heute unter Windows das Mikrofon (Windows-Sound-Einstellungen,
     Chrome/Edge-Einstellungen pro Website)?
   - Was wäre nötig für eine Auswahl **in der App**? Etwa eine Liste der Mikrofone über
     `navigator.mediaDevices.enumerateDevices()`, Aufnahme über `getUserMedia({ audio:
     { deviceId } })` und Spracherkennung über einen Dienst, der Audio-Daten annimmt
     (lokal oder per API). Die Web Speech API selbst kann **kein** Mikrofon auswählen.
   - Gibt es in den anderen Repos schon Code dafür?

   Der **Windows-Umbau** ist ausdrücklich **später** dran. Jetzt nur Bestandsaufnahme und
   Vorschlag, nichts umbauen.
2. **PWA (Browser-App) vorbereiten:** Manifest ist vorhanden. Prüfen und vorschlagen, was
   noch fehlt: Service Worker / Offline-Cache, Symbole in PNG-Größen, https-Adresse (siehe
   offene Entscheidung unten), Installation auf Android und Windows.
3. **APK für mich zum Testen planen** (neben der PWA). Vorschlag mit Aufwand und Risiken:
   - Hülle mit **Capacitor** um den bestehenden Vite-Build (`dist/`), Build der APK per
     GitHub Actions. Die fertige APK liegt dann als herunterladbare Datei an einem
     Actions-Lauf oder Release im Repo.
   - **Vorlage gibt es schon:** `BookLedgerPro` hat `capacitor.config.json`, `android/`
     und die Workflows `.github/workflows/android.yml`, `android-release.yml` und
     `signing-identity.yml`, außerdem `BRIEF_ABSCHLUSS_2026-10-26_ANDROID-SCHRITT-A.md`.
     Weitere Vorlagen in `Privat-Brain-Pro` (`docs/ANDROID.md`,
     `docs/SIGNIERUNG-UND-GITHUB.md`) und `Workflow-PDF-Pro`. Diesen Weg übernehmen, statt
     einen neuen zu erfinden.
   - **Wichtig:** In der Android-WebView gibt es die Web-Speech-Spracherkennung **nicht**.
     Für das Diktat in der APK braucht es ein natives Plugin (z. B. Capacitor Speech
     Recognition) plus Berechtigung `RECORD_AUDIO`. Ebenso prüfen: Ordnerauswahl (in der APK
     nicht vorhanden, Datentresor also im App-Speicher), Dateiauswahl, Kamera-Scan, Teilen und
     Herunterladen von Sicherungen.
   - **Signierung:** Debug-APK zum Testen reicht. Keine Schlüssel ins Repo, gegebenenfalls
     als GitHub-Secret.
4. **Aktualisierung über das Repo:** Für PWA **und** APK beschreiben, wie eine neue Version
   aus dem Repo entsteht und hochgeladen wird. Jeder Merge nach `main` baut automatisch:
   - die PWA (GitHub Pages bzw. Einzeldatei)
   - die APK als Release-Datei mit Versionsnummer
   - eine Update-Anzeige in der App („Neue Version verfügbar“)

   Ergebnis von Paket F: `docs/analyse/PLATTFORMEN.md` mit Ist-Stand, Vorschlag und
   Schritt-für-Schritt-Plan. Den **ersten Bau** von PWA, APK und Windows-App (offline-fähig,
   mit Internetschalter) hat Klaus freigegeben. Er steht in Teil 2 von
   `BRIEF_SITZUNG_ANALYSE-UND-ERSTBAU.md`, jeweils als eigener PR nach der Analyse.

### G · Dateien von anderen Geräten: Handy-Foto, Scanner, andere Apps

**Wunsch:** Ich mache mit dem Android-Handy in derselben Software ein Foto und schicke es an
die Familienakte, etwa an den PC oder an ein anderes Gerät. Dort kommt es an, oder ich
importiere es aus einem Sende- bzw. Eingangsordner. Ebenso sollen Scanner und andere Apps
Dateien liefern können, damit sich die Familienakte füllen und verwalten lässt.

1. **Ist-Stand in der Familienakte prüfen:**
   - „Dokument fotografieren“ (mehrere Seiten werden zu einem PDF): auf Handy und PC
   - „Eingangsordner auswählen“ und „OneDrive-Familienordner prüfen“ (Ordner `00_Posteingang`)
   - E-Mail-Dateien (`.eml`/`.msg`) mit Anhängen, ZIP
   - die Eingangszentrale (`app/central-intake-center.tsx`, `lib/central-intake.ts`)
2. **Vorlagen in meinen Repos ansehen** (nur lesen):
   - **`Kim-sync`** (PWA, https://lausiklauskn-png.github.io/Kim-sync/): Geräte über einen
     **Raum-Code** koppeln. Fotos, Videos und beliebige Dateien werden auf dem Gerät
     verschlüsselt (AES-GCM) und in Teilen über Relais übertragen, mit Abholbestätigung,
     Teilen-Ziel und neu gezeichneten Bildern (Metadaten wie Standort fallen weg). Module:
     `modules/krypto.js`, `05b_nostr_relay.js`, `23_rendezvous*.js`, `echtheit.js`.
   - **`BookLedgerPro`**: Plan **gemeinsamer Tresorordner** für alle Pro-Apps
     (`docs/design/PLAN-TRESORORDNER-2026-10-26.md`). Ein Passwort, ein Schloss, je App ein
     Fach und **Eingangsfächer** (z. B. `Eingang-BookLedgerPro/`), Marke „übernommen“.
     PWAs nutzen stattdessen Teilen und Links (`share_target`, `?uebernahme=`). Dazu der
     Briefkasten-Austausch `docs/SAGE_SYNC_BRIEFKASTEN.md` und der Ordner `sbkim/`.
   - `Privat-Brain-Pro` / `Workflow-PDF-Pro`: Schreibseite ins Eingangsfach, `DocumentVault`
3. **Vorschläge ausarbeiten und bewerten** (Aufwand, Datenschutz, Handy/PC/Windows,
   PWA/APK). Mindestens diese Varianten:
   - **a) Teilen an die Familienakte:** Auf dem Handy in der Galerie, Kamera, Scanner-App
     oder E-Mail „Teilen → Familienakte“. Die PWA braucht dafür `share_target` im Manifest,
     die APK einen Android-Intent. Die Datei landet direkt im Dokumenteneingang mit
     Zuordnungsvorschlag.
   - **b) Kim-sync-Kopplung:** Handy und PC teilen einen Raum-Code. Das Handy fotografiert
     bzw. scannt in der Familienakte und sendet verschlüsselt. Die Familienakte auf dem PC
     zeigt die Datei in der Eingangszentrale als „Eingang: anderes Gerät“. Die Kim-sync-
     Bausteine nach Möglichkeit wiederverwenden, nicht neu schreiben.
   - **c) Gemeinsamer Eingangsordner:** Ein Fach `Eingang-Familienakte/` im gemeinsamen
     Tresorordner der Pro-Apps (nativ: APK/Windows), alternativ ein synchronisierter Ordner
     (OneDrive o. ä.), den die Familienakte als Eingangsordner überwacht. Andere Apps
     (Private Brain Pro, BookLedgerPro, Workflow PDF Pro) legen dort Dateien ab.
   - **d) Scanner:** Netzwerk- bzw. Multifunktionsgeräte, die in einen Ordner scannen
     (dann wie c) oder per E-Mail versenden (dann `.eml`-Import). Mobile Scanner-Apps
     übergeben ihre Datei über a.
   - **e) QR-Code-Kopplung:** Der PC zeigt einen QR-Code, das Handy scannt ihn und ist
     gekoppelt. Kein Abtippen von Codes.
4. **Ergebnis:** `docs/analyse/DATEI-EINGANG-GERAETE.md` mit Ist-Stand, Bewertungstabelle
   der Varianten, empfohlener Reihenfolge und Datenfluss-Skizze (Mermaid):
   Gerät → Übertragung → Eingangszentrale → Zuordnung → Datentresor.
   Umsetzen erst nach meiner Zustimmung.

## Werkzeuge und Grenzen

- Playwright mit dem vorinstallierten Chromium (Desktop- und Handy-Ansicht), Zwischenablage
  über `context.grantPermissions(["clipboard-read","clipboard-write"])`
- Ordnerauswahl und Spracherkennung lassen sich headless nicht echt bedienen. Dafür entweder
  Ersatzobjekte im Test verwenden oder eine Handprüf-Liste schreiben, die ich auf PC und Handy
  abhaken kann.
- Keine echten Daten verwenden. Für Beispiele und Testdateien gelten die Regeln aus
  `NEUSTART_AUFTRAG.md`: erfundene Namen, Orte und Nummern, keine Ärzte und keine echten Firmen.
- Andere Repos nur lesen, dort nichts ändern.

## Abgabe

Alles unter `docs/analyse/`, verlinkt aus der README:

1. `BERICHT.md` – Zusammenfassung für mich und meinen Freund: was funktioniert, was nicht,
   die wichtigsten Fehler, Stand von KI und Anonymisierung, Empfehlungen in Reihenfolge
2. `FUNKTIONSMATRIX.csv` und `.md` – alle Bedienelemente mit Ort, Absicht, Ergebnis je
   Umgebung und Fundstelle im Code
3. `TECHNISCHER-BAUM.md` – die Diagramme aus Paket E
4. `KI-UND-ANONYMISIERUNG.md` – Paket C mit Reifegrad-Tabelle und Datenfluss-Vorschlag
5. `HANDPRUEFUNG.md` – Liste der Dinge, die ich selbst auf Handy und PC prüfen muss
6. `DATEI-EINGANG-GERAETE.md` – Paket G: Handy-Foto, Scanner und andere Apps als Dateiquelle, mit Vorschlägen
7. `PLATTFORMEN.md` – Paket F: Mikrofon-Auswahl, PWA, APK, späterer Windows-Umbau und der Weg vom Repo zur aktualisierten App
8. `FRAGEN-AN-DEN-FREUND.md` – nur die Punkte, die sich aus Code und Texten wirklich nicht
   klären lassen
9. die Playwright-Tests unter `tests/` und als `npm run test:ui` startbar, damit sie
   später wiederholt werden können

Am Ende: Commit, Push, Pull Request. Die Analyse darf ich zusammenführen lassen. Außerdem
im Chat eine kurze Zusammenfassung mit den fünf wichtigsten Ergebnissen.

## Offene Entscheidungen (vorher kurz nachfragen)

- **APK, PWA und Windows bauen:** freigegeben, siehe `BRIEF_SITZUNG_ANALYSE-UND-ERSTBAU.md`.
- **https-Adresse:** Für das Mikrofon auf dem Handy braucht die App eine echte https-Adresse. Vorschlag: ein
separates öffentliches Repo (z. B. `familienakte-app`) nur mit der gebauten App und GitHub
Pages. Den Schalter in den Pages-Einstellungen muss ich einmal selbst umlegen. Das ist erst
nach meiner Zustimmung umzusetzen.
