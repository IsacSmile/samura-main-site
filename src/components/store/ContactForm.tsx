"use client";

import { useState, useTransition, useRef } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { submitEnquiryAction } from "@/app/actions/enquiry";

interface ContactFormProps {
  initialTopic?: string;
}

export function ContactForm({ initialTopic = "General" }: ContactFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [topic, setTopic] = useState(initialTopic);
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await submitEnquiryAction(formData);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setFormError(res.message);
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="bg-white border border-pink-light rounded-2xl p-8 sm:p-12 text-center space-y-3">
        <CheckCircle className="w-8 h-8 text-brand mx-auto" strokeWidth={1.75} />
        <h2 className="font-heading font-semibold text-lg sm:text-xl text-ink">
          Thanks, we have received your message.
        </h2>
        <p className="text-xs sm:text-sm text-muted">
          Our team will review your enquiry and get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-pink-light space-y-5">
      {formError && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span>{formError}</span>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* Anti-spam Honeypot field (hidden from genuine users) */}
        <div style={{ display: "none" }} aria-hidden="true">
          <input
            type="text"
            name="hp_website"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        {/* Topic Selector */}
        <div className="space-y-1.5">
          <label htmlFor="contact-topic" className="block text-xs font-medium text-ink">
            Topic
          </label>
          <select
            id="contact-topic"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isPending}
            className="w-full min-h-11 bg-white border border-pink-light rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ink transition-colors focus:outline-none focus:border-brand disabled:opacity-50 cursor-pointer"
          >
            <option value="General">General</option>
            <option value="Menstrual cup">Menstrual cup</option>
            <option value="Awareness session">Awareness session</option>
            <option value="Gift pack">Gift pack</option>
            <option value="Institutional/CSR">Institutional/CSR</option>
          </select>
          {fieldErrors.topic && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.topic}</p>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="contact-name" className="block text-xs font-medium text-ink">
            Full name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            disabled={isPending}
            placeholder="Your name"
            className="w-full min-h-11 bg-white border border-pink-light rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ink transition-colors focus:outline-none focus:border-brand placeholder:text-muted/60 disabled:opacity-50"
          />
          {fieldErrors.name && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="contact-email" className="block text-xs font-medium text-ink">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={isPending}
            placeholder="you@example.com"
            className="w-full min-h-11 bg-white border border-pink-light rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ink transition-colors focus:outline-none focus:border-brand placeholder:text-muted/60 disabled:opacity-50"
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* Phone (Optional) */}
        <div className="space-y-1.5">
          <label htmlFor="contact-phone" className="block text-xs font-medium text-ink">
            Phone (optional)
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            disabled={isPending}
            placeholder="Mobile number"
            className="w-full min-h-11 bg-white border border-pink-light rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ink transition-colors focus:outline-none focus:border-brand placeholder:text-muted/60 disabled:opacity-50"
          />
          {fieldErrors.phone && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label htmlFor="contact-message" className="block text-xs font-medium text-ink">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={4}
            required
            disabled={isPending}
            placeholder="How can we help you?"
            className="w-full min-h-27.5 bg-white border border-pink-light rounded-xl p-3.5 text-xs sm:text-sm text-ink transition-colors focus:outline-none focus:border-brand placeholder:text-muted/60 disabled:opacity-50 resize-y"
          />
          {fieldErrors.message && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full min-h-11 rounded-full bg-brand hover:bg-brand-dark text-white font-medium text-xs sm:text-sm py-2.5 px-4 transition-colors disabled:opacity-50 touch-manipulation cursor-pointer"
        >
          {isPending ? "Sending message..." : "Send message"}
        </button>
      </form>
    </div>
  );
}
