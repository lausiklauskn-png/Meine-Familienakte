import type { FamilyRecordType, FamilyRecordUnion, FamilyRelation } from "./family-data-model.ts";

export type RelationEndpoint = { id: string; type: FamilyRecordType };

export function connectedFamilyIds(startId: string, relations: FamilyRelation[], maxDepth = 4) {
  const visited = new Set([startId]);
  let frontier = new Set([startId]);
  for (let depth = 0; depth < maxDepth && frontier.size; depth++) {
    const next = new Set<string>();
    for (const relation of relations) {
      if (frontier.has(relation.fromId) && !visited.has(relation.toId)) next.add(relation.toId);
      if (frontier.has(relation.toId) && !visited.has(relation.fromId)) next.add(relation.fromId);
    }
    next.forEach((id) => visited.add(id));
    frontier = next;
  }
  return visited;
}

export function recordsForCase(caseId: string, records: FamilyRecordUnion[], relations: FamilyRelation[]) {
  const connected = connectedFamilyIds(caseId, relations);
  return records.filter((record) => connected.has(record.id));
}

export function schedulesForCase(caseId: string, records: FamilyRecordUnion[], relations: FamilyRelation[]) {
  return recordsForCase(caseId, records, relations).filter((record) => record.recordType === "task" || record.recordType === "deadline" || record.recordType === "reminder");
}

export function relationExists(relations: FamilyRelation[], relation: Pick<FamilyRelation, "fromType" | "fromId" | "toType" | "toId" | "relationType">) {
  return relations.some((item) => item.fromType === relation.fromType && item.fromId === relation.fromId && item.toType === relation.toType && item.toId === relation.toId && item.relationType === relation.relationType);
}
