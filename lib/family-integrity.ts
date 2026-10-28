import { isFamilyRecordId, recordTypeDefinitions, type FamilyIdSequences, type FamilyRecordType, type FamilyRecordUnion, type FamilyRelation } from "./family-data-model.ts";

export type IntegrityDocument = {
  id: string;
  storedPath?: string | null;
  storageLocations?: Array<{ id: string; path: string; checksum?: string | null }>;
};

export type FamilyIntegrityIssue = {
  level: "yellow" | "red";
  code: string;
  message: string;
};

const duplicates = (values: string[]) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

export function inspectFamilyIntegrity(input: {
  documents: IntegrityDocument[];
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  sequences: FamilyIdSequences;
}) {
  const issues: FamilyIntegrityIssue[] = [];
  for (const id of duplicates([...input.documents.map((item) => item.id), ...input.records.map((item) => item.id)])) {
    issues.push({ level: "red", code: "duplicate-record-id", message: `Datensatz-ID mehrfach vorhanden: ${id}` });
  }
  for (const id of duplicates(input.relations.map((item) => item.id))) issues.push({ level: "red", code: "duplicate-relation-id", message: `Relations-ID mehrfach vorhanden: ${id}` });

  const endpoints = new Map<string, FamilyRecordType>();
  input.documents.forEach((item) => endpoints.set(item.id, "document"));
  input.records.forEach((item) => endpoints.set(item.id, item.recordType));
  for (const relation of input.relations) {
    if (!endpoints.has(relation.fromId) || !endpoints.has(relation.toId)) issues.push({ level: "red", code: "dangling-relation", message: `Verwaiste Relation: ${relation.id}` });
    if (endpoints.get(relation.fromId) && endpoints.get(relation.fromId) !== relation.fromType) issues.push({ level: "red", code: "invalid-relation-type", message: `Ungültiger Ausgangstyp: ${relation.id}` });
    if (endpoints.get(relation.toId) && endpoints.get(relation.toId) !== relation.toType) issues.push({ level: "red", code: "invalid-relation-type", message: `Ungültiger Zieltyp: ${relation.id}` });
  }

  for (const record of input.records) {
    if (!isFamilyRecordId(record.id, record.recordType)) issues.push({ level: "yellow", code: "invalid-record-id", message: `Ungewöhnliche Kennung: ${record.id}` });
    const prefix = recordTypeDefinitions[record.recordType].prefix;
    const sequence = Number(record.id.replace(`${prefix}-`, ""));
    if (Number.isFinite(sequence) && (input.sequences[record.recordType] || 0) < sequence) issues.push({ level: "red", code: "sequence-behind", message: `Sequenz für ${record.recordType} liegt hinter ${record.id}.` });
    if (record.recordType === "event") {
      const media = Array.isArray(record.data.media) ? record.data.media as Array<{ storedPath?: string }> : [];
      if (media.some((item) => !item.storedPath)) issues.push({ level: "red", code: "missing-memory-media", message: `Memory-Medium ohne Speicherreferenz: ${record.id}` });
    }
  }

  for (const document of input.documents) {
    if (!document.storedPath && !document.storageLocations?.some((location) => location.path)) issues.push({ level: "red", code: "missing-document-reference", message: `Dokument ohne Speicherreferenz: ${document.id}` });
    const locations = document.storageLocations || [];
    if (duplicates(locations.map((location) => location.id)).length || duplicates(locations.map((location) => location.path)).length) issues.push({ level: "yellow", code: "duplicate-storage-location", message: `Doppelter Speicherort bei ${document.id}` });
  }

  return {
    issues,
    overall: issues.some((issue) => issue.level === "red") ? "red" as const : issues.length ? "yellow" as const : "green" as const,
  };
}
