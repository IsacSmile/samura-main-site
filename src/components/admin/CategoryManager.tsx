"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  toggleCategoryStatusAction,
} from "@/app/admin/actions/categories";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
}

interface CategoryManagerProps {
  categories: CategoryItem[];
}

export function CategoryManager({ categories: initialCategories }: CategoryManagerProps) {
  const [categoriesList, setCategoriesList] = useState(initialCategories);
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [parentId, setParentId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Feedback state
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited && !editingCategory) {
      setSlug(slugify(val));
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setIsSlugManuallyEdited(false);
    setParentId("");
    setDescription("");
    setImage("");
    setSortOrder(categoriesList.length + 1);
    setIsActive(true);
    setStatusMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIsSlugManuallyEdited(true);
    setParentId(cat.parentId || "");
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setSortOrder(cat.sortOrder);
    setIsActive(cat.isActive);
    setStatusMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      const payload = {
        name,
        slug: slug.trim().toLowerCase(),
        parentId: parentId || null,
        description: description || null,
        image: image || null,
        sortOrder: Number(sortOrder),
        isActive,
      };

      const res = editingCategory
        ? await updateCategoryAction(editingCategory.id, payload)
        : await createCategoryAction(payload);

      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || "Saved successfully." });
        setTimeout(() => {
          setIsModalOpen(false);
        }, 1200);
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to save category." });
      }
    });
  };

  const handleToggleStatus = (cat: CategoryItem) => {
    startTransition(async () => {
      const res = await toggleCategoryStatusAction(cat.id);
      if (!res.success) {
        setToast({
          type: "error",
          title: "Update Failed",
          message: res.error || "Could not change category status.",
        });
      } else {
        setCategoriesList((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
        );
        setToast({
          type: "success",
          title: "Status Updated",
          message: res.message || `Category "${cat.name}" status updated.`,
        });
      }
    });
  };

  const handleDelete = (cat: CategoryItem) => {
    if (confirm(`Are you sure you want to delete "${cat.name}"?`)) {
      startTransition(async () => {
        const res = await deleteCategoryAction(cat.id);
        if (!res.success) {
          setToast({
            type: "error",
            title: "Delete Failed",
            message: res.error || "Could not delete category.",
          });
        } else {
          setCategoriesList((prev) => prev.filter((c) => c.id !== cat.id));
          setToast({
            type: "success",
            title: "Category Deleted",
            message: res.message || `Category "${cat.name}" deleted.`,
          });
        }
      });
    }
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink">
            Category Management
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Organize catalog hierarchy, manage slugs for SEO, and structure subcategories.
          </p>
        </div>
        <Button onClick={openCreateModal} size="sm" className="shadow-xs">
          <Plus className="w-4 h-4 mr-1.5" /> Add New Category
        </Button>
      </div>

      {/* Categories Table / Card Grid */}
      <div className="bg-white rounded-3xl border border-pink-light shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-pink-light bg-blush/30 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Slug</th>
                <th className="py-4 px-6">Parent</th>
                <th className="py-4 px-6">Products</th>
                <th className="py-4 px-6">Order</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-light/60 text-xs sm:text-sm">
              {categoriesList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted">
                    No categories found. Click &quot;Add New Category&quot; to create one.
                  </td>
                </tr>
              ) : (
                categoriesList.map((cat) => {
                  const parent = categoriesList.find((c) => c.id === cat.parentId);
                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-blush/20 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blush flex items-center justify-center overflow-hidden border border-pink-light shrink-0">
                            {cat.image ? (
                              <Image
                                src={cat.image}
                                alt={cat.name}
                                width={40}
                                height={40}
                                className="object-contain w-full h-full p-1"
                                unoptimized={cat.image.endsWith(".svg")}
                              />
                            ) : (
                              <Layers className="w-5 h-5 text-brand" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-ink">
                              {cat.name}
                            </div>
                            {cat.description && (
                              <div className="text-[11px] text-muted line-clamp-1 max-w-xs">
                                {cat.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-muted">
                        /{cat.slug}
                      </td>
                      <td className="py-4 px-6 text-xs text-muted">
                        {parent ? (
                          <span className="inline-flex items-center gap-1 bg-blush px-2 py-0.5 rounded-md text-brand font-medium">
                            {parent.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">— Top Level —</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-ink">
                        {cat.productCount ?? 0}
                      </td>
                      <td className="py-4 px-6 text-xs text-muted">
                        {cat.sortOrder}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleToggleStatus(cat)}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                            cat.isActive
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {cat.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-success" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-gray-400" /> Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg text-muted hover:text-brand hover:bg-blush transition-colors"
                            title="Edit Category"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCategory ? "Edit Category" : "Create New Category"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">
                Category Name <span className="text-brand">*</span>
              </label>
              <Input
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Sanitary Pads"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">
                URL Slug <span className="text-brand">*</span>
              </label>
              <Input
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManuallyEdited(true);
                }}
                placeholder="e.g. sanitary-pads"
              />
              <span className="text-[10px] text-muted">
                Used in URL: /category/{slug || "slug"}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">
                Parent Category (Optional)
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-2xl border border-pink-light bg-white p-3 text-xs sm:text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              >
                <option value="">— None (Top Level Category) —</option>
                {categoriesList
                  .filter((c) => !editingCategory || c.id !== editingCategory.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description for category banner and SEO..."
                className="w-full rounded-2xl border border-pink-light bg-white p-3 text-xs sm:text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">
                Image URL or Icon Path
              </label>
              <Input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="e.g. /products/day-pads.svg or /uploads/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Sort Order</label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Status</label>
                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-pink-light text-brand focus:ring-brand"
                    />
                    <span>Active on Storefront</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-pink-light">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isPending}>
                {editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
