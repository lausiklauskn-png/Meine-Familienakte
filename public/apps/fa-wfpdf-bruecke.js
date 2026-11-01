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
  // 4. Stück 2 (Klaus 2026-11-01): Ergebnis in die Akte, Unterlage aus der Akte. Nur eingebettet.
  if (eingebettet) {
    var istDatei = function (f) { return f && typeof f.name === "string" && typeof f.size === "number"; };
    var hex = function (b) { return Array.from(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, "0"); }).join(""); };
    var hash = async function (b) { return hex(await crypto.subtle.digest("SHA-256", b)); };
    var quittungen = new Map();
    W.addEventListener("message", function (e) {
      if (e.origin !== location.origin || e.source !== W.parent) return;
      var d = e.data || {}, p = quittungen.get(d.id);
      if (d.typ !== "fa-wfpdf-abgelegt" || !p) return;
      quittungen.delete(d.id); clearTimeout(p.timer);
      if (d.ok === true) p.resolve(); else p.reject(new Error("Die Familienakte hat den Eingang nicht bestätigt. Die Quelle bleibt erhalten."));
    });
    var abgeben = async function (fs, quelle) {
      var vertraege = [];
      for (var f of fs) {
        if (!istDatei(f) || f.size > 20 * 1024 * 1024) throw new Error("Die Familienakte nimmt höchstens 20 MiB je Dokument an.");
        var sha = await hash(await f.arrayBuffer());
        // Inhaltskennung bleibt beim erneuten Teilen derselben Fassung gleich, auch nach Neustart.
        var id = "wfpdf-" + await hash(new TextEncoder().encode(JSON.stringify([f.name, f.type, sha])));
        vertraege.push({ vertrag: "familienakte-uebergabe/1", id: id, quelle: "workflow-pdf-pro", ziel: "familienakte", dokumentId: "d-" + await hash(new TextEncoder().encode(f.name)),
          name: f.name, mime: f.type, groesse: f.size, sha256: sha });
      }
      var anfrage = crypto.randomUUID();
      return new Promise(function (resolve, reject) {
        var timer = setTimeout(function () { quittungen.delete(anfrage); reject(new Error("Noch keine Eingangsbestätigung. Quelle behalten und erneut teilen.")); }, 60000);
        quittungen.set(anfrage, { resolve: resolve, reject: reject, timer: timer });
        melde({ typ: "fa-wfpdf-ablegen", id: anfrage, quelle: quelle, dateien: fs, vertraege: vertraege });
      });
    };
    // 4a. Teilen wartet auf Datei + Eingangsdatensatz + wiederholbare Quittung der Familienakte.
    try {
      var N = W.navigator;
      var teilen = N.share ? N.share.bind(N) : null;
      N.share = function (daten) {
        var fs = daten && daten.files ? Array.from(daten.files) : [];
        if (fs.length) return abgeben(fs, "teilen");
        return teilen ? teilen(daten) : Promise.reject(new Error("Teilen nicht möglich."));
      };
      var kann = N.canShare ? N.canShare.bind(N) : null;
      N.canShare = function (daten) { if (daten && daten.files && daten.files.length) return Array.from(daten.files).every(function(f) { return istDatei(f) && f.size <= 20 * 1024 * 1024; }); return kann ? kann(daten) : false; };
    } catch { /* ohne Browserfähigkeit bleibt das Werkzeug verfügbar */ }
    // 4b. Die kanonische launchQueue gibt den Import NICHT als Promise zurück. Deshalb benutzt
    // diese bestehende Brücke den bereits offengelegten normalen Importer (gleiche Prüfung/Ablage).
    // Der Klon bleibt bytegleich. Vor einer Quittung werden Metadaten UND Originalbytes nachgelesen.
    var oeffnenLauf = Promise.resolve();
    var empfangen = async function (fs) {
      if (!W.__wfpdf || !W.WFP || !W.WFP.DB) throw new Error("Workflow PDF ist noch nicht bereit.");
      var db = W.WFP.DB;
      for (var f of fs) {
        if (!istDatei(f) || f.size > 20 * 1024 * 1024) throw new Error("Dateigrenze überschritten.");
        var sha = await hash(await f.arrayBuffer()), name = f.name.replace(/\.[^.]+$/, "");
        var originalId = function (d) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name) ? d.id + "~original" : d.id; };
        var passt = async function (d) {
          if (!d || d.name !== name) return false;
          var bytes = await db.getFile(originalId(d));
          return bytes && await hash(bytes) === sha && !!await db.get("docs", d.id) && !!await db.getFile(d.id);
        };
        var gefunden = null;
        for (var d of await db.all("docs")) { if (await passt(d)) { gefunden = d; break; } }
        if (!gefunden) {
          var neu = await W.__wfpdf.importDateien([f]);
          if (!neu || neu.length !== 1 || !await passt(neu[0])) throw new Error("Workflow PDF hat die Datei nicht dauerhaft bestätigt.");
        }
      }
    };
    W.addEventListener("message", function (e) {
      if (e.origin !== location.origin || e.source !== W.parent) return;
      var d = e.data || {};
      if (d.typ !== "fa-wfpdf-oeffnen" || typeof d.id !== "string" || d.id.length > 160 || !Array.isArray(d.dateien) || !d.dateien.length) return;
      var lauf = oeffnenLauf.then(function () { return empfangen(d.dateien); });
      oeffnenLauf = lauf.catch(function () {});
      lauf.then(function () { melde({ typ: "fa-wfpdf-geoeffnet", id: d.id, ok: true }); }, function () { melde({ typ: "fa-wfpdf-geoeffnet", id: d.id, ok: false }); });
    });
    // 4c. Scan aus der Akte (?scan=1&von=Familienakte): das fertige PDF des Scanners geht zusätzlich gleich in die Akte.
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("scan") === "1" && q.get("von") === "Familienakte") {
        var wickeln = function (SC) {
          if (!SC || SC.__fa) return; SC.__fa = true;
          var auf = SC.oeffnen;
          SC.oeffnen = function (opt) {
            if (!SC.__faErst && opt && typeof opt.fertig === "function" && !opt.__fa) {
              SC.__faErst = true;   // nur der Scan, mit dem die Akte den Klon geöffnet hat
              var f0 = opt.fertig; opt.__fa = true;
              opt.fertig = function (bytes, info) {
                try { var n = String((info && info.name) || "Scan").replace(/[\\/:*?"<>|]+/g, "_").trim() || "Scan"; abgeben([new File([bytes], n + ".pdf", { type: "application/pdf" })], "scan").catch(function (e) { if (W.__wfpdf) W.__wfpdf.dlg.toast(e.message); }); } catch { /* still: ohne diese Fähigkeit läuft der Klon wie vorher */ }
                return f0.apply(this, arguments);
              };
            }
            return auf.apply(this, arguments);
          };
        };
        var wfp = W.WFP || {};
        var sc = wfp.Scanner;
        Object.defineProperty(wfp, "Scanner", { configurable: true, enumerable: true, get: function () { return sc; }, set: function (v) { sc = v; wickeln(v); } });
        if (sc) wickeln(sc);
        W.WFP = wfp;
      }
    } catch { /* still: ohne diese Fähigkeit läuft der Klon wie vorher */ }
  }
})();
