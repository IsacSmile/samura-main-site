export type OrderStatus =
  | "pending_payment"
  | "placed"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "returned";

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["placed", "cancelled"],
  placed: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned", "cancelled"],
  delivered: ["refunded"],
  cancelled: ["refunded"], // Fix B: allows customer-cancelled paid orders to be refunded by admin with notes
  returned: ["refunded"],  // Fix E: COD refusal/RTO or returned items can transition to refunded if paid
  refunded: [],
};
