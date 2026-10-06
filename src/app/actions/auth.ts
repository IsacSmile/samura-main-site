"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { registerCustomer, requestPasswordReset, resetPassword } from "@/lib/services/auth";
import { saveUserAddress, getUserAddresses, updateUserAddress } from "@/lib/services/addresses";
import { db } from "@/db";
import { addresses, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// In-memory rate limiting map
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);
  if (entry && entry.resetAt > now) {
    if (entry.count >= MAX_ATTEMPTS) return false;
    entry.count++;
  } else {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }
  return true;
}

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export async function registerAction(data: unknown) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "127.0.0.1";

  if (!checkRateLimit(ip)) {
    return { success: false, error: "Too many registration attempts. Please wait a few minutes." };
  }

  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid registration data." };
  }

  return await registerCustomer({
    name: parsed.data.name,
    email: parsed.data.email,
    password: parsed.data.password,
    phone: parsed.data.phone || null,
  });
}

export async function forgotPasswordAction(email: string) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "127.0.0.1";

  if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return { success: false, error: "Please provide a valid email address." };
  }

  return await requestPasswordReset(email.trim(), ip);
}

export async function resetPasswordAction(payload: { token: string; newPassword: string }) {
  if (!payload.token || !payload.newPassword) {
    return { success: false, error: "Token and new password are required." };
  }

  if (payload.newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  return await resetPassword(payload.token, payload.newPassword);
}

export async function verifyEmailAction(token: string) {
  if (!token || !token.trim()) {
    return { success: false, error: "Verification token is required." };
  }
  const { verifyCustomerEmail } = await import("@/lib/services/auth");
  return await verifyCustomerEmail(token.trim());
}

export async function resendVerificationAction(email: string) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "127.0.0.1";
  const { resendEmailVerification } = await import("@/lib/services/auth");
  return await resendEmailVerification(email, ip);
}

// -------------------------------------------------------------
// My Account Address & Profile Actions
// -------------------------------------------------------------

export async function getCustomerAddressesAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Please log in to view saved addresses.", addresses: [] };
  }

  const list = await getUserAddresses(session.user.id);
  return { success: true, addresses: list };
}

export async function saveCustomerAddressAction(data: {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  try {
    const saved = await saveUserAddress(session.user.id, data);
    return { success: true, address: saved };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save address." };
  }
}

export async function updateCustomerAddressAction(
  addressId: string,
  data: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    isDefault?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  try {
    const updated = await updateUserAddress(session.user.id, addressId, data);
    return { success: true, address: updated };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update address." };
  }
}

export async function deleteCustomerAddressAction(addressId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  try {
    await db
      .delete(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, session.user.id)));
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete address." };
  }
}

export async function setDefaultCustomerAddressAction(addressId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  try {
    await db.transaction(async (tx) => {
      // Clear previous default
      await tx
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, session.user.id));

      // Set new default
      await tx
        .update(addresses)
        .set({ isDefault: true })
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, session.user.id)));
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to update default address." };
  }
}

export async function updateCustomerProfileAction(data: { name: string; phone?: string | null }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const name = data.name.trim();
  if (!name || name.length < 2) {
    return { success: false, error: "Name must be at least 2 characters." };
  }

  const phone = data.phone ? data.phone.trim().replace(/\D/g, "") : null;
  if (phone && !/^[6-9]\d{9}$/.test(phone)) {
    return { success: false, error: "Please enter a valid 10-digit Indian phone number." };
  }

  try {
    await db
      .update(users)
      .set({
        name,
        phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return { success: true };
  } catch {
    return { success: false, error: "Failed to update profile." };
  }
}
