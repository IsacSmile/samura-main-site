import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { AdminPagesView } from "@/components/admin/AdminPagesView";

export const metadata = {
  title: "Pages CMS | Samaura Admin",
  description: "Edit static pages with live Markdown preview.",
};

export default async function AdminPagesPage() {
  await requireAdmin();

  const allPages = await db
    .select()
    .from(pages)
    .orderBy(desc(pages.updatedAt));

  return <AdminPagesView initialPages={allPages} />;
}
