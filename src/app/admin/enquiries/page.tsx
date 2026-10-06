import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { enquiries } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { AdminEnquiriesView } from "@/components/admin/AdminEnquiriesView";

export const metadata = {
  title: "Customer Enquiries | Samaura Admin",
  description: "View customer support enquiries and contact submissions.",
};

export default async function AdminEnquiriesPage() {
  await requireAdmin();

  const allEnquiries = await db
    .select()
    .from(enquiries)
    .orderBy(desc(enquiries.createdAt));

  return <AdminEnquiriesView initialEnquiries={allEnquiries} />;
}
