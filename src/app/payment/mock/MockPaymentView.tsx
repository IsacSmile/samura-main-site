"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmMockPaymentAction } from "@/app/actions/checkout";
import { ShieldCheck, AlertCircle, ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface MockPaymentViewProps {
  orderId: string;
  token: string;
  orderNumber: string;
  amountPaise: number;
  customerName: string;
  customerEmail: string;
}

export function MockPaymentView({
  orderId,
  token,
  orderNumber,
  amountPaise,
  customerName,
  customerEmail,
}: MockPaymentViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"idle" | "success" | "fail">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSimulate = async (status: "success" | "fail") => {
    setLoading(status);
    setErrorMsg(null);

    try {
      const res = await confirmMockPaymentAction({
        orderId,
        publicAccessToken: token,
        status,
      });

      if (res.success) {
        if (status === "success") {
          router.push(`/order/${token}`);
        } else {
          setErrorMsg("Payment simulation failed as requested. Order cancelled and inventory released.");
          setLoading("idle");
        }
      } else {
        setErrorMsg(res.error || "Failed to process simulation.");
        setLoading("idle");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Network error during mock simulation.");
      setLoading("idle");
    }
  };

  const amountRupees = (amountPaise / 100).toFixed(2);

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-stone-900 text-white p-6 text-center relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Sandbox Environment</span>
        </div>
        <h1 className="text-xl font-bold font-serif">Samaura Mock Gateway</h1>
        <p className="text-xs text-stone-400 mt-1">Dev Testing & QA Sandbox (No real funds charged)</p>
      </div>

      {/* Order Info */}
      <div className="p-6 space-y-4">
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-2">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Order Reference</span>
            <span className="font-mono font-medium text-stone-900">{orderNumber}</span>
          </div>
          <div className="flex justify-between text-xs text-stone-500">
            <span>Customer</span>
            <span className="font-medium text-stone-900">{customerName}</span>
          </div>
          <div className="flex justify-between text-xs text-stone-500">
            <span>Email</span>
            <span className="font-medium text-stone-900">{customerEmail}</span>
          </div>
          <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
            <span className="text-sm font-semibold text-stone-800">Total Payable</span>
            <span className="text-2xl font-bold font-serif text-brand">₹{amountRupees}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            type="button"
            id="mock-success-btn"
            disabled={loading !== "idle"}
            onClick={() => handleSimulate("success")}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {loading === "success" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Simulate Payment Success (200 OK)</span>
          </button>

          <button
            type="button"
            id="mock-fail-btn"
            disabled={loading !== "idle"}
            onClick={() => handleSimulate("fail")}
            className="w-full py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading === "fail" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 text-stone-500" />
            )}
            <span>Simulate Payment Failure / Cancel</span>
          </button>
        </div>

        <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
            <span>Uses production confirmation path</span>
          </div>
          <Link href="/cart" className="hover:text-stone-700 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3 h-3" />
            <span>Back to cart</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
