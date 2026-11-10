import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * Landkarte (Klaus 07.11.2026, Vorbild: Modul-Topologie im Sage-Protokoll). Spalten von links nach rechts; Oberthemen als
 * Container mit kleinen Wege-Knöpfen; Kästen sind mit geschwungenen Ästen direkt verbunden. Pfeil am Ende = Daten gehen in
 * diese Richtung, Pfeil an beiden Enden = hin und zurück. Ein Tipp hebt die Äste eines Kastens hervor und nennt darunter,
 * woher Daten kommen, wohin sie gehen und wo der Kasten in der App liegt.
 * Live: der Stand kommt aus den Daten (in der App lib/app-stand.ts, wie status.json im Sage-Protokoll). Was sich seit dem letzten
 * Öffnen geändert hat, trägt einen blauen Punkt „neu“ (bis 09.11. Goldrahmen), bis man den Kasten antippt, höchstens 14 Tage (Klaus 07.11., gemerkt je Gerät).
 * Immer als Karte, auch am Handy (Klaus 08.11.2026: die Liste sagt ohne die Wege wenig; die Karte wischt man seitlich).
 */
export type KartenStand = "fertig" | "imbau" | "aktivieren" | "geplant";
export type KartenPunkt = { id: string; titel: string; wo?: string; unter?: string; mehr?: string; stand?: KartenStand; warn?: boolean; mitte?: boolean;
  ziel?: () => void; zielText?: string;
  /** Zustand dieses Geräts (Klaus 09.11.: Karten immer live): Fläche grün/rot/gelb/grau, Text statt des Orts. */
  live?: { farbe: "gruen" | "rot" | "gelb" | "grau"; text: string; los?: string } };
export type KartenChip = KartenPunkt & { nach?: string; beide?: boolean };
export type KartenGruppe = { id: string; titel: string; wo?: string; spalte: number; chips: KartenChip[] };
export type KartenKnoten = KartenPunkt & { spalte: number };
export type KartenKante = { von: string; nach: string; beide?: boolean; unten?: boolean };

const GOLD_TAGE = 14;
const WORT: Record<KartenStand, string> = { fertig: "fertig", imbau: "im Bau, bald fertig", aktivieren: "muss eingeschaltet werden", geplant: "geplant, abzusprechen" };
const LIVE_WORT = { gruen: "eingerichtet", rot: "fehlt", gelb: "gesperrt oder veraltet", grau: "nicht eingerichtet" } as const;
/** Ein Weg ist gestrichelt, solange einer seiner Kästen noch nicht da ist: Baustand nicht fertig oder auf diesem Gerät nicht grün. */
const nochNichtDa = (p?: KartenPunkt) => !p ? false : p.live ? p.live.farbe !== "gruen" : (p.stand || "fertig") !== "fertig";
const RAND = 16, LUECKE = 12, ABSTAND = 34;
type Rechteck = { l: number; t: number; w: number; h: number };
type Lage = { pos: Record<string, { x: number; y: number }>; breite: number; hoehe: number; aeste: { k: KartenKante; d: string }[] };

type Gemerkt = { stand: Record<string, string>; gold: Record<string, number> };
function lesen(id: string): Gemerkt {
  try {
    const neu = localStorage.getItem(`fa_landkarte_${id}_v2`);
    if (neu) { const g = JSON.parse(neu); return { stand: g.stand || {}, gold: g.gold || {} }; }
    return { stand: JSON.parse(localStorage.getItem(`fa_landkarte_${id}_v1`) || "{}"), gold: {} };
  } catch { return { stand: {}, gold: {} }; }
}
function merken(id: string, g: Gemerkt) { try { localStorage.setItem(`fa_landkarte_${id}_v2`, JSON.stringify(g)); } catch { /* nur Komfort */ } }

export function Landkarte({ id, label, gruppen, knoten, kanten, breiten, onFrisch, startAktiv = null }: { id: string; label: string; gruppen: KartenGruppe[]; knoten: KartenKnoten[]; kanten: KartenKante[]; breiten: number[];
  spalten?: string[]; onFrisch?: (anzahl: number) => void; startAktiv?: string | null }) {
  const buehne = useRef<HTMLDivElement>(null);
  const [lage, setLage] = useState<Lage | null>(null);
  // Rücksprung (W12): nach „Hingehen ›“ und Zurück steht derselbe Kasten wieder gewählt, damit die Marke ihn findet.
  const [aktiv, setAktiv] = useState<string | null>(startAktiv);
  const [frisch, setFrisch] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<KartenFilter | null>(null);
  useEffect(() => {
    const h = (e: Event) => { const d = (e as CustomEvent<{ karte: string; filter: KartenFilter | null }>).detail; if (d.karte === id) setFilter(d.filter); };
    window.addEventListener(FILTER_EREIGNIS, h); return () => window.removeEventListener(FILTER_EREIGNIS, h);
  }, [id]);

  const alle = useMemo(() => {
    const m = new Map<string, KartenPunkt & { gruppe?: KartenGruppe }>();
    knoten.forEach((k) => m.set(k.id, k));
    gruppen.forEach((g) => g.chips.forEach((c) => m.set(c.id, { ...c, gruppe: g })));
    return m;
  }, [gruppen, knoten]);
  const aeste = useMemo<KartenKante[]>(() => [...kanten, ...gruppen.flatMap((g) => g.chips.filter((c) => c.nach).map((c) => ({ von: c.id, nach: c.nach!, beide: c.beide })))], [kanten, gruppen]);

  // Live: geänderte Stände golden umrahmen, bis der Kasten angetippt wird (höchstens GOLD_TAGE).
  useEffect(() => {
    const alt = lesen(id), jetzt = Date.now(), stand: Record<string, string> = {}, gold: Record<string, number> = {};
    const ersterBesuch = !Object.keys(alt.stand).length;
    alle.forEach((p, pid) => {
      stand[pid] = p.stand || "fertig";
      if (!ersterBesuch && alt.stand[pid] !== stand[pid]) gold[pid] = jetzt;
      else if (alt.gold[pid] && jetzt - alt.gold[pid] < GOLD_TAGE * 86400000) gold[pid] = alt.gold[pid];
    });
    merken(id, { stand, gold });
    setFrisch(new Set(Object.keys(gold)));
  }, [alle, id]);
  useEffect(() => { onFrisch?.(frisch.size); }, [frisch, onFrisch]);
  const gesehen = (pid: string) => {
    if (!frisch.has(pid)) return;
    const g = lesen(id); delete g.gold[pid]; merken(id, g);
    setFrisch((alt) => { const n = new Set(alt); n.delete(pid); return n; });
  };

  useLayoutEffect(() => {
    const b = buehne.current; if (!b) return;
    const rechnen = () => {
      const xs: number[] = []; let x = RAND;
      breiten.forEach((w, i) => { xs[i] = x; x += w + ABSTAND; });
      const pos: Lage["pos"] = {}, groesse: Record<string, { w: number; h: number }> = {};
      b.querySelectorAll<HTMLElement>("[data-karte-gruppe], [data-karte-knoten]").forEach((e) => { groesse[e.dataset.karteGruppe || e.dataset.karteKnoten!] = { w: e.offsetWidth, h: e.offsetHeight }; });
      const chipIn: Record<string, Rechteck & { g: string }> = {};
      // Lage des Chips relativ zur GRUPPE messen, nicht zu seinem offsetParent (.lk-chips ist positioniert und liegt unter
      // Titel und Untertitel der Gruppe) – sonst sitzen die Fäden um die Kopfhöhe zu hoch (Gerätetest 10.11.: 50–90 px am Tablet).
      b.querySelectorAll<HTMLElement>("[data-karte-chip]").forEach((e) => { const g = e.closest<HTMLElement>("[data-karte-gruppe]")!;
        let l = 0, t = 0; for (let n: HTMLElement | null = e; n && n !== g; n = n.offsetParent as HTMLElement | null) { l += n.offsetLeft; t += n.offsetTop; }
        chipIn[e.dataset.karteChip!] = { l, t, w: e.offsetWidth, h: e.offsetHeight, g: g.dataset.karteGruppe! }; });
      const rect = (pid: string): Rechteck | null => {
        const c = chipIn[pid];
        if (c) { const g = pos[c.g]; return g ? { l: g.x + c.l, t: g.y + c.t, w: c.w, h: c.h } : null; }
        const p = pos[pid], s = groesse[pid]; return p && s ? { l: p.x, t: p.y, w: s.w, h: s.h } : null;
      };
      const spalten: { pid: string; gruppe: boolean }[][] = breiten.map(() => []);
      gruppen.forEach((g) => spalten[g.spalte]?.push({ pid: g.id, gruppe: true }));
      knoten.forEach((k) => spalten[k.spalte]?.push({ pid: k.id, gruppe: false }));
      let y0 = RAND;
      spalten[0]?.forEach((e) => { pos[e.pid] = { x: xs[0], y: y0 }; y0 += groesse[e.pid].h + LUECKE; });
      const mitteVon = (ids: string[]) => {
        const m = aeste.filter((k) => ids.includes(k.nach)).map((k) => rect(k.von)).filter(Boolean).map((r) => r!.t + r!.h / 2);
        return m.length ? m.reduce((a, v) => a + v, 0) / m.length : null;
      };
      for (let s = 1; s < spalten.length; s++) {
        let unten = RAND;
        spalten[s].map((e, i) => {
          const ids = e.gruppe ? gruppen.find((g) => g.id === e.pid)!.chips.map((c) => c.id) : [e.pid];
          const m = mitteVon(ids) ?? 200;
          return { e, i, m, soll: m - groesse[e.pid].h / 2 };
        }).sort((a, z) => (a.m - z.m) || (a.i - z.i)).forEach(({ e, soll }) => { const y = Math.max(soll, unten); pos[e.pid] = { x: xs[s], y }; unten = y + groesse[e.pid].h + LUECKE; });
      }
      const ankunft: Record<string, KartenKante[]> = {};
      aeste.forEach((k) => (ankunft[k.nach] ||= []).push(k));
      Object.values(ankunft).forEach((l) => l.sort((p, q) => (rect(p.von)?.t ?? 0) - (rect(q.von)?.t ?? 0)));
      const linien = aeste.flatMap((k) => {
        const a = rect(k.von), z = rect(k.nach); if (!a || !z) return [];
        const reihe = ankunft[k.nach], i = reihe.indexOf(k), n = reihe.length;
        const am = a.t + a.h / 2, zm = z.t + z.h / 2, zy = n > 1 ? z.t + 10 + (z.h - 20) * i / (n - 1) : zm;
        let d: string;
        if (Math.abs(a.l - z.l) < 5) { const bx = a.l + a.w + 36; d = `M${a.l + a.w} ${am} C${bx} ${am} ${bx} ${zm} ${z.l + z.w + 2} ${zm}`; }
        else if (k.unten) { const ax = a.l + a.w / 2, zx = z.l + z.w / 2, tief = Math.max(a.t + a.h, z.t + z.h) + 60; d = `M${ax} ${a.t + a.h} C${ax} ${tief} ${zx} ${tief} ${zx} ${z.t + z.h + 2}`; }
        else { const mx = (a.l + a.w + z.l) / 2; d = `M${a.l + a.w} ${am} C${mx} ${am} ${mx} ${zy} ${z.l - 2} ${zy}`; }
        return [{ k, d }];
      });
      let hoehe = 0; const breite = x - ABSTAND + RAND;
      Object.entries(pos).forEach(([pid, p]) => { hoehe = Math.max(hoehe, p.y + groesse[pid].h); });
      setLage({ pos, breite, hoehe: hoehe + RAND + 50, aeste: linien });
    };
    rechnen();
    let tot = false;
    // Neu rechnen, sobald sich die Größe eines Kastens oder Chips ändert – nicht nur die Breite des ersten:
    // Live-Texte, Schriften und aufgeklappte Themen machen Chips später höher, sonst sitzen die Fäden zu hoch.
    const masse = () => Array.from(b.querySelectorAll<HTMLElement>("[data-karte-gruppe], [data-karte-knoten], [data-karte-chip]"))
      .map((e) => `${e.offsetWidth}x${e.offsetHeight}@${e.offsetTop}`).join("|");
    let masseAlt = masse();
    document.fonts?.ready.then(() => { if (!tot) { masseAlt = masse(); rechnen(); } });
    const beob = typeof ResizeObserver === "function" ? new ResizeObserver(() => { const m = masse(); if (!tot && m !== masseAlt) { masseAlt = m; rechnen(); } }) : null;
    if (beob) b.querySelectorAll<HTMLElement>("[data-karte-gruppe], [data-karte-knoten], [data-karte-chip]").forEach((e) => beob.observe(e));
    return () => { tot = true; beob?.disconnect(); };
  }, [gruppen, knoten, aeste, breiten]);

  const punktTrifft = (p: KartenPunkt | undefined): boolean => {
    if (!p || !filter) return false;
    if (filter.startsWith("l-")) return p.live?.farbe === filter.slice(2);
    if (filter.startsWith("s-")) return (p.stand || "fertig") === filter.slice(2);
    if (filter === "warn") return Boolean(p.warn);
    if (filter === "frisch") return frisch.has(p.id);
    return false;
  };
  const astTrifft = (k: KartenKante): boolean => {
    if (!filter) return false;
    if (filter === "hin") return !k.beide; if (filter === "beide") return Boolean(k.beide);
    // Ein Weg gehört zu einer Farbe, wenn einer seiner Kästen sie hat (gelbe/rote Wege = Wege zu gelben/roten Kästen).
    return punktTrifft(alle.get(k.von)) || punktTrifft(alle.get(k.nach));
  };
  const treffer = filter ? [...alle.values()].filter((p) => filter === "hin" || filter === "beide" ? aeste.some((k) => astTrifft(k) && (k.von === p.id || k.nach === p.id)) : punktTrifft(p)) : [];
  const trefferIds = new Set(treffer.map((p) => p.id));
  // Klaus 10.11.: keine Liste der Treffer unter der Karte; die Zahl steht am gedrückten Legenden-Knopf.
  const trefferZahl = filter ? treffer.length : null;
  useEffect(() => { window.dispatchEvent(new CustomEvent(TREFFER_EREIGNIS, { detail: { karte: id, anzahl: trefferZahl } })); }, [id, trefferZahl]);
  const nachbarn = aktiv ? aeste.filter((k) => k.von === aktiv || k.nach === aktiv) : [];
  const an = new Set(nachbarn.flatMap((k) => [k.von, k.nach]));
  const gewaehlt = aktiv ? alle.get(aktiv) : null;
  const wahl = (pid: string) => { gesehen(pid); setAktiv((alt) => alt === pid ? null : pid); };
  const klasse = (p: KartenPunkt, art: string) => [art, `s-${p.stand || "fertig"}`, p.live && `l-${p.live.farbe}`, p.warn && "warn", p.mitte && "mitte", trefferIds.has(p.id) && "treffer", an.has(p.id) && "an", frisch.has(p.id) && "frisch"].filter(Boolean).join(" ");
  const inhalt = (p: KartenPunkt, mitUnter: boolean): ReactNode => <><span className="lk-punkt" aria-hidden="true"/><strong>{p.warn ? "⚠ " : ""}{p.titel}</strong><small>{p.live ? p.live.text : mitUnter ? [p.wo, p.unter].filter(Boolean).join(" · ") : p.wo}</small></>;
  const knopf = (p: KartenPunkt, art: "lk-chip" | "lk-kasten", data: Record<string, string>) =>
    <button type="button" key={p.id} className={klasse(p, art)} {...data} aria-pressed={aktiv === p.id} data-live={p.live?.farbe}
      aria-label={`${p.titel} (${p.live ? `${LIVE_WORT[p.live.farbe]}: ${p.live.text}` : WORT[p.stand || "fertig"]}) – Verbindungen zeigen`} onClick={() => wahl(p.id)}>{inhalt(p, art === "lk-kasten")}</button>;
  const titel = (pid: string) => alle.get(pid)?.titel || pid;

  return <div className={`landkarte${filter ? " lk-gefiltert" : ""}`} data-landkarte={id} data-ansicht="karte" data-lk-gefiltert={filter || undefined}>
    <div className="lk-rahmen">
      <div className="lk-buehne" ref={buehne} role="group" aria-label={label} style={lage ? { width: lage.breite, height: lage.hoehe } : { visibility: "hidden" }}>
        <svg className="lk-aeste" aria-hidden="true" width={lage?.breite || 0} height={lage?.hoehe || 0}>
          <defs>
            {(["", "-an"] as const).map((z) => <g key={z}>
              <marker id={`lk-${id}-spitze${z}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" className={`lk-spitze${z}`}/></marker>
              <marker id={`lk-${id}-anfang${z}`} viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10 0 L0 5 L10 10 z" className={`lk-spitze${z}`}/></marker>
            </g>)}
          </defs>
          {lage?.aeste.map(({ k, d }) => {
            const hervor = aktiv === k.von || aktiv === k.nach, z = hervor ? "-an" : "";
            const geplant = [k.von, k.nach].some((pid) => nochNichtDa(alle.get(pid)));
            return <path key={`${k.von}>${k.nach}`} d={d} className={`lk-ast${hervor ? " an" : ""}${geplant ? " geplant" : ""}${astTrifft(k) ? " treffer" : ""}`} data-ast={`${k.von}>${k.nach}`} data-richtung={k.beide ? "beide" : "hin"}
              markerEnd={`url(#lk-${id}-spitze${z})`} markerStart={k.beide ? `url(#lk-${id}-anfang${z})` : undefined}/>;
          })}
        </svg>
        {gruppen.map((g) => <div key={g.id} className="lk-gruppe" data-karte-gruppe={g.id} style={lage ? { left: lage.pos[g.id]?.x, top: lage.pos[g.id]?.y } : undefined}>
          <strong>{g.titel}</strong>{g.wo && <small>{g.wo}</small>}
          <div className="lk-chips">{g.chips.map((c) => knopf(c, "lk-chip", { "data-karte-chip": c.id, "data-karte-id": c.id }))}</div>
        </div>)}
        {knoten.map((k) => <div key={k.id} className="lk-platz" data-karte-knoten={k.id} style={lage ? { left: lage.pos[k.id]?.x, top: lage.pos[k.id]?.y, width: breiten[k.spalte] } : { width: breiten[k.spalte] }}>
          {knopf(k, "lk-kasten", { "data-karte-id": k.id })}
        </div>)}
      </div>
    </div>
    <div className="lk-info" aria-live="polite" data-karte-info={gewaehlt?.id || ""}>
      {gewaehlt ? <>
        <strong>{gewaehlt.titel}</strong>
        {gewaehlt.live && <span className={`lk-marke l-${gewaehlt.live.farbe}`} data-live-marke>Dieses Gerät: {gewaehlt.live.text}</span>}
        {(!gewaehlt.live || !["fertig", "aktivieren"].includes(gewaehlt.stand || "fertig")) && <span className={`lk-marke s-${gewaehlt.stand || "fertig"}`}>{WORT[gewaehlt.stand || "fertig"]}</span>}
        {(gewaehlt.wo || gewaehlt.gruppe) && <p>Wo: {[gewaehlt.gruppe?.titel, gewaehlt.wo].filter(Boolean).join(" · ")}</p>}
        {[gewaehlt.unter, gewaehlt.mehr].filter(Boolean).map((t) => <p key={t}>{t}</p>)}
        {nachbarn.some((k) => k.nach === aktiv) && <p className="lk-richtung">← kommt von: {nachbarn.filter((k) => k.nach === aktiv).map((k) => `${k.beide ? "⇄ " : ""}${titel(k.von)}`).join(", ")}</p>}
        {nachbarn.some((k) => k.von === aktiv) && <p className="lk-richtung">→ geht zu: {nachbarn.filter((k) => k.von === aktiv).map((k) => `${k.beide ? "⇄ " : ""}${titel(k.nach)}`).join(", ")}</p>}
        {gewaehlt.ziel && <button type="button" className={gewaehlt.live?.los ? "button primary" : "button secondary"} data-live-los={gewaehlt.live?.los || undefined} onClick={gewaehlt.ziel}>{gewaehlt.zielText || "Hingehen"} ›</button>}
      </> : filter && !treffer.length ? <span className="lk-tipp" data-lk-leer>Auf diesem Gerät gibt es davon gerade keinen Kasten.</span>
      : <span className="lk-tipp">Tipp auf einen Kasten zeigt, woher Daten kommen, wohin sie gehen und wo er in der App liegt.</span>}
    </div>
  </div>;
}

/** Legende als Knöpfe (Klaus 10.11.): ein Tipp auf eine Farbe hebt alle Kästen und Wege dieser Art in der Karte hervor, ein zweiter Tipp hebt auf. */
export type KartenFilter = "l-gruen" | "l-rot" | "l-gelb" | "l-grau" | "s-fertig" | "s-imbau" | "s-aktivieren" | "s-geplant" | "warn" | "hin" | "beide" | "frisch";
const FILTER_EREIGNIS = "fa-landkarte-filter";
const TREFFER_EREIGNIS = "fa-landkarte-treffer";
export function KartenLegende({ live = false, fuer, ohneGeraet = false }: { live?: boolean; fuer: string; /** Datei ohne App: kein „muss eingeschaltet werden“. */ ohneGeraet?: boolean }) {
  const [wahl, setWahl] = useState<KartenFilter | null>(null);
  const [zahl, setZahl] = useState<number | null>(null);
  useEffect(() => {
    const h = (e: Event) => { const d = (e as CustomEvent<{ karte: string; anzahl: number | null }>).detail; if (d.karte === fuer) setZahl(d.anzahl); };
    window.addEventListener(TREFFER_EREIGNIS, h); return () => window.removeEventListener(TREFFER_EREIGNIS, h);
  }, [fuer]);
  useEffect(() => {
    const h = (e: Event) => { const d = (e as CustomEvent<{ karte: string; filter: KartenFilter | null }>).detail; if (d.karte === fuer) setWahl(d.filter); };
    window.addEventListener(FILTER_EREIGNIS, h); return () => window.removeEventListener(FILTER_EREIGNIS, h);
  }, [fuer]);
  const tipp = (f: KartenFilter) => window.dispatchEvent(new CustomEvent(FILTER_EREIGNIS, { detail: { karte: fuer, filter: wahl === f ? null : f } }));
  const k = (f: KartenFilter, inhalt: ReactNode) => <button type="button" className={`lk-filter${wahl === f ? " an" : ""}`} data-lk-filter={f} aria-pressed={wahl === f}
    title={wahl === f ? "Nochmal tippen hebt die Hervorhebung auf" : "Zeigt alle Kästen und Wege dieser Art in der Karte"} onClick={() => tipp(f)}>{inhalt}{wahl === f && zahl !== null && <span className="lk-filter-zahl" data-lk-treffer={zahl}> · {zahl}</span>}</button>;
  return <p className="lk-legende" data-lk-legende={fuer}>
    {live && <span className="lk-legende-live" data-live-legende><b>Dieses Gerät (Fläche):</b>
      {k("l-gruen", <><i className="lk-muster l-gruen" aria-hidden="true"/> eingerichtet</>)}
      {k("l-rot", <><i className="lk-muster l-rot" aria-hidden="true"/> fehlt – antippen, beheben</>)}
      {k("l-gelb", <><i className="lk-muster l-gelb" aria-hidden="true"/> gesperrt oder veraltet</>)}
      {k("l-grau", <><i className="lk-muster l-grau" aria-hidden="true"/> freiwillig oder nicht hier</>)}
      <b>Baustand (Rahmen):</b></span>}
    {k("s-fertig", <><i className="lk-muster s-fertig" aria-hidden="true"/> fertig</>)}
    {k("s-imbau", <><i className="lk-muster s-imbau" aria-hidden="true"/> im Bau, bald fertig</>)}
    {!live && !ohneGeraet && k("s-aktivieren", <><i className="lk-muster s-aktivieren l-rot" aria-hidden="true"/> muss eingeschaltet werden</>)}
    {k("s-geplant", <><i className="lk-muster s-geplant" aria-hidden="true"/> geplant, abzusprechen</>)}
    {k("warn", <>⚠ Vorsicht</>)}{k("hin", <>→ Daten nur in eine Richtung</>)}{k("beide", <>⇄ hin und zurück</>)}
    {k("frisch", <><i className="lk-muster frisch" aria-hidden="true"/> neu seit dem letzten Öffnen</>)}
  </p>;
}
