import { redirect, notFound } from "next/navigation";
import { MockPaymentView } from "./MockPaymentView";
import { getOrderByPublicToken } from "@/lib/services/orders";

interface MockPaymentPageProps {
  searchParams: Promise<{
    token?: string;
    orderId?: string;
    amount?: string;
  }>;
}

export default async function MockPaymentPage({ searchParams }: MockPaymentPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { token, orderId } = await searchParams;

  if (!token || !orderId) {
    redirect("/cart");
  }

  const order = await getOrderByPublicToken(token);

  if (!order) {
    redirect("/cart");
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <MockPaymentView
        orderId={orderId}
        token={token}
        orderNumber={order.orderNumber}
        amountPaise={order.totalPaise}
        customerName={order.customerName}
        customerEmail={order.customerEmail}
      />
    </div>
  );
}
