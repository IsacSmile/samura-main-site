"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Printer,
  ShieldCheck,
  AlertCircle,
  XCircle,
  MapPin,
  CreditCard,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPaiseToRupees } from "@/lib/utils/money";
import { formatIndianPhone } from "@/lib/utils/phone";
import { customerCancelOrderAction } from "@/app/actions/checkout";

interface OrderItem {
  id: string;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  unitPricePaise: number;
  quantity: number;
  totalPricePaise: number;
}

interface CustomerOrderDetail {
  id: string;
  orderNumber: string;
  publicAccessToken: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingFeePaise: number;
  totalPaise: number;
  couponCode?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Record<string, unknown> | string;
  courierName?: string | null;
  trackingNumber?: string | null;
  notes?: string | null;
  refundNotes?: string | null;
  createdAt: Date | string;
  items: OrderItem[];
}

export function CustomerOrderDetailView({ order }: { order: CustomerOrderDetail }) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(order.status);

  // Parse shipping address snapshot safely
  let addressData: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  } = {};

  if (typeof order.shippingAddress === "object" && order.shippingAddress !== null) {
    addressData = order.shippingAddress as typeof addressData;
  } else if (typeof order.shippingAddress === "string") {
    try {
      addressData = JSON.parse(order.shippingAddress);
    } catch {
      addressData = {
        fullName: order.customerName,
        phone: order.customerPhone,
        addressLine1: order.shippingAddress,
      };
    }
  }

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
      return;
    }

    setCancelling(true);
    setCancelError(null);

    try {
      const res = await customerCancelOrderAction(order.id, "Customer requested cancellation");
      if (!res.success) {
        setCancelError(res.error || "Failed to cancel order.");
      } else {
        setCurrentStatus("cancelled");
        router.refresh();
      }
    } catch {
      setCancelError("An error occurred while attempting cancellation.");
    } finally {
      setCancelling(false);
    }
  };

  const steps = [
    { label: "Order Placed", key: "pending" },
    { label: "Confirmed", key: "confirmed" },
    { label: "Dispatched", key: "shipped" },
    { label: "Delivered", key: "delivered" },
  ];

  const getStepState = (stepKey: string) => {
    if (currentStatus === "cancelled") return "cancelled";
    if (currentStatus === "refunded") return "refunded";

    const orderHierarchy = ["pending", "confirmed", "shipped", "delivered"];
    const currentIndex = orderHierarchy.indexOf(currentStatus);
    const stepIndex = orderHierarchy.indexOf(stepKey);

    if (currentIndex >= stepIndex) return "completed";
    return "upcoming";
  };

  return (
    <div className="bg-linear-to-b from-blush/30 via-white to-white min-h-screen py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/account"
            className="inline-flex items-center text-xs font-semibold text-muted hover:text-brand transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to My Account
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/order/${order.publicAccessToken}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="blush" size="sm">
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Tax Invoice
              </Button>
            </Link>
          </div>
        </div>

        {/* Order Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blush">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink">
                  Order #{order.orderNumber}
                </h1>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                    currentStatus === "delivered"
                      ? "bg-emerald-100 text-emerald-800"
                      : currentStatus === "shipped"
                      ? "bg-sky-100 text-sky-800"
                      : currentStatus === "confirmed"
                      ? "bg-indigo-100 text-indigo-800"
                      : currentStatus === "cancelled"
                      ? "bg-rose-100 text-rose-800"
                      : currentStatus === "refunded"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-stone-100 text-stone-800"
                  }`}
                >
                  {currentStatus}
                </span>
              </div>
              <p className="text-xs text-muted">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-muted block">Order Total</span>
              <span className="font-heading font-extrabold text-xl text-ink">
                {formatPaiseToRupees(order.totalPaise)}
              </span>
              <span className="text-[10px] text-muted block">Inclusive of all taxes</span>
            </div>
          </div>

          {/* Status Stepper */}
          {currentStatus !== "cancelled" && currentStatus !== "refunded" ? (
            <div className="pt-2">
              <div className="grid grid-cols-4 gap-2 text-center">
                {steps.map((step) => {
                  const state = getStepState(step.key);
                  return (
                    <div key={step.key} className="space-y-2">
                      <div className="flex items-center justify-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            state === "completed"
                              ? "bg-brand text-white shadow-xs"
                              : "bg-stone-100 text-stone-400"
                          }`}
                        >
                          {state === "completed" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-semibold block ${
                          state === "completed" ? "text-ink" : "text-stone-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
              <XCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <span className="font-bold block capitalize">Order is {currentStatus}</span>
                <span className="text-rose-700">
                  {order.notes || "This order has been cancelled and inventory released."}
                </span>
              </div>
            </div>
          )}

          {/* Tracking info if dispatched */}
          {order.trackingNumber && (
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sky-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-xs block">Shipment Dispatched</span>
                  <p className="text-xs text-sky-800">
                    Courier: <strong>{order.courierName || "Standard Shipping"}</strong> | Tracking Number:{" "}
                    <strong className="tracking-wider">{order.trackingNumber}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {cancelError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{cancelError}</span>
          </div>
        )}

        {/* Two Column Layout: Items & Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Items Snapshot (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-pink-light shadow-xs space-y-4">
              <h3 className="font-heading font-bold text-base text-ink flex items-center gap-2">
                <Package className="w-4 h-4 text-brand" /> Items in this Order ({order.items.length})
              </h3>

              <div className="divide-y divide-blush">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-xs sm:text-sm text-ink">{item.productName}</h4>
                      {item.variantName && (
                        <p className="text-[11px] text-muted">Variant: {item.variantName}</p>
                      )}
                      <p className="text-[11px] text-muted">
                        Qty: {item.quantity} × {formatPaiseToRupees(item.unitPricePaise)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-xs sm:text-sm text-ink">
                        {formatPaiseToRupees(item.totalPricePaise)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-4 border-t border-blush space-y-2 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatPaiseToRupees(order.subtotalPaise)}</span>
                </div>
                {order.discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                    <span>-{formatPaiseToRupees(order.discountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span>Shipping Fee</span>
                  <span>
                    {order.shippingFeePaise === 0 ? "FREE" : formatPaiseToRupees(order.shippingFeePaise)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-ink pt-2 border-t border-blush">
                  <span>Total (Inclusive of Taxes)</span>
                  <span className="text-brand font-extrabold">{formatPaiseToRupees(order.totalPaise)}</span>
                </div>
              </div>
            </div>

            {/* Cancel Action if Pending */}
            {currentStatus === "pending" && (
              <div className="bg-white rounded-3xl p-6 border border-pink-light shadow-xs flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-heading font-bold text-sm text-ink">Need to cancel?</h4>
                  <p className="text-xs text-muted">
                    You can cancel this order anytime before it is confirmed and dispatched.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={cancelling}
                  onClick={handleCancelOrder}
                  className="text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300 shrink-0"
                >
                  <Ban className="w-3.5 h-3.5 mr-1" /> Cancel Order
                </Button>
              </div>
            )}
          </div>

          {/* Right Column: Address & Payment Snapshot (1 col) */}
          <div className="space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-3xl p-6 border border-pink-light shadow-xs space-y-3">
              <h3 className="font-heading font-bold text-sm text-ink flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand" /> Delivery Address
              </h3>
              <div className="text-xs text-muted leading-relaxed space-y-1">
                <p className="font-semibold text-ink">{addressData.fullName || order.customerName}</p>
                <p>{addressData.addressLine1}</p>
                {addressData.addressLine2 && <p>{addressData.addressLine2}</p>}
                <p>
                  {addressData.city}, {addressData.state} - {addressData.postalCode}
                </p>
                <p className="pt-2 text-ink font-medium">
                  Phone: {formatIndianPhone(addressData.phone || order.customerPhone)}
                </p>
              </div>
              <div className="pt-2 border-t border-blush text-[11px] text-success font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Plain, Discreet Packaging
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-3xl p-6 border border-pink-light shadow-xs space-y-3">
              <h3 className="font-heading font-bold text-sm text-ink flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-brand" /> Payment Details
              </h3>
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Payment Method</span>
                  <span className="font-semibold text-ink uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Payment Status</span>
                  <span
                    className={`font-semibold capitalize ${
                      order.paymentStatus === "paid"
                        ? "text-emerald-700"
                        : order.paymentStatus === "paid_after_cancel"
                        ? "text-rose-700"
                        : "text-amber-700"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
