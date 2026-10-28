# Auftrag für eine neue Sitzung: „Meine Familienakte“ analysieren und Funktionen prüfen

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
6. `FRAGEN-AN-DEN-FREUND.md` – nur die Punkte, die sich aus Code und Texten wirklich nicht
   klären lassen
7. die Playwright-Tests unter `tests/` und als `npm run test:ui` startbar, damit sie
   später wiederholt werden können

Am Ende: Commit, Push, Pull Request. Die Analyse darf ich zusammenführen lassen. Außerdem
im Chat eine kurze Zusammenfassung mit den fünf wichtigsten Ergebnissen.

## Offene Entscheidung (vorher kurz nachfragen)

Für das Mikrofon auf dem Handy braucht die App eine echte https-Adresse. Vorschlag: ein
separates öffentliches Repo (z. B. `familienakte-app`) nur mit der gebauten App und GitHub
Pages. Den Schalter in den Pages-Einstellungen muss ich einmal selbst umlegen. Das ist erst
nach meiner Zustimmung umzusetzen.
