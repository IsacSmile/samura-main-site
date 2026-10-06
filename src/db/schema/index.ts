import { sqliteTable, text, integer, real, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// -----------------------------------------------------------------------------
// 1. Users
// -----------------------------------------------------------------------------
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: text("role", { enum: ["customer", "admin"] }).notNull().default("customer"),
  phone: text("phone"),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  passwordChangedAt: integer("password_changed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  addresses: many(addresses),
}));

// -----------------------------------------------------------------------------
// 2. Addresses
// -----------------------------------------------------------------------------
export const addresses = sqliteTable("addresses", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

// -----------------------------------------------------------------------------
// 3. Categories (with parent_id support)
// -----------------------------------------------------------------------------
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  parentId: text("parent_id").references((): AnySQLiteColumn => categories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "category_parent",
  }),
  subcategories: many(categories, { relationName: "category_parent" }),
  products: many(products),
}));

// -----------------------------------------------------------------------------
// 4. Products
// -----------------------------------------------------------------------------
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description"),
  description: text("description").notNull(),
  basePricePaise: integer("base_price_paise").notNull(), // stored in paise
  salePricePaise: integer("sale_price_paise"),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
  isBestseller: integer("is_bestseller", { mode: "boolean" }).notNull().default(false),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  badge: text("badge"),
  flowType: text("flow_type"),
  ingredients: text("ingredients"),
  absorptionGuide: text("absorption_guide"),
  usageGuide: text("usage_guide"),
  features: text("features"), // JSON string
  faq: text("faq"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  images: many(productImages),
  reviews: many(reviews),
}));

// -----------------------------------------------------------------------------
// 5. Product Variants
// -----------------------------------------------------------------------------
export const productVariants = sqliteTable("product_variants", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  size: text("size"),
  packQty: integer("pack_qty").notNull().default(1),
  pricePaise: integer("price_paise").notNull(),
  salePricePaise: integer("sale_price_paise"),
  stock: integer("stock").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
});

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

// -----------------------------------------------------------------------------
// 6. Product Images
// -----------------------------------------------------------------------------
export const productImages = sqliteTable("product_images", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

// -----------------------------------------------------------------------------
// 7. Carts (Optional server cart persistence)
// -----------------------------------------------------------------------------
export const carts = sqliteTable("carts", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  items: text("items").notNull().default("[]"), // JSON stringified array of items
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// -----------------------------------------------------------------------------
// 8. Orders
// -----------------------------------------------------------------------------
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  invoiceNumber: text("invoice_number").unique(),
  publicAccessToken: text("public_access_token").notNull().unique(),
  idempotencyKey: text("idempotency_key").unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status", {
    enum: [
      "pending_payment",
      "placed",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
      "returned",
    ],
  })
    .notNull()
    .default("pending_payment"),
  paymentMethod: text("payment_method", { enum: ["razorpay", "cod", "mock"] }).notNull(),
  paymentStatus: text("payment_status", {
    enum: ["pending", "pending_cod", "paid", "failed", "refunded", "paid_after_cancel", "refund_pending"],
  })
    .notNull()
    .default("pending"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  subtotalPaise: integer("subtotal_paise").notNull(),
  discountPaise: integer("discount_paise").notNull().default(0),
  couponCode: text("coupon_code"),
  shippingFeePaise: integer("shipping_fee_paise").notNull().default(0),
  totalPaise: integer("total_paise").notNull(),
  currency: text("currency").notNull().default("INR"),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerName: text("customer_name").notNull(),
  shippingAddress: text("shipping_address").notNull(), // JSON string
  notes: text("notes"),
  courierName: text("courier_name"),
  trackingNumber: text("tracking_number"),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  cancelledAt: integer("cancelled_at", { mode: "timestamp" }),
  refundNotes: text("refund_notes"),
  isFlaggedForReview: integer("is_flagged_for_review", { mode: "boolean" }).notNull().default(false),
  flagReason: text("flag_reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

// -----------------------------------------------------------------------------
// 9. Order Items
// -----------------------------------------------------------------------------
export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
  variantId: text("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  variantName: text("variant_name").notNull(),
  sku: text("sku").notNull(),
  quantity: integer("quantity").notNull(),
  unitPricePaise: integer("unit_price_paise").notNull(),
  totalPricePaise: integer("total_price_paise").notNull(),
  image: text("image"),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

// -----------------------------------------------------------------------------
// 10. Payments
// -----------------------------------------------------------------------------
export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  paymentMethod: text("payment_method", { enum: ["razorpay", "cod", "mock"] }).notNull(),
  amountPaise: integer("amount_paise").notNull(),
  status: text("status", { enum: ["pending", "successful", "failed", "refunded"] }).notNull().default("pending"),
  gateway: text("gateway").notNull().default("razorpay"),
  transactionId: text("transaction_id"),
  signature: text("signature"),
  rawResponse: text("raw_response"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

// -----------------------------------------------------------------------------
// 11. Coupons
// -----------------------------------------------------------------------------
export const coupons = sqliteTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type", { enum: ["percentage", "fixed_paise"] }).notNull(),
  discountValue: integer("discount_value").notNull(),
  minOrderPaise: integer("min_order_paise").notNull().default(0),
  maxDiscountPaise: integer("max_discount_paise"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  usageLimit: integer("usage_limit"),
  timesUsed: integer("times_used").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

// -----------------------------------------------------------------------------
// 12. Banners
// -----------------------------------------------------------------------------
export const banners = sqliteTable("banners", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  link: text("link").default("/shop"),
  imageUrl: text("image_url").notNull(),
  badge: text("badge"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
});

// -----------------------------------------------------------------------------
// 13. Posts (Blog)
// -----------------------------------------------------------------------------
export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  author: text("author").notNull().default("Samaura Health Desk"),
  category: text("category").notNull().default("Period Health"),
  readTime: text("read_time").notNull().default("4 min read"),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
  publishedAt: integer("published_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// -----------------------------------------------------------------------------
// 14. Pages (Static CMS)
// -----------------------------------------------------------------------------
export const pages = sqliteTable("pages", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// -----------------------------------------------------------------------------
// 15. Settings
// -----------------------------------------------------------------------------
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
});

// -----------------------------------------------------------------------------
// 16. Shipping Rules
// -----------------------------------------------------------------------------
export const shippingRules = sqliteTable("shipping_rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  minOrderPaise: integer("min_order_paise").notNull().default(0),
  maxOrderPaise: integer("max_order_paise"),
  feePaise: integer("fee_paise").notNull().default(0),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

// -----------------------------------------------------------------------------
// 17. Enquiries (Contact & Product Inquiries)
// -----------------------------------------------------------------------------
export const enquiries = sqliteTable("enquiries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["new", "read", "responded"] }).notNull().default("new"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// -----------------------------------------------------------------------------
// 18. Reviews (Product Feedback & Ratings)
// -----------------------------------------------------------------------------
export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  userName: text("user_name").notNull().default("Verified Buyer"),
  rating: integer("rating").notNull().default(5),
  title: text("title"),
  body: text("body").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

// -----------------------------------------------------------------------------
// 19. Password Reset Tokens
// -----------------------------------------------------------------------------
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// -----------------------------------------------------------------------------
// 20. Email Verification Tokens
// -----------------------------------------------------------------------------
export const emailVerificationTokens = sqliteTable("email_verification_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
  }),
}));

// -----------------------------------------------------------------------------
// 21. Rate Limits (Persistent DB-backed rate limiter)
// -----------------------------------------------------------------------------
export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(1),
  resetAt: integer("reset_at", { mode: "timestamp" }).notNull(),
});

// -----------------------------------------------------------------------------
// 22. Invoice Counters (Atomic sequential invoice generation)
// -----------------------------------------------------------------------------
export const invoiceCounters = sqliteTable("invoice_counters", {
  year: integer("year").primaryKey(),
  lastSequence: integer("last_sequence").notNull().default(0),
});

// Legacy aliases for backward compatibility if needed
export const blogPosts = posts;
export const staticPages = pages;


