/** A PDF workspace receives one explicit source and may return only to that document. */
export type PdfQuelle = { sitzung: string; vaultId: string; dokumentId: string; checksum: string; storedPath: string };
export type PdfRueckgabe = { sitzung: string; quelle: string; ergebnis: string };
export function pruefePdfQuelle(q: PdfQuelle) {
  if (!q || !q.sitzung || q.sitzung.length > 160 || !q.vaultId || !q.dokumentId || !/^[a-f0-9]{64}$/.test(q.checksum) || !q.storedPath) throw new Error("Die Herkunft der PDF-Bearbeitung fehlt oder ist beschädigt.");
}
