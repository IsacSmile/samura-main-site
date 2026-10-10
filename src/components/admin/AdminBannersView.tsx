"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Image as ImageIcon, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import {
  upsertBannerAction,
  deleteBannerAction,
  toggleBannerActiveAction,
} from "@/app/admin/actions/banners";

interface BannerRecord {
  id: string;
  title: string;
  subtitle: string | null;
  link: string | null;
  imageUrl: string;
  badge: string | null;
  sortOrder: number;
  isActive: boolean;
  startDate: string | Date | null;
  endDate: string | Date | null;
}

export function AdminBannersView({ initialBanners }: { initialBanners: BannerRecord[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [editingBanner, setEditingBanner] = useState<Partial<BannerRecord> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const handleToggle = (banner: BannerRecord) => {
    const nextActive = !banner.isActive;
    startTransition(async () => {
      const res = await toggleBannerActiveAction(banner.id, nextActive);
      if (res.success) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, isActive: nextActive } : b))
        );
        setToast({ type: "success", title: "Status Updated", message: res.message });
      } else {
        setToast({ type: "error", title: "Failed", message: res.message });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this promotional banner?")) return;
    startTransition(async () => {
      const res = await deleteBannerAction(id);
      if (res.success) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
        setToast({ type: "success", title: "Banner Deleted", message: res.message });
      } else {
        setToast({ type: "error", title: "Delete Failed", message: res.message });
      }
    });
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const startDate = formData.get("startDate") ? String(formData.get("startDate")) : null;
    const endDate = formData.get("endDate") ? String(formData.get("endDate")) : null;

    const payload = {
      id: editingBanner?.id,
      title: String(formData.get("title")),
      subtitle: formData.get("subtitle") ? String(formData.get("subtitle")) : null,
      link: String(formData.get("link") || "/shop"),
      imageUrl: String(formData.get("imageUrl")),
      badge: formData.get("badge") ? String(formData.get("badge")) : null,
      sortOrder: Number(formData.get("sortOrder") || 0),
      isActive: formData.get("isActive") === "true",
      startDate,
      endDate,
    };

    startTransition(async () => {
      const res = await upsertBannerAction(payload);
      if (res.success) {
        setToast({ type: "success", title: "Banner Saved", message: res.message });
        setEditingBanner(null);
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
            <ImageIcon className="w-6 h-6 text-brand" /> Banners & Promo Windows
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage storefront hero banners, promotional badges, sort ordering, and scheduled active display dates.
          </p>
        </div>

        <Button
          onClick={() =>
            setEditingBanner({
              title: "",
              subtitle: "",
              link: "/shop",
              imageUrl: "",
              badge: "New Launch",
              sortOrder: 0,
              isActive: true,
              startDate: null,
              endDate: null,
            })
          }
          className="text-xs h-10 px-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Banner
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-pink-light shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-pink-light bg-blush/30 text-ink/70 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Preview</th>
                <th className="py-3 px-4">Title & Copy</th>
                <th className="py-3 px-4">Badge</th>
                <th className="py-3 px-4">Target Link</th>
                <th className="py-3 px-4">Active Window</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blush">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted">
                    No promo banners found. Add a banner to display on the storefront home page.
                  </td>
                </tr>
              ) : (
                banners.map((bnr) => (
                  <tr key={bnr.id} className="hover:bg-blush/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-blush border border-pink-light">
                        {bnr.imageUrl && (
                          <Image
                            src={bnr.imageUrl}
                            alt={bnr.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink">{bnr.title}</div>
                      {bnr.subtitle && (
                        <div className="text-[11px] text-muted truncate max-w-xs">
                          {bnr.subtitle}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {bnr.badge ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blush text-brand px-2 py-0.5 rounded-full border border-pink-light">
                          {bnr.badge}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-ink font-mono text-[11px]">
                      {bnr.link || "/shop"}
                    </td>
                    <td className="py-3 px-4 text-muted text-[11px]">
                      {bnr.startDate || bnr.endDate ? (
                        <div>
                          <div>From: {bnr.startDate ? new Date(bnr.startDate).toLocaleDateString() : "Always"}</div>
                          <div>To: {bnr.endDate ? new Date(bnr.endDate).toLocaleDateString() : "Indefinite"}</div>
                        </div>
                      ) : (
                        "Always Active"
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-ink">
                      {bnr.sortOrder}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggle(bnr)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                          bnr.isActive
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-gray-600 bg-gray-50 border-gray-200"
                        }`}
                      >
                        {bnr.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => setEditingBanner(bnr)}
                        className="p-1.5 text-muted hover:text-brand rounded-lg border border-pink-light transition-colors"
                        title="Edit Banner"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(bnr.id)}
                        className="p-1.5 text-muted hover:text-red-600 rounded-lg border border-pink-light transition-colors"
                        title="Delete Banner"
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
      {editingBanner && (
        <div className="fixed inset-0 z-modal bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl"
          >
            <div className="border-b border-blush pb-3">
              <h3 className="font-heading font-bold text-lg text-ink">
                {editingBanner.id ? "Edit Banner" : "Add Promo Banner"}
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Banner Title</label>
                <Input
                  name="title"
                  defaultValue={editingBanner.title || ""}
                  placeholder="e.g. Pure Cotton Day & Night Protection"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Subtitle / Tagline</label>
                <Input
                  name="subtitle"
                  defaultValue={editingBanner.subtitle || ""}
                  placeholder="e.g. Chemical-free, chlorine-free gentle menstrual comfort"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Image URL</label>
                <Input
                  name="imageUrl"
                  defaultValue={editingBanner.imageUrl || ""}
                  placeholder="https://... or /banners/hero.webp"
                  required
                />
                <p className="text-[10px] text-muted mt-1">
                  Upload an image in Products/Categories or provide a secure public URL.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-ink mb-1">Badge Tag</label>
                  <Input
                    name="badge"
                    defaultValue={editingBanner.badge || ""}
                    placeholder="e.g. Limited Offer"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Click Link</label>
                  <Input
                    name="link"
                    defaultValue={editingBanner.link || "/shop"}
                    placeholder="/shop or /offers"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-ink mb-1">Active From (Date)</label>
                  <Input
                    name="startDate"
                    type="date"
                    defaultValue={
                      editingBanner.startDate
                        ? new Date(editingBanner.startDate).toISOString().split("T")[0]
                        : ""
                    }
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Active Until (Date)</label>
                  <Input
                    name="endDate"
                    type="date"
                    defaultValue={
                      editingBanner.endDate
                        ? new Date(editingBanner.endDate).toISOString().split("T")[0]
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-ink mb-1">Sort Order</label>
                  <Input
                    name="sortOrder"
                    type="number"
                    defaultValue={editingBanner.sortOrder || 0}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Status</label>
                  <select
                    name="isActive"
                    defaultValue={editingBanner.isActive !== false ? "true" : "false"}
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
                onClick={() => setEditingBanner(null)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink rounded-xl"
              >
                Cancel
              </button>
              <Button type="submit" disabled={isPending} className="text-xs px-5 py-2">
                {isPending ? "Saving..." : "Save Banner"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
