import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";

// -------------------------------------------------------------
// Isolated Test DB Setup
// -------------------------------------------------------------
const testDbPath = path.join(process.cwd(), "data", "test-phase10-1.db");
const templateDbPath = path.join(process.cwd(), "data", "samaura.db");

if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}
if (fs.existsSync(templateDbPath)) {
  fs.copyFileSync(templateDbPath, testDbPath);
}

process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.PAYMENT_PROVIDER = "mock";

async function runPhase10_1TestSuite() {
  console.log("=================================================");
  console.log("Running PHASE 10.1 Sample Products & Cleanup Test Suite");
  console.log(`Database: ${process.env.DATABASE_URL}`);
  console.log("=================================================\n");

  const { db } = await import("@/db");
  const { products, productVariants, productImages, categories } = await import("@/db/schema");
  const { computePricing } = await import("@/lib/services/pricing");
  const { createOrder } = await import("@/lib/services/orders");
  const { runSeed } = await import("@/db/seed");
  const { removeSampleProducts } = await import("../scripts/db-remove-samples");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // Ensure test db has seeds populated first
  const prevEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runSeed();
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
  }

  // =========================================================================
  // TEST SUITE 1: SAMPLE PRODUCTS SPECIFICATION & INTEGRITY
  // =========================================================================
  console.log("--- TEST SUITE 1: Sample Products Specification & Integrity ---");

  const allSampleProducts = await db
    .select()
    .from(products)
    .where(eq(products.isSample, true));

  assert(allSampleProducts.length === 8, `Exactly 8 sample products seeded (got ${allSampleProducts.length})`);

  for (const prod of allSampleProducts) {
    assert(Boolean(prod.isSample), `Product ${prod.name} has isSample = true`);
    assert(prod.rating === 0, `Product ${prod.name} has rating = 0`);
    assert(prod.reviewCount === 0, `Product ${prod.name} has reviewCount = 0`);
    assert(prod.ingredients === null, `Product ${prod.name} has null ingredients`);
    assert(prod.absorptionGuide === null, `Product ${prod.name} has null absorptionGuide`);
    assert(prod.usageGuide === null, `Product ${prod.name} has null usageGuide`);
    assert(
      !prod.description?.includes(".") || prod.description.split(".").filter(Boolean).length <= 2,
      `Product ${prod.name} description is short and concise`
    );

    // Verify variants for this sample product
    const vars = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, prod.id));

    assert(vars.length > 0, `Product ${prod.name} has at least 1 variant (found ${vars.length})`);
    for (const v of vars) {
      assert(v.sku.startsWith("SMP-"), `Variant ${v.name} (${v.sku}) has SKU prefixed with 'SMP-'`);
    }

    // Verify image
    const imgs = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, prod.id));
    assert(imgs.length === 1, `Product ${prod.name} has exactly 1 image`);
    assert(imgs[0]?.alt === prod.name, `Product ${prod.name} image alt equals product name`);
  }

  // Verify featured / bestseller flags
  const cupProd = allSampleProducts.find((p) => p.id === "smp_menstrual_cup");
  const giftBoxProd = allSampleProducts.find((p) => p.id === "smp_first_period_box");
  assert(Boolean(cupProd?.isFeatured && cupProd?.isBestseller), "Samaura Menstrual Cup marked featured and bestseller");
  assert(Boolean(giftBoxProd?.isFeatured && giftBoxProd?.isBestseller), "My First Period Gift Box marked featured and bestseller");

  // Verify 3 categories exist
  const cats = await db.select().from(categories);
  const catSlugs = cats.map((c) => c.slug);
  assert(catSlugs.includes("menstrual-cups"), "Category 'menstrual-cups' exists");
  assert(catSlugs.includes("gift-collections"), "Category 'gift-collections' exists");
  assert(catSlugs.includes("books-learning"), "Category 'books-learning' exists");

  // =========================================================================
  // TEST SUITE 2: PRODUCTION SEED SAFETY GUARD
  // =========================================================================
  console.log("\n--- TEST SUITE 2: Production Seed Safety Guard ---");

  // Set NODE_ENV to production and run seed on isolated db
  const originalEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    await runSeed();

    const prodEnvSampleProds = await db
      .select()
      .from(products)
      .where(eq(products.isSample, true));

    assert(
      prodEnvSampleProds.length === 0,
      `Production seed creates 0 sample products (got ${prodEnvSampleProds.length})`
    );
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    // Re-seed with test environment
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runSeed();
  }

  // =========================================================================
  // TEST SUITE 3: OUT-OF-STOCK & LOW-STOCK VERIFICATION
  // =========================================================================
  console.log("\n--- TEST SUITE 3: Out-of-Stock & Low-Stock State Verification ---");

  // Variant 5: Activity Book has stock 0
  const oosVariant = await db.query.productVariants.findFirst({
    where: eq(productVariants.sku, "SMP-BOOK-ACT"),
  });
  assert(Boolean(oosVariant && oosVariant.stock === 0), "Activity Book variant has stock = 0");

  const oosPricing = await computePricing({
    items: [{ variantId: oosVariant!.id, quantity: 1 }],
    address: { postalCode: "110001", state: "Delhi" },
  });
  assert(oosPricing.isValid === false, "Out-of-stock item is rejected by pricing engine");
  assert(
    Boolean(oosPricing.error && oosPricing.error.includes("out of stock")),
    `Pricing error mentions out of stock: "${oosPricing.error}"`
  );

  const oosOrderResult = await createOrder({
    items: [{ variantId: oosVariant!.id, quantity: 1 }],
    address: {
      fullName: "Test Shopper",
      phone: "9876543210",
      email: "test@example.com",
      addressLine1: "123 Test St",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "110001",
    },
    paymentMethod: "cod",
    idempotencyKey: `idem_oos_${Date.now()}`,
  });
  assert(oosOrderResult.success === false, "Out-of-stock product order creation is rejected");
  assert(
    Boolean(oosOrderResult.error && oosOrderResult.error.includes("out of stock")),
    `Order error mentions out of stock: "${oosOrderResult.error}"`
  );

  // Low stock variant: Pack of 2 Medium + Medium has stock 3
  const lowStockVariant = await db.query.productVariants.findFirst({
    where: eq(productVariants.sku, "SMP-CUP2-MD"),
  });
  assert(
    Boolean(lowStockVariant && lowStockVariant.stock === 3),
    `Pack of 2 Medium + Medium variant has stock = 3 (got ${lowStockVariant?.stock})`
  );
  assert(
    Boolean(lowStockVariant && lowStockVariant.stock > 0 && lowStockVariant.stock <= 5),
    "Low-stock variant stock is within the low-stock alert threshold (<= 5)"
  );

  // =========================================================================
  // TEST SUITE 4: LAST-UNIT CONCURRENCY WITH SAMPLE STOCK
  // =========================================================================
  console.log("\n--- TEST SUITE 4: Last-Unit Concurrency with Sample Stock ---");

  // Create an isolated variant with exactly 1 unit of stock
  const raceVariantId = `var_race_${Date.now()}`;
  await db.insert(productVariants).values({
    id: raceVariantId,
    productId: "smp_menstrual_cup",
    name: "Limited Edition Last Unit",
    sku: `SMP-RACE-${Date.now()}`,
    pricePaise: 49900,
    stock: 1,
    sortOrder: 99,
  });

  const orderPayload1 = {
    items: [{ variantId: raceVariantId, quantity: 1 }],
    address: {
      fullName: "Shopper Alpha",
      phone: "9876543211",
      email: "alpha@example.com",
      addressLine1: "123 Alpha St",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "110001",
    },
    paymentMethod: "cod" as const,
    idempotencyKey: `idem_race_1_${Date.now()}`,
  };

  const orderPayload2 = {
    items: [{ variantId: raceVariantId, quantity: 1 }],
    address: {
      fullName: "Shopper Beta",
      phone: "9876543212",
      email: "beta@example.com",
      addressLine1: "456 Beta Rd",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "110001",
    },
    paymentMethod: "cod" as const,
    idempotencyKey: `idem_race_2_${Date.now()}`,
  };

  const [res1, res2] = await Promise.all([
    createOrder(orderPayload1),
    createOrder(orderPayload2),
  ]);

  const successes = [res1, res2].filter((r) => r.success);
  const failures = [res1, res2].filter((r) => !r.success);

  assert(successes.length === 1, `Exactly 1 concurrent order succeeded for the last unit (got ${successes.length})`);
  assert(failures.length === 1, `Exactly 1 concurrent order was rejected (got ${failures.length})`);

  const updatedRaceVariant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, raceVariantId),
  });
  assert(
    updatedRaceVariant?.stock === 0,
    `Remaining stock after race condition is strictly 0 (got ${updatedRaceVariant?.stock})`
  );

  // =========================================================================
  // TEST SUITE 5: DB:REMOVE-SAMPLES DRY-RUN AND --CONFIRM EXECUTION
  // =========================================================================
  console.log("\n--- TEST SUITE 5: db:remove-samples Script (Dry-Run & --confirm) ---");

  // Add a non-sample client product to test that only isSample rows are removed
  const clientProdId = `prod_real_${Date.now()}`;
  await db.insert(products).values({
    id: clientProdId,
    categoryId: "cat_menstrual_cups",
    name: "Client Real Product",
    slug: `client-real-product-${Date.now()}`,
    description: "Real client product details.",
    basePricePaise: 59900,
    isSample: false,
  });

  const clientVarId = `var_real_${Date.now()}`;
  await db.insert(productVariants).values({
    id: clientVarId,
    productId: clientProdId,
    name: "Real Variant",
    sku: "REAL-SKU-001",
    pricePaise: 59900,
    stock: 50,
  });

  // 1. Dry run
  const dryRunResult = await removeSampleProducts(false);
  assert(dryRunResult.deletedCount === 0, "Dry-run returns deletedCount = 0");
  assert(dryRunResult.sampleProducts.length === 8, `Dry-run identifies all 8 sample products (got ${dryRunResult.sampleProducts.length})`);

  const prodsAfterDryRun = await db.select().from(products);
  assert(
    prodsAfterDryRun.some((p) => p.id === clientProdId),
    "Client product still exists after dry-run"
  );
  assert(
    prodsAfterDryRun.filter((p) => p.isSample).length === 8,
    "All 8 sample products still exist in DB after dry run"
  );

  // 2. Confirmed run
  const confirmResult = await removeSampleProducts(true);
  assert(confirmResult.deletedCount === 8, `Confirmed execution deletes 8 sample products (got ${confirmResult.deletedCount})`);

  const prodsAfterConfirm = await db.select().from(products);
  const remainingSampleProds = prodsAfterConfirm.filter((p) => p.isSample);
  assert(remainingSampleProds.length === 0, `Zero sample products remain after confirmed deletion (got ${remainingSampleProds.length})`);

  // Verify non-sample product was untouched
  const clientProdRemaining = prodsAfterConfirm.find((p) => p.id === clientProdId);
  assert(Boolean(clientProdRemaining), "Non-sample client product remains completely intact");

  const clientVarRemaining = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, clientVarId),
  });
  assert(Boolean(clientVarRemaining), "Non-sample client product variants remain completely intact");

  // Verify empty books-learning category was cleaned up while others remain
  const remainingCats = await db.select().from(categories);
  const remainingCatSlugs = remainingCats.map((c) => c.slug);
  assert(!remainingCatSlugs.includes("books-learning"), "Empty 'books-learning' category removed");
  assert(remainingCatSlugs.includes("menstrual-cups"), "Category 'menstrual-cups' preserved");
  assert(remainingCatSlugs.includes("gift-collections"), "Category 'gift-collections' preserved");

  // Clean up test DB
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log("\n=================================================");
  console.log(`PHASE 10.1 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase10_1TestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
