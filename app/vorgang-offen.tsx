import { ChevronRight } from "lucide-react";
import type { SectionId } from "./portal-types";
import { hierZumZiel } from "./sprung";

export type OffenerPunkt = { id: string; art: "memory" | "task" | "deadline"; titel: string; geschuetzt: boolean };

const GRUPPE: Record<OffenerPunkt["art"], string> = { memory: "Offene Fragen aus dem Tagebuch", task: "Aufgaben", deadline: "Fristen" };

/** Zahl-Knopf „5 Aufgaben“ (U3): springt zu seiner Gruppe in „Was ist noch offen?“ und markiert sie. */
export const zuOffenerGruppe = (art: OffenerPunkt["art"] | null) => () => { if (!art || !hierZumZiel(`#case-open-${art}`)) hierZumZiel("#case-open-details"); };

/**
 * „Was ist noch offen?“ eines Vorgangs als antippbare Liste (U3, 2.28.39): je Gruppe die offenen Punkte; ein Tipp öffnet
 * den Punkt an seinem Zuhause (Aufgaben und Fristen in „Fristen und Aufgaben“, Fragen im Tagebuch, Geschütztes im Gesundheitsbereich).
 */
export function OffenePunkte({ eintraege, onGo }: { eintraege: OffenerPunkt[]; onGo: (id: SectionId, targetId?: string) => void }) {
  if (!eintraege.length) return <p>Aus den vorhandenen Verknüpfungen ergibt sich zurzeit kein offener Punkt.</p>;
  const oeffnen = (p: OffenerPunkt) => p.geschuetzt ? onGo("health") : onGo(p.art === "memory" ? "memory" : "reminders", p.id);
  return <div className="case-open-gruppen" data-case-open-liste>
    {(["task", "deadline", "memory"] as const).map((art) => {
      const punkte = eintraege.filter((p) => p.art === art);
      if (!punkte.length) return null;
      return <div key={art} id={`case-open-${art}`} data-case-open={art}>
        <h4>{GRUPPE[art]} ({punkte.length})</h4>
        <ul>{punkte.map((p) => <li key={p.id}><button type="button" onClick={() => oeffnen(p)} data-case-open-punkt={p.id}><span>{p.geschuetzt ? "Geschützter Eintrag" : p.titel}</span><ChevronRight size={16} aria-hidden="true"/></button></li>)}</ul>
      </div>;
    })}
  </div>;
}
