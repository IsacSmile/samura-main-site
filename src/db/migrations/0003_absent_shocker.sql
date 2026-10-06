CREATE TABLE `email_verification_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_verification_tokens_token_hash_unique` ON `email_verification_tokens` (`token_hash`);--> statement-breakpoint
ALTER TABLE `banners` ADD `start_date` integer;--> statement-breakpoint
ALTER TABLE `banners` ADD `end_date` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `invoice_number` text;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_invoice_number_unique` ON `orders` (`invoice_number`);--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password_changed_at` integer;