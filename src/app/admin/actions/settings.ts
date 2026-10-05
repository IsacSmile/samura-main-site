"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { setSetting } from "@/lib/services/settings";

export async function saveSettingsAction(settingsMap: Record<string, string>) {
  await requireAdmin();

  for (const [key, value] of Object.entries(settingsMap)) {
    await setSetting(key, value);
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");

  return {
    success: true,
    message: "Settings and compliance configurations saved successfully.",
  };
}
