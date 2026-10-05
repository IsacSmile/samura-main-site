import assert from "node:assert";
import { db } from "../src/db";
import { products, categories, reviews } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { recomputeProductRating } from "../src/lib/services/products";

async function run() {
  console.log("=== Testing Review Rating & ReviewCount Recomputation ===");

  const testCategoryId = `test_cat_${Date.now()}`;
  const testProductId = `test_prod_${Date.now()}`;

  // 1. Create a dummy category & product
  await db.insert(categories).values({
    id: testCategoryId,
    name: "Test Category",
    slug: `test-cat-${Date.now()}`,
  });

  await db.insert(products).values({
    id: testProductId,
    categoryId: testCategoryId,
    name: "Test Product",
    slug: `test-product-${Date.now()}`,
    description: "Test description",
    basePricePaise: 29900,
    rating: 0,
    reviewCount: 0,
  });

  try {
    // Verify initial product state
    const [p0] = await db.select().from(products).where(eq(products.id, testProductId));
    assert.strictEqual(p0.rating, 0, "Initial rating should be 0");
    assert.strictEqual(p0.reviewCount, 0, "Initial reviewCount should be 0");
    console.log("✓ Initial state verified: rating=0, reviewCount=0");

    // 2. Insert 3 reviews: 1 approved (4 stars), 1 pending (5 stars), 1 rejected (1 star)
    const revApprovedId = `rev_app_${Date.now()}`;
    const revPendingId = `rev_pen_${Date.now()}`;
    const revRejectedId = `rev_rej_${Date.now()}`;

    await db.insert(reviews).values([
      {
        id: revApprovedId,
        productId: testProductId,
        userName: "Alice",
        rating: 4,
        body: "Approved review",
        status: "approved",
      },
      {
        id: revPendingId,
        productId: testProductId,
        userName: "Bob",
        rating: 5,
        body: "Pending review",
        status: "pending",
      },
      {
        id: revRejectedId,
        productId: testProductId,
        userName: "Charlie",
        rating: 1,
        body: "Rejected review",
        status: "rejected",
      },
    ]);

    // Recompute
    const res1 = await recomputeProductRating(testProductId);
    assert.strictEqual(res1.reviewCount, 1, "Only approved reviews must be counted (expected 1)");
    assert.strictEqual(res1.rating, 4.0, "Rating should be 4.0 from the single approved review");
    console.log(`✓ Only approved review counted: rating=${res1.rating}, reviewCount=${res1.reviewCount}`);

    // 3. Approve Bob's 5-star review -> average of 4 and 5 is 4.5
    await db.update(reviews).set({ status: "approved" }).where(eq(reviews.id, revPendingId));
    const res2 = await recomputeProductRating(testProductId);
    assert.strictEqual(res2.reviewCount, 2, "Should now have 2 approved reviews");
    assert.strictEqual(res2.rating, 4.5, "Average rating should be (4 + 5) / 2 = 4.5");
    console.log(`✓ After approving 2nd review: rating=${res2.rating}, reviewCount=${res2.reviewCount}`);

    // 4. Reject Alice's 4-star review -> only Bob's 5-star review remains approved
    await db.update(reviews).set({ status: "rejected" }).where(eq(reviews.id, revApprovedId));
    const res3 = await recomputeProductRating(testProductId);
    assert.strictEqual(res3.reviewCount, 1, "Should now have 1 approved review");
    assert.strictEqual(res3.rating, 5.0, "Average rating should now be 5.0");
    console.log(`✓ After rejecting 1st review: rating=${res3.rating}, reviewCount=${res3.reviewCount}`);

    // 5. Delete Bob's 5-star review -> 0 approved reviews remain
    await db.delete(reviews).where(eq(reviews.id, revPendingId));
    const res4 = await recomputeProductRating(testProductId);
    assert.strictEqual(res4.reviewCount, 0, "Should have 0 reviews after deletion");
    assert.strictEqual(res4.rating, 0, "Average rating should reset to 0");
    console.log(`✓ After deleting remaining approved review: rating=${res4.rating}, reviewCount=${res4.reviewCount}`);

    console.log("=== ALL REVIEW RECOMPUTATION TESTS PASSED ===");
  } finally {
    // Cleanup test data
    await db.delete(reviews).where(eq(reviews.productId, testProductId));
    await db.delete(products).where(eq(products.id, testProductId));
    await db.delete(categories).where(eq(categories.id, testCategoryId));
  }
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
