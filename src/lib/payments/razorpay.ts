import crypto from "node:crypto";
import Razorpay from "razorpay";
import {
  PaymentProvider,
  PaymentProviderOrderInput,
  PaymentProviderOrderResult,
  PaymentVerifyReturnResult,
  PaymentWebhookResult,
} from "./types";

export class RazorpayPaymentProvider implements PaymentProvider {
  readonly name = "razorpay";
  private razorpayInstance: Razorpay | null = null;
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || "";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    if (this.keyId && this.keySecret) {
      this.razorpayInstance = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
    }
  }

  isConfigured(): boolean {
    return Boolean(this.keyId && this.keySecret);
  }

  async createOrder(order: PaymentProviderOrderInput): Promise<PaymentProviderOrderResult> {
    if (!this.razorpayInstance || !this.keyId || !this.keySecret) {
      throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured.");
    }

    try {
      const rzpOrder = await this.razorpayInstance.orders.create({
        amount: order.totalPaise,
        currency: order.currency || "INR",
        receipt: order.orderNumber,
        notes: {
          orderId: order.orderId,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
        },
      });

      return {
        providerOrderId: rzpOrder.id,
        clientPayload: {
          provider: "razorpay",
          keyId: this.keyId,
          orderId: rzpOrder.id,
          amountPaise: order.totalPaise,
          currency: order.currency || "INR",
          name: "Samaura Healthcare",
          description: `Order ${order.orderNumber}`,
          image: "/samaura-logo.png",
          prefill: {
            name: order.customerName,
            email: order.customerEmail,
            contact: order.customerPhone,
          },
          theme: {
            color: "#C8202F",
          },
        },
      };
    } catch (err: unknown) {
      throw new Error(`Razorpay order creation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async verifyReturn(payload: Record<string, unknown>): Promise<PaymentVerifyReturnResult> {
    const razorpayOrderId = payload.razorpay_order_id as string;
    const razorpayPaymentId = payload.razorpay_payment_id as string;
    const signature = payload.razorpay_signature as string;

    if (!razorpayOrderId || !razorpayPaymentId || !signature) {
      return {
        ok: false,
        error: "Missing required Razorpay return parameters.",
      };
    }

    if (!this.keySecret) {
      return {
        ok: false,
        error: "Razorpay secret is not configured on server.",
      };
    }

    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", this.keySecret)
      .update(text)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedSignature, "hex");

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return {
        ok: false,
        error: "Invalid Razorpay payment signature.",
      };
    }

    return {
      ok: true,
      paymentId: razorpayPaymentId,
    };
  }

  async verifyWebhook(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<PaymentWebhookResult> {
    const signatureHeader = headers["x-razorpay-signature"] || headers["X-Razorpay-Signature"];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

    if (!signature) {
      throw new Error("Missing X-Razorpay-Signature header in webhook request.");
    }

    if (!this.webhookSecret) {
      throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured on server.");
    }

    const rawBodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");
    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(rawBodyBuffer)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedSignature, "hex");

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new Error("Invalid Razorpay webhook signature.");
    }

    const payload = JSON.parse(rawBodyBuffer.toString("utf8"));
    const eventType = payload.event as string;

    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    let normalizedType: "payment.captured" | "payment.failed" | "order.paid" | "unknown" = "unknown";
    if (eventType === "payment.captured") normalizedType = "payment.captured";
    else if (eventType === "payment.failed") normalizedType = "payment.failed";
    else if (eventType === "order.paid") normalizedType = "order.paid";

    return {
      eventType: normalizedType,
      providerOrderId: paymentEntity?.order_id || orderEntity?.id,
      paymentId: paymentEntity?.id,
      amountPaise: paymentEntity?.amount ?? orderEntity?.amount_paid,
      currency: paymentEntity?.currency || orderEntity?.currency || "INR",
      rawEvent: payload,
    };
  }
}
