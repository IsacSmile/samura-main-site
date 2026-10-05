import { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mock";
import { RazorpayPaymentProvider } from "./razorpay";

export * from "./types";
export * from "./mock";
export * from "./razorpay";

export function getPaymentProvider(): PaymentProvider | null {
  const provider = (process.env.PAYMENT_PROVIDER || "").toLowerCase().trim();

  if (provider === "mock") {
    return new MockPaymentProvider();
  }

  if (provider === "razorpay") {
    const rzp = new RazorpayPaymentProvider();
    if (rzp.isConfigured()) {
      return rzp;
    }
    // Dormant if keys are missing
    return null;
  }

  return null;
}

export function isOnlinePaymentConfigured(): boolean {
  const provider = getPaymentProvider();
  return provider !== null;
}
