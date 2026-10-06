import { Metadata } from "next";
import Link from "next/link";
import {
  HelpCircle,
  Package,
  ShoppingBag,
  MessageSquareCheck,
  FileText,
  DollarSign,
  ImageIcon,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Operations & Admin Help | Samaura Admin",
  description: "Standard operating procedures and how-to guides for Samaura Healthcare operations.",
  robots: { index: false, follow: false },
};

export default function AdminHelpPage() {
  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-3.5 py-1 rounded-full text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Operations &amp; Handover Manual</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink tracking-tight">
          Samaura Store Operations Guide
        </h1>
        <p className="text-muted text-sm sm:text-base max-w-3xl leading-relaxed">
          Standard operating procedures for managing the Samaura Healthcare catalog, processing customer orders, moderating reviews, configuring payments and shipping rules, and maintaining store content.
        </p>
      </div>

      {/* Guide Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guide 1: Products */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-blush flex items-center justify-center text-brand">
            <Package className="w-5 h-5" />
          </div>
          <h2 className="font-heading font-bold text-xl text-ink">
            1. Adding &amp; Managing Products
          </h2>
          <div className="text-xs sm:text-sm text-muted space-y-2.5 leading-relaxed">
            <p>
              <strong>Navigate:</strong> Go to <Link href="/admin/products" className="text-brand font-semibold hover:underline">Products &amp; Stock</Link> and click <em>Add Product</em>.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Category:</strong> Assign product to one of the 4 parent categories.</li>
              <li><strong>Variants:</strong> Each product requires at least one variant (e.g. &quot;Pack of 12&quot;, &quot;Pack of 24&quot;) with a unique SKU, stock quantity, and price.</li>
              <li><strong>Pricing:</strong> Input rates in Rupees (₹); the system stores in paise for zero-floating-point accuracy.</li>
              <li><strong>Image upload:</strong> Upload JPEG, PNG, or WebP images up to 2MB. Magic byte validation ensures strict image safety.</li>
            </ul>
          </div>
        </div>

        {/* Guide 2: Order Fulfillment */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-blush flex items-center justify-center text-brand">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h2 className="font-heading font-bold text-xl text-ink">
            2. Processing Orders &amp; Fulfillment
          </h2>
          <div className="text-xs sm:text-sm text-muted space-y-2.5 leading-relaxed">
            <p>
              <strong>Navigate:</strong> Open <Link href="/admin/orders" className="text-brand font-semibold hover:underline">Customer Orders</Link> to inspect incoming orders.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Placed &rarr; Confirmed:</strong> Verify stock and order notes.</li>
              <li><strong>Dispatch (Shipped):</strong> Click <em>Mark Shipped</em>. <u>Courier Partner and Tracking Number are strictly required</u>. Dispatches automatic customer email.</li>
              <li><strong>Delivery:</strong> Marking <em>Delivered</em> automatically flips COD payments to <em>Paid</em> and stamps delivery timestamp.</li>
              <li><strong>COD Refusal / RTO:</strong> Use <em>Mark Returned</em> to safely restock items once and record the return.</li>
            </ul>
          </div>
        </div>

        {/* Guide 3: Review Moderation */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-blush flex items-center justify-center text-brand">
            <MessageSquareCheck className="w-5 h-5" />
          </div>
          <h2 className="font-heading font-bold text-xl text-ink">
            3. Customer Review Moderation
          </h2>
          <div className="text-xs sm:text-sm text-muted space-y-2.5 leading-relaxed">
            <p>
              <strong>Navigate:</strong> Open <Link href="/admin/reviews" className="text-brand font-semibold hover:underline">Review Moderation</Link>.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Customer reviews are submitted with honeypot bot defense and buyer badges.</li>
              <li>All reviews are set to <em>Pending</em> by default.</li>
              <li>Click <em>Publish</em> to show on the storefront product page, or <em>Reject</em> to keep hidden.</li>
              <li>Aggregate star ratings on the storefront update dynamically only when published reviews exist in the database.</li>
            </ul>
          </div>
        </div>

        {/* Guide 4: Pages CMS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-blush flex items-center justify-center text-brand">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="font-heading font-bold text-xl text-ink">
            4. Editing Static Pages &amp; FAQ
          </h2>
          <div className="text-xs sm:text-sm text-muted space-y-2.5 leading-relaxed">
            <p>
              <strong>Navigate:</strong> Open <Link href="/admin/pages" className="text-brand font-semibold hover:underline">Pages CMS</Link>.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Edit copy for <code>about</code>, <code>faq</code>, <code>why-samaura</code>, <code>privacy</code>, <code>terms</code>, and <code>shipping-returns</code>.</li>
              <li>Uses standard Markdown formatting with an instant live preview.</li>
              <li>Sanitization strictly strips raw script injection or dangerous attributes.</li>
              <li>All policy templates are marked with draft banners until reviewed by legal counsel.</li>
            </ul>
          </div>
        </div>

        {/* Guide 5: COD & Shipping Rules */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-blush flex items-center justify-center text-brand">
            <DollarSign className="w-5 h-5" />
          </div>
          <h2 className="font-heading font-bold text-xl text-ink">
            5. COD Controls &amp; Shipping Rules
          </h2>
          <div className="text-xs sm:text-sm text-muted space-y-2.5 leading-relaxed">
            <p>
              <strong>Navigate:</strong> Open <Link href="/admin/settings" className="text-brand font-semibold hover:underline">Settings</Link> and <Link href="/admin/shipping" className="text-brand font-semibold hover:underline">Shipping Rules</Link>.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>COD Max Order Value:</strong> Default ₹2,500. Orders above this threshold require online prepayment.</li>
              <li><strong>COD Toggle:</strong> Disable Cash on Delivery storewide with one click.</li>
              <li><strong>Shipping Tiers:</strong> Free shipping is configured above ₹499; standard base fee applies below.</li>
              <li><strong>Invoicing:</strong> Title defaults to <em>Order Receipt</em> until GSTIN is saved, when it activates <em>Tax Invoice</em>.</li>
            </ul>
          </div>
        </div>

        {/* Guide 6: Banners & Promos */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-blush flex items-center justify-center text-brand">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h2 className="font-heading font-bold text-xl text-ink">
            6. Managing Banners &amp; Coupons
          </h2>
          <div className="text-xs sm:text-sm text-muted space-y-2.5 leading-relaxed">
            <p>
              <strong>Navigate:</strong> Open <Link href="/admin/banners" className="text-brand font-semibold hover:underline">Banners &amp; Promos</Link> or <Link href="/admin/coupons" className="text-brand font-semibold hover:underline">Coupons</Link>.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Homepage Hero:</strong> Control main carousel banners with custom titles, action buttons, and links.</li>
              <li><strong>Active Window:</strong> Specify optional start and end dates for automatic campaign scheduling.</li>
              <li><strong>Coupons:</strong> Create percentage or fixed-amount discounts with minimum order requirements and usage caps.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Safety Notice Card */}
      <div className="bg-linear-to-r from-blush to-pink-light/30 rounded-3xl p-6 sm:p-8 border border-pink-light flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-ink shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm text-muted">
          <p className="font-heading font-bold text-ink text-base">Security &amp; Compliance Notes</p>
          <p>
            All administrative actions are authenticated via role-checked server sessions (<code>requireAdmin()</code>) with strict audit tracking. Always verify customer identity before providing refunds or manually editing delivery addresses.
          </p>
        </div>
      </div>
    </div>
  );
}
