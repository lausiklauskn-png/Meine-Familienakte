# Eigenes Postfach und Werkzeug-Übergabe – Vorbereitung (Klaus 2026-10-28)

Klaus: „dieselbe E-Mail-Übergabe-Übernahme und zwar ein eigenes E-Mail-Postfach, so wie bei Private Brain … falls man
E-Mails über dieses Programm einordnen will und weiterleiten will, dann nach BookLedgerPro und so weiter. PDF-Scanner und
so weiter. Alles integrieren … vielleicht so, dass man die Tools zusätzlich einlädt und die Daten nur übergibt und dann
wieder zurück.“ **Gebaut ist davon in dieser Sitzung nur der Boden**: die Übergabewege hinein (`docs/UEBERGABE.md`) und die
Hüllen, in denen ein Postfach und die Werkzeug-Übergabe später laufen. Dieser Plan hält fest, was aus den anderen Repos
übernommen werden kann und was Klaus entscheiden muss. Nichts davon verändert die Oberfläche des Freundes, solange Klaus
nicht Ja sagt.

## 1. Was heute schon geht

- **E-Mail als Datei**: eine `.eml` (aus Private Brain Pro „An … teilen“, aus Kim-sync, per Teilen-Ziel) landet in der
  Eingangszentrale wie jede andere Datei. Die Akte liest sie als Text (Dokumentart aus dem Inhalt, Vorschlag für den
  Lebensbereich). Anhänge einer `.eml` werden **noch nicht** einzeln herausgelöst (siehe 3a).
- **Werkzeuge hinein**: Workflow PDF Pro (Scan → PDF), BookLedgerPro, Kim-sync und jede andere App geben Dateien über
  Teilen / „Öffnen mit“ / Web Share Target ab (`docs/UEBERGABE.md`, offener Vertrag, auch für Apps von Codex o. a.).

## 2. Empfehlung: Werkzeuge einladen, Daten übergeben, zurückbekommen

Klaus' zweite Variante („Tools zusätzlich einlädt und die Daten nur übergibt und dann wieder zurück“) passt zur Regel
„Oberfläche des Freundes bleibt“: die Familienakte bekommt **keinen eigenen Mail-Client und keinen eigenen Scanner**, sondern

| Weg | hin | zurück | Vorlage |
| --- | --- | --- | --- |
| Scannen | Knopf „Mit Workflow PDF scannen“ öffnet `…/Workflow-PDF/?scan=1&von=Familienakte` (PWA) bzw. die Pro-App per Intent | das fertige PDF kommt per Teilen zurück und trägt die Marke „Workfloh PDF“ | BookLedgerPro `docs/WORKFLOW-PDF-EINBINDUNG.md`, `src/domain/workflowPdf.js` |
| Rechnung buchen | „An BookLedgerPro“ = Teilen der Datei (PDF/`.eml`) | BookLedgerPro meldet nichts zurück; die Akte merkt sich „übergeben am“ | Private Brain Pro `live-mail.js` Knopf `bookledger` |
| Mail ablegen | Private Brain Pro „An Familienakte teilen“ (`.eml`) – **ein eigener PR dort**, anderes Repo | – | derselbe `openOriginal`-Weg wie „An BookLedgerPro“ |
| Gemeinsamer Tresorordner | Fach `Familienakte/` und `Eingang-Familienakte/` im Paket `de.familyprojekt.tresor` | andere Pro-Apps legen Dateien ins Eingangsfach, die Akte liest es | Workflow PDF Pro `tresorordner.json`, BookLedgerPro `tools/native/tresor-nachziehen.mjs` |

Der Rückweg braucht in der Akte einen Knopf je Dokument („An … übergeben“). Das ist eine **sichtbare Änderung** (Abschnitt
F/G-Regel): erst nach Klaus' Ja, mit einem Satz je Knopf.

## 3. Eigenes Postfach „wie bei Private Brain“ – was es kosten würde

Private Brain Pro hat dafür: IMAP/SMTP nativ in Android (`ProMail`, Java, Konten im Keystore), unter Windows und in der PWA
einen privaten HTTPS-Dienst (`mail-service/`, Hetzner), Original-HTML in einer skriptfreien Sandbox, Papierkorb/Spam/Ordner,
Schutz-Prüfstelle, 12-Monats-Index über alle Konten. Das sind mehrere Tausend Zeilen plus Server.

a) **Kleiner Schritt (empfohlen, ohne Oberflächenänderung):** `.eml`-Leser in die Eingangszentrale: Kopfzeilen (Von, An,
   Betreff, Datum) als Steckbrief, Text als Inhalt, **jeder Anhang als eigener Eingang** mit Verweis auf die Mail. Vorlage
   byte-nah: BookLedgerPro `src/domain/mailEml.js` (rein, MIME beliebig tief). Probe mit erfundenen Mails aus
   `tests/testdateien/`.
b) **Mittlerer Schritt:** Mail-Abruf nur lesend über denselben nativen Adapter wie Private Brain Pro (Android `ProMail`,
   Windows später), Konten nur im nativen Dialog, nichts in localStorage. Braucht eine eigene Ansicht → Klaus' Ja.
c) **Voller Schritt:** Postfach wie Private Brain Pro. Nur sinnvoll, wenn die Familienakte eine Pro-App im Tresorordner wird.

## 4. Entscheidungen für Klaus (je ein Satz)

1. Soll die Akte Werkzeuge nur einladen (2.) statt ein eigenes Postfach (3c) zu bekommen? – Empfehlung: ja.
2. Darf 3a (Anhänge aus `.eml` einzeln in die Eingangszentrale) ohne sichtbare Änderung gebaut werden? – Empfehlung: ja.
3. Soll die Familienakte ein Fach im gemeinsamen Tresorordner der Pro-Apps bekommen (dann Pro-App mit Passwort)?
4. Welche Rückweg-Knöpfe dürfen in die Oberfläche: „Mit Workflow PDF scannen“, „An BookLedgerPro“, „An Private Brain Pro“?
