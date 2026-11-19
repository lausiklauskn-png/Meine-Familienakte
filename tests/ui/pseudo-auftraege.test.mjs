// Pseudo-Fenster 2.28.69 (Vorschau docs/vorschau/pseudo-auftraege-2.28.69.html): Zuordnung je Auftrag verschlüsselt (P10) –
// „2 Zurück“ nach Neuladen, „✓ erledigt“ löscht; Mistral mit eigenem Schlüssel nach Rückfrage (gestellt); PDF zeigt das echte
// Seitenbild mit Kästen; ZIP ohne Klartext; „An KI“ am Eingang (Mail mit Anlage) und aus der Assistenz. Pro-App mit gestelltem
// Pro-Tresor. Alle Daten erfunden.
import { capacitorStub } from "./_capacitor-stub.mjs";
import { startApp, launchBrowser, DESKTOP, HANDY, ready, step, soll, check, summary, collectErrors, footer } from "./_harness.mjs";
import { textAlsPdf } from "../../lib/text-pdf.ts";

const BRIEF = "Sehr geehrte Frau Mara Testfeld,\nIhre IBAN DE89 3704 0044 0532 0130 00 ist hinterlegt.\nFrist 31.12.2026.";
const KLAR = ["Mara Testfeld", "Testfeld", "DE89 3704"];
const app = await startApp();
const browser = await launchBrowser();
const tresor = () => {
  // Profile im gestellten Pro-Tresor überleben das Neuladen (localStorage der Probe, nicht der App).
  const K = "__probe_tresor_profil";
  window.Capacitor.Plugins.FamilienakteTresor = {
    zustand: async () => ({ status: "offen", id: "tresor-a", uebergaben: true }),
    uebergabeEingang: async () => ({ items: [] }),
    profilLesen: async () => ({ items: localStorage.getItem(K) ? [{ schreiber: "familienakte", datum: 2, sha256: "a".repeat(64), text: localStorage.getItem(K) }] : [] }),
    profilSchreiben: async ({ vaultId, text }) => { localStorage.setItem(K, text); return { vaultId, entryId: "e1", sha256: "c".repeat(64), size: text.length }; },
  };
  // Dateiausgabe der Android-Hülle gestellt: Stücke sammeln, Name merken.
  const A = window.__ausgabe = [];
  window.Capacitor.Plugins.WorkflowFiles = {
    begin: async ({ name, mime }) => { A.push({ name, mime, b64: [], size: 0 }); return { id: String(A.length - 1) }; },
    append: async ({ id, data }) => { const a = A[Number(id)]; a.b64.push(data); a.size += atob(data).length; return { size: a.size }; },
    finish: async ({ id }) => ({ size: A[Number(id)].size }),
    save: async ({ id }) => { A[Number(id)].fertig = true; return { saved: true }; }, abort: async () => ({}),
  };
};
try {
  const context = await browser.newContext({ ...DESKTOP, serviceWorkers: "block", permissions: ["clipboard-read", "clipboard-write"] });
  await context.addInitScript(capacitorStub);
  await context.addInitScript(tresor);
  await context.addInitScript(() => { window.__geoeffnet = []; window.open = (u) => { window.__geoeffnet.push(String(u)); return null; }; });
  let mistral = null;
  await context.route("https://api.mistral.ai/**", async (route) => {
    mistral = route.request().postData() || "";
    const tok = (JSON.parse(mistral).messages[1].content.match(/Frau (⟦[A-Z]+-\d+⟧)/) || [])[1] || "⟦NAME-1⟧";
    await route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ choices: [{ message: { content: `BETREFF: Ihre Nachricht\n---\nSehr geehrte Frau ${tok},\ndanke.` } }] }) });
  });
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await page.locator("[data-pseudo-knopf]").dispatchEvent("click");
  await page.locator("[data-pseudo-fenster]").waitFor();

  await step("Nur kopieren legt Auftrag A1 an; gespeichert ist nur Verschlüsseltes", async () => {
    await page.locator("[data-pseudo-text-auf]").click();
    await page.locator("[data-pseudo-text]").fill(BRIEF);
    await page.locator("[data-pseudo-los]").click();
    await page.locator('[data-pseudo-stueck="D01"]').waitFor();
    await page.locator("[data-pseudo-kopieren]").click();
    await page.waitForFunction(() => /A1 gemerkt/.test(document.querySelector("[data-pseudo-meldung]")?.textContent || ""), null, { timeout: 8000 }).catch(() => {});
    const r = { meldung: await page.locator("[data-pseudo-meldung]").innerText(), ablage: await page.evaluate(() => localStorage.getItem("familienakte_pseudo_auftraege_v1") || "") };
    return soll(/A1 gemerkt/.test(r.meldung) && r.ablage.includes("\"daten\"") && !KLAR.some((k) => r.ablage.includes(k)) && !r.ablage.includes("⟦"), r);
  });
  const kopie = await page.evaluate(() => navigator.clipboard.readText());
  const tok = (kopie.match(/Frau (⟦[A-Z]+-\d+⟧)/) || [])[1];

  await step("Nach Neuladen: „2 Zurück“ zeigt A1, Antwort passt von selbst, Zurückführen bringt den Namen", async () => {
    await page.reload({ waitUntil: "networkidle" }); await ready(page);
    await page.locator("[data-pseudo-fenster]").waitFor();
    await page.locator('[data-pseudo-reiter="zurueck"]').click();
    await page.locator('[data-pseudo-auftrag="A1"]').waitFor({ timeout: 10000 });
    await page.locator("[data-pseudo-antwort]").fill(`Liebe ${tok}, alles erledigt.`);
    await page.locator('[data-pseudo-passt="A1"]').waitFor();
    await page.locator("[data-pseudo-zurueckfuehren]").click();
    const klar = await page.locator("[data-pseudo-klar]").innerText();
    return soll(Boolean(tok) && klar.includes("Mara Testfeld"), { tok, klar });
  });

  await step("„✓ erledigt“ löscht die Zuordnung (Liste leer, Ablage ohne Eintrag)", async () => {
    await page.locator('[data-pseudo-auftrag="A1"] [data-pseudo-erledigt]').click();
    await page.waitForFunction(() => !document.querySelector('[data-pseudo-auftrag="A1"]'));
    const n = await page.evaluate(() => JSON.parse(localStorage.getItem("familienakte_pseudo_auftraege_v1") || "{}").eintraege?.length ?? -1);
    return soll(n === 0, { n });
  });

  await step("Mistral: Rückfrage, genau eine Anfrage ohne Klartext, Antwort zurückgeführt mit Betreff; Schlüssel nicht gemerkt", async () => {
    await page.evaluate(() => window.PBNetwork.setOffline(false));
    await page.locator('[data-pseudo-reiter="hin"]').click();
    await page.locator("[data-pseudo-text-auf]").click();
    await page.locator("[data-pseudo-text]").fill(BRIEF);
    await page.locator("[data-pseudo-los]").click();
    await page.locator('[data-pseudo-stueck="D01"]').waitFor();
    await page.locator("[data-pseudo-ki-wahl]").click();
    await page.locator('[data-pseudo-ki="mistral"]').click();
    await page.locator("[data-pseudo-schluessel]").fill("probe-schluessel-nur-test");
    await page.locator("[data-pseudo-ki-los]").click();
    await page.locator("[data-pseudo-mistral-ja]").click();
    await page.locator("[data-pseudo-klar]").waitFor({ timeout: 10000 });
    const r = { klar: await page.locator("[data-pseudo-klar]").innerText(), betreff: await page.locator(".pf-betreff").innerText().catch(() => ""), gemerkt: await page.evaluate(() => localStorage.getItem("familienakte_mistral_schluessel_v1")), anfrage: (mistral || "").slice(0, 60) };
    return soll(mistral && !KLAR.some((k) => mistral.includes(k)) && r.klar.includes("Mara Testfeld") && r.betreff === "Ihre Nachricht" && r.gemerkt === null, r);
  });

  await step("PDF: 👁 zeigt das gezeichnete Seitenbild mit Kästen; „KI sieht“ schwarz, „Text“ als Rückfall", async () => {
    await page.locator('[data-pseudo-reiter="hin"]').click();
    const pdf = Buffer.from(textAlsPdf(BRIEF, "Brief"));
    await page.locator("[data-pseudo-datei]").setInputFiles({ name: "Brief.pdf", mimeType: "application/pdf", buffer: pdf });
    const zeile = page.locator('[data-pseudo-stueck="D02"]'); await zeile.waitFor({ timeout: 30000 });
    await zeile.locator("[data-pseudo-auge]").click();
    const seite = page.locator("[data-pseudo-pdfseite]"); await seite.waitFor();
    await page.waitForFunction(() => Number(document.querySelector("[data-pseudo-pdfseite]")?.getAttribute("data-pseudo-pdfseite")) > 0, null, { timeout: 15000 }).catch(() => {});
    const r = { kaesten: Number(await seite.getAttribute("data-pseudo-pdfseite")), schwarz: await page.locator(".zeigt-ki .pf-kasten").first().evaluate((e) => getComputedStyle(e).backgroundColor).catch(() => ""),
      gemalt: await page.locator("[data-pseudo-pdfseite] canvas").evaluate((c) => c.width > 100) };
    await page.locator('[data-pseudo-form="text"]').click();
    const text = await page.locator("[data-pseudo-seite]").innerText();
    await page.locator("[data-pseudo-ansicht] .pf-blatt-fuss .pf-kn").click();
    return soll(r.kaesten >= 2 && r.schwarz === "rgb(17, 17, 17)" && r.gemalt && /⟦/.test(text) && !text.includes("Testfeld"), r);
  });

  await step("Als Datei → ZIP: eine ZIP mit D0x.txt, auftrag.md, LIES-MICH, ohne Klartext", async () => {
    await page.locator("[data-pseudo-speichern]").click();
    await page.locator("[data-pseudo-zip]").check();
    const vorher = await page.evaluate(() => window.__ausgabe.length);
    await page.locator("[data-pseudo-datei-los]").click();
    // Erst warten, bis die Ausgabe gespeichert ist (nicht nur begonnen) – sonst fehlen Stücke (CI 14.11.).
    await page.waitForFunction((n) => window.__ausgabe.length > n && window.__ausgabe[window.__ausgabe.length - 1].fertig, vorher, { timeout: 15000 });
    const d = await page.evaluate(() => { const a = window.__ausgabe[window.__ausgabe.length - 1]; return { name: a.name, roh: a.b64.map((x) => atob(x)).join("") }; });
    const roh = Buffer.from(d.roh, "latin1").toString("utf8");
    const r = { name: d.name, pk: roh.startsWith("PK"), auftrag: /auftrag\.md/.test(roh), lies: /LIES-MICH\.txt/.test(roh), d01: /D01\.txt/.test(roh), klar: ["Testfeld", "DE89 3704"].filter((k) => roh.includes(k)), laenge: roh.length };
    return soll(r.name.endsWith(".zip") && r.pk && r.auftrag && r.lies && r.d01 && !r.klar.length, r);
  });

  await step("Eingang: „An KI“ an einer Mail füllt das Fenster mit Text und Anlage", async () => {
    await page.locator("[data-pseudo-knopf]").dispatchEvent("click"); // aus
    const eml = ["From: Mara Testfeld <mara@example.org>", "To: info@example.org", "Subject: Rueckfrage", "MIME-Version: 1.0", 'Content-Type: multipart/mixed; boundary="X"', "", "--X", "Content-Type: text/plain; charset=utf-8", "", "Hallo, anbei die Liste. Mara Testfeld", "--X", 'Content-Type: text/plain; name="liste.txt"', 'Content-Disposition: attachment; filename="liste.txt"', "", "Anlage: Kundennummer bei Frau Mara Testfeld", "--X--", ""].join("\r\n");
    await footer(page, "Eingangszentrale");
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles({ name: "Rueckfrage.eml", mimeType: "message/rfc822", buffer: Buffer.from(eml) });
    await page.locator("[data-eingang-ki]").first().click();
    const zeile = page.locator('[data-pseudo-fenster] [data-pseudo-stueck]').filter({ hasText: "Mail" }).first();
    try { await zeile.waitFor({ timeout: 20000 }); } catch { return soll(false, { ki: await page.locator("[data-eingang-ki]").count(), fenster: await page.locator("[data-pseudo-fenster]").count(), zeilen: await page.locator("[data-pseudo-stueck]").allInnerTexts(), meldung: await page.locator("[data-pseudo-meldung]").innerText().catch(() => ""), ls: await page.evaluate(() => localStorage.getItem("familienakte_pseudo_v1")), knopf: await page.locator("[data-pseudo-knopf]").getAttribute("data-pseudo-knopf"), hash: await page.evaluate(() => location.hash), sicht: await page.locator("[data-eingang-ki]").isVisible() }); }
    await zeile.locator("[data-pseudo-auge]").click();
    const t = await page.locator("[data-pseudo-seite]").innerText();
    await page.locator("[data-pseudo-ansicht] .pf-blatt-fuss .pf-kn").click();
    return soll(/Anhang/.test(t) && !t.includes("Testfeld") && (await page.locator("[data-pseudo-knopf]").getAttribute("data-pseudo-knopf")) === "an", t.slice(0, 160));
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
  await context.close();

  // Assistenz am Handy: die Briefkarte ist nur noch der Einstieg ins Fenster.
  const handy = await browser.newContext({ ...HANDY, serviceWorkers: "block" });
  const seite = await handy.newPage(); const fehler2 = collectErrors(seite);
  await seite.goto(app.base, { waitUntil: "networkidle" }); await ready(seite);
  await step("Handy: Briefumschlag im Kopf (2.28.75: nicht mehr in der Assistenz) öffnet das Pseudo-Fenster (Antwortbrief, Textfeld) – keine zweite Bedienung", async () => {
    await seite.evaluate(() => window.scrollTo(0, 0));
    await seite.locator("[data-brief-knopf]").click();
    await seite.locator("[data-pseudo-text]").waitFor();
    await seite.locator("[data-pseudo-text]").fill("Sehr geehrte Frau Mara Testfeld, bitte zahlen Sie.");
    await seite.locator("[data-pseudo-los]").click();
    await seite.locator('[data-pseudo-stueck="D01"]').waitFor();
    const r = { felder: await seite.locator("[data-brief-antwort] textarea").count(), aufgabe: await seite.locator('[data-pseudo-fenster] .pf-chip[aria-pressed="true"]').innerText().catch(() => "") };
    return soll(r.felder === 0 && /Antwortbrief/.test(r.aufgabe), r);
  });
  await step("Handy: kein waagerechtes Scrollen mit offenem Fenster", async () => soll(await seite.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "zu breit"));
  check(fehler2.length === 0, "Handy: keine Seitenfehler", fehler2.join(" | "));
  await handy.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Pseudo-Aufträge"));
