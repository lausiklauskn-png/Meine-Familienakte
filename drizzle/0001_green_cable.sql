CREATE TABLE `family_records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`record_type` text NOT NULL,
	`status` text DEFAULT 'aktiv' NOT NULL,
	`source` text,
	`notes` text,
	`data_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `family_records_owner_type_idx` ON `family_records` (`owner_id`,`record_type`);--> statement-breakpoint
CREATE INDEX `family_records_owner_status_idx` ON `family_records` (`owner_id`,`status`);--> statement-breakpoint
CREATE TABLE `family_relations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`from_type` text NOT NULL,
	`from_id` text NOT NULL,
	`to_type` text NOT NULL,
	`to_id` text NOT NULL,
	`relation_type` text NOT NULL,
	`source` text,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `family_relations_owner_from_idx` ON `family_relations` (`owner_id`,`from_type`,`from_id`);--> statement-breakpoint
CREATE INDEX `family_relations_owner_to_idx` ON `family_relations` (`owner_id`,`to_type`,`to_id`);--> statement-breakpoint
CREATE TABLE `family_sequences` (
	`owner_id` text NOT NULL,
	`record_type` text NOT NULL,
	`last_number` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`owner_id`, `record_type`)
);
--> statement-breakpoint
ALTER TABLE `documents` ADD `source` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `storage_type` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `onedrive_path` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `relative_path` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `updated_at` integer;--> statement-breakpoint
PRAGMA optimize;
