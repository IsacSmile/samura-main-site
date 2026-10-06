import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { AdminBlogView } from "@/components/admin/AdminBlogView";

export const metadata = {
  title: "Blog Management | Samaura Admin",
  description: "Create and publish educational hygiene guides and articles.",
};

export default async function AdminBlogPage() {
  await requireAdmin();

  const allPosts = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.publishedAt));

  return <AdminBlogView initialPosts={allPosts} />;
}
