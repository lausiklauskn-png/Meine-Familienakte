import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CircleHelp, Mic, MicOff, Search, X } from "lucide-react";
import { createDictationSession, microphoneBlockedReason, speechConstructor, type SpeechBrowser } from "../lib/browser-dictation";
import { useActivity } from "./ui-activity";
import { fettStuecke, hinweisTeile } from "../lib/hinweis-text";

/** Abstand des Hinweisfensters zum Bildschirmrand und zum Fragezeichen (px). */
const INFO_RAND = 12, INFO_ABSTAND = 8, INFO_BREITE = 560;

/**
 * Fragezeichen mit Hinweisfenster. Das Fenster hängt am Fragezeichen (Nutzerwunsch 2026-11-04: am Handy stand es
 * unten am Bildschirm, getrennt vom Fragezeichen, und wurde von anderen Fragezeichen überdeckt). Es liegt über allem
 * (Portal am <body>), folgt dem Fragezeichen beim Rollen und öffnet unterhalb oder, wenn dort kein Platz ist, oberhalb.
 * Ein zweiter Tipp auf dasselbe Fragezeichen schließt es.
 */
/** B5: Text eines „?“ in der gemeinsamen Form – Kern fett, darunter Punkte. */
export function HinweisText({ text }: { text: string }) {
  const { kern, punkte } = hinweisTeile(text);
  const fett = (t: string) => fettStuecke(t).map((stueck, i) => i % 2 ? <b key={i}>{stueck}</b> : stueck);
  return <span className="hinweis-text" data-hinweis-text>
    {kern && <b className="hinweis-kern">{kern.replaceAll("**", "")}</b>}
    {punkte.length > 0 && <ul className="hinweis-punkte">{punkte.map((p, i) => <li key={i}>{fett(p)}</li>)}</ul>}
  </span>;
}

export function InfoPopover({ text, label = "Weitere Informationen", ziel }: { text: string; label?: string; /** B5: „Hingehen ›“ zur Stelle, um die es geht. */ ziel?: { text?: string; los: () => void } }) {
  const id = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [lage, setLage] = useState<CSSProperties>({ visibility: "hidden" });
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      const ziel = event.target as Node;
      if (open && !rootRef.current?.contains(ziel) && !panelRef.current?.contains(ziel)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const another = (event: Event) => { if ((event as CustomEvent<string>).detail !== id) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("family-info-open", another);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); window.removeEventListener("family-info-open", another); };
  }, [open, id]);
  useLayoutEffect(() => {
    if (!open) { setLage({ visibility: "hidden" }); return; }
    let rahmen = 0;
    const setzen = () => {
      rahmen = 0;
      const knopf = triggerRef.current?.getBoundingClientRect?.(), fenster = panelRef.current;
      if (!knopf || !fenster) return;
      // Quer und breit (Klaus 07.11.2026: „nicht alles angezeigt … quer machen, breiter“): bis 560 px, am Handy Bildschirmbreite.
      const breite = Math.min(INFO_BREITE, window.innerWidth - 2 * INFO_RAND);
      const hoehe = Math.min(fenster.scrollHeight, window.innerHeight * 0.75);
      const links = Math.max(INFO_RAND, Math.min(knopf.right - breite, window.innerWidth - INFO_RAND - breite));
      const unten = window.innerHeight - knopf.bottom, oben = knopf.top;
      const top = unten >= hoehe + INFO_ABSTAND + INFO_RAND || unten >= oben
        ? knopf.bottom + INFO_ABSTAND
        : Math.max(INFO_RAND, knopf.top - INFO_ABSTAND - hoehe);
      setLage({ position: "fixed", top, left: links, width: breite, maxHeight: "75vh", visibility: "visible" });
    };
    const spaeter = () => { if (!rahmen) rahmen = requestAnimationFrame(setzen); };
    setzen();
    window.addEventListener("scroll", spaeter, true);
    window.addEventListener("resize", spaeter);
    return () => { if (rahmen) cancelAnimationFrame(rahmen); window.removeEventListener("scroll", spaeter, true); window.removeEventListener("resize", spaeter); };
  }, [open, text]);
  const fenster = open ? <span ref={panelRef} id={`${id}-panel`} className="start-info-panel info-angeheftet" role="note" style={lage}><strong>Hinweis</strong><HinweisText text={text}/>{ziel && <button type="button" className="text-link hinweis-ziel" onClick={(event) => { event.stopPropagation(); setOpen(false); ziel.los(); }} data-hinweis-ziel>{ziel.text || "Hingehen"} ›</button>}<button type="button" className="info-close" aria-label="Hinweis schließen" onClick={(event) => { event.stopPropagation(); setOpen(false); triggerRef.current?.focus(); }}><X size={16}/></button></span> : null;
  return <span ref={rootRef} className={`start-info-popover ${open ? "open" : ""}`}>
    <button ref={triggerRef} type="button" className="start-info-trigger" aria-label={label} title={label} aria-expanded={open} aria-controls={`${id}-panel`} onClick={(event) => { event.stopPropagation(); if (!open) window.dispatchEvent(new CustomEvent("family-info-open", { detail: id })); setOpen(!open); }}><CircleHelp size={18}/></button>
    {fenster && (typeof document !== "undefined" ? createPortal(fenster, document.body) : fenster)}
  </span>;
}

export function DictationButton({ value, onChange, label, append = true, onDictationStart }: {
  value: string; onChange: (value: string) => void; label: string; append?: boolean; onDictationStart?: () => void;
}) {
  const id = useId();
  const report = useActivity();
  const latest = useRef({ onChange, report }); latest.current = { onChange, report };
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState("");
  const [available, setAvailable] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const sessionRef = useRef<ReturnType<typeof createDictationSession> | null>(null);
  useEffect(() => {
    const supported = () => !!speechConstructor(window as unknown as SpeechBrowser);
    // Internetschalter der App (Standard aus): Browser-Diktat nur mit eingeschaltetem Internet; ein natives Diktat
    // (Android/Windows, window.FamilienakteDiktat) arbeitet auf dem Gerät und bleibt auch bei „aus“ erlaubt.
    const online = () => { const w = window as unknown as { PBNetwork?: { ready: boolean; offline: boolean }; FamilienakteDiktat?: { offlineFaehig?: boolean } }; if (w.FamilienakteDiktat?.offlineFaehig) return true; if (navigator.onLine === false) return false; return !w.PBNetwork || (w.PBNetwork.ready && !w.PBNetwork.offline); };
    const session = createDictationSession({ constructor: () => speechConstructor(window as unknown as SpeechBrowser), online, onText: (text) => latest.current.onChange(text), onState: setListening, onHint: (text, error) => { setHint(text); if (text && error) latest.current.report({ kind: "error", text: `Spracheingabe · ${text}` }); } });
    sessionRef.current = session;
    const availability = () => { const reason = microphoneBlockedReason(); setBlocked(reason); setAvailable(supported() && online() && !reason); setHint(!online() ? (navigator.onLine !== false && (window as unknown as { PBNetwork?: { offline: boolean } }).PBNetwork?.offline ? "Internet für die App ist aus – oben einschalten oder tippen." : "Offline – bitte tippen.") : !supported() ? "Sprache nicht verfügbar – bitte tippen." : ""); };
    const offline = () => { session.offline(); availability(); };
    const other = (event: Event) => { if ((event as CustomEvent<string>).detail !== id) session.stop(); };
    const typed = () => session.stop();
    availability();
    window.addEventListener("online", availability); window.addEventListener("offline", offline); window.addEventListener("pb:network", availability);
    window.addEventListener("family-dictation-start", other); window.addEventListener("family-dictation-typed", typed);
    return () => { session.dispose(); sessionRef.current = null; window.removeEventListener("online", availability); window.removeEventListener("offline", offline); window.removeEventListener("pb:network", availability); window.removeEventListener("family-dictation-start", other); window.removeEventListener("family-dictation-typed", typed); };
  }, [id]);
  const toggle = () => {
    const session = sessionRef.current;
    if (!session) return;
    if (session.active) { session.stop(); return; }
    window.dispatchEvent(new CustomEvent("family-dictation-start", { detail: id }));
    onDictationStart?.(); session.start(value, append);
  };
  return <span className="dictation-control">
    <button type="button" className={`dictation-button ${listening ? "listening" : ""}`} disabled={!available} onClick={toggle} aria-pressed={listening} aria-label={`${label}: ${listening ? "Diktat beenden" : "Diktat starten"}`} title={blocked || hint || (listening ? "Aufnahme läuft bis zum Ausschalten – hier beenden" : "Diktat starten")}>
      {available ? <Mic size={19}/> : <MicOff size={19}/>}
    </button>
    {listening && <span className="dictation-status" role="status">Aufnahme läuft</span>}
  </span>;
}

type VoiceProps = { value: string; onValueChange: (value: string) => void; speechLabel: string };
type InputProps = Omit<ComponentPropsWithoutRef<"input">, "value" | "onChange" | "defaultValue"> & VoiceProps;
type TextareaProps = Omit<ComponentPropsWithoutRef<"textarea">, "value" | "onChange" | "defaultValue"> & VoiceProps;
const stopForTyping = () => window.dispatchEvent(new Event("family-dictation-typed"));

export function VoiceInput({ value, onValueChange, speechLabel, disabled, readOnly, ...props }: InputProps) {
  return <span className="voice-field"><input {...props} disabled={disabled} readOnly={readOnly} value={value} onChange={(event) => { stopForTyping(); onValueChange(event.currentTarget.value); }}/>{!disabled && !readOnly && <DictationButton value={value} onChange={onValueChange} label={speechLabel}/>}</span>;
}

export function VoiceTextarea({ value, onValueChange, speechLabel, disabled, readOnly, ...props }: TextareaProps) {
  return <span className="voice-field voice-textarea"><textarea {...props} disabled={disabled} readOnly={readOnly} value={value} onChange={(event) => { stopForTyping(); onValueChange(event.currentTarget.value); }}/>{!disabled && !readOnly && <DictationButton value={value} onChange={onValueChange} label={speechLabel}/>}</span>;
}


/**
 * B2 (Rückmeldung 09.11.): Info-Zeile statt festem Info-Kasten. Eine Zeile „Info · Titel“; ein Tipp klappt den Text darunter
 * auf, ein zweiter zu. Kein Fragezeichen – der Text ist die Information selbst.
 */
export function InfoZeile({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  const id = useId();
  const [auf, setAuf] = useState(false);
  return <section className={`info-zeile ${auf ? "auf" : ""} ${className}`.trim()} data-info-zeile={title}>
    <button type="button" className="info-zeile-kopf" aria-expanded={auf} aria-controls={`${id}-text`} onClick={() => setAuf(!auf)}><span className="info-label">Info</span><span className="info-zeile-titel">{title}</span><span className="info-zeile-pfeil" aria-hidden="true">{auf ? "▴" : "▾"}</span></button>
    {auf && <div className="info-zeile-text" id={`${id}-text`}>{children}</div>}
  </section>;
}

/**
 * B3 (Rückmeldung 09.11.): ein Suchfeld für die ganze App, wie „In der Familienakte suchen“: Eingabefeld, daneben das
 * Mikrofon als eigener Knopf. Eine Lupe im Feld nur, wenn sonst nichts sagt, dass hier gesucht wird (lupe).
 */
export function SuchFeld({ value, onChange, placeholder, ariaLabel, speechLabel, lupe = false, className = "", clearLabel = "Suche löschen", inputProps }: {
  value: string; onChange: (value: string) => void; placeholder?: string; ariaLabel: string; speechLabel: string; lupe?: boolean; className?: string; clearLabel?: string;
  inputProps?: Omit<ComponentPropsWithoutRef<"input">, "value" | "onChange" | "defaultValue">;
}) {
  return <span className={`such-feld ${className}`.trim()} data-such-feld>
    <span className="such-eingabe">{lupe && <Search size={17} aria-hidden="true"/>}<input {...inputProps} value={value} placeholder={placeholder} aria-label={ariaLabel} onChange={(event) => { stopForTyping(); onChange(event.currentTarget.value); }}/>{value && <button type="button" className="search-clear" onClick={() => onChange("")} aria-label={clearLabel}><X size={16}/></button>}</span>
    <DictationButton value={value} onChange={onChange} label={speechLabel} append={false}/>
  </span>;
}
