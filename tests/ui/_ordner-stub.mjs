// Gestelltes natives Ordner-Plugin (FamilyFolders) wie in der Android- bzw. Windows-App: frei gewählter Ordner im Speicher,
// dieselben Aktionen und Fehlercodes wie FamilienakteOrdnerPlugin.java / FamilyFolders.java. Nach capacitorStub einhängen.
export const ordnerStub = (plattform = "android") => `(() => {
  const S = window.__ordner = { dateien: new Map(), ordner: new Set(), n: 0, gewaehlt: [], naechsterName: 'SD-Karte', abbrechen: false };
  const offen = new Map();
  const fehler = (code) => Object.assign(new Error(code), { code });
  const k = (t, p) => t + '|' + p;
  const eltern = (p) => p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
  const pruefe = (p) => { if (p && p.split('/').some((x) => !x || x === '.' || x === '..' || /[\\\\:]/.test(x))) throw fehler('FA_PFAD_UNGUELTIG'); };
  const b64 = (u) => { let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };
  const unb64 = (t) => { const s = atob(t), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const hex = async (u) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', u))].map((x) => x.toString(16).padStart(2, '0')).join('');
  const P = {
    async ordnerWaehlen({ titel }) { S.gewaehlt.push(titel); if (S.abbrechen) return { cancelled: true }; const t = 'T' + (++S.n); S.ordner.add(k(t, '')); S.letzter = t; return { token: t, name: S.naechsterName }; },
    async ordnerListe({ token, pfad }) {
      pruefe(pfad); if (!S.ordner.has(k(token, pfad))) throw fehler(S.ordner.has(k(token, '')) ? 'FA_NICHT_GEFUNDEN' : 'FA_ORDNER_NICHT_ERREICHBAR');
      const vor = k(token, pfad ? pfad + '/' : ''), out = [];
      for (const o of S.ordner) if (o.startsWith(vor) && o !== k(token, pfad) && !o.slice(vor.length).includes('/')) out.push({ name: o.slice(vor.length), art: 'ordner', groesse: 0 });
      for (const [d, u] of S.dateien) if (d.startsWith(vor) && !d.slice(vor.length).includes('/')) out.push({ name: d.slice(vor.length), art: 'datei', groesse: u.length });
      return { eintraege: out.sort((a, b) => a.name.localeCompare(b.name)) };
    },
    async ordnerAnlegen({ token, pfad }) { pruefe(pfad); if (S.dateien.has(k(token, pfad))) throw fehler('FA_ART_FALSCH'); let p = ''; for (const teil of pfad.split('/')) { p = p ? p + '/' + teil : teil; S.ordner.add(k(token, p)); } return { ok: true }; },
    async dateiInfo({ token, pfad }) { pruefe(pfad); if (S.ordner.has(k(token, pfad))) return { art: 'ordner', groesse: 0 }; const u = S.dateien.get(k(token, pfad)); if (!u) throw fehler('FA_NICHT_GEFUNDEN'); return { art: 'datei', groesse: u.length }; },
    async dateiLesen({ token, pfad, offset, laenge }) { const u = S.dateien.get(k(token, pfad)); if (!u) throw fehler('FA_NICHT_GEFUNDEN'); return { data: b64(u.subarray(offset, offset + Math.min(laenge, 1048576))) }; },
    async dateiLoeschen({ token, pfad, rekursiv }) {
      const key = k(token, pfad);
      if (S.ordner.has(key)) { const inhalt = [...S.ordner, ...S.dateien.keys()].filter((x) => x.startsWith(key + '/')); if (inhalt.length && rekursiv !== 'ja') throw fehler('FA_NICHT_LEER'); for (const x of inhalt) { S.ordner.delete(x); S.dateien.delete(x); } S.ordner.delete(key); return { ok: true }; }
      if (!S.dateien.delete(key)) throw fehler('FA_NICHT_GEFUNDEN'); return { ok: true };
    },
    async dateiBeginn({ token, pfad }) { pruefe(pfad); if (!S.ordner.has(k(token, eltern(pfad)))) throw fehler('FA_ORDNER_UNGUELTIG'); const id = 'S' + Math.random().toString(36).slice(2); offen.set(id, { key: k(token, pfad), teile: [], size: 0 }); return { id }; },
    async dateiAnhaengen({ id, offset, data }) { const s = offen.get(id); if (!s || offset !== s.size) throw fehler('FA_STUECK_UNGUELTIG'); const u = unb64(data); if (u.length > 1048576) throw fehler('FA_STUECK_UNGUELTIG'); s.teile.push(u); s.size += u.length; return { size: s.size }; },
    async dateiFertig({ id, size }) { const s = offen.get(id); if (!s || size !== s.size) throw fehler('FA_STUECK_UNGUELTIG'); const u = new Uint8Array(s.size); let o = 0; for (const t of s.teile) { u.set(t, o); o += t.length; } S.dateien.set(s.key, u); offen.delete(id); return { size: s.size, sha256: await hex(u) }; },
    async dateiVerwerfen({ id }) { offen.delete(id); return { ok: true }; },
  };
  if (${JSON.stringify(plattform)} === 'android') P.programmBeilegen = async ({ token, pfad }) => { const u = new TextEncoder().encode('erfundene APK'); const name = 'Familienakte-Pro-2.28.34.apk'; S.dateien.set(k(token, pfad ? pfad + '/' + name : name), u); return { name, groesse: u.length, sha256: await hex(u), fassung: '2.28.34' }; };
  else P.setupAngaben = async () => ({ version: '2.28.34', datei: 'Familienakte-Windows-2.28.34-x64-setup.exe', sha256: 'ab'.repeat(32), groesse: 1000, url: 'https://family-projekt.de/updates/familienakte/Familienakte-Windows-2.28.34-x64-setup.exe' });
  window.Capacitor.getPlatform = () => ${JSON.stringify(plattform)};
  window.Capacitor.Plugins.FamilyFolders = P;
})();`;
