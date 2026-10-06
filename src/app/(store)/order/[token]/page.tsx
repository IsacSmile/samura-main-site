import React from "react";
import { notFound } from "next/navigation";
import { getOrderByPublicToken } from "@/lib/services/orders";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Banknote,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Status | Samaura Healthcare",
  description: "View details and status updates for your Samaura order.",
  robots: { index: false, follow: false },
};

interface OrderConfirmationPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { token } = await params;
  const order = await getOrderByPublicToken(token);

  if (!order) {
    notFound();
  }

  const isCod = order.paymentMethod === "cod";
  const isPendingPayment = order.status === "pending_payment";
  const isCancelled = order.status === "cancelled";

  const getStatusBadge = () => {
    switch (order.status) {
      case "placed":
        return {
          label: "Order Placed",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle,
        };
      case "confirmed":
        return {
          label: "Confirmed",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle,
        };
      case "shipped":
        return {
          label: "Shipped",
          color: "bg-blue-50 text-blue-700 border-blue-200",
          icon: Truck,
        };
      case "delivered":
        return {
          label: "Delivered",
          color: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: Package,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: "bg-rose-50 text-rose-700 border-rose-200",
          icon: AlertCircle,
        };
      case "refunded":
        return {
          label: "Refunded",
          color: "bg-stone-100 text-stone-700 border-stone-300",
          icon: Clock,
        };
      case "pending_payment":
      default:
        return {
          label: "Awaiting Payment",
          color: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Clock,
        };
    }
  };

  const getPaymentStatusBadge = () => {
    switch (order.paymentStatus) {
      case "paid":
        return { label: "Paid Online", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "pending_cod":
        return { label: "Pay on Delivery (COD)", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "failed":
        return { label: "Payment Failed", color: "bg-rose-50 text-rose-700 border-rose-200" };
      case "refunded":
        return { label: "Refunded", color: "bg-stone-100 text-stone-700 border-stone-300" };
      case "pending":
      default:
        return { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;
  const payBadge = getPaymentStatusBadge();

  const addr = (order.shippingAddress as Record<string, string>) || {};

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Confirmation Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <StatusIcon className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
            {isCancelled
              ? "Order Cancelled"
              : isPendingPayment
              ? "Payment Incomplete"
              : "Thank you for your order!"}
          </h1>

          <p className="text-sm text-stone-500 mt-2 max-w-md mx-auto">
            {isCancelled
              ? "This order was cancelled and no payment was charged. Reserved stock has been released."
              : isPendingPayment
              ? "We are awaiting confirmation of your payment. If you experienced an issue, you can retry checkout."
              : `Your order has been received and is being prepared for discreet dispatch.`}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <div className="px-4 py-1.5 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-medium">
              Order #{order.orderNumber}
            </div>

            <div
              className={`px-3 py-1.5 rounded-full border text-xs font-medium inline-flex items-center gap-1.5 ${statusBadge.color}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusBadge.label}</span>
            </div>

            <div className={`px-3 py-1.5 rounded-full border text-xs font-medium ${payBadge.color}`}>
              <span>{payBadge.label}</span>
            </div>
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-stone-800 font-semibold text-sm">
              <MapPin className="w-4 h-4 text-brand" />
              <span>Delivery Address</span>
            </div>
            <div className="text-xs text-stone-600 space-y-1">
              <p className="font-medium text-stone-900">{order.customerName}</p>
              <p>{addr.addressLine1}</p>
              {addr.addressLine2 && <p>{addr.addressLine2}</p>}
              <p>
                {addr.city}, {addr.state} - {addr.postalCode}
              </p>
              <p className="pt-1 text-stone-500">Phone: {order.customerPhone}</p>
              <p className="text-stone-500">Email: {order.customerEmail}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-stone-800 font-semibold text-sm">
              {isCod ? (
                <Banknote className="w-4 h-4 text-brand" />
              ) : (
                <CreditCard className="w-4 h-4 text-brand" />
              )}
              <span>Payment Details</span>
            </div>
            <div className="text-xs text-stone-600 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-500">Method</span>
                <span className="font-medium text-stone-900 uppercase">
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery (COD)"
                    : order.paymentMethod === "razorpay"
                    ? "Razorpay Online"
                    : "Mock Online Gateway"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Status</span>
                <span className="font-medium text-stone-900 capitalize">
                  {order.paymentStatus.replace("_", " ")}
                </span>
              </div>
              <div className="pt-2 text-[11px] text-stone-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                <span>Discreet billing and packaging guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <h2 className="text-base font-semibold text-stone-900">Ordered Items ({order.items.length})</h2>
            <span className="text-xs text-stone-400">All prices inclusive of taxes</span>
          </div>

          <div className="divide-y divide-stone-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-100 relative shrink-0 overflow-hidden">
                  <Image
                    src={item.image || "/samaura-logo.png"}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-stone-900 truncate">{item.productName}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">{item.variantName}</p>
                  <p className="text-[11px] text-stone-400 font-mono mt-0.5">SKU: {item.sku}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-stone-900">
                    ₹{(item.totalPricePaise / 100).toFixed(2)}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    Qty: {item.quantity} × ₹{(item.unitPricePaise / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="pt-6 border-t border-stone-200 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>₹{(order.subtotalPaise / 100).toFixed(2)}</span>
            </div>

            {order.discountPaise > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                <span>-₹{(order.discountPaise / 100).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-600">
              <span>Shipping Fee</span>
              <span>
                {order.shippingFeePaise === 0
                  ? "FREE"
                  : `₹${(order.shippingFeePaise / 100).toFixed(2)}`}
              </span>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline text-sm">
              <span className="font-semibold text-stone-900">Total Paid / Payable</span>
              <span className="text-xl font-bold font-serif text-brand">
                ₹{(order.totalPaise / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Link
            href="/contact"
            className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Need assistance with your order? Contact Support</span>
          </Link>

          <Link
            href="/shop"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
