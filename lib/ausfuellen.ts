// Ausfüllen mit dem Kern von Workflow PDF (Klaus 2026-10-31, Sitzung F) — die reine Rechnung, ohne DOM und ohne Speicher.
// Felder stehen wie in Workflow PDF in Prozent der ANGEZEIGTEN Seite (0..100, y nach unten); `seiten[i].t` ist die
// pdf.js-Viewport-Matrix bei Maßstab 1, damit WFP.Export (byte-1:1) gedrehte Seiten richtig zurückrechnet.
// Hier steht: Feldart aus der Beschriftung, Vorbelegen aus einer Person der Akte (Klaus: „Ja, als Vorschlag“), der
// Eingabe-Speicher (Klaus: „textunterstützender Speicher … Autoausfüllung. Ausschalten oder einschalten“), der Stand
// „muss noch ausgefüllt werden“ fürs Cockpit und der Text-Weg zur KI über „Mit KI arbeiten“ (Auftrag + Antwort lesen).

export type AusfuellTyp = "text" | "datum" | "check" | "unterschrift" | "email" | "tel";
export const AUSFUELL_TYPEN: Record<AusfuellTyp, string> = { text: "Text", datum: "Datum", check: "Kästchen", unterschrift: "Unterschrift", email: "E-Mail", tel: "Telefon" };
/** Vorgabegröße eines neu gesetzten Feldes in Prozent der Seite (wie GROESSE in Workflow PDF). */
export const FELD_GROESSE: Record<AusfuellTyp, [number, number]> = { text: [28, 2.2], datum: [16, 2.2], email: [28, 2.2], tel: [20, 2.2], check: [2.6, 1.9], unterschrift: [30, 4.5] };

export type AusfuellFeld = {
  id: string; page: number; type: AusfuellTyp; label: string;
  x: number; y: number; w: number; h: number;
  value: string | boolean; mehrzeilig?: boolean; decken?: string;
  herkunft: "erkennung" | "ki" | "hand" | "pdf"; geprueft: boolean;
  /** Wert kam als Vorschlag aus der Akte (gelb markiert, bis man ihn ändert oder bestätigt). */
  vorschlag?: boolean;
};
export type AusfuellSeite = { t: number[]; w: number; h: number };
export type AusfuellDok = { name: string; pages: AusfuellSeite[]; fields: AusfuellFeld[] };

/** Was an einer Unterlage der Akte zum Ausfüllen gemerkt wird (Feld `ausfuellen` am Dokument im Register). */
export type AusfuellInfo =
  | { stand: "offen" | "ausgefuellt"; felder: AusfuellFeld[]; seiten: AusfuellSeite[]; geaendertAm: string; ergebnisIds?: string[] }
  | { stand: "ergebnis"; ausId: string; modus: "fest" | "ausfuellbar"; geaendertAm: string };

export const STAND_MARKE: Record<AusfuellInfo["stand"], string> = { offen: "Muss noch ausgefüllt werden", ausgefuellt: "Ausgefüllt", ergebnis: "Ausgefüllte Fassung" };

const norm = (s: string) => String(s || "").toLocaleLowerCase("de").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();

/** Feldtyp aus der Beschriftung (dieselben Regeln wie typAusLabel in Workflow PDF, ohne Kunden-/Artikelnummer). */
export function typAusLabel(label: string, vorher: AusfuellTyp = "text"): AusfuellTyp {
  if (vorher !== "text") return vorher;
  const l = String(label || "").toLowerCase();
  if (/unterschrift|signatur|signature/.test(l)) return "unterschrift";
  if (/datum|geburtstag|geb\.|date\b/.test(l)) return "datum";
  if (/e-?mail/.test(l)) return "email";
  if (/telefon|\btel\b|tel\.|handy|mobil|phone|fax/.test(l)) return "tel";
  return "text";
}

/** Fachliche Art eines Feldes — Schlüssel für Vorbelegen und Eingabe-Speicher. Ohne bekannte Art: die Beschriftung selbst. */
export function feldArt(f: Pick<AusfuellFeld, "label" | "type">): string {
  const l = norm(f.label);
  if (f.type === "email" || /\be ?mail\b/.test(l)) return "email";
  if (f.type === "tel" || /\b(telefon|tel|handy|mobil|fax)\b/.test(l)) return "telefon";
  if (/geburtsdatum|geboren am|geb am|geburtstag/.test(l)) return "geburtsdatum";
  if (/geburtsort|geboren in/.test(l)) return "geburtsort";
  if (/\bvorname/.test(l)) return "vorname";
  if (/nachname|familienname|zuname/.test(l)) return "nachname";
  if (/geburtsname/.test(l)) return "geburtsname";
  if (/\biban\b/.test(l)) return "iban";
  if (/\bplz\b.*\bort\b|postleitzahl.*ort|wohnort/.test(l)) return "plzort";
  if (/\bplz\b|postleitzahl/.test(l)) return "plz";
  if (/strasse|str\b|hausnummer|hausnr/.test(l)) return "strasse";
  if (/anschrift|adresse/.test(l)) return "anschrift";
  if (/\bort\b.*\bdatum\b/.test(l)) return "ortdatum";
  if (/^ort$|^stadt$|^wohnort$/.test(l)) return "ort";
  if (/staatsangehoerigkeit|nationalitaet/.test(l)) return "staatsangehoerigkeit";
  if (/^name$|^name vorname$|^vor und nachname$|^vor und zuname$|^name des |^antragsteller|^versicherte/.test(l)) return "name";
  if (f.type === "datum") return "datum";
  return l ? `label:${l.slice(0, 60)}` : `typ:${f.type}`;
}

export type PersonAngaben = { displayName?: string; birthDate?: string; birthPlace?: string; address?: string; street?: string; postalCode?: string; city?: string; email?: string; phone?: string };

/** Was eine Person der Akte zu einer Feldart beiträgt (nur, was in der Akte steht — nichts erfunden). */
export function personWert(p: PersonAngaben, art: string): string {
  const name = String(p.displayName || "").replace(/\s+/g, " ").trim();
  const teile = name ? name.split(" ") : [];
  switch (art) {
    case "name": return name;
    case "vorname": return teile.length > 1 ? teile.slice(0, -1).join(" ") : "";
    case "nachname": return teile.length > 1 ? teile[teile.length - 1] : "";
    case "geburtsdatum": return /^\d{4}-\d{2}-\d{2}$/.test(String(p.birthDate || "")) ? String(p.birthDate) : "";
    case "geburtsort": return p.birthPlace || "";
    case "strasse": return p.street || "";
    case "plz": return p.postalCode || "";
    case "ort": return p.city || "";
    case "plzort": return [p.postalCode, p.city].filter(Boolean).join(" ");
    case "anschrift": return p.address || [p.street, [p.postalCode, p.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    case "email": return p.email || "";
    case "telefon": return p.phone || "";
    default: return "";
  }
}

/** Belegt LEERE Felder aus der gewählten Person vor (als Vorschlag markiert). Gibt die Zahl der belegten Felder zurück. */
export function vorbelegen(felder: AusfuellFeld[], p: PersonAngaben): number {
  let n = 0;
  for (const f of felder) {
    if (f.type === "check" || f.type === "unterschrift") continue;
    if (typeof f.value === "string" && f.value.trim()) continue;
    const w = personWert(p, feldArt(f));
    if (!w) continue;
    if (f.type === "datum" && !/^\d{4}-\d{2}-\d{2}$/.test(w)) continue;
    f.value = w; f.vorschlag = true; n++;
  }
  return n;
}

// ---------- Eingabe-Speicher (Autoausfüllen) ----------
export type SpeicherEintrag = { w: string; n: number; t: string };
export type EingabeSpeicher = { v: 1; an: boolean; eintraege: Record<string, SpeicherEintrag[]> };
export const SPEICHER_JE_ART = 40;
export const SPEICHER_WERT_MAX = 300;
export const leererSpeicher = (): EingabeSpeicher => ({ v: 1, an: true, eintraege: {} });

export function speicherLesen(roh: unknown): EingabeSpeicher {
  const s = roh as Partial<EingabeSpeicher> | null;
  if (!s || s.v !== 1 || typeof s.eintraege !== "object" || !s.eintraege) return leererSpeicher();
  const eintraege: Record<string, SpeicherEintrag[]> = {};
  for (const [k, liste] of Object.entries(s.eintraege)) {
    if (!Array.isArray(liste)) continue;
    eintraege[k] = liste.filter((e) => e && typeof e.w === "string" && e.w.trim()).slice(0, SPEICHER_JE_ART).map((e) => ({ w: e.w.slice(0, SPEICHER_WERT_MAX), n: Math.max(1, Number(e.n) || 1), t: String(e.t || "") }));
  }
  return { v: 1, an: s.an !== false, eintraege };
}

/** Merkt die Werte der ausgefüllten Felder (nicht Kästchen, nicht Unterschrift). Ist der Speicher aus, wird nichts gemerkt. */
export function merken(s: EingabeSpeicher, felder: Array<Pick<AusfuellFeld, "label" | "type" | "value">>, jetzt = new Date().toISOString()): EingabeSpeicher {
  if (!s.an) return s;
  const eintraege = { ...s.eintraege };
  for (const f of felder) {
    if (f.type === "check" || f.type === "unterschrift" || typeof f.value !== "string") continue;
    const w = f.value.replace(/\s+$/g, "").replace(/^\s+/g, "").slice(0, SPEICHER_WERT_MAX);
    if (!w) continue;
    const art = feldArt(f);
    const liste = [...(eintraege[art] || [])];
    const i = liste.findIndex((e) => e.w === w);
    if (i >= 0) liste[i] = { w, n: liste[i].n + 1, t: jetzt }; else liste.unshift({ w, n: 1, t: jetzt });
    liste.sort((a, b) => b.t.localeCompare(a.t));
    eintraege[art] = liste.slice(0, SPEICHER_JE_ART);
  }
  return { ...s, eintraege };
}

/** Vorschläge zu einer Eingabe: beginnt der Wert (oder ein Wort darin) mit dem Getippten. Häufig vor selten, neu vor alt. */
export function vorschlaege(s: EingabeSpeicher, f: Pick<AusfuellFeld, "label" | "type">, eingabe: string, max = 5): string[] {
  if (!s.an) return [];
  const liste = s.eintraege[feldArt(f)] || [];
  const q = String(eingabe || "").toLocaleLowerCase("de").trim();
  const passt = (w: string) => { const l = w.toLocaleLowerCase("de"); return !q || l.startsWith(q) || l.split(/[\s,.@-]+/).some((t) => t.startsWith(q)); };
  return liste.filter((e) => passt(e.w) && e.w.toLocaleLowerCase("de") !== q)
    .sort((a, b) => b.n - a.n || b.t.localeCompare(a.t)).slice(0, max).map((e) => e.w);
}

export function speicherZahl(s: EingabeSpeicher) { return Object.values(s.eintraege).reduce((n, l) => n + l.length, 0); }
export function vergessen(s: EingabeSpeicher, art?: string, wert?: string): EingabeSpeicher {
  if (!art) return { ...s, eintraege: {} };
  const eintraege = { ...s.eintraege };
  if (wert === undefined) delete eintraege[art]; else eintraege[art] = (eintraege[art] || []).filter((e) => e.w !== wert);
  return { ...s, eintraege };
}

// ---------- Stand fürs Cockpit ----------
export type MitAusfuellen = { id: string; originalName: string; ausfuellen?: AusfuellInfo | null };
export function offeneAusfuellungen<T extends MitAusfuellen>(docs: T[]): T[] { return docs.filter((d) => d.ausfuellen?.stand === "offen"); }
export function ausfuellMarke(d: MitAusfuellen): string | null { return d.ausfuellen ? STAND_MARKE[d.ausfuellen.stand] : null; }
/** Name der ausgefüllten Fassung neben dem Original (Original bleibt unverändert). Ohne Umlaute: Chromium legte im Browser-Speicher
 *  (OPFS) des Prüf-Behälters keine Datei „…ausgefüllt….pdf“ an (TypeMismatchError, gemessen 2026-10-31); die Beispieldaten meiden sie ebenso. */
export function ergebnisName(original: string, modus: "fest" | "ausfuellbar", heute = new Date().toISOString().slice(0, 10)) {
  const basis = String(original || "Formular").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/ \(ausgef(ü|ue)llt[^)]*\)$/, "");
  return `${basis} (ausgefuellt ${heute}${modus === "ausfuellbar" ? ", ausfuellbar" : ""}).pdf`;
}
export function bereitZumSpeichern(felder: AusfuellFeld[]) {
  const leer = felder.filter((f) => f.type !== "check" && !(typeof f.value === "string" && f.value.trim())).length;
  const vorschlag = felder.filter((f) => f.vorschlag).length;
  return { leer, vorschlag, gesamt: felder.length };
}

// ---------- KI über „Mit KI arbeiten“ (nur Text, vor dem Senden unkenntlich gemacht) ----------
export type KiKandidat = { nr: number; seite: number; x: number; y: number; w: number; h: number; typ: AusfuellTyp; text: string };

/** Auftrag an die KI: nur nummerierte Eingabestellen mit dem Text daneben und dem Seitentext — kein Bild, keine Werte. */
export function kiFelderAuftrag(kandidaten: KiKandidat[], seitenText: string[]): string {
  const zeilen = kandidaten.map((k) => `${k.nr}. Seite ${k.seite + 1} · links ${k.x.toFixed(0)} % · oben ${k.y.toFixed(0)} % · ${k.typ === "check" ? "Kästchen" : "Linie/Kasten"}${k.text ? ` · Text daneben: „${k.text}“` : ""}`);
  return [
    "Ich fülle ein Formular aus. Unten stehen die erkannten Eingabestellen (nummeriert) und der Text der Seiten.",
    "Bitte benenne jede Eingabestelle so, wie sie im Formular gemeint ist, und gib den Typ an.",
    "Antworte NUR mit JSON in genau dieser Form, ohne weiteren Text:",
    '{"felder":[{"nr":1,"bezeichnung":"Vorname","typ":"text"}],"kein":[]}',
    "typ ist einer von: text, datum, kaestchen, unterschrift, email, telefon. In \"kein\" stehen Nummern, die keine Eingabestelle sind.",
    "Platzhalter wie [PERSON_1] bitte unverändert lassen.",
    "",
    "Eingabestellen:",
    ...zeilen,
    "",
    "Text der Seiten:",
    ...seitenText.map((t, i) => `--- Seite ${i + 1} ---\n${t.slice(0, 4000)}`),
  ].join("\n");
}

const KI_TYP: Record<string, AusfuellTyp> = { text: "text", datum: "datum", kaestchen: "check", "kästchen": "check", check: "check", unterschrift: "unterschrift", email: "email", "e-mail": "email", telefon: "tel", tel: "tel" };
/** Liest die Antwort der KI (JSON, auch in ```-Block oder mit Text drumherum). Wirft mit einem verständlichen Satz. */
export function kiFelderAntwort(antwort: string): { felder: Array<{ nr: number; bezeichnung: string; typ: AusfuellTyp }>; kein: number[] } {
  const roh = String(antwort || "");
  const start = roh.indexOf("{"), ende = roh.lastIndexOf("}");
  if (start < 0 || ende <= start) throw new Error("In der Antwort steht kein JSON. Bitte die ganze Antwort der KI einfügen.");
  let d: { felder?: unknown; kein?: unknown };
  try { d = JSON.parse(roh.slice(start, ende + 1)); } catch { throw new Error("Das JSON in der Antwort ist nicht lesbar."); }
  if (!Array.isArray(d.felder)) throw new Error("In der Antwort fehlt die Liste „felder“.");
  const felder = (d.felder as Array<Record<string, unknown>>).map((f) => ({ nr: Number(f.nr), bezeichnung: String(f.bezeichnung ?? f.label ?? "").slice(0, 80).trim(), typ: KI_TYP[String(f.typ || "text").toLowerCase()] || "text" }))
    .filter((f) => Number.isInteger(f.nr) && f.nr > 0);
  const kein = Array.isArray(d.kein) ? (d.kein as unknown[]).map(Number).filter((n) => Number.isInteger(n) && n > 0) : [];
  return { felder, kein };
}

/** Wendet die KI-Antwort auf die nummerierten Felder an (Nummer = Stelle in `felder` + 1). Gibt die Zahl der benannten zurück. */
export function kiAnwenden(felder: AusfuellFeld[], antwort: ReturnType<typeof kiFelderAntwort>): { felder: AusfuellFeld[]; benannt: number; weg: number } {
  const weg = new Set(antwort.kein);
  let benannt = 0;
  const neu = felder.map((f, i) => {
    const a = antwort.felder.find((x) => x.nr === i + 1);
    if (!a) return f;
    benannt++;
    return { ...f, label: a.bezeichnung || f.label, type: a.typ, herkunft: "ki" as const, value: a.typ === "check" ? Boolean(f.value) : typeof f.value === "string" ? f.value : "" };
  }).filter((_, i) => !weg.has(i + 1));
  return { felder: neu, benannt, weg: felder.length - neu.length };
}

// ---------- Prüffälle ----------
export function runAusfuellenSelfTests() {
  const out: Array<{ id: string; label: string; passed: boolean; summary: string }> = [];
  const ok = (id: string, label: string, passed: boolean, summary: string) => out.push({ id, label, passed, summary });
  const f = (label: string, type: AusfuellTyp = "text", value: string | boolean = ""): AusfuellFeld => ({ id: label, page: 0, type, label, x: 0, y: 0, w: 10, h: 2, value, herkunft: "erkennung", geprueft: false });

  ok("typ", "Feldtyp aus der Beschriftung", typAusLabel("E-Mail-Adresse") === "email" && typAusLabel("Geburtsdatum") === "datum" && typAusLabel("Unterschrift des Antragstellers") === "unterschrift" && typAusLabel("Telefon (tagsüber)") === "tel" && typAusLabel("Vorname") === "text", "E-Mail, Datum, Unterschrift, Telefon, Text");
  ok("art", "Feldart für Vorbelegen und Speicher", feldArt(f("Vorname")) === "vorname" && feldArt(f("Familienname")) === "nachname" && feldArt(f("PLZ, Ort")) === "plzort" && feldArt(f("Straße, Hausnummer")) === "strasse" && feldArt(f("Ihre E-Mail", "email")) === "email" && feldArt(f("Geburtsdatum", "datum")) === "geburtsdatum" && feldArt(f("Kennzeichen")) === "label:kennzeichen", "Vorname, Nachname, PLZ/Ort, Straße, E-Mail, Geburtsdatum, sonst die Beschriftung");

  const person: PersonAngaben = { displayName: "Gerlinde Arenberg", birthDate: "1954-06-30" };
  const felder = [f("Vorname"), f("Nachname"), f("Geburtsdatum", "datum"), f("E-Mail", "email"), f("Name", "text", "schon da"), f("Unterschrift", "unterschrift")];
  const n = vorbelegen(felder, person);
  ok("vorbelegen", "Vorbelegen aus der Person (nur leere Felder, als Vorschlag)", n === 3 && felder[0].value === "Gerlinde" && felder[1].value === "Arenberg" && felder[2].value === "1954-06-30" && felder[2].vorschlag === true && felder[3].value === "" && felder[4].value === "schon da" && !felder[4].vorschlag, `${n} Felder belegt, E-Mail bleibt leer (steht nicht in der Akte), Vorhandenes bleibt`);

  let s = leererSpeicher();
  s = merken(s, [f("E-Mail", "email", "tommy.flinkfuss@beispiel.invalid"), f("Telefon", "tel", "0000 123456"), f("Unterschrift", "unterschrift", "data:image/png;base64,AAA"), f("Ja", "check", true)], "2026-10-31T10:00:00Z");
  s = merken(s, [f("Ihre E-Mail-Adresse", "email", "tabea.wolkenhain@beispiel.invalid")], "2026-10-31T11:00:00Z");
  const vt = vorschlaege(s, f("E-Mail des Empfängers", "email"), "to");
  ok("speicher", "Eingabe-Speicher schlägt nach den ersten Buchstaben vor", vt.length === 1 && vt[0] === "tommy.flinkfuss@beispiel.invalid" && vorschlaege(s, f("Mail", "email"), "t").length === 2 && speicherZahl(s) === 3, `„to“ → ${vt.join(", ")}; Unterschrift und Kästchen werden nie gemerkt`);
  const aus = { ...s, an: false };
  ok("speicher-aus", "Ausgeschaltet: nichts gemerkt, nichts vorgeschlagen", vorschlaege(aus, f("E-Mail", "email"), "to").length === 0 && merken(aus, [f("E-Mail", "email", "neu@beispiel.invalid")]) === aus, "Schalter aus wirkt in beide Richtungen");
  ok("speicher-loeschen", "Einträge löschen", speicherZahl(vergessen(s, "email", "tommy.flinkfuss@beispiel.invalid")) === 2 && speicherZahl(vergessen(s)) === 0 && speicherLesen(JSON.parse(JSON.stringify(s))).eintraege.email.length === 2 && speicherLesen("Unsinn").an === true, "einzeln und alle; gespeicherte Form wird wieder gelesen");

  const docs = [{ id: "a", originalName: "A.pdf", ausfuellen: { stand: "offen" as const, felder: [], seiten: [], geaendertAm: "" } }, { id: "b", originalName: "B.pdf" }, { id: "c", originalName: "C.pdf", ausfuellen: { stand: "ergebnis" as const, ausId: "a", modus: "fest" as const, geaendertAm: "" } }];
  ok("stand", "Muss noch ausgefüllt werden (Cockpit)", offeneAusfuellungen(docs).map((d) => d.id).join() === "a" && ausfuellMarke(docs[2]) === "Ausgefüllte Fassung" && ergebnisName("Antrag Bewohnerparkausweis.pdf", "fest", "2026-10-31") === "Antrag Bewohnerparkausweis (ausgefuellt 2026-10-31).pdf", "nur offene zählen; Ergebnis heißt wie das Original mit Datum");

  const auftrag = kiFelderAuftrag([{ nr: 1, seite: 0, x: 10, y: 20, w: 30, h: 2, typ: "text", text: "Vorname" }], ["Antrag auf …"]);
  const antwort = kiFelderAntwort("Gern!\n```json\n{\"felder\":[{\"nr\":1,\"bezeichnung\":\"Vorname\",\"typ\":\"text\"},{\"nr\":2,\"bezeichnung\":\"Einverstanden\",\"typ\":\"kaestchen\"}],\"kein\":[3]}\n```");
  const angewandt = kiAnwenden([f("Feld 1.1"), f("Feld 1.2"), f("Feld 1.3")], antwort);
  let falsch = ""; try { kiFelderAntwort("keine Ahnung"); } catch (e) { falsch = (e as Error).message; }
  ok("ki", "KI-Weg: Auftrag ohne Werte, Antwort lesen und anwenden", /NUR mit JSON/.test(auftrag) && !/Gerlinde/.test(auftrag) && angewandt.benannt === 2 && angewandt.weg === 1 && angewandt.felder[1].type === "check" && angewandt.felder[0].herkunft === "ki" && /kein JSON/.test(falsch), "zwei benannt, eins entfernt, unlesbare Antwort mit Satz");
  return out;
}
