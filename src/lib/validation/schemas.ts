import { z } from "zod";

// -----------------------------------------------------------------------------
// Authentication Schemas
// -----------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number").optional().or(z.literal("")),
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
        url: z.string().min(1),
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
  image: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const adminCouponSchema = z.object({
  code: z.string().min(3).toUpperCase().trim(),
  discountType: z.enum(["percentage", "fixed_paise"]),
  discountValue: z.number().int().min(1),
  minOrderPaise: z.number().int().min(0).default(0),
  maxDiscountPaise: z.number().int().optional().nullable(),
  usageLimit: z.number().int().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const adminOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  notes: z.string().optional(),
});
