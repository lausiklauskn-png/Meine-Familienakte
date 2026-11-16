/** Vorsortierung aus Private Brain Pro: kommt als eigene Übergabe „familienakte-uebergabe.json“ über den Pro-Tresor
 *  (Fach „eingang-familienakte“) und ist nie ein Dokument. Zugeordnet wird über Name + SHA-256 der Mail aus dem Inhalt;
 *  die Reihenfolge (Mail zuerst oder Begleitdatei zuerst) spielt keine Rolle. Geprüft wird mit derselben Prüfung wie bei
 *  der Dateiauswahl (`uebergabe-vorschlaege.ts`). Vorschläge sind nur Vorschläge: keine Ablage, keine Rechte, keine IDs. */
import { MEHRERE_VORSCHLAEGE, begleitdateiLesen, istBegleitdatei, uebergabeVorschlaege, type UebergabeVorschlag } from "./uebergabe-vorschlaege.ts";

/** Der angezeigte Name steht fest; der freie Text „quelle“ in der Datei bestimmt ihn nicht. */
export const PRO_BEGLEIT_QUELLE = "Private Brain Pro";
/** So lange wartet eine Vorsortierung auf ihre Mail. Danach entfällt sie ohne Wirkung. */
export const PRO_BEGLEIT_TAGE = 30;

export function istProBegleitdatei(vertrag: unknown): boolean {
  if (!vertrag || typeof vertrag !== "object") return false;
  const v = vertrag as { quelle?: unknown; name?: unknown };
  return v.quelle === "private-brain" && typeof v.name === "string" && istBegleitdatei(v.name);
}

/** Ein Eingang darf nur ergänzt werden, solange er noch nicht geprüft, abgelegt oder verworfen ist. */
export function eingangPruefbar(item: { status?: string; savedDocumentId?: string | null; dasselbe?: boolean } | null | undefined): boolean {
  return !!item && !!item.status && item.status !== "Übernommen" && item.status !== "Nicht übernommen" && !item.savedDocumentId && !item.dasselbe;
}

/** Eine aus Private Brain Pro aufgenommene Mail, wie sie die Quittung und der Eingang beschreiben. */
export type BegleitMail = { eingangId: string; name: string; sha256: string; pruefbar: boolean; vorschlag?: UebergabeVorschlag; hinweis?: string };
export type BegleitStand = "wartet" | "zugeordnet" | "zu-spaet" | "unbrauchbar" | "verfallen";
export type BegleitAenderung = { eingangId: string; vorschlag?: UebergabeVorschlag; hinweis?: string };
export type BegleitErgebnis = { stand: BegleitStand; grund: string; aenderungen: BegleitAenderung[] };

/** Zahlen eines Abhol-Laufs: als Vorschlag an einer Mail, gemerkt bis die Mail kommt, ohne Wirkung (unlesbar, zu spät, verfallen). */
export type BegleitZahlen = { vorschlaege: number; wartend: number; ohneWirkung: number };
/** Ruhiger Zusatz zur Abhol-Meldung; leer, wenn es nichts zu sagen gibt. */
export function begleitSatz(z: BegleitZahlen): string {
  return [
    z.vorschlaege ? `${z.vorschlaege === 1 ? "Eine Mail hat" : `${z.vorschlaege} Mails haben`} einen Vorschlag zur Einordnung aus Private Brain Pro. Er gilt erst nach deiner Prüfung.` : "",
    z.wartend ? `${z.wartend === 1 ? "Eine Vorsortierung wartet" : `${z.wartend} Vorsortierungen warten`} noch auf die Mail dazu.` : "",
    z.ohneWirkung ? `${z.ohneWirkung === 1 ? "Eine Vorsortierung wurde" : `${z.ohneWirkung} Vorsortierungen wurden`} nicht verwendet (nicht lesbar, ohne passende Mail oder Mail schon geprüft). An den Mails ändert das nichts.` : "",
  ].filter(Boolean).join(" ");
}

const gleich = (a: UebergabeVorschlag, b: UebergabeVorschlag) => (["quelle", "name", "lebensbereich", "dokumentart", "vorgang", "hinweis"] as const).every(k => (a[k] || "") === (b[k] || ""));

/** Entscheidet für EINE Begleitdatei, was geschieht. Schreibt nichts; `datei` lädt die Arbeitsdatei eines Eingangs. */
export async function begleitZuordnen(begleit: File, mails: BegleitMail[], datei: (eingangId: string) => Promise<File | null>, alterTage = 0): Promise<BegleitErgebnis> {
  let eintraege: unknown[];
  try { eintraege = (await begleitdateiLesen(begleit)).dateien; }
  catch (e) { return { stand: "unbrauchbar", grund: e instanceof Error && !(e instanceof SyntaxError) ? e.message : "Begleitdatei konnte nicht gelesen werden.", aenderungen: [] }; }
  let wartet = 0, zuSpaet = 0;
  const kandidaten: Array<{ file: File; ziele: BegleitMail[] }> = [], namen = new Set<string>();
  for (const eintrag of eintraege) {
    const e = (eintrag && typeof eintrag === "object" ? eintrag : {}) as { name?: unknown; sha256?: unknown };
    // Ohne Namen und Prüfsumme gibt es über diesen Weg keine Zuordnung – nichts wird geraten.
    if (typeof e.name !== "string" || typeof e.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(e.sha256)) continue;
    const treffer = mails.filter(m => m.name === e.name && m.sha256 === e.sha256);
    if (!treffer.length) { wartet++; continue; }
    const ziele = treffer.filter(m => m.pruefbar);
    if (!ziele.length) { zuSpaet++; continue; }
    if (namen.has(e.name)) continue;
    let file: File | null = null;
    for (const z of ziele) { file = await datei(z.eingangId).catch(() => null); if (file) break; }
    if (!file) { wartet++; continue; }
    namen.add(e.name);
    kandidaten.push({ file: file.name === e.name ? file : new File([file], e.name, { type: file.type }), ziele });
  }
  const aenderungen: BegleitAenderung[] = []; let zugeordnet = 0;
  if (kandidaten.length) {
    // Dieselbe Prüfung wie bei der Dateiauswahl: Name eindeutig, Bytes passen zur Prüfsumme, nur erlaubte Textfelder.
    const { vorschlaege } = await uebergabeVorschlaege([...kandidaten.map(k => k.file), begleit]);
    for (const k of kandidaten) {
      const roh = vorschlaege.get(k.file);
      if (!roh) continue;
      const vorschlag: UebergabeVorschlag = { ...roh, quelle: PRO_BEGLEIT_QUELLE };
      zugeordnet++;
      for (const z of k.ziele) {
        if (z.hinweis === MEHRERE_VORSCHLAEGE) continue;
        if (!z.vorschlag) aenderungen.push({ eingangId: z.eingangId, vorschlag });
        else if (!gleich(z.vorschlag, vorschlag)) aenderungen.push({ eingangId: z.eingangId, hinweis: MEHRERE_VORSCHLAEGE });
      }
    }
  }
  if (wartet && alterTage < PRO_BEGLEIT_TAGE) return { stand: "wartet", grund: "Die Vorsortierung wartet auf ihre Mail.", aenderungen };
  if (zugeordnet) return { stand: "zugeordnet", grund: "Die Vorsortierung steht als Vorschlag an der Mail.", aenderungen };
  if (wartet) return { stand: "verfallen", grund: `Zu dieser Vorsortierung kam in ${PRO_BEGLEIT_TAGE} Tagen keine passende Mail. Sie wurde nicht verwendet.`, aenderungen };
  if (zuSpaet) return { stand: "zu-spaet", grund: "Die Mail war schon geprüft oder abgelegt. Die Vorsortierung wurde nicht mehr verwendet.", aenderungen };
  return { stand: "unbrauchbar", grund: "Die Vorsortierung nennt keine Mail mit Prüfsumme und Vorschlag. Sie wurde nicht verwendet.", aenderungen };
}
