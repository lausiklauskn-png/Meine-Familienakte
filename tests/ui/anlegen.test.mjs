// 2.28.39 Punkt 8 (Neugestaltung, vom Nutzer mit Ja): In der Familienübersicht „+ Neu“ → Person, Organisation, Objekt (Auto,
// Gerät …) oder Vorgang mit Name, Art und Notiz anlegen; „✓ Speichern“ und danach „Gespeichert ✓“ an derselben Stelle; ändern
// mit dem Stift. Danach stehen die Einträge in den Auswahllisten (Fristformular, Prüfdialog „Zuordnung“). Die Kennnummer bleibt
// intern im Register; sichtbar sind Namen – auch an den Verknüpfungen in der Fristenliste. Alle Namen erfunden.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

function pdf(name, zeile) {
  const stream = `BT /F1 12 Tf 50 780 Td (${zeile}) Tj ET`;
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  let out = "%PDF-1.4\n"; const off = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return { name, mimeType: "application/pdf", buffer: Buffer.from(out, "latin1") };
}

async function zurFamilie(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const feld = page.locator(".global-search input");
  await feld.fill(""); await feld.fill("Familienübersicht");
  await page.locator(".search-results article", { has: page.locator("strong", { hasText: /^Familienübersicht$/ }) }).first().locator("button").first().click();
  await page.locator("#familie-stamm").waitFor();
}

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(15000);
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  const register = () => page.evaluate(async () => { const f = window.__vaultFixture; return f.readLocalVaultData(await f.browserVault()); });
  const karte = page.locator("#familie-stamm");
  const anlegen = async (art, name, artText, notiz = "") => {
    await karte.locator("[data-stamm-neu]").click();
    await karte.locator(`[data-stamm-art="${art}"]`).click();
    const form = karte.locator(`[data-stamm-formular="${art}"]`);
    await form.locator('[data-stamm-feld="name"]').fill(name);
    await form.locator('[data-stamm-feld="art"]').fill(artText);
    if (notiz) await form.locator('[data-stamm-feld="notiz"]').fill(notiz);
    await form.locator("[data-stamm-speichern]").click();
    await karte.locator("[data-stamm-gespeichert], [data-stamm-fehler]").first().waitFor();
  };

  await zurFamilie(page);
  await step("Familienübersicht: „+ Neu“ zeigt Person, Organisation, Objekt, Vorgang", async () => {
    await karte.locator("[data-stamm-neu]").click();
    const arten = await karte.locator("[data-stamm-art]").allInnerTexts();
    await karte.locator("[data-stamm-neu]").click();
    return soll(arten.length === 4 && /Person/.test(arten[0]) && /Organisation/.test(arten[1]) && /Objekt \(Auto, Gerät/.test(arten[2]) && /Vorgang/.test(arten[3]), arten);
  });
  await step("Organisation anlegen: „✓ Speichern“, dann „Gespeichert ✓“ an derselben Stelle und eine Zeile mit Namen", async () => {
    await anlegen("organisation", "Hausarztpraxis Dr. Wolkenstein", "Arztpraxis", "Erfundene Probe");
    const meldung = await karte.locator("[data-stamm-gespeichert]").innerText();
    const zeile = await karte.locator('[data-stamm-zeile="Hausarztpraxis Dr. Wolkenstein"]').innerText();
    return soll(/^Gespeichert ✓/.test(meldung) && /Hausarztpraxis Dr\. Wolkenstein/.test(zeile) && /Arztpraxis/.test(zeile), { meldung, zeile });
  });
  await step("Gleicher Name wird nicht doppelt angelegt (verständliche Meldung)", async () => {
    await anlegen("organisation", "hausarztpraxis dr. wolkenstein", "");
    const fehler = await karte.locator("[data-stamm-fehler]").innerText();
    await karte.locator('[data-stamm-formular="organisation"] button', { hasText: "Abbrechen" }).click();
    return soll(/gibt es schon/.test(fehler), fehler);
  });
  await step("Objekt, Person und Vorgang anlegen", async () => {
    await anlegen("object", "Familienkombi Silberpfeil", "Auto");
    await anlegen("person", "Gerda Wolkenstein", "Mutter");
    await anlegen("case", "Reparatur Silberpfeil", "Reklamation");
    const namen = await karte.locator("[data-stamm-zeile]").evaluateAll((els) => els.map((el) => el.getAttribute("data-stamm-zeile")));
    return soll(["Familienkombi Silberpfeil", "Gerda Wolkenstein", "Reparatur Silberpfeil"].every((n) => namen.includes(n)), namen);
  });
  await step("Register: Kennnummern intern vergeben (ORG/OBJ/PER/VORG-…), sichtbar nur Namen", async () => {
    const r = (await register()).records;
    const org = r.find((x) => x.data?.name === "Hausarztpraxis Dr. Wolkenstein");
    const obj = r.find((x) => x.data?.name === "Familienkombi Silberpfeil");
    const per = r.find((x) => x.data?.displayName === "Gerda Wolkenstein");
    const vorg = r.find((x) => x.data?.title === "Reparatur Silberpfeil");
    const text = await karte.innerText();
    return soll(/^ORG-\d{6}$/.test(org?.id) && org.data.contactType === "Arztpraxis" && org.notes === "Erfundene Probe" && /^OBJ-\d{6}$/.test(obj?.id) && obj.data.objectType === "Auto" && /^PER-\d{6}$/.test(per?.id) && per.data.rolle === "Mutter" && /^VORG-\d{6}$/.test(vorg?.id) && !/\b(ORG|OBJ|PER|VORG)-\d{6}\b/.test(text), { org, obj, per, vorg });
  });
  await step("Ändern mit dem Stift: neuer Name steht in der Zeile, Anschrift-Kasten bei Personen", async () => {
    await karte.locator('[data-stamm-aendern="Familienkombi Silberpfeil"]').click();
    const form = karte.locator('[data-stamm-formular="object"]');
    const vorher = await form.locator('[data-stamm-feld="name"]').inputValue();
    await form.locator('[data-stamm-feld="name"]').fill("Familienkombi Silberpfeil II");
    await form.locator("[data-stamm-speichern]").click();
    await karte.locator('[data-stamm-zeile="Familienkombi Silberpfeil II"]').waitFor();
    const meldung = await karte.locator("[data-stamm-gespeichert]").innerText();
    await karte.locator('[data-stamm-aendern="Gerda Wolkenstein"]').click();
    const kontakt = await karte.locator('[data-stamm-formular="person"] [data-person-kontakt]').count();
    await karte.locator('[data-stamm-formular="person"] button', { hasText: "Abbrechen" }).click();
    return soll(vorher === "Familienkombi Silberpfeil" && /Gespeichert ✓/.test(meldung) && kontakt === 1, { vorher, meldung, kontakt });
  });
  await step("Nach Neuladen noch da", async () => {
    await page.reload({ waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
    await zurFamilie(page);
    return soll(await karte.locator('[data-stamm-zeile="Familienkombi Silberpfeil II"]').count() === 1, "fehlt nach Neuladen");
  });
  await step("Zeile öffnet die Detailansicht mit Namen (ohne Kennnummer im Kopf)", async () => {
    await karte.locator('[data-stamm-zeile="Reparatur Silberpfeil"] .stamm-oeffnen').click();
    await page.locator("#cockpit-dossier").waitFor();
    const kopf = await page.locator("#cockpit-dossier .card-heading").innerText();
    return soll(/Reparatur Silberpfeil/.test(kopf) && !/VORG-\d/.test(kopf), kopf);
  });
  await step("Fristformular: Person, Objekt und Vorgang stehen mit Namen in den Auswahllisten", async () => {
    await footer(page, "Fristen und Aufgaben");
    await page.locator(".schedule-create").evaluate((el) => el.closest("details")?.setAttribute("open", ""));
    const opts = async (typ) => page.locator(`[data-frist-bezug="${typ}"] option`).allInnerTexts();
    const person = await opts("person"), objekt = await opts("object"), vorgang = await opts("case");
    return soll(person.includes("Gerda Wolkenstein") && objekt.includes("Familienkombi Silberpfeil II") && vorgang.includes("Reparatur Silberpfeil") && ![...person, ...objekt, ...vorgang].some((t) => /\d{6}/.test(t)), { person, objekt, vorgang });
  });
  await step("Frist mit Vorgang: Verknüpfung in der Liste zeigt den Namen statt „VORG-…“", async () => {
    const f = page.locator(".schedule-create form");
    await f.locator('input[placeholder="Zum Beispiel: Antwort an Krankenkasse"]').fill("Werkstatttermin Silberpfeil");
    await f.locator('input[type="date"]').first().fill("2026-12-15");
    await f.locator('[data-frist-bezug="case"]').selectOption({ label: "Reparatur Silberpfeil" });
    await f.locator(".schedule-confirm input").check();
    await f.locator("button", { hasText: "Frist oder Aufgabe bestätigt anlegen" }).click();
    await page.locator("[data-frist-gespeichert]").waitFor();
    const id = (await register()).records.find((x) => x.data?.title === "Werkstatttermin Silberpfeil")?.id;
    const zeile = page.locator(`#termin-${id}`);
    await zeile.locator("[data-termin-auge]").first().click();
    const links = await zeile.locator(".schedule-links").innerText();
    return soll(/Vorgang: Reparatur Silberpfeil/.test(links) && !/VORG-\d/.test(links), links);
  });
  await step("Prüfdialog „Zuordnung“: Organisation mit Namen wählbar und wird verknüpft", async () => {
    await footer(page, "Eingangszentrale");
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([pdf("Rechnung_Wolkenstein.pdf", "Rechnung Hausarztpraxis (erfunden)")]);
    const zeile = page.locator(".intake-queue-item", { hasText: "Wolkenstein" }).first();
    await zeile.locator(".badge:not(:has-text('läuft'))").first().waitFor({ timeout: 30000 });
    await zeile.locator("button", { hasText: "Zuordnung prüfen" }).click();
    const modal = page.locator(".intake-modal"); await modal.waitFor();
    const wahl = modal.locator("[data-zuordnung-wahl]");
    const optionen = await wahl.locator("option").allInnerTexts();
    await wahl.selectOption({ label: "Hausarztpraxis Dr. Wolkenstein" });
    await modal.locator("button[type=submit]").click();
    await modal.waitFor({ state: "detached", timeout: 20000 });
    const daten = await register();
    const org = daten.records.find((x) => x.data?.name === "Hausarztpraxis Dr. Wolkenstein");
    const dok = daten.documents.find((d) => /Wolkenstein/.test(d.originalName));
    const rel = daten.relations.find((x) => x.fromId === dok?.id && x.toId === org?.id);
    return soll(optionen.includes("Hausarztpraxis Dr. Wolkenstein") && !optionen.some((t) => /\d{6}/.test(t)) && rel, { optionen, rel });
  });
  check(errors.length === 0, "Desktop: keine Seitenfehler", errors.join(" | "));

  const handy = await (await browser.newContext(HANDY)).newPage();
  handy.setDefaultTimeout(15000);
  const handyErrors = collectErrors(handy);
  await handy.goto(app.base, { waitUntil: "networkidle" }); await ready(handy);
  await zurFamilie(handy);
  await step("Handy 390 px: Formular passt, Speichern ohne Querrollen", async () => {
    const k = handy.locator("#familie-stamm");
    await k.locator("[data-stamm-neu]").click();
    await k.locator('[data-stamm-art="object"]').click();
    await k.locator('[data-stamm-feld="name"]').fill("Waschautomat Lavorix Probe");
    await k.locator("[data-stamm-speichern]").click();
    await k.locator("[data-stamm-gespeichert]").waitFor();
    const breit = await handy.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    return soll(!breit && await k.locator('[data-stamm-zeile="Waschautomat Lavorix Probe"]').count() === 1, { breit });
  });
  check(handyErrors.length === 0, "Handy: keine Seitenfehler", handyErrors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Personen, Organisationen, Objekte, Vorgänge anlegen (2.28.39)"));
