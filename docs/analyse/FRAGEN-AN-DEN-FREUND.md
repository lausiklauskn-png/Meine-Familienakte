# Fragen an den Freund

Nur Punkte, die sich aus Code, Hilfetexten, Versionshistorie und Prüfskripten nicht klären ließen.

1. **Gesundheit & Arbeit:** Die Seiten Diagnosen, Krankenkasse und Arbeit zeigen feste Inhalte aus `app/health-data.json`,
   nicht den Datentresor. Soll dieser Bereich später aus dem Tresor leben (Dokumente und Vorgänge mit Lebensbereich
   „Gesundheit“), oder bleibt er eine eigene, von Hand gepflegte Datei?
2. **„Für den Assistenten freigeben“:** Heute entsteht daraus ein Dokumentdatensatz, den der regelbasierte Assistent als
   „Aktenhinweis“ nennt. War eine KI dahinter geplant (Recherche „B · Aktuell recherchiert“ ist `not_configured`)? Mit
   welchem Dienst, und sollten Dokumente vorher anonymisiert werden?
3. **Datenschutzklassen** `allgemein / vertraulich / besonders geschützt` werden aus dem Dateinamen vergeben und steuern
   heute nur die Anzeige. Sollen sie einmal einen Hinausweg sperren (z. B. „besonders geschützt“ nie an eine KI)?
4. **Dubletten:** Gleicher Inhalt mit anderem Namen, der später kommt, wird beim Speichern ohne Bestätigungsweg abgelehnt.
   Gewollt (strenge Sperre) oder soll „Trotzdem übernehmen“ auch hier gelten?
5. **Eingangszentrale liest nur Dateinamen**, „Bestand prüfen“ liest Inhalte (DOCX/PDF). Ist das Absicht (Geschwindigkeit),
   oder soll die Eingangszentrale dieselbe Inhaltsanalyse nutzen?
6. **„Jetzt Abgleich durchführen“** vergleicht Analyse-Hauptordner und Tresor und nennt den Ordner „SOFTWARE TESTORDNER“.
   Was ist der gedachte Normalfall für Privatnutzer ohne Entwicklungsordner?
7. **Löschen im Tagebuch per Tippwort** („VERBLEIBEN / MITLÖSCHEN / ABBRECHEN“): bewusst als Schutz, oder dürfen es drei
   Knöpfe werden?
8. **Fristen-Formular** verlangt Kennungen wie `PER-000001`. Soll dort eine Auswahl aus vorhandenen Personen, Objekten
   und Vorgängen hin?
9. **Zwei Versionssysteme** („Website-Version 40“ und „2.28.1“): Welches soll weiterleben, wenn die App als PWA, APK und
   Windows-App ausgeliefert wird?
10. **„Ausloggen“** lädt nur die Seite neu; es gibt kein Konto mehr. Soll der Knopf bleiben, umbenannt werden
    (z. B. „Neu laden“) oder entfallen? (Klaus entscheidet den Wortlaut.)
11. **Mikrofone unter Windows:** Welche Mikrofone sind im Einsatz (Headset, USB, eingebaut), und wird heute in Windows
    oder im Browser umgeschaltet? Das bestimmt, ob die feste Mikrofonauswahl aus Private Brain Pro (SAPI) passt.
12. **Scanner und Handy:** Kommen Dokumente heute per Scanner-App, per Multifunktionsgerät in einen Ordner oder per
    E-Mail? Das entscheidet zwischen „Teilen → Familienakte“, Eingangsordner und `.eml`-Import.
