/** Stufe E: Dauer-Meldung während langer Arbeit (Blöcke aus dem Eingangsordner). Android hält die App mit einem
 *  Vordergrunddienst wach und zeigt den Fortschritt in der Leiste (FamilienakteArbeitPlugin); Windows und Browser arbeiten
 *  nur, solange die App offen ist – dort tut dieser Baustein nichts, die Oberfläche zeigt den Stand selbst. */
type Plugin = { start(a: { titel: string; text: string }): Promise<unknown>; update(a: { text: string; fortschritt?: number; gesamt?: number }): Promise<unknown>; stop(): Promise<unknown> };
type Cap = { isNativePlatform?: () => boolean; getPlatform?: () => string; Plugins?: { FamilienakteArbeit?: Plugin } };
const plugin = (): Plugin | null => {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: Cap }).Capacitor;
  return cap?.isNativePlatform?.() && cap.getPlatform?.() === "android" && cap.Plugins?.FamilienakteArbeit?.start ? cap.Plugins.FamilienakteArbeit : null;
};
let laeuft = false;
export const arbeitDienst = {
  moeglich: () => Boolean(plugin()),
  async start(text: string) { const p = plugin(); if (!p || laeuft) return; laeuft = true; await p.start({ titel: "Familienakte arbeitet", text }).catch(() => { laeuft = false; }); },
  async update(text: string, fortschritt?: number, gesamt?: number) { const p = plugin(); if (!p || !laeuft) return; await p.update({ text, fortschritt, gesamt }).catch(() => undefined); },
  async stop() { const p = plugin(); if (!p || !laeuft) return; laeuft = false; await p.stop().catch(() => undefined); },
};
