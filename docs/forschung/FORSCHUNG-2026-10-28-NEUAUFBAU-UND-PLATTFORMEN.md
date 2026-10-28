# Forschung 28.10.2026: Neuaufbau, Browser-Grenzen, KI-Stand und Vorlagen für die Plattformen

Gesammelt in der Sitzung vom 28.10.2026 (Neuaufbau der Familienakte). Alles, was hier steht,
ist nachgeprüft: im Code, im laufenden Browser oder in den genannten Repos. Vermutungen sind
als solche gekennzeichnet.

## 1. Die Familienakte selbst

| Thema | Befund | Fundstelle |
| --- | --- | --- |
| Herkunft | Die Original-App des Freundes (Version 2.28.1) lief auf Next.js/vinext mit Cloudflare D1/R2 und ChatGPT-Anmeldung. Ihre Oberfläche wurde **unverändert** übernommen, nur die Serverteile wurden ersetzt. | Branch `claude/analyze-zip-app-overview-v09o9j`; PR #2 |
| Umfang | `app/health-portal.tsx` ≈ 520 KB, `app/local-vault.ts` ≈ 230 KB, `app/globals.css` ≈ 150 KB. Rund 350 Knöpfe, über 200 `onClick`. 24 Prüfskripte plus Systemprüfung (`npm run check`). | `scripts/` |
| Fehler im Original | „Familie & Personen“ stürzte ab: 5 Menüpunkte, aber nur 4 Symbole. Behoben. | PR #2 |
| Datentresor | Arbeitet über die File-System-Access-API (Ordner-Handles). Neu: Browser-Datentresor im OPFS. Kann der Browser dort nicht schreiben (ältere Safari, eingeschränkte Seiten), springt `app/idb-directory.ts` mit IndexedDB ein. | `app/local-vault.ts` → `browserVault()` |
| Schreibsperre | `writeIndex` sichert das Register vor jedem Schreiben und schreibt mit Sperre. Jede Anlage liest und schreibt das ganze Register, deshalb dauert das Anlegen der Beispielfamilie einmalig rund 7–8 s. | `local-vault.ts` |
| Datenschutz-Logik | `lib/family-privacy.ts` und `lib/family-cockpit.ts` verbergen Gesundheitsangaben in Übersichten. Die Erkennung läuft über Wortmuster (`gesund`, `krank`, `rente`, `persönlich`, `finanz`, `bank` …) und **vererbt sich über Verknüpfungen**. Folge: Auch Schulpost oder ein Teilzeitantrag können als „Gesundheit – Aufgabe offen“ erscheinen. Das ist **Maskierung der Anzeige, keine Anonymisierung**. | `buildSensitiveIds()` |
| KI | Es gibt **keine KI-Schnittstelle**. „Mit ChatGPT arbeiten“ kopiert einen Auftrag und öffnet chatgpt.com von Hand. Die Recherche in der Assistenz ist `not_configured`. Die Systemprüfung führt „kostenpflichtige APIs“ als pausiert. Dokumente lassen sich ausdrücklich „für den Assistenten freigeben“ (`releaseInventoryItemsForAssistant`). | `health-portal.tsx` `ChatGPTEditDialog`; `lib/family-assistant.ts`; `lib/system-check-manifest.json` |
| Mikrofon | Diktat über die Web Speech API, keine eigene Mikrofonauswahl (kein `enumerateDevices`). | `lib/browser-dictation.ts`, `app/ui-controls.tsx` |
| Festwerte | `app/local-vault.ts` enthält den Windows-Pfad `G:\01GPT-SOFTWARE\002 FAMAKT SOFTWARE Entwicklung\SOFTWARE TESTORDNER` (Testumgebung des Freundes). | `AUTOMATED_TEST_WINDOWS_BASE_PATH` |

## 2. Browser-Grenzen (gemessen bzw. bestätigt)

| Umgebung | Mikrofon | `confirm()`/`prompt()` | Neues Fenster / Download | Ordnerauswahl | Drucken | Speicher |
| --- | --- | --- | --- | --- | --- | --- |
| `npm run dev` (localhost, Chrome PC) | ja | ja | ja | ja | ja | OPFS |
| Einzeldatei auf dem Handy (`content://…`) | **nein** (keine sichere Adresse) | ja | eingeschränkt | nein | ja | OPFS/IndexedDB |
| claude.ai-Link (Artifact) | **nein** (keine Mikrofon-Freigabe im Konto) | **nein** (gibt sofort „nein“ zurück) | **nein** | **nein** | **nein** | OPFS bzw. IndexedDB je Browser |
| Firefox | **nein** (keine Spracherkennung) | ja | ja | nein | ja | OPFS |
| Android-WebView (APK) | **nein** ohne natives Plugin (keine Web Speech API) | ja | nativ lösen | nein (nativ lösen) | nativ | App-Speicher |

Folgerungen, umgesetzt in PR #3 und #5:

- Rückfragen laufen als Dialog in der Seite (`app/page-dialogs.tsx`).
- Dokumente öffnen sich in einer Vorschau in der Seite (`app/file-viewer.tsx`, PDFs über
  pdf.js 3.11.174 von cdnjs).
- Das Mikrofon wird deaktiviert, wo es grundsätzlich gesperrt ist (`microphoneBlockedReason()`).
- Mit `npm run build:single` entsteht die ganze App als eine HTML-Datei (≈ 1,2 MB).

Fürs Mikrofon auf dem Handy braucht die PWA eine **https-Adresse**. Das Repo ist privat,
GitHub Pages geht dort nur mit Bezahlplan. Vorschlag: ein öffentliches Auslieferungs-Repo.

## 3. Vorlagen in den anderen Repos (gelesen am 28.10.2026)

### Private Brain Pro (`Privat-Brain-Pro`, öffentlich)

- **Internetschalter („App-Internetschalter“):** `native/native-network.js` umhüllt `fetch`
  und `XMLHttpRequest`. Ist der Schalter aus (Standard: `offline=true`), werden alle fremden
  Adressen mit `APP_OFFLINE` abgewiesen und laufende Verbindungen abgebrochen. Lokale Daten
  bleiben nutzbar. Der Zustand steht in `data-app-offline`, Ereignis `pb:network`. Bedienung
  im App-Menü, gilt in beide Richtungen und überlebt einen Neustart
  (`docs/KOMPAKTE-ANSICHT-UND-OFFLINE.md`). Netzanbindung über den „Flieger“
  `modules/net-widget.js` (`BRIEF_NACHFOLGE_2026-07-19_netz-nur-flieger.md`).
- **Windows:** Tauri (`windows/src-tauri`), NSIS-Installer pro Benutzer, Workflows
  `windows-app.yml`, `windows-release.yml`, `windows-gift-package.yml`, Baustand in
  `docs/BAUSTAND-WINDOWS.md` (1.0.37). Noch unsigniert.
- **Mikrofonauswahl unter Windows:** `docs/MIKROFON-WAHL-WINDOWS.md`. SAPI hört sonst auf das
  wechselnde Windows-Standardgerät. Gelöst mit einer Auswahl „Windows-Standard“ oder einem
  bestimmten Gerät (`SetInput`), Wiederfinden über den Namen, Hinweis bei getrenntem Gerät.
  Genau das braucht der Freund mit seinen mehreren Mikrofonen.
- **Android:** Capacitor, `android/`, Workflows `android.yml`, `android-release.yml`,
  `signing-identity.yml`, `signing-tests.yml`; Doku `docs/ANDROID.md`,
  `docs/PRUEFSTAND-ANDROID.md`, `docs/SIGNIERUNG-UND-GITHUB.md`. Natives Diktat und native
  Texterkennung: `docs/NATIVE-TEXTERKENNUNG.md`, `docs/MIKROFON-LAMPE-DATEIWAHL.md`.
- **KI beim Schreiben:** `docs/KI-BEIM-SCHREIBEN.md`; Analyse und Plan
  `docs/PLAN_2026-10-27_ANALYSE-MODELLE-SORTIERUNG-KI.md`.

### BookLedgerPro (`BookLedgerPro`, privat)

- **Anonymisierung vor der KI (gebaut):**
  - feste Anker aus den Stammdaten (`src/ai/anker.js`)
  - Muster für E-Mail, IBAN, USt-IdNr, Steuernummer und Telefon (`src/ai/ner.js`)
  - Namensvorschläge aus Anrede und Grußformel (`src/ai/namensvorschlag.js`)
  - „Namen nach Muster“ (C1)
  - „Frage an die Belege“ geht nur pseudonymisiert an Mistral EU, mit Vorschau „Das sieht die
    KI“ und Halt bei KI-Anweisungen im Text

  Grundsatz laut README: „KI On-Device-first, externe KI strikt opt-in (BYOK). Kein Klartext
  verlässt das Gerät ohne ausdrückliche Bestätigung.“ Plan und Stand:
  `docs/design/PLAN-SUCHE-MIKRO-ANONYM-2026-10-26.md`.
- **Mikrofon an allen Textfeldern mit Sprachwahl** (B1, gebaut), Engines Browser oder EU.
- **Bedeutungssuche ohne KI** (e5-small, Vektoren verschlüsselt am Beleg, A1/A2, gebaut).
- **Gemeinsamer Tresorordner** aller Pro-Apps: ein Passwort, PBV1-Schloss (PBKDF2-SHA256
  600k → AES-256-GCM), je App ein Fach, Eingangsfächer mit Marke „übernommen“. PWAs bleiben
  bei Teilen und Links (`share_target`, `?uebernahme=`).
  Doku: `docs/design/PLAN-TRESORORDNER-2026-10-26.md`,
  `docs/design/FORSCHUNG-ANDROID-TRESORORDNER-2026-10-26.md`.
- **Workflow PDF zum Ausfüllen:** Fach `Eingang-WorkflowPDF/` („Angebots-/Auftrags-PDFs zum
  Ausfüllen“), `docs/design/WORKFLOW-PDF-EINBINDUNG-PLAN-2026-10-26.md`. Das ist der deutlichste
  Hinweis auf „KI bzw. App füllt Formulare aus“. Für die Familienakte noch zu prüfen.
- **Android-Bau:** `capacitor.config.json`, `android/`, `.github/workflows/android*.yml`.

### Kim-sync (`Kim-sync`, privat; PWA unter https://lausiklauskn-png.github.io/Kim-sync/)

- Geräte koppeln über einen **Raum-Code**. Bilder, Videos und beliebige Dateien werden auf dem
  Gerät verschlüsselt (AES-GCM, Schlüssel per PBKDF2 aus dem Code) und in Teilen über
  Nostr-Relais übertragen.
- Dazu kommen:
  - Abholbestätigung und Löschbitte an die Relais
  - Teilen-Ziel
  - empfangene Bilder werden neu gezeichnet, damit Metadaten wie der Standort wegfallen
- Module: `modules/krypto.js`, `05b_nostr_relay.js`, `23_rendezvous*.js`, `echtheit.js`,
  `21_spracheingabe.js`.
- Kandidat für „Handy fotografiert → Familienakte am PC empfängt“.

### Noch nicht gelesen

`Workflow-PDF`, `Workflow-PDF-Pro`, `Workfloh-PDF-Page`, `Privat-Brain`, `Privat-Brain-Pro-V3`,
`Sende-Pruefer`, `Sendepruefer-Made-GPT`, `Auslieferung-Pruefer`,
`Auslieferungspruefer-Made-GPT`. Das ist Aufgabe der nächsten Sitzung (Paket C im
Analyseauftrag).

## 4. Offene Fragen

- Soll ein öffentliches Auslieferungs-Repo plus GitHub Pages die https-Adresse für die PWA
  liefern? Den Pages-Schalter muss Klaus einmal selbst umlegen.
- Soll die Familienakte in den **gemeinsamen Tresorordner** der Pro-Apps (eigenes Fach
  `Familienakte/` und `Eingang-Familienakte/`) oder einen eigenen Tresor behalten?
- Soll das KI-Schloss der Familienakte das von BookLedgerPro übernehmen (Anker, Muster,
  Namensvorschläge, Vorschau „Das sieht die KI“) statt etwas Eigenes zu bauen? Empfehlung: ja.
