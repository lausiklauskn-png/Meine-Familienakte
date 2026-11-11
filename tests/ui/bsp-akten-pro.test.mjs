// Bsp. bei eingeschaltetem Pro-Tresor (Klaus 11.11.2026: am Tablet „Neue Originale: verschlüsselt im Tresor“):
// Beispiel-PDFs dürfen nie in den gemeinsamen Pro-Tresor – dort blieben sie beim Entfernen liegen (Originale im Tresor werden nie
// gelöscht). Nachgestellter Tresor zählt jeden Schreibversuch.
import { startApp, launchBrowser, DESKTOP, ready, step, soll, summary, footer, collectErrors } from "./_harness.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  await context.addInitScript(`(() => { if (location.origin !== ${JSON.stringify(new URL(app.base).origin)}) return;` + capacitorStub + `
    window.__proDok = { status: 'offen', id: 'erfundener-tresor-bsp', ort: 'content://erfunden/Family-Projekt', writes: Number(localStorage.getItem('bsp-pro-writes') || 0) };
    window.Capacitor.Plugins.FamilienakteTresor = {
      zustand: async () => ({ ...window.__proDok }),
      entsperren: async () => ({ ...window.__proDok }), sperren: async () => {},
      speichern: async (a) => { window.__proDok.writes++; localStorage.setItem('bsp-pro-writes', String(window.__proDok.writes)); return { vaultId: a.vaultId, entryId: 'e-' + window.__proDok.writes, sha256: 'x', size: 1 }; },
      lesen: async () => ({ data: '' }),
    }; })();`);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await step("Vorbereitung: Beispiele entfernen, Pro-Tresor für neue Originale einschalten", async () => {
    await page.locator("[data-bsp-weg]").click();
    await page.waitForSelector(".sample-data-notice", { state: "detached", timeout: 30000 });
    await vaultFixture(page);
    await page.evaluate(async () => { const f = window.__vaultFixture; await f.setProDocumentVault(await f.browserVault(), "erfundener-tresor-bsp"); });
    const id = await page.evaluate(async () => { const f = window.__vaultFixture; return f.readProDocumentVault(await f.browserVault()); });
    return soll(id === "erfundener-tresor-bsp", `Pro-Ziel: ${id}`);
  });
  await step("+ Bsp.: alle Beispiel-PDFs im eigenen Aktenordner, kein Schreibversuch in den Pro-Tresor", async () => {
    await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector(".site-brand-version");
    await footer(page, "Hilfe");
    await page.locator("[data-bsp-akten]").click();
    await page.waitForSelector('[data-bsp-akten="da"]', { timeout: 60000 });
    await vaultFixture(page);
    const r = await page.evaluate(async () => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault());
      const bsp = d.documents.filter((x) => x.notes?.startsWith("Beispieldaten – frei erfunden"));
      return { anzahl: bsp.length, fremd: bsp.filter((x) => !String(x.storedPath || "").startsWith("Me_Myself_and_I_Familienakte/")).length, writes: window.__proDok.writes }; });
    return soll(r.anzahl >= 10 && r.fremd === 0 && r.writes === 0, r);
  });
  await step("− Bsp. entfernt sie wieder vollständig", async () => {
    await page.locator("[data-bsp-akten]").click();
    await page.waitForSelector('[data-bsp-akten="fehlt"]', { timeout: 60000 });
    await vaultFixture(page);
    const n = await page.evaluate(async () => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return d.documents.filter((x) => x.notes?.startsWith("Beispieldaten – frei erfunden")).length; });
    return soll(n === 0, `noch ${n}`);
  });
  await step("Keine Seitenfehler", async () => soll(errors.length === 0, errors));
} finally { await browser.close(); await app.stop(); }
summary("Bsp. bei Pro-Tresor");
