import { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAdminOrders } from "@/lib/services/orders";
import { formatRupees } from "@/lib/utils/money";
import { formatAdminPaymentStatus } from "@/lib/utils/statusLabels";
import {
  Package,
  Search,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Order Management | Admin Portal",
  description: "View, filter, and manage customer orders, payments, and shipments.",
};

interface AdminOrdersPageProps {
  searchParams: Promise<{
    status?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  await requireAdmin();

  const { status, paymentMethod, paymentStatus, search, page } = await searchParams;

  const currentPage = parseInt(page || "1", 10) || 1;
  const result = await getAdminOrders({
    status,
    paymentMethod,
    paymentStatus,
    search,
    page: currentPage,
    limit: 15,
  });

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "placed":
      case "confirmed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "delivered":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "refunded":
        return "bg-stone-100 text-stone-700 border-stone-300";
      case "pending_payment":
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getPaymentStatusBadge = (pst: string) => {
    switch (pst) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "paid_after_cancel":
        return "bg-red-100 text-red-800 border-red-300 font-bold animate-pulse";
      case "pending_cod":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "failed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "refunded":
        return "bg-stone-100 text-stone-700 border-stone-300";
      default:
        return "bg-stone-50 text-stone-600 border-stone-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blush">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink">
            Customer Orders
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Manage incoming orders, track fulfillments, handle returns, and view payment transactions.
          </p>
        </div>
        <div className="text-xs text-muted">
          Showing <strong>{result.orders.length}</strong> of <strong>{result.total}</strong> total orders
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-pink-light shadow-xs space-y-3">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="search"
              defaultValue={search || ""}
              placeholder="Search by order #, customer, phone, email..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-brand"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              name="status"
              defaultValue={status || "all"}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white outline-none focus:border-brand"
            >
              <option value="all">All Order Statuses</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="placed">Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              name="paymentStatus"
              defaultValue={paymentStatus || "all"}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white outline-none focus:border-brand"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="pending_cod">Pending COD</option>
              <option value="paid">Paid</option>
              <option value="paid_after_cancel">Paid After Cancel (Flagged)</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-3 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand/90 transition-colors"
            >
              Filter
            </button>
            <Link
              href="/admin/orders"
              className="py-2 px-3 rounded-xl border border-stone-200 text-xs text-stone-600 hover:bg-stone-50 transition-colors text-center"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-pink-light shadow-xs overflow-hidden">
        {result.orders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blush text-brand flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-ink">No orders found</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              No orders matched your current filter criteria. Try adjusting the search query or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-blush/40 text-ink uppercase tracking-wider text-[11px] font-semibold border-b border-pink-light">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-light/40">
                {result.orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-blush/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-ink">
                      <div className="flex items-center gap-1.5">
                        <span>{ord.orderNumber}</span>
                        {(ord.isFlaggedForReview || ord.paymentStatus === "paid_after_cancel") && (
                          <span
                            title={ord.flagReason || "Attention required"}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700"
                          >
                            <AlertTriangle className="w-3 h-3 mr-0.5 text-red-600" />
                            Flagged
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted whitespace-nowrap">
                      {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-ink">{ord.customerName}</div>
                      <div className="text-[11px] text-muted font-mono">{ord.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-medium capitalize ${getStatusBadge(
                          ord.status
                        )}`}
                      >
                        {ord.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize ${getPaymentStatusBadge(
                            ord.paymentStatus
                          )}`}
                        >
                          {formatAdminPaymentStatus(ord.paymentStatus)}
                        </span>
                        <div className="text-[10px] text-muted uppercase font-mono">
                          {ord.paymentMethod}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-brand text-sm">
                      {formatRupees(ord.totalPaise)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {result.totalPages > 1 && (
          <div className="p-4 border-t border-pink-light/40 flex items-center justify-between text-xs text-muted">
            <span>
              Page {result.page} of {result.totalPages}
            </span>
            <div className="flex items-center gap-2">
              {result.page > 1 && (
                <Link
                  href={`/admin/orders?page=${result.page - 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
                >
                  Previous
                </Link>
              )}
              {result.page < result.totalPages && (
                <Link
                  href={`/admin/orders?page=${result.page + 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
