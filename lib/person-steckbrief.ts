// Steckbrief einer Person (2.28.75, Klaus 19.11.2026, Brief „Familienakte übersichtlich“ Punkt 9; sein Ja: „Das ist ja alles
// verschlüsselt, kommt so keiner ran“). Ausweise und Nummern (Personalausweis, Führerschein, Sozialversicherung, Steuer-ID,
// Reisepass, Krankenkasse …) je mit Nummer und „gültig bis“, dazu frei benannte Einträge („Handy 2“, „ADAC-Nummer“).
// Liegt nur an der Person im Register (Tresor, Sicherung) – keine Nummer in Protokollzeilen oder Meldungen.
// Reine Rechnung ohne DOM, in Node geprüft (scripts/run-person-steckbrief-tests.mjs).

export const AUSWEIS_ARTEN = ["Personalausweis", "Reisepass", "Führerschein", "Sozialversicherungsausweis", "Steuer-ID", "Krankenkasse (Versichertennummer)", "Rentenversicherung", "Schwerbehindertenausweis", "Aufenthaltstitel"] as const;
export type Ausweis = { id: string; art: string; nummer: string; gueltigBis: string; dokumentIds?: string[] };
export type SteckbriefEintrag = { id: string; name: string; wert: string };
export type Steckbrief = { ausweise: Ausweis[]; eintraege: SteckbriefEintrag[] };

const MAX_TEXT = 200;
const MAX_ZEILEN = 40;
const sauber = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
const neueId = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 36);

/** Liest den Steckbrief aus den Daten der Person; fehlt er, ist er leer. Unbekanntes bleibt unangetastet. */
export function steckbriefLesen(daten: Record<string, unknown> | null | undefined): Steckbrief {
  const d = daten || {};
  const ausweise = Array.isArray(d.ausweise) ? d.ausweise : [];
  const eintraege = Array.isArray(d.eintraege) ? d.eintraege : [];
  return {
    ausweise: ausweise.filter((a): a is Record<string, unknown> => !!a && typeof a === "object").map((a) => ({ id: sauber(a.id) || neueId(), art: sauber(a.art), nummer: sauber(a.nummer), gueltigBis: sauber(a.gueltigBis), ...(Array.isArray(a.dokumentIds) ? { dokumentIds: a.dokumentIds.map(String).filter(Boolean) } : {}) })),
    eintraege: eintraege.filter((e): e is Record<string, unknown> => !!e && typeof e === "object").map((e) => ({ id: sauber(e.id) || neueId(), name: sauber(e.name), wert: sauber(e.wert) })),
  };
}

/** Säubert die Eingabe: leere Zeilen fallen weg, Datum JJJJ-MM-TT, Längen begrenzt. Fehlertexte nennen nie eine Nummer. */
export function steckbriefPruefen(roh: Steckbrief): { steckbrief: Steckbrief; fehler: string[] } {
  const fehler: string[] = [];
  const ausweise: Ausweis[] = [];
  for (const a of roh.ausweise || []) {
    const art = sauber(a.art), nummer = sauber(a.nummer), gueltigBis = sauber(a.gueltigBis);
    const dokumentIds = (a.dokumentIds || []).map(String).filter(Boolean);
    if (!art && !nummer && !gueltigBis && !dokumentIds.length) continue;
    if (!art) { fehler.push("Bitte bei jedem Ausweis die Art angeben."); continue; }
    if (art.length > MAX_TEXT || nummer.length > MAX_TEXT) { fehler.push(`„${art.slice(0, 40)}“: höchstens ${MAX_TEXT} Zeichen.`); continue; }
    if (gueltigBis && !/^\d{4}-\d{2}-\d{2}$/.test(gueltigBis)) { fehler.push(`„${art}“: „gültig bis“ bitte als Datum.`); continue; }
    ausweise.push({ id: sauber(a.id) || neueId(), art, nummer, gueltigBis, ...(dokumentIds.length ? { dokumentIds } : {}) });
  }
  const eintraege: SteckbriefEintrag[] = [];
  for (const e of roh.eintraege || []) {
    const name = sauber(e.name), wert = sauber(e.wert);
    if (!name && !wert) continue;
    if (!name) { fehler.push("Bitte jedem weiteren Eintrag einen Namen geben."); continue; }
    if (name.length > MAX_TEXT || wert.length > MAX_TEXT) { fehler.push(`„${name.slice(0, 40)}“: höchstens ${MAX_TEXT} Zeichen.`); continue; }
    eintraege.push({ id: sauber(e.id) || neueId(), name, wert });
  }
  if (ausweise.length > MAX_ZEILEN || eintraege.length > MAX_ZEILEN) fehler.push(`Höchstens ${MAX_ZEILEN} Zeilen je Abschnitt.`);
  return { steckbrief: { ausweise, eintraege }, fehler };
}

/** Übernimmt den Steckbrief in die Daten der Person; alle anderen Angaben (Name, Rolle, Anschrift …) bleiben. */
export function steckbriefUebernehmen(daten: Record<string, unknown>, s: Steckbrief): Record<string, unknown> {
  const neu: Record<string, unknown> = { ...daten };
  if (s.ausweise.length) neu.ausweise = s.ausweise; else delete neu.ausweise;
  if (s.eintraege.length) neu.eintraege = s.eintraege; else delete neu.eintraege;
  return neu;
}

/** Abgelaufen oder in den nächsten 90 Tagen fällig – für die Marke am Ausweis. */
export function ausweisStand(gueltigBis: string, jetzt = new Date()): "abgelaufen" | "bald" | "gueltig" | "" {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(gueltigBis)) return "";
  const tage = Math.floor((new Date(`${gueltigBis}T12:00:00`).getTime() - jetzt.getTime()) / 86400000);
  return tage < 0 ? "abgelaufen" : tage <= 90 ? "bald" : "gueltig";
}

/** Nummer nur verdeckt zeigen (letzte vier Zeichen), bis man sie aufdeckt. */
export const nummerVerdeckt = (nummer: string) => nummer.length <= 4 ? "••••" : `•••• ${nummer.slice(-4)}`;

export function runPersonSteckbriefSelfTests() {
  const r: Array<{ label: string; passed: boolean; summary: string }> = [];
  const a = steckbriefPruefen({ ausweise: [{ id: "a1", art: " Personalausweis ", nummer: "L01X00T47", gueltigBis: "2031-05-01" }, { id: "", art: "", nummer: "", gueltigBis: "" }], eintraege: [{ id: "e1", name: "Handy 2", wert: " 0151 000 " }, { id: "e2", name: "", wert: "" }] });
  r.push({ label: "Steckbrief gesäubert", passed: a.fehler.length === 0 && a.steckbrief.ausweise.length === 1 && a.steckbrief.ausweise[0].art === "Personalausweis" && a.steckbrief.eintraege.length === 1 && a.steckbrief.eintraege[0].wert === "0151 000", summary: JSON.stringify(a.steckbrief) });
  const b = steckbriefPruefen({ ausweise: [{ id: "x", art: "", nummer: "GEHEIM123", gueltigBis: "" }, { id: "y", art: "Reisepass", nummer: "GEHEIM456", gueltigBis: "1.1.2030" }], eintraege: [{ id: "z", name: "", wert: "GEHEIM789" }] });
  r.push({ label: "Steckbrief Fehler ohne Nummern", passed: b.fehler.length === 3 && !b.fehler.join(" ").includes("GEHEIM"), summary: b.fehler.join(" | ") });
  const c = steckbriefUebernehmen({ displayName: "Jonna Arenberg", rolle: "Mutter", city: "Wolkenhain", ausweise: [{ art: "alt" }] }, { ausweise: [], eintraege: [{ id: "1", name: "ADAC", wert: "123" }] });
  r.push({ label: "Steckbrief übernehmen", passed: c.displayName === "Jonna Arenberg" && c.rolle === "Mutter" && c.city === "Wolkenhain" && !("ausweise" in c) && Array.isArray(c.eintraege), summary: "Name/Rolle/Ort bleiben, leere Ausweise entfernt" });
  const d = steckbriefLesen({ ausweise: [{ id: "q", art: "Führerschein", nummer: "B072", gueltigBis: "2040-01-01", dokumentIds: ["DOC-1"] }, "kaputt"], eintraege: null });
  r.push({ label: "Steckbrief lesen", passed: d.ausweise.length === 1 && d.ausweise[0].dokumentIds?.[0] === "DOC-1" && d.eintraege.length === 0, summary: JSON.stringify(d) });
  const jetzt = new Date("2026-11-19T12:00:00");
  r.push({ label: "Ausweis-Stand", passed: ausweisStand("2026-11-01", jetzt) === "abgelaufen" && ausweisStand("2027-01-10", jetzt) === "bald" && ausweisStand("2030-01-01", jetzt) === "gueltig" && ausweisStand("", jetzt) === "", summary: "abgelaufen · bald · gültig" });
  r.push({ label: "Nummer verdeckt", passed: nummerVerdeckt("L01X00T47") === "•••• 0T47" && nummerVerdeckt("12") === "••••", summary: nummerVerdeckt("L01X00T47") });
  return r;
}
