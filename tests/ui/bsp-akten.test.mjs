// Bsp.-Akten (Klaus 11.11.2026): in der Hilfe „+ Bsp.-Akten“ holt die erfundene Beispielfamilie in die eigene Akte (gespeichert),
// danach „− Bsp.-Akten“ nimmt nur sie wieder heraus. Jede Beispielakte trägt oben rechts ein rotes Dreieck (Liste und geöffnet);
// eigene Einträge haben keins und bleiben beim Entfernen erhalten.
import { vaultFixture } from "./_vault-fixture.mjs";
import { startApp, launchBrowser, DESKTOP, ready, step, soll, summary, footer, collectErrors } from "./_harness.mjs";
async function zurFamilie(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const feld = page.locator(".global-search input");
  await feld.fill(""); await feld.fill("Familienübersicht");
  await page.locator(".search-results article", { has: page.locator("strong", { hasText: /^Familienübersicht$/ }) }).first().locator("button").first().click();
  await page.locator("#familie-stamm").waitFor();
  await feld.fill("");
}
const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  const knopf = () => page.locator("[data-bsp-akten]");
  await step("Vorbereitung: Beispiele oben entfernen, eine eigene Person anlegen", async () => {
    await page.locator("[data-bsp-weg]").click();
    await page.waitForSelector(".sample-data-notice", { state: "detached", timeout: 30000 });
    await vaultFixture(page);
    await page.evaluate(async () => { const f = window.__vaultFixture; const h = await f.browserVault(); await f.createLocalFamilyRecord(h, { recordType: "person", data: { displayName: "Eigene Probeperson" }, status: "aktiv", source: "Eigene Eingabe", notes: null }); });
    await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector(".site-brand-version");
    return soll(await page.locator(".sample-data-notice").count() === 0, "Hinweis noch da");
  });
  await step("Hilfe: Knopf heißt „+ Bsp.-Akten“, ohne Erklärtext daneben", async () => {
    await footer(page, "Hilfe");
    const r = { text: (await knopf().innerText()).trim(), stand: await knopf().getAttribute("data-bsp-akten") };
    return soll(r.text === "+ Bsp.-Akten" && r.stand === "fehlt", r);
  });
  await step("Tipp auf „+ Bsp.-Akten“: Beispielfamilie da, Knopf wird „− Bsp.-Akten“, Hinweis oben kurz", async () => {
    await knopf().click();
    await page.waitForSelector('[data-bsp-akten="da"]', { timeout: 60000 });
    const r = { text: (await knopf().innerText()).trim(), hinweis: (await page.locator(".sample-data-notice").innerText()).replace(/\s+/g, " ").trim() };
    return soll(r.text === "− Bsp.-Akten" && /Bsp\.-Akten in deiner Akte/.test(r.hinweis) && r.hinweis.length < 60, r);
  });
  await step("Personen: Beispielpersonen mit rotem Dreieck oben rechts, eigene Person ohne", async () => {
    await zurFamilie(page);
    const r = await page.evaluate(() => {
      const zeilen = [...document.querySelectorAll("[data-stamm-zeile]")];
      const eigen = zeilen.find((z) => z.getAttribute("data-stamm-zeile") === "Eigene Probeperson");
      const mit = zeilen.filter((z) => z.querySelector("[data-bsp-ecke]"));
      const e = mit[0]?.querySelector("[data-bsp-ecke]"); const zr = mit[0]?.getBoundingClientRect(), er = e?.getBoundingClientRect();
      const farbe = e ? getComputedStyle(e).borderTopColor : "";
      return { zeilen: zeilen.length, mit: mit.length, eigenOhne: Boolean(eigen) && !eigen.querySelector("[data-bsp-ecke]"),
        obenRechts: zr && er ? Math.abs(er.right - zr.right) < 3 && Math.abs(er.top - zr.top) < 3 : false, farbe };
    });
    return soll(r.mit > 0 && r.eigenOhne && r.obenRechts && r.farbe === "rgb(208, 2, 27)", r);
  });
  await step("Dokumente: Beispielunterlagen in der Liste mit Dreieck", async () => {
    await footer(page, "Dokumentenbibliothek");
    await page.waitForSelector("[data-bibliothek-zeile]", { timeout: 20000 }).catch(() => {});
    const r = await page.evaluate(() => ({ zeilen: document.querySelectorAll("[data-bibliothek-zeile]").length, mit: document.querySelectorAll("[data-bibliothek-zeile] [data-bsp-ecke]").length }));
    return soll(r.zeilen > 0 && r.mit > 0, r);
  });
  // Klaus 11.11.: die Vollsicherung lässt Bsp.-Akten weg – die Vorlage steckt in der App.
  await step("Vollsicherung mit Bsp.-Akten in der Akte: Register und Dateien ohne Beispiele, eigene Person dabei", async () => {
    await vaultFixture(page);
    const r = await page.evaluate(async () => {
      const f = window.__vaultFixture; const quelle = await f.browserVault();
      const ziel = await (await navigator.storage.getDirectory()).getDirectoryHandle("bsp-sicherung-" + Date.now(), { create: true });
      const daten = await f.readLocalVaultData(quelle);
      const ohne = f.beispielIdsVon(daten);
      const res = await f.writeFullFamilyBackup({ destination: ziel, source: quelle, appVersion: "probe", passwort: null, ohne });
      const ordner = await ziel.getDirectoryHandle(res.folderName);
      const reg = JSON.parse(await (await (await ordner.getFileHandle("Familienakte_Register.json")).getFile()).text());
      const bspDok = reg.documents.filter((d) => d.notes?.startsWith("Beispieldaten – frei erfunden")).length;
      const bspEin = reg.records.filter((x) => x.source === "Beispieldaten – frei erfunden").length;
      const eigen = reg.records.some((x) => x.data?.displayName === "Eigene Probeperson");
      return { ausgelassen: res.ausgelassen, bspDok, bspEin, eigen, dateien: res.manifest.files.length, pfade: res.manifest.files.map((x) => x.path), vorherBsp: ohne.size };
    });
    return soll(r.ausgelassen > 10 && r.bspDok === 0 && r.bspEin === 0 && r.eigen && r.dateien === 0 && r.vorherBsp > 10, r);
  });
  await step("Nach Neuladen bleiben die Bsp.-Akten (gespeichert)", async () => {
    await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector(".site-brand-version");
    return soll(await page.locator(".sample-data-notice").count() === 1, "Hinweis fehlt nach Neuladen");
  });
  await step("„− Bsp.-Akten“ in der Hilfe: Beispiele weg, ohne Rückfrage; eigene Person bleibt", async () => {
    await footer(page, "Hilfe");
    await knopf().click();
    await page.waitForSelector('[data-bsp-akten="fehlt"]', { timeout: 60000 });
    const dialog = await page.locator(".page-dialog").count();
    await zurFamilie(page);
    const r = await page.evaluate(() => ({ namen: [...document.querySelectorAll("[data-stamm-zeile]")].map((z) => z.getAttribute("data-stamm-zeile")), ecken: document.querySelectorAll("[data-bsp-ecke]").length }));
    return soll(dialog === 0 && r.namen.includes("Eigene Probeperson") && r.namen.length === 1 && r.ecken === 0 && await page.locator(".sample-data-notice").count() === 0, { dialog, ...r });
  });
  await step("Keine Seitenfehler", async () => soll(errors.length === 0, errors));
} finally { await browser.close(); await app.stop(); }
summary("Bsp.-Akten");
