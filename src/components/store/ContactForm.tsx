"use client";

import { useState, useTransition, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { submitEnquiryAction } from "@/app/actions/enquiry";

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await submitEnquiryAction(formData);
      if (res.success) {
        setToast({
          type: "success",
          title: "Message Sent",
          message: res.message,
        });
        formRef.current?.reset();
      } else {
        setToast({
          type: "error",
          title: "Submission Error",
          message: res.message,
        });
      }
    });
  };

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-pink-light shadow-xs max-w-2xl mx-auto space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="space-y-1 text-center">
        <h2 className="font-heading font-bold text-2xl text-ink">
          Send us a Confidential Message
        </h2>
        <p className="text-xs text-muted">
          Our team usually responds within 2 to 4 business hours.
        </p>
      </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">Full Name</label>
            <Input name="name" placeholder="Your Name" required disabled={isPending} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">Email Address</label>
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={isPending}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">Phone Number (Optional)</label>
            <Input
              name="phone"
              type="tel"
              placeholder="10-digit mobile number"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">Subject / Order ID</label>
            <Input
              name="subject"
              placeholder="e.g. Sizing question or order query"
              required
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-ink">Message</label>
          <textarea
            name="message"
            rows={4}
            required
            disabled={isPending}
            placeholder="How can we assist you today?"
            className="w-full rounded-2xl border border-pink-light bg-blush/20 p-3.5 text-xs sm:text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 transition-all resize-none"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="w-full shadow-md text-xs sm:text-sm font-semibold py-3"
        >
          <Send className="w-4 h-4 mr-2" />
          {isPending ? "Sending Message..." : "Send Confidential Message"}
        </Button>
      </form>
    </div>
  );
}
