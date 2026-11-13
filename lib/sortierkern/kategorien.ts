/**
 * Lebensbereiche – dieselbe Liste wie in der Familienakte (`lib/family-categories.ts`, Stand 2.28.65), damit ein
 * vorsortierter Ordner dort ohne Umbenennen ankommt. Ändert sich die Liste dort, wird sie hier nachgezogen
 * (Probe `kategorien gleich der Familienakte` in scripts/run-kern-tests.mjs vergleicht, wenn die Familienakte daneben liegt).
 */
export const KATEGORIEN = [
  "Familie & persönliche Dokumente",
  "Finanzen & Konten",
  "Versicherungen",
  "Steuern & Behörden",
  "Haus & Wohnung",
  "Energie & Versorgung",
  "Garten & Grundstück",
  "Einkäufe, Rechnungen & Garantien",
  "Gesundheit & Pflege",
  "Rente, Arbeit & Sozialversicherung",
  "Auto & Mobilität",
  "Motorrad",
  "Technik, Geräte & Reparaturen",
  "Verträge & Abonnements",
  "Erbschaft, Vollmachten & Vorsorge",
  "Reisen & Freizeit",
  "Korrespondenz",
  "Archiv",
] as const;

/** Eigene Gruppe für Fotos ohne lesbaren Text (keine Kategorie der Familienakte; dort entscheidet die Zuordnung). */
export const FOTOS = "Fotos";
export const UNKLAR = "Unklar";

/** Schlüsselwörter je Lebensbereich. Treffer im Absender zählen doppelt. */
export const KATEGORIE_WOERTER: Record<string, string[]> = {
  "Familie & persönliche Dokumente": ["schule", "grundschule", "gymnasium", "kita", "kindergarten", "hort", "elternabend", "liebe eltern", "schüler", "klassenfahrt", "zeugnis", "geburtsurkunde", "eheurkunde", "standesamt",
    "personalausweis", "reisepass", "meldebescheinigung", "kundenzentrum", "jugendamt", "unterhaltsvorschuss", "kindergeld", "familienkasse", "elterngeld", "familiengericht", "umgangsrecht",
    "bafög", "ausbildungsförderung", "studierendenwerk", "semesterbeitrag", "matrikelnummer", "essensgeld"],
  "Finanzen & Konten": ["kontoauszug", "bank ", "bankkonto", "sparkasse", "volksbank", "direktbank", "kreditkarte", "depot", "broker", "girokonto", "darlehen", "kredit", "saldo", "inkasso", "forderung", "auskunftei", "score", "bausparvertrag", "bausparkasse"],
  "Versicherungen": ["versicherung", "police", "versicherungsschein", "versicherungsnummer", "schadenmeldung", "schadennummer", "haftpflicht", "hausrat", "deckungszusage", "rechtsschutz", "lebensversicherung", "rückkaufswert", "unfallversicherung", "berufsgenossenschaft"],
  "Steuern & Behörden": ["finanzamt", "steueramt", "steuernummer", "steuerbescheid", "einkommensteuer", "umsatzsteuer", "gewerbesteuer", "hundesteuer", "grundsteuer", "steuerberatung", "steuererklärung",
    "bürgeramt", "bezirksamt", "landratsamt", "stadtverwaltung", "behörde", "rundfunkbeitrag", "beitragsservice", "zuwendungsbestätigung", "spende"],
  "Haus & Wohnung": ["miete", "vermieter", "nebenkosten", "betriebskosten", "hausverwaltung", "wohnung", "wohnungsbaugenossenschaft", "mietvertrag", "wg-zimmer", "eigentümerversammlung", "wohngeld",
    "müllgebühren", "stadtreinigung", "abfall", "baumarkt", "wandfarbe", "blumenerde"],
  "Energie & Versorgung": ["stadtwerke", "strom", "gas ", "erdgas", "wasser", "wasserwerke", "abwasser", "fernwärme", "abschlag", "zählerstand", "zählernummer", "jahresverbrauch", "energie", "netzbetreiber"],
  "Garten & Grundstück": ["garten", "kleingarten", "parzelle", "pacht", "grundstück", "baum", "zaun"],
  "Einkäufe, Rechnungen & Garantien": ["möbel", "angebot der woche", "rabatt", "kassenbon", "bon-nr", "kartenzahlung", "garantie", "bestellung", "bestellnummer", "versandt", "lieferschein", "quittung", "kaufbeleg", "onlineshop", "artikel", "markt", "einkauf"],
  "Gesundheit & Pflege": ["praxis", "arzt", "ärztin", "dr. med", "klinik", "krankenhaus", "labor", "befund", "arztbrief", "krankenkasse", "rezept", "pflege", "pflegegrad", "zahnarzt", "zahnersatz", "heil- und kostenplan",
    "therapie", "psychotherap", "physiotherap", "krankengymnastik", "diagnose", "patient", "arbeitsunfähig", "krankengeld", "reha", "rehabilitation", "kur", "schwerbehindert", "grad der behinderung", "versorgungsamt",
    "brille", "optik", "hörgerät", "apotheke", "zuzahlung", "beihilfe", "kieferorthopäd", "impfung", "u-untersuchung", "entlassungsbericht", "goä", "krankenversicherung", "krankheitskosten"],
  "Rente, Arbeit & Sozialversicherung": ["rentenversicherung", "renteninformation", "rente", "rentenanpassung", "entgelt", "entgeltabrechnung", "netto", "gehalt", "lohnabrechnung", "arbeitgeber", "personalnummer", "arbeitsvertrag",
    "teilzeit", "arbeitszeit", "wochenstunden", "jobcenter", "agentur für arbeit", "bürgergeld", "kooperationsplan", "weiterbildung", "kontenklärung", "versicherungsverlauf", "bezügemitteilung", "besoldung",
    "dienstreise", "reisekosten", "handwerkskammer", "kammerbeitrag", "gewerkschaft", "verlagsvertrag", "auflage"],
  "Auto & Mobilität": ["autohaus", "kfz", "fahrzeug", "kennzeichen", "tüv", "hauptuntersuchung", "werkstatt", "inspektion", "zulassung", "fahrzeugschein", "kfz-steuer", "tankstelle", "säule", "super e10", "super e5", "diesel", "eur/l",
    "probefahrt", "erstzulassung", "kilometerstand", "landesbetrieb verkehr"],
  "Motorrad": ["motorrad", "kraftrad", "saisonkennzeichen", "zweirad"],
  "Technik, Geräte & Reparaturen": ["reparatur", "reparaturservice", "gerät", "seriennummer", "displaytausch", "kundendienst"],
  "Verträge & Abonnements": ["vertrag", "abonnement", "abo", "mitgliedschaft", "mitgliedsnummer", "kündigung", "mobilfunk", "tarif", "glasfaser", "internet", "fitness", "streaming"],
  "Erbschaft, Vollmachten & Vorsorge": ["vollmacht", "vorsorgevollmacht", "bevollmächtige", "testament", "erbschein", "nachlass", "patientenverfügung", "notar", "notariat", "urkundenrolle"],
  "Reisen & Freizeit": ["reise", "pauschalreise", "ferienhaus", "buchung", "fahrkarte", "flug", "hotel", "urlaub", "ticket", "eintrittskarte", "eintritt", "verein", "turnverein", "tagung", "hafenfest", "tierarzt"],
  "Korrespondenz": [],
  "Archiv": [],
};
