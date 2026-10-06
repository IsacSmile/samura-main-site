import { Resend } from "resend";
import { getSetting } from "@/lib/services/settings";
import { formatPaymentMethod } from "@/lib/utils/statusLabels";

const resendApiKey = process.env.RESEND_API_KEY || "";
if (process.env.NODE_ENV === "production" && !resendApiKey) {
  console.error("[CRITICAL ERROR] RESEND_API_KEY environment variable is missing in production! Email delivery will fail.");
}
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Escapes HTML characters in user-controlled inputs to prevent HTML injection in emails.
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface OrderItemEmailSnapshot {
  name: string;
  variant: string;
  quantity: number;
  price: string;
}

export interface OrderEmailProps {
  to: string;
  orderNumber: string;
  customerName: string;
  totalRupees: string;
  items: OrderItemEmailSnapshot[];
  publicToken?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

export interface StatusUpdateEmailProps {
  to: string;
  orderNumber: string;
  customerName: string;
  status: "confirmed" | "shipped" | "delivered" | "cancelled";
  courierName?: string | null;
  trackingNumber?: string | null;
  cancelReason?: string | null;
  publicToken?: string;
}

export interface PasswordResetEmailProps {
  to: string;
  name: string;
  resetUrl: string;
}

/**
 * Sends order confirmation email to customer.
 */
export async function sendOrderConfirmationEmail(props: OrderEmailProps): Promise<{ success: boolean; simulated?: boolean; error?: unknown }> {
  const { to, orderNumber, customerName, totalRupees, items, publicToken, paymentMethod } = props;

  const safeName = escapeHtml(customerName);
  const safeOrderNumber = escapeHtml(orderNumber);
  const safeTotal = escapeHtml(totalRupees);
  const safePaymentMethod = escapeHtml(formatPaymentMethod(paymentMethod));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const orderUrl = publicToken ? `${siteUrl}/order/${publicToken}` : `${siteUrl}/account`;

  if (!resend || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_test_placeholder") {
    console.log(
      `\n[DEV EMAIL LOG - CUSTOMER CONFIRMATION]\nTo: ${to}\nOrder: #${safeOrderNumber}\nTotal: ${safeTotal}\nCustomer: ${safeName}\nItems: ${items.length}\nOrder Link: ${orderUrl}\n`
    );
    return { success: true, simulated: true };
  }

  try {
    const itemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #FFD9E2; font-size: 13px;">
            <strong>${escapeHtml(item.name)}</strong><br/>
            <span style="color: #6B5B62; font-size: 12px;">${escapeHtml(item.variant)}</span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #FFD9E2; text-align: center; font-size: 13px;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #FFD9E2; text-align: right; font-size: 13px;">${escapeHtml(item.price)}</td>
        </tr>
      `
      )
      .join("");

    const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "Samaura Healthcare <orders@samaura.com>";

    await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Order Confirmed: #${safeOrderNumber} | Samaura Healthcare`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #FFD9E2; border-radius: 20px; background-color: #FFFFFF;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #FFF1F4;">
            <h1 style="color: #C8202F; margin: 0; font-size: 24px; font-weight: bold;">Samaura Healthcare</h1>
            <p style="color: #6B5B62; font-size: 13px; margin-top: 4px;">Gentle & Soft Cotton Personal Care</p>
          </div>

          <div style="background-color: #FFF1F4; padding: 18px; border-radius: 14px; margin: 20px 0;">
            <h2 style="color: #3B1F2B; font-size: 17px; margin-top: 0; margin-bottom: 6px;">Thank you for your order, ${safeName}!</h2>
            <p style="color: #6B5B62; font-size: 13px; margin: 0; line-height: 1.5;">
              We have received order <strong>#${safeOrderNumber}</strong>. Your wellness essentials will be packaged in completely plain, discreet packaging for your utmost privacy.
            </p>
          </div>

          <table width="600" style="max-width: 600px; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #FFF1F4; color: #3B1F2B; font-size: 12px; text-transform: uppercase;">
                <th style="padding: 8px 10px; text-align: left;">Item</th>
                <th style="padding: 8px 10px; text-align: center;">Qty</th>
                <th style="padding: 8px 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; padding-top: 10px; border-top: 2px solid #FFD9E2;">
            <span style="font-size: 13px; color: #6B5B62;">Payment (${safePaymentMethod}): </span>
            <strong style="color: #C8202F; font-size: 18px;">${safeTotal}</strong>
            <p style="font-size: 11px; color: #6B5B62; margin: 4px 0 0 0;">Inclusive of all taxes</p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${orderUrl}" style="display: inline-block; background-color: #C8202F; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 30px; font-size: 13px; font-weight: bold; text-transform: uppercase;">View Order & Invoice</a>
          </div>

          <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #FFD9E2; text-align: center; font-size: 12px; color: #6B5B62;">
            <p style="margin: 0;">Discreetly dispatched by Samaura Healthcare • Questions? Reply directly to this email.</p>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send customer order confirmation email:", error);
    return { success: false, error };
  }
}

/**
 * Sends new order alert to store admin.
 */
export async function sendNewOrderAdminAlertEmail(props: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalRupees: string;
  itemCount: number;
  paymentMethod: string;
}): Promise<{ success: boolean; simulated?: boolean; error?: unknown }> {
  const { orderNumber, customerName, customerPhone, totalRupees, itemCount, paymentMethod } = props;

  const adminNotificationEmail =
    (await getSetting("admin_notification_email")) ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    "admin@samaura.com";

  const safeOrderNumber = escapeHtml(orderNumber);
  const safeName = escapeHtml(customerName);
  const safePhone = escapeHtml(customerPhone);
  const safeTotal = escapeHtml(totalRupees);

  if (!resend || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_test_placeholder") {
    console.log(
      `\n[DEV EMAIL LOG - ADMIN ALERT]\nTo: ${adminNotificationEmail}\nNew Order: #${safeOrderNumber}\nCustomer: ${safeName} (${safePhone})\nAmount: ${safeTotal} (${paymentMethod})\nItems: ${itemCount}\n`
    );
    return { success: true, simulated: true };
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "Samaura Healthcare <orders@samaura.com>";

    await resend.emails.send({
      from: fromEmail,
      to: adminNotificationEmail,
      subject: `🚨 New Order Received: #${safeOrderNumber} (${safeTotal})`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #ddd; border-radius: 12px;">
          <h2 style="color: #3B1F2B; margin-top: 0;">New Order #${safeOrderNumber}</h2>
          <p><strong>Customer:</strong> ${safeName} (${safePhone})</p>
          <p><strong>Total:</strong> ${safeTotal}</p>
          <p><strong>Payment Method:</strong> ${escapeHtml(paymentMethod)}</p>
          <p><strong>Items:</strong> ${itemCount}</p>
          <p style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/orders" style="background-color: #3B1F2B; color: white; padding: 10px 16px; text-decoration: none; border-radius: 8px; font-size: 13px;">Manage in Admin Portal</a>
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send admin order alert email:", error);
    return { success: false, error };
  }
}

/**
 * Sends order status update email (shipped with tracking, delivered, cancelled).
 */
export async function sendOrderStatusUpdateEmail(props: StatusUpdateEmailProps): Promise<{ success: boolean; simulated?: boolean; error?: unknown }> {
  const { to, orderNumber, customerName, status, courierName, trackingNumber, cancelReason, publicToken } = props;

  const safeName = escapeHtml(customerName);
  const safeOrderNumber = escapeHtml(orderNumber);
  const safeCourier = escapeHtml(courierName || "Standard Express");
  const safeTracking = escapeHtml(trackingNumber || "N/A");
  const safeReason = escapeHtml(cancelReason || "Cancelled upon request");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const orderUrl = publicToken ? `${siteUrl}/order/${publicToken}` : `${siteUrl}/account`;

  let subject = `Order #${safeOrderNumber} Status Update | Samaura Healthcare`;
  let statusMessage = "";

  if (status === "shipped") {
    subject = `Your Order #${safeOrderNumber} Has Been Dispatched! | Samaura Healthcare`;
    statusMessage = `
      <p style="color: #6B5B62; font-size: 14px;">Great news! Your package is on its way in plain discreet packaging.</p>
      <div style="background-color: #FFF1F4; padding: 14px; border-radius: 10px; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px;"><strong>Courier Partner:</strong> ${safeCourier}</p>
        <p style="margin: 6px 0 0 0; font-size: 13px;"><strong>Tracking ID:</strong> ${safeTracking}</p>
      </div>
    `;
  } else if (status === "delivered") {
    subject = `Delivered: Order #${safeOrderNumber} | Samaura Healthcare`;
    statusMessage = `
      <p style="color: #6B5B62; font-size: 14px;">Your order <strong>#${safeOrderNumber}</strong> has been marked as delivered.</p>
      <p style="color: #6B5B62; font-size: 13px;">We hope our pure cotton products bring you lasting comfort and peace of mind.</p>
    `;
  } else if (status === "cancelled") {
    subject = `Order #${safeOrderNumber} Cancelled | Samaura Healthcare`;
    statusMessage = `
      <p style="color: #6B5B62; font-size: 14px;">Your order <strong>#${safeOrderNumber}</strong> has been cancelled.</p>
      <p style="color: #6B5B62; font-size: 13px;">Reason: ${safeReason}</p>
      <p style="color: #6B5B62; font-size: 13px;">If any payment was captured, our team will process a full refund to your original payment method.</p>
    `;
  }

  if (!resend || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_test_placeholder") {
    console.log(
      `\n[DEV EMAIL LOG - STATUS UPDATE]\nTo: ${to}\nOrder: #${safeOrderNumber}\nNew Status: ${status.toUpperCase()}\nDetails: Courier=${safeCourier}, Tracking=${safeTracking}\n`
    );
    return { success: true, simulated: true };
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "Samaura Healthcare <orders@samaura.com>";

    await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #FFD9E2; border-radius: 16px; background-color: #FFFFFF;">
          <h2 style="color: #C8202F; margin-top: 0;">Samaura Healthcare</h2>
          <h3 style="color: #3B1F2B; margin-top: 10px;">Hello, ${safeName}</h3>
          ${statusMessage}
          <div style="text-align: center; margin-top: 24px;">
            <a href="${orderUrl}" style="background-color: #C8202F; color: #FFFFFF; text-decoration: none; padding: 10px 22px; border-radius: 25px; font-size: 13px; font-weight: bold;">View Order Status</a>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send order status update email:", error);
    return { success: false, error };
  }
}

/**
 * Sends password reset email with secure single-use link.
 */
export async function sendPasswordResetEmail(props: PasswordResetEmailProps): Promise<{ success: boolean; simulated?: boolean; error?: unknown }> {
  const { to, name, resetUrl } = props;
  const safeName = escapeHtml(name);

  if (!resend || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_test_placeholder") {
    console.log(
      `\n[DEV EMAIL LOG - PASSWORD RESET]\nTo: ${to}\nName: ${safeName}\nReset Link: ${resetUrl}\n(Valid for 1 hour)\n`
    );
    return { success: true, simulated: true };
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "Samaura Healthcare <security@samaura.com>";

    await resend.emails.send({
      from: fromEmail,
      to,
      subject: "Reset Your Password | Samaura Healthcare",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #FFD9E2; border-radius: 16px; background-color: #FFFFFF;">
          <h2 style="color: #C8202F; margin-top: 0;">Samaura Healthcare</h2>
          <h3 style="color: #3B1F2B; margin-top: 10px;">Password Reset Request</h3>
          <p style="color: #6B5B62; font-size: 14px;">Hello ${safeName},</p>
          <p style="color: #6B5B62; font-size: 14px;">We received a request to reset the password for your Samaura Healthcare account. Click the button below to set a new password. This link is single-use and will expire in 1 hour.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #C8202F; color: #FFFFFF; text-decoration: none; padding: 12px 26px; border-radius: 30px; font-size: 13px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #6B5B62; font-size: 12px;">If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error };
  }
}

export interface EmailVerificationProps {
  to: string;
  name: string;
  verifyUrl: string;
}

/**
 * Sends customer email verification link.
 */
export async function sendEmailVerificationEmail(
  props: EmailVerificationProps
): Promise<{ success: boolean; simulated?: boolean; error?: unknown }> {
  const { to, name, verifyUrl } = props;
  const safeName = escapeHtml(name);

  if (!resend || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_test_placeholder") {
    console.log(
      `\n[DEV EMAIL LOG - EMAIL VERIFICATION]\nTo: ${to}\nName: ${safeName}\nVerification Link: ${verifyUrl}\n(Valid for 24 hours)\n`
    );
    return { success: true, simulated: true };
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "Samaura Healthcare <security@samaura.com>";

    await resend.emails.send({
      from: fromEmail,
      to,
      subject: "Verify Your Email Address | Samaura Healthcare",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #FFD9E2; border-radius: 16px; background-color: #FFFFFF;">
          <h2 style="color: #C8202F; margin-top: 0;">Samaura Healthcare</h2>
          <h3 style="color: #3B1F2B; margin-top: 10px;">Please Verify Your Email</h3>
          <p style="color: #6B5B62; font-size: 14px;">Hello ${safeName},</p>
          <p style="color: #6B5B62; font-size: 14px;">Thank you for registering with Samaura. Please confirm your email address by clicking the button below. Once confirmed, any previous guest orders placed with this email address will be linked to your account.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${verifyUrl}" style="background-color: #C8202F; color: #FFFFFF; text-decoration: none; padding: 12px 26px; border-radius: 30px; font-size: 13px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p style="color: #6B5B62; font-size: 12px;">This link is single-use and valid for 24 hours. If you did not create an account on Samaura, please disregard this email.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send email verification email:", error);
    return { success: false, error };
  }
}

export interface EnquiryEmailProps {
  name: string;
  email: string;
  phone?: string | null;
  topic?: string | null;
  subject: string;
  message: string;
}

/**
 * Sends notification email to admin when a customer enquiry is submitted.
 */
export async function sendNewEnquiryAdminEmail(
  props: EnquiryEmailProps
): Promise<{ success: boolean; simulated?: boolean; error?: unknown }> {
  const { name, email, phone, topic, subject, message } = props;
  const adminEmail = (await getSetting("contact_email")) || "admin@samaura.com";

  if (!resend || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_test_placeholder") {
    console.log(
      `\n[DEV EMAIL LOG - NEW ENQUIRY ADMIN ALERT]\nTo: ${adminEmail}\nFrom: ${name} (${email})\nPhone: ${phone || "N/A"}\nTopic: ${topic || "General"}\nSubject: ${subject}\nMessage: ${message}\n`
    );
    return { success: true, simulated: true };
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "Samaura Support <care@samaura.com>";

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `New Customer Enquiry [${escapeHtml(topic || "General")}]: ${escapeHtml(subject)}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #FFD9E2; border-radius: 16px; background-color: #FFFFFF;">
          <h2 style="color: #C8202F; margin-top: 0;">Samaura Customer Care Desk</h2>
          <h3 style="color: #3B1F2B;">New Store Enquiry Received</h3>
          <p style="color: #6B5B62; font-size: 14px;"><strong>Customer:</strong> ${escapeHtml(name)}</p>
          <p style="color: #6B5B62; font-size: 14px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p style="color: #6B5B62; font-size: 14px;"><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
          <p style="color: #6B5B62; font-size: 14px;"><strong>Topic:</strong> <span style="background-color: #FFF1F4; padding: 3px 8px; border-radius: 6px; font-weight: bold; color: #C8202F;">${escapeHtml(topic || "General")}</span></p>
          <p style="color: #6B5B62; font-size: 14px;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <div style="background-color: #FFF1F4; padding: 16px; border-radius: 12px; margin: 16px 0; color: #3B1F2B; font-size: 14px; white-space: pre-wrap;">
            ${escapeHtml(message)}
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send admin enquiry alert:", error);
    return { success: false, error };
  }
}

