import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminOrderDetail } from "@/lib/services/orders";
import { getSetting } from "@/lib/services/settings";
import { InvoiceView } from "@/components/orders/InvoiceView";

interface AdminInvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: AdminInvoicePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Admin Invoice View - Order #${id} | Samaura Admin`,
    description: "Printable merchant tax invoice copy.",
  };
}

export default async function AdminOrderInvoicePage({ params }: AdminInvoicePageProps) {
  await requireAdmin();

  const { id } = await params;
  const order = await getAdminOrderDetail(id);

  if (!order) {
    notFound();
  }

  const [sellerName, sellerAddress, sellerEmail, sellerPhone, sellerGstin, showGstBreakup] =
    await Promise.all([
      getSetting("seller_name", "Samaura Healthcare"),
      getSetting(
        "seller_address",
        "No. 12, Wellness Avenue, HSR Layout, Bengaluru, Karnataka - 560102"
      ),
      getSetting("seller_email", "care@samaura.com"),
      getSetting("seller_phone", "+91 98765 43210"),
      getSetting("seller_gstin", ""),
      getSetting("show_gst_breakup", "false"),
    ]);

  return (
    <InvoiceView
      data={{
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        shippingAddressSnapshot:
          typeof order.shippingAddress === "string"
            ? order.shippingAddress
            : JSON.stringify(order.shippingAddress),
        subtotalPaise: order.subtotalPaise,
        discountPaise: order.discountPaise,
        shippingFeePaise: order.shippingFeePaise,
        totalPaise: order.totalPaise,
        couponCode: order.couponCode,
        items: order.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          variantName: i.variantName,
          sku: i.sku,
          quantity: i.quantity,
          unitPricePaise: i.unitPricePaise,
          totalPricePaise: i.totalPricePaise,
        })),
        seller: {
          name: sellerName,
          address: sellerAddress,
          email: sellerEmail,
          phone: sellerPhone,
          gstin: sellerGstin || null,
        },
        showGstBreakup: showGstBreakup === "true",
      }}
    />
  );
}
