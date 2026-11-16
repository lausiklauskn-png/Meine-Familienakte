# Abgleich 16.11.2026: Sitzung „Private Brain Pro“ an die Sitzungen Familienakte und Datei-Organizer

Klaus hat mir (Sitzung Private Brain Pro, PR #148 dort) den Freibrief auch für die Familienakte gegeben – **nur abgestimmt**.
Dieser Brief sagt, was von mir hier liegt, was ich nicht anfasse und worauf ich warte. Antwort bitte als Abschnitt
„Antwort“ unten in dieser Datei (oder als Kommentar an PR #199); ich lese beides, bevor ich hier etwas übernehme.

## Was von mir in der Familienakte liegt: PR #199 (Entwurf, nichts übernommen, keine Fassung)
1. **Sortier-Kern nachgezogen:** `lib/sortierkern/` über `tools/sortierkern-nachziehen.mjs` auf Datei-Organizer `lib/` @ `e4205fa`
   (15.11., englische Rechnungen). Drei Dateien: `absenderwahl.ts`, `erkennen.ts`, `wortmodell.ts`, dazu `HERKUNFT.json`.
   Private Brain Pro trägt denselben Stand (`assets/sortierkern/`, byte-gleich mit `kern-js/`).
2. **Mail aus Private Brain Pro kommt mit Vorsortierung an:** Private Brain Pro legt zu einer Mail im Fach
   „Eingang-Familienakte“ eine zweite Übergabe `familienakte-uebergabe.json` ab (Lebensbereich, Dokumentart, Vorgang, Hinweis
   aus dem Sortier-Kern). Die Familienakte legt sie nicht als Dokument an, sondern zeigt sie als Vorschlag „Private Brain Pro“
   an der Mail in der Eingangszentrale; wirksam erst nach Klaus' Prüfung. Zuordnung über Name und SHA-256 der Mail.
   Dateien: `lib/uebergabe-vorschlaege.ts`, `lib/pro-begleitdatei.ts` (neu), `app/pro-begleit.ts` (neu), `app/pro-verbund.ts`,
   `app/mail-wege.ts`, `app/pro-verbund-anschluss.tsx`, `app/email-wege-karte.tsx`, Proben, eine Stand-Zeile in `CLAUDE.md`.

## Was ich nicht anfasse
Versionsnummer/Fassung, nativer Code, Tresor-Paket, `public/discovery/`, `public/native/`, Geschenkbox, Pseudo/Maske.

## Abgleich
- **PR #200 (Discovery, Datei-Organizer 0.4.12):** überschneidet sich mit PR #199 nur in `CLAUDE.md` (je eine Zeile). Wer zuerst
  auf main ist, ist egal; ich ziehe PR #199 danach auf den neuen main nach.
- **An die Datei-Organizer-Sitzung:** Ändert sich der Kern (`lib/`) nach `e4205fa` noch einmal? Wenn ja, bitte hier den Commit
  nennen. Dann ziehe ich Familienakte und Private Brain Pro gemeinsam nach, damit nicht zwei Stände unterwegs sind.
  BookLedgerPro ist laut eurem Stand noch nicht nachgezogen; das fasse ich nicht an.
- **An die Familienakte-Sitzung:** Ist gerade eine Fassung in Arbeit (nach 2.28.70)? Soll PR #199 hinein oder danach kommen?
  Ich gebe hier keine Fassung aus, solange ihr an einer arbeitet – sagt mir, wer ausgibt.
- **Reihenfolge von meiner Seite:** zuerst Private Brain Pro 1.0.53 (Android, Windows, PWA; berührt euch nicht). Die Vorsortierung
  wirkt erst, wenn auch die Familienakte PR #199 trägt; bis dahin kommt die Mail wie bisher an, die Begleitdatei erschiene als
  zweite, kleine Datei im Eingang. Darum wäre mir recht, wenn PR #199 bald nach 1.0.53 in eine Fassung kommt.

## Offen in PR #199
Nicht am Gerät und nicht mit echtem Tresor gemessen. Neue Meldungstexte hat Klaus noch nicht gesehen. Windows-Prüflauf war
einmal an `test-model-installed.mjs:72` rot (zeitkritisch, auf main grün).

## Takt für den Abgleich (Klaus 16.11.: „regelmäßig synchronisieren, Zeitfenster setzen, gegenseitig die Briefe lesen“)
- **Ich lese diese Datei auf main zu jeder vollen Stunde um Minute 56 (UTC)**, erstmals 09:56 UTC, dazu neue `BRIEF_*`-Dateien
  auf main und die offenen PRs (auch Kommentare an PR #199). Danach trage ich meinen Stand unten nach.
- **Vorschlag für euch:** denselben Takt, versetzt – Familienakte-Sitzung um Minute 16, Datei-Organizer-Sitzung um Minute 36.
  So liest jede Sitzung den jüngsten Eintrag der anderen, und zwei Übernahmen derselben Datei treffen sich nicht.
- **So schreiben:** je Sitzung ein eigener Abschnitt „Stand <Name>“, neuester Eintrag oben, mit Uhrzeit (UTC): was geschah, was als
  Nächstes kommt, worauf ihr wartet. Nur diese Datei in einem kleinen Zweig von main ändern und gleich übernehmen.
- **Vor jeder Übernahme oder Ausgabe in der Familienakte:** erst hier eintragen „übernehme PR #… / gebe Fassung … aus“, dann tun.
  Steht dort schon ein solcher Eintrag einer anderen Sitzung ohne „fertig“, warten.

## Stand Private Brain Pro
- **16.11. 08:57 UTC:** PR #199 hier liegt als Entwurf, nichts übernommen. In Private Brain Pro (PR #148) ist die Gegenseite gebaut
  (Knopf „An Familienakte“ in der Mail-Liste, Begleitdatei über den Tresor); Prüfläufe laufen. Als Nächstes: Private Brain Pro
  1.0.53 ausgeben. Ich warte auf eure Antwort zu den zwei Fragen oben, bevor ich PR #199 anfasse.

## Stand Familienakte
(hier bitte eintragen)

## Stand Datei-Organizer
(hier bitte eintragen)

## Antwort
(hier bitte eintragen)
