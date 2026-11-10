/** P5 (Plan 07.11., Punkt 2a): frei gewählter Ordner in der Android- und der Windows-App (Gerät, SD-Karte, USB, Netzordner),
 *  getrennt vom Pro-Tresor. Der native Teil (Android `FamilienakteOrdnerPlugin`, Windows `FamilyFolders.java`) gibt nur eine
 *  Kennung je Ordner heraus; hier wird daraus ein kleiner Ordner-Handle mit genau den Teilen der Dateisystem-Schnittstelle,
 *  die Vollsicherung, Export und Einlesen brauchen. So laufen dieselben geprüften Abläufe wie am PC. */
type Eintrag = { name: string; art: "datei" | "ordner"; groesse: number };
export type OrdnerPlugin = {
  ordnerWaehlen(a: { titel?: string }): Promise<{ token?: string; name?: string; cancelled?: boolean }>;
  ordnerListe(a: { token: string; pfad: string }): Promise<{ eintraege: Eintrag[] }>;
  ordnerAnlegen(a: { token: string; pfad: string }): Promise<unknown>;
  dateiInfo(a: { token: string; pfad: string }): Promise<{ art: "datei" | "ordner"; groesse: number }>;
  dateiLesen(a: { token: string; pfad: string; offset: number; laenge: number }): Promise<{ data: string }>;
  /** Nur selbst in dieser Sitzung angelegte Dateien (Schreibprobe); ein allgemeines Löschen gibt es nicht. */
  eigeneDateiEntfernen(a: { token: string; pfad: string }): Promise<unknown>;
  dateiBeginn(a: { token: string; pfad: string }): Promise<{ id: string }>;
  dateiAnhaengen(a: { id: string; offset: number; data: string }): Promise<{ size: number }>;
  dateiFertig(a: { id: string; size: number }): Promise<{ size: number; sha256: string }>;
  dateiVerwerfen(a: { id: string }): Promise<unknown>;
  programmBeilegen?(a: { token: string; pfad: string }): Promise<{ name: string; groesse: number; sha256: string; fassung: string }>;
  setupAngaben?(): Promise<{ version: string; datei?: string; sha256?: string; groesse?: number; url?: string }>;
};
type CapFenster = Window & { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string; Plugins?: { FamilyFolders?: OrdnerPlugin } } };
const STUECK = 1024 * 1024;

export function ordnerPlugin(): OrdnerPlugin | null {
  if (typeof window === "undefined") return null;
  const cap = (window as CapFenster).Capacitor;
  return cap?.isNativePlatform?.() && cap.Plugins?.FamilyFolders?.ordnerWaehlen ? cap.Plugins.FamilyFolders : null;
}
export const nativePlattform = () => (typeof window === "undefined" ? "" : (window as CapFenster).Capacitor?.getPlatform?.() || "");

const fehler = (name: string, text: string) => new DOMException(text, name);
function uebersetzt(e: unknown): unknown {
  const code = String((e as { code?: string; message?: string })?.code || (e as Error)?.message || e);
  if (code.includes("FA_NICHT_GEFUNDEN") || code.includes("TRESOR_DATEI_FEHLT")) return fehler("NotFoundError", "Nicht gefunden.");
  if (code.includes("FA_ART_FALSCH")) return fehler("TypeMismatchError", "Falsche Art.");
  if (code.includes("FA_NICHT_ERLAUBT")) return fehler("NotAllowedError", "Im gewählten Ordner entfernt die App nur Dateien, die sie gerade selbst angelegt hat.");
  if (code.includes("FA_ORDNER_NICHT_ERREICHBAR")) return new Error("Der gewählte Ordner ist nicht mehr erreichbar oder lässt sich nicht beschreiben (z. B. Freigabe abgelaufen, Speicher voll, SD-Karte entfernt). Bitte den Ordner erneut wählen – am besten einen eigenen Ordner außerhalb des Pro-Tresors.");
  if (code.includes("FA_ORDNER_UNGUELTIG") || code.includes("FA_PFAD_UNGUELTIG")) return new Error("In diesem Ordner darf die App nicht schreiben. Bitte einen anderen Ordner wählen (nicht den Pro-Tresor und keinen Systemordner).");
  if (code.includes("FA_AUSGABE_ZU_GROSS")) return new Error("Eine Datei ist zu groß für diesen Weg (über 100 MB).");
  if (code.includes("FA_AUSGABE_PRUEFSUMME") || code.includes("FA_STUECK_UNGUELTIG")) return new Error("Eine Datei kam beim Zurücklesen nicht unverändert an. Es wurde nichts als fertig gemeldet; bitte erneut versuchen.");
  // Rohe Android-Meldung ohne bekannten Code: nie „Ordnerzugriff fehlgeschlagen“ allein stehen lassen (Gerätetest 10.11.).
  if (/Ordnerzugriff fehlgeschlagen/.test(String((e as Error)?.message || ""))) return new Error(`Der gewählte Ordner ließ sich nicht lesen oder beschreiben${/^[A-Z0-9_]+$/.test(code) ? ` (${code})` : ""}. Bitte den Ordner erneut wählen.`);
  return e;
}
export const ordnerFehlerText = (e: unknown) => { const u = uebersetzt(e); return u instanceof Error ? u.message : String(u); };
const b64 = (bytes: Uint8Array) => { let t = ""; for (let i = 0; i < bytes.length; i += 8192) t += String.fromCharCode(...bytes.subarray(i, i + 8192)); return btoa(t); };
const unb64 = (text: string) => { const s = atob(text), out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; };
const pfadVon = (eltern: string, name: string) => {
  if (!name || name === "." || name === ".." || /[/\\:\u0000-\u001f]/.test(name)) throw new TypeError("Ungültiger Name.");
  return eltern ? `${eltern}/${name}` : name;
};

class NativeDatei {
  readonly kind = "file" as const;
  private p: OrdnerPlugin; private token: string; private pfad: string; readonly name: string;
  constructor(p: OrdnerPlugin, token: string, pfad: string, name: string) { this.p = p; this.token = token; this.pfad = pfad; this.name = name; }
  async getFile(): Promise<File> {
    let info: { groesse: number };
    try { info = await this.p.dateiInfo({ token: this.token, pfad: this.pfad }); } catch (e) { throw uebersetzt(e); }
    const teile: BlobPart[] = [];
    for (let offset = 0; offset < info.groesse; offset += STUECK) {
      let data: string; try { ({ data } = await this.p.dateiLesen({ token: this.token, pfad: this.pfad, offset, laenge: Math.min(STUECK, info.groesse - offset) })); } catch (e) { throw uebersetzt(e); }
      const u = unb64(data); if (!u.length) break; teile.push(u as BlobPart);
    }
    const file = new File(teile, this.name);
    if (file.size !== info.groesse) throw new Error(`„${this.name}“ wurde nicht vollständig gelesen.`);
    return file;
  }
  async createWritable() {
    const p = this.p; let id = ""; let offset = 0;
    const beginnen = async () => { if (!id) try { id = (await p.dateiBeginn({ token: this.token, pfad: this.pfad })).id; } catch (e) { throw uebersetzt(e); } };
    const schreiben = async (bytes: Uint8Array) => {
      await beginnen();
      for (let i = 0; i < bytes.length; i += STUECK) {
        const teil = bytes.subarray(i, i + STUECK);
        let r: { size: number }; try { r = await p.dateiAnhaengen({ id, offset, data: b64(teil) }); } catch (e) { throw uebersetzt(e); } offset += teil.length;
        if (r.size !== offset) throw new Error("Die Datei wurde nicht vollständig geschrieben.");
      }
    };
    return {
      async write(daten: Blob | BufferSource | string) {
        if (typeof daten === "string") return schreiben(new TextEncoder().encode(daten));
        if (daten instanceof Blob) { await beginnen(); for (let i = 0; i < daten.size; i += STUECK) await schreiben(new Uint8Array(await daten.slice(i, i + STUECK).arrayBuffer())); return; }
        return schreiben(daten instanceof ArrayBuffer ? new Uint8Array(daten) : new Uint8Array(daten.buffer, daten.byteOffset, daten.byteLength));
      },
      async close() { await beginnen(); let r: { size: number }; try { r = await p.dateiFertig({ id, size: offset }); } catch (e) { throw uebersetzt(e); } if (r.size !== offset) throw new Error("Die Datei wurde nicht vollständig geschrieben."); id = ""; },
      async abort() { if (id) await p.dateiVerwerfen({ id }).catch(() => {}); id = ""; },
    };
  }
  async isSameEntry(other: unknown) { return other instanceof NativeDatei && other.token === this.token && other.pfad === this.pfad; }
}

export class NativerOrdner {
  readonly kind = "directory" as const;
  private p: OrdnerPlugin; readonly token: string; readonly pfad: string; readonly name: string;
  constructor(p: OrdnerPlugin, token: string, pfad: string, name: string) { this.p = p; this.token = token; this.pfad = pfad; this.name = name; }
  private async info(pfad: string) { try { return await this.p.dateiInfo({ token: this.token, pfad }); } catch (e) { throw uebersetzt(e); } }
  async getDirectoryHandle(name: string, o?: { create?: boolean }) {
    const pfad = pfadVon(this.pfad, name);
    try { const i = await this.info(pfad); if (i.art !== "ordner") throw fehler("TypeMismatchError", "Kein Ordner."); }
    catch (e) {
      if ((e as DOMException)?.name !== "NotFoundError" || !o?.create) throw e;
      try { await this.p.ordnerAnlegen({ token: this.token, pfad }); } catch (x) { throw uebersetzt(x); }
    }
    return new NativerOrdner(this.p, this.token, pfad, name);
  }
  async getFileHandle(name: string, o?: { create?: boolean }) {
    const pfad = pfadVon(this.pfad, name);
    try { const i = await this.info(pfad); if (i.art !== "datei") throw fehler("TypeMismatchError", "Keine Datei."); }
    catch (e) {
      if ((e as DOMException)?.name !== "NotFoundError" || !o?.create) throw e;
      const w = await new NativeDatei(this.p, this.token, pfad, name).createWritable(); await w.close();
    }
    return new NativeDatei(this.p, this.token, pfad, name);
  }
  async removeEntry(name: string) {
    try { await this.p.eigeneDateiEntfernen({ token: this.token, pfad: pfadVon(this.pfad, name) }); } catch (e) { throw uebersetzt(e); }
  }
  async *values() {
    let liste: Eintrag[];
    try { liste = (await this.p.ordnerListe({ token: this.token, pfad: this.pfad })).eintraege; } catch (e) { throw uebersetzt(e); }
    for (const e of liste) {
      const pfad = pfadVon(this.pfad, e.name);
      yield e.art === "ordner" ? new NativerOrdner(this.p, this.token, pfad, e.name) : new NativeDatei(this.p, this.token, pfad, e.name);
    }
  }
  async *entries() { for await (const h of this.values()) yield [h.name, h] as const; }
  async isSameEntry(other: unknown) { return other instanceof NativerOrdner && other.token === this.token && other.pfad === this.pfad; }
  /** Android: eigene APK neben die Sicherung legen (Frage s). */
  programmBeilegen() { return this.p.programmBeilegen ? this.p.programmBeilegen({ token: this.token, pfad: this.pfad }) : Promise.resolve(null); }
}

export async function nativenOrdnerWaehlen(titel: string): Promise<FileSystemDirectoryHandle> {
  const p = ordnerPlugin(); if (!p) throw new Error("Die Ordnerwahl braucht die aktuelle Android- oder Windows-App.");
  const r = await p.ordnerWaehlen({ titel });
  if (r.cancelled || !r.token) throw new DOMException("Ordnerwahl abgebrochen.", "AbortError");
  return new NativerOrdner(p, r.token, "", r.name || "Ordner") as unknown as FileSystemDirectoryHandle;
}
export const istNativerOrdner = (h: unknown): h is NativerOrdner => h instanceof NativerOrdner;

/** Windows (Frage s): Lies-mich mit Download-Adresse und SHA-256 des Setups dieser Fassung. Ohne Netz nur die Download-Seite. */
export async function liesMichWindows(fassung: string): Promise<string> {
  let angaben: Awaited<ReturnType<NonNullable<OrdnerPlugin["setupAngaben"]>>> | null = null;
  try { angaben = (await ordnerPlugin()?.setupAngaben?.()) || null; } catch { angaben = null; }
  const seite = `https://github.com/lausiklauskn-png/Meine-Familienakte/releases/tag/windows-v${fassung}`;
  return [
    "Familienakte Pro für Windows – Programm zu dieser Sicherung",
    "",
    `Fassung: ${fassung}`,
    angaben?.url ? `Download: ${angaben.url}` : `Download-Seite: ${seite}`,
    angaben?.sha256 ? `SHA-256 des Setups (${angaben.datei}): ${angaben.sha256}` : "SHA-256: steht auf der Download-Seite (Datei SHA256SUMS). Beim Erstellen dieser Sicherung war der Update-Server nicht erreichbar.",
    "",
    "Prüfen unter Windows: PowerShell öffnen und eingeben",
    "  Get-FileHash .\\Familienakte-Windows-<Fassung>-x64-setup.exe -Algorithm SHA256",
    "Die angezeigte Zahl muss genau mit der oben übereinstimmen.",
    "",
    "Danach installieren und unter Sicherheit › Sicherung einlesen diesen Sicherungsordner wählen (eine benutzte Akte wird zusammengeführt).",
    "",
  ].join("\r\n");
}
