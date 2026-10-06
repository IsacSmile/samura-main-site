import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCustomerOrderDetail } from "@/lib/services/orders";
import { CustomerOrderDetailView } from "@/components/account/CustomerOrderDetailView";

interface CustomerOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: CustomerOrderPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order Details | Samaura Healthcare`,
    description: `Track and view details for order ${id}.`,
    robots: { index: false, follow: false },
  };
}

export default async function CustomerOrderPage({ params }: CustomerOrderPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const order = await getCustomerOrderDetail(id, session.user.id, session.user.email || undefined);

  if (!order) {
    notFound();
  }

  return <CustomerOrderDetailView order={order} />;
}
