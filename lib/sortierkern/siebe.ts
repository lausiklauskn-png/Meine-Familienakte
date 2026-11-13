import { istGehaltsabrechnung, gehaltLesen } from "./gehalt.ts";
import type { Datei, Wert } from "./typen.ts";
import { absenderAusGruss, erkenneAbsender, erkenneBetrag, erkenneBetrifft, erkenneDatum, erkenneFrist, erkenneKategorie, erkenneNummern, erkenneSchriftstueck } from "./erkennen.ts";
import { FOTOS } from "./kategorien.ts";
import { absenderName } from "./eml.ts";
import { lernregelAnwenden } from "./lernen.ts";
import { artMitModell, bereichMitModell } from "./wortmodell.ts";
import type { Lernregel } from "./typen.ts";

/**
 * Die fünf Siebe. Jedes liest nur so viel, wie es braucht:
 * 1 Art (Dateikopf, Fingerabdruck – macht die App beim Einlesen) · 2 Kopf (Anfang des Textes, Foto-Metadaten, Mail-Kopf)
 * 3 Kategorie und Nummern · 4 Absender · 5 Inhalt (ganzer Text: wer ist gemeint, Frist, Betrag).
 * Bestätigte oder korrigierte Felder fasst ein Sieb nie an.
 */
export const STUFEN = [
  { nr: 0, name: "Eingang", kurz: "alles in einem Ordner" },
  { nr: 1, name: "Art", kurz: "Dateikopf, Doppelte" },
  { nr: 2, name: "Kopf", kurz: "Briefkopf, Foto-Daten" },
  { nr: 3, name: "Kategorie", kurz: "Lebensbereich, Nummern" },
  { nr: 4, name: "Absender", kurz: "wer schreibt" },
  { nr: 5, name: "Inhalt", kurz: "wer ist gemeint, Frist" },
] as const;

export const KOPF_ZEICHEN = 1500;

export const gesperrt = (d: Datei) => Boolean(d.auffaellig || d.doppeltVon);
const textOhne = (d: Datei) => !d.kopfText && !d.volltext;

function setze(d: Datei, feld: keyof Omit<Datei["felder"], "nummern">, wert: Wert | undefined) {
  if (!wert || d.bestaetigt?.[feld as "kategorie"]) return;
  d.felder[feld] = wert;
}

/** Ein Sieb auf eine Datei anwenden (verändert die Kopie und gibt sie zurück). */
export function siebe(datei: Datei, stufe: number, regeln: Lernregel[] = []): Datei {
  const d: Datei = { ...datei, felder: { ...datei.felder } };
  if (gesperrt(d) || stufe <= d.stufe && stufe !== 0) return d;
  if (d.groesse === 0) { d.stufe = Math.max(d.stufe, stufe); return d; } // leere Datei: Hinweis aus dem Einlesen bleibt stehen
  const kopf = (d.kopfText || d.volltext || "").slice(0, KOPF_ZEICHEN);
  const voll = d.volltext || d.kopfText || "";
  if (stufe >= 2 && d.stufe < 2) {
    if (d.art === "bild" && textOhne(d)) {
      setze(d, "schriftstueck", { wert: "Foto", sicher: true, grund: d.bild?.aufnahme ? "Bild ohne lesbaren Text, Aufnahmedaten vorhanden" : "Bild ohne lesbaren Text", quelle: "regel" });
      if (d.bild?.aufnahme) setze(d, "datum", { wert: d.bild.aufnahme.slice(0, 10), sicher: true, grund: `Aufnahme laut Foto-Daten${d.bild.modell ? ` (${d.bild.modell})` : ""}`, quelle: "regel" });
    } else {
      setze(d, "schriftstueck", istGehaltsabrechnung(voll) ? { wert: "Abrechnung", sicher: true, grund: "Gehaltsabrechnung erkannt (Brutto, Netto, Abzüge)", quelle: "regel" } : artMitModell(erkenneSchriftstueck(kopf, d.email?.betreff), `${d.email?.betreff || ""}\n${voll}`));
      const datum = d.email?.datum ? { wert: d.email.datum, sicher: true, grund: "Datum der E-Mail", quelle: "regel" as const } : erkenneDatum(kopf);
      setze(d, "datum", datum || (d.geaendert ? { wert: new Date(d.geaendert).toISOString().slice(0, 10), sicher: false, grund: "kein Datum im Text – Änderungsdatum der Datei", quelle: "regel" } : undefined));
    }
  }
  if (stufe >= 3 && d.stufe < 3) {
    if (d.art === "bild" && textOhne(d)) setze(d, "kategorie", { wert: FOTOS, sicher: true, grund: "Foto ohne Text – Zuordnung später (Texterkennung kommt in einer späteren Fassung)", quelle: "regel" });
    else if (istGehaltsabrechnung(voll)) setze(d, "kategorie", { wert: "Rente, Arbeit & Sozialversicherung", sicher: true, grund: "Gehaltsabrechnung", quelle: "regel" });
    else setze(d, "kategorie", bereichMitModell(erkenneKategorie(`${d.email?.betreff || ""}\n${kopf}`, d.email?.von || erkenneAbsender(kopf)?.wert || absenderAusGruss(voll)?.wert || "", d.felder.schriftstueck?.wert), `${d.email?.betreff || ""}\n${voll}`));
    d.felder.nummern = erkenneNummern(kopf + "\n" + (d.email?.betreff || ""));
  }
  if (stufe >= 4 && d.stufe < 4) {
    if (d.email?.von) setze(d, "absender", { wert: absenderName(d.email.von), sicher: true, grund: "Absender der E-Mail", quelle: "regel" });
    else if (!textOhne(d)) setze(d, "absender", erkenneAbsender(kopf) || absenderAusGruss(voll) || { wert: "unbekannt", sicher: false, grund: "kein Absender im Kopf gefunden", quelle: "regel" });
    else setze(d, "absender", { wert: d.bild?.modell ? `eigenes Foto (${d.bild.modell})` : "eigenes Foto", sicher: true, grund: "Foto ohne Text", quelle: "regel" });
    // Gelerntes wirkt ab hier: es kennt den Absender
    for (const r of regeln) lernregelAnwenden(d, r);
  }
  if (stufe >= 5 && d.stufe < 5) {
    if (!textOhne(d)) {
      // erst jetzt der ganze Text; Nummern ergänzen, die nur weiter unten stehen
      const weitere = erkenneNummern(voll).filter((n) => !d.felder.nummern?.some((x) => x.art === n.art && x.wert === n.wert));
      d.felder.nummern = [...(d.felder.nummern || []), ...weitere];
      setze(d, "betrifft", erkenneBetrifft(voll) || { wert: "unbekannt", sicher: false, grund: "keine Anrede, kein Anschriftfeld", quelle: "regel" });
      setze(d, "frist", erkenneFrist(voll, d.felder.datum?.wert, d.felder.datum?.sicher !== false));
      setze(d, "betrag", erkenneBetrag(voll));
      const g = gehaltLesen(voll);
      if (g) { d.gehalt = g; if (g.auszahlung) setze(d, "betrag", { wert: `${g.auszahlung} €`, sicher: true, grund: "Auszahlungsbetrag der Gehaltsabrechnung", quelle: "regel" }); }
    }
    for (const r of regeln) lernregelAnwenden(d, r);
  }
  d.stufe = Math.max(d.stufe, stufe);
  return d;
}

/** Felder, die nach dem gegebenen Sieb noch unsicher sind (nur die dieses Siebs). */
export function unsichereFelder(d: Datei, stufe: number): string[] {
  if (gesperrt(d)) return [];
  const je: Record<number, Array<keyof Datei["felder"]>> = { 2: ["schriftstueck"], 3: ["kategorie"], 4: ["absender"], 5: ["betrifft"] };
  return (je[stufe] || []).filter((f) => { const v = d.felder[f] as Wert | undefined; return v && !v.sicher && !d.bestaetigt?.[f as "kategorie"]; }) as string[];
}

export const istUnsicher = (d: Datei, stufe: number) => unsichereFelder(d, stufe).length > 0;

/** Alle noch unsicheren Felder aus allen Sieben, die über die Datei gelaufen sind (für die Prüfliste). */
export const offeneFelder = (d: Datei): string[] => [2, 3, 4, 5].filter((s) => s <= d.stufe).flatMap((s) => unsichereFelder(d, s));
