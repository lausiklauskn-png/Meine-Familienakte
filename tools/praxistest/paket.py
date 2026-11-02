#!/usr/bin/env python3
"""Offline test sheets and invented A4 originals. No network or real user data."""
import base64
import hashlib
import html
import io
import json
from pathlib import Path
import sys
import zipfile

import fitz
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parents[1] / 'work' / 'praxistest'
OUT.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('TestSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('TestBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
INK = colors.HexColor('#18313e')
TEAL = colors.HexColor('#006b64')
PALE = colors.HexColor('#edf4f3')
W, H = A4
STYLE = ParagraphStyle('text', fontName='TestSans', fontSize=10.2, leading=15, textColor=INK)
DOCS = [
 dict(key='bild', filename='01_Bildprobe_A.pdf', code='FA-P01-4827', number='DOC-TEST-001', title='Kaufbeleg und Bildprobe A', sender='Testgeräte Bildwerk', person='Mara Testfeld', date='28.10.2026', customer='KD-KAUF-101', category='Käufe & Garantien', amount='149,90 EUR',
      fields=[('Rechnungsnummer','RE-TEST-2026-101'),('Artikel / Objekt','Test-Wasserkocher WOLKE / OBJ-TEST-101'),('Nettobetrag','125,97 EUR'),('Umsatzsteuer 19 %','23,93 EUR'),('Bruttobetrag','149,90 EUR'),('Zahlungsstand','Bezahlt am 28.10.2026 – erfundener Vorgang'),('Garantiehinweis','Bis 28.10.2028 – nur Testangabe')],
      text='Dieser erfundene Kaufbeleg gehört zu Mara Testfeld. Die drei farbigen Formen unten sind die Bildprobe: blaues Quadrat, roter Kreis und grünes Dreieck. Beim Scan müssen alle Formen und Eckmarken erhalten bleiben.'),
 dict(key='brief', filename='02_Briefprobe_B_Rechnung.pdf', code='FA-P02-6391', number='DOC-TEST-002', title='Energierechnung · Briefprobe B', sender='Testenergie Musterstadt', person='Mara Testfeld', date='29.10.2026', customer='KD-ENERGIE-204', category='Wohnen / Energie', amount='73,40 EUR',
      fields=[('Rechnungsnummer','RE-TEST-2026-204'),('Leistungszeitraum','01.10.2026 bis 28.10.2026'),('Nettobetrag','61,68 EUR'),('Umsatzsteuer 19 %','11,72 EUR'),('Bruttobetrag','73,40 EUR'),('Fällig am','20.11.2026'),('Zahlungshinweis','Zugehöriger Test-Zahlungsbeleg: DOC-TEST-005')],
      text='Guten Tag Mara Testfeld, dies ist die frei erfundene Energierechnung für die Testwohnung. Kundennummer KD-ENERGIE-204 und Rechnungsnummer RE-TEST-2026-204 verbinden sie mit dem Zahlungsbeleg E. Prüftext: Der blaue Ordner liegt neben der Lampe.'),
 dict(key='medizin', filename='03_Medizin_C.pdf', code='FA-P03-7519', number='DOC-TEST-003', title='Medizinische Testunterlage C', sender='Testpraxis Sonnenseite', person='Leon Testfeld', date='30.10.2026', customer='PAT-TEST-303', category='Geschützte Gesundheitsakte', amount='Kein Zahlungsbetrag',
      fields=[('Geburtsdatum des Patienten','08.09.2014'),('Vertreten durch','Mara Testfeld, Mutter'),('Befundnummer','BEFUND-TEST-303'),('Erfundener Anlass','Kontrolle nach Handgelenkprellung'),('Erfundene Diagnose','Handgelenkprellung – ausschließlich Testinhalt'),('Test-Kontrolltermin','12.11.2026, 10:30 Uhr'),('Kassen-/Versichertennummer','VERSICHERT-TEST-303 – ungültiger Platzhalter')],
      text='Diese Unterlage enthält keine echten Gesundheitsdaten und keine Behandlungsempfehlung. Patient ist Leon, nicht Mara. Beim allgemeinen Suchergebnis außerhalb des geschützten Bereichs sensible Angaben nicht ungewollt offen anzeigen. Die vollständige Unterlage nur im dafür vorgesehenen Bereich prüfen.'),
 dict(key='familie', filename='04_Familienbrief_D.pdf', code='FA-P04-8642', number='DOC-TEST-004', title='Schulbrief und Familienzuordnung D', sender='Testschule Wolkenhof', person='Leon Testfeld', date='31.10.2026', customer='SCH-TEST-404', category='Familie / Schule', amount='Kein Zahlungsbetrag',
      fields=[('Schüler / Geburtsdatum','Leon Testfeld / 08.09.2014'),('Vertreten durch','Mara Testfeld, Mutter'),('Aktenzeichen','SCH-TEST-404 / KLASSE-TEST-7'),('Thema','Erfundene Anmeldung zum Projekttag'),('Projekttag','25.11.2026'),('Rückmeldung bis','18.11.2026'),('Familienbeziehung','Mara ist die Mutter von Leon')],
      text='Lieber Leon Testfeld, dies ist ein erfundener Schulbrief. Die Rückmeldung zum Test-Projekttag soll bis 18.11.2026 vorliegen. Empfänger ist Leon, vertreten durch Mara. Die gemeinsame Anschrift ist kein Grund, beide Personen zu einer einzigen Person zusammenzufassen.'),
 dict(key='zahlung', filename='05_Zahlungsbeleg_E.pdf', code='FA-P05-9753', number='DOC-TEST-005', title='Erfundener Zahlungsbeleg E', sender='Testbank Beispielkonto', person='Mara Testfeld', date='01.11.2026', customer='KD-ENERGIE-204', category='Zahlungen / Bezug zu Rechnung B', amount='-73,40 EUR',
      fields=[('Kontoinhaberin','Mara Testfeld'),('Buchung / Wertstellung','01.11.2026 / 01.11.2026'),('Zahlungspartner','Testenergie Musterstadt'),('Betrag / Richtung','-73,40 EUR / Ausgang'),('Verwendungszweck','RE-TEST-2026-204 / KD-ENERGIE-204'),('Buchungsnummer','BUCHUNG-TEST-005'),('Kontokennung','TEST-KONTO-0001 – ungültig'),('Bankverbindung','TEST-IBAN-0001 – ungültig, nicht überweisbar')],
      text='Dieser Beleg simuliert eine Zahlung zur Rechnung B. Es ist kein Zahlungsauftrag. Rechnung und Zahlung sind zwei Originalunterlagen zu einem wirtschaftlichen Vorgang über 73,40 EUR. Anfangsbestand des erfundenen Kontos: 500,00 EUR; Endbestand: 426,60 EUR. Keine echte Bank verwenden.'),
 dict(key='fahrzeug', filename='06_Fahrzeug_F.pdf', code='FA-P06-1864', number='DOC-TEST-006', title='Werkstatt- und Fahrzeugunterlage F', sender='Testwerkstatt Räderklar', person='Mara Testfeld', date='02.11.2026', customer='KD-AUTO-606', category='Fahrzeuge / Wartung', amount='275,00 EUR',
      fields=[('Rechnungsnummer','RE-TEST-2026-606'),('Fahrzeug / Objekt','TEST-AUTO-06 / OBJ-TEST-606'),('Kennzeichen / FIN','TEST-KENNZEICHEN / TEST-FIN-0006 – beide ungültig'),('Nettobetrag / Steuer 19 %','231,09 EUR / 43,91 EUR'),('Bruttobetrag','275,00 EUR'),('Test-Leistung','Erfundene Wartung'),('Nächster Test-Termin','01.12.2026')],
      text='Diese erfundene Rechnung gehört zum Fahrzeugobjekt TEST-AUTO-06 und zur Person Mara Testfeld. Fahrzeug-, Rechnungs- und Kundennummer sind unterschiedliche Felder. Der Termin 01.12.2026 ist ein Testdatum und kein amtlicher Prüfungsnachweis.')
]

def para(c, text, x, y, width=483):
    p = Paragraph(html.escape(text), STYLE)
    _, height = p.wrap(width, 200)
    p.drawOn(c, x, y-height)
    return y-height-9

def page(c, d, index):
    c.setFillColor(INK)
    c.setStrokeColor(INK)
    for x,y,dx,dy in [(28,28,1,1),(W-28,28,-1,1),(28,H-28,1,-1),(W-28,H-28,-1,-1)]:
        c.line(x,y,x+dx*14,y);c.line(x,y,x,y+dy*14)
    c.setFillColor(TEAL);c.rect(42,H-91,W-84,44,fill=1,stroke=0)
    c.setFillColor(colors.white);c.setFont('TestBold',12)
    c.drawString(55,H-65,'ERFUNDENE TESTUNTERLAGE – NICHT ECHT')
    c.setFont('TestSans',9);c.drawString(55,H-81,'Keine echten Personen-, Konto-, Patienten- oder Vertragsdaten')
    c.setFillColor(INK);c.setFont('TestBold',18);c.drawString(55,H-124,d['title'])
    c.setFont('TestBold',12);c.drawString(55,H-147,d['code']+'  /  '+d['number'])
    y=H-171
    meta=[('Absender',d['sender']+' (erfunden)'),('Absenderadresse','Beispielallee '+str(index)+', 00000 Teststadt'),('Empfänger',d['person']+' · Musterweg 12 · 00000 Teststadt'),('Dokumentdatum',d['date']),('Kunden-/Aktennummer',d['customer']),('Datennummer',d['number'])]
    for label,value in meta+d['fields']:
        c.setFont('TestBold',8.5);c.setFillColor(TEAL);c.drawString(55,y,label)
        y=para(c,value,215,y+9,325)-4
    y-=8;c.setFillColor(PALE);c.rect(49,y-91,W-98,96,fill=1,stroke=0)
    para(c,d['text'],59,y-5,W-118)
    if d['key']=='bild':
        c.setFillColor(colors.HexColor('#2164aa'));c.rect(140,105,40,40,fill=1,stroke=0)
        c.setFillColor(colors.HexColor('#d74a39'));c.circle(294,125,21,fill=1,stroke=0)
        c.setFillColor(colors.HexColor('#15936d'));p=c.beginPath();p.moveTo(407,104);p.lineTo(451,104);p.lineTo(429,146);p.close();c.drawPath(p,fill=1,stroke=0)
        c.setFillColor(INK);c.setFont('TestSans',8);c.drawCentredString(W/2,87,'Bildprobe: blaues Quadrat · roter Kreis · grünes Dreieck')
    c.setFillColor(INK);c.setFont('TestSans',8)
    c.drawString(55,59,'Prüfzeile: Ä Ö Ü ä ö ü ß · 0123456789 · Originale bleiben erhalten.')
    c.setFont('TestBold',9);c.drawString(55,42,f'Stapelcode FA-S{index:02d} · Sollposition {index:02d} · Dieses Dokument: 1 Seite')
    c.setFont('TestSans',8);c.drawRightString(W-55,42,'A4 / 100 % / Ausgabe 02.11.2026')
    c.showPage()

assets={}
def add_asset(key,filename,label,mime,data):
    (OUT/filename).write_bytes(data)
    assets[key]=dict(key=key,filename=filename,label=label,mime=mime,bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),data=base64.b64encode(data).decode())

for i,d in enumerate(DOCS,1):
    stream=io.BytesIO();c=canvas.Canvas(stream,pagesize=A4,pageCompression=1,invariant=1)
    c.setTitle(d['title']+' – erfunden');c.setAuthor('Familienakte Praxistest');page(c,d,i);c.save()
    add_asset(d['key'],d['filename'],d['title'],'application/pdf',stream.getvalue())

image_doc=fitz.open(stream=base64.b64decode(assets['bild']['data']),filetype='pdf')
jpeg=image_doc[0].get_pixmap(matrix=fitz.Matrix(1.6,1.6)).pil_tobytes(format='JPEG',quality=90)
add_asset('jpg','01_Bildprobe_A.jpg','Bildprobe A als vollständige Bilddatei','image/jpeg',jpeg)
thumb=image_doc[0].get_pixmap(matrix=fitz.Matrix(.35,.35)).pil_tobytes(format='JPEG',quality=80)
image_doc.close()

stream=io.BytesIO();c=canvas.Canvas(stream,pagesize=A4,pageCompression=1,invariant=1)
c.setTitle('Fünferstapel – absichtlich gemischt 04 01 05 02 03')
for i in [4,1,5,2,3]:page(c,DOCS[i-1],i)
c.save();add_asset('stapel','Stapel_5_Seiten_GEMISCHT.pdf','Fünf Seiten zum Ausdrucken: 04–01–05–02–03','application/pdf',stream.getvalue())
stream=io.BytesIO()
with zipfile.ZipFile(stream,'w',zipfile.ZIP_DEFLATED) as z:
    for d in DOCS[:5]:z.writestr(d['filename'],base64.b64decode(assets[d['key']]['data']))
add_asset('einzeln','Stapel_5_einzelne_PDFs.zip','Dieselben fünf Seiten als fünf einzelne PDFs','application/zip',stream.getvalue())

stream=io.BytesIO();c=canvas.Canvas(stream,pagesize=A4,pageCompression=1,invariant=1)
c.setTitle('Leeres Testformular – keine echte Erklärung');c.setFont('TestBold',18);c.setFillColor(INK)
c.drawString(50,H-70,'Erfundenes Testformular');c.setFont('TestSans',11)
para(c,'Nur Testdaten eintragen. Keine Überweisung, kein echter Antrag. Ausgefüllte Fassung separat speichern; das leere Original behalten.',50,H-95,W-100)
for i,(name,label) in enumerate([('person','Name'),('customer','Kundennummer'),('invoice','Rechnungsnummer'),('amount','Betrag in EUR'),('date','Datum'),('note','Notiz')]):
    y=H-175-i*76;c.setFont('TestBold',11);c.drawString(50,y+25,label)
    c.acroForm.textfield(name=name,tooltip=label,x=50,y=y-10,width=W-100,height=28,fontName='Helvetica',fontSize=12,borderStyle='solid',borderWidth=1,forceBorder=True)
c.setFont('TestSans',9);c.drawString(50,80,'FORM-TEST-001 · Alle Felder leer · Keine gültige Unterschrift oder Zahlungsanweisung')
c.showPage();c.save();add_asset('formular','Testformular_LEER.pdf','Leeres PDF-Formular zum Ausfüllen','application/pdf',stream.getvalue())
stream=io.BytesIO()
with zipfile.ZipFile(stream,'w',zipfile.ZIP_DEFLATED) as z:
    for d in DOCS:z.writestr(d['filename'],base64.b64decode(assets[d['key']]['data']))
add_asset('alle','Testunterlagen_A_bis_F.zip','Alle sechs Fachunterlagen A–F','application/zip',stream.getvalue())

def safe_json(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
def expected_table():
    rows=[]
    for d in DOCS:
        more='; '.join(k+': '+v for k,v in d['fields'])
        rows.append('<tr>'+''.join('<td>'+html.escape(value)+'</td>' for value in [d['code']+' / '+d['number'],d['sender']+' → '+d['person'],d['date']+' · '+d['customer'],d['category']+' · '+d['amount'],more])+'</tr>')
    return '<table><thead><tr><th>Dokument</th><th>Absender / Person</th><th>Datum / Nummer</th><th>Bereich / Betrag</th><th>Weitere Sollwerte</th></tr></thead><tbody>'+''.join(rows)+'</tbody></table>'

series=json.loads((ROOT/'reihen.json').read_text())
template=(ROOT/'vorlage.html').read_text()
series_files=[]
for s in series:
    content=template
    replace={'TITLE':html.escape(s['title']),'INTRO':html.escape(s['intro']),'DEVICES':html.escape(s['devices']),'TIME':html.escape(s['time']),'SETUP':html.escape(s['setup']),'EXPECTED':expected_table(),'SERIES':safe_json(s),'ASSETS':safe_json([assets[k] for k in s['docs']])}
    for key,value in replace.items():content=content.replace('@@'+key+'@@',value)
    assert '@@' not in content
    filename='Testreihe-'+s['id']+'.html'
    (OUT/filename).write_text(content,encoding='utf-8')
    series_files.append(dict(filename=filename,title=s['title'],time=s['time'],intro=s['intro'],id=s['id'],data=base64.b64encode(content.encode()).decode()))

css=template.split('<style>',1)[1].split('</style>',1)[0]
cards=''.join('<article class="box"><div class="chip">Reihe '+html.escape(s['id'].split('-')[0])+' · '+html.escape(s['time'])+'</div><h2 style="margin-top:12px">'+html.escape(s['title'])+'</h2><p>'+html.escape(s['intro'])+'</p><button data-series="'+s['id']+'">Testbogen als HTML herunterladen</button></article>' for s in series_files)
overview='''<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Familienakte · Gemeinsam im Alltag testen</title><style>'''+css+'''</style></head><body><header><div class="kicker">Eure Werkstatt · Windows · Tablet · Handy · Fernrechner</div><h1>Gemeinsam im Alltag testen</h1><p>Druckfertige Testunterlagen. Klare Schritte. Eure Beobachtungen zum Zurückgeben.</p><p>Familienakte Pro · Workflow PDF Pro · Private Brain Pro · BookLedgerPro</p></header><main>
<section class="box"><h2>Die ganze Übersicht weitergeben</h2><p>Diese eine HTML-Datei enthält alle zehn Testreihen und sämtliche Druckvorlagen. Speichert sie mit diesem Knopf und verschickt die gespeicherte Datei als Anhang. Beim Empfänger funktionieren die enthaltenen Downloads auch ohne Internet.</p><div class="buttons"><button id="save-overview">Gesamte HTML zum Weitergeben speichern</button></div><p id="overview-save-status" class="notice" role="status">Die gespeicherte Datei heißt Familienakte-Praxistest-Komplett.html. Im Browser öffnen; bei einer reinen Anhang-Vorschau zunächst auf das Gerät herunterladen.</p></section>
<section class="box"><h2>So beginnt ihr</h2><ol><li>Eine passende Testreihe unten herunterladen und diese HTML-Datei im Browser öffnen.</li><li>Gerät, Betriebssystem und App-Version eintragen. Die enthaltenen Testdokumente herunterladen.</li><li>Schritte der Reihe nach ausführen: Ja, Nein oder Nicht geprüft markieren und kurze Notiz ergänzen.</li><li>„Ergebnis als HTML speichern“ wählen. Die heruntergeladene Datei noch einmal öffnen und Antworten kontrollieren.</li><li>Die ausgefüllte HTML oder das JSON hier zur Auswertung zurückgeben. Bereinigte Bildschirmfotos sind optional.</li></ol><p class="notice">Jeder Testbogen funktioniert für sich: Anleitung, Dokumente, Sollwerte und Antwortfelder sind eingebettet. Keine Anmeldung, keine automatische Übermittlung. Am Ende ausdrücklich eine Ergebnisdatei herunterladen. Ausgefüllte Ergebnisbögen werden separat gespeichert; sie sind nicht Teil dieser leeren Übersicht.</p></section>
<section class="box hint"><h2>Ein Ende ist vorgesehen</h2><p>Startet mit Reihe 01 am PC und 02 auf einem Android-Gerät. Danach nur die Verbindungen ausprobieren, die ihr wirklich nutzen wollt. Pro Weg zunächst zwei Dokumente. Den Fünferstapel einmal prüfen. Weitere Kombinationen folgen nur bei einem konkreten Unterschied oder Fehler.</p><p>Für ein zweites Android-System oder einen anderen Partner einen neuen Ergebnisbogen verwenden. Mehrere Monitore zählen als Anzeigeprobe am selben Rechner. Ein zweiter Rechner ist dagegen ein eigener Endpunkt.</p><p>Reihen 04–08 benötigen auf beiden Seiten die App-Fassung mit Pro-Verbund bzw. Gerätepaketen. Versionen im Bogen notieren. Fehlende oder als vorbereitet bezeichnete Funktionen werden als solche erfasst, nicht als bestanden.</p></section>
<section class="box"><h2>Von der Vorlage bis zum Ergebnis</h2><div class="chips"><span class="chip">Digital oder Papier</span><span aria-hidden="true">→</span><span class="chip">Datei / Scanner / Kamera</span><span aria-hidden="true">→</span><span class="chip">Eingang prüfen</span><span aria-hidden="true">→</span><span class="chip">Dauerhaft speichern</span><span aria-hidden="true">→</span><span class="chip">Übergeben & bestätigen</span></div><p>Automatisches Öffnen und bewusste Übergabe werden getrennt beobachtet. „Datei versendet“ ist noch keine Bestätigung, dass die Ziel-App sie gespeichert hat.</p></section>
<section class="box"><h2>Eure erfundene Testfamilie</h2><p>Mara Testfeld, geboren am 12.04.1985, und ihr Sohn Leon Testfeld, geboren am 08.09.2014. Beide wohnen im Musterweg 12, 00000 Teststadt. Alle Organisationen, Personen, Nummern, Diagnosen und Vorgänge sind erfunden. Bank- und Fahrzeugkennungen sind ungültige Testplätze.</p><p>A: Kauf/Garantie und Bild · B: Energie-Rechnung · C: Gesundheit · D: Familie/Schule · E: Zahlung zu B · F: Fahrzeug. Ein leeres PDF-Formular ergänzt die Ausfüllprobe.</p><img class="docimage" alt="Vorschau der druckfertigen Bild- und Kaufprobe A" src="data:image/jpeg;base64,'''+base64.b64encode(thumb).decode()+'''"><details><summary>Die vollständige Sollwerttabelle ansehen</summary><div class="scroll">'''+expected_table()+'''</div></details><div class="buttons"><button id="all-docs">Alle Testunterlagen als ZIP herunterladen</button></div></section>
<h2>Testreihen auswählen</h2><div class="grid">'''+cards+'''</div>
<section class="box"><h2>Was abgedeckt wird</h2><ul class="coverage"><li>Dateidownload, Bild/PDF-Import, Scan/Kamera, automatische App-Öffnung und bewusste Übergabe.</li><li>Zwei Dokumente hintereinander, fünfseitiger Stapel, fünf einzelne PDFs, Reihenfolge und Zusammenfassen.</li><li>Absender, Empfänger, Personenbezug, Kunden-/Akten-/Datennummer, Datum, Betrag und Lebensbereich.</li><li>Gemeinsamer Pro-Tresor, drei eigenständige Partner, Rückweg, Wiederholung, Bestätigung und Neustart.</li><li>Android → Windows, Windows → Android sowie ein entferntes Gerät über vorhandenen Dateitransport.</li><li>BookLedgerPro: Rechnung und Zahlung als zusammengehörige Belege; keine echte Banktransaktion.</li><li>Familienakte: Suche, geschützter Gesundheitsbereich, Erinnerungen, optionale Spracheingabe, Fristenstand, Formular, Sicherung und Wiederherstellung.</li></ul><p>Die Reihen sind eine endliche Praxisprobe der Kernwege. Sie ersetzen keinen Volltest jeder Einstellung, jedes Android-Modells und jeder Scanner-Software. Fehlende Funktionen und Verbesserungswünsche sind ausdrücklich Teil eurer Rückmeldung.</p></section>
<p id="download-status" class="notice" role="status">Wählt einen Testbogen. Die Originaldatei wird beim Ankreuzen nicht automatisch überschrieben.</p><footer>Übersicht Ausgabe 2 · Testbögen Ausgabe 1 · 02.11.2026 · Keine echten personenbezogenen Daten · Keine externen Schriftarten oder Skripte</footer></main>
<script type="application/json" id="catalog">'''+safe_json(series_files)+'''</script><script type="application/json" id="all-files">@@ALLFILES@@</script><script>
(()=>{'use strict';
const series=JSON.parse(document.getElementById('catalog').textContent);
function download(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function save(item){const bytes=Uint8Array.from(atob(item.data),c=>c.charCodeAt(0));download(new Blob([bytes],{type:item.mime||'text/html;charset=utf-8'}),item.filename);document.getElementById('download-status').textContent='Download ausgelöst: '+item.filename+'. In Downloads öffnen und tatsächlichen Erfolg prüfen.';}
document.getElementById('save-overview').onclick=()=>{
 const copy=document.documentElement.cloneNode(true);
 copy.querySelector('#overview-save-status').textContent='Die gespeicherte Datei heißt Familienakte-Praxistest-Komplett.html. Im Browser öffnen; bei einer reinen Anhang-Vorschau zunächst auf das Gerät herunterladen.';
 copy.querySelector('#download-status').textContent='Wählt einen Testbogen. Die Originaldatei wird beim Ankreuzen nicht automatisch überschrieben.';
 download(new Blob(['<!doctype html>\\n'+copy.outerHTML],{type:'text/html;charset=utf-8'}),'Familienakte-Praxistest-Komplett.html');
 document.getElementById('overview-save-status').textContent='Download ausgelöst: Familienakte-Praxistest-Komplett.html. Diese eine Datei in Downloads öffnen und anschließend als Anhang weitergeben. Alle zehn Testreihen und Druckvorlagen sind enthalten.';
};
document.querySelectorAll('[data-series]').forEach(b=>b.onclick=()=>save(series.find(s=>s.id===b.dataset.series)));
document.getElementById('all-docs').onclick=()=>save(JSON.parse(document.getElementById('all-files').textContent));})();
</script></body></html>'''
allstream=io.BytesIO()
with zipfile.ZipFile(allstream,'w',zipfile.ZIP_DEFLATED) as z:
    for key in [d['key'] for d in DOCS]+['jpg','stapel','einzeln','formular']:
        a=assets[key];z.writestr(a['filename'],base64.b64decode(a['data']))
allfiles=dict(filename='Alle_Testdokumente.zip',mime='application/zip',data=base64.b64encode(allstream.getvalue()).decode())
(OUT/allfiles['filename']).write_bytes(allstream.getvalue())
overview=overview.replace('@@ALLFILES@@',safe_json(allfiles))
(OUT/'START-Praxistest.html').write_text(overview,encoding='utf-8')
(OUT/'Sollwerte.json').write_text(json.dumps(DOCS,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
generated_names = {a['filename'] for a in assets.values()} | {s['filename'] for s in series_files} | {'START-Praxistest.html', 'Sollwerte.json', 'Alle_Testdokumente.zip'}
# Only the named blank templates belong to the distributable. Never collect
# saved answers or unrelated files that a user placed in the output folder.
(OUT/'SHA256SUMS').write_text(''.join(hashlib.sha256((OUT/name).read_bytes()).hexdigest()+'  '+name+'\n' for name in sorted(generated_names)),encoding='utf-8')
with zipfile.ZipFile(OUT.parent/'Familienakte-Praxistest.zip','w',zipfile.ZIP_DEFLATED) as z:
    for name in sorted(generated_names | {'SHA256SUMS'}):
        z.write(OUT/name,'Praxistest/'+name)
with zipfile.ZipFile(OUT.parent/'Familienakte-Praxistest-Weitergeben.zip','w',zipfile.ZIP_DEFLATED) as z:
    z.writestr('Familienakte-Praxistest-Komplett.html',overview.encode('utf-8'))
print(json.dumps({'output':str(OUT),'series':len(series),'documents':len(DOCS),'zip_bytes':(OUT.parent/'Familienakte-Praxistest.zip').stat().st_size},ensure_ascii=False))
