import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { linkGuestOrdersToUser } from "@/lib/services/orders";
import { sendPasswordResetEmail } from "@/lib/email";

export interface RegisterCustomerInput {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

export async function registerCustomer(input: RegisterCustomerInput) {
  const { name, email, password, phone } = input;

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanPhone = phone ? phone.trim().replace(/\D/g, "") : null;

  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: "Name must be at least 2 characters." };
  }

  if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return { success: false, error: "Please provide a valid email address." };
  }

  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  if (cleanPhone && !/^[6-9]\d{9}$/.test(cleanPhone)) {
    return { success: false, error: "Please enter a valid 10-digit Indian phone number." };
  }

  // Check if user already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  if (existing) {
    return { success: false, error: "An account with this email address already exists." };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = `usr_${crypto.randomBytes(12).toString("hex")}`;

  const [newUser] = await db
    .insert(users)
    .values({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      phone: cleanPhone,
      role: "customer",
    })
    .returning();

  // Link previous guest orders matching this verified customer email
  try {
    const linkedCount = await linkGuestOrdersToUser(newUser.id, cleanEmail);
    if (linkedCount > 0) {
      console.log(`[AUTH] Linked ${linkedCount} previous guest orders to new account ${cleanEmail}`);
    }
  } catch (err) {
    console.error("Failed to link guest orders on register:", err);
  }

  return {
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
  };
}

export async function requestPasswordReset(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: true };
  }

  const [user] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);

  // Return success without leaking email existence if user does not exist
  if (!user) {
    return { success: true };
  }

  // Generate secure single-use random token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

  const tokenId = `prt_${crypto.randomBytes(12).toString("hex")}`;
  await db.insert(passwordResetTokens).values({
    id: tokenId,
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const resetUrl = `${siteUrl}/reset-password?token=${rawToken}`;

  // Send password reset email
  sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  }).catch((err) => console.error("Password reset email send error:", err));

  return { success: true };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !token.trim()) {
    return { success: false, error: "Password reset token is missing." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters." };
  }

  const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  if (!record) {
    return { success: false, error: "Invalid or expired password reset link." };
  }

  if (record.usedAt) {
    return { success: false, error: "This password reset link has already been used." };
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return { success: false, error: "This password reset link has expired. Please request a new one." };
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await db.transaction(async (tx) => {
    // Update user password
    await tx
      .update(users)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, record.userId));

    // Mark token as used
    await tx
      .update(passwordResetTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(passwordResetTokens.id, record.id));
  });

  return { success: true };
}
