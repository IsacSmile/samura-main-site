import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { shippingRules } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { AdminShippingView } from "@/components/admin/AdminShippingView";

export const metadata = {
  title: "Shipping Rules | Samaura Admin",
  description: "Configure tiered shipping fees and free delivery thresholds.",
};

export default async function AdminShippingPage() {
  await requireAdmin();

  const rules = await db
    .select()
    .from(shippingRules)
    .orderBy(asc(shippingRules.minOrderPaise));

  return <AdminShippingView initialRules={rules} />;
}
