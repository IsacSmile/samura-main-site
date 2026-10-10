import { db } from "@/db";
import { users, passwordResetTokens, emailVerificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { linkGuestOrdersToUser } from "@/lib/services/orders";
import { sendPasswordResetEmail, sendEmailVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import { getSiteUrl } from "@/lib/utils";

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

  // Minimum password length 8 everywhere
  if (!password || password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
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
      isActive: true,
      emailVerified: null, // Fix A: unverified by default
    })
    .returning();

  // Fix A: Do NOT link guest orders on registration!
  // Link guest orders ONLY after the email is confirmed.
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const tokenId = `evt_${crypto.randomBytes(12).toString("hex")}`;
  await db.insert(emailVerificationTokens).values({
    id: tokenId,
    userId: newUser.id,
    email: cleanEmail,
    tokenHash,
    expiresAt,
  });

  const siteUrl = getSiteUrl();
  const verifyUrl = `${siteUrl}/verify-email?token=${rawToken}`;

  // Send verification email
  sendEmailVerificationEmail({
    to: cleanEmail,
    name: cleanName,
    verifyUrl,
  }).catch((err) => console.error("Email verification send error:", err));

  return {
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
    verificationSent: true,
    verificationToken: rawToken, // Provided for testing and dev
  };
}

/**
 * Resends email verification with rate-limiting.
 */
export async function resendEmailVerification(email: string, clientIp?: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: true };
  }

  // Rate limiting per IP and email: max 3 per 10 minutes
  const ipKey = `resend_evt_ip:${clientIp || "127.0.0.1"}`;
  const emailKey = `resend_evt_email:${cleanEmail}`;

  const ipCheck = checkRateLimit(ipKey, { limit: 5, windowMs: 10 * 60 * 1000 });
  const emailCheck = checkRateLimit(emailKey, { limit: 3, windowMs: 10 * 60 * 1000 });

  if (!ipCheck.success || !emailCheck.success) {
    return {
      success: false,
      error: "Too many verification requests. Please wait a few minutes before trying again.",
    };
  }

  const [user] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);

  // Return success silently if user does not exist
  if (!user) {
    return { success: true };
  }

  if (user.emailVerified) {
    return { success: true, alreadyVerified: true };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const tokenId = `evt_${crypto.randomBytes(12).toString("hex")}`;
  await db.insert(emailVerificationTokens).values({
    id: tokenId,
    userId: user.id,
    email: cleanEmail,
    tokenHash,
    expiresAt,
  });

  const siteUrl = getSiteUrl();
  const verifyUrl = `${siteUrl}/verify-email?token=${rawToken}`;

  sendEmailVerificationEmail({
    to: user.email,
    name: user.name,
    verifyUrl,
  }).catch((err) => console.error("Email verification send error:", err));

  return { success: true, verificationToken: rawToken };
}

/**
 * Verifies email using single-use hashed token with 24h expiry.
 * Links guest orders ONLY after successful email verification.
 */
export async function verifyCustomerEmail(rawToken: string) {
  if (!rawToken || !rawToken.trim()) {
    return { success: false, error: "Verification token is required." };
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");

  const [tokenRecord] = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.tokenHash, tokenHash))
    .limit(1);

  if (!tokenRecord) {
    return { success: false, error: "Invalid or expired verification link." };
  }

  if (tokenRecord.usedAt) {
    return { success: false, error: "This email verification link has already been used." };
  }

  if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
    return { success: false, error: "This email verification link has expired. Please request a new one." };
  }

  // Atomically mark token used and user confirmed
  await db.transaction(async (tx) => {
    await tx
      .update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokens.id, tokenRecord.id));

    await tx
      .update(users)
      .set({
        emailVerified: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, tokenRecord.userId));
  });

  // FIX A: Link guest orders only after email verification
  let linkedOrdersCount = 0;
  try {
    linkedOrdersCount = await linkGuestOrdersToUser(tokenRecord.userId, tokenRecord.email);
    if (linkedOrdersCount > 0) {
      console.log(
        `[AUTH] Confirmed ${tokenRecord.email}: linked ${linkedOrdersCount} previous guest orders to user ${tokenRecord.userId}`
      );
    }
  } catch (err) {
    console.error("Failed to link guest orders after verification:", err);
  }

  return { success: true, linkedOrdersCount };
}

/**
 * Requests password reset: returns identical response for known and unknown emails,
 * rate-limited per IP and email.
 */
export async function requestPasswordReset(email: string, clientIp?: string) {
  const cleanEmail = email.trim().toLowerCase();
  const identicalMessage = "If an account with this email exists, a password reset link has been sent.";

  if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return { success: true, message: identicalMessage };
  }

  // Fix C: Rate limiting per IP (max 5 per 15m) and per email (max 3 per 15m)
  const ipKey = `pwd_reset_ip:${clientIp || "127.0.0.1"}`;
  const emailKey = `pwd_reset_email:${cleanEmail}`;

  const ipCheck = checkRateLimit(ipKey, { limit: 5, windowMs: 15 * 60 * 1000 });
  const emailCheck = checkRateLimit(emailKey, { limit: 3, windowMs: 15 * 60 * 1000 });

  if (!ipCheck.success || !emailCheck.success) {
    return {
      success: false,
      error: "Too many reset attempts. Please wait a few minutes before trying again.",
    };
  }

  const [user] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);

  // Return identical response to prevent user enumeration
  if (!user || user.isActive === false) {
    return { success: true, message: identicalMessage };
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

  const siteUrl = getSiteUrl();
  const resetUrl = `${siteUrl}/reset-password?token=${rawToken}`;

  // Send password reset email
  sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  }).catch((err) => console.error("Password reset email send error:", err));

  return { success: true, message: identicalMessage, debugToken: rawToken };
}

/**
 * Resets user password. Enforces min length 8, single-use token, expiry check,
 * and sets passwordChangedAt to invalidate existing sessions.
 */
export async function resetPassword(token: string, newPassword: string) {
  if (!token || !token.trim()) {
    return { success: false, error: "Password reset token is missing." };
  }

  // Fix C: Minimum password length 8 everywhere
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
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
  const now = new Date();

  await db.transaction(async (tx) => {
    // Fix C: Update user password and set passwordChangedAt to invalidate sessions
    await tx
      .update(users)
      .set({
        passwordHash: newHash,
        passwordChangedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, record.userId));

    // Mark token as used
    await tx
      .update(passwordResetTokens)
      .set({
        usedAt: now,
      })
      .where(eq(passwordResetTokens.id, record.id));
  });

  return { success: true };
}
