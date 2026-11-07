# Abschluss 07.11.2026: Sitzung 3 (E-Mail) – Fassung 2.28.35

Startauftrag aus `BRIEF_ABSCHLUSS_2026-11-07_DATEN.md` (jetzt `docs/briefe-archiv/`). Plansitzung E-Mail; nach Klaus' Wünschen in der
Sitzung wurde die E-Mail-Geschichte als Hilfe-Thema schon eingebaut (nur Erklärung, Senden und Abholen sind **nicht** gebaut) und
2.28.35 ausgegeben (Klaus: „Nach grüner CI PR 121 zusammenführen“, „Danach 2.28.35 als APK, PWA und Windows ausgeben“,
Neu-Eintrag „ruhig mit reinnehmen“). PR #121 (Plan, Hilfe, Abstimmungsdateien) als 3e43dc9, PR #122 (Fassung) als ef6e705.

## Was getan wurde

- **Private Brain Pro gelesen** (main 555a954, nur gelesen): IMAP/SMTP mit Jakarta Mail 1.6.8, Gmail über den eingeschränkten
  Vollzugriff `mail.google.com`, Microsoft nur Platzhalter, Passwörter verschlüsselt (Keystore/DPAPI) und als Kopie im Tresor,
  Senden mit Prüfung und zweimal Nachfragen (gut), dagegen automatisches Abmelden/Papierkorb, Mailtexte im Browser-Katalog und
  KI über Mistral (passen nicht zu den Familienakten-Regeln). Abgleich in `docs/vorschau/email-2.28.35.html`.
- **Wege nachgeprüft** (Websuche; die Seiten von Google und Microsoft sind aus dem Behälter gesperrt): Outlook.com ohne
  Passwort-Anmeldung seit 09/2024; `Mail.Send`/`Mail.Read` auch für private Konten; Graph-Anlagen bis 3 MB direkt, sonst stückweise;
  `gmail.readonly` eingeschränkt (jährliche bezahlte Prüfung), `gmail.send` sensibel (Prüfvideo); neues Outlook übernimmt
  .eml-Entwürfe nicht zuverlässig; Android: nur Mail-Apps mit Anlage über `ACTION_SEND` + `mailto`-Selektor.
- **Schwerpunkt Anhänge (Klaus):** Prüfung mit dem Prüfkern, den die Familienakte aus Workflow PDF schon hat (`dateiPruefen` in
  `app/wfpdf-kern.ts`, heute nur auf Wahl im Stapel); echtes PDF ohne Befund ohne Umweg über Workflow PDF mit einem Tipp; Befund →
  du entscheidest; Programme nicht übernehmen. Geplant, nicht gebaut.
- **Hilfe „E-Mail in die Familienakte“** als Landkarte: `app/landkarte.tsx` (Vorbild Modul-Topologie im Sage-Protokoll: Container
  mit Wege-Knöpfen, geschwungene Äste direkt am Kasten, → eine Richtung, ⇄ hin und zurück, Tipp nennt woher/wohin und Ort; Stand
  als Rahmen grün fertig · gelb gestrichelt im Bau · rot einschalten · grau gestrichelt geplant, Fläche blass, ⚠ Vorsicht;
  Geändertes seit dem letzten Öffnen golden), `app/email-hilfe.tsx`. Hilfe „Was funktioniert noch nicht vollständig?“ berichtigt.
- **Zur Abstimmung (Klaus mit Jens)**, eigenständige HTML-Dateien mit Stift-Notizen, die in der gespeicherten Datei bleiben:
  `docs/landkarte/Familienakte-Landkarte.html` (ganze App), `docs/landkarte/Familienakte-E-Mail-Karte.html` (E-Mail mit Empfehlung
  je Kasten 1/2/3/✗/? und Entscheidung Ja/Später/Weglassen/Frage), `docs/landkarte/Familienakte-E-Mail-Plan.html`.
  Vorschlag `docs/vorschau/landkarte-live.html` (https://claude.ai/artifact/WWEBvv5h9a5YPA4abY8UDS), Vorschau E-Mail
  (https://claude.ai/artifact/6F5FHeyrTogyA9aJ5rFe85).
- **Fassung 2.28.35:** Versionshistorie, Knopf „Neu“ mit „E-Mail in der Hilfe“, dazu das schon auf main liegende „● Neu“-Symbol.
- Plan: später Rückmeldungen anderer Nutzer über die Landkarte (nur Text annehmen, nichts ausführen).

## Geprüft

- Lint 0 Fehler (13 alte Warnungen), `npm run build`, `npm run check` grün; UI `email-hilfe` 22/0 (Desktop, Handy), `neu-knopf` 15/0,
  `hilfe-ordnung` 26/0, `hilfe-gestaltung` 22/0, `hilfe-zu` 7/0, `hilfe-neu-symbol` 4/0, `vollsicherung` 6/0.
- Abstimmungsdateien im Browser: Notiz/Entscheidung → Datei speichern → neu geöffnet, Inhalt da (auch mit „</script>“ im Text);
  keine Konsolenfehler; Handybreite ohne Querscrollen.
- CI #121 (4d52b5c) 3/3 grün, #122 (170360a) 6/6 grün.
- Unterwegs rot und behoben: Lint `prefer-const` in `app/landkarte.tsx` (lokal nur Build geprüft, nicht Lint); Pfeile endeten
  oberhalb der Kästen (Kantenliste zweimal erzeugt); Probe hing, weil der Vorschau-Server nicht beendet wurde.

## Ausgabe

AUSGABE_PLATZHALTER

## Nicht geprüft / offen

- Kein Gerät: Landkarte in der Hilfe am Handy und Tablet (Querrollen im Rahmen), Knopf „Neu“.
- E-Mail: nichts von Senden/Abholen gebaut. Erst Klaus' und Jens' Entscheidungen aus der E-Mail-Karte abwarten.
- Punkt 10 (Abgleich zwischen Geräten): Antworten u–z offen.

## Stundennachweis

Spanne aus Reflog- (Beginn), Commit- und Laufzeiten, Obergrenze; Pausen nicht abgezogen, Klaus' eigene Angabe geht vor. Zeiten in MEZ.

| Block | von | bis | Dauer | Inhalt |
|---|---|---|---|---|
| 1 | 17:36 | 17:42 | 6 min | Lesen, Brain holen, Wege nachprüfen, Vorschau, PR #121 |
| 2 | 17:42 | 18:47 | 65 min | Hilfe-Baum, Landkarte im Sage-Stil, Gesamtkarte mit Notizen |
| 3 | 18:47 | 19:28 | 41 min | Lint-Fix, E-Mail-Plan, E-Mail-Karte, Zusammenführen #121 |
| 4 | 19:28 | ENDE_PLATZHALTER | DAUER_PLATZHALTER | Fassung 2.28.35 (#122), Ausgabe, Nachweis, Abschluss, KimHub |

Zusammen: 17:36 (Reflog) bis ENDE_PLATZHALTER = **GESAMT_PLATZHALTER**.

## Startauftrag zum Einfügen

```
Familienakte – Sitzung 4 (Hilfe als Baum, Landkarte der App), Brief vom 07.11.2026.
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-07_EMAIL.md, docs/PLAN_2026-11-07.md (Punkte 6a, 7, 8, 10, „Weiter zu besprechen“),
dazu PR #121 (E-Mail-Plan, Hilfe als Landkarte) und PR #122 (Fassung 2.28.35).
Stand: 2.28.35 auf main und ausgegeben (APK, PWA, Windows; Nachweis docs/VEROEFFENTLICHUNG-2.28.35.json).
Erst die tatsächlichen Releases prüfen. Nächste freie Fassung 2.28.36.

Vorlagen aus Sitzung 3 (wiederverwenden, nichts doppelt bauen):
- app/landkarte.tsx: Landkarte im Sage-Stil (Container mit Wege-Knöpfen, geschwungene Äste direkt am Kasten, → eine Richtung,
  ⇄ hin und zurück, Tipp nennt woher/wohin und Ort in der App). Stand als Rahmen: grün fertig · gelb gestrichelt im Bau ·
  rot einschalten · grau gestrichelt geplant; Fläche blass in Rahmenfarbe; ⚠ für Vorsicht. Erstes Thema: app/email-hilfe.tsx.
- docs/landkarte/Familienakte-Landkarte.html: ganze App als Karte mit Stift-Notizen (Vorlage für den Gesamtbaum).
- docs/landkarte/Familienakte-E-Mail-Karte.html: E-Mail mit Empfehlung je Kasten (1 zuerst · 2 danach · 3 später · ✗ auslassen · ? besprechen)
  und Entscheidung per Stift (Ja · Später · Weglassen · Frage); Datei mit Notizen speichern und zurückschicken.

Auftrag Sitzung 4 (erst Plan- und Vorschaurunde, HTML-Vorschau zeigen, dann nach Klaus' Ja bauen):
1. „Landkarte der App“ als Hilfe-Thema: die ganze App aus Familienakte-Landkarte.html mit app/landkarte.tsx in die Hilfe;
   Stand je Kasten aus einer Liste im Code (wie status.json im Sage-Protokoll); Geändertes seit dem letzten Öffnen golden.
2. Hilfe als Baum: die übrigen Erklärungen (z. B. „Wo liegt was?“, „Akten sichern“, Kalender) nach und nach als Kästen und Bäume,
   kurzer Text, wenig Fließtext (Klaus: zu viel Text, zu wenig Bild und Verbindungen).
3. Vorschaufenster: Maus auf ein Hilfe-Thema → großes Fenster mit Bild der Stelle in der App, die Stelle rot markiert (Plan 6a Stufe 2).

Offen, nicht in dieser Sitzung bauen:
- E-Mail: Klaus bespricht E-Mail-Karte und E-Mail-Plan mit Jens; deren Entscheidungen/Notizen (zurückgeschickte HTML-Datei)
  abwarten und einarbeiten. Bau danach: zuerst Anhang-Prüfung mit dem Prüfer aus Workflow PDF (dateiPruefen), echtes PDF ohne
  Befund mit einem Tipp, Mail-App öffnen (Senden); danach Microsoft (Entra-Rechte Mail.Read/Mail.Send). Gmail-Abholen auslassen.
- Punkt 10 (Abgleich zwischen Geräten): Klaus' Antworten auf u–z in docs/vorschau/daten-2.28.34.html abwarten.
- Später: Landkarte für Rückmeldungen anderer Nutzer (nur Text annehmen, nichts ausführen).

Regeln: Sichtbare Änderungen erst als HTML-Vorschau. Je Paket ein Commit; Lint (npm run lint) vor dem Push; keine Prüfungen abschalten.
Codex-Durchsicht am PR auslassen. Nicht: Schlüssel/Tokens in Dateien oder Chat, Forschung im Repo (nur KimHub).
Am Ende Abschlussbrief mit Stundennachweis und Startauftrag, KimHub-Eintrag.
```
