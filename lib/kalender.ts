// Kalender-Kern (Klaus 2026-11-05): Fristen und Aufgaben mit eingeschalteter Erinnerung in einen Kalender eigener Wahl.
// Rein und ohne Netz: aus einem Datensatz wird ein Kalendereintrag (stabile Kennung, Erinnerungen in Minuten), daraus eine
// .ics-Datei oder die Nutzlast für Google, Microsoft oder den Android-Gerätekalender. Die Zuordnung (welcher Eintrag in
// welchem Kalender) steht am Datensatz im Register und reist mit der Vollsicherung. Hinaus gehen Titel, Zeit und Erinnerung;
// Notizen nie. Gesundheitsfristen gehen mit ihrem echten Titel (Klaus 2026-11-05: „ich muss ja irgendwo eintragen“);
// ein neutraler Titel („Frist“) bleibt als ausdrückliche Wahl (opt.geschuetzt) möglich, wird aber nicht mehr selbst gesetzt.
import type { FamilyRecordUnion, FamilyRelation } from "./family-data-model";
import { isSensitiveHealthText } from "./family-privacy.ts";

export const KALENDER_VERSION = 1 as const;

export type KalenderAnbieter = "geraet" | "google" | "microsoft" | "ics";
export const kalenderAnbieterNamen: Record<KalenderAnbieter, string> = {
  geraet: "Kalender auf diesem Gerät",
  google: "Google Kalender",
  microsoft: "Microsoft Outlook",
  ics: "Kalenderdatei (.ics)",
};

/** Erinnerungs-Chips wie in der Vorschau. */
/**
 * Erinnerung (Klaus 2026-11-05: „die Erinnerung ist das Wichtige“): beliebig viele Tage vorher, 1 bis 28 (Googles Grenze),
 * je um die Uhrzeit des Termins (ohne Uhrzeit 9 Uhr), dazu „am Tag, 9 Uhr“. Mehrere zugleich möglich, wie im Kalender üblich.
 * Gespeichert als „<n>d“ bzw. „tag9“; ältere Einträge („7d“, „1d“) bleiben damit gültig.
 */
export type ErinnerungsWahl = "tag9" | `${number}d`;
export const MAX_TAGE_VORHER = 28;
/** Schnellwahl als Chips; jede andere Zahl über „weitere Tage vorher“. */
export const ALLE_ERINNERUNGEN: ErinnerungsWahl[] = ["7d", "2d", "1d", "tag9"];
export const ERINNERUNG_VORGABE: ErinnerungsWahl[] = ["7d", "1d"];
export function erinnerungsTage(w: string): number | null {
  const m = /^([1-9]\d?)d$/.exec(w);
  const n = m ? Number(m[1]) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= MAX_TAGE_VORHER ? n : null;
}
export function istErinnerung(w: unknown): w is ErinnerungsWahl { return w === "tag9" || (typeof w === "string" && erinnerungsTage(w) !== null); }
export function erinnerungsName(w: ErinnerungsWahl) {
  if (w === "tag9") return "am Tag, 9 Uhr";
  const n = erinnerungsTage(w) || 0;
  return n === 7 ? "1 Woche vorher" : n === 14 ? "2 Wochen vorher" : n === 1 ? "1 Tag vorher" : `${n} Tage vorher`;
}
/** Sortiert: früheste zuerst, „am Tag“ zuletzt; doppelte und ungültige fallen weg. */
export function erinnerungenOrdnen(liste: unknown[]): ErinnerungsWahl[] {
  return [...new Set(liste.filter(istErinnerung))].sort((a, b) => (erinnerungsTage(b) ?? 0) - (erinnerungsTage(a) ?? 0));
}

/** Ohne Uhrzeit steht eine Frist um 9 Uhr im Kalender, 30 Minuten lang. So gilt jede Erinnerung überall gleich (Google und
 * der Gerätekalender kennen bei ganztägigen Terminen keine Erinnerung „am Tag um 9 Uhr“). */
export const STANDARD_UHRZEIT = "09:00";
export const DAUER_MINUTEN = 30;
/** Google erlaubt höchstens 28 Tage und fünf Erinnerungen. */
export const MAX_ERINNERUNG_MINUTEN = 40320;
export const MAX_ERINNERUNGEN = 5;

export type KalenderZuordnung = {
  anbieter: KalenderAnbieter;
  /** Kalender beim Anbieter (Google-Kalender-ID, Graph-Kalender-ID, Android-Kalender-_ID; bei .ics „datei“). */
  kalenderId: string;
  /** Eintrag beim Anbieter (bei .ics die UID). */
  eintragId: string;
  /** Fingerabdruck des zuletzt geschriebenen Inhalts; ändert er sich, wird der Eintrag aktualisiert. */
  stand: string;
  am: string;
};

export type KalenderFelder = {
  dueTime?: string;
  erinnerungen?: ErinnerungsWahl[];
  /** true = in den Kalender eintragen (Haken im Formular oder „Vorhandene übernehmen“); fehlt = nie still eintragen. */
  kalenderEintragen?: boolean;
  kalender?: KalenderZuordnung[];
};

export type KalenderEintrag = {
  recordId: string;
  uid: string;
  titel: string;
  beschreibung: string;
  /** Beginn und Ende als UTC-Zeitpunkt (ISO). */
  beginn: string;
  ende: string;
  /** Minuten vor Beginn, absteigend (früheste zuerst). */
  erinnerungen: number[];
  geschuetzt: boolean;
  sequenz: number;
  stand: string;
};

type Termin = Extract<FamilyRecordUnion, { recordType: "deadline" | "task" }>;
export function istTermin(record: FamilyRecordUnion): record is Termin { return record.recordType === "deadline" || record.recordType === "task"; }
export function kalenderFelder(record: FamilyRecordUnion): KalenderFelder { return istTermin(record) ? (record.data as KalenderFelder) : {}; }

/** FNV-1a, 32 Bit, hex – genügt für Fingerabdruck und Kennung (kein Geheimnis). */
export function kurzHash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

/** Stabile Kennung je Frist: dieselbe Frist ergibt immer dieselbe UID, eine neu angelegte Akte mit gleicher Nummer nicht. */
export function kalenderUid(record: Pick<FamilyRecordUnion, "id" | "createdAt">) {
  return `fa-${record.id.toLowerCase()}-${kurzHash(record.createdAt)}@familienakte`;
}

export function gueltigeUhrzeit(wert: string | undefined | null) {
  return typeof wert === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(wert) ? wert : null;
}

/** Ortszeit des Geräts → UTC-Zeitpunkt. */
function ortszeit(datum: string, uhrzeit: string) {
  const [j, m, t] = datum.slice(0, 10).split("-").map(Number);
  const [h, min] = uhrzeit.split(":").map(Number);
  return new Date(j, m - 1, t, h, min, 0, 0);
}

export function erinnerungsMinuten(wahl: ErinnerungsWahl[], uhrzeit: string, zusaetzlich: number[] = []) {
  const [h, m] = uhrzeit.split(":").map(Number);
  const ab9 = h * 60 + m - 9 * 60;
  const roh = wahl.map((w) => (w === "tag9" ? Math.max(0, ab9) : (erinnerungsTage(w) ?? NaN) * 1440)).concat(zusaetzlich);
  return [...new Set(roh.filter((x) => Number.isFinite(x) && x >= 0).map((x) => Math.min(Math.round(x), MAX_ERINNERUNG_MINUTEN)))]
    .sort((a, b) => a - b).slice(0, MAX_ERINNERUNGEN).sort((a, b) => b - a); // bei mehr als 5: die nächsten am Termin bleiben
}

/** Erkennt Gesundheitsbezug (Titel, Quelle, verknüpfte Bereiche). Nur noch Auskunft; der Kalender neutralisiert nicht mehr selbst. */
export function terminGeschuetzt(record: FamilyRecordUnion, verknuepfteBereiche: Array<string | null | undefined> = []) {
  const titel = istTermin(record) ? record.data.title : "";
  return isSensitiveHealthText(titel, record.notes, record.source, ...verknuepfteBereiche);
}

export type EintragOptionen = {
  vorgabe?: ErinnerungsWahl[];
  geschuetzt?: boolean;
  relations?: FamilyRelation[];
  records?: FamilyRecordUnion[];
};

/** Zusätzliche Erinnerung aus einer verknüpften „Erinnerung“ (Erinnerungsdatum im Formular): an diesem Tag um 9 Uhr. */
function verknuepfteErinnerungen(record: Termin, beginn: Date, records: FamilyRecordUnion[] = [], relations: FamilyRelation[] = []) {
  const ids = new Set(relations.filter((r) => r.toId === record.id && r.fromType === "reminder" && r.relationType === "erinnert an").map((r) => r.fromId));
  return records.filter((r) => r.recordType === "reminder" && ids.has(r.id) && r.status !== "erledigt" && r.data.remindAt)
    .map((r) => (beginn.getTime() - ortszeit(String((r.data as { remindAt?: string }).remindAt), STANDARD_UHRZEIT).getTime()) / 60000)
    .filter((min) => min > 0);
}

export function kalenderEintrag(record: FamilyRecordUnion, opt: EintragOptionen = {}): KalenderEintrag | null {
  if (!istTermin(record) || !record.data.dueAt || !/^\d{4}-\d{2}-\d{2}/.test(record.data.dueAt)) return null;
  const felder = record.data as KalenderFelder;
  const uhrzeit = gueltigeUhrzeit(felder.dueTime) || STANDARD_UHRZEIT;
  const beginn = ortszeit(record.data.dueAt, uhrzeit);
  if (Number.isNaN(beginn.getTime())) return null;
  const ende = new Date(beginn.getTime() + DAUER_MINUTEN * 60000);
  const geschuetzt = opt.geschuetzt === true;
  const art = record.recordType === "deadline" ? "Frist" : "Aufgabe";
  const titel = geschuetzt ? art : (record.data.title || art).trim().slice(0, 200);
  const beschreibung = geschuetzt ? "Aus der Familienakte. Einzelheiten nur in der App." : `Aus der Familienakte (${record.id}).`;
  const wahl = Array.isArray(felder.erinnerungen) ? erinnerungenOrdnen(felder.erinnerungen) : (opt.vorgabe || ERINNERUNG_VORGABE);
  const erinnerungen = erinnerungsMinuten(wahl, uhrzeit, verknuepfteErinnerungen(record, beginn, opt.records, opt.relations));
  const inhalt = { titel, beschreibung, beginn: beginn.toISOString(), ende: ende.toISOString(), erinnerungen };
  const updated = Date.parse(record.updatedAt);
  return { recordId: record.id, uid: kalenderUid(record), ...inhalt, geschuetzt, sequenz: Number.isFinite(updated) ? Math.floor(updated / 1000) % 2147483647 : 0, stand: kurzHash(JSON.stringify(inhalt)) };
}

export function soll(record: FamilyRecordUnion) {
  return istTermin(record) && kalenderFelder(record).kalenderEintragen === true && !["erledigt", "zurückgestellt", "archiviert"].includes(record.status) && Boolean(record.data.dueAt);
}

export type AbgleichSchritt =
  | { art: "anlegen"; recordId: string; eintrag: KalenderEintrag }
  | { art: "aendern"; recordId: string; eintrag: KalenderEintrag; zuordnung: KalenderZuordnung }
  | { art: "entfernen"; recordId: string; zuordnung: KalenderZuordnung }
  | { art: "gleich"; recordId: string };

/**
 * Was für einen Zielkalender zu tun ist: offene, angehakte Fristen anlegen oder aktualisieren; erledigte, zurückgestellte
 * oder abgehakte entfernen. Einträge in anderen (früher gewählten) Kalendern bleiben unberührt.
 */
export function abgleichPlan(records: FamilyRecordUnion[], ziel: { anbieter: KalenderAnbieter; kalenderId: string }, opt: Omit<EintragOptionen, "geschuetzt" | "records"> & { geschuetzt?: (record: FamilyRecordUnion) => boolean } = {}): AbgleichSchritt[] {
  const plan: AbgleichSchritt[] = [];
  for (const record of records) {
    if (!istTermin(record)) continue;
    const zuordnung = (kalenderFelder(record).kalender || []).find((z) => z.anbieter === ziel.anbieter && z.kalenderId === ziel.kalenderId);
    const eintrag = soll(record) ? kalenderEintrag(record, { vorgabe: opt.vorgabe, relations: opt.relations, records, geschuetzt: opt.geschuetzt?.(record) }) : null;
    if (eintrag && !zuordnung) plan.push({ art: "anlegen", recordId: record.id, eintrag });
    else if (eintrag && zuordnung && zuordnung.stand !== eintrag.stand) plan.push({ art: "aendern", recordId: record.id, eintrag, zuordnung });
    else if (!eintrag && zuordnung) plan.push({ art: "entfernen", recordId: record.id, zuordnung });
    else if (eintrag) plan.push({ art: "gleich", recordId: record.id });
  }
  return plan;
}

/** Neue Zuordnungsliste eines Datensatzes nach einem Schritt (ersetzt die für denselben Kalender). */
export function zuordnungSetzen(liste: KalenderZuordnung[] | undefined, neu: KalenderZuordnung | null, ziel: { anbieter: KalenderAnbieter; kalenderId: string }) {
  const rest = (liste || []).filter((z) => !(z.anbieter === ziel.anbieter && z.kalenderId === ziel.kalenderId));
  return neu ? [...rest, neu] : rest;
}

// ---------- .ics (RFC 5545) ----------

function icsText(wert: string) { return wert.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1"); }
function icsZeit(iso: string) { return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
/** Zeilen über 75 Oktette falten (Fortsetzung mit Leerzeichen), ohne UTF-8-Zeichen zu teilen. */
export function icsFalten(zeile: string) {
  const enc = new TextEncoder();
  if (enc.encode(zeile).length <= 75) return zeile;
  const teile: string[] = []; let aktuell = ""; let laenge = 0; const grenze = () => (teile.length ? 74 : 75);
  for (const zeichen of zeile) {
    const n = enc.encode(zeichen).length;
    if (laenge + n > grenze()) { teile.push(aktuell); aktuell = ""; laenge = 0; }
    aktuell += zeichen; laenge += n;
  }
  teile.push(aktuell);
  return teile.join("\r\n ");
}

export function icsDatei(eintraege: KalenderEintrag[], opt: { jetzt?: Date; abgesagt?: Array<{ uid: string; sequenz: number }> } = {}) {
  const stempel = icsZeit((opt.jetzt || new Date()).toISOString());
  const z: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Familienakte//Kalender 1//DE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Familienakte"];
  for (const e of eintraege) {
    z.push("BEGIN:VEVENT", `UID:${e.uid}`, `DTSTAMP:${stempel}`, `SEQUENCE:${e.sequenz}`, `DTSTART:${icsZeit(e.beginn)}`, `DTEND:${icsZeit(e.ende)}`,
      `SUMMARY:${icsText(e.titel)}`, `DESCRIPTION:${icsText(e.beschreibung)}`, "CLASS:PRIVATE", "TRANSP:TRANSPARENT");
    for (const min of e.erinnerungen) z.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsText(e.titel)}`, `TRIGGER:-PT${min}M`, "END:VALARM");
    z.push("END:VEVENT");
  }
  for (const a of opt.abgesagt || []) z.push("BEGIN:VEVENT", `UID:${a.uid}`, `DTSTAMP:${stempel}`, `SEQUENCE:${a.sequenz}`, "STATUS:CANCELLED", "SUMMARY:Erledigt", "END:VEVENT");
  z.push("END:VCALENDAR");
  return z.map(icsFalten).join("\r\n") + "\r\n";
}

// ---------- Nutzlast je Anbieter ----------

export function googleEreignis(e: KalenderEintrag) {
  return {
    summary: e.titel, description: e.beschreibung, visibility: "private", transparency: "transparent",
    start: { dateTime: e.beginn }, end: { dateTime: e.ende },
    reminders: { useDefault: false, overrides: e.erinnerungen.map((minutes) => ({ method: "popup", minutes })) },
    extendedProperties: { private: { familienakte: e.uid } },
  };
}

/** Microsoft Graph kennt eine Erinnerung je Termin: die früheste gewählte. */
export function graphEreignis(e: KalenderEintrag) {
  const utc = (iso: string) => iso.replace(/Z$/, "").replace(/\.\d{3}$/, "");
  return {
    subject: e.titel, body: { contentType: "text", content: e.beschreibung }, sensitivity: "private", showAs: "free",
    start: { dateTime: utc(e.beginn), timeZone: "UTC" }, end: { dateTime: utc(e.ende), timeZone: "UTC" },
    isReminderOn: e.erinnerungen.length > 0, reminderMinutesBeforeStart: e.erinnerungen[0] ?? 0,
    transactionId: e.uid.replace(/[^a-z0-9-]/gi, "-").slice(0, 100),
  };
}

export function geraetEreignis(e: KalenderEintrag, zeitzone: string) {
  return { titel: e.titel, beschreibung: e.beschreibung, beginn: Date.parse(e.beginn), ende: Date.parse(e.ende), zeitzone, erinnerungen: e.erinnerungen, uid: e.uid };
}
