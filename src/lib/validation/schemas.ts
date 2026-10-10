import { z } from "zod";

// -----------------------------------------------------------------------------
// Authentication Schemas
// -----------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number").optional().or(z.literal("")),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// -----------------------------------------------------------------------------
// Checkout & Order Schemas
// -----------------------------------------------------------------------------
export const checkoutItemSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(20, "Maximum 20 items per variant"),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Full name is required"),
  customerEmail: z.string().email("Valid email is required for order updates"),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  addressLine1: z.string().min(5, "Flat/House no. and street are required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit PIN code"),
  paymentMethod: z.enum(["razorpay", "cod"], {
    message: "Select a payment method (Razorpay or Cash on Delivery)",
  }),
  couponCode: z.string().trim().optional(),
  notes: z.string().max(300, "Notes cannot exceed 300 characters").optional(),
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty"),
});

export const couponValidateSchema = z.object({
  code: z.string().min(1, "Coupon code is required").toUpperCase().trim(),
  subtotalPaise: z.number().int().min(0),
});

// -----------------------------------------------------------------------------
// Contact & Support Enquiry Schema
// -----------------------------------------------------------------------------
export const contactEnquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  phone: z.string().optional(),
  topic: z
    .enum([
      "General",
      "Menstrual cup",
      "Awareness session",
      "Gift pack",
      "Institutional/CSR",
    ])
    .default("General"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// -----------------------------------------------------------------------------
// Review Submission Schema
// -----------------------------------------------------------------------------
export const submitReviewSchema = z.object({
  productId: z.string().min(1),
  userName: z.string().min(2, "Name is required"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z.string().min(5, "Review comment must be at least 5 characters"),
});

// -----------------------------------------------------------------------------
// Admin Schemas
// -----------------------------------------------------------------------------
export const adminProductSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and dashes"),
  shortDescription: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  basePricePaise: z.number().int().min(100, "Price must be at least ₹1.00"),
  salePricePaise: z.number().int().optional().nullable(),
  badge: z.string().optional().nullable(),
  flowType: z.string().optional().nullable(),
  features: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export function isSafeUrlOrRelative(val: string): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();

  // Explicitly reject dangerous pseudo-protocols and insecure http
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:") ||
    lower.startsWith("http:")
  ) {
    return false;
  }

  // Reject protocol-relative and backslash bypasses (e.g. //evil.com, /\evil.com)
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\") || /^\/[/\\]/.test(trimmed)) {
    return false;
  }

  // Safe relative paths starting with '/'
  if (trimmed.startsWith("/")) {
    return true;
  }

  // Absolute URL: strictly https:
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Safe URL validator: permits only https:// or relative paths starting with '/'.
// Rejects javascript:, data:, vbscript:, http://, file:, //evil.com, /\evil.com
export const safeUrlOrRelative = z
  .string()
  .trim()
  .refine(
    (val) => isSafeUrlOrRelative(val),
    {
      message: "Only https:// URLs or relative paths starting with '/' are permitted (javascript:, data:, http:, //evil.com, and /\\evil.com are forbidden)",
    }
  );

export const safeRequiredUrlOrRelative = z
  .string()
  .trim()
  .min(1, "URL is required")
  .refine(
    (val) => Boolean(val) && isSafeUrlOrRelative(val),
    {
      message: "Only https:// URLs or relative paths starting with '/' are permitted (javascript:, data:, http:, //evil.com, and /\\evil.com are forbidden)",
    }
  );

export const adminProductUpsertSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(2, "Product name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  shortDescription: z.string().optional().nullable(),
  description: z.string().min(5, "Description is required"),
  basePriceRupees: z.number().min(0, "Price must be positive"),
  salePriceRupees: z.number().optional().nullable(),
  badge: z.string().optional().nullable(),
  flowType: z.string().optional().nullable(),
  ingredients: z.string().optional().nullable(),
  absorptionGuide: z.string().optional().nullable(),
  usageGuide: z.string().optional().nullable(),
  features: z.string().optional().nullable(),
  faq: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Variant name is required"),
        sku: z.string().min(1, "SKU is required"),
        size: z.string().optional().nullable(),
        packQty: z.number().int().min(1).default(1),
        priceRupees: z.number().min(0, "Price must be non-negative"),
        salePriceRupees: z.number().optional().nullable(),
        stock: z.number().int().min(0, "Stock cannot be negative").default(0),
        isDefault: z.boolean().default(false),
        sortOrder: z.number().int().default(0),
      })
    )
    .min(1, "At least one product variant is required"),
  images: z
    .array(
      z.object({
        id: z.string().optional(),
        url: safeRequiredUrlOrRelative,
        alt: z.string().optional().nullable(),
        isPrimary: z.boolean().default(false),
        sortOrder: z.number().int().default(0),
      })
    )
    .optional(),
});

export const adminVariantSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1, "Variant name is required (e.g. Pack of 24)"),
  sku: z.string().min(1, "SKU is required"),
  size: z.string().optional().nullable(),
  packQty: z.number().int().min(1).default(1),
  pricePaise: z.number().int().min(100),
  salePricePaise: z.number().int().optional().nullable(),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const adminCategorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  parentId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image: safeUrlOrRelative.optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const adminCouponSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(3, "Coupon code must be at least 3 characters").toUpperCase().trim(),
  discountType: z.enum(["percentage", "fixed_paise"]),
  discountValue: z.number().int().min(1, "Discount value must be at least 1"),
  minOrderPaise: z.number().int().min(0).default(0),
  maxDiscountPaise: z.number().int().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  usageLimit: z.number().int().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const adminBannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, "Title is required"),
  subtitle: z.string().optional().nullable(),
  link: safeUrlOrRelative.default("/shop"),
  imageUrl: safeRequiredUrlOrRelative,
  badge: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export const adminBlogPostSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title is required"),
  slug: z
    .string()
    .min(3, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  excerpt: z.string().min(5, "Excerpt is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  coverImage: safeUrlOrRelative.optional().nullable(),
  author: z.string().default("Samaura Health Desk"),
  category: z.string().default("Period Health"),
  readTime: z.string().default("4 min read"),
  isPublished: z.boolean().default(true),
});

export const adminPageSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2, "Slug is required"),
  title: z.string().min(2, "Title is required"),
  content: z.string().min(5, "Content is required"),
});

export const adminShippingRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Rule name is required"),
  minOrderPaise: z.number().int().min(0).default(0),
  maxOrderPaise: z.number().int().optional().nullable(),
  feePaise: z.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const adminOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    "pending_payment",
    "placed",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
    "returned",
  ]),
  paymentStatus: z.enum([
    "pending",
    "pending_cod",
    "paid",
    "failed",
    "refunded",
    "paid_after_cancel",
    "refund_pending",
  ]),
  notes: z.string().optional(),
});

export const testimonialUpsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(60, "Name must be at most 60 characters"),
  city: z.string().trim().max(60, "City must be at most 60 characters").optional().nullable(),
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  body: z.string().trim().min(1, "Review body is required").max(280, "Body must be at most 280 characters"),
  isPublished: z.boolean().default(true),
  isSample: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

