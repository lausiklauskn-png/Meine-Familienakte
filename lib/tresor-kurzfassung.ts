import { FAMILY_CATEGORY_DEFINITIONS } from "./family-categories.ts";
import { isSensitiveHealthText } from "./family-privacy.ts";

/** Höchstlänge der Kurzfassung im gemeinsamen Inhaltsverzeichnis (Kanon: Eintrag.AUSZUG_MAX). */
export const TRESOR_KURZFASSUNG_MAX = 1000;

export type KurzfassungQuelle = {
  titel?: string | null; originalName?: string | null; category?: string | null;
  documentDate?: string | null; textAuszug?: string | null; notes?: string | null;
};

/** Gesundheit & Pflege und Vorsorge sind „besonders geschützt“; dazu Gesundheitswörter in Titel oder Bereich. */
export function kurzfassungGeschuetzt(d: KurzfassungQuelle): boolean {
  const def = FAMILY_CATEGORY_DEFINITIONS.find((c) => c.label === d.category);
  return def?.privacy === "besonders geschützt" || isSensitiveHealthText(d.titel, d.originalName, d.category);
}

const einzeilig = (t: string) => t.replace(/\s+/g, " ").trim();

function datumText(iso?: string | null) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
}

/**
 * Kurzfassung, die neben dem verschlüsselten Original ins gemeinsame Inhaltsverzeichnis des Pro-Tresors geht.
 * Die anderen Pro-Apps (BookLedgerPro, Private Brain Pro, Workflow PDF Pro) durchsuchen sie mit „Überall suchen“.
 * Form: „Titel · Bereich · Datum“ und danach der Anfang des gelesenen Textes. Geschützte Unterlagen
 * (Gesundheit, Vorsorge) tragen nur Titel · Bereich · Datum, keinen Text und keine Notiz.
 */
export function tresorKurzfassung(d: KurzfassungQuelle): string {
  const titel = einzeilig(d.titel || "") || einzeilig(d.originalName || "").replace(/\.[a-z0-9]{2,5}$/i, "");
  const kopf = [titel, einzeilig(d.category || ""), datumText(d.documentDate)].filter(Boolean).join(" · ");
  if (kurzfassungGeschuetzt(d)) return kopf.slice(0, TRESOR_KURZFASSUNG_MAX);
  const text = einzeilig(d.textAuszug || "");
  const ganz = text ? `${kopf}\n${text}` : kopf;
  if (ganz.length <= TRESOR_KURZFASSUNG_MAX) return ganz;
  // An einer Wortgrenze kürzen, damit kein halbes Wort im Verzeichnis steht.
  const schnitt = ganz.slice(0, TRESOR_KURZFASSUNG_MAX - 1);
  const leer = schnitt.lastIndexOf(" ");
  return (leer > TRESOR_KURZFASSUNG_MAX - 80 ? schnitt.slice(0, leer) : schnitt) + "…";
}
