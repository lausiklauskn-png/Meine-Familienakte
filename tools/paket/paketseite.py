# Baut das Paket für den Freund: EINE HTML-Datei mit allen Fassungen eingebettet (Speichern direkt aus der Datei, SHA-256 wird vor
# dem Speichern geprüft), „Was neu ist“ mit Bildschirmfotos (Markierung: roter Rahmen, Nummer, Zeigehand) und Codex-Auftrag.
# Nachfolger von abgleichsseite.py (2.28.3). Aufruf:
#   python3 -I tools/paket/paketseite.py <fassung> <apk> <setup.exe> <einzeldatei.html> <quelle.zip> <bilder-ordner> <ausgabe.html>
# Dateien vorher aus den Releases laden und gegen SHA256SUMS prüfen. Bilder: Aufnahme-Skript siehe docs/PAKET.md.
import sys, base64, hashlib, html, json, os
from pathlib import Path
V, APK, EXE, EINZEL, ZIP, BILDER, ZIEL = sys.argv[1:8]
ROOT = Path(__file__).resolve().parents[2]
md = (ROOT / "docs/CODEX-ABGLEICH-FAMILIENAKTE.md").read_text(encoding="utf-8")
logo = "data:image/png;base64," + base64.b64encode((ROOT / "public/icons/icon-192.png").read_bytes()).decode()
dateien = [
  ("apk", APK, f"Familienakte-android-v{V}.apk", "application/vnd.android.package-archive"),
  ("exe", EXE, f"Familienakte-Windows-{V}-x64-setup.exe", "application/vnd.microsoft.portable-executable"),
  ("html", EINZEL, f"Familienakte-Einzeldatei-{V}.html", "text/html"),
  ("zip", ZIP, f"familienakte-{V}-quelle.zip", "application/zip"),
  ("md", None, "CODEX-ABGLEICH-FAMILIENAKTE.md", "text/markdown"),
]
meta, blobs = {}, []
for key, pfad, name, mime in dateien:
    data = md.encode("utf-8") if pfad is None else open(pfad, "rb").read()
    meta[key] = {"name": name, "mime": mime, "size": len(data), "sha": hashlib.sha256(data).hexdigest()}
    blobs.append(f'<script type="application/octet-stream" id="d-{key}">{base64.b64encode(data).decode()}</script>')
def mb(k): return f"{meta[k]['size']/1048576:.1f}".replace(".", ",") + " MB"
def bild(n):
    p = Path(BILDER) / f"{n}.jpg"
    return "data:image/jpeg;base64," + base64.b64encode(p.read_bytes()).decode() if p.exists() else ""
def knopf(k, text): return f'<button class="btn" data-laden="{k}">⬇ {text}</button>'
def pruef(k): return f'<p class="pruef">{mb(k)} · SHA-256 <code>{meta[k]["sha"][:16]}…</code> <span class="stand" data-stand="{k}"></span></p>'
def legende(punkte): return '<ol class="legende">' + "".join(f'<li><span class="nr">{i}</span><div>{t}</div></li>' for i, t in enumerate(punkte, 1)) + "</ol>"
def figur(n, titel, punkte, text=""):
    src = bild(n)
    img = f'<a href="{src}" target="_blank" rel="noopener"><img src="{src}" alt="{html.escape(titel)}" loading="lazy"></a>' if src else ""
    return f'<figure class="neu"><figcaption><h3>{titel}</h3>{f"<p>{text}</p>" if text else ""}</figcaption>{img}{legende(punkte) if punkte else ""}</figure>'

NEU = [
 figur("01-kopf", "Oben in der Kopfzeile", [
   "<b>Versionszeile</b> – zeigt weiter deine Nummer „Version 2.28.1“. In der Android- und der Windows-App: antippen prüft auf eine neue Fassung vom eigenen Server (family-projekt.de) und spielt sie ein.",
   "<b>Internet-Schalter</b> – am Anfang <b>aus</b>: dann geht nichts ins Netz. Der rote Punkt heißt „aus“. Antippen schaltet ein; die Wahl bleibt nach dem Neustart.",
   "<b>Auf eine neue Fassung prüfen</b> (Update-Knopf) – holt im Browser die neueste Fassung, in den Apps das Update vom Server.",
   "<b>Installieren</b> – nur im Browser: macht die Seite zu einer App mit eigenem Fenster und Symbol, läuft danach auch ohne Internet."],
   "Neu sind Internet-Schalter, Update-Knopf und Installieren. Drucken und Ausloggen gab es schon."),
 figur("02-eingang", "Neue Unterlagen erfassen (Eingangszentrale)", [
   "<b>Dokument fotografieren</b> – öffnet jetzt den vollen Scanner aus Workflow PDF: Blatt wird im Foto gefunden, gerade gezogen, Filter, mehrere Seiten, PDF. Danach geht es gleich in die Prüfung.",
   "<b>Stapel direkt übernehmen</b> – <i>neu</i>: viele Fotos oder Scans auf einmal; jedes Blatt wird automatisch gefunden und gerade gezogen, unsichere bleiben als ganzes Foto mit „Ecken prüfen“. Eingeordnet wird später.",
   "<b>Formular scannen und ausfüllen</b> – <i>neu</i>: Papierformular scannen und gleich am Bildschirm ausfüllen."]),
 figur("03-menue", "Menü „Dokumente“", [
   "<b>Workflow PDF</b> – das ganze Werkzeug Workflow PDF steckt jetzt in der Familienakte (Scannen, Zuschneiden, Felder setzen, Ausfüllen, Prüfen, PDF ausgeben).",
   "<b>Stapel (noch einordnen)</b> – die Liste der übernommenen Scans, bis sie eingeordnet sind. Sie bleibt auch nach dem Schließen erhalten."]),
 figur("04-workflow-pdf", "Workflow PDF in der Akte", [
   "Das Werkzeug läuft in der Seite der Akte, in den Farben der Akte, mit <b>eigener, getrennter Bibliothek</b> (es mischt nichts mit einer anderen Workflow-PDF-Installation). Was du dort teilst oder fertig scannst, landet in der Eingangszentrale der Akte zur Prüfung."]),
 figur("08-stapel-liste", "Stapel: viele Blätter auf einmal", [
   "<b>Farbe und Schärfe</b> wie in Workflow PDF: Original · Farbe verbessern · Graustufen · Dokument · Schwarzweiß, Schärfe 0–100. Der Haken fasst alle Blätter eines Durchgangs zu <b>einem Brief</b> zusammen.",
   "<b>Einordnen</b> (rechts oben) – gibt alle oder die gewählten Blätter an die Eingangszentrale weiter.",
   "<b>Griff</b> – eine Zeile auf eine andere ziehen fügt beide zu einem PDF zusammen, wie Dateien in einen Ordner. Alternativ: Haken setzen und „Zusammenfügen“."],
   "Während des Einlesens: Anhalten · Weiter · Abbrechen. Die Liste ist schlank, ohne Vorschaubilder."),
 figur("09-stapel-vorschau", "Stapel: ein Blatt ansehen", [
   "<b>Große Vorschau</b> erst beim Antippen des Namens – das Blatt ist schon gerade gezogen.",
   "<b>In Workflow PDF öffnen</b> – zum Nacharbeiten: anpassen, zuschneiden, Ecken setzen.",
   "<b>Prüfen</b> – nur auf Wunsch: sucht versteckten Text und Anweisungen an eine KI. Amtspost braucht das meist nicht, deshalb läuft es nicht von selbst."]),
 figur("05-briefkopf", "Briefkopf im Eingang", [
   "<b>Aus dem Briefkopf</b> – der Text wird gelesen (Textebene, sonst Texterkennung auf dem Gerät) und <b>Absender und Empfänger getrennt</b> erkannt, dazu Kunden-/Aktennummer und Thema. Alles änderbar. Der Empfänger wird mit den Personen der Akte abgeglichen, das Thema schlägt den Lebensbereich vor, das Briefdatum füllt das Dokumentdatum. Steht dieselbe Nummer schon an einer früheren Unterlage, wird sie genannt und ihr Vorgang vorgeschlagen.",
   "<b>Titel-Vorschlag</b> „Brief von &lt;Absender&gt;, &lt;Datum&gt;“."]),
 figur("06-unterlage-knoepfe", "An jeder Unterlage", [
   "<b>Ausfüllen</b> – Formular direkt in der Akte ausfüllen (nächstes Bild).",
   "<b>In Workflow PDF öffnen</b> – die Unterlage im Werkzeug bearbeiten. Bei geschützten Gesundheitsunterlagen gibt es diesen Knopf nicht."],
   "Die Notiz an der Unterlage merkt sich den Briefkopf (Absender, Empfänger, Nummer)."),
 figur("07-ausfuellen", "Ausfüllen", [
   "<b>Felder erkennen</b> – ohne Internet: Linien, Kästchen und Beschriftungen werden gefunden, bei Scans per Texterkennung.",
   "<b>Mit KI benennen</b> – freiwillig; die KI sieht nur die Beschriftungen, unkenntlich gemacht, ohne deine Werte.",
   "<b>Neu scannen</b> – das Formular mit dem Scanner von Workflow PDF neu aufnehmen.",
   "<b>Festes PDF speichern</b> – das Ergebnis wird eine <b>neue</b> Unterlage neben dem Original; das Original bleibt unverändert. Oder „Ausfüllbares PDF“, oder „Später ausfüllen (vormerken)“ – dann steht es im Cockpit unter „Muss noch ausgefüllt werden“."],
   "Dazu: Felder aus einer Person vorbelegen (gelb, änderbar) · Unterschrift einmal zeichnen und mit eigenem Passwort verschlüsselt merken · Eingabe-Speicher (Vorschläge beim Tippen, abschaltbar)."),
]
WEITERE = [
 ("Mit KI arbeiten", "Runder Knopf unten rechts auf jeder Seite: bereitet einen Auftrag für ChatGPT oder Claude vor. Namen, Anschriften, Telefon, Kennzeichen und Nummern werden vorher unkenntlich gemacht; „Das sieht die KI“ zeigt es vorher. Die Antwort setzt die echten Angaben nur auf dem Gerät wieder ein."),
 ("Drei Fassungen aus einer Quelle", "Browser (PWA), Android-App, Windows-Programm und die Einzeldatei für eine externe Platte. Technik darunter: reine Browser-App (Vite) statt Next.js/Cloudflare."),
 ("Datensicherheit", "Register mit Stand gegen gleichzeitiges Überschreiben, gemerkter Stammordner, Aufräumen bei Fehlern, Prüfsummen auch für große Dateien."),
 ("Diktat", "Mikrofon in Android auch ohne Internet (Android-Sprachfenster), unter Windows die Windows-Spracherkennung; in Chrome auf Android kein doppelter Text mehr."),
 ("Eingang liest den Inhalt", "PDFs und Fotos werden gelesen (Textebene, sonst Texterkennung auf dem Gerät); daraus Zusammenhang, Bereich und Titel. Die eigene Wahl bleibt stehen, die Automatik überschreibt sie nicht."),
 ("Personen", "Anschrift, E-Mail und Telefon an Personen; daraus wird beim Ausfüllen vorbelegt."),
 ("Netz (Mycel)", "Eigene Seite im Menü: mit anderen Geräten verbinden – nur wenn du es antippst, beim Laden geht nichts ins Netz."),
 ("Menü", "Die Menüleiste bricht bei mittleren Breiten in zwei Reihen um; vorher waren „Dokumente“ und „Hilfe“ abgeschnitten."),
]
weiter_html = "".join(f'<div class="hint"><b>{t}</b><p>{x}</p></div>' for t, x in WEITERE)

seite = f'''<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Meine Familienakte {V}</title>
<style>
:root{{--bg:#f3f2ee;--karte:#fff;--text:#1c2228;--leise:#59626b;--linie:#e2dfd6;--akzent:#087f7a;--akzent2:#e3f2f1;--rot:#d6261c;--gut:#1f7a45;--code:#eef1f6}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#14181c;--karte:#1c2227;--text:#eef1f3;--leise:#a6afb7;--linie:#2c343a;--akzent:#5fd0c8;--akzent2:#173331;--rot:#ff6b60;--gut:#7fd8a2;--code:#232b36;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#14181c;--karte:#1c2227;--text:#eef1f3;--leise:#a6afb7;--linie:#2c343a;--akzent:#5fd0c8;--akzent2:#173331;--rot:#ff6b60;--gut:#7fd8a2;--code:#232b36;color-scheme:dark}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
main{{max-width:1000px;margin:0 auto;padding:24px 16px 48px;display:grid;gap:20px}}
header.kopf{{display:grid;grid-template-columns:72px 1fr;gap:16px;align-items:center}}
header.kopf img{{width:72px;height:72px;border-radius:22%}}
h1{{font-size:clamp(1.6rem,6vw,2.2rem);line-height:1.1;margin:0}}h2{{font-size:1.35rem;margin:8px 0 0}}h3{{margin:0;font-size:1.12rem}}
.unter{{color:var(--leise);margin:4px 0 0}}
.karten{{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}}
.karte,.box{{background:var(--karte);border:1px solid var(--linie);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:10px}}
.wofuer{{color:var(--leise);font-size:.95rem;margin:0}}
ol,ul{{margin:0;padding-left:1.2em}}li{{margin:3px 0}}
.knoepfe{{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto}}
.btn,.link{{display:inline-flex;gap:8px;align-items:center;border-radius:999px;padding:9px 16px;font:inherit;font-weight:700;font-size:.95rem;cursor:pointer;text-decoration:none}}
.btn{{background:var(--akzent);color:#fff;border:0}}@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]) .btn{{color:#14181c}}}}
.link{{background:transparent;color:var(--akzent);border:1.5px solid var(--linie)}}
.pruef{{font-size:.78rem;color:var(--leise);margin:0;word-break:break-all}}
code{{background:var(--code);border-radius:5px;padding:1px 5px;font-size:.85em}}
.stand[data-ok="1"]{{color:var(--gut);font-weight:700}}.stand[data-ok="0"]{{color:var(--rot);font-weight:700}}
.hinweis{{border-left:4px solid var(--akzent);background:var(--karte);padding:12px 14px;border-radius:10px;margin:0}}
figure.neu{{margin:0;background:var(--karte);border:1px solid var(--linie);border-radius:18px;padding:16px;display:grid;gap:12px}}
figure.neu figcaption p{{margin:4px 0 0;color:var(--leise)}}
figure.neu img{{width:100%;height:auto;display:block;border-radius:12px;border:1px solid var(--linie)}}
.legende{{list-style:none;padding:0;display:grid;gap:8px}}
.legende li{{display:grid;grid-template-columns:30px 1fr;gap:10px;align-items:start;margin:0}}
.legende .nr{{width:28px;height:28px;border-radius:50%;background:var(--rot);color:#fff;font-weight:800;display:grid;place-items:center}}
.hints{{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}}
.hint{{border-left:4px solid var(--akzent);padding:2px 0 2px 12px}}.hint b{{display:block}}.hint p{{margin:2px 0 0;color:var(--leise);font-size:.95rem}}
pre{{background:var(--code);border-radius:10px;padding:12px;overflow:auto;max-height:340px;font-size:.82rem;white-space:pre-wrap}}
nav.inhalt{{display:flex;flex-wrap:wrap;gap:8px}}
footer{{color:var(--leise);font-size:.85rem;text-align:center}}
</style></head><body><main>
<header class="kopf"><img src="{logo}" alt="Logo Meine Familienakte"><div><h1>Meine Familienakte · Fassung {V}</h1>
<p class="unter">Alle Fassungen stecken in dieser einen Datei – speichern direkt von hier, auch ohne Internet. Darunter: was seit deiner Fassung neu ist, mit Bildern.</p></div></header>
<nav class="inhalt"><a class="link" href="#laden">Laden</a><a class="link" href="#neu">Was neu ist</a><a class="link" href="#weitere">Weitere Änderungen</a><a class="link" href="#codex">Abgleich mit Codex</a></nav>

<h2 id="laden">Laden</h2>
<div class="karten">
<article class="karte"><h3>Im Browser</h3><p class="wofuer">Zum schnellen Ansehen, auf jedem PC oder Handy. In Chrome oder Edge oben „Installieren“ – dann läuft sie wie eine App.</p>
<div class="knoepfe"><a class="link" href="https://lausiklauskn-png.github.io/Meine-Familienakte/" target="_blank" rel="noopener">Browser-Fassung öffnen</a></div></article>
<article class="karte"><h3>Android</h3><p class="wofuer">Datei speichern und antippen, einmal „Apps aus dieser Quelle zulassen“, dann „Installieren“. Über eine vorhandene Fassung drüberinstallieren.</p>
<div class="knoepfe">{knopf("apk","APK speichern")}</div>{pruef("apk")}</article>
<article class="karte"><h3>Windows</h3><p class="wofuer">Setup speichern und doppelklicken (ohne Administratorrechte). Windows warnt einmal: „Weitere Informationen → Trotzdem ausführen“.</p>
<div class="knoepfe">{knopf("exe","Setup speichern")}</div>{pruef("exe")}</article>
<article class="karte"><h3>Einzeldatei</h3><p class="wofuer">Die ganze App in einer Datei, z. B. für eine externe Platte: per Doppelklick in Chrome oder Edge öffnen, ohne Internet und ohne Installation.</p>
<div class="knoepfe">{knopf("html","Einzeldatei speichern")}</div>{pruef("html")}</article>
</div>
<p class="hinweis"><b>Gut zu wissen:</b> Oben steht weiter „Version 2.28.1“ – das ist deine Nummer; {V} ist die Paketfassung für Installation und Updates. Der Internet-Schalter steht am Anfang auf <b>aus</b>. Alle Beispieldaten sind erfunden. Diese Datei kannst du weiterschicken: wer sie öffnet, kann alles daraus speichern.</p>

<h2 id="neu">Was neu ist – mit Bildern</h2>
<p class="unter">Die roten Rahmen und die Hand zeigen auf das Neue; die Nummer steht unter dem Bild erklärt. Ein Tipp aufs Bild öffnet es groß.</p>
{"".join(NEU)}

<h2 id="weitere">Weitere Änderungen</h2>
<div class="box"><div class="hints">{weiter_html}</div></div>

<h2 id="codex">Abgleich mit Codex</h2>
<div class="box">
<p>Codex auf deinem Rechner kann deine Fassung mit dieser vergleichen und aufschreiben, was fehlt oder anders ist. So geht's: Quellcode und Auftrag speichern, einen Ordner <code>Abgleich</code> anlegen (darin eine <b>Kopie</b> deiner Fassung, der entpackte Quellcode und die Auftragsdatei), Codex dort starten und schreiben:</p>
<p><code id="startsatz">Lies CODEX-ABGLEICH-FAMILIENAKTE.md und arbeite den Auftrag Schritt für Schritt ab.</code> <button class="link" data-kopieren="startsatz">kopieren</button></p>
<p class="wofuer">Codex arbeitet nur lesend und schreibt am Ende eine Rückmelde-Datei (.md) – die bitte an Klaus schicken.</p>
<div class="knoepfe">{knopf("zip","Quellcode speichern (.zip)")}{knopf("md","Codex-Auftrag speichern (.md)")}</div>{pruef("zip")}
<details><summary>Codex-Auftrag hier lesen</summary><pre id="mdtext">{html.escape(md)}</pre></details>
</div>
<footer>Vor dem Speichern prüft diese Seite jede Datei an ihrer Prüfsumme (SHA-256). Fassung {V} · Stand 1. November 2026</footer>
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
  if (c) navigator.clipboard?.writeText(document.getElementById(c.dataset.kopieren).textContent).then(() => {{ const t = c.textContent; c.textContent = "kopiert"; setTimeout(() => c.textContent = t, 1500); }});
}});
</script></body></html>'''
open(ZIEL, "w", encoding="utf-8").write(seite)
print(ZIEL, os.path.getsize(ZIEL))
