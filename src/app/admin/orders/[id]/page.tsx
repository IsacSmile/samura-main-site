import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminOrderDetail } from "@/lib/services/orders";
import { AdminOrderDetailView } from "@/components/admin/AdminOrderDetailView";

export const metadata: Metadata = {
  title: "Order Details | Admin Portal",
  description: "Manage individual customer order fulfillment and payments.",
};

interface AdminOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  await requireAdmin();

  const { id } = await params;
  const order = await getAdminOrderDetail(id);

  if (!order) {
    notFound();
  }

  return <AdminOrderDetailView order={order} />;
}
