"use client";

import { useState, useTransition } from "react";
import { Inbox, Trash2, Mail, Phone } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { updateEnquiryStatusAction, deleteEnquiryAction } from "@/app/admin/actions/enquiries";

interface EnquiryRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic?: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "responded";
  createdAt: string | Date;
}

export function AdminEnquiriesView({ initialEnquiries }: { initialEnquiries: EnquiryRecord[] }) {
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const handleStatusChange = (id: string, newStatus: "new" | "read" | "responded") => {
    startTransition(async () => {
      const res = await updateEnquiryStatusAction(id, newStatus);
      if (res.success) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
        );
        if (selectedEnquiry?.id === id) {
          setSelectedEnquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        setToast({ type: "success", title: "Status Updated", message: res.message });
      } else {
        setToast({ type: "error", title: "Update Failed", message: res.message });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this enquiry?")) return;
    startTransition(async () => {
      const res = await deleteEnquiryAction(id);
      if (res.success) {
        setEnquiries((prev) => prev.filter((e) => e.id !== id));
        if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
        setToast({ type: "success", title: "Enquiry Deleted", message: res.message });
      } else {
        setToast({ type: "error", title: "Delete Failed", message: res.message });
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
            <Inbox className="w-6 h-6 text-brand" /> Customer Enquiries & Helpline Inbox
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Review submitted contact messages, customer questions, and mark tickets as read or resolved.
          </p>
        </div>

        <div className="text-xs font-semibold text-muted bg-white px-3.5 py-1.5 rounded-xl border border-pink-light">
          Unread Enquiries:{" "}
          <span className="text-brand font-bold">
            {enquiries.filter((e) => e.status === "new").length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-pink-light shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-pink-light bg-blush/30 text-ink/70 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Message Snippet</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blush">
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No customer enquiries in your inbox.
                  </td>
                </tr>
              ) : (
                enquiries.map((enq) => (
                  <tr
                    key={enq.id}
                    className={`hover:bg-blush/20 transition-colors ${
                      enq.status === "new" ? "bg-pink-light/10 font-medium" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 text-muted whitespace-nowrap">
                      {new Date(enq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-ink">{enq.name}</div>
                      <div className="text-[11px] text-muted">{enq.email}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-semibold text-brand bg-blush px-2 py-0.5 rounded-full border border-pink-light">
                        {enq.topic || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-ink max-w-45 truncate">
                      {enq.subject}
                    </td>
                    <td className="py-3.5 px-4 text-muted max-w-60 truncate">
                      {enq.message}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          enq.status === "new"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : enq.status === "read"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {enq.status === "new" ? "New" : enq.status === "read" ? "Read" : "Resolved"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setSelectedEnquiry(enq)}
                        className="px-2.5 py-1 text-[11px] font-medium text-brand hover:bg-blush rounded-lg border border-pink-light transition-colors"
                      >
                        Read
                      </button>
                      <button
                        onClick={() => handleDelete(enq.id)}
                        className="p-1 text-muted hover:text-red-600 rounded-lg border border-pink-light transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-modal bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="border-b border-blush pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand bg-blush px-2 py-0.5 rounded-full border border-pink-light">
                  Enquiry Details
                </span>
                <h3 className="font-heading font-bold text-lg text-ink mt-1">
                  {selectedEnquiry.subject}
                </h3>
              </div>
              <div className="text-[11px] text-muted">
                {new Date(selectedEnquiry.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="bg-blush/20 p-4 rounded-2xl border border-pink-light space-y-2 text-xs">
              <div className="flex items-center gap-2 text-ink">
                <span className="font-semibold w-16">Customer:</span>
                <span>{selectedEnquiry.name}</span>
              </div>
              <div className="flex items-center gap-2 text-ink">
                <span className="font-semibold w-16">Topic:</span>
                <span className="font-semibold text-brand bg-white px-2 py-0.5 rounded-full border border-pink-light">
                  {selectedEnquiry.topic || "General"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-ink">
                <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                <a
                  href={`mailto:${selectedEnquiry.email}?subject=Re: ${encodeURIComponent(selectedEnquiry.subject)}`}
                  className="text-brand hover:underline font-medium"
                >
                  {selectedEnquiry.email}
                </a>
              </div>
              {selectedEnquiry.phone && (
                <div className="flex items-center gap-2 text-ink">
                  <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span>{selectedEnquiry.phone}</span>
                </div>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-semibold text-ink">Message Body:</div>
              <div className="p-4 rounded-2xl border border-pink-light bg-white text-muted whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {selectedEnquiry.message}
              </div>
            </div>

            <div className="border-t border-blush pt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  disabled={isPending}
                  onClick={() => handleStatusChange(selectedEnquiry.id, "read")}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border ${
                    selectedEnquiry.status === "read"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "text-muted hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  Mark Read
                </button>
                <button
                  disabled={isPending}
                  onClick={() => handleStatusChange(selectedEnquiry.id, "responded")}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border ${
                    selectedEnquiry.status === "responded"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "text-muted hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  Mark Resolved
                </button>
              </div>

              <button
                onClick={() => setSelectedEnquiry(null)}
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
