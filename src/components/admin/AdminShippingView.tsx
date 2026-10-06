"use client";

import { useState, useTransition } from "react";
import { Truck, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils/money";
import {
  upsertShippingRuleAction,
  deleteShippingRuleAction,
} from "@/app/admin/actions/shipping";

interface ShippingRuleRecord {
  id: string;
  name: string;
  minOrderPaise: number;
  maxOrderPaise: number | null;
  feePaise: number;
  isDefault: boolean;
  isActive: boolean;
}

export function AdminShippingView({ initialRules }: { initialRules: ShippingRuleRecord[] }) {
  const [rules, setRules] = useState(initialRules);
  const [editingRule, setEditingRule] = useState<Partial<ShippingRuleRecord> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this shipping rule?")) return;
    startTransition(async () => {
      const res = await deleteShippingRuleAction(id);
      if (res.success) {
        setRules((prev) => prev.filter((r) => r.id !== id));
        setToast({ type: "success", title: "Rule Deleted", message: res.message });
      } else {
        setToast({ type: "error", title: "Delete Failed", message: res.message });
      }
    });
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const minOrderRupees = Number(formData.get("minOrderRupees") || 0);
    const maxOrderRupees = formData.get("maxOrderRupees")
      ? Number(formData.get("maxOrderRupees"))
      : null;
    const feeRupees = Number(formData.get("feeRupees") || 0);

    const payload = {
      id: editingRule?.id,
      name: String(formData.get("name")),
      minOrderPaise: Math.round(minOrderRupees * 100),
      maxOrderPaise: maxOrderRupees ? Math.round(maxOrderRupees * 100) : null,
      feePaise: Math.round(feeRupees * 100),
      isDefault: formData.get("isDefault") === "true",
      isActive: formData.get("isActive") === "true",
    };

    startTransition(async () => {
      const res = await upsertShippingRuleAction(payload);
      if (res.success) {
        setToast({ type: "success", title: "Rule Saved", message: res.message });
        setEditingRule(null);
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
            <Truck className="w-6 h-6 text-brand" /> Shipping & Delivery Rules
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Configure tiered delivery fees, free shipping thresholds, and default carrier rates.
          </p>
        </div>

        <Button
          onClick={() =>
            setEditingRule({
              name: "",
              minOrderPaise: 0,
              maxOrderPaise: null,
              feePaise: 5000,
              isDefault: false,
              isActive: true,
            })
          }
          className="text-xs h-10 px-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Shipping Rule
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-pink-light shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-pink-light bg-blush/30 text-ink/70 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Order Range</th>
                <th className="py-3 px-4">Delivery Fee</th>
                <th className="py-3 px-4">Default Rule</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blush">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No shipping rules defined yet.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-blush/20 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-ink">{rule.name}</td>
                    <td className="py-3.5 px-4 text-ink">
                      {formatPrice(rule.minOrderPaise)}
                      {rule.maxOrderPaise ? ` – ${formatPrice(rule.maxOrderPaise)}` : " and above"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand">
                      {rule.feePaise === 0 ? "FREE" : formatPrice(rule.feePaise)}
                    </td>
                    <td className="py-3.5 px-4">
                      {rule.isDefault ? (
                        <span className="text-[10px] font-bold uppercase bg-brand/10 text-brand px-2 py-0.5 rounded-full border border-pink-light">
                          Default
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                          rule.isActive
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-gray-600 bg-gray-50 border-gray-200"
                        }`}
                      >
                        {rule.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setEditingRule(rule)}
                        className="p-1.5 text-muted hover:text-brand rounded-lg border border-pink-light transition-colors"
                        title="Edit Rule"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 text-muted hover:text-red-600 rounded-lg border border-pink-light transition-colors"
                        title="Delete Rule"
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

      {/* Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl"
          >
            <div className="border-b border-blush pb-3">
              <h3 className="font-heading font-bold text-lg text-ink">
                {editingRule.id ? "Edit Shipping Rule" : "Add Shipping Rule"}
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Rule Name</label>
                <Input
                  name="name"
                  defaultValue={editingRule.name || ""}
                  placeholder="e.g. Free Discreet Delivery over ₹499"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-ink mb-1">Min Order Amount (₹)</label>
                  <Input
                    name="minOrderRupees"
                    type="number"
                    defaultValue={(editingRule.minOrderPaise || 0) / 100}
                    min={0}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Max Order Amount (₹)</label>
                  <Input
                    name="maxOrderRupees"
                    type="number"
                    defaultValue={
                      editingRule.maxOrderPaise ? editingRule.maxOrderPaise / 100 : ""
                    }
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Delivery Fee (₹)</label>
                <Input
                  name="feeRupees"
                  type="number"
                  defaultValue={(editingRule.feePaise || 0) / 100}
                  min={0}
                  required
                />
                <p className="text-[10px] text-muted mt-1">Set to 0 for Free Shipping.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-ink mb-1">Default Rule</label>
                  <select
                    name="isDefault"
                    defaultValue={editingRule.isDefault ? "true" : "false"}
                    className="w-full text-xs p-2.5 rounded-xl border border-pink-light bg-white focus:outline-none focus:border-brand"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes (Fallback default)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Status</label>
                  <select
                    name="isActive"
                    defaultValue={editingRule.isActive !== false ? "true" : "false"}
                    className="w-full text-xs p-2.5 rounded-xl border border-pink-light bg-white focus:outline-none focus:border-brand"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-blush pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink rounded-xl"
              >
                Cancel
              </button>
              <Button type="submit" disabled={isPending} className="text-xs px-5 py-2">
                {isPending ? "Saving..." : "Save Rule"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
