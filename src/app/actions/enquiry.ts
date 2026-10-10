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
      message: "Thanks, we have received your message.",
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

  // 3. Server-side subject derivation & Zod validation
  const formTopic = (formData.get("topic") as string) || "General";
  const rawSubject = formData.get("subject");
  const derivedSubject =
    rawSubject && String(rawSubject).trim().length > 0
      ? String(rawSubject).trim()
      : `Enquiry regarding ${formTopic}`;

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    topic: formTopic,
    subject: derivedSubject,
    message: formData.get("message"),
  };

  const parsed = contactEnquirySchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Please check the form inputs.",
      fieldErrors,
    };
  }

  const { name, email, phone, topic, subject, message } = parsed.data;
  const finalSubject = subject || derivedSubject;

  try {
    // 4. Store in database
    const enquiryId = `enq_${nanoid(10)}`;
    await db.insert(enquiries).values({
      id: enquiryId,
      name,
      email,
      phone: phone || null,
      topic: topic || "General",
      subject: finalSubject,
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
      subject: finalSubject,
      message,
    });

    return {
      success: true,
      message: "Thanks, we have received your message.",
    };
  } catch (error) {
    console.error("submitEnquiryAction error:", error);
    return {
      success: false,
      message: "Something went wrong while submitting your enquiry. Please try again or reach out on WhatsApp.",
    };
  }
}
