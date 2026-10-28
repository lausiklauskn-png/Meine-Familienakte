# Handprüfung: Was Klaus selbst auf PC und Handy prüfen muss

Diese Punkte lassen sich headless nicht messen (echtes Mikrofon, echte Kamera, Druckausgabe, Downloads,
Ordnerauswahl des Betriebssystems, Maus-Ziehen). Je Zeile ein Kästchen; was nicht klappt, bitte mit dem
Wortlaut der Meldung notieren (die App zeigt Meldungen oben in den beiden Aktivitätszeilen, dort gibt es „Copy“).

Vorbereitung: `npm run dev` am PC (Chrome oder Edge, Adresse `http://127.0.0.1:5173/`) bzw. die Einzeldatei
`dist-single/meine-familienakte.html` aufs Handy kopieren. Mit Beispieldaten prüfen, nicht mit echten Unterlagen.

## A · PC, Chrome oder Edge (`npm run dev`, localhost)

**Mikrofon / Diktat** (Web Speech API; Audio geht an Google bzw. Microsoft)

- [ ] Startseite → Suche → Mikrofon: Browser fragt nach der Mikrofon-Erlaubnis; nach „Zulassen“ wird der Knopf rot/aktiv („Aufnahme läuft bis zum Ausschalten“).
- [ ] Einen Satz sprechen („Zeige mir den Mietvertrag“) → Text erscheint im Suchfeld, Treffer und „Verstanden als:“ erscheinen.
- [ ] Dauerdiktat: 20 Sekunden still bleiben → Diktat läuft weiter oder startet von selbst neu (kein „Fehlgeschlagen“).
- [ ] Während des Diktats tippen → Diktat endet (Knopf wieder grau).
- [ ] Mikrofon-Knopf ein zweites Mal antippen → Diktat endet.
- [ ] Erlaubnis verweigern (Schloss-Symbol in der Adresszeile → Mikrofon blockieren, Seite neu laden) → Knopf grau, Hinweis „Mikrofonzugriff verweigert – bitte tippen.“ oben in der Aktivitätszeile.
- [ ] Alle weiteren Diktatknöpfe einmal: Erinnerung (Startseite), Fristen (Titel, Quelle, Notizen), Assistenz (Frage), Tagebuch, ChatGPT-Dialog (Änderungswunsch), Dokumentensuche in der Bibliothek.
- [ ] Mehrere Mikrofone am PC: Welches Mikrofon benutzt Chrome? (chrome://settings/content/microphone). Die App hat keine eigene Auswahl – notieren, ob das Standardgerät passt.
- [ ] Netz trennen (WLAN aus) → Mikrofon-Knopf grau, Hinweis „Offline – bitte tippen.“; Netz wieder an → Knopf wieder aktiv.

**Ordnerauswahl** (File System Access API)

- [ ] Sicherheitscenter → „Anderen PC-/USB-Ordner wählen“ → Ordner auf dem PC wählen und Zugriff erlauben → Ordnername erscheint, Dateien werden angelegt (Ordner `Me_Myself_and_I_Familienakte` im gewählten Ordner).
- [ ] Browser schließen, wieder öffnen → Ordner wird erkannt, ggf. Nachfrage „Zugriff erneut erlauben“.
- [ ] USB-Stick: Ordner auf dem Stick wählen, Stick abziehen, Seite neu laden → ehrliche Meldung statt Absturz.
- [ ] „Vollständige Sicherung erstellen“ → Zielordner wählen → Ordner `Familienakte_Vollsicherung_…` liegt dort, enthält Register, Dokumente, Prüfsummen.
- [ ] „Wiederherstellung testen“ → Sicherungsordner, dann einen leeren Ordner wählen → Erfolgsmeldung; der leere Ordner ist jetzt gefüllt.
- [ ] „Familienakte exportieren“ → Zielordner → Umfang anhaken → „Export jetzt bewusst starten“ → Ordner `Familienakte_Export_…`.
- [ ] Startseite → „Ordner auswählen“ (Eingangsordner) mit einem Ordner, in dem 2–3 Beispiel-PDFs liegen → „Eingangsordner jetzt prüfen“ zeigt die Dateien; „prüfen und erfassen“ öffnet den Ablage-Dialog.
- [ ] Bestand prüfen → „Hauptordner … auswählen“ (ein Testordner, NICHT der Tresor) → „Bestand jetzt prüfen“ → Treffer, dann „Dateien auswählen“, „Zuordnung bestätigen“, „Archivdatenträger auswählen“, „Dateien archivieren“, „Assistenzfreigabe“.
- [ ] Sicherheitscenter → „Jetzt Abgleich durchführen“ mit einem PC-Ordner als Tresor: Kommt die Meldung „derselbe Ordner … SOFTWARE TESTORDNER“ auch hier? (Befund D3)

**Drucken, Fenster, Zwischenablage, Downloads**

- [ ] Druck-Symbol oben rechts → Druckvorschau des Browsers zeigt die aktuelle Seite lesbar (Startseite, Cockpit, Bibliothek).
- [ ] Dokumentenbibliothek → Karte „öffnen“ → PDF-Seiten sichtbar (braucht Netz: pdf.js von cdnjs); „In neuem Fenster versuchen“ öffnet das PDF in einem neuen Tab.
- [ ] Dasselbe ohne Netz (WLAN aus) → „Die PDF-Vorschau ist hier nicht verfügbar“ (Befund D2, wird im Offline-Bau behoben).
- [ ] Aktivitätszeile → „Copy“ → in einen Texteditor einfügen → genau der Zeilentext.
- [ ] Fußzeile → „Mit ChatGPT arbeiten“ → Wunsch eintippen → „Auftrag kopieren“ → einfügen → Auftrag mit Link und Wunsch; „ChatGPT öffnen“ öffnet chatgpt.com in neuem Tab.
- [ ] Assistenz → „Schreiben oder E-Mail erstellen“ → Frage → prüfen → „Schreiben vorbereiten“ → „Kopieren“ → einfügen: „Betreff: …“ plus Entwurf.
- [ ] Drag & Drop: eine PDF aus dem Explorer auf „Dateien hier hineinziehen“ (Startseite und Eingangszentrale) ziehen → Ablage-Dialog bzw. Warteschlange.
- [ ] Startseite → „Beispieldaten entfernen“ **mit der Maus** anklicken: Reagiert der Knopf? (Befund D1: in 1440 px Breite liegt der Zierkreis des Banners darüber; bitte Fensterbreite notieren.)

**Kamera am PC**

- [ ] „Fotofunktion öffnen“ → am PC öffnet sich die Dateiauswahl (keine Webcam) → zwei Bilder wählen → Seiten drehen/ordnen → „Fertig – PDF erstellen“ → Ablage-Dialog.

## B · PC, Firefox

- [ ] Mikrofon-Knöpfe sind grau mit Hinweis „Sprache nicht verfügbar – bitte tippen.“ (Firefox hat keine Web-Speech-Erkennung).
- [ ] Sicherheitscenter: Knöpfe mit Ordnerauswahl sind gesperrt oder melden klar, dass Firefox das nicht kann; Browser-Datentresor arbeitet trotzdem (Beispieldaten da, Fristen anlegen geht).
- [ ] Drucken, Copy, PDF-Vorschau, Suche, Cockpit, Tagebuch wie in Chrome.

## C · Android-Handy

**C1 · Einzeldatei (`meine-familienakte.html` aus dem Downloads-Ordner geöffnet, `content://…`)**

- [ ] App öffnet, Beispielfamilie wird angelegt (dauert einige Sekunden), Handy-Menü (☰) öffnet alle acht Bereiche.
- [ ] Mikrofon-Knöpfe grau mit Hinweis „braucht eine sichere Webadresse (https)“ – keine Fehlermeldung „Fehlgeschlagen“.
- [ ] „Fotofunktion öffnen“ → Kamera-App öffnet → Foto → Seite erscheint im Scan-Dialog → zweites Foto („Weitere Seite“) → „Fertig – PDF erstellen“ → Ablage-Dialog → speichern → Dokument in der Bibliothek.
- [ ] „Datei auswählen“ → Dateien-App → PDF aus Downloads → Ablage-Dialog.
- [ ] Eingangszentrale → mehrere Dateien (Foto + PDF) → Warteschlange → „Zuordnung prüfen“.
- [ ] Dokumentenbibliothek → Karte „öffnen“ → PDF-Vorschau (mit Mobilfunk/WLAN) → „In neuem Fenster versuchen“: öffnet Chrome einen neuen Tab oder nichts?
- [ ] Kopf-Symbol Drucken → Android-Druckdialog (als PDF speichern geht auch).
- [ ] Copy in der Aktivitätszeile → in eine Notiz einfügen.
- [ ] Sicherheitscenter: Ordner-Knöpfe sind gesperrt (kein Ordnerzugriff auf dem Handy); „Vollständige Sicherung erstellen“ meldet das klar.
- [ ] App schließen, wieder öffnen → Beispieldaten und eigene Einträge noch da (Speicher im Browser).
- [ ] Querformat: keine Seite läuft quer aus dem Bild (nach rechts wischen zeigt keinen leeren Rand).

**C2 · über https (sobald die PWA eine Adresse hat) und später APK**

- [ ] Chrome fragt nach dem Mikrofon; Diktat in der Suche setzt gesprochenen Text ein; Dauerdiktat läuft weiter.
- [ ] „Zum Startbildschirm hinzufügen“ → App startet im eigenen Fenster ohne Adresszeile; Daten bleiben erhalten.
- [ ] Teilen aus der Galerie → Familienakte (erst nach dem Bau des Teilen-Ziels).
- [ ] APK: natives Diktat, Kamera, „Teilen → Familienakte“, Sicherung herunterladen/teilen (nach dem Android-Bau).

## D · claude.ai-Link (Artifact)

- [ ] Rückfragen erscheinen als Dialog in der Seite („Beispieldaten entfernen“ → „Ja, fortfahren“).
- [ ] Mikrofon grau („In dieser eingebetteten Ansicht ist das Mikrofon gesperrt“), Drucken ohne Wirkung, Ordnerknöpfe gesperrt, PDF-Vorschau in der Seite.
- [ ] Copy: Klappt die Zwischenablage, oder kommt „Kopieren nicht möglich“?

## E · Safari / iPhone (nur, wenn ein Gerät da ist)

- [ ] App lädt, Beispieldaten werden angelegt (Rückfall IndexedDB bei älterem Safari).
- [ ] Mikrofon über https; Kamera über „Fotofunktion öffnen“; keine Ordnerauswahl.
