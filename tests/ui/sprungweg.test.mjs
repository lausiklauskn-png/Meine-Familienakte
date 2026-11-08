// 2.28.39 Gemeinsamer Sprungweg (app/sprung.ts): Bereich öffnen → nach dem Zeichnen einmal zum Ziel → Ziel markieren.
// Gemessen wird je Sprung jedes Bild (requestAnimationFrame): kein Zwischenstopp oben (Hoch-Runter), Ziel im Bild, markiert.
// Dazu die Navigationsfunde U1–U12 aus dem Prüfbericht vom 08.11.2026.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, step, summary, footer, ruhig, openMenu, collectErrors } from "./_harness.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();

/** Bilder mitschreiben, klicken, warten; liefert Scrollverlauf und Lage des Ziels. */
async function springe(page, knopf, ziel, { marke = ".zurueck-hier, .hilfe-ziel-rahmen" } = {}) {
  await knopf.scrollIntoViewIfNeeded(); await ruhig(page);
  const vorher = await page.evaluate(() => Math.round(scrollY));
  // Erst ab dem Klick mitschreiben (vorher stand die Seite, wo sie stand).
  await page.evaluate(() => { window.__bilder = []; window.__ab = false; document.addEventListener("click", () => { window.__ab = true; }, { capture: true, once: true }); const t0 = performance.now(); const f = () => { if (window.__ab) window.__bilder.push(document.documentElement.classList.contains("sprung-wartet") ? -1 : Math.round(scrollY)); if (performance.now() - t0 < 1600) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await knopf.click();
  await page.waitForTimeout(1700);
  return page.evaluate(({ ziel, marke }) => {
    // -1 = Inhalt noch unsichtbar (wartet auf das Ziel) – solche Bilder zeigen nichts und zählen nicht.
    const bilder = window.__bilder; const ende = bilder[bilder.length - 1]; const unsichtbar = bilder.filter((y) => y < 0).length;
    const el = [...document.querySelectorAll(ziel)].find((e) => e.getClientRects().length);
    const r = el?.getBoundingClientRect();
    const markiert = Boolean(el && (el.matches(marke) || el.querySelector(marke) || el.closest(marke)));
    // Hoch-Runter: ein Bild nahe 0, obwohl das Ziel weiter unten liegt.
    const obenBilder = ende > 300 ? bilder.filter((y) => y >= 0 && y < 40).length : 0;
    return { bilder: bilder.length, ende, obenBilder, imBild: Boolean(r && r.top >= 0 && r.top < innerHeight - 30), top: r ? Math.round(r.top) : null, markiert, unsichtbar, hash: location.hash };
  }, { ziel, marke }).then((x) => ({ ...x, vorher }));
}
const ohneHochRunter = (m) => m.obenBilder === 0;

try {
  for (const [geraet, profil] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const context = await browser.newContext(profil);
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    const start = async () => { await page.evaluate(() => window.scrollTo(0, 0)); await page.locator(".site-brand").click(); await page.waitForTimeout(500); };
    const suche = async (wort) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.fill(".global-search input", wort); await page.waitForTimeout(700); };

    await step(`${geraet}: U1 Suche → Tagebuch-Treffer: Eintrag im Bild und markiert, Treffer heißt „Tagebuch“ (U12)`, async () => {
      await suche("Waschmaschine pumpt");
      const treffer = page.locator("main button, main a").filter({ hasText: /Waschmaschine pumpt/ }).first();
      const art = await treffer.innerText();
      const m = await springe(page, treffer, ".memory-detail");
      await page.fill(".global-search input", "");
      return soll(m.hash === "#memory" && m.imBild && m.markiert && ohneHochRunter(m) && /Tagebuch/.test(art) && !/^Erinnerung/.test(art.trim()), { m, art: art.slice(0, 80) });
    });

    await step(`${geraet}: U6 Suche → Frist: öffnet „Fristen und Aufgaben“ mit der Zeile im Bild und markiert`, async () => {
      await suche("Garantie Waschmaschine");
      const treffer = page.locator("main button").filter({ hasText: /Frist.*Garantie|Garantie.*läuft ab/ }).first();
      const m = await springe(page, treffer, "main .schedule-item[id^='termin-']:has(.zurueck-hier), main .schedule-item.zurueck-hier");
      await page.fill(".global-search input", "");
      return soll(m.hash === "#reminders" && m.imBild && m.markiert && ohneHochRunter(m), m);
    });

    await step(`${geraet}: U6/U10 Startseite „Zuletzt wichtig“ → Aufgabe öffnet in „Fristen und Aufgaben“, nicht im Cockpit`, async () => {
      await start();
      const knopf = page.locator("main .priority-recent > button").filter({ hasText: "Zählerstände an die Hausverwaltung" }).first();
      const m = await springe(page, knopf, "main .schedule-item.zurueck-hier");
      return soll(m.hash === "#reminders" && m.imBild && m.markiert, m);
    });

    await step(`${geraet}: U11 Kopf-Kasten „Nächste Frist“ öffnet genau diese Frist`, async () => {
      await start();
      const knopf = page.locator('main [data-hero-ziel="frist"]');
      const titel = (await knopf.locator("strong").innerText()).trim();
      const m = await springe(page, knopf, "main .schedule-item.zurueck-hier");
      const zeile = await page.locator("main .schedule-item.zurueck-hier").innerText().catch(() => "");
      return soll(m.hash === "#reminders" && m.imBild && zeile.includes(titel.slice(0, 12)), { m, titel });
    });

    await step(`${geraet}: U4 Startseite „Offene Memory-Fragen“ → Abschnitt „Offene Memory-Punkte“ im Bild, markiert`, async () => {
      await start();
      const knopf = page.locator("main button").filter({ hasText: "Offene Memory-Fragen" }).first();
      const m = await springe(page, knopf, "#memory-open-points");
      return soll(m.hash === "#memory" && m.imBild && m.markiert && ohneHochRunter(m), m);
    });

    await step(`${geraet}: U5 Tagebuch – Tipp auf einen offenen Punkt holt die Detailkarte ins Bild`, async () => {
      const punkt = page.locator("#memory-open-points .memory-open-list article > button").first();
      const m = await springe(page, punkt, ".memory-detail");
      return soll(m.imBild && m.markiert, m);
    });

    await step(`${geraet}: Cockpit → Vorgang: Detail direkt im Bild und markiert, kein Zwischenstopp oben`, async () => {
      await footer(page, "Interaktives Cockpit");
      const vorgang = page.locator("#cockpit-cases .cockpit-case-list button").first();
      const m = await springe(page, vorgang, "#cockpit-dossier");
      return soll(m.imBild && m.markiert && ohneHochRunter(m), m);
    });

    await step(`${geraet}: U3 „N Aufgaben“ im Vorgang zeigt die Liste der offenen Aufgaben`, async () => {
      const knopf = page.locator(".case-open-summary button").filter({ hasText: "Aufgaben" }).first();
      const zahl = Number((await knopf.innerText()).match(/\d+/)?.[0] || 0);
      const m = await springe(page, knopf, zahl ? "#case-open-task" : "#case-open-details");
      const eintraege = await page.locator("#case-open-task [data-case-open-punkt]").count();
      return soll(m.imBild && m.markiert && (zahl === 0 || eintraege === zahl), { m, zahl, eintraege });
    });

    await step(`${geraet}: U3 Tipp auf eine offene Aufgabe öffnet sie in „Fristen und Aufgaben“`, async () => {
      const punkt = page.locator("#case-open-task [data-case-open-punkt]").first();
      if (!(await punkt.count())) return "kein offener Punkt in diesem Vorgang";
      const m = await springe(page, punkt, "main .schedule-item.zurueck-hier");
      return soll(m.hash === "#reminders" && m.imBild, m);
    });

    await step(`${geraet}: U2 Familie → „Gemeinsame Vorgänge“ landet bei „Offene Vorgänge“; „Personenakten“ ist ehrlich benannt`, async () => {
      await footer(page, "Interaktives Cockpit"); await start();
      await page.locator(".object-card").filter({ hasText: /Familie/ }).first().click(); await page.waitForTimeout(500);
      const personen = await page.locator("main .object-card").filter({ hasText: /^.*Personenakten/ }).count();
      const knopf = page.locator("main .object-card").filter({ hasText: "Gemeinsame Vorgänge" }).first();
      const m = await springe(page, knopf, "#cockpit-cases");
      return soll(m.hash === "#cockpit" && m.imBild && m.markiert && personen === 0, { m, personen });
    });

    await step(`${geraet}: U9 Verknüpfungen in einer Frist tragen Namen statt Kennung`, async () => {
      await footer(page, "Fristen und Aufgaben");
      const links = await page.evaluate(async () => {
        const auge = [...document.querySelectorAll("main [data-termin-auge]")];
        for (const a of auge.slice(0, 6)) a.click();
        await new Promise((r) => setTimeout(r, 300));
        return [...document.querySelectorAll("main .schedule-links button")].map((b) => b.innerText.replace(/\s+/g, " ").trim());
      });
      const roh = links.filter((t) => /:\s*[A-Z]{3,5}-\d{6}$/.test(t));
      return soll(links.length > 0 && roh.length === 0, { links: links.slice(0, 6), roh });
    });

    await step(`${geraet}: U8 Eingangszentrale – Zähler mit 0 sind kein Knopf`, async () => {
      await footer(page, "Eingangszentrale");
      const knoepfe = await page.locator(".queue-summary button").count();
      const leer = await page.locator(".queue-summary [data-eingang-filter-leer]").count();
      return soll(knoepfe + leer === 3 && leer >= 1, { knoepfe, leer });
    });

    await step(`${geraet}: Hilfe-Knoten (Kartenhilfe) → Zielseite einmal zur Karte, roter Rahmen, kein Hoch-Runter`, async () => {
      await footer(page, "Hilfe");
      await page.locator("[data-hilfe-thema] summary, details[data-kartenhilfe] > summary").filter({ hasText: "Hilfe zu Karten und Funktionen" }).first().click();
      const eintrag = page.locator('[data-kartenhilfe-eintrag="Offene Fristen und Aufgaben"]');
      await eintrag.locator("summary").click();
      const m = await springe(page, eintrag.locator("[data-kartenhilfe-ziel]"), "#offene-fristen");
      return soll(m.hash === "#reminders" && m.imBild && m.markiert && ohneHochRunter(m), m);
    });

    await step(`${geraet}: Kopf „Mein Kalender“ → Kalender im Bild und markiert`, async () => {
      await start();
      if (geraet === "Handy" && !(await page.locator("[data-mein-kalender-knopf]").isVisible())) await page.locator("[data-kopf-auf]").click();
      const m = await springe(page, page.locator("[data-mein-kalender-knopf]"), "#mein-kalender");
      return soll(m.hash === "#reminders" && m.imBild && m.markiert, m);
    });

    if (geraet === "Desktop") {
      await step("Desktop: Menü Familie → Fristen und Aufgaben: Seite oben, kein Ziel, keine Marke", async () => {
        await openMenu(page, 2, "Fristen und Aufgaben");
        const y = await page.evaluate(() => Math.round(scrollY));
        const marken = await page.locator("main .zurueck-hier").count();
        return soll(y === 0 && marken === 0, { y, marken });
      });
    }
    await step(`${geraet}: keine Seitenfehler`, async () => soll(errors.length === 0, errors.slice(0, 3)));
    await context.close();
  }
} finally {
  await browser.close(); await app.stop();
}
process.exit(summary("Gemeinsamer Sprungweg"));
