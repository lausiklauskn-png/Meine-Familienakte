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

export function runBriefkopfTitelSelfTests() {
  const t = (label: string, ok: boolean) => ({ label, passed: ok, summary: ok ? "ok" : "falsch" });
  return [
    t("Absender und Datum → „Brief von X, TT.MM.JJJJ“", briefTitel({ absender: { wert: "Lindwurm Versand GmbH" }, datum: { wert: "2026-10-12" } }) === "Brief von Lindwurm Versand GmbH, 12.10.2026"),
    t("nur Absender → ohne Datum", briefTitel({ absender: { wert: "Stadt Musterstadt" }, datum: null }) === "Brief von Stadt Musterstadt"),
    t("ohne Absender → kein Vorschlag", briefTitel({ absender: null, datum: { wert: "2026-10-12" } }) === null),
    t("nichts → kein Vorschlag", briefTitel(null) === null),
  ];
}
