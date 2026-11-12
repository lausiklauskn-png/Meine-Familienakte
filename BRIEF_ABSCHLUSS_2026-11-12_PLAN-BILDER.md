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
- Zweiter Auftrag derselben Sitzung: **Sortiersieb** `docs/PLAN_2026-11-12_SORTIERSIEB.md` – Eingangsordner, Stufen Art → Kopf →
  Kategorie/Nummern → Absender → Inhalt, Teil-Lesen, Regeln + Briefkopf + kleines Bedeutungsmodell, Verlauf/Rückgängig,
  Übergabe per `sieb-index.json` als Vorarbeit für Familienakte, andere Programme, LLM und Embedding-Modelle. Fragen S1–S11; entschieden S1 (eigene App), S2 (ein Ordner, Baum), S7 (Übernahme in die Akte), S9 (Lehrer = Claude Haiku 5.5
  über die Schnittstelle, pseudonymisiert, nie über das Repo). Marktvergleich (Paperless-ngx, Docspell, DEVONthink, fileee/Docutain,
  Hazel/File Juggler) mit übernommenen und vermiedenen Mustern im Plan.

## Stundennachweis

| Zeit (UTC, 12.11.) | Arbeit |
|---|---|
| 07:30–07:50 | Bestand gelesen (Scan, OCR, Prüfkern, Klon), Plan und Brief geschrieben |
| 07:50–08:05 | Plan Sortiersieb (Bestand Eingang/Bestand prüfen/Briefkopf gelesen) |
| 08:05–09:30 | Sortiersieb: Entscheidungen, Marktvergleich, KI-Wahl, Datenweg zum Lehrer |

## Startauftrag

```
Familienakte (lausiklauskn-png/Meine-Familienakte). CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-12_CLOUD-ORDNER-2.28.65.md und
docs/PLAN_2026-11-12_BILDER.md und docs/PLAN_2026-11-12_SORTIERSIEB.md lesen. Zuerst Klaus' Antworten auf F1–F8 und den offenen S-Fragen (S8; S3–S6 und S11 entschieden)
aufnehmen; Sortiersieb bekommt das eigene Repo Datei-Organizer (Klaus legt es an), dann Stufe A (HTML-Vorschau
docs/vorschau/bilder-2.28.66.html) zeigen; nach Klaus' Ja Stufe B, dann C bauen (je Stufe ein PR auf main). Nächste freie
Fassung 2.28.66, gesammelt ausgeben. Gerätetest 2.28.65 bleibt offen (siehe Cloud-Ordner-Brief).
```
