"use client";

import { useState, useTransition } from "react";
import {
  Save,
  ShieldAlert,
  Sparkles,
  Sliders,
  Phone,
  FileCheck,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { saveSettingsAction } from "@/app/admin/actions/settings";

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === "true" ? "false" : "true",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await saveSettingsAction(settings);
      if (!res.success) {
        setToast({
          type: "error",
          title: "Save Failed",
          message: "Failed to update configuration settings.",
        });
      } else {
        setToast({
          type: "success",
          title: "Settings Saved",
          message: res.message || "Settings updated successfully.",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Save Bar */}
      <div className="flex items-center justify-between border-b border-blush pb-5">
        <div>
          <h1 className="text-2xl font-serif text-ink tracking-tight font-medium">
            Storefront Settings & Compliance
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Configure contact details, WhatsApp helpline, COD rules, GSTIN tax invoicing, and compliance banners.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="text-xs h-10 px-5 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isPending ? "Saving..." : "Save All Settings"}
        </Button>
      </div>

      {/* Section 1: Store Contact & Helpline Details */}
      <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-blush/50">
          <Phone className="w-5 h-5 text-brand" />
          <h2 className="font-medium text-ink text-base">Store Contact & WhatsApp Helpline</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              WhatsApp Support Number (with country code)
            </label>
            <Input
              value={settings.whatsapp_number || ""}
              onChange={(e) => handleChange("whatsapp_number", e.target.value)}
              placeholder="e.g. 919876543210"
              className="text-xs"
            />
            <p className="text-[11px] text-muted mt-1">
              Used across the site for the WhatsApp helpline button and chat links.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Customer Support Phone
            </label>
            <Input
              value={settings.contact_phone || ""}
              onChange={(e) => handleChange("contact_phone", e.target.value)}
              placeholder="+91 98765 43210"
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Customer Support Email
            </label>
            <Input
              type="email"
              value={settings.contact_email || ""}
              onChange={(e) => handleChange("contact_email", e.target.value)}
              placeholder="care@samaura.com"
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Helpline Working Hours
            </label>
            <Input
              value={settings.helpline_hours || ""}
              onChange={(e) => handleChange("helpline_hours", e.target.value)}
              placeholder="Mon–Sat, 9:00 AM – 7:00 PM IST"
              className="text-xs"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Registered Physical Address
            </label>
            <Input
              value={settings.store_address || ""}
              onChange={(e) => handleChange("store_address", e.target.value)}
              placeholder="123 Wellness Park, HSR Layout, Bengaluru, Karnataka 560102"
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Cash on Delivery (COD) Controls */}
      <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-blush/50">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-brand" />
            <h2 className="font-medium text-ink text-base">Cash on Delivery (COD) Settings</h2>
          </div>
          <span className="text-[11px] font-semibold text-muted">
            {settings.cod_enabled === "true" ? "COD Active" : "COD Disabled"}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-blush bg-blush/10">
            <div>
              <div className="font-semibold text-xs text-ink">Enable Cash on Delivery</div>
              <p className="text-[11px] text-muted mt-0.5">
                Allows customers to pay via COD at checkout.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("cod_enabled")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.cod_enabled === "true" ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.cod_enabled === "true" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Maximum COD Order Value (₹)
            </label>
            <Input
              type="number"
              value={settings.cod_max_paise ? Number(settings.cod_max_paise) / 100 : 2500}
              onChange={(e) =>
                handleChange("cod_max_paise", String(Math.round(Number(e.target.value) * 100)))
              }
              placeholder="2500"
              className="text-xs max-w-xs"
            />
            <p className="text-[11px] text-muted mt-1">
              Orders exceeding this amount must be paid online via Razorpay.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: GST & Tax Invoicing */}
      <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-blush/50">
          <FileCheck className="w-5 h-5 text-brand" />
          <h2 className="font-medium text-ink text-base">GST & Tax Invoicing</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Seller Legal Business Name
            </label>
            <Input
              value={settings.seller_legal_name || ""}
              onChange={(e) => handleChange("seller_legal_name", e.target.value)}
              placeholder="Samaura Healthcare Private Limited"
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Registered GSTIN
            </label>
            <Input
              value={settings.seller_gstin || ""}
              onChange={(e) => handleChange("seller_gstin", e.target.value)}
              placeholder="29AAAAA0000A1Z5"
              className="text-xs uppercase font-mono"
            />
            <p className="text-[11px] text-muted mt-1">
              When configured and breakup is enabled, invoices change from &ldquo;Order Receipt&rdquo; to &ldquo;Tax Invoice&rdquo;.
            </p>
          </div>

          <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl border border-blush bg-blush/10">
            <div>
              <div className="font-semibold text-xs text-ink">Show GST Breakup on Invoices</div>
              <p className="text-[11px] text-muted mt-0.5">
                Displays 12% / 18% CGST &amp; SGST breakdown on receipts and customer invoices.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("show_gst_breakup")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.show_gst_breakup === "true" ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.show_gst_breakup === "true" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: Announcement Bar Settings */}
      <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-blush/50">
          <Sparkles className="w-5 h-5 text-brand" />
          <h2 className="font-medium text-ink text-base">Announcement & Ticker Bar</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Center Banner Text
            </label>
            <Input
              value={settings.announcement_text || ""}
              onChange={(e) => handleChange("announcement_text", e.target.value)}
              placeholder="Free Discreet Shipping on orders above ₹499 | Code: WELCOME15"
              className="text-xs"
            />
            <p className="text-[11px] text-muted mt-1">
              Displayed prominently at the very top of all storefront pages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Left Badge Text
              </label>
              <Input
                value={settings.announcement_left_badge || ""}
                onChange={(e) => handleChange("announcement_left_badge", e.target.value)}
                placeholder="Gentle & Breathable Cotton"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Right Badge Text
              </label>
              <Input
                value={settings.announcement_right_badge || ""}
                onChange={(e) => handleChange("announcement_right_badge", e.target.value)}
                placeholder="Delivered in Plain Discreet Packaging"
                className="text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Medical Disclaimer Copy */}
      <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-blush/50">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="font-medium text-ink text-base">Medical & Wellness Disclaimer</h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">
            Disclaimer Text (Rendered on Blog & Product pages)
          </label>
          <textarea
            rows={3}
            value={settings.medical_disclaimer_text || ""}
            onChange={(e) => handleChange("medical_disclaimer_text", e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-pink-light bg-blush/10 focus:outline-none focus:border-brand leading-relaxed"
            placeholder="The information provided on this platform is for educational hygiene purposes only..."
          />
        </div>
      </div>

      {/* Section 6: Compliance Trust Badges */}
      <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-blush/50">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-brand" />
            <h2 className="font-medium text-ink text-base">
              Product Badges & Quality Highlights
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Compliance Controlled
          </span>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          Marketing badges are controlled here. Ensure that all displayed product badges adhere to consumer protection guidelines with truthful, gentle wording.
        </p>

        <div className="space-y-4 pt-2">
          {/* Badge 1 */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-blush bg-blush/10">
            <div>
              <div className="font-semibold text-xs text-ink">
                Soft Pure Cotton Comfort Badge
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                Displays the pure cotton comfort highlight on product cards and header badges.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("trust_badge_cotton")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.trust_badge_cotton === "true" ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.trust_badge_cotton === "true" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Badge 2 */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-blush bg-blush/10">
            <div>
              <div className="font-semibold text-xs text-ink">
                Gentle Everyday Care Badge
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                Displays gentle formulation highlight in product specifications.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("trust_badge_gentle")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.trust_badge_gentle === "true" ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.trust_badge_gentle === "true" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Badge 3 */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-blush bg-blush/10">
            <div>
              <div className="font-semibold text-xs text-ink">
                Secure Day and Night Protection Badge
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                Displays multi-layer fluid protection highlight.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("trust_badge_protection")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.trust_badge_protection === "true" ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.trust_badge_protection === "true" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
