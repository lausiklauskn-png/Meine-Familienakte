// Ersatz für die früheren Server-Schnittstellen /api/documents und /api/system-check.
// Die App arbeitet vollständig im Browser: Es gibt keinen Online-Speicher mehr.
// Unterlagen liegen im Datentresor (Browser-Speicher oder selbst gewählter Ordner).

export type BrowserUpload = {
  id: string; originalName: string; category: string; documentDate: string | null;
  mimeType: string; sizeBytes: number;
  status: "hochgeladen" | "abgleich_offen" | "geprüft" | "eingearbeitet";
  notes: string | null; uploadedAt: string; downloadUrl: string;
};

export async function listBrowserUploads(): Promise<BrowserUpload[]> {
  return [];
}

export async function setBrowserUploadStatus(id: string, status: BrowserUpload["status"]): Promise<void> {
  void id; void status;
  throw new Error("Unterlagen werden im Datentresor bearbeitet. Ein Online-Speicher wird nicht verwendet.");
}

export async function browserUploadSummary() {
  return {
    documentCount: 0,
    duplicateDocumentHashes: 0,
    familyRecordCount: 0,
    familyRecordTypes: [] as string[],
    relationCount: 0,
    relationPairs: [] as string[],
  };
}
