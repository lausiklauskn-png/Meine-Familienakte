import { useCallback, useEffect, useRef, useState } from "react";
import type { CentralIntakeQueueItem } from "../lib/central-intake";
import { eingangAblage, type EingangAenderung } from "./eingang-ablage";

export function useEingang(onError: (error: unknown) => void) {
  const [liste, setListe] = useState<CentralIntakeQueueItem[]>([]);
  const fehler = useRef(onError); fehler.current = onError;
  // Laden und Schreiben in Reihenfolge: spätes Laden überschreibt keinen neuen Eingang.
  const lauf = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    let aktiv = true;
    lauf.current = lauf.current.then(() => eingangAblage()).then((gespeichert) => {
      if (aktiv) setListe(gespeichert);
    }).catch((error: unknown) => { if (aktiv) fehler.current(error); });
    return () => { aktiv = false; };
  }, []);
  const aendern = useCallback((update: EingangAenderung, stapelIds: string[] = []): Promise<boolean> => {
    const schritt = lauf.current.then(async () => {
      try {
        const gespeichert = await eingangAblage(update, stapelIds);
        setListe(gespeichert);
        return true;
      } catch (error) { fehler.current(error); return false; }
    });
    lauf.current = schritt;
    return schritt;
  }, []);
  return [liste, aendern] as const;
}
