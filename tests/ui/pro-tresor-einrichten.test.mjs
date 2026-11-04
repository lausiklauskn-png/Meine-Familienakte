// Ein-Schritt-Weg „Tresor einrichten – nur Speicher wählen“ (Klaus 2026-11-04). Die native Seite ist gestellt
// (Speicherwahl, Fenster und Krypto prüft die JVM-Probe tools/native/test-pro-tresor.mjs). Hier: Knopf, Meldungen, Bestätigung.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, footer, collectErrors } from "./_harness.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  await context.addInitScript(capacitorStub + `
    window.__proStand = { status: 'getrennt' }; window.__proCalls = [];
    window.Capacitor.Plugins.FamilienakteTresor = {
      zustand: async () => ({ ...window.__proStand }),
      verbinden: async () => { window.__proCalls.push('verbinden'); throw new Error('nicht erwartet'); },
      einrichten: async () => { window.__proCalls.push('einrichten');
        if (window.__proFehlerCode) throw Object.assign(new Error('Der gewählte Pro-Tresor ist nicht verfügbar.'), { code: window.__proFehlerCode });
        return window.__proStand = { status: 'offen', id: 'erfundener-neuer-tresor', ort: 'SD/USB (1234-5678)/Family-Projekt', angelegt: true }; },
      entsperren: async () => ({ ...window.__proStand }), sperren: async () => { window.__proStand.status = 'gesperrt'; },
    };`);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await footer(page, "Sicherheitscenter");
  const panel = page.locator("[data-pro-tresor]"); await panel.waitFor();
  check(await page.evaluate(() => window.__proCalls.length === 0), "Einrichten: nichts startet von selbst");
  await step("Einrichten: ein Knopf „Tresor einrichten – nur Speicher wählen …“ statt „Vorhandenen Pro-Tresor verbinden“", async () => {
    const knopf = panel.getByRole("button", { name: "Tresor einrichten – nur Speicher wählen …", exact: true });
    return await knopf.isVisible() && await panel.locator("[data-pro-tresor-verbinden]").count() === 0
      && /Family-Projekt/.test(await panel.locator("[data-pro-tresor-einrichten-hinweis]").innerText());
  });
  for (const [code, erwartet] of [["FA_TRESOR_MEHRERE", /mehrere Tresore.*nichts verändert/], ["FA_TRESOR_UNTERORDNER", /Unterordner des Tresors/],
    ["TRESOR_NAME_BELEGT", /schon und hat Inhalt.*nichts angelegt/], ["FA_TRESOR_ABGEBROCHEN", /abgebrochen/]]) {
    await step(`Einrichten: ${code} wird verständlich gemeldet, nichts verbunden`, async () => {
      await page.evaluate((c) => { window.__proFehlerCode = c; }, code);
      await panel.getByRole("button", { name: "Tresor einrichten – nur Speicher wählen …", exact: true }).click();
      const alert = panel.getByRole("alert"); await alert.waitFor();
      const t = await alert.innerText(); await page.evaluate(() => { window.__proFehlerCode = null; });
      return erwartet.test(t) && !(await panel.locator("[data-pro-tresor-bestaetigung]").count()) ? t.slice(0, 90) : (console.log("   ↳", t), false);
    });
  }
  await step("Einrichten: neuer Tresor – Bestätigung nennt Ort, Kennung und LIES-MICH", async () => {
    await panel.getByRole("button", { name: "Tresor einrichten – nur Speicher wählen …", exact: true }).click();
    const t = await panel.locator("[data-pro-tresor-bestaetigung]").innerText();
    return /^Neuer Tresor angelegt und gespeichert: SD\/USB \(1234-5678\)\/Family-Projekt · erreichbar · entsperrt · Tresorkennung erfundener-neuer-tresor/.test(t) && t.includes("LIES-MICH.txt") ? t.slice(0, 100) : (console.log("   ↳", t), false);
  });
  await step("Einrichten: danach heißt der Knopf „Anderen Speicher wählen …“, Hinweis weg", async () =>
    await panel.getByRole("button", { name: "Anderen Speicher wählen …", exact: true }).isVisible() && await panel.locator("[data-pro-tresor-einrichten-hinweis]").count() === 0);
  check(errors.length === 0, "Einrichten: keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Pro-Tresor einrichten"));
