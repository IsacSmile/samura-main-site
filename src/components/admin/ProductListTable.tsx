"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { formatRupees } from "@/lib/utils/money";
import {
  toggleProductStatusAction,
  deleteProductAction,
} from "@/app/admin/actions/products";

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  categoryId: string;
  basePricePaise: number;
  salePricePaise: number | null;
  isActive: boolean;
  isSample?: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  totalStock: number;
  variantCount: number;
  primaryImage: string;
  updatedAt: Date;
}

interface ProductListTableProps {
  products: ProductListItem[];
  categories: Array<{ id: string; name: string }>;
}

export function ProductListTable({
  products: initialProducts,
  categories,
}: ProductListTableProps) {
  const [productsList, setProductsList] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const filtered = productsList.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleStatus = (p: ProductListItem) => {
    startTransition(async () => {
      const res = await toggleProductStatusAction(p.id);
      if (!res.success) {
        setToast({
          type: "error",
          title: "Update Failed",
          message: res.error || "Could not change status.",
        });
      } else {
        setProductsList((prev) =>
          prev.map((item) =>
            item.id === p.id ? { ...item, isActive: !item.isActive } : item
          )
        );
        setToast({
          type: "success",
          title: "Status Updated",
          message: res.message || `Product "${p.name}" updated.`,
        });
      }
    });
  };

  const handleDelete = (p: ProductListItem) => {
    if (confirm(`Deactivate product "${p.name}"? It will be unpublished from the store.`)) {
      startTransition(async () => {
        const res = await deleteProductAction(p.id, true);
        if (!res.success) {
          setToast({
            type: "error",
            title: "Deactivation Failed",
            message: res.error || "Could not deactivate product.",
          });
        } else {
          setProductsList((prev) =>
            prev.map((item) =>
              item.id === p.id ? { ...item, isActive: false } : item
            )
          );
          setToast({
            type: "info",
            title: "Product Deactivated",
            message: res.message || `Product "${p.name}" has been unpublished.`,
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
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink">
            Product Catalog
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Manage products, configure size &amp; pack variants, track inventory, and publish.
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button size="sm" className="shadow-xs">
            <Plus className="w-4 h-4 mr-1.5" /> Add New Product
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-pink-light shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by title or slug..."
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 rounded-2xl border border-pink-light bg-white p-2.5 text-xs text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted whitespace-nowrap">
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
          </span>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-3xl border border-pink-light shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-pink-light bg-blush/30 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Price</th>
                <th className="py-4 px-6">Variants</th>
                <th className="py-4 px-6">Stock</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-light/60 text-xs sm:text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-blush/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blush flex items-center justify-center overflow-hidden border border-pink-light shrink-0">
                          {prod.primaryImage ? (
                            <Image
                              src={prod.primaryImage}
                              alt={prod.name}
                              width={48}
                              height={48}
                              className="object-contain w-full h-full p-1"
                              unoptimized={prod.primaryImage.endsWith(".svg")}
                            />
                          ) : (
                            <Package className="w-6 h-6 text-brand" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/admin/products/${prod.id}/edit`}
                              className="font-semibold text-ink hover:text-brand transition-colors block truncate max-w-xs"
                            >
                              {prod.name}
                            </Link>
                            {(prod.isSample || prod.id.startsWith("prod_")) && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Sample data. Replace with client product details.
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted font-mono truncate">
                            /{prod.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-muted">
                      <span className="bg-blush text-brand px-2.5 py-1 rounded-full font-medium">
                        {prod.categoryName}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-ink">
                        {formatRupees(prod.salePricePaise ?? prod.basePricePaise)}
                      </div>
                      {prod.salePricePaise && (
                        <div className="text-[11px] text-muted line-through">
                          {formatRupees(prod.basePricePaise)}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-muted">
                      <span className="font-semibold text-ink">
                        {prod.variantCount}
                      </span>{" "}
                      {prod.variantCount === 1 ? "variant" : "variants"}
                    </td>
                    <td className="py-4 px-6">
                      {prod.totalStock === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-red-600" /> Out of stock
                        </span>
                      ) : prod.totalStock <= 10 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> {prod.totalStock} left
                        </span>
                      ) : (
                        <span className="text-xs text-ink font-medium">
                          {prod.totalStock} units
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleStatus(prod)}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                          prod.isActive
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {prod.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-success" /> Live
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-gray-400" /> Draft
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/product/${prod.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-muted hover:text-brand hover:bg-blush transition-colors"
                          title="View on Storefront"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/products/${prod.id}/edit`}
                          className="p-1.5 rounded-lg text-muted hover:text-brand hover:bg-blush transition-colors"
                          title="Edit Product"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(prod)}
                          className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Deactivate Product"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
