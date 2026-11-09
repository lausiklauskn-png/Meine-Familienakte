# Brücken zu den anderen Pro-Apps (09.11.2026)

Klaus' Freibrief vom 09.11.: „Nicht mehr nachfragen, selbstständig nach Logik und Nutzerfreundlichkeit entscheiden.“
Ziel: Aus BookLedgerPro (oder Private Brain Pro, Workflow PDF Pro) nach z. B. „Apotheke Rechnung“ suchen und erfahren,
dass die Familienakte etwas Passendes hat; E-Mails mit PDF-Anhang aus Private Brain Pro kommen in der Familienakte an.

## 1. Kurzfassung im gemeinsamen Pro-Tresor

- Beim Ablegen eines Originals im Pro-Tresor schreibt die Familienakte jetzt eine **Kurzfassung** ins gemeinsame
  Inhaltsverzeichnis (vorher leer, die anderen Apps fanden nur den Dateinamen).
- Form: `Titel · Bereich · Datum`, darunter der Anfang des gelesenen Textes; höchstens 1000 Zeichen
  (`lib/tresor-kurzfassung.ts`).
- **Geschützt:** Gesundheit & Pflege, Erbschaft/Vollmachten/Vorsorge und Titel mit Gesundheitswörtern tragen nur
  `Titel · Bereich · Datum` – kein Text, keine Notiz.
- Weg: `app/pro-tresor.ts` → `FamilienakteTresorPlugin` (Android) bzw. `ProTresorEngine` (Windows) →
  `ProTresorAdapter.ablegen(…, auszug)`. Das Tresor-Paket `de/familyprojekt/tresor` ist unverändert.
- Grenzen: Bereits abgelegte Originale behalten ihren leeren Eintrag (der Adapter erkennt gleiche Bytes und legt nicht
  doppelt ab). Das Inhaltsverzeichnis ist verschlüsselt, aber jede Pro-App mit dem Tresorpasswort kann die Kurzfassung lesen.
  Scan-Einzelbilder bekommen keine Kurzfassung.

## 2. E-Mail-Anlagen in beliebiger Tiefe

- „Anlagen in Warteschlange prüfen“ findet jetzt auch Anlagen in verschachtelten Teilen (`multipart/related` in
  `multipart/mixed`) und in weitergeleiteten Mails (`message/rfc822`).
- Dateinamen werden dekodiert: `=?UTF-8?B?…?=`, `=?UTF-8?Q?…?=` (RFC 2047) und `filename*=UTF-8''…`, auch in Stücken (RFC 2231).
- Inline-Bilder ohne Dateinamen (Logos) bleiben in der Mail. Herausgelöst wird weiter nur auf Tipp (Vorschau zuerst).
- Grenzen: kein S/MIME, keine verschlüsselten Mails, `.msg` (Outlook) nicht; Anlagen mit 8-Bit-Binärinhalt ohne Kodierung
  werden wie bisher als Text gelesen.

## 3. Im eigenen Netz antworten

Seite **Netz (Mycel)** → Kasten „Im eigenen Netz antworten“. Drei Schalter, alle **ab Werk aus**:

| Schalter | Wirkung |
|---|---|
| Im eigenen Netz antworten | Andere Knoten im eigenen Netz bekommen auf ihre Frage eine Zeile `Titel · Bereich · Datum`. |
| Mit Ausschnitt | Verglichen wird auch mit dem gelesenen Text; die Zeile trägt einen kurzen Ausschnitt um die Suchwörter (≤ 200 Zeichen). |
| Gesundheit einbeziehen | Gesundheit & Pflege und Vorsorge dürfen mitantworten (sonst bleiben sie draußen). |

- Geantwortet wird **nur in einem eigenen Netz** (Modul 23, Fenster „Verbinden …“ › „Netz“: Beitritts-Link oder Code).
  Der Filter prüft das bei jeder einzelnen Frage – wird das Netz auf öffentlich gewechselt, kommt keine Antwort mehr.
- Aus der Akte genommene Unterlagen antworten nie; die Demo antwortet nicht.
- Nach dem Neuladen ist das Antworten wieder aus (Verbinden nur auf Tipp); die Schalter Ausschnitt/Gesundheit bleiben gemerkt.
- Vektoren: Modul 03 (dasselbe Sprachmodell, mit dem Modul 04 die Frage einbettet), als `Float32Array`. Die Vektoren der
  Bedeutungssuche der Akte werden **nicht** benutzt: dort kann ein anderes Modell (768/1024 Werte) gewählt sein, Modelle
  werden nicht vermischt. Das Sprachmodell lädt beim ersten Einschalten aus dem Internet (wie beim Anlegen der Visitenkarte).
- **Chefcode** ist nicht eingebaut: der gemeinsame Baustein `pro-chefcode.js` braucht `pro-bedienung.js` (Kasten, Knöpfe der
  Pro-Apps), den die Familienakte nicht hat. Das eigene Netz kommt über den Netz-Kasten von Modul 23. Ein Chefcode-Netz der
  anderen Apps ist dasselbe eigene Netz, wenn derselbe Code eingegeben wird.
- Code: `lib/netz-antwort.ts` (Regeln, Filter), `app/netz-antwort.ts` (Ablauf), `app/netz-seite.tsx` (Kasten).

## Proben

- `scripts/run-pro-tresor-dokumente-tests.mjs` (Kurzfassung, Gesundheit ohne Text)
- `scripts/run-central-intake-tests.mjs` (verschachtelt, weitergeleitet, kodierte Namen)
- `scripts/run-netz-antwort-tests.mjs` (echtes Modul 04, gestelltes Modul 03/23: öffentlich verweigert, Netzwechsel → leer,
  Gesundheit, Ausschnitt, Float32Array) · UI `tests/ui/netz-mycel.test.mjs`
- **Nicht geprüft:** echtes Gerät, echtes Relais, echtes Sprachmodell, Antwort bei einer anderen Pro-App angekommen.
