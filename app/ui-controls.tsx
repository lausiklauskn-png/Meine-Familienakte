"use client";

import { useEffect, useId, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { CircleHelp, Mic, MicOff, X } from "lucide-react";
import { createDictationSession, microphoneBlockedReason, speechConstructor, type SpeechBrowser } from "../lib/browser-dictation";
import { useActivity } from "./ui-activity";

export function InfoPopover({ text, label = "Weitere Informationen" }: { text: string; label?: string }) {
  const id = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (open && !rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const another = (event: Event) => { if ((event as CustomEvent<string>).detail !== id) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("family-info-open", another);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); window.removeEventListener("family-info-open", another); };
  }, [open, id]);
  return <span ref={rootRef} className={`start-info-popover ${open ? "open" : ""}`}>
    <button type="button" className="start-info-trigger" aria-label={label} title={label} aria-expanded={open} aria-controls={`${id}-panel`} onClick={(event) => { event.stopPropagation(); if (!open) window.dispatchEvent(new CustomEvent("family-info-open", { detail: id })); setOpen(!open); }}><CircleHelp size={18}/></button>
    {open && <span id={`${id}-panel`} className="start-info-panel" role="note"><strong>Hinweis</strong><span>{text}</span><button type="button" className="info-close" aria-label="Hinweis schließen" onClick={(event) => { event.stopPropagation(); setOpen(false); }}><X size={16}/></button></span>}
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
    const online = () => navigator.onLine !== false;
    const session = createDictationSession({ constructor: () => speechConstructor(window as unknown as SpeechBrowser), online, onText: (text) => latest.current.onChange(text), onState: setListening, onHint: (text, error) => { setHint(text); if (text && error) latest.current.report({ kind: "error", text: `Spracheingabe · ${text}` }); } });
    sessionRef.current = session;
    const availability = () => { const reason = microphoneBlockedReason(); setBlocked(reason); setAvailable(supported() && online() && !reason); setHint(!online() ? "Offline – bitte tippen." : !supported() ? "Sprache nicht verfügbar – bitte tippen." : ""); };
    const offline = () => { session.offline(); availability(); };
    const other = (event: Event) => { if ((event as CustomEvent<string>).detail !== id) session.stop(); };
    const typed = () => session.stop();
    availability();
    window.addEventListener("online", availability); window.addEventListener("offline", offline);
    window.addEventListener("family-dictation-start", other); window.addEventListener("family-dictation-typed", typed);
    return () => { session.dispose(); sessionRef.current = null; window.removeEventListener("online", availability); window.removeEventListener("offline", offline); window.removeEventListener("family-dictation-start", other); window.removeEventListener("family-dictation-typed", typed); };
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
    {(listening || hint) && <span className="dictation-status" role="status">{listening ? "Aufnahme läuft" : hint}</span>}
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

