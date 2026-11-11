// 2.28.65: Sicherung an einem zweiten Ort (Android-App gestellt): Blöcke, Einrichten mit Passwort und Notfallblatt,
// Aufbewahrung (dort 1, Gerät 2), fremde Ordner bleiben, Abbruch lässt die alte heil, nicht erreichbarer Ort.
import { vaultFixture } from "./_vault-fixture.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { ordnerStub } from "./_ordner-stub.mjs";
import { startApp, launchBrowser, DESKTOP, ready, footer, step, soll, fail, summary, collectErrors } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
const PW = "Zweiter-Ort-2028";
try {
  const context = await browser.newContext(DESKTOP);
  await context.addInitScript(capacitorStub + "\n" + ordnerStub("android"));
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await vaultFixture(page);
  await page.evaluate(async () => { const f = window.__vaultFixture; await f.seedSampleFamily(await f.browserVault(), { force: true }); });
  await page.reload({ waitUntil: "networkidle" }); await ready(page);
  await footer(page, "Sicherheitscenter");
  const karte = page.locator("[data-zweiter-ort]");
  // Eigene Sicherungen je Speicher: R = gewählter Ordner, G = App-Ordner „sicherungen“.
  const stand = () => page.evaluate(() => {
    const S = window.__ordner, liste = (r) => [...S.ordner].filter((o) => o.startsWith(r + "|") && /^[RG]\|Familienakte_Vollsicherung_[^/]+$/.test(o)).map((o) => o.slice(2)).sort();
    const marke = (r, n) => { const u = S.dateien.get(`${r}|${n}/Zweiter_Ort.json`); return u ? JSON.parse(new TextDecoder().decode(u)) : null; };
    return { R: liste("R"), G: liste("G"), fertigR: liste("R").map((n) => marke("R", n)?.fertig), apk: liste("R").filter((n) => [...S.dateien.keys()].some((d) => d.startsWith(`R|${n}/Familienakte-Pro-`))).length, fremd: S.dateien.has("R|Fotos/urlaub.jpg") && S.ordner.has("R|Familienakte_Vollsicherung_2020-01-01T00-00-00-000Z") };
  });
  const meldung = async () => (await page.locator("[aria-live], .notice").allInnerTexts()).join(" ").replace(/\s+/g, " ");
  const warteMeldung = (re) => page.waitForFunction((q) => new RegExp(q).test(document.body.innerText), re.source, { timeout: 60000 });

  await step("Karte mit drei Blöcken: Ort, Verschlüsselt/lesbar, Nur sichern/synchron – je Wahl zwei getrennte Felder", async () => {
    await karte.waitFor();
    const bloecke = await karte.locator(".entscheid-block").count();
    const felder = await karte.locator("[data-wahl]").count();
    const haupt = await karte.locator(".entscheid-block .button.primary").count();
    return soll(bloecke === 3 && felder === 4 && haupt === 1 && await karte.locator('[data-wahl="zweiter-ort-art-verschluesselt"] input').isChecked() && await karte.locator('[data-wahl="zweiter-ort-modus-sichern"] input').isChecked(), { bloecke, felder, haupt });
  });
  await step("Vorgaben: verschlüsselt und „Nur sichern“; Zustand sagt in einer Zeile „Noch kein zweiter Ort“", async () => soll(/Noch kein zweiter Ort/.test(await karte.locator("[data-zweiter-ort-zustand]").innerText()), await karte.innerText()));
  await step("Einrichten: Ort wählen → Passwort zweimal → Notfallblatt → erste Sicherung dort und auf dem Gerät", async () => {
    await page.evaluate(() => { window.__ordner.naechsterName = "OneDrive"; });
    await karte.locator("[data-zweiter-ort-waehlen]").click();
    const d = page.locator("[data-zweiter-ort-passwort]"); await d.waitFor();
    await d.locator("[data-passwort]").fill(PW); await d.locator("[data-passwort-wieder]").fill(PW); await d.locator("[data-zweiter-ort-pw-los]").click();
    await page.locator("text=Notfallblatt").first().waitFor({ timeout: 30000 });
    await warteMeldung(/erstellt und geprüft/);
    const s = await stand();
    return soll(s.R.length === 1 && s.G.length === 1 && s.fertigR[0] === true && s.apk === 1 && /_verschluesselt$/.test(s.R[0]), s) && `dort ${s.R[0]}, Gerät ${s.G[0]}, APK daneben`;
  });
  await step("Notfallblatt schließt erst nach dem Haken", async () => {
    const blatt = page.locator("[data-notfallblatt]");
    await blatt.locator("[data-notfall-bestaetigung] input").check(); await blatt.locator("[data-notfall-fertig]").click();
    await blatt.waitFor({ state: "detached" }); return true;
  });
  await page.evaluate(() => { const S = window.__ordner, u = new TextEncoder().encode("fremd"); S.ordner.add("R|Fotos"); S.dateien.set("R|Fotos/urlaub.jpg", u); S.ordner.add("R|Familienakte_Vollsicherung_2020-01-01T00-00-00-000Z"); S.dateien.set("R|Familienakte_Vollsicherung_2020-01-01T00-00-00-000Z/Vollsicherung_Manifest.json", u); });
  const jetzt = async () => { await karte.locator("[data-zweiter-ort-jetzt]").click(); await page.waitForFunction(() => document.querySelector("[data-zweiter-ort-jetzt]")?.hasAttribute("disabled"), null, { timeout: 5000 }).catch(() => {}); await page.waitForFunction(() => !document.querySelector("[data-zweiter-ort-jetzt]")?.hasAttribute("disabled"), null, { timeout: 60000 }); await page.waitForTimeout(300); };
  await step("Zweimal „Jetzt sichern“: dort genau eine (neueste), auf dem Gerät zwei; fremde Ordner bleiben", async () => {
    const vorher = await stand(); await jetzt(); await jetzt();
    const s = await stand();
    return soll(s.R.length === 2 && s.R.includes("Familienakte_Vollsicherung_2020-01-01T00-00-00-000Z") && !s.R.includes(vorher.R.find((n) => !n.startsWith("Familienakte_Vollsicherung_2020"))) && s.G.length === 2 && !s.G.includes(vorher.G[0]) && s.fremd, s) && `dort ${s.R.length - 1} eigene + 1 fremde, Gerät ${s.G.length}`;
  });
  await step("Gegenprobe Abbruch: scheitert das Schreiben am zweiten Ort, bleibt die alte Sicherung dort heil und es kommt eine Fehlermeldung", async () => {
    const vorher = await stand();
    await page.evaluate(() => { window.__ordner.fertigScheitert = "R|Familienakte_Vollsicherung_" + new Date().getFullYear(); });
    await jetzt();
    await page.evaluate(() => { window.__ordner.fertigScheitert = null; });
    const s = await stand(); const eigeneVorher = vorher.R.filter((n) => !n.startsWith("Familienakte_Vollsicherung_2020"));
    return soll(eigeneVorher.every((n) => s.R.includes(n)) && /Zweiter Ort:/.test(await meldung()), { vorher, s, m: (await meldung()).slice(0, 200) });
  });
  await step("Nicht erreichbar (Stick abgezogen): Satz statt Absturz, die Sicherung auf dem Gerät läuft trotzdem", async () => {
    const vorher = await stand();
    await page.evaluate(() => { window.__ordner.angesteckt = false; });
    await jetzt();
    await page.evaluate(() => { window.__ordner.angesteckt = true; });
    const s = await stand(); const m = await meldung();
    return soll(/nicht erreichbar/.test(m) && s.G.length === 2 && JSON.stringify(s.G) !== JSON.stringify(vorher.G), { m: m.slice(0, 200), s });
  });
  await step("Zustand zeigt den Fehler in einer Zeile", async () => soll(/nicht gelungen/.test(await karte.locator("[data-zweiter-ort-zustand]").innerText()), await karte.locator("[data-zweiter-ort-zustand]").innerText()));
  await step("„Synchron halten“: Passwort einmal → gemeinsame Festplatte im selben Ordner, gleicher Schlüssel wie die Sicherung", async () => {
    await karte.locator('[data-wahl="zweiter-ort-modus-synchron"] input').check();
    const d = page.locator("[data-zweiter-ort-passwort]"); await d.waitFor();
    soll(!(await d.locator("[data-passwort-wieder]").count()), "fragt zweimal");
    await d.locator("[data-passwort]").fill(PW); await d.locator("[data-zweiter-ort-pw-los]").click();
    await page.waitForFunction(() => window.__ordner.dateien.has("R|Familienakte-Abgleich/Familienakte-Laufwerk.json"), null, { timeout: 30000 });
    await page.locator("[data-zweiter-ort-synchron]").waitFor({ timeout: 15000 }).catch(() => {});
    const r = await page.evaluate(() => { const S = window.__ordner, lies = (k) => JSON.parse(new TextDecoder().decode(S.dateien.get(k))); const lw = lies("R|Familienakte-Abgleich/Familienakte-Laufwerk.json"); const sich = [...S.dateien.keys()].find((k) => /^R\|Familienakte_Vollsicherung_2026[^/]+\/Vollsicherung_Verschluesselt\.json$/.test(k)); return { gleich: lw.kdf.salt === lies(sich).kdf.salt, synchron: document.querySelector("[data-zweiter-ort-synchron]") !== null }; });
    return soll(r.gleich && r.synchron, r) && "ein Passwort, ein Notfallblatt für Sicherung und Abgleich";
  });
  await step("Gegenprobe: falsches Passwort für „Synchron halten“ wird abgelehnt, die Wahl springt zurück", async () => {
    await karte.locator('[data-wahl="zweiter-ort-modus-sichern"] input').check();
    await page.waitForFunction(() => document.querySelector('[data-wahl="zweiter-ort-modus-sichern"] input')?.checked && !document.querySelector("[data-zweiter-ort-synchron]"));
    await karte.locator('[data-wahl="zweiter-ort-modus-synchron"] input').check();
    const d = page.locator("[data-zweiter-ort-passwort]"); await d.waitFor();
    await d.locator("[data-passwort]").fill("ganz-falsches-pw"); await d.locator("[data-zweiter-ort-pw-los]").click();
    await page.waitForFunction(() => /passt nicht/.test(document.body.innerText), null, { timeout: 30000 });
    return soll(await karte.locator('[data-wahl="zweiter-ort-modus-sichern"] input').isChecked(), "Wahl nicht zurück");
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
  await context.close();
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Zweiter Ort"));
