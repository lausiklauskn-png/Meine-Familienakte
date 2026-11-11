// Stufe I (Plan 08.11.2026, Punkt 10b): Paket per Teilen. Gerät 1 („PC“) packt seine Akte als verschlüsselte Datei für ein neues Gerät, ohne Namen (Passwort,
// Notfallblatt); Gerät 2 (leer) liest sie ein – falsches Passwort abgewiesen, richtiges holt alles samt Originalen. Gerät 2 ändert eine
// Person und schickt nur diese Änderung zurück; Gerät 1 liest ohne Passwort (Schlüssel gemerkt) und übernimmt still. Kein Netz, keine Platte.
import { vaultFixture } from "./_vault-fixture.mjs";
import { startApp, launchBrowser, DESKTOP, ready, footer, step, fail, summary, collectErrors } from "./_harness.mjs";
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const PASSWORT = "Paket-Herbst-2026!";
const app = await startApp();
const browser = await launchBrowser();
async function geraet() {
  const context = await browser.newContext({ ...DESKTOP, acceptDownloads: true });
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  return { context, page, errors: collectErrors(page) };
}
const zaehlen = (page) => page.evaluate(async () => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return { dokumente: d.documents.length, eintraege: d.records.length }; });
const warteMeldung = (page, re) => page.waitForFunction((q) => new RegExp(q).test([...document.querySelectorAll("[aria-live], .notice")].map((e) => e.textContent).join(" ")), re.source, { timeout: 120000 });
/** Das gepackte Paket als Bytes aus dem Fenster holen (die App gibt es sonst an Teilen oder Download). */
const paketHolen = async (page) => { await page.waitForFunction(() => Boolean(window.__faPaket), null, { timeout: 120000 }); const r = await page.evaluate(async () => { const f = window.__faPaket; window.__faPaket = null; return { name: f.name, bytes: Array.from(new Uint8Array(await f.arrayBuffer())) }; }); return { name: r.name, buffer: Buffer.from(r.bytes) }; };
/** Wartet, bis das Vorschau-Fenster zu ist; ein Fehler im Fenster wird genannt statt eines stummen Timeouts. */
async function fensterZu(page, ms = 120000) {
  const v = page.locator("[data-paket-vorschau]"); const ende = Date.now() + ms;
  while (Date.now() < ende) { if (!(await v.count())) return; const f = (await v.locator(".form-error").count()) ? await v.locator(".form-error").innerText() : ""; if (f) throw new Error(`Fehler im Paket-Fenster: ${f}`); await page.waitForTimeout(300); }
  throw new Error("Paket-Fenster blieb offen: " + (await v.innerText()).replace(/\s+/g, " ").slice(0, 300));
}
const einlesenFertig = async (page) => { const v = page.locator("[data-paket-vorschau]"); await v.waitFor({ timeout: 60000 }); return v; };
try {
  const a = await geraet(); let vorher, paket, personId;
  await step("Gerät 1: Karte „Paket per Teilen“ im Sicherheitscenter, noch kein Partner", async () => {
    await a.page.goto(app.base, { waitUntil: "networkidle" }); await ready(a.page); await vaultFixture(a.page);
    await a.page.evaluate(async () => { const f = window.__vaultFixture; await f.seedSampleFamily(await f.browserVault(), { force: true }); });
    await a.page.reload({ waitUntil: "networkidle" }); await ready(a.page); await vaultFixture(a.page);
    vorher = await zaehlen(a.page);
    personId = await a.page.evaluate(async () => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return d.records.find((r) => r.recordType === "person").id; });
    await footer(a.page, "Sicherheitscenter");
    const karte = a.page.locator("[data-paket-karte]"); await karte.waitFor();
    return soll((await karte.getAttribute("data-paket-karte")) === "0", "Partner vorhanden") && `${vorher.dokumente} Dokumente, ${vorher.eintraege} Einträge`;
  });
  await step("Gerät 1 benennt sich per Knopf „PC“ (Meine Geräte, ohne Tippen)", async () => {
    const k = a.page.locator("[data-meine-geraete]"); await k.waitFor();
    soll(await k.locator("[data-geraet-benennen]").count() === 1, "Gerät nicht als unbenannt erkannt");
    await k.locator('[data-geraet-art="PC"]').click(); await k.locator("[data-geraet-speichern]").click();
    const name = await k.locator("[data-geraet-name]").innerText();
    return soll(name === "PC" && !(await k.locator("[data-geraet-benennen]").count()), name) && name;
  });
  await step("Gerät 1: Paket an „Neues Gerät“ – Passwort, Notfallblatt, eine .fav-Datei mit allen Einträgen und Originalen", async () => {
    await a.page.locator("[data-paket-erstellen]").click();
    const d = a.page.locator("[data-paket-dialog]"); await d.waitFor();
    await d.locator("[data-paket-ziel]").selectOption("neu");
    soll(await d.locator("[data-paket-name]").count() === 0, "Namensfeld für das neue Gerät noch da");
    await d.locator("[data-passwort]").fill(PASSWORT); await d.locator("[data-passwort-wieder]").fill(PASSWORT);
    await d.locator("[data-paket-los]").click();
    const blatt = a.page.locator("[data-notfallblatt]"); await blatt.waitFor({ timeout: 60000 });
    await blatt.locator("[data-notfall-bestaetigung] input").check(); await blatt.locator("[data-notfall-fertig]").click();
    paket = await paketHolen(a.page);
    const kopf = JSON.parse(paket.buffer.subarray(0, paket.buffer.indexOf(10)).toString("utf8"));
    const rest = paket.buffer.subarray(paket.buffer.indexOf(10) + 1).toString("latin1");
    soll(kopf.von?.name === "PC", kopf.von);
    soll(kopf.format === "familienakte-paket" && kopf.eintraege === vorher.dokumente + vorher.eintraege || kopf.eintraege >= vorher.eintraege, kopf);
    soll(!/recordType|originalName/.test(rest), "Inhalt steht unverschlüsselt im Paket");
    const partner = a.page.locator("[data-paket-partner]"); await partner.waitFor();
    return `${paket.name} · ${(paket.buffer.length / 1024).toFixed(0)} KB · ${kopf.eintraege} Einträge, ${kopf.originale} Originale · Partner „${await partner.locator("strong").innerText()}“ vorläufig gemerkt`;
  });
  const b = await geraet();
  await step("Gerät 2 (leer): falsches Passwort abgewiesen, richtiges liest alles ein – Einträge und Originale stimmen", async () => {
    await b.page.goto(app.base, { waitUntil: "networkidle" }); await b.page.waitForSelector(".site-brand-version", { timeout: 120000 }); await vaultFixture(b.page);
    soll((await zaehlen(b.page)).dokumente === 0, "Gerät 2 nicht leer");
    await footer(b.page, "Sicherheitscenter");
    const k = b.page.locator("[data-meine-geraete]"); await k.waitFor();
    await k.locator('[data-geraet-art="Tablet"]').click(); await k.locator("[data-geraet-zusatz]").fill("im Wohnzimmer"); await k.locator("[data-geraet-speichern]").click();
    soll(await k.locator("[data-geraet-name]").innerText() === "Tablet im Wohnzimmer", "Name mit Zusatz");
    await b.page.locator("[data-paket-datei]").setInputFiles({ name: paket.name, mimeType: "application/octet-stream", buffer: paket.buffer });
    const pw = b.page.locator("[data-sicherung-passwort-dialog]"); await pw.waitFor();
    await pw.locator("input[type=password]").first().fill("falsch-falsch-falsch"); await pw.locator("[data-zugang-los]").click();
    await pw.locator(".form-error").waitFor({ timeout: 60000 });
    const f = await pw.locator(".form-error").innerText();
    await pw.locator("input[type=password]").first().fill(PASSWORT); await pw.locator("[data-zugang-los]").click();
    const v = await einlesenFertig(b.page);
    const text = (await v.locator("[data-paket-zaehlung]").innerText()).replace(/\s+/g, " ");
    // Das Paket trägt auch Verknüpfungen und Notizen, darum mehr Einträge als Dokumente + Datensätze.
    const neu = Number((text.match(/(\d+) Einträge kommen/) || [])[1]);
    soll(neu >= vorher.dokumente + vorher.eintraege && !(await v.locator("[data-paket-konflikte]").count()), text);
    await v.locator("[data-paket-los-einlesen]").click(); await fensterZu(b.page);
    await warteMeldung(b.page, /eingelesen/);
    const nach = await zaehlen(b.page);
    soll(nach.dokumente === vorher.dokumente && nach.eintraege === vorher.eintraege, { vorher, nach });
    const ok = await b.page.evaluate(async () => { const f = window.__vaultFixture, h = await f.browserVault(), d = await f.readLocalVaultData(h); const doc = d.documents.find((x) => x.checksum); const file = await f.readLocalDocumentFile(h, doc.id); const hex = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))].map((x) => x.toString(16).padStart(2, "0")).join(""); return hex === doc.checksum; });
    await b.page.locator('[data-meine-geraete] [data-geraet-anderes="PC"]').waitFor();
    return soll(ok, "Original stimmt nicht") && `PC erscheint von selbst · ${f} · ${nach.dokumente} Dokumente, ${nach.eintraege} Einträge aus dem Paket`;
  });
  await step("Gerät 2 ändert eine Person; „Paket an“ Gerät 1 trägt nur diese Änderung (ohne Passwort, Schlüssel gemerkt)", async () => {
    await b.page.evaluate(async (id) => { const f = window.__vaultFixture; await f.updateLocalPersonContact(await f.browserVault(), id, { phone: "0170 5555555" }); }, personId);
    const partner = b.page.locator("[data-paket-partner]"); await partner.waitFor();
    await partner.locator("[data-paket-an]").click();
    const r = await paketHolen(b.page);
    const kopf = JSON.parse(r.buffer.subarray(0, r.buffer.indexOf(10)).toString("utf8"));
    soll(kopf.eintraege === 1 && kopf.an?.id, kopf);
    paket = r;
    return `1 Eintrag, ${kopf.originale} Originale, adressiert an „${kopf.an.name}“`;
  });
  await step("Gerät 1 liest das Rückpaket ohne Passwort: „1 Änderungen werden still übernommen“, Telefon angekommen", async () => {
    await a.page.locator("[data-paket-datei]").setInputFiles({ name: paket.name, mimeType: "application/octet-stream", buffer: paket.buffer });
    const v = await einlesenFertig(a.page);
    const text = (await v.locator("[data-paket-zaehlung]").innerText()).replace(/\s+/g, " ");
    soll(/1 Änderungen werden still übernommen/.test(text) && /0 Einträge kommen/.test(text), text);
    await v.locator("[data-paket-los-einlesen]").click(); await fensterZu(a.page);
    await warteMeldung(a.page, /eingelesen/);
    const telefon = await a.page.evaluate(async (id) => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return JSON.stringify(d.records.find((r) => r.id === id).data); }, personId);
    const partner = await a.page.locator("[data-paket-partner]").count();
    const name = await a.page.locator("[data-paket-partner] strong").innerText();
    await a.page.locator('[data-meine-geraete] [data-geraet-anderes="Tablet im Wohnzimmer"]').waitFor();
    return soll(/0170 5555555/.test(telefon) && partner === 1 && name === "Tablet im Wohnzimmer", { telefon: telefon.slice(0, 120), partner, name }) && "still übernommen, ein Partner, „Neues Gerät“ heißt jetzt „Tablet im Wohnzimmer“";
  });
  await step("Gerät 1: nichts geändert → „kein Paket nötig“", async () => {
    await a.page.locator("[data-paket-partner] [data-paket-an]").click();
    await warteMeldung(a.page, /kein Paket nötig/);
    return "ehrlich: nichts zu senden";
  });
  await step("Keine Seitenfehler", async () => { const e = [...a.errors, ...b.errors].filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Paket per Teilen"));
