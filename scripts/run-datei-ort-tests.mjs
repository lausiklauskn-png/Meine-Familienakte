// 2.28.61: Dateiort einer Unterlage – Anzeige, Kopie, Explorer nur bei Windows-Pfad (mit Gegenproben).
import assert from "node:assert/strict";
import { dateiOrtAngabe } from "../lib/datei-ort.ts";

const a = dateiOrtAngabe("Me_Myself_and_I_Familienakte/01_Dokumente/Haushalt/2026-11-03_a1b2_Rechnung.pdf", "Familienakte", null);
assert.equal(a.anzeige, "Familienakte › Me_Myself_and_I_Familienakte › 01_Dokumente › Haushalt › 2026-11-03_a1b2_Rechnung.pdf");
assert.equal(a.kopie, "Familienakte/Me_Myself_and_I_Familienakte/01_Dokumente/Haushalt/2026-11-03_a1b2_Rechnung.pdf");
assert.equal(a.explorer, null, "Akten-Ordner ohne absoluten Pfad: kein Explorer");
const ohne = dateiOrtAngabe("A/B/geheim.pdf", "", null, true);
assert.equal(ohne.anzeige, "Speicher der App › A › B", "geschützte Unterlage ohne Dateinamen");
assert.ok(!ohne.kopie.includes("geheim"));
const sd = dateiOrtAngabe("pro-tresor:x", "", "SD/USB (3039-3234)/Family_Projekt_de");
assert.equal(sd.anzeige, "SD/USB (3039-3234) › Family_Projekt_de › Tresorordner (verschlüsselt)");
assert.equal(sd.explorer, null, "Android: kein Explorer");
const saf = dateiOrtAngabe("pro-tresor:x", "", "content://com.android.externalstorage.documents/tree/primary%3AFamily");
assert.ok(!saf.anzeige.includes("content://"));
const win = dateiOrtAngabe("pro-tresor:x", "", "D:\\Family-Projekt");
assert.equal(win.explorer, "D:\\Family-Projekt");
assert.equal(win.anzeige, "D: › Family-Projekt › Tresorordner (verschlüsselt)");
assert.equal(dateiOrtAngabe("pro-tresor:x", "", "\\\\server\\freigabe").explorer, null, "Netzfreigabe: kein Explorer");
assert.equal(dateiOrtAngabe("pro-tresor:x", "", null).anzeige, "Pro-Tresor › Tresorordner (verschlüsselt)");
console.log("Dateiort: 11 Prüfungen grün");
