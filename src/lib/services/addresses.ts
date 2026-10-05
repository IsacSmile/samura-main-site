import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "node:crypto";

export interface AddressInput {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: boolean;
}

export async function getUserAddresses(userId: string) {
  try {
    return await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    return [];
  }
}

export async function saveUserAddress(userId: string, data: AddressInput) {
  try {
    // If setting as default, clear existing default
    if (data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, userId));
    }

    const newId = `addr_${crypto.randomBytes(8).toString("hex")}`;
    const [inserted] = await db
      .insert(addresses)
      .values({
        id: newId,
        userId,
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        addressLine1: data.addressLine1.trim(),
        addressLine2: data.addressLine2 ? data.addressLine2.trim() : null,
        city: data.city.trim(),
        state: data.state.trim(),
        postalCode: data.postalCode.trim(),
        isDefault: data.isDefault ?? false,
      })
      .returning();

    return inserted;
  } catch (error) {
    console.error("Error saving user address:", error);
    throw error;
  }
}
