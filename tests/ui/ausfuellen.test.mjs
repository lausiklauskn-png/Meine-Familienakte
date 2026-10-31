// Sitzung F (Klaus 2026-10-31): Ausfüllen mit dem Kern von Workflow PDF — im echten Browser, mit erfundenem Formular.
// Weg: Formular ablegen → „Ausfüllen“ → Felder erkennen (offline) → mit KI benennen (Vorschau, Antwort einfügen) → Person wählen →
// Vorbelegen → E-Mail tippen → festes PDF als neue Unterlage → Marke → wieder öffnen: Eingabe-Speicher schlägt vor (an/aus) →
// Unterschrift zeichnen und verschlüsselt merken → einsetzen mit Passwort → vormerken → Cockpit „Muss noch ausgefüllt werden“.
import { writeFileSync, mkdirSync } from "node:fs";
import { inflateSync } from "node:zlib";
import path from "node:path";
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, summary, collectErrors, ROOT } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";

// Erfundenes Formular: Beschriftungen mit Linien dahinter, zwei Kästchen, Unterschriftslinie. Stadt Musterstadt gibt es nicht.
function formularPdf() {
  const z = [];
  const text = (x, y, s, gr = 11) => z.push(`BT /F1 ${gr} Tf ${x} ${y} Td (${s}) Tj ET`);
  const linie = (x0, y, x1) => z.push(`0 0 0 RG 1 w ${x0} ${y} m ${x1} ${y} l S`);
  const kasten = (x, y, s) => z.push(`0 0 0 RG 1 w ${x} ${y} ${s} ${s} re S`);
  text(50, 790, "Antrag auf Bewohnerparkausweis - Stadt Musterstadt (erfunden)", 15);
  const zeilen = [["Vorname:", 720], ["Nachname:", 680], ["Geburtsdatum:", 640], ["E-Mail:", 600], ["Kennzeichen:", 560]];
  for (const [l, y] of zeilen) { text(50, y + 3, l); linie(160, y, 520); }
  kasten(50, 500, 12); text(70, 502, "Ich habe einen Wohnsitz in Musterstadt.");
  kasten(50, 470, 12); text(70, 472, "Ich bin Halter des Fahrzeugs.");
  linie(50, 380, 300); text(50, 366, "Datum, Unterschrift", 9);
  const stream = z.join("\n");
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"];
  let out = "%PDF-1.4\n"; const off = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}
const LZ = path.join(ROOT, "tests/testdateien/.laufzeit"); mkdirSync(LZ, { recursive: true });
const FORM = path.join(LZ, "Antrag_Bewohnerparkausweis_Musterstadt.pdf"); writeFileSync(FORM, formularPdf());

const app = await startApp();
const browser = await launchBrowser();
const context = await browser.newContext({ ...DESKTOP, acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(15000);
await page.addInitScript(windowStub);
const errors = collectErrors(page);
const dlg = page.locator("[data-af]");
const feldMit = async (label) => dlg.locator(`[data-af-feld][aria-label="${label}"], [data-af-feld][title="${label}"]`).first();
const oeffneAusfuellen = async () => {
  await footer(page, "Eingangszentrale");
  const item = page.locator(".document-item", { hasText: "Antrag_Bewohnerparkausweis_Musterstadt.pdf" }).filter({ hasNotText: "ausgefuellt" }).first();
  await item.locator("[data-af-oeffnen]").click();
  await dlg.locator(".af-seite").first().waitFor({ timeout: 30000 });
};

try {
  await step("Start und Formular in der Akte ablegen", async () => {
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await footer(page, "Eingangszentrale");
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([FORM]);
    const q = page.locator(".intake-queue-item", { hasText: "Antrag Bewohnerparkausweis Musterstadt" }).first();
    await q.locator("button", { hasText: "Zuordnung prüfen" }).click();
    await page.locator(".intake-modal button[type=submit]").click();
    await page.locator(".intake-modal").waitFor({ state: "detached", timeout: 20000 });
    await page.locator(".document-item", { hasText: "Antrag_Bewohnerparkausweis_Musterstadt" }).first().waitFor({ timeout: 20000 });
  });
  await step("Knopf „Ausfüllen“ an der Unterlage öffnet das Fenster mit der Seite", async () => { await oeffneAusfuellen(); return `${await dlg.locator(".af-seite").count()} Seite`; });
  await step("Felder erkennen (offline): Linien und Kästchen mit Beschriftung aus der Textebene", async () => {
    await dlg.locator("[data-af-erkennen]").click();
    await dlg.locator("[data-af-hinweis]", { hasText: "vorgeschlagen" }).waitFor({ timeout: 30000 });
    const labels = await dlg.locator(".af-feld .af-label").allInnerTexts();
    const n = labels.length;
    if (n < 5 || !labels.some((l) => /Vorname/.test(l)) || !labels.some((l) => /Nachname/.test(l))) throw new Error(`${n} Felder: ${labels.join(" | ")}`);
    return `${n} Felder: ${labels.slice(0, 8).join(" | ")}`;
  });
  await step("Mit KI benennen: Vorschau ohne Werte, Antwort einfügen, Benennungen übernommen", async () => {
    await dlg.locator("[data-af-ki]").click();
    const vorschau = await dlg.locator("[data-af-ki-vorschau] textarea").first().inputValue();
    if (!/NUR mit JSON/.test(vorschau) || !/Eingabestellen:/.test(vorschau)) throw new Error(vorschau.slice(0, 200));
    await dlg.locator("[data-af-ki-antwort]").fill('```json\n{"felder":[{"nr":5,"bezeichnung":"Kfz-Kennzeichen","typ":"text"}],"kein":[]}\n```');
    await dlg.locator("[data-af-ki-uebernehmen]").click();
    await dlg.locator("[data-af-hinweis]", { hasText: "von der KI benannt" }).waitFor();
    return (await dlg.locator(".af-feld .af-label").allInnerTexts()).some((l) => l === "Kfz-Kennzeichen") ? "Feld 5 heißt jetzt „Kfz-Kennzeichen“" : false;
  });
  await step("Feld von Hand setzen: Werkzeug „Unterschrift“, Tipp auf die Seite", async () => {
    await dlg.locator("[data-af-werkzeug]").selectOption("unterschrift");
    const seite = dlg.locator(".af-seite").first(); const s = await seite.boundingBox();
    await seite.click({ position: { x: s.width * 0.55, y: s.height * 0.62 } });   // freie Stelle rechts neben der Unterschriftslinie (rollt ins Bild)
    return (await dlg.locator(".af-feld.af-unterschrift").count()) >= 1;
  });
  await step("Ausfüllen: Person wählen und vorbelegen (Name, Geburtsdatum gelb)", async () => {
    await dlg.locator("[role=tab]", { hasText: "Ausfüllen" }).click();
    await dlg.locator("[data-af-person]").selectOption({ label: "Gerlinde Arenberg" });
    await dlg.locator("[data-af-vorbelegen]").click();
    const vor = await (await feldMit("Vorname:")).inputValue().catch(async () => (await feldMit("Vorname")).inputValue());
    const gelb = await dlg.locator(".af-feld.af-vorschlag").count();
    if (vor !== "Gerlinde" || gelb < 2) throw new Error(`Vorname „${vor}“, gelb ${gelb}`);
    return `Vorname „${vor}“, ${gelb} gelb`;
  });
  await step("E-Mail tippen und festes PDF speichern → neue Unterlage neben dem Original", async () => {
    const mail = dlg.locator("input[data-af-feld][type=email]").first();
    await mail.fill("tommy.flinkfuss@beispiel.invalid");
    await dlg.locator("[data-af-fest]").click();
    await dlg.locator("[data-af-hinweis]", { hasText: "neben dem Original" }).waitFor({ timeout: 30000 }).catch(async () => { throw new Error(`${await dlg.locator("[data-af-hinweis]").innerText().catch(() => "kein Hinweis")} · ${errors.join(" | ").slice(0, 300)}`); });
    return (await dlg.locator("[data-af-teilen]").count()) === 1;
  });
  await step("Teilen (ohne Teilen-Funktion im Testbrowser: Herunterladen) liefert ein PDF mit den Einträgen", async () => {
    const [dl] = await Promise.all([page.waitForEvent("download"), dlg.locator("[data-af-teilen]").click()]);
    const b = Buffer.from(await (await dl.createReadStream()).toArray().then((c) => Buffer.concat(c)));
    const hex = (s) => Buffer.from(s, "latin1").toString("hex").toUpperCase();
    // pdf-lib packt Seiteninhalte (FlateDecode) — entpacken, dann suchen.
    const s = b.toString("latin1") + [...b.toString("latin1").matchAll(/stream\r?\n([\s\S]*?)endstream/g)].map((m) => { try { return inflateSync(Buffer.from(m[1], "latin1")).toString("latin1"); } catch { return ""; } }).join("\n");
    const drin = (w) => s.includes(w) || s.toUpperCase().includes(hex(w));
    if (!s.startsWith("%PDF") || !drin("Gerlinde") || !drin("tommy.flinkfuss@beispiel.invalid")) throw new Error(`${dl.suggestedFilename()} ${b.length} Byte, Gerlinde: ${drin("Gerlinde")}`);
    return `${dl.suggestedFilename()} · ${b.length} Byte`;
  });
  await step("Fenster zu: Original trägt „Ausgefüllt“, die neue Fassung „Ausgefüllte Fassung“", async () => {
    await dlg.locator("button[aria-label='Ausfüllen schließen']").click();
    await page.locator(".document-item [data-af-marke]", { hasText: "Ausgefüllte Fassung" }).first().waitFor({ timeout: 15000 });
    const orig = await page.locator(".document-item", { hasText: "Antrag_Bewohnerparkausweis_Musterstadt.pdf" }).filter({ hasNotText: "ausgefuellt 20" }).first().innerText();
    return /Ausgefüllt/.test(orig) ? "Marken stehen" : false;
  });
  await step("Wieder öffnen: Felder gemerkt, Eingabe-Speicher schlägt nach „to“ die E-Mail vor", async () => {
    await oeffneAusfuellen();
    const mail = dlg.locator("input[data-af-feld][type=email]").first();
    await mail.click(); await mail.fill("to");
    await dlg.locator("[data-af-vorschlaege] button", { hasText: "tommy.flinkfuss@beispiel.invalid" }).click();
    return (await mail.inputValue()) === "tommy.flinkfuss@beispiel.invalid";
  });
  await step("Schalter „Eingaben merken“ aus: kein Vorschlag mehr", async () => {
    await dlg.locator("[data-af-speicher-schalter]").uncheck();
    const mail = dlg.locator("input[data-af-feld][type=email]").first();
    await mail.click(); await mail.fill("to"); await page.waitForTimeout(300);
    const n = await dlg.locator("[data-af-vorschlaege]").count();
    await dlg.locator("[data-af-speicher-schalter]").check();
    return n === 0;
  });
  await step("Unterschrift zeichnen und mit Passwort verschlüsselt merken", async () => {
    await dlg.locator(".af-feld.af-unterschrift").first().click();
    await dlg.locator(".af-us-merken summary").click();
    await dlg.locator("[data-af-us-neu1]").fill("Probe-Passwort-2026");
    await dlg.locator("[data-af-us-neu2]").fill("Probe-Passwort-2026");
    const c = await dlg.locator("[data-af-pad]").boundingBox();
    await page.mouse.move(c.x + 30, c.y + c.height * 0.6); await page.mouse.down();
    for (let i = 1; i < 20; i++) await page.mouse.move(c.x + 30 + i * 12, c.y + c.height * (0.6 - Math.sin(i / 3) * 0.25));
    await page.mouse.up();
    await dlg.locator("[data-af-pad-fertig]").click();
    await dlg.locator("[data-af-hinweis]", { hasText: "verschlüsselt im Datentresor gemerkt" }).waitFor();
    return (await dlg.locator(".af-feld.af-unterschrift img").count()) >= 1;
  });
  await step("Im Register liegt die Unterschrift nur verschlüsselt (kein PNG im Klartext)", async () => {
    const roh = await page.evaluate(async () => {
      const suche = async (d) => { for await (const [n, h] of d.entries()) { if (h.kind === "file" && n === "Familienakte_Register.json") return (await h.getFile()).text(); if (h.kind === "directory") { const r = await suche(h); if (r) return r; } } return null; };
      return suche(await navigator.storage.getDirectory());
    });
    if (!roh) throw new Error("Register nicht gefunden");
    const reg = JSON.parse(roh);
    const u = reg.ausfuellUnterschriften || {};
    const paket = Object.values(u)[0];
    return paket && !JSON.stringify(u).includes("iVBOR") && !JSON.stringify(u).includes("data:image") && reg.ausfuellSpeicher?.eintraege?.email?.length ? `Paket v${paket.v} · Speicher: ${reg.ausfuellSpeicher.eintraege.email.length} E-Mail` : false;
  });
  await step("Gespeicherte Unterschrift: falsches Passwort abgewiesen, richtiges setzt ein", async () => {
    await dlg.locator(".af-feld.af-unterschrift").first().click();
    if (!(await dlg.locator("[data-af-us-passwort]").count())) throw new Error(`kein Passwortfeld: ${(await dlg.locator("[data-af-unterschrift]").innerText().catch(() => "kein Pad")).replace(/\s+/g, " ").slice(0, 200)}`);
    await dlg.locator("[data-af-us-passwort]").fill("falsch-falsch");
    await dlg.locator("[data-af-us-einsetzen]").click();
    await dlg.locator("[data-af-hinweis]", { hasText: "passt nicht" }).waitFor();
    await dlg.locator("[data-af-us-passwort]").fill("Probe-Passwort-2026");
    await dlg.locator("[data-af-us-einsetzen]").click();
    await dlg.locator("[data-af-hinweis]", { hasText: "Gespeicherte Unterschrift eingesetzt" }).waitFor();
  });
  await step("„Später ausfüllen (vormerken)“ → Cockpit zeigt „Muss noch ausgefüllt werden“", async () => {
    await dlg.locator("[data-af-vormerken]").click();
    await dlg.locator("[data-af-hinweis]", { hasText: "Vorgemerkt" }).waitFor();
    await dlg.locator("button[aria-label='Ausfüllen schließen']").click();
    await footer(page, "Interaktives Cockpit");
    const k = page.locator("[data-cockpit-ausfuellen]");
    await k.waitFor();
    const t = await k.innerText();
    await k.locator("button", { hasText: "Antrag_Bewohnerparkausweis_Musterstadt" }).click();
    await dlg.locator(".af-seite").first().waitFor({ timeout: 30000 });
    return t.includes("Muss noch ausgefüllt werden") ? "Cockpit-Eintrag öffnet das Ausfüllen" : false;
  });
  await step("Handy-Breite: Fenster passt ohne Querrollen", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const breit = await page.evaluate(() => document.querySelector("[data-af]").scrollWidth <= window.innerWidth + 1);
    await page.setViewportSize(DESKTOP.viewport);
    return breit;
  });
  check(!errors.filter((e) => !/favicon|ERR_|net::/i.test(e)).length, "Keine Seitenfehler", errors.slice(0, 3).join(" | "));
} finally {
  await browser.close(); await app.stop();
}
process.exit(summary("Ausfüllen"));
