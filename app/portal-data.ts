// Alle Inhalte in dieser Datei sind frei erfundene Beispieldaten.

export const categories = [
  "Ärztliche Unterlage / Befund",
  "AU / eAU / Krankmeldung",
  "Krankenkasse / Leistungen",
  "Arbeitgeber / Arbeitszeit",
  "Gutachten / Bescheinigungen",
  "Rente / Altersvorsorge",
  "Behörden / Anträge",
  "Gesundheit / eigene Notiz",
  "Familie / Personenakte",
  "Vollmacht / Vorsorge",
  "Haus / Wohnung / Vermieter",
  "Nebenkosten / Reparatur",
  "Fahrzeugpapiere",
  "Fahrzeug / Werkstatt / Wartung",
  "Fahrzeug / TÜV / Gutachten",
  "Versicherung",
  "Kauf / Rechnung",
  "Garantie / Reparatur",
  "Gerät / Technik",
  "Sonstiges",
];

export const portalAreas = [
  { id: "medical", title: "Gesundheit & Vorsorge", text: "Vorsorgetermine, Impfpass, Brillen und Krankmeldungen der Familie an einem Ort.", count: "2021–2026" },
  { id: "benefits", title: "Krankenkasse & Leistungen", text: "Zuschüsse, Bescheide und offene Rückfragen an die Krankenkasse.", count: "2 Vorgänge" },
  { id: "work", title: "Arbeit & Arbeitgeber", text: "Arbeitszeiten, Urlaub, Krankmeldungen und Absprachen mit dem Arbeitgeber.", count: "2025–2026" },
  { id: "assessment", title: "Anträge & Bescheide", text: "Anträge, Bescheide und Schriftverkehr mit Ämtern in einem Bereich.", count: "zusammengeführt" },
];

export const assessmentGroups = [
  {
    title: "Umzug nach Birkenhain",
    description: "Ummeldung, Mietvertrag und Übergabeprotokoll der neuen Wohnung (Beispiel).",
    files: [
      "2025-08-01_Mietvertrag_Lerchenweg_17b.pdf",
      "2025-08-29_Uebergabeprotokoll_Wohnung.pdf",
      "2025-09-03_Ummeldung_Buergerbuero_Birkenhain.pdf",
    ],
  },
  {
    title: "Teilzeitantrag",
    description: "Antrag auf vier Arbeitstage pro Woche und Antwort des Arbeitgebers (Beispiel).",
    files: [
      "2026-03-02_Antrag_Teilzeit.docx",
      "2026-03-09_Eingangsbestaetigung_Arbeitgeber.pdf",
    ],
  },
  {
    title: "Waschmaschine – Garantiefall",
    description: "Kaufbeleg, Fehlerbeschreibung und Reparaturauftrag (Beispiel).",
    files: [
      "2024-11-12_Rechnung_Waschmaschine_Aquamira_W7.pdf",
      "2026-02-18_Garantieanfrage_Pumpe_defekt.pdf",
      "2026-02-25_Reparaturauftrag_Servicefirma_Kleeblatt.pdf",
    ],
  },
];

export const coreDocuments = [
  { date: "14.03.2026", name: "Familienübersicht (Beispiel)", area: "Hauptakte", status: "aktuell" },
  { date: "03.10.2025", name: "Beleg neue Brille", area: "Gesundheit", status: "berücksichtigt" },
  { date: "21.01.2026", name: "Zuschuss Brille – Antwort Krankenkasse", area: "Krankenkasse", status: "berücksichtigt" },
  { date: "02.03.2026", name: "Antrag auf Teilzeit", area: "Arbeit / Arbeitgeber", status: "Antwort offen" },
  { date: "01.08.2025", name: "Mietvertrag Lerchenweg 17b", area: "Wohnen", status: "berücksichtigt" },
  { date: "12.11.2024", name: "Rechnung Waschmaschine", area: "Käufe & Garantien", status: "berücksichtigt" },
];
