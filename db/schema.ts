import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const checkinOwners = sqliteTable(
  "checkin_owners",
  {
    ownerKey: text("owner_key").primaryKey(),
    ledgerState: text("ledger_state").notNull(),
    legacyAuditFingerprint: text("legacy_audit_fingerprint"),
    legacyObservedCount: integer("legacy_observed_count"),
    legacyImportedCount: integer("legacy_imported_count"),
    auditCompletedAt: text("audit_completed_at"),
    activatedAt: text("activated_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check(
      "checkin_owners_ledger_state_check",
      sql`${table.ledgerState} IN ('awaiting_audit', 'importing', 'ready', 'blocked')`,
    ),
    check(
      "checkin_owners_audit_fingerprint_check",
      sql`${table.legacyAuditFingerprint} IS NULL OR length(${table.legacyAuditFingerprint}) = 64`,
    ),
    check(
      "checkin_owners_observed_count_check",
      sql`${table.legacyObservedCount} IS NULL OR ${table.legacyObservedCount} >= 0`,
    ),
    check(
      "checkin_owners_imported_count_check",
      sql`${table.legacyImportedCount} IS NULL OR ${table.legacyImportedCount} >= 0`,
    ),
  ],
);

export const checkinLedger = sqliteTable(
  "checkin_ledger",
  {
    ledgerId: text("ledger_id").primaryKey(),
    ownerKey: text("owner_key")
      .notNull()
      .references(() => checkinOwners.ownerKey, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    checkinDate: text("checkin_date").notNull(),
    payloadVersion: integer("payload_version").notNull().default(1),
    payloadFingerprint: text("payload_fingerprint").notNull(),
    payloadJson: text("payload_json").notNull(),
    dayType: text("day_type").notNull(),
    mood: text("mood").notNull(),
    energy: integer("energy").notNull(),
    sleepStatus: text("sleep_status").notNull(),
    trainingStatus: text("training_status").notNull(),
    studyStatus: text("study_status").notNull(),
    audiobookMinutes: integer("audiobook_minutes").notNull(),
    dogMinutes: integer("dog_minutes").notNull(),
    musicMinutes: integer("music_minutes").notNull(),
    win: text("win").notNull(),
    difficulty: text("difficulty").notNull(),
    nextStep: text("next_step").notNull(),
    summary: text("summary").notNull(),
    xpDay: integer("xp_day").notNull(),
    origin: text("origin").notNull(),
    legacyNotionPageId: text("legacy_notion_page_id"),
    importBatchId: text("import_batch_id"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("uq_checkin_ledger_owner_date").on(table.ownerKey, table.checkinDate),
    uniqueIndex("uq_checkin_ledger_legacy_notion_page_id")
      .on(table.legacyNotionPageId)
      .where(sql`${table.legacyNotionPageId} IS NOT NULL`),
    check(
      "checkin_ledger_date_check",
      sql`length(${table.checkinDate}) = 10 AND ${table.checkinDate} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`,
    ),
    check("checkin_ledger_payload_version_check", sql`${table.payloadVersion} >= 1`),
    check(
      "checkin_ledger_payload_fingerprint_check",
      sql`length(${table.payloadFingerprint}) = 64`,
    ),
    check("checkin_ledger_payload_json_check", sql`json_valid(${table.payloadJson})`),
    check(
      "checkin_ledger_day_type_check",
      sql`${table.dayType} IN ('Trabalho', 'Folga', 'Férias')`,
    ),
    check(
      "checkin_ledger_mood_check",
      sql`${table.mood} IN ('Ótimo', 'Bom', 'Neutro', 'Ruim', 'Muito ruim')`,
    ),
    check("checkin_ledger_energy_check", sql`${table.energy} BETWEEN 1 AND 10`),
    check(
      "checkin_ledger_sleep_status_check",
      sql`${table.sleepStatus} IN ('Completo', 'Mínimo', 'Não feito', 'Não planejado')`,
    ),
    check(
      "checkin_ledger_training_status_check",
      sql`${table.trainingStatus} IN ('Completo', 'Mínimo', 'Não feito', 'Não planejado')`,
    ),
    check(
      "checkin_ledger_study_status_check",
      sql`${table.studyStatus} IN ('Completo', 'Mínimo', 'Não feito', 'Não planejado')`,
    ),
    check(
      "checkin_ledger_audiobook_minutes_check",
      sql`${table.audiobookMinutes} BETWEEN 0 AND 600`,
    ),
    check(
      "checkin_ledger_dog_minutes_check",
      sql`${table.dogMinutes} BETWEEN 0 AND 300`,
    ),
    check(
      "checkin_ledger_music_minutes_check",
      sql`${table.musicMinutes} BETWEEN 0 AND 600`,
    ),
    check("checkin_ledger_xp_day_check", sql`${table.xpDay} >= 0`),
    check(
      "checkin_ledger_origin_check",
      sql`${table.origin} IN ('live', 'legacy_import')`,
    ),
    check(
      "checkin_ledger_provenance_check",
      sql`(
        ${table.origin} = 'live'
        AND ${table.legacyNotionPageId} IS NULL
        AND ${table.importBatchId} IS NULL
      ) OR (
        ${table.origin} = 'legacy_import'
        AND ${table.legacyNotionPageId} IS NOT NULL
        AND ${table.importBatchId} IS NOT NULL
      )`,
    ),
  ],
);
