// Gemeinsame Ein-/Ausgaben der Portalbereiche; keine Laufzeitabhängigkeit vom Portal.
export type UploadedDocument = {
  id: string; originalName: string; category: string; documentDate: string | null;
  mimeType: string; sizeBytes: number;
  status: "hochgeladen" | "abgleich_offen" | "geprüft" | "eingearbeitet";
  notes: string | null; uploadedAt: string; downloadUrl: string;
};

export type SectionId = "overview" | "netz" | "workflowpdf" | "stapel" | "documents" | "inventory" | "inbox" | "medical" | "benefits" | "work" |
  "assessment" | "correspondence" | "assistant" | "sources" | "health" | "family" |
  "home" | "vehicles" | "purchases" | "reminders" | "memory" | "cockpit" | "directory" | "security" | "help" | "changelog" | "versions" | "systemcheck";
