import { db } from "@/db";
import { orders, orderItems, payments } from "@/db/schema";
import { eq, and, sql, lt } from "drizzle-orm";
import crypto from "node:crypto";
import { computePricing, CartItemInput } from "@/lib/services/pricing";
import { getPaymentProvider } from "@/lib/payments";
import { getSetting } from "@/lib/services/settings";

export interface CreateOrderAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
}

export interface CreateOrderInput {
  items: CartItemInput[];
  address: CreateOrderAddress;
  paymentMethod: "razorpay" | "cod" | "mock";
  couponCode?: string | null;
  notes?: string | null;
  idempotencyKey: string;
  userId?: string | null;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  publicAccessToken?: string;
  totalPaise?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  clientPayload?: Record<string, unknown>;
  error?: string;
}

/**
 * Creates an order in ONE atomic database transaction.
 * 1. Checks idempotency key to prevent duplicate orders from rapid clicks.
 * 2. Re-computes pricing server-side (authoritative).
 * 3. Atomically decrements stock: UPDATE ... WHERE id = ? AND stock >= qty (rolls back if 0 rows affected).
 * 4. Inserts order + order_items snapshot + payment record.
 * 5. Updates coupon usage if applicable.
 * 6. Invokes payment provider if online payment.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const { items, address, paymentMethod, couponCode, notes, idempotencyKey, userId } = input;

  if (!idempotencyKey) {
    return { success: false, error: "Idempotency key is required to create an order." };
  }

  // 1. Idempotency Check: if order with this key already exists, return existing order
  const [existingOrder] = await db
    .select()
    .from(orders)
    .where(eq(orders.idempotencyKey, idempotencyKey))
    .limit(1);

  if (existingOrder) {
    return {
      success: true,
      orderId: existingOrder.id,
      orderNumber: existingOrder.orderNumber,
      publicAccessToken: existingOrder.publicAccessToken,
      totalPaise: existingOrder.totalPaise,
      paymentMethod: existingOrder.paymentMethod,
      paymentStatus: existingOrder.paymentStatus,
    };
  }

  // 2. COD Settings Validation
  if (paymentMethod === "cod") {
    const codEnabled = await getSetting("cod_enabled", "true");
    if (codEnabled !== "true") {
      return { success: false, error: "Cash on Delivery is currently disabled." };
    }
  }

  // 3. Online Payment Provider Validation
  const provider = getPaymentProvider();
  if (paymentMethod === "razorpay" || paymentMethod === "mock") {
    if (!provider) {
      return { success: false, error: "Online payment gateway is currently unavailable. Please choose Cash on Delivery." };
    }
  }

  // 4. Server-authoritative Pricing Recomputation
  const pricing = await computePricing({
    items,
    couponCode,
    address: { state: address.state, postalCode: address.postalCode },
    userId,
  });

  if (!pricing.isValid) {
    return { success: false, error: pricing.error || "Invalid items in cart." };
  }

  if (pricing.items.length === 0) {
    return { success: false, error: "Your cart is empty." };
  }

  // Check COD max limit against authoritative total
  if (paymentMethod === "cod") {
    const maxCodPaiseStr = await getSetting("cod_max_order_paise", "250000");
    const maxCodPaise = parseInt(maxCodPaiseStr, 10) || 250000;
    if (pricing.totalPaise > maxCodPaise) {
      const maxRupees = Math.floor(maxCodPaise / 100);
      return {
        success: false,
        error: `Cash on Delivery is only available for orders up to ₹${maxRupees}. Please choose online payment or reduce cart total.`,
      };
    }
  }

  const orderId = `ord_${crypto.randomBytes(12).toString("hex")}`;
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const orderNumber = `SAM-${new Date().getFullYear()}-${randomSuffix}`;
  const publicAccessToken = crypto.randomBytes(24).toString("hex");

  const initialStatus = paymentMethod === "cod" ? "placed" : "pending_payment";
  const initialPaymentStatus = paymentMethod === "cod" ? "pending_cod" : "pending";

  try {
    // Run order creation and stock decrement in ONE DB transaction
    await db.transaction(async (tx) => {
      // Step A: Atomically decrement stock for each item
      for (const item of pricing.items) {
        const updateRes = await tx.run(
          sql`UPDATE product_variants SET stock = stock - ${item.quantity} WHERE id = ${item.variantId} AND stock >= ${item.quantity}`
        );

        if (updateRes.rowsAffected === 0) {
          throw new Error(
            `Insufficient stock for "${item.productName} - ${item.variantName}". It may have just sold out.`
          );
        }
      }

      // Step B: Insert order
      await tx.insert(orders).values({
        id: orderId,
        orderNumber,
        publicAccessToken,
        idempotencyKey,
        userId: userId || null,
        status: initialStatus,
        paymentMethod,
        paymentStatus: initialPaymentStatus,
        subtotalPaise: pricing.subtotalPaise,
        discountPaise: pricing.couponDiscountPaise,
        couponCode: pricing.couponCode,
        shippingFeePaise: pricing.shippingFeePaise,
        totalPaise: pricing.totalPaise,
        currency: "INR",
        customerEmail: address.email.trim().toLowerCase(),
        customerPhone: address.phone.trim(),
        customerName: address.fullName.trim(),
        shippingAddress: JSON.stringify(address),
        notes: notes ? notes.trim() : null,
      });

      // Step C: Insert order items snapshot
      for (const item of pricing.items) {
        const itemId = `item_${crypto.randomBytes(12).toString("hex")}`;
        await tx.insert(orderItems).values({
          id: itemId,
          orderId,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          unitPricePaise: item.effectivePricePaise,
          totalPricePaise: item.lineTotalPaise,
          image: item.image,
        });
      }

      // Step D: Insert initial payment record
      const paymentId = `pay_${crypto.randomBytes(12).toString("hex")}`;
      await tx.insert(payments).values({
        id: paymentId,
        orderId,
        paymentMethod,
        amountPaise: pricing.totalPaise,
        status: "pending",
        gateway: paymentMethod,
      });

      // Step E: Update coupon usage
      if (pricing.couponCode) {
        await tx.run(
          sql`UPDATE coupons SET times_used = times_used + 1 WHERE UPPER(code) = UPPER(${pricing.couponCode})`
        );
      }
    });

    // If online payment provider is configured, create provider order
    let clientPayload: Record<string, unknown> | undefined;

    if (paymentMethod === "razorpay" || paymentMethod === "mock") {
      if (provider) {
        try {
          const providerOrder = await provider.createOrder({
            orderId,
            orderNumber,
            totalPaise: pricing.totalPaise,
            currency: "INR",
            customerName: address.fullName.trim(),
            customerEmail: address.email.trim(),
            customerPhone: address.phone.trim(),
            publicAccessToken,
          });

          // Save provider order ID
          await db
            .update(orders)
            .set({ razorpayOrderId: providerOrder.providerOrderId })
            .where(eq(orders.id, orderId));

          await db
            .update(payments)
            .set({ transactionId: providerOrder.providerOrderId })
            .where(eq(payments.orderId, orderId));

          clientPayload = providerOrder.clientPayload;
        } catch (providerErr: unknown) {
          // If provider order creation fails, cancel order & release reserved stock immediately
          await cancelOrderPayment({
            providerOrderId: undefined,
            orderId,
            reason: `Gateway order creation failed: ${providerErr instanceof Error ? providerErr.message : String(providerErr)}`,
          });
          return {
            success: false,
            error: "Failed to initiate payment gateway session. Please try again or select Cash on Delivery.",
          };
        }
      }
    }

    return {
      success: true,
      orderId,
      orderNumber,
      publicAccessToken,
      totalPaise: pricing.totalPaise,
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      clientPayload,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to process order. Please try again.",
    };
  }
}

/**
 * Server confirmation path for paid orders (called by webhook, return verification, or mock success).
 * Validates amount, currency, and transitions order to 'placed' & 'paid'.
 * Idempotent on payment ID and order state.
 */
export async function confirmOrderPayment(params: {
  providerOrderId?: string;
  orderId?: string;
  paymentId: string;
  amountPaise?: number;
  currency?: string;
  signature?: string;
  rawResponse?: unknown;
  gateway?: string;
}): Promise<{ ok: boolean; alreadyProcessed?: boolean; order?: typeof orders.$inferSelect; error?: string }> {
  const { providerOrderId, orderId, paymentId, amountPaise, currency, signature, rawResponse } = params;

  if (!providerOrderId && !orderId) {
    return { ok: false, error: "Neither providerOrderId nor orderId provided." };
  }

  const [order] = providerOrderId
    ? await db.select().from(orders).where(eq(orders.razorpayOrderId, providerOrderId)).limit(1)
    : orderId
    ? await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    : [];

  if (!order) {
    return { ok: false, error: `Order not found for providerOrderId=${providerOrderId || "N/A"} orderId=${orderId || "N/A"}` };
  }

  // Idempotency: If already marked as paid, return early
  if (order.paymentStatus === "paid") {
    return { ok: true, alreadyProcessed: true, order };
  }

  // Amount & Currency Verification
  if (amountPaise !== undefined && amountPaise !== order.totalPaise) {
    return {
      ok: false,
      error: `Payment amount mismatch: Expected ${order.totalPaise} paise, received ${amountPaise} paise.`,
    };
  }

  if (currency && currency.toUpperCase() !== order.currency.toUpperCase()) {
    return {
      ok: false,
      error: `Payment currency mismatch: Expected ${order.currency}, received ${currency}.`,
    };
  }

  // Atomic Update in Transaction
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        status: "placed",
        paymentStatus: "paid",
        razorpayPaymentId: paymentId,
        razorpaySignature: signature || null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    // Update payment record
    await tx
      .update(payments)
      .set({
        status: "successful",
        transactionId: paymentId,
        signature: signature || null,
        rawResponse: rawResponse ? JSON.stringify(rawResponse) : null,
      })
      .where(eq(payments.orderId, order.id));
  });

  const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, order.id)).limit(1);

  return { ok: true, order: updatedOrder };
}

/**
 * Cancels an order and releases reserved stock back to inventory.
 * Used on payment failure, user cancellation, or 30-min abandonment cleanup.
 */
export async function cancelOrderPayment(params: {
  providerOrderId?: string;
  orderId?: string;
  paymentId?: string;
  reason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { providerOrderId, orderId, paymentId, reason } = params;

  if (!providerOrderId && !orderId) {
    return { ok: false, error: "Missing order identifier." };
  }

  const [order] = providerOrderId
    ? await db.select().from(orders).where(eq(orders.razorpayOrderId, providerOrderId)).limit(1)
    : orderId
    ? await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    : [];

  if (!order) {
    return { ok: false, error: "Order not found." };
  }

  // If already paid, do NOT cancel automatically
  if (order.paymentStatus === "paid") {
    return { ok: false, error: "Cannot cancel an order that has already been paid." };
  }

  // If already cancelled, return ok
  if (order.status === "cancelled") {
    return { ok: true };
  }

  // Fetch all items for this order to restore stock
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  await db.transaction(async (tx) => {
    // Release stock for each item
    for (const item of items) {
      if (item.variantId) {
        await tx.run(
          sql`UPDATE product_variants SET stock = stock + ${item.quantity} WHERE id = ${item.variantId}`
        );
      }
    }

    // Mark order cancelled and payment failed
    await tx
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus: "failed",
        notes: reason ? (order.notes ? `${order.notes} | Cancel reason: ${reason}` : `Cancel reason: ${reason}`) : order.notes,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    await tx
      .update(payments)
      .set({
        status: "failed",
        transactionId: paymentId || order.razorpayOrderId || null,
      })
      .where(eq(payments.orderId, order.id));
  });

  return { ok: true };
}

/**
 * Lazy cleanup of unpaid online orders older than 30 minutes.
 * Releases reserved stock and marks them cancelled/failed.
 */
export async function cleanupAbandonedOrders(): Promise<number> {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const abandoned = await db
    .select({ id: orders.id, razorpayOrderId: orders.razorpayOrderId })
    .from(orders)
    .where(
      and(
        eq(orders.status, "pending_payment"),
        eq(orders.paymentStatus, "pending"),
        lt(orders.createdAt, thirtyMinutesAgo)
      )
    );

  let cleaned = 0;
  for (const ord of abandoned) {
    try {
      await cancelOrderPayment({
        orderId: ord.id,
        providerOrderId: ord.razorpayOrderId || undefined,
        reason: "Lazy cleanup: abandoned online payment after 30 minutes.",
      });
      cleaned++;
    } catch (err) {
      console.error(`Failed to clean abandoned order ${ord.id}:`, err);
    }
  }

  return cleaned;
}

/**
 * Retrieves safe order summary by unguessable publicAccessToken.
 * Does not expose passwords or sensitive external details.
 */
export async function getOrderByPublicToken(token: string) {
  if (!token) return null;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.publicAccessToken, token))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  let parsedAddress: Record<string, unknown> = {};
  try {
    parsedAddress = JSON.parse(order.shippingAddress);
  } catch {
    parsedAddress = { raw: order.shippingAddress };
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    publicAccessToken: order.publicAccessToken,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotalPaise: order.subtotalPaise,
    discountPaise: order.discountPaise,
    couponCode: order.couponCode,
    shippingFeePaise: order.shippingFeePaise,
    totalPaise: order.totalPaise,
    currency: order.currency,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: parsedAddress,
    createdAt: order.createdAt,
    items: items.map((i) => ({
      id: i.id,
      productName: i.productName,
      variantName: i.variantName,
      sku: i.sku,
      quantity: i.quantity,
      unitPricePaise: i.unitPricePaise,
      totalPricePaise: i.totalPricePaise,
      image: i.image,
    })),
  };
}
