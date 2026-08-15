CREATE TABLE `checkin_ledger` (
	`ledger_id` text PRIMARY KEY NOT NULL,
	`owner_key` text NOT NULL,
	`checkin_date` text NOT NULL,
	`payload_version` integer DEFAULT 1 NOT NULL,
	`payload_fingerprint` text NOT NULL,
	`payload_json` text NOT NULL,
	`day_type` text NOT NULL,
	`mood` text NOT NULL,
	`energy` integer NOT NULL,
	`sleep_status` text NOT NULL,
	`training_status` text NOT NULL,
	`study_status` text NOT NULL,
	`audiobook_minutes` integer NOT NULL,
	`dog_minutes` integer NOT NULL,
	`music_minutes` integer NOT NULL,
	`win` text NOT NULL,
	`difficulty` text NOT NULL,
	`next_step` text NOT NULL,
	`summary` text NOT NULL,
	`xp_day` integer NOT NULL,
	`origin` text NOT NULL,
	`legacy_notion_page_id` text,
	`import_batch_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_key`) REFERENCES `checkin_owners`(`owner_key`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "checkin_ledger_date_check" CHECK(length("checkin_ledger"."checkin_date") = 10 AND "checkin_ledger"."checkin_date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	CONSTRAINT "checkin_ledger_payload_version_check" CHECK("checkin_ledger"."payload_version" >= 1),
	CONSTRAINT "checkin_ledger_payload_fingerprint_check" CHECK(length("checkin_ledger"."payload_fingerprint") = 64),
	CONSTRAINT "checkin_ledger_payload_json_check" CHECK(json_valid("checkin_ledger"."payload_json")),
	CONSTRAINT "checkin_ledger_day_type_check" CHECK("checkin_ledger"."day_type" IN ('Trabalho', 'Folga', 'Férias')),
	CONSTRAINT "checkin_ledger_mood_check" CHECK("checkin_ledger"."mood" IN ('Ótimo', 'Bom', 'Neutro', 'Ruim', 'Muito ruim')),
	CONSTRAINT "checkin_ledger_energy_check" CHECK("checkin_ledger"."energy" BETWEEN 1 AND 10),
	CONSTRAINT "checkin_ledger_sleep_status_check" CHECK("checkin_ledger"."sleep_status" IN ('Completo', 'Mínimo', 'Não feito', 'Não planejado')),
	CONSTRAINT "checkin_ledger_training_status_check" CHECK("checkin_ledger"."training_status" IN ('Completo', 'Mínimo', 'Não feito', 'Não planejado')),
	CONSTRAINT "checkin_ledger_study_status_check" CHECK("checkin_ledger"."study_status" IN ('Completo', 'Mínimo', 'Não feito', 'Não planejado')),
	CONSTRAINT "checkin_ledger_audiobook_minutes_check" CHECK("checkin_ledger"."audiobook_minutes" BETWEEN 0 AND 600),
	CONSTRAINT "checkin_ledger_dog_minutes_check" CHECK("checkin_ledger"."dog_minutes" BETWEEN 0 AND 300),
	CONSTRAINT "checkin_ledger_music_minutes_check" CHECK("checkin_ledger"."music_minutes" BETWEEN 0 AND 600),
	CONSTRAINT "checkin_ledger_xp_day_check" CHECK("checkin_ledger"."xp_day" >= 0),
	CONSTRAINT "checkin_ledger_origin_check" CHECK("checkin_ledger"."origin" IN ('live', 'legacy_import')),
	CONSTRAINT "checkin_ledger_provenance_check" CHECK((
        "checkin_ledger"."origin" = 'live'
        AND "checkin_ledger"."legacy_notion_page_id" IS NULL
        AND "checkin_ledger"."import_batch_id" IS NULL
      ) OR (
        "checkin_ledger"."origin" = 'legacy_import'
        AND "checkin_ledger"."legacy_notion_page_id" IS NOT NULL
        AND "checkin_ledger"."import_batch_id" IS NOT NULL
      ))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_checkin_ledger_owner_date` ON `checkin_ledger` (`owner_key`,`checkin_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_checkin_ledger_legacy_notion_page_id` ON `checkin_ledger` (`legacy_notion_page_id`) WHERE "checkin_ledger"."legacy_notion_page_id" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `checkin_owners` (
	`owner_key` text PRIMARY KEY NOT NULL,
	`ledger_state` text NOT NULL,
	`legacy_audit_fingerprint` text,
	`legacy_observed_count` integer,
	`legacy_imported_count` integer,
	`audit_completed_at` text,
	`activated_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "checkin_owners_ledger_state_check" CHECK("checkin_owners"."ledger_state" IN ('awaiting_audit', 'importing', 'ready', 'blocked')),
	CONSTRAINT "checkin_owners_audit_fingerprint_check" CHECK("checkin_owners"."legacy_audit_fingerprint" IS NULL OR length("checkin_owners"."legacy_audit_fingerprint") = 64),
	CONSTRAINT "checkin_owners_observed_count_check" CHECK("checkin_owners"."legacy_observed_count" IS NULL OR "checkin_owners"."legacy_observed_count" >= 0),
	CONSTRAINT "checkin_owners_imported_count_check" CHECK("checkin_owners"."legacy_imported_count" IS NULL OR "checkin_owners"."legacy_imported_count" >= 0)
);
