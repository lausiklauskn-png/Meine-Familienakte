/* Familienakte: Mycel/SBKIM (Sitzung B, Stück 2a, Klaus 2026-10-31: „Eigene Seite Netz“, Siegel später nur dort).
   App-eigener Klebstoff um die byte-1:1 kopierten Kanon-Module unter public/sbkim/ (Pins in native/HERKUNFT.json,
   Nachziehen: node tools/sbkim-nachziehen.mjs). Die Module selbst werden NIE hier geändert.

   Regeln:
   - Beim Laden der App passiert nichts: die Module werden erst geladen, wenn jemand die Seite „Netz“ öffnet.
   - Auch dann geht nichts ins Netz. Verbinden, Anmelden, Fragen nur auf Tipp im Kanon-Fenster (Modul 23 UI).
   - Der Internetschalter der App gilt (native-network.js sperrt fetch/WebSocket, solange er aus ist).
   - Eigene Schublade: IndexedDB „sbkim_familienakte“ — getrennt von der Akte selbst (mmi-local-vault).
   - Die Selbstbeschreibung im Netz besteht nur aus öffentlichem Vokabular (die 18 Lebensbereiche), nie aus Inhalten der Akte.
   - Kein schwebender Knopf: der Kanon-Knopf wird ausgeblendet, das Fenster öffnet die Seite „Netz“.
   - Gerätename hängt dieser Klebstoff ins Verbinden-Fenster (netzweite Regel), nie in die Kanon-Datei. */
(() => {
  'use strict';
  if (window.FamilienakteMycel) return;
  const SUFFIX = 'familienakte';
  const NAME = 'Familienakte';
  const GERAET_KEY = 'sbkim_geraetename';
  const STAPEL = [
    ['01_storage.js'], ['02_spore.js'], ['03_embedding.js'], ['04_match.js'], ['05_anastomose.js'],
    ['05b_nostr_relay.js', 'module'], ['23_rendezvous.js'], ['23_rendezvous_ui.js'],
  ];
  // Öffentliches Vokabular (lib/family-categories.ts, statisch gespiegelt: kein Inhalt der Akte geht in den Vektor).
  const LEBENSBEREICHE = [
    'Familie & persönliche Dokumente', 'Finanzen & Konten', 'Versicherungen', 'Steuern & Behörden', 'Haus & Wohnung',
    'Energie & Versorgung', 'Garten & Grundstück', 'Einkäufe, Rechnungen & Garantien', 'Gesundheit & Pflege',
    'Rente, Arbeit & Sozialversicherung', 'Auto & Mobilität', 'Motorrad', 'Technik, Geräte & Reparaturen',
    'Verträge & Abonnements', 'Erbschaft, Vollmachten & Vorsorge', 'Reisen & Freizeit', 'Korrespondenz', 'Archiv',
  ];
  const CFG = {
    nodeName: NAME, domain: 'Familienakte-Privat', endpoint: 'https://family-projekt.de/familienakte/', nodeType: 'endknoten',
    domainDescription: 'Private Familienakte: Unterlagen, Fristen, Vorgänge und Erinnerungen einer Familie, offline und verschlüsselt.',
    domainKeywords: ['Familienakte', 'Unterlagen', 'Fristen', 'Vorgänge', 'Erinnerungen', 'Formulare', 'Offline'],
  };

  let start = null;
  const basis = () => new URL('sbkim/', document.baseURI).href;
  function laden(datei, typ) {
    return new Promise((ok, nein) => {
      const s = document.createElement('script');
      s.src = basis() + datei; if (typ) s.type = typ; s.async = false; s.dataset.familienakteSbkim = datei;
      s.onload = () => ok(); s.onerror = () => nein(new Error(`SBKIM-Baustein fehlt: ${datei}`));
      document.head.appendChild(s);
    });
  }
  function warte(pruef, ms = 3000) {
    return new Promise((ok) => { const bis = Date.now() + ms; (function p() { if (pruef() || Date.now() > bis) ok(pruef()); else setTimeout(p, 50); })(); });
  }
  const geraetename = () => { try { return (localStorage.getItem(GERAET_KEY) || '').trim().slice(0, 40); } catch { return ''; } };
  const anzeigeName = () => { const g = geraetename(); return g ? `${NAME} · ${g}` : NAME; };

  function identitaetErzeugen() {
    const E = window.SbkimEmbedding, S = window.SbkimSpore;
    if (!E || !S) return Promise.reject(new Error('Module 02/03 nicht geladen.'));
    const beschreibung = () => E.embedPassage(`${CFG.domainDescription} ${CFG.domainKeywords.join(', ')}`).then((vec) => ({ vec, source: 'description' }));
    return E.init()
      .then(() => (typeof E.embedContentVector === 'function'
        ? E.embedContentVector(LEBENSBEREICHE).then((r) => (r && r.vector ? { vec: r.vector, source: 'content' } : beschreibung())).catch(beschreibung)
        : beschreibung()))
      .then((r) => S.generateOwnSpore({
        domain: CFG.domain, endpoint: CFG.endpoint, nodeType: CFG.nodeType, nodeName: CFG.nodeName,
        domainDescription: CFG.domainDescription, domainKeywords: CFG.domainKeywords,
        domainVector: Array.from(r.vec), embeddingSource: r.source, embeddingVersion: 1,
      }));
  }

  function geraetenameInsFenster() {
    const einhaengen = () => {
      const panel = document.getElementById('sbkim-rdv-panel');
      if (!panel) return false;
      if (panel.querySelector('[data-sbkim-geraetename]')) return true;
      const zeile = document.createElement('div'); zeile.className = 'fa-mycel-geraet';
      const l = document.createElement('span'); l.textContent = 'Gerätename:';
      const i = document.createElement('input'); i.type = 'text'; i.maxLength = 40; i.value = geraetename();
      i.setAttribute('data-sbkim-geraetename', '1'); i.placeholder = 'z. B. Tablet Küche (frei wählbar)';
      i.title = 'Nur ein Anzeige-Hinweis, kein Vertrauens-Beweis – die Kennung steht daneben.';
      i.addEventListener('input', () => { setzeGeraetename(i.value); });
      zeile.append(l, i); panel.insertBefore(zeile, panel.children[1] || null);
      return true;
    };
    if (einhaengen()) return;
    const mo = new MutationObserver(() => { if (einhaengen()) mo.disconnect(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  function setzeGeraetename(v) {
    const wert = String(v || '').trim().slice(0, 40);
    try { localStorage.setItem(GERAET_KEY, wert); } catch { /* ohne Speicher bleibt es leer */ }
    document.querySelectorAll('[data-sbkim-geraetename]').forEach((f) => { if (f.value.trim() !== wert) f.value = wert; });
    // Nur die Anzeige im Raum; die unterschriebene Spore behält „Familienakte“ (kein Neu-Unterschreiben).
    try { window.SbkimRendezvous?.configure?.({ nodeName: anzeigeName() }); } catch { /* fail-soft */ }
    window.dispatchEvent(new CustomEvent('familienakte:mycel'));
  }

  function starten() {
    if (start) return start;
    start = (async () => {
      window.SBKIM_DB_SUFFIX = SUFFIX;   // vor Modul 01 (Kanon-Regel: eigene Schublade unabhängig von der Init-Reihenfolge)
      for (const [datei, typ] of STAPEL) await laden(datei, typ);
      await warte(() => !!window.SbkimNostrRelay);
      await window.SbkimStorage.init({ dbSuffix: SUFFIX });
      try { await window.SbkimAnastomose?.init?.(); } catch (e) { console.warn('[Familienakte-SBKIM] Anastomose übersprungen:', e); }
      // init() baut KEINE Verbindung auf (Kanon); ensureIdentity absichtlich nicht (keine wortlose Neu-Anlage).
      await window.SbkimRendezvous.init({ nodeName: anzeigeName(), dbSuffix: SUFFIX, createIdentity: identitaetErzeugen });
      await window.SbkimRendezvousUI.init({ nodeName: anzeigeName(), dbSuffix: SUFFIX, corner: 'br', createIdentity: identitaetErzeugen, euOnly: true, lang: 'de' });
      try { window.SbkimRendezvousUI.hide(); } catch { /* fail-soft */ }
      geraetenameInsFenster();
      window.dispatchEvent(new CustomEvent('familienakte:mycel'));
      return true;
    })();
    start.catch(() => { start = null; });
    return start;
  }

  function zustand() {
    const r = window.SbkimRendezvous, m = (r && r._meta) || {};
    const relay = window.SbkimNostrRelay, rm = (relay && relay._meta) || {};
    return {
      geladen: !!(window.SbkimRendezvousUI && r),
      verbunden: Number(rm.liveCount || 0) > 0, relais: Number(rm.liveCount || 0), antwortet: !!m.answering,
      name: anzeigeName(), geraetename: geraetename(),
      fensterOffen: !!(window.SbkimRendezvousUI && window.SbkimRendezvousUI.isOpen && window.SbkimRendezvousUI.isOpen()),
      internet: document.documentElement.dataset.appOffline !== 'true',
    };
  }

  window.FamilienakteMycel = {
    starten,
    async oeffnen() { await starten(); window.SbkimRendezvousUI.show(); geraetenameInsFenster(); window.dispatchEvent(new CustomEvent('familienakte:mycel')); },
    schliessen() { try { window.SbkimRendezvousUI?.hide?.(); } catch { /* fail-soft */ } window.dispatchEvent(new CustomEvent('familienakte:mycel')); },
    zustand, setzeGeraetename, geraetename,
    _meta: { suffix: SUFFIX, module: STAPEL.map(([d]) => d) },
  };
})();
