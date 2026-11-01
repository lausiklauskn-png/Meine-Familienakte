# Nächste Sitzung: Familienakte Pro und die verbundenen Pro-Apps

Auftrag von Klaus, 1. November 2026. Dieser Brief beschreibt den nächsten Bau; die Anschlüsse sind damit noch nicht umgesetzt.
Er ergänzt [den Abschluss zum gesicherten Eingang](BRIEF_ABSCHLUSS_2026-11-01_CODEX-EINGANG-UND-TRESOR.md).
Die laufende Übergabe liegt im [Entwurf #48](https://github.com/lausiklauskn-png/Meine-Familienakte/pull/48).

## Ziel und Bedienung

Klaus möchte eine Datei aus der **separat gestarteten** Workflow PDF Pro direkt in die Familienakte geben und wieder zurück.
Dasselbe gilt für Private Brain Pro und Booklet Pro, im Quellcode **BookLedgerPro**. Das eingebettete Workflow PDF bleibt
zusätzlich erhalten; es ersetzt die Verbindung zu den eigenständigen Apps nicht.

Gewünschter Produktname: **Familienakte Pro**. Klaus bezieht PWA und APK ein; zuerst wird die von ihm genutzte Android-APK
angeschlossen. Der Name verspricht keine identischen Speicherrechte auf allen Plattformen. Paketkennungen, Tresorfächer,
Datenbanken und Update-Zuordnung nicht wegen einer Umbenennung wechseln. Sichtbare „Version 2.28.1“ bleibt unverändert.
Konkrete sichtbare Stellen der Umbenennung vor dem Eingriff auflisten und mit Klaus abstimmen.

Klaus' Vergleich „SAP für Privatleute“ beschreibt den Verbund. Leitlinie für den Bau: Jede App bleibt einzeln nutzbar;
Verbindungen sind freiwillig. Eine Datei übergeben und eine verständliche Bestätigung erhalten soll genügen.
Keine zusätzliche zentrale Pflicht-App, kein Pflichtkonto und keine doppelte Raumverwaltung allein für diesen Anschluss.

## Vereinbarte Reihenfolge

### 0. Vorhandene Reparatur als Grundlage sichern

PR #48 enthält den dauerhaften Eingang, Wiederaufnahme nach Neustart und die atomare Übergabe aus dem Stapel.
Code-Stand `eeaa61a2354168b1f81362addc945277af21e1ac`: GitHub-Hauptprüfung sowie Android- und Windows-Prüfbau erfolgreich.
Die früheren Brücken-/PWA-Prüfkorrekturen stehen bereits auf main. Nichts davon noch einmal bauen.

Klaus hat zuletzt „nichts veröffentlichen“ angeordnet. Ein Main-Push startet derzeit Pages automatisch.
Den Entwurf deshalb nicht ohne neue Freigabe nach main bringen; nächste Sitzung den Stand des PR zuerst prüfen.
Neue fertige Stücke auf eigenen `codex/…`-Zweigen mit je einem Entwurfs-PR bauen, Abhängigkeit von #48 benennen.

### 1. Vorhandenen Pro-Tresor anschließen

- Kanonisches Paket `de.familyprojekt.tresor` aus Workflow-PDF-Pro verwenden, mit Herkunft und Übernahme-Werkzeug.
  Private Brain Pro und BookLedgerPro benutzen diese Technik bereits. Keine zweite Kryptografie oder inkompatible Tresorform bauen.
- Speicher frei wählbar: Gerätespeicher, SD-Karte, USB oder freigegebener Ordner, soweit das Betriebssystem dies zulässt.
  Android: bestehende Ordnerwahl und dauerhafte Zugriffsfreigabe verwenden. Unerreichbarer Speicher bleibt als solcher erkennbar;
  kein stiller Ersatzbestand im internen Speicher. Auch mehrere gewählte Tresore/Arbeitsstände eindeutig auseinanderhalten.
- Familienakte-Fach und `eingang-familienakte` sind im gemeinsamen Paket vorbereitet; der Familienakte-Adapter fehlt.
  Beim Einzug bestehende Dateien behalten. Migration, Wiederaufnahme und Rückweg zuerst mit einer erfundenen Tresorkopie prüfen.
- Dauerhafte Originale, vorläufige Arbeitsdateien, kleine JSON-Arbeitsstände und neu aufbaubare Suchvektoren getrennt behandeln.
  Arbeitsdaten nach bestätigter Ablage bereinigen; keine dauerhafte interne Zweitsammlung aller PDFs. Notwendige native
  Arbeitskopien begrenzen und ihren Lebenszyklus prüfen. Die jetzige Browser-Eingangsablage ist noch kein verschlüsselter Pro-Tresor.
- Ein gemeinsames Inhaltsverzeichnis bedeutet nicht, dass fremde app-eigene Dateiformate automatisch entschlüsselbar sind.
  Für Übergaben das vorhandene gemeinsame Übergabeformat verwenden. Nur ausgewählte Dateien übertragen.
- Windows gesondert anbinden: Die Familienakte nutzt Tauri; die vorhandene Java-Engine der anderen Pro-Apps lässt sich nicht
  ohne Brücke übernehmen. Für die PWA verfügbare Browser-Speicherrechte prüfen. Kein ungemessener Gleichstand aller Plattformen.

### 2. Vorhandene Geräteprüfung und Modellwahl übernehmen

Private Brain Pro hat Geräteprüfung und Empfehlungen für e5-small, e5-base und e5-large. Diese Lösung anbinden;
größere Downloads bleiben eine bewusste Wahl. Vorhandene Quellen und Prüfsummen übernehmen, keine neue automatische Downloadkette.
Modellgröße allein beweist keine besseren Treffer. Auf erfundenen passenden Dokumenten Treffer und Aufwand vergleichen.

Vektoren durch Dokument-/Textstand, Modellkennung, Revision und Dimension kennzeichnen. Unterschiedliche Modelle nicht mischen;
Modellwechsel mit Wiederaufnahme des Indexaufbaus. Den bisherigen Index erst ersetzen, wenn der neue verwendbar ist.
Die allgemeine Akten-Suche und die Bedeutungssuche im eingebetteten Workflow PDF sind heute getrennt.
Der Mycel-Knoten bleibt von dieser privaten Dokumentensuche getrennt; keine Dokumente oder Vektoren ungefragt ins Netz geben.

### 3. Großen Portalcode weiter aufteilen

`app/health-portal.tsx` verbindet viele Aufgaben: Seiten, Eingang, Dokumente, Tresor und Suche.
„Aufteilen“ heißt, zusammengehörige Aufgaben in kleine Dateien zu verlagern, während das Verhalten gleich bleibt.
Die Eingangsspeicherung wurde mit `eingang-ablage.ts` und `use-eingang.ts` bereits herausgezogen.

Als nächste kleine Stücke bieten sich Tresoranbindung, Dokumentaktionen und Suchanbindung an. Klare Ein-/Ausgaben zwischen ihnen
festlegen; immer nur einen Bereich mit seinen bestehenden Proben herauslösen. Keine neue Oberfläche allein für die Codeordnung.

### 4. Hin- und Rückweg zwischen den Pro-Apps verlässlich machen

Zielpaare: **Familienakte Pro ↔ Workflow PDF Pro**, **↔ Private Brain Pro**, **↔ BookLedgerPro**.
Das alte Repository `Privat-Brain` ist abgelöst; `Privat-Brain-Pro-V3` ist eine eigene Variante. Nicht still zusammenlegen.

Für dasselbe Gerät den gemeinsamen Tresor verwenden, wenn er verbunden ist. Androids „Teilen / Öffnen mit“ ist ein ergänzender
Weg und funktioniert als Betriebssystem-Mechanismus ohne Relay. Die Familienakte hat bereits einen nativen Teileingang.
Die vollständigen Wege zwischen den konkreten APKs, einschließlich Rückantwort, sind noch zu bauen und am Gerät zu prüfen.

Wichtige Lücke: Das gelesene `Fach.java` hat Eingänge für Familienakte, Workflow PDF und BookLedgerPro, aber keinen entsprechenden
Private-Brain-Eingang. Für dessen Rückweg vorhandenen Teileingang prüfen; ein nötiges gemeinsames neues Fach zuerst im
kanonischen Paket kompatibel ergänzen und anschließend über die jeweiligen Werkzeuge nachziehen. Nicht ins fremde eigene Fach schreiben.

Vertrag für jede Übergabe, unabhängig vom Transport:

- Stabile Übergabekennung, Quell-/Ziel-App, Dokumentkennung, Dateigröße und Prüfsumme; Bearbeitungen als neue Fassung mit Bezug zur Quelle.
- Ziel prüft Inhalt und Grenzen und speichert Datei sowie Eingangsdatensatz dauerhaft. Erst danach lautet die Rückmeldung „übernommen“.
  Zustellung, Ablage im Eingang und endgültige Einordnung in die Akte unterscheidbar halten.
- Abbruch und erneutes Senden erzeugen keinen doppelten Eingang. Ausbleibende Bestätigung lässt die Übergabe offen und wiederholbar.
  Gemeinsames Übergabefach mit der vorhandenen Übernahmemarke quittieren; seine Originale nicht löschen.
- Eine erfolgreiche Android-Teilen-Auswahl oder ein aufgelöstes `navigator.share()` beweist keine Ablage im Ziel.
  Ohne passenden Rückkanal nur „weitergegeben“ melden und die Quelle behalten.
- Beim eingebetteten Workflow PDF ebenfalls quittieren: `workflow-pdf-seite.tsx` ruft `onGeoeffnet` derzeit schon nach `postMessage`
  auf. Die vorhandene Brücke erweitern, nicht umgehen; Empfang erst nach dauerhafter Speicherung quittieren.
- Größen und Typen vorab abgleichen. Der aktuelle Dokument-Tresor der Familienakte begrenzt Dokumente auf 20 MB;
  größere Transportgrenzen von Kim-sync/Datei-Post heben diese Grenze nicht auf.
- Der optionale Metadatenvertrag in `docs/UEBERGABE.md` ist bisher nur beschrieben. Implementierung und Prüfung ausdrücklich planen;
  Metadaten aus einer fremden App bleiben Vorschläge für die Einordnung.

### 5. Geräteübergreifenden Weg anschließen – Empfehlung zur Entscheidung

**Empfehlung: Kim-sync für Räume und Empfänger; Datei-Post ergänzend für große Dateien und Abhol-/Abgabecodes.**
Die vorhandene Kopplung nutzen, keine zwei parallelen Raum-Systeme für die Familienakte einführen.
Die beiden gewünschten Pro-Varianten sind als Ausbauziel vorgemerkt; sie wurden hier weder angelegt noch veröffentlicht.
Ob Datei-Post eine eigene installierbare Pro-Hülle braucht oder als Dienst plus vorhandener Web-App genügt, nach dem ersten
funktionierenden Transport entscheiden. Für die lokale Übergabe sind beide nicht erforderlich.

Gelesener Bauzustand (Code, kein Live-Transportversuch):

| Bestandteil | Vorhanden | Folgerung für den Anschluss |
| --- | --- | --- |
| Kim-sync | Räume, signierte Relay-Ereignisse, verschlüsselte Inhalte, Empfangsquittungen, „Teilen / Öffnen mit“ | Raumtechnik weiterverwenden; Familienakte-Empfang zusätzlich bestätigen |
| Kim-sync, neuere Räume | eigener zufälliger Raumschlüssel; Leitung bestätigt Geräte, Schlüsselübergabe gerätebezogen verschlüsselt | Alte Räume mit nur geteiltem Code nicht als gleichwertig behandeln; Einladungsidentität und Widerruf prüfen |
| Datei-Post | Browser-Verschlüsselung, verschlüsselte Dateiteile, Abhol-/Abgabecodes, eigener Dateiserver | Ergänzender Transport-/Ablagedienst; im gelesenen Code keine eigene Kim-sync-artige Raumverwaltung |
| Bereits verbundener Weg | Kim-sync lädt große Dateien verschlüsselt zu Datei-Post; verschlüsselter Raumverweis enthält Dateischlüssel | Bestehende Zusammenarbeit ausbauen; Kryptobaustein ist bytegleich |
| Aktuelle Bestätigungen | Kim-sync bestätigt seine Nachrichtenablage; Datei-Post meldet nach ausgelöstem Browser-Download „fertig“ | Beides bestätigt noch keine dauerhafte Übernahme in den Familienakte-Tresor |

E2E-Verschlüsselung ist technisch vorhanden, keine hier vollständig geprüfte Sicherheitsgarantie. Inhalte werden vor dem Senden
verschlüsselt; Zeitpunkte, Datenmengen, IP-Adressen sowie beim Relay öffentliche Absender-/Raummarken bleiben teils sichtbar.
Vertrauliche Metadaten gehören in die verschlüsselte Nutzlast. Passwort oder Hauptschlüssel des gemeinsamen Tresors nie übertragen.
Eine vom kompromittierten Server veränderte Browser-App könnte Geheimnisse auslesen. Für eine Pro-Hülle deshalb lokale,
versionierte App-Dateien und den bestehenden überprüfbaren Updateweg vorsehen. Geschlossene Räume ersetzen keine Verschlüsselung.

Die aktuelle Kim-sync-Implementierung ist neuer als Teile ihrer README: Gerätebestätigung und Warten auf mehrere Empfänger sind
im Code vorhanden. Vor Änderungen tatsächliche Funktionen prüfen, keine alte README-Grenze als aktuellen Zustand übernehmen.

## Proben für die Umsetzung

Je fertigem Code-Stück: `npm ci`, `npm run build`, `node tests/run-ui.mjs`, `npm run lint` (0 Fehler), `npm run check:herkunft`.
Neue Zusicherungen brauchen passende Gegenproben in `tests/gegenprobe-sitzung-b.mjs`; zeigen, dass jede absichtliche Verletzung auffällt.
Proben der übernommenen nativen Pakete zusätzlich ausführen. Keine bestehenden Proben abschalten oder nur Wartezeiten erhöhen.

Gezielt prüfen: App beenden vor/nach Empfangsbestätigung; Datei doppelt schicken; veränderte Datei; falsches Ziel oder fremde
Bestätigung; voller/gesperrter/entfernter Speicher; verlorene Ordnerberechtigung; zweiter Tresor; Modellwechsel und abgebrochener
Indexaufbau; unzulässige Größe; Rückweg mit bearbeiteter Fassung. Gruppenempfang darf nicht durch eine verfrühte Löschung ausfallen.
Android-Kaltstart und laufende App, Windows und PWA getrennt protokollieren. Für Dateitransport Bilder als Originaldateien behandeln;
Kim-sync verändert Bilder im normalen Bildmodus bewusst, daher diesen nicht für bytegleiche Dokumentübergaben verwenden.

## Bauquellen und Grenzen dieser Übergabe

- [Gemeinsamer Tresor](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/blob/main/docs/TRESORORDNER.md),
  [Fächer](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/blob/main/android/app/src/main/java/de/familyprojekt/tresor/Fach.java).
- [Private Brain Pro: Tresor](https://github.com/lausiklauskn-png/Privat-Brain-Pro/blob/main/docs/TRESORORDNER.md),
  [Geräteprüfung](https://github.com/lausiklauskn-png/Privat-Brain-Pro/blob/main/native/pro-geraet.js),
  [Modellquellen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/blob/main/tools/native/meaning-models.json).
- [BookLedgerPro: Tresor](https://github.com/lausiklauskn-png/BookLedgerPro/blob/main/docs/TRESORORDNER.md).
- Kim-sync gelesen bei `7927bd2df866d4b7363ea1cc7fd23cf09c779ef0`:
  [Raum, Teilen, Empfang und große Dateien](https://github.com/lausiklauskn-png/Kim-sync/blob/7927bd2df866d4b7363ea1cc7fd23cf09c779ef0/index.html).
- Datei-Post gelesen bei `c231d31eabb92cd1da4b77caa6d8995dc95f0efc`:
  [Kryptografie](https://github.com/lausiklauskn-png/Datei-Post/blob/c231d31eabb92cd1da4b77caa6d8995dc95f0efc/public/krypto.js),
  [Browserablauf](https://github.com/lausiklauskn-png/Datei-Post/blob/c231d31eabb92cd1da4b77caa6d8995dc95f0efc/public/app.js),
  [Server](https://github.com/lausiklauskn-png/Datei-Post/blob/c231d31eabb92cd1da4b77caa6d8995dc95f0efc/server.mjs).

Kein echtes Tablet, keine SD-Karte und kein Windows-Gerät geprüft; keine privaten Dateien übertragen, keinen Raum geöffnet,
keine Modelle geladen und keinen laufenden Server verändert. Die Transportempfehlung beruht auf Quellcode, nicht auf einer
Ende-zu-Ende-Geräteprobe oder einer vollständigen Sicherheitsprüfung. Sichtbare Änderungen weiter nur nach Klaus' Ja je Punkt.

## Startauftrag

```text
CLAUDE.md, BRIEF_SITZUNG_2026-11-01_PRO-VERBUND.md und den jüngsten Abschlussbrief lesen.
PR #48 zuerst prüfen: Eingang bereits repariert; Brücken-/PWA-Prüfkorrekturen bereits auf main.
Erstes neues Stück: Adapter für den vorhandenen gemeinsamen Pro-Tresor, Android zuerst.
Freie Speicherwahl, vorhandene Originale erhalten, kein stiller Ersatzspeicher.
Danach bestehende Geräte-/Modellwahl, Portal weiter aufteilen und quittierte Übergaben in beide Richtungen.
Familienakte Pro ↔ eigenständige Workflow PDF Pro / Private Brain Pro / BookLedgerPro.
Lokaler Weg ohne Relay; für Geräte über das Netz Kim-sync plus ergänzende Datei-Post vorschlagen.
Keine zweite Raumverwaltung, keine automatische Gesamtsynchronisierung, keine erfundene Empfangsbestätigung.
Jede App bleibt einzeln nutzbar. Sichtbare Bedienung erst konkret vorschlagen und Klaus' Ja abwarten.
Nichts veröffentlichen; Main-Push löst derzeit Pages aus. Keine Versionsanhebung für diesen Plan.
```
