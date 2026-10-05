import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { z } from "zod";

const createReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  userName: z.string().min(2, "Name must be at least 2 characters").max(60),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(5, "Review details must be at least 5 characters").max(1000),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createReviewSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { productId, userName, rating, title, body } = parsed.data;

    const newReview = await db
      .insert(reviews)
      .values({
        id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        productId,
        userId: null,
        userName,
        rating,
        title: title || null,
        body,
        status: "pending", // strictly pending moderation
        isVerified: true,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully and is awaiting moderation.",
        review: newReview[0],
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
