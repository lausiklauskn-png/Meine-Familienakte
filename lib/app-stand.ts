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
  // Stufe D: Termine aus dem Kalender holen (beidseitig).
  "kalender": { stand: "aktivieren", selbst: "fristen-kalender", seit: "2.28.43" },
  "glocke": { stand: "aktivieren", selbst: "app-glocke" },
  // Abgleich zwischen Geräten (Plan Punkt 10): die Übergabe einer Unterlage ist fertig, der Abgleich steht im Kastentext als geplant.
  // Stufe C: gemeinsame Festplatte – vorbereiten, verbinden, abgleichen; erkannt an der Kennung.
  "anderes-geraet": { stand: "fertig", seit: "2.28.45" },
  // Stufe A (Plan 08.11.): Sicherung einlesen führt in eine benutzte Akte zusammen.
  // Stufe B: verschlüsselte Vollsicherung mit Notfallblatt, Erinnerung nach 7 Tagen, Papierkorb leeren.
  "sicherungsordner": { stand: "fertig", seit: "2.28.42" },
  "aus-sicherung": { stand: "fertig", seit: "2.28.41" },
  // Neugestaltung 2.28.39 (Punkt 2): ein Einstieg zum Ablegen im Kopf; Drucken nur noch über das Menü.
  "kopf-ablegen": { stand: "fertig", seit: "2.28.39" },
  // Ablaufprüfung 2.28.39: geänderte Wege golden markieren (Eingang mit Titel/Text/Sammelbestätigung, Frist mit Erinnerung
  // als Teil der Aufgabe, Suche nach Inhalt und Alltagswörtern, Personen anlegen, Glocke grün).
  // Stufe E: Eingangsordner in Blöcken zu 20, von selbst, ohne Zweitkopie, Speicherprüfung.
  "eingang": { stand: "fertig", seit: "2.28.44" },
  "vorschlag": { stand: "fertig", seit: "2.28.39" },
  "akte": { stand: "fertig", seit: "2.28.39" },
  "eintrag": { stand: "fertig", seit: "2.28.39" },
  "frist-neu": { stand: "fertig", seit: "2.28.39" },
  "aus-fristen": { stand: "fertig", seit: "2.28.39" },
  "aus-drucken": { stand: "fertig", seit: "2.28.39" },
};

/** Stand eines Kastens auf diesem Gerät. */
export function standVon(id: string, eingerichtet: ReadonlySet<string>): KartenStand {
  const e = APP_STAND[id];
  if (!e) return "fertig";
  if (e.stand === "aktivieren" && e.selbst && eingerichtet.has(e.selbst)) return "fertig";
  return e.stand;
}
