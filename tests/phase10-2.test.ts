import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";

// -------------------------------------------------------------
// Isolated Test DB Setup for Phase 10.2
// -------------------------------------------------------------
const testDbPath = path.join(process.cwd(), "data", "test-phase10-2.db");
const templateDbPath = path.join(process.cwd(), "data", "samaura.db");

if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}
if (fs.existsSync(templateDbPath)) {
  fs.copyFileSync(templateDbPath, testDbPath);
}

process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.PAYMENT_PROVIDER = "mock";

async function runPhase10_2TestSuite() {
  console.log("=================================================");
  console.log("Running PHASE 10.2 Stale Cart Items & Resilient Pricing Test Suite");
  console.log(`Database: ${process.env.DATABASE_URL}`);
  console.log("=================================================\n");

  const { db } = await import("@/db");
  const { productVariants } = await import("@/db/schema");
  const { computePricing } = await import("@/lib/services/pricing");
  const { createOrder } = await import("@/lib/services/orders");
  const { migrateCartState, CART_STORE_VERSION, MAX_QUANTITY_PER_LINE, MAX_CART_LINES } =
    await import("@/lib/cart/store");

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

  try {
    // -------------------------------------------------------------
    // TEST 1: Cart with One Stale ID Plus One Valid Item
    // -------------------------------------------------------------
    console.log("--- TEST 1: Cart with Stale ID + Valid Item (Resilient Validation) ---");

    const validVariant = await db.query.productVariants.findFirst({
      where: eq(productVariants.sku, "SMP-GIFT-MINI-STD"),
    });
    assert(Boolean(validVariant), "Found valid sample variant (SMP-GIFT-MINI-STD)");

    const staleVariantId = "var_02_night_10"; // Deprecated variant ID from removed sample catalogue

    const mixedPricing = await computePricing({
      items: [
        { variantId: staleVariantId, quantity: 2 },
        { variantId: validVariant!.id, quantity: 1 },
      ],
    });

    assert(mixedPricing.isValid === true, "computePricing succeeds for mixed cart without throwing");
    assert(mixedPricing.lines.length === 1, "Only 1 valid line item returned in lines");
    assert(mixedPricing.items.length === 1, "Only 1 valid line item returned in items alias");
    assert(mixedPricing.lines[0].variantId === validVariant!.id, "Valid variant is preserved in priced lines");
    assert(
      mixedPricing.subtotalPaise === validVariant!.pricePaise,
      `Totals computed strictly for valid item (${mixedPricing.subtotalPaise} paise)`
    );

    assert(mixedPricing.removed.length === 1, "Stale line reported in removed array");
    assert(mixedPricing.removed[0].variantId === staleVariantId, "Removed entry has matching stale variantId");
    assert(mixedPricing.removed[0].reason === "unavailable", "Removed reason is 'unavailable'");

    assert(Boolean(mixedPricing.notice), "Friendly customer notice generated");
    assert(
      !mixedPricing.notice!.includes(staleVariantId),
      `Notice does NOT leak raw variant ID: "${mixedPricing.notice}"`
    );
    assert(
      !mixedPricing.notice!.includes("var_"),
      "Notice does not contain internal 'var_' prefix"
    );

    // -------------------------------------------------------------
    // TEST 2: Cart with Only Stale IDs
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Cart with Only Stale IDs (Empty Valid Set & Friendly Message) ---");

    const staleOnlyPricing = await computePricing({
      items: [
        { variantId: "var_stale_nonexistent_1", quantity: 1 },
        { variantId: "var_stale_nonexistent_2", quantity: 3 },
      ],
    });

    assert(staleOnlyPricing.isValid === false, "All-stale cart marked isValid = false");
    assert(staleOnlyPricing.lines.length === 0, "lines array is empty");
    assert(staleOnlyPricing.items.length === 0, "items array is empty");
    assert(staleOnlyPricing.itemCount === 0, "itemCount is 0");
    assert(staleOnlyPricing.subtotalPaise === 0, "subtotalPaise is 0");
    assert(staleOnlyPricing.removed.length === 2, "Both stale lines captured in removed array");

    assert(Boolean(staleOnlyPricing.error), "Error message is present");
    assert(
      !staleOnlyPricing.error!.includes("var_stale"),
      `Error string does NOT contain raw variant ID: "${staleOnlyPricing.error}"`
    );
    assert(
      !staleOnlyPricing.error!.includes("var_"),
      `Error string does NOT contain 'var_': "${staleOnlyPricing.error}"`
    );

    // -------------------------------------------------------------
    // TEST 3: Quantity Above Stock Reduced & Stock 0 Item Removed
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Quantity Exceeding Stock & Stock 0 Item (Auto-Adjustment) ---");

    // Variant with stock = 3 (Pack of 2 Medium + Medium)
    const limitedStockVariant = await db.query.productVariants.findFirst({
      where: eq(productVariants.sku, "SMP-CUP2-MD"),
    });
    assert(Boolean(limitedStockVariant && limitedStockVariant.stock === 3), "Found variant with stock = 3");

    // Variant with stock = 0 (Activity Book)
    const zeroStockVariant = await db.query.productVariants.findFirst({
      where: eq(productVariants.sku, "SMP-BOOK-ACT"),
    });
    assert(Boolean(zeroStockVariant && zeroStockVariant.stock === 0), "Found variant with stock = 0");

    const adjustedPricing = await computePricing({
      items: [
        { variantId: limitedStockVariant!.id, quantity: 8 }, // requests 8, stock is 3
        { variantId: zeroStockVariant!.id, quantity: 1 }, // stock is 0
      ],
    });

    assert(adjustedPricing.isValid === true, "computePricing succeeds with adjusted lines");
    assert(adjustedPricing.lines.length === 1, "Only 1 line remains valid");
    assert(adjustedPricing.lines[0].quantity === 3, "Requested quantity 8 reduced to available stock 3");
    assert(
      adjustedPricing.lines[0].lineTotalPaise === 3 * adjustedPricing.lines[0].effectivePricePaise,
      "Line total recomputed for adjusted quantity 3"
    );

    assert(adjustedPricing.adjusted.length === 1, "Adjusted item reported in adjusted array");
    assert(adjustedPricing.adjusted[0].variantId === limitedStockVariant!.id, "Adjusted variantId matches");
    assert(adjustedPricing.adjusted[0].from === 8, "Adjusted 'from' is 8");
    assert(adjustedPricing.adjusted[0].to === 3, "Adjusted 'to' is 3");
    assert(adjustedPricing.adjusted[0].reason === "quantity_reduced", "Adjusted reason is 'quantity_reduced'");

    assert(adjustedPricing.removed.length === 1, "Zero-stock item reported in removed array");
    assert(adjustedPricing.removed[0].variantId === zeroStockVariant!.id, "Zero-stock variantId matches");
    assert(adjustedPricing.removed[0].reason === "out_of_stock", "Zero-stock reason is 'out_of_stock'");

    assert(Boolean(adjustedPricing.notice), "Notice created for adjustment and removal");
    assert(
      adjustedPricing.notice!.includes("3 left") || adjustedPricing.notice!.includes("quantity updated"),
      `Notice communicates quantity update: "${adjustedPricing.notice}"`
    );

    // -------------------------------------------------------------
    // TEST 4: Order Creation Strict All-or-Nothing Rejection
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Order Creation Strict All-or-Nothing Rejection & Unchanged Stock ---");

    // Check baseline stock
    const [initialLimitedVariant] = await db
      .select({ stock: productVariants.stock })
      .from(productVariants)
      .where(eq(productVariants.id, limitedStockVariant!.id));
    const initialStock = initialLimitedVariant.stock;

    // A. Order with stale variant + valid variant
    const orderWithStale = await createOrder({
      items: [
        { variantId: "var_stale_at_order_time", quantity: 1 },
        { variantId: limitedStockVariant!.id, quantity: 1 },
      ],
      address: {
        fullName: "Test Shopper",
        email: "shopper@example.com",
        phone: "9876543210",
        addressLine1: "123 Test St",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
      },
      paymentMethod: "cod",
      idempotencyKey: `idem_stale_order_${Date.now()}`,
    });

    assert(orderWithStale.success === false, "Order creation rejects cart containing stale line");
    assert(
      !orderWithStale.error!.includes("var_stale_at_order_time"),
      `Order error does NOT show raw variant ID: "${orderWithStale.error}"`
    );
    assert(
      !orderWithStale.error!.includes("var_"),
      `Order error does NOT contain 'var_': "${orderWithStale.error}"`
    );

    // Verify stock is unchanged
    const [afterOrderStock1] = await db
      .select({ stock: productVariants.stock })
      .from(productVariants)
      .where(eq(productVariants.id, limitedStockVariant!.id));
    assert(
      afterOrderStock1.stock === initialStock,
      `Stock remains strictly unchanged after rejection (expected ${initialStock}, got ${afterOrderStock1.stock})`
    );

    // B. Order with excess quantity (requested 8, stock 3)
    const orderWithExcess = await createOrder({
      items: [{ variantId: limitedStockVariant!.id, quantity: 8 }],
      address: {
        fullName: "Test Shopper",
        email: "shopper@example.com",
        phone: "9876543210",
        addressLine1: "123 Test St",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
      },
      paymentMethod: "cod",
      idempotencyKey: `idem_excess_order_${Date.now()}`,
    });

    assert(orderWithExcess.success === false, "Order creation rejects excess quantity (strict check)");
    assert(
      Boolean(orderWithExcess.error && orderWithExcess.error.includes(limitedStockVariant!.name)),
      `Order error mentions product name: "${orderWithExcess.error}"`
    );
    assert(
      !orderWithExcess.error!.includes(limitedStockVariant!.id),
      "Order error does NOT leak internal variant ID"
    );

    // Verify stock is still unchanged
    const [afterOrderStock2] = await db
      .select({ stock: productVariants.stock })
      .from(productVariants)
      .where(eq(productVariants.id, limitedStockVariant!.id));
    assert(
      afterOrderStock2.stock === initialStock,
      `Stock remains strictly unchanged after second rejection (got ${afterOrderStock2.stock})`
    );

    // -------------------------------------------------------------
    // TEST 5: Persisted Store Migration & Capping
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Persisted Store Migration & Input Validation ---");

    assert(CART_STORE_VERSION === 2, "CART_STORE_VERSION is 2");

    // A. Version 0 / 1 / unversioned migration drops old cart completely
    const v0Migration = migrateCartState(
      { items: [{ variantId: "var_02_night_10", quantity: 2 }], appliedCoupon: "OLD" },
      0
    );
    assert(v0Migration.items.length === 0, "Version 0 cart entries dropped on migrate");
    assert(v0Migration.appliedCoupon === null, "Version 0 coupon cleared");

    const v1Migration = migrateCartState(
      { items: [{ variantId: "var_02_night_10", quantity: 2 }], appliedCoupon: "OLD" },
      1
    );
    assert(v1Migration.items.length === 0, "Version 1 cart entries dropped on migrate");

    // B. Version 2 validates and drops malformed entries
    const malformedInput = {
      items: [
        { variantId: "valid_variant_1", quantity: 2 },
        { variantId: "", quantity: 1 }, // empty ID
        { variantId: "bad_qty_neg", quantity: -3 }, // negative quantity
        { variantId: "bad_qty_zero", quantity: 0 }, // zero quantity
        { variantId: "bad_qty_float", quantity: 2.7 }, // float quantity
        { variantId: 12345, quantity: 1 }, // non-string variantId
        { invalidObject: true }, // missing fields
        null, // null
        "just a string", // primitive string
      ],
      appliedCoupon: "WELCOME15",
    };

    const v2Migration = migrateCartState(malformedInput, 2);
    assert(v2Migration.items.length === 1, "Only valid item retained after migration");
    assert(v2Migration.items[0].variantId === "valid_variant_1", "Valid item preserved");
    assert(v2Migration.items[0].quantity === 2, "Valid quantity preserved");
    assert(v2Migration.appliedCoupon === "WELCOME15", "Valid coupon code preserved");

    // C. Quantity capping per line (max 10)
    const excessQtyInput = {
      items: [{ variantId: "valid_variant_high", quantity: 99 }],
    };
    const cappedQtyMigration = migrateCartState(excessQtyInput, 2);
    assert(
      cappedQtyMigration.items[0].quantity === MAX_QUANTITY_PER_LINE,
      `Quantity capped at MAX_QUANTITY_PER_LINE (${MAX_QUANTITY_PER_LINE})`
    );

    // D. Max lines capping (max 20)
    const thirtyItems = Array.from({ length: 30 }, (_, i) => ({
      variantId: `var_${i}`,
      quantity: 1,
    }));
    const cappedLinesMigration = migrateCartState({ items: thirtyItems }, 2);
    assert(
      cappedLinesMigration.items.length === MAX_CART_LINES,
      `Cart lines capped at MAX_CART_LINES (${MAX_CART_LINES})`
    );

    console.log("\n=================================================");
    console.log(`PHASE 10.2 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {
        // ignore
      }
    }
  }
}

runPhase10_2TestSuite().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
