// 2.28.39 (U10, Plan 08.11.): Fehlt in einer Vollsicherung ein Original, das das Register nennt, meldet die Probe das als
// Warnung – nicht als „bestanden“ ohne Einschränkung. Und in einer vollen Akte nennt das Fenster den nächsten Schritt.
// Gestellt: Android-App mit nativem Ordner-Plugin; aus dem Manifest der Sicherung wird ein Eintrag entfernt (Datei fehlt).
import { vaultFixture } from "./_vault-fixture.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { ordnerStub } from "./_ordner-stub.mjs";
import { startApp, launchBrowser, DESKTOP, ready, footer, step, fail, summary, collectErrors } from "./_harness.mjs";

// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();
const context = await browser.newContext(DESKTOP);
await context.addInitScript(capacitorStub + "\n" + ordnerStub("android"));
const page = await context.newPage(); page.setDefaultTimeout(10000);
const errors = collectErrors(page);
const dialog = page.locator("[data-sicherung-einlesen]");
try {
  await step("Akte mit erfundener Familie, Vollsicherung erstellt", async () => {
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
    await page.evaluate(async () => { const f = window.__vaultFixture; await f.seedSampleFamily(await f.browserVault(), { force: true }); });
    await page.reload({ waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
    await footer(page, "Sicherheitscenter");
    await page.locator("button", { hasText: "Vollständige Sicherung erstellen" }).click();
    await page.waitForFunction(() => /Installationsdatei/.test(document.body.innerText), null, { timeout: 60000 });
    return soll(await page.locator("[data-zwei-wege]").count() === 1, "Satz zu den zwei Wegen zurück fehlt");
  });
  await step("Ein Original fehlt in der Sicherung: Probe meldet „mit Warnung“ statt nur „bestanden“", async () => {
    const weg = await page.evaluate(() => {
      const S = window.__ordner;
      const k = [...S.dateien.keys()].find((x) => x.endsWith("Vollsicherung_Manifest.json"));
      const m = JSON.parse(new TextDecoder().decode(S.dateien.get(k)));
      const i = m.files.findIndex((f) => /Versicherungsschein_Hausrat/.test(f.path));
      const [raus] = m.files.splice(i, 1);
      S.dateien.set(k, new TextEncoder().encode(JSON.stringify(m, null, 2)));
      return raus.path;
    });
    await page.locator("[data-sicherung-einlesen-knopf]").click();
    await dialog.waitFor({ timeout: 60000 });
    const badge = await dialog.locator(".badge").first().innerText();
    const warn = await dialog.locator("[data-einlesen-warnungen]").innerText().catch(() => "");
    soll(/mit Warnung/.test(badge) && /kommt beim Einlesen nicht zurück/.test(warn) && /Versicherungsschein_Hausrat/.test(warn), { badge, warn: warn.slice(0, 200), weg });
    return `${badge} · ${warn.split("\n")[0]}`;
  });
  await step("Volle Akte: kein „Jetzt einlesen“, aber der nächste Schritt und „Zur Eingangszentrale ›“", async () => {
    soll(!(await dialog.locator("[data-einlesen-start]").count()), "Einlesen in volle Akte angeboten");
    const naechst = await dialog.locator("[data-einlesen-naechster-schritt]").innerText().catch(() => "");
    soll(/01_Dokumente/.test(naechst) && /geplant/.test(naechst), naechst.slice(0, 200));
    await dialog.locator("[data-einlesen-zum-eingang]").click();
    await page.locator(".breadcrumb", { hasText: "Eingangszentrale" }).waitFor({ timeout: 5000 });
    return soll(!(await dialog.count()), "Fenster bleibt offen");
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Sicherung mit Warnung"));
