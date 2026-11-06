import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteLocalScheduleRecord } from "./local-vault";

/**
 * Mülleimer an einer Erinnerung (Klaus 2026-11-06). Erster Tipp: „Löschen?“ (rot, 4 s), zweiter Tipp löscht. Kein
 * Rückfrage-Fenster, aber auch kein Löschen aus Versehen.
 */
export function ErinnerungLoeschen({ id, titel, vaultHandle, onGeloescht, mitText = false }: { id: string; titel: string; vaultHandle: FileSystemDirectoryHandle; onGeloescht: (text: string) => Promise<void> | void; mitText?: boolean }) {
  const [sicher, setSicher] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!sicher) return; const t = window.setTimeout(() => setSicher(false), 4000); return () => window.clearTimeout(t); }, [sicher]);
  const tippen = async () => {
    if (!sicher) { setSicher(true); return; }
    setBusy(true);
    try { await deleteLocalScheduleRecord(vaultHandle, id); await onGeloescht(`Gelöscht: ${titel}`); }
    finally { setBusy(false); setSicher(false); }
  };
  return <button type="button" className={`loesch-knopf${sicher ? " sicher" : ""}${mitText ? " mit-text" : ""}`} onClick={() => void tippen()} disabled={busy}
    aria-label={sicher ? `„${titel}“ jetzt löschen` : `„${titel}“ löschen`} title={sicher ? "Nochmal tippen zum Löschen" : "Löschen"} data-erinnerung-loeschen={sicher ? "sicher" : "bereit"}>
    <Trash2 size={16}/>{(sicher || mitText) && <span>{sicher ? "Löschen?" : "Löschen"}</span>}
  </button>;
}
