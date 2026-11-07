// Hilfe-Gestaltung 2.28.33 (Plan 07.11.2026, P2): Benutzerabnahme als Bild mit Stand-Farben, Kartenhilfe mit Sprung und rotem
// Rahmen (weg beim nächsten Tipp), mitwandernde Seitenleiste (alle zu/auf, nach oben, zurück, Startseite), Symbol „Wo liegt was?“.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  for (const [name, geraet] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const context = await browser.newContext(geraet);
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await footer(page, "Hilfe");

    await step(`${name}: „Wo liegt was?“ hat ein Symbol wie die anderen Themen`, async () =>
      (await page.locator('[data-hilfe-id="wo-liegt-was"] summary').first().locator("svg").count()) === 1);

    await step(`${name}: Benutzerabnahme als Bild: drei Blöcke, 15 Fragen, ab Werk rot (noch keine Antwort)`, async () => {
      const d = page.locator("details[data-benutzerabnahme-hilfe]");
      await d.locator("summary").click();
      const bloecke = await d.locator("[data-abnahme-block]").count();
      const fragen = d.locator("[data-abnahme-frage]");
      const n = await fragen.count();
      const rot = await fragen.evaluateAll((l) => l.every((e) => e.classList.contains("art-warnung") && e.dataset.stand === "offen"));
      return bloecke === 3 && n === 15 && rot;
    });
    await step(`${name}: Tipp auf eine Frage führt zur Systemprüfung, Frage rot gerahmt`, async () => {
      await page.locator('[data-abnahme-frage="user-microphone"]').click();
      await page.locator("#benutzerabnahme").waitFor();
      await page.waitForTimeout(1100);
      const gerahmt = await page.locator('[data-user-test="user-microphone"]').evaluate((e) => e.classList.contains("hilfe-ziel-rahmen"));
      return gerahmt;
    });
    await step(`${name}: roter Rahmen geht weg, sobald man dort etwas tut`, async () => {
      await page.waitForTimeout(300);
      await page.mouse.click(5, 200); await page.waitForTimeout(150);
      return (await page.locator(".hilfe-ziel-rahmen").count()) === 0;
    });

    await step(`${name}: Kartenhilfe „Frist oder Aufgabe anlegen“ springt zur Karte und rahmt sie rot`, async () => {
      await footer(page, "Hilfe");
      const k = page.locator("details[data-kartenhilfe]");
      await k.locator(":scope > summary").click();
      const e = k.locator('details[data-kartenhilfe-eintrag="Frist oder Aufgabe anlegen"]');
      await e.locator("summary").click();
      await e.locator("button.hilfe-sprung").click();
      await page.waitForTimeout(1400);
      const r = await page.locator(".hilfe-ziel-rahmen").first().evaluate((el) => ({ text: el.innerText.slice(0, 200), oben: el.getBoundingClientRect().top, unten: el.getBoundingClientRect().bottom })).catch(() => null);
      return r && /Frist oder Aufgabe anlegen/.test(r.text) ? true : JSON.stringify(r);
    });
    await step(`${name}: Zurück führt in die Hilfe; der Eintrag ist offen und markiert`, async () => {
      await page.goBack(); await page.waitForSelector("details[data-kartenhilfe]"); await page.waitForTimeout(800);
      const offen = await page.locator('details[data-kartenhilfe-eintrag="Frist oder Aufgabe anlegen"]').evaluate((e) => e.open);
      const markiert = await page.locator(".zurueck-hier").first().innerText().catch(() => "");
      return offen && /Frist oder Aufgabe anlegen/.test(markiert) ? true : `offen=${offen} „${markiert.slice(0, 50)}“`;
    });
    await step(`${name}: „Offene Fristen und Aufgaben“ mit offenen Punkten: Rahmen rot, nicht grün`, async () => {
      const e = page.locator('details[data-kartenhilfe-eintrag="Offene Fristen und Aufgaben"]');
      if (!(await e.evaluate((d) => d.open))) await e.locator("summary").click();
      await e.locator("button.hilfe-sprung").click(); await page.waitForTimeout(1300);
      const r = await page.locator("#offene-fristen").evaluate((el) => ({ stand: el.dataset.zielStand, rot: el.classList.contains("hilfe-ziel-rahmen"), gruen: el.classList.contains("hilfe-ziel-gut") }));
      await page.goBack(); await page.waitForSelector("details[data-kartenhilfe]"); await page.waitForTimeout(500);
      return r.stand === "offen" && r.rot && !r.gruen ? true : JSON.stringify(r);
    });

    await step(`${name}: Seitenleiste: Griff rechts, öffnet Knöpfe, „Alle zuklappen“ schließt alle Hilfe-Themen`, async () => {
      await page.locator('details[data-hilfe-thema="notiz"] summary').click();
      const griff = page.locator(".seitenleiste-griff");
      const g = await griff.boundingBox();
      const rechts = g && Math.abs(g.x + g.width - page.viewportSize().width) <= 2;
      await griff.click();
      const knoepfe = await page.locator(".seitenleiste-knoepfe [data-leiste]").evaluateAll((l) => l.map((e) => e.dataset.leiste));
      const alleText = await page.locator('[data-leiste="alle"]').innerText();
      await page.locator('[data-leiste="alle"]').click(); await page.waitForTimeout(200);
      const offen = await page.locator("main details[open]").count();
      return rechts && knoepfe.join(",") === "alle,oben,unten,zurueck,start,auswahl" && /zuklappen/.test(alleText) && offen === 0 ? true : JSON.stringify({ rechts, knoepfe, alleText, offen });
    });
    await step(`${name}: Seitenleiste: „Startseite“ und „Zurück“`, async () => {
      await page.locator(".seitenleiste-griff").click(); await page.locator('[data-leiste="start"]').click(); await page.waitForTimeout(400);
      const start = await page.evaluate(() => location.hash);
      await page.locator(".seitenleiste-griff").click(); await page.locator('[data-leiste="zurueck"]').click(); await page.waitForTimeout(500);
      const zurueck = await page.evaluate(() => location.hash);
      return start === "#startseite" && zurueck === "#help" ? true : `${start} → ${zurueck}`;
    });
    await step(`${name}: Seitenleiste verdeckt den KI-Knopf nicht, Seite läuft nicht quer`, async () => {
      const r = await page.evaluate(() => {
        const a = document.querySelector(".seitenleiste-griff").getBoundingClientRect(), b = document.querySelector(".ki-fab")?.getBoundingClientRect();
        return { ueber: b ? !(a.bottom < b.top || a.top > b.bottom || a.right < b.left || a.left > b.right) : false, quer: document.documentElement.scrollWidth - innerWidth };
      });
      return !r.ueber && r.quer <= 1 ? true : JSON.stringify(r);
    });
    check(errors.length === 0, `${name}: keine Seitenfehler`, errors.join(" | "));
    await context.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Hilfe-Gestaltung"));
