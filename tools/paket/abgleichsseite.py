# Baut die Abgleichsseite für den Freund: eine HTML-Datei mit allen Fassungen eingebettet (Speichern direkt aus der Datei,
# SHA-256 wird vor dem Speichern geprüft), Erklärung je Fassung und Codex-Auftrag (docs/CODEX-ABGLEICH-FAMILIENAKTE.md).
# Aufruf: python3 -I tools/paket/abgleichsseite.py <apk> <windows-setup.exe> <einzeldatei.html> <quelle.zip> <ausgabe.html>
# Die Dateien vorher aus den Releases laden und gegen SHA256SUMS prüfen. Texte und Fassungsnummer unten bei neuer Fassung anpassen.
import sys
import base64, hashlib, html, json, os
from pathlib import Path
APK, EXE, EINZEL, ZIP, ZIEL = sys.argv[1:6]
md = (Path(__file__).resolve().parents[2] / "docs/CODEX-ABGLEICH-FAMILIENAKTE.md").read_text(encoding="utf-8")
dateien = [
  ("apk", APK, "Familienakte-android-v2.28.3.apk", "application/vnd.android.package-archive"),
  ("exe", EXE, "Familienakte-Windows-2.28.3-x64-setup.exe", "application/vnd.microsoft.portable-executable"),
  ("html", EINZEL, "Familienakte-Einzeldatei-2.28.3.html", "text/html"),
  ("zip", ZIP, "familienakte-2.28.3-quelle.zip", "application/zip"),
  ("md", None, "CODEX-ABGLEICH-FAMILIENAKTE.md", "text/markdown"),
]
meta, blobs = {}, []
for key, pfad, name, mime in dateien:
    data = md.encode("utf-8") if pfad is None else open(pfad, "rb").read()
    meta[key] = {"name": name, "mime": mime, "size": len(data), "sha": hashlib.sha256(data).hexdigest()}
    blobs.append(f'<script type="application/octet-stream" id="d-{key}">{base64.b64encode(data).decode()}</script>')
def mb(k): return f"{meta[k]['size']/1048576:.1f}".replace(".", ",") + " MB"
def sha(k): return meta[k]["sha"]

ICON = {
 "globe": '<path d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z"/><path d="M3 12h18"/><path d="M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z"/>',
 "drive": '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 13h.01M11 13h.01"/><path d="M15 12h3"/>',
 "phone": '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
 "monitor": '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
 "code": '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
 "doc": '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
 "down": '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
 "link": '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
 "copy": '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
 "usb": '<path d="M12 2v15"/><path d="M8 7l4-4 4 4"/><circle cx="12" cy="19" r="2.5"/><path d="M12 12l-4-2v-2M12 14l4-2V10"/>',
 "shield": '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
}
def ic(n, c="ic"): return f'<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{ICON[n]}</svg>'
def knopf(k, text): return f'<button class="btn" data-laden="{k}">{ic("down","ic s")}<span>{text}</span></button>'
def pruef(k): return f'<p class="pruef"><span>{mb(k)}</span> · SHA-256 <code>{sha(k)}</code> <span class="stand" data-stand="{k}"></span></p>'

seite = f'''<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Familienakte 2.28.3 – Abgleich</title>
<style>
:root{{--bg:#f4f6f9;--karte:#fff;--text:#18202c;--leise:#5b6576;--linie:#dfe4ec;--akzent:#1f5fa8;--akzent2:#e8f0fb;--gut:#1d7a46;--warn:#9a5b00;--code:#eef1f6}}
@media (prefers-color-scheme:dark){{:root{{--bg:#11151c;--karte:#1a2029;--text:#e7ebf1;--leise:#9aa4b3;--linie:#2b3340;--akzent:#7fb2f0;--akzent2:#1d2a3b;--gut:#6fd39b;--warn:#f0b45c;--code:#232b36}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
main{{max-width:980px;margin:0 auto;padding:24px 16px 48px}}
header.kopf{{display:flex;gap:16px;align-items:center;margin-bottom:8px}}
.logo{{width:52px;height:52px;border-radius:14px;background:var(--akzent);color:#fff;display:grid;place-items:center;font-weight:700;letter-spacing:.5px;flex:none}}
h1{{font-size:1.6rem;margin:0}}h2{{font-size:1.2rem;margin:32px 0 12px}}h3{{margin:0;font-size:1.08rem}}
.unter{{color:var(--leise);margin:2px 0 0}}
.schritte{{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-top:20px}}
.schritt{{background:var(--karte);border:1px solid var(--linie);border-radius:14px;padding:14px 16px}}
.nr{{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--akzent2);color:var(--akzent);font-weight:700;margin-right:6px}}
.karten{{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(290px,1fr))}}
.karte{{background:var(--karte);border:1px solid var(--linie);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:10px}}
.karte header{{display:flex;gap:12px;align-items:center}}
.ic{{width:26px;height:26px;flex:none}}.ic.s{{width:18px;height:18px}}
.symbol{{width:46px;height:46px;border-radius:12px;background:var(--akzent2);color:var(--akzent);display:grid;place-items:center;flex:none}}
.wofuer{{color:var(--leise);font-size:.95rem;margin:0}}
ol,ul{{margin:0;padding-left:1.2em}}li{{margin:3px 0}}
.knoepfe{{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:4px}}
.btn,.link{{display:inline-flex;gap:8px;align-items:center;border-radius:10px;padding:9px 14px;font:inherit;font-size:.95rem;cursor:pointer;text-decoration:none}}
.btn{{background:var(--akzent);color:#fff;border:0}}.btn:hover{{filter:brightness(1.08)}}
.link{{background:transparent;color:var(--akzent);border:1px solid var(--linie)}}
.pruef{{font-size:.78rem;color:var(--leise);margin:0;word-break:break-all}}
code{{background:var(--code);border-radius:5px;padding:1px 5px;font-size:.85em}}
.stand[data-ok="1"]{{color:var(--gut);font-weight:600}}.stand[data-ok="0"]{{color:#c0392b;font-weight:600}}
.hinweis{{border-left:4px solid var(--warn);background:var(--karte);padding:10px 14px;border-radius:8px;margin:12px 0}}
.codex{{background:var(--karte);border:1px solid var(--linie);border-radius:16px;padding:18px}}
pre{{background:var(--code);border-radius:10px;padding:12px;overflow:auto;max-height:340px;font-size:.82rem;white-space:pre-wrap}}
.entscheidung{{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));margin:10px 0}}
.wahl{{border:1px solid var(--linie);border-radius:12px;padding:10px 14px;background:var(--bg)}}
footer{{margin-top:36px;color:var(--leise);font-size:.85rem}}
</style></head><body><main>
<header class="kopf"><div class="logo">FA</div><div><h1>Meine Familienakte – Fassung 2.28.3</h1>
<p class="unter">Zum Ausprobieren und zum Abgleich mit deiner Fassung V40. Alle Programme stecken in dieser Datei – du kannst sie direkt hier speichern, auch ohne Internet.</p></div></header>

<div class="schritte">
 <div class="schritt"><span class="nr">1</span><strong>Ausprobieren</strong><br>Eine der vier Fassungen unten wählen und speichern oder öffnen.</div>
 <div class="schritt"><span class="nr">2</span><strong>Mit Codex abgleichen</strong><br>Quellcode und Auftrag speichern, Codex starten, eine Frage beantworten.</div>
 <div class="schritt"><span class="nr">3</span><strong>Zurückschicken</strong><br>Codex schreibt eine Rückmelde-Datei (.md). Die bitte an Klaus schicken.</div>
</div>

<h2>Die Fassungen – wofür welche ist</h2>
<div class="karten">

<article class="karte"><header><div class="symbol">{ic("globe")}</div><div><h3>Im Browser (PWA)</h3><p class="wofuer">Zum schnellen Ansehen, auf jedem PC oder Handy.</p></div></header>
<ol><li>Link in Chrome oder Edge öffnen.</li><li>Oben „Installieren“ tippen – dann läuft sie in einem eigenen Fenster wie eine App.</li><li>Die Daten bleiben im Browser auf diesem Gerät.</li></ol>
<div class="knoepfe"><a class="link" href="https://lausiklauskn-png.github.io/Meine-Familienakte/" target="_blank" rel="noopener">{ic("link","ic s")}<span>Browser-Fassung öffnen</span></a></div></article>

<article class="karte"><header><div class="symbol">{ic("drive")}</div><div><h3>Für die externe Festplatte</h3><p class="wofuer">Die ganze App als <em>eine</em> Datei – zum Mitnehmen.</p></div></header>
<ol><li>Datei speichern und auf die externe Festplatte kopieren.</li><li>An jedem PC: Platte anstecken, Datei doppelklicken – sie öffnet sich in Chrome oder Edge, ohne Internet und ohne Installation.</li><li>In der App den Speicherort wählen: einen Ordner auf der Platte.</li></ol>
<p class="wofuer">Hinweis: Die Ablage ist noch <strong>nicht verschlüsselt</strong>. Der verschlüsselte Tresor für die Platte kommt nach eurem Abgleich.</p>
<div class="knoepfe">{knopf("html","Einzeldatei speichern")}</div>{pruef("html")}</article>

<article class="karte"><header><div class="symbol">{ic("phone")}</div><div><h3>Für das Handy (Android)</h3><p class="wofuer">Eine eigene App auf deinem Android-Handy, mit Diktat und „Teilen → Familienakte“.</p></div></header>
<p class="wofuer"><strong>Weg A – direkt am Handy:</strong> diese Datei auf dem Handy öffnen und „APK speichern“ tippen, oder den Server-Link öffnen.</p>
<p class="wofuer"><strong>Weg B – mit Kabel:</strong> Handy per USB-Kabel an den PC anschließen, am Handy „Dateiübertragung“ wählen, die APK in den Ordner <code>Download</code> kopieren, dann am Handy in „Dateien“ antippen.</p>
<p class="wofuer">Android fragt einmal „Apps aus dieser Quelle zulassen“ – erlauben, dann „Installieren“. Spätere Updates: Tipp auf die Versionszeile oben in der App.</p>
<div class="knoepfe">{knopf("apk","APK speichern")}<a class="link" href="https://family-projekt.de/updates/familienakte/Familienakte-android-v2.28.3.apk">{ic("link","ic s")}<span>vom Server</span></a></div>{pruef("apk")}</article>

<article class="karte"><header><div class="symbol">{ic("monitor")}</div><div><h3>Für Windows</h3><p class="wofuer">Eigenes Programm auf dem PC, mit Windows-Spracherkennung und „Öffnen mit“.</p></div></header>
<ol><li>Setup speichern und doppelklicken (keine Administratorrechte nötig).</li><li>Windows warnt einmal (das Setup ist nicht gekauft-signiert): „Weitere Informationen → Trotzdem ausführen“.</li><li>Spätere Updates: Tipp auf die Versionszeile oben im Programm.</li></ol>
<div class="knoepfe">{knopf("exe","Setup speichern")}<a class="link" href="https://family-projekt.de/updates/familienakte/Familienakte-Windows-2.28.3-x64-setup.exe">{ic("link","ic s")}<span>vom Server</span></a></div>{pruef("exe")}</article>
</div>

<p class="hinweis"><strong>Gut zu wissen:</strong> Oben in der App steht weiter „Version 2.28.1“ – das ist deine Fassungsnummer. Der Schalter für das Internet ist am Anfang <strong>aus</strong>: dann geht nichts ins Netz. Alle Beispieldaten sind erfunden.</p>

<h2>Abgleich mit Codex</h2>
<div class="codex">
<p>Beim Bau dieser Fassung lag <strong>deine Vorlage V40 mit dem M1-Stand nicht vor</strong>. Deshalb konnte nicht alles abgeglichen werden. Codex auf deinem Rechner kann das nachholen: Es vergleicht deine Fassung mit dieser und schreibt auf, was fehlt oder anders ist – als Anweisungen, mit denen Klaus' Seite die Lücken schließen kann, auch für Windows, Android und Browser.</p>
<h3 style="margin-top:14px">So geht's</h3>
<ol>
 <li>Beide Dateien speichern: <strong>Quellcode</strong> und <strong>Codex-Auftrag</strong> (Knöpfe unten).</li>
 <li>Einen Ordner <code>Abgleich</code> anlegen. Darin: <code>v40</code> = eine <strong>Kopie</strong> deiner Fassung, <code>neu-2.28.3</code> = der entpackte Quellcode, und die Datei <code>CODEX-ABGLEICH-FAMILIENAKTE.md</code>.</li>
 <li>Codex in diesem Ordner starten und schreiben:<br><code id="startsatz">Lies CODEX-ABGLEICH-FAMILIENAKTE.md und arbeite den Auftrag Schritt für Schritt ab.</code> <button class="link" data-kopieren="startsatz">{ic("copy","ic s")}<span>kopieren</span></button></li>
 <li>Codex stellt dir zuerst <strong>eine Frage</strong> – das ist deine Entscheidung:</li>
</ol>
<div class="entscheidung">
 <div class="wahl"><strong>A – nur technisch</strong><br>Funktionen, Daten, Register, Sicherung, Prüfungen, Sicherheit.</div>
 <div class="wahl"><strong>B – technisch und optisch</strong><br>zusätzlich Aufbau, Wortlaut, Menüs, Farben, Abstände.</div>
</div>
<ol start="5"><li>Codex arbeitet nur lesend und legt am Ende <code>RUECKMELDUNG-ABGLEICH-…md</code> an. <strong>Diese Datei bitte an Klaus schicken.</strong> Sie enthält keine persönlichen Daten.</li></ol>
<div class="knoepfe">{knopf("zip","Quellcode speichern (.zip)")}{knopf("md","Codex-Auftrag speichern (.md)")}</div>{pruef("zip")}
<details style="margin-top:12px"><summary>Codex-Auftrag hier lesen</summary><pre id="mdtext">{html.escape(md)}</pre><button class="link" data-kopieren="mdtext">{ic("copy","ic s")}<span>ganzen Auftrag kopieren</span></button></details>
</div>

<footer>{ic("shield","ic s")} Vor dem Speichern prüft diese Seite jede Datei an ihrer Prüfsumme (SHA-256). Stand 2026-10-29 · Fassung 2.28.3 · APK-Zertifikat <code>1f06819f…bf8f19</code></footer>
</main>
{''.join(blobs)}
<script>
const META = {json.dumps(meta)};
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function laden(k) {{
  const m = META[k], el = document.getElementById("d-" + k), st = document.querySelector('[data-stand="' + k + '"]');
  const bin = atob(el.textContent.trim()); const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (crypto.subtle) {{
    const ok = hex(await crypto.subtle.digest("SHA-256", bytes)) === m.sha;
    if (st) {{ st.dataset.ok = ok ? "1" : "0"; st.textContent = ok ? "· geprüft" : "· beschädigt – nicht gespeichert"; }}
    if (!ok) return;
  }}
  const url = URL.createObjectURL(new Blob([bytes], {{ type: m.mime }}));
  const a = Object.assign(document.createElement("a"), {{ href: url, download: m.name }});
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}}
document.addEventListener("click", (e) => {{
  const b = e.target.closest("[data-laden]"); if (b) laden(b.dataset.laden);
  const c = e.target.closest("[data-kopieren]");
  if (c) navigator.clipboard?.writeText(document.getElementById(c.dataset.kopieren).textContent).then(() => {{ const s = c.querySelector("span"); const t = s.textContent; s.textContent = "kopiert"; setTimeout(() => s.textContent = t, 1500); }});
}});
</script></body></html>'''
ziel = ZIEL
open(ziel, "w", encoding="utf-8").write(seite)
print(ziel, os.path.getsize(ziel))
