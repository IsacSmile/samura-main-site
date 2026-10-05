import {
  PaymentProvider,
  PaymentProviderOrderInput,
  PaymentProviderOrderResult,
  PaymentVerifyReturnResult,
  PaymentWebhookResult,
} from "./types";

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  constructor() {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL: MockPaymentProvider cannot be initialized in production environment."
      );
    }
  }

  async createOrder(order: PaymentProviderOrderInput): Promise<PaymentProviderOrderResult> {
    const providerOrderId = `mock_order_${order.orderId}_${Date.now()}`;
    return {
      providerOrderId,
      clientPayload: {
        provider: "mock",
        providerOrderId,
        amountPaise: order.totalPaise,
        currency: order.currency,
        redirectUrl: `/payment/mock?token=${order.publicAccessToken}&orderId=${order.orderId}&amount=${order.totalPaise}`,
      },
    };
  }

  async verifyReturn(payload: Record<string, unknown>): Promise<PaymentVerifyReturnResult> {
    const status = payload.status as string;
    const paymentId = (payload.paymentId as string) || `mock_pay_${Date.now()}`;

    if (status === "success") {
      return {
        ok: true,
        paymentId,
      };
    }

    return {
      ok: false,
      paymentId,
      error: (payload.error as string) || "Payment was cancelled or failed by user.",
    };
  }

  async verifyWebhook(rawBody: string | Buffer): Promise<PaymentWebhookResult> {
    try {
      const bodyStr = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
      const event = JSON.parse(bodyStr);

      return {
        eventType: event.event || "payment.captured",
        providerOrderId: event.payload?.payment?.entity?.order_id || event.order_id,
        paymentId: event.payload?.payment?.entity?.id || event.payment_id,
        amountPaise: event.payload?.payment?.entity?.amount || event.amount,
        currency: event.payload?.payment?.entity?.currency || event.currency || "INR",
        rawEvent: event,
      };
    } catch (err: unknown) {
      return {
        eventType: "unknown",
        rawEvent: err,
      };
    }
  }
}
