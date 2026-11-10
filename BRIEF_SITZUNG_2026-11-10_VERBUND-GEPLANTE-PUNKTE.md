# Sitzungsbrief 10.11.2026: geplante Punkte der Pro-Verbund-Karte

Für die Sitzung **nach** dem Abarbeiten der gelben und orangen Punkte (Klaus 09.11.: „An den Punkten, die geplant sind, machst du
bitte für die danach folgende Sitzung … einen Sitzungsbrief“). Vorherige Sitzung: `BRIEF_ABSCHLUSS_2026-11-10_VERBUND-OHNE-ORANGE.md`.

## Ausgangslage

- Karte „Pro-App-Verbund“ (Quelle: BookLedgerPro `assets/pro-verbund.html`, Pflege nur dort, Kopie per `tools/verbund-nachziehen.mjs`)
  hat seit 10.11. **keinen orangen Weg mehr**. Stand in allen vier Apps byte-gleich (SHA-256 `eb857a6a…62b6cc0`):
  Familienakte 2.28.52, BookLedgerPro 0.1.14, Private Brain Pro 1.0.48, Workflow PDF Pro 1.0.16.
- **Gelb** heißt: veröffentlicht, am Gerät nicht zusammen geprüft. Diese Punkte brauchen Klaus' Gerätetest, keinen Bau.
- Übrig sind **grau** (geplant, nicht gebaut) und **rot** (geht heute nicht). Darum geht es hier.

## Die Punkte (Reihenfolge = Empfehlung)

| # | Weg (Kennung in der Karte) | Was fehlt | Repo | Vorher klären |
|---|---|---|---|---|
| 1 | `t-pb-wpp-mail` Mail mit Anhängen an Workflow PDF Pro | Workflow PDF Pro löst die PDF-/Bild-Anhänge einer `.eml` aus dem Eingang selbst heraus; Private Brain lässt dann `.eml` an WPP zu (`native/native-pro-verbund.js`, Zeile „target===workflow-pdf-pro“; WPP `native/pro-transfer-contract.js`). | WPP, PB | Klaus: nur PDF-Anhänge oder auch Bilder? Mailtext verwerfen? |
| 2 | `m-fa-chef` Chefcode-Kasten in der Familienakte | Der Baustein `native/pro-chefcode.js` braucht die Pro-Bedienung (`pro-bedienung.*`), die die Familienakte nicht hat. Weg: nur die nötigen Teile der Pro-Bedienung in die native Hülle laden oder den Kasten als React-Hülle um den Baustein bauen (Baustein byte-gleich lassen). `docs/PRO-BRUECKEN.md` Abschnitt 3. | FA | HTML-Vorschau zeigen (Regel „neue Entwürfe erst als Vorschau“). |
| 3 | `l-fa-blp-geld` Geldkarte Familienakte ↔ BookLedgerPro | Heute liest BLP Funde aus der Familienakte nur (`src/ui/tresorFund.js`). Geplant im BLP-Bauplan `docs/design/BAUPLAN-NEUAUSRICHTUNG-2026-11-09.md`. | BLP, FA | Bauplan lesen, Klaus' Fragen dort; großer Punkt, eigene Sitzung. |
| 4 | `l-alis-blp-app` / `l-wf-blpapp` (rot) Alis-Umsätze und WorkFloh-Rundlauf in die **native** BLP | Die Android-App nimmt keine Web-Adressen an. Weg wie im Karten-Text: dieselbe JSON als Datei über Teilen/„Öffnen mit“ annehmen (Intent-Filter + Übernahme-Ansicht, Vertrag v1/v2 unverändert). | BLP, Alis, WorkFloh | Klaus: welcher zuerst? |
| 5 | `l-alis-f2` Tagessummen Karte/Online (Alis Fassung 2) | Geplant in `Alis-Moderaum/CLAUDE.md`. | Alis | Repo `Alis-Moderaum` holen; Klaus' Wort. |

`fab-hinweis` (Basic ohne Tresor) bleibt grau: so gewollt, kein Bau.

## Nebenbei mitnehmen (klein)

- **BookLedger Basic** trägt noch die alte Karte (`3cbe20f1…`): mit `tools/pro-nachziehen.mjs --pro ../BookLedgerPro` nachziehen.
- Workflow PDF Pro **Android 1.0.15 gibt es nicht** (nur Windows 1.0.15); Android ging von 1.0.14 direkt auf 1.0.16. Nicht nachholen.
- Nach jedem gebauten Punkt die Karte in BookLedgerPro umfärben (grau → orange → nach Ausgabe gelb) und in alle Pro-Apps kopieren.

## Regeln, die gelten

- Kein Release ohne Klaus' Wort; veröffentlichte Fassungen nie erneut ausgeben (nächste freie: FA 2.28.53, BLP 0.1.15, PB 1.0.49, WPP 1.0.17).
- Byte-gleiche Bausteine nie von Hand ändern (Karte, Tresor-Paket, Tresor-Leser, Pro-Bedienung).
- Codex-Prüfungen auslassen. Keine Forschungseinträge hier (nur KimHub).
- Jede Sitzung endet mit Abschlussbrief samt Stundennachweis und Startauftrag.

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte (dazu je nach Punkt BookLedgerPro, Privat-Brain-Pro, Workflow-PDF-Pro mit add_repo).
Zuerst lesen: CLAUDE.md, BRIEF_SITZUNG_2026-11-10_VERBUND-GEPLANTE-PUNKTE.md, BRIEF_ABSCHLUSS_2026-11-10_VERBUND-OHNE-ORANGE.md,
Karte public/pro-verbund/pro-verbund.html (Quelle BookLedgerPro assets/pro-verbund.html).
Auftrag: die grauen/roten Wege der Pro-Verbund-Karte in der Reihenfolge des Briefs angehen. Vor jedem Punkt die Frage aus
Spalte „Vorher klären“ an Klaus stellen; neue Oberfläche erst als HTML-Vorschau. Je Punkt eigener Zweig und PR, Proben + Gegenprobe,
danach Karte in BookLedgerPro umfärben und in alle Pro-Apps kopieren. Nichts veröffentlichen ohne Klaus' Wort.
Nicht: veröffentlichte Fassungen erneut ausgeben, byte-gleiche Bausteine von Hand ändern, Codex anstoßen.
```
