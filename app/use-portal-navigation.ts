import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SectionId } from "./portal-types";

export type PortalView = {
  section: SectionId;
  targetId: string | null;
  query: string;
  library: { area: string; query: string };
};
type Visit = { view: PortalView; x: number; y: number; ui: Record<string, unknown> };
type Marker = { session: string; index: number };
declare global { interface Window { familienakteZurueck?: () => boolean } }
const STATE_KEY = "familienakteNavigation";

// Only an opaque marker enters browser history. Searches, object IDs and view
// settings stay in this mounted portal's memory, never in URLs or storage.
export function usePortalNavigation(sections: Record<SectionId, string>) {
  const initial = (): PortalView => {
    const hash = window.location.hash.slice(1);
    const section = Object.hasOwn(sections, hash) ? hash as SectionId : "overview";
    return { section, targetId: null, query: "", library: { area: "", query: "" } };
  };
  const [view, setView] = useState<PortalView>(initial);
  const [position, setPosition] = useState({ index: 0, last: 0 });
  const [revision, setRevision] = useState(0);
  const session = useRef("");
  const index = useRef(0);
  const visits = useRef<Visit[]>([]);
  const restore = useRef<{ x: number; y: number; watch: boolean } | null>(null);
  const [traversal, setTraversal] = useState(false);
  const restoring = useRef(false);

  const rememberScroll = useCallback(() => {
    const visit = visits.current[index.current];
    if (visit && !restoring.current) { visit.x = window.scrollX; visit.y = window.scrollY; }
  }, []);

  useEffect(() => {
    session.current = crypto.randomUUID();
    visits.current = [{ view: initial(), x: window.scrollX, y: window.scrollY, ui: {} }];
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.history.replaceState({ ...window.history.state, [STATE_KEY]: { session: session.current, index: 0 } }, "");
    const pop = (event: PopStateEvent) => {
      rememberScroll();
      const marker = event.state?.[STATE_KEY] as Marker | undefined;
      if (marker?.session !== session.current || !visits.current[marker.index]) {
        // A reload intentionally loses private in-memory context. Older browser
        // entries still open their public section instead of leaving stale UI.
        const next = initial();
        session.current = crypto.randomUUID();
        visits.current = [{ view: next, x: 0, y: 0, ui: {} }];
        index.current = 0;
        window.history.replaceState({ ...window.history.state, [STATE_KEY]: { session: session.current, index: 0 } }, "");
        restore.current = { x: 0, y: 0, watch: false };
        setView(next); setPosition({ index: 0, last: 0 }); setTraversal(true);
        setRevision(value => value + 1);
        return;
      }
      index.current = marker.index;
      const visit = visits.current[marker.index];
      restore.current = { x: visit.x, y: visit.y, watch: true };
      restoring.current = true;
      setTraversal(true);
      setView(visit.view);
      setPosition({ index: marker.index, last: visits.current.length - 1 });
      setRevision(value => value + 1);
    };
    window.addEventListener("popstate", pop);
    return () => {
      window.removeEventListener("popstate", pop);
      window.history.scrollRestoration = previous;
    };
    // The labels and initial hash are read once for this portal instance.
  }, [rememberScroll]);

  useLayoutEffect(() => {
    const target = restore.current;
    if (!target) return;
    restore.current = null;
    // A lazy section may initially be shorter than its restored scroll offset.
    // Retry on layout growth, bounded to two seconds, and stop on user input.
    const scroll = () => window.scrollTo({ left: target.x, top: target.y, behavior: "instant" });
    scroll();
    if (!target.watch) return;
    const observer = new ResizeObserver(scroll);
    observer.observe(document.body);
    const stop = () => { observer.disconnect(); restoring.current = false; };
    const timer = window.setTimeout(stop, 2000);
    window.addEventListener("wheel", stop, { once: true, passive: true });
    window.addEventListener("touchstart", stop, { once: true, passive: true });
    window.addEventListener("pointerdown", stop, { once: true, passive: true });
    window.addEventListener("keydown", stop, { once: true });
    return () => {
      stop(); window.clearTimeout(timer);
      window.removeEventListener("wheel", stop); window.removeEventListener("touchstart", stop);
      window.removeEventListener("pointerdown", stop); window.removeEventListener("keydown", stop);
    };
  }, [view, revision]);

  const navigate = useCallback((section: SectionId, targetId: string | null = null, library = { area: "", query: "" }) => {
    const next: PortalView = { section, targetId, query: "", library };
    const current = visits.current[index.current];
    if (current && JSON.stringify(current.view) === JSON.stringify(next)) return;
    restoring.current = false;
    rememberScroll();
    visits.current.splice(index.current + 1);
    index.current += 1;
    visits.current.push({ view: next, x: 0, y: 0, ui: {} });
    window.history.pushState({ ...window.history.state, [STATE_KEY]: { session: session.current, index: index.current } }, "", section === "overview" ? "#startseite" : `#${section}`);
    restore.current = { x: 0, y: 0, watch: false };
    setTraversal(false);
    setView(next);
    setPosition({ index: index.current, last: index.current });
  }, [rememberScroll]);

  const setQuery = useCallback((query: string) => {
    const visit = visits.current[index.current];
    if (visit) { visit.view = { ...visit.view, query }; setView(visit.view); }
  }, []);
  const back = useCallback(() => { if (index.current > 0) window.history.back(); }, []);
  const forward = useCallback(() => { if (index.current < visits.current.length - 1) window.history.forward(); }, []);
  useEffect(() => {
    const goBack = () => {
      // A preview can consume Back without losing the underlying view/position.
      if (!window.dispatchEvent(new Event("familienakte:zurueck", { cancelable: true }))) return true;
      // Never abandon a form or a confirmation by navigating behind its dialog.
      if (document.querySelector('[role="dialog"],.modal')) return true;
      back();
      return true; // The beginning is a stop, never an instruction to quit.
    };
    window.familienakteZurueck = goBack;
    const mouse = (event: MouseEvent) => {
      if (event.button !== 3) return;
      event.preventDefault();
      if (event.type === "mouseup") goBack();
    };
    window.addEventListener("mousedown", mouse, true);
    window.addEventListener("mouseup", mouse, true);
    return () => {
      if (window.familienakteZurueck === goBack) delete window.familienakteZurueck;
      window.removeEventListener("mousedown", mouse, true);
      window.removeEventListener("mouseup", mouse, true);
    };
  }, [back]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !event.ctrlKey || event.altKey || event.metaKey || event.key.toLowerCase() !== "z") return;
      const target = event.target;
      if (target instanceof Element && target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="dialog"],.modal')) return;
      if (document.querySelector('[role="dialog"],.modal')) return;
      if (event.shiftKey ? position.index < position.last : position.index > 0) {
        event.preventDefault(); if (event.shiftKey) forward(); else back();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [back, forward, position]);

  const readUi = useCallback(<T,>(key: string, fallback: T): T => (visits.current[position.index]?.ui[key] as T | undefined) ?? fallback, [position.index]);
  const saveUi = useCallback((key: string, value: unknown) => {
    const visit = visits.current[position.index];
    if (visit) visit.ui[key] = value;
  }, [position.index]);
  return { view, navigate, setQuery, back, forward, canBack: position.index > 0, canForward: position.index < position.last, visitKey: `${position.index}:${revision}`, traversal, readUi, saveUi };
}

export type PortalNavigation = ReturnType<typeof usePortalNavigation>;
