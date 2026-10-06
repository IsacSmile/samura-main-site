import { db } from "../src/db";
import { products, productVariants, categories, coupons } from "../src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { computePricing } from "../src/lib/services/pricing";
import { createOrder, confirmOrderPayment } from "../src/lib/services/orders";
import { RazorpayPaymentProvider } from "../src/lib/payments/razorpay";
import { NextRequest } from "next/server";
import { POST as razorpayWebhookPOST } from "../src/app/api/razorpay/webhook/route";

async function runPhase4Tests() {
  console.log("=================================================");
  console.log("Running PHASE 4 Test Suite");
  console.log("=================================================\n");

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

  const createdTestOrderIds: string[] = [];

  // --- Setup Test Fixtures in DB ---
  const testCategoryId = `test_cat_${Date.now()}`;
  await db.insert(categories).values({
    id: testCategoryId,
    name: "Test Category",
    slug: `test-cat-${Date.now()}`,
    isActive: true,
  });

  const testProductId = `test_prod_${Date.now()}`;
  await db.insert(products).values({
    id: testProductId,
    categoryId: testCategoryId,
    name: "Test Menstrual Product",
    slug: `test-prod-${Date.now()}`,
    description: "Comfortable soft test pads",
    basePricePaise: 29900,
    isActive: true,
  });

  // Variant 1: Normal stock (10 units), price ₹299 (29900 paise)
  const v1Id = `test_v1_${Date.now()}`;
  await db.insert(productVariants).values({
    id: v1Id,
    productId: testProductId,
    name: "Pack of 12",
    sku: `SKU-NORM-${Date.now()}`,
    pricePaise: 29900,
    stock: 10,
    isDefault: true,
  });

  // Variant 2: Zero stock (0 units)
  const v2Id = `test_v2_${Date.now()}`;
  await db.insert(productVariants).values({
    id: v2Id,
    productId: testProductId,
    name: "Pack of 24 (OOS)",
    sku: `SKU-OOS-${Date.now()}`,
    pricePaise: 49900,
    stock: 0,
    isDefault: false,
  });

  // Variant 3: Single unit stock (1 unit) for concurrency test
  const v3Id = `test_v3_${Date.now()}`;
  await db.insert(productVariants).values({
    id: v3Id,
    productId: testProductId,
    name: "Pack of 6 (Single Unit)",
    sku: `SKU-SINGLE-${Date.now()}`,
    pricePaise: 19900,
    stock: 1,
    isDefault: false,
  });

  // Test Coupon: 20% off, min order ₹500, max discount ₹200
  const couponCode = `TEST20_${Date.now()}`;
  await db.insert(coupons).values({
    id: `coup_${Date.now()}`,
    code: couponCode,
    discountType: "percentage",
    discountValue: 20,
    minOrderPaise: 50000,
    maxDiscountPaise: 20000,
    isActive: true,
  });

  // Test Coupon 2: Expired coupon
  const expiredCode = `EXPIRED_${Date.now()}`;
  await db.insert(coupons).values({
    id: `coup_exp_${Date.now()}`,
    code: expiredCode,
    discountType: "fixed_paise",
    discountValue: 5000,
    minOrderPaise: 0,
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    isActive: true,
  });

  // Test Coupon 3: Usage limit exhausted
  const limitCode = `LIMIT_${Date.now()}`;
  await db.insert(coupons).values({
    id: `coup_lim_${Date.now()}`,
    code: limitCode,
    discountType: "fixed_paise",
    discountValue: 5000,
    minOrderPaise: 0,
    usageLimit: 3,
    timesUsed: 3,
    isActive: true,
  });

  // -------------------------------------------------------------
  // Test 1: Price Tampering Rejected (Server authoritative prices)
  // -------------------------------------------------------------
  console.log("\n[TEST 1] Price Tampering Rejected:");
  {
    // Client passes variantId and qty 2. The client cannot send a lower price.
    const pricing = await computePricing({
      items: [{ variantId: v1Id, quantity: 2 }],
    });

    assert(pricing.isValid === true, "Pricing computed successfully");
    assert(
      pricing.items[0].effectivePricePaise === 29900,
      `Unit price is strictly taken from DB (29900 paise), got ${pricing.items[0].effectivePricePaise}`
    );
    assert(
      pricing.subtotalPaise === 59800,
      `Subtotal is 2 * 29900 = 59800 paise, got ${pricing.subtotalPaise}`
    );
  }

  // -------------------------------------------------------------
  // Test 2: Out of Stock & Excess Quantity Rejected
  // -------------------------------------------------------------
  console.log("\n[TEST 2] Out of Stock & Excess Quantity Rejected:");
  {
    // Attempt to price/order out of stock item
    const oosPricing = await computePricing({
      items: [{ variantId: v2Id, quantity: 1 }],
    });
    assert(oosPricing.isValid === false, "Out-of-stock item is rejected by pricing engine");
    assert(
      Boolean(oosPricing.error && oosPricing.error.includes("out of stock")),
      `Error mentions out of stock: "${oosPricing.error}"`
    );

    // Attempt to order excess quantity (requested 15, stock 10)
    const excessPricing = await computePricing({
      items: [{ variantId: v1Id, quantity: 15 }],
    });
    assert(excessPricing.isValid === false, "Quantity exceeding available stock is rejected");
    assert(
      Boolean(excessPricing.error && excessPricing.error.includes("exceeds available stock")),
      `Error mentions exceeds stock: "${excessPricing.error}"`
    );

    // Attempt createOrder with OOS item
    const oosOrder = await createOrder({
      items: [{ variantId: v2Id, quantity: 1 }],
      address: {
        fullName: "Test Customer",
        phone: "9876543210",
        email: "test@example.com",
        addressLine1: "123 Test Street",
        city: "Delhi",
        state: "Delhi",
        postalCode: "110001",
      },
      paymentMethod: "cod",
      idempotencyKey: `idem_oos_${Date.now()}`,
    });
    assert(oosOrder.success === false, "createOrder rejects out-of-stock item");
  }

  // -------------------------------------------------------------
  // Test 3: Two Concurrent Orders for the Last Unit
  // -------------------------------------------------------------
  console.log("\n[TEST 3] Two Concurrent Orders for Last Unit Race Condition:");
  {
    // v3 has exactly 1 unit in stock
    const orderInput1 = {
      items: [{ variantId: v3Id, quantity: 1 }],
      address: {
        fullName: "Racer One",
        phone: "9876543211",
        email: "racer1@example.com",
        addressLine1: "Speed Way 1",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
      },
      paymentMethod: "cod" as const,
      idempotencyKey: `idem_race_1_${Date.now()}`,
    };

    const orderInput2 = {
      items: [{ variantId: v3Id, quantity: 1 }],
      address: {
        fullName: "Racer Two",
        phone: "9876543212",
        email: "racer2@example.com",
        addressLine1: "Speed Way 2",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
      },
      paymentMethod: "cod" as const,
      idempotencyKey: `idem_race_2_${Date.now()}`,
    };

    // Execute concurrently
    const [res1, res2] = await Promise.all([
      createOrder(orderInput1),
      createOrder(orderInput2),
    ]);

    const successes = [res1, res2].filter((r) => r.success);
    const failures = [res1, res2].filter((r) => !r.success);

    if (res1.orderId) createdTestOrderIds.push(res1.orderId);
    if (res2.orderId) createdTestOrderIds.push(res2.orderId);

    assert(
      successes.length === 1 && failures.length === 1,
      `Exactly 1 order succeeded and 1 failed (successes: ${successes.length}, failures: ${failures.length})`
    );

    // Verify stock is now 0, not negative
    const [v3Check] = await db
      .select({ stock: productVariants.stock })
      .from(productVariants)
      .where(eq(productVariants.id, v3Id));

    assert(
      v3Check.stock === 0,
      `Remaining stock for last unit is exactly 0 (got ${v3Check.stock})`
    );
  }

  // -------------------------------------------------------------
  // Test 4: Webhook Replay & Idempotent Confirmation
  // -------------------------------------------------------------
  console.log("\n[TEST 4] Webhook Replay Does Not Double-Process:");
  {
    process.env.PAYMENT_PROVIDER = "mock";
    // Create an order for payment testing
    const testOrderRes = await createOrder({
      items: [{ variantId: v1Id, quantity: 1 }],
      address: {
        fullName: "Webhook Tester",
        phone: "9876543213",
        email: "webhook@example.com",
        addressLine1: "77 Webhook St",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
      },
      paymentMethod: "mock",
      idempotencyKey: `idem_webhook_${Date.now()}`,
    });

    assert(testOrderRes.success === true, "Order created for webhook test");
    const orderId = testOrderRes.orderId!;
    if (orderId) createdTestOrderIds.push(orderId);
    const mockPaymentId = `pay_replay_test_${Date.now()}`;

    // First confirmation call
    const firstConfirm = await confirmOrderPayment({
      orderId,
      paymentId: mockPaymentId,
      amountPaise: testOrderRes.totalPaise,
      currency: "INR",
      gateway: "mock",
    });

    assert(firstConfirm.ok === true, "First payment confirmation succeeded");
    assert(firstConfirm.order?.paymentStatus === "paid", "Order marked paid");
    assert(firstConfirm.order?.status === "placed", "Order marked placed");

    // Second confirmation call (replayed webhook event)
    const secondConfirm = await confirmOrderPayment({
      orderId,
      paymentId: mockPaymentId,
      amountPaise: testOrderRes.totalPaise,
      currency: "INR",
      gateway: "mock",
    });

    assert(secondConfirm.ok === true, "Replayed confirmation returns ok");
    assert(secondConfirm.alreadyProcessed === true, "Idempotency flag alreadyProcessed is true");
  }

  // -------------------------------------------------------------
  // Test 5: Bad Signature Returns 400
  // -------------------------------------------------------------
  console.log("\n[TEST 5] Bad Webhook Signature Returns 400:");
  {
    const fakePayload = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_bad_sig_123",
            order_id: "order_bad_sig_456",
            amount: 29900,
            currency: "INR",
          },
        },
      },
    });

    // 1. Missing header
    const reqMissing = new NextRequest("http://localhost:3000/api/razorpay/webhook", {
      method: "POST",
      body: fakePayload,
    });
    const resMissing = await razorpayWebhookPOST(reqMissing);
    assert(
      resMissing.status === 400,
      `Missing signature header returns HTTP 400 (got ${resMissing.status})`
    );

    // 2. Corrupted signature
    const reqBadSig = new NextRequest("http://localhost:3000/api/razorpay/webhook", {
      method: "POST",
      body: fakePayload,
      headers: {
        "x-razorpay-signature": "bad_hex_signature_deadbeef1234567890abcdef",
      },
    });
    const resBadSig = await razorpayWebhookPOST(reqBadSig);
    assert(
      resBadSig.status === 400,
      `Bad/tampered signature header returns HTTP 400 (got ${resBadSig.status})`
    );
  }

  // -------------------------------------------------------------
  // Test 6: Coupon Edge Cases
  // -------------------------------------------------------------
  console.log("\n[TEST 6] Coupon Edge Cases:");
  {
    // A. Expired coupon
    const expRes = await computePricing({
      items: [{ variantId: v1Id, quantity: 2 }],
      couponCode: expiredCode,
    });
    assert(
      expRes.couponDiscountPaise === 0 && Boolean(expRes.couponError?.includes("expired")),
      `Expired coupon rejected with error message: "${expRes.couponError}"`
    );

    // B. Min order amount not met (v1 price = 29900, coupon requires 50000)
    const minRes = await computePricing({
      items: [{ variantId: v1Id, quantity: 1 }], // subtotal = 29900
      couponCode: couponCode,
    });
    assert(
      minRes.couponDiscountPaise === 0 && Boolean(minRes.couponError?.includes("Minimum order")),
      `Coupon under min order threshold rejected: "${minRes.couponError}"`
    );

    // C. Valid coupon met (qty 2 -> subtotal = 59800 >= 50000)
    const validRes = await computePricing({
      items: [{ variantId: v1Id, quantity: 2 }], // subtotal = 59800
      couponCode: couponCode,
    });
    // 20% of 59800 = 11960. Max discount is 20000.
    assert(
      validRes.couponDiscountPaise === 11960,
      `Valid coupon 20% discount computed exactly (expected 11960, got ${validRes.couponDiscountPaise})`
    );

    // D. Usage limit reached
    const limitRes = await computePricing({
      items: [{ variantId: v1Id, quantity: 2 }],
      couponCode: limitCode,
    });
    assert(
      limitRes.couponDiscountPaise === 0 && Boolean(limitRes.couponError?.includes("usage limit")),
      `Coupon with exhausted usage limit rejected: "${limitRes.couponError}"`
    );
  }

  // -------------------------------------------------------------
  // Test 7: Razorpay HMAC Fixtures (Valid, Tampered, Replayed)
  // -------------------------------------------------------------
  console.log("\n[TEST 7] Razorpay HMAC Fixtures:");
  {
    const secret = "test_webhook_secret_key_fixed_12345";
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
    process.env.RAZORPAY_KEY_SECRET = secret;

    const provider = new RazorpayPaymentProvider();

    // 1. Return signature verification fixture
    const rzpOrderId = "order_fixture_123";
    const rzpPaymentId = "pay_fixture_456";
    const validReturnSig = crypto
      .createHmac("sha256", secret)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest("hex");

    const validReturnRes = await provider.verifyReturn({
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: rzpPaymentId,
      razorpay_signature: validReturnSig,
    });
    assert(validReturnRes.ok === true, "Valid Razorpay return HMAC fixture passes");

    // Tampered payment ID
    const tamperedReturnRes = await provider.verifyReturn({
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: "pay_tampered_999",
      razorpay_signature: validReturnSig,
    });
    assert(tamperedReturnRes.ok === false, "Tampered return payment ID rejected");

    // 2. Webhook raw body fixture
    const webhookPayload = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: rzpPaymentId,
            order_id: rzpOrderId,
            amount: 59800,
            currency: "INR",
          },
        },
      },
    });

    const validWebhookSig = crypto
      .createHmac("sha256", secret)
      .update(Buffer.from(webhookPayload, "utf8"))
      .digest("hex");

    const validWebhookRes = await provider.verifyWebhook(webhookPayload, {
      "x-razorpay-signature": validWebhookSig,
    });
    assert(
      validWebhookRes.eventType === "payment.captured" &&
        validWebhookRes.providerOrderId === rzpOrderId &&
        validWebhookRes.amountPaise === 59800,
      "Valid Razorpay raw webhook HMAC fixture parsed accurately"
    );

    // Tampered payload with valid signature
    let tamperedErrorCaught = false;
    try {
      await provider.verifyWebhook(webhookPayload + "tampered_data", {
        "x-razorpay-signature": validWebhookSig,
      });
    } catch {
      tamperedErrorCaught = true;
    }
    assert(tamperedErrorCaught === true, "Tampered webhook payload rejected with signature mismatch");
  }

  // -------------------------------------------------------------
  // Clean up test data
  // -------------------------------------------------------------
  try {
    const { orders, orderItems, payments } = await import("../src/db/schema");
    const { inArray } = await import("drizzle-orm");
    if (createdTestOrderIds.length > 0) {
      await db.delete(orderItems).where(inArray(orderItems.orderId, createdTestOrderIds));
      await db.delete(payments).where(inArray(payments.orderId, createdTestOrderIds));
      await db.delete(orders).where(inArray(orders.id, createdTestOrderIds));
    }
    await db.delete(productVariants).where(eq(productVariants.productId, testProductId));
    await db.delete(products).where(eq(products.id, testProductId));
    await db.delete(categories).where(eq(categories.id, testCategoryId));
  } catch {
    // ignore cleanup errors
  }

  console.log("\n=================================================");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4Tests().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
