# Abschlussbrief 12.11.2026: Plan Bilder in der Familienakte

Nur Plan, nichts gebaut, nichts ausgegeben. Plan: `docs/PLAN_2026-11-12_BILDER.md`.

## Inhalt

- Bestand erhoben: Dokumentscan macht jedes Foto zum PDF; Texterkennung (Tesseract aus dem Klon) läuft vor dem Ablegen;
  `pruefer-anhang.js` liest nur EXIF-Textfelder und ob GPS da ist; `reinigung.js` entfernt Metadaten, ungenutzt; Prüfkern
  `dateiPruefen` läuft im Stapel nacheinander im Vordergrund; Bildbeschreibung im Klon, nicht angeschlossen; `verkleinern.ts`
  verliert beim Neukodieren alle Metadaten; Fahrzeuge haben kein Kennzeichen-Feld; Barcode/QR gibt es nirgends.
- Stufen A–G: Vorschau · Fotos als eigene Art + Metadaten-Leser (`lib/bild-metadaten.ts`) · Nacharbeit im Hintergrund
  (erst ablegen, dann lesen; Warteschlange in IndexedDB, Android `ArbeitDienst`) · Kennzeichen-Feld und -Erkennung, Ort, weitere
  Zuordnungen, Bildbeschreibung später · Barcodes (GiroCode, Medikationsplan, Sendungsnummer, EAN) mit Prüfung nur bei Code-Fund ·
  Teilen ohne Ort · Proben.
- Fragen F1–F8 an Klaus im Plan.
- Zweiter Auftrag derselben Sitzung: **Datei-Organizer** `docs/PLAN_2026-11-12_DATEI-ORGANIZER.md` (Verweis; Plan im Repo Datei-Organizer, `docs/PLAN.md`) – Eingangsordner, Stufen Art → Kopf →
  Kategorie/Nummern → Absender → Inhalt, Teil-Lesen, Regeln + Briefkopf + kleines Bedeutungsmodell, Verlauf/Rückgängig,
  Übergabe per `organizer-index.json` als Vorarbeit für Familienakte, andere Programme, LLM und Embedding-Modelle. Fragen S1–S11; entschieden S1 (eigene App), S2 (ein Ordner, Baum), S7 (Übernahme in die Akte), S9 (Lehrer = Claude Haiku 5.5
  über die Schnittstelle, pseudonymisiert, nie über das Repo). Marktvergleich (Paperless-ngx, Docspell, DEVONthink, fileee/Docutain,
  Hazel/File Juggler) mit übernommenen und vermiedenen Mustern im Plan.

## Stundennachweis

| Zeit (UTC, 12.11.) | Arbeit |
|---|---|
| 07:30–07:50 | Bestand gelesen (Scan, OCR, Prüfkern, Klon), Plan und Brief geschrieben |
| 07:50–08:05 | Plan Datei-Organizer (Bestand Eingang/Bestand prüfen/Briefkopf gelesen) |
| 08:05–09:30 | Datei-Organizer: Entscheidungen, Marktvergleich, KI-Wahl, Datenweg zum Lehrer |
| 09:30–10:20 | Repo Datei-Organizer: Plan übernommen, CLAUDE.md, Vorschau Stufe A |
| 10:20–11:00 | Datei-Organizer 0.1.0 gebaut (Freibrief): Kern, Oberfläche, 101 Testdateien, Proben (letzter Commit 11:00:19) |

Spanne gemessen am ersten und letzten Commit; Zeit vor dem ersten Commit ist nicht enthalten.

## Startauftrag

```
Familienakte (lausiklauskn-png/Meine-Familienakte). CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-12_CLOUD-ORDNER-2.28.65.md und
docs/PLAN_2026-11-12_BILDER.md und docs/PLAN_2026-11-12_DATEI-ORGANIZER.md (Verweis; Plan im Repo Datei-Organizer) lesen. Zuerst Klaus' Antworten auf F1–F8 und den offenen S-Fragen (S1–S11 entschieden)
aufnehmen. Datei-Organizer: Repo lausiklauskn-png/Datei-Organizer, Fassung 0.1.0 gebaut (Zweig claude/familienakte-bildintegration-il59yw,
Entwurfs-PR #1; Kern 85 grün, Browser-Probe 40 grün). Klaus' Gerätetest abholen (SD-Karte über Familienakte Pro, PC), dann in der
Familienakte „Ordner übernehmen“ mit organizer-index.json bauen (Kern byte-gleich mit Pin). Bilder: Stufe A (HTML-Vorschau
docs/vorschau/bilder-2.28.66.html) zeigen; nach Klaus' Ja Stufe B, dann C bauen (je Stufe ein PR auf main). Nächste freie
Fassung 2.28.66, gesammelt ausgeben. Gerätetest 2.28.65 bleibt offen (siehe Cloud-Ordner-Brief).
```
