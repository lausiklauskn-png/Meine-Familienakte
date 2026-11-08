// 2.28.39 (Prüfbericht Eingang, 08.11.2026): Prüfdialog und Warteschlange.
// H1 „ansehen“ beendet die Prüfung nicht · H2 kein Vorgang/keine Organisation ohne Zutun · H3 erkannte Frist und Garantie
// werden angezeigt und mit dem Dokument verknüpft angelegt · H4 die Startseite nimmt mehrere Dateien · H5 Titel, Datum und
// Textauszug im Register, Suche findet den Inhalt · M7 Warteschlange und Dialog lesen gleich · M8/K1 erledigte Zeilen ohne
// Knöpfe, Zähler filtern · M10 „Gespeichert ✓“ ersetzt „noch nichts gespeichert“. Alle Dateien erfunden.
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

/** PDF mit mehreren Textzeilen (erfunden). */
function pdfZeilen(name, zeilen) {
  const stream = zeilen.map((z, i) => `BT /F1 12 Tf 50 ${780 - i * 22} Td (${z.replace(/[()\\]/g, "")}) Tj ET`).join("\n");
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"];
  let out = "%PDF-1.4\n"; const off = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return { name, mimeType: "application/pdf", buffer: Buffer.from(out, "latin1") };
}
const BELEG = pdfZeilen("Beleg_Kuehlschrank_Frostling.pdf", ["Kaufbeleg Kuehlschrank Frostling (erfunden)", "Kaufdatum: 14.07.2026", "Seriennummer FRO-4711-XQ", "Garantie bis 14.07.2028", "Restbetrag bitte zahlen bis zum 01.12.2026."]);

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(15000);
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  const register = () => page.evaluate(async () => { const f = window.__vaultFixture; return f.readLocalVaultData(await f.browserVault()); });
  const vorher = await register();
  const modal = page.locator(".intake-modal");
  const zeile = () => page.locator(".intake-queue-item", { hasText: "Beleg Kuehlschrank Frostling" }).first();
  const aktivitaet = () => page.locator(".global-activity-lines").innerText().catch(() => "");

  await footer(page, "Eingangszentrale");
  await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([BELEG]);
  await step("M7/K4: Warteschlange liest den PDF-Text und nennt die Frist als TT.MM.JJJJ", async () => {
    await zeile().locator(".badge:not(:has-text('läuft'))").first().waitFor({ timeout: 30000 });
    const text = (await zeile().innerText()).replace(/\s+/g, " ");
    return soll(/Inhalt wurde für den Zuordnungsvorschlag gelesen/.test(text) && /01\.12\.2026/.test(text) && !/2026-12-01/.test(text), text.slice(0, 300));
  });
  await step("„Als Frist übernehmen“ öffnet die Prüfung mit angehakter Frist (Dokument wird nicht vergessen)", async () => {
    await zeile().locator("[data-frist-uebernehmen]").click();
    await modal.waitFor();
    await page.waitForFunction(() => /Text gelesen/.test(document.querySelector(".intake-modal")?.textContent || ""), null, { timeout: 30000 });
    const an = await modal.locator('[data-intake-frist-an="frist"]').isChecked();
    const datum = await modal.locator('[data-intake-frist-datum="frist"]').inputValue();
    return soll(an && datum === "2026-12-01", { an, datum });
  });
  await step("H2: kein Vorgang und keine Organisation vorgewählt", async () => {
    const vorgang = await modal.locator("[data-kontext-vorgang]").inputValue();
    const haken = await modal.locator("[data-zuordnung] input:checked").count();
    const stand = await modal.locator("[data-kontext-stand]").getAttribute("data-kontext-stand");
    return soll(vorgang === "" && haken === 0 && stand === "offen", { vorgang, haken, stand });
  });
  await step("H3/H5: Garantie erkannt, Titel und Dokumentdatum aus dem Text vorgeschlagen", async () => {
    await modal.locator('[data-intake-frist-an="garantie"]').check();
    const garantie = await modal.locator('[data-intake-frist-datum="garantie"]').inputValue();
    const titel = await modal.locator("[data-intake-titel]").inputValue();
    const datum = await modal.locator('input[name="documentDate"]').inputValue();
    return soll(garantie === "2028-07-14" && titel.trim().length > 0 && datum === "2026-07-14", { garantie, titel, datum });
  });
  await step("Speichern: Dialog zu, an der Zeile „Gespeichert ✓“, Meldung ersetzt „noch nichts gespeichert“", async () => {
    await modal.locator("button[type=submit]").click();
    await modal.waitFor({ state: "detached", timeout: 20000 });
    await zeile().locator("[data-gespeichert]").waitFor({ timeout: 20000 });
    const text = await aktivitaet();
    return soll(/Gespeichert ✓/.test(text) && !/noch nichts gespeichert/.test(text), text);
  });
  const nachher = await register();
  const doc = nachher.documents.find((d) => d.originalName === "Beleg_Kuehlschrank_Frostling.pdf");
  await step("H5: Register trägt Titel, Dokumentdatum und Textauszug (begrenzt)", async () => soll(doc && doc.titel && doc.documentDate === "2026-07-14" && /FRO-4711-XQ/.test(doc.textAuszug || "") && doc.textAuszug.length <= 20000, { titel: doc?.titel, datum: doc?.documentDate, auszug: doc?.textAuszug?.slice(0, 80) }));
  await step("H2: gespeichert ohne Vorgang und ohne „betrifft“-Verknüpfung", async () => {
    const eigene = nachher.relations.filter((r) => r.fromType === "document" && r.fromId === doc.id);
    return soll(eigene.length === 0, eigene.map((r) => `${r.relationType} ${r.toType}`));
  });
  await step("H3: Frist und Garantie angelegt und mit dem Dokument verknüpft", async () => {
    const neu = nachher.records.filter((r) => r.recordType === "deadline" && !vorher.records.some((v) => v.id === r.id));
    const verknuepft = neu.filter((r) => nachher.relations.some((rel) => rel.fromId === r.id && rel.toType === "document" && rel.toId === doc.id));
    const daten = neu.map((r) => r.data.dueAt).sort();
    return soll(neu.length === 2 && verknuepft.length === 2 && daten.join() === "2026-12-01,2028-07-14", { neu: neu.length, verknuepft: verknuepft.length, daten });
  });
  await step("M8: erledigte Zeile ohne aktive Knöpfe, mit „Zum Dokument“", async () => {
    const knoepfe = await zeile().locator("button", { hasText: /Zuordnung prüfen|Als Frist übernehmen|Zurückstellen/ }).count();
    const zum = await zeile().locator("[data-zum-dokument]").count();
    return soll(knoepfe === 0 && zum === 1, { knoepfe, zum });
  });
  await step("K1: Zählerkasten filtert die Liste, „Alle zeigen“ hebt auf; ein Zähler mit 0 ist kein Knopf (U8)", async () => {
    // Ein Kasten mit 0 hat nichts zu zeigen und ist darum kein Knopf; gefiltert wird mit dem ersten Kasten, der Einträge hat.
    const leer = await page.locator("[data-eingang-filter-leer]").count();
    const status = { pruefen: /Prüfung erforderlich/, bereit: /Bereit zur Übernahme/, zurueck: /Zurückgestellt/ };
    const f = (await page.locator("[data-queue-filter]").count()) ? (await page.locator("[data-queue-filter]").first().getAttribute("data-queue-filter")) || "" : "";
    if (!f) return soll(leer === 3, { leer });
    await page.locator(`[data-queue-filter="${f}"]`).click();
    const gefiltert = await page.locator(".intake-queue-item").count();
    const nurPruefen = await page.locator(".intake-queue-item").evaluateAll((els, quelle) => els.every((e) => new RegExp(quelle).test(e.querySelector(".badge")?.textContent || "")), status[f].source);
    await page.locator("[data-queue-filter-an] button").click();
    const alle = await page.locator(".intake-queue-item").count();
    return soll(nurPruefen && alle >= gefiltert && alle >= 1, { gefiltert, alle, nurPruefen });
  });
  await step("H5: Suche oben nach der Seriennummer im Text findet das Dokument", async () => {
    await page.locator(".global-search input").fill("FRO-4711-XQ");
    await page.waitForSelector(".search-results", { timeout: 10000 });
    // 2.28.39 Punkt 9: die Art steht als Gruppe/Merkmal an der kompakten Zeile, nicht mehr als Wort in der Zeile.
    const treffer = await page.locator('.search-results article[data-such-art="Dokument"]').allInnerTexts();
    await page.locator(".global-search input").fill("");
    return soll(treffer.some((t) => t.includes(doc.titel)), treffer.slice(0, 3));
  });

  // ---------- H1: Dublette ansehen beendet die Prüfung nicht ----------
  await footer(page, "Eingangszentrale");
  await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([BELEG]);
  const dublette = page.locator(".intake-queue-item", { hasText: "Mögliche Dublette" }).first();
  await step("H1/K3: Dublettenwarnung nennt den Titel statt der Kennung", async () => {
    await dublette.locator("button", { hasText: "Zuordnung prüfen" }).click();
    await modal.locator(".duplicate-warning").waitFor();
    const text = await modal.locator(".duplicate-warning").innerText();
    return soll(text.includes(doc.titel) && !text.includes(doc.id), text);
  });
  await step("H1: „ansehen“ öffnet das vorhandene Dokument, Prüfung und Eingang bleiben offen", async () => {
    await modal.locator("[data-dublette-ansehen]").first().click();
    await page.waitForTimeout(800);
    const offen = await modal.isVisible();
    const status = await dublette.locator(".badge").first().innerText();
    await page.locator(".file-viewer button[aria-label='Vorschau schließen']").click().catch(() => {});
    return soll(offen && !/Übernommen/.test(status), { offen, status });
  });
  await step("H1: „Ist dasselbe“ schließt den Eingang ohne Kopie ab", async () => {
    const anzahl = (await register()).documents.length;
    await modal.locator("[data-dublette-dasselbe]").first().click();
    await modal.waitFor({ state: "detached" });
    const danach = (await register()).documents.length;
    const text = await page.locator(".intake-queue-item", { hasText: "Nicht doppelt abgelegt" }).count();
    return soll(danach === anzahl && text === 1, { anzahl, danach, text });
  });

  // ---------- H4: Startseite nimmt mehrere Dateien ----------
  await footer(page, "Startseite").catch(async () => { await page.locator(".breadcrumb button", { hasText: "Startseite" }).click(); });
  await step("H4: Startseite – zwei Dateien gehen beide in die Eingangszentrale", async () => {
    await page.locator(".document-intake input[type=file]").first().setInputFiles([pdfZeilen("Start_Eins_Probe.pdf", ["Erste Probe (erfunden)"]), pdfZeilen("Start_Zwei_Probe.pdf", ["Zweite Probe (erfunden)"])]);
    await page.locator("h1", { hasText: "Eingangszentrale" }).waitFor({ timeout: 15000 });
    await page.locator(".intake-queue-item", { hasText: "Start Zwei Probe" }).waitFor();
    return soll(await page.locator(".intake-queue-item", { hasText: "Start Eins Probe" }).count() === 1, "erste Datei fehlt");
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Eingang prüfen und ablegen"));
