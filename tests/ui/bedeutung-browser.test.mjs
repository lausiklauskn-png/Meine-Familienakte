// Stufe G (Plan 08.11.2026): Bedeutungssuche in der Web-App. Im Browser (Chrome/Edge, OPFS) gibt es die Modellablage jetzt
// auch; der Download zeigt einen Balken in Prozent; eine Datei mit falschem Fingerabdruck wird verworfen (gestellte Quellen),
// „Anhalten“ lässt sich fortsetzen. Ein echtes Modell wird hier nicht geladen (zu groß für eine Probe).
import { startApp, launchBrowser, DESKTOP, ready, step, summary, collectErrors, fail, footer, internetAn } from "./_harness.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  // Gestellte Modellquellen: jede Datei kommt als 64 KiB Nullen – falsche Prüfsumme, aber messbarer Fortschritt.
  const quellen = { anfragen: [], langsam: false };
  for (const muster of ["https://family-projekt.de/models/**", "https://huggingface.co/**", "https://cdn.jsdelivr.net/npm/@xenova/**", "https://unpkg.com/@xenova/**"]) {
    await context.route(muster, async (route) => {
      const r = route.request(); quellen.anfragen.push({ url: r.url(), range: r.headers().range || null });
      if (quellen.langsam) await new Promise((ok) => setTimeout(ok, 400));
      return route.fulfill({ status: 200, headers: { "content-type": "application/octet-stream", "access-control-allow-origin": "*" }, body: Buffer.alloc(65536) });
    });
  }
  const page = await context.newPage(); page.setDefaultTimeout(15000); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  await internetAn(page);
  const panel = page.locator(".private-meaning");
  const offen = async () => { await footer(page, "Suche").catch(() => {}); if (!(await panel.count())) await footer(page, "Sicherheitscenter"); await panel.waitFor(); const k = panel.locator("button", { hasText: "Gerät, Modelle und Suchindex" }); if (await k.count()) await k.click(); };

  await step("Web-App: Modellablage im Browser angeboten (nicht mehr „nur Android/Windows“), Stufen wählbar", async () => {
    await offen();
    await panel.locator("[data-modell-browser]").waitFor();
    const text = (await panel.innerText()).replace(/\s+/g, " ");
    return soll(/Speicher dieses Browsers/.test(text) && !/derzeit in den Android- und Windows-Apps angeschlossen/.test(text) && (await panel.locator("select option").count()) === 3, text.slice(0, 300)) && "Browser-Ablage da";
  });
  await step("Laden startet: Balken in Prozent erscheint, Dateien werden aus den festen Quellen geholt", async () => {
    quellen.langsam = true;
    await page.evaluate(() => { window.ProGeraet.vorDemLaden = async () => ({ weiter: true }); });
    await panel.locator("button", { hasText: "Gewähltes Modell laden / fortsetzen" }).click();
    await panel.locator("[data-modell-fortschritt]").waitFor({ timeout: 30000 });
    const prozent = Number(await panel.locator("[data-modell-fortschritt]").getAttribute("data-modell-fortschritt"));
    const text = await panel.locator(".modell-fortschritt span").first().innerText();
    const quelle = quellen.anfragen[0]?.url || "";
    soll(prozent >= 0 && prozent <= 100 && /%/.test(text) && /Mi?B/.test(text) && /family-projekt\.de|jsdelivr|huggingface|unpkg/.test(quelle), { prozent, text, quelle });
    return `${prozent} % · ${text} · erste Quelle ${new URL(quelle).host}`;
  });
  await step("Anhalten: Download stoppt, Stand bleibt; „fortsetzen“ fragt mit Range ab der Stelle weiter", async () => {
    await panel.locator("button", { hasText: "Download anhalten" }).click();
    await page.waitForFunction(() => /angehalten/.test(document.querySelector(".private-meaning")?.innerText || ""), null, { timeout: 30000 });
    const vorher = quellen.anfragen.length;
    quellen.langsam = false;
    await panel.locator("button", { hasText: "Gewähltes Modell laden / fortsetzen" }).click();
    await page.waitForTimeout(2500);
    await page.waitForFunction(() => /Fingerabdruck|verworfen|vollständig/.test(document.querySelector(".private-meaning")?.innerText || ""), null, { timeout: 60000 }).catch(() => {});
    const mitRange = quellen.anfragen.slice(vorher).filter((a) => a.range);
    return soll(quellen.anfragen.length > vorher, { vorher, jetzt: quellen.anfragen.length }) && `${quellen.anfragen.length - vorher} weitere Anfragen, ${mitRange.length} davon fortgesetzt (Range)`;
  });
  await step("Falscher Fingerabdruck: Datei verworfen, Modell nicht „vollständig“, ehrliche Meldung", async () => {
    await page.waitForFunction(() => /Fingerabdruck/.test(document.querySelector(".private-meaning")?.innerText || ""), null, { timeout: 120000 });
    const text = (await panel.innerText()).replace(/\s+/g, " ");
    const installiert = await page.evaluate(() => localStorage.getItem("familienakte-modell-geprueft-klein"));
    const indexKnopf = await panel.locator("button", { hasText: "Index aufbauen / fortsetzen" }).isDisabled();
    return soll(/nicht den festen Fingerabdruck/.test(text) && !installiert && indexKnopf, { text: text.slice(0, 300), installiert, indexKnopf }) && "verworfen, nicht installiert";
  });
  await step("Entfernen räumt den Browser-Speicher auf", async () => {
    await panel.locator("button", { hasText: "Gewähltes Modell entfernen" }).click();
    await page.waitForTimeout(800);
    const da = await page.evaluate(async () => { try { const r = await navigator.storage.getDirectory(); const m = await r.getDirectoryHandle("Familienakte-Modelle"); await m.getDirectoryHandle("klein"); return true; } catch { return false; } });
    return soll(!da, "Ordner klein liegt noch") && "aufgeräumt";
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource|family-projekt|huggingface|jsdelivr|unpkg/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Bedeutungssuche im Browser"));
