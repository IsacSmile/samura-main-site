import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, orders, orderItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";

import { checkRateLimit } from "@/lib/rateLimit";

function sanitizeText(str: string): string {
  return str
    .replace(/<[^>]*>/g, "") // Strip all HTML tags
    .replace(/\s+/g, " ") // Normalize multiple spaces
    .trim();
}

const reviewSubmissionSchema = z.object({
  productId: z.string().min(1, "Product ID is required").max(100),
  userName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be under 60 characters"),
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  title: z.string().max(100, "Title must be under 100 characters").optional().nullable(),
  body: z
    .string()
    .min(5, "Review details must be at least 5 characters")
    .max(1000, "Review must be under 1000 characters"),
  // Honeypot field (hidden in UI)
  hp_website: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateCheck = await checkRateLimit(`review:${ip}`, 5, 600);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Too many review submissions. Please wait a few minutes before trying again.",
        },
        { status: 429 }
      );
    }

    // 2. Parse & Zod Validate Payload
    const json = await req.json();
    const parsed = reviewSubmissionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { productId, userName, rating, title, body, hp_website } = parsed.data;

    // 3. Honeypot verification (bots fill hidden fields)
    if (hp_website && hp_website.trim().length > 0) {
      // Silently accept, bypassing storage to database
      return NextResponse.json({
        success: true,
        message: "Review submitted successfully and is awaiting moderation.",
      });
    }

    // 4. Sanitize text fields
    const sanitizedName = sanitizeText(userName);
    const sanitizedTitle = title ? sanitizeText(title) : null;
    const sanitizedBody = sanitizeText(body);

    // 5. Server-side purchase confirmation check
    // Confirmed ONLY if the authenticated user has a delivered order containing this product
    let isVerified = false;
    let userId: string | null = null;

    const session = await auth();
    if (session?.user?.id) {
      userId = session.user.id;

      // Query delivered orders for this user containing the product
      const deliveredOrdersWithProduct = await db
        .select({ orderId: orders.id })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.userId, userId),
            eq(orders.status, "delivered"),
            eq(orderItems.productId, productId)
          )
        )
        .limit(1);

      if (deliveredOrdersWithProduct.length > 0) {
        isVerified = true;
      }
    }

    // 6. Insert new review with strictly status: "pending"
    const [newReview] = await db
      .insert(reviews)
      .values({
        id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        productId,
        userId,
        userName: sanitizedName,
        rating,
        title: sanitizedTitle,
        body: sanitizedBody,
        status: "pending", // Strictly pending admin moderation
        isVerified, // Server-calculated ONLY
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully and is awaiting moderation.",
        review: {
          id: newReview.id,
          productId: newReview.productId,
          userName: newReview.userName,
          rating: newReview.rating,
          status: newReview.status,
          isVerified: newReview.isVerified,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
