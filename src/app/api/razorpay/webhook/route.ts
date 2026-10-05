import { NextRequest, NextResponse } from "next/server";
import { RazorpayPaymentProvider } from "@/lib/payments/razorpay";
import { confirmOrderPayment, cancelOrderPayment } from "@/lib/services/orders";

export async function POST(req: NextRequest) {
  try {
    // 1. Read the RAW unparsed body string
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing X-Razorpay-Signature header" },
        { status: 400 }
      );
    }

    const provider = new RazorpayPaymentProvider();

    // 2. Verify webhook HMAC signature
    let eventResult;
    try {
      eventResult = await provider.verifyWebhook(rawBody, {
        "x-razorpay-signature": signature,
      });
    } catch (sigErr: unknown) {
      return NextResponse.json(
        { error: sigErr instanceof Error ? sigErr.message : "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const { eventType, providerOrderId, paymentId, amountPaise, currency, rawEvent } = eventResult;

    // 3. Process event idempotently
    if (eventType === "payment.captured" || eventType === "order.paid") {
      if (!paymentId) {
        return NextResponse.json(
          { error: "Webhook event missing payment ID" },
          { status: 400 }
        );
      }

      const result = await confirmOrderPayment({
        providerOrderId,
        paymentId,
        amountPaise,
        currency,
        signature,
        rawResponse: rawEvent,
        gateway: "razorpay",
      });

      if (!result.ok) {
        return NextResponse.json(
          { error: result.error || "Payment confirmation failed" },
          { status: 400 }
        );
      }
    } else if (eventType === "payment.failed") {
      await cancelOrderPayment({
        providerOrderId,
        paymentId,
        reason: "Received payment.failed webhook event from Razorpay",
      });
    }

    return NextResponse.json({ status: "ok", processed: true });
  } catch (err: unknown) {
    console.error("Razorpay webhook handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
