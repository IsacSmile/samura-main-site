"use client";

import { useState, useTransition } from "react";
import { Users, Search, ShoppingBag, CheckCircle2, XCircle, ChevronRight, X } from "lucide-react";
import { formatPrice } from "@/lib/utils/money";
import { Toast } from "@/components/ui/Toast";
import { toggleCustomerStatusAction } from "@/app/admin/actions/customers";
import Link from "next/link";

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalPaise: number;
  createdAt: string | Date;
}

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: boolean | Date | null;
  isActive: boolean;
  createdAt: string | Date;
  orderCount: number;
  totalSpentPaise: number;
  orders: CustomerOrder[];
}

export function AdminCustomersView({ initialCustomers }: { initialCustomers: CustomerRecord[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  const handleToggleStatus = (customer: CustomerRecord) => {
    const nextStatus = !customer.isActive;
    startTransition(async () => {
      const res = await toggleCustomerStatusAction(customer.id, nextStatus);
      if (res.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, isActive: nextStatus } : c))
        );
        if (selectedCustomer?.id === customer.id) {
          setSelectedCustomer((prev) => (prev ? { ...prev, isActive: nextStatus } : null));
        }
        setToast({
          type: "success",
          title: "Account Status Updated",
          message: res.message,
        });
      } else {
        setToast({
          type: "error",
          title: "Action Failed",
          message: res.message,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blush pb-5">
        <div>
          <h1 className="text-2xl font-serif text-ink tracking-tight font-medium flex items-center gap-2.5">
            <Users className="w-6 h-6 text-brand" /> Customer Management
          </h1>
          <p className="text-xs text-muted mt-0.5">
            View registered customer profiles, track lifetime orders, and control account active status.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-pink-light bg-white focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-pink-light shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-pink-light bg-blush/30 text-ink/70 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blush">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => (
                  <tr key={cust.id} className="hover:bg-blush/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-ink">{cust.name}</div>
                      <div className="text-[11px] text-muted">
                        Joined {new Date(cust.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-ink">{cust.email}</div>
                      {cust.phone && <div className="text-[11px] text-muted">{cust.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      {cust.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <XCircle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {cust.isActive ? (
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-ink">
                      {cust.orderCount} orders
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brand">
                      {formatPrice(cust.totalSpentPaise)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-2.5 py-1 text-[11px] font-medium text-brand hover:bg-blush rounded-lg border border-pink-light transition-colors"
                      >
                        View Orders
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleToggleStatus(cust)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                          cust.isActive
                            ? "text-red-700 border-red-200 hover:bg-red-50"
                            : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        {cust.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Orders Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-blush pb-4">
              <div>
                <h3 className="font-heading font-bold text-lg text-ink flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brand" /> {selectedCustomer.name}&apos;s Orders
                </h3>
                <p className="text-xs text-muted">{selectedCustomer.email}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-muted hover:text-ink rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {selectedCustomer.orders.length === 0 ? (
                <div className="py-12 text-center text-muted text-xs">
                  This customer has not placed any orders yet.
                </div>
              ) : (
                selectedCustomer.orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl border border-pink-light bg-blush/10 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-semibold text-xs text-ink">{order.orderNumber}</div>
                      <div className="text-[11px] text-muted">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white border border-pink-light text-brand">
                          {order.status}
                        </span>
                        <span className="text-[10px] text-muted">
                          Payment: {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-bold text-sm text-ink">
                        {formatPrice(order.totalPaise)}
                      </div>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline font-medium"
                      >
                        Admin Details <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-blush pt-4 flex items-center justify-between">
              <div className="text-xs text-muted">
                Total Orders: <span className="font-semibold text-ink">{selectedCustomer.orders.length}</span> | Lifetime Spend: <span className="font-semibold text-brand">{formatPrice(selectedCustomer.totalSpentPaise)}</span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-ink rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
