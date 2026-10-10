"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

export interface ReviewItem {
  id: string;
  userName: string;
  rating: number;
  title: string | null;
  body: string;
  status: "pending" | "published" | "rejected";
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
  reviews,
}: ProductReviewsProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formBody, setFormBody] = useState("");
  const [hpWebsite, setHpWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const publishedReviews = reviews.filter((r) => r.status === "published");
  const reviewCount = publishedReviews.length;

  const averageRating =
    reviewCount > 0
      ? (
          publishedReviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
        ).toFixed(1)
      : null;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formBody.trim().length < 10) {
      setSubmitError("Please provide your name and a review of at least 10 characters.");
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
          body: formBody.trim(),
          hp_website: hpWebsite,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit review");
      }

      setSubmitMessage("Thanks. Your review will appear after it has been checked.");
      setIsFormOpen(false);
      setFormName("");
      setFormBody("");
      setHpWebsite("");
      setFormRating(5);
    } catch {
      setSubmitError("Something went wrong submitting your review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blush">
        <div className="space-y-1">
          <h3 className="font-heading font-semibold text-xl text-ink">
            Customer reviews
          </h3>
          {reviewCount > 0 && averageRating && (
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-heading font-semibold text-base text-ink">
                {averageRating}
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= Math.round(Number(averageRating))
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200 fill-gray-200"
                    }`}
                    strokeWidth={1.75}
                  />
                ))}
              </div>
              <span className="text-xs text-muted">
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>

        {!isFormOpen && (
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(true);
              setSubmitMessage("");
              setSubmitError("");
            }}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-full border border-pink-light bg-white text-ink hover:bg-blush font-medium text-xs sm:text-sm transition-colors touch-manipulation cursor-pointer"
          >
            Write a review
          </button>
        )}
      </div>

      {submitMessage && (
        <div className="p-4 rounded-xl bg-white border border-pink-light text-xs sm:text-sm text-ink">
          {submitMessage}
        </div>
      )}

      {/* Inline Review Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitReview}
          className="bg-white border border-pink-light rounded-2xl p-5 sm:p-6 space-y-4"
        >
          {submitError && (
            <p className="text-xs text-red-600 font-medium">{submitError}</p>
          )}

          {/* Star rating accessible radio group */}
          <div className="space-y-1.5">
            <span id="rating-label" className="block text-xs font-medium text-ink">
              Rating
            </span>
            <div
              role="radiogroup"
              aria-labelledby="rating-label"
              className="flex items-center gap-1"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={formRating === star}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  onClick={() => setFormRating(star)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                      e.preventDefault();
                      setFormRating(Math.min(5, formRating + 1));
                    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                      e.preventDefault();
                      setFormRating(Math.max(1, formRating - 1));
                    }
                  }}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-blush transition-colors touch-manipulation focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= formRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                    strokeWidth={1.75}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div className="space-y-1.5">
            <label htmlFor="review-name" className="block text-xs font-medium text-ink">
              Name
            </label>
            <input
              id="review-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Your name"
              className="w-full min-h-[44px] bg-white border border-pink-light rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-brand placeholder:text-muted/60"
            />
          </div>

          {/* Honeypot anti-spam field */}
          <div style={{ display: "none" }} aria-hidden="true">
            <input
              type="text"
              name="hp_website"
              value={hpWebsite}
              onChange={(e) => setHpWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Review body */}
          <div className="space-y-1.5">
            <label htmlFor="review-text" className="block text-xs font-medium text-ink">
              Review
            </label>
            <textarea
              id="review-text"
              required
              rows={4}
              minLength={10}
              maxLength={1000}
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              placeholder="Share your experience (10 to 1000 characters)"
              className="w-full min-h-[110px] bg-white border border-pink-light rounded-xl p-3.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-brand placeholder:text-muted/60 resize-y"
            />
            <div className="text-right text-[11px] text-muted">
              {formBody.length} / 1000 characters
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setSubmitError("");
              }}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-full border border-pink-light bg-white text-muted hover:text-ink font-medium text-xs sm:text-sm transition-colors touch-manipulation cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-full bg-brand hover:bg-brand-dark text-white font-medium text-xs sm:text-sm transition-colors disabled:opacity-50 touch-manipulation cursor-pointer"
            >
              {isSubmitting ? "Submitting..." : "Submit review"}
            </button>
          </div>
        </form>
      )}

      {/* Main Reviews Area */}
      {reviewCount > 0 ? (
        <div className="divide-y divide-blush space-y-4">
          {publishedReviews.map((rev) => (
            <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= rev.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200 fill-gray-200"
                      }`}
                      strokeWidth={1.75}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted">
                  {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              {rev.title && (
                <h4 className="font-heading font-semibold text-sm text-ink">
                  {rev.title}
                </h4>
              )}

              <p className="text-xs sm:text-sm text-ink leading-relaxed">
                {rev.body}
              </p>

              <div className="flex items-center gap-2 text-xs pt-0.5">
                <span className="font-medium text-ink">{rev.userName}</span>
                {rev.isVerified && (
                  <span className="text-xs text-muted">Purchased this product</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-8 text-center space-y-1">
          <p className="text-sm text-muted">No reviews yet.</p>
        </div>
      )}
    </div>
  );
}
