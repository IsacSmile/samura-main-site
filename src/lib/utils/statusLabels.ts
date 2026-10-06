/**
 * User-friendly label formatting for order, payment, and fulfillment statuses.
 * Ensures that raw internal database enums (e.g. pending_cod, placed) are never
 * displayed in customer-facing storefront views or emails.
 */

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  placed: "Order placed",
  pending: "Order placed",
  confirmed: "Confirmed",
  shipped: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  returned: "Returned",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending_cod: "Pay on delivery",
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  refund_pending: "Refund in progress",
  paid_after_cancel: "Refund in progress",
};

export const ADMIN_PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending_cod: "Pending COD",
  pending: "Payment Pending",
  paid: "Paid",
  failed: "Payment Failed",
  refunded: "Refunded",
  refund_pending: "Refund In Progress",
  paid_after_cancel: "Paid (Cancelled)",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  razorpay: "Online Payment",
  mock: "Online Payment",
};

/**
 * Returns customer-facing label for an order lifecycle status.
 */
export function formatOrderStatus(status: string | null | undefined): string {
  if (!status) return "Unknown";
  const normalized = status.toLowerCase().trim();
  return ORDER_STATUS_LABELS[normalized] || normalized.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns customer-facing label for a payment status.
 */
export function formatPaymentStatus(paymentStatus: string | null | undefined): string {
  if (!paymentStatus) return "Unknown";
  const normalized = paymentStatus.toLowerCase().trim();
  return PAYMENT_STATUS_LABELS[normalized] || normalized.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns admin-facing detailed label for a payment status.
 */
export function formatAdminPaymentStatus(paymentStatus: string | null | undefined): string {
  if (!paymentStatus) return "Unknown";
  const normalized = paymentStatus.toLowerCase().trim();
  return ADMIN_PAYMENT_STATUS_LABELS[normalized] || normalized.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns customer-facing label for a payment method.
 */
export function formatPaymentMethod(paymentMethod: string | null | undefined): string {
  if (!paymentMethod) return "Unknown";
  const normalized = paymentMethod.toLowerCase().trim();
  return PAYMENT_METHOD_LABELS[normalized] || normalized.toUpperCase();
}
