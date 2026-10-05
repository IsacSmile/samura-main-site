import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// -------------------------------------------------------------
// FIX E: Ensure Tests Run on Isolated data/test.db
// -------------------------------------------------------------
const testDbPath = path.join(process.cwd(), "data", "test.db");
const prodDevDbPath = path.join(process.cwd(), "data", "samaura.db");

// Remove any leftover test DB
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

// Copy schema and base seed from clean samaura.db to test.db
fs.copyFileSync(prodDevDbPath, testDbPath);

// Set environment before any internal imports
process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.PAYMENT_PROVIDER = "mock";

async function runPhase5TestSuite() {
  console.log("=================================================");
  console.log("Running PHASE 5 Comprehensive Test Suite");
  console.log(`Database: ${process.env.DATABASE_URL}`);
  console.log("=================================================\n");

  const { createClient } = await import("@libsql/client");
  const devDbClientInit = createClient({ url: `file:${prodDevDbPath}` });
  const initialDevDbOrders = await devDbClientInit.execute("SELECT count(*) as c FROM orders");
  const initialDevDbResetTokens = await devDbClientInit.execute("SELECT count(*) as c FROM password_reset_tokens");
  const initialOrdersCount = Number(initialDevDbOrders.rows[0].c);
  const initialTokensCount = Number(initialDevDbResetTokens.rows[0].c);

  // Dynamic import so db initializes with DATABASE_URL = file:data/test.db
  const { db } = await import("@/db");
  const {
    products,
    productVariants,
    categories,
    coupons,
    orders,
    passwordResetTokens,
  } = await import("@/db/schema");
  const { eq, sql } = await import("drizzle-orm");
  const {
    createOrder,
    confirmOrderPayment,
    cancelOrderPayment,
    updateOrderStatus,
    getCustomerOrderDetail,
  } = await import("@/lib/services/orders");
  const { registerCustomer, requestPasswordReset, resetPassword } = await import("@/lib/services/auth");

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
    // Setup Test Fixtures
    // -------------------------------------------------------------
    console.log("1. Setting up test fixtures in test.db...");

    const testCategoryId = `cat_t5_${Date.now()}`;
    await db.insert(categories).values({
      id: testCategoryId,
      name: "Phase 5 Category",
      slug: `cat-phase-5-${Date.now()}`,
      isActive: true,
    });

    const testProductId = `prod_t5_${Date.now()}`;
    await db.insert(products).values({
      id: testProductId,
      categoryId: testCategoryId,
      name: "Phase 5 Soft Cotton Pads",
      slug: `prod-phase-5-${Date.now()}`,
      description: "Organic soft pads for Phase 5 tests",
      basePricePaise: 29900,
      isActive: true,
    });

    const variantId = `var_t5_${Date.now()}`;
    await db.insert(productVariants).values({
      id: variantId,
      productId: testProductId,
      name: "Pack of 10",
      sku: `SKU-P5-${Date.now()}`,
      pricePaise: 29900,
      stock: 20, // Initial stock: 20
      isDefault: true,
    });

    const couponCode = `P5COUPON_${Date.now()}`;
    await db.insert(coupons).values({
      id: `cpn_t5_${Date.now()}`,
      code: couponCode,
      discountType: "percentage",
      discountValue: 10, // 10%
      minOrderPaise: 0,
      timesUsed: 0,
      usageLimit: 100,
      isActive: true,
    });

    // Create 2 test customers
    const userA = {
      id: `usr_test_a_${Date.now()}`,
      name: "Customer A",
      email: `customer_a_${Date.now()}@example.com`,
      password: "Password123!",
      phone: "9876543210",
    };
    const regResA = await registerCustomer(userA);
    assert(regResA.success, "Customer A registered successfully");

    const userB = {
      id: `usr_test_b_${Date.now()}`,
      name: "Customer B",
      email: `customer_b_${Date.now()}@example.com`,
      password: "Password123!",
      phone: "9876543211",
    };
    const regResB = await registerCustomer(userB);
    assert(regResB.success, "Customer B registered successfully");

    // -------------------------------------------------------------
    // TEST A: Webhook/Payment arrives for CANCELLED order
    // Expected: Does NOT re-confirm, sets paymentStatus "paid_after_cancel",
    // flags isFlaggedForReview = true, leaves stock untouched.
    // -------------------------------------------------------------
    console.log("\n2. Testing Fix A: Late Payment for Cancelled Order...");

    const orderResA = await createOrder({
      items: [{ variantId, quantity: 2 }],
      address: {
        fullName: "Test Late Pay",
        email: "latepay@example.com",
        phone: "9876543210",
        addressLine1: "123 Test St",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
      },
      paymentMethod: "mock",
      idempotencyKey: `idemp_late_${Date.now()}`,
    });

    assert(orderResA.success && Boolean(orderResA.orderId), "Order for late pay created successfully");
    const lateOrderId = orderResA.orderId!;

    // Initial stock was 20, order of 2 units reduced stock to 18
    const [varAfterOrder] = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
    assert(varAfterOrder.stock === 18, `Stock reserved correctly (18 remaining, actual: ${varAfterOrder.stock})`);

    // Now cancel the order (e.g. expired after 30 mins)
    const cancelRes = await cancelOrderPayment({
      orderId: lateOrderId,
      reason: "Payment window expired",
    });
    assert(cancelRes.ok, "Order cancelled successfully");

    // Stock should be restored back to 20
    const [varAfterCancel] = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
    assert(varAfterCancel.stock === 20, `Stock restored on cancel (20, actual: ${varAfterCancel.stock})`);

    // Now simulate late payment arriving for this cancelled order
    const lateConfirmRes = await confirmOrderPayment({
      orderId: lateOrderId,
      paymentId: `late_pay_${Date.now()}`,
      gateway: "mock",
    });

    assert(lateConfirmRes.ok, "confirmOrderPayment handled late payment without throwing");

    // Fetch order from DB and inspect flags
    const [orderAfterLatePay] = await db.select().from(orders).where(eq(orders.id, lateOrderId));
    assert(
      orderAfterLatePay.status === "cancelled",
      `Order status remains 'cancelled' (actual: ${orderAfterLatePay.status})`
    );
    assert(
      orderAfterLatePay.paymentStatus === "paid_after_cancel",
      `paymentStatus is 'paid_after_cancel' (actual: ${orderAfterLatePay.paymentStatus})`
    );
    assert(
      orderAfterLatePay.isFlaggedForReview === true,
      `isFlaggedForReview is true (actual: ${orderAfterLatePay.isFlaggedForReview})`
    );
    assert(
      Boolean(orderAfterLatePay.flagReason?.includes("Late payment")),
      `flagReason contains late payment notice (actual: ${orderAfterLatePay.flagReason})`
    );

    // CRITICAL: Stock must remain untouched (still 20)
    const [varAfterLateConfirm] = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
    assert(
      varAfterLateConfirm.stock === 20,
      `Stock remains untouched after late payment (20, actual: ${varAfterLateConfirm.stock})`
    );

    // -------------------------------------------------------------
    // TEST B: Double-Cancel Idempotency & Coupon times_used decrement
    // -------------------------------------------------------------
    console.log("\n3. Testing Fix B: Double-Cancel Idempotency & Coupon Release...");

    // Create an order using the coupon
    const couponOrderRes = await createOrder({
      items: [{ variantId, quantity: 3 }],
      address: {
        fullName: "Test Coupon User",
        email: "couponuser@example.com",
        phone: "9876543210",
        addressLine1: "456 Coupon St",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
      },
      paymentMethod: "mock",
      couponCode,
      idempotencyKey: `idemp_cpn_${Date.now()}`,
    });

    assert(couponOrderRes.success, "Order with coupon created successfully");
    const couponOrderId = couponOrderRes.orderId!;

    // Stock was 20 -> now 17. Coupon times_used was 0 -> now 1.
    const [varAfterCouponOrder] = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
    const [cpnAfterOrder] = await db.select().from(coupons).where(eq(coupons.code, couponCode));
    assert(varAfterCouponOrder.stock === 17, `Stock decreased to 17 (actual: ${varAfterCouponOrder.stock})`);
    assert(cpnAfterOrder.timesUsed === 1, `Coupon timesUsed incremented to 1 (actual: ${cpnAfterOrder.timesUsed})`);

    // First cancel
    const firstCancel = await cancelOrderPayment({
      orderId: couponOrderId,
      reason: "First cancel by user",
    });
    assert(firstCancel.ok, "First cancellation succeeded");

    const [varAfterFirstCancel] = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
    const [cpnAfterFirstCancel] = await db.select().from(coupons).where(eq(coupons.code, couponCode));
    assert(varAfterFirstCancel.stock === 20, `Stock restocked to 20 (actual: ${varAfterFirstCancel.stock})`);
    assert(cpnAfterFirstCancel.timesUsed === 0, `Coupon timesUsed decremented to 0 (actual: ${cpnAfterFirstCancel.timesUsed})`);

    // SECOND CANCEL (Double-cancel idempotency)
    const secondCancel = await cancelOrderPayment({
      orderId: couponOrderId,
      reason: "Second duplicate cancel",
    });
    assert(secondCancel.ok, "Second cancellation returned ok (idempotent)");
    assert(Boolean("alreadyCancelled" in secondCancel && (secondCancel as { alreadyCancelled?: boolean }).alreadyCancelled), "Returned alreadyCancelled flag");

    const [varAfterSecondCancel] = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
    const [cpnAfterSecondCancel] = await db.select().from(coupons).where(eq(coupons.code, couponCode));
    assert(
      varAfterSecondCancel.stock === 20,
      `Stock did NOT double-restock (remains 20, actual: ${varAfterSecondCancel.stock})`
    );
    assert(
      cpnAfterSecondCancel.timesUsed === 0,
      `Coupon timesUsed did NOT double-decrement below 0 (remains 0, actual: ${cpnAfterSecondCancel.timesUsed})`
    );

    // -------------------------------------------------------------
    // TEST C: Unique Constraint on orders.idempotency_key
    // -------------------------------------------------------------
    console.log("\n4. Testing Fix C: orders.idempotency_key Unique Constraint...");

    const sharedKey = `idemp_test_key_${Date.now()}`;
    const orderNum1 = `SAM-TEST-1-${Date.now()}`;
    const orderNum2 = `SAM-TEST-2-${Date.now()}`;

    // Insert first order with sharedKey
    await db.insert(orders).values({
      id: `ord_idemp_1_${Date.now()}`,
      orderNumber: orderNum1,
      publicAccessToken: `pat_1_${Date.now()}`,
      idempotencyKey: sharedKey,
      subtotalPaise: 29900,
      totalPaise: 29900,
      paymentMethod: "cod",
      status: "placed",
      customerName: "Idemp Test 1",
      customerEmail: "idemp1@example.com",
      customerPhone: "9876543210",
      shippingAddress: "{}",
    });
    assert(true, "First order with idempotency key inserted");

    // Attempt to insert second order with same idempotency key
    let duplicateRejected = false;
    try {
      await db.insert(orders).values({
        id: `ord_idemp_2_${Date.now()}`,
        orderNumber: orderNum2,
        publicAccessToken: `pat_2_${Date.now()}`,
        idempotencyKey: sharedKey,
        subtotalPaise: 29900,
        totalPaise: 29900,
        paymentMethod: "cod",
        status: "placed",
        customerName: "Idemp Test 2",
        customerEmail: "idemp2@example.com",
        customerPhone: "9876543210",
        shippingAddress: "{}",
      });
    } catch (err: unknown) {
      const errorObj = err as { message?: string; cause?: { message?: string; code?: string }; code?: string };
      const fullError = `${errorObj?.message || ""} ${errorObj?.cause?.message || ""} ${String(errorObj?.cause || "")} ${errorObj?.code || ""} ${errorObj?.cause?.code || ""}`;
      if (fullError.includes("UNIQUE") || fullError.includes("constraint") || fullError.includes("SQLITE_CONSTRAINT")) {
        duplicateRejected = true;
      }
    }
    assert(duplicateRejected, "Duplicate idempotency key was rejected by SQLite UNIQUE constraint");

    // -------------------------------------------------------------
    // TEST D: Status State Machine Transitions
    // -------------------------------------------------------------
    console.log("\n5. Testing State Machine Status Transitions...");

    // Create a new placed order
    const smOrderRes = await createOrder({
      items: [{ variantId, quantity: 1 }],
      address: {
        fullName: "State Machine Tester",
        email: "sm@example.com",
        phone: "9876543210",
        addressLine1: "789 SM Way",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
      },
      paymentMethod: "cod",
      idempotencyKey: `idemp_sm_${Date.now()}`,
    });
    const smOrderId = smOrderRes.orderId!;

    // 1. Invalid jump: 'placed' -> 'delivered' (must be rejected)
    const invalidJump = await updateOrderStatus({
      orderId: smOrderId,
      nextStatus: "delivered",
    });
    assert(!invalidJump.ok, "Invalid transition 'placed' -> 'delivered' was rejected");

    // 2. Invalid jump: 'placed' -> 'refunded' (must be rejected)
    const invalidRefund = await updateOrderStatus({
      orderId: smOrderId,
      nextStatus: "refunded",
    });
    assert(!invalidRefund.ok, "Invalid transition 'placed' -> 'refunded' was rejected");

    // 3. Valid: 'placed' -> 'confirmed'
    const toConfirmed = await updateOrderStatus({
      orderId: smOrderId,
      nextStatus: "confirmed",
    });
    assert(toConfirmed.ok, "Valid transition 'placed' -> 'confirmed' succeeded");

    // 4. Missing tracking for 'shipped' (must be rejected)
    const shippedNoTracking = await updateOrderStatus({
      orderId: smOrderId,
      nextStatus: "shipped",
    });
    assert(!shippedNoTracking.ok, "Transition to 'shipped' without courier & tracking was rejected");

    // 5. Valid transition with courier & tracking
    const shippedWithTracking = await updateOrderStatus({
      orderId: smOrderId,
      nextStatus: "shipped",
      courierName: "BlueDart Express",
      trackingNumber: "BD99887766IN",
    });
    assert(shippedWithTracking.ok, "Transition to 'shipped' with BlueDart details succeeded");

    // 6. Valid transition: 'shipped' -> 'delivered'
    const toDelivered = await updateOrderStatus({
      orderId: smOrderId,
      nextStatus: "delivered",
    });
    assert(toDelivered.ok, "Transition to 'delivered' succeeded");

    // Verify deliveredAt is set and COD payment status is marked 'paid'
    const [deliveredOrder] = await db.select().from(orders).where(eq(orders.id, smOrderId));
    assert(Boolean(deliveredOrder.deliveredAt), "deliveredAt timestamp was set");
    assert(
      deliveredOrder.paymentStatus === "paid",
      `COD payment marked 'paid' on delivery (actual: ${deliveredOrder.paymentStatus})`
    );

    // 7. Valid transition: 'delivered' -> 'refunded' (requires refundNotes)
    const refundNoNotes = await updateOrderStatus({
      orderId: smOrderId,
      nextStatus: "refunded",
    });
    assert(!refundNoNotes.ok, "Transition to 'refunded' without refund notes was rejected");

    const refundWithNotes = await updateOrderStatus({
      orderId: smOrderId,
      nextStatus: "refunded",
      refundNotes: "Customer return due to incorrect size preference. Processed manually.",
    });
    assert(refundWithNotes.ok, "Transition to 'refunded' with notes succeeded");

    // 8. Terminal state 'refunded' cannot transition anywhere
    const afterTerminal = await updateOrderStatus({
      orderId: smOrderId,
      nextStatus: "confirmed",
    });
    assert(!afterTerminal.ok, "Transition from terminal 'refunded' state was rejected");

    // -------------------------------------------------------------
    // TEST E: Customer Data Isolation (Unauthorized order access)
    // -------------------------------------------------------------
    console.log("\n6. Testing Customer Data Isolation...");

    // Create an order for Customer A
    const orderResForA = await createOrder({
      items: [{ variantId, quantity: 1 }],
      address: {
        fullName: userA.name,
        email: userA.email,
        phone: userA.phone,
        addressLine1: "A's Private Residence",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
      },
      paymentMethod: "cod",
      userId: regResA.user?.id,
      idempotencyKey: `idemp_userA_${Date.now()}`,
    });
    const orderAId = orderResForA.orderId!;

    // Customer A accesses their own order -> SUCCESS
    const accessByA = await getCustomerOrderDetail(orderAId, regResA.user!.id, userA.email);
    assert(accessByA !== null && accessByA.id === orderAId, "Customer A can view their own order");

    // Customer B attempts to view Customer A's order -> REJECTED (returns null)
    const accessByB = await getCustomerOrderDetail(orderAId, regResB.user!.id, userB.email);
    assert(accessByB === null, "Customer B CANNOT view Customer A's order (returns null)");

    // Unauthorized anonymous access -> REJECTED
    const accessAnon = await getCustomerOrderDetail(orderAId, "wrong_user_id", "wrong@email.com");
    assert(accessAnon === null, "Arbitrary third party cannot view order (returns null)");

    // -------------------------------------------------------------
    // TEST F: Password Reset Token Expiry & Reuse
    // -------------------------------------------------------------
    console.log("\n7. Testing Password Reset Token Single-Use & Expiry...");

    // Request reset token for Customer A
    await requestPasswordReset(userA.email);

    // Fetch the token record from DB
    const [tokenRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, regResA.user!.id))
      .orderBy(sql`created_at DESC`)
      .limit(1);

    assert(Boolean(tokenRecord), "Reset token generated in database");

    // Mock an unhashed token matching the hash for direct service validation
    const rawTestToken = crypto.randomBytes(32).toString("hex");
    const testHash = crypto.createHash("sha256").update(rawTestToken).digest("hex");

    // Insert a known raw token into DB
    const testTokenId = `prt_test_${Date.now()}`;
    await db.insert(passwordResetTokens).values({
      id: testTokenId,
      userId: regResA.user!.id,
      tokenHash: testHash,
      expiresAt: new Date(Date.now() + 3600 * 1000), // Valid for 1h
    });

    // 1. Valid password reset
    const firstReset = await resetPassword(rawTestToken, "BrandNewPassword123!");
    assert(firstReset.success, "Password reset succeeded on first use");

    // 2. Attempt token reuse
    const reuseReset = await resetPassword(rawTestToken, "AnotherPassword123!");
    assert(!reuseReset.success, "Reusing already used token was rejected");
    assert(reuseReset.error?.includes("already been used") || false, "Error message confirms token reuse rejected");

    // 3. Expired token
    const expiredRawToken = crypto.randomBytes(32).toString("hex");
    const expiredHash = crypto.createHash("sha256").update(expiredRawToken).digest("hex");
    await db.insert(passwordResetTokens).values({
      id: `prt_expired_${Date.now()}`,
      userId: regResA.user!.id,
      tokenHash: expiredHash,
      expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 min ago
    });

    const expiredReset = await resetPassword(expiredRawToken, "YetAnotherPassword123!");
    assert(!expiredReset.success, "Expired token was rejected");
    assert(expiredReset.error?.includes("expired") || false, "Error message confirms expired token rejected");

    // -------------------------------------------------------------
    // Verification of Dev Database Purity (Fix E)
    // -------------------------------------------------------------
    console.log("\n8. Verifying Dev DB (data/samaura.db) Remained Untouched...");

    const { createClient } = await import("@libsql/client");
    const devDbClient = createClient({ url: `file:${prodDevDbPath}` });
    const devDbOrders = await devDbClient.execute("SELECT count(*) as c FROM orders");
    const devDbResetTokens = await devDbClient.execute("SELECT count(*) as c FROM password_reset_tokens");

    assert(Number(devDbOrders.rows[0].c) === initialOrdersCount, `Dev DB orders count unchanged (initial: ${initialOrdersCount}, actual: ${devDbOrders.rows[0].c})`);
    assert(Number(devDbResetTokens.rows[0].c) === initialTokensCount, `Dev DB password tokens count unchanged (initial: ${initialTokensCount}, actual: ${devDbResetTokens.rows[0].c})`);
  } finally {
    // -------------------------------------------------------------
    // Clean up test database
    // -------------------------------------------------------------
    console.log("\nCleaning up test.db...");
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const testDbWal = `${testDbPath}-wal`;
    const testDbShm = `${testDbPath}-shm`;
    const testDbJournal = `${testDbPath}-journal`;
    if (fs.existsSync(testDbWal)) fs.unlinkSync(testDbWal);
    if (fs.existsSync(testDbShm)) fs.unlinkSync(testDbShm);
    if (fs.existsSync(testDbJournal)) fs.unlinkSync(testDbJournal);
    console.log("Cleanup complete.");
  }

  console.log("\n=================================================");
  console.log(`Phase 5 Test Results: ${passed} passed, ${failed} failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5TestSuite().catch((err) => {
  console.error("FATAL in test suite:", err);
  process.exit(1);
});
