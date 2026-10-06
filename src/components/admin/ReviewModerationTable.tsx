"use client";

import { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  ExternalLink,
  ShieldCheck,
  Clock,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import {
  approveReviewAction,
  rejectReviewAction,
  deleteReviewAction,
} from "@/app/admin/actions/reviews";

export interface ReviewItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string | null;
  userName: string;
  rating: number;
  title: string | null;
  body: string;
  status: "pending" | "published" | "rejected";
  isVerified: boolean;
  createdAt: string | Date;
}

interface ReviewModerationTableProps {
  reviews: ReviewItem[];
}

export function ReviewModerationTable({ reviews: initialReviews }: ReviewModerationTableProps) {
  const [reviewsList, setReviewsList] = useState(initialReviews);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "published" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const counts = useMemo(() => {
    return {
      all: reviewsList.length,
      pending: reviewsList.filter((r) => r.status === "pending").length,
      published: reviewsList.filter((r) => r.status === "published").length,
      rejected: reviewsList.filter((r) => r.status === "rejected").length,
    };
  }, [reviewsList]);

  const filteredReviews = useMemo(() => {
    return reviewsList.filter((r) => {
      // 1. Status Filter
      if (filterStatus !== "all" && r.status !== filterStatus) {
        return false;
      }
      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesProduct = r.productName.toLowerCase().includes(q);
        const matchesUser = r.userName.toLowerCase().includes(q);
        const matchesBody = r.body.toLowerCase().includes(q);
        const matchesTitle = r.title?.toLowerCase().includes(q);
        return matchesProduct || matchesUser || matchesBody || matchesTitle;
      }
      return true;
    });
  }, [reviewsList, filterStatus, searchQuery]);

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const res = await approveReviewAction(id);
      if (!res.success) {
        setToast({ type: "error", title: "Action Failed", message: res.error || "Could not publish review." });
      } else {
        setReviewsList((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "published" as const } : r))
        );
        setToast({ type: "success", title: "Published", message: "Review is now published on storefront." });
      }
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      const res = await rejectReviewAction(id);
      if (!res.success) {
        setToast({ type: "error", title: "Action Failed", message: res.error || "Could not reject review." });
      } else {
        setReviewsList((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "rejected" as const } : r))
        );
        setToast({ type: "info", title: "Rejected", message: "Review rejected from storefront." });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;

    startTransition(async () => {
      const res = await deleteReviewAction(id);
      if (!res.success) {
        setToast({ type: "error", title: "Action Failed", message: res.error || "Could not delete review." });
      } else {
        setReviewsList((prev) => prev.filter((r) => r.id !== id));
        setToast({ type: "success", title: "Deleted", message: "Review deleted permanently." });
      }
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header controls: Search & Status Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-blush/20 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterStatus === "all"
                ? "bg-white text-ink shadow-xs"
                : "text-muted hover:text-ink"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              filterStatus === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-muted hover:text-ink"
            }`}
          >
            <Clock className="w-3 h-3" /> Pending ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("published")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterStatus === "published"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted hover:text-ink"
            }`}
          >
            Published ({counts.published})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("rejected")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterStatus === "rejected"
                ? "bg-red-500 text-white shadow-xs"
                : "text-muted hover:text-ink"
            }`}
          >
            Rejected ({counts.rejected})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>
      </div>

      {/* Review Cards List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-blush p-12 text-center space-y-3">
          <Filter className="w-8 h-8 text-muted mx-auto stroke-1" />
          <h3 className="font-heading font-medium text-ink text-sm">No reviews found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {filterStatus === "pending"
              ? "All submitted reviews have been moderated. Check back when customers submit new feedback."
              : "No reviews match your selected filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredReviews.map((rev) => {
            const dateStr = new Date(rev.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-blush p-5 shadow-xs hover:border-brand/30 transition-all space-y-3"
              >
                {/* Top Row: Product info & Status badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blush/40">
                  <div className="flex items-center gap-3">
                    {rev.productImage ? (
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-blush/60 shrink-0 bg-blush/10">
                        <Image
                          src={rev.productImage}
                          alt={rev.productName}
                          fill
                          sizes="44px"
                          className="object-cover"
                          unoptimized={rev.productImage.startsWith("http")}
                        />
                      </div>
                    ) : null}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink text-xs sm:text-sm">
                          {rev.productName}
                        </span>
                        <Link
                          href={`/product/${rev.productSlug}`}
                          target="_blank"
                          className="text-muted hover:text-brand transition-colors p-0.5"
                          title="View on Storefront"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <p className="text-[11px] text-muted">
                        Submitted on {dateStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {rev.status === "published" && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Published
                      </span>
                    )}
                    {rev.status === "pending" && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                      </span>
                    )}
                    {rev.status === "rejected" && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-600" /> Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Row: Rating, Reviewer Name, Title, Body */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {renderStars(rev.rating)}
                    <span className="text-xs font-semibold text-ink">
                      {rev.userName}
                    </span>
                    {rev.isVerified && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Buyer
                      </span>
                    )}
                  </div>

                  {rev.title && (
                    <h4 className="text-xs font-semibold text-ink">
                      {rev.title}
                    </h4>
                  )}

                  <p className="text-xs text-muted leading-relaxed whitespace-pre-line bg-blush/10 p-3 rounded-xl border border-blush/30">
                    {rev.body}
                  </p>
                </div>

                {/* Bottom Row: Moderation Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-blush/40">
                  {rev.status !== "published" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleApprove(rev.id)}
                      className="text-xs h-8 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Publish
                    </Button>
                  )}

                  {rev.status !== "rejected" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleReject(rev.id)}
                      className="text-xs h-8 px-3 border-amber-200 text-amber-700 hover:bg-amber-50 flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5 text-amber-600" />
                      Reject
                    </Button>
                  )}

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(rev.id)}
                    className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Permanently Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
