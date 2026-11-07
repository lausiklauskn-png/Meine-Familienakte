// Sitzung 2 (Daten, Plan 07.11.): reine Regeln für Gerätegrenze, Verkleinern (P4), Sicherung (P5/P6) und Demo-Kopie (P7).
const assert = (await import("node:assert/strict")).default;
const g = await import("../lib/geraete-grenze.ts");
let n = 0;
const gruen = (text) => { n++; console.log(`🟢 ${text}`); };

// P4 Gerätegrenze aus der vorhandenen Messung, in Stufen; ohne Messwert die alte Grenze; Pro-Tresor höchstens 20 MB.
assert.equal(g.sichereGroesse({ ramGB: 2 }).bytes, 15 * g.MB);
assert.equal(g.sichereGroesse({ ramGB: 3 }).bytes, 20 * g.MB);
assert.equal(g.sichereGroesse({ ramGB: 5.9 }).bytes, 20 * g.MB);
assert.equal(g.sichereGroesse({ ramGB: 6 }).bytes, 40 * g.MB);
assert.equal(g.sichereGroesse({ ramMindGB: 8 }).bytes, 40 * g.MB, "Chrome meldet „mindestens 8 GB“");
assert.equal(g.sichereGroesse(null).bytes, 20 * g.MB);
assert.equal(g.sichereGroesse({ ramGB: 0 }).gemessen, false);
assert.equal(g.sichereGroesse({ ramGB: 16 }, true).bytes, 20 * g.MB, "Pro-Tresor bleibt bei 20 MB");
assert.equal(g.sichereGroesse({ ramGB: 2 }, true).bytes, 15 * g.MB, "Messung kann den Pro-Tresor nur senken");
gruen("Gerätegrenze: unter 3 GB 15 MB, 3–6 GB 20 MB, ab 6 GB 40 MB; ohne Messung 20 MB; Pro-Tresor höchstens 20 MB");

// Stufen: erst Qualität bei voller Auflösung, dann kleinere Kante, nie unter 3508 px (300 dpi A4).
const st = g.verkleinerStufen(6000, 8000);
assert.deepEqual(st.slice(0, 2), [{ kante: 8000, qualitaet: 0.8 }, { kante: 8000, qualitaet: 0.72 }]);
assert.ok(st.every((s) => s.kante >= g.MIN_KANTE_300DPI));
assert.deepEqual(st.at(-1), { kante: 3508, qualitaet: 0.72 });
assert.ok(st.slice(2).every((s, i, a) => i === 0 || s.kante <= a[i - 1].kante), "Kanten fallen");
assert.deepEqual(g.verkleinerStufen(2400, 3200), [{ kante: 3200, qualitaet: 0.8 }, { kante: 3200, qualitaet: 0.72 }], "unter 300 dpi keine Auflösung senken");
gruen("Verkleinern: Qualität 80/72 % zuerst, dann Kante in Schritten, nie unter 3508 px; kleine Fotos behalten ihre Auflösung");

// Gegenprobe: Anteil der Originalwörter, die die kleine Fassung erkennt; Richtwert 98 %.
const text = Array.from({ length: 100 }, (_, i) => `Wort${i}`).join(" ");
assert.equal(g.trefferQuote(text, text).quote, 1);
const fehlen3 = Array.from({ length: 97 }, (_, i) => `Wort${i}`).join(" ");
assert.ok(!g.textGeprueft(g.trefferQuote(text, fehlen3)), "97 % reicht nicht");
const fehlen2 = Array.from({ length: 98 }, (_, i) => `Wort${i}`).join(" ");
assert.ok(g.textGeprueft(g.trefferQuote(text, fehlen2)), "98 % reicht");
assert.equal(g.trefferQuote("Rechnung Rechnung", "Rechnung").quote, 0.5, "Wörter zählen mit Vielfachheit");
assert.ok(g.textGeprueft(g.trefferQuote("ein Bild", "")), "ohne Text gibt es nichts zu schützen");
assert.equal(g.verkleinertNotiz(16.4 * g.MB, { original: 120 }), "verkleinert von 16 MB, Text geprüft");
assert.equal(g.verkleinertNotiz(9.5 * g.MB, { original: 3 }), "verkleinert von 9,5 MB, kein Text im Bild");
gruen("Gegenprobe: unter 98 % der Wörter verworfen, Notiz „verkleinert von X MB, Text geprüft“");

console.log(`Daten-Proben: ${n} grün`);
