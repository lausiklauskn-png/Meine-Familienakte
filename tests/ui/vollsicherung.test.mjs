// P5 (Plan 07.11., Punkt 2a): Vollsicherung in der Android- und der Windows-App in einen frei gewählten Ordner,
// mit Programm daneben (Android: APK; Windows: Lies-mich mit Download und SHA-256). Natives Ordner-Plugin gestellt.
import { vaultFixture } from "./_vault-fixture.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { ordnerStub } from "./_ordner-stub.mjs";
import { startApp, launchBrowser, DESKTOP, ready, footer, step, fail, summary, collectErrors } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
const meldung = async (page) => (await page.locator("[aria-live], .notice").allInnerTexts()).join(" ").replace(/\s+/g, " ").trim();

async function geraet(plattform) {
  const context = await browser.newContext(DESKTOP);
  await context.addInitScript(capacitorStub + "\n" + ordnerStub(plattform));
  const page = await context.newPage(); page.setDefaultTimeout(10000);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await vaultFixture(page);
  await page.evaluate(async () => { const f = window.__vaultFixture; await f.seedSampleFamily(await f.browserVault(), { force: true }); });
  await page.reload({ waitUntil: "networkidle" }); await ready(page);
  return { context, page, errors };
}
/** Liest die gestellte Sicherung und prüft Manifest, Register-Prüfsumme und jede Datei. */
const pruefeSicherung = (page) => page.evaluate(async () => {
  const S = window.__ordner, t = "R", hex = async (u) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", u))].map((x) => x.toString(16).padStart(2, "0")).join("");
  const ordner = [...S.ordner].map((o) => o.split("|")[1]).filter((p) => /^Familienakte_Vollsicherung_[^/]+$/.test(p));
  if (ordner.length !== 1) return { fehler: `Sicherungsordner: ${ordner.join(",")}` };
  const basis = ordner[0], lies = (p) => S.dateien.get(`${t}|${basis}/${p}`);
  const manifest = JSON.parse(new TextDecoder().decode(lies("Vollsicherung_Manifest.json")));
  const register = lies("Familienakte_Register.json");
  const regOk = (await hex(register)) === manifest.registerChecksum;
  let ok = 0; for (const f of manifest.files) { const u = lies(`Dateien/${f.path}`); if (u && u.length === f.sizeBytes && (await hex(u)) === f.checksum) ok++; }
  const daneben = [...S.dateien.keys()].map((d) => d.split("|")[1]).filter((p) => p.startsWith(basis + "/") && !p.includes("/Dateien/")).map((p) => p.slice(basis.length + 1));
  return { basis, regOk, dateien: manifest.files.length, ok, daneben, liesMich: lies("Programm_Lies-mich.txt") ? new TextDecoder().decode(lies("Programm_Lies-mich.txt")) : "" };
});

try {
  const a = await geraet("android");
  await step("Android: Sicherheitscenter öffnet, Vollsicherung ist möglich", async () => { await footer(a.page, "Sicherheitscenter"); await a.page.locator("button", { hasText: "Vollständige Sicherung erstellen" }).waitFor(); return !(await a.page.locator("button", { hasText: "Vollständige Sicherung erstellen" }).isDisabled()); });
  await step("Android: Abbrechen im Ordnerdialog schreibt nichts und meldet keinen Fehler", async () => {
    await a.page.evaluate(() => { window.__ordner.abbrechen = true; });
    await a.page.locator("button", { hasText: "Vollständige Sicherung erstellen" }).click();
    await a.page.waitForTimeout(800);
    const n = await a.page.evaluate(() => window.__ordner.dateien.size);
    await a.page.evaluate(() => { window.__ordner.abbrechen = false; });
    if (n) throw new Error(`${n} Dateien geschrieben`);
    if (/konnte nicht/.test(await meldung(a.page))) throw new Error(await meldung(a.page));
  });
  await step("Android: Vollsicherung in den gewählten Ordner (SD-Karte), mit Register, Manifest, allen Dateien und der APK", async () => {
    await a.page.locator("button", { hasText: "Vollständige Sicherung erstellen" }).click();
    await a.page.waitForFunction(() => /Installationsdatei/.test(document.body.innerText), null, { timeout: 60000 }).catch(async () => { throw new Error((await meldung(a.page)).slice(0, 300) + " · " + JSON.stringify(await a.page.evaluate(() => [...window.__ordner.dateien.keys()].slice(0, 5)))); });
    const r = await pruefeSicherung(a.page);
    if (r.fehler) throw new Error(r.fehler);
    if (!r.regOk || r.ok !== r.dateien || !r.dateien) throw new Error(JSON.stringify(r));
    if (!r.daneben.includes("Familienakte-Pro-2.28.34.apk")) throw new Error(r.daneben.join(","));
    const titel = await a.page.evaluate(() => window.__ordner.gewaehlt.at(-1));
    if (!/getrennt vom Pro-Tresor/.test(titel)) throw new Error(titel);
    return `${r.basis}: ${r.ok}/${r.dateien} Dateien per SHA-256 bestätigt; daneben ${r.daneben.join(", ")}`;
  });
  await step("Android: keine Seitenfehler", async () => { const e = a.errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); if (e.length) throw new Error(e.join(" | ")); });
  await a.context.close();

  const w = await geraet("windows");
  await step("Windows: Vollsicherung in den gewählten Ordner mit Lies-mich (Download und SHA-256)", async () => {
    await footer(w.page, "Sicherheitscenter");
    await w.page.locator("button", { hasText: "Vollständige Sicherung erstellen" }).click();
    await w.page.waitForFunction(() => /Lies-mich/.test(document.body.innerText), null, { timeout: 60000 });
    const r = await pruefeSicherung(w.page);
    if (r.fehler || !r.regOk || r.ok !== r.dateien) throw new Error(JSON.stringify(r));
    if (!r.liesMich.includes("ab".repeat(32)) || !r.liesMich.includes("https://family-projekt.de/updates/familienakte/Familienakte-Windows-2.28.34-x64-setup.exe") || !r.liesMich.includes("Get-FileHash")) throw new Error(r.liesMich);
    return `${r.ok}/${r.dateien} Dateien; Lies-mich ${r.liesMich.split("\r\n").length} Zeilen`;
  });
  await step("Windows: keine Seitenfehler", async () => { const e = w.errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); if (e.length) throw new Error(e.join(" | ")); });
  await w.context.close();
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Vollsicherung"));
