"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { enquiries } from "@/lib/db/schema";
import { contactEnquirySchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendNewEnquiryAdminEmail } from "@/lib/email";
import { nanoid } from "nanoid";

export async function submitEnquiryAction(formData: FormData) {
  // 1. Honeypot check
  const honeypot = formData.get("hp_website");
  if (honeypot && String(honeypot).trim().length > 0) {
    // Bot detected: return simulated success, bypassing processing
    return {
      success: true,
      message: "Thank you! Your message has been received.",
    };
  }

  // 2. Per-IP Rate Limiting (5 enquiries per 5 minutes per IP)
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  const rateCheck = checkRateLimit(`enquiry:${ip}`, 5, 300);
  if (!rateCheck.allowed) {
    return {
      success: false,
      message: "Too many enquiries sent from your network. Please wait a few minutes before trying again.",
    };
  }

  // 3. Zod validation
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    topic: formData.get("topic") || "General",
    subject: formData.get("subject"),
    message: formData.get("message"),
  };

  const parsed = contactEnquirySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Please check the form inputs.",
    };
  }

  const { name, email, phone, topic, subject, message } = parsed.data;

  try {
    // 4. Store in database
    const enquiryId = `enq_${nanoid(10)}`;
    await db.insert(enquiries).values({
      id: enquiryId,
      name,
      email,
      phone: phone || null,
      topic: topic || "General",
      subject,
      message,
      status: "new",
      createdAt: new Date(),
    });

    // 5. Send alert email to admin
    await sendNewEnquiryAdminEmail({
      name,
      email,
      phone: phone || null,
      topic: topic || "General",
      subject,
      message,
    });

    return {
      success: true,
      message: "Thank you! Your enquiry has been received. Our care team will reply to your email shortly.",
    };
  } catch (error) {
    console.error("submitEnquiryAction error:", error);
    return {
      success: false,
      message: "Something went wrong while submitting your enquiry. Please try again or reach out on WhatsApp.",
    };
  }
}
