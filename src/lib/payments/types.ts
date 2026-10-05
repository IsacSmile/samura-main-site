export interface PaymentProviderOrderInput {
  orderId: string;
  orderNumber: string;
  totalPaise: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  publicAccessToken: string;
}

export interface PaymentProviderOrderResult {
  providerOrderId: string;
  clientPayload?: Record<string, unknown>;
}

export interface PaymentVerifyReturnResult {
  ok: boolean;
  paymentId?: string;
  error?: string;
}

export interface PaymentWebhookResult {
  eventType: "payment.captured" | "payment.failed" | "order.paid" | "unknown";
  providerOrderId?: string;
  paymentId?: string;
  amountPaise?: number;
  currency?: string;
  rawEvent: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  createOrder(order: PaymentProviderOrderInput): Promise<PaymentProviderOrderResult>;
  verifyReturn(payload: Record<string, unknown>): Promise<PaymentVerifyReturnResult>;
  verifyWebhook(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<PaymentWebhookResult>;
}
