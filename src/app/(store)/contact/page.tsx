import { Metadata } from "next";
import { MessageCircle, Mail, Clock, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const metadata: Metadata = {
  title: "Contact & Confidential Helpline | Samaura Healthcare",
  description: "Get in touch with Samaura Healthcare. 100% confidential WhatsApp helpline, order enquiries, and medical product support.",
};

export default function ContactPage() {
  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Always Here For You</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink">
            Contact & Care Helpline
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Need sizing advice, order tracking updates, or confidential guidance? Our all-female care team is ready to help.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="https://wa.me/919876543210?text=Hi%20Samaura%20Team%2C%20I%20have%20a%20question%20regarding%20hygiene%20products."
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs hover:shadow-md transition-all group space-y-4 text-center sm:text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto sm:mx-0 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-ink">
                WhatsApp Support
              </h3>
              <p className="text-xs text-muted mt-1">
                Instant & 100% confidential chat with care specialists.
              </p>
            </div>
            <div className="text-sm font-semibold text-emerald-600">
              +91 98765 43210
            </div>
          </a>

          <a
            href="mailto:care@samaura.com"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs hover:shadow-md transition-all group space-y-4 text-center sm:text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-blush text-brand flex items-center justify-center mx-auto sm:mx-0 group-hover:scale-105 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-ink">
                Email Customer Care
              </h3>
              <p className="text-xs text-muted mt-1">
                For order support, corporate enquiries & press.
              </p>
            </div>
            <div className="text-sm font-semibold text-brand">
              care@samaura.com
            </div>
          </a>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs space-y-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-blush text-brand flex items-center justify-center mx-auto sm:mx-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-ink">
                Helpline Hours
              </h3>
              <p className="text-xs text-muted mt-1">
                Monday to Saturday
              </p>
            </div>
            <div className="text-xs font-medium text-ink">
              9:00 AM – 7:00 PM IST
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-pink-light shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="font-heading font-bold text-2xl text-ink">
              Send us a Message
            </h2>
            <p className="text-xs text-muted">
              We usually respond within 2 to 4 hours during business days.
            </p>
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Full Name</label>
                <Input placeholder="Your Name" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Email Address</label>
                <Input type="email" placeholder="you@example.com" required />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">Subject / Order Number</label>
              <Input placeholder="e.g. Sizing query or order enquiry" required />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">Message</label>
              <textarea
                rows={4}
                required
                placeholder="How can we assist you today?"
                className="w-full rounded-2xl border border-pink-light bg-blush/20 p-3.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 transition-all resize-none"
              />
            </div>

            <Button type="button" size="lg" className="w-full shadow-md">
              <Send className="w-4 h-4 mr-2" /> Send Confidential Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
