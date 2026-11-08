// Stufe C (Plan 08.11.2026): gemeinsame Festplatte. Zwei „Geräte“ (zwei Browser-Zusammenhänge mit gestelltem Android-Ordner-Plugin);
// die Platte wandert als gesicherter Stub-Inhalt von einem zum anderen. Gerät 1 bereitet vor (Kennung, Passwort, Notfallblatt) und
// gibt seine Akte; Gerät 2 verbindet mit Passwort und holt alles; beide ändern denselben Eintrag → Frage; Platte abgezogen → ehrlich.
import { vaultFixture } from "./_vault-fixture.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { ordnerStub } from "./_ordner-stub.mjs";
import { startApp, launchBrowser, DESKTOP, ready, footer, step, fail, summary, collectErrors } from "./_harness.mjs";
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const PASSWORT = "Herbstlaub-Platte-2026";
const app = await startApp();
const browser = await launchBrowser();
async function geraet() {
  const context = await browser.newContext(DESKTOP);
  await context.addInitScript(capacitorStub + "\n" + ordnerStub("android"));
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  return { context, page, errors: collectErrors(page) };
}
const zaehlen = (page) => page.evaluate(async () => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return { dokumente: d.documents.length, eintraege: d.records.length }; });
const meldung = async (page) => (await page.locator("[aria-live], .notice").allInnerTexts()).join(" ").replace(/\s+/g, " ").trim();
const warteMeldung = (page, re) => page.waitForFunction((q) => new RegExp(q).test([...document.querySelectorAll("[aria-live], .notice")].map((e) => e.textContent).join(" ")), re.source, { timeout: 120000 });
let platte = null;
/** Wartet, bis das Abgleich-Fenster zu ist; zeigt ein Fehler im Fenster, wird der genannt statt eines stummen Timeouts. */
async function abgleichFertig(page, ms = 180000) {
  const ab = page.locator("[data-laufwerk-abgleich]"); const ende = Date.now() + ms;
  while (Date.now() < ende) {
    if (!(await ab.count())) return;
    const f = (await ab.locator(".form-error").count()) ? await ab.locator(".form-error").innerText() : "";
    if (f) throw new Error(`Fehler im Abgleich-Fenster: ${f}`);
    await page.waitForTimeout(500);
  }
  throw new Error("Abgleich-Fenster blieb offen: " + (await ab.innerText()).replace(/\s+/g, " ").slice(0, 400));
}
try {
  const a = await geraet();
  let vorher, personId;
  await step("Gerät 1: erfundene Familie, Karte „Gemeinsame Festplatte“ im Sicherheitscenter ohne gemerkte Platte", async () => {
    await a.page.goto(app.base, { waitUntil: "networkidle" }); await ready(a.page); await vaultFixture(a.page);
    await a.page.evaluate(async () => { const f = window.__vaultFixture; await f.seedSampleFamily(await f.browserVault(), { force: true }); });
    await a.page.reload({ waitUntil: "networkidle" }); await ready(a.page); await vaultFixture(a.page);
    vorher = await zaehlen(a.page);
    personId = await a.page.evaluate(async () => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return d.records.find((r) => r.recordType === "person").id; });
    await footer(a.page, "Sicherheitscenter");
    const karte = a.page.locator("[data-laufwerk-karte]"); await karte.waitFor();
    soll((await karte.getAttribute("data-laufwerk-karte")) === "0", "schon eine Platte gemerkt");
    return `${vorher.dokumente} Dokumente, ${vorher.eintraege} Einträge`;
  });
  await step("Gerät 1: „Festplatte vorbereiten“ – Passwort, Notfallblatt, dann erster Abgleich gibt alle Originale", async () => {
    await a.page.locator("[data-laufwerk-vorbereiten]").click();
    const d = a.page.locator("[data-laufwerk-vorbereiten-dialog]"); await d.waitFor();
    await d.locator("[data-laufwerk-name]").fill("Reise-SSD");
    await d.locator("[data-passwort]").fill(PASSWORT); await d.locator("[data-passwort-wieder]").fill(PASSWORT);
    await d.locator("[data-laufwerk-los]").click();
    const blatt = a.page.locator("[data-notfallblatt]"); await blatt.waitFor({ timeout: 60000 });
    const notfall = (await blatt.locator("[data-notfall-schluessel]").innerText()).trim();
    await blatt.locator("[data-notfall-bestaetigung] input").check(); await blatt.locator("[data-notfall-fertig]").click();
    const ab = a.page.locator("[data-laufwerk-abgleich]"); await ab.waitFor({ timeout: 120000 });
    const text = (await ab.innerText()).replace(/\s+/g, " ");
    // Gleiche Dateien liegen auf der Platte nur einmal (Prüfsumme) – darum weniger „gegeben“ als Dokumente.
    const gegeben = Number(text.match(/(\d+) gegeben/)?.[1] || 0);
    soll(/noch kein Stand/.test(text) && gegeben >= 1 && gegeben <= vorher.dokumente && !/Läuft/.test(text), text.slice(0, 600));
    await ab.locator("[data-laufwerk-los-abgleich]").click(); await abgleichFertig(a.page);
    await warteMeldung(a.page, /abgeglichen|Fehler|nicht/).catch(() => {});
    const m = await meldung(a.page);
    soll(/abgeglichen/.test(m) && /\d+ gegeben/.test(m), m.slice(0, 300));
    const zeile = a.page.locator("[data-laufwerk]"); await zeile.waitFor();
    soll((await zeile.getAttribute("data-laufwerk-da")) === "ja" && /Schlüssel gemerkt/.test(await zeile.innerText()), await zeile.innerText());
    return `Notfallschlüssel ${notfall.slice(0, 9)}… · ${m.match(/abgeglichen:[^.]*\./)?.[0]}`;
  });
  await step("Auf der Platte: Kennungsdatei, Stand verschlüsselt mit Zeiger, je Original eine Geheimdatei, kein Klartext", async () => {
    platte = await a.page.evaluate(() => window.__ordnerSichern());
    const r = await a.page.evaluate(() => {
      const S = window.__ordner, lies = (p) => S.dateien.get("R|Familienakte-Abgleich/" + p);
      const kopf = JSON.parse(new TextDecoder().decode(lies("Familienakte-Laufwerk.json")));
      const zeiger = JSON.parse(new TextDecoder().decode(lies("Stand/aktuell.json")));
      const fav = [...S.dateien.keys()].filter((k) => /^R\|Familienakte-Abgleich\/Dateien\/[0-9a-f]{64}\.fav$/.test(k));
      let klartext = 0; for (const k of fav) { const u = S.dateien.get(k); if (/%PDF|Versicherung/.test(new TextDecoder("latin1").decode(u.subarray(0, 64)))) klartext++; }
      const standDa = Boolean(lies("Stand/" + zeiger.datei));
      const stand = new TextDecoder("latin1").decode(lies("Stand/" + zeiger.datei).subarray(0, 200));
      return { kennung: kopf.laufwerk?.kennung, format: kopf.laufwerk?.format, name: kopf.laufwerk?.name, runden: kopf.kdf?.iterations, zeiger: zeiger.datei, standDa, fav: fav.length, klartext, standKlar: /documents|records/.test(stand) };
    });
    const verschieden = await a.page.evaluate(async () => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return new Set(d.documents.map((x) => x.checksum).filter(Boolean)).size; });
    soll(/^[0-9a-f-]{36}$/.test(r.kennung || "") && r.format === "familienakte-laufwerk" && r.name === "Reise-SSD" && r.runden === 600000 && r.zeiger === "stand-a.fav" && r.standDa && r.fav === verschieden && r.klartext === 0 && !r.standKlar, { ...r, verschieden });
    return `${r.fav} Geheimdateien · Kennung ${r.kennung.slice(0, 8)}…`;
  });
  await step("Gerät 1: Eintrag geändert, neues Dokument → „Jetzt abgleichen“ ohne Frage, 1 Original gegeben", async () => {
    await a.page.evaluate(async (id) => { const f = window.__vaultFixture, h = await f.browserVault(); await f.updateLocalPersonContact(h, id, { phone: "0170 1111111" }); await f.saveLocalDocument(h, new File(["Nur auf Gerät 1 (erfunden)"], "geraet1.txt", { type: "text/plain" }), { category: "Haushalt Probe", documentDate: "2026-11-01", notes: null, titel: "Zettel von Gerät 1" }); }, personId);
    await a.page.locator("[data-laufwerk-abgleichen]").click();
    const ab = a.page.locator("[data-laufwerk-abgleich]"); await ab.waitFor({ timeout: 120000 });
    const text = (await ab.innerText()).replace(/\s+/g, " ");
    soll(!(await ab.locator("[data-laufwerk-konflikte]").count()) && /1 gegeben/.test(text), text.slice(0, 300));
    await ab.locator("[data-laufwerk-los-abgleich]").click(); await abgleichFertig(a.page);
    await warteMeldung(a.page, /1 gegeben/);
    platte = await a.page.evaluate(() => window.__ordnerSichern());
    vorher = await zaehlen(a.page);
    return `${vorher.dokumente} Dokumente auf Gerät 1`;
  });

  const b = await geraet();
  await step("Gerät 2 (leer): „Vorhandene Festplatte verbinden“ – falsches Passwort abgewiesen, richtiges öffnet, alles wird geholt", async () => {
    await b.page.goto(app.base, { waitUntil: "networkidle" }); await b.page.waitForSelector(".site-brand-version", { timeout: 120000 }); await vaultFixture(b.page);
    await b.page.evaluate((d) => window.__ordnerEinsetzen(d, "T9"), platte);
    const leer = await zaehlen(b.page); soll(leer.dokumente === 0, leer);
    await footer(b.page, "Sicherheitscenter");
    await b.page.locator("[data-laufwerk-verbinden]").click();
    const pw = b.page.locator("[data-sicherung-passwort-dialog]"); await pw.waitFor({ timeout: 30000 });
    soll(/Reise-SSD/.test(await pw.innerText()) && (await pw.locator("[data-laufwerk-merken] input").isChecked()), "Name oder Merken fehlt");
    await pw.locator("[data-zugang-wert]").fill("Falsch-Falsch-1"); await pw.locator("[data-zugang-los]").click();
    await pw.locator("[data-zugang-fehler]").waitFor({ timeout: 30000 });
    await pw.locator("[data-zugang-wert]").fill(PASSWORT); await pw.locator("[data-zugang-los]").click();
    const ab = b.page.locator("[data-laufwerk-abgleich]"); await ab.waitFor({ timeout: 120000 });
    const text = (await ab.innerText()).replace(/\s+/g, " ");
    soll(/\d+ Originale werden geholt/.test(text) && /[1-9]\d* Einträge kommen von der Festplatte dazu/.test(text) && /Gerät/.test(text), text.slice(0, 300));
    await ab.locator("[data-laufwerk-los-abgleich]").click(); await abgleichFertig(b.page);
    await warteMeldung(b.page, /abgeglichen/);
    const nach = await zaehlen(b.page);
    soll(nach.dokumente === vorher.dokumente && nach.eintraege === vorher.eintraege, { vorher, nach });
    const ok = await b.page.evaluate(async (id) => {
      const f = window.__vaultFixture, h = await f.browserVault(), d = await f.readLocalVaultData(h);
      const doc = d.documents.find((x) => x.titel === "Zettel von Gerät 1"); const file = await f.readLocalDocumentFile(h, doc.id);
      const hex = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))].map((x) => x.toString(16).padStart(2, "0")).join("");
      const person = d.records.find((r) => r.id === id);
      return { text: await file.text(), gleich: hex === doc.checksum, pfad: doc.storedPath, telefon: person?.data?.kontakt?.telefon || JSON.stringify(person?.data).includes("0170 1111111") };
    }, personId);
    soll(/Gerät 1/.test(ok.text) && ok.gleich && /01_Dokumente\//.test(ok.pfad) && ok.telefon, ok);
    return `${nach.dokumente} Dokumente, ${nach.eintraege} Einträge geholt · ${ok.pfad.split("/").slice(-2).join("/")}`;
  });
  await step("Beide ändern denselben Eintrag: Gerät 2 gibt, Gerät 1 bekommt eine Frage und wählt „von der Festplatte“", async () => {
    await b.page.evaluate(async (id) => { const f = window.__vaultFixture; await f.updateLocalPersonContact(await f.browserVault(), id, { phone: "0170 2222222" }); }, personId);
    const knopfB = b.page.locator("[data-laufwerk-abgleichen]");
    await knopfB.waitFor({ timeout: 15000 }).catch(async () => { throw new Error("Kein „Jetzt abgleichen“ auf Gerät 2: " + (await b.page.locator("[data-laufwerk-karte]").innerText().catch(() => "keine Karte")).replace(/\s+/g, " ").slice(0, 300)); });
    if (await knopfB.isDisabled()) throw new Error("„Jetzt abgleichen“ auf Gerät 2 ist gesperrt (busy bleibt an)");
    await knopfB.click({ timeout: 15000 }).catch(async (e) => {
      const deck = await b.page.evaluate(() => { const k = document.querySelector("[data-laufwerk-abgleichen]"); const r = k.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { rect: [r.left, r.top, r.width, r.height], ueber: el ? `${el.tagName}.${el.className}` : null, modals: document.querySelectorAll(".modal-backdrop").length, disabled: k.disabled }; });
      throw new Error(`Klick scheitert: ${JSON.stringify(deck)} · ${String(e.message).slice(0, 120)}`);
    });
    const ab2 = b.page.locator("[data-laufwerk-abgleich]"); await ab2.waitFor({ timeout: 120000 });
    await ab2.locator("[data-laufwerk-los-abgleich]").click(); await abgleichFertig(b.page);
    await warteMeldung(b.page, /abgeglichen/);
    platte = await b.page.evaluate(() => window.__ordnerSichern());
    await a.page.evaluate((d) => window.__ordnerEinsetzen(d, "T1"), platte);
    await a.page.evaluate(async (id) => { const f = window.__vaultFixture; await f.updateLocalPersonContact(await f.browserVault(), id, { phone: "0170 3333333" }); }, personId);
    await a.page.locator("[data-laufwerk-abgleichen]").click();
    const ab = a.page.locator("[data-laufwerk-abgleich]"); await ab.waitFor({ timeout: 120000 });
    const k = ab.locator("[data-laufwerk-konflikt]");
    soll((await k.count()) === 1 && /unterscheiden sich/.test(await ab.innerText()), { konflikte: await k.count() });
    await ab.locator("[data-laufwerk-alle-dort]").click();
    await ab.locator("[data-laufwerk-los-abgleich]").click(); await abgleichFertig(a.page);
    await warteMeldung(a.page, /1 Fassungen von der Festplatte/);
    const telefon = await a.page.evaluate(async (id) => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return JSON.stringify(d.records.find((r) => r.id === id).data); }, personId);
    soll(/0170 2222222/.test(telefon) && !/3333333/.test(telefon), telefon.slice(0, 200));
    return "eine Frage, Fassung von der Festplatte übernommen";
  });
  await step("Gerät 1 nach Neuladen: Platte wird an der Kennung erkannt; abgezogen → „nicht angeschlossen“, ehrliche Meldung", async () => {
    await a.page.reload({ waitUntil: "networkidle" }); await ready(a.page); await vaultFixture(a.page);
    await a.page.evaluate((d) => window.__ordnerEinsetzen(d, "T1"), platte);
    await footer(a.page, "Sicherheitscenter");
    // Die App öffnet nach dem Neuladen gleich das Sicherheitscenter; die Platte „kommt“ erst danach (wie beim Anstecken).
    await a.page.evaluate(() => window.dispatchEvent(new Event("familienakte:laufwerk-pruefen")));
    const zeile = a.page.locator("[data-laufwerk]"); await zeile.waitFor();
    await a.page.waitForFunction(() => document.querySelector("[data-laufwerk]")?.getAttribute("data-laufwerk-da") === "ja", null, { timeout: 30000 }).catch(() => {});
    const da = await zeile.getAttribute("data-laufwerk-da");
    await a.page.evaluate(() => { window.__ordner.angesteckt = false; });
    await a.page.reload({ waitUntil: "networkidle" }); await ready(a.page); await vaultFixture(a.page);
    await a.page.evaluate(() => { window.__ordner.angesteckt = false; window.dispatchEvent(new Event("familienakte:laufwerk-pruefen")); });
    await footer(a.page, "Sicherheitscenter");
    await a.page.locator("[data-laufwerk]").waitFor();
    await a.page.locator("[data-laufwerk-abgleichen]").click();
    await warteMeldung(a.page, /nicht angeschlossen/);
    const weg = await a.page.locator("[data-laufwerk]").getAttribute("data-laufwerk-da");
    return soll(da === "ja" && weg === "nein", { da, weg }) && "erkannt, abgezogen erkannt";
  });
  await step("Keine Seitenfehler", async () => { const e = [...a.errors, ...b.errors].filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Gemeinsame Festplatte"));
