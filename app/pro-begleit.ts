/** Vorsortierung aus Private Brain Pro im Arbeitsspeicher der App: Die Begleitdatei wird gemerkt (nie als Dokument oder
 *  Eingang), ihrer Mail als Vorschlag zugeordnet und entfällt nach 30 Tagen ohne passende Mail. Entscheidung und Prüfung
 *  liegen in `lib/pro-begleitdatei.ts`; hier steht nur das Lesen und Schreiben der Datenbank. */
import type { CentralIntakeQueueItem } from "../lib/central-intake";
import { PRO_BEGLEIT_TAGE, begleitZuordnen, eingangPruefbar, istProBegleitdatei, type BegleitMail, type BegleitStand } from "../lib/pro-begleitdatei";
import type { ProQuittung, ProUebergabe } from "../lib/pro-verbund-vertrag";
import { proUebergabePruefen } from "./pro-uebergabe";
import { stapelDatenbank } from "./stapel-ablage";

export type ProBegleit = { id: string; typ: "begleit"; vertrag: ProUebergabe; stand: BegleitStand; grund?: string; eingetroffen: string; file?: File };
type Beleg = { id: string; typ?: string; vertrag?: ProUebergabe; quittung?: ProQuittung };
type Stand = CentralIntakeQueueItem & { folge: number };
export type ProBegleitAbgleich = { zugeordnet: number; wartet: number; ohneWirkung: number; staende: Record<string, { stand: BegleitStand; grund: string }> };

const schluessel = (m: ProUebergabe) => JSON.stringify([m.quelle, m.id]);
async function mitDb<T>(tun: (db: IDBDatabase) => Promise<T>): Promise<T> { const db = await stapelDatenbank(); try { return await tun(db); } finally { db.close(); } }

/** Merkt die Begleitdatei dauerhaft (wiederholbar über die Übergabekennung). Erst danach darf quittiert werden. */
export async function proBegleitAnnehmen(wert: unknown, file: File): Promise<{ id: string; sha256: string }> {
  const m = await proUebergabePruefen(wert, file, "familienakte");
  if (!istProBegleitdatei(m)) throw new Error("Diese Übergabe ist keine Vorsortierung aus Private Brain Pro.");
  const id = schluessel(m);
  // Der Inhalt wird beim Abgleich geprüft; schon hier unlesbare Dateien werden nicht aufbewahrt, nur ihr Befund.
  const sofort = await begleitZuordnen(file, [], async () => null);
  const neu: ProBegleit = sofort.stand === "unbrauchbar"
    ? { id, typ: "begleit", vertrag: m, stand: "unbrauchbar", grund: sofort.grund, eingetroffen: new Date().toISOString() }
    : { id, typ: "begleit", vertrag: m, stand: "wartet", eingetroffen: new Date().toISOString(), file };
  await mitDb(db => new Promise<void>((resolve, reject) => {
    const t = db.transaction("uebergaben", "readwrite"), fach = t.objectStore("uebergaben"), lesen = fach.get(id);
    let fehler: unknown;
    t.oncomplete = () => resolve();
    t.onabort = () => reject(fehler || t.error || new Error("Die Vorsortierung konnte nicht gespeichert werden."));
    lesen.onsuccess = () => {
      try {
        if (!lesen.result) { fach.put(neu); return; }
        if (JSON.stringify(lesen.result.vertrag) !== JSON.stringify(m)) throw new Error("Diese Übergabekennung bezeichnet bereits einen anderen Inhalt.");
      } catch (error) { fehler = error; t.abort(); }
    };
  }));
  return { id, sha256: m.sha256 };
}

/** Ordnet alle wartenden Vorsortierungen ihren Mails zu. Geprüfte, abgelegte oder entfernte Eingänge bleiben unberührt. */
export async function proBegleitAbgleichen(jetzt: number = Date.now()): Promise<ProBegleitAbgleich> {
  const ergebnis: ProBegleitAbgleich = { zugeordnet: 0, wartet: 0, ohneWirkung: 0, staende: {} };
  let geaendert = false;
  await mitDb(async db => {
    const [belege, eingang] = await new Promise<[Beleg[], Stand[]]>((resolve, reject) => {
      const t = db.transaction(["uebergaben", "eingang"]), a = t.objectStore("uebergaben").getAll(), b = t.objectStore("eingang").getAll();
      t.oncomplete = () => resolve([a.result, b.result]); t.onabort = () => reject(t.error);
    });
    const wartend = belege.filter((b): b is ProBegleit => b.typ === "begleit" && (b as ProBegleit).stand === "wartet");
    if (!wartend.length) return;
    const nachId = new Map(eingang.map(e => [e.id, e]));
    const mails: BegleitMail[] = belege.filter(b => !b.typ && b.quittung && b.vertrag?.quelle === "private-brain" && !istProBegleitdatei(b.vertrag)).map(b => {
      const item = nachId.get(b.quittung!.eingangId);
      return { eingangId: b.quittung!.eingangId, name: b.vertrag!.name, sha256: b.vertrag!.sha256, pruefbar: eingangPruefbar(item), vorschlag: item?.uebergabeVorschlag, hinweis: item?.uebergabeHinweis };
    });
    const datei = (id: string) => new Promise<File | null>((resolve) => {
      const t = db.transaction("eingang-dateien"), r = t.objectStore("eingang-dateien").get(id);
      t.oncomplete = () => resolve(r.result?.file instanceof File ? r.result.file : null); t.onabort = () => resolve(null);
    });
    for (const b of wartend) {
      const alter = (jetzt - Date.parse(b.eingetroffen)) / 86400000;
      const r = b.file instanceof File ? await begleitZuordnen(b.file, mails, datei, Number.isFinite(alter) ? alter : PRO_BEGLEIT_TAGE)
        : { stand: "unbrauchbar" as const, grund: "Die gemerkte Vorsortierung ist nicht mehr lesbar. Sie wurde nicht verwendet.", aenderungen: [] };
      const gesetzt = await new Promise<number>((resolve, reject) => {
        const t = db.transaction(["eingang", "uebergaben"], "readwrite"), faelle = t.objectStore("eingang"); let n = 0, fehler: unknown;
        t.oncomplete = () => resolve(n); t.onabort = () => reject(fehler || t.error || new Error("Die Vorsortierung konnte nicht zugeordnet werden."));
        for (const a of r.aenderungen) {
          const lesen = faelle.get(a.eingangId);
          lesen.onsuccess = () => {
            try {
              // Zwischen Entscheidung und Schreiben kann der Eingang geprüft oder abgelegt worden sein: dann bleibt er, wie er ist.
              const item = lesen.result as Stand | undefined; if (!eingangPruefbar(item)) return;
              const neu: Stand = { ...item! };
              if (a.vorschlag) neu.uebergabeVorschlag = a.vorschlag; else delete neu.uebergabeVorschlag;
              if (a.hinweis) neu.uebergabeHinweis = a.hinweis;
              faelle.put(neu); n++;
            } catch (error) { fehler = error; t.abort(); }
          };
        }
        const { file: _file, ...ohneDatei } = b;
        t.objectStore("uebergaben").put(r.stand === "wartet" ? b : { ...ohneDatei, stand: r.stand, grund: r.grund });
      });
      for (const a of r.aenderungen) { const m = mails.find(x => x.eingangId === a.eingangId); if (m) { m.vorschlag = a.vorschlag; if (a.hinweis) m.hinweis = a.hinweis; } }
      if (gesetzt) geaendert = true;
      ergebnis.staende[b.id] = { stand: r.stand, grund: r.grund };
      if (r.stand === "zugeordnet") ergebnis.zugeordnet++; else if (r.stand === "wartet") ergebnis.wartet++; else ergebnis.ohneWirkung++;
    }
  });
  if (geaendert && typeof window !== "undefined") window.dispatchEvent(new Event("familienakte:pro-eingang"));
  return ergebnis;
}

/** Stand einer schon gemerkten Vorsortierung (für die Anzeige nach dem Aufnehmen). */
export async function proBegleitStand(id: string): Promise<{ stand: BegleitStand; grund: string } | null> {
  return mitDb(db => new Promise((resolve, reject) => {
    const t = db.transaction("uebergaben"), r = t.objectStore("uebergaben").get(id);
    t.oncomplete = () => { const b = r.result as ProBegleit | undefined; resolve(b?.typ === "begleit" ? { stand: b.stand, grund: b.grund || "" } : null); };
    t.onabort = () => reject(t.error);
  }));
}
