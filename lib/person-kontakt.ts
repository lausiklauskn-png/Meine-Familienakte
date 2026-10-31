// Anschrift und Kontakt an einer Person (Klaus 2026-10-31, Frage 3 aus Sitzung F: „Ja, speichern“).
// Nur für das Vorbelegen beim Ausfüllen. Reine Rechnung ohne DOM, in Node geprüft (scripts/run-ausfuellen-tests.mjs).
export const KONTAKT_FELDER = ["street", "postalCode", "city", "email", "phone"] as const;
export type KontaktFeld = typeof KONTAKT_FELDER[number];
export type PersonKontakt = Partial<Record<KontaktFeld, string>>;
export const KONTAKT_BESCHRIFTUNG: Record<KontaktFeld, string> = {
  street: "Straße und Hausnummer", postalCode: "PLZ", city: "Ort", email: "E-Mail", phone: "Telefon",
};
const MAX = 200;

/** Säubert die Eingabe und meldet, was nicht passt. Leere Felder sind erlaubt (werden entfernt). */
export function kontaktPruefen(roh: PersonKontakt): { kontakt: PersonKontakt; fehler: string[] } {
  const kontakt: PersonKontakt = {}; const fehler: string[] = [];
  for (const k of KONTAKT_FELDER) {
    const w = String(roh[k] ?? "").replace(/\s+/g, " ").trim();
    if (!w) continue;
    if (w.length > MAX) { fehler.push(`${KONTAKT_BESCHRIFTUNG[k]} ist zu lang (höchstens ${MAX} Zeichen).`); continue; }
    if (k === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w)) { fehler.push("Die E-Mail-Adresse sieht nicht vollständig aus."); continue; }
    if (k === "phone" && !/^[+()\d][\d\s()/+-]{3,}$/.test(w)) { fehler.push("Die Telefonnummer darf nur Ziffern, Leerzeichen und + ( ) / - enthalten."); continue; }
    if (k === "postalCode" && !/^[A-Za-z0-9 -]{3,10}$/.test(w)) { fehler.push("Die PLZ sieht nicht richtig aus."); continue; }
    kontakt[k] = w;
  }
  return { kontakt, fehler };
}

/** Übernimmt die Kontaktangaben in die Daten der Person: gesetzte überschreiben, geleerte werden entfernt, Rest bleibt. */
export function kontaktUebernehmen(daten: Record<string, unknown>, kontakt: PersonKontakt): Record<string, unknown> {
  const neu: Record<string, unknown> = { ...daten };
  for (const k of KONTAKT_FELDER) { if (kontakt[k]) neu[k] = kontakt[k]; else delete neu[k]; }
  return neu;
}

export function runPersonKontaktSelfTests() {
  const r: Array<{ label: string; passed: boolean; summary: string }> = [];
  const a = kontaktPruefen({ street: "  Pustelblumenweg   7 ", postalCode: "12345", city: "Wolkenhain", email: "jonna@beispiel.invalid", phone: "+49 (0) 123 45-67" });
  r.push({ label: "Kontakt gesäubert", passed: a.fehler.length === 0 && a.kontakt.street === "Pustelblumenweg 7" && a.kontakt.phone === "+49 (0) 123 45-67", summary: "Leerzeichen zusammengezogen, gültige Angaben bleiben" });
  const b = kontaktPruefen({ email: "jonna@", phone: "ruf mich an", postalCode: "!" });
  r.push({ label: "Kontakt Fehler", passed: b.fehler.length === 3 && Object.keys(b.kontakt).length === 0, summary: b.fehler.join(" ") });
  const c = kontaktUebernehmen({ displayName: "Jonna Arenberg", birthDate: "1988-02-03", city: "Alt", email: "alt@beispiel.invalid" }, { city: "Wolkenhain" });
  r.push({ label: "Kontakt übernehmen", passed: c.displayName === "Jonna Arenberg" && c.birthDate === "1988-02-03" && c.city === "Wolkenhain" && !("email" in c), summary: "Name/Geburtsdatum bleiben, geleerte E-Mail entfernt" });
  return r;
}
