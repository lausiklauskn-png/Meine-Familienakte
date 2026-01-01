import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents, familyRecords, familyRelations } from "@/db/schema";
import { jsonError, requireHealthUser } from "@/lib/health-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = requireHealthUser(request);
    const database = getDb();
    const [documentRows, recordRows, relationRows] = await Promise.all([
      database.select({ id: documents.id, sha256: documents.sha256 }).from(documents).where(eq(documents.ownerId, user.id)),
      database.select({ recordType: familyRecords.recordType }).from(familyRecords).where(eq(familyRecords.ownerId, user.id)),
      database.select({ fromType: familyRelations.fromType, toType: familyRelations.toType }).from(familyRelations).where(eq(familyRelations.ownerId, user.id)),
    ]);

    const hashes = new Map<string, number>();
    documentRows.forEach((item) => hashes.set(item.sha256, (hashes.get(item.sha256) || 0) + 1));

    return Response.json({
      documentCount: documentRows.length,
      duplicateDocumentHashes: [...hashes.values()].filter((count) => count > 1).length,
      familyRecordCount: recordRows.length,
      familyRecordTypes: [...new Set(recordRows.map((item) => item.recordType))].sort(),
      relationCount: relationRows.length,
      relationPairs: [...new Set(relationRows.map((item) => `${item.fromType}->${item.toType}`))].sort(),
    });
  } catch (error) {
    return jsonError(error);
  }
}

