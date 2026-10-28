/* Familienakte: Internetschalter – Zustand für Browser (PWA) und Windows (Tauri).
   Muss VOR native/native-network.js laufen. In der Android-App (Capacitor) stellt
   das native Plugin „ProNetwork“ den Zustand; hier geschieht dann nichts.
   Standard ist AUS; der Zustand überlebt einen Neustart (localStorage). */
(() => {
  'use strict';
  const KEY = 'familienakte-internet';
  if (window.Capacitor?.isNativePlatform?.()) return;
  const read = () => { try { return localStorage.getItem(KEY) === 'an' ? false : true; } catch { return true; } };
  const write = (offline) => { try { localStorage.setItem(KEY, offline ? 'aus' : 'an'); } catch { /* ohne Speicher bleibt es aus */ } };
  const plugin = {
    async getState() { return { offline: read() }; },
    async setOffline({ offline }) { if (typeof offline !== 'boolean') throw new Error('INVALID_INPUT'); write(offline); return { offline: read() }; }
  };
  const capacitor = window.Capacitor || (window.Capacitor = {});
  capacitor.Plugins = capacitor.Plugins || {};
  if (!capacitor.Plugins.ProNetwork) capacitor.Plugins.ProNetwork = plugin;
})();
