// Gestellte Capacitor-Brücke (Android-Hülle) für Browser-Proben: Internetschalter, Sprachfenster, Teilen-Eingang.
export const capacitorStub = `(() => {
  const state = { offline: true, spoken: [], shared: [] };
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
    },
  };
  window.__capShare = (name, mime, text) => { const base64 = btoa(unescape(encodeURIComponent(text))); state.shared.push({ id: 'g' + state.shared.length, name, mime, size: text.length, base64 }); (listeners.shared || []).forEach((fn) => fn({ added: 1, refused: 0 })); };
})();`;
