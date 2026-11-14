"use client";
// Knopf „Pseudo“ im Kopf (Klaus 14.11.2026): grün „an“, rot „aus“. An öffnet oben das Fenster „Pseudo“, aufgebaut nach dem Muster
// PseudoDoc (Klaus 14.11.: „einfach, Handy zuerst, kleine Knöpfe“; Vorschau docs/vorschau/pseudo-ansicht-kompakt.html):
//   Kopf in einer Zeile (Maske · „1 Zur KI“ · „2 Zurück“ · ? · ✕) · Dateien-Leiste · eine Zeile je Datei (D01 …, Zahl verdeckt, ⚑ prüfen,
//   👁 Ansicht, ✎ Bild abdecken, „mit“, 🗑) · Zur KI: Aufgabe, Stil, frei, „Alle zu einer Datei“, EIN KI-Knopf mit Wahl.
// 👁 zeigt die Fassung als Seite: „KI sieht“ (Platzhalter) oder „Original“ (verdeckte Stellen gelb). Wort markieren = verdecken,
// Stelle antippen = darf bleiben, ⚑ springt zur nächsten unsicheren Stelle. In der Pro-App merkt sich das ins Profil (Stufe C),
// in Basic nur für die Sitzung. Bilder: Flächen 100 % schwarz, neu gezeichnet ohne Metadaten.
// Die Maske (lib/maske.ts auf Modul 25) hat keinen Netzweg; hinaus gehen nur Fassungen, Dateinamen nur als D01 ….
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Camera, ChevronDown, Mail, Copy, Download, Eye, FileText, FolderOpen, Pencil, Plus, Trash2, Undo2, X } from "lucide-react";
import { maskieren, zurueckfuehren, MARKE, type MaskeProfil } from "../lib/maske";
import { korrigieren, maskeAusProfilen, neueProfile, profilNummernImText, type MaskeProfile, type Regel } from "../lib/maske-profil";
import type { Pseudonymisierer } from "../lib/ki-auftrag";
import { extractEmlAttachments } from "../lib/central-intake";
import { dateiAusgeben } from "./dateiausgabe";
import { profileSpeichern, useMaskeProfile } from "./maske-profil-speicher";

const KEY = "familienakte_pseudo_v1";
const KI_KEY = "familienakte_pseudo_ki_v1";
const EREIGNIS = "familienakte:pseudo";
const pseudo = () => (window as unknown as { SbkimPseudonym?: Pseudonymisierer }).SbkimPseudonym;
const gemerkt = () => { try { return localStorage.getItem(KEY) === "an"; } catch { return false; } };

export function usePseudo(): [boolean, (an: boolean) => void] {
  const [an, setAn] = useState(gemerkt);
  useEffect(() => { const h = () => setAn(gemerkt()); window.addEventListener(EREIGNIS, h); return () => window.removeEventListener(EREIGNIS, h); }, []);
  const setzen = (wert: boolean) => { try { localStorage.setItem(KEY, wert ? "an" : "aus"); } catch { /* nur für diese Sitzung */ } setAn(wert); window.dispatchEvent(new Event(EREIGNIS)); };
  return [an, setzen];
}

export function PseudoKnopf() {
  const [an, setzen] = usePseudo();
  return <button type="button" className={`icon-button pseudo-knopf ${an ? "pseudo-an" : "pseudo-aus"}`} aria-pressed={an} onClick={() => setzen(!an)}
    title={an ? "Pseudonymisieren ist an – tippen zum Ausschalten" : "Pseudonymisieren ist aus – tippen zum Einschalten"} aria-label={`Pseudo ${an ? "an" : "aus"}`} data-pseudo-knopf={an ? "an" : "aus"}>
    <span className="pseudo-wort">Pseudo</span><small className="pseudo-zustand">{an ? "an" : "aus"}</small>
  </button>;
}

/** Briefumschlag im Kopf (Klaus 14.11.): „Brief schreiben mit KI“ – öffnet das Pseudo-Fenster mit Aufgabe Antwortbrief und Textfeld. */
const BRIEF_EREIGNIS = "familienakte:pseudo-brief";
export function BriefKnopf() {
  const [, setzen] = usePseudo();
  return <button type="button" className="icon-button brief-knopf" onClick={() => { setzen(true); window.setTimeout(() => window.dispatchEvent(new Event(BRIEF_EREIGNIS)), 0); window.scrollTo({ top: 0, behavior: "smooth" }); }}
    title="Brief oder Dokument mit KI schreiben (pseudonymisiert)" aria-label="Brief mit KI schreiben" data-brief-knopf><Mail size={18}/><span className="kopf-wort" aria-hidden="true">Brief</span></button>;
}

// ── KI-Ziele (ein Knopf, Wahl über ▾; Klaus 14.11.) ─────────────────────────────────────────────────────────────
type KiWahl = "chatgpt" | "claude" | "claudecode" | "gemini";
const KIS: Record<KiWahl, { name: string; url: string; was: string }> = {
  chatgpt: { name: "ChatGPT", url: "https://chatgpt.com/", was: "kopieren & öffnen" },
  claude: { name: "Claude", url: "https://claude.ai/new", was: "kopieren & öffnen" },
  claudecode: { name: "Claude Code", url: "https://claude.ai/code", was: "als Datei & öffnen" },
  gemini: { name: "Gemini", url: "https://gemini.google.com/app", was: "kopieren & öffnen" },
};
const AUFGABEN = ["Antwortbrief schreiben", "Prüfen", "Zusammenfassen"] as const;
const STILE = ["formell", "freundlich", "bestimmt", "kürzer", "ausführlicher", "einfache Sprache"] as const;

type Flaeche = { x: number; y: number; w: number; h: number }; // Prozent der Bildgröße
type Stueck = {
  kennung: string; art: "Text" | "PDF" | "Bild" | "Mail"; name: string; text: string;
  ergebnis: string; funde: number; unsicher: string[]; schon: boolean; leck: string | null; mit: boolean;
  bestaetigt: string[]; bild?: { url: string; breite: number; hoehe: number; flaechen: Flaeche[] };
};

type OcrZeile = { text: string; x: number; y: number; w: number; h: number };
async function bildLesen(file: File): Promise<{ text: string; zeilen: OcrZeile[]; url: string; breite: number; hoehe: number }> {
  const bmp = await createImageBitmap(file);
  const f = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * f); c.height = Math.round(bmp.height * f);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  // Vorschau neu gezeichnet: keine Exif-/Ortsdaten mehr (Leinwand trägt keine Metadaten).
  const url = c.toDataURL("image/jpeg", 0.85);
  let zeilen: OcrZeile[] = [];
  try { const { ocrZeilen } = await import("./wfpdf-kern"); zeilen = await ocrZeilen(c); } catch { /* ohne Texterkennung */ }
  const out = { text: zeilen.map((z) => z.text).join("\n"), zeilen, url, breite: c.width, hoehe: c.height };
  c.width = c.height = 0;
  return out;
}

async function textVon(file: File, meldung: (s: string) => void): Promise<string> {
  if (/\.(txt|md|csv|json|html?)$/i.test(file.name) || file.type.startsWith("text/")) return file.text();
  const { dokumentText, dokumentTextOcr } = await import("./ki-auftrag-dialog");
  let t = "";
  try { t = await dokumentText(file); } catch { t = ""; }
  if (t.trim().length < 40 && (/\.pdf$/i.test(file.name) || file.type === "application/pdf" || file.type.startsWith("image/"))) {
    meldung(`Texterkennung auf dem Gerät: ${file.name} …`);
    try { t = await dokumentTextOcr(file); } catch { /* ohne Text */ }
  }
  return t;
}

function mailKopf(roh: string): string {
  const kopf = roh.slice(0, Math.max(0, roh.search(/\r?\n\r?\n/))).replace(/\r?\n[ \t]+/g, " ");
  return ["From", "To", "Cc", "Date", "Subject"].map((h) => { const m = kopf.match(new RegExp(`^${h}:\\s*(.*)$`, "mi")); return m ? `${h === "Subject" ? "Betreff" : h === "From" ? "Von" : h === "To" ? "An" : h === "Date" ? "Datum" : "Cc"}: ${m[1].trim()}` : ""; }).filter(Boolean).join("\n");
}

function mailText(roh: string): string {
  const i = roh.search(/\r?\n\r?\n/);
  const koerper = i >= 0 ? roh.slice(i) : roh;
  const plain = koerper.split(/\r?\n--[^\r\n]+/).find((t) => /content-type:\s*text\/plain/i.test(t));
  const teil = plain ? plain.slice(plain.search(/\r?\n\r?\n/)) : koerper;
  return teil.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/<[^>]+>/g, " ").trim();
}

/** Seiten für die Ansicht: Seitenvorschub der Vorlage, sonst Absätze bis ~2400 Zeichen. */
export function seitenVon(text: string): string[] {
  const roh = text.replace(/^⟦PSEUDONYMISIERT[^⟧]*⟧\n?/, "");
  const teile = roh.split(/\f/);
  const aus: string[] = [];
  for (const t of teile) {
    let akt = "";
    for (const absatz of t.split(/(\n\s*\n)/)) {
      if (akt.length + absatz.length > 2400 && akt.trim()) { aus.push(akt); akt = ""; }
      akt += absatz;
    }
    if (akt.trim() || !aus.length) aus.push(akt);
  }
  return aus;
}

const TOKEN = /(⟦[A-Z][A-Z0-9_]*-\d+⟧)/g;
const istToken = (t: string) => /^⟦[A-Z][A-Z0-9_]*-\d+⟧$/.test(t);

/** Auftrag für die KI: Aufgabe, Stil, freier Wunsch, dann alle Fassungen (D01 …) – nie echte Dateinamen. */
export function auftragText(stuecke: Array<Pick<Stueck, "kennung" | "art" | "ergebnis" | "bild">>, aufgabe: string, stil: string, frei: string): string {
  const kopf = [`${MARKE}`, `Aufgabe: ${aufgabe}${aufgabe === "Antwortbrief schreiben" ? ` (Stil: ${stil})` : ""}.`, frei.trim() ? `Zusätzlich: ${frei.trim()}` : "",
    "Platzhalter wie ⟦NAME-1⟧ bitte unverändert übernehmen. Daten, Beträge und Fristen sind echt.",
    stuecke.length > 1 ? `Unterlagen: ${stuecke.map((s) => `${s.kennung} (${s.art})`).join(", ")}.` : ""].filter(Boolean).join("\n");
  const teile = stuecke.map((s) => `=== ${s.kennung} · ${s.art} ===\n${s.bild && !s.ergebnis.replace(/^⟦PSEUDONYMISIERT[^⟧]*⟧\n?/, "").trim() ? "(Bild, abgedeckt – liegt als Bild bei)" : s.ergebnis.replace(/^⟦PSEUDONYMISIERT[^⟧]*⟧\n?/, "")}`);
  return `${kopf}\n\n${teile.join("\n\n")}`;
}

type AkteRecord = { id?: string; type?: string; data?: Record<string, unknown> };

export function PseudoFenster({ profil, basic, records = [], onProfile }: { profil: MaskeProfil; basic: boolean; records?: AkteRecord[]; onProfile?: () => void }) {
  const [an, setzen] = usePseudo();
  const [reiter, setReiter] = useState<"hin" | "zurueck">("hin");
  const [erkl, setErkl] = useState(false);
  const [stuecke, setStuecke] = useState<Stueck[]>([]);
  const [map, setMap] = useState<Record<string, string>>({});
  const [zusatz, setZusatz] = useState<string[]>([]);
  const [bleibt, setBleibt] = useState<string[]>([]);
  const [meldung, setMeldung] = useState("");
  const [busy, setBusy] = useState(false);
  const [textAuf, setTextAuf] = useState(false);
  const [briefFokus, setBriefFokus] = useState(0);
  const textFeld = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (briefFokus) textFeld.current?.focus(); }, [briefFokus, textAuf]);
  const [eingabe, setEingabe] = useState("");
  const [aufgabe, setAufgabe] = useState<string>(AUFGABEN[0]);
  const [stil, setStil] = useState<string>(STILE[0]);
  const [frei, setFrei] = useState("");
  const [eineDatei, setEineDatei] = useState(true);
  const [ki, setKi] = useState<KiWahl>(() => { try { const k = localStorage.getItem(KI_KEY) as KiWahl | null; return k && KIS[k] ? k : "chatgpt"; } catch { return "chatgpt"; } });
  const [kiMenue, setKiMenue] = useState(false);
  const [ansicht, setAnsicht] = useState<string | null>(null);
  const [abdecken, setAbdecken] = useState<string | null>(null);
  const [antwort, setAntwort] = useState("");
  const [zurueck, setZurueck] = useState<{ text: string; offen: string[] } | null>(null);
  const stand = useMaskeProfile(basic);
  const merktSich = !basic && (stand.ort === "tresor" || stand.ort === "geraet");
  const p = pseudo();
  useEffect(() => {
    const h = () => { setReiter("hin"); setAufgabe(AUFGABEN[0]); setTextAuf(true); setBriefFokus((n) => n + 1); };
    window.addEventListener(BRIEF_EREIGNIS, h); return () => window.removeEventListener(BRIEF_EREIGNIS, h);
  }, []);
  const voll = useMemo<MaskeProfil>(() => ({ ...profil, zusatz, nieVerdecken: bleibt }), [profil, zusatz, bleibt]);
  if (!an) return null;

  const einzeln = async (text: string, profile: MaskeProfile | null, v: MaskeProfil, m: Record<string, string>) => {
    const nummern = profile ? await profilNummernImText(profile, text) : [];
    return maskieren(p!, text, maskeAusProfilen(profile, records, v, nummern), m);
  };
  const naechsteKennung = (liste: Stueck[], plus: number) => `D${String(liste.length + plus).padStart(2, "0")}`;

  const hinzu = async (eingaenge: Array<{ name: string; art: Stueck["art"]; text: string; bild?: Awaited<ReturnType<typeof bildLesen>> }>) => {
    if (!p) return;
    let m = map; const neu: Stueck[] = [];
    for (const e of eingaenge) {
      const r = await einzeln(e.text, stand.eigene, voll, m); m = r.map;
      const s: Stueck = { kennung: naechsteKennung(stuecke, neu.length + 1), art: e.art, name: e.name, text: e.text, ergebnis: r.text, funde: r.funde.length, unsicher: r.unsicher, schon: r.schonPseudonymisiert, leck: r.leck, mit: true, bestaetigt: [] };
      if (e.bild) {
        // Vorschlag: jede erkannte Zeile mit einer verdeckten Angabe oder einem Kennzeichen wird schwarz.
        const werte = Object.values(r.map).filter((w) => w.length >= 3);
        const flaechen = e.bild.zeilen.filter((z) => werte.some((w) => z.text.includes(w)) || /\b[A-ZÄÖÜ]{1,3}[ -][A-Z]{1,2} ?\d{1,4}[EH]?\b/.test(z.text))
          .map((z) => ({ x: Math.max(0, z.x - 0.5), y: Math.max(0, z.y - 0.5), w: Math.min(100, z.w + 1), h: Math.min(100, z.h + 1) }));
        s.bild = { url: e.bild.url, breite: e.bild.breite, hoehe: e.bild.hoehe, flaechen };
      }
      neu.push(s);
    }
    setMap(m); setStuecke((alt) => [...alt, ...neu]);
    const schon = neu.filter((s) => s.schon).length;
    setMeldung(`${neu.length === 1 ? "1 Datei" : `${neu.length} Dateien`} pseudonymisiert${schon ? ` (${schon} war schon pseudonymisiert)` : ""}. Kurz ansehen – dann zur KI.`);
  };

  const dateien = async (files: FileList | File[] | null) => {
    const liste = Array.from(files || []);
    if (!liste.length || !p) return;
    setBusy(true);
    const eingaenge: Parameters<typeof hinzu>[0] = [];
    try {
      for (const f of liste) {
        setMeldung(`Lese ${f.name} …`);
        if (/\.eml$/i.test(f.name) || f.type === "message/rfc822") {
          const roh = await f.text();
          const teile = [`${mailKopf(roh)}\n\n${mailText(roh)}`];
          for (const a of await extractEmlAttachments(f)) { const t = await textVon(a, setMeldung); teile.push(`--- Anhang (${/\.pdf$/i.test(a.name) ? "PDF" : a.type.startsWith("image/") ? "Bild" : "Datei"}) ---\n${t.trim() || "(kein lesbarer Text)"}`); }
          eingaenge.push({ name: f.name, art: "Mail", text: teile.join("\n\n") });
        } else if (f.type.startsWith("image/")) {
          setMeldung(`Texterkennung auf dem Gerät: ${f.name} …`);
          const b = await bildLesen(f);
          eingaenge.push({ name: f.name, art: "Bild", text: b.text, bild: b });
        } else {
          const t = await textVon(f, setMeldung);
          eingaenge.push({ name: f.name, art: /\.pdf$/i.test(f.name) || f.type === "application/pdf" ? "PDF" : "Text", text: t.trim() || "(kein lesbarer Text)" });
        }
      }
      await hinzu(eingaenge);
    } catch (e) { setMeldung(`Lesen ging nicht: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  };

  /** Korrigieren: „verdecken“ oder „darf bleiben“ – Pro merkt sich ins Profil, Basic nur für die Sitzung; alle Fassungen neu. */
  const korrektur = async (wort: string, wie: Regel) => {
    const w = wort.trim().replace(/\s+/g, " ");
    if (w.length < 2 || !p) return;
    try {
      let profile = stand.eigene; let v = voll;
      if (merktSich) { profile = korrigieren(stand.eigene || await neueProfile(), w, wie); await profileSpeichern(profile); }
      else if (wie === "verdecken") { const z = [...zusatz.filter((x) => x !== w), w]; setZusatz(z); setBleibt(bleibt.filter((x) => x !== w)); v = { ...voll, zusatz: z, nieVerdecken: bleibt.filter((x) => x !== w) }; }
      else { const b = [...bleibt.filter((x) => x !== w), w]; setBleibt(b); setZusatz(zusatz.filter((x) => x !== w)); v = { ...voll, zusatz: zusatz.filter((x) => x !== w), nieVerdecken: b }; }
      let m = map; const neu: Stueck[] = [];
      for (const st of stuecke) {
        if (st.schon) { neu.push(st); continue; }
        const r = await einzeln(st.text, profile, v, m); m = r.map;
        neu.push({ ...st, ergebnis: r.text, funde: r.funde.length, unsicher: r.unsicher, leck: r.leck });
      }
      setMap(m); setStuecke(neu);
      setMeldung(`„${w}“ ${wie === "verdecken" ? "wird verdeckt" : "darf bleiben"}${merktSich ? " – ins Profil gemerkt" : " – gilt bis zum Schließen"}.`);
    } catch (e) { setMeldung(e instanceof Error ? e.message : String(e)); }
  };

  const zuPruefen = (s: Stueck) => s.unsicher.filter((w) => !s.bestaetigt.includes(w)).length;
  const mit = stuecke.filter((s) => s.mit);
  const summe = stuecke.reduce((a, s) => a + s.funde + (s.bild?.flaechen.length || 0), 0);
  const pruefSumme = stuecke.reduce((a, s) => a + zuPruefen(s), 0);
  const leck = mit.find((s) => s.leck);

  const bildPng = (s: Stueck): Promise<Blob | null> => new Promise((ok) => {
    if (!s.bild) return ok(null);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = s.bild!.breite; c.height = s.bild!.hoehe;
      const x = c.getContext("2d")!; x.drawImage(img, 0, 0, c.width, c.height); x.fillStyle = "#000";
      for (const f of s.bild!.flaechen) x.fillRect(f.x / 100 * c.width, f.y / 100 * c.height, f.w / 100 * c.width, f.h / 100 * c.height);
      c.toBlob((b) => { c.width = c.height = 0; ok(b); }, "image/png");
    };
    img.onerror = () => ok(null);
    img.src = s.bild.url;
  });

  const zurKi = async (nurKopieren = false) => {
    if (!mit.length) { setMeldung("Keine Datei ist für die KI ausgewählt."); return; }
    if (leck) { setMeldung(`In ${leck.kennung} steht noch eine echte Angabe. Nichts wurde kopiert.`); return; }
    const text = auftragText(mit, aufgabe, stil, frei);
    const bild = mit.find((s) => s.bild && s.bild.flaechen.length >= 0 && s.bild);
    if (!nurKopieren && ki === "claudecode") {
      await dateiAusgeben(new File([text], "Auftrag (pseudonymisiert).txt", { type: "text/plain" }));
      window.open(KIS.claudecode.url, "_blank", "noopener");
      setMeldung("Auftrag als Datei gespeichert, Claude Code öffnet sich – dort die Datei hochladen oder den Inhalt einfügen.");
      return;
    }
    let mitBild = false;
    try {
      const png = bild ? await bildPng(bild) : null;
      const Item = (window as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
      if (png && Item && navigator.clipboard?.write) {
        await navigator.clipboard.write([new Item({ "text/plain": new Blob([text], { type: "text/plain" }), "image/png": png })]);
        mitBild = true;
      } else await navigator.clipboard.writeText(text);
    } catch {
      try { await navigator.clipboard.writeText(text); } catch { setMeldung("Kopieren ging nicht. Bitte „Als Datei“ nehmen."); return; }
    }
    if (nurKopieren) { setMeldung(`Kopiert${mitBild ? " (mit Bild)" : ""}. Das Original bleibt hier.`); return; }
    const netz = (window as unknown as { PBNetwork?: { ready?: boolean; offline?: boolean } }).PBNetwork;
    if (netz && (!netz.ready || netz.offline)) { setMeldung(`Kopiert${mitBild ? " (Text und Bild)" : ""}. Internet für die App ist aus – oben einschalten, dann „An ${KIS[ki].name}“ noch einmal.`); return; }
    window.open(KIS[ki].url, "_blank", "noopener");
    setMeldung(`Kopiert${mitBild ? " (Text und Bild)" : ""}. ${KIS[ki].name} öffnet sich – dort einfügen. Antwort dann unter „2 Zurück“.`);
  };

  const alsDatei = async () => {
    if (!mit.length) return;
    if (leck) { setMeldung(`In ${leck.kennung} steht noch eine echte Angabe. Nichts wurde gespeichert.`); return; }
    try {
      if (eineDatei) await dateiAusgeben(new File([auftragText(mit, aufgabe, stil, frei)], "Auftrag (pseudonymisiert).txt", { type: "text/plain" }));
      else for (const s of mit) if (!s.bild || s.ergebnis.replace(/^⟦PSEUDONYMISIERT[^⟧]*⟧\n?/, "").trim()) await dateiAusgeben(new File([s.ergebnis], `${s.kennung} (pseudonymisiert).txt`, { type: "text/plain" }));
      for (const s of mit) if (s.bild) { const b = await bildPng(s); if (b) await dateiAusgeben(new File([b], `${s.kennung} (abgedeckt).png`, { type: "image/png" })); }
      setMeldung("Gespeichert. Dateinamen tragen nur D01 …, keine echten Namen.");
    } catch (e) { setMeldung(e instanceof Error ? e.message : "Speichern ging nicht."); }
  };

  const kiWaehlen = (k: KiWahl) => { setKi(k); setKiMenue(false); try { localStorage.setItem(KI_KEY, k); } catch { /* nur Sitzung */ } };
  const aendern = (kennung: string, f: (s: Stueck) => Stueck) => setStuecke((alt) => alt.map((s) => (s.kennung === kennung ? f(s) : s)));
  const offen = stuecke.find((s) => s.kennung === ansicht);
  const bildOffen = stuecke.find((s) => s.kennung === abdecken);

  return <section className="card pseudo-fenster" data-pseudo-fenster>
    <div className="pf-kopf">
      <img className="pf-logo" src="./pseudo/pseudodoc.svg" alt="Pseudo" width={30} height={30} data-pseudo-logo/>
      <div className="pf-reiter" role="group" aria-label="Richtung">
        <button type="button" aria-pressed={reiter === "hin"} onClick={() => setReiter("hin")} data-pseudo-reiter="hin">1 Zur KI</button>
        <button type="button" aria-pressed={reiter === "zurueck"} onClick={() => setReiter("zurueck")} data-pseudo-reiter="zurueck">2 Zurück</button>
      </div>
      <button type="button" className="pf-ik" aria-expanded={erkl} aria-label="Erklärung" onClick={() => setErkl(!erkl)} data-pseudo-frage>?</button>
      <button type="button" className="pf-ik" onClick={() => setzen(false)} aria-label="Pseudo ausschalten" title="Pseudo ausschalten"><X size={16}/></button>
    </div>
    {erkl && <p className="pf-erkl" data-pseudo-erkl>Namen, Anschriften, Nummern (mit Prüfziffer) und Diagnosen werden zu Platzhaltern wie ⟦NAME-1⟧, in allen Dateien gleich. Daten, Beträge, Fristen und Firmen bleiben lesbar. 👁 zeigt jede Datei so, wie die KI sie sieht: Wort markieren = verdecken, Stelle antippen = darf bleiben, ⚑ springt zur nächsten unsicheren Stelle. ✎ deckt in Bildern Flächen schwarz ab. {basic ? "Basic merkt sich Korrekturen nur bis zum Schließen." : <>Korrekturen merken sich in deinen Profilen{onProfile && <> (<button type="button" className="link-button" onClick={onProfile} data-pseudo-profile>Profile ›</button>)</>}.</>} Alles läuft auf diesem Gerät ohne Netz; hinaus geht nur die Fassung, Dateien heißen D01 …. Pseudonymisiert ist nicht anonym: mit der Zuordnung bleibt es persönlich.</p>}
    {!p && <p className="form-error">Der Baustein zum Verdecken ist nicht geladen. Bitte die App neu laden.</p>}

    {reiter === "hin" ? <>
      <div className="pf-rein" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void dateien(e.dataTransfer.files); }}>
        <span>{busy ? "⏳ liest …" : "Datei hierher ziehen"}</span>
        <label className="pf-kn haupt"><Plus size={14}/> Dateien<input type="file" multiple hidden disabled={busy || !p} accept=".txt,.md,.pdf,.eml,.csv,.html,.docx,image/*,message/rfc822,text/*,application/pdf" onChange={(e) => { void dateien(e.target.files); e.target.value = ""; }} data-pseudo-datei/></label>
        <label className="pf-kn"><FolderOpen size={14}/> Ordner<input type="file" multiple hidden disabled={busy || !p} {...{ webkitdirectory: "" }} onChange={(e) => { void dateien(e.target.files); e.target.value = ""; }} data-pseudo-ordner/></label>
        <label className="pf-kn"><Camera size={14}/> Foto<input type="file" hidden disabled={busy || !p} accept="image/*" capture="environment" onChange={(e) => { void dateien(e.target.files); e.target.value = ""; }}/></label>
        <button type="button" className="pf-kn" aria-expanded={textAuf} onClick={() => setTextAuf(!textAuf)} data-pseudo-text-auf>Text</button>
      </div>
      {textAuf && <div className="pf-text">
        <textarea ref={textFeld} rows={3} value={eingabe} onChange={(e) => setEingabe(e.target.value)} placeholder="Brief, Mail oder Notiz einfügen – oder was im Brief stehen soll …" data-pseudo-text/>
        <button type="button" className="pf-kn haupt" disabled={!eingabe.trim() || !p} onClick={() => { void hinzu([{ name: "Eingefügter Text", art: "Text", text: eingabe }]); setEingabe(""); setTextAuf(false); }} data-pseudo-los>Pseudonymisieren</button>
      </div>}
      {meldung && <p className="pf-weg" role="status" data-pseudo-meldung>{meldung}</p>}

      {stuecke.length > 0 && <>
        <div className="pf-summe"><b>Pseudonymisiert</b><span><span data-pseudo-summe>{summe} verdeckt</span>{pruefSumme > 0 && <> · <span className="pf-flagge">⚑ {pruefSumme} prüfen</span></>}</span></div>
        <div className="pf-liste">
          {stuecke.map((s) => <div className="pf-zeile" key={s.kennung} data-pseudo-stueck={s.kennung}>
            {s.bild ? <button type="button" className="pf-daumen" onClick={() => setAbdecken(s.kennung)} aria-label={`${s.kennung} abdecken`}><img src={s.bild.url} alt=""/></button> : <span className="pf-daumen" aria-hidden="true">{s.art === "Mail" ? "EML" : s.art === "PDF" ? "PDF" : <FileText size={16}/>}</span>}
            <span className="pf-name"><b><em>{s.kennung}</em>{s.name}</b><span className="pf-marken"><span className="pf-m art">{s.art}</span>
              {s.leck ? <span className="pf-m rot">⚠ echte Angabe</span> : s.schon ? <span className="pf-m art">schon pseudonymisiert</span> : <span className="pf-m ok">{s.bild ? `${s.bild.flaechen.length} ${s.bild.flaechen.length === 1 ? "Fläche" : "Flächen"}` : `${s.funde} verdeckt`}</span>}
              {zuPruefen(s) > 0 && <span className="pf-m pr" data-pseudo-pruefen>⚑ {zuPruefen(s)}</span>}</span></span>
            <span className="pf-aktionen">
              <button type="button" className="pf-ik" onClick={() => setAnsicht(s.kennung)} aria-label={`${s.kennung} ansehen`} title="Ansehen" data-pseudo-auge><Eye size={15}/></button>
              {s.bild && <button type="button" className="pf-ik" onClick={() => setAbdecken(s.kennung)} aria-label={`${s.kennung} abdecken`} title="Stellen schwarz abdecken" data-pseudo-stift><Pencil size={15}/></button>}
              <label className="pf-mit" title="Geht mit zur KI"><input type="checkbox" checked={s.mit} onChange={() => aendern(s.kennung, (x) => ({ ...x, mit: !x.mit }))} data-pseudo-mit/>mit</label>
              <button type="button" className="pf-ik" onClick={() => { setStuecke((alt) => alt.filter((x) => x.kennung !== s.kennung)); }} aria-label={`${s.kennung} entfernen`} title="Entfernen"><Trash2 size={15}/></button>
            </span>
          </div>)}
        </div>

        <div className="pf-ki" data-pseudo-ki>
          <b className="pf-titel">Zur KI</b>
          <div className="pf-chips" role="group" aria-label="Aufgabe">
            {AUFGABEN.map((a) => <button type="button" key={a} className="pf-chip" aria-pressed={aufgabe === a} onClick={() => setAufgabe(a)}>{a === "Antwortbrief schreiben" ? "Antwortbrief" : a}</button>)}
            {aufgabe === AUFGABEN[0] && <select className="pf-stil" value={stil} onChange={(e) => setStil(e.target.value)} aria-label="Stil">{STILE.map((x) => <option key={x} value={x}>{x === stil ? `Stil: ${x}` : x}</option>)}</select>}
          </div>
          <input className="pf-frei" value={frei} onChange={(e) => setFrei(e.target.value)} placeholder="Was soll die KI tun? (frei)" aria-label="Eigener Auftrag" data-pseudo-frei/>
          <label className="pf-eine"><input type="checkbox" checked={eineDatei} onChange={() => setEineDatei(!eineDatei)}/> Alle zu einer Datei zusammenfügen</label>
          <div className="pf-kiwahl">
            <button type="button" className={`pf-kiknopf ki-${ki}`} disabled={!mit.length || !p} onClick={() => void zurKi()} data-pseudo-ki-los={ki}>An {KIS[ki].name}<small>{KIS[ki].was}</small></button>
            <button type="button" className={`pf-kiknopf pf-kipfeil ki-${ki}`} aria-haspopup="menu" aria-expanded={kiMenue} aria-label="KI wählen" onClick={() => setKiMenue(!kiMenue)} data-pseudo-ki-wahl><ChevronDown size={16}/></button>
            {kiMenue && <div className="pf-kimenue" role="menu">
              {(Object.keys(KIS) as KiWahl[]).map((k) => <button type="button" key={k} role="menuitemradio" aria-checked={ki === k} onClick={() => kiWaehlen(k)} data-pseudo-ki={k}><i className={`pf-punkt ki-${k}`}/>{KIS[k].name}</button>)}
            </div>}
          </div>
          <div className="pf-weiter">
            <button type="button" className="pf-kn" disabled={!mit.length} onClick={() => void zurKi(true)} data-pseudo-kopieren><Copy size={14}/> Nur kopieren</button>
            <button type="button" className="pf-kn" disabled={!mit.length} onClick={() => void alsDatei()} data-pseudo-speichern><Download size={14}/> Als Datei</button>
            <button type="button" className="link-button pf-gruen" onClick={() => setReiter("zurueck")}>Antwort da → 2 Zurück</button>
          </div>
        </div>
      </>}
    </> : <div className="pf-zurueck">
      <textarea rows={5} value={antwort} onChange={(e) => setAntwort(e.target.value)} placeholder="Antwort der KI hier einfügen …" data-pseudo-antwort/>
      <div className="pf-weiter">
        <button type="button" className="pf-kn haupt" disabled={!antwort.trim() || !p} onClick={() => p && setZurueck(zurueckfuehren(p, antwort, map))} data-pseudo-zurueckfuehren><Undo2 size={14}/> Zurückführen</button>
        <label className="pf-kn">Datei holen<input type="file" hidden accept=".txt,.md,text/*" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setAntwort(await f.text()); }}/></label>
      </div>
      {!Object.keys(map).length && <small className="leise">Nach einem Neustart kennt die App die Platzhalter nicht mehr (Speichern der Zuordnung kommt als nächster Schritt).</small>}
      {zurueck && <><pre className="pf-klar" data-pseudo-klar>{zurueck.text}</pre>
        {zurueck.offen.length > 0 && <small>{zurueck.offen.length} Platzhalter kannte die App nicht: {zurueck.offen.join(" ")}</small>}
        <div className="pf-weiter"><button type="button" className="pf-kn" onClick={async () => { try { await navigator.clipboard.writeText(zurueck.text); setMeldung("Kopiert."); } catch { setMeldung("Kopieren ging nicht."); } }}><Copy size={14}/> Kopieren</button>
          <button type="button" className="pf-kn" onClick={() => void dateiAusgeben(new File([zurueck.text], "Antwort.txt", { type: "text/plain" }))}><Download size={14}/> Als Datei</button></div></>}
    </div>}

    {offen && <Ansicht s={offen} map={map} merktSich={merktSich} onZu={() => setAnsicht(null)} onKorrektur={korrektur}
      onBestaetigt={(w) => aendern(offen.kennung, (x) => ({ ...x, bestaetigt: [...x.bestaetigt, w] }))}/>}
    {bildOffen?.bild && <Abdecken s={bildOffen} onZu={() => setAbdecken(null)} onFertig={(fl) => { aendern(bildOffen.kennung, (x) => ({ ...x, bild: { ...x.bild!, flaechen: fl } })); setAbdecken(null); }}/>}
  </section>;
}

/** 👁: die Fassung als Seite. KI sieht = Platzhalter, Original = echte Angaben gelb. Markieren → verdecken, antippen → darf bleiben. */
function Ansicht({ s, map, merktSich, onZu, onKorrektur, onBestaetigt }: { s: Stueck; map: Record<string, string>; merktSich: boolean; onZu: () => void; onKorrektur: (w: string, wie: Regel) => Promise<void>; onBestaetigt: (w: string) => void }) {
  const [sicht, setSicht] = useState<"ki" | "original">("ki");
  const [seite, setSeite] = useState(0);
  const [blase, setBlase] = useState<{ x: number; y: number; knoepfe: Array<[string, () => void]> } | null>(null);
  const buehne = useRef<HTMLDivElement>(null);
  const seiten = useMemo(() => seitenVon(s.ergebnis), [s.ergebnis]);
  const offenUnsicher = s.unsicher.filter((w) => !s.bestaetigt.includes(w));
  const istUnsicher = (tok: string) => offenUnsicher.includes(map[tok] || "");
  const hier = Math.min(seite, seiten.length - 1);
  const lage = (e: { clientX: number; clientY: number }) => { const r = buehne.current!.getBoundingClientRect(); return { x: Math.max(4, Math.min(e.clientX - r.left, r.width - 190)), y: e.clientY - r.top + buehne.current!.scrollTop + 12 }; };
  const springen = () => {
    const i = seiten.findIndex((t) => (t.match(TOKEN) || []).some(istUnsicher));
    if (i < 0) return;
    setSeite(i);
    window.setTimeout(() => buehne.current?.querySelector(".pf-v.unsicher")?.scrollIntoView({ block: "center", behavior: "smooth" }), 50);
  };
  const teile: ReactNode[] = seiten[hier].split(TOKEN).map((t, i) => {
    if (!istToken(t)) return t;
    const klar = map[t] || t;
    return <span key={i} className={`pf-v${istUnsicher(t) ? " unsicher" : ""}`} data-pseudo-stelle={t} onClick={(e) => { e.stopPropagation(); setBlase({ ...lage(e), knoepfe: [["Darf bleiben", () => void onKorrektur(klar, "bleibt")], ...(istUnsicher(t) ? [["Bleibt verdeckt", () => onBestaetigt(klar)] as [string, () => void]] : [])] }); }}>{sicht === "ki" ? t : klar}</span>;
  });
  const markiert = (e: { clientX: number; clientY: number }) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !buehne.current?.contains(sel.anchorNode)) return;
    const text = sel.toString().replace(/⟦[^⟧]*⟧/g, " ").trim();
    if (text.length < 2) return;
    setBlase({ ...lage(e), knoepfe: [["Verdecken", () => { sel.removeAllRanges(); void onKorrektur(text, "verdecken"); }]] });
  };
  return <div className="pf-blatt" role="dialog" aria-label={`${s.kennung} ansehen`} data-pseudo-ansicht>
    <div className="pf-blatt-kopf"><b>{s.kennung} · {s.name}</b><button type="button" className="pf-ik" onClick={onZu} aria-label="Schließen"><X size={16}/></button></div>
    <div className="pf-blatt-leiste">
      <div className="pf-seg" role="group" aria-label="Ansicht"><button type="button" aria-pressed={sicht === "ki"} onClick={() => setSicht("ki")} data-pseudo-sicht="ki">KI sieht</button><button type="button" aria-pressed={sicht === "original"} onClick={() => setSicht("original")} data-pseudo-sicht="original">Original</button></div>
      <span className="pf-rechts">{seiten.length > 1 && <><button type="button" className="pf-ik" disabled={hier === 0} onClick={() => setSeite(hier - 1)} aria-label="Vorige Seite">‹</button>{hier + 1}/{seiten.length}<button type="button" className="pf-ik" disabled={hier >= seiten.length - 1} onClick={() => setSeite(hier + 1)} aria-label="Nächste Seite">›</button></>}
        {offenUnsicher.length > 0 && <button type="button" className="pf-kn" onClick={springen} title="Nächste Stelle zum Prüfen" data-pseudo-springen>⚑ {offenUnsicher.length}</button>}</span>
    </div>
    <div className="pf-buehne" ref={buehne} onMouseUp={markiert} onTouchEnd={(e) => { const t = e.changedTouches[0]; window.setTimeout(() => markiert(t), 30); }} onClick={() => setBlase(null)}>
      {s.bild && <div className="pf-bildseite"><img src={s.bild.url} alt=""/>{sicht === "ki" && s.bild.flaechen.map((f, i) => <i key={i} style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }}/>)}</div>}
      <div className={`pf-seite ${sicht === "ki" ? "zeigt-ki" : "zeigt-original"}`} data-pseudo-seite>{teile}</div>
      {blase && <div className="pf-blase" style={{ left: blase.x, top: blase.y }} onClick={(e) => e.stopPropagation()}>{blase.knoepfe.map(([t, f]) => <button type="button" key={t} onClick={() => { f(); setBlase(null); }} data-pseudo-blase={t}>{t}</button>)}</div>}
    </div>
    <div className="pf-blatt-fuss"><span>Wort markieren = verdecken · Stelle antippen = darf bleiben{merktSich ? " (ins Profil)" : ""}</span><button type="button" className="pf-kn haupt" onClick={onZu}>Fertig</button></div>
  </div>;
}

/** ✎: Flächen im Bild 100 % schwarz setzen (Rechteck ziehen), antippen wählt, Rückgängig, Löschen. Original bleibt unverändert. */
function Abdecken({ s, onZu, onFertig }: { s: Stueck; onZu: () => void; onFertig: (f: Flaeche[]) => void }) {
  const [flaechen, setFlaechen] = useState<Flaeche[]>(s.bild!.flaechen);
  const [verlauf, setVerlauf] = useState<Flaeche[][]>([]);
  const [wahl, setWahl] = useState<number | null>(null);
  const [durch, setDurch] = useState(false);
  const [zug, setZug] = useState<Flaeche | null>(null);
  const flaeche = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const punkt = (e: React.PointerEvent) => { const r = flaeche.current!.getBoundingClientRect(); return { x: Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)), y: Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)) }; };
  const setzen = (f: Flaeche[]) => { setVerlauf((v) => [...v.slice(-59), flaechen]); setFlaechen(f); };
  return <div className="pf-blatt" role="dialog" aria-label={`${s.kennung} abdecken`} data-pseudo-abdecken>
    <div className="pf-blatt-kopf"><b>{s.kennung} · {flaechen.length} Flächen</b><button type="button" className="pf-ik" onClick={onZu} aria-label="Schließen"><X size={16}/></button></div>
    <div className="pf-blatt-leiste">
      <span className="leise">Rechteck ziehen · Fläche antippen wählt sie</span>
      <span className="pf-rechts">
        <button type="button" className="pf-ik" disabled={!verlauf.length} onClick={() => { setFlaechen(verlauf[verlauf.length - 1]); setVerlauf(verlauf.slice(0, -1)); }} aria-label="Rückgängig"><Undo2 size={15}/></button>
        <button type="button" className="pf-ik" disabled={wahl === null} onClick={() => { if (wahl !== null) { setzen(flaechen.filter((_, i) => i !== wahl)); setWahl(null); } }} aria-label="Fläche löschen" data-pseudo-flaeche-weg><Trash2 size={15}/></button>
        <button type="button" className="pf-ik" aria-pressed={durch} onClick={() => setDurch(!durch)} aria-label="Durchscheinend zum Ausrichten"><Eye size={15}/></button>
      </span>
    </div>
    <div className="pf-buehne">
      <div className="pf-bildseite pf-zeichnen" ref={flaeche} data-pseudo-bild
        onPointerDown={(e) => { if ((e.target as HTMLElement).dataset.flaeche) return; start.current = punkt(e); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (!start.current) return; const q = punkt(e), a = start.current; setZug({ x: Math.min(a.x, q.x), y: Math.min(a.y, q.y), w: Math.abs(q.x - a.x), h: Math.abs(q.y - a.y) }); }}
        onPointerUp={() => { if (zug && zug.w > 1 && zug.h > 1) { setzen([...flaechen, zug]); setWahl(flaechen.length); } start.current = null; setZug(null); }}>
        <img src={s.bild!.url} alt="" draggable={false}/>
        {flaechen.map((f, i) => <i key={i} data-flaeche={i} className={`${wahl === i ? "gewaehlt" : ""}${durch ? " durch" : ""}`} style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }} onPointerDown={(e) => { e.stopPropagation(); setWahl(i); }}/>)}
        {zug && <i className="zug" style={{ left: `${zug.x}%`, top: `${zug.y}%`, width: `${zug.w}%`, height: `${zug.h}%` }}/>}
      </div>
    </div>
    <div className="pf-blatt-fuss"><span>Schwarz deckt 100 %. Für die KI wird das Bild neu gezeichnet, ohne Metadaten; das Original bleibt.</span><button type="button" className="pf-kn haupt" onClick={() => onFertig(flaechen)} data-pseudo-abdecken-fertig>Fertig</button></div>
  </div>;
}
