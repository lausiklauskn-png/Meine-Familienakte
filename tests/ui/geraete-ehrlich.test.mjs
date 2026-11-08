// 2.28.39 (Plan 08.11., Geräte/Sicherung/Hilfe): Wege, die nach „anderes Gerät“ klingen, sagen ehrlich, was sie tun.
// Web-App am Handy ohne Ordnerwahl: Sicherungsknöpfe sind vorher als nicht verfügbar erkennbar (U2). Die Übergabe bietet
// keine Gesundheitsunterlagen unverschlüsselt an (U3) und nennt ihre Grenze (U1). Die Hilfe zeigt den Datentresor im selben
// Zustand wie die Sicherheitsseite (H3), der Umzug führt zum Einlesen (H4), das Thema „Internet für die App“ gibt es (H5).
import { startApp, launchBrowser, DESKTOP, HANDY, ready, footer, step, summary, collectErrors } from "./_harness.mjs";

// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();
try {
  // Web-App am Handy: keine Ordnerwahl des Browsers (wie Chrome auf Android), kein natives Ordner-Plugin.
  const handy = await browser.newContext(HANDY);
  await handy.addInitScript(() => { try { delete window.showDirectoryPicker; } catch { /* */ } Object.defineProperty(window, "showDirectoryPicker", { value: undefined, configurable: true }); });
  const page = await handy.newPage(); page.setDefaultTimeout(15000);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await footer(page, "Sicherheitscenter");

  await step("Handy ohne Ordnerwahl: Sichern, Testen, Einlesen und Export sind aus, mit Satz, was stattdessen geht", async () => {
    const aus = async (text) => page.locator("button", { hasText: text }).first().isDisabled();
    const knoepfe = { sichern: await aus("Vollständige Sicherung erstellen"), testen: await aus("Wiederherstellung testen"), einlesen: await aus("Sicherung einlesen"), export: await aus("Export vorbereiten") };
    const satz = await page.locator("[data-sicherung-nicht-hier]").innerText().catch(() => "");
    soll(Object.values(knoepfe).every(Boolean) && /Pro-App/.test(satz) && /Chrome oder Edge/.test(satz), { knoepfe, satz });
    return satz;
  });
  await step("Handy ohne Ordnerwahl: keine OneDrive-Karten und kein „Online-Altbestand“ ohne Bestand", async () => {
    const main = await page.locator("main").innerText();
    return soll(!/OneDrive-Ordner verbinden|OneDrive auf PC oder USB sichern|Online-Altbestand lokal sichern|Neue Ausbaustufe/.test(main), main.match(/OneDrive[^\n]*|Online-Altbestand[^\n]*/)?.[0] || "");
  });
  await step("Übergabe: Grenze genannt, Gesundheitsunterlagen nicht zur Wahl (Paket unverschlüsselt)", async () => {
    const grenze = await page.locator("[data-uebergabe-grenze]").innerText();
    const optionen = await page.locator(".pro-geraetetransport select option").allInnerTexts();
    soll(/Abgleich/.test(grenze) && /geplant/.test(grenze) && /ausgeblendet/.test(grenze), grenze);
    soll(optionen.length > 3 && !optionen.some((o) => /Impfpass|Brille/.test(o)), optionen.join(", "));
    return `${optionen.length - 1} Unterlagen wählbar · ${grenze}`;
  });
  await step("Datentresor prüfen: Karte heißt nicht mehr „Abgleich“ und meldet „nicht verbunden“ bei Browserspeicher", async () => {
    const karte = await page.locator(".security-compare-card").innerText();
    return soll(/Datentresor prüfen/.test(karte) && !/Abgleich/.test(karte) && /nicht verbunden/.test(karte), karte.slice(0, 200));
  });
  await step("Menü: kein „Zwei-Faktor-Schutz“ und Netz ohne „Mit anderen Geräten verbinden“", async () => {
    const html = await page.content();
    return soll(!/Zwei-Faktor/.test(html) && !/Mit anderen Geräten verbinden/.test(html), "");
  });
  await step("Hilfe: Datentresor mit Browserspeicher steht unter „Einrichten“, nicht unter „Schon eingerichtet“", async () => {
    await footer(page, "Hilfe");
    const einrichten = await page.locator('[data-hilfe-gruppe="einrichten"] [data-hilfe-id]').evaluateAll((l) => l.map((e) => e.dataset.hilfeId));
    const fertig = await page.locator('[data-hilfe-gruppe="eingerichtet"] [data-hilfe-id]').evaluateAll((l) => l.map((e) => e.dataset.hilfeId));
    soll(einrichten.includes("datentresor") && !fertig.includes("datentresor"), { einrichten, fertig });
    const kasten = await page.locator('[data-aktensicherung] [data-sicherung-ziel]').first().innerText().catch(() => "");
    return soll(!/Verbunden: Browserspeicher/.test(kasten), kasten);
  });
  await step("Hilfe „Auf ein neues Gerät umziehen“: Weg führt zu „Sicherung einlesen“; Zusammenführen da, automatischer Abgleich als geplant genannt", async () => {
    const thema = page.locator('[data-hilfe-thema="umzug"]');
    await thema.locator("summary").first().click();
    const weg = await thema.locator(".hilfe-weg").innerText();
    for (const zu of await thema.locator("details:not([open]) > summary").all()) await zu.click();
    const text = await thema.innerText();
    // Stufe A (Plan 08.11.): Einlesen führt in eine benutzte Akte zusammen; nur der automatische Abgleich ist noch geplant.
    return soll(/Sicherung einlesen/.test(weg) && !/Geräteübergabe/.test(weg) && /zusammengeführt|führt zusammen/.test(text) && /geplant/.test(text), { weg, text: text.slice(0, 200) });
  });
  await step("Hilfe-Thema „Internet für die App“ vorhanden und gefunden", async () => {
    soll(await page.locator('[data-hilfe-thema="internet"]').count() === 1, "Thema fehlt");
    await page.locator("#hilfe-frage-feld").fill("Internet ausschalten"); await page.waitForTimeout(400);
    const ids = await page.locator("[data-hilfe-treffer]").evaluateAll((l) => l.map((e) => e.dataset.hilfeTreffer));
    return soll(ids[0] === "internet", ids.join(","));
  });
  for (const [frage, erwartet] of [["Bankauszug", "nicht-finden"], ["Rechnung ablegen", "eingangszentrale"], ["Wie bringe ich Erinnerungen aufs Tablet", "umzug"]]) {
    await step(`Hilfe-Frage „${frage}“ → ${erwartet} zuerst`, async () => {
      await page.locator("#hilfe-frage-feld").fill(frage); await page.waitForTimeout(400);
      const ids = await page.locator("[data-hilfe-treffer]").evaluateAll((l) => l.map((e) => e.dataset.hilfeTreffer));
      return soll(ids[0] === erwartet, ids.join(","));
    });
  }
  await step("Handy: keine Seitenfehler", async () => soll(!errors.length, errors.join(" | ")));

  // Gegenprobe am PC (Chrome mit Ordnerwahl): dieselben Knöpfe sind bedienbar.
  const pc = await (await browser.newContext(DESKTOP)).newPage(); pc.setDefaultTimeout(15000);
  await pc.goto(app.base, { waitUntil: "networkidle" }); await ready(pc);
  await footer(pc, "Sicherheitscenter");
  await step("PC mit Ordnerwahl: Wiederherstellung testen, Einlesen und Export sind bedienbar, kein Sperrhinweis", async () => {
    const an = async (text) => !(await pc.locator("button", { hasText: text }).first().isDisabled());
    soll(await an("Wiederherstellung testen") && await an("Sicherung einlesen") && await an("Export vorbereiten"), "Knopf gesperrt");
    return soll(await pc.locator("[data-sicherung-nicht-hier]").count() === 0 && await pc.locator("[data-zwei-wege]").count() === 1, "Hinweis falsch");
  });
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Geräte und Hilfe ehrlich"));
