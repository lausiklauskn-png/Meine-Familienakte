// Stück 2 (Klaus 2026-11-01): Brücke zwischen der Akte und dem Klon von Workflow PDF.
// Geprüft: Unterlage → „In Workflow PDF öffnen“ legt sie in die Bibliothek des Klons · „📤 Teilen“ im Klon legt das PDF in die
// Eingangszentrale der Akte (kein Teilen-Fenster des Geräts) · „Fotofunktion öffnen“ öffnet den Klon mit dem Scanner, „PDF erstellen“
// gibt den Scan gleich an die Prüfung der Akte · geschützte Gesundheitsunterlagen haben den Knopf nicht.
import path from "node:path";
import { readFileSync } from "node:fs";
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, summary, collectErrors, ROOT } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";
import { probePdf } from "./_dateien.mjs";

const FORM = path.join(ROOT, "tests/testdateien/Garantiebeleg_Waschautomat_Lavorix.pdf");
const scanPdf = probePdf("Nebenkostenabrechnung 2025 Pustelblumenweg 7 Nachzahlung 84,17 (erfunden)").buffer.toString("base64");
const STELLVERTRETER = `(() => { const bytes = Uint8Array.from(atob(${JSON.stringify(scanPdf)}), (c) => c.charCodeAt(0));
  window.WFP = window.WFP || {};
  window.WFP.Scanner = { pfade() {}, zustand() { return {}; }, oeffnen(o) { window.__scanTitel = o.titel; setTimeout(() => o.fertig(bytes, { name: "Klon-Scan 2026-11-01" }), 50); } };
})();`;

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext({ ...DESKTOP, serviceWorkers: "block" });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  await page.addInitScript(windowStub);
  await page.addInitScript(() => {
    if (window.parent !== window) {
      let kern;
      Object.defineProperty(window, '__wfpdf', { configurable: true, get: () => kern, set: v => {
        const importieren = v.importDateien;
        v.importDateien = async (...args) => {
          window.__importWartet = true;
          while (window.parent.__halteWfpdfImport) await new Promise(resolve => setTimeout(resolve, 25));
          return importieren(...args);
        };
        kern = v;
      } });
    }
    window.addEventListener('message', e => {
      if (window.__halteUebergabe && e.data?.typ === 'fa-wfpdf-ablegen') {
        window.__gehalten = { data: e.data, source: e.source }; e.stopImmediatePropagation();
      }
    }, true);
  });
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);

  await step("Unterlage in der Akte ablegen", async () => {
    await footer(page, "Eingangszentrale");
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([FORM]);
    const q = page.locator(".intake-queue-item", { hasText: "Garantiebeleg" }).first();
    await q.locator("button", { hasText: "Zuordnung prüfen" }).click();
    await page.locator(".intake-modal button[type=submit]").click();
    await page.locator(".intake-modal").waitFor({ state: "detached", timeout: 20000 });
    await page.locator(".document-item", { hasText: "Garantiebeleg_Waschautomat_Lavorix" }).first().waitFor({ timeout: 20000 });
    return true;
  });
  const geschuetzt = page.locator(".document-item", { hasText: "Geschützte Gesundheitsunterlage" });
  check(await geschuetzt.count() > 0 && await geschuetzt.locator("[data-wfpdf-oeffnen]").count() === 0, "Geschützte Gesundheitsunterlage: kein „In Workflow PDF öffnen“", `${await geschuetzt.count()} geschützte`);
  let klon;
  await step("Manueller PDF-Import ohne Aktenquelle behält den normalen Eingangsweg", async () => {
    await page.evaluate(() => { window.__halteWfpdfImport = false; window.scrollTo(0,0); });
    await page.locator(".main-navigation .nav-cluster > button", { hasText: "Dokumente" }).first().click({force:true});
    await page.locator(".mega-menu button", { hasText: "Workflow PDF" }).first().click();
    await page.locator('[data-wfpdf-seite]').waitFor();
    await page.frameLocator("[data-wfpdf-rahmen]").locator("#inDatei").waitFor({state:"attached",timeout:30000});
    klon = page.frames().find(f=>f.url().includes('/apps/workflow-pdf/'));
    // „Durchsuchbar“ ab Werk an (Klaus 2026-11-04), einmal je Gerät; die eigene Wahl danach bleibt (Marke im eigenen Schlüssel).
    const merk = await klon.evaluate(() => ({ wert: JSON.parse(localStorage.getItem("wfpdf_scan_v1") || "{}").durchsuchbar, marke: localStorage.getItem("fa_scan_durchsuchbar_ab_werk_v1"), eigen: localStorage.getItem("fa_wfpdf_scan_v1") !== null }));
    check(merk.wert === true && merk.marke === "1" && merk.eigen, "Scanner: „Durchsuchbar“ ab Werk an, im eigenen Speicher der Akte", JSON.stringify(merk));
    await klon.locator('#inDatei').setInputFiles({name:'Garantiebeleg.pdf',mimeType:'application/pdf',buffer:readFileSync(FORM)});
    await klon.locator('#sc-ed.on').waitFor({timeout:30000});
    await klon.locator('#edZurueck').click();
    await klon.locator('.dok', {hasText:'Garantiebeleg'}).first().waitFor();
    return true;
  });
  await step("„📤 Teilen“ im Klon legt das PDF in die Eingangszentrale der Akte", async () => {
    await klon.locator(".dok", { hasText: "Garantiebeleg" }).first().locator("[data-teilen]").click();
    await page.getByText("aus Workflow PDF liegen in der Eingangszentrale").first().waitFor({ timeout: 20000 });
    return (await klon.evaluate(() => window.__wfpdfTeilen && window.__wfpdfTeilen.geteilt)) === true ? "über die Brücke, nicht übers Gerät" : false;
  });
  await step("Brücke: Teilen bleibt bis zur dauerhaften Eingangsquittung offen", async () => {
    await page.evaluate(() => { window.__halteUebergabe = true; });
    await klon.evaluate(async () => {
      const d = (await window.WFP.DB.all('docs'))[0];
      window.__brueckenDatei = new File([await window.WFP.DB.getFile(d.id)], 'Quittungsprobe.pdf', {type:'application/pdf'});
      window.__brueckenStand = 'wartet';
      navigator.share({files:[window.__brueckenDatei]}).then(() => {window.__brueckenStand='bestaetigt';}, () => {window.__brueckenStand='fehler';});
    });
    await page.waitForFunction(() => !!window.__gehalten);
    if (await klon.evaluate(() => window.__brueckenStand) !== 'wartet') throw new Error('Zu frühe Bestätigung');
    await page.evaluate(() => {
      const e = window.__gehalten;
      e.source.postMessage({typ:'fa-wfpdf-abgelegt',id:'unpassende-kennung',ok:true}, location.origin);
    });
    await klon.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
    if (await klon.evaluate(() => window.__brueckenStand) !== 'wartet') throw new Error('Fremde Quittung akzeptiert');
    await page.evaluate(() => {
      window.__halteUebergabe=false; const e=window.__gehalten;
      window.dispatchEvent(new MessageEvent('message',{origin:location.origin,source:e.source,data:e.data}));
    });
    await klon.waitForFunction(() => window.__brueckenStand==='bestaetigt');
    return true;
  });
  await step("Erneutes Teilen derselben Fassung erzeugt keinen zweiten Eingang", async () => {
    const count = () => page.evaluate(() => new Promise((ok,no) => {
      const r=indexedDB.open('FamilienakteStapel1'); r.onsuccess=()=>{const db=r.result;const t=db.transaction('eingang');const q=t.objectStore('eingang').count();t.oncomplete=()=>{db.close();ok(q.result)};t.onabort=()=>no(t.error)};r.onerror=()=>no(r.error);
    }));
    const vorher=await count();
    await klon.evaluate(() => navigator.share({files:[window.__brueckenDatei]}));
    if(await count()!==vorher) throw new Error('Doppelter Eingang');
    return true;
  });
  await step("Die Datei steht in der Eingangszentrale zur Prüfung", async () => {
    await footer(page, "Eingangszentrale");
    await page.locator(".intake-queue-item", { hasText: "Garantiebeleg" }).first().waitFor({ timeout: 20000 });
    return true;
  });

  const scanSeite = await (await browser.newContext({ ...DESKTOP, serviceWorkers: "block" })).newPage();
  scanSeite.setDefaultTimeout(20000);
  await scanSeite.addInitScript(windowStub);
  await scanSeite.route(/\/workflow-pdf\/assets\/scanner\.js(\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: STELLVERTRETER }));
  await scanSeite.goto(app.base, { waitUntil: "networkidle" }); await ready(scanSeite);
  await step("„Fotofunktion öffnen“ → Klon mit Scanner → „PDF erstellen“ → Prüfung in der Akte", async () => {
    await scanSeite.locator(".document-intake [data-dokument-scannen]").first().click();
    await scanSeite.locator("[data-wfpdf-seite]").waitFor();
    await scanSeite.locator(".intake-modal").waitFor({ timeout: 30000 });
    return /Klon-Scan 2026-11-01\.pdf/.test(await scanSeite.locator(".intake-modal").innerText()) ? "Scan in der Prüfung" : false;
  });
  const sk = scanSeite.frames().find((x) => x.url().includes("/apps/workflow-pdf/"));
  check(!!sk && !/scan=1/.test(sk.url()), "Klon putzt die Adresse (⟳ startet den Scan nicht noch einmal)", sk?.url());
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Workflow PDF: Brücke"));
