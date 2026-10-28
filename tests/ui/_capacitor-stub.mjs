// Gestellte Capacitor-Brücke (Android-Hülle) für Browser-Proben: Internetschalter, Sprachfenster, Teilen-Eingang, Updates vom eigenen Server.
export const capacitorStub = `(() => {
  const state = { offline: true, spoken: [], shared: [], updatePruefungen: 0, installiert: 0 };
  const listeners = {};
  window.__capState = state;
  window.Capacitor = {
    isNativePlatform: () => true, getPlatform: () => 'android',
    Plugins: {
      ProNetwork: { getState: async () => ({ offline: state.offline }), setOffline: async ({ offline }) => { state.offline = offline; return { offline }; } },
      ProSpeech: { listen: async ({ language }) => { state.spoken.push(language); return state.nextSpeech ?? { cancelled: false, text: 'Garantie für den Waschautomaten prüfen' }; } },
      FamilienakteShare: {
        addListener: (name, fn) => { (listeners[name] ||= []).push(fn); return { remove() {} }; },
        pending: async () => ({ items: state.shared.map((f) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size })), refused: state.refused || 0 }),
        read: async ({ id, offset }) => { const f = state.shared.find((x) => x.id === id); if (!f) throw Object.assign(new Error('x'), { code: 'SHARE_UNAVAILABLE' }); return { data: offset > 0 ? '' : f.base64 }; },
        done: async ({ id }) => { state.shared = state.shared.filter((x) => x.id !== id); state.done = (state.done || 0) + 1; },
      },
      FamilienakteUpdates: {
        addListener: (name, fn) => { (listeners['upd:' + name] ||= []).push(fn); return { remove() {} }; },
        pruefen: async () => { state.updatePruefungen++; if (state.offline) throw Object.assign(new Error('UPDATE_OFFLINE'), { code: 'UPDATE_OFFLINE' }); if (state.updateFehler) throw Object.assign(new Error(state.updateFehler), { code: state.updateFehler }); return { neu: '2.28.3', installiert: '2.28.2', groesse: 4194304 }; },
        installieren: async () => { (listeners['upd:stand'] || []).forEach((fn) => fn({ geladen: 2097152, groesse: 4194304 })); state.installiert++; return { gestartet: true }; },
      },
    },
  };
  window.__capShare = (name, mime, text) => { const base64 = btoa(unescape(encodeURIComponent(text))); state.shared.push({ id: 'g' + state.shared.length, name, mime, size: text.length, base64 }); (listeners.shared || []).forEach((fn) => fn({ added: 1, refused: 0 })); };
})();`;
