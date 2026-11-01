// Titel-Vorschlag aus dem Briefkopf (Klaus 2026-11-01, Antwort 4: „Brief von …, Datum“ im Eingang).
// Gelesen wird mit briefkopf.js aus Workflow PDF (byte-1:1 im Klon, WFP.Briefkopf.lesen); hier steht nur, wie aus dem Ergebnis ein
// Titel wird. Ohne erkannten Absender kein Vorschlag — nie geraten (der Baustein liefert dann null).
export type BriefkopfFeld = { wert?: string | null } | null | undefined;
export type BriefkopfErgebnis = { datum?: BriefkopfFeld; absender?: BriefkopfFeld } | null | undefined;

export function briefTitel(kopf: BriefkopfErgebnis): string | null {
  const absender = String(kopf?.absender?.wert || "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!absender) return null;
  const iso = String(kopf?.datum?.wert || "");
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `Brief von ${absender}, ${m[3]}.${m[2]}.${m[1]}` : `Brief von ${absender}`;
}

// ---------- Briefkopf-Angaben im Eingang (Klaus 2026-11-01: „Absender und Empfänger … deutlich zu unterscheiden … eingeordnet werden
// kann, entsprechend im Ordner“ → „ja“ zum Vorschlag). Der Baustein liest; hier steht nur, was die Akte daraus macht:
// · Empfänger → Person der Akte (Abgleich über die vorhandene Zuordnung, personHints)
// · Absender → Organisation · Thema → Lebensbereich (nur, wenn der Dateiname nichts hergibt)
// · Kundennummer & Co. → frühere Unterlagen mit derselben Nummer und deren Vorgang
// Jede Angabe ist ein Vorschlag, im Eingang änderbar; ohne Treffer bleibt sie leer, nie geraten.
export type BriefNummer = { art: string; wert: string };
export type BriefAngaben = { absender: string; empfaenger: string; datum: string; nummern: BriefNummer[]; thema: string; betreff: string };
type RohFeld = { wert?: unknown } | null | undefined;
export type BriefkopfRoh = { datum?: RohFeld; absender?: RohFeld; empfaenger?: RohFeld; betreff?: RohFeld; thema?: RohFeld; nummern?: Array<{ art?: unknown; wert?: unknown }> | null } | null | undefined;
const NUMMER_ART: Record<string, string> = { kunde: "Kundennummer", kundennummer: "Kundennummer", rechnung: "Rechnungsnummer", rechnungsnummer: "Rechnungsnummer", auftrag: "Auftragsnummer", vertrag: "Vertragsnummer", versicherung: "Versicherungsnummer", aktenzeichen: "Aktenzeichen", steuernummer: "Steuernummer", zeichen: "Zeichen" };
const rein = (v: unknown, n = 120) => String(v ?? "").replace(/[·\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
export const LEBENSBEREICHE_BRIEF = ["Familie & persönliche Dokumente", "Finanzen & Konten", "Versicherungen", "Steuern & Behörden", "Haus & Wohnung", "Energie & Versorgung", "Garten & Grundstück", "Einkäufe, Rechnungen & Garantien", "Gesundheit & Pflege", "Rente, Arbeit & Sozialversicherung", "Auto & Mobilität", "Motorrad", "Technik, Geräte & Reparaturen", "Verträge & Abonnements", "Erbschaft, Vollmachten & Vorsorge", "Reisen & Freizeit", "Korrespondenz"];

/** Aus dem Ergebnis von WFP.Briefkopf.lesen die Angaben für den Eingang. Ohne irgendeine Angabe: null. */
export function briefAngaben(kopf: BriefkopfRoh): BriefAngaben | null {
  if (!kopf) return null;
  const datum = /^\d{4}-\d{2}-\d{2}$/.test(String(kopf.datum?.wert || "")) ? String(kopf.datum?.wert) : "";
  const thema = rein(kopf.thema?.wert);
  const nummern: BriefNummer[] = [];
  for (const n of kopf.nummern || []) {
    const wert = rein(n?.wert, 40); if (!wert || nummern.some((x) => x.wert === wert)) continue;
    const roh = String(n?.art ?? "").toLocaleLowerCase("de");
    nummern.push({ art: NUMMER_ART[roh] || rein(n?.art, 30) || "Nummer", wert });
    if (nummern.length >= 6) break;
  }
  const a: BriefAngaben = { absender: rein(kopf.absender?.wert), empfaenger: rein(kopf.empfaenger?.wert), datum, nummern, thema: LEBENSBEREICHE_BRIEF.includes(thema) ? thema : "", betreff: rein(kopf.betreff?.wert, 200) };
  return a.absender || a.empfaenger || a.datum || a.nummern.length || a.thema ? a : null;
}

/** Eine Zeile für die Notiz am Dokument — so bleibt der Briefkopf gemerkt und die Nummer später wiederzufinden. */
export function briefZeile(a: BriefAngaben | null | undefined): string {
  if (!a) return "";
  const teile = [a.absender && `Absender ${a.absender}`, a.empfaenger && `Empfänger ${a.empfaenger}`, ...a.nummern.map((n) => `${n.art} ${n.wert}`)].filter(Boolean);
  return teile.length ? `Briefkopf: ${teile.join(" · ")}` : "";
}

/** Nummern aus einer Eingabe „Kundennummer 123; Aktenzeichen 4 B 77“ (die bearbeitbare Zeile im Eingang). */
export function nummernAusText(text: string): BriefNummer[] {
  return String(text || "").split(/[;\n]+/).map((teil) => {
    const t = rein(teil, 80); if (!t) return null;
    // Bezeichnung = die Wörter vor dem ersten Stück mit einer Ziffer, Wert = alles ab dort („Aktenzeichen 4 B 77/26“)
    const m = /^([^\d]*?)\s*(\S*\d.*)$/.exec(t);
    return m ? { art: m[1].replace(/[:\s]+$/, "") || "Nummer", wert: m[2] } : { art: "Nummer", wert: t };
  }).filter((n): n is BriefNummer => !!n && /\d/.test(n.wert)).slice(0, 6);
}
export const nummernText = (n: BriefNummer[]) => n.map((x) => `${x.art} ${x.wert}`).join("; ");

const falte = (v: string) => v.toLocaleLowerCase("de").replace(/[^a-z0-9äöüß]/g, "");
/** Frühere Unterlagen, in deren Notiz oder Namen dieselbe Nummer steht (mindestens 5 Zeichen — kürzere träfen zufällig). */
export function gleicheNummer<T extends { id: string; originalName?: string | null; notes?: string | null }>(dokumente: T[], nummern: BriefNummer[]) {
  const gesucht = nummern.map((n) => ({ n, f: falte(n.wert) })).filter((x) => x.f.length >= 5);
  const aus: Array<{ dokument: T; nummer: BriefNummer }> = [];
  for (const d of dokumente) {
    const text = falte(`${d.originalName || ""} ${d.notes || ""}`);
    const hit = gesucht.find((x) => text.includes(x.f));
    if (hit) aus.push({ dokument: d, nummer: hit.n });
  }
  return aus;
}
/** Der Vorgang, zu dem eine der Unterlagen gehört (über die Verknüpfungen der Akte). */
export function vorgangVon(beziehungen: Array<{ fromType: string; fromId: string; toType: string; toId: string }>, dokumentIds: string[]) {
  for (const id of dokumentIds) {
    const r = beziehungen.find((b) => (b.fromId === id && b.toType === "case") || (b.toId === id && b.fromType === "case"));
    if (r) return r.toType === "case" ? r.toId : r.fromId;
  }
  return "";
}

export function runBriefkopfTitelSelfTests() {
  const t = (label: string, ok: boolean) => ({ label, passed: ok, summary: ok ? "ok" : "falsch" });
  return [
    t("Absender und Datum → „Brief von X, TT.MM.JJJJ“", briefTitel({ absender: { wert: "Lindwurm Versand GmbH" }, datum: { wert: "2026-10-12" } }) === "Brief von Lindwurm Versand GmbH, 12.10.2026"),
    t("nur Absender → ohne Datum", briefTitel({ absender: { wert: "Stadt Musterstadt" }, datum: null }) === "Brief von Stadt Musterstadt"),
    t("ohne Absender → kein Vorschlag", briefTitel({ absender: null, datum: { wert: "2026-10-12" } }) === null),
    t("nichts → kein Vorschlag", briefTitel(null) === null),
    ...runBriefAngabenSelfTests(t),
  ];
}

function runBriefAngabenSelfTests(t: (label: string, ok: boolean) => { label: string; passed: boolean; summary: string }) {
  const a = briefAngaben({ absender: { wert: "Stadtwerke Lindwurm GmbH" }, empfaenger: { wert: "Erika  Muster" }, datum: { wert: "2026-10-12" }, thema: { wert: "Energie & Versorgung" }, nummern: [{ art: "kunde", wert: "KD-48213" }, { art: "kunde", wert: "KD-48213" }] });
  const leer = briefAngaben({ absender: null, empfaenger: null, datum: null, thema: null, nummern: [] });
  const fremdThema = briefAngaben({ absender: { wert: "X GmbH" }, thema: { wert: "Erfundenes Thema" } });
  const docs = [{ id: "d1", originalName: "Abschlag.pdf", notes: "Briefkopf: Absender Stadtwerke · Kundennummer KD 48213" }, { id: "d2", originalName: "Anderes.pdf", notes: "Nummer 482" }];
  const treffer = gleicheNummer(docs, a?.nummern || []);
  const kurz = gleicheNummer([{ id: "x", notes: "123" }], [{ art: "Kundennummer", wert: "123" }]);
  const zeile = briefZeile(a);
  const rueck = nummernAusText("Kundennummer KD-48213; Aktenzeichen 4 B 77/26");
  return [
    t("Absender und Empfänger getrennt", a?.absender === "Stadtwerke Lindwurm GmbH" && a?.empfaenger === "Erika Muster"),
    t("Kundennummer benannt, doppelte einmal", a?.nummern.length === 1 && a.nummern[0].art === "Kundennummer"),
    t("Thema als Lebensbereich", a?.thema === "Energie & Versorgung"),
    t("unbekanntes Thema → leer, nie geraten", fremdThema?.thema === ""),
    t("ohne Angaben → null", leer === null),
    t("Notizzeile trägt Absender, Empfänger, Nummer", zeile === "Briefkopf: Absender Stadtwerke Lindwurm GmbH · Empfänger Erika Muster · Kundennummer KD-48213"),
    t("gleiche Nummer findet die frühere Unterlage (Schreibweise egal)", treffer.length === 1 && treffer[0].dokument.id === "d1"),
    t("kurze Nummern treffen nicht zufällig", kurz.length === 0),
    t("Vorgang der früheren Unterlage", vorgangVon([{ fromType: "document", fromId: "d1", toType: "case", toId: "c7" }], ["d1"]) === "c7"),
    t("bearbeitete Nummernzeile wird gelesen", rueck.length === 2 && rueck[1].art === "Aktenzeichen" && rueck[1].wert === "4 B 77/26"),
  ];
}
