// Stufe H (Plan 08.11.2026, Entscheidung 11): das Original-Foto bleibt im Stapel neben dem geraden PDF („bearbeitet · Original dabei“)
// und wandert beim Einordnen mit; „Teilen“ an der Unterlage gibt die Datei an das Android-Teilen-Fenster (Hülle gestellt).
import { startApp, launchBrowser, DESKTOP, ready, footer, step, fail, summary, collectErrors } from "./_harness.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext({ ...DESKTOP, serviceWorkers: "block" });
  await context.addInitScript(capacitorStub);
  const page = await context.newPage(); page.setDefaultTimeout(20000); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  await page.evaluate(async () => { const f = window.__vaultFixture; await f.seedSampleFamily(await f.browserVault(), { force: true }); });
  await page.reload({ waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);

  await step("Bibliothek: „Teilen“ an der aufgeklappten Karte gibt die Datei vollständig an das Teilen-Fenster der Hülle", async () => {
    await footer(page, "Dokumentenbibliothek");
    await page.locator("button", { hasText: "Alle ansehen" }).first().click();
    const zeile = page.locator("[data-bibliothek-zeile]").first(); await zeile.waitFor();
    const id = await zeile.getAttribute("data-bibliothek-zeile");
    await zeile.locator("[data-bibliothek-auge]").click();
    const karte = page.locator(`[data-bibliothek-karte="${id}"]`).first(); await karte.waitFor();
    const knopf = karte.locator("[data-dokument-teilen]"); soll((await knopf.count()) === 1, "Kein Teilen-Knopf");
    await knopf.click();
    await page.waitForFunction(() => (window.__capState.geteilt || []).length === 1, null, { timeout: 20000 });
    const g = await page.evaluate(() => window.__capState.geteilt[0]);
    // Geteilt wird unter dem Namen des Dokuments (nicht dem gespeicherten Dateinamen mit Datum und Prüfsumme davor).
    const groesse = await page.evaluate(async (docId) => { const f = window.__vaultFixture; const h = await f.browserVault(); const file = await f.readLocalDocumentFile(h, docId); const d = (await f.readLocalVaultData(h)).documents.find((x) => x.id === docId); return { bytes: file.size, name: d.originalName }; }, id);
    const meldung = await page.locator(".notice, [aria-live]").allInnerTexts();
    return soll(g.bytes === groesse.bytes && g.bytes > 0 && g.name === groesse.name && /gewählte App/.test(meldung.join(" ")), { g, groesse, meldung }) && `${g.name} · ${g.bytes} Bytes an die Hülle`;
  });

  const bild = await page.evaluate(async () => {
    const a = document.createElement("canvas"); a.width = 1200; a.height = 1600; const g = a.getContext("2d");
    g.fillStyle = "#3a3a3a"; g.fillRect(0, 0, a.width, a.height);
    g.save(); g.translate(600, 800); g.rotate(0.12); g.fillStyle = "#fafafa"; g.fillRect(-380, -537, 760, 1074);
    g.fillStyle = "#222"; for (let i = 0; i < 18; i++) g.fillRect(-300, -460 + i * 50, 420 + (i % 3) * 60, 10); g.restore();
    return Array.from(new Uint8Array(await (await new Promise((ok) => a.toBlob(ok, "image/png"))).arrayBuffer()));
  });
  await step("Stapel: das gerade gezogene Blatt trägt „bearbeitet · Original dabei“, der Vermerk nennt die Bearbeitung, das Original lässt sich ansehen", async () => {
    await footer(page, "Eingangszentrale");
    await page.locator("[data-stapel-start]").setInputFiles([{ name: "Original-Probe.png", mimeType: "image/png", buffer: Buffer.from(bild) }]);
    await page.locator("[data-stapel-seite]").waitFor();
    await page.locator('[data-stapel-lauf="fertig"]').waitFor({ timeout: 90000 });
    const zeile = page.locator("[data-stapel-zeile]").first();
    soll((await zeile.locator("[data-stapel-bearbeitet]").count()) === 1, "Abzeichen fehlt");
    await zeile.locator(".fa-stapel-name").click();
    const vermerk = page.locator("[data-stapel-original]"); await vermerk.waitFor();
    const text = (await vermerk.innerText()).replace(/\s+/g, " ");
    soll((await vermerk.getAttribute("data-stapel-original")) === "1" && /gerade gezogen/.test(text) && /Original-Foto bleibt erhalten/.test(text), text);
    soll((await page.locator("[data-stapel-original-ansehen]").count()) === 1, "Kein „Original ansehen“");
    return text.slice(0, 120);
  });
  await step("Einordnen: das Original wandert mit in den Eingang (bleibt auch nach dem Neuladen am Arbeitsstand)", async () => {
    await page.locator("[data-stapel-einordnen]").click();
    await page.locator("h1", { hasText: "Eingangszentrale" }).waitFor({ timeout: 30000 });
    await page.locator(".intake-queue-item", { hasText: "Original-Probe" }).first().waitFor({ timeout: 60000 });
    const stand = await page.evaluate(() => new Promise((ok, nein) => {
      const r = indexedDB.open("FamilienakteStapel1"); r.onerror = () => nein(r.error);
      r.onsuccess = () => { const t = r.result.transaction("eingang-dateien", "readonly"); const q = t.objectStore("eingang-dateien").getAll(); q.onsuccess = () => { ok(q.result.map((e) => ({ name: e.file?.name, originale: e.scan?.originals?.length || 0, bearbeitung: e.scan?.bearbeitung || "" }))); r.result.close(); }; };
    }));
    const e = stand.find((x) => /Original-Probe/.test(x.name || ""));
    return soll(e && e.originale === 1 && /gerade gezogen/.test(e.bearbeitung), stand) && `Original dabei · „${e.bearbeitung}“`;
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Teilen und Original-Foto"));
