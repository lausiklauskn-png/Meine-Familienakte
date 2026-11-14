// Maske (Plan Pseudonymisieren, Stufe B; Klaus 14.11.2026 „Pseudo“-Knopf): die verbesserte Erkennung AUF Modul 25.
// Modul 25 (public/native/25_pseudonym.js) bleibt byte-1:1 aus Sage; was hier neu ist (deutsche Nummern mit Prüfziffer,
// Geburtsdatum, ICD-Code mit Gruppe, Marke gegen doppeltes Pseudonymisieren, Stellen dürfen bleiben), geht später als
// Modul 25 Gen. 3 nach Sage zurück. Reine Rechnung: KEIN Netz, kein DOM, kein Speicher – die Probe prüft das am Quelltext.

import { FAMILIEN_MUSTER, type Pseudonymisierer } from "./ki-auftrag.ts";
import { namenImText } from "./namensmuster.ts";

export const MARKE = "⟦PSEUDONYMISIERT v1⟧";
const TOKEN_G = /⟦[A-Z][A-Z0-9_]*-\d+⟧/g;

/** Schon pseudonymisiert? Marke am Anfang oder mindestens drei Platzhalter → nie ein zweites Mal verarbeiten. */
export function istPseudonymisiert(text: string): boolean {
  return text.trimStart().startsWith("⟦PSEUDONYMISIERT") || (text.match(TOKEN_G) || []).length >= 3;
}

// ── Prüfziffern (Verfahren öffentlich beschrieben: BZSt, GKV-Spitzenverband, DRV, BSI TR-03127) ─────────────────
const ziff = (s: string) => s.split("").map(Number);
const quer = (n: number) => String(n).split("").reduce((a, c) => a + Number(c), 0);
const buchstabeZahl = (c: string) => String(c.toUpperCase().charCodeAt(0) - 64).padStart(2, "0");

/** Steuer-Identifikationsnummer: 11 Ziffern, erste ≠ 0, ISO 7064 MOD 11,10. */
export function istSteuerId(roh: string): boolean {
  const s = roh.replace(/[\s/]/g, "");
  if (!/^[1-9]\d{10}$/.test(s)) return false;
  let produkt = 10;
  for (const d of ziff(s.slice(0, 10))) { let summe = (d + produkt) % 10; if (summe === 0) summe = 10; produkt = (summe * 2) % 11; }
  const pruef = (11 - produkt) % 10;
  return pruef === Number(s[10]);
}

/** Krankenversichertennummer: Buchstabe + 8 Ziffern + Prüfziffer (Gewichte 1-2, Quersumme, mod 10). */
export function istKvnr(roh: string): boolean {
  const s = roh.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]\d{9}$/.test(s)) return false;
  const kette = buchstabeZahl(s[0]) + s.slice(1, 9);
  const summe = ziff(kette).reduce((a, d, i) => a + quer(d * (i % 2 === 0 ? 1 : 2)), 0);
  return summe % 10 === Number(s[9]);
}

/** Rentenversicherungsnummer: 2 Ziffern Bereich, 6 Geburtsdatum, Buchstabe, 2 Ziffern, Prüfziffer. */
export function istRvnr(roh: string): boolean {
  const s = roh.replace(/\s/g, "").toUpperCase();
  const m = s.match(/^(\d{2})(\d{6})([A-Z])(\d{2})(\d)$/);
  if (!m) return false;
  const tag = Number(m[2].slice(0, 2)), monat = Number(m[2].slice(2, 4));
  if (tag < 1 || tag > 31 || monat < 1 || monat > 12) return false;
  const kette = m[1] + m[2] + buchstabeZahl(m[3]) + m[4];
  const gew = [2, 1, 2, 5, 7, 1, 2, 1, 2, 1, 2, 1];
  const summe = ziff(kette).reduce((a, d, i) => a + quer(d * gew[i]), 0);
  return summe % 10 === Number(m[5]);
}

/** Personalausweis/Pass (ab 2010): 9 Zeichen + Prüfziffer, Gewichte 7-3-1, Buchstaben A=10 … Z=35. */
export function istAusweisNr(roh: string): boolean {
  const s = roh.replace(/\s/g, "").toUpperCase();
  if (!/^[CFGHJKLMNPRTVWXYZ0-9]{9}\d$/.test(s) || !/\d/.test(s.slice(0, 9))) return false;
  const wert = (c: string) => /\d/.test(c) ? Number(c) : c.charCodeAt(0) - 55;
  const gew = [7, 3, 1];
  const summe = s.slice(0, 9).split("").reduce((a, c, i) => a + wert(c) * gew[i % 3], 0);
  return summe % 10 === Number(s[9]);
}

// ICD-10: Gruppe statt Code (Kapitel nach dem ersten Buchstaben, grob).
const ICD_GRUPPE: Record<string, string> = { A: "Infektion", B: "Infektion", C: "Neubildung", D: "Neubildung/Blut", E: "Stoffwechsel", F: "Psyche", G: "Nerven", H: "Auge/Ohr", I: "Kreislauf", J: "Atmung", K: "Verdauung", L: "Haut", M: "Muskel/Skelett", N: "Niere/Harnwege", O: "Schwangerschaft", P: "Neugeborene", Q: "Fehlbildung", R: "Symptom", S: "Verletzung", T: "Verletzung", Z: "Gesundheitsfaktor" };
export const icdGruppe = (code: string) => ICD_GRUPPE[code[0].toUpperCase()] || "Gesundheit";

export type Fund = { type: string; value: string };

/** Nummern und Angaben, die Modul 25 nicht kennt – nur mit stimmender Prüfziffer oder mit Feldwort davor. */
export function maskeFunde(text: string): Fund[] {
  const out: Fund[] = [];
  const nimm = (re: RegExp, type: string, pruef?: (v: string) => boolean, gruppe = 0) => {
    for (const m of text.matchAll(re)) { const v = (m[gruppe] || "").trim(); if (v && (!pruef || pruef(v))) out.push({ type, value: v }); }
  };
  nimm(/(?<![\d])[1-9]\d(?:[ /]?\d{3}){3}(?![\d])/g, "STEUERID", istSteuerId);
  nimm(/\b[A-Z]\d{9}\b/g, "KVNR", istKvnr);
  nimm(/\b\d{2}\s?\d{6}\s?[A-Z]\s?\d{3}\b/g, "RVNR", istRvnr);
  nimm(/(?:Ausweis|Personalausweis|Reisepass|Pass|Dokumentennummer)[^\n\dA-Z]{0,25}([CFGHJKLMNPRTVWXYZ0-9]{9}\d)\b/g, "AUSWEIS", istAusweisNr, 1);
  nimm(/\bDE\s?\d{3}\s?\d{3}\s?\d{3}\b/g, "USTID");
  nimm(/(?:geb\.|geboren(?: am)?|Geburtsdatum|Geb\.-Datum)\s*:?\s*(\d{1,2}\.\s?\d{1,2}\.\s?\d{2,4})/gi, "GEBURTSDATUM", undefined, 1);
  nimm(/(?:Kunden|Vertrags|Versicherungs|Mitglieds|Policen|Zähler|Personal|Akten|Steuer)[-\s]?(?:nummer|nr\.?|schein-?nr\.?)\s*:?\s*([A-Z0-9][A-Z0-9 ./-]{3,24}[A-Z0-9])/gi, "NUMMER", (v) => /\d/.test(v), 1);
  for (const m of text.matchAll(/(?:ICD(?:-10)?(?:-GM)?|Diagnosen?|Dg\.)\s*:?\s*((?:[A-TV-Z]\d{2}(?:\.\d{1,2})?[GVAZRLB]?\s*[,;]?\s*)+)/g)) {
    for (const c of m[1].match(/[A-TV-Z]\d{2}(?:\.\d{1,2})?[GVAZRLB]?/g) || []) out.push({ type: "ICD", value: c });
  }
  return out;
}

const STELLE_BLEIBT = /\s(?:GmbH|AG|SE|KG|KGaA|OHG|e\.\s?V\.|mbH|Ltd\.?|Inc\.?|LLC|S\.A\.|B\.V\.|N\.V\.)(?:\s*&\s*Co\.?\s*KG)?$/;

export type MaskeProfil = {
  personen: string[];     // immer verdecken (Personen der Akte, eigene Zusatzwörter)
  stellen: string[];      // dürfen stehen bleiben (Organisationen der Akte)
  nieVerdecken?: string[];
  zusatz?: string[];
};

export type MaskeErgebnis = { text: string; map: Record<string, string>; funde: Fund[]; leck: string | null; unsicher: string[]; schonPseudonymisiert: boolean };

/** Pseudonymisiert einen Text (ein Klick „Pseudo“). Daten und Beträge bleiben stehen (Sortieren, Fristen), Firmen mit
 *  großer Rechtsform und Stellen aus der Akte bleiben, alles Persönliche wird ⟦TYP-n⟧. Schon Pseudonymisiertes bleibt
 *  byte-gleich. `map` setzt Platzhalter aus früheren Texten fort. */
export function maskieren(p: Pseudonymisierer, text: string, profil: MaskeProfil, map: Record<string, string> = {}): MaskeErgebnis {
  if (istPseudonymisiert(text)) return { text, map, funde: [], leck: null, unsicher: [], schonPseudonymisiert: true };
  const nie = new Set([...(profil.nieVerdecken || []), ...profil.stellen].map((w) => w.trim().toLowerCase()).filter(Boolean));
  const muster = namenImText(text);
  const unsicher: string[] = [];
  const namen: Array<{ value: string; type: string }> = [];
  for (const t of muster) {
    const w = t.wert.trim();
    if (w.length < 3 || /^⟦/.test(w) || nie.has(w.toLowerCase()) || w.split(/\s+/).some((x) => nie.has(x.toLowerCase()))) continue;
    if (t.grund === "firma" && STELLE_BLEIBT.test(w)) continue;
    if (t.grund === "zweiWoerter") unsicher.push(w);
    namen.push({ value: w, type: t.grund === "firma" ? "FIRMA" : "NAME" });
  }
  for (const n of [...profil.personen, ...(profil.zusatz || [])]) {
    const w = n.trim();
    if (w.length >= 3 && !nie.has(w.toLowerCase())) namen.push({ value: w, type: "PERSON" });
    // Nachname allein (letztes Wort ab 4 Zeichen) gehört zur Person aus der Akte.
    const teile = w.split(/\s+/);
    if (teile.length > 1 && teile[teile.length - 1].length >= 4) namen.push({ value: teile[teile.length - 1], type: "PERSON" });
  }
  const funde = maskeFunde(text);
  const werte = [...funde, ...namen].sort((a, b) => b.value.length - a.value.length);
  let vorher = text;
  for (const [tok, wert] of Object.entries(map).sort((a, b) => b[1].length - a[1].length)) vorher = vorher.split(wert).join(tok);
  const r = p.pseudonymize(vorher, {
    values: werte, map,
    types: ["SCHLUESSEL", "MAIL", "IBAN", "RECHNUNG", "TELEFON"],
    customPatterns: FAMILIEN_MUSTER,
  });
  const ganz = { ...map, ...r.map };
  // ICD: Platzhalter bekommt die Gruppe dazu, damit eine KI nach Gesundheitsbereich sortieren kann.
  const mitGruppe = r.text.replace(/⟦ICD-\d+⟧(?! \[)/g, (tok) => `${tok} [${icdGruppe(ganz[tok] || "Z")}]`);
  const fertig = `${MARKE}\n${mitGruppe}`;
  return { text: fertig, map: ganz, funde: r.findings.map((f) => ({ type: f.type, value: f.value })), leck: p.findLeak(fertig, ganz), unsicher: [...new Set(unsicher)], schonPseudonymisiert: false };
}

/** Zurückführen: Platzhalter einer KI-Antwort wieder durch die echten Angaben ersetzen (nur auf dem Gerät). */
export function zurueckfuehren(p: Pseudonymisierer, antwort: string, map: Record<string, string>): { text: string; offen: string[] } {
  const ohne = antwort.replace(/^⟦PSEUDONYMISIERT[^⟧]*⟧\n?/, "");
  const text = p.rehydrate(ohne, map);
  return { text, offen: [...new Set(text.match(TOKEN_G) || [])] };
}

/** Profil aus der Akte: Personen werden verdeckt, Organisationen (Stellen) dürfen bleiben. */
export function profilAusAkte(records: Array<{ type?: string; data?: Record<string, unknown> }>): MaskeProfil {
  const personen: string[] = [], stellen: string[] = [];
  for (const r of records) {
    const d = r.data || {};
    const s = (k: string) => (typeof d[k] === "string" ? (d[k] as string).trim() : "");
    if (r.type === "person") { for (const k of ["displayName", "street", "email", "phone"]) if (s(k).length >= 3) personen.push(s(k)); }
    else if (r.type === "organisation") { if (s("name").length >= 3) stellen.push(s("name")); }
    else if (s("contractNumber").length >= 3) personen.push(s("contractNumber"));
  }
  return { personen: [...new Set(personen)], stellen: [...new Set(stellen)] };
}

export function runMaskeSelfTests(p: Pseudonymisierer) {
  const tests: Array<{ label: string; passed: boolean; summary: string }> = [];
  const t = (label: string, passed: boolean, summary: string) => tests.push({ label, passed, summary });
  // Erfundene Nummern mit stimmender Prüfziffer (hier berechnet), dazu je eine mit falscher Prüfziffer.
  const mitPruef = (basis: string, test: (v: string) => boolean) => { for (let d = 0; d < 10; d++) if (test(basis + d)) return basis + d; return ""; };
  const stid = mitPruef("4715820369", istSteuerId);
  const kvnr = mitPruef("T52817364", istKvnr);
  const rvnr = mitPruef("12030481M00", istRvnr);
  const ausw = mitPruef("L01X00T47", istAusweisNr);
  t("Prüfziffern", Boolean(stid && kvnr && rvnr && ausw) && !istSteuerId(stid.slice(0, 10) + ((Number(stid[10]) + 1) % 10)) && !istKvnr(kvnr.slice(0, 9) + ((Number(kvnr[9]) + 1) % 10)), `${stid} ${kvnr} ${rvnr} ${ausw}`);
  const brief = `Sehr geehrte Frau Mara Testfeld,\nLindenweg 12, 12345 Musterstadt, geb. 03.04.1981\nSteuer-ID ${stid}, KVNR ${kvnr}, RV-Nr. ${rvnr}, Personalausweis ${ausw}\nKundennummer: KD-2024-118833, IBAN DE89 3704 0044 0532 0130 00, Tel. 0170 1234567\nDiagnose: I10.9, E11.9\nIhr Vertrag bei der Schirmchen Versicherung GmbH endet am 31.12.2026, offen 412,50 €. Gruß Ole Brink`;
  const profil: MaskeProfil = { personen: ["Mara Testfeld"], stellen: ["Wolkenpost"] };
  const r = maskieren(p, brief, profil);
  const draussen = ["Mara", "Testfeld", "Lindenweg 12", "12345 Musterstadt", "03.04.1981", stid, kvnr, rvnr, ausw, "KD-2024-118833", "DE89", "0170 1234567", "I10.9", "E11.9", "Ole Brink"];
  const offen = draussen.filter((x) => r.text.includes(x));
  t("Verdeckt", offen.length === 0 && r.leck === null, offen.length ? `noch im Klartext: ${offen.join(", ")}` : `${r.funde.length} Stellen verdeckt`);
  t("Bleibt stehen", r.text.includes("Schirmchen Versicherung GmbH") && r.text.includes("31.12.2026") && r.text.includes("412,50 €"), "Firma mit Rechtsform, Frist und Betrag bleiben (Sortieren)");
  t("ICD mit Gruppe", /⟦ICD-\d+⟧ \[Kreislauf\]/.test(r.text) && /⟦ICD-\d+⟧ \[Stoffwechsel\]/.test(r.text), "Code verdeckt, Gruppe lesbar");
  t("Marke", r.text.startsWith(MARKE) && istPseudonymisiert(r.text), "Kopfzeile ⟦PSEUDONYMISIERT v1⟧");
  const zweimal = maskieren(p, r.text, profil, r.map);
  t("Nie doppelt", zweimal.schonPseudonymisiert && zweimal.text === r.text, "zweiter Durchlauf ändert kein Zeichen");
  const tokName = Object.keys(r.map).find((k) => r.map[k] === "Mara Testfeld") || "";
  const zur = zurueckfuehren(p, `${MARKE}\nLiebe ${tokName}, Ihre Steuer-ID ist bekannt. ⟦NAME-99⟧`, r.map);
  t("Zurückführen", zur.text.startsWith("Liebe Mara Testfeld,") && zur.offen.join() === "⟦NAME-99⟧", zur.text);
  const stelle = maskieren(p, "Schreiben der Wolkenpost an Herrn Brandt.", profil);
  t("Stelle aus der Akte bleibt", stelle.text.includes("Wolkenpost") && !stelle.text.includes("Brandt"), stelle.text);
  const klein = maskieren(p, "Rechnung von Heike Sommer e.K., Inhaberin Heike Sommer.", { personen: [], stellen: [] });
  t("Kleinunternehmen verdeckt", !klein.text.includes("Sommer"), klein.text);
  return tests;
}
