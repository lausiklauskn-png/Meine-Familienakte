CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`original_name` text NOT NULL,
	`category` text NOT NULL,
	`document_date` text,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`r2_key` text NOT NULL,
	`sha256` text NOT NULL,
	`status` text DEFAULT 'hochgeladen' NOT NULL,
	`notes` text,
	`uploaded_at` integer NOT NULL,
	`reviewed_at` integer,
	`integrated_at` integer
);
--> statement-breakpoint
CREATE INDEX `documents_owner_uploaded_idx` ON `documents` (`owner_id`,`uploaded_at`);--> statement-breakpoint
CREATE INDEX `documents_owner_status_idx` ON `documents` (`owner_id`,`status`);--> statement-breakpoint
CREATE INDEX `documents_owner_hash_idx` ON `documents` (`owner_id`,`sha256`);