"use client";

import { useState, useTransition } from "react";
import { Save, ShieldAlert, Sparkles, Sliders } from "lucide-react";
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
            Manage announcement bar copy and toggle certified trust badges once official documentation is verified.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="text-xs h-10 px-5 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Section 1: Announcement Bar Settings */}
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

      {/* Section 2: Compliance Trust Badges */}
      <div className="bg-white rounded-2xl p-6 border border-blush shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-blush/50">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-brand" />
            <h2 className="font-medium text-ink text-base">
              Certified Claims & Trust Badges
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Compliance Controlled
          </span>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          In compliance with advertising regulations, absolute claims (&ldquo;100% GOTS Certified&rdquo;, &ldquo;Dermatologist Tested&rdquo;, &ldquo;Zero Leaks&rdquo;) are disabled by default. Enable these badges only after valid laboratory certificates and audit documents are on file.
        </p>

        <div className="space-y-4 pt-2">
          {/* Badge 1 */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-blush bg-blush/10">
            <div>
              <div className="font-semibold text-xs text-ink">
                100% GOTS Certified Organic Cotton Badge
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                Displays the certified organic seal on product cards and header badges.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("trust_badge_certified_organic")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.trust_badge_certified_organic === "true" ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.trust_badge_certified_organic === "true" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Badge 2 */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-blush bg-blush/10">
            <div>
              <div className="font-semibold text-xs text-ink">
                Dermatologically Tested Badge
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                Displays clinical dermatology test seal in product specifications.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("trust_badge_dermatology")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.trust_badge_dermatology === "true" ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.trust_badge_dermatology === "true" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Badge 3 */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-blush bg-blush/10">
            <div>
              <div className="font-semibold text-xs text-ink">
                Absolute Zero-Leak Guarantee Badge
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                Displays 100% leak-proof certification claim.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("trust_badge_leak_guard")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.trust_badge_leak_guard === "true" ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.trust_badge_leak_guard === "true" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
