// Stufe F: gestelltes Netz (FamilienakteNetz). Der Gastgeber-Dienst läuft im Prüfprogramm (Node) und bedient Anfragen gegen den
// Ordner-Stub der Gastgeber-Seite; der Gast ruft über dieselbe Brücke. Kein echtes Netz, aber dieselben Aktionen und Fehlercodes.
export const netzStub = `
  window.Capacitor.Plugins.FamilienakteNetz = {
    start: (a) => window.__netz('start', a), stop: () => window.__netz('stop', {}), zustand: () => window.__netz('zustand', {}),
    suchen: (a) => window.__netz('suchen', a), anfrage: (a) => window.__netz('anfrage', a),
  };
  // Dienst-Seite: Dateizugriff über den Ordner-Stub (alle Kennungen teilen denselben Speicher 'R|').
  window.__ordnerHttp = async ({ methode, weg, pfad, offset, laenge, data }) => {
    const S = window.__ordner, k = 'R|' + pfad, b64 = (u) => { let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };
    const unb64 = (t) => { const s = atob(t), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
    const json = (o) => ({ status: 200, art: 'application/json', data: btoa(unescape(encodeURIComponent(JSON.stringify(o)))) });
    const istOrdner = (p) => p === '' || S.ordner.has('R|' + p);
    if (weg === '/kopf') return json({ kennung: window.__netzKennung || '', name: 'Stub' });
    if (methode === 'GET' && weg === '/liste') { if (!istOrdner(pfad)) return { status: 404, art: 'application/json', data: btoa('{}') }; const vor = pfad ? pfad + '/' : ''; const out = []; for (const o of S.ordner) { const p = o.slice(2); if (p.startsWith(vor) && p !== pfad && !p.slice(vor.length).includes('/') && p.slice(vor.length)) out.push({ name: p.slice(vor.length), art: 'ordner', groesse: 0 }); } for (const [d, u] of S.dateien) { const p = d.slice(2); if (p.startsWith(vor) && !p.slice(vor.length).includes('/')) out.push({ name: p.slice(vor.length), art: 'datei', groesse: u.length }); } return json({ eintraege: out }); }
    if (methode === 'GET' && weg === '/info') { if (istOrdner(pfad) && pfad) return json({ art: 'ordner', groesse: 0 }); const u = S.dateien.get(k); if (!u) return { status: 404, art: 'application/json', data: btoa('{}') }; return json({ art: 'datei', groesse: u.length }); }
    if (methode === 'GET' && weg === '/datei') { const u = S.dateien.get(k); if (!u) return { status: 404, art: 'application/json', data: btoa('{}') }; const o = Number(offset || 0), l = Number(laenge || u.length); return { status: 200, art: 'application/octet-stream', data: b64(u.subarray(o, o + l)) }; }
    if (methode === 'POST' && weg === '/ordner') { let p = ''; for (const teil of pfad.split('/')) { p = p ? p + '/' + teil : teil; S.ordner.add('R|' + p); } return json({ ok: true }); }
    if (methode === 'PUT' && weg === '/datei') { const u = data ? unb64(data) : new Uint8Array(0); S.dateien.set(k, u); S.selbst.add(k); return json({ size: u.length, sha256: '' }); }
    if (methode === 'DELETE' && weg === '/datei') { if (!S.selbst.has(k)) return { status: 403, art: 'application/json', data: btoa('{}') }; S.dateien.delete(k); return json({ ok: true }); }
    return { status: 404, art: 'application/json', data: btoa('{}') };
  };
`;

/** Node-Seite: ein Gastgeber (die Seite, die start ruft), Anfragen aller Seiten laufen gegen seinen Ordner-Stub. */
export function netzBruecke() {
  const zustand = { host: null };
  return {
    zustand,
    handler: (page) => async (op, a) => {
      if (op === 'start') { zustand.host = { page, token: a.token, kennung: a.kennung, name: a.name, port: a.port || 48200, adresse: '192.168.0.10' }; await page.evaluate((k) => { window.__netzKennung = k; }, a.kennung); return { laeuft: true, port: zustand.host.port, adressen: ['192.168.0.10'], kennung: a.kennung, name: a.name }; }
      if (op === 'stop') { zustand.host = null; return { laeuft: false, port: 0, adressen: [], kennung: '', name: '' }; }
      if (op === 'zustand') return zustand.host ? { laeuft: true, port: zustand.host.port, adressen: ['192.168.0.10'], kennung: zustand.host.kennung, name: zustand.host.name } : { laeuft: false, port: 0, adressen: [], kennung: '', name: '' };
      if (op === 'suchen') return { treffer: zustand.host && !zustand.host.page.isClosed() ? [{ kennung: zustand.host.kennung, name: zustand.host.name, port: zustand.host.port, adresse: zustand.host.adresse }] : [] };
      if (op === 'anfrage') {
        const h = zustand.host;
        if (!h || h.page.isClosed() || a.adresse !== h.adresse || Number(a.port) !== h.port) throw new Error('FA_NETZ_ADRESSE');
        if (a.token !== h.token) return { status: 401, art: 'application/json', data: Buffer.from('{"fehler":"FA_NETZ_TOKEN"}').toString('base64') };
        const u = new URL('http://x' + a.weg); const q = u.searchParams;
        return h.page.evaluate((x) => window.__ordnerHttp(x), { methode: a.methode, weg: u.pathname, pfad: q.get('pfad') || '', offset: q.get('offset'), laenge: q.get('laenge'), data: a.data || null });
      }
      throw new Error('FA_NETZ_UNBEKANNT');
    },
  };
}
