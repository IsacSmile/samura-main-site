"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart/store";
import { useCartPricing } from "@/lib/cart/useCartPricing";
import { processCheckoutAction, verifyRazorpayPaymentAction, getCheckoutConfigAction } from "@/app/actions/checkout";
import { formatRupees } from "@/lib/utils/money";
import { validatePincodeState, getStatesForPincode } from "@/lib/validation/pincode";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  ArrowLeft,
  Loader2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

interface CheckoutConfig {
  isLoggedIn: boolean;
  userEmail: string;
  userName: string;
  savedAddresses: SavedAddress[];
  onlinePaymentAvailable: boolean;
  providerName: string | null;
  codEnabled: boolean;
  codMaxOrderPaise: number;
  dispatchTimeText?: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Chandigarh",
  "Puducherry",
  "Jammu and Kashmir",
  "Ladakh",
];

export function CheckoutView() {
  const router = useRouter();
  const { items, appliedCoupon, clearCart } = useCartStore();
  const { pricing, loading: pricingLoading } = useCartPricing();

  const [config, setConfig] = useState<CheckoutConfig | null>(null);

  // Address Selection
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

  // Form Fields
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "Delhi",
    postalCode: "",
    notes: "",
    saveAddress: true,
  });

  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod" | "mock">("cod");
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Idempotency key preserved per checkout session to prevent double-charging
  const [idempotencyKey] = useState(
    () => `idem_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
  );

  // Load checkout config (auth, saved addresses, payment methods)
  useEffect(() => {
    let mounted = true;
    getCheckoutConfigAction()
      .then((res) => {
        if (!mounted) return;
        setConfig(res);

        if (res.isLoggedIn) {
          setFormData((prev) => ({
            ...prev,
            customerName: res.userName || prev.customerName,
            customerEmail: res.userEmail || prev.customerEmail,
          }));

          if (res.savedAddresses.length > 0) {
            const defaultAddr = res.savedAddresses.find((a) => a.isDefault) || res.savedAddresses[0];
            setSelectedAddressId(defaultAddr.id);
            setFormData((prev) => ({
              ...prev,
              customerName: defaultAddr.fullName,
              customerPhone: defaultAddr.phone,
              addressLine1: defaultAddr.addressLine1,
              addressLine2: defaultAddr.addressLine2 || "",
              city: defaultAddr.city,
              state: defaultAddr.state,
              postalCode: defaultAddr.postalCode,
            }));
          }
        }

        // Set initial payment method choice
        if (res.onlinePaymentAvailable) {
          setPaymentMethod(res.providerName === "mock" ? "mock" : "razorpay");
        } else if (res.codEnabled) {
          setPaymentMethod("cod");
        }
      })
      .catch((err) => {
        console.error("Failed to load checkout config:", err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSavedAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (!config) return;

    if (addressId === "new") {
      setFormData((prev) => ({
        ...prev,
        addressLine1: "",
        addressLine2: "",
        city: "",
        postalCode: "",
      }));
    } else {
      const addr = config.savedAddresses.find((a) => a.id === addressId);
      if (addr) {
        setFormData((prev) => ({
          ...prev,
          customerName: addr.fullName,
          customerPhone: addr.phone,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2 || "",
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
        }));
      }
    }
  };

  const [confirmAddressMismatch, setConfirmAddressMismatch] = useState(false);
  const [pinWarning, setPinWarning] = useState<string | null>(null);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.customerName.trim() || formData.customerName.trim().length < 2) {
      errors.customerName = "Full name must be at least 2 characters.";
    }

    if (!formData.customerEmail.trim() || !/^\S+@\S+\.\S+$/.test(formData.customerEmail)) {
      errors.customerEmail = "Please enter a valid email address.";
    }

    if (!/^[6-9]\d{9}$/.test(formData.customerPhone.trim())) {
      errors.customerPhone = "Please enter a valid 10-digit Indian mobile number.";
    }

    if (!formData.addressLine1.trim() || formData.addressLine1.trim().length < 5) {
      errors.addressLine1 = "Address (Flat/House/Street) must be at least 5 characters.";
    }

    if (!formData.city.trim() || formData.city.trim().length < 2) {
      errors.city = "City is required.";
    }

    if (!formData.state.trim()) {
      errors.state = "Please select a state.";
    }

    if (!/^\d{6}$/.test(formData.postalCode.trim())) {
      errors.postalCode = "Please enter a valid 6-digit PIN code.";
      setPinWarning(null);
    } else if (formData.state.trim()) {
      const pinCheck = validatePincodeState(formData.postalCode, formData.state);
      if (!pinCheck.isValid) {
        setPinWarning(pinCheck.error || "PIN code does not match the selected state.");
        if (!confirmAddressMismatch) {
          errors.postalCode = pinCheck.error || "PIN code does not match the selected state.";
        }
      } else {
        setPinWarning(null);
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    if (!pricing || items.length === 0) {
      setServerError("Your cart is empty.");
      return;
    }

    // COD limit validation check on client before submission
    if (paymentMethod === "cod" && config) {
      if (pricing.totalPaise > config.codMaxOrderPaise) {
        setServerError(
          `Cash on Delivery is only available for orders up to ${formatRupees(
            config.codMaxOrderPaise
          )}. Please select Online Payment.`
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const orderPayload = {
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim().toLowerCase(),
        customerPhone: formData.customerPhone.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || null,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        paymentMethod,
        couponCode: appliedCoupon || null,
        notes: formData.notes.trim() || null,
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        idempotencyKey,
        saveAddress: config?.isLoggedIn ? formData.saveAddress : false,
        confirmAddressMismatch,
      };

      const result = await processCheckoutAction(orderPayload);

      if (!result.success) {
        if ((result as { warningMismatch?: boolean }).warningMismatch) {
          setPinWarning(result.error || "PIN code does not match selected state.");
        }
        setServerError(result.error || "Failed to place order.");
        setSubmitting(false);
        return;
      }

      // 1. COD Orders -> direct to confirmation
      if (paymentMethod === "cod") {
        clearCart();
        router.push(`/order/${result.publicAccessToken}`);
        return;
      }

      // 2. Mock Gateway Orders -> redirect to mock payment page
      if (paymentMethod === "mock") {
        clearCart();
        const clientPayload = result.clientPayload as { redirectUrl?: string } | undefined;
        if (clientPayload?.redirectUrl) {
          router.push(clientPayload.redirectUrl);
        } else {
          router.push(`/order/${result.publicAccessToken}`);
        }
        return;
      }

      // 3. Razorpay Orders -> launch checkout modal
      if (paymentMethod === "razorpay" && result.clientPayload) {
        const payload = result.clientPayload as {
          keyId?: string;
          amountPaise?: number;
          currency?: string;
          name?: string;
          description?: string;
          image?: string;
          orderId?: string;
          prefill?: Record<string, string>;
          theme?: Record<string, string>;
        };

        // Dynamically load Razorpay SDK
        const loadScript = (src: string) =>
          new Promise((resolve) => {
            if (typeof window !== "undefined" && "Razorpay" in window) return resolve(true);
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });

        const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!loaded) {
          setServerError("Failed to load Razorpay payment gateway. Please check your internet connection.");
          setSubmitting(false);
          return;
        }

        const options = {
          key: payload.keyId,
          amount: payload.amountPaise,
          currency: payload.currency,
          name: payload.name || "Samaura Healthcare",
          description: payload.description,
          image: payload.image || "/samaura-logo.png",
          order_id: payload.orderId,
          prefill: payload.prefill,
          theme: payload.theme,
          handler: async function (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) {
            try {
              const verifyRes = await verifyRazorpayPaymentAction({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.success) {
                clearCart();
                router.push(`/order/${verifyRes.publicAccessToken || result.publicAccessToken}`);
              } else {
                setServerError(verifyRes.error || "Payment verification failed.");
                setSubmitting(false);
              }
            } catch {
              setServerError("Failed to confirm payment with server.");
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
              setServerError("Payment was not completed. You can try again when ready.");
            },
          },
        };

        const razorpayConstructor = (
          window as unknown as {
            Razorpay: new (opts: typeof options) => { open: () => void };
          }
        ).Razorpay;
        const rzp = new razorpayConstructor(options);
        rzp.open();
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Network error during checkout.");
      setSubmitting(false);
    }
  };

  // If cart has no valid items or is empty, redirect to /cart with notice
  useEffect(() => {
    if (!pricingLoading && (items.length === 0 || (pricing && pricing.items.length === 0))) {
      router.replace("/cart");
    }
  }, [pricingLoading, items.length, pricing, router]);

  // If cart is empty or has no valid lines
  if (!pricingLoading && (!items || items.length === 0 || (pricing && pricing.items.length === 0))) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
        <h1 className="text-2xl font-bold font-serif text-stone-900">Redirecting to Bag...</h1>
        <p className="text-sm text-stone-500">
          Reviewing your bag before checkout.
        </p>
      </div>
    );
  }

  const codAllowedForTotal =
    config?.codEnabled &&
    pricing &&
    pricing.totalPaise <= (config.codMaxOrderPaise || 250000);

  return (
    <div className="min-h-screen bg-stone-50 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/cart" className="hover:text-stone-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Cart</span>
          </Link>
          <span>/</span>
          <span className="text-stone-900 font-medium">Checkout</span>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Shipping & Payment Details */}
            <div className="lg:col-span-7 space-y-6">
              {serverError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-semibold">Unable to process order</p>
                    <p className="mt-0.5">{serverError}</p>
                  </div>
                </div>
              )}

              {/* 1. Contact Information */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span>Contact Information</span>
                  </h2>
                  {!config?.isLoggedIn && (
                    <Link
                      href="/login?callbackUrl=/checkout"
                      className="text-xs text-brand hover:underline font-medium"
                    >
                      Already have an account? Log in
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="checkout-name-input"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                        formErrors.customerName
                          ? "border-red-400 bg-red-50/20"
                          : "border-stone-300 focus:border-brand focus:ring-1 focus:ring-brand"
                      }`}
                    />
                    {formErrors.customerName && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.customerName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Email Address (for order updates) *
                    </label>
                    <input
                      type="email"
                      id="checkout-email-input"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      placeholder="you@example.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                        formErrors.customerEmail
                          ? "border-red-400 bg-red-50/20"
                          : "border-stone-300 focus:border-brand focus:ring-1 focus:ring-brand"
                      }`}
                    />
                    {formErrors.customerEmail && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.customerEmail}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      10-digit Indian Mobile Number *
                    </label>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-stone-300 bg-stone-50 text-stone-500 text-xs font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        id="checkout-phone-input"
                        maxLength={10}
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerPhone: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder="9876543210"
                        className={`w-full px-3.5 py-2.5 rounded-r-xl border text-sm outline-none transition-all ${
                          formErrors.customerPhone
                            ? "border-red-400 bg-red-50/20"
                            : "border-stone-300 focus:border-brand focus:ring-1 focus:ring-brand"
                        }`}
                      />
                    </div>
                    {formErrors.customerPhone && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.customerPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Shipping Address */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-4">
                <div className="pb-3 border-b border-stone-100 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span>Shipping Address</span>
                  </h2>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Truck className="w-3 h-3" />
                    <span>Plain Discreet Packaging</span>
                  </div>
                </div>

                {/* Saved addresses for logged-in users */}
                {config?.isLoggedIn && config.savedAddresses.length > 0 && (
                  <div className="space-y-3 pb-2">
                    <label className="block text-xs font-medium text-stone-700">
                      Select Delivery Address:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {config.savedAddresses.map((addr) => {
                        const pinCheck = validatePincodeState(addr.postalCode, addr.state);
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSavedAddressChange(addr.id)}
                            className={`p-3.5 rounded-2xl border cursor-pointer text-xs transition-all relative ${
                              selectedAddressId === addr.id
                                ? "border-brand bg-brand/5 ring-1 ring-brand"
                                : "border-stone-200 hover:border-stone-300 bg-stone-50"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <span className="font-semibold text-stone-900">{addr.fullName}</span>
                              {addr.isDefault && (
                                <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-medium">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-stone-600 mt-1 line-clamp-2">{addr.addressLine1}</p>
                            <p className="text-stone-500 mt-0.5">
                              {addr.city}, {addr.state} - {addr.postalCode}
                            </p>
                            <p className="text-stone-500 mt-1 font-sans">{addr.phone}</p>
                            {!pinCheck.isValid && (
                              <div className="mt-2 flex items-start gap-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-tight">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                                <span>{pinCheck.error || "PIN code and state do not match."}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <div
                        onClick={() => handleSavedAddressChange("new")}
                        className={`p-3.5 rounded-2xl border border-dashed cursor-pointer text-xs flex items-center justify-center transition-all ${
                          selectedAddressId === "new"
                            ? "border-brand bg-brand/5 ring-1 ring-brand"
                            : "border-stone-300 hover:border-stone-400 text-stone-600"
                        }`}
                      >
                        <span className="font-medium">+ Add New Address</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Form Inputs */}
                {(selectedAddressId === "new" || !config?.isLoggedIn) && (
                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Flat / House No. / Building / Street *
                      </label>
                      <input
                        type="text"
                        id="checkout-addr1-input"
                        value={formData.addressLine1}
                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                        placeholder="House / Flat 402, Green Avenue"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                          formErrors.addressLine1
                            ? "border-red-400 bg-red-50/20"
                            : "border-stone-300 focus:border-brand focus:ring-1 focus:ring-brand"
                        }`}
                      />
                      {formErrors.addressLine1 && (
                        <p className="text-[11px] text-red-600 mt-1">{formErrors.addressLine1}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Area / Landmark / Sector (Optional)
                      </label>
                      <input
                        type="text"
                        id="checkout-addr2-input"
                        value={formData.addressLine2}
                        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                        placeholder="Near City Park"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          id="checkout-city-input"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="New Delhi"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                            formErrors.city
                              ? "border-red-400 bg-red-50/20"
                              : "border-stone-300 focus:border-brand focus:ring-1 focus:ring-brand"
                          }`}
                        />
                        {formErrors.city && (
                          <p className="text-[11px] text-red-600 mt-1">{formErrors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          State *
                        </label>
                        <select
                          id="checkout-state-select"
                          value={formData.state}
                          onChange={(e) => {
                            const newState = e.target.value;
                            setFormData({ ...formData, state: newState });
                            if (formData.postalCode.length === 6) {
                              const pinCheck = validatePincodeState(formData.postalCode, newState);
                              setFormErrors((prev) => ({
                                ...prev,
                                postalCode: pinCheck.isValid ? "" : pinCheck.error || "",
                              }));
                            }
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-white outline-none transition-all ${
                            formErrors.state
                              ? "border-red-400 bg-red-50/20"
                              : "border-stone-300 focus:border-brand focus:ring-1 focus:ring-brand"
                          }`}
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        {formErrors.state && (
                          <p className="text-[11px] text-red-600 mt-1">{formErrors.state}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          6-digit PIN Code *
                        </label>
                        <input
                          type="text"
                          id="checkout-pin-input"
                          maxLength={6}
                          value={formData.postalCode}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, "");
                            const expectedStates = clean.length >= 2 ? getStatesForPincode(clean) : [];
                            let newState = formData.state;
                            if (clean.length === 6 && expectedStates.length > 0) {
                              const match = INDIAN_STATES.find((st) =>
                                expectedStates.includes(st.toLowerCase())
                              );
                              if (match && (!formData.state || !expectedStates.includes(formData.state.toLowerCase()))) {
                                newState = match;
                              }
                            }
                            setFormData({
                              ...formData,
                              postalCode: clean,
                              state: newState,
                            });
                            if (clean.length === 6) {
                              const pinCheck = validatePincodeState(clean, newState);
                              setFormErrors((prev) => ({
                                ...prev,
                                postalCode: pinCheck.isValid ? "" : pinCheck.error || "",
                              }));
                            } else if (clean.length > 0 && clean.length < 6) {
                              setFormErrors((prev) => ({
                                ...prev,
                                postalCode: "",
                              }));
                            }
                          }}
                          placeholder="110001"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                            formErrors.postalCode
                              ? "border-red-400 bg-red-50/20"
                              : "border-stone-300 focus:border-brand focus:ring-1 focus:ring-brand"
                          }`}
                        />
                        {formErrors.postalCode && (
                          <p className="text-[11px] text-red-600 mt-1">{formErrors.postalCode}</p>
                        )}
                      </div>
                    </div>

                    {pinWarning && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2 text-amber-900 animate-in fade-in">
                        <p className="flex items-start gap-1.5 font-medium">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>{pinWarning}</span>
                        </p>
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800 pt-1 select-none">
                          <input
                            type="checkbox"
                            checked={confirmAddressMismatch}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setConfirmAddressMismatch(checked);
                              if (checked) {
                                setFormErrors((prev) => {
                                  const copy = { ...prev };
                                  delete copy.postalCode;
                                  return copy;
                                });
                              }
                            }}
                            className="w-4 h-4 rounded border-stone-300 text-brand focus:ring-brand"
                          />
                          <span>My address is correct (Deliver to this PIN code & state)</span>
                        </label>
                      </div>
                    )}

                    {config?.isLoggedIn && (
                      <div className="pt-1 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="save-address-chk"
                          checked={formData.saveAddress}
                          onChange={(e) =>
                            setFormData({ ...formData, saveAddress: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-stone-300 text-brand focus:ring-brand"
                        />
                        <label htmlFor="save-address-chk" className="text-xs text-stone-600 cursor-pointer">
                          Save this address to my account for future orders
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery Instructions / Notes */}
                <div className="pt-2 border-t border-stone-100">
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Delivery Notes / Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    id="checkout-notes-input"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Leave with security, call upon delivery"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* 3. Payment Method Choice */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-4">
                <div className="pb-3 border-b border-stone-100 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <span>Payment Method</span>
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* When only COD is available */}
                  {!config?.onlinePaymentAvailable && config?.codEnabled ? (
                    <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex items-center gap-3">
                      <Banknote className="w-5 h-5 text-brand shrink-0" />
                      <p className="text-sm font-medium text-stone-800">
                        Pay when your order arrives
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Online Payment */}
                      {config?.onlinePaymentAvailable && (
                        <label
                          className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                            paymentMethod === "razorpay" || paymentMethod === "mock"
                              ? "border-brand bg-brand/5 ring-1 ring-brand"
                              : "border-stone-200 hover:border-stone-300 bg-stone-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            id="payment-method-online"
                            value={config.providerName === "mock" ? "mock" : "razorpay"}
                            checked={paymentMethod === "razorpay" || paymentMethod === "mock"}
                            onChange={() =>
                              setPaymentMethod(config.providerName === "mock" ? "mock" : "razorpay")
                            }
                            className="w-4 h-4 text-brand focus:ring-brand border-stone-300"
                          />
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <span className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-brand" />
                              <span>Online Payment</span>
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                              Recommended
                            </span>
                          </div>
                        </label>
                      )}

                      {/* Cash on Delivery (COD) */}
                      {config?.codEnabled && (
                        <label
                          className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all ${
                            !codAllowedForTotal
                              ? "opacity-60 cursor-not-allowed bg-stone-50 border-stone-200"
                              : paymentMethod === "cod"
                              ? "border-brand bg-brand/5 ring-1 ring-brand cursor-pointer"
                              : "border-stone-200 hover:border-stone-300 bg-stone-50 cursor-pointer"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            id="payment-method-cod"
                            value="cod"
                            disabled={!codAllowedForTotal}
                            checked={paymentMethod === "cod"}
                            onChange={() => setPaymentMethod("cod")}
                            className="w-4 h-4 text-brand focus:ring-brand border-stone-300 disabled:opacity-40"
                          />
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <span className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                              <Banknote className="w-4 h-4 text-stone-700" />
                              <span>Cash on Delivery</span>
                            </span>
                            {!codAllowedForTotal && (
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                Max {formatRupees(config.codMaxOrderPaise || 250000)}
                              </span>
                            )}
                          </div>
                        </label>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Order Summary & Action */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-6 lg:sticky lg:top-24">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <h3 className="text-base font-semibold text-stone-900">
                    Order Summary ({pricing?.itemCount || items.reduce((acc, i) => acc + i.quantity, 0)}{" "}
                    {(pricing?.itemCount || items.reduce((acc, i) => acc + i.quantity, 0)) === 1
                      ? "item"
                      : "items"})
                  </h3>
                  <span className="text-[11px] text-stone-400">All prices in INR</span>
                </div>

                {/* Items Mini List */}
                <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 pr-1">
                  {pricing?.items.map((item) => (
                    <div key={item.variantId} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-stone-100 relative shrink-0 overflow-hidden border border-stone-100">
                        <Image
                          src={item.image}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-stone-800 truncate">{item.productName}</p>
                        <p className="text-[11px] text-stone-500">{item.variantName}</p>
                        <p className="text-[10px] text-stone-400 font-sans">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-stone-900 font-sans">
                          {formatRupees(item.lineTotalPaise)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="pt-4 border-t border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span className="font-sans">
                      {pricing
                        ? formatRupees(pricing.subtotalPaise)
                        : "Calculating..."}
                    </span>
                  </div>

                  {pricing && pricing.couponDiscountPaise > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium font-sans">
                      <span>Discount ({pricing.couponCode})</span>
                      <span>-{formatRupees(pricing.couponDiscountPaise)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-600">
                    <span>Shipping Fee</span>
                    <span className="font-sans">
                      {pricing?.shippingFeePaise === 0
                        ? "FREE"
                        : pricing
                        ? formatRupees(pricing.shippingFeePaise)
                        : "Calculating..."}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-semibold text-stone-900">Total Amount</span>
                      <p className="text-[10px] text-stone-400">Inclusive of all taxes</p>
                    </div>
                    <span className="text-2xl font-bold font-heading text-brand">
                      {pricing
                        ? formatRupees(pricing.totalPaise)
                        : "₹0"}
                    </span>
                  </div>
                </div>

                {/* Place Order CTA Button */}
                <button
                  type="submit"
                  id="place-order-btn"
                  disabled={submitting || pricingLoading || (pricing && !pricing.isValid)}
                  className="w-full py-3.5 px-6 rounded-full bg-brand hover:bg-brand/90 text-white shadow-md transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-semibold">Processing order...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-sm font-semibold">Place order</span>
                      </div>
                      <span className="text-[11px] text-white/80 font-normal">
                        {paymentMethod === "cod" ? "Pay on delivery" : "Pay online"}
                      </span>
                    </>
                  )}
                </button>

                {/* Trust and Assurances */}
                <div className="pt-2 border-t border-stone-100 space-y-2 text-[11px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Discreet billing and non-descript shipping box</span>
                  </div>
                  {config?.dispatchTimeText && (
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{config.dispatchTimeText}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
