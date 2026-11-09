/** Im eigenen Netz antworten: dünne Schicht über den Kanon-Modulen (Modul 03 Sprachmodell, 04 Treffer, 23 Rendezvous).
 *  Die Module bleiben byte-1:1; hier steht nur, was die Familienakte ihnen gibt. Regeln und Rechnung: lib/netz-antwort.ts.
 *  Vektoren kommen aus Modul 03 (dasselbe Modell, mit dem Modul 04 die Frage einbettet). Die Vektoren der Bedeutungssuche der
 *  Akte werden bewusst nicht benutzt: dort kann ein anderes Modell (mittel/groß, 768/1024 Werte) gewählt sein, und Modelle
 *  werden nicht vermischt. Alles bleibt im Speicher dieses Geräts; nichts wird gemerkt außer den zwei Schaltern. */
import { antwortFilter, netzKorpusEintraege, type NetzAntwortEinstellung, type NetzDokument } from "../lib/netz-antwort.ts";

type Rdv = {
  _meta?: { network?: string; answering?: boolean; answeredCount?: number };
  configure?: (o: Record<string, unknown>) => void;
  enableAnswering?: (o?: unknown) => Promise<{ ok: boolean; reason?: string }>;
  disableAnswering?: () => void;
  connectAndAnnounce?: (o?: unknown) => Promise<{ ok: boolean; reason?: string }>;
};
type Emb = { init?: () => Promise<void>; isReady?: () => boolean; embedPassage: (t: string) => Promise<ArrayLike<number>> };
type Match = { queryLocal: (q: string, k?: number, o?: unknown) => Promise<Array<{ label?: string; anchorId?: string }>>; setLocalCorpus?: (c: unknown) => void } & Record<string, unknown>;
type W = Window & { SbkimRendezvous?: Rdv; SbkimEmbedding?: Emb; SbkimMatch?: Match };
const w = () => window as W;

const SCHALTER = "fa_netz_antwort_v1";
export function einstellungLesen(): NetzAntwortEinstellung {
  try { const o = JSON.parse(localStorage.getItem(SCHALTER) || "{}"); return { ausschnitt: o.ausschnitt === true, gesundheit: o.gesundheit === true }; }
  catch { return { ausschnitt: false, gesundheit: false }; }
}
export function einstellungMerken(e: NetzAntwortEinstellung) {
  try { localStorage.setItem(SCHALTER, JSON.stringify({ ausschnitt: !!e.ausschnitt, gesundheit: !!e.gesundheit })); } catch { /* ohne Speicher gilt die Vorgabe „aus“ */ }
}

/** Steht Modul 23 gerade in einem eigenen Netz? Bei jeder Frage neu gelesen. */
export const imEigenenNetz = () => w().SbkimRendezvous?._meta?.network === "eigen";

let an = false;
let anzahl = 0;
export const antwortStand = () => ({ an: an && !!w().SbkimRendezvous?._meta?.answering, anzahl, beantwortet: Number(w().SbkimRendezvous?._meta?.answeredCount) || 0 });

/** Schaltet das Antworten ein. Gibt einen Grund zurück, wenn es nicht geht (kein eigenes Netz, kein Sprachmodell …). */
export async function antwortenAn(docs: NetzDokument[], e: NetzAntwortEinstellung, onStatus?: (i: number, n: number) => void): Promise<{ ok: boolean; reason?: string; anzahl?: number }> {
  const r = w().SbkimRendezvous, emb = w().SbkimEmbedding, echt = w().SbkimMatch;
  if (!r || typeof r.enableAnswering !== "function" || typeof r.configure !== "function") return { ok: false, reason: "Die Netz-Bausteine sind noch nicht geladen." };
  if (!imEigenenNetz()) return { ok: false, reason: "Antworten gibt es nur im eigenen Netz. Im Fenster „Verbinden …“ unter „Netz“ ein eigenes Netz wählen (Beitritts-Link oder Code)." };
  if (!echt || typeof echt.queryLocal !== "function") return { ok: false, reason: "Der Treffer-Baustein (Modul 04) ist nicht geladen." };
  if (!emb || typeof emb.embedPassage !== "function") return { ok: false, reason: "Dafür braucht es das Sprachmodell der Netz-Bausteine." };
  if (r._meta?.answering) antwortenAus();
  const eintraege = netzKorpusEintraege(docs, e);
  if (!eintraege.length) return { ok: false, reason: "Keine Unterlage darf antworten (leer oder nur geschützte Unterlagen)." };
  let korpus;
  try {
    if (typeof emb.init === "function") await emb.init();
    korpus = [];
    for (let i = 0; i < eintraege.length; i++) {
      onStatus?.(i + 1, eintraege.length);
      const roh = await emb.embedPassage(eintraege[i].text);
      // Modul 04 (validateCorpus) verlangt Float32Array – eine gewöhnliche Liste ließe jede Antwort still leer.
      const passageVec = roh instanceof Float32Array ? roh : Float32Array.from(roh as ArrayLike<number>);
      korpus.push({ label: eintraege[i].label, text: eintraege[i].text, anchorId: eintraege[i].anchorId, passageVec });
    }
  } catch (err) {
    return { ok: false, reason: `Das Sprachmodell ist nicht bereit (${String((err as Error)?.message || err).slice(0, 120)}). Es wird beim ersten Mal aus dem Internet geladen.` };
  }
  const auszuege = e.ausschnitt ? new Map(eintraege.filter((x) => x.auszug).map((x) => [x.anchorId, x.auszug])) : null;
  try { r.configure({ prepareCorpus: async () => korpus, match: antwortFilter(echt, { eigen: imEigenenNetz, auszuege }) }); }
  catch (err) { return { ok: false, reason: String((err as Error)?.message || err) }; }
  echt.setLocalCorpus?.(korpus);
  if (typeof r.connectAndAnnounce === "function") {
    const anm = await r.connectAndAnnounce({}).catch((err: Error) => ({ ok: false, reason: String(err?.message || err) }));
    if (anm && anm.ok === false) { antwortenAus(); return { ok: false, reason: anm.reason || "Anmelden im Netz ging nicht." }; }
  }
  const res = await r.enableAnswering({}).catch((err: Error) => ({ ok: false, reason: String(err?.message || err) }));
  an = !!res?.ok; anzahl = an ? korpus.length : 0;
  if (!an) antwortenAus();
  return { ok: an, reason: res?.reason, anzahl };
}

/** Schaltet das Antworten ab und nimmt den Korpus aus dem Speicher (idempotent). */
export function antwortenAus() {
  const r = w().SbkimRendezvous;
  an = false; anzahl = 0;
  try { r?.disableAnswering?.(); } catch { /* fail-soft */ }
  try { r?.configure?.({ prepareCorpus: null, match: null }); } catch { /* fail-soft */ }
  try { w().SbkimMatch?.setLocalCorpus?.(null); } catch { /* fail-soft */ }
}
