import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, footer, collectErrors } from "./_harness.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { tauriStub } from "./_tauri-stub.mjs";
const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  await context.addInitScript(capacitorStub + `
    window.__proStand = { status: 'getrennt' }; window.__proCalls = [];
    window.Capacitor.Plugins.FamilienakteTresor = {
      zustand: async () => ({ ...window.__proStand }),
      verbinden: async () => { window.__proCalls.push('verbinden'); if (window.__proFehler) throw new Error('Abbruch'); return window.__proStand = { status: 'offen', id: 'erfundener-tresor-1', ort: 'content://erfundene-sdkarte/Pro-Tresor' }; },
      entsperren: async () => { window.__proCalls.push('entsperren'); return window.__proStand = { ...window.__proStand, status: 'offen' }; },
      sperren: async () => { window.__proCalls.push('sperren'); window.__proStand.status = 'gesperrt'; },
    };`);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await footer(page, "Sicherheitscenter");
  const panel = page.locator("[data-pro-tresor]"); await panel.waitFor();
  check(await page.evaluate(() => window.__proCalls.length === 0), "Pro-Tresor: kein selbstständiger Anschluss");
  await step("Pro-Tresor: gewählter Ort und Kennung erscheinen nach Entsperren", async () => {
    await panel.getByRole("button", { name: "Vorhandenen Pro-Tresor verbinden …", exact: true }).click();
    await panel.getByText("Entsperrt", { exact: true }).waitFor();
    return (await panel.innerText()).includes("erfundener-tresor-1") && (await panel.innerText()).includes("content://erfundene-sdkarte");
  });
  await step("Pro-Tresor: Sperren und bewusstes Entsperren", async () => {
    await panel.getByRole("button", { name: "Pro-Tresor sperren", exact: true }).click();
    await panel.getByText("Gesperrt", { exact: true }).waitFor();
    await panel.getByRole("button", { name: "Pro-Tresor entsperren …", exact: true }).click();
    await panel.getByText("Entsperrt", { exact: true }).waitFor(); return true;
  });
  await step("Pro-Tresor: abgebrochener Wechsel behält bisherigen Tresor", async () => {
    await page.evaluate(() => { window.__proFehler = true; });
    await panel.getByRole("button", { name: "Anderen Pro-Tresor wählen …", exact: true }).click();
    await panel.getByRole("alert").waitFor();
    return (await panel.innerText()).includes("erfundener-tresor-1");
  });
  await step("Pro-Tresor: entfernte SD-Karte bleibt sichtbar, kein Ersatz", async () => {
    await page.evaluate(() => { window.__proStand.status = 'nicht_erreichbar'; document.dispatchEvent(new Event('visibilitychange')); });
    await panel.getByText(/Nicht erreichbar/).waitFor();
    return (await panel.innerText()).includes("erfundener-tresor-1");
  });
  check(errors.length === 0, "Pro-Tresor: keine Seitenfehler", errors.join(" | "));
  const winContext = await browser.newContext(DESKTOP);
  await winContext.addInitScript(tauriStub);
  const win = await winContext.newPage();
  await win.goto(app.base, { waitUntil: "networkidle" }); await ready(win); await footer(win, "Sicherheitscenter");
  const winPanel = win.locator("[data-pro-tresor]");
  await step("Windows: gleicher Anschluss über Tauri, kein automatisches Verbinden", async () => {
    await winPanel.waitFor();
    return await win.evaluate(() => window.__tauriState.proCalls.every((a) => a === 'zustand'));
  });
  await step("Windows: bewusst verbinden, Ort/Kennung sehen, sperren und entsperren", async () => {
    await winPanel.getByRole("button", { name: "Vorhandenen Pro-Tresor verbinden …", exact: true }).click();
    await winPanel.getByText("Entsperrt", { exact: true }).waitFor();
    check((await winPanel.innerText()).includes("erfundener-windows-tresor"), "Windows: eigene Tresorkennung");
    await winPanel.getByRole("button", { name: "Pro-Tresor sperren", exact: true }).click();
    await winPanel.getByText("Gesperrt", { exact: true }).waitFor();
    await winPanel.getByRole("button", { name: "Pro-Tresor entsperren …", exact: true }).click();
    await winPanel.getByText("Entsperrt", { exact: true }).waitFor(); return true;
  });
  const web = await (await browser.newContext(DESKTOP)).newPage();
  await web.goto(app.base, { waitUntil: "networkidle" }); await ready(web); await footer(web, "Sicherheitscenter");
  check(await web.locator("[data-pro-tresor]").count() === 0, "PWA: kein vorgetäuschter nativer Tresor");
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Pro-Tresor Anschluss"));
