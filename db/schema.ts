import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    originalName: text("original_name").notNull(),
    category: text("category").notNull(),
    documentDate: text("document_date"),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    r2Key: text("r2_key").notNull(),
    sha256: text("sha256").notNull(),
    status: text("status").notNull().default("hochgeladen"),
    source: text("source"),
    notes: text("notes"),
    storageType: text("storage_type"),
    oneDrivePath: text("onedrive_path"),
    relativePath: text("relative_path"),
    uploadedAt: integer("uploaded_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    integratedAt: integer("integrated_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("documents_owner_uploaded_idx").on(table.ownerId, table.uploadedAt),
    index("documents_owner_status_idx").on(table.ownerId, table.status),
    index("documents_owner_hash_idx").on(table.ownerId, table.sha256),
  ],
);

export const familyRecords = sqliteTable(
  "family_records",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    recordType: text("record_type").notNull(),
    status: text("status").notNull().default("aktiv"),
    source: text("source"),
    notes: text("notes"),
    dataJson: text("data_json").notNull().default("{}"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("family_records_owner_type_idx").on(table.ownerId, table.recordType),
    index("family_records_owner_status_idx").on(table.ownerId, table.status),
  ],
);

export const familyRelations = sqliteTable(
  "family_relations",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    fromType: text("from_type").notNull(),
    fromId: text("from_id").notNull(),
    toType: text("to_type").notNull(),
    toId: text("to_id").notNull(),
    relationType: text("relation_type").notNull(),
    source: text("source"),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("family_relations_owner_from_idx").on(table.ownerId, table.fromType, table.fromId),
    index("family_relations_owner_to_idx").on(table.ownerId, table.toType, table.toId),
  ],
);

export const familySequences = sqliteTable(
  "family_sequences",
  {
    ownerId: text("owner_id").notNull(),
    recordType: text("record_type").notNull(),
    lastNumber: integer("last_number").notNull().default(0),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.ownerId, table.recordType] })],
);
