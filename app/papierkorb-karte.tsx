import { RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { papierkorbEndgueltig, papierkorbLesen, papierkorbWiederherstellen, type PapierkorbEintrag } from "./local-vault";

/**
 * Papierkorb für Erinnerungen, Aufgaben, Fristen und Tagebuch-Notizen (Klaus 10.11.2026: „wenn ich eine Erinnerung gelöscht habe
 * und festgestellt habe, das war die falsche … wie in jedem E-Mail-Programm“). Gelöschtes liegt hier mit allen Verknüpfungen;
 * „Wiederherstellen“ setzt es zurück, „Endgültig löschen“ erst nach zweitem Tipp. Dokumente haben ihren eigenen Ort „Aussortiert“.
 */
const ART: Record<string, string> = { deadline: "Frist", task: "Aufgabe", reminder: "Erinnerung" };
const artName = (e: PapierkorbEintrag) => e.art === "notiz" ? "Notiz" : ART[e.recordType] || "Erinnerung";
const wann = (iso: string) => new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function PapierkorbKarte({ vaultHandle, stand, onRefresh, onNotice, nur }: {
  vaultHandle: FileSystemDirectoryHandle | null; stand: unknown; onRefresh: () => Promise<void> | void;
  onNotice: (n: { kind: "success" | "error"; text: string }) => void; nur?: "notiz" | "termin";
}) {
  const [liste, setListe] = useState<PapierkorbEintrag[]>([]);
  const [sicher, setSicher] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const laden = useCallback(async () => { if (!vaultHandle) return setListe([]); try { setListe(await papierkorbLesen(vaultHandle)); } catch { setListe([]); } }, [vaultHandle]);
  useEffect(() => { void laden(); }, [laden, stand]);
  useEffect(() => { if (!sicher) return; const t = window.setTimeout(() => setSicher(null), 4000); return () => window.clearTimeout(t); }, [sicher]);
  const zeigen = nur ? liste.filter((e) => e.art === nur) : liste;
  if (!vaultHandle) return null;
  const tun = async (was: () => Promise<unknown>, text: string) => {
    setBusy(true);
    try { await was(); await laden(); await onRefresh(); onNotice({ kind: "success", text }); }
    catch (fehler) { onNotice({ kind: "error", text: fehler instanceof Error ? fehler.message : "Das ging nicht." }); }
    finally { setBusy(false); setSicher(null); }
  };
  const endgueltig = (ids: string[], schluessel: string, text: string) => { if (sicher !== schluessel) { setSicher(schluessel); return; } void tun(() => papierkorbEndgueltig(vaultHandle, ids), text); };
  return <section className="card papierkorb" data-papierkorb>
    <details>
      <summary><Trash2 size={18}/> <strong>Papierkorb ({zeigen.length})</strong> <small className="muted">{nur === "notiz" ? "gelöschte Notizen" : "gelöschte Erinnerungen, Aufgaben, Fristen und Notizen"}</small></summary>
      {zeigen.length === 0 ? <p className="muted" data-papierkorb-leer>Leer. Was du löschst, landet zuerst hier und lässt sich zurückholen.</p> : <>
        <ul className="papierkorb-liste">
          {zeigen.map((e) => <li key={e.id} data-papierkorb-eintrag={e.id}>
            <span className="papierkorb-text"><strong>{e.titel}</strong><small>{artName(e)} · gelöscht {wann(e.geloeschtAm)}</small></span>
            <button type="button" className="button secondary compact-button" disabled={busy} onClick={() => void tun(() => papierkorbWiederherstellen(vaultHandle, e.id), `Wiederhergestellt: ${e.titel}`)} data-papierkorb-zurueck><RotateCcw size={15}/> Wiederherstellen</button>
            <button type="button" className={`loesch-knopf${sicher === e.id ? " sicher" : ""}`} disabled={busy} onClick={() => endgueltig([e.id], e.id, `Endgültig gelöscht: ${e.titel}`)} aria-label={sicher === e.id ? `„${e.titel}“ jetzt endgültig löschen` : `„${e.titel}“ endgültig löschen`} title="Endgültig löschen" data-papierkorb-weg={sicher === e.id ? "sicher" : "bereit"}><Trash2 size={16}/>{sicher === e.id && <span>Endgültig?</span>}</button>
          </li>)}
        </ul>
        <button type="button" className={`button secondary compact-button${sicher === "alle" ? " gefahr" : ""}`} disabled={busy} onClick={() => endgueltig(zeigen.map((e) => e.id), "alle", `Papierkorb geleert (${zeigen.length}).`)} data-papierkorb-leeren>{sicher === "alle" ? "Nochmal tippen: alles endgültig löschen" : "Papierkorb leeren"}</button>
      </>}
    </details>
  </section>;
}
