// Stufe B (Plan 08.11.2026, Entscheidungen 4a, 5, 7): verschlüsselte Vollsicherung in der Android-App (natives Ordner-Plugin gestellt).
// Erinnerung „noch nie gesichert“ vorher, Notfallblatt nachher; im Ordner nur Geheimdateien ohne Klartext; Einlesen mit falschem
// Passwort abgewiesen, mit richtigem Passwort in die leere Akte; danach mit dem Notfallschlüssel in die volle Akte (nichts zu tun).
import { vaultFixture } from "./_vault-fixture.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { ordnerStub } from "./_ordner-stub.mjs";
import { startApp, launchBrowser, DESKTOP, ready, footer, step, fail, summary, collectErrors, vollsicherungStarten } from "./_harness.mjs";
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const PASSWORT = "Winterapfel-2026!";
const app = await startApp();
const browser = await launchBrowser();
const context = await browser.newContext(DESKTOP);
await context.addInitScript(capacitorStub + "\n" + ordnerStub("android"));
const page = await context.newPage(); page.setDefaultTimeout(10000);
const errors = collectErrors(page);
const dialog = page.locator("[data-sicherung-einlesen]");
const zaehlen = () => page.evaluate(async () => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return { dokumente: d.documents.length, eintraege: d.records.length, letzte: d.letzteVollsicherung }; });
try {
  let vorher, notfall, sicherung;
  await step("Akte mit erfundener Familie: Erinnerung „noch nie gesichert“ im Sicherheitscenter und auf der Startseite", async () => {
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
    await page.evaluate(async () => { const f = window.__vaultFixture; await f.seedSampleFamily(await f.browserVault(), { force: true }); });
    await page.reload({ waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
    vorher = await zaehlen();
    const start = await page.locator("[data-sicherung-erinnerung]").first().getAttribute("data-sicherung-erinnerung");
    await footer(page, "Sicherheitscenter");
    const text = (await page.locator("[data-sicherung-erinnerung]").first().innerText()).replace(/\s+/g, " ");
    soll(start === "nie" && /noch nie vollständig gesichert/.test(text), { start, text });
    return `${vorher.dokumente} Dokumente · ${text.slice(0, 60)}`;
  });
  await step("Wahl: verschlüsselt ist vorgewählt; zu kurzes Passwort wird abgewiesen", async () => {
    await page.locator("button", { hasText: "Vollständige Sicherung erstellen" }).click();
    const w = page.locator("[data-sicherung-anlegen]"); await w.waitFor();
    soll(await w.locator('[data-sicherung-art="verschluesselt"] input').isChecked(), "verschlüsselt nicht vorgewählt");
    await w.locator("[data-passwort]").fill("kurz"); await w.locator("[data-passwort-wieder]").fill("kurz"); await w.locator("[data-sicherung-los]").click();
    const f1 = await w.locator("[data-sicherung-fehler]").innerText();
    await w.locator("[data-passwort]").fill(PASSWORT); await w.locator("[data-passwort-wieder]").fill(PASSWORT + "x"); await w.locator("[data-sicherung-los]").click();
    const f2 = await w.locator("[data-sicherung-fehler]").innerText();
    await w.locator('[data-sicherung-art="lesbar"] input').check();
    const hinweis = await w.locator("[data-sicherung-lesbar-hinweis]").innerText();
    await w.locator("button", { hasText: "Abbrechen" }).click();
    soll(/mindestens 10/.test(f1) && /stimmen nicht überein/.test(f2) && /ohne Schutz/.test(hinweis), { f1, f2, hinweis });
    return `${f1} · ${f2}`;
  });
  await step("Verschlüsselt sichern: Notfallblatt erscheint, „Fertig“ erst nach Bestätigung; Erinnerung verschwindet", async () => {
    await vollsicherungStarten(page, "verschluesselt", PASSWORT);
    const blatt = page.locator("[data-notfallblatt]"); await blatt.waitFor({ timeout: 120000 });
    notfall = (await blatt.locator("[data-notfall-schluessel]").innerText()).trim();
    soll(/^([0-9A-HJKMNP-TV-Z]{4}-){12}[0-9A-HJKMNP-TV-Z]{4}$/.test(notfall), notfall);
    soll(await blatt.locator("[data-notfall-fertig]").isDisabled(), "Fertig ohne Bestätigung möglich");
    await blatt.locator("[data-notfall-bestaetigung] input").check();
    await blatt.locator("[data-notfall-fertig]").click(); await blatt.waitFor({ state: "detached" });
    const nach = await zaehlen();
    soll(typeof nach.letzte === "string" && (await page.locator("[data-sicherung-erinnerung]").count()) === 0, nach);
    const letzte = await page.locator("[data-letzte-sicherung]").innerText();
    sicherung = await page.evaluate(() => window.__ordnerSichern());
    return `Notfallschlüssel ${notfall.slice(0, 9)}… · ${letzte}`;
  });
  await step("Im Ordner: Kopfdatei, Geheimdateien ohne Klartextnamen, kein lesbares Register, APK daneben", async () => {
    const r = await page.evaluate(async () => {
      const S = window.__ordner;
      const ordner = [...S.ordner].map((o) => o.split("|")[1]).filter((p) => /^Familienakte_Vollsicherung_[^/]+$/.test(p));
      const basis = ordner[0]; const namen = [...S.dateien.keys()].map((d) => d.split("|")[1]).filter((p) => p.startsWith(basis + "/")).map((p) => p.slice(basis.length + 1));
      const kopf = S.dateien.get(`R|${basis}/Vollsicherung_Verschluesselt.json`);
      const fav = namen.filter((n) => /^Dateien\/\d{5}\.fav$/.test(n));
      let klartext = 0; for (const n of fav) { const u = S.dateien.get(`R|${basis}/${n}`); const kopfText = new TextDecoder("latin1").decode(u.subarray(0, 64)); if (/%PDF|Versicherung|Rechnung/.test(kopfText)) klartext++; }
      return { basis, ordner: ordner.length, kopf: kopf ? JSON.parse(new TextDecoder().decode(kopf)) : null, fav: fav.length, klartext, namen: namen.filter((n) => !n.startsWith("Dateien/")), pdfNamen: namen.filter((n) => /\.pdf$/i.test(n)).length };
    });
    soll(r.ordner === 1 && /_verschluesselt$/.test(r.basis) && r.kopf?.format === "familienakte-vollsicherung-verschluesselt" && r.kopf.kdf.iterations === 600000 && r.fav === r.kopf.dateien && r.fav > 0 && r.klartext === 0 && r.pdfNamen === 0
      && r.namen.includes("Familienakte_Register.fav") && r.namen.includes("Vollsicherung_Manifest.fav") && !r.namen.includes("Familienakte_Register.json") && r.namen.some((n) => /\.apk$/.test(n)), r);
    return `${r.fav} Geheimdateien · daneben ${r.namen.join(", ")}`;
  });
  await step("„Wiederherstellung testen“ sagt ehrlich, dass es das für verschlüsselte Sicherungen nicht gibt", async () => {
    await page.locator("button", { hasText: "Wiederherstellung testen" }).click();
    await page.waitForFunction(() => /gibt es dafür nicht/.test([...document.querySelectorAll("[aria-live], .notice")].map((e) => e.textContent).join(" ")), null, { timeout: 20000 });
    const m = (await page.locator("[aria-live], .notice").allInnerTexts()).join(" ");
    return soll(/Wiederherstellung testen“ gibt es dafür nicht/.test(m), m.slice(0, 200)) && m.match(/Diese Sicherung[^.]*\./)?.[0];
  });
  await step("Akte leeren; Einlesen fragt nach dem Passwort; falsch → Meldung, nichts geschrieben", async () => {
    await page.evaluate(async () => { const f = window.__vaultFixture; await (await navigator.storage.getDirectory()).removeEntry(f.BROWSER_VAULT_NAME, { recursive: true }); });
    await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector(".site-brand-version", { timeout: 120000 });
    await vaultFixture(page);
    await page.evaluate((d) => window.__ordnerEinsetzen(d, "T2"), sicherung);
    await footer(page, "Sicherheitscenter");
    await page.locator("[data-sicherung-einlesen-knopf]").click();
    const pw = page.locator("[data-sicherung-passwort-dialog]"); await pw.waitFor({ timeout: 30000 });
    await pw.locator("[data-zugang-wert]").fill("Falsches-Passwort-1"); await pw.locator("[data-zugang-los]").click();
    await pw.locator("[data-zugang-fehler]").waitFor({ timeout: 30000 });
    const f = await pw.locator("[data-zugang-fehler]").innerText();
    const leer = await zaehlen();
    soll(/Passwort ist falsch/.test(f) && leer.dokumente === 0, { f, leer });
    return f;
  });
  await step("Richtiges Passwort: Probe bestanden, „Jetzt einlesen“ holt alles zurück, Zahlen stimmen, Original lesbar", async () => {
    const pw = page.locator("[data-sicherung-passwort-dialog]");
    await pw.locator("[data-zugang-wert]").fill(PASSWORT); await pw.locator("[data-zugang-los]").click();
    await dialog.waitFor({ timeout: 120000 });
    const text = (await dialog.innerText()).replace(/\s+/g, " ");
    soll(/per Prüfsumme geprüft/.test(text) && !/Fehler/.test(await dialog.locator("[data-einlesen-dateien]").innerText()), text.slice(0, 300));
    await dialog.locator("[data-einlesen-start]").click(); await dialog.waitFor({ state: "detached", timeout: 120000 });
    const nach = await zaehlen();
    soll(nach.dokumente === vorher.dokumente && nach.eintraege === vorher.eintraege, { vorher, nach });
    const ok = await page.evaluate(async () => {
      const f = window.__vaultFixture, h = await f.browserVault(), d = await f.readLocalVaultData(h);
      const doc = d.documents.find((x) => x.checksum); const file = await f.readLocalDocumentFile(h, doc.id);
      const hex = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))].map((x) => x.toString(16).padStart(2, "0")).join("");
      return { name: doc.originalName, gleich: hex === doc.checksum || `sha256:${hex}` === doc.checksum };
    });
    return soll(ok.gleich, ok) && `${nach.dokumente} Dokumente, ${nach.eintraege} Einträge · ${ok.name}`;
  });
  await step("Nochmal einlesen mit dem Notfallschlüssel (klein geschrieben): öffnet, volle Akte → nichts zusammenzuführen", async () => {
    await page.locator("[data-sicherung-einlesen-knopf]").click();
    const pw = page.locator("[data-sicherung-passwort-dialog]"); await pw.waitFor({ timeout: 30000 });
    await pw.locator("[data-zugang-wechsel]").click();
    await pw.locator("[data-zugang-wert]").fill(notfall.toLowerCase()); await pw.locator("[data-zugang-los]").click();
    await dialog.waitFor({ timeout: 120000 });
    const text = (await dialog.innerText()).replace(/\s+/g, " ");
    soll(await dialog.locator("[data-einlesen-zusammen]").count() === 1 && /nichts zusammenzuführen/.test(text), text.slice(0, 300));
    await dialog.locator("button", { hasText: "Schließen" }).click();
    return "Notfallschlüssel öffnet; gleicher Stand erkannt";
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Sicherung verschlüsselt"));
