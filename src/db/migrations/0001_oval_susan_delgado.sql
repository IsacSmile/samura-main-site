CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`user_id` text,
	`user_name` text DEFAULT 'Verified Buyer' NOT NULL,
	`rating` integer DEFAULT 5 NOT NULL,
	`title` text,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`is_verified` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `products` ADD `ingredients` text;--> statement-breakpoint
ALTER TABLE `products` ADD `absorption_guide` text;--> statement-breakpoint
ALTER TABLE `products` ADD `usage_guide` text;