# Sitzungsbrief: Familienakte weiter (nach 2.28.55)

Für die nächste Bausitzung an der Familienakte. Vorher: `BRIEF_ABSCHLUSS_2026-11-10_GERAETETEST-2.28.53.md` (Fassungen 2.28.53–2.28.55),
`BRIEF_SITZUNG_2026-11-10_VERBUND-GEPLANTE-PUNKTE.md` (graue/rote Wege der Pro-Verbund-Karte, eigene Sitzung).

## Jetzt abarbeitbar (Reihenfolge = Empfehlung)

| # | Punkt | Was | Vorher klären |
|---|---|---|---|
| 1 | **Tresor: nur Laufwerk wählen** (Klaus 10.11.) | Ordnerwahl öffnet direkt auf dem Laufwerk (`EXTRA_INITIAL_URI`), möglichst gleich im Ordner „Family-Projekt“, wenn er schon da ist. Ein leerer, in der Auswahl neu angelegter Ordner „Family-Projekt“ gilt selbst als Tresorort (heute entsteht darin ein zweiter). Namensfenster entfällt: immer „Family-Projekt“, bei Belegung „Family-Projekt 2“. Nur in `FamilienakteTresorPlugin.java`/`ProTresorAdapter`; `Hauptordner.java` ist byte-gleich und bleibt unberührt. | **Grenze von Android (ab 11): die oberste Ebene von Gerätespeicher und SD-Karte lässt sich in der Ordnerwahl nicht auswählen.** Darum musste Klaus einen Ordner („Familienakte“) wählen. Klaus' Ja zum Vorschlag einholen (Vorschau). |
| 2 | **Seite „Sicherheit & lokaler Tresor“ kürzer** (Klaus 10.11., Vorschau-Punkt 5: Ja) | Dasselbe Prinzip wie die Pro-Tresor-Karte 2.28.55 für die übrigen Karten: Zustand und Knöpfe sichtbar, Erklärungen hinter „Mehr“ oder „?“, keine Kennungen im Blick. | Vorschau zeigen (je Karte vorher/nachher), dann bauen. |
| 3 | **Proben-Wettlauf `kalender-einlesen`** | Einmal rot (`sync:"tok1"`), Wiederholung grün (#149). Auf das gespeicherte Token mit einer Bedingung warten, nicht mit einer Frist. | – |
| 4 | **BookLedger Basic: neue Verbund-Karte** | trägt noch `3cbe20f1…`; mit `tools/pro-nachziehen.mjs --pro ../BookLedgerPro` nachziehen (Repo BookLedger-Basic). | – |
| 5 | **Landkarte als HTML** `docs/landkarte/Familienakte-Landkarte.html` | Stand 07.11., alte Farben. Wenn sie in die Geschenkbox soll: aus `lib/app-landkarte.ts` neu erzeugen (Werkzeug fehlt) und wie die Verbund-Karte in `tools/geschenkbox-datei.mjs` als eigene Seite einbinden. | Klaus: soll sie in die Geschenkbox? |
| 6 | **Vollsicherung: welcher Ordner scheiterte?** | Gerätetest 10.11.: „Ordnerzugriff fehlgeschlagen“ – seit 2.28.55 mit Grund und Code. Klaus' nächste Meldung lesen; falls `FA_ORDNER_NICHT_ERREICHBAR` beim Schreiben: Freigabe/Ort klären. | Meldung von Klaus abwarten. |

## Am Gerät zu prüfen (gelb, kein Bau)

- **2.28.55:** Meldungen oben (Hinweis statt „Prüfung erforderlich“, verschwindet nach der nächsten Meldung), kurze Tresor-Karte, „Mehr“.
- **2.28.54:** Fäden der Landkarte am Tablet mit großer Schrift, Legenden-Knöpfe; Verbund-Karte aus der Geschenkbox öffnet in eigenem Fenster.
- **2.28.53:** Papierkorb (Löschen → Zurückholen → endgültig), Glocken-Probe mit gewähltem Ton, Haken „Zuordnung stimmt“.
- **2.28.52:** Tresor-Leser mit echtem Tresor, Update-Fähnchen, gelbe Wege der Verbund-Karte im selben Tresor.

## Regeln

- Kein Release ohne Klaus' Wort; neue Funktionen gleich als APK, PWA und Windows. Nächste freie Fassung **2.28.56**.
- Neue Oberfläche erst als HTML-Vorschau. Byte-gleiche Bausteine nie von Hand. Codex auslassen. Forschung nur in KimHub.
- **Vor jedem Push:** die ganze UI-Reihe oder `grep -rn` in `tests/ui` nach geänderten Selektoren und Texten (Lehre #150, #153).

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte (bei Bedarf BookLedger-Basic, BookLedgerPro mit add_repo).
Zuerst lesen: CLAUDE.md, BRIEF_SITZUNG_2026-11-11_FAMILIENAKTE-WEITER.md, BRIEF_ABSCHLUSS_2026-11-10_GERAETETEST-2.28.53.md.
Auftrag: die Punkte 1–6 der Tabelle „Jetzt abarbeitbar“ in dieser Reihenfolge. Für 1 und 2 zuerst eine HTML-Vorschau und Klaus' Ja,
für 5 und 6 zuerst Klaus fragen. Je Punkt eigener Zweig und PR, Proben + Gegenprobe, vor dem Push ganze UI-Reihe oder grep.
Danach als nächste freie Fassung (2.28.56) als APK, Windows, PWA ausgeben, Nachweis schreiben, Geschenkbox nachziehen
(node tools/geschenkbox-datei.mjs, Artefakt XeUMGuSZ49FzsJYjwQznM7 mit Datei pro-verbund.html).
Nicht: veröffentlichte Fassungen erneut ausgeben, Hauptordner.java oder andere byte-gleiche Bausteine von Hand ändern, Codex anstoßen.
```
