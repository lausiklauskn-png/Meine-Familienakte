// Ersatzobjekte für Browser-Fähigkeiten, die headless nicht echt bedienbar sind.
// Werden per page.addInitScript() vor dem Laden der App eingesetzt.

/** Spracherkennung: beide Namen (Chromium hat das echte SpeechRecognition!). Liefert nach kurzer Zeit den festen Text. */
export const speechStub = (text = "Diktierter Beispieltext") => `
  (() => {
    class FakeRecognition {
      constructor() { this.lang = ""; this.interimResults = false; this.continuous = false; this.onstart = null; this.onend = null; this.onresult = null; this.onerror = null; this._stopped = false; }
      start() {
        window.__diktatGestartet = (window.__diktatGestartet || 0) + 1;
        setTimeout(() => { if (this._stopped) return; this.onstart && this.onstart(); }, 10);
        setTimeout(() => { if (this._stopped) return; const r = [{ isFinal: true, 0: { transcript: ${JSON.stringify(text)} }, length: 1 }]; this.onresult && this.onresult({ resultIndex: 0, results: r }); }, 80);
      }
      stop() { this._stopped = true; setTimeout(() => this.onend && this.onend(), 5); }
      abort() { this.stop(); }
    }
    window.SpeechRecognition = FakeRecognition; window.webkitSpeechRecognition = FakeRecognition;
  })();`;

/** Ordnerauswahl: liefert echte Ordner-Handles aus dem OPFS (Origin Private File System) – jede Wahl ein eigener, leerer Ordner. */
export const directoryPickerStub = `
  (() => {
    let n = 0;
    window.__gewaehlteOrdner = [];
    window.showDirectoryPicker = async (opts) => {
      const root = await navigator.storage.getDirectory();
      const name = (window.__naechsterOrdner) || ("Probe-Ordner-" + (++n));
      window.__naechsterOrdner = null;
      const h = await root.getDirectoryHandle(name, { create: true });
      window.__gewaehlteOrdner.push(name);
      return h;
    };
  })();`;

/** Drucken und neue Fenster abfangen, Aufrufe zählen. */
export const windowStub = `
  (() => {
    window.__gedruckt = 0; window.__geoeffnet = [];
    window.print = () => { window.__gedruckt++; };
    const open = window.open;
    window.open = (url, ...rest) => { window.__geoeffnet.push(String(url)); return null; };
    window.__neuGeladen = 0;
  })();`;

/** Zwischenablage sperren (simuliert fehlende Berechtigung). */
export const clipboardDeniedStub = `
  (() => {
    const denied = () => Promise.reject(new DOMException("Write permission denied.", "NotAllowedError"));
    try { Object.defineProperty(navigator, "clipboard", { value: { writeText: denied, readText: denied }, configurable: true }); } catch {}
  })();`;

/** Schließt alle offenen Dialoge (✕, Schließen, Abbrechen, Zur Startseite …), höchstens 6 Runden. */
export async function schliesseDialoge(page) {
  for (let i = 0; i < 6; i++) {
    if (!(await page.locator(".modal-backdrop").count())) return true;
    const modal = page.locator(".modal").last();
    const knopf = modal.locator('button[aria-label="Fenster schließen"], button[aria-label="Schließen"], button[aria-label="Auswahlfenster schließen"], button[aria-label="Detailansicht schließen"], button:has-text("Abbrechen"), button:has-text("Zur Startseite"), button:has-text("Schließen")').first();
    if (await knopf.count()) await knopf.click({ force: true }).catch(() => {});
    else await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
  }
  return (await page.locator(".modal-backdrop").count()) === 0;
}

/** Bekannter Defekt: wird ausgegeben, zählt aber nicht als rote Zeile (steht in docs/analyse/FUNKTIONSMATRIX.md). */
export function bekannt(name, detail = "") { console.log(`⚠ BEKANNT DEFEKT · ${name}${detail ? ` – ${detail}` : ""}`); }

/** Ist der Punkt in der Mitte des Elements wirklich dieses Element (oder liegt etwas darüber)? */
export async function verdecktVon(page, locator) {
  const box = await locator.boundingBox();
  if (!box) return "nicht sichtbar";
  return page.evaluate(({ x, y }) => {
    const ziel = document.elementFromPoint(x, y);
    return ziel ? `${ziel.tagName.toLowerCase()}${ziel.className ? "." + String(ziel.className).split(" ")[0] : ""}` : "nichts";
  }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
}

/** Räumt auf: offene Seiten-Dialoge abbrechen, Fenster schließen. */
export async function aufraeumen(page) {
  for (let i = 0; i < 4 && (await page.locator(".page-dialog").count()); i++) { await page.locator(".page-dialog button", { hasText: "Abbrechen" }).click().catch(() => {}); await page.waitForTimeout(100); }
  await schliesseDialoge(page);
}
