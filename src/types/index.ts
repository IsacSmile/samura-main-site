export * from "@/db/schema";

export type Role = "customer" | "admin";

export type PaymentMethod = "razorpay" | "cod";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ClientCartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  image: string;
  pricePaise: number;
  salePricePaise?: number | null;
  quantity: number;
  stock: number;
}
