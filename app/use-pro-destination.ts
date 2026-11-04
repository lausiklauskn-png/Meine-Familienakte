import { useCallback, useEffect, useState } from "react";
import { demoActive } from "../lib/demo-workspace";
import { readProDocumentVault } from "./local-vault";
import { proTresor, proTresorVerfuegbar } from "./pro-tresor";

export type ProDestination = { id: string; ready: boolean };

/** Nur ein ausdrücklich zugeordnetes, tatsächlich offenes Originalziel ist bereit. */
export function useProDestination(handle: FileSystemDirectoryHandle | null) {
  const [revision, setRevision] = useState(0);
  const [value, setValue] = useState<{ handle: FileSystemDirectoryHandle | null; destination: ProDestination | null }>({ handle: null, destination: null });
  const refresh = useCallback(() => setRevision((current) => current + 1), []);
  useEffect(() => {
    let active = true, request = 0;
    const read = async () => {
      const current = ++request;
      let destination: ProDestination | null = null;
      if (handle && !demoActive()) {
        try {
          const id = await readProDocumentVault(handle);
          if (id) {
            destination = { id, ready: false };
            if (proTresorVerfuegbar()) {
              const state = await proTresor.zustand();
              destination.ready = state.id === id && state.status === "offen";
            }
          }
        } catch { /* Ohne bestätigten Zugriff niemals grün anzeigen. */ }
      }
      if (active && request === current) setValue({ handle, destination });
    };
    void read();
    const visible = () => { if (document.visibilityState === "visible") void read(); };
    document.addEventListener("visibilitychange", visible);
    return () => { active = false; document.removeEventListener("visibilitychange", visible); };
  }, [handle, revision]);
  return { destination: value.handle === handle ? value.destination : null, refresh };
}
