// P7 (Plan 07.11., Punkt 3): Demo als Kopie der eigenen Daten; Original bleibt unverändert; vor dem Übernehmen „Was ändert sich?“.
import { vaultFixture } from "./_vault-fixture.mjs";
import { demoUmschalten, demoMenue } from "./_demo.mjs";
import { startApp, launchBrowser, DESKTOP, ready, step, fail, summary, collectErrors } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
const context = await browser.newContext(DESKTOP);
const page = await context.newPage(); page.setDefaultTimeout(10000);
page.on("dialog", (d) => d.accept());
const errors = collectErrors(page);
const titel = async () => { await vaultFixture(page); return page.evaluate(async () => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return d.records.map((r) => r.data?.title || r.data?.name || r.id); }); };
const anlegen = (t) => page.evaluate(async (t) => { const f = window.__vaultFixture; await f.createLocalFamilyRecord(await f.browserVault(), { recordType: "task", data: { title: t, status: "offen" }, source: "Manuelle Eingabe" }); }, t);
try {
  await step("Eigene Akte mit eigener Aufgabe", async () => {
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
    await anlegen("Eigene Aufgabe Probe");
    await page.reload({ waitUntil: "networkidle" }); await ready(page);
    if (!(await titel()).includes("Eigene Aufgabe Probe")) throw new Error("fehlt");
  });
  await step("Demo starten: arbeitet an einer Kopie der eigenen Daten (keine Beispielfamilie)", async () => {
    await demoUmschalten(page, true);
    await page.locator('.demo-knopf-schalter[data-demo-kopie="ja"]').waitFor();
    const t = await titel();
    if (!t.includes("Eigene Aufgabe Probe")) throw new Error(t.slice(0, 5).join(","));
    const beispiel = await page.evaluate(async () => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return d.records.filter((r) => String(r.source || "").startsWith("Beispieldaten")).length; });
    if (beispiel) throw new Error(`${beispiel} Beispieleinträge in der Kopie`);
    return `${t.length} Einträge in der Kopie`;
  });
  await step("In der Demo ändern, ohne Übernahme verlassen: eigene Akte unverändert", async () => {
    await anlegen("Nur in der Demo");
    await demoUmschalten(page, false);
    const t = await titel();
    if (t.includes("Nur in der Demo")) throw new Error("Original verändert");
    return `${t.length} Einträge im Original`;
  });
  await step("Erneut starten: Demo läuft mit ihren Änderungen weiter, solange die eigene Akte unverändert ist", async () => {
    await demoUmschalten(page, true);
    await page.locator('.demo-knopf-schalter[data-demo-kopie="ja"]').waitFor();
    if (!(await titel()).includes("Nur in der Demo")) throw new Error("Demo verworfen");
    await Promise.all([page.waitForURL((u) => !u.searchParams.has("demo")), demoMenue(page, "Demo löschen und verlassen").then(() => page.getByRole("button", { name: "Ja, fortfahren", exact: true }).click())]);
    await page.waitForLoadState("networkidle");
  });
  await step("Nach dem Löschen frisch gestartet, ändern, „Übernehmen …“: Liste „Was ändert sich?“ vor dem Schreiben", async () => {
    await demoUmschalten(page, true);
    await page.locator('.demo-knopf-schalter[data-demo-kopie="ja"]').waitFor();
    if ((await titel()).includes("Nur in der Demo")) throw new Error("gelöschte Demo nicht verworfen");
    await anlegen("Aus der Demo übernommen");
    await Promise.all([page.waitForURL((u) => !u.searchParams.has("demo")), demoMenue(page, "Übernehmen …")]);
    const dlg = page.locator("[data-demo-uebernahme]"); await dlg.waitFor({ timeout: 60000 });
    const z = await dlg.locator("[data-demo-zaehlung]").innerText();
    const liste = await dlg.locator("[data-demo-liste]").innerText();
    if (!/^1 neu · 0 geändert · 0 entfernt$/.test(z.trim()) || !liste.includes("Aus der Demo übernommen")) throw new Error(`${z} · ${liste}`);
    if ((await titel()).includes("Aus der Demo übernommen")) throw new Error("vor dem Bestätigen geschrieben");
    return `${z.trim()} · ${liste.replace(/\s+/g, " ").slice(0, 60)}`;
  });
  await step("Übernehmen schreibt die Änderung in die eigene Akte", async () => {
    await page.locator("[data-demo-uebernehmen-start]").click();
    await page.locator("[data-demo-uebernahme]").waitFor({ state: "detached", timeout: 60000 });
    const t = await titel();
    if (!t.includes("Aus der Demo übernommen") || !t.includes("Eigene Aufgabe Probe")) throw new Error(t.join(","));
    const m = (await page.locator("[aria-live], .notice").allInnerTexts()).join(" ");
    return m.match(/Demo übernommen[^.]*\./)?.[0] || m.slice(0, 100);
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); if (e.length) throw new Error(e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Demo-Kopie"));
