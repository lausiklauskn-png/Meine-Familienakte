// Pseudo-Knopf (Klaus 14.11.2026) im Aufbau nach PseudoDoc: rot „aus“ → Tipp → grün „an“; Datei rein → Zeile D01 mit Zahl;
// 👁 zeigt die Seite (KI sieht / Original); Nur kopieren nimmt nur die Fassung (Marke, D01, kein Klarname, kein Dateiname);
// zweiter Durchlauf unverändert; ein KI-Knopf mit Wahl (öffnet nur die Seite der KI); 2 Zurück; Briefumschlag öffnet mit
// Textfeld. Kein einziger Netzaufruf. Handy und PC. Alle Daten erfunden.
import { startApp, launchBrowser, HANDY, DESKTOP, ready, step, soll, check, summary, collectErrors } from "./_harness.mjs";

const BRIEF = "Sehr geehrte Frau Mara Testfeld,\nLindenweg 12, 12345 Musterstadt, geb. 03.04.1981\nSteuer-ID 47158203699, KVNR T528173648\nIBAN DE89 3704 0044 0532 0130 00\nDiagnose: I10.9\nFrist 31.12.2026, Betrag 412,50 €.";
const KLAR = ["Mara Testfeld", "Lindenweg 12", "Musterstadt", "03.04.1981", "47158203699", "T528173648", "DE89", "I10.9"];
const app = await startApp();
const browser = await launchBrowser();
try {
  for (const [name, geraet] of [["Handy", HANDY], ["PC", DESKTOP]]) {
    const context = await browser.newContext({ ...geraet, permissions: ["clipboard-read", "clipboard-write"] });
    await context.addInitScript(() => { window.__geoeffnet = []; window.open = (u) => { window.__geoeffnet.push(String(u)); return null; }; });
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    const knopf = page.locator("[data-pseudo-knopf]");
    await step(`${name}: Knopf rot „aus“, kein Fenster`, async () => {
      const r = { zustand: await knopf.getAttribute("data-pseudo-knopf"), text: await knopf.innerText(), fenster: await page.locator("[data-pseudo-fenster]").count(), sichtbar: await knopf.isVisible() };
      return soll(r.zustand === "aus" && /Pseudo\s*aus/.test(r.text) && r.fenster === 0 && r.sichtbar, r);
    });
    const netz = [];
    await step(`${name}: Tipp → grün „an“, PseudoDoc-Zeichen, Datei rein → eine Zeile D01 mit Zahl, kein Netzaufruf`, async () => {
      await knopf.click();
      await page.locator("[data-pseudo-fenster]").waitFor();
      page.on("request", (r) => { if (!r.url().startsWith(app.base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) netz.push(r.url()); });
      await page.locator("[data-pseudo-datei]").setInputFiles({ name: "Brief Mara Testfeld.txt", mimeType: "text/plain", buffer: Buffer.from(BRIEF) });
      const zeile = page.locator('[data-pseudo-stueck="D01"]'); await zeile.waitFor();
      const t = await zeile.innerText();
      const fenster = await page.locator("[data-pseudo-fenster]").innerText();
      const logo = await page.locator("[data-pseudo-logo]").evaluate((i) => i.complete && i.naturalWidth > 0);
      if (!logo) return soll(false, "Zeichen aus PseudoDoc lädt nicht");
      return soll(/Pseudo\s*an/.test(await knopf.innerText()) && /D01/.test(t) && /\d+ verdeckt/.test(t) && !/Lindenweg|DE89/.test(fenster) && netz.length === 0, { t, netz });
    });
    await step(`${name}: 👁 zeigt die Seite – „KI sieht“ ohne Klartext, „Original“ mit den echten Angaben`, async () => {
      await page.locator('[data-pseudo-stueck="D01"] [data-pseudo-auge]').click();
      const seite = page.locator("[data-pseudo-seite]"); await seite.waitFor();
      const ki = await seite.innerText();
      await page.locator('[data-pseudo-sicht="original"]').click();
      const orig = await seite.innerText();
      await page.locator("[data-pseudo-ansicht] .pf-blatt-fuss .pf-kn").click();
      return soll(!KLAR.some((k) => ki.includes(k)) && /⟦/.test(ki) && ki.includes("31.12.2026") && ki.includes("412,50") && orig.includes("Mara Testfeld") && (await page.locator("[data-pseudo-ansicht]").count()) === 0, { ki: ki.slice(0, 120) });
    });
    let kopie = "";
    await step(`${name}: Nur kopieren – Marke, D01, kein Klarname, kein Dateiname; zweiter Durchlauf unverändert`, async () => {
      await page.locator("[data-pseudo-kopieren]").click();
      kopie = await page.evaluate(() => navigator.clipboard.readText());
      const fassung = kopie.slice(kopie.indexOf("=== D01"));
      await page.locator("[data-pseudo-text-auf]").click();
      await page.locator("[data-pseudo-text]").fill(fassung.replace(/^=== D01 · Text ===\n/, "⟦PSEUDONYMISIERT v1⟧\n"));
      await page.locator("[data-pseudo-los]").click();
      const zweite = await page.locator('[data-pseudo-stueck="D02"]').innerText();
      return soll(kopie.startsWith("⟦PSEUDONYMISIERT v1⟧") && /=== D01/.test(kopie) && !KLAR.some((k) => kopie.includes(k)) && !kopie.includes("Brief Mara") && /schon pseudonymisiert/.test(zweite), { anfang: kopie.slice(0, 80), zweite });
    });
    await step(`${name}: Meldung steht bei den Knöpfen; ohne Zwischenablage-Erlaubnis kopiert der Ersatzweg`, async () => {
      const r = await page.evaluate(async () => {
        const alt = navigator.clipboard.writeText; let ersatz = 0; const cmd = document.execCommand;
        navigator.clipboard.writeText = async () => { throw new DOMException("gesperrt", "NotAllowedError"); };
        document.execCommand = (c) => { if (c === "copy") { ersatz++; return true; } return false; };
        document.querySelector("[data-pseudo-kopieren]").click();
        await new Promise((ok) => setTimeout(ok, 1200));
        navigator.clipboard.writeText = alt; document.execCommand = cmd;
        const m = document.querySelectorAll("[data-pseudo-meldung]");
        return { ersatz, zahl: m.length, beiKnoepfen: !!m[0]?.closest("[data-pseudo-ki]"), text: m[0]?.textContent || "" };
      });
      return soll(r.ersatz === 1 && r.zahl === 1 && r.beiKnoepfen && /^Kopiert/.test(r.text), r);
    });
    await step(`${name}: ein KI-Knopf – Wahl Claude, Knopf heißt „An Claude“, öffnet nur claude.ai, Text liegt in der Zwischenablage`, async () => {
      await page.locator('[data-pseudo-stueck="D02"] [data-pseudo-mit]').uncheck();
      // Internet für die App aus (ab Werk): kopiert, öffnet nichts, sagt es. Dann einschalten.
      await page.locator("[data-pseudo-ki-los]").click();
      await page.waitForFunction(() => /Internet/.test(document.querySelector("[data-pseudo-meldung]")?.textContent || ""), null, { timeout: 5000 }).catch(() => {});
      const ausMeldung = await page.locator("[data-pseudo-meldung]").innerText();
      if (!/Internet für die App ist aus/.test(ausMeldung) || (await page.evaluate(() => window.__geoeffnet.length))) return soll(false, { ausMeldung });
      await page.evaluate(() => window.PBNetwork.setOffline(false));
      await page.locator("[data-pseudo-ki-wahl]").click();
      await page.locator('[data-pseudo-ki="claude"]').click();
      const los = page.locator("[data-pseudo-ki-los]");
      await los.click();
      await page.waitForFunction(() => window.__geoeffnet.length > 0, null, { timeout: 5000 }).catch(() => {});
      const r = { text: await los.innerText(), offen: await page.evaluate(() => window.__geoeffnet), ablage: await page.evaluate(() => navigator.clipboard.readText()) };
      return soll(/An Claude/.test(r.text) && r.offen.length === 1 && r.offen[0].startsWith("https://claude.ai/") && !r.offen[0].includes("Testfeld") && r.ablage.includes("=== D01") && !r.ablage.includes("=== D02"), r);
    });
    await step(`${name}: 2 Zurück – Antwort mit Platzhalter wird zurückgeführt`, async () => {
      const tok = (kopie.match(/⟦(?:PERSON|NAME)-\d+⟧/) || [""])[0];
      await page.locator('[data-pseudo-reiter="zurueck"]').click();
      await page.locator("[data-pseudo-antwort]").fill(`Liebe ${tok}, alles erledigt.`);
      await page.locator("[data-pseudo-zurueckfuehren]").click();
      const klar = await page.locator("[data-pseudo-klar]").innerText();
      return soll(/Mara Testfeld/.test(klar) && netz.length === 0, { klar, tok, netz });
    });
    if (name === "PC") await step("PC: Foto rein → ✎ Rechteck ziehen → Fertig → Zeile zählt die Fläche, 👁 zeigt sie schwarz", async () => {
      await page.locator('[data-pseudo-reiter="hin"]').click();
      const b64 = await page.evaluate(() => { const c = document.createElement("canvas"); c.width = 320; c.height = 200; const x = c.getContext("2d"); x.fillStyle = "#9fb4c6"; x.fillRect(0, 0, 320, 200); x.fillStyle = "#b23b30"; x.fillRect(80, 100, 160, 50); return c.toDataURL("image/png").split(",")[1]; });
      await page.locator("[data-pseudo-datei]").setInputFiles({ name: "Foto.png", mimeType: "image/png", buffer: Buffer.from(b64, "base64") });
      const zeile = page.locator('[data-pseudo-stueck="D03"]'); await zeile.waitFor({ timeout: 60000 });
      await zeile.locator("[data-pseudo-stift]").click();
      const bild = page.locator("[data-pseudo-bild]"); await bild.waitFor();
      const k = await bild.boundingBox();
      await page.mouse.move(k.x + k.width * 0.25, k.y + k.height * 0.5); await page.mouse.down();
      await page.mouse.move(k.x + k.width * 0.6, k.y + k.height * 0.7, { steps: 5 }); await page.mouse.up();
      await page.locator("[data-pseudo-abdecken-fertig]").click();
      const t = await zeile.innerText();
      await zeile.locator("[data-pseudo-auge]").click();
      const schwarz = await page.locator("[data-pseudo-ansicht] .pf-bildseite i").count();
      await page.locator("[data-pseudo-ansicht] .pf-blatt-fuss .pf-kn").click();
      return soll(/1 Fläche\b/.test(t) && schwarz === 1, { t, schwarz });
    });
    if (name === "PC") await step("PC: Briefumschlag im Kopf öffnet das Fenster mit Antwortbrief und Textfeld", async () => {
      await knopf.click(); // aus
      await page.locator("[data-brief-knopf]").click();
      await page.locator("[data-pseudo-text]").waitFor();
      await page.waitForFunction(() => document.activeElement?.hasAttribute("data-pseudo-text"), null, { timeout: 3000 }).catch(() => {});
      const r = { an: await knopf.getAttribute("data-pseudo-knopf"), fokus: await page.evaluate(() => document.activeElement?.hasAttribute("data-pseudo-text")) };
      return soll(r.an === "an" && r.fokus, r);
    });
    await step(`${name}: Tipp → wieder rot, Fenster zu`, async () => {
      await knopf.click();
      return soll((await knopf.getAttribute("data-pseudo-knopf")) === "aus" && (await page.locator("[data-pseudo-fenster]").count()) === 0, "nicht aus");
    });
    check(errors.length === 0, `${name}: keine Seitenfehler`, errors.join(" | "));
    await context.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Pseudo-Knopf"));
