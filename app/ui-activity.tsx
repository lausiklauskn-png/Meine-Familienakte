"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, CircleHelp, Copy, TriangleAlert } from "lucide-react";
import { activityEntry, appendActivity, copyActivityText, type ActivityEntry, type ActivityFeedback, type ActivityKind } from "../lib/ui-activity";

const ActivityContext = createContext<{ entries: ActivityEntry[]; report: (feedback: ActivityFeedback) => void }>({ entries: [], report: () => {} });

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const sequence = useRef(0);
  const report = useCallback((feedback: ActivityFeedback) => {
    const entry = activityEntry(feedback, ++sequence.current);
    setEntries((current) => appendActivity(current, entry));
  }, []);
  return <ActivityContext.Provider value={{ entries, report }}>{children}</ActivityContext.Provider>;
}

export function useActivity() { return useContext(ActivityContext).report; }

// Reuses an existing dialog feedback state; reporting happens only when the
// operation sets new feedback, never when an old error is mounted or copied.
export function useActivityMessage(kind: ActivityKind = "error", scope = ""): [string, (message: string) => void] {
  const [message, setMessage] = useState("");
  const report = useActivity();
  const update = useCallback((next: string) => {
    setMessage(next);
    if (next.trim()) report({ kind, text: scope ? `${scope} · ${next}` : next });
  }, [kind, scope, report]);
  return [message, update];
}

function ActivityRow({ entry, position }: { entry?: ActivityEntry; position: number }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (timer.current) clearTimeout(timer.current); }; }, []);
  const copy = async () => {
    if (!entry) return;
    if (timer.current) clearTimeout(timer.current);
    try {
      await copyActivityText(entry.text, (text) => navigator.clipboard.writeText(text));
      if (!mounted.current) return;
      setCopyState("copied");
    } catch { if (!mounted.current) return; setCopyState("error"); }
    timer.current = setTimeout(() => setCopyState("idle"), 2200);
  };
  const Icon = entry?.kind === "success" ? CheckCircle2 : entry?.kind === "error" ? TriangleAlert : CircleHelp;
  return <div className={`global-activity-row activity-${entry?.kind || "empty"}`} aria-label={`Aktivitätszeile ${position}`}>
    <Icon size={17} aria-hidden="true"/>
    <span className="global-activity-text" aria-live="polite" aria-atomic="true">{entry?.text || (position === 1 ? "Noch keine Aktion ausgeführt." : "Noch keine vorherige Aktion vorhanden.")}</span>
    <div className="activity-copy-control"><button type="button" onClick={() => void copy()} disabled={!entry} aria-label={`Aktivitätszeile ${position} kopieren`}><Copy size={14} aria-hidden="true"/>Copy</button><span role="status">{copyState === "copied" ? "Kopiert" : copyState === "error" ? "Kopieren nicht möglich" : ""}</span></div>
  </div>;
}

export function ActivityLines() {
  const { entries } = useContext(ActivityContext);
  return <ActivityLinesView entries={entries}/>;
}

export function ActivityLinesView({ entries }: { entries: ActivityEntry[] }) {
  return <section className="global-activity-lines" aria-label="Letzte zwei Aktionen">
    {[0, 1].map((index) => <ActivityRow key={entries[index]?.id ?? `empty-${index}`} entry={entries[index]} position={index + 1}/>)}
  </section>;
}
