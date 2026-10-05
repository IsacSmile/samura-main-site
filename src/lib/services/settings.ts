import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const DEFAULT_SETTINGS: Record<string, { value: string; description: string }> = {
  announcement_text: {
    value: "Free Discreet Shipping on orders above ₹499 | Code: WELCOME15",
    description: "Storefront top banner promo and announcement copy",
  },
  announcement_left_badge: {
    value: "Gentle & Breathable Cotton",
    description: "Announcement bar left badge copy (non-substantiated claim free)",
  },
  announcement_right_badge: {
    value: "Delivered in Plain Discreet Packaging",
    description: "Announcement bar right badge copy",
  },
  trust_badge_certified_organic: {
    value: "false",
    description: "Enable '100% GOTS Certified' badge sitewide once certificate is verified",
  },
  trust_badge_dermatology: {
    value: "false",
    description: "Enable 'Dermatologically Tested' badge sitewide once lab reports are on file",
  },
  trust_badge_leak_guard: {
    value: "false",
    description: "Enable absolute leak guarantee badge once lab absorbency certificate exists",
  },
};

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const rows = await db.select().from(settings);
    const map: Record<string, string> = {};

    // Initialize with defaults
    for (const [key, item] of Object.entries(DEFAULT_SETTINGS)) {
      map[key] = item.value;
    }

    // Override with DB values
    for (const row of rows) {
      map[row.key] = row.value;
    }

    return map;
  } catch {
    const map: Record<string, string> = {};
    for (const [key, item] of Object.entries(DEFAULT_SETTINGS)) {
      map[key] = item.value;
    }
    return map;
  }
}

export async function getSetting(key: string, defaultValue?: string): Promise<string> {
  try {
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);

    if (row?.value !== undefined) {
      return row.value;
    }
  } catch {
    // Return fallback on db read error
  }

  return defaultValue ?? DEFAULT_SETTINGS[key]?.value ?? "";
}

export async function setSetting(key: string, value: string, description?: string): Promise<void> {
  const desc = description ?? DEFAULT_SETTINGS[key]?.description ?? null;
  await db
    .insert(settings)
    .values({
      key,
      value,
      description: desc,
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value,
        description: desc,
      },
    });
}
