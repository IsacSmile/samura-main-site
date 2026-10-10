CREATE TABLE IF NOT EXISTS `testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`city` text,
	`rating` integer DEFAULT 5 NOT NULL,
	`body` text NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`is_sample` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `products` ADD `sort_order` integer DEFAULT 0 NOT NULL;
