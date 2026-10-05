"use client";

import React, { useState } from "react";
import { Star, CheckCircle2, MessageSquarePlus, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ReviewItem {
  id: string;
  userName: string;
  rating: number;
  title: string | null;
  body: string;
  status: "pending" | "approved" | "rejected";
  isVerified: boolean;
  createdAt: Date;
}

export interface ProductReviewsProps {
  productId: string;
  productName: string;
  reviews: ReviewItem[];
}

export function ProductReviews({
  productId,
  productName,
  reviews,
}: ProductReviewsProps) {
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [hpWebsite, setHpWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const approvedReviews = reviews.filter((r) => r.status === "approved");
  const reviewCount = approvedReviews.length;

  const averageRating =
    reviewCount > 0
      ? (
          approvedReviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
        ).toFixed(1)
      : null;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBody.trim()) {
      setSubmitError("Please fill in your name and review.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          userName: formName.trim(),
          rating: formRating,
          title: formTitle.trim() || undefined,
          body: formBody.trim(),
          hp_website: hpWebsite,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit review");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsWriteModalOpen(false);
        setSubmitSuccess(false);
        setFormName("");
        setFormTitle("");
        setFormBody("");
        setHpWebsite("");
        setFormRating(5);
      }, 2500);
    } catch {
      setSubmitError("Something went wrong submitting your review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blush">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-xl sm:text-2xl text-ink">
              Verified Customer Reviews
            </h3>
            {reviewCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-blush text-brand text-xs font-bold border border-pink-light">
                {reviewCount}
              </span>
            )}
          </div>
          <p className="text-xs text-muted">
            Honest feedback from real customers across India. Zero sponsored or fake reviews.
          </p>
        </div>

        <Button
          onClick={() => setIsWriteModalOpen(true)}
          variant="secondary"
          size="sm"
          className="shrink-0"
        >
          <MessageSquarePlus className="w-4 h-4 mr-1.5 text-brand" />
          Write a Review
        </Button>
      </div>

      {/* Main Reviews Area */}
      {reviewCount > 0 ? (
        <div className="space-y-6">
          {/* Average Rating Scorecard */}
          <div className="p-6 rounded-3xl bg-blush/40 border border-pink-light flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center sm:text-left space-y-1">
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="font-heading font-extrabold text-4xl text-ink">
                  {averageRating}
                </span>
                <span className="text-sm text-muted font-medium">/ 5.0</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(Number(averageRating))
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200 fill-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted block">
                Based on {reviewCount} verified {reviewCount === 1 ? "review" : "reviews"}
              </span>
            </div>

            <div className="h-px sm:h-16 w-full sm:w-px bg-pink-light" />

            <div className="text-xs text-muted space-y-1 text-center sm:text-left">
              <span className="font-semibold text-ink flex items-center justify-center sm:justify-start gap-1">
                <CheckCircle2 className="w-4 h-4 text-success" /> 100% Genuine Experiences
              </span>
              <p>
                Every review on Samaura is submitted by verified customers and strictly moderated for authentic product feedback.
              </p>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {approvedReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-pink-light shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    {rev.title && (
                      <h4 className="font-heading font-semibold text-sm sm:text-base text-ink">
                        {rev.title}
                      </h4>
                    )}
                  </div>
                  <span className="text-[10px] text-muted shrink-0">
                    {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-ink leading-relaxed">
                  {rev.body}
                </p>

                <div className="pt-2 border-t border-blush flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-ink">
                    <span>{rev.userName}</span>
                    {rev.isVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        Verified Buyer
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted">India</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State: No reviews yet (Never fake data) */
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-blush/30 border border-pink-light space-y-4">
          <div className="w-14 h-14 rounded-full bg-white mx-auto flex items-center justify-center text-brand border border-pink-light shadow-xs">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h4 className="font-heading font-bold text-base text-ink">
              No Reviews Yet
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Be the first to share your honest experience with {productName}. Your review helps fellow women make mindful choices.
            </p>
          </div>
          <Button
            onClick={() => setIsWriteModalOpen(true)}
            variant="secondary"
            size="sm"
          >
            Leave the First Review
          </Button>
        </div>
      )}

      {/* Write a Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-pink-light space-y-5 animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-blush">
              <h3 className="font-heading font-bold text-lg text-ink">
                Write a Review
              </h3>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1 rounded-full text-muted hover:text-brand"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <h4 className="font-heading font-bold text-base text-ink">
                  Thank You for Your Review!
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  Your review has been submitted for moderation and will appear once approved.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Rating selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                    Your Rating:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                        aria-label={`${star} star rating`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= formRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-ink ml-2">
                      {formRating} / 5
                    </span>
                  </div>
                </div>

                {/* Name input */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                    Your Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Priya S."
                    className="w-full bg-blush/40 border border-pink-light rounded-xl px-3.5 py-2 text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>

                {/* Review Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                    Headline (Optional):
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Incredibly soft and zero rashes"
                    className="w-full bg-blush/40 border border-pink-light rounded-xl px-3.5 py-2 text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>

                {/* Honeypot anti-spam field */}
                <input
                  type="text"
                  name="hp_website"
                  value={hpWebsite}
                  onChange={(e) => setHpWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ display: "none" }}
                  aria-hidden="true"
                />

                {/* Review Body */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                    Review Details:
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    placeholder="How was the absorption, comfort, and softness? Did you experience any skin irritation?"
                    className="w-full bg-blush/40 border border-pink-light rounded-xl p-3 text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>

                {submitError && (
                  <p className="text-xs text-red-500 font-medium">{submitError}</p>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsWriteModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmitting}
                  >
                    Submit for Approval
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
