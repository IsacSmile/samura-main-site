import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { AdminBannersView } from "@/components/admin/AdminBannersView";

export const metadata = {
  title: "Banners & Promos | Samaura Admin",
  description: "Manage storefront banner carousels and scheduled promotional windows.",
};

export default async function AdminBannersPage() {
  await requireAdmin();

  const allBanners = await db
    .select()
    .from(banners)
    .orderBy(asc(banners.sortOrder));

  return <AdminBannersView initialBanners={allBanners} />;
}
