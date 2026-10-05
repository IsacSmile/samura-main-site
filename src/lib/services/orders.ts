import { db } from "@/db";
import { orders, orderItems, payments } from "@/db/schema";
import { eq, and, sql, lt, desc, count, sum, gte, or, like } from "drizzle-orm";
import crypto from "node:crypto";
import { computePricing, CartItemInput } from "@/lib/services/pricing";
import { getPaymentProvider } from "@/lib/payments";
import { getSetting } from "@/lib/services/settings";
import {
  sendOrderConfirmationEmail,
  sendNewOrderAdminAlertEmail,
  sendOrderStatusUpdateEmail,
} from "@/lib/email";

import { ALLOWED_STATUS_TRANSITIONS, OrderStatus } from "@/types/orders";
export * from "@/types/orders";

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
      return {
        success: false,
        error: "Online payment gateway is currently unavailable. Please choose Cash on Delivery.",
      };
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

    // Trigger asynchronous emails after DB transaction commits (never blocking response)
    const totalRupeesFormatted = `₹${(pricing.totalPaise / 100).toFixed(2)}`;
    const itemsSnapshot = pricing.items.map((i) => ({
      name: i.productName,
      variant: i.variantName,
      quantity: i.quantity,
      price: `₹${(i.lineTotalPaise / 100).toFixed(2)}`,
    }));

    if (paymentMethod === "cod") {
      sendOrderConfirmationEmail({
        to: address.email.trim().toLowerCase(),
        orderNumber,
        customerName: address.fullName.trim(),
        totalRupees: totalRupeesFormatted,
        items: itemsSnapshot,
        publicToken: publicAccessToken,
        paymentMethod: "Cash on Delivery",
      }).catch((e) => console.error("Email send failed:", e));

      sendNewOrderAdminAlertEmail({
        orderNumber,
        customerName: address.fullName.trim(),
        customerPhone: address.phone.trim(),
        totalRupees: totalRupeesFormatted,
        itemCount: pricing.itemCount,
        paymentMethod: "Cash on Delivery",
      }).catch((e) => console.error("Admin alert email failed:", e));
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
 * FIX A: If order is already cancelled or expired, do NOT re-confirm order or touch stock!
 * Set paymentStatus "paid_after_cancel", flag it in admin for manual refund, keep stock untouched.
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
}): Promise<{
  ok: boolean;
  alreadyProcessed?: boolean;
  paidAfterCancel?: boolean;
  order?: typeof orders.$inferSelect;
  error?: string;
}> {
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
    return {
      ok: false,
      error: `Order not found for providerOrderId=${providerOrderId || "N/A"} orderId=${orderId || "N/A"}`,
    };
  }

  // Idempotency: If already marked as paid or paid_after_cancel, return early
  if (order.paymentStatus === "paid" || order.paymentStatus === "paid_after_cancel") {
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

  // FIX A: If order was already cancelled or expired, set paymentStatus 'paid_after_cancel',
  // flag for admin manual refund, and KEEP STOCK UNTOUCHED!
  if (order.status === "cancelled") {
    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({
          paymentStatus: "paid_after_cancel",
          isFlaggedForReview: true,
          flagReason: "Late payment arrived after order was already cancelled. Manual refund required.",
          razorpayPaymentId: paymentId,
          razorpaySignature: signature || null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

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
    return { ok: true, paidAfterCancel: true, order: updatedOrder };
  }

  // Normal Successful Online Payment: Atomic Update in Transaction
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

  // Trigger customer confirmation and admin alert emails asynchronously
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const totalRupeesFormatted = `₹${(order.totalPaise / 100).toFixed(2)}`;

  sendOrderConfirmationEmail({
    to: order.customerEmail,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    totalRupees: totalRupeesFormatted,
    items: items.map((i) => ({
      name: i.productName,
      variant: i.variantName,
      quantity: i.quantity,
      price: `₹${(i.totalPricePaise / 100).toFixed(2)}`,
    })),
    publicToken: order.publicAccessToken,
    paymentMethod: order.paymentMethod === "razorpay" ? "Online (Razorpay)" : "Online (Mock)",
  }).catch((e) => console.error("Email send failed:", e));

  sendNewOrderAdminAlertEmail({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    totalRupees: totalRupeesFormatted,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    paymentMethod: order.paymentMethod,
  }).catch((e) => console.error("Admin alert email failed:", e));

  return { ok: true, order: updatedOrder };
}

/**
 * Cancels an order and releases reserved stock back to inventory.
 * FIX B: Idempotent! Restocks and decrements coupons.times_used exactly once.
 */
export async function cancelOrderPayment(params: {
  providerOrderId?: string;
  orderId?: string;
  paymentId?: string;
  reason?: string;
}): Promise<{ ok: boolean; alreadyCancelled?: boolean; error?: string }> {
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

  // FIX B: If already cancelled, return early without restocking or decrementing coupon again!
  if (order.status === "cancelled") {
    return { ok: true, alreadyCancelled: true };
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

    // FIX B: Decrement coupons.times_used if coupon was applied
    if (order.couponCode) {
      await tx.run(
        sql`UPDATE coupons SET times_used = MAX(0, times_used - 1) WHERE UPPER(code) = UPPER(${order.couponCode})`
      );
    }

    // Mark order cancelled and payment failed
    await tx
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus: "failed",
        cancelledAt: new Date(),
        notes: reason
          ? order.notes
            ? `${order.notes} | Cancel reason: ${reason}`
            : `Cancel reason: ${reason}`
          : order.notes,
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
 * Server-side status transitions enforced per the documented state machine.
 */
export async function updateOrderStatus(params: {
  orderId: string;
  nextStatus: OrderStatus;
  courierName?: string;
  trackingNumber?: string;
  refundNotes?: string;
  cancelReason?: string;
}): Promise<{ ok: boolean; order?: typeof orders.$inferSelect; error?: string }> {
  const { orderId, nextStatus, courierName, trackingNumber, refundNotes, cancelReason } = params;

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

  if (!order) {
    return { ok: false, error: "Order not found." };
  }

  const currentStatus = order.status as OrderStatus;
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    return {
      ok: false,
      error: `Invalid status transition from "${currentStatus}" to "${nextStatus}". Allowed: [${allowed.join(", ")}].`,
    };
  }

  // 1. Transition to CANCELLED: use cancelOrderPayment to restock and release coupon
  if (nextStatus === "cancelled") {
    const cancelRes = await cancelOrderPayment({
      orderId,
      reason: cancelReason || "Cancelled by admin or customer",
    });

    if (!cancelRes.ok) {
      return { ok: false, error: cancelRes.error };
    }

    const [cancelledOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    // Send cancellation email
    sendOrderStatusUpdateEmail({
      to: order.customerEmail,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: "cancelled",
      cancelReason,
      publicToken: order.publicAccessToken,
    }).catch((e) => console.error("Cancellation email error:", e));

    return { ok: true, order: cancelledOrder };
  }

  // 2. Transition to SHIPPED: requires courier partner and tracking number
  if (nextStatus === "shipped") {
    if (!courierName?.trim() || !trackingNumber?.trim()) {
      return {
        ok: false,
        error: "Updating status to Shipped requires both Courier Name and Tracking Number.",
      };
    }

    await db
      .update(orders)
      .set({
        status: "shipped",
        courierName: courierName.trim(),
        trackingNumber: trackingNumber.trim(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    const [shippedOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    // Send dispatched email with tracking info
    sendOrderStatusUpdateEmail({
      to: order.customerEmail,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: "shipped",
      courierName: courierName.trim(),
      trackingNumber: trackingNumber.trim(),
      publicToken: order.publicAccessToken,
    }).catch((e) => console.error("Shipped email error:", e));

    return { ok: true, order: shippedOrder };
  }

  // 3. Transition to DELIVERED: set deliveredAt, if COD set paymentStatus 'paid'
  if (nextStatus === "delivered") {
    const updates: Partial<typeof orders.$inferInsert> = {
      status: "delivered",
      deliveredAt: new Date(),
      updatedAt: new Date(),
    };

    if (order.paymentMethod === "cod") {
      updates.paymentStatus = "paid";
    }

    await db.update(orders).set(updates).where(eq(orders.id, orderId));

    const [deliveredOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    sendOrderStatusUpdateEmail({
      to: order.customerEmail,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: "delivered",
      publicToken: order.publicAccessToken,
    }).catch((e) => console.error("Delivered email error:", e));

    return { ok: true, order: deliveredOrder };
  }

  // 4. Transition to REFUNDED: requires refund note
  if (nextStatus === "refunded") {
    if (!refundNotes?.trim()) {
      return {
        ok: false,
        error: "Recording a refund requires a note explaining the reason/reference.",
      };
    }

    await db
      .update(orders)
      .set({
        status: "refunded",
        paymentStatus: "refunded",
        refundNotes: refundNotes.trim(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    const [refundedOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    return { ok: true, order: refundedOrder };
  }

  // 5. Standard transition (e.g. placed -> confirmed)
  await db
    .update(orders)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  const [finalOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return { ok: true, order: finalOrder };
}

/**
 * Lazy cleanup of unpaid online orders older than 30 minutes.
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
 */
export async function getOrderByPublicToken(token: string) {
  if (!token) return null;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.publicAccessToken, token))
    .limit(1);

  if (!order) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  let parsedAddress: Record<string, unknown> = {};
  try {
    parsedAddress = JSON.parse(order.shippingAddress);
  } catch {
    parsedAddress = { raw: order.shippingAddress };
  }

  return {
    ...order,
    shippingAddress: parsedAddress,
    items,
  };
}

/**
 * Admin: List orders with filters, search, and pagination.
 */
export async function getAdminOrders(params: {
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 20));
  const offset = (page - 1) * limit;

  const conditions = [];

  if (params.status && params.status !== "all") {
    conditions.push(eq(orders.status, params.status as (typeof orders.$inferSelect)["status"]));
  }

  if (params.paymentMethod && params.paymentMethod !== "all") {
    conditions.push(eq(orders.paymentMethod, params.paymentMethod as (typeof orders.$inferSelect)["paymentMethod"]));
  }

  if (params.paymentStatus && params.paymentStatus !== "all") {
    conditions.push(eq(orders.paymentStatus, params.paymentStatus as (typeof orders.$inferSelect)["paymentStatus"]));
  }

  if (params.search && params.search.trim()) {
    const q = `%${params.search.trim()}%`;
    conditions.push(
      or(
        like(orders.orderNumber, q),
        like(orders.customerPhone, q),
        like(orders.customerEmail, q),
        like(orders.customerName, q)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRes] = await db
    .select({ count: count() })
    .from(orders)
    .where(whereClause);

  const orderRows = await db
    .select()
    .from(orders)
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    orders: orderRows,
    total: totalRes?.count || 0,
    page,
    limit,
    totalPages: Math.ceil((totalRes?.count || 0) / limit),
  };
}

/**
 * Admin: Detail view of an order with snapshot items, address, and payments.
 */
export async function getAdminOrderDetail(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;

  const [items, paymentsList] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(payments).where(eq(payments.orderId, order.id)).orderBy(desc(payments.createdAt)),
  ]);

  let parsedAddress: Record<string, unknown> = {};
  try {
    parsedAddress = JSON.parse(order.shippingAddress);
  } catch {
    parsedAddress = { raw: order.shippingAddress };
  }

  return {
    ...order,
    shippingAddress: parsedAddress,
    items,
    payments: paymentsList,
  };
}

/**
 * Admin Dashboard Metrics: orders today, pending orders, flagged paid_after_cancel, revenue.
 */
export async function getAdminDashboardMetrics() {
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const [
    todayRes,
    pendingRes,
    flaggedRes,
    revenueRes,
  ] = await Promise.all([
    // Orders today
    db.select({ count: count() }).from(orders).where(gte(orders.createdAt, todayMidnight)),
    // Pending orders
    db
      .select({ count: count() })
      .from(orders)
      .where(or(eq(orders.status, "pending_payment"), eq(orders.status, "placed"), eq(orders.status, "confirmed"))),
    // Flagged orders (paid_after_cancel or isFlaggedForReview)
    db
      .select({ count: count() })
      .from(orders)
      .where(or(eq(orders.paymentStatus, "paid_after_cancel"), eq(orders.isFlaggedForReview, true))),
    // Revenue (paid or delivered only)
    db
      .select({ revenue: sum(orders.totalPaise) })
      .from(orders)
      .where(or(eq(orders.paymentStatus, "paid"), eq(orders.status, "delivered"))),
  ]);

  return {
    ordersToday: todayRes[0]?.count || 0,
    pendingOrders: pendingRes[0]?.count || 0,
    flaggedOrders: flaggedRes[0]?.count || 0,
    totalRevenuePaise: Number(revenueRes[0]?.revenue || 0),
  };
}

/**
 * Customer: Retrieve orders belonging strictly to the customer.
 */
export async function getCustomerOrders(userId: string, email: string) {
  if (!userId && !email) return [];

  const userConditions = [];
  if (userId) userConditions.push(eq(orders.userId, userId));
  if (email) userConditions.push(eq(orders.customerEmail, email.toLowerCase().trim()));

  const userOrders = await db
    .select()
    .from(orders)
    .where(or(...userConditions))
    .orderBy(desc(orders.createdAt));

  return userOrders;
}

/**
 * Customer: Retrieve detailed view of customer's own order.
 * Ensures data isolation: rejects if order does not belong to this user.
 */
export async function getCustomerOrderDetail(orderId: string, userId: string, email?: string | null) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

  if (!order) return null;

  // Authorization check
  const isOwner =
    (userId && order.userId === userId) ||
    (email && order.customerEmail.toLowerCase() === email.toLowerCase());

  if (!isOwner) {
    return null; // Forbidden / not found to prevent data enumeration
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  let parsedAddress: Record<string, unknown> = {};
  try {
    parsedAddress = JSON.parse(order.shippingAddress);
  } catch {
    parsedAddress = { raw: order.shippingAddress };
  }

  return {
    ...order,
    shippingAddress: parsedAddress,
    items,
  };
}

/**
 * Links past guest orders with matching email to a newly registered user account.
 */
export async function linkGuestOrdersToUser(userId: string, email: string) {
  if (!userId || !email) return 0;

  const res = await db.run(
    sql`UPDATE orders SET user_id = ${userId} WHERE LOWER(customer_email) = LOWER(${email.trim()}) AND user_id IS NULL`
  );

  return res.rowsAffected;
}
