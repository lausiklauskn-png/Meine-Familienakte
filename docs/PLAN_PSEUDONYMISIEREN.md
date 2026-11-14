# Plan Pseudonymisieren – Familienakte zuerst, komplett (14.11.2026)

Auftrag (Klaus, 14.11.2026; Brief im Datei-Organizer `docs/BRIEF_SITZUNG_2026-11-14_PLAN-TRAINING-MASKE.md`, Punkte 1–23):
Die Familienakte bekommt als **erste** App das ganze Paket – Profile im Pro-Tresor, Knopf **„Pseudonymisieren“ / „Zurückführen“**,
Mail und Anhänge mit Texterkennung, Export und **Kopieren-Knopf (Doppelblatt)**, Briefweg mit **Ordner-Weg** zu Claude Code/ChatGPT
und **Bezugsdokumenten**, nie doppelt pseudonymisieren, Landkarten. Danach die anderen Pro-Apps mit demselben Baustein.

Dies ist ein **Plan**, nichts davon ist gebaut. Sichtbares steht in der Vorschau `docs/vorschau/pseudonymisieren-plan.html`
(erfundene Beispieldaten). Klaus sagt je Frage (Abschnitt „Fragen an Klaus“) Ja oder Nein; erst dann Bau in Stufen, je Stufe ein PR,
gesammelt als **eine** Fassung (Klaus 11.11.; nächste freie Fassung 2.28.68).

**Harte Grenzen (stehen fest):** keine echten Dokumente und keine pseudonymisierten Texte in irgendein Repo (auch nicht in den
Codex-Briefkasten `docs/fremdpruefung/`); keine Schlüssel, PINs, Passwörter in Dateien oder im Chat; Gmail-Konnektor nie als
Quelle (liest Klartext an jeder Maske vorbei); kein neues Repo; nichts veröffentlichen ohne Klaus' Wort. Proben nur mit erfundenen
Daten (Nummern mit stimmender Prüfziffer, aber ausgedacht).

## Was es heute schon gibt (Bestand, nicht neu erfinden)

| Baustein | Wo | Was er kann | Grenze |
|---|---|---|---|
| **Modul 25** (Gen. 2) | `public/native/25_pseudonym.js`, byte-1:1 aus Sage über Private Brain Pro, Pin in `scripts/run-ki-auftrag-tests.mjs` | Platzhalter `⟦TYP-n⟧`, Fund nach Lage (keine Überlappung), IBAN mit Prüfziffer, Mail, Telefon, Betrag, Rechnungs-/Belegnummer, Datum, Schlüssel; `rehydrate`, `findLeak`, `suggestNames`, `serializeVault` | Namen nur aus mitgegebener Liste; keine deutschen Ausweis-/Steuer-/Versichertennummern mit Prüfziffer; nur Text, keine Bilder; keine Marke „schon pseudonymisiert“ |
| Familien-Muster | `lib/ki-auftrag.ts` `FAMILIEN_MUSTER` | Anschrift, PLZ + Ort, Telefon, Kennzeichen, „NUMMER“ (Buchstaben+Ziffern ab 8) | grobe Muster, keine Prüfziffern; „NUMMER“ trifft auch Harmloses |
| Namensmuster | `lib/namensmuster.ts` (aus BookLedgerPro `src/ai/namensmuster.js`) | Anrede, Kontext („z. Hd.“, „Patientin“), Vor- + Nachname, Firma mit Rechtsform; Richtung „im Zweifel verdecken“ | Nachname allein, GROSSBUCHSTABEN-Namen |
| Briefweg | `lib/brief-antwort.ts`, `app/brief-antwort.tsx` (2.28.49) | Brief einfügen/aus Unterlage → „Das sieht die KI“ → Kopieren, Direktlink ChatGPT/Claude, eigener Schlüssel Mistral (EU) → Antwort zurück, offene Platzhalter gemeldet, Entwurf/PDF | Ton nur als Freitext; kein Ordner-Weg; keine Bezugsdokumente; Zuordnung nur im Seitenspeicher; „Anhänge gehen nie an die KI“ |
| KI-Auftrag | `app/ki-auftrag-dialog.tsx`, `lib/ki-auftrag.ts` | „Dokument bearbeiten“: Unterlagen verdeckt an ChatGPT/Claude/Claude Code; Textebene oder OCR | einzelner Auftrag, kein Export |
| Ausfüllen | `app/ausfuellen-dialog.tsx` | PDF-Formular mit KI, verdeckt, OCR-Zeilen mit Lage (`ocrZeilen`) | – |
| Texterkennung | `app/wfpdf-kern.ts` (Tesseract `deu` aus dem Workflow-PDF-Klon), `dokumentTextLesen` | Textebene oder OCR, höchstens 5 Seiten, auf dem Gerät; **Wortkästen** (Lage) vorhanden | langsam, Vordergrund |
| Mail | `lib/central-intake.ts` (`parseEmlText`, `extractEmlAttachments` beliebig tief), `app/email-wege-karte.tsx`, `app/mail-versand.tsx`, Microsoft-Postfach (wartet auf Entra-Rechte) | .eml im Eingang mit Anlagen; Pakete von Private Brain Pro über `eingang-familienakte` | keine Pseudonymisierung an der Mail |
| Personen, Organisationen | `lib/family-data-model.ts` (`person`: Name, Rolle, Geburtsdatum, Anschrift, Mail, Telefon; `organisation`: Name, Art) | Stammdaten der Akte | keine Schreibweisen, keine Nummern, kein „darf bleiben“ |
| Pro-Tresor | Paket byte-gleich aus Workflow PDF Pro (`de.familyprojekt.tresor`: `VaultCrypto` AES-256-GCM, `Fach.java`) | Fächer je App + Eingangsfächer, ein Passwort | **kein gemeinsames Fach** für App-übergreifende Daten |
| Verschlüsselung im Browser | `lib/sicherung-krypto.ts` | AES-GCM-256, PBKDF2-SHA256 600 000 Runden, Notfallschlüssel | – |
| Bereinigen | `reinigung.js` im Klon | Metadaten aus Bildern/PDF entfernen | in der Akte nicht benutzt |

## Marktanalyse (Schritt 1)

Recherche 14.11.2026 (Quellen: Quelltexte von Presidio, LLM Guard, `stdnum`, `openredaction`; Herstellerseiten; Suchauszüge.
Nicht im Original gelesen: Google-infoTypes, Hugging-Face-Karten, endgültige EDPB-Fassung).

| Werkzeug | Lizenz · offline · Gerät | Urteil | Was wir nehmen |
|---|---|---|---|
| **Presidio** (jetzt `data-privacy-stack/presidio`, 2.2.366) | MIT · offline · nur Python | **Regeln übernehmen** (nach TS übertragen, Quelle nennen) | 13 deutsche Erkenner (Steuer-ID, Steuernr., USt-IdNr., RV-Nr., KVNR, Ausweis, Pass, Führerschein, Kfz, PLZ, Handelsregister, LANR, BSNR) mit Kontextwörtern; Prüfziffer „gültig/ungültig/unklar“ (unklar = abwerten, nicht verwerfen); Erkenner-Register, Allow-/Deny-Listen, Überlappung „längere gewinnt“ |
| **Google Sensitive Data Protection** | Cloud | Idee | deterministischer Ersatz (gleicher Wert = gleicher Platzhalter); **Surrogat-Marke**, die nie natürlich vorkommt → unsere Marke `⟦PSEUDONYMISIERT v1⟧` |
| **Private AI** (heute Limina) | proprietär, Container | nicht nutzbar | – |
| **Tonic Textual** | proprietär, Cloud | Idee | gleicher Wert → gleicher Ersatz über alle Dateien (feste Nummern je Profil) |
| **LLM Guard** (archiviert 07/2026) | MIT (Code) | Idee | Zuordnung: erst exakt gleichen Wert suchen, dann nächste Nummer; „immer“/„nie ersetzen“-Listen; Rückweg exakt |
| **Edge for Business + Purview, Chrome Enterprise Premium** | Firmenlösungen, Cloud-Richtlinien | nicht nutzbar | sie **blockieren**, statt zu pseudonymisieren |
| **Browser-Erweiterungen** (Caviard u. a.) | lokal, Regex | Idee | Umschalter Original ↔ verdeckt (→ unser Pseudo-Knopf) |
| **`stdnum`** (JS) | MIT · offline · läuft überall | **übernehmen** (Verfahren) | Prüfziffern Steuer-ID, Steuernr., RV-Nr., USt-IdNr., Ausweis, Pass, IBAN, BIC; KVNR selbst ergänzt |
| **OpenMed-PII-German** (ONNX) | Apache-2.0 · offline · Browser/Android | **später prüfen** | erkennt Namen ohne Muster; klinisch trainiert, Treffer bei Familienpost ungeprüft, 110–568 Mio. Parameter |
| GLiNER-PII, Piiranha, ai4privacy, spaCy/Flair, nedap | zu groß / nicht-kommerziell / Python | nicht nutzbar | – |
| **Schwärzen in PDF** | pdf.js + pdf-lib + tesseract.js (frei) · MuPDF (AGPL) | **übernehmen** (ohne MuPDF) | Seite rastern, Wortkästen füllen, neues PDF – nie Kasten über Textebene |

**Recht (Bau-Folgen):** DSGVO Art. 4 Nr. 5 – Zuordnung getrennt und geschützt halten; Art. 9 – KVNR, Arztbriefe, ICD sind
Gesundheitsdaten; EDPB-Leitlinien 01/2025 – geheimer Schlüssel (HMAC) statt einfachem Hash für Fingerabdrücke; EuGH C-413/23 P –
für den Empfänger ohne Zuordnung nicht zwingend personenbezogen, für uns mit Zuordnung schon.

**Folgen für den Bau:** Nummern im Profil als HMAC-SHA-256 mit Geräte-Geheimnis; vorhandene Platzhalter vor jeder Erkennung ausnehmen
(Modul 25 tut das); OCR-Text vor der Prüfziffer angleichen (O↔0, I/l↔1, offen); kein Cloud-Dienst, kein großes Modell im ersten Schritt.

## Stand 14.11.2026: gebaut in 2.28.68 (Klaus' Freibrief 14.11.: „Fragen beantwortest du selber“)

- **Knopf „Pseudo“** (`app/pseudo-knopf.tsx`) oben im Kopf: grün mit „an“, rot mit „aus“ (Klaus 14.11.); Zustand je Gerät gemerkt.
  Am Handy liegt „Neu“ dafür in der Aufklappleiste hinter „‹“ (Klaus 14.11.: „Neu muss nicht unbedingt oben mit sein“).
  Aktiv: Fenster „Pseudonymisieren“ oben auf jeder Seite – Dateien einfügen (Text, PDF mit Textebene, Foto/Scan mit Texterkennung auf dem
  Gerät, **E-Mail .eml mit allen Anhängen**) oder Text einfügen → Fassung mit Marke, **Kopieren** (Doppelblatt), **als Textdatei**,
  **Zurückführen** einer KI-Antwort, „Korrigieren“ (immer verdecken / darf bleiben, nur für die Sitzung).
- **Maske** (`lib/maske.ts`, auf Modul 25 – das byte-gleich bleibt): Steuer-ID, KVNR, RV-Nr., Ausweis/Pass mit Prüfziffer, USt-IdNr.,
  Geburtsdatum, Kunden-/Vertrags-/Versicherungsnummer mit Feldwort, ICD-Code mit Gruppe; Daten, Beträge, Firmen mit großer Rechtsform und
  Organisationen der Akte bleiben; Kleinunternehmen (e.K., GbR, UG) werden verdeckt; Personen der Akte samt Nachname immer verdeckt;
  Marke `⟦PSEUDONYMISIERT v1⟧`, zweiter Durchlauf byte-gleich. Kein Netzweg (Probe prüft Quelltext und zählt Netzaufrufe = 0).
- **Basic (PWA):** dieselbe Maske, **keine gespeicherten Profile** (nur Namen der Akte und Muster), Hinweis „für eigene Nummern und
  Gesundheitsdaten die Pro-App“. Begründung: Basic soll Lust auf Pro machen und sofort testbar sein; gespeicherte Profile im Browser wären
  das größere Risiko (fremde Erweiterungen, Code bei jedem Laden vom Server).
- Proben: `scripts/run-maske-tests.mjs` (in `build`/`check`), UI `tests/ui/pseudo-knopf.test.mjs` (Handy und PC).
- **Bauplan für Sage:** Die Verbesserungen sind als Bauplan „Modul 25 Gen. 3“ im Sage-Protokoll festgelegt; bis Sage sie übernimmt,
  liegen sie in der Familienakte als Schicht über Modul 25.

### Entscheidungen zu P1–P15 (Claude, mit Klaus' Freibrief)

P1 Ja, aber Stufe D vorgezogen als Pseudo-Knopf (2.28.68) · P2 Ja (Bauplan Sage) · P3 Ja, Fach `profile` (nächster Schritt) · P4 Basic
ohne gespeicherte Profile (statt Fingerabdrücke) · P5 Ja · P6 Unsichere werden verdeckt und gelb gezeigt (kein Sperren) · P7 Ja (heute
Textdatei) · P8 Ja (Gruppe) · P9 Daten bleiben; Geburtsdatum ganz verdeckt (sicherer als Jahr) · P10 Ja (mit dem Fach `profile`) ·
P11 Ja · P12 Ja, Bezugsdokumente ab Werk angehakt · P13 Ja (nur privater Weg) · P14 Ja · P15 „Pseudo“ im Knopf, „Pseudonymisieren“ /
„Zurückführen“ im Fenster.

**Offen (nächste Stufen):** Profile im Pro-Tresor (C), Knopf an Unterlage/Auswahl/Mail im Eingang, Austauschordner und Bezugsdokumente (E),
„Alles pseudonymisieren“ mit Sortier-Datei (F), Bilder schwärzen (G), Pro-Verbund-Karte in BookLedgerPro, danach die anderen Pro-Apps.

## Grundsätze

1. **Ein Baustein, viele Knöpfe.** Erkennen, Ersetzen, Zurückführen, Marke und Profile sind **ein** Baustein („Maske“). Knopf an der
   Unterlage, an der Mail, an einer Auswahl, im Briefweg, „Alles pseudonymisieren“ – alle rufen denselben Baustein. Später byte-gleich
   mit Pin in allen Pro-Apps (Frage P2), nie nachbauen.
2. **Profil zuerst, Muster danach.** Was in einem Profil steht, wird **immer** erkannt (auch Schreibvarianten). Muster und Prüfziffern
   fangen Unbekanntes. Unsicheres wird angezeigt, nicht still durchgelassen.
3. **Zuordnung und Profile verlassen das Gerät nie.** Der Baustein hat **keinen Netzweg** (kein `fetch`, kein Worker mit Netz, keine KI).
   Eine Prüfung im Bau belegt das (wie `check:herkunft`), eine UI-Probe zählt die Netzaufrufe beim Pseudonymisieren (= 0).
4. **Hinaus geht nur die pseudonymisierte Fassung**, und nur nach `findLeak` = sauber. Das Original wird nie kopiert oder exportiert.
5. **Zurückführen nur auf dem Gerät**, mit der gespeicherten Zuordnung des jeweiligen Auftrags.
6. **Nie doppelt:** jede pseudonymisierte Fassung trägt eine **Marke**; was eine Marke trägt, wird nicht noch einmal verarbeitet,
   Platzhalter werden nie für Namen gehalten.
7. **Ehrlich über Grenzen:** Pseudonymisieren ist kein Anonymisieren (DSGVO Art. 4 Nr. 5 – mit der Zuordnung bleibt es Personenbezug).
   Die App sagt das in einem Satz hinter dem „?“.

## Wie es aussieht (Kurzfassung, Einzelheiten in der Vorschau)

- **Profile** (Sicherheitscenter → „Profile für die Maske“): Ich · Familie · Kontakte · Stellen. Erster Start: „Aus einer anderen
  Pro-App übernehmen“ oder „Selbst anlegen“ – und „Aus meiner Akte vorschlagen“ (Personen/Organisationen der Akte). Je Eintrag:
  Name und Schreibweisen, Anschrift, Geburtsdatum, Nummern (nur Fingerabdruck, angezeigt „DE…1234“), Schalter
  **„immer verdecken“ / „darf bleiben“** (Stellen ab Werk „darf bleiben“). Zeile oben: „🔒 Profile verlassen dieses Gerät nie.“
- **Knopf „Pseudonymisieren“** an jeder Unterlage (Aufklappleiste), an der Mail im Eingang (Text **und** Anhänge), an der Auswahl-Leiste.
  Öffnet „Das sieht die KI“: links Original mit farbig markierten Stellen, rechts die Fassung mit Platzhaltern; je Stelle
  **„Korrigieren“** (verdecken / darf bleiben → ins Profil merken). Unten: **Kopieren** (Doppelblatt-Symbol), **Exportieren**, **An KI …**
- **Knopf „Zurückführen“**: Antwort einfügen oder Antwort-Datei holen → echte Angaben wieder drin, unbekannte Platzhalter gemeldet.
- **Briefweg** (Assistenz): Ton als feste Knöpfe, Bezugsdokumente zum Abwählen, Weg wählen (Kopieren · Direktlink · Ordner · eigener
  Schlüssel).
- **„Alles pseudonymisieren“** (Sicherheitscenter oder Bibliothek): ganzer Bestand oder Auswahl → Ordner mit Inhaltsliste → KI legt
  Sortier-Datei zurück → Vorschläge an den echten Unterlagen → Bestätigen.

## Stufen

### A · Vorschau und Plan (diese Sitzung)

`docs/vorschau/pseudonymisieren-plan.html` und dieser Plan. Klaus antwortet je Frage.

### B · Erkennung verbessern (reine Rechnung, Node-Proben)

- **Prüfziffern statt grober „NUMMER“** (Punkt 14/15): IBAN (gibt es), **Steuer-ID** (11 Ziffern, ISO 7064 MOD 11,10),
  **Krankenversichertennummer** (Buchstabe + 9 Ziffern, Prüfziffer), **Rentenversicherungsnummer** (12 Stellen mit Geburtsdatum
  und Buchstabe, Prüfziffer), **Personalausweis-/Passnummer** (Prüfziffer 7-3-1), **USt-IdNr.** (DE + 9 Ziffern), **BIC**,
  **Steuernummer** (Länderformate, nur mit Wort „Steuernummer/StNr“ davor), **Kennzeichen** (vorhandenes Muster), Kunden-/Vertrags-/
  Versicherungsnummer **nur mit Feldwort davor** („Kundennr.“, „Vertrag“, „Policen-Nr.“). Ohne stimmende Prüfziffer und ohne Feldwort:
  **Unsicher** – angezeigt, Nutzer entscheidet (Richtung „im Zweifel verdecken“ bleibt für Text, der hinausgeht).
- **Anschriften:** Straße + Hausnummer (gibt es), PLZ + Ort (gibt es), dazu Postfach, „c/o“, Zeilenblock Anschrift im Briefkopf (der
  Briefkopf-Baustein `lib/briefkopf-titel.ts` kennt die Lage des Empfängerfelds).
- **Geburtsdatum:** Datum nach „geb.“, „geboren am“, „Geburtsdatum“ oder = Geburtsdatum aus einem Profil → nur das Jahr bleibt
  (`⟦GEBURTSJAHR 1981⟧`, Frage P9). Andere Daten bleiben stehen (Sortieren, Fristen) – Abkehr von „Datum ab Werk verdeckt“ in Modul 25.
- **Gesundheit (Art. 9):** ICD-10-Codes (`[A-TV-Z]\d{2}(\.\d{1,2})?` mit Kontext „Diagnose/ICD/Befund“) je Wahl bleiben · werden zur
  Gruppe (Kapitel, z. B. „Kreislauf“) · werden ersetzt (Frage P8). Arzt- und Praxisnamen sind Personen/Stellen im Profil.
- **Marke** (Punkt 16): Kopfzeile `⟦PSEUDONYMISIERT v1 · Maske a1b2⟧` im Text; in exportierten Dateien zusätzlich in der Inhaltsliste
  und im Dateinamen (`… (pseudonymisiert).txt`); in PDF als Schlüsselwort in den Metadaten. Erkennung: Marke **oder** ≥ 3 gültige
  Platzhalter. Probe: pseudonymisierte Datei erneut hinein → **byte-gleich unverändert**, Meldung „schon pseudonymisiert“.
- **Platzhalter** bleiben in der Form von Modul 25 `⟦TYP-n⟧` (bewährt, KI verwechselt sie selten), Typen mit Sinn für die KI:
  `⟦ICH⟧`, `⟦FAMILIE-1⟧`, `⟦KONTAKT-1⟧`, `⟦STELLE-1⟧`, `⟦IBAN-1⟧`, `⟦ANSCHRIFT-1⟧` … (Frage P5). Profil-Einträge bekommen eine
  **feste** Nummer (gleiche Person = gleicher Platzhalter in allen Exporten; wichtig für Sortieren und Training).
- **Wo der Code entsteht:** Frage P2. Vorschlag: Prüfziffern und Marke als **Modul 25 Gen. 3 in Sage** (Quelle bleibt Sage, neuer
  Pin, alte Aufrufe bleiben gültig), Profil-Abgleich als eigener Baustein daneben; die Familienakte baut und prüft zuerst, Sage übernimmt
  denselben Stand, dann Pin.
- **Proben:** `scripts/run-maske-tests.mjs` – je Sorte Treffer und Nicht-Treffer (falsche Prüfziffer), Rückweg, Marke, Leck,
  Gegenprobe gegen die bisherigen Proben von `ki-auftrag`/`brief-antwort` (dürfen nicht schlechter werden).

### C · Profile im Pro-Tresor

- **Datenmodell** `lib/maske-profil.ts`: Eintrag = { Art: ich/familie/kontakt/stelle, Anzeige (Name), Schreibweisen, Anschrift,
  Geburtsjahr/-datum, Nummern-Fingerabdrücke, Regel immer verdecken / darf bleiben, feste Platzhalter-Nummer, Bezug auf
  Akte-Eintrag (`PER-…`, `ORG-…`) }. **Keine Doppelung:** Personen/Organisationen der Akte werden **verknüpft**, nicht kopiert
  (Name/Anschrift kommen aus der Akte; das Profil hält nur das Zusätzliche).
- **Fingerabdruck für Nummern** (Brief b): Nummer normalisieren (ohne Leer-/Bindestriche, groß) → HMAC-SHA-256 mit einem
  **Profil-Geheimnis** (32 Zufallsbytes, liegt verschlüsselt mit den Profilen) → gespeichert werden nur der Fingerabdruck, die Sorte und
  die letzten 4 Zeichen. Im Text werden alle Kandidaten gleicher Sorte berechnet und verglichen. Grenze, offen benannt: kurze Nummern
  sind ohne das Geheimnis nicht zu raten, mit Geheimnis schon – darum liegt es nur verschlüsselt im Tresor.
- **Speicher:** Pro-Tresor, verschlüsselt wie dort (AES-256-GCM, Schlüssel nur auf dem Gerät). Ohne Pro-Tresor (Akte nur im App-Speicher)
  im eigenen verschlüsselten Datensatz der Akte (`app/local-vault.ts`), mit Hinweis „Tresor einrichten“. **Gemeinsam für alle Pro-Apps**
  braucht es ein neues Fach `profile` im Tresor-Paket (Quelle Workflow PDF Pro, `Fach.java`, byte-gleich nachziehen) – Frage P3.
- **Übernehmen oder selbst anlegen** (Entscheidung Klaus 14.11.): beim ersten Öffnen drei Knöpfe – „Aus meiner Akte vorschlagen“,
  „Aus einer anderen Pro-App übernehmen“ (liest das Fach `profile`), „Selbst anlegen“. Ohne Familienakte legt jede App ihre Profile
  selbst an; kommt die Familienakte dazu, bietet sie **Zusammenführen** an (gleiche Anzeige + gleicher Fingerabdruck = ein Eintrag).
- **Korrigieren** (Nachtrag 14.11.): im Fenster „Das sieht die KI“ je Stelle „das hier verdecken“ / „das darf bleiben“ → wird als
  Schreibweise bzw. „Nie verdecken“ ins passende Profil gemerkt (wie BookLedgerPro „Weitere Namen“ / „Nie verdecken“).
- **Basic (PWA)** (Brief, Frage P4): Vorschlag – Profile ja, aber **nur Fingerabdrücke** (auch Namen als Fingerabdruck von Wortfolgen,
  angezeigt nur Anfangsbuchstaben), verschlüsselt im Browser mit eigenem Passwort; Hinweis „Für Gesundheits- und Bankdaten die Pro-App
  nehmen“. Strenge Sicherheitsregel der Seite (CSP `connect-src` nur eigene Adresse plus ausdrücklich gewählte KI-Adressen).
- **Seite „Was mit deinen Profilen passiert“** (Brief e) hinter dem „?“ und in `public/datenschutz.html`.
- **Proben:** Fingerabdruck stimmt/stimmt nicht, kein Klartext der Nummer im gespeicherten Datensatz (Probe liest die Bytes),
  Übernehmen ohne Doppelungen, Netzaufrufe = 0.

### D · Knopf „Pseudonymisieren“ / „Zurückführen“, Mail mit Anhängen, Kopieren und Export

- **Knopf an der Unterlage** (Aufklappleiste `KnopfLeiste`), **an der Auswahl** (`app/auswahl-leiste.tsx`) und **an der Mail** im Eingang.
- **Mail:** Kopf (Absender, Empfänger, Betreff), Text und **jede Anlage** (`extractEmlAttachments`). PDF mit Textebene direkt; Bild/Scan
  → Texterkennung auf dem Gerät (Tesseract aus dem Klon, im Hintergrund wie im Plan Bilder Stufe C), dann pseudonymisiert. Gilt für
  empfangene und gesendete Mails (gesendete aus `app/mail-versand.tsx`, .eml im Eingang). Ergebnis: eine Datei je Mail mit Anlagen
  als Abschnitte, Inhaltsliste.
- **Bilder schwärzen** (Brief Punkt 11, größter Teil): Stufe G, nicht hier. In D gibt es vom Bild nur die **Text**-Fassung.
- **„Das sieht die KI“**: Original und Fassung nebeneinander (am Handy umschaltbar), Stellen farbig nach Sorte, Zähler
  „23 verdeckt · 2 unsicher“, unsichere Stellen gelb mit „Korrigieren“. Nichts geht hinaus, solange eine unsichere Stelle offen ist –
  oder Haken „Unsichere so lassen“ (Frage P6).
- **Kopieren** mit dem Doppelblatt-Symbol (zwei übereinanderliegende Blätter, Strichgrafik wie die übrigen; heißt im Code `Copy`
  aus lucide) – an jeder pseudonymisierten Fassung, kopiert **nur** die Fassung mit Marke.
- **Exportieren:** Ordner (auf dem gewählten Laufwerk/ Austauschordner) oder **eine** Textdatei; ZIP nur auf Wahl (Frage P7).
  Inhalt: je Unterlage `.txt` (oder `.md`), `inhalt.json` (Liste mit Art, Datum, Bereich-Vorschlag, Platzhaltern – keine Klarnamen),
  `LIES-MICH.txt` („pseudonymisiert, Zuordnung bleibt auf dem Gerät“).
- **Zurückführen:** Antwort einfügen oder Antwort-Datei wählen → `rehydrate` mit der Zuordnung dieses Auftrags. Die **Zuordnung je
  Auftrag** wird verschlüsselt mit den Profilen gespeichert (heute nur im Seitenspeicher – nach Neustart verloren), Ablauf nach 90 Tagen
  oder „Auftrag erledigt“ (Frage P10).
- **Proben:** UI-Probe mit erfundener Mail + Bildanlage (OCR gestellt), Kopieren enthält Marke und keinen Klartext, Export-Ordner ohne
  Klartext (Probe durchsucht alle Dateien nach den Klarwerten), Zurückführen, zweite Runde unverändert.

### E · Briefweg ausbauen (Punkte 21, 22)

- **Ton als feste Knöpfe** (mehrfach wählbar) statt nur Freitext: formaler · freundlicher · bestimmter/strenger · kürzer · ausführlicher ·
  einfache Sprache; Freitext bleibt zusätzlich.
- **Ordner-Weg:** ein **Austauschordner** `KI-Austausch` auf einem gewählten Laufwerk – nie im Pro-Tresor, nie in einem Repo.
  Die App legt je Auftrag `auftraege/<datum>-<kurz>/auftrag.md` (Auftrag + Ton + Brief pseudonymisiert) und `bezug/…` ab.
  - **Claude Code**: der Ordner am PC wird über Remote Control freigegeben (Claude-App → Einstellungen → Claude Code → Remote Control);
    die Sitzung liest nur diesen Ordner und schreibt `antwort.md` daneben. Die Familienakte (Windows) sieht beim Öffnen/auf Knopf
    „Antworten holen“ nach, führt zurück und zeigt den Entwurf.
  - **ChatGPT/Claude im Browser**: `auftrag.md` (bei Bezugsdokumenten **eine** zusammengefasste Datei) hochladen; die Antwort als Datei
    speichern und in den Ordner legen – oder einfügen wie heute.
  - Am Handy: Austauschordner auf SD/Gerät oder im Cloud-Ordner (OneDrive), sonst Kopieren.
- **Bezugsdokumente** (Punkt 22): die App schlägt vor, was zur Sache gehört – gleicher **Vorgang**, gleiche **Stelle/Organisation**,
  **Vertrag**-Einträge, frühere Korrespondenz derselben Sache, Unterlagen mit „AGB/Bedingungen/Nutzungsbedingungen/Tarif“ im Titel.
  Anzeige vor dem Senden mit Haken je Datei (abwählbar), Größe. **Öffentliche Texte** (AGB, Bedingungen) dürfen unverändert mit –
  Vorschlag: sie laufen trotzdem durch die Maske (Stellen „darf bleiben“, ändert also nichts außer versehentlichen Personendaten);
  eigene Verträge und Briefe immer pseudonymisiert (Frage P12). Der Auftrag bittet um **Quellenangabe** („nach Bezug 2, § 5 Abs. 2“);
  die App zeigt sie als Sprung zum Dokument.
- **Eigene Schlüssel für Claude und ChatGPT** wie heute für Mistral (Frage P11): Schlüssel nur in der App (Pro: im Tresor; Basic:
  nur für die Sitzung), nie im Chat, nie in der Sicherung. Vor dem Senden die Frage „N Angaben verdeckt. Jetzt an … senden?“ (gibt es).
- **Proben:** Ordner-Weg mit gestellter Antwort-Datei, Bezugsdokumente abwählbar, Quellenangabe als Sprung, Ton im Auftrag.

### F · „Alles pseudonymisieren“ → KI sortiert → zurück (Punkt 20)

- Knopf im Sicherheitscenter und in der Bibliothek: ganzer Bestand, ein Bereich oder die Auswahl → Export wie D in den Austauschordner,
  mit Inhaltsliste und Marke, **in Blöcken** (wie Eingangsordner, 20/Block), mit Anhalten/Weitermachen.
- **Sortier-Datei** zurück (`sortierung.json`, festes Schema, nur Platzhalter): je Datei Kennung, Bereich, Art, Absender-Rolle
  (`⟦STELLE-3⟧`/„Krankenkasse“), Frist, Wichtigkeit, Begründung kurz. Die App prüft das Schema (fremde Daten, keine Anweisungen),
  zeigt die Vorschläge an den **echten** Unterlagen (wie „Zuordnung prüfen“) und übernimmt erst nach Bestätigung.
- **Lehrdaten:** jede Bestätigung/Korrektur wird als **pseudonymisiertes** Lehrdatum gesammelt (Datei im Austauschordner, nie im Repo)
  für den Datei-Organizer (`scripts/briefmodell-abstimmen.mjs`); das neue Wortmodell kommt wie heute über `sortierkern-nachziehen`.
  Erst Stichprobe (20 Dateien), dann alles.
- **Codex:** der Briefkasten `docs/fremdpruefung/` ist kein Weg für pseudonymisierte Texte; ein privater Weg für Codex ist offen (P13).

### G · Bilder und Scans schwärzen (Brief Punkt 11)

- Texterkennung mit Wortkästen (`ocrZeilen`) → Stellen der Funde im Bild **schwarz übermalen** → neues Bild/PDF **gerastert** (keine
  Textebene, keine alten Metadaten; `reinigung.js` aus dem Klon). Nie nur ein schwarzer Kasten über einer PDF-Textebene.
- Vorschau des geschwärzten Bildes, Korrigieren wie D. Mit Plan Bilder (Stufe C Nacharbeit) zusammen bauen.
- Grenze: Handschrift, schräge Fotos, Stempel – die Texterkennung sieht sie nicht; deshalb Anzeige „Bild geprüft: N Stellen, Handschrift
  nicht erkennbar“.

### H · Landkarten, Hilfe, Fassung (Punkt 18)

- Landkarte der Familienakte: Kasten **„Maske“** (Profile, Knopf, Zurückführen, Austauschordner), Stand in `lib/app-stand.ts` – zuerst
  grau „geplant“, dann je Stufe.
- **Pro-Verbund-Karte:** nur in BookLedgerPro pflegen (Quelle), Kasten „Maske – Profile aus der Familienakte“, Wege Familienakte → andere
  Apps (Fach `profile`); danach byte-gleich nachziehen. Landkarte des Datei-Organizers ebenso (dort).
- Geschenkbox neu bauen (`node tools/geschenkbox-datei.mjs`, HTML-Datei im Chat, Artefakt neu).
- Hilfe-Thema „Pseudonymisieren“ mit Ablaufbild; Fassung in `lib/fassungen.ts`.

### Danach: die anderen Pro-Apps (Punkt 17)

Reihenfolge-Vorschlag (Frage P14): **Private Brain Pro** (Mail, Anhänge, T-Online/IMAP – dort entsteht die KI-Sicht für das Training) →
**BookLedgerPro** (Belege; `namensmuster.js`, „Weitere Namen“/„Nie verdecken“ werden zu Profilen) → **Workflow PDF Pro** (Schwärzen) →
**Datei-Organizer** (lernt nur aus pseudonymisierten Daten). Je App: Baustein byte-gleich mit Pin, Knopf, Probe und Gegenprobe.

## Fragen an Klaus (je Ja/Nein)

- **P1 Reihenfolge der Stufen** B → C → D → E → F → G → H, gesammelt als eine Fassung (oder nach D eine Zwischenfassung zum Gerätetest)?
- **P2 Quelle des Bausteins:** Prüfziffern und Marke als Modul 25 Gen. 3 **in Sage** (Familienakte baut und prüft zuerst, dann Pin),
  Profil-Abgleich als eigener Baustein daneben – ja?
- **P3 Gemeinsames Fach `profile`** im Tresor-Paket (Quelle Workflow PDF Pro, byte-gleich in alle Pro-Apps nachziehen) – ja? Sonst
  liegen die Profile im Fach `familienakte`, und andere Apps bekommen sie nur über eine Übergabe-Datei.
- **P4 Basic (PWA):** Profile anbieten – nur als Fingerabdrücke mit eigenem Passwort und Hinweis „für Gesundheit/Bank die Pro-App“?
  Oder in Basic gar keine Profile (nur Muster)?
- **P5 Platzhalter mit Rolle** (`⟦ICH⟧`, `⟦FAMILIE-1⟧`, `⟦STELLE-2⟧`) und **feste Nummern** je Profil-Eintrag über alle Exporte – ja?
- **P6 Unsicheres:** Hinausgehen erst, wenn alle gelben Stellen entschieden sind – mit Haken „Unsichere so lassen (verdecken)“ als Abkürzung?
- **P7 Export:** Ordner oder eine Textdatei; ZIP nur auf ausdrückliche Wahl – ja?
- **P8 Gesundheit:** ICD-Code ab Werk **zur Gruppe** (Kapitel), je Nutzer umstellbar auf „bleibt“/„ersetzt“ – ja?
- **P9 Datum:** Daten bleiben stehen (Sortieren, Fristen), **Geburtsdaten** nur als Jahr – ja?
- **P10 Zuordnung je Auftrag** verschlüsselt speichern (damit „Zurückführen“ auch nach Neustart geht), löschen nach „erledigt“ oder
  spätestens 90 Tagen – ja?
- **P11 Eigene Schlüssel** auch für Claude und ChatGPT (wie Mistral), Pro im Tresor – ja?
- **P12 Bezugsdokumente:** auch öffentliche Texte (AGB) laufen durch die Maske (Firmen bleiben) – ja? Bezugsdokumente ab Werk angehakt
  oder ab Werk aus?
- **P13 Codex:** privater Weg für pseudonymisierte Stapel (z. B. derselbe Austauschordner, Datei von Hand übergeben) – oder Codex
  bekommt keine pseudonymisierten Texte?
- **P14 Danach** Private Brain Pro → BookLedgerPro → Workflow PDF Pro → Datei-Organizer – ja?
- **P15 Name des Knopfs:** „Pseudonymisieren“ / „Zurückführen“ (wie im Brief) – oder kürzer „Verdecken“ / „Zurück“ (Wort
  „verdeckt“ steht heute schon in der App)?
- **M1–M5** (aus der Marktanalyse, siehe dort).

## Was nicht

- Keine Cloud-Dienste zum Erkennen (Google DLP, Private AI, Tonic): Text verlässt sonst unpseudonymisiert das Gerät.
- Kein Gmail-Konnektor, kein neues Repo, keine echten oder pseudonymisierten Texte in einem Repo, keine Schlüssel im Chat.
- Kein stilles Übernehmen der Sortier-Datei; kein Senden mit offener Leckmeldung.
- Kein Nachbau des Bausteins in einer anderen App – nur byte-gleich mit Pin.
