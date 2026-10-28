// Gestellte Tauri-Brücke (Windows-Hülle) für Browser-Proben: Diktat, Startdateien, Update-Adresse.
export const tauriStub = `(() => {
  const state = { diktat: [], geoeffnet: [], startdateien: [] };
  window.__tauriState = state;
  const listeners = {};
  window.__TAURI__ = {
    core: { invoke: async (cmd, args) => {
      if (cmd === 'fa_diktat') { state.diktat.push(args?.language); return state.nextSpeech ?? { cancelled: false, text: 'Nebenkostenabrechnung für Arenberg-Hof prüfen' }; }
      if (cmd === 'fa_diktat_abbrechen') return null;
      if (cmd === 'fa_plattform') return { plattform: 'windows', fassung: state.fassung || '2.28.1' };
      if (cmd === 'fa_startdateien') { const d = state.startdateien.splice(0); return { dateien: d }; }
      if (cmd === 'fa_adresse_oeffnen') { if (!/^https:\\/\\//.test(args?.url || '')) throw 'INVALID_INPUT'; state.geoeffnet.push(args.url); return null; }
      throw 'UNKNOWN ' + cmd;
    } },
    event: { listen: async (name, fn) => { (listeners[name] ||= []).push(fn); return () => {}; } },
  };
  window.__tauriEmit = (name, payload) => (listeners[name] || []).forEach((fn) => fn({ payload }));
})();`;
