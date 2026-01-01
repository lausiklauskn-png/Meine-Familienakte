import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import { jsonError, requireHealthUser } from "@/lib/health-auth";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["hochgeladen", "abgleich_offen", "geprüft", "eingearbeitet"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireHealthUser(request);
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };
    const status = String(body.status || "");
    if (!ALLOWED.has(status)) {
      return Response.json({ error: "Unbekannter Bearbeitungsstand." }, { status: 400 });
    }
    const now = new Date();
    const rows = await getDb()
      .update(documents)
      .set({
        status,
        updatedAt: now,
        reviewedAt: status === "geprüft" || status === "eingearbeitet" ? now : null,
        integratedAt: status === "eingearbeitet" ? now : null,
      })
      .where(and(eq(documents.id, id), eq(documents.ownerId, user.id)))
      .returning({ id: documents.id, status: documents.status });
    if (!rows[0]) return new Response("Nicht gefunden", { status: 404 });
    return Response.json(rows[0]);
  } catch (error) {
    return jsonError(error);
  }
}
