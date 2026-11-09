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
      verbinden: async () => { window.__proCalls.push('verbinden'); if (window.__proFehlerCode) throw Object.assign(new Error('Der gewählte Pro-Tresor ist nicht verfügbar.'), { code: window.__proFehlerCode }); if (window.__proFehler) throw new Error('Abbruch'); return window.__proStand = { status: 'offen', id: 'erfundener-tresor-1', ort: 'content://erfundene-sdkarte/Pro-Tresor' }; },
      entsperren: async () => { window.__proCalls.push('entsperren'); return window.__proStand = { ...window.__proStand, status: 'offen' }; },
      sperren: async () => { window.__proCalls.push('sperren'); window.__proStand.status = 'gesperrt'; },
    };`);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await step("Pro-Tresor: unerfüllter Anschluss-Hinweis bleibt sichtbar", async () => {
    await footer(page, "Dokumentenbibliothek");
    // Seit 2.28.39 zeigt die Bibliothek ab Werk Zeilen; die Kartenansicht trägt die Knöpfe wie zuvor.
    await page.locator('.ansicht-umschalter [data-ansicht="karten"]').click();
    await page.getByRole("button", { name: "In Pro-Tresor übernehmen", exact: true }).first().click();
    await page.locator('.global-activity-text', { hasText: "Bitte zuerst den gewünschten Pro-Tresor" }).waitFor();
    return await page.locator('.global-activity-row').count() === 1;
  });
  const panel = page.locator("[data-pro-tresor]"); await panel.waitFor();
  check(await page.evaluate(() => window.__proCalls.length === 0), "Pro-Tresor: kein selbstständiger Anschluss");
  await step("Pro-Tresor: gewählter Ort und Kennung erscheinen nach Entsperren", async () => {
    await panel.getByRole("button", { name: "Vorhandenen Pro-Tresor verbinden …", exact: true }).click();
    await panel.getByText("Entsperrt", { exact: true }).waitFor();
    await page.locator('.global-activity-text', { hasText: "Bitte zuerst den gewünschten Pro-Tresor" }).waitFor({ state: "detached" });
    return (await panel.innerText()).includes("erfundener-tresor-1") && (await panel.innerText()).includes("content://erfundene-sdkarte");
  });
  await step("Pro-Tresor: sofortige Bestätigung nach der Ordnerwahl (gewählt, gespeichert, erreichbar, entsperrt, Ort)", async () => {
    const t = await panel.locator("[data-pro-tresor-bestaetigung]").innerText();
    return /Gewählt und gespeichert: content:\/\/erfundene-sdkarte\/Pro-Tresor · erreichbar · entsperrt · Tresorkennung erfundener-tresor-1/.test(t) ? t.slice(0, 120) : (console.log("   ↳", t), false);
  });
  await step("Pro-Tresor: nach dem Verbinden ist „Neue Originale in diesem Pro-Tresor ablegen“ als Empfehlung (Ordner „Familienakte“) sichtbar", async () => {
    const t = await panel.locator("[data-pro-ablage-empfehlung]").innerText();
    return t.includes("Empfohlen") && t.includes("„Familienakte“") && await panel.getByRole("button", { name: "Neue Originale in diesem Pro-Tresor ablegen", exact: true }).isVisible()
      && /bisherigen Aktenordner/.test(await panel.locator("[data-pro-ablage]").innerText());
  });
  await step("Pro-Tresor: „Wo liegt was?“ steht hinter dem „?“ der Karte (tresorordner.json, Fach, Eingang, Menüweg)", async () => {
    await panel.getByRole("button", { name: "Gemeinsamer Pro-Tresor erklären", exact: true }).click();
    const hilfe = page.locator("[data-hinweis-mehr] [data-pro-tresor-hilfe]"); await hilfe.waitFor();
    const t = await hilfe.innerText(); await page.keyboard.press("Escape");
    return ["tresorordner.json", "Nie den Unterordner „Tresorordner“", "Diese App: Familienakte", "Eingang: Eingang-Familienakte", "Sicherheit & lokaler Tresor"].every((w) => t.includes(w));
  });
  for (const [code, erwartet] of [["FA_TRESOR_NICHT_VORHANDEN", /keine tresorordner\.json.*kein neuer Tresor angelegt/], ["FA_TRESOR_UNTERORDNER", /wie ein Ordner im Tresor.*Ebene höher/]]) {
    await step(`Pro-Tresor: falscher Ordner (${code}) wird verständlich gemeldet, bisheriger Tresor bleibt`, async () => {
      await page.evaluate((c) => { window.__proFehlerCode = c; }, code);
      await panel.getByRole("button", { name: "Anderen Pro-Tresor wählen …", exact: true }).click();
      const alert = panel.getByRole("alert"); await alert.waitFor();
      const t = await alert.innerText(); await page.evaluate(() => { window.__proFehlerCode = null; });
      return erwartet.test(t) && (await panel.innerText()).includes("erfundener-tresor-1") && !(await panel.locator("[data-pro-tresor-bestaetigung]").count()) ? t.slice(0, 100) : (console.log("   ↳", t), false);
    });
  }
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
    return (await panel.innerText()).includes("erfundener-tresor-1") && (await panel.innerText()).includes("Der gemerkte Ort bleibt gespeichert");
  });
  await step("Pro-Tresor: fremde Kennung am gemerkten Ort heißt „Anderer Tresor verbunden …“ statt „Nicht erreichbar“", async () => {
    await page.evaluate(() => { window.__proStand = { ...window.__proStand, status: 'nicht_erreichbar', code: 'FA_TRESOR_FREMDE_KENNUNG' }; document.dispatchEvent(new Event('visibilitychange')); });
    const status = panel.locator("[data-pro-tresor-status]");
    await status.filter({ hasText: "Anderer Tresor verbunden" }).waitFor();
    const t = await status.innerText();
    return t === "Anderer Tresor verbunden – bitte den Ordner wählen, in dem tresorordner.json liegt." && (await panel.innerText()).includes("erfundener-tresor-1");
  });
  await step("Ausloggen sperrt den Pro-Tresor und schließt die App (vorher lud es nur neu)", async () => {
    await page.evaluate(() => { window.__proStand = { status: 'offen', id: 'erfundener-tresor-1', ort: 'content://erfundene-sdkarte/Pro-Tresor' }; const alt = window.Capacitor.Plugins.FamilienakteTresor.sperren; window.Capacitor.Plugins.FamilienakteTresor.sperren = async () => { sessionStorage.setItem('probe-gesperrt', '1'); return alt(); }; });
    // Klaus 09.11.: Ausloggen = Tresor sperren und die App schließen (Android: FamilienakteApp.beenden, hier gestellt).
    await page.evaluate(() => { window.Capacitor.Plugins.FamilienakteApp = { beenden: async () => { sessionStorage.setItem('probe-beendet', '1'); return { beendet: true }; } }; });
    await page.locator(".logout-button").click();
    await page.waitForFunction(() => sessionStorage.getItem('probe-beendet') === '1', null, { timeout: 5000 });
    const gesperrt = await page.evaluate(() => sessionStorage.getItem('probe-gesperrt'));
    await page.evaluate(() => { delete window.Capacitor.Plugins.FamilienakteApp; });
    return gesperrt === '1';
  });
  await step("Nach dem Ausloggen zeigt der Knopf „Einloggen“ und entsperrt den Tresor", async () => {
    await page.evaluate(() => { window.__proStand = { status: 'gesperrt', id: 'erfundener-tresor-1', ort: 'content://erfundene-sdkarte/Pro-Tresor' }; window.dispatchEvent(new Event('familienakte:pro-tresor')); });
    const knopf = page.locator(".login-button"); await knopf.waitFor();
    if (await knopf.getAttribute("aria-label") !== "Einloggen") return false;
    await knopf.click();
    await page.locator(".logout-button").waitFor();
    return (await page.evaluate(() => window.__proCalls.includes('entsperren'))) && (await page.locator(".logout-button").getAttribute("aria-label")) === "Ausloggen";
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
  await step("Hilfe: „Wo liegt was?“ auch ohne nativen Tresor in der Hilfe erreichbar", async () => {
    await footer(web, "Hilfe");
    const hilfe = web.locator("[data-pro-tresor-hilfe]"); await hilfe.locator("summary").click();
    const t = await hilfe.innerText();
    return t.includes("tresorordner.json") && t.includes("Eingang-Familienakte") && t.includes("Ein Passwort gilt für alle Pro-Apps.");
  });
  await step("Ordnerbaum: Tipp auf „Familienakte“ springt zur Dokumentenbibliothek", async () => {
    const knoten = web.locator("[data-pro-tresor-hilfe] .ablauf-link", { hasText: "Diese App: Familienakte" });
    if (await knoten.count() !== 1) return false;
    await knoten.click(); await web.waitForTimeout(500);
    return await web.locator(".breadcrumb").innerText().then(t => /Dokumentenbibliothek|Dokumente/.test(t)).catch(() => false) ? "zur Bibliothek" : false;
  });
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Pro-Tresor Anschluss"));
