"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { z } from "zod";
import {
  createOrder,
  confirmOrderPayment,
  cancelOrderPayment,
  cleanupAbandonedOrders,
  updateOrderStatus,
  CreateOrderResult,
} from "@/lib/services/orders";
import { getUserAddresses, saveUserAddress } from "@/lib/services/addresses";
import { isOnlinePaymentConfigured, getPaymentProvider } from "@/lib/payments";
import { getSetting } from "@/lib/services/settings";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

import { checkRateLimit } from "@/lib/rateLimit";
import { validatePincodeState } from "@/lib/validation/pincode";

const checkoutActionSchema = z.object({
  customerName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  customerEmail: z.string().email("Please provide a valid email address"),
  customerPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  addressLine1: z.string().min(5, "Flat/House no. and street are required"),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit PIN code"),
  paymentMethod: z.enum(["razorpay", "cod", "mock"], {
    message: "Please choose a valid payment method",
  }),
  couponCode: z.string().optional().nullable(),
  notes: z.string().max(300, "Notes cannot exceed 300 characters").optional().nullable(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1, "Variant ID is required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "Your cart is empty"),
  idempotencyKey: z.string().min(10, "Idempotency key is required"),
  saveAddress: z.boolean().optional(),
  confirmAddressMismatch: z.boolean().optional(),
});

export type CheckoutActionInput = z.infer<typeof checkoutActionSchema>;

export async function processCheckoutAction(rawInput: unknown): Promise<CreateOrderResult> {
  try {
    // 1. Zod Validation
    const parsed = checkoutActionSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid checkout data provided.";
      return { success: false, error: firstError };
    }

    const data = parsed.data;

    // Validate PIN code against state (allows address confirmation override)
    const pinCheck = validatePincodeState(data.postalCode, data.state);
    if (!pinCheck.isValid && !data.confirmAddressMismatch) {
      return {
        success: false,
        error: pinCheck.error || "PIN code does not match the selected state.",
        warningMismatch: true,
        expectedStates: pinCheck.expectedStates,
      };
    }

    // 2. Extract Client IP
    let ip = "127.0.0.1";
    try {
      const headerList = await headers();
      const forwarded = headerList.get("x-forwarded-for");
      ip = forwarded ? forwarded.split(",")[0].trim() : headerList.get("x-real-ip") || "127.0.0.1";
    } catch {
      // Non-request context (e.g. test environment)
      ip = "127.0.0.1";
    }

    // 3. Rate Limit per IP
    const ipCheck = await checkRateLimit(`checkout_ip:${ip}`, 10, 600);
    if (!ipCheck.allowed) {
      return {
        success: false,
        error: "Too many checkout attempts from this IP address. Please wait a few minutes before trying again.",
      };
    }

    // 4. Rate Limit per Phone Number
    const phone = data.customerPhone.trim();
    const phoneCheck = await checkRateLimit(`checkout_phone:${phone}`, 5, 600);
    if (!phoneCheck.allowed) {
      return {
        success: false,
        error: "Too many checkout attempts for this phone number. Please try again shortly.",
      };
    }

    // 5. Auth / Session Check
    let session = null;
    try {
      session = await auth();
    } catch {
      session = null;
    }
    const userId = session?.user?.id || null;

    // If user asked to save address and is logged in
    if (userId && data.saveAddress) {
      try {
        await saveUserAddress(userId, {
          fullName: data.customerName,
          phone: data.customerPhone,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          isDefault: true,
        });
      } catch (err) {
        console.error("Failed to save user address on checkout:", err);
      }
    }

    // Lazy cleanup of abandoned orders in background
    cleanupAbandonedOrders().catch((err) =>
      console.error("Background abandoned orders cleanup error:", err)
    );

    // 6. Execute Order Creation in Single DB Transaction
    const result = await createOrder({
      items: data.items,
      address: {
        fullName: data.customerName,
        phone: data.customerPhone,
        email: data.customerEmail,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
      },
      paymentMethod: data.paymentMethod,
      couponCode: data.couponCode,
      notes: data.notes,
      idempotencyKey: data.idempotencyKey,
      userId,
    });

    return result;
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected checkout error occurred.",
    };
  }
}

/**
 * Client verification callback for Razorpay return modal.
 */
export async function verifyRazorpayPaymentAction(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const provider = getPaymentProvider();
  if (!provider || provider.name !== "razorpay") {
    return { success: false, error: "Razorpay provider is not active." };
  }

  const verifyResult = await provider.verifyReturn(payload);
  if (!verifyResult.ok) {
    // Tampered or invalid return
    await cancelOrderPayment({
      providerOrderId: payload.razorpay_order_id,
      paymentId: payload.razorpay_payment_id,
      reason: verifyResult.error || "Razorpay return signature verification failed.",
    });
    return { success: false, error: verifyResult.error || "Payment signature invalid." };
  }

  // Verification passed -> confirm order payment
  const confirmResult = await confirmOrderPayment({
    providerOrderId: payload.razorpay_order_id,
    paymentId: payload.razorpay_payment_id,
    signature: payload.razorpay_signature,
    gateway: "razorpay",
  });

  if (!confirmResult.ok) {
    return { success: false, error: confirmResult.error || "Failed to confirm payment." };
  }

  return {
    success: true,
    publicAccessToken: confirmResult.order?.publicAccessToken,
    orderNumber: confirmResult.order?.orderNumber,
  };
}

/**
 * Server confirmation for Mock Gateway in dev/test.
 */
export async function confirmMockPaymentAction(payload: {
  orderId: string;
  publicAccessToken: string;
  status: "success" | "fail";
}) {
  if (process.env.NODE_ENV === "production" && process.env.PAYMENT_PROVIDER === "mock") {
    throw new Error("Mock payment confirmation forbidden in production.");
  }

  const provider = getPaymentProvider();
  if (!provider || provider.name !== "mock") {
    return { success: false, error: "Mock provider is not active." };
  }

  const mockPaymentId = `mock_pay_${Date.now()}`;
  const verifyRes = await provider.verifyReturn({
    status: payload.status,
    paymentId: mockPaymentId,
  });

  if (!verifyRes.ok) {
    await cancelOrderPayment({
      orderId: payload.orderId,
      paymentId: mockPaymentId,
      reason: "Simulated payment cancellation in mock gateway.",
    });
    return { success: false, error: "Simulated payment failure." };
  }

  const confirmRes = await confirmOrderPayment({
    orderId: payload.orderId,
    paymentId: mockPaymentId,
    gateway: "mock",
  });

  if (!confirmRes.ok) {
    return { success: false, error: confirmRes.error || "Failed to confirm mock payment." };
  }

  return {
    success: true,
    publicAccessToken: confirmRes.order?.publicAccessToken,
    orderNumber: confirmRes.order?.orderNumber,
  };
}

/**
 * Returns configuration settings and saved addresses for the checkout view.
 */
export async function getCheckoutConfigAction() {
  const session = await auth();
  const userId = session?.user?.id;

  const [savedAddresses, codEnabledSetting, codMaxOrderPaiseSetting, dispatchTimeTextSetting] = await Promise.all([
    userId ? getUserAddresses(userId) : [],
    getSetting("cod_enabled", "true"),
    getSetting("cod_max_order_paise", "250000"),
    getSetting("dispatch_time_text", ""),
  ]);

  const onlineConfigured = isOnlinePaymentConfigured();
  const provider = getPaymentProvider();

  return {
    isLoggedIn: Boolean(userId),
    userEmail: session?.user?.email || "",
    userName: session?.user?.name || "",
    savedAddresses,
    onlinePaymentAvailable: onlineConfigured,
    providerName: provider?.name || null,
    codEnabled: codEnabledSetting === "true",
    codMaxOrderPaise: parseInt(codMaxOrderPaiseSetting, 10) || 250000,
    dispatchTimeText: dispatchTimeTextSetting ? dispatchTimeTextSetting.trim() : "",
  };
}

/**
 * Allows an authenticated customer to cancel their own pending order.
 */
export async function customerCancelOrderAction(orderId: string, reason?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || (order.userId !== session.user.id && order.customerEmail !== session.user.email)) {
    return { success: false, error: "Order not found or access denied." };
  }

  if (order.status !== "placed" && order.status !== "pending_payment") {
    return {
      success: false,
      error: "Only placed or pending orders can be cancelled directly. Please contact customer care for orders in progress.",
    };
  }

  const res = await updateOrderStatus({
    orderId,
    nextStatus: "cancelled",
    cancelReason: reason || "Cancelled by customer via My Account",
  });

  if (!res.ok) {
    return { success: false, error: res.error || "Failed to cancel order." };
  }

  return { success: true };
}
