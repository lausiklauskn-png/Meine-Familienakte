/**
 * Im eigenen Netz antworten (Klaus 2026-11-09, Freibrief: „die Brücken zwischen den Pro-Apps sollen funktionieren“).
 * Reine Rechnung ohne DOM: welche Unterlagen ein anderer Knoten im EIGENEN Netz finden darf und was die Antwortzeile zeigt.
 * Regeln (Gesundheitsdaten!):
 *  - ab Werk aus; geantwortet wird nur in einem eigenen Netz (Modul 23 `_meta.network === "eigen"`), bei jeder Frage neu geprüft –
 *    im öffentlichen Netz nie, auch nicht, wenn das Netz während des Antwortens gewechselt wird;
 *  - Antwortzeile: Titel · Bereich · Datum; ein kurzer Ausschnitt nur mit dem Schalter „Mit Ausschnitt“;
 *  - geschützte Unterlagen (Gesundheit & Pflege, Vorsorge, Gesundheitswörter im Titel) nur mit „Gesundheit einbeziehen“;
 *  - aus der Akte genommene Unterlagen nie.
 * Vorbild: BookLedgerPro `src/domain/ueberall.js` (antwortFilter, ausschnittLabel) und `src/sbkim/netz.js`.
 */
import { kurzfassungGeschuetzt } from "./tresor-kurzfassung.ts";

/** Modul 23 kappt jede Antwortzeile bei 200 Zeichen (RDV_LABEL_MAX, Kanon). */
export const ANTWORT_LABEL_MAX = 200;
/** So viel gelesener Text geht je Unterlage in den Vergleich (nur mit „Mit Ausschnitt“). */
export const VERGLEICH_TEXT_MAX = 700;
/** Höchstens so viele Unterlagen im Antwort-Korpus (Rechenzeit am Handy). */
export const KORPUS_MAX = 400;

export type NetzAntwortEinstellung = { ausschnitt: boolean; gesundheit: boolean };
export type NetzDokument = {
  id: string; originalName: string; category: string; documentDate: string | null;
  titel?: string | null; textAuszug?: string | null; aussortiert?: unknown;
};
export type NetzEintrag = { label: string; text: string; anchorId: string; auszug: string };

const einzeilig = (t: unknown) => String(t ?? "").replace(/\s+/g, " ").trim();
const datumText = (iso?: string | null) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? `${m[3]}.${m[2]}.${m[1]}` : ""; };

export function netzTitel(d: NetzDokument) {
  const titel = einzeilig(d.titel) || einzeilig(d.originalName).replace(/\.[a-z0-9]{2,5}$/i, "");
  return [titel, einzeilig(d.category), datumText(d.documentDate)].filter(Boolean).join(" · ").slice(0, ANTWORT_LABEL_MAX);
}

/** Einträge für den Antwort-Korpus. Ohne „Mit Ausschnitt“ wird nur nach Titel · Bereich · Datum verglichen (der Text bleibt ganz weg). */
export function netzKorpusEintraege(docs: NetzDokument[], e: NetzAntwortEinstellung): NetzEintrag[] {
  const aus: NetzEintrag[] = [];
  for (const d of docs) {
    if (aus.length >= KORPUS_MAX) break;
    if (!d || !d.id || d.aussortiert) continue;
    if (!e.gesundheit && kurzfassungGeschuetzt(d)) continue;
    const label = netzTitel(d);
    if (!label) continue;
    const auszug = e.ausschnitt ? einzeilig(d.textAuszug).slice(0, VERGLEICH_TEXT_MAX) : "";
    aus.push({ label, text: auszug ? `${label} · ${auszug}` : label, anchorId: `fa:${d.id}`, auszug });
  }
  return aus;
}

/** Suchwörter einer Frage (ab drei Zeichen, ohne Satzzeichen). */
export function suchwoerter(frage: string) {
  return [...new Set(einzeilig(frage).toLocaleLowerCase("de").split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3))];
}

/** Titel — Ausschnitt um das erste gefundene Suchwort; zusammen höchstens `max` Zeichen. Zu wenig Platz → nur der Titel. */
export function ausschnittLabel(label: string, text: string, frage: string, max = ANTWORT_LABEL_MAX) {
  const l = einzeilig(label).slice(0, max);
  const roh = einzeilig(text);
  const rest = max - l.length - 3;
  if (!roh || rest < 40) return l;
  const klein = roh.toLocaleLowerCase("de");
  let pos = -1;
  for (const w of suchwoerter(frage)) { const i = klein.indexOf(w); if (i >= 0 && (pos < 0 || i < pos)) pos = i; }
  const start = pos < 0 ? 0 : Math.max(0, pos - Math.floor(rest / 3));
  let stueck = roh.slice(start, start + rest);
  if (start > 0) stueck = "…" + stueck.slice(1);
  if (start + rest < roh.length) stueck = stueck.slice(0, -1) + "…";
  return `${l} — ${stueck}`.slice(0, max);
}

type Treffer = { label?: string; anchorId?: string; score?: number };
type Match = { queryLocal: (frage: string, k?: number, opts?: unknown) => Promise<Treffer[]> } & Record<string, unknown>;

/**
 * Antwort-Filter für Modul 23 (`configure({ match })`): erbt alles von Modul 04, nur `queryLocal` ist umhüllt.
 *  - Kein eigenes Netz → leere Antwort (bei JEDER Frage neu geprüft).
 *  - Mit Ausschnitt: hängt an jede Zeile einen kurzen Ausschnitt um die Suchwörter.
 */
export function antwortFilter(echt: Match, p: { eigen: () => boolean; auszuege: Map<string, string> | null }): Match {
  const f = Object.create(echt) as Match;
  f.queryLocal = async (frage: string, k?: number, opts?: unknown) => {
    if (typeof p.eigen !== "function" || !p.eigen()) return [];
    const hits = await echt.queryLocal(frage, k, opts);
    return (Array.isArray(hits) ? hits : []).map((h) => {
      const t = p.auszuege && h && typeof h.anchorId === "string" ? p.auszuege.get(h.anchorId) || "" : "";
      return t ? { ...h, label: ausschnittLabel(String(h.label || ""), t, frage) } : h;
    });
  };
  return f;
}
