/** Stufe B (Plan 08.11.2026, Entscheidung 4a/5): verschlüsselte Vollsicherung.
 *
 *  Technik wie BookLedgerPro (`src/core/crypto.js`) und Private Brain Pro: AES-GCM-256, Schlüssel aus dem Passwort mit
 *  PBKDF2-SHA256 (600 000 Runden), Passwort mindestens 10 Zeichen. Dazu ein **Notfallschlüssel** (32 zufällige Bytes, auf dem
 *  Notfallblatt als 52 Zeichen in Gruppen): Der Datenschlüssel ist einmal mit dem Passwort und einmal mit dem Notfallschlüssel
 *  eingepackt. Beides öffnet dieselbe Sicherung. Kein Schlüssel wird gespeichert; das Notfallblatt gehört zu den Papieren.
 *
 *  Dateien werden in Stücken zu 4 MiB verschlüsselt (jedes Stück eigener Zähler im IV), damit große Originale ohne großen
 *  Arbeitsspeicher geschrieben und gelesen werden können. Reine Rechnung ohne Dateizugriff; Node 22 und Browser. */

export const PBKDF2_RUNDEN = 600000;
export const PASSWORT_MINDESTLAENGE = 10;
export const STUECK = 4 * 1024 * 1024;
export const FORMAT = "familienakte-vollsicherung-verschluesselt";
export const KOPF_DATEI = "Vollsicherung_Verschluesselt.json";

export type Eingepackt = { iv: string; ct: string };
export type SicherungsKopf = {
  format: typeof FORMAT; version: 1; appVersion: string; createdAt: string;
  kdf: { name: "PBKDF2-SHA256"; iterations: number; salt: string };
  schluessel: { passwort: Eingepackt; notfall: Eingepackt };
  pruefung: Eingepackt;
  dateien: number;
  hinweis: string;
};

const enc = new TextEncoder(), dec = new TextDecoder();
export const zufall = (n: number) => crypto.getRandomValues(new Uint8Array(n));
export function b64(bytes: Uint8Array) { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
export function unb64(text: string) { const pad = text.length % 4 ? "=".repeat(4 - (text.length % 4)) : ""; const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/") + pad); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }

export function passwortPruefen(passwort: string): string | null {
  if (passwort.length < PASSWORT_MINDESTLAENGE) return `Das Passwort braucht mindestens ${PASSWORT_MINDESTLAENGE} Zeichen.`;
  if (!/\S/.test(passwort)) return "Das Passwort darf nicht nur aus Leerzeichen bestehen.";
  return null;
}

/** Notfallschlüssel als Text: Crockford-Base32 (ohne I, L, O, U), 52 Zeichen in Gruppen zu 4. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function notfallText(bytes: Uint8Array) {
  let bits = 0, wert = 0, out = "";
  for (const b of bytes) { wert = (wert << 8) | b; bits += 8; while (bits >= 5) { out += ALPHABET[(wert >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += ALPHABET[(wert << (5 - bits)) & 31];
  return out.match(/.{1,4}/g)!.join("-");
}
export function notfallBytes(text: string): Uint8Array {
  const sauber = text.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
  const out: number[] = []; let bits = 0, wert = 0;
  for (const z of sauber) { const v = ALPHABET.indexOf(z); if (v < 0) throw new Error("Der Notfallschlüssel enthält ein unbekanntes Zeichen."); wert = (wert << 5) | v; bits += 5; if (bits >= 8) { out.push((wert >>> (bits - 8)) & 255); bits -= 8; } }
  const bytes = new Uint8Array(out.slice(0, 32));
  if (bytes.length !== 32) throw new Error("Der Notfallschlüssel ist unvollständig (52 Zeichen erwartet).");
  return bytes;
}

async function passwortSchluessel(passwort: string, salt: Uint8Array, runden: number) {
  const basis = await crypto.subtle.importKey("raw", enc.encode(passwort.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt as BufferSource, iterations: runden, hash: "SHA-256" }, basis, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
const rohSchluessel = (bytes: Uint8Array, extrahierbar = false) => crypto.subtle.importKey("raw", bytes as BufferSource, { name: "AES-GCM" }, extrahierbar, ["encrypt", "decrypt"]);
async function einpacken(schluessel: CryptoKey, klar: Uint8Array): Promise<Eingepackt> {
  const iv = zufall(12);
  return { iv: b64(iv), ct: b64(new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, schluessel, klar as BufferSource))) };
}
async function auspacken(schluessel: CryptoKey, p: Eingepackt) {
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(p.iv) as BufferSource }, schluessel, unb64(p.ct) as BufferSource));
}

export type Tresor = { kopf: SicherungsKopf; daten: CryptoKey; notfall: string };

/** Neue Sicherung: Kopf mit eingepacktem Datenschlüssel; der Notfalltext ist nur hier im Arbeitsspeicher und gehört aufs Blatt. */
export async function tresorAnlegen(passwort: string, angaben: { appVersion: string; createdAt: string }): Promise<Tresor> {
  const fehler = passwortPruefen(passwort); if (fehler) throw new Error(fehler);
  const datenBytes = zufall(32), notfallB = zufall(32), salt = zufall(16);
  const pw = await passwortSchluessel(passwort, salt, PBKDF2_RUNDEN);
  const nf = await rohSchluessel(notfallB);
  const daten = await rohSchluessel(datenBytes);
  const kopf: SicherungsKopf = {
    format: FORMAT, version: 1, appVersion: angaben.appVersion, createdAt: angaben.createdAt,
    kdf: { name: "PBKDF2-SHA256", iterations: PBKDF2_RUNDEN, salt: b64(salt) },
    schluessel: { passwort: await einpacken(pw, datenBytes), notfall: await einpacken(nf, datenBytes) },
    pruefung: await einpacken(daten, enc.encode(FORMAT)),
    dateien: 0,
    hinweis: "Verschlüsselte Sicherung der Familienakte. Zum Öffnen braucht es die Familienakte und das Passwort oder den Notfallschlüssel vom Notfallblatt. Ohne beides sind die Daten nicht lesbar.",
  };
  return { kopf, daten, notfall: notfallText(notfallB) };
}

/** Vorhandene Sicherung öffnen, mit Passwort oder Notfallschlüssel. Falsch → Error("PASSWORT_FALSCH"). */
export async function tresorOeffnen(kopf: SicherungsKopf, zugang: { passwort?: string; notfall?: string }): Promise<CryptoKey> {
  if (kopf.format !== FORMAT || kopf.version !== 1) throw new Error("Diese Sicherung hat ein unbekanntes Format.");
  let datenBytes: Uint8Array;
  try {
    if (zugang.notfall) datenBytes = await auspacken(await rohSchluessel(notfallBytes(zugang.notfall)), kopf.schluessel.notfall);
    else if (zugang.passwort) datenBytes = await auspacken(await passwortSchluessel(zugang.passwort, unb64(kopf.kdf.salt), kopf.kdf.iterations), kopf.schluessel.passwort);
    else throw new Error("PASSWORT_FEHLT");
  } catch (e) { if (e instanceof Error && e.message === "PASSWORT_FEHLT") throw e; throw new Error("PASSWORT_FALSCH"); }
  const daten = await rohSchluessel(datenBytes);
  try { if (dec.decode(await auspacken(daten, kopf.pruefung)) !== FORMAT) throw new Error(); } catch { throw new Error("PASSWORT_FALSCH"); }
  return daten;
}

/** IV je Stück: 8 Byte Datei-Nonce + 4 Byte Zähler. */
function stueckIv(nonce: Uint8Array, nr: number) { const iv = new Uint8Array(12); iv.set(nonce); new DataView(iv.buffer).setUint32(8, nr); return iv; }

/** Verschlüsselt eine Datei in Stücken. Aufbau: [8 Byte Nonce] dann je Stück [4 Byte Länge][Geheimtext mit Tag]. */
export async function dateiVerschluesseln(daten: CryptoKey, quelle: Blob, schreib: (teil: Uint8Array) => Promise<void>, fortschritt?: (bytes: number) => void) {
  const nonce = zufall(8); await schreib(nonce);
  let nr = 0;
  for (let offset = 0; offset < quelle.size || (offset === 0 && quelle.size === 0); offset += STUECK) {
    const klar = new Uint8Array(await quelle.slice(offset, offset + STUECK).arrayBuffer());
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: stueckIv(nonce, nr++) as BufferSource, additionalData: enc.encode(`${nr}`) }, daten, klar as BufferSource));
    const laenge = new Uint8Array(4); new DataView(laenge.buffer).setUint32(0, ct.length);
    await schreib(laenge); await schreib(ct); fortschritt?.(offset + klar.length);
    if (quelle.size === 0) break;
  }
}

/** Entschlüsselt eine mit dateiVerschluesseln geschriebene Datei; liefert die Klartext-Stücke der Reihe nach. */
export async function dateiEntschluesseln(daten: CryptoKey, geheim: Blob, schreib: (teil: Uint8Array) => Promise<void>) {
  if (geheim.size < 8) throw new Error("Die verschlüsselte Datei ist zu kurz.");
  const nonce = new Uint8Array(await geheim.slice(0, 8).arrayBuffer());
  let offset = 8, nr = 0;
  while (offset < geheim.size) {
    if (offset + 4 > geheim.size) throw new Error("Die verschlüsselte Datei ist abgeschnitten.");
    const laenge = new DataView(await geheim.slice(offset, offset + 4).arrayBuffer()).getUint32(0); offset += 4;
    if (laenge > STUECK + 16 || offset + laenge > geheim.size) throw new Error("Die verschlüsselte Datei ist beschädigt.");
    const ct = new Uint8Array(await geheim.slice(offset, offset + laenge).arrayBuffer()); offset += laenge;
    let klar: ArrayBuffer;
    try { klar = await crypto.subtle.decrypt({ name: "AES-GCM", iv: stueckIv(nonce, nr) as BufferSource, additionalData: enc.encode(`${nr + 1}`) }, daten, ct as BufferSource); }
    catch { throw new Error(`Stück ${nr + 1} der verschlüsselten Datei ist beschädigt oder gehört zu einem anderen Schlüssel.`); }
    nr++; await schreib(new Uint8Array(klar));
  }
}

export async function textVerschluesseln(daten: CryptoKey, text: string) { const teile: Uint8Array[] = []; await dateiVerschluesseln(daten, new Blob([enc.encode(text)]), async (t) => { teile.push(t); }); return new Blob(teile as BlobPart[]); }
export async function textEntschluesseln(daten: CryptoKey, geheim: Blob) { const teile: Uint8Array[] = []; await dateiEntschluesseln(daten, geheim, async (t) => { teile.push(t); }); return dec.decode(await new Blob(teile as BlobPart[]).arrayBuffer()); }

/** Dateiname in der Sicherung: fortlaufend, verrät nichts über den Inhalt. */
export const geheimerName = (nr: number) => `${String(nr).padStart(5, "0")}.fav`;

/** Text des Notfallblatts (zum Drucken oder als Datei), ohne Passwort. */
export function notfallblattText(angaben: { notfall: string; createdAt: string; ordner: string; appVersion: string }) {
  const datum = new Date(angaben.createdAt).toLocaleString("de-DE", { dateStyle: "long", timeStyle: "short" });
  return [
    "FAMILIENAKTE – NOTFALLBLATT ZUR VERSCHLÜSSELTEN SICHERUNG",
    "",
    `Sicherung: ${angaben.ordner}`,
    `Erstellt: ${datum} (Fassung ${angaben.appVersion})`,
    "",
    "Notfallschlüssel (öffnet diese Sicherung auch ohne Passwort):",
    "",
    `    ${angaben.notfall}`,
    "",
    "So geht es im Notfall: Familienakte installieren (Android, Windows oder am PC im Browser), Sicherheit › „Sicherung einlesen“,",
    "den Sicherungsordner wählen, bei „Passwort vergessen?“ den Notfallschlüssel eintippen. 0 und O, 1, I und L werden gleich gelesen.",
    "",
    "Dieses Blatt bitte ausdrucken und zu den wichtigen Papieren legen – nicht zur Sicherung auf dieselbe Festplatte.",
    "Wer dieses Blatt oder das Passwort hat, kann die Sicherung lesen. Ohne beides sind die Daten endgültig unlesbar.",
  ].join("\n");
}
