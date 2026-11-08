/** Stufe F: ein Gastgeber im eigenen Netz als Ordner-Handle. Dieselben Teile der Dateisystem-Schnittstelle wie NativerOrdner,
 *  darum läuft der Abgleich aus app/laufwerk.ts unverändert darüber. Die Anfragen gehen über die native Hülle (eigener Socket),
 *  nicht über die WebView – Android erlaubt sonst keinen unverschlüsselten Zugriff im Heimnetz. Inhalte sind ohnehin mit dem
 *  Abgleichsschlüssel verschlüsselt; der Token aus dem Kopplungscode schützt den Zugang. */
export type NetzPlugin = {
  start(a: { ordner?: string; token: string; kennung: string; name: string; port?: number }): Promise<NetzZustand>;
  stop(): Promise<NetzZustand>;
  zustand(): Promise<NetzZustand>;
  suchen(a: { ms?: number }): Promise<{ treffer: Array<{ kennung: string; name: string; port: number; adresse: string }> }>;
  anfrage(a: { adresse: string; port: number; token: string; methode: string; weg: string; data?: string }): Promise<{ status: number; art: string; data: string }>;
};
export type NetzZustand = { laeuft: boolean; port: number; adressen: string[]; kennung: string; name: string };
type Cap = { isNativePlatform?: () => boolean; Plugins?: { FamilienakteNetz?: NetzPlugin } };
export function netzPlugin(): NetzPlugin | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: Cap }).Capacitor;
  return cap?.isNativePlatform?.() && cap.Plugins?.FamilienakteNetz?.anfrage ? cap.Plugins.FamilienakteNetz : null;
}
export const STUECK = 1024 * 1024;
const b64 = (u: Uint8Array) => { let s = ""; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };
const unb64 = (t: string) => { const s = atob(t), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
const fehler = (name: string, text: string) => { const e = new DOMException(text, name); return e; };
const pfadVon = (a: string, b: string) => (a ? `${a}/${b}` : b);

export type NetzZiel = { adresse: string; port: number; token: string };
async function ruf(p: NetzPlugin, z: NetzZiel, methode: string, weg: string, pfad: string, extra = "", data?: Uint8Array) {
  const r = await p.anfrage({ adresse: z.adresse, port: z.port, token: z.token, methode, weg: `${weg}?pfad=${encodeURIComponent(pfad)}${extra}`, data: data ? b64(data) : undefined })
    .catch(() => { throw fehler("NetworkError", "Der Gastgeber antwortet nicht (nicht im selben Netz oder Dienst aus)."); });
  if (r.status === 401) throw fehler("NotAllowedError", "Der Kopplungscode passt nicht zu diesem Gastgeber.");
  if (r.status === 404) throw fehler("NotFoundError", "Nicht gefunden.");
  if (r.status >= 400) throw fehler("InvalidStateError", `Der Gastgeber hat abgelehnt (${r.status}).`);
  return r;
}
const json = <T,>(r: { data: string }) => JSON.parse(new TextDecoder().decode(unb64(r.data))) as T;

class NetzDatei {
  readonly kind = "file" as const;
  constructor(private p: NetzPlugin, private z: NetzZiel, readonly pfad: string, readonly name: string) {}
  async getFile() {
    const info = json<{ art: string; groesse: number }>(await ruf(this.p, this.z, "GET", "/info", this.pfad));
    if (info.art !== "datei") throw fehler("TypeMismatchError", "Kein Datei.");
    const teile: BlobPart[] = [];
    for (let offset = 0; offset < info.groesse; offset += STUECK) {
      const r = await ruf(this.p, this.z, "GET", "/datei", this.pfad, `&offset=${offset}&laenge=${Math.min(STUECK, info.groesse - offset)}`);
      const u = unb64(r.data); if (!u.length) break; teile.push(u as BlobPart);
    }
    const f = new File(teile, this.name);
    if (f.size !== info.groesse) throw new Error(`„${this.name}“ wurde nicht vollständig vom Gastgeber gelesen.`);
    return f;
  }
  /** Die Stücke werden gesammelt und in einem Zug übertragen (bis 100 MB); der Gastgeber prüft die Länge und meldet die Prüfsumme. */
  async createWritable() {
    const teile: Uint8Array[] = []; const p = this.p, z = this.z, pfad = this.pfad;
    return {
      async write(daten: Blob | BufferSource | string) {
        if (typeof daten === "string") teile.push(new TextEncoder().encode(daten));
        else if (daten instanceof Blob) teile.push(new Uint8Array(await daten.arrayBuffer()));
        else teile.push(daten instanceof ArrayBuffer ? new Uint8Array(daten) : new Uint8Array(daten.buffer, daten.byteOffset, daten.byteLength));
      },
      async close() {
        const ganz = new Uint8Array(teile.reduce((n, t) => n + t.length, 0)); let o = 0; for (const t of teile) { ganz.set(t, o); o += t.length; }
        // Große Dateien gehen in Stücken an einen Gastgeber mit begrenzter Anfragegröße: hier ein Zug, der Dienst nimmt bis 100 MB.
        const r = json<{ size: number }>(await ruf(p, z, "PUT", "/datei", pfad, "", ganz));
        if (r.size !== ganz.length) throw new Error("Die Datei kam beim Gastgeber nicht vollständig an.");
      },
      async abort() { /* nichts geschrieben */ },
    };
  }
  async isSameEntry(other: unknown) { return other instanceof NetzDatei && other.pfad === this.pfad && other.z.adresse === this.z.adresse; }
}

export class NetzOrdner {
  readonly kind = "directory" as const;
  constructor(private p: NetzPlugin, readonly z: NetzZiel, readonly pfad: string, readonly name: string) {}
  private async info(pfad: string) { return json<{ art: "datei" | "ordner"; groesse: number }>(await ruf(this.p, this.z, "GET", "/info", pfad)); }
  async getDirectoryHandle(name: string, o?: { create?: boolean }) {
    const pfad = pfadVon(this.pfad, name);
    try { const i = await this.info(pfad); if (i.art !== "ordner") throw fehler("TypeMismatchError", "Kein Ordner."); }
    catch (e) { if ((e as DOMException)?.name !== "NotFoundError" || !o?.create) throw e; await ruf(this.p, this.z, "POST", "/ordner", pfad); }
    return new NetzOrdner(this.p, this.z, pfad, name);
  }
  async getFileHandle(name: string, o?: { create?: boolean }) {
    const pfad = pfadVon(this.pfad, name);
    try { const i = await this.info(pfad); if (i.art !== "datei") throw fehler("TypeMismatchError", "Keine Datei."); }
    catch (e) { if ((e as DOMException)?.name !== "NotFoundError" || !o?.create) throw e; await ruf(this.p, this.z, "PUT", "/datei", pfad, "", new Uint8Array(0)); }
    return new NetzDatei(this.p, this.z, pfad, name);
  }
  async removeEntry(name: string) { await ruf(this.p, this.z, "DELETE", "/datei", pfadVon(this.pfad, name)); }
  async *values() {
    const r = json<{ eintraege: Array<{ name: string; art: "datei" | "ordner"; groesse: number }> }>(await ruf(this.p, this.z, "GET", "/liste", this.pfad));
    for (const e of r.eintraege) { const pfad = pfadVon(this.pfad, e.name); yield e.art === "ordner" ? new NetzOrdner(this.p, this.z, pfad, e.name) : new NetzDatei(this.p, this.z, pfad, e.name); }
  }
  async *entries() { for await (const h of this.values()) yield [h.name, h] as const; }
  async isSameEntry(other: unknown) { return other instanceof NetzOrdner && other.z.adresse === this.z.adresse && other.pfad === this.pfad; }
}
export const istNetzOrdner = (h: unknown): h is NetzOrdner => h instanceof NetzOrdner;
export const netzOrdner = (z: NetzZiel, name: string) => { const p = netzPlugin(); if (!p) throw new Error("Der Abgleich im Netz braucht die Android- oder Windows-App."); return new NetzOrdner(p, z, "", name) as unknown as FileSystemDirectoryHandle; };
/** Ist der Gastgeber erreichbar und meint er dieselbe Kennung? */
export async function gastgeberPruefen(z: NetzZiel): Promise<{ kennung: string; name: string } | null> {
  const p = netzPlugin(); if (!p) return null;
  try { const r = await p.anfrage({ adresse: z.adresse, port: z.port, token: z.token, methode: "GET", weg: "/kopf" }); return r.status === 200 ? json(r) : null; }
  catch { return null; }
}
/** Token aus dem Kopplungscode (9 Ziffern) und der Kennung – wer den Code hat, darf zugreifen; der Code geht nie über das Netz. */
export async function tokenAusCode(code: string, kennung: string) {
  const ziffern = code.replace(/\D/g, "");
  if (ziffern.length !== 9) throw new Error("Der Kopplungscode hat 9 Ziffern.");
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`familienakte-netz|${kennung}|${ziffern}`));
  return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
export const neuerCode = () => { const z = crypto.getRandomValues(new Uint32Array(3)); return [...z].map((x) => String(x % 1000).padStart(3, "0")).join(""); };
export const codeAnzeige = (code: string) => code.replace(/\D/g, "").replace(/(\d{3})(?=\d)/g, "$1 ");
