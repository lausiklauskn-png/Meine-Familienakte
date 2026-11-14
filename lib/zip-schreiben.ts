// Kleine ZIP-Datei ohne Kompression (Verfahren „stored“), für „Als Datei → ZIP“ im Pseudo-Fenster (P7: ZIP nur auf Wahl).
// Ohne fremde Bibliothek, ohne Netz; Dateinamen UTF-8 (Bit 11). Probe in scripts/run-pseudo-auftraege-tests.mjs.
const TABELLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(d: Uint8Array): number { let c = 0xffffffff; for (let i = 0; i < d.length; i++) c = TABELLE[(c ^ d[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

export function zipBauen(dateien: Array<{ name: string; daten: Uint8Array }>, zeit = new Date()): Uint8Array {
  const enc = new TextEncoder();
  const dosZeit = (zeit.getHours() << 11) | (zeit.getMinutes() << 5) | (zeit.getSeconds() >> 1);
  const dosDatum = ((Math.max(1980, zeit.getFullYear()) - 1980) << 9) | ((zeit.getMonth() + 1) << 5) | zeit.getDate();
  const lokal: Uint8Array[] = []; const zentral: Uint8Array[] = []; let ofs = 0;
  for (const f of dateien) {
    const name = enc.encode(f.name); const crc = crc32(f.daten);
    const k = new DataView(new ArrayBuffer(30));
    k.setUint32(0, 0x04034b50, true); k.setUint16(4, 20, true); k.setUint16(6, 0x0800, true); k.setUint16(8, 0, true);
    k.setUint16(10, dosZeit, true); k.setUint16(12, dosDatum, true); k.setUint32(14, crc, true);
    k.setUint32(18, f.daten.length, true); k.setUint32(22, f.daten.length, true); k.setUint16(26, name.length, true);
    lokal.push(new Uint8Array(k.buffer), name, f.daten);
    const z = new DataView(new ArrayBuffer(46));
    z.setUint32(0, 0x02014b50, true); z.setUint16(4, 20, true); z.setUint16(6, 20, true); z.setUint16(8, 0x0800, true);
    z.setUint16(12, dosZeit, true); z.setUint16(14, dosDatum, true); z.setUint32(16, crc, true);
    z.setUint32(20, f.daten.length, true); z.setUint32(24, f.daten.length, true); z.setUint16(28, name.length, true); z.setUint32(42, ofs, true);
    zentral.push(new Uint8Array(z.buffer), name);
    ofs += 30 + name.length + f.daten.length;
  }
  const groesse = zentral.reduce((a, b) => a + b.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, dateien.length, true); e.setUint16(10, dateien.length, true); e.setUint32(12, groesse, true); e.setUint32(16, ofs, true);
  const teile = [...lokal, ...zentral, new Uint8Array(e.buffer)];
  const aus = new Uint8Array(teile.reduce((a, b) => a + b.length, 0)); let p = 0;
  for (const t of teile) { aus.set(t, p); p += t.length; }
  return aus;
}
