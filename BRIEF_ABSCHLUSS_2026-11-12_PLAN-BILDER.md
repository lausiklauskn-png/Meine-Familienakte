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

## Stundennachweis

| Zeit (UTC, 12.11.) | Arbeit |
|---|---|
| 07:30–07:50 | Bestand gelesen (Scan, OCR, Prüfkern, Klon), Plan und Brief geschrieben |

## Startauftrag

```
Familienakte (lausiklauskn-png/Meine-Familienakte). CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-12_CLOUD-ORDNER-2.28.65.md und
docs/PLAN_2026-11-12_BILDER.md lesen. Zuerst Klaus' Antworten auf F1–F8 aufnehmen, dann Stufe A (HTML-Vorschau
docs/vorschau/bilder-2.28.66.html) zeigen; nach Klaus' Ja Stufe B, dann C bauen (je Stufe ein PR auf main). Nächste freie
Fassung 2.28.66, gesammelt ausgeben. Gerätetest 2.28.65 bleibt offen (siehe Cloud-Ordner-Brief).
```
