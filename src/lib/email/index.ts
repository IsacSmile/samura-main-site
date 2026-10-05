import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "re_test_placeholder");

export interface OrderEmailProps {
  to: string;
  orderNumber: string;
  customerName: string;
  totalRupees: string;
  items: Array<{
    name: string;
    variant: string;
    quantity: number;
    price: string;
  }>;
}

export async function sendOrderConfirmationEmail({
  to,
  orderNumber,
  customerName,
  totalRupees,
  items,
}: OrderEmailProps) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_test_placeholder") {
    console.log(
      `[DEV EMAIL] Simulated order confirmation for ${to} | Order: ${orderNumber} | Total: ${totalRupees}`
    );
    return { success: true, simulated: true };
  }

  try {
    const itemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #FFD9E2;">${item.name} (${item.variant})</td>
          <td style="padding: 8px; border-bottom: 1px solid #FFD9E2; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #FFD9E2; text-align: right;">${item.price}</td>
        </tr>
      `
      )
      .join("");

    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Samaura Healthcare <orders@samaura.com>",
      to,
      subject: `Order Confirmed: ${orderNumber} | Samaura Healthcare`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #FFD9E2; border-radius: 16px; background-color: #FFFFFF;">
          <div style="text-align: center; padding-bottom: 20px;">
            <h1 style="color: #C8202F; margin: 0;">Samaura Healthcare</h1>
            <p style="color: #6B5B62; font-size: 14px;">Gentle & Organic Female Hygiene</p>
          </div>
          <div style="background-color: #FFF1F4; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
            <h2 style="color: #3B1F2B; font-size: 18px; margin-top: 0;">Thank you for your order, ${customerName}!</h2>
            <p style="color: #6B5B62; font-size: 14px; margin-bottom: 0;">
              Your order <strong>${orderNumber}</strong> has been received and will be packaged in 100% discreet, plain exterior packaging.
            </p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #3B1F2B;">
            <thead>
              <tr style="background-color: #FFF1F4;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div style="text-align: right; padding-top: 16px;">
            <h3 style="color: #C8202F; margin: 0;">Grand Total: ${totalRupees}</h3>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #FFD9E2; text-align: center; font-size: 12px; color: #6B5B62;">
            <p>Need confidential support? Reply directly to this email or WhatsApp us at +91 98765 43210.</p>
          </div>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Resend email dispatch error:", error);
    return { success: false, error };
  }
}
