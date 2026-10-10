"use client";

import { useState, useTransition } from "react";
import { Tag, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils/money";
import {
  upsertCouponAction,
  deleteCouponAction,
  toggleCouponActiveAction,
} from "@/app/admin/actions/coupons";

interface CouponRecord {
  id: string;
  code: string;
  discountType: "percentage" | "fixed_paise";
  discountValue: number;
  minOrderPaise: number;
  maxDiscountPaise: number | null;
  expiresAt: string | Date | null;
  usageLimit: number | null;
  timesUsed: number;
  isActive: boolean;
}

export function AdminCouponsView({ initialCoupons }: { initialCoupons: CouponRecord[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [editingCoupon, setEditingCoupon] = useState<Partial<CouponRecord> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const handleToggle = (coupon: CouponRecord) => {
    const nextActive = !coupon.isActive;
    startTransition(async () => {
      const res = await toggleCouponActiveAction(coupon.id, nextActive);
      if (res.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isActive: nextActive } : c))
        );
        setToast({ type: "success", title: "Status Updated", message: res.message });
      } else {
        setToast({ type: "error", title: "Failed", message: res.message });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    startTransition(async () => {
      const res = await deleteCouponAction(id);
      if (res.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        setToast({ type: "success", title: "Coupon Deleted", message: res.message });
      } else {
        setToast({ type: "error", title: "Delete Failed", message: res.message });
      }
    });
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const discountType = formData.get("discountType") as "percentage" | "fixed_paise";
    const discountValueRaw = Number(formData.get("discountValue"));
    const minOrderRupees = Number(formData.get("minOrderRupees") || 0);
    const maxDiscountRupees = formData.get("maxDiscountRupees")
      ? Number(formData.get("maxDiscountRupees"))
      : null;
    const expiresAt = formData.get("expiresAt") ? String(formData.get("expiresAt")) : null;
    const usageLimit = formData.get("usageLimit") ? Number(formData.get("usageLimit")) : null;
    const isActive = formData.get("isActive") === "true";

    const payload = {
      id: editingCoupon?.id,
      code: String(formData.get("code")).trim().toUpperCase(),
      discountType,
      discountValue: discountType === "percentage" ? discountValueRaw : Math.round(discountValueRaw * 100),
      minOrderPaise: Math.round(minOrderRupees * 100),
      maxDiscountPaise: maxDiscountRupees ? Math.round(maxDiscountRupees * 100) : null,
      expiresAt,
      usageLimit,
      isActive,
    };

    startTransition(async () => {
      const res = await upsertCouponAction(payload);
      if (res.success) {
        setToast({ type: "success", title: "Coupon Saved", message: res.message });
        setEditingCoupon(null);
        // Refresh local state
        window.location.reload();
      } else {
        setToast({ type: "error", title: "Save Failed", message: res.message });
      }
    });
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blush pb-5">
        <div>
          <h1 className="text-2xl font-serif text-ink tracking-tight font-medium flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-brand" /> Discount Coupons & Promos
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Create promotional codes, fixed discounts, and configure checkout redemption constraints.
          </p>
        </div>

        <Button
          onClick={() =>
            setEditingCoupon({
              code: "",
              discountType: "percentage",
              discountValue: 10,
              minOrderPaise: 0,
              maxDiscountPaise: null,
              usageLimit: null,
              isActive: true,
            })
          }
          className="text-xs h-10 px-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-pink-light shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-pink-light bg-blush/30 text-ink/70 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Min Order</th>
                <th className="py-3 px-4">Max Discount</th>
                <th className="py-3 px-4">Usage & Limits</th>
                <th className="py-3 px-4">Expiry</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blush">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted">
                    No discount coupons found. Create your first coupon to get started.
                  </td>
                </tr>
              ) : (
                coupons.map((cpn) => (
                  <tr key={cpn.id} className="hover:bg-blush/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-ink">
                      <span className="bg-blush px-2.5 py-1 rounded-md border border-pink-light">
                        {cpn.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brand">
                      {cpn.discountType === "percentage"
                        ? `${cpn.discountValue}% OFF`
                        : `${formatPrice(cpn.discountValue)} OFF`}
                    </td>
                    <td className="py-3.5 px-4 text-ink">
                      {cpn.minOrderPaise > 0 ? formatPrice(cpn.minOrderPaise) : "No minimum"}
                    </td>
                    <td className="py-3.5 px-4 text-muted">
                      {cpn.maxDiscountPaise ? formatPrice(cpn.maxDiscountPaise) : "Unlimited"}
                    </td>
                    <td className="py-3.5 px-4 text-ink">
                      {cpn.timesUsed} used
                      {cpn.usageLimit ? ` / ${cpn.usageLimit} limit` : " (Unlimited)"}
                    </td>
                    <td className="py-3.5 px-4 text-muted">
                      {cpn.expiresAt
                        ? new Date(cpn.expiresAt).toLocaleDateString()
                        : "No expiry"}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggle(cpn)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                          cpn.isActive
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-gray-600 bg-gray-50 border-gray-200"
                        }`}
                      >
                        {cpn.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setEditingCoupon(cpn)}
                        className="p-1.5 text-muted hover:text-brand rounded-lg border border-pink-light transition-colors"
                        title="Edit Coupon"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cpn.id)}
                        className="p-1.5 text-muted hover:text-red-600 rounded-lg border border-pink-light transition-colors"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {editingCoupon && (
        <div className="fixed inset-0 z-modal bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl"
          >
            <div className="border-b border-blush pb-3">
              <h3 className="font-heading font-bold text-lg text-ink">
                {editingCoupon.id ? "Edit Coupon" : "Create New Coupon"}
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Coupon Code</label>
                <Input
                  name="code"
                  defaultValue={editingCoupon.code || ""}
                  placeholder="e.g. SUMMER20"
                  required
                  className="uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-ink mb-1">Discount Type</label>
                  <select
                    name="discountType"
                    defaultValue={editingCoupon.discountType || "percentage"}
                    className="w-full text-xs p-2.5 rounded-xl border border-pink-light bg-white focus:outline-none focus:border-brand"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_paise">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Discount Value</label>
                  <Input
                    name="discountValue"
                    type="number"
                    defaultValue={
                      editingCoupon.discountType === "fixed_paise"
                        ? (editingCoupon.discountValue || 0) / 100
                        : editingCoupon.discountValue || 15
                    }
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-ink mb-1">Min Order Amount (₹)</label>
                  <Input
                    name="minOrderRupees"
                    type="number"
                    defaultValue={(editingCoupon.minOrderPaise || 0) / 100}
                    min={0}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Max Discount Cap (₹)</label>
                  <Input
                    name="maxDiscountRupees"
                    type="number"
                    defaultValue={
                      editingCoupon.maxDiscountPaise
                        ? editingCoupon.maxDiscountPaise / 100
                        : ""
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-ink mb-1">Usage Limit</label>
                  <Input
                    name="usageLimit"
                    type="number"
                    defaultValue={editingCoupon.usageLimit || ""}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Expiry Date</label>
                  <Input
                    name="expiresAt"
                    type="date"
                    defaultValue={
                      editingCoupon.expiresAt
                        ? new Date(editingCoupon.expiresAt).toISOString().split("T")[0]
                        : ""
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Status</label>
                <select
                  name="isActive"
                  defaultValue={editingCoupon.isActive !== false ? "true" : "false"}
                  className="w-full text-xs p-2.5 rounded-xl border border-pink-light bg-white focus:outline-none focus:border-brand"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="border-t border-blush pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink rounded-xl"
              >
                Cancel
              </button>
              <Button type="submit" disabled={isPending} className="text-xs px-5 py-2">
                {isPending ? "Saving..." : "Save Coupon"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
