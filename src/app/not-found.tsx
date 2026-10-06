import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Sparkles, Home, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-linear-to-b from-blush/40 via-white to-white px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Page Not Found • Error 404</span>
        </div>

        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-ink tracking-tight">
          Lost your way?
        </h1>

        <p className="text-muted text-sm sm:text-base leading-relaxed">
          The page or product you are looking for may have moved, been discontinued, or the address might be mistyped.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Button>
          </Link>
          <Link href="/shop" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Shop</span>
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-pink-light/60">
          <p className="text-xs text-muted">
            Need support? Visit our{" "}
            <Link href="/faq" className="text-brand hover:underline font-semibold">
              FAQ
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="text-brand hover:underline font-semibold">
              contact our care team
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
