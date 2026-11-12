# Prüfplan vor Training und Auswertung

Ersteller: Codex (GPT-6). UTC: 2026-11-12 22:33:08 UTC.
Quelle des Auftrags: lausiklauskn-png/Meine-Familienakte, Commit bf547be4a3633a0e217c080839fbf0f3712f81f5, docs/fremdpruefung/auftraege/002-gegenlauf/AUFTRAG.md.
Repo-Lesegrenze: ausschließlich docs/fremdpruefung/, keine anderen Repos, keine externe Recherche.

Drei voneinander getrennte Agenten erzeugen je 114 Lehrbelege (3 je Konto, 38 Konten): Fahrradwerkstatt, Büroservice/Schreibwaren/Gestaltung, Feinkostküche/Catering. Ein vierter Agent erstellt unabhängig 120 Prüfbelege einer Töpferei. Er erhält weder Lehrdaten noch Systembeschreibung. Ein zusätzlicher Agent erstellt ausschließlich eine Firmen-Namensmaske für Claudes Stapel 4, ohne Konten zuzuordnen.

Das Modell ist vor Empfang der Lehrdaten festgelegt: TF-IDF-Zentroid, Wort-Unigramme und -Bigramme, Zeichen-3- bis -5-Gramme in Wörtern. Zeichenhäufigkeiten werden vor der Quadratwurzel mit 0,35 gewichtet. IDF = ln(1 + N/df), Dokumentvektoren L2-normalisiert. Höchstens 6000 Merkmale mit df >= 2; pro Konto die 160 stärksten Zentroidmerkmale, neu normalisiert und auf ganze Werte bis 32767 quantisiert. Höchste Kosinusähnlichkeit gewinnt; deterministische Kontoreihenfolge bei Gleichstand. Keine sprachmodellbasierte Inferenz, keine manuell aus Testbelegen abgeleiteten Buchungsregeln. Der Merkmalsumfang wurde vor Training zur Einhaltung des Mobilbudgets festgelegt. Ziel: höchstens 350 kB je Modell.

Zwei getrennte Modelle mit identischen Einstellungen: Firmen im Text vorhanden bzw. über bereitgestellte wörtliche Namenslisten entfernt. Das ist eine kontrollierte Ablation mit annotierten Firmen, keine automatische produktive Namenserkennung. Personen bleiben erhalten. E-Mail-Adressen/URLs werden in beiden Varianten entfernt; vollständige Entfernung aller impliziten Branchenhinweise ist nicht garantiert.

Die Hauptinstanz hat Stapel 4 bereits in Auftrag 003 manuell beurteilt. Diese frühere Kenntnis lässt sich nicht rückgängig machen. Seine Texte und Labels werden nicht zum Trainieren, zur Merkmalswahl oder zum Nachjustieren eingesetzt. Sämtliche gelernten Vokabeln, IDF-Werte und Konto-Zentroide stammen ausschließlich aus den neuen Lehrdaten. Die unabhängigen Agenten erhalten keinen Gesprächsverlauf.

Nach Training werden Code, Plan, Lehrdaten und Modelle per SHA-256 eingefroren. Der Vorhersageschritt öffnet keine ERWARTUNG.json. Erst danach wird das Soll für die Auswertung gelesen. Keine Anpassung an Testfehler und keine Auswahl des schöneren Namensmodus. Alle vier Vorhersagedateien werden veröffentlicht.

Drei Gewerbewechsel innerhalb der Lehrdaten werden zusätzlich mit denselben festen Parametern beschrieben, ohne Parameteroptimierung. Hauptmessung: Top-1-Trefferzahl und -quote auf 120 neuen Belegen, Makro-Recall über vertretene Konten, Verwechslungen, nach Merkmalen getrennte Fehler. Wilson-95%-Intervalle werden als bedingte rechnerische Unsicherheit ausgewiesen; gemeinsame Erzeugung, ein Betrieb und synthetische Soll-Labels verletzen eine einfache Übertragbarkeit auf echte Dokumente.

Claudes Mehrheits-Soll für Stapel 4 und Claudes System bleiben ungelesen. Deren Kreuztestergebnisse heißen bis zum Rücklauf „nicht gemessen“. Kein optionaler Sprachmodell-Obergrenzenlauf. Keine Aussage über besseres oder schlechteres Training ohne denselben unabhängigen Vergleich.
