/* public/apps/fa-wfpdf-bruecke.js — Klebstoff der Familienakte im eingebetteten Klon von Workflow PDF (Klaus 2026-11-01, Weg B).
   Der Klon unter public/apps/workflow-pdf/ ist byte-1:1; diese Datei steht über die kontrollierte Abweichung in index.html
   (tools/wfpdf-app-patch.mjs) als ERSTES Skript im Kopf, vor jedem Skript von Workflow PDF. Klassisches Skript, kein Modul.
   1. Eigene Bibliothek (Klaus: „Ja, getrennt“): die Familienakte-PWA liegt unter demselben Ursprung wie die Workflow-PDF-PWA
      (lausiklauskn-png.github.io). Ohne Umleitung öffnete der Klon dieselbe Datenbank „WorkflohPDF1“ und dieselben
      Einstellungen „wfpdf_*“. Hier: Datenbank → „FamilienakteWFPDF1“, Schlüssel „wfpdf_*“ → „fa_wfpdf_*“.
   2. Kein Service Worker (Anmelden tut nichts, getRegistrations ist leer) und ⟳ sieht nur eigene Vorräte („fa-wfpdf-…“):
      sonst löschte ⟳ (app.js: caches.keys → delete, getRegistrations → unregister) den Vorrat und den Worker der Akte
      und der Nachbar-Apps am selben Ursprung.
   3. Marke am <html> (data-fa-eingebettet) für fa-wfpdf-thema.css und die Proben; Bereit-Meldung an die Akte. */
(function () {
  "use strict";
  var W = window, eingebettet = W.parent !== W;
  var DB_ALT = "WorkflohPDF1", DB_NEU = "FamilienakteWFPDF1";
  var KEY_ALT = "wfpdf_", KEY_NEU = "fa_", VORRAT = "fa-wfpdf-";
  // 1a. Einstellungen
  try {
    var SP = W.Storage && W.Storage.prototype;
    // wfpdf_x → fa_wfpdf_x
    var um = function (k) { k = String(k); return k.indexOf(KEY_ALT) === 0 ? KEY_NEU + k : k; };
    ["getItem", "removeItem"].forEach(function (n) { var o = SP[n]; SP[n] = function (k) { return o.call(this, um(k)); }; });
    var set = SP.setItem; SP.setItem = function (k, v) { return set.call(this, um(k), v); };
  } catch { /* still: ohne diese Fähigkeit läuft der Klon wie vorher */ }
  // 1b. Datenbank
  try {
    var IF = W.IDBFactory && W.IDBFactory.prototype;
    var dbUm = function (n) { return n === DB_ALT ? DB_NEU : n; };
    var open = IF.open; IF.open = function (n, v) { return arguments.length > 1 ? open.call(this, dbUm(n), v) : open.call(this, dbUm(n)); };
    var del = IF.deleteDatabase; IF.deleteDatabase = function (n) { return del.call(this, dbUm(n)); };
    if (IF.databases) {
      var dbs = IF.databases;
      IF.databases = function () {
        return dbs.call(this).then(function (l) {
          return l.filter(function (d) { return d.name !== DB_ALT; }).map(function (d) { return d.name === DB_NEU ? { name: DB_ALT, version: d.version } : d; });
        });
      };
    }
  } catch { /* still: ohne diese Fähigkeit läuft der Klon wie vorher */ }
  // 2a. Vorräte: nur eigene sichtbar, „workfloh-pdf-geteilt“ → „fa-wfpdf-geteilt“
  try {
    var CS = W.CacheStorage && W.CacheStorage.prototype;
    var vUm = function (n) { n = String(n); return n === "workfloh-pdf-geteilt" ? VORRAT + "geteilt" : n; };
    var keys = CS.keys; CS.keys = function () { return keys.call(this).then(function (l) { return l.filter(function (n) { return n.indexOf(VORRAT) === 0; }); }); };
    ["open", "delete", "has"].forEach(function (n) { var o = CS[n]; CS[n] = function (x) { return o.call(this, vUm(x)); }; });
  } catch { /* still: ohne diese Fähigkeit läuft der Klon wie vorher */ }
  // 2b. Kein Service Worker im Klon
  try {
    var SWC = W.ServiceWorkerContainer && W.ServiceWorkerContainer.prototype;
    if (SWC) {
      SWC.register = function () { return Promise.reject(new Error("Im Klon der Familienakte kein eigener Service Worker.")); };
      SWC.getRegistrations = function () { return Promise.resolve([]); };
      SWC.getRegistration = function () { return Promise.resolve(undefined); };
    }
  } catch { /* still: ohne diese Fähigkeit läuft der Klon wie vorher */ }
  // 3. Marke und Bereit-Meldung
  var html = document.documentElement;
  html.setAttribute("data-fa-eingebettet", eingebettet ? "1" : "0");
  function melde(d) { if (!eingebettet) return; try { W.parent.postMessage(d, location.origin); } catch { /* still: ohne diese Fähigkeit läuft der Klon wie vorher */ } }
  W.FA_BRUECKE = { eingebettet: eingebettet, db: DB_NEU, schluessel: KEY_NEU, melde: melde };
  W.addEventListener("load", function () { melde({ typ: "fa-wfpdf-bereit" }); });
})();
