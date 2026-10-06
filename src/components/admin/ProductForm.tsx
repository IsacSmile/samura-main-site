"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  UploadCloud,
  Star,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { upsertProductAction } from "@/app/admin/actions/products";
import { uploadStandaloneImageAction } from "@/app/admin/actions/images";

export interface CategoryOption {
  id: string;
  name: string;
  parentId: string | null;
}

export interface VariantItem {
  id?: string;
  name: string;
  sku: string;
  size?: string | null;
  packQty: number;
  priceRupees: number;
  salePriceRupees?: number | null;
  stock: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface ProductImageItem {
  id?: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface InitialProductData {
  id?: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description: string;
  basePriceRupees: number;
  salePriceRupees?: number | null;
  badge?: string | null;
  flowType?: string | null;
  ingredients?: string | null;
  absorptionGuide?: string | null;
  usageGuide?: string | null;
  features?: string | null; // JSON string or text
  faq?: string | null; // JSON string
  isFeatured: boolean;
  isBestseller: boolean;
  isActive: boolean;
  isSample?: boolean;
  variants: VariantItem[];
  images: ProductImageItem[];
}

interface ProductFormProps {
  categories: CategoryOption[];
  initialData?: InitialProductData;
}

export function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(initialData?.id);

  // --- Form Fields ---
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(Boolean(initialData?.slug));
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || (categories[0]?.id || ""));
  const [badge, setBadge] = useState(initialData?.badge || "");
  const [flowType, setFlowType] = useState(initialData?.flowType || "");
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || "");
  const [description, setDescription] = useState(initialData?.description || "");

  // Base pricing
  const [basePriceRupees, setBasePriceRupees] = useState<number | "">(
    initialData?.basePriceRupees !== undefined ? initialData.basePriceRupees : 299
  );
  const [salePriceRupees, setSalePriceRupees] = useState<number | "">(
    initialData?.salePriceRupees !== null && initialData?.salePriceRupees !== undefined
      ? initialData.salePriceRupees
      : ""
  );

  // Status flags
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [isBestseller, setIsBestseller] = useState(initialData?.isBestseller ?? false);

  // Educational & Specification Guides
  const [ingredients, setIngredients] = useState(initialData?.ingredients || "");
  const [absorptionGuide, setAbsorptionGuide] = useState(initialData?.absorptionGuide || "");
  const [usageGuide, setUsageGuide] = useState(initialData?.usageGuide || "");

  // Highlights / Features (list of bullet strings)
  const parseInitialFeatures = (): string[] => {
    if (!initialData?.features) return ["Pure Cotton Cover", "Chlorine-Free", "Breathable Backsheet"];
    try {
      const parsed = JSON.parse(initialData.features);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return initialData.features.split("\n").filter(Boolean);
    }
    return [];
  };
  const [featuresList, setFeaturesList] = useState<string[]>(parseInitialFeatures);
  const [newFeatureText, setNewFeatureText] = useState("");

  // FAQs
  const parseInitialFaqs = (): FaqItem[] => {
    if (!initialData?.faq) return [];
    try {
      const parsed = JSON.parse(initialData.faq);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not JSON array
    }
    return [];
  };
  const [faqs, setFaqs] = useState<FaqItem[]>(parseInitialFaqs);

  // Images
  const [images, setImages] = useState<ProductImageItem[]>(initialData?.images || []);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState("");

  // Variants
  const [variants, setVariants] = useState<VariantItem[]>(
    initialData?.variants && initialData.variants.length > 0
      ? initialData.variants
      : [
          {
            name: "Standard Pack",
            sku: "SAM-STD-01",
            size: "Regular",
            packQty: 10,
            priceRupees: 299,
            salePriceRupees: null,
            stock: 100,
            isDefault: true,
            sortOrder: 1,
          },
        ]
  );

  // Feedback & Toast
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  // Slug generator
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(autoSlug);
    }
  };

  // --- Image Handlers ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setToast({
        type: "error",
        title: "File Too Large",
        message: "Maximum image size allowed is 2MB.",
      });
      return;
    }

    // Validate MIME
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setToast({
        type: "error",
        title: "Invalid Format",
        message: "Only JPG, PNG, and WebP images are allowed.",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadStandaloneImageAction(formData);
      if (!res.success || !res.url) {
        setToast({
          type: "error",
          title: "Upload Failed",
          message: res.error || "Failed to upload file.",
        });
      } else {
        const newImg: ProductImageItem = {
          url: res.url,
          alt: file.name.replace(/\.[^/.]+$/, ""),
          isPrimary: images.length === 0,
          sortOrder: images.length + 1,
        };
        setImages((prev) => [...prev, newImg]);
        setToast({
          type: "success",
          title: "Image Uploaded",
          message: "New product image was uploaded via the storage abstraction.",
        });
      }
    } catch {
      setToast({
        type: "error",
        title: "Upload Error",
        message: "Something went wrong during file upload.",
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddCustomImageUrl = () => {
    if (!customImageUrl.trim()) return;
    const newImg: ProductImageItem = {
      url: customImageUrl.trim(),
      alt: name || "Product image",
      isPrimary: images.length === 0,
      sortOrder: images.length + 1,
    };
    setImages((prev) => [...prev, newImg]);
    setCustomImageUrl("");
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  const handleMoveImage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // Re-assign sortOrder
    const reordered = updated.map((img, i) => ({
      ...img,
      sortOrder: i + 1,
    }));
    setImages(reordered);
  };

  const handleDeleteImage = (index: number) => {
    setImages((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // If deleted image was primary, make the first remaining primary
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered.map((img, i) => ({ ...img, sortOrder: i + 1 }));
    });
  };

  // --- Variant Handlers ---
  const handleAddVariant = () => {
    const count = variants.length + 1;
    const baseSku = (slug || "SAM").toUpperCase().slice(0, 8);
    const newVariant: VariantItem = {
      name: `Pack of ${count * 10}`,
      sku: `${baseSku}-${count * 10}-${Math.floor(Math.random() * 900 + 100)}`,
      size: "Regular",
      packQty: count * 10,
      priceRupees: typeof basePriceRupees === "number" ? basePriceRupees : 299,
      salePriceRupees: typeof salePriceRupees === "number" ? salePriceRupees : null,
      stock: 50,
      isDefault: variants.length === 0,
      sortOrder: count,
    };
    setVariants((prev) => [...prev, newVariant]);
  };

  const handleUpdateVariant = (index: number, fields: Partial<VariantItem>) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...fields } : v))
    );
  };

  const handleSetDefaultVariant = (index: number) => {
    setVariants((prev) =>
      prev.map((v, i) => ({
        ...v,
        isDefault: i === index,
      }))
    );
  };

  const handleDeleteVariant = (index: number) => {
    if (variants.length <= 1) {
      setToast({
        type: "error",
        title: "Cannot Delete",
        message: "A product must have at least one variant.",
      });
      return;
    }
    setVariants((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      if (!filtered.some((v) => v.isDefault) && filtered.length > 0) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  // --- Highlights Handlers ---
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeaturesList((prev) => [...prev, newFeatureText.trim()]);
    setNewFeatureText("");
  };

  const handleRemoveFeature = (index: number) => {
    setFeaturesList((prev) => prev.filter((_, i) => i !== index));
  };

  // --- FAQ Handlers ---
  const handleAddFaq = () => {
    setFaqs((prev) => [
      ...prev,
      {
        question: "Is this product designed for sensitive skin?",
        answer: "Yes, our gentle formula is crafted for comfort and delicate care.",
      },
    ]);
  };

  const handleUpdateFaq = (index: number, key: "question" | "answer", val: string) => {
    setFaqs((prev) =>
      prev.map((faq, i) => (i === index ? { ...faq, [key]: val } : faq))
    );
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Submit Form ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side quick checks
    if (!name.trim()) {
      setToast({ type: "error", title: "Missing Name", message: "Please enter a product name." });
      return;
    }
    if (!slug.trim()) {
      setToast({ type: "error", title: "Missing Slug", message: "Please enter a product slug." });
      return;
    }
    if (!categoryId) {
      setToast({ type: "error", title: "Missing Category", message: "Please select a category." });
      return;
    }
    if (variants.length === 0) {
      setToast({ type: "error", title: "Variants Required", message: "Add at least one variant." });
      return;
    }

    // Verify unique SKUs client side
    const skus = variants.map((v) => v.sku.trim().toUpperCase());
    const uniqueSkus = new Set(skus);
    if (uniqueSkus.size !== skus.length) {
      setToast({
        type: "error",
        title: "Duplicate SKUs",
        message: "Every variant must have a unique SKU code.",
      });
      return;
    }

    startTransition(async () => {
      const payload = {
        id: initialData?.id,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        categoryId,
        badge: badge.trim() || null,
        flowType: flowType.trim() || null,
        shortDescription: shortDescription.trim() || null,
        description: description.trim(),
        basePriceRupees: Number(basePriceRupees) || 0,
        salePriceRupees: salePriceRupees === "" ? null : Number(salePriceRupees),
        ingredients: ingredients.trim() || null,
        absorptionGuide: absorptionGuide.trim() || null,
        usageGuide: usageGuide.trim() || null,
        features: JSON.stringify(featuresList),
        faq: JSON.stringify(faqs),
        isActive,
        isFeatured,
        isBestseller,
        variants: variants.map((v, i) => ({
          id: v.id,
          name: v.name.trim(),
          sku: v.sku.trim().toUpperCase(),
          size: v.size?.trim() || null,
          packQty: Number(v.packQty) || 1,
          priceRupees: Number(v.priceRupees) || 0,
          salePriceRupees: v.salePriceRupees === null || v.salePriceRupees === undefined || (v.salePriceRupees as unknown) === "" ? null : Number(v.salePriceRupees),
          stock: Number(v.stock) || 0,
          isDefault: v.isDefault,
          sortOrder: i + 1,
        })),
        images: images.map((img, i) => ({
          id: img.id,
          url: img.url,
          alt: img.alt || name,
          isPrimary: img.isPrimary,
          sortOrder: i + 1,
        })),
      };

      const res = await upsertProductAction(payload);
      if (!res.success) {
        setToast({
          type: "error",
          title: "Save Failed",
          message: res.error || "Failed to save product.",
        });
      } else {
        setToast({
          type: "success",
          title: "Product Saved!",
          message: res.message || "Product saved successfully.",
        });
        setTimeout(() => {
          router.push("/admin/products");
          router.refresh();
        }, 1200);
      }
    });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Toast Alert */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blush pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2.5 rounded-xl border border-blush hover:bg-blush/30 text-ink/70 hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-serif text-ink tracking-tight font-medium">
                {isEditing ? `Edit Product: ${initialData?.name}` : "Create New Product"}
              </h1>
              {(initialData?.isSample || initialData?.id?.startsWith("prod_")) && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Sample data. Replace with client product details.
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">
              Enter catalog details, specifications, variants, and upload imagery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/products">
            <Button variant="secondary" className="text-xs h-10 px-4">
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="text-xs h-10 px-5 flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {isPending ? "Saving Product..." : isEditing ? "Update Product" : "Publish Product"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Basic Information */}
        <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-blush/50">
            <Sparkles className="w-5 h-5 text-brand" />
            <h2 className="font-medium text-ink text-base">Basic Product Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Product Name <span className="text-brand">*</span>
              </label>
              <Input
                placeholder="e.g. Ultra Thin Pure Cotton Day Pads"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                URL Slug <span className="text-brand">*</span>
              </label>
              <Input
                placeholder="e.g. ultra-thin-pure-cotton-day-pads"
                value={slug}
                onChange={(e) => {
                  setIsSlugManuallyEdited(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                }}
                required
              />
              <p className="text-[11px] text-muted mt-1">
                Visible at /product/{slug || "..."}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Category <span className="text-brand">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-blush text-sm bg-white text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                required
              >
                <option value="" disabled>Select a Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? `— ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Badge / Tag</label>
                <Input
                  placeholder="e.g. Bestseller, Gentle Cotton"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Flow Type</label>
                <Input
                  placeholder="e.g. Heavy Flow, Regular"
                  value={flowType}
                  onChange={(e) => setFlowType(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Short Description / Excerpt
            </label>
            <Input
              placeholder="A brief 1-2 sentence hook displayed in cards and previews"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Full Product Description <span className="text-brand">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Comprehensive product copy, materials, and benefits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-blush text-sm bg-white text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-y"
              required
            />
          </div>

          {/* Catalog Status Toggles */}
          <div className="pt-3 border-t border-blush/40 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-ink select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-brand focus:ring-brand accent-brand cursor-pointer"
              />
              <span>Published / Visible on Storefront</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-ink select-none">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-brand focus:ring-brand accent-brand cursor-pointer"
              />
              <span>Feature on Homepage</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-ink select-none">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
                className="w-4 h-4 rounded text-brand focus:ring-brand accent-brand cursor-pointer"
              />
              <span>Mark as Bestseller</span>
            </label>
          </div>
        </div>

        {/* SECTION 2: Base Pricing (₹ entered in UI, stored as paise in DB) */}
        <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-blush/50">
            <div className="flex items-center gap-2.5">
              <Info className="w-5 h-5 text-brand" />
              <h2 className="font-medium text-ink text-base">Default Base Pricing</h2>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 bg-blush/40 text-ink/70 rounded-md">
              Entered in Rupees (₹) • Stored as integer paise in DB
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Base Regular Price (₹) <span className="text-brand">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="299"
                  value={basePriceRupees}
                  onChange={(e) => setBasePriceRupees(e.target.value === "" ? "" : Number(e.target.value))}
                  className="pl-8"
                  required
                />
              </div>
              <p className="text-[11px] text-muted mt-1">
                Paise equivalent: {typeof basePriceRupees === "number" ? Math.round(basePriceRupees * 100) : 0} paise
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Base Sale / Discounted Price (₹) (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Leave empty if not on sale"
                  value={salePriceRupees}
                  onChange={(e) => setSalePriceRupees(e.target.value === "" ? "" : Number(e.target.value))}
                  className="pl-8"
                />
              </div>
              <p className="text-[11px] text-muted mt-1">
                Paise equivalent: {typeof salePriceRupees === "number" ? Math.round(salePriceRupees * 100) : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Product Imagery & Storage Abstraction */}
        <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blush/50">
            <div>
              <h2 className="font-medium text-ink text-base">Product Gallery & Imagery</h2>
              <p className="text-xs text-muted mt-0.5">
                Storage abstraction upload: JPG, PNG, WebP only. Max file size: 2MB.
              </p>
            </div>
            <span className="text-xs font-medium text-ink/70">
              {images.length} Image{images.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Upload Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Direct File Upload */}
            <div className="border-2 border-dashed border-blush rounded-xl p-5 flex flex-col items-center justify-center text-center hover:bg-blush/10 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                disabled={isUploadingImage}
                className="hidden"
                id="admin-image-upload-input"
              />
              <UploadCloud className="w-8 h-8 text-brand/70 mb-2" />
              <p className="text-xs font-semibold text-ink">Upload Local File</p>
              <p className="text-[11px] text-muted mt-0.5 mb-3">JPG, PNG, WebP up to 2MB</p>
              <Button
                type="button"
                variant="secondary"
                disabled={isUploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs h-8 px-4"
              >
                {isUploadingImage ? "Uploading..." : "Choose Image File"}
              </Button>
            </div>

            {/* External URL alternative */}
            <div className="border border-blush rounded-xl p-5 flex flex-col justify-center space-y-3">
              <div>
                <p className="text-xs font-semibold text-ink">Or Add Image by URL</p>
                <p className="text-[11px] text-muted">Paste an existing static URL or CDN link</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://... or /images/..."
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="h-9 text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddCustomImageUrl}
                  className="text-xs h-9 px-3 shrink-0"
                >
                  Add URL
                </Button>
              </div>
            </div>
          </div>

          {/* Gallery Thumbnails List */}
          {images.length === 0 ? (
            <div className="py-6 text-center text-muted text-xs bg-blush/20 rounded-xl">
              No images added yet. Upload at least one image for storefront display.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 pt-2">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`group relative rounded-xl border overflow-hidden bg-blush/10 transition-all ${
                    img.isPrimary
                      ? "border-brand ring-2 ring-brand/20 shadow-xs"
                      : "border-blush hover:border-brand/40"
                  }`}
                >
                  <div className="relative aspect-square w-full">
                    <Image
                      src={img.url}
                      alt={img.alt || "Product image"}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      className="object-cover"
                      unoptimized={img.url.startsWith("http")}
                    />

                    {/* Primary Badge */}
                    {img.isPrimary && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-brand text-white text-[10px] font-semibold tracking-wide shadow-xs flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" /> Primary
                      </span>
                    )}

                    {/* Overlay Action Bar */}
                    <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(idx)}
                          className="p-1.5 rounded-lg bg-white/90 text-red-600 hover:bg-white shadow-xs transition-colors"
                          title="Delete image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, "up")}
                            className="p-1 rounded bg-white/90 text-ink hover:bg-white disabled:opacity-30"
                            title="Move left/up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === images.length - 1}
                            onClick={() => handleMoveImage(idx, "down")}
                            className="p-1 rounded bg-white/90 text-ink hover:bg-white disabled:opacity-30"
                            title="Move right/down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {!img.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="px-2 py-1 rounded bg-white/90 text-ink hover:bg-white text-[10px] font-medium"
                          >
                            Make Primary
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: Product Variants (SKU unique, sizes, prices in ₹, stock) */}
        <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-blush/50">
            <div>
              <h2 className="font-medium text-ink text-base">Product Variants & Inventory</h2>
              <p className="text-xs text-muted mt-0.5">
                Configure size, pack quantity, unique SKU, pricing in ₹, and stock counts.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddVariant}
              className="text-xs h-9 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Variant
            </Button>
          </div>

          <div className="space-y-3.5">
            {variants.map((v, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  v.isDefault
                    ? "border-brand/40 bg-blush/10"
                    : "border-blush bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="defaultVariant"
                      checked={v.isDefault}
                      onChange={() => handleSetDefaultVariant(idx)}
                      id={`var-default-${idx}`}
                      className="text-brand accent-brand cursor-pointer"
                    />
                    <label
                      htmlFor={`var-default-${idx}`}
                      className="text-xs font-semibold text-ink cursor-pointer flex items-center gap-1.5"
                    >
                      Variant #{idx + 1}: {v.name || "Untitled Variant"}
                      {v.isDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-medium">
                          Default Selection
                        </span>
                      )}
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteVariant(idx)}
                    disabled={variants.length <= 1}
                    className="p-1 text-muted hover:text-red-600 disabled:opacity-20 transition-colors"
                    title="Remove variant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-medium text-ink mb-1">Variant Name</label>
                    <Input
                      placeholder="e.g. Regular - Pack of 10"
                      value={v.name}
                      onChange={(e) => handleUpdateVariant(idx, { name: e.target.value })}
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-ink mb-1">
                      SKU <span className="text-brand">*</span>
                    </label>
                    <Input
                      placeholder="SAM-REG-10"
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(idx, { sku: e.target.value.toUpperCase() })}
                      className="h-9 text-xs uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-ink mb-1">Size / Dimension</label>
                    <Input
                      placeholder="280mm / XL"
                      value={v.size || ""}
                      onChange={(e) => handleUpdateVariant(idx, { size: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-ink mb-1">Pack Qty</label>
                    <Input
                      type="number"
                      min="1"
                      value={v.packQty}
                      onChange={(e) => handleUpdateVariant(idx, { packQty: Math.max(1, Number(e.target.value)) })}
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-ink mb-1">Price (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      value={v.priceRupees}
                      onChange={(e) => handleUpdateVariant(idx, { priceRupees: Number(e.target.value) })}
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-ink mb-1">Stock</label>
                    <Input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => handleUpdateVariant(idx, { stock: Math.max(0, Number(e.target.value)) })}
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: Guides, Ingredients & Education */}
        <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-5">
          <div className="pb-3 border-b border-blush/50">
            <h2 className="font-medium text-ink text-base">Educational Specifications & Guides</h2>
            <p className="text-xs text-muted mt-0.5">
              Accurate details displayed in accordion tabs on the storefront product page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Ingredients & Composition
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Soft pure cotton cover, chlorine-free wood pulp core, biodegradable PLA film..."
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                className="w-full p-3 rounded-xl border border-blush text-xs bg-white text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Absorption Guide
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Daytime comfort and fluid absorption. Change every 4-6 hours..."
                value={absorptionGuide}
                onChange={(e) => setAbsorptionGuide(e.target.value)}
                className="w-full p-3 rounded-xl border border-blush text-xs bg-white text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Usage & Disposal Guide
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Peel off paper backing, stick firmly into underwear. Wrap used pad in recyclable paper wrapper before discarding..."
                value={usageGuide}
                onChange={(e) => setUsageGuide(e.target.value)}
                className="w-full p-3 rounded-xl border border-blush text-xs bg-white text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-y"
              />
            </div>
          </div>
        </div>

        {/* SECTION 6: Key Features & FAQs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Highlights */}
          <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blush/50">
              <h2 className="font-medium text-ink text-base">Key Highlights / Bullets</h2>
              <span className="text-xs text-muted">{featuresList.length} items</span>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add bullet highlight..."
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="h-9 text-xs"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddFeature}
                className="text-xs h-9 px-3 shrink-0"
              >
                Add
              </Button>
            </div>

            <ul className="space-y-2">
              {featuresList.map((feat, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-blush/20 text-xs text-ink"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                    {feat}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="p-1 text-muted hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* FAQs */}
          <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blush/50">
              <h2 className="font-medium text-ink text-base">Product FAQs</h2>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddFaq}
                className="text-xs h-8 px-2.5 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add FAQ
              </Button>
            </div>

            <div className="space-y-3">
              {faqs.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">No product-specific FAQs added.</p>
              ) : (
                faqs.map((f, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-blush space-y-2 bg-blush/10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-ink">Q#{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFaq(idx)}
                        className="text-muted hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Input
                      placeholder="Question..."
                      value={f.question}
                      onChange={(e) => handleUpdateFaq(idx, "question", e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                    <textarea
                      rows={2}
                      placeholder="Answer..."
                      value={f.answer}
                      onChange={(e) => handleUpdateFaq(idx, "answer", e.target.value)}
                      className="w-full p-2 rounded-lg border border-blush text-xs bg-white text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-blush">
          <Link href="/admin/products">
            <Button variant="secondary" className="text-xs h-10 px-5">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            className="text-xs h-10 px-6 flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {isPending ? "Saving Product..." : isEditing ? "Save & Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
