"use client";

import React, { useState, useTransition } from "react";
import {
  Star,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
} from "lucide-react";
import {
  saveTestimonialAction,
  toggleTestimonialPublishedAction,
  deleteTestimonialAction,
} from "@/app/admin/actions/testimonials";

export interface TestimonialItem {
  id: string;
  name: string;
  city: string | null;
  rating: number;
  body: string;
  isPublished: boolean;
  isSample: boolean;
  sortOrder: number;
  createdAt: Date | string;
}

interface TestimonialsManagerProps {
  initialTestimonials: TestimonialItem[];
}

interface ToastState {
  type: "success" | "error" | "warning";
  title: string;
  message: string;
}

export function TestimonialsManager({ initialTestimonials }: TestimonialsManagerProps) {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(initialTestimonials);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastState | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formBody, setFormBody] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formIsSample, setFormIsSample] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormCity("");
    setFormRating(5);
    setFormBody("");
    setFormSortOrder(testimonials.length + 1);
    setFormIsPublished(true);
    setFormIsSample(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: TestimonialItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCity(item.city || "");
    setFormRating(item.rating);
    setFormBody(item.body);
    setFormSortOrder(item.sortOrder);
    setFormIsPublished(item.isPublished);
    setFormIsSample(item.isSample);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError("Customer name is required.");
      return;
    }
    if (!formBody.trim()) {
      setFormError("Testimonial review body is required.");
      return;
    }
    if (formBody.length > 280) {
      setFormError(`Body must be 280 characters or fewer (currently ${formBody.length}).`);
      return;
    }

    startTransition(async () => {
      const payload = {
        id: editingItem?.id,
        name: formName.trim(),
        city: formCity.trim() || null,
        rating: Number(formRating),
        body: formBody.trim(),
        sortOrder: Number(formSortOrder) || 0,
        isPublished: formIsPublished,
        isSample: formIsSample,
      };

      const res = await saveTestimonialAction(payload);
      if (!res.success) {
        setFormError(res.error || "Failed to save testimonial.");
        setToast({
          type: "error",
          title: "Save Failed",
          message: res.error || "Could not save testimonial.",
        });
      } else {
        if (res.warning) {
          setToast({
            type: "warning",
            title: "Compliance Notice",
            message: res.warning,
          });
        } else {
          setToast({
            type: "success",
            title: "Testimonial Saved",
            message: res.message || "Customer testimonial updated successfully.",
          });
        }

        // Update local list
        setTestimonials((prev) => {
          if (editingItem) {
            return prev.map((t) =>
              t.id === editingItem.id
                ? {
                    ...t,
                    name: payload.name,
                    city: payload.city,
                    rating: payload.rating,
                    body: payload.body,
                    sortOrder: payload.sortOrder,
                    isPublished: payload.isPublished,
                    isSample: payload.isSample,
                  }
                : t
            ).sort((a, b) => a.sortOrder - b.sortOrder);
          } else {
            const newItem: TestimonialItem = {
              id: res.testimonialId || `tst_${Date.now()}`,
              name: payload.name,
              city: payload.city,
              rating: payload.rating,
              body: payload.body,
              sortOrder: payload.sortOrder,
              isPublished: payload.isPublished,
              isSample: payload.isSample,
              createdAt: new Date(),
            };
            return [...prev, newItem].sort((a, b) => a.sortOrder - b.sortOrder);
          }
        });

        closeModal();
      }
    });
  };

  const handleTogglePublished = (item: TestimonialItem) => {
    startTransition(async () => {
      const res = await toggleTestimonialPublishedAction(item.id);
      if (res.success) {
        setTestimonials((prev) =>
          prev.map((t) => (t.id === item.id ? { ...t, isPublished: !t.isPublished } : t))
        );
        setToast({
          type: "success",
          title: "Status Updated",
          message: res.message || "Testimonial publication status toggled.",
        });
      } else {
        setToast({
          type: "error",
          title: "Update Failed",
          message: res.error || "Failed to toggle publication status.",
        });
      }
    });
  };

  const handleDelete = (item: TestimonialItem) => {
    if (!confirm(`Are you sure you want to delete the testimonial from "${item.name}"?`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteTestimonialAction(item.id);
      if (res.success) {
        setTestimonials((prev) => prev.filter((t) => t.id !== item.id));
        setToast({
          type: "success",
          title: "Testimonial Deleted",
          message: res.message || "Testimonial removed successfully.",
        });
      } else {
        setToast({
          type: "error",
          title: "Deletion Failed",
          message: res.error || "Failed to delete testimonial.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl flex items-start justify-between gap-3 shadow-md border ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : toast.type === "warning"
              ? "bg-amber-50 text-amber-900 border-amber-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
            {toast.type === "error" && <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-sm">{toast.title}</p>
              <p className="text-xs mt-0.5 opacity-90">{toast.message}</p>
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-muted hover:text-ink transition-colors p-1"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mandatory Regulatory / Ethical Notice */}
      <div className="bg-blush/60 border border-pink-light/70 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-ink-muted">
          <p className="font-semibold text-ink text-sm">Customer Privacy & Review Ethics Policy</p>
          <p>
            <strong>Only add reviews from real customers who gave permission.</strong> Never create or publish fictitious customer feedback or medical claims. In production mode, sample reviews are automatically hidden.
          </p>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Customer Testimonials ({testimonials.length})</h2>
          <p className="text-xs text-muted">
            Testimonials appear on the homepage &ldquo;What Our Customers Say&rdquo; carousel.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center gap-2 rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Testimonial
        </button>
      </div>

      {/* Testimonials Table */}
      <div className="bg-white rounded-2xl border border-blush shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-blush/40 border-b border-blush text-ink/70 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-16 text-center">Order</th>
                <th className="py-3 px-4">Customer & City</th>
                <th className="py-3 px-4 w-28">Rating</th>
                <th className="py-3 px-4 min-w-70">Testimonial Body</th>
                <th className="py-3 px-4 w-28 text-center">Sample</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blush/40">
              {testimonials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    No customer testimonials found. Click &ldquo;Add Testimonial&rdquo; to create one.
                  </td>
                </tr>
              ) : (
                testimonials.map((item) => (
                  <tr key={item.id} className="hover:bg-blush/20 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-medium text-ink/80">
                      {item.sortOrder}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink">{item.name}</div>
                      <div className="text-[11px] text-muted">{item.city || "No city specified"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-ink">{item.rating}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="line-clamp-2 text-ink-muted leading-relaxed" title={item.body}>
                        {item.body}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.isSample ? (
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block">
                          Sample
                        </span>
                      ) : (
                        <span className="text-muted text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleTogglePublished(item)}
                        disabled={isPending}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                          item.isPublished
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {item.isPublished ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          disabled={isPending}
                          className="p-1.5 text-muted hover:text-ink hover:bg-blush rounded-lg transition-colors"
                          title="Edit Testimonial"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={isPending}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Testimonial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-blush space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-blush">
              <h3 className="font-serif text-lg font-semibold text-ink">
                {editingItem ? "Edit Testimonial" : "Add Customer Testimonial"}
              </h3>
              <button
                onClick={closeModal}
                className="text-muted hover:text-ink p-1 rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    Customer Name <span className="text-brand">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anjali R."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-blush rounded-xl focus:outline-brand text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    City (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 border border-blush rounded-xl focus:outline-brand text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    Rating (1-5 Stars) <span className="text-brand">*</span>
                  </label>
                  <select
                    value={formRating}
                    onChange={(e) => setFormRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-blush rounded-xl focus:outline-brand text-xs bg-white"
                  >
                    <option value={5}>5 Stars ★★★★★</option>
                    <option value={4}>4 Stars ★★★★☆</option>
                    <option value={3}>3 Stars ★★★☆☆</option>
                    <option value={2}>2 Stars ★★☆☆☆</option>
                    <option value={1}>1 Star ★☆☆☆☆</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-blush rounded-xl focus:outline-brand text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-ink">
                    Review Body <span className="text-brand">*</span>
                  </label>
                  <span className={`text-[10px] ${formBody.length > 280 ? "text-rose-600 font-bold" : "text-muted"}`}>
                    {formBody.length}/280
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={280}
                  placeholder="Neutral feedback about packaging, delivery speed, customer care, and checkout experience..."
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  className="w-full px-3 py-2 border border-blush rounded-xl focus:outline-brand text-xs resize-none"
                />
                <p className="text-[10px] text-muted mt-0.5">
                  Do not make health, medical, or performance claims. Limit to delivery, support, and packaging feedback.
                </p>
              </div>

              <div className="pt-2 border-t border-blush flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-brand focus:ring-brand accent-brand cursor-pointer"
                  />
                  <span className="font-medium text-ink">Publish on Storefront</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsSample}
                    onChange={(e) => setFormIsSample(e.target.checked)}
                    className="w-4 h-4 rounded text-brand focus:ring-brand accent-brand cursor-pointer"
                  />
                  <span className="text-muted">Mark as Sample Data</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-blush">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="px-4 py-2 border border-blush rounded-xl text-ink hover:bg-blush/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary px-5 py-2 rounded-xl flex items-center gap-2"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingItem ? "Update Testimonial" : "Create Testimonial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
