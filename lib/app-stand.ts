import type { KartenStand } from "../app/landkarte";

/**
 * Stand je Kasten der Landkarte (Klaus 07.11.2026, Sitzung 4; wie status.json im Sage-Protokoll).
 * Was hier nicht steht, ist fertig. Jede Bausitzung trägt hier ein, was sich mit ihrer Fassung ändert; die Hilfe umrahmt
 * Geändertes golden, bis man den Kasten antippt (höchstens 14 Tage).
 * „selbst“: rot (einschalten) wird grün, sobald es auf diesem Gerät eingerichtet ist (Kennung wie in hilfeEingerichtet).
 */
export type StandEintrag = { stand: KartenStand; seit?: string; selbst?: "datentresor" | "fristen-kalender" | "app-glocke" };

export const APP_STAND: Readonly<Record<string, StandEintrag>> = {
  // E-Mail (Plan Sitzung 3, nicht gebaut)
  "mail-ms": { stand: "geplant", seit: "2.28.35" },
  "mail-imap": { stand: "geplant", seit: "2.28.35" },
  "mail-gmail": { stand: "geplant", seit: "2.28.35" },
  "pruefung": { stand: "geplant", seit: "2.28.35" },
  "befund": { stand: "geplant", seit: "2.28.35" },
  "echt": { stand: "geplant", seit: "2.28.35" },
  "programm": { stand: "geplant", seit: "2.28.35" },
  "mailapp": { stand: "geplant", seit: "2.28.35" },
  "mssend": { stand: "geplant", seit: "2.28.35" },
  // Einrichten
  "datei-pro": { stand: "aktivieren" },
  "datentresor": { stand: "aktivieren", selbst: "datentresor" },
  "protresor": { stand: "aktivieren" },
  "kalender": { stand: "aktivieren", selbst: "fristen-kalender" },
  "glocke": { stand: "aktivieren", selbst: "app-glocke" },
  // Im Bau
  "tresor-einschritt": { stand: "imbau" },
};

/** Stand eines Kastens auf diesem Gerät. */
export function standVon(id: string, eingerichtet: ReadonlySet<string>): KartenStand {
  const e = APP_STAND[id];
  if (!e) return "fertig";
  if (e.stand === "aktivieren" && e.selbst && eingerichtet.has(e.selbst)) return "fertig";
  return e.stand;
}
