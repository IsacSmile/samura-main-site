CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_hash_unique` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`public_access_token` text NOT NULL,
	`idempotency_key` text,
	`user_id` text,
	`status` text DEFAULT 'pending_payment' NOT NULL,
	`payment_method` text NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`razorpay_order_id` text,
	`razorpay_payment_id` text,
	`razorpay_signature` text,
	`subtotal_paise` integer NOT NULL,
	`discount_paise` integer DEFAULT 0 NOT NULL,
	`coupon_code` text,
	`shipping_fee_paise` integer DEFAULT 0 NOT NULL,
	`total_paise` integer NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`customer_email` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_name` text NOT NULL,
	`shipping_address` text NOT NULL,
	`notes` text,
	`courier_name` text,
	`tracking_number` text,
	`delivered_at` integer,
	`cancelled_at` integer,
	`refund_notes` text,
	`is_flagged_for_review` integer DEFAULT false NOT NULL,
	`flag_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "order_number", "public_access_token", "idempotency_key", "user_id", "status", "payment_method", "payment_status", "razorpay_order_id", "razorpay_payment_id", "razorpay_signature", "subtotal_paise", "discount_paise", "coupon_code", "shipping_fee_paise", "total_paise", "currency", "customer_email", "customer_phone", "customer_name", "shipping_address", "notes", "courier_name", "tracking_number", "delivered_at", "cancelled_at", "refund_notes", "is_flagged_for_review", "flag_reason", "created_at", "updated_at") SELECT "id", "order_number", "public_access_token", "idempotency_key", "user_id", "status", "payment_method", "payment_status", "razorpay_order_id", "razorpay_payment_id", "razorpay_signature", "subtotal_paise", "discount_paise", "coupon_code", "shipping_fee_paise", "total_paise", "currency", "customer_email", "customer_phone", "customer_name", "shipping_address", "notes", "courier_name", "tracking_number", "delivered_at", "cancelled_at", "refund_notes", "is_flagged_for_review", "flag_reason", "created_at", "updated_at" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_public_access_token_unique` ON `orders` (`public_access_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_idempotency_key_unique` ON `orders` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`short_description` text,
	`description` text NOT NULL,
	`base_price_paise` integer NOT NULL,
	`sale_price_paise` integer,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_bestseller` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`rating` real DEFAULT 0 NOT NULL,
	`review_count` integer DEFAULT 0 NOT NULL,
	`badge` text,
	`flow_type` text,
	`ingredients` text,
	`absorption_guide` text,
	`usage_guide` text,
	`features` text,
	`faq` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "category_id", "name", "slug", "short_description", "description", "base_price_paise", "sale_price_paise", "is_featured", "is_bestseller", "is_active", "rating", "review_count", "badge", "flow_type", "ingredients", "absorption_guide", "usage_guide", "features", "faq", "created_at", "updated_at") SELECT "id", "category_id", "name", "slug", "short_description", "description", "base_price_paise", "sale_price_paise", "is_featured", "is_bestseller", "is_active", "rating", "review_count", "badge", "flow_type", "ingredients", "absorption_guide", "usage_guide", "features", "faq", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);