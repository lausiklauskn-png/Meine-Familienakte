// Demo-Bedienung für die Proben (2026-11-04): gestartet wird die Demo hinten in der Hilfe, solange sie läuft steht oben der
// rote Knopf „DEMO ▾“ mit Menü (Demo verlassen · zurücksetzen · löschen und verlassen). Kein Demo-Kasten mehr.
import { footer } from "./_harness.mjs";

/** Wartet, bis die App Demo-Wechsel zulässt (Speicherwahl abgeschlossen) – vorher bei aktivem „Demo öffnen“-Knopf. */
export async function demoBereit(page, timeout = 120000) {
  await page.locator('.site-header[data-demo-bereit="ja"]').waitFor({ state: "attached", timeout });
}
/** Hilfe öffnen und „Demo starten“ tippen. */
export async function demoStarten(page) {
  await demoBereit(page);
  await footer(page, "Hilfe");
  const knopf = page.locator(".demo-starten").getByRole("button", { name: "Demo starten", exact: true });
  await knopf.scrollIntoViewIfNeeded();
  await knopf.click();
}
/** Roten Knopf „DEMO ▾“ öffnen und einen Menüpunkt wählen. */
export async function demoMenue(page, name) {
  await page.locator(".demo-knopf-schalter").click();
  await page.getByRole("menuitem", { name, exact: true }).click();
}
/** Demo ein- oder ausschalten und auf die neue Adresse warten. */
export async function demoUmschalten(page, aktiv) {
  await demoBereit(page);
  await Promise.all([
    page.waitForURL(url => aktiv ? url.searchParams.get("demo") === "1" : !url.searchParams.has("demo")),
    aktiv ? demoStarten(page) : demoMenue(page, "Demo verlassen"),
  ]);
  await page.waitForLoadState("networkidle");
  await demoBereit(page);
}
