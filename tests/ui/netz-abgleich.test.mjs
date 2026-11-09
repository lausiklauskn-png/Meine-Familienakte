// Stufe F (Plan 08.11.2026, Entscheidung 12): Abgleich im eigenen Netz. Gerät 1 wird Gastgeber (Code, Notfallblatt, erster Stand),
// Gerät 2 findet es, koppelt mit dem Code (falscher Code abgewiesen) und holt alles; eine Änderung auf Gerät 2 kommt beim nächsten
// Abgleich auf Gerät 1 an. Netz und Android-Hülle gestellt; Inhalte erfunden.
import { vaultFixture } from "./_vault-fixture.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { ordnerStub } from "./_ordner-stub.mjs";
import { netzStub, netzBruecke } from "./_netz-stub.mjs";
import { startApp, launchBrowser, DESKTOP, ready, footer, step, fail, summary, collectErrors } from "./_harness.mjs";
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();
const netz = netzBruecke();
async function geraet() {
  const context = await browser.newContext(DESKTOP);
  await context.addInitScript(capacitorStub + "\n" + ordnerStub("android") + "\n" + netzStub);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  await context.exposeFunction("__netz", netz.handler(page));
  return { context, page, errors: collectErrors(page) };
}
const zaehlen = (page) => page.evaluate(async () => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return { dokumente: d.documents.length, eintraege: d.records.length }; });
const warteMeldung = (page, re) => page.waitForFunction((q) => new RegExp(q).test([...document.querySelectorAll("[aria-live], .notice")].map((e) => e.textContent).join(" ")), re.source, { timeout: 120000 });
async function abgleichFertig(page, ms = 180000) {
  const ab = page.locator("[data-laufwerk-abgleich]"); const ende = Date.now() + ms;
  while (Date.now() < ende) { if (!(await ab.count())) return; const f = (await ab.locator(".form-error").count()) ? await ab.locator(".form-error").innerText() : ""; if (f) throw new Error(`Fehler im Abgleich-Fenster: ${f}`); await page.waitForTimeout(500); }
  throw new Error("Abgleich-Fenster blieb offen: " + (await ab.innerText()).replace(/\s+/g, " ").slice(0, 400));
}
try {
  const a = await geraet(); let vorher, code, personId;
  await step("Gerät 1: Familie da; Karte bietet „Dieses Gerät als Gastgeber“ und „Mit Gastgeber koppeln“", async () => {
    await a.page.goto(app.base, { waitUntil: "networkidle" }); await ready(a.page); await vaultFixture(a.page);
    await a.page.evaluate(async () => { const f = window.__vaultFixture; await f.seedSampleFamily(await f.browserVault(), { force: true }); });
    await a.page.reload({ waitUntil: "networkidle" }); await ready(a.page); await vaultFixture(a.page);
    vorher = await zaehlen(a.page);
    personId = await a.page.evaluate(async () => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return d.records.find((r) => r.recordType === "person").id; });
    await footer(a.page, "Sicherheitscenter");
    await a.page.locator("[data-laufwerk-gastgeber]").waitFor();
    return soll((await a.page.locator('[data-laufwerk-netz="ja"]').count()) === 1 && (await a.page.locator("[data-laufwerk-gast]").count()) === 1, "Netz-Knöpfe fehlen") && `${vorher.dokumente} Dokumente`;
  });
  await step("Gerät 1 wird Gastgeber: Code mit 9 Ziffern, Notfallblatt, erster Abgleich gibt die Originale", async () => {
    await a.page.locator("[data-laufwerk-gastgeber]").click();
    const d = a.page.locator("[data-laufwerk-gastgeber-dialog]"); await d.waitFor();
    code = (await d.locator("[data-gastgeber-code]").innerText()).replace(/\D/g, "");
    soll(/^\d{9}$/.test(code), code);
    await d.locator("[data-gastgeber-los]").click();
    const blatt = a.page.locator("[data-notfallblatt]"); await blatt.waitFor({ timeout: 60000 });
    await blatt.locator("[data-notfall-bestaetigung] input").check(); await blatt.locator("[data-notfall-fertig]").click();
    const ab = a.page.locator("[data-laufwerk-abgleich]"); await ab.waitFor({ timeout: 120000 });
    soll(/noch kein Stand/.test(await ab.innerText()), "kein erster Stand");
    await ab.locator("[data-laufwerk-los-abgleich]").click(); await abgleichFertig(a.page);
    await warteMeldung(a.page, /abgeglichen/);
    const zeile = a.page.locator("[data-laufwerk]"); await zeile.waitFor();
    const text = (await zeile.innerText()).replace(/\s+/g, " ");
    soll(/dieses Gerät ist Gastgeber/.test(text) && (await zeile.getAttribute("data-laufwerk-da")) === "ja", text);
    await zeile.locator("[data-laufwerk-code-zeigen]").click();
    const gezeigt = (await zeile.locator("[data-laufwerk-code]").innerText()).replace(/\D/g, "");
    return soll(gezeigt === code, { gezeigt, code }) && `Code ${code.slice(0, 3)} … · Gastgeber angeschlossen · ${netz.zustand.host ? "Dienst läuft" : "Dienst aus"}`;
  });
  const b = await geraet();
  await step("Gerät 2 (leer) findet den Gastgeber; falscher Code abgewiesen; richtiger Code koppelt und holt alles", async () => {
    await b.page.goto(app.base, { waitUntil: "networkidle" }); await b.page.waitForSelector(".site-brand-version", { timeout: 120000 }); await vaultFixture(b.page);
    soll((await zaehlen(b.page)).dokumente === 0, "Gerät 2 nicht leer");
    await footer(b.page, "Sicherheitscenter");
    await b.page.locator("[data-laufwerk-gast]").click();
    const d = b.page.locator("[data-laufwerk-gast-dialog]"); await d.waitFor();
    await d.locator("[data-gast-treffer]").waitFor({ timeout: 20000 });
    soll((await d.locator("[data-gast-wahl]").count()) === 1 && (await d.locator("[data-gast-wahl]").isChecked()), "Gastgeber nicht gefunden oder nicht vorgewählt");
    await d.locator("[data-gast-code]").fill("000000000"); await d.locator("[data-gast-los]").click();
    await d.locator("[data-gast-fehler]").waitFor({ timeout: 30000 });
    const f = await d.locator("[data-gast-fehler]").innerText();
    await d.locator("[data-gast-code]").fill(code); await d.locator("[data-gast-los]").click();
    const ab = b.page.locator("[data-laufwerk-abgleich]"); await ab.waitFor({ timeout: 120000 });
    await ab.locator("[data-laufwerk-los-abgleich]").click(); await abgleichFertig(b.page);
    await warteMeldung(b.page, /abgeglichen/);
    const nach = await zaehlen(b.page);
    soll(nach.dokumente === vorher.dokumente && nach.eintraege === vorher.eintraege, { vorher, nach });
    const ok = await b.page.evaluate(async () => { const f = window.__vaultFixture, h = await f.browserVault(), d = await f.readLocalVaultData(h); const doc = d.documents.find((x) => x.checksum); const file = await f.readLocalDocumentFile(h, doc.id); const hex = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))].map((x) => x.toString(16).padStart(2, "0")).join(""); return hex === doc.checksum; });
    return soll(ok, "Original stimmt nicht") && `${f} · ${nach.dokumente} Dokumente, ${nach.eintraege} Einträge über das Netz geholt`;
  });
  await step("Gerät 2 ändert eine Person; Gerät 1 „Jetzt abgleichen“ bekommt die Änderung ohne Frage", async () => {
    await b.page.evaluate(async (id) => { const f = window.__vaultFixture; await f.updateLocalPersonContact(await f.browserVault(), id, { phone: "0170 7777777" }); }, personId);
    await b.page.locator("[data-laufwerk-abgleichen]").click();
    const ab2 = b.page.locator("[data-laufwerk-abgleich]"); await ab2.waitFor({ timeout: 120000 });
    await ab2.locator("[data-laufwerk-los-abgleich]").click(); await abgleichFertig(b.page);
    await a.page.locator("[data-laufwerk-abgleichen]").click();
    const ab = a.page.locator("[data-laufwerk-abgleich]"); await ab.waitFor({ timeout: 120000 });
    soll(!(await ab.locator("[data-laufwerk-konflikte]").count()) && /1 Änderungen werden still übernommen/.test((await ab.innerText()).replace(/\s+/g, " ")), (await ab.innerText()).slice(0, 300));
    await ab.locator("[data-laufwerk-los-abgleich]").click(); await abgleichFertig(a.page);
    const telefon = await a.page.evaluate(async (id) => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return JSON.stringify(d.records.find((r) => r.id === id).data); }, personId);
    return soll(/0170 7777777/.test(telefon), telefon.slice(0, 200)) && "Änderung kam über das Netz an";
  });
  await step("Gastgeber weg (App zu): Gerät 2 zeigt „nicht angeschlossen“ und meldet es ehrlich", async () => {
    netz.zustand.host = null;
    await b.page.evaluate(() => window.dispatchEvent(new Event("familienakte:laufwerk-pruefen")));
    await b.page.waitForFunction(() => document.querySelector("[data-laufwerk]")?.getAttribute("data-laufwerk-da") === "nein", null, { timeout: 30000 });
    await b.page.locator("[data-laufwerk-abgleichen]").click();
    await warteMeldung(b.page, /nicht angeschlossen/);
    return "ehrlich: nicht angeschlossen";
  });
  await step("Keine Seitenfehler", async () => { const e = [...a.errors, ...b.errors].filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Abgleich im Netz"));
