import { db } from "@/db";
import { settings, shippingRules } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

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
  nav_offers_badge: {
    value: "Offers",
    description: "Badge text next to Offers & Bundles in navigation (from settings)",
  },
  dispatch_time_text: {
    value: "Orders are dispatched within 24 hours of placement (excluding Sundays and national holidays)",
    description: "Standard dispatch turnaround copy",
  },
  shipping_free_threshold_paise: {
    value: "49900",
    description: "Free shipping threshold in paise (49900 = ₹499)",
  },
  shipping_flat_fee_paise: {
    value: "5000",
    description: "Flat standard shipping fee in paise (5000 = ₹50)",
  },
  cod_enabled: {
    value: "true",
    description: "Enable Cash on Delivery option at checkout",
  },
  cod_max_order_paise: {
    value: "250000",
    description: "Maximum order amount in paise allowed for Cash on Delivery (250000 = ₹2500)",
  },
  cod_fee_paise: {
    value: "0",
    description: "Extra handling fee in paise for Cash on Delivery",
  },
  trust_badge_cotton: {
    value: "true",
    description: "Enable 'Soft Pure Cotton' badge sitewide",
  },
  trust_badge_gentle: {
    value: "true",
    description: "Enable 'Gentle Everyday Care' badge sitewide",
  },
  trust_badge_protection: {
    value: "true",
    description: "Enable 'Secure Day & Night Protection' badge sitewide",
  },
  seller_name: {
    value: "Samaura Healthcare",
    description: "Official brand/business entity name printed on invoices",
  },
  seller_address: {
    value: "No. 12, Wellness Avenue, HSR Layout, Bengaluru, Karnataka - 560102",
    description: "Physical dispatch center address printed on tax invoices",
  },
  seller_email: {
    value: "care@samaura.com",
    description: "Support contact email for billing inquiries",
  },
  seller_phone: {
    value: "+91 98765 43210",
    description: "Support contact phone number",
  },
  seller_gstin: {
    value: "",
    description: "Goods and Services Tax Identification Number (empty until client confirms registration)",
  },
  show_gst_breakup: {
    value: "false",
    description: "Flag to display explicit CGST/SGST breakup lines on invoice (do not enable without verified GSTIN)",
  },
};

export async function getActiveShippingRules() {
  try {
    return await db
      .select()
      .from(shippingRules)
      .where(eq(shippingRules.isActive, true))
      .orderBy(asc(shippingRules.minOrderPaise));
  } catch {
    return [];
  }
}

export async function getFreeShippingThresholdPaise(): Promise<number> {
  try {
    const rules = await getActiveShippingRules();
    const freeRule = rules.find((r) => r.feePaise === 0);
    if (freeRule) return freeRule.minOrderPaise;

    const settingVal = await getSetting("shipping_free_threshold_paise");
    if (settingVal) return parseInt(settingVal, 10);
  } catch {
    // fallback
  }
  return 49900;
}

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
