export type ProTresorZustand = { status: "getrennt" | "offen" | "gesperrt" | "nicht_erreichbar"; id?: string; ort?: string };
interface ProTresorPlugin {
  zustand(): Promise<ProTresorZustand>;
  verbinden(): Promise<ProTresorZustand>;
  entsperren(): Promise<ProTresorZustand>;
  sperren(): Promise<void>;
}
type NativeWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string; Plugins?: { FamilienakteTresor?: ProTresorPlugin } } };
const cap = () => (window as NativeWindow).Capacitor;
export const proTresorVerfuegbar = () => Boolean(cap()?.isNativePlatform?.() && ["android", "windows"].includes(cap()?.getPlatform?.() || "") && cap()?.Plugins?.FamilienakteTresor);
async function aufrufen<K extends keyof ProTresorPlugin>(name: K): Promise<Awaited<ReturnType<ProTresorPlugin[K]>>> {
  const plugin = cap()?.Plugins?.FamilienakteTresor;
  if (!plugin) throw new Error("Pro-Tresor ist auf diesem Gerät nicht verfügbar.");
  return await plugin[name]() as Awaited<ReturnType<ProTresorPlugin[K]>>;
}
export const proTresor = {
  zustand: () => aufrufen("zustand"), verbinden: () => aufrufen("verbinden"),
  entsperren: () => aufrufen("entsperren"), sperren: () => aufrufen("sperren"),
};
