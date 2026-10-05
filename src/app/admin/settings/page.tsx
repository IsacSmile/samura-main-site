import { requireAdmin } from "@/lib/auth";
import { getAllSettings } from "@/lib/services/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = {
  title: "Settings & Compliance | Samaura Admin",
  description: "Configure announcement banners and compliance trust badge toggles.",
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const allSettings = await getAllSettings();

  return <SettingsForm initialSettings={allSettings} />;
}
