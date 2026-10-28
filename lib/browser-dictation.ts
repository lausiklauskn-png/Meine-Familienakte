// The existing Web Speech browser route, shared by all UI fields. No recording,
// persistence, application API or second speech provider is introduced.
export type SpeechResultLike = { isFinal: boolean; 0: { transcript: string }; length: number };
export type SpeechRecognitionLike = {
  lang: string; interimResults: boolean; continuous: boolean;
  onstart: (() => void) | null; onend: (() => void) | null;
  onresult: ((event: { resultIndex: number; results: ArrayLike<SpeechResultLike> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
export type SpeechConstructor = new () => SpeechRecognitionLike;
export type SpeechBrowser = { SpeechRecognition?: SpeechConstructor; webkitSpeechRecognition?: SpeechConstructor };
export const speechConstructor = (browser: SpeechBrowser): SpeechConstructor | undefined => browser.SpeechRecognition || browser.webkitSpeechRecognition;

export function createDictationSession(options: {
  constructor: () => SpeechConstructor | undefined;
  online: () => boolean;
  onText: (text: string) => void;
  onState: (active: boolean) => void;
  onHint: (text: string, error: boolean) => void;
  schedule?: (callback: () => void) => unknown;
  cancel?: (id: unknown) => void;
}) {
  let active = false;
  let disposed = false;
  let recognition: SpeechRecognitionLike | null = null;
  let timer: unknown = null;
  let base = "";
  let finalText = "";
  const schedule = options.schedule || ((callback: () => void) => setTimeout(callback, 250));
  const cancel = options.cancel || ((id: unknown) => clearTimeout(id as ReturnType<typeof setTimeout>));
  const clearTimer = () => { if (timer !== null) cancel(timer); timer = null; };
  const stop = () => {
    active = false; clearTimer();
    const previous = recognition; recognition = null;
    if (previous) { previous.onend = null; previous.onresult = null; previous.onerror = null; previous.onstart = null; try { previous.stop(); } catch { try { previous.abort(); } catch { /* Keyboard input remains usable. */ } } }
    if (!disposed) options.onState(false);
  };
  const unavailable = (text: string, error = false) => { stop(); if (!disposed) options.onHint(text, error); };
  const startRecognition = (): void => {
    if (!active || disposed) return;
    if (!options.online()) return unavailable("Offline – bitte tippen.");
    const Constructor = options.constructor();
    if (!Constructor) return unavailable("Sprache nicht verfügbar – bitte tippen.");
    try {
      const current = new Constructor();
      recognition = current;
      current.lang = "de-DE";
      current.interimResults = true;
      current.continuous = true;
      const priorFinal = finalText;
      const finals = new Map<number, string>();
      current.onstart = () => { if (active && recognition === current) { options.onState(true); options.onHint("", false); } };
      current.onresult = (event) => {
        if (!active || disposed || recognition !== current) return;
        const interim: string[] = [];
        for (let index = 0; index < event.results.length; index++) {
          const result = event.results[index];
          const text = result[0]?.transcript?.trim();
          if (!text) continue;
          if (result.isFinal) finals.set(index, text); else interim.push(text);
        }
        finalText = [priorFinal, ...[...finals].sort((a,b) => a[0]-b[0]).map(([,text]) => text)].filter(Boolean).join(" ");
        options.onText([base, finalText, ...interim].filter(Boolean).join(" ").trim());
      };
      current.onerror = (event) => {
        if (!active || disposed || recognition !== current) return;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") unavailable("Mikrofonzugriff verweigert – bitte tippen.", true);
        else if (event.error === "audio-capture") unavailable("Kein Mikrofon verfügbar – bitte tippen.", true);
        else if (event.error === "network") unavailable("Sprache derzeit nicht erreichbar – bitte tippen.", true);
        else if (!["no-speech", "aborted"].includes(event.error)) unavailable("Diktat unterbrochen – bitte erneut starten oder tippen.", true);
      };
      current.onend = () => {
        if (recognition !== current) return;
        recognition = null;
        if (active && !disposed) { clearTimer(); timer = schedule(() => { timer = null; startRecognition(); }); }
      };
      current.start();
    } catch { unavailable("Mikrofon konnte nicht starten – bitte tippen.", true); }
  };
  return {
    start(value: string, append = true) {
      stop();
      if (disposed) return;
      if (!options.online()) return unavailable("Offline – bitte tippen.");
      if (!options.constructor()) return unavailable("Sprache nicht verfügbar – bitte tippen.");
      base = append ? value.trim() : ""; finalText = ""; active = true;
      options.onHint("Mikrofon wird gestartet …", false); options.onState(false); startRecognition();
    },
    stop,
    get active() { return active; },
    offline() { unavailable("Offline – bitte tippen."); },
    dispose() { disposed = true; stop(); },
  };
}
