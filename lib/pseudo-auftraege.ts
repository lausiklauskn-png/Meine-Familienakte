// Zuordnung je Auftrag (Plan Pseudonymisieren P10, Klaus' Freibrief 14.11.): Damit „2 Zurück“ auch nach einem Neustart weiß, welcher
// Platzhalter wofür steht, wird die Zuordnung eines Auftrags verschlüsselt aufbewahrt.
// - Schlüssel: aus dem Geheimnis der eigenen Profile abgeleitet (HKDF-SHA-256 → AES-GCM-256). In der Pro-App liegt dieses Geheimnis
//   im Pro-Tresor (Fach „profile“) oder im App-Speicher – ist der Tresor gesperrt, ist auch keine Zuordnung lesbar.
// - Die verschlüsselten Aufträge bleiben auf diesem Gerät; andere Pro-Apps sehen sie nicht (sie lesen nur die Profile).
// - Ablauf: „erledigt“ löscht sofort, nach 90 Tagen fällt ein Auftrag von selbst heraus; höchstens 50 offene.
// Reine Rechnung ohne DOM und ohne Netz (Probe scripts/run-pseudo-auftraege-tests.mjs).

export const AUFTRAG_FORMAT = "familienakte-pseudo-auftraege";
export const AUFTRAG_TAGE = 90;
export const AUFTRAG_HOECHSTENS = 50;
const TAG = 24 * 60 * 60 * 1000;

export type Auftrag = {
  id: string;
  /** Laufende Nummer: A1, A2 … (nur zum Ansprechen, nie mit Klartext). */
  nr: number;
  /** Neutral: „D01 PDF · D02 Mail“ – keine Dateinamen, keine Namen. */
  titel: string;
  aufgabe: string;
  erstellt: number;
  geaendert: number;
  /** Platzhalter → Klartext. Verlässt das Gerät nie. */
  map: Record<string, string>;
};
export type Verschluesselt = { id: string; nr: number; k: string; iv: string; daten: string; erstellt: number; geaendert: number };
export type Ablage = { format: typeof AUFTRAG_FORMAT; version: 1; naechsteNr: number; eintraege: Verschluesselt[] };

const subtle = () => { const s = globalThis.crypto?.subtle; if (!s) throw new Error("Verschlüsselung ist in dieser Umgebung nicht verfügbar."); return s; };
const unhex = (s: string) => Uint8Array.from(s.match(/../g) || [], (h) => parseInt(h, 16));
const b64 = (b: ArrayBuffer | Uint8Array) => { let s = ""; for (const x of new Uint8Array(b)) s += String.fromCharCode(x); return btoa(s); };
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const text = new TextEncoder();

export const leereAblage = (): Ablage => ({ format: AUFTRAG_FORMAT, version: 1, naechsteNr: 1, eintraege: [] });

/** AES-GCM-Schlüssel aus dem Profil-Geheimnis (32 Bytes hex); nicht exportierbar. */
export async function auftragSchluessel(geheimHex: string): Promise<CryptoKey> {
  if (!/^[0-9a-f]{64}$/i.test(geheimHex)) throw new Error("Profil-Geheimnis hat nicht die erwartete Form.");
  const basis = await subtle().importKey("raw", unhex(geheimHex), "HKDF", false, ["deriveKey"]);
  return subtle().deriveKey({ name: "HKDF", hash: "SHA-256", salt: text.encode(AUFTRAG_FORMAT), info: text.encode("zuordnung-v1") }, basis, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function verschluesseln(a: Auftrag, schluessel: CryptoKey, k: string): Promise<Verschluesselt> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const roh = text.encode(JSON.stringify({ titel: a.titel, aufgabe: a.aufgabe, map: a.map }));
  // Kennung und Nummer als Zusatzdaten: ein vertauschter Eintrag lässt sich nicht entschlüsseln.
  const daten = await subtle().encrypt({ name: "AES-GCM", iv, additionalData: text.encode(`${a.id}|${a.nr}|${a.erstellt}`) }, schluessel, roh);
  return { id: a.id, nr: a.nr, k, iv: b64(iv), daten: b64(daten), erstellt: a.erstellt, geaendert: a.geaendert };
}

export async function entschluesseln(v: Verschluesselt, schluessel: CryptoKey): Promise<Auftrag> {
  const roh = await subtle().decrypt({ name: "AES-GCM", iv: unb64(v.iv), additionalData: text.encode(`${v.id}|${v.nr}|${v.erstellt}`) }, schluessel, unb64(v.daten));
  const d = JSON.parse(new TextDecoder().decode(roh)) as { titel?: unknown; aufgabe?: unknown; map?: unknown };
  const map: Record<string, string> = {};
  if (d.map && typeof d.map === "object") for (const [t, w] of Object.entries(d.map as Record<string, unknown>)) if (/^⟦[A-Z][A-Z0-9_]*-\d+⟧$/.test(t) && typeof w === "string") map[t] = w;
  return { id: v.id, nr: v.nr, titel: String(d.titel || ""), aufgabe: String(d.aufgabe || ""), erstellt: v.erstellt, geaendert: v.geaendert, map };
}

export const laeuftAb = (v: Pick<Verschluesselt, "erstellt">) => v.erstellt + AUFTRAG_TAGE * TAG;
export const restTage = (v: Pick<Verschluesselt, "erstellt">, jetzt = Date.now()) => Math.max(0, Math.ceil((laeuftAb(v) - jetzt) / TAG));

/** Entfernt Abgelaufene und hält höchstens 50 (die ältesten fallen heraus). */
export function aufraeumen(a: Ablage, jetzt = Date.now()): Ablage {
  const frisch = a.eintraege.filter((v) => laeuftAb(v) > jetzt).sort((x, y) => y.geaendert - x.geaendert).slice(0, AUFTRAG_HOECHSTENS);
  return { ...a, eintraege: frisch };
}

/** Einträge ersetzen oder anfügen (gleiche id ersetzt). */
export function ablegen(a: Ablage, v: Verschluesselt): Ablage {
  return { ...a, naechsteNr: Math.max(a.naechsteNr, v.nr + 1), eintraege: [v, ...a.eintraege.filter((x) => x.id !== v.id)] };
}
export const entfernen = (a: Ablage, id: string): Ablage => ({ ...a, eintraege: a.eintraege.filter((x) => x.id !== id) });

export const ablageAlsText = (a: Ablage) => JSON.stringify(a);
export function ablageAusText(t: string | null): Ablage {
  if (!t) return leereAblage();
  try {
    const r = JSON.parse(t) as Partial<Ablage>;
    if (r.format !== AUFTRAG_FORMAT || r.version !== 1 || !Array.isArray(r.eintraege)) return leereAblage();
    const eintraege = r.eintraege.filter((v): v is Verschluesselt => Boolean(v && typeof v.id === "string" && typeof v.k === "string" && typeof v.iv === "string" && typeof v.daten === "string" && Number.isSafeInteger(v.nr) && Number.isSafeInteger(v.erstellt)));
    return { format: AUFTRAG_FORMAT, version: 1, naechsteNr: Number.isSafeInteger(r.naechsteNr) ? r.naechsteNr as number : 1, eintraege };
  } catch { return leereAblage(); }
}

const TOKEN = /⟦[A-Z][A-Z0-9_]*-\d+⟧/g;
export const platzhalterIn = (t: string) => [...new Set(t.match(TOKEN) || [])];

/** Welcher Auftrag passt zu einer Antwort? Der mit den meisten bekannten Platzhaltern; bei Gleichstand der neueste. */
export function passendster(liste: Auftrag[], antwort: string): { auftrag: Auftrag; bekannt: number; gesamt: number } | null {
  const t = platzhalterIn(antwort);
  if (!t.length || !liste.length) return null;
  let best: { auftrag: Auftrag; bekannt: number; gesamt: number } | null = null;
  for (const a of liste) {
    const bekannt = t.filter((x) => x in a.map).length;
    if (!bekannt) continue;
    if (!best || bekannt > best.bekannt || (bekannt === best.bekannt && a.geaendert > best.auftrag.geaendert)) best = { auftrag: a, bekannt, gesamt: t.length };
  }
  return best;
}
