import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import { requireHealthUser } from "@/lib/health-auth";

export const dynamic = "force-dynamic";

const tools = [
  {
    name: "list_health_documents",
    description:
      "Listet die vom Eigentümer neu hochgeladenen Gesundheitsunterlagen mit Kategorie, Datum und Bearbeitungsstand auf.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["hochgeladen", "abgleich_offen", "geprüft", "eingearbeitet"],
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_health_document_metadata",
    description:
      "Gibt die gespeicherten Metadaten einer hochgeladenen Gesundheitsunterlage zurück. Es werden keine Diagnosen abgeleitet.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
];

function result(id: unknown, value: unknown) {
  return Response.json({ jsonrpc: "2.0", id, result: value });
}

function failure(id: unknown, code: number, message: string) {
  return Response.json({ jsonrpc: "2.0", id, error: { code, message } });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    jsonrpc?: string;
    id?: unknown;
    method?: string;
    params?: { name?: string; arguments?: Record<string, unknown> };
  };
  if (payload.method === "initialize") {
    return result(payload.id, {
      protocolVersion: "2025-03-26",
      capabilities: { tools: {} },
      serverInfo: { name: "Gesundheits- und Leistungsakte", version: "1.0.0" },
    });
  }
  if (payload.method === "notifications/initialized") {
    return new Response(null, { status: 202 });
  }
  if (payload.method === "tools/list") return result(payload.id, { tools });
  if (payload.method !== "tools/call") return failure(payload.id, -32601, "Methode nicht gefunden");

  let user;
  try {
    user = requireHealthUser(request);
  } catch {
    return new Response("Anmeldung erforderlich", { status: 401 });
  }
  const name = payload.params?.name;
  const args = payload.params?.arguments || {};
  if (name === "list_health_documents") {
    const rows = await getDb()
      .select({
        id: documents.id,
        name: documents.originalName,
        category: documents.category,
        documentDate: documents.documentDate,
        status: documents.status,
        uploadedAt: documents.uploadedAt,
        notes: documents.notes,
      })
      .from(documents)
      .where(eq(documents.ownerId, user.id))
      .orderBy(desc(documents.uploadedAt));
    const filtered = args.status ? rows.filter((row) => row.status === args.status) : rows;
    return result(payload.id, {
      content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }],
      structuredContent: { documents: filtered },
    });
  }
  if (name === "get_health_document_metadata" && typeof args.id === "string") {
    const rows = await getDb()
      .select({
        id: documents.id,
        name: documents.originalName,
        category: documents.category,
        documentDate: documents.documentDate,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        status: documents.status,
        uploadedAt: documents.uploadedAt,
        notes: documents.notes,
      })
      .from(documents)
      .where(and(eq(documents.id, args.id), eq(documents.ownerId, user.id)))
      .limit(1);
    const row = rows[0];
    if (!row) return failure(payload.id, -32004, "Unterlage nicht gefunden");
    return result(payload.id, {
      content: [{ type: "text", text: JSON.stringify(row, null, 2) }],
      structuredContent: row,
    });
  }
  return failure(payload.id, -32602, "Unbekanntes Werkzeug oder ungültige Eingabe");
}
