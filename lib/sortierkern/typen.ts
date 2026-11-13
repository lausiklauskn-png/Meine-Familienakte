/** Gemeinsame Typen des Datei-Organizers. Rein, ohne Browser und ohne Node. */

export type DateiArt = "pdf" | "bild" | "email" | "office" | "text" | "archiv" | "programm" | "unbekannt";

export type Quelle = "regel" | "gelernt" | "du";

/** Ein erkannter Wert mit Sicherheit und Grund – nie ohne Grund. */
export type Wert = { wert: string; sicher: boolean; grund: string; quelle: Quelle; vorher?: string };

export type Nummer = { art: string; wert: string };

export type BildMeta = {
  aufnahme?: string;     // ISO-Datum der Aufnahme (EXIF DateTimeOriginal)
  hersteller?: string;
  modell?: string;
  breite?: number;
  hoehe?: number;
  gps?: { lat: number; lon: number };
};

/** Merkmale aus dem Inneren einer Datei, gelesen vom Prüfkern des Auslieferungsprüfers (PDF-Metadaten, XMP) – auch wenn kein Text lesbar ist. */
export type Innen = { autor?: string; programm?: string; erzeuger?: string; titel?: string; betreff?: string; erstellt?: string; befunde: string[];
  /** PDF-Kennung (Trailer /ID): erste = Herkunft, bleibt beim Weiterspeichern gleich; zweite = diese Fassung. */
  pdfKennung?: { herkunft: string; fassung: string } };

/** Ähnliche Datei (kein exakt gleicher Inhalt): ältere Fassung, gleicher Text, gleicher Beleg, gleiches Foto, gleicher Name. */
export type Aehnlich = { art: "fassung" | "inhalt" | "beleg" | "foto" | "name"; zu: string; grund: string };

export type EmailMeta = { von?: string; an?: string; betreff?: string; datum?: string; anhaenge: string[] };

export type Felder = {
  schriftstueck?: Wert;
  datum?: Wert;
  kategorie?: Wert;
  absender?: Wert;
  betrifft?: Wert;
  frist?: Wert;
  betrag?: Wert;
  nummern?: Nummer[];
};

export type FeldName = "schriftstueck" | "kategorie" | "absender" | "betrifft" | "datum" | "frist";

export type Datei = {
  /** Pfad im Ordner, z. B. „Eingang/scan_0412.pdf“. Eindeutig. */
  pfad: string;
  name: string;
  groesse: number;
  geaendert: number;
  sha256?: string;
  art?: DateiArt;
  artText?: string;
  /** Grund, warum die Datei gesperrt ist (Endung passt nicht zum Inhalt, Programm …). */
  auffaellig?: string;
  /** Pfad der ersten Datei mit gleichem Fingerabdruck. */
  doppeltVon?: string;
  /** Ähnlich zu einer anderen Datei, aber nicht byte-gleich (bleibt sichtbar, wird nur markiert). */
  aehnlich?: Aehnlich;
  /** Merkmale aus dem Datei-Innern (Prüfkern). */
  innen?: Innen;
  bild?: BildMeta;
  email?: EmailMeta;
  /** Anfang des Textes (Kopf) – Sieb 2 bis 4 lesen nur ihn. */
  kopfText?: string;
  /** Ganzer Text – erst Sieb 5. */
  volltext?: string;
  textQuelle?: "pdf" | "email" | "text" | "office" | "ocr" | "keiner";
  /** Bis zu welchem Sieb die Datei gesiebt ist (0 = nur im Eingang). */
  stufe: number;
  felder: Felder;
  /** Archivnummer (z. B. „A-2026-0007“), erst vergeben, wenn die Reihenfolge steht; ändert sich danach nie. */
  archivnummer?: string;
  /** Gelesene Gehaltsabrechnung (Zeitraum, Brutto, Netto, Abzüge, Steuer-ID …), nur bei Gehaltsabrechnungen. */
  gehalt?: import("./gehalt.ts").Gehalt;
  /** Felder, die der Nutzer bestätigt oder korrigiert hat. */
  bestaetigt?: Partial<Record<FeldName, true>>;
};

export type Korrektur = { zeit: string; pfad: string; feld: FeldName; von: string; zu: string; bestaetigt?: boolean };

export type Lernregel = { wenn: { absender: string; sache?: string }; feld: "kategorie" | "betrifft" | "schriftstueck"; dann: string; anzahl: number; stimmen?: Record<string, number> };
