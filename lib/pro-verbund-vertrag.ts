/** Reine Datentypen der freiwilligen Pro-Übergabe; Metadaten sind keine Arbeitsanweisungen. */
export type ProApp = "familienakte" | "workflow-pdf-pro" | "private-brain" | "bookledgerpro";
export type ProUebergabe = {
  vertrag: "familienakte-uebergabe/1"; id: string; quelle: ProApp; ziel: ProApp;
  dokumentId: string; name: string; mime: string; groesse: number; sha256: string;
  bezug?: string;
};
export type ProQuittung = { id: string; quelle: ProApp; ziel: ProApp; sha256: string; groesse: number; eingangId: string; stand: "im-eingang" };
