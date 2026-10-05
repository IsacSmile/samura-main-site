import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin Console | Samaura Healthcare",
  description: "Product catalog, category hierarchy, and review moderation management.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let adminUser;
  try {
    adminUser = await requireAdmin();
  } catch {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col lg:flex-row text-ink">
      <AdminSidebar
        userEmail={adminUser.email}
        userName={adminUser.name}
      />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
