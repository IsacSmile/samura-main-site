import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderByPublicToken } from "@/lib/services/orders";
import { getSetting } from "@/lib/services/settings";
import { InvoiceView } from "@/components/orders/InvoiceView";

interface InvoicePageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: InvoicePageProps): Promise<Metadata> {
  const { token } = await params;
  const order = await getOrderByPublicToken(token);
  return {
    title: order ? `Invoice #${order.orderNumber} | Samaura Healthcare` : "Invoice | Samaura Healthcare",
    description: "Official tax invoice and customer receipt.",
  };
}

export default async function OrderInvoicePage({ params }: InvoicePageProps) {
  const { token } = await params;
  const order = await getOrderByPublicToken(token);

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
