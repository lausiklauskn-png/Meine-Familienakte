// Gestelltes natives Ordner-Plugin (FamilyFolders) wie in der Android- bzw. Windows-App: frei gewählter Ordner im Speicher,
// dieselben Aktionen und Fehlercodes wie FamilienakteOrdnerPlugin.java / FamilyFolders.java. Nach capacitorStub einhängen.
export const ordnerStub = (plattform = "android") => `(() => {
  const S = window.__ordner = { dateien: new Map(), ordner: new Set(), n: 0, gewaehlt: [], naechsterName: 'SD-Karte', abbrechen: false, selbst: new Set(), angesteckt: true, gemerkt: new Set() };
  const offen = new Map();
  const fehler = (code) => Object.assign(new Error(code), { code });
  // Wie am Gerät: jede Wahl zeigt auf denselben Speicher (SD-Karte); nur die Kennung ist neu.
  // 2.28.65: der App-Ordner „sicherungen“ (Sicherungen auf dem Gerät) ist ein eigener Speicher „G“.
  const k = (t, p) => (t === 'INTERN-sicherungen' ? 'G|' : 'R|') + p;
  const eltern = (p) => p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
  const pruefe = (p) => { if (p && p.split('/').some((x) => !x || x === '.' || x === '..' || /[\\\\:]/.test(x))) throw fehler('FA_PFAD_UNGUELTIG'); };
  const b64 = (u) => { let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };
  const unb64 = (t) => { const s = atob(t), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const hex = async (u) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', u))].map((x) => x.toString(16).padStart(2, '0')).join('');
  const P = {
    async ordnerWaehlen({ titel }) { S.gewaehlt.push(titel); if (S.abbrechen) return { cancelled: true }; const t = S.festerToken || 'T' + (++S.n); S.ordner.add(k(t, '')); S.letzter = t; return { token: t, name: S.naechsterName }; },
    async ordnerListe({ token, pfad }) {
      pruefe(pfad); if (!S.ordner.has(k(token, pfad))) throw fehler(S.ordner.has(k(token, '')) ? 'FA_NICHT_GEFUNDEN' : 'FA_ORDNER_NICHT_ERREICHBAR');
      const vor = k(token, pfad ? pfad + '/' : ''), out = [];
      for (const o of S.ordner) if (o.startsWith(vor) && o !== k(token, pfad) && !o.slice(vor.length).includes('/')) out.push({ name: o.slice(vor.length), art: 'ordner', groesse: 0 });
      for (const [d, u] of S.dateien) if (d.startsWith(vor) && !d.slice(vor.length).includes('/')) out.push({ name: d.slice(vor.length), art: 'datei', groesse: u.length });
      return { eintraege: out.sort((a, b) => a.name.localeCompare(b.name)) };
    },
    async ordnerAnlegen({ token, pfad }) { pruefe(pfad); if (S.dateien.has(k(token, pfad))) throw fehler('FA_ART_FALSCH'); let p = ''; for (const teil of pfad.split('/')) { p = p ? p + '/' + teil : teil; S.ordner.add(k(token, p)); } return { ok: true }; },
    async dateiInfo({ token, pfad }) { pruefe(pfad); if (S.ordner.has(k(token, pfad))) return { art: 'ordner', groesse: 0 }; const u = S.dateien.get(k(token, pfad)); if (!u) throw fehler('FA_NICHT_GEFUNDEN'); return { art: 'datei', groesse: u.length }; },
    async dateiLesen({ token, pfad, offset, laenge }) { const u = S.dateien.get(k(token, pfad)); if (!u) throw fehler('FA_NICHT_GEFUNDEN'); if (S.unlesbar && S.unlesbar.has(pfad)) throw fehler('FA_ORDNER_NICHT_ERREICHBAR'); return { data: b64(u.subarray(offset, offset + Math.min(laenge, 1048576))) }; },
    async eigeneDateiEntfernen({ token, pfad }) { const key = k(token, pfad); if (!S.selbst.has(key) || !S.dateien.has(key)) throw fehler('FA_NICHT_ERLAUBT'); S.dateien.delete(key); S.selbst.delete(key); return { ok: true }; },
    async dateiBeginn({ token, pfad }) { pruefe(pfad); if (!S.ordner.has(k(token, eltern(pfad)))) throw fehler('FA_ORDNER_UNGUELTIG'); const id = 'S' + Math.random().toString(36).slice(2); offen.set(id, { key: k(token, pfad), teile: [], size: 0 }); return { id }; },
    async dateiAnhaengen({ id, offset, data }) { const s = offen.get(id); if (!s || offset !== s.size) throw fehler('FA_STUECK_UNGUELTIG'); const u = unb64(data); if (u.length > 1048576) throw fehler('FA_STUECK_UNGUELTIG'); s.teile.push(u); s.size += u.length; return { size: s.size }; },
    async dateiFertig({ id, size }) { const s = offen.get(id); if (!s || size !== s.size) throw fehler('FA_STUECK_UNGUELTIG'); if (S.fertigScheitert && s.key.startsWith(S.fertigScheitert)) { offen.delete(id); throw Object.assign(new Error('Größe 0 statt ' + s.size + ' Bytes'), { code: 'FA_AUSGABE_PRUEFSUMME' }); } const u = new Uint8Array(s.size); let o = 0; for (const t of s.teile) { u.set(t, o); o += t.length; } S.dateien.set(s.key, u); S.selbst.add(s.key); offen.delete(id); return { size: s.size, sha256: await hex(u) }; },
    // 2.28.65: wie FamilienakteOrdnerPlugin.sicherungEntfernen – nur eigener Sicherungsordner mit Kennungsdatei und passender Kennung.
    async sicherungEntfernen({ token, pfad, kennung }) {
      if (!/^Familienakte_Vollsicherung_[0-9TZ-]{10,40}(_verschluesselt)?(_[0-9]{1,3})?$/.test(pfad) || !/^[A-Za-z0-9-]{8,80}$/.test(kennung) || !S.ordner.has(k(token, pfad))) throw fehler('FA_NICHT_ERLAUBT');
      const m = S.dateien.get(k(token, pfad + '/Zweiter_Ort.json')); const t = m ? new TextDecoder().decode(m) : '';
      if (!t.includes('"familienakte-zweiter-ort"') || !t.includes('"' + kennung + '"')) throw fehler('FA_NICHT_ERLAUBT');
      const vor = k(token, pfad); let n = 0;
      for (const d of [...S.dateien.keys()]) if (d === vor || d.startsWith(vor + '/')) { S.dateien.delete(d); n++; }
      for (const o of [...S.ordner]) if (o === vor || o.startsWith(vor + '/')) { S.ordner.delete(o); n++; }
      S.entfernt = (S.entfernt || 0) + 1; return { ok: true, entfernt: n };
    },
    async dateiVerwerfen({ id }) { offen.delete(id); return { ok: true }; },
    // Stufe C: Ort merken/öffnen und Laufwerke absuchen; S.angesteckt = false stellt eine abgezogene Festplatte dar.
    async ordnerIntern({ name }) { const t = 'INTERN-' + name; S.ordner.add(k(t, '')); return { token: t, name, pfad: '/data/' + name }; },
    async ordnerMerken({ token }) { if (!S.ordner.has(k(token, ''))) throw fehler('FA_ORDNER_NICHT_ERREICHBAR'); S.gemerkt.add('ORT:' + S.naechsterName); return { ort: 'ORT:' + S.naechsterName }; },
    async ordnerOeffnen({ ort }) { if (!S.angesteckt || !String(ort).startsWith('ORT:')) return { erreichbar: false, grund: 'FA_ORDNER_NICHT_ERREICHBAR' }; const t = S.festerToken || 'T' + (++S.n); S.ordner.add(k(t, '')); return { erreichbar: true, token: t, name: ort.slice(4) }; },
    async laufwerkeSuchen({ datei }) { const u = S.angesteckt ? S.dateien.get(k('R', datei)) : null; return { treffer: u ? [{ ort: 'ORT:' + S.naechsterName, name: S.naechsterName, inhalt: new TextDecoder().decode(u) }] : [] }; },
  };
  if (${JSON.stringify(plattform)} === 'android') P.programmBeilegen = async ({ token, pfad }) => { const u = new TextEncoder().encode('erfundene APK'); const name = 'Familienakte-Pro-2.28.34.apk'; S.dateien.set(k(token, pfad ? pfad + '/' + name : name), u); return { name, groesse: u.length, sha256: await hex(u), fassung: '2.28.34' }; };
  else P.setupAngaben = async () => ({ version: '2.28.34', datei: 'Familienakte-Windows-2.28.34-x64-setup.exe', sha256: 'ab'.repeat(32), groesse: 1000, url: 'https://family-projekt.de/updates/familienakte/Familienakte-Windows-2.28.34-x64-setup.exe' });
  // Für Proben über ein Neuladen hinweg: Inhalt sichern und wieder einsetzen (Kennung bleibt fest).
  window.__ordnerSichern = () => ({ ordner: [...S.ordner], dateien: [...S.dateien].map(([k, u]) => [k, b64(u)]) });
  window.__ordnerEinsetzen = (d, token) => { S.festerToken = token; for (const o of d.ordner) S.ordner.add(o); for (const [k, t] of d.dateien) S.dateien.set(k, unb64(t)); };
  window.Capacitor.getPlatform = () => ${JSON.stringify(plattform)};
  window.Capacitor.Plugins.FamilyFolders = P;
})();`;
