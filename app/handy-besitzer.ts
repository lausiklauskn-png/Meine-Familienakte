// Wem gehört dieses Handy? (Klaus 20.11.2026: „das Programm ist jeweils auf jedem Handy personalisiert“). Gemerkt je Gerät
// (wie der Name in „Meine Geräte“), nicht in der Akte – dieselbe Akte liegt auf mehreren Geräten.
import { useEffect, useState } from "react";
import { workspaceStorage } from "../lib/demo-workspace";

const SCHLUESSEL = "familienakte-ich-v1";
const EREIGNIS = "familienakte:ich";

export function handyBesitzer(): string | null {
  try { return workspaceStorage.getItem(SCHLUESSEL) || null; } catch { return null; }
}
export function handyBesitzerSetzen(id: string | null) {
  try { if (id) workspaceStorage.setItem(SCHLUESSEL, id); else workspaceStorage.removeItem(SCHLUESSEL); } catch { /* gilt bis zum Neuladen */ }
  window.dispatchEvent(new CustomEvent(EREIGNIS));
}
export function useHandyBesitzer(): string | null {
  const [ich, setIch] = useState(handyBesitzer);
  useEffect(() => { const neu = () => setIch(handyBesitzer()); window.addEventListener(EREIGNIS, neu); return () => window.removeEventListener(EREIGNIS, neu); }, []);
  return ich;
}
