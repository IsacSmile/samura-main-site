"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatRupees } from "@/lib/utils/money";
import { formatAdminPaymentStatus } from "@/lib/utils/statusLabels";
import { updateOrderStatusAdminAction, toggleOrderFlagAdminAction } from "@/app/admin/actions/orders";
import {
  MapPin,
  Truck,
  RotateCcw,
  AlertTriangle,
  Printer,
  ArrowLeft,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import { ALLOWED_STATUS_TRANSITIONS, OrderStatus } from "@/types/orders";

export interface AdminOrderItem {
  id: string;
  orderId?: string;
  image?: string | null;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  unitPricePaise: number;
  totalPricePaise: number;
  quantity: number;
}

export interface AdminOrderPayment {
  id: string;
  gateway: string;
  transactionId?: string | null;
  amountPaise: number;
  status: string;
}

export interface AdminOrderDetailData {
  id: string;
  orderNumber: string;
  publicAccessToken: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  subtotalPaise: number;
  discountPaise: number;
  couponCode?: string | null;
  shippingFeePaise: number;
  totalPaise: number;
  currency: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  shippingAddress: Record<string, unknown> | string;
  notes?: string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  deliveredAt?: Date | string | null;
  cancelledAt?: Date | string | null;
  refundNotes?: string | null;
  isFlaggedForReview?: boolean;
  flagReason?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  items: AdminOrderItem[];
  payments?: AdminOrderPayment[];
}

interface OrderDetailViewProps {
  order: AdminOrderDetailData;
}

export function AdminOrderDetailView({ order: initialOrder }: OrderDetailViewProps) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Transition form state
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const currentStatus = order.status as OrderStatus;
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

  const handleTransition = async (nextStatus: OrderStatus) => {
    if (nextStatus === "shipped") {
      setShowShippingModal(true);
      return;
    }

    if (nextStatus === "cancelled") {
      setShowCancelModal(true);
      return;
    }

    if (nextStatus === "returned") {
      setShowReturnModal(true);
      return;
    }

    if (nextStatus === "refunded") {
      setShowRefundModal(true);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await updateOrderStatusAdminAction({
      orderId: order.id,
      nextStatus,
    });

    if (res.success && res.order) {
      setOrder({ ...order, ...res.order });
    } else {
      setErrorMsg(res.error || "Failed to update order status.");
    }
    setLoading(false);
  };

  const submitShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierName.trim() || !trackingNumber.trim()) {
      setErrorMsg("Please provide both courier partner name and tracking number.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await updateOrderStatusAdminAction({
      orderId: order.id,
      nextStatus: "shipped",
      courierName: courierName.trim(),
      trackingNumber: trackingNumber.trim(),
    });

    if (res.success && res.order) {
      setOrder({ ...order, ...res.order });
      setShowShippingModal(false);
    } else {
      setErrorMsg(res.error || "Failed to dispatch order.");
    }
    setLoading(false);
  };

  const submitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await updateOrderStatusAdminAction({
      orderId: order.id,
      nextStatus: "cancelled",
      cancelReason: cancelReason.trim() || "Cancelled by admin",
    });

    if (res.success && res.order) {
      setOrder({ ...order, ...res.order });
      setShowCancelModal(false);
    } else {
      setErrorMsg(res.error || "Failed to cancel order.");
    }
    setLoading(false);
  };

  const submitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundNotes.trim()) {
      setErrorMsg("Please enter refund reference or notes.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await updateOrderStatusAdminAction({
      orderId: order.id,
      nextStatus: "refunded",
      refundNotes: refundNotes.trim(),
    });

    if (res.success && res.order) {
      setOrder({ ...order, ...res.order });
      setShowRefundModal(false);
    } else {
      setErrorMsg(res.error || "Failed to process refund.");
    }
    setLoading(false);
  };

  const submitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await updateOrderStatusAdminAction({
      orderId: order.id,
      nextStatus: "returned",
      cancelReason: returnReason.trim() || "COD Refused / Return to Origin",
    });

    if (res.success && res.order) {
      setOrder({ ...order, ...res.order });
      setShowReturnModal(false);
    } else {
      setErrorMsg(res.error || "Failed to mark order returned.");
    }
    setLoading(false);
  };

  const toggleFlag = async () => {
    const newFlagState = !order.isFlaggedForReview;
    const res = await toggleOrderFlagAdminAction({
      orderId: order.id,
      isFlagged: newFlagState,
      flagReason: newFlagState ? "Manually flagged for administrative review" : undefined,
    });

    if (res.success) {
      setOrder({
        ...order,
        isFlaggedForReview: newFlagState,
        flagReason: newFlagState ? "Manually flagged for administrative review" : null,
      });
    }
  };

  const addr: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string | null;
    city?: string;
    state?: string;
    postalCode?: string;
  } =
    typeof order.shippingAddress === "object" && order.shippingAddress !== null
      ? (order.shippingAddress as Record<string, unknown>)
      : typeof order.shippingAddress === "string"
      ? (() => {
          try {
            return JSON.parse(order.shippingAddress);
          } catch {
            return { addressLine1: order.shippingAddress };
          }
        })()
      : {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blush">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-stone-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-ink">
                Order #{order.orderNumber}
              </h1>
              {(order.isFlaggedForReview || order.paymentStatus === "paid_after_cancel") && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Flagged
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleFlag}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              order.isFlaggedForReview
                ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                : "border-stone-200 text-stone-700 hover:bg-stone-100"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{order.isFlaggedForReview ? "Remove Flag" : "Flag for Review"}</span>
          </button>

          <Link
            href={`/admin/orders/${order.id}/invoice`}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </Link>
        </div>
      </div>

      {/* Flag Alert Notice */}
      {(order.isFlaggedForReview || order.paymentStatus === "paid_after_cancel") && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-bold">Attention Required: Order Flagged</p>
            <p className="mt-0.5">{order.flagReason || "Manual administrative inspection needed."}</p>
            {order.paymentStatus === "paid_after_cancel" && (
              <p className="mt-1 font-semibold text-red-700">
                Action: A late online payment was captured after order was cancelled. Please issue a manual refund via your gateway portal.
              </p>
            )}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* State Machine Transition Actions Bar */}
      <div className="bg-white p-5 rounded-2xl border border-pink-light shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">
              Current Status:
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blush text-brand border border-pink-light">
              {order.status.replace("_", " ")}
            </span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs font-semibold text-muted">
              Payment: <strong className="text-ink uppercase">{formatAdminPaymentStatus(order.paymentStatus)}</strong> ({order.paymentMethod})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {allowed.map((next) => (
              <button
                key={next}
                type="button"
                disabled={loading}
                onClick={() => handleTransition(next)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize ${
                  next === "confirmed"
                    ? "bg-brand text-white hover:bg-brand/90"
                    : next === "shipped"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : next === "delivered"
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : next === "cancelled"
                    ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                    : next === "refunded"
                    ? "bg-stone-200 text-stone-800 hover:bg-stone-300"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                Mark {next.replace("_", " ")}
              </button>
            ))}
            {allowed.length === 0 && (
              <span className="text-xs text-muted italic">Terminal status — no further transitions</span>
            )}
          </div>
        </div>

        {/* Courier tracking summary if shipped */}
        {order.status === "shipped" && order.trackingNumber && (
          <div className="pt-2 border-t border-blush text-xs flex items-center gap-4 text-ink">
            <div>
              <span className="text-muted">Courier: </span>
              <strong>{order.courierName}</strong>
            </div>
            <div>
              <span className="text-muted">Tracking ID: </span>
              <strong className="font-mono">{order.trackingNumber}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Details + Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Items & Snapshot */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-pink-light shadow-xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Ordered Items ({order.items.length})
            </h2>

            <div className="divide-y divide-pink-light/40">
              {order.items.map((item: AdminOrderItem) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-stone-100 relative shrink-0 overflow-hidden border border-stone-100">
                    <Image
                      src={item.image || "/samaura-logo.png"}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-ink truncate">{item.productName}</h3>
                    <p className="text-[11px] text-muted">{item.variantName}</p>
                    <p className="text-[10px] text-stone-400 font-mono">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-ink">
                      {formatRupees(item.totalPricePaise)}
                    </div>
                    <div className="text-[10px] text-muted">
                      {item.quantity} × {formatRupees(item.unitPricePaise)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className="pt-4 border-t border-pink-light space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatRupees(order.subtotalPaise)}</span>
              </div>
              {order.discountPaise > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>-{formatRupees(order.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Shipping Fee</span>
                <span>{order.shippingFeePaise === 0 ? "FREE" : formatRupees(order.shippingFeePaise)}</span>
              </div>
              <div className="pt-2 border-t border-pink-light flex justify-between items-baseline text-sm font-bold">
                <span className="text-ink">Grand Total</span>
                <span className="text-brand text-lg">{formatRupees(order.totalPaise)}</span>
              </div>
            </div>
          </div>

          {/* Payment Transactions Log */}
          <div className="bg-white rounded-3xl border border-pink-light shadow-xs p-6 space-y-3">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Payment Gateway Records ({order.payments?.length || 0})
            </h2>

            <div className="divide-y divide-pink-light/40 text-xs">
              {order.payments?.map((pay: AdminOrderPayment) => (
                <div key={pay.id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-ink uppercase">{pay.gateway}</span>
                    <span className="text-muted ml-2 font-mono text-[11px]">
                      {pay.transactionId || "No TX ID"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-ink">{formatRupees(pay.amountPaise)}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pay.status === "successful"
                          ? "bg-emerald-100 text-emerald-800"
                          : pay.status === "failed"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {pay.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Customer & Address */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-pink-light shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 text-ink font-bold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-brand" />
              <span>Customer & Shipping</span>
            </div>

            <div className="text-xs text-muted space-y-2">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase">Name</span>
                <strong className="text-ink text-sm">{order.customerName}</strong>
              </div>

              <div>
                <span className="text-stone-400 block text-[10px] uppercase">Phone</span>
                <span className="text-ink font-mono">{order.customerPhone}</span>
              </div>

              <div>
                <span className="text-stone-400 block text-[10px] uppercase">Email</span>
                <span className="text-ink">{order.customerEmail}</span>
              </div>

              <div className="pt-2 border-t border-pink-light">
                <span className="text-stone-400 block text-[10px] uppercase">Address</span>
                <p className="text-ink font-medium">{addr.addressLine1}</p>
                {addr.addressLine2 && <p className="text-muted">{addr.addressLine2}</p>}
                <p className="text-muted">
                  {addr.city}, {addr.state} - {addr.postalCode}
                </p>
              </div>

              {order.notes && (
                <div className="pt-2 border-t border-pink-light">
                  <span className="text-stone-400 block text-[10px] uppercase">Delivery Notes</span>
                  <p className="text-ink italic bg-stone-50 p-2 rounded-xl">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Dialog Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-heading font-bold text-base text-ink flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand" /> Dispatch Order
            </h3>
            <p className="text-xs text-muted">
              Enter courier tracking details. An email will be dispatched to the customer automatically.
            </p>

            <form onSubmit={submitShipping} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Courier Partner Name *
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Delhivery, Blue Dart, DTDC"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-brand"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Tracking Number / AWB *
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. DEL123456789"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-brand"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShippingModal(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  {loading ? "Dispatching..." : "Confirm & Send Tracking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Dialog Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-heading font-bold text-base text-rose-700 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" /> Cancel Order
            </h3>
            <p className="text-xs text-muted">
              Cancelling this order will automatically restore reserved stock to inventory and release any applied coupon.
            </p>

            <form onSubmit={submitCancel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Cancellation Reason (Optional)
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer requested cancellation"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700"
                >
                  {loading ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Dialog Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-heading font-bold text-base text-ink flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-brand" /> Record Manual Refund
            </h3>
            <p className="text-xs text-muted">
              Please enter the refund transaction reference or reason. Gateway API call is not executed automatically.
            </p>

            <form onSubmit={submitRefund} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Refund Reference / Notes *
                </label>
                <input
                  type="text"
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="e.g. Refunded ₹598 via Razorpay Dashboard #rfnd_123"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-brand"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs rounded-xl bg-brand text-white font-semibold hover:bg-brand/90"
                >
                  {loading ? "Saving..." : "Record Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Dialog Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-heading font-bold text-base text-amber-700 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" /> Mark Order Returned (RTO)
            </h3>
            <p className="text-xs text-muted">
              Marking this shipped order as returned will automatically restock the items back into inventory exactly once.
            </p>

            <form onSubmit={submitReturn} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Return / RTO Reason (Optional)
                </label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. COD refusal at doorstep / Customer unreachable / Return to origin"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700"
                >
                  {loading ? "Processing..." : "Confirm & Restock Items"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
