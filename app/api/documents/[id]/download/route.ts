import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import { jsonError, requireHealthUser } from "@/lib/health-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireHealthUser(request);
    const { id } = await context.params;
    const rows = await getDb()
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.ownerId, user.id)))
      .limit(1);
    const document = rows[0];
    if (!document) return new Response("Nicht gefunden", { status: 404 });
    const object = await env.BUCKET.get(document.r2Key);
    if (!object) return new Response("Datei nicht gefunden", { status: 404 });
    const safeName = document.originalName.replace(/[\r\n"\\]/g, "_");
    return new Response(object.body, {
      headers: {
        "content-type": document.mimeType,
        "content-length": String(document.sizeBytes),
        "content-disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
