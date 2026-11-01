// Gestellte Tauri-Brücke (Windows-Hülle) für Browser-Proben: Diktat, Startdateien, Updates vom eigenen Server (Prüfen/Installieren gestellt).
export const tauriStub = `(() => {
  const state = { diktat: [], geoeffnet: [], startdateien: [], updatePruefungen: 0, installiert: [] };
  window.__tauriState = state;
  const listeners = {};
  window.__TAURI__ = {
    core: { invoke: async (cmd, args) => {
      if (cmd === 'fa_diktat') { state.diktat.push(args?.language); return state.nextSpeech ?? { cancelled: false, text: 'Nebenkostenabrechnung für Arenberg-Hof prüfen' }; }
      if (cmd === 'fa_diktat_abbrechen') return null;
      if (cmd === 'fa_plattform') return { plattform: 'windows', fassung: state.fassung || '2.28.1' };
      if (cmd === 'fa_pro_tresor') {
        state.proCalls ||= []; state.proCalls.push(args.anfrage.aktion);
        state.proStand ||= { status: 'getrennt' };
        if (state.proFehler && args.anfrage.aktion !== 'zustand') throw 'FA_TRESOR_ABGEBROCHEN';
        if (args.anfrage.aktion === 'verbinden') state.proStand = { status: 'offen', id: 'erfundener-windows-tresor', ort: 'D:\\\\Pro-Tresor' };
        if (args.anfrage.aktion === 'sperren') state.proStand.status = 'gesperrt';
        if (args.anfrage.aktion === 'entsperren') state.proStand.status = 'offen';
        return { ...state.proStand };
      }
      if (cmd === 'fa_startdateien') { const d = state.startdateien.splice(0); return { dateien: d }; }
      if (cmd === 'fa_adresse_oeffnen') { if (!/^https:\\/\\//.test(args?.url || '')) throw 'INVALID_INPUT'; state.geoeffnet.push(args.url); return null; }
      if (cmd === 'fa_update_pruefen') { state.updatePruefungen++; if (state.updateFehler) throw state.updateFehler; return state.updateAntwort || { neu: '2.28.3', installiert: '2.28.2', groesse: 41943040 }; }
      if (cmd === 'fa_update_installieren') { window.__tauriEmit('familienakte:update-stand', { geladen: 20971520, groesse: 41943040 }); state.installiert.push(Date.now()); return { gestartet: true }; }
      throw 'UNKNOWN ' + cmd;
    } },
    event: { listen: async (name, fn) => { (listeners[name] ||= []).push(fn); return () => {}; } },
  };
  window.__tauriEmit = (name, payload) => (listeners[name] || []).forEach((fn) => fn({ payload }));
})();`;
