// Stufe B (Plan 08.11.2026, Entscheidung 6): „Papierkorb leeren“ – aussortierte Dokumente endgültig löschen, nur von Hand,
// nur nach Rückfrage mit Haken. Danach Eintrag weg, Datei weg, Protokoll nennt es. Alle Dokumente erfunden.
import { startApp, launchBrowser, DESKTOP, ready, footer, step, fail, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage(); page.setDefaultTimeout(15000);
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  const ids = await page.evaluate(async () => {
    const f = window.__vaultFixture; const v = await f.browserVault();
    const neu = async (n, titel) => (await f.saveLocalDocument(v, new File([`Inhalt ${titel} (erfunden)`], n, { type: "text/plain" }), { category: "Haushalt Probe", documentDate: "2026-10-02", notes: null, titel })).id;
    const a = await neu("werbung_alt.txt", "Werbung Möbelhaus Eichenblatt"), b = await neu("bleibt.txt", "Bleibt in der Akte");
    await f.dokumenteAussortieren(v, [a]);
    return { a, b };
  });
  await page.reload({ waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  const register = () => page.evaluate(async () => { const f = window.__vaultFixture; return f.readLocalVaultData(await f.browserVault()); });
  const pfad = (await register()).documents.find((d) => d.id === ids.a).storedPath;
  await footer(page, "Dokumentenbibliothek");
  await page.locator("button", { hasText: "Alle ansehen" }).first().click();
  const leiste = page.locator('[data-auswahl-leiste="aussortierte Dokumente"]');
  await step("„Aussortiert (1)“: Haken zeigt „Zurückholen“ und „Endgültig löschen …“", async () => {
    await page.locator("[data-aussortiert] summary").click().catch(() => {});
    await page.locator(`[data-aussortiert-wahl="${ids.a}"]`).check();
    const loeschen = leiste.locator('[data-auswahl-aktion="loeschen"]');
    return soll(await loeschen.isVisible() && await leiste.locator('[data-auswahl-aktion="zurueckholen"]').isVisible(), "Knöpfe fehlen") && await loeschen.innerText();
  });
  await step("Rückfrage: „Endgültig löschen“ erst nach dem Haken; Abbrechen löscht nichts", async () => {
    await leiste.locator('[data-auswahl-aktion="loeschen"]').click();
    const d = page.locator("[data-papierkorb-leeren]"); await d.waitFor();
    soll(await d.locator("[data-papierkorb-los]").isDisabled(), "Löschen ohne Haken möglich");
    const text = (await d.innerText()).replace(/\s+/g, " ");
    await d.locator("button", { hasText: "Abbrechen" }).click(); await d.waitFor({ state: "detached" });
    const r = await register();
    return soll(/nicht rückgängig/.test(text) && r.documents.some((x) => x.id === ids.a), { text: text.slice(0, 80), n: r.documents.length }) && text.slice(0, 120);
  });
  await step("Mit Haken löschen: Eintrag weg, Datei weg, Protokoll „Endgültig gelöscht“, das andere Dokument bleibt", async () => {
    await page.locator(`[data-aussortiert-wahl="${ids.a}"]`).check().catch(() => {});
    await leiste.locator('[data-auswahl-aktion="loeschen"]').click();
    const d = page.locator("[data-papierkorb-leeren]"); await d.waitFor();
    await d.locator("[data-papierkorb-sicher] input").check(); await d.locator("[data-papierkorb-los]").click();
    await d.waitFor({ state: "detached", timeout: 20000 });
    const meldung = await page.locator("[data-aussortiert-meldung]").innerText().catch(() => "");
    const r = await register();
    const datei = await page.evaluate(async (p) => { const f = window.__vaultFixture; try { const teile = p.split("/").filter(Boolean); let dir = await f.browserVault(); dir = await dir.getDirectoryHandle(teile[0]); for (const t of teile.slice(1, -1)) dir = await dir.getDirectoryHandle(t); await dir.getFileHandle(teile.at(-1)); return "da"; } catch { return "weg"; } }, pfad);
    const log = r.auditLog.find((e) => e.action === "Endgültig gelöscht");
    soll(!r.documents.some((x) => x.id === ids.a) && r.documents.some((x) => x.id === ids.b) && datei === "weg" && log && /1 Dokument endgültig gelöscht, 1 Datei entfernt/.test(meldung), { meldung, datei, log: Boolean(log), n: r.documents.length });
    return meldung;
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Papierkorb leeren"));
