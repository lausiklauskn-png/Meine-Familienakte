import { createContext, useContext } from "react";

/**
 * Bsp. (Klaus 11.11.2026): jede Beispielakte trägt oben rechts ein deutliches rotes Dreieck – in der Liste und dort, wo sie
 * geöffnet wird –, damit sie niemand mit einer echten Akte verwechselt. Welche Einträge Beispiele sind, entscheidet dieselbe Regel
 * wie beim Entfernen (beispielIdsVon in app/sample-family.ts). In der Demo ist alles Beispiel; dort kein Dreieck.
 */
const BspIds = createContext<ReadonlySet<string>>(new Set());
export const BspProvider = BspIds.Provider;
export function useIstBsp(id: string | null | undefined) { const ids = useContext(BspIds); return Boolean(id && ids.has(id)); }
export function BspEcke({ id }: { id: string | null | undefined }) {
  return useIstBsp(id) ? <span className="bsp-ecke" role="img" aria-label="Bsp.-Akte" title="Bsp.-Akte – erfunden, keine echte Akte" data-bsp-ecke/> : null;
}
