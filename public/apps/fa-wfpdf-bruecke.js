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
  var arbeitsraum = eingebettet && new URLSearchParams(location.search).get("akte") === "1";
  var raumQuelle = null, raumDokument = null, raumSpeicher = new Map(), raumSicher = true;
  // A document opened from the Familienakte lives only in this iframe's memory.
  // The canonical PDF core stays byte-identical; its DB interface is adapted here.
  if (arbeitsraum) {
    var tabellen = new Map();
    var tabelle = function (name) { if (!tabellen.has(name)) tabellen.set(name, new Map()); return tabellen.get(name); };
    var kopie = function (v) { return v === undefined ? undefined : structuredClone(v); };
    var ableitungenWeg = function (id) {
      tabelle("texte").delete(id);
      for (var key of tabelle("vektoren").keys()) if (key === id || String(key).indexOf(id + "#") === 0) tabelle("vektoren").delete(key);
    };
    var memoryDb = {
      all: async function (name) { return Array.from(tabelle(name).values(), kopie); },
      keys: async function (name) { return Array.from(tabelle(name).keys()); },
      get: async function (name, id) { return kopie(tabelle(name).get(id)); },
      put: async function (name, obj) { if (!obj || obj.id == null) throw new Error("Arbeitskennung fehlt"); tabelle(name).set(obj.id, kopie(obj)); return obj.id; },
      del: async function (name, id) { tabelle(name).delete(id); if (name === "files") { tabelle(name).delete(id + "~original"); ableitungenWeg(id); } },
      putFile: async function (id, bytes) { tabelle("files").set(id, { id: id, bytes: kopie(bytes) }); ableitungenWeg(id); },
      getFile: async function (id) { var f = tabelle("files").get(id); return f ? kopie(f.bytes) : null; },
      vektorenWeg: async function (id) { for (var k of tabelle("vektoren").keys()) if (k === id || String(k).indexOf(id + "#") === 0) tabelle("vektoren").delete(k); },
      persist: async function () { return false; }
    };
    var raumWfp = W.WFP || {};
    Object.defineProperty(raumWfp, "DB", { configurable: false, enumerable: true, get: function () { return memoryDb; }, set: function () {} });
    W.WFP = raumWfp;
  }
  var KEY_ALT = "wfpdf_", KEY_NEU = "fa_", VORRAT = "fa-wfpdf-";
  // 1a. Einstellungen
  try {
    var SP = W.Storage && W.Storage.prototype;
    // wfpdf_x → fa_wfpdf_x
    var um = function (k) { k = String(k); return k.indexOf(KEY_ALT) === 0 ? KEY_NEU + k : k; };
    var nurImRaum = function (k) { return arbeitsraum && /^wfpdf_(?:notstand|weiter)(?:_|$)/.test(String(k)); };
    ["getItem", "removeItem"].forEach(function (n) { var o = SP[n]; SP[n] = function (k) {
      if (nurImRaum(k)) { if (n === "removeItem") { raumSpeicher.delete(String(k)); return; } return raumSpeicher.get(String(k)) ?? null; }
      return o.call(this, um(k));
    }; });
    var set = SP.setItem; SP.setItem = function (k, v) { if (nurImRaum(k)) { raumSpeicher.set(String(k), String(v)); return; } return set.call(this, um(k), v); };
  } catch { if (arbeitsraum) raumSicher = false; }
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
  W.FA_BRUECKE = { eingebettet: eingebettet, db: DB_NEU, schluessel: KEY_NEU, melde: melde, arbeitsraum: arbeitsraum };
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
      if (d.ok === true) { p.resolve(); if (p.sitzung) melde({ typ: "fa-wfpdf-rueckgabe-fertig", id: d.id, sitzung: p.sitzung }); } else p.reject(new Error("Die Familienakte hat den Eingang nicht bestätigt. Die Quelle bleibt erhalten."));
    });
    var abgeben = async function (fs, quelle) {
      if (arbeitsraum) {
        if (!raumQuelle || !raumDokument || fs.length !== 1 || fs[0].type !== "application/pdf") throw new Error("Der Arbeitsraum kann nur die geöffnete PDF an ihre Quelle zurückgeben.");
        var ids = W.__wfpdf.ausgabeHerkunft(fs[0]);
        if (ids.length !== 1 || ids[0] !== raumDokument) throw new Error("Die Ausgabe gehört nicht zur geöffneten Unterlage. Es wurde nichts ersetzt.");
      }
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
        quittungen.set(anfrage, { resolve: resolve, reject: reject, timer: timer, sitzung: arbeitsraum ? raumQuelle.sitzung : null });
        melde({ typ: "fa-wfpdf-ablegen", id: anfrage, quelle: quelle, dateien: fs, vertraege: vertraege, bearbeitung: arbeitsraum ? raumQuelle.sitzung : null });
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
    var empfangen = async function (fs, bindung) {
      if (arbeitsraum) {
        if (!raumSicher || !bindung || typeof bindung.sitzung !== "string" || !bindung.dokumentId || !/^[a-f0-9]{64}$/.test(bindung.checksum) || fs.length !== 1) throw new Error("Der Bearbeitungsraum ist nicht sicher an eine Quelle gebunden.");
        if (await hash(await fs[0].arrayBuffer()) !== bindung.checksum) throw new Error("Die Arbeitsdatei passt nicht zur Quelle.");
        if (raumQuelle) { if (raumQuelle.sitzung !== bindung.sitzung || raumQuelle.dokumentId !== bindung.dokumentId) throw new Error("Der Arbeitsraum gehört bereits zu einer anderen Unterlage."); if (raumDokument) return; }
        raumQuelle = bindung;
      }
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
          if (!neu || neu.length !== 1 || !await passt(neu[0])) throw new Error("Workflow PDF hat die Arbeitsdatei nicht bestätigt.");
          gefunden = neu[0];
        }
        if (arbeitsraum) { raumDokument = gefunden.id; await W.__wfpdf.oeffneDok(raumDokument); }
      }
    };
    W.addEventListener("message", function (e) {
      if (e.origin !== location.origin || e.source !== W.parent) return;
      var d = e.data || {};
      if (d.typ === "fa-wfpdf-zurueck" && arbeitsraum && raumQuelle && d.sitzung === raumQuelle.sitzung) {
        void (async function () {
          if (!raumDokument) throw new Error("Die Arbeitsdatei ist noch nicht bereit.");
          var kern = W.__wfpdf;
          if (kern.S.doc && kern.S.doc.id !== raumDokument) throw new Error("Bitte zuerst zur aus der Akte geöffneten Unterlage zurückkehren.");
          if (!kern.S.doc) {
            if (!await W.WFP.DB.get("docs", raumDokument)) throw new Error("Die Arbeitsdatei wurde verworfen. Die Unterlage in der Akte bleibt erhalten.");
            await kern.oeffneDok(raumDokument);
          }
          await kern.dlg.teilenDocs([raumDokument]);
        })().catch(function (err) { W.__wfpdf.dlg.toast(err.message); });
        return;
      }
      if (d.typ !== "fa-wfpdf-oeffnen" || typeof d.id !== "string" || d.id.length > 160 || !Array.isArray(d.dateien) || !d.dateien.length) return;
      var lauf = oeffnenLauf.then(function () { return empfangen(d.dateien, d.bindung); });
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
