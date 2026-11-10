# Sitzungsbrief: Kurzhinweise, rote und graue Kästen der Landkarte, restliche Punkte (nach 2.28.56)

Klaus 10.11.2026, Bild vom Tablet (Familienakte Pro 2.28.56, Hilfe, Fenster mit Kopfleiste wie bei Samsung DeX bzw. Freiform-Fenster):
„Kurzhinweise an Knöpfen anzeigen funktioniert nicht.“ Der Haken ist gesetzt, trotzdem sieht er an den Knöpfen keinen Hinweis.

## Zuerst (Klaus 10.11., letzter Wunsch der Sitzung): Landkarte der Familienakte als Datei in der Geschenkbox

- Klaus: „Karte trotzdem gleich mit exportieren“, „beide angezeigten Karten im Geschenkbox“, „natürlich die entsprechende Funktion mit dabei“.
- Ziel: In der Geschenkbox öffnen **beide** Karten direkt, ohne Umweg:
  - die Pro-Verbund-Karte (schon als `pro-verbund.html`);
  - **neu die „Landkarte der App“** als eigene Datei, mit Funktion: Kästen antippen zeigt die Wege, Legende als Knöpfe, „Mehr“-Texte.
  - Der Link `?ansicht=landkarte` bleibt als zweiter Weg.
- Bau:
  - Ein Werkzeug `tools/landkarte-datei.mjs` erzeugt `docs/landkarte/Familienakte-Landkarte.html` aus `lib/app-landkarte.ts` und `lib/app-stand.ts`. Die Datei vom 07.11. ist veraltet.
  - Vorschlag: ein eigener kleiner Einstieg (`app/landkarte-allein.tsx` mit Vite-Eintrag oder `vite build` in eine Datei) rendert `Landkarte` aus `app/landkarte.tsx` ohne App drumherum.
  - Ohne Gerätezustand: Fläche nur nach Baustand, kein Rot.
  - In `tools/geschenkbox-datei.mjs` als zweite Seite einbinden, wie `#verbund-karte`.
  - In der Geschenkbox ein Knopf „Karte öffnen“ auf die Datei, mit `files` beim Veröffentlichen mitgeben.
- Erkundet am 10.11.: Die Karte im DOM hat etwa 29 KB, die Bühne ist 1398×1913 px groß, 10 Kästen tragen Gerätezustand (`data-live`). Ein bloßes DOM-Abbild wäre ohne Funktion, darum der eigene Einstieg.
- Probe: Datei öffnet ohne Netz, Tipp auf einen Kasten zeigt die Wege, die Legende filtert. Gegenprobe dazu.

## Wie es heute gebaut ist

- `app/kurzhinweise.ts` (seit 2026-11-04), Haken in `app/kurzhinweise-schalter.tsx`, Probe `tests/ui/kurzhinweise.test.mjs`.
- **An:** Der Hinweis ist nur das `title`-Attribut des Knopfs.
  - Am PC zeigt ihn der Browser beim Darüberfahren.
  - Bei Touch zeigt ein **langer Druck (0,5 s)** eine Blase (`.kurzhinweis-blase`).
- **Aus:** `title` wird nach `data-fa-titel` verschoben.

## Vermutungen (nicht geprüft, am Gerät nachstellen)

1. **Android-WebView zeigt `title` nie an.** In der APK bleibt also nur der lange Druck. Ein normaler Tipp oder ein kurzes Halten zeigt nichts; der Haken wirkt dann wie tot.
2. **Maus oder Trackpad (DeX, Freiform-Fenster):**
   - `pointerType === "mouse"` → der Code steigt aus (`if (!aktiv || e.pointerType === "mouse") return;`).
   - Die WebView zeigt aber auch kein `title` beim Darüberfahren.
   - Ergebnis: mit Maus in der APK **gar kein** Hinweis. Wahrscheinlich Klaus' Fall (Bild zeigt Fensterleiste).
3. Neuere Knöpfe tragen womöglich nur `aria-label` und kein `title`. Dann gibt es dort nichts anzuzeigen.
   - Prüfen, z. B. Kopfleiste „Neu“, Glocke, Kalender, Buch; die Erste-Schritte-Kacheln haben ohnehin sichtbaren Text.
4. Die Probe läuft nur am DESKTOP-Chromium; dort zeigt der Browser `title`. Die APK-Lage misst sie nicht.

## Vorschlag zum Bauen (erst als HTML-Vorschau, Klaus' Ja)

- In der App (Android/Windows-WebView) eine **eigene Blase auch für die Maus**: beim Darüberfahren nach ca. 0,6 s, `title` dabei zurückhalten, damit nichts doppelt erscheint.
- Bei Touch bleibt der lange Druck; dazu im Haken-Text sagen, wie man den Hinweis sieht („am Tablet: Knopf kurz gedrückt halten“).
- Knöpfe ohne `title`, aber mit `aria-label`: den Text der Blase aus `aria-label` nehmen.
- Probe erweitern: Maus-Darüberfahren zeigt die Blase. Und eine Gegenprobe: mit dem alten Code rot. Ein HANDY-Kontext mit langem Druck läuft schon in der Probe.

## Wichtig, direkt nach den Kurzhinweisen: Abgleich mit einem Cloud-Ordner (OneDrive, Google Drive) – Klaus 10.11.

Klaus: „Der Datenabgleich mit OneDrive … ist ganz, ganz wichtig. Der ist nicht ohne Grund da.“ Für Jens ist OneDrive entscheidend;
bei Klaus wäre es ein Google-Ordner (Google Drive oder ein anderer Google-Speicher, Name noch offen – bei Klaus erfragen).

**Was es heute gibt (nicht am Gerät geprüft):**
- Eingangszentrale → „OneDrive-Familienordner prüfen“ (`checkOneDriveInbox` in `app/health-portal.tsx`, `scanOneDriveInbox`,
  Bestandsprüfung `lib/fawoga-inventory.ts`, Speicherart `onedrive` in `app/local-vault.ts`).
- Der Ordner wird im Sicherheitscenter verbunden: der **lokal synchronisierte** OneDrive-Ordner, keine Anmeldung bei Microsoft.
- Gelesen wird nur, die Originale bleiben.

**Auftrag:**
1. Prüfen, ob der Weg in allen drei Fassungen funktioniert, mit Probe:
   - PWA: Ordnerwahl im Browser.
   - Windows: OneDrive-Ordner auf der Platte, Google Drive für Desktop als Laufwerk.
   - APK: Android-Ordnerwahl.
2. Allgemein machen: nicht nur OneDrive, sondern **„Cloud-Ordner“**, also jeder Ordner, den ein Sync-Programm auf dem Gerät hält. Name und Herkunft zeigen.
3. **Grenze Android prüfen und ehrlich sagen:**
   - Die Google-Drive-App bietet in der Android-Ordnerwahl womöglich keine ganzen Ordner an, nur einzelne Dateien. OneDrive teils ebenso.
   - Am Gerät nachsehen (Klaus' Tablet).
   - Notfalls einen Weg über „Teilen“ oder einen Sync-Ordner im Gerätespeicher (z. B. Autosync-Apps) nennen.
4. **Sichtbar machen:**
   - Eigener Kasten in der „Landkarte der App“ (Weg hinein: „Cloud-Ordner (OneDrive, Google Drive)“ → Eingangszentrale), mit Stand in `lib/app-stand.ts`.
   - Ein Hilfe-Thema „Unterlagen aus OneDrive oder Google Drive holen“ als Bild mit Schritten.
   - Der Weg im Bereich „Wie funktioniert die App“.
5. Den Prüfbereich der Systemprüfung dazu behalten, unter neuem Namen (z. B. „Cloud-Ordner-Abgleich“).

Erst Vorschau (Kasten, Hilfe-Thema, Wortlaut) mit Klaus' Ja, dann bauen, Probe + Gegenprobe, Fassung, Ausgabe.

## Klein, gleich mitnehmen: Trefferliste unter der Landkarte streichen (Klaus 10.11.)

- Nach einem Tipp auf ein Feld der Legende steht unter der Karte eine lange Zeile: „36 hervorgehoben: Workflow PDF, Stapel-Liste, … · Nochmal auf die Legende tippen hebt auf.“
- Klaus: „Diese Information kann auch raus … bevor man den durchgelesen hat, hat man sich oben schon durch die Felder geklickt und gezählt.“
- Bau: Liste entfernen (`[data-lk-treffer]` in `app/landkarte.tsx`). Höchstens die Zahl am gedrückten Legenden-Knopf zeigen, z. B. „blau · 36“; der Satz „Nochmal tippen hebt auf“ gehört hinter das „?“ der Karte.
- Probe `app-landkarte` (Legende) anpassen; vor dem Push `grep -rn "lk-treffer\|hervorgehoben" tests/ui`.

## Klein, gleich mitnehmen: „Neu“ › „E-Mail in der Hilfe“ springt nicht zur Karte (Klaus 10.11.)

- Im Fenster „Was ist neu“ führt „Zur Hilfe“ bei „E-Mail in der Hilfe“ nur auf die Hilfe. Erwartet wird das Thema mit der E-Mail-Karte, aufgeklappt.
- Eintrag `email-2026-11-07` in `app/neu-knopf.tsx`: Das `knopf`-Ziel nachsehen und auf das Hilfe-Thema der E-Mail-Karte richten, aufgeklappt (Weg wie bei `hilfe-landkarte`, über `go("help", …, { ziel })`).
- Gleich alle Einträge in „Was ist neu“ durchgehen: Führt jeder Knopf an die genannte Stelle? Dazu eine Probe je Knopf.

## Texte durchsehen: kein Gesprächston, lange Erklärungen hinter „?“ (Klaus 10.11.)

Klaus: „Such bitte überall nach Texten, die aussehen, als würden wir uns unterhalten, als müsstest du mir erklären, welche Aufgabe du
gerade erfüllt hast … Oder lange Erklärtexte, die nicht auf die Hauptpunkte gekürzt sind. Das soll alles unter Fragezeichen verschwinden.“

**Regel:**
- Sichtbar bleibt nur, was man zum Bedienen braucht: Zustand, Knopf, ein kurzer Satz.
- Alles Erklärende kommt in Punkten hinter das „?“ (`HinweisText`/`InfoPopover`).
- Keine Sätze, die vom Bau berichten: „zeigt jetzt“, „klappt jetzt auch“, „seit 2.28.46“, „neu: …“, „wurde ergänzt“.

**Erste Funde (Suche am 10.11., nicht vollständig):**
- `app/health-portal.tsx`: zehn sichtbare Absätze mit über 350 Zeichen, z. B. die Suchhilfe (Zeile ~2927, „… seit 2.28.46 auch in der Web-App …“).
  Liste: `grep -rnoE "<p>[^<]{350,}</p>" app --include=*.tsx`.
- `app/private-meaning-panel.tsx`: ein langer Absatz.
- `app/neu-knopf.tsx` („Was ist neu“):
  - Die Karten erzählen, was gebaut wurde („zeigen jetzt …“), in 5–7 Zeilen.
  - Kürzen auf einen Satz plus Knopf; der Rest hinter „?“.
  - Alte Einträge (älter als zwei Fassungen) ausblenden.
- `lib/fassungen.ts` (Changelog „Was gibt's Neues?“): Bau-Sprache („Gerätetest: … klappt jetzt auch …“). Für Nutzer umschreiben: was man jetzt tun kann, in Punkten.
- `app/hilfe-themen.tsx`: lange Themen-Texte auf Hauptpunkte prüfen (Welle 1 ist schon als Bild mit drei Merkpunkten).
- Die Trefferliste unter der Landkarte (eigener Punkt oben).

**Vorgehen:**
1. Alle sichtbaren Texte über 200 Zeichen sammeln (Skript über `app/*.tsx`, JSX-Text und `text:`-Felder) und als Tabelle in eine HTML-Vorschau stellen: vorher, nachher, was hinter das „?“ geht.
2. Klaus' Ja je Gruppe einholen, dann umbauen.
3. Proben, die Texte suchen, vorher mit `grep -rn` in `tests/ui` finden.

## Alte Bestände und alte Versionsbezüge suchen (Klaus 10.11.)

Klaus: „Es soll unbedingt nochmal geprüft werden, ob irgendwo noch alte Bestände sind oder alte Aussagen auf alte Versionen Bezug
nehmen … auch in der Hilfe und in den beschreibenden Texten.“

Das gehört zusammen mit „Texte durchsehen“ (Abschnitt oben) in **eine** Durchsicht mit Vorschau-Tabelle. Erste Funde vom 10.11.:
- Fußzeile und weitere Stellen tragen noch den alten Namen **„Me, Myself and I – Meine Familienakte“**: 7 Treffer in `app/`, `lib/`, `public/`.
- `APP_VERSION` 2.28.1 erscheint sichtbar in der Systemprüfung und der Abnahme (eigener Abschnitt oben).
- Weitere Altlasten:
  - `lib/release-system-check-report.json` (2.28.1);
  - FaWoGa, Memory;
  - „seit 2.28.46“ in der Suchhilfe;
  - `lib/fassungen.ts` in Bau-Sprache.
- Suchen nach:
  - `2\.28\.[0-9]+` in sichtbaren Texten;
  - „Me, Myself“, „MMI“, „Memory“, „FaWoGa“, „Online-Bestand“, „Website 40“;
  - alten Menünamen (vor den neun Hauptbereichen);
  - alten Kastennamen der Landkarte.

## Rechtstexte: Impressum, Datenschutz, Haftungsausschluss (Klaus 10.11.)

Klaus: „Du kannst jetzt schon anfangen, ein Impressum zu machen und eine Datenschutzerklärung, genauso einen Haftungsausschluss …
Dafür gibt es schon Beispiele … mach mal gleich über Family Project. family-projekt.de, so wie das in den Apps schon größtenteils ist.“

**Stand:**
- `public/datenschutz.html` gibt es seit 05.11. (#100): Impressum nach § 5 DDG mit Klaus als Anbieter, Kontakt info@family-projekt.de.
- Darin die Datenschutzerklärung mit den Abschnitten Verantwortlicher, Bereitstellung (GitHub Pages, Update-Server), lokale Verarbeitung, Kalender, Internet, Spracheingabe.
- **Ein Haftungsausschluss fehlt.**
- In der App verlinkt? Prüfen; die Fußzeile ist der Ort.
- Vorbild in den anderen Apps: `privat-brain-pro/impressum.html` (Impressum & Datenschutz, „Kurz gesagt“, Daten je Ort).

**Veraltet und rechtlich wichtig:**
- Dort steht „Die App liest keine bestehenden Termine“. Seit 2.28.43 holt die App auf Wunsch Termine aus dem Kalender (beidseitig, `lib/kalender-einlesen.ts`).
  Die Erklärung stimmt also nicht mehr; anpassen, ebenso die genannten Berechtigungen (Google, Microsoft, Gerätekalender lesen).
- Nicht erwähnt, aber vorhanden:
  - Pro-Tresor (verschlüsselt, gemeinsam mit anderen Pro-Apps);
  - Teilen zwischen Pro-Apps;
  - Netz-Abgleich im eigenen WLAN (Ports 48200/48201);
  - Paket per Teilen;
  - Bedeutungssuche mit Modell-Download (Quelle des Modells nennen);
  - Brief beantworten über Mistral (EU, nur verdeckter Text, nur mit Schlüssel des Nutzers);
  - Cloud-Ordner (OneDrive/Google, nur lokal synchronisierter Ordner);
  - Update-Fähnchen prüft still den Update-Server (seit 2.28.52, nicht mehr nur auf Tipp!);
  - Demo.

**Auftrag:**
1. **Anbieter „Family-Projekt“, family-projekt.de**, wie in den anderen Apps.
   - Ein Impressum braucht eine verantwortliche Person bzw. Rechtsform. Bis zur Übertragung also „Family-Projekt, Inhaber Klaus Nitzsche“ mit der vorhandenen Anschrift.
   - Keine Rechtsform erfinden; Klaus fragen, ob es schon eine gibt (GbR, UG o. ä.).
2. Datenschutzerklärung auf den Stand 2.28.57 bringen (Liste oben), Abschnitt je Funktion, oben „Kurz gesagt“ in Punkten.
3. **Haftungsausschluss** neu, als eigener Abschnitt bzw. eigene Seite:
   - Inhalte und Hinweise der App ersetzen keine Rechts-, Steuer- oder Medizinberatung;
   - Fristen und Vorschläge ohne Gewähr;
   - Sicherung liegt beim Nutzer;
   - Haftung für Links (Downloads, Geschenkbox);
   - Testfassungen (Android-APK als Vorabversion, Windows-Setup unsigniert).
4. Gleiche Texte in allen Fassungen (PWA, Android, Windows): in der App erreichbar aus Fußzeile und Hilfe; die Pro-Apps verlinken auf dieselbe Seite.
5. Vorschau an Klaus.
   - Hinweis an Klaus: Rechtstexte vor der Veröffentlichung von einer Fachperson prüfen lassen. Claude liefert einen Entwurf, keine Rechtsberatung.
6. Keine weiteren persönlichen Daten in Dateien als die, die Klaus selbst für das Impressum freigibt.

### Rechtstexte in **allen** Apps gleich (Klaus 10.11., Nachtrag)

Klaus: „Das soll in allen Apps, die hier im Projekt verbunden sind, die ganzen Pro-Apps, auch die Basic-Apps, integriert sein. Derselbe
Text, dieselbe rechtliche Grundlage … nach bestem Wissen und Gewissen … dieselbe E-Mail-Adresse … so dass wir langsam an eine
Veröffentlichung denken können.“

**Umfang:**
- Familienakte (Basic/PWA und Pro)
- BookLedgerPro und BookLedger Basic
- Private Brain Pro und die Basic- bzw. V3-Fassung
- Workflow PDF Pro und Workflow PDF
- Tools mit eigenem Impressum, z. B. Kimboard und Kimseek in Private Brain Pro

**Inhalt:**
- **Eine Quelle, byte-gleich verteilt** wie die Pro-Verbund-Karte.
- Ein Rechtstext-Paket (`impressum.html`, darin Impressum, Datenschutz-Grundteil, Haftungsausschluss) in **einem** Repo pflegen und mit Pin und Prüfung (`check:herkunft`-Art) in alle Apps kopieren. Vorschlag: in BookLedgerPro, wie die Karte, oder in der Familienakte.
- Je App ein kurzer **app-eigener Datenschutz-Abschnitt** (was diese App verarbeitet), im selben Aufbau.
- **Anbieter:** Family-Projekt, family-projekt.de; bis zur Übertragung „Inhaber Klaus Nitzsche“ mit der Anschrift aus dem vorhandenen Impressum.
- **Kontakt einheitlich `info@family-projekt.de`**: mit Bindestrich, so steht es heute in allen Impressen (12 Treffer), und so heißt auch der Update-Server.
  - Klaus sagte „familyprojekt.de“; vor dem Bau bestätigen lassen, dass die Schreibweise mit Bindestrich gemeint ist.
- **Quelle für Anbieterangaben ist die Internetseite family-projekt.de** (Klaus 10.11.): Name, Anschrift, Kontakt und vorhandene Rechtstexte dort abgleichen.
  - Aus dem Sitzungsbehälter war family-projekt.de bisher nicht erreichbar; dann WebFetch versuchen oder Klaus um den Text bitten.
- Erreichbar in jeder App: Fußzeile und Einstellungen/Hilfe; in den nativen Apps ohne Netz, die Seite liegt im Paket.
- Vorab je App nachsehen, wo heute ein Impressum steht, und alte Texte ersetzen, nicht doppeln.

**Reihenfolge:**
1. Vorschau des gemeinsamen Textes an Klaus.
2. Familienakte zuerst, dann die anderen Repos (je eigener PR, `add_repo`).
3. Je App eine neue Fassung ausgeben, Geschenkbox nachziehen.

Kein Wort „rechtssicher“; im Brief und in der Antwort an Klaus sagen, dass eine Fachperson vor der breiten Veröffentlichung drüberschauen sollte.

## Danach: rote und graue Kästen der „Landkarte der App“ (Klaus 10.11.)

Klaus will die roten und die grauen Kästen der Landkarte (Hilfe › Landkarte der App) abarbeiten. Stand der Kästen: `lib/app-stand.ts`,
Texte: `lib/app-landkarte.ts`, Gerätezustand: `lib/live-zustand.ts` / `app/live-zustand.ts`.

**Rot = auf diesem Gerät nicht eingerichtet** (`stand: "aktivieren"`): `datentresor`, `protresor`, `datei-pro`, `kalender`, `glocke`.
- Zuerst klären: Ist ein Kasten rot, obwohl er auf Klaus' Gerät eingerichtet ist? Dann ist das ein Fehler im Live-Zustand.
  Beispiel: Pro-Tresor eingerichtet, Kasten trotzdem rot. Klaus nach einem Bild der Karte fragen und je Kasten nachstellen.
- Ist er wirklich nicht eingerichtet, braucht der Kasten einen klaren Weg „Beheben ›“, der direkt zur Stelle führt.
- Prüfen, ob es diesen Weg je Kasten gibt und ob er dort ankommt.

**Grau gestrichelt = geplant, nicht gebaut** (alle seit 2.28.35, E-Mail-Plan; Karte `docs/landkarte/`):
- Mail herein: `mail-ms` (Microsoft-Postfach abholen/senden), `mail-imap` (GMX · WEB.DE · T-Online mit App-Passwort), `mail-gmail` (Gmail direkt).
- Prüfung: `pruefung` (Prüfung der Anlagen in der Eingangszentrale) und `befund` (Befund: ablegen ohne Vorschau oder weglassen).
- Mail hinaus: `echt`, `programm`, `mailapp` (Mail-App des Geräts vorbereitet öffnen), `mssend` (Microsoft-Postfach senden).

Reihenfolge laut Plan in `CLAUDE.md` (Abschnitt Offen):
1. Anhang-Prüfung (`pruefung`/`befund`), dazu echtes PDF mit einem Tipp und Mail-App öffnen (`echt`, `programm`, `mailapp`).
2. Danach Microsoft mit den Entra-Rechten Mail.Read/Mail.Send (`mail-ms`, `mssend`).
3. Gmail-Abholen auslassen; IMAP über die Technik aus Private Brain Pro.

Offen ist noch die **Entscheidung von Klaus und Jens** aus der E-Mail-Karte. Vor dem Bau eine HTML-Vorschau mit Ja/Nein je Kasten.
Je fertigem Kasten `lib/app-stand.ts` auf „fertig“ mit `seit` setzen.

## Danach: Systemprüfung zeigt veraltete Berichte (Klaus 10.11., Bild Hilfe › Systemprüfung)

- „Vollständige Systemprüfung“ steht auf **13.10.2026, Version 2.28.1**, gelb, mit Bereichen wie „FaWoGa-OneDrive-Integration“.
  Darunter ein Eintrag vom 07.11. mit „5/15 bestanden“. Klaus: „Das ist auch überholt.“
- Quelle: `lib/release-system-check-report.json` (fest eingebaut, Prüf-ID `test-2.28.1-final-readiness-20261013`), angezeigt über
  `app/health-portal.tsx` (Import Zeile ~142, Karte `#pruefberichte` ~3577); `APP_VERSION` 2.28.1 ist laut `CLAUDE.md` der interne Prüfstand.
- Vorschlag (Vorschau, Klaus' Ja):
  - Den fest eingebauten Altbericht nicht mehr als aktuellen Stand zeigen.
  - Stattdessen die Prüfung der laufenden Fassung zeigen, aus `lib/fassungen.ts`, den Nachweisen und der CI.
  - Alternativ als „Archiv“ zugeklappt mit Datum.
  - **OneDrive bleibt** (Klaus 10.11.: Jens nimmt seine Daten aus OneDrive; das war der ursprüngliche Wunsch).
    - Die Eingangszentrale hat den Knopf „OneDrive-Familienordner prüfen“ (`checkOneDriveInbox`, `lib/fawoga-inventory.ts`).
    - Er liest einen **lokal synchronisierten** OneDrive-Ordner, der im Sicherheitscenter verbunden wird. Eine Anmeldung bei Microsoft gibt es dafür nicht.
    - Prüfen, ob das in der APK und unter Windows noch geht, und den Prüfbereich dazu aktuell halten.
  - „FaWoGa“: Wort aus Jens' Anfangsstand, im Repo nirgends erklärt; Klaus vermutet „Familie, Wohnung, Garage“ (o. ä.). In sichtbaren Texten durch einen verständlichen Namen ersetzen (z. B. „Bestandsprüfung“); die Bedeutung bei Jens erfragen.
  - „Memory“ war der alte Name von „Tagebuch“ (bis 2.28.49). In Prüfbereichen „Tagebuch“ schreiben.
  - Eigene, auf dem Gerät gespeicherte Prüfberichte bleiben.
- Prüfen, ob die Systemprüfung selbst (Knopf „Systemprüfung“) noch Bereiche mit alten Namen prüft.
- **Klaus 10.11.: alte Prüfberichte sind durch die neuen abgedeckt**, weil die Technik dahinter aktualisiert und neu aufgebaut ist.
  - Daraus folgt: Der fest eingebaute Bericht 2.28.1 kommt **aus der App**; er ist kein Nutzerbestand.
  - Alte, auf dem Gerät gespeicherte Antworten der praktischen Abnahme (Website 40 / 2.28.1) nicht still löschen. Sie wandern zugeklappt in „Ältere Prüfungen (vor 2.28.56)“, mit einem Knopf „Ältere Prüfungen löschen“.
  - Oben steht nur der Stand der laufenden Fassung: was die Proben der CI für diese Fassung geprüft haben (aus dem Nachweis) und was am Gerät noch offen ist.
- **Falsche Versionsnummer in der praktischen Abnahme** (Klaus 10.11., zweites Bild):
  - Bei Einträgen wie „Mikrofonstatus: Klappt“ steht „Website 40 · Familienakte 2.28.1“, obwohl die App 2.28.56 ist.
  - Ursache im Code: `app/health-portal.tsx` übergibt `websiteVersion="40" familyVersion={APP_VERSION}`; `APP_VERSION` ist 2.28.1, der interne Stand. Die Zeilen liegen bei ~3548.
  - Feste Werte „40“ stehen auch bei ~2549 und ~3451 („40 · private Testfassung 2.28.1“).
  - Künftig die technische Fassung aus `package.json` nehmen, wie die Versionszeile im Kopf; „Website 40“ streichen oder ersetzen.
  - Schon gespeicherte Antworten behalten ihre alte Angabe. Die Anzeige sagt dazu „aus Fassung …“, damit klar ist, dass sie älter sind.

## Danach: übrige Punkte

Aus `BRIEF_SITZUNG_2026-11-11_FAMILIENAKTE-WEITER.md` die Punkte 2–6:
- 2: Sicherheitsseite kürzer.
- 3: Wettlauf in `kalender-einlesen`.
- 4: Basic-Verbund-Karte.
- 5: Landkarten-HTML für die Geschenkbox.
- 6: Vollsicherungsordner.

## Regeln

Nächste freie Fassung **2.28.57**. Neue Oberfläche erst als Vorschau. Vor dem Push ganze UI-Reihe oder `grep -rn` in `tests/ui`.
Ausgabe als APK, Windows, PWA; Geschenkbox nachziehen. Codex auslassen; Forschung nur in KimHub.

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte. Zuerst lesen: CLAUDE.md, BRIEF_SITZUNG_2026-11-11_KURZHINWEISE.md.
Zuerst: Landkarte der App als eigene Datei mit Funktion (Tipp, Wege, Legende) in die Geschenkbox, neben die Verbund-Karte
(Abschnitt „Zuerst“ im Brief; tools/landkarte-datei.mjs, tools/geschenkbox-datei.mjs, Artefakt XeUMGuSZ49FzsJYjwQznM7).
Auftrag: Klaus' Befund „Kurzhinweise an Knöpfen anzeigen funktioniert nicht“ (Tablet, APK 2.28.56, wohl mit Maus/DeX) klären und beheben.
Vermutungen im Brief (WebView zeigt title nie; Maus wird übersprungen; Knöpfe nur mit aria-label). Erst Ursache im Code belegen,
dann HTML-Vorschau der Lösung an Klaus, nach seinem Ja bauen, Probe + Gegenprobe, als 2.28.57 (APK, Windows, PWA) ausgeben,
Nachweis, Geschenkbox nachziehen. Klein gleich mit: Trefferliste unter der Landkarte streichen; „Neu“ › „E-Mail in der Hilfe“
› „Zur Hilfe“ auf die E-Mail-Karte richten (ziel "hilfe" in app/neu-knopf.tsx) und alle Neu-Knöpfe prüfen.
Dann (wichtig): Abgleich mit einem Cloud-Ordner (OneDrive für Jens, Google-Ordner für Klaus) prüfen, allgemein machen und als
Kasten in der Landkarte und als Hilfe-Thema zeigen (Abschnitt im Brief; Android-Grenze am Gerät klären).
Danach: rote und graue Kästen der „Landkarte der App“ (Abschnitt im Brief): rote am Gerät nachstellen (Fehler im Live-Zustand
oder fehlender Weg „Beheben ›“), graue E-Mail-Kästen nach Plan – erst Klaus' und Jens' Entscheidung und eine HTML-Vorschau.
Dann Texte durchsehen (kein Gesprächston, lange Erklärungen hinter „?“; Abschnitt im Brief, erst Vorschau-Tabelle),
dann alte Bestände/Versionsbezüge suchen (mit der Textdurchsicht), Rechtstexte (Impressum, Datenschutz, Haftungsausschluss;
Anbieter Family-Projekt, info@family-projekt.de; eine Quelle, byte-gleich in ALLE Pro- und Basic-Apps; veraltete Kalender-Aussage), dann Systemprüfung mit veralteten Berichten (Abschnitt im Brief), danach die Punkte 2–6 aus BRIEF_SITZUNG_2026-11-11_FAMILIENAKTE-WEITER.md. Je Stück eigener Zweig, PR, Fassung, Ausgabe.
Nicht: veröffentlichte Fassungen erneut ausgeben, byte-gleiche Bausteine von Hand ändern, Codex anstoßen.
```
