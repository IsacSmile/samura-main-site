"use client";

import { Printer, ArrowLeft } from "lucide-react";
import { formatPaiseToRupees } from "@/lib/utils/money";
import { formatPaymentStatus, formatPaymentMethod } from "@/lib/utils/statusLabels";

export interface InvoiceItem {
  id: string;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
}

export interface InvoiceData {
  orderNumber: string;
  createdAt: Date | string;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddressSnapshot: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingFeePaise: number;
  totalPaise: number;
  couponCode?: string | null;
  invoiceNumber?: string | null;
  items: InvoiceItem[];
  seller: {
    name: string;
    address: string;
    email: string;
    phone: string;
    gstin?: string | null;
  };
  showGstBreakup: boolean;
}

export function InvoiceView({ data }: { data: InvoiceData }) {
  let addressObj: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  } = {};

  try {
    addressObj = JSON.parse(data.shippingAddressSnapshot);
  } catch {
    addressObj = {
      fullName: data.customerName,
      phone: data.customerPhone,
      addressLine1: data.shippingAddressSnapshot,
    };
  }

  const handlePrint = () => {
    window.print();
  };

  const isTaxInvoice = Boolean(data.seller.gstin) && Boolean(data.showGstBreakup);
  const invoiceTitle = isTaxInvoice ? "Tax Invoice" : "Order Receipt";

  const invoiceDate = new Date(data.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-stone-100 py-8 px-4 sm:px-6 print:p-0 print:bg-white text-stone-900 font-sans">
      {/* Top Action Bar (Hidden during print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-300 px-3.5 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 px-4 py-2 rounded-xl shadow-md transition-colors"
        >
          <Printer className="w-4 h-4 mr-2" /> Print / Save as PDF
        </button>
      </div>

      {/* Printable Invoice Paper Sheet */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-3xl sm:border sm:border-stone-200 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none">
        {/* Header: Company & Invoice Title */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b-2 border-stone-200">
          <div>
            <h1 className="text-2xl font-bold font-serif text-stone-900 tracking-tight">
              {data.seller.name}
            </h1>
            <p className="text-xs text-stone-600 max-w-sm mt-1 leading-relaxed">
              {data.seller.address}
            </p>
            <p className="text-xs text-stone-600 mt-1">
              Email: {data.seller.email} | Phone: {data.seller.phone}
            </p>
            {data.seller.gstin && (
              <p className="text-xs font-bold text-stone-800 mt-1 uppercase tracking-wider">
                GSTIN: {data.seller.gstin}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block bg-stone-100 text-stone-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-stone-200 mb-2">
              {invoiceTitle}
            </span>
            <div className="text-xs space-y-1 text-stone-600">
              <p>
                <strong className="text-stone-900">Invoice No:</strong>{" "}
                {data.invoiceNumber || `INV-${data.orderNumber}`}
              </p>
              <p>
                <strong className="text-stone-900">Order Ref:</strong> #{data.orderNumber}
              </p>
              <p>
                <strong className="text-stone-900">Invoice Date:</strong> {invoiceDate}
              </p>
              <p>
                <strong className="text-stone-900">Payment:</strong> {formatPaymentMethod(data.paymentMethod)} (
                <span>{formatPaymentStatus(data.paymentStatus)}</span>)
              </p>
            </div>
          </div>
        </div>

        {/* Addresses Row: Bill To / Ship To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-stone-200 text-xs">
          <div>
            <h3 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-2">
              Billed & Shipped To:
            </h3>
            <p className="font-semibold text-stone-900 text-sm">
              {addressObj.fullName || data.customerName}
            </p>
            <p className="text-stone-600 leading-relaxed mt-1">{addressObj.addressLine1}</p>
            {addressObj.addressLine2 && (
              <p className="text-stone-600 leading-relaxed">{addressObj.addressLine2}</p>
            )}
            <p className="text-stone-600 leading-relaxed">
              {addressObj.city}, {addressObj.state} - {addressObj.postalCode}
            </p>
            <p className="text-stone-700 font-medium mt-2">
              Phone: +91 {addressObj.phone || data.customerPhone}
            </p>
            <p className="text-stone-700">Email: {data.customerEmail}</p>
          </div>

          <div className="sm:text-right">
            <h3 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-2">
              Discreet Shipping Standard:
            </h3>
            <p className="text-stone-600 leading-relaxed">
              Package dispatched in neutral, unmarked tamper-evident outer packaging with no mention
              of contents for complete privacy.
            </p>
            <p className="text-stone-700 font-medium mt-3">
              Place of Supply: {addressObj.state || "Karnataka"}
            </p>
          </div>
        </div>

        {/* Table of Items */}
        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-stone-300 text-stone-700 uppercase font-semibold text-[11px]">
                <th className="py-3 px-2 w-10">#</th>
                <th className="py-3 px-2">Description</th>
                <th className="py-3 px-2 text-center w-16">Qty</th>
                <th className="py-3 px-2 text-right w-24">Unit Rate</th>
                <th className="py-3 px-2 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {data.items.map((item, idx) => (
                <tr key={item.id} className="text-stone-800">
                  <td className="py-3.5 px-2 text-stone-400">{idx + 1}</td>
                  <td className="py-3.5 px-2">
                    <p className="font-semibold text-stone-900">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-[11px] text-stone-500">Variant: {item.variantName}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-2 text-center">{item.quantity}</td>
                  <td className="py-3.5 px-2 text-right">
                    {formatPaiseToRupees(item.unitPricePaise)}
                  </td>
                  <td className="py-3.5 px-2 text-right font-medium">
                    {formatPaiseToRupees(item.totalPricePaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="pt-4 border-t-2 border-stone-200 flex flex-col sm:flex-row justify-between items-start gap-6 text-xs">
          <div className="text-stone-500 max-w-sm space-y-1">
            <p className="font-semibold text-stone-800">Taxes Note:</p>
            <p className="text-[11px] leading-relaxed">
              All prices are inclusive of applicable Goods and Services Tax (GST).
            </p>
            {data.showGstBreakup && data.seller.gstin ? (
              <div className="pt-2 text-[11px] text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <span className="font-bold block text-stone-900">GST Breakdown (Included):</span>
                <span>CGST / SGST: 0% - 12% category schedule as applicable.</span>
              </div>
            ) : null}
          </div>

          <div className="w-full sm:w-64 space-y-2">
            <div className="flex justify-between text-stone-600">
              <span>Items Subtotal:</span>
              <span>{formatPaiseToRupees(data.subtotalPaise)}</span>
            </div>

            {data.discountPaise > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount {data.couponCode ? `(${data.couponCode})` : ""}:</span>
                <span>-{formatPaiseToRupees(data.discountPaise)}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-600">
              <span>Shipping & Handling:</span>
              <span>
                {data.shippingFeePaise === 0 ? "FREE" : formatPaiseToRupees(data.shippingFeePaise)}
              </span>
            </div>

            <div className="flex justify-between text-sm font-extrabold text-stone-900 pt-3 border-t-2 border-stone-900">
              <span>Grand Total:</span>
              <span>{formatPaiseToRupees(data.totalPaise)}</span>
            </div>
            <p className="text-[10px] text-stone-500 text-right">Inclusive of all taxes</p>
          </div>
        </div>

        {/* Footer / Legal Notice */}
        <div className="mt-12 pt-6 border-t border-stone-200 text-center text-[11px] text-stone-500 space-y-1">
          <p>
            This is a computer-generated {invoiceTitle.toLowerCase()} and requires no physical signature.
          </p>
          <p>
            Questions about this bill? Contact support at{" "}
            <strong className="text-stone-700">{data.seller.email}</strong> or call{" "}
            <strong className="text-stone-700">{data.seller.phone}</strong>.
          </p>
          <p className="text-[10px] text-stone-400 pt-1">
            Thank you for trusting Samaura for your intimate wellness care.
          </p>
        </div>
      </div>
    </div>
  );
}
