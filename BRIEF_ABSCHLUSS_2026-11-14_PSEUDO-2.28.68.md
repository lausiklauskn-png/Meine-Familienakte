# Abschlussbrief 14.11.2026 – Fassung 2.28.68 (Knopf „Pseudo“, Plan Pseudonymisieren)

Erst Plansitzung (Startauftrag aus dem Datei-Organizer, Brief `docs/BRIEF_SITZUNG_2026-11-14_PLAN-TRAINING-MASKE.md` dort, Punkte 1–23),
dann mit Klaus' Freibrief (14.11.: „volle Freiheiten … Fragen beantwortest du selber … stellst die App dann online“) gebaut und ausgegeben.

## Ergebnis zuerst

- **2.28.68 ausgegeben** (#181; Android und Windows mit `server=ja`, PWA über Pages). Nachweis `docs/VEROEFFENTLICHUNG-2.28.68.json`
  (APK, Einzeldatei, Windows-Setup anonym geladen, SHA-256 = SHA256SUMS, `latest.json` 2.28.68).
- **Knopf „Pseudo“ im Kopf:** grün „an“, rot „aus“ (Klaus). Am Handy liegt „Neu“ dafür hinter „‹“ (Klaus). An = Fenster „Pseudonymisieren“
  (`app/pseudo-knopf.tsx`): Dateien (Text, PDF, Foto/Scan mit OCR auf dem Gerät, `.eml` mit allen Anhängen) oder Text → Fassung mit Marke,
  Kopieren (Doppelblatt), als Textdatei, Zurückführen einer KI-Antwort, „Korrigieren“ (nur für die Sitzung).
- **Maske** `lib/maske.ts` über Modul 25 (byte-gleich, unverändert): Steuer-ID, KVNR, RV-Nr., Ausweis mit Prüfziffer, USt-IdNr.,
  Geburtsdatum, Nummern mit Feldwort, ICD mit Gruppe; Daten, Beträge, große Firmen, Organisationen der Akte bleiben; Kleinunternehmen
  verdeckt; Marke `⟦PSEUDONYMISIERT v1⟧` – zweiter Durchlauf byte-gleich; kein Netzweg (Probe liest den Quelltext, UI-Probe zählt 0 Netzaufrufe).
- **Basic (PWA):** dieselbe Maske, keine gespeicherten Profile, Hinweis auf die Pro-App.
- **Plan** `docs/PLAN_PSEUDONYMISIEREN.md` mit Marktanalyse (Presidio-Regeln und `stdnum`-Prüfverfahren übernehmen; Cloud-Dienste und
  Browser-DLP der Hersteller nicht nutzbar; OpenMed-Modell später prüfen), Stufen B–H, Entscheidungen P1–P15. Vorschau
  `docs/vorschau/pseudonymisieren-plan.html`.
- **Sage:** Bauplan Modul 25 Gen. 3 `docs/components/25_pseudonym-gen3-bauplan.md` (Sage #1165, auf main nachgezählt).
- **Geschenkbox** auf 2.28.68 (Artefakt Version 27, HTML im Chat).

## Befunde unterwegs

- Der Knopf passte am Handy nicht in den Kopf (Name „FAMILIENAKTE“ abgeschnitten, Probe `kopf-leiste`). Erst als Lasche unter dem Kopf,
  dann nach Klaus' Vorschlag „Neu“ hinter „‹“; Proben `neu-knopf`, `neu-knopf-ziele`, `live-karten` öffnen „Neu“ am Handy über `neuKnopf()`
  im Harness, `kopf-leiste` erwartet „Neu“ in der offenen Leiste.
- CI rot bei 901 px (Kopf 4 px zu breit, `menue-breite`) – Knopf zwischen 901 und 1100 px schmaler.
- Bei 360 px wird die Versionsnummer unter dem Namen knapp abgeschnitten („2.28.6…“); der Name selbst bleibt ganz.

## Offen

- 2.28.68 am Gerät ungeprüft (OCR, Mail mit Anhängen, Kopf am Handy).
- Plan-Stufen: Profile im Pro-Tresor (Fach `profile`, Quelle Workflow PDF Pro), Knopf an Unterlage/Auswahl/Mail im Eingang, Austauschordner
  und Bezugsdokumente (Briefweg), „Alles pseudonymisieren“ mit Sortier-Datei, Bilder schwärzen; Pro-Verbund-Karte in BookLedgerPro;
  danach Private Brain Pro → BookLedgerPro → Workflow PDF Pro → Datei-Organizer.
- Sage: Gen. 3 nach dem Bauplan bauen, dann `lib/maske.ts` durch Gen. 3 mit Pin ersetzen.

## Stundennachweis

Sitzung 14.11.2026, erste Spur 07:22 UTC (Klon Datei-Organizer), letzte Spur dieses Briefs ca. 10:05 UTC – Obergrenze **2 h 43 min**
(alle Repos, Wartezeiten auf CI und Ausgabe eingeschlossen, Pausen nicht abgezogen). Forschungseintrag nicht angelegt (KimHub nicht in der
Sitzung; Klaus bat ums Sparen).

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte (eigener Zweig). Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-14_PSEUDO-2.28.68.md,
docs/PLAN_PSEUDONYMISIEREN.md (Stand und Stufen), in Sage-Protokol docs/components/25_pseudonym-gen3-bauplan.md.
Auftrag: Stufe C – Profile für die Maske im Pro-Tresor (Personen/Organisationen der Akte verknüpft, Schreibweisen, Nummern nur als
HMAC-Fingerabdruck, „immer verdecken“/„darf bleiben“, Übernehmen aus anderer Pro-App oder selbst anlegen; Fach `profile` über die Quelle
Workflow PDF Pro byte-gleich), Anschluss an den Pseudo-Knopf; Korrigieren merkt sich ins Profil. Erst HTML-Vorschau der Profilseite.
Nicht: echte Dokumente oder pseudonymisierte Texte ins Repo, keine Schlüssel/PINs, nichts veröffentlichen ohne Klaus' Wort.
```
