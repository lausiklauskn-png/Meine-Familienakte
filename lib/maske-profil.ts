// Profile für die Maske (Plan Pseudonymisieren, Stufe C; Klaus 14.11.2026). Reine Rechnung: KEIN Netz, kein DOM, kein Speicher –
// die Probe prüft das am Quelltext. Gespeichert wird das Ergebnis von `profilAlsText` (nur im Pro-Tresor, Fach „profile“,
// oder in der Pro-App ohne Tresor neben der Akte; Basic speichert nichts).
//
// - Personen und Organisationen der Akte werden VERKNÜPFT (akteId), nicht kopiert: Name, Anschrift, Geburtsdatum kommen zur
//   Laufzeit aus der Akte; das Profil hält nur Zusätzliches (Schreibweisen, Nummern, Regel, feste Platzhalter-Nummer).
// - Nummern nur als HMAC-SHA-256-Fingerabdruck mit einem Profil-Geheimnis (32 Zufallsbytes, liegt in derselben verschlüsselten
//   Datei; EDPB-Leitlinien 01/2025: geheimer Schlüssel statt einfachem Hash). Angezeigt werden nur die letzten vier Zeichen.
// - Jeder Eintrag hat einen festen Platzhalter ⟦ICH-1⟧, ⟦FAMILIE-n⟧, ⟦KONTAKT-n⟧, ⟦STELLE-n⟧ (Form ⟦TYP-n⟧ wie Modul 25).

import type { MaskeProfil } from "./maske.ts";

export const PROFIL_FORMAT = "familyprojekt-maske-profil";
export type ProfilArt = "ich" | "familie" | "kontakt" | "stelle";
export const PROFIL_ARTEN: ProfilArt[] = ["ich", "familie", "kontakt", "stelle"];
export const ART_NAME: Record<ProfilArt, string> = { ich: "Ich", familie: "Familie", kontakt: "Kontakte", stelle: "Stellen" };
export type Regel = "verdecken" | "bleibt";
export type NummerAbdruck = { sorte: string; k: string; hmac: string; ende: string };
export type ProfilEintrag = {
  id: string; art: ProfilArt; anzeige: string; akteId?: string; schreibweisen: string[]; nummern: NummerAbdruck[];
  regel: Regel; nr: number; quelle: "akte" | "selbst" | "korrektur" | "uebernommen"; geaendert: number;
};
export type MaskeProfile = {
  format: typeof PROFIL_FORMAT; version: 1; schreiber: string; geaendert: number;
  /** Schlüssel für die Fingerabdrücke: Kennung (erste 8 Hex-Zeichen von SHA-256) → 32 Bytes hex. Übernommene bringen ihren mit. */
  schluessel: Record<string, string>; eigenerSchluessel: string;
  eintraege: ProfilEintrag[];
  /** Darf überall bleiben (Wörter, die nie verdeckt werden sollen). */
  nieVerdecken: string[];
};

const TOKEN_ART: Record<ProfilArt, string> = { ich: "ICH", familie: "FAMILIE", kontakt: "KONTAKT", stelle: "STELLE" };
export const platzhalter = (e: Pick<ProfilEintrag, "art" | "nr">) => `⟦${TOKEN_ART[e.art]}-${e.nr}⟧`;

const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const unhex = (s: string) => Uint8Array.from(s.match(/../g) || [], (h) => parseInt(h, 16));
const subtle = () => { const s = globalThis.crypto?.subtle; if (!s) throw new Error("Verschlüsselung ist in dieser Umgebung nicht verfügbar."); return s; };

export async function schluesselKennung(geheimHex: string): Promise<string> {
  return hex(await subtle().digest("SHA-256", unhex(geheimHex))).slice(0, 8);
}

/** Leere Profile mit frischem Geheimnis (32 Zufallsbytes). */
export async function neueProfile(schreiber = "familienakte"): Promise<MaskeProfile> {
  const geheim = hex(globalThis.crypto.getRandomValues(new Uint8Array(32)));
  const k = await schluesselKennung(geheim);
  return { format: PROFIL_FORMAT, version: 1, schreiber, geaendert: Date.now(), schluessel: { [k]: geheim }, eigenerSchluessel: k, eintraege: [], nieVerdecken: [] };
}

/** Nummer angleichen: ohne Leer-, Binde-, Schräg- und Punkte, groß; OCR-Verwechsler O→0 nur zwischen Ziffern. */
export function nummerNormal(roh: string): string {
  return roh.toUpperCase().replace(/[\s./-]+/g, "").replace(/(?<=\d)O(?=\d)/g, "0");
}

async function hmac(geheimHex: string, wert: string): Promise<string> {
  const key = await subtle().importKey("raw", unhex(geheimHex), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await subtle().sign("HMAC", key, new TextEncoder().encode(wert)));
}

/** Fingerabdruck einer Nummer (die Nummer selbst wird nirgends gespeichert). */
export async function nummerAbdruck(p: MaskeProfile, sorte: string, roh: string): Promise<NummerAbdruck> {
  const n = nummerNormal(roh);
  if (n.length < 5 || n.length > 34 || !/\d/.test(n)) throw new Error("Bitte eine Nummer mit 5 bis 34 Zeichen und mindestens einer Ziffer eingeben.");
  return { sorte: sorte.trim().slice(0, 40) || "Nummer", k: p.eigenerSchluessel, hmac: await hmac(p.schluessel[p.eigenerSchluessel], n), ende: n.slice(-4) };
}

export const nummerAnzeige = (a: NummerAbdruck) => `${a.sorte} ··· ${a.ende}`;

/** Kandidaten für Nummern im Text: Folgen aus Buchstaben-/Ziffern-Gruppen (getrennt durch ein Leer-, Binde-, Schrägstrich- oder
 *  Punktzeichen), 5–34 Zeichen, mindestens vier Ziffern. Jede zusammenhängende Teilfolge von bis zu acht Gruppen zählt. */
export function nummerKandidaten(text: string): string[] {
  const aus = new Set<string>();
  for (const m of text.matchAll(/[A-Za-z0-9]+(?:[ ./-][A-Za-z0-9]+)*/g)) {
    const gruppen: Array<{ start: number; ende: number }> = [];
    for (const g of m[0].matchAll(/[A-Za-z0-9]+/g)) gruppen.push({ start: m.index! + g.index!, ende: m.index! + g.index! + g[0].length });
    for (let i = 0; i < gruppen.length; i++) for (let j = i; j < Math.min(gruppen.length, i + 8); j++) {
      const s = text.slice(gruppen[i].start, gruppen[j].ende);
      const n = nummerNormal(s);
      if (n.length > 34) break;
      if (n.length >= 5 && (n.match(/\d/g) || []).length >= 4) aus.add(s);
    }
  }
  return [...aus];
}

/** Nummern aus den Profilen, die im Text stehen (über den Fingerabdruck gefunden), mit dem Platzhalter ihres Eintrags. */
export async function profilNummernImText(p: MaskeProfile, text: string): Promise<Array<{ wert: string; eintrag: ProfilEintrag }>> {
  const gesucht = new Map<string, ProfilEintrag>();
  for (const e of p.eintraege) for (const a of e.nummern) gesucht.set(`${a.k}:${a.hmac}`, e);
  if (!gesucht.size) return [];
  const schluessel = [...new Set([...gesucht.keys()].map((x) => x.split(":")[0]))].filter((k) => p.schluessel[k]);
  const aus: Array<{ wert: string; eintrag: ProfilEintrag }> = [];
  const gesehen = new Set<string>();
  for (const kand of nummerKandidaten(text)) {
    const n = nummerNormal(kand);
    for (const k of schluessel) {
      const e = gesucht.get(`${k}:${await hmac(p.schluessel[k], n)}`);
      if (e && !gesehen.has(kand)) { gesehen.add(kand); aus.push({ wert: kand, eintrag: e }); }
    }
  }
  return aus;
}

type AkteRecord = { id?: string; type?: string; data?: Record<string, unknown> };
const s = (d: Record<string, unknown> | undefined, k: string) => (d && typeof d[k] === "string" ? (d[k] as string).trim() : "");

/** Was aus der Akte zu einem verknüpften Eintrag gehört (Name, Anschrift, Mail, Telefon, Geburtsdatum). */
export function akteWerte(e: ProfilEintrag, records: AkteRecord[]): string[] {
  if (!e.akteId) return [];
  const r = records.find((x) => x.id === e.akteId);
  if (!r) return [];
  if (r.type === "organisation") return [s(r.data, "name")].filter(Boolean);
  const plz = [s(r.data, "postalCode"), s(r.data, "city")].filter(Boolean).join(" ");
  return [s(r.data, "displayName"), s(r.data, "street"), plz, s(r.data, "email"), s(r.data, "phone"), s(r.data, "birthDate")].filter((w) => w.length >= 3);
}

/** Anzeigename eines Eintrags (bei Verknüpfung der aktuelle Name aus der Akte). */
export function eintragName(e: ProfilEintrag, records: AkteRecord[]): string {
  return akteWerte(e, records)[0] || e.anzeige;
}

const normal = (w: string) => w.trim().replace(/\s+/g, " ").toLowerCase();
const nachname = (w: string) => { const t = w.trim().split(/\s+/); return t.length > 1 && t[t.length - 1].length >= 4 ? t[t.length - 1] : ""; };

/** Profile + Akte → Profil für `maskieren`: feste Platzhalter je Eintrag („immer verdecken“), Stellen und „darf bleiben“ als
 *  nieVerdecken, dazu Nummern aus dem Text (über den Fingerabdruck gefunden). Personen der Akte ohne Profil-Eintrag bleiben
 *  wie bisher (immer verdecken). */
export function maskeAusProfilen(p: MaskeProfile | null, records: AkteRecord[], basis: MaskeProfil, nummern: Array<{ wert: string; eintrag: ProfilEintrag }> = []): MaskeProfil {
  if (!p) return basis;
  const feste: Array<{ token: string; werte: string[] }> = [];
  const nie = new Set<string>(basis.nieVerdecken || []);
  const verknuepft = new Set<string>();
  for (const e of p.eintraege) {
    const werte = [eintragName(e, records), ...akteWerte(e, records).slice(1), ...e.schreibweisen].map((w) => w.trim()).filter((w) => w.length >= 2);
    const alle = [...new Set(werte)];
    for (const w of alle) verknuepft.add(normal(w));
    if (e.regel === "bleibt") { for (const w of alle) nie.add(w); continue; }
    // Nachname allein zählt mit – außer er steht in einer „darf bleiben“-Wendung („H. Sommer“ darf bleiben → „Sommer“ nicht von selbst).
    const nieWorte = new Set([...p.nieVerdecken, ...(basis.nieVerdecken || [])].flatMap((w) => normal(w).split(" ")));
    const mitNachname = e.art === "stelle" ? alle : [...alle, ...alle.map(nachname).filter((n) => n && !nieWorte.has(normal(n)))];
    feste.push({ token: platzhalter(e), werte: [...new Set([...mitNachname, ...nummern.filter((n) => n.eintrag.id === e.id).map((n) => n.wert)])] });
  }
  for (const w of p.nieVerdecken) nie.add(w);
  // Stellen aus der Akte, die im Profil auf „immer verdecken“ stehen, dürfen nicht mehr bleiben.
  const verdeckt = new Set(feste.flatMap((f) => f.werte.map(normal)));
  return {
    personen: basis.personen.filter((w) => !verknuepft.has(normal(w))),
    stellen: basis.stellen.filter((w) => !verdeckt.has(normal(w))),
    nieVerdecken: [...nie].filter((w) => !verdeckt.has(normal(w))),
    zusatz: basis.zusatz,
    feste,
  };
}

function naechsteNr(p: MaskeProfile, art: ProfilArt): number {
  return p.eintraege.filter((e) => e.art === art).reduce((m, e) => Math.max(m, e.nr), 0) + 1;
}

const neueId = () => `p-${Date.now().toString(36)}-${hex(globalThis.crypto.getRandomValues(new Uint8Array(4)))}`;

/** Neuer Eintrag (selbst angelegt, aus der Akte oder beim Korrigieren). Stellen sind ab Werk „darf bleiben“. */
export function eintragAnlegen(p: MaskeProfile, art: ProfilArt, anzeige: string, extra: Partial<ProfilEintrag> = {}): MaskeProfile {
  const name = anzeige.trim().slice(0, 120);
  if (name.length < 2) throw new Error("Bitte einen Namen mit mindestens zwei Zeichen eingeben.");
  const e: ProfilEintrag = { id: neueId(), art, anzeige: name, schreibweisen: [], nummern: [], regel: art === "stelle" ? "bleibt" : "verdecken", nr: naechsteNr(p, art), quelle: "selbst", geaendert: Date.now(), ...extra };
  return { ...p, geaendert: Date.now(), eintraege: [...p.eintraege, e] };
}

export function eintragAendern(p: MaskeProfile, id: string, aendern: (e: ProfilEintrag) => ProfilEintrag): MaskeProfile {
  return { ...p, geaendert: Date.now(), eintraege: p.eintraege.map((e) => (e.id === id ? { ...aendern(e), id: e.id, nr: e.nr, art: e.art, geaendert: Date.now() } : e)) };
}

export function eintragEntfernen(p: MaskeProfile, id: string): MaskeProfile {
  return { ...p, geaendert: Date.now(), eintraege: p.eintraege.filter((e) => e.id !== id) };
}

export function schreibweiseDazu(e: ProfilEintrag, wort: string): ProfilEintrag {
  const w = wort.trim().replace(/\s+/g, " ").slice(0, 120);
  if (w.length < 2 || normal(w) === normal(e.anzeige) || e.schreibweisen.some((x) => normal(x) === normal(w))) return e;
  return { ...e, schreibweisen: [...e.schreibweisen, w].slice(0, 50) };
}

/** Vorschläge aus der Akte: Personen (die erste als „Ich“, sonst Familie) und Organisationen (Stellen), die noch nicht verknüpft sind. */
export function vorschlaegeAusAkte(p: MaskeProfile, records: AkteRecord[]): Array<{ akteId: string; art: ProfilArt; name: string }> {
  const da = new Set(p.eintraege.map((e) => e.akteId).filter(Boolean));
  const hatIch = p.eintraege.some((e) => e.art === "ich");
  const aus: Array<{ akteId: string; art: ProfilArt; name: string }> = [];
  for (const r of records) {
    if (!r.id || da.has(r.id)) continue;
    if (r.type === "person" && s(r.data, "displayName").length >= 2) aus.push({ akteId: r.id, art: "familie", name: s(r.data, "displayName") });
    else if (r.type === "organisation" && s(r.data, "name").length >= 2) aus.push({ akteId: r.id, art: "stelle", name: s(r.data, "name") });
  }
  if (!hatIch) { const erste = aus.find((v) => v.art === "familie"); if (erste) erste.art = "ich"; }
  return aus;
}

export function ausAkteUebernehmen(p: MaskeProfile, auswahl: Array<{ akteId: string; art: ProfilArt; name: string }>): MaskeProfile {
  let q = p;
  for (const v of auswahl) q = eintragAnlegen(q, v.art, v.name, { akteId: v.akteId, quelle: "akte" });
  return q;
}

/** Korrigieren im Pseudo-Fenster: „immer verdecken“ als neuer Kontakt oder als Schreibweise eines Eintrags; „darf bleiben“ in die
 *  Liste nieVerdecken. Gibt die geänderten Profile zurück. */
export function korrigieren(p: MaskeProfile, wort: string, wie: Regel, ziel?: string): MaskeProfile {
  const w = wort.trim().replace(/\s+/g, " ");
  if (w.length < 2) return p;
  if (wie === "bleibt") {
    // Der Name eines Eintrags (so setzt „Zurückführen“ ihn ein) darf bleiben → der ganze Eintrag auf „darf bleiben“.
    const eintrag = p.eintraege.find((e) => normal(e.anzeige) === normal(w));
    if (eintrag) return eintragAendern(p, eintrag.id, (e) => ({ ...e, regel: "bleibt" }));
    const ohne = p.eintraege.map((e) => ({ ...e, schreibweisen: e.schreibweisen.filter((x) => normal(x) !== normal(w)) }));
    return { ...p, geaendert: Date.now(), eintraege: ohne, nieVerdecken: p.nieVerdecken.some((x) => normal(x) === normal(w)) ? p.nieVerdecken : [...p.nieVerdecken, w].slice(-500) };
  }
  const q = { ...p, nieVerdecken: p.nieVerdecken.filter((x) => normal(x) !== normal(w)) };
  if (ziel && q.eintraege.some((e) => e.id === ziel)) return eintragAendern(q, ziel, (e) => schreibweiseDazu(e, w));
  const da = q.eintraege.find((e) => normal(e.anzeige) === normal(w) || e.schreibweisen.some((x) => normal(x) === normal(w)));
  if (da) return eintragAendern(q, da.id, (e) => ({ ...e, regel: "verdecken" }));
  return eintragAnlegen(q, "kontakt", w, { quelle: "korrektur" });
}

export type ZusammenBericht = { zusammengefuehrt: string[]; neu: string[] };

/** Übernehmen aus einer anderen Pro-App: gleiche Gruppe + gleicher Name oder gleicher Fingerabdruck = ein Eintrag (Schreibweisen
 *  und Nummern zusammengelegt, nichts überschrieben, „immer verdecken“ gewinnt). Sonst neu mit eigener fester Nummer. Die
 *  Schlüssel der anderen App kommen mit, damit ihre Fingerabdrücke weiter erkannt werden. */
export function zusammenfuehren(eigen: MaskeProfile, fremd: MaskeProfile): { profile: MaskeProfile; bericht: ZusammenBericht } {
  let p: MaskeProfile = { ...eigen, schluessel: { ...fremd.schluessel, ...eigen.schluessel }, eintraege: [...eigen.eintraege] };
  const bericht: ZusammenBericht = { zusammengefuehrt: [], neu: [] };
  for (const f of fremd.eintraege) {
    const abdruecke = new Set(f.nummern.map((a) => `${a.k}:${a.hmac}`));
    const gleich = p.eintraege.find((e) => (e.art === f.art || (e.art !== "stelle" && f.art !== "stelle")) && (normal(e.anzeige) === normal(f.anzeige) || e.nummern.some((a) => abdruecke.has(`${a.k}:${a.hmac}`))));
    if (gleich) {
      p = eintragAendern(p, gleich.id, (e) => {
        let x = e;
        for (const w of [f.anzeige, ...f.schreibweisen]) x = schreibweiseDazu(x, w);
        const da = new Set(x.nummern.map((a) => `${a.k}:${a.hmac}`));
        return { ...x, nummern: [...x.nummern, ...f.nummern.filter((a) => !da.has(`${a.k}:${a.hmac}`))], regel: x.regel === "verdecken" || f.regel === "verdecken" ? "verdecken" : "bleibt" };
      });
      bericht.zusammengefuehrt.push(gleich.anzeige);
    } else {
      p = eintragAnlegen(p, f.art, f.anzeige, { schreibweisen: f.schreibweisen, nummern: f.nummern, regel: f.regel, quelle: "uebernommen" });
      bericht.neu.push(f.anzeige);
    }
  }
  for (const w of fremd.nieVerdecken) if (!p.nieVerdecken.some((x) => normal(x) === normal(w))) p = { ...p, nieVerdecken: [...p.nieVerdecken, w] };
  return { profile: { ...p, geaendert: Date.now() }, bericht };
}

export const profilAlsText = (p: MaskeProfile) => JSON.stringify(p);

const txt = (v: unknown, max: number) => (typeof v === "string" && v.length <= max ? v : null);
/** Profile aus Text (Tresor, andere App): fremde Daten – nur bekannte Felder, Längen begrenzt, sonst Fehler. */
export function profilAusText(text: string): MaskeProfile {
  let roh: Record<string, unknown>;
  try { roh = JSON.parse(text); } catch { throw new Error("Profil-Datei ist kein gültiges JSON."); }
  if (!roh || roh.format !== PROFIL_FORMAT || roh.version !== 1) throw new Error("Unbekanntes Profil-Format.");
  const schluessel: Record<string, string> = {};
  for (const [k, v] of Object.entries((roh.schluessel as Record<string, unknown>) || {})) if (/^[a-f0-9]{8}$/.test(k) && typeof v === "string" && /^[a-f0-9]{64}$/.test(v)) schluessel[k] = v;
  const eigener = txt(roh.eigenerSchluessel, 8);
  if (!eigener || !schluessel[eigener]) throw new Error("Profil-Datei ohne gültigen Schlüssel.");
  const eintraege: ProfilEintrag[] = [];
  for (const e of Array.isArray(roh.eintraege) ? roh.eintraege.slice(0, 2000) : []) {
    const art = PROFIL_ARTEN.find((a) => a === e?.art);
    const anzeige = txt(e?.anzeige, 120), id = txt(e?.id, 60);
    if (!art || !anzeige || !id || !Number.isSafeInteger(e?.nr) || e.nr < 1) continue;
    eintraege.push({
      id, art, anzeige, ...(txt(e.akteId, 80) ? { akteId: e.akteId } : {}),
      schreibweisen: (Array.isArray(e.schreibweisen) ? e.schreibweisen : []).map((w: unknown) => txt(w, 120)).filter(Boolean).slice(0, 50) as string[],
      nummern: (Array.isArray(e.nummern) ? e.nummern : []).filter((a: NummerAbdruck) => a && txt(a.sorte, 40) !== null && /^[a-f0-9]{8}$/.test(a.k) && /^[a-f0-9]{64}$/.test(a.hmac) && txt(a.ende, 4) !== null)
        .map((a: NummerAbdruck) => ({ sorte: a.sorte, k: a.k, hmac: a.hmac, ende: a.ende })).slice(0, 50),
      regel: e.regel === "bleibt" ? "bleibt" : "verdecken", nr: e.nr,
      quelle: ["akte", "selbst", "korrektur", "uebernommen"].includes(e.quelle) ? e.quelle : "selbst",
      geaendert: Number.isSafeInteger(e.geaendert) ? e.geaendert : 0,
    });
  }
  return {
    format: PROFIL_FORMAT, version: 1, schreiber: txt(roh.schreiber, 40) || "unbekannt", geaendert: Number.isSafeInteger(roh.geaendert) ? roh.geaendert as number : 0,
    schluessel, eigenerSchluessel: eigener, eintraege,
    nieVerdecken: (Array.isArray(roh.nieVerdecken) ? roh.nieVerdecken : []).map((w: unknown) => txt(w, 120)).filter(Boolean).slice(0, 500) as string[],
  };
}

/** Profile einer anderen App als eigene übernehmen (wenn hier noch keine sind): der Schlüssel bleibt derselbe, damit beide Apps
 *  für dieselbe Nummer denselben Fingerabdruck rechnen und spätere Übernahmen auch über die Nummer zusammenfinden. */
export function alsEigene(p: MaskeProfile, schreiber = "familienakte"): MaskeProfile {
  return { ...p, schreiber, geaendert: Date.now(), eintraege: p.eintraege.map((e) => ({ ...e, quelle: e.quelle === "akte" ? "akte" : "uebernommen" })) };
}

export const APP_NAMEN: Record<string, string> = { "familienakte": "Familienakte", "private-brain": "Private Brain Pro", "workflow-pdf-pro": "Workflow PDF Pro", "bookledgerpro": "BookLedgerPro", "private-brain-v3": "Private Brain V3" };
