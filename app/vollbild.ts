/**
 * Windows-App (Klaus 07.11.2026): startet maximiert (tauri.conf.json); F11 schaltet ganz Vollbild ohne Rahmen ein und aus.
 * Die Android-App ist immer Vollbild (MainActivity); in Browser und Web-App gilt die Taste des Browsers.
 */
type TauriFenster = { isFullscreen: () => Promise<boolean>; setFullscreen: (an: boolean) => Promise<void> };

export function initVollbildTaste(w: Window = window) {
  const fenster = (w as unknown as { __TAURI__?: { window?: { getCurrentWindow?: () => TauriFenster } } }).__TAURI__?.window?.getCurrentWindow?.();
  if (!fenster) return false;
  w.addEventListener("keydown", (e) => {
    if (e.key !== "F11" || e.repeat) return;
    e.preventDefault();
    void fenster.isFullscreen().then((an) => fenster.setFullscreen(!an)).catch(() => { /* Fenster lässt es nicht zu */ });
  });
  return true;
}
