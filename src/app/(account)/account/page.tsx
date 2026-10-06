import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserAddresses } from "@/lib/services/addresses";
import { getCustomerOrders } from "@/lib/services/orders";
import { AccountDashboard } from "@/components/account/AccountDashboard";

export const metadata: Metadata = {
  title: "My Account | Samaura Healthcare",
  description: "Manage your profile, order history, and saved shipping addresses.",
};

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account");
  }

  // Fetch full user record
  const [userRecord] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!userRecord) {
    redirect("/login");
  }

  const addresses = await getUserAddresses(session.user.id);
  const orders = await getCustomerOrders(session.user.id, userRecord.email);

  return (
    <AccountDashboard
      user={{
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        phone: userRecord.phone,
        role: userRecord.role,
        emailVerified: userRecord.emailVerified,
      }}
      addresses={addresses}
      orders={orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        publicAccessToken: o.publicAccessToken,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        totalPaise: o.totalPaise,
        createdAt: o.createdAt,
        courierName: o.courierName,
        trackingNumber: o.trackingNumber,
      }))}
    />
  );
}
