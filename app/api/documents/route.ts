import { env } from "cloudflare:workers";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import { jsonError, requireHealthUser } from "@/lib/health-auth";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
]);

function serialize(document: typeof documents.$inferSelect) {
  return {
    id: document.id,
    originalName: document.originalName,
    category: document.category,
    documentDate: document.documentDate,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    status: document.status,
    notes: document.notes,
    uploadedAt: document.uploadedAt.toISOString(),
    reviewedAt: document.reviewedAt?.toISOString() ?? null,
    integratedAt: document.integratedAt?.toISOString() ?? null,
    downloadUrl: `/api/documents/${document.id}/download`,
  };
}

export async function GET(request: Request) {
  try {
    const user = requireHealthUser(request);
    const rows = await getDb()
      .select()
      .from(documents)
      .where(eq(documents.ownerId, user.id))
      .orderBy(desc(documents.uploadedAt));
    return Response.json({ documents: rows.map(serialize) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  let r2Key: string | null = null;
  try {
    const user = requireHealthUser(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Bitte eine Datei auswählen." }, { status: 400 });
    }
    if (!file.size || file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "Die Datei darf höchstens 20 MB groß sein." },
        { status: 400 },
      );
    }
    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_TYPES.has(mimeType)) {
      return Response.json(
        { error: "Erlaubt sind PDF, DOCX, XLSX, JPG, PNG, WEBP und TXT." },
        { status: 400 },
      );
    }

    const category = String(form.get("category") || "Sonstiges").slice(0, 100);
    const documentDate = String(form.get("documentDate") || "").slice(0, 10) || null;
    const notes = String(form.get("notes") || "").trim().slice(0, 2000) || null;
    const bytes = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = Array.from(new Uint8Array(digest), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");

    const duplicate = await getDb()
      .select({ id: documents.id, originalName: documents.originalName })
      .from(documents)
      .where(and(eq(documents.ownerId, user.id), eq(documents.sha256, sha256)))
      .limit(1);
    if (duplicate[0]) {
      return Response.json(
        {
          error: `Diese Datei ist bereits als „${duplicate[0].originalName}“ gespeichert.`,
          duplicateId: duplicate[0].id,
        },
        { status: 409 },
      );
    }

    const id = crypto.randomUUID();
    r2Key = `${user.id}/${id}`;
    await env.BUCKET.put(r2Key, bytes, {
      httpMetadata: { contentType: mimeType },
      customMetadata: { ownerId: user.id, documentId: id },
    });
    const now = new Date();
    const row: typeof documents.$inferInsert = {
      id,
      ownerId: user.id,
      originalName: file.name.slice(0, 255),
      category,
      documentDate,
      mimeType,
      sizeBytes: file.size,
      r2Key,
      sha256,
      status: "hochgeladen",
      source: "Familienakte-Upload",
      notes,
      storageType: "online-r2",
      uploadedAt: now,
      updatedAt: now,
    };
    await getDb().insert(documents).values(row);
    return Response.json({ document: serialize({
      ...row,
      documentDate: row.documentDate ?? null,
      status: row.status ?? "hochgeladen",
      source: row.source ?? null,
      notes: row.notes ?? null,
      storageType: row.storageType ?? null,
      oneDrivePath: row.oneDrivePath ?? null,
      relativePath: row.relativePath ?? null,
      uploadedAt: row.uploadedAt ?? now,
      updatedAt: row.updatedAt ?? now,
      reviewedAt: null,
      integratedAt: null,
    }) }, { status: 201 });
  } catch (error) {
    if (r2Key) await env.BUCKET.delete(r2Key).catch(() => undefined);
    return jsonError(error);
  }
}
