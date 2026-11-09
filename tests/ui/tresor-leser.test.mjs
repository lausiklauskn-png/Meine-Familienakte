// Tresor-Leser (Pro-Verbund-Karte, orange „t-leser“, Klaus 09.11.2026): die byte-gleiche Datei aus Workflow PDF Pro liegt in der App.
// Browser: Knopf in „Wo liegt was?“ lädt sie herunter. App (gestellte Ordner-Hülle): Ordner wählen, Datei byte-gleich hineinlegen.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { startApp, launchBrowser, DESKTOP, HANDY, ready, step, soll, summary, footer, collectErrors, ROOT } from "./_harness.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { ordnerStub } from "./_ordner-stub.mjs";
const pin = JSON.parse(readFileSync(path.join(ROOT, "public/tresor-leser/tresor-leser.herkunft.json"), "utf8"));
const app = await startApp();
const browser = await launchBrowser();
const hilfeOeffnen = async (page) => {
  await footer(page, "Hilfe");
  const hilfe = page.locator("[data-pro-tresor-hilfe]").first();
  if (!(await hilfe.evaluate((d) => d.open))) await hilfe.locator("summary").click();
  return hilfe;
};
try {
  const web = await (await browser.newContext({ ...DESKTOP, acceptDownloads: true })).newPage(); const webFehler = collectErrors(web);
  await web.goto(app.base, { waitUntil: "networkidle" }); await ready(web);
  await step("Browser: „Wo liegt was?“ nennt den Tresor-Leser mit Knopf „herunterladen“", async () => {
    const hilfe = await hilfeOeffnen(web);
    const t = await hilfe.locator("[data-tresor-leser]").innerText();
    return soll(/ohne Installation/.test(t) && /Nur lesen/.test(t) && /herunterladen/.test(t), t);
  });
  await step("Browser: Download ist byte-gleich mit dem Pin aus Workflow PDF Pro", async () => {
    const [dl] = await Promise.all([web.waitForEvent("download"), web.locator("[data-tresor-leser-speichern]").first().click()]);
    const datei = await dl.path(); const sha = createHash("sha256").update(readFileSync(datei)).digest("hex");
    return soll(dl.suggestedFilename() === "Tresor-Leser.html" && sha === pin.sha256, { name: dl.suggestedFilename(), sha });
  });
  await step("Browser: keine Fehler auf der Seite", async () => soll(webFehler.length === 0, webFehler));

  const ctx = await browser.newContext(HANDY);
  await ctx.addInitScript(capacitorStub + ordnerStub("android"));
  const page = await ctx.newPage(); const fehler = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await step("App: Knopf heißt „in Ordner legen“, Ordnerwahl nennt den Platz neben dem Tresor", async () => {
    const hilfe = await hilfeOeffnen(page);
    const knopf = hilfe.locator("[data-tresor-leser-speichern]");
    soll(/in Ordner legen/.test(await knopf.innerText()), await knopf.innerText());
    await knopf.click();
    await hilfe.locator("[data-tresor-leser-meldung]").waitFor();
    const r = await page.evaluate(() => ({ titel: window.__ordner.gewaehlt.at(-1), dateien: [...window.__ordner.dateien.keys()] }));
    return soll(/neben|Tresor liegt/.test(r.titel) && r.dateien.includes("R|Tresor-Leser.html"), r);
  });
  await step("App: Datei im Ordner ist byte-gleich, Meldung nennt Datei und Ordner", async () => {
    const b64 = await page.evaluate(() => { const u = window.__ordner.dateien.get("R|Tresor-Leser.html"); let s = ""; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); });
    const sha = createHash("sha256").update(Buffer.from(b64, "base64")).digest("hex");
    const meldung = await page.locator("[data-tresor-leser-meldung]").first().innerText();
    return soll(sha === pin.sha256 && /Tresor-Leser\.html/.test(meldung) && /SD-Karte/.test(meldung), { sha, meldung });
  });
  await step("App: Abbrechen der Ordnerwahl schreibt nichts und meldet „Abgebrochen.“", async () => {
    await page.evaluate(() => { window.__ordner.abbrechen = true; window.__ordner.dateien.clear(); });
    await page.locator("[data-tresor-leser-speichern]").first().click();
    await page.locator("[data-tresor-leser-meldung]", { hasText: "Abgebrochen." }).first().waitFor();
    return soll(await page.evaluate(() => window.__ordner.dateien.size === 0), "Datei trotz Abbruch");
  });
  await step("App: keine Fehler auf der Seite", async () => soll(fehler.length === 0, fehler));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Tresor-Leser"));
