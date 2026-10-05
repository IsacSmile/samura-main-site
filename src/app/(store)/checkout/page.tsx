import { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Secure Checkout | Samaura Healthcare",
  description:
    "Complete your order for natural, gentle menstrual wellness essentials with discreet home delivery.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
