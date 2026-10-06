import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, orders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { AdminCustomersView } from "@/components/admin/AdminCustomersView";

export const metadata = {
  title: "Customers | Samaura Admin",
  description: "Manage registered customer profiles and account status.",
};

export default async function AdminCustomersPage() {
  await requireAdmin();

  // Fetch all registered customers
  const customerList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      emailVerified: users.emailVerified,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "customer"))
    .orderBy(desc(users.createdAt));

  // Fetch orders for each customer
  const enrichedCustomers = await Promise.all(
    customerList.map(async (cust) => {
      const custOrders = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          totalPaise: orders.totalPaise,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.userId, cust.id))
        .orderBy(desc(orders.createdAt));

      const totalSpentPaise = custOrders.reduce((sum, ord) => sum + ord.totalPaise, 0);

      return {
        ...cust,
        orderCount: custOrders.length,
        totalSpentPaise,
        orders: custOrders,
      };
    })
  );

  return <AdminCustomersView initialCustomers={enrichedCustomers} />;
}
