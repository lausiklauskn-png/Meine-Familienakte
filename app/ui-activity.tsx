import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, CircleHelp, Copy, TriangleAlert, X } from "lucide-react";
import { activityEntry, appendActivity, resolveActivity, copyActivityText, type ActivityEntry, type ActivityFeedback, type ActivityKind } from "../lib/ui-activity";

const ActivityContext = createContext<{ entries: ActivityEntry[]; report: (feedback: ActivityFeedback) => void; resolve: (issue: string) => void; dismiss: (id: number) => void }>({ entries: [], report: () => {}, resolve: () => {}, dismiss: () => {} });

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const sequence = useRef(0);
  const report = useCallback((feedback: ActivityFeedback) => {
    const entry = activityEntry(feedback, ++sequence.current);
    setEntries((current) => appendActivity(current, entry));
  }, []);
  const resolve = useCallback((issue: string) => setEntries(current => resolveActivity(current, issue)), []);
  const dismiss = useCallback((id: number) => setEntries(current => current.filter(entry => entry.id !== id)), []);
  return <ActivityContext.Provider value={{ entries, report, resolve, dismiss }}>{children}</ActivityContext.Provider>;
}

export function useActivity() { return useContext(ActivityContext).report; }
export function useResolveActivity() { return useContext(ActivityContext).resolve; }

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

function ActivityRow({ entry, position, onDismiss }: { entry: ActivityEntry; position: number; onDismiss: (id: number) => void }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (timer.current) clearTimeout(timer.current); }; }, []);
  useEffect(() => {
    if (entry.kind !== "success") return;
    const timeout = setTimeout(() => onDismiss(entry.id), 8000);
    return () => clearTimeout(timeout);
  }, [entry.id, entry.kind, onDismiss]);
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
    <span className="global-activity-text" aria-live="polite" aria-atomic="true">{entry.text}</span>
    <div className="activity-copy-control"><button type="button" onClick={() => void copy()} aria-label={`Aktivitätszeile ${position} kopieren`}><Copy size={14} aria-hidden="true"/>Copy</button><span role="status">{copyState === "copied" ? "Kopiert" : copyState === "error" ? "Kopieren nicht möglich" : ""}</span></div>
    <button className="activity-dismiss" type="button" onClick={() => onDismiss(entry.id)} aria-label={`Aktivitätszeile ${position} ausblenden`} title="Hinweis ausblenden"><X size={15}/></button>
  </div>;
}

export function ActivityLines() {
  const { entries, dismiss } = useContext(ActivityContext);
  return <ActivityLinesView entries={entries} onDismiss={dismiss}/>;
}

export function ActivityLinesView({ entries, onDismiss = () => {} }: { entries: ActivityEntry[]; onDismiss?: (id: number) => void }) {
  if (!entries.length) return null;
  return <section className="global-activity-lines" aria-label="Letzte zwei Aktionen">
    {entries.map((entry, index) => <ActivityRow key={entry.id} entry={entry} position={index + 1} onDismiss={onDismiss}/>)}
  </section>;
}
