import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { AdminCouponsView } from "@/components/admin/AdminCouponsView";

export const metadata = {
  title: "Coupons | Samaura Admin",
  description: "Manage promo coupons and discount rules.",
};

export default async function AdminCouponsPage() {
  await requireAdmin();

  const allCoupons = await db
    .select()
    .from(coupons)
    .orderBy(desc(coupons.isActive), desc(coupons.code));

  return <AdminCouponsView initialCoupons={allCoupons} />;
}
