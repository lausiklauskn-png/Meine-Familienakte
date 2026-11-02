import type { ProApp, ProUebergabe, ProQuittung, ProRueckkanal } from "../lib/pro-verbund-vertrag";
export type { ProApp, ProUebergabe, ProQuittung } from "../lib/pro-verbund-vertrag";
import { stapelDatenbank } from "./stapel-ablage";
import type { CentralIntakeQueueItem } from "../lib/central-intake";

export const PRO_APPS = ["familienakte", "workflow-pdf-pro", "private-brain", "bookledgerpro"] as const;
const text = (v: unknown, max: number) => typeof v === "string" && v.length > 0 && v.length <= max && !/[\u0000-\u001f]/.test(v);
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
export async function proUebergabeBauen(file: File, quelle: ProApp, ziel: ProApp, dokumentId: string, id: string = crypto.randomUUID()): Promise<ProUebergabe> {
  if (file.size > 20 * 1024 * 1024) throw new Error("Die Familienakte nimmt höchstens 20 MiB je Dokument an.");
  return { vertrag: "familienakte-uebergabe/1", id, quelle, ziel, dokumentId, name: file.name, mime: file.type,
    groesse: file.size, sha256: hex(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())) };
}
export async function proUebergabePruefen(wert: unknown, file: File, ziel: ProApp): Promise<ProUebergabe> {
  if (!wert || typeof wert !== "object") throw new Error("Ungültiger Übergabevertrag.");
  const m = wert as ProUebergabe;
  if (m.vertrag !== "familienakte-uebergabe/1" || !text(m.id, 160) || !text(m.dokumentId, 200) ||
      !PRO_APPS.includes(m.quelle) || m.ziel !== ziel || !PRO_APPS.includes(m.ziel) ||
      !text(m.name, 255) || m.name !== file.name || typeof m.mime !== "string" || m.mime !== file.type ||
      !Number.isSafeInteger(m.groesse) || m.groesse < 0 || m.groesse > 20 * 1024 * 1024 || m.groesse !== file.size ||
      !/^[a-f0-9]{64}$/.test(m.sha256) || (m.bezug !== undefined && !text(m.bezug, 160))) throw new Error("Übergabe passt nicht zu Ziel oder Datei (höchstens 20 MiB).");
  if (hex(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())) !== m.sha256) throw new Error("Die Übergabe-Prüfsumme stimmt nicht.");
  return { vertrag: m.vertrag, id: m.id, quelle: m.quelle, ziel: m.ziel, dokumentId: m.dokumentId,
    name: m.name, mime: m.mime, groesse: m.groesse, sha256: m.sha256, ...(m.bezug ? { bezug: m.bezug } : {}) };
}

/** Datei, Eingangsdatensatz und wiederholbare Quittung bilden EINE Transaktion.
 * Die Quittung bleibt auch nach späterer Einordnung/Entfernung des Arbeitsfalls erhalten. */
export async function proUebergabeAnnehmen(wert: unknown, file: File, rueckkanal?: ProRueckkanal): Promise<ProQuittung> {
  const m = await proUebergabePruefen(wert, file, "familienakte");
  if (rueckkanal && (!/^[a-f0-9]{64}$/.test(rueckkanal.nonce) || !text(rueckkanal.empfaenger, 80))) throw Error("Ungültiger Rückkanal.");
  const db = await stapelDatenbank();
  try {
    return await new Promise((resolve, reject) => {
      const t = db.transaction(["eingang", "eingang-dateien", "uebergaben"], "readwrite");
      const fach = t.objectStore("uebergaben");
      const key = JSON.stringify([m.quelle, m.id]);
      const lesen = fach.get(key);
      let quittung: ProQuittung; let fehler: unknown;
      t.oncomplete = () => resolve(quittung);
      t.onabort = () => reject(fehler || t.error || new Error("Übergabe konnte nicht dauerhaft gespeichert werden."));
      lesen.onsuccess = () => {
        try {
          if (lesen.result) {
            if (JSON.stringify(lesen.result.vertrag) !== JSON.stringify(m)) throw new Error("Diese Übergabekennung bezeichnet bereits einen anderen Inhalt.");
            if (rueckkanal && (lesen.result.rueckkanal?.nonce !== rueckkanal.nonce || lesen.result.rueckkanal?.empfaenger !== rueckkanal.empfaenger)) throw new Error("Diese Übergabekennung hat einen anderen Rückkanal.");
            quittung = lesen.result.quittung; return;
          }
          const eingangId = crypto.randomUUID();
          quittung = { id: m.id, quelle: m.quelle, ziel: m.ziel, sha256: m.sha256, groesse: m.groesse, eingangId, stand: "im-eingang" };
          const item: CentralIntakeQueueItem = { id: eingangId, file: { name: file.name, type: file.type, size: file.size, lastModified: file.lastModified },
            source: "file-picker", proUebergabe: m, status: "Analyse läuft", selected: false, addedAt: new Date().toISOString(), analysis: null, error: null };
          // Negative Folge stellt den neuen Eingang vor ältere Fälle; spätere normale Änderungen nummerieren neu.
          t.objectStore("eingang").put({ ...item, folge: -Date.now() });
          t.objectStore("eingang-dateien").put({ id: eingangId, file });
          fach.put({ id: key, vertrag: m, quittung, ...(rueckkanal ? { rueckkanal: { nonce: rueckkanal.nonce, empfaenger: rueckkanal.empfaenger } } : {}) });
        } catch (error) { fehler = error; t.abort(); }
      };
    });
  } finally { db.close(); }
}
