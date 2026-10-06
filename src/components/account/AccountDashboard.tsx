"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Package,
  MapPin,
  User as UserIcon,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  ExternalLink,
  Phone,
  Mail,
  ShieldCheck,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatPaiseToRupees } from "@/lib/utils/money";
import { formatIndianPhone, cleanIndianPhoneDigits } from "@/lib/utils/phone";
import {
  saveCustomerAddressAction,
  updateCustomerAddressAction,
  deleteCustomerAddressAction,
  setDefaultCustomerAddressAction,
  updateCustomerProfileAction,
} from "@/app/actions/auth";

interface SavedAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

interface CustomerOrder {
  id: string;
  orderNumber: string;
  publicAccessToken: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalPaise: number;
  itemCount?: number;
  createdAt: Date | string;
  courierName?: string | null;
  trackingNumber?: string | null;
}

interface AccountDashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
    emailVerified?: Date | string | null;
  };
  addresses: SavedAddress[];
  orders: CustomerOrder[];
}

export function AccountDashboard({
  user: initialUser,
  addresses: initialAddresses,
  orders: initialOrders,
}: AccountDashboardProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "profile">("orders");

  // User state
  const [user, setUser] = useState(initialUser);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  const handleResendVerification = async () => {
    setResendingVerification(true);
    setVerificationNotice(null);
    try {
      const { resendVerificationAction } = await import("@/app/actions/auth");
      const res = await resendVerificationAction(user.email);
      if (res.success) {
        setVerificationNotice("Verification link sent! Please check your email inbox.");
      } else {
        setVerificationNotice(res.error || "Failed to resend verification link.");
      }
    } catch {
      setVerificationNotice("Error sending verification email.");
    } finally {
      setResendingVerification(false);
    }
  };
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Address state
  const [addresses, setAddresses] = useState(initialAddresses);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Address form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Open add address modal
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setFullName(user.name);
    setPhone(user.phone || "");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setPostalCode("");
    setIsDefault(addresses.length === 0);
    setAddressError(null);
    setIsAddressModalOpen(true);
  };

  // Open edit address modal
  const handleOpenEditAddress = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || "");
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setIsDefault(addr.isDefault);
    setAddressError(null);
    setIsAddressModalOpen(true);
  };

  // Submit address form
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    setAddressError(null);

    const payload = {
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2.trim() ? addressLine2.trim() : null,
      city,
      state,
      postalCode,
      isDefault,
    };

    try {
      if (editingAddressId) {
        const res = await updateCustomerAddressAction(editingAddressId, payload);
        if (!res.success) {
          setAddressError(res.error || "Failed to update address.");
          setAddressLoading(false);
          return;
        }

        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === editingAddressId) {
              return { ...a, ...payload };
            }
            if (payload.isDefault) {
              return { ...a, isDefault: false };
            }
            return a;
          })
        );
      } else {
        const res = await saveCustomerAddressAction(payload);
        if (!res.success || !res.address) {
          setAddressError(res.error || "Failed to save address.");
          setAddressLoading(false);
          return;
        }

        const newAddr = res.address;
        setAddresses((prev) => {
          let updated = [...prev];
          if (newAddr.isDefault) {
            updated = updated.map((a) => ({ ...a, isDefault: false }));
          }
          return [newAddr, ...updated];
        });
      }

      setIsAddressModalOpen(false);
    } catch {
      setAddressError("An unexpected error occurred.");
    } finally {
      setAddressLoading(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to remove this saved address?")) return;
    try {
      const res = await deleteCustomerAddressAction(id);
      if (res.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert(res.error || "Failed to delete address.");
      }
    } catch {
      alert("Error deleting address.");
    }
  };

  // Set default address
  const handleSetDefaultAddress = async (id: string) => {
    try {
      const res = await setDefaultCustomerAddressAction(id);
      if (res.success) {
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isDefault: a.id === id }))
        );
      } else {
        alert(res.error || "Failed to set default address.");
      }
    } catch {
      alert("Error setting default address.");
    }
  };

  // Update profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    try {
      const cleanPhone = profilePhone.trim() ? cleanIndianPhoneDigits(profilePhone.trim()) : null;
      const res = await updateCustomerProfileAction({
        name: profileName,
        phone: cleanPhone,
      });

      if (!res.success) {
        setProfileMsg({ text: res.error || "Failed to update profile.", error: true });
      } else {
        setUser((prev) => ({
          ...prev,
          name: profileName,
          phone: cleanPhone,
        }));
        setProfileMsg({ text: "Profile details updated successfully!", error: false });
        setIsEditingProfile(false);
      }
    } catch {
      setProfileMsg({ text: "An error occurred while saving profile.", error: true });
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="bg-linear-to-b from-blush/30 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full shrink-0 bg-brand text-white flex items-center justify-center font-bold text-2xl font-heading shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink">
                  Hello, {user.name}
                </h1>
                {user.role === "admin" && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-muted flex items-center gap-3 mt-1">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-brand" /> {user.email}
                </span>
                {user.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-brand" /> {formatIndianPhone(user.phone)}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user.role === "admin" && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Admin Dashboard
                </Button>
              </Link>
            )}
            <Link href="/shop">
              <Button variant="blush" size="sm">
                Shop Catalogue
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-stone-600 hover:text-red-700 hover:border-red-200"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Fix A: Unverified Email Notice (Bypassed for Admins) */}
        {!user.emailVerified && user.role !== "admin" && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Email Verification Required</h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Your email ({user.email}) is currently unverified. Check your inbox for the confirmation link. Previous guest orders placed with this email address will be linked to your account once verified.
                </p>
                {verificationNotice && (
                  <p className="text-xs font-semibold text-amber-900 mt-2 bg-amber-100/80 p-2 rounded-xl">
                    {verificationNotice}
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResendVerification}
              isLoading={resendingVerification}
              className="shrink-0 bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              Resend Verification Link
            </Button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-pink-light/60 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === "orders"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-blush"
            }`}
          >
            <Package className="w-4 h-4" /> My Orders ({initialOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("addresses")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === "addresses"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-blush"
            }`}
          >
            <MapPin className="w-4 h-4" /> Saved Addresses ({addresses.length})
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === "profile"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-blush"
            }`}
          >
            <UserIcon className="w-4 h-4" /> Profile & Security
          </button>
        </div>

        {/* TAB CONTENT: ORDERS */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {initialOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-pink-light space-y-4">
                <div className="w-16 h-16 rounded-full bg-blush text-brand flex items-center justify-center mx-auto">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-bold text-lg text-ink">No orders found</h3>
                <p className="text-xs text-muted max-w-md mx-auto">
                  You haven&apos;t placed any orders yet. Discover our gentle, pH-balanced organic feminine care products.
                </p>
                <Link href="/shop" className="inline-block pt-2">
                  <Button size="md">Start Shopping Now</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {initialOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-light shadow-xs hover:border-brand/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading font-extrabold text-base text-ink">
                          Order #{ord.orderNumber}
                        </span>
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            ord.status === "delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.status === "shipped"
                              ? "bg-sky-100 text-sky-800"
                              : ord.status === "confirmed"
                              ? "bg-indigo-100 text-indigo-800"
                              : ord.status === "cancelled"
                              ? "bg-rose-100 text-rose-800"
                              : ord.status === "refunded"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-stone-100 text-stone-800"
                          }`}
                        >
                          {ord.status}
                        </span>
                        {/* Payment Status Badge */}
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            ord.paymentStatus === "paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : ord.paymentStatus === "paid_after_cancel"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : ord.paymentStatus === "failed"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          Payment: {ord.paymentStatus} ({ord.paymentMethod.toUpperCase()})
                        </span>
                      </div>

                      <div className="text-xs text-muted flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          Placed on: {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span>{ord.itemCount} item(s)</span>
                        <span>•</span>
                        <span className="font-semibold text-ink">
                          Total: {formatPaiseToRupees(ord.totalPaise)}
                        </span>
                      </div>

                      {ord.trackingNumber && (
                        <div className="text-xs text-sky-700 bg-sky-50 px-3 py-1.5 rounded-xl inline-flex items-center gap-2">
                          <span>Courier: <strong>{ord.courierName || "Standard Shipping"}</strong></span>
                          <span>|</span>
                          <span>Tracking: <strong>{ord.trackingNumber}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-blush">
                      <Link href={`/account/orders/${ord.id}`}>
                        <Button variant="outline" size="sm">
                          View Order
                        </Button>
                      </Link>
                      <Link
                        href={`/order/${ord.publicAccessToken}/invoice`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="blush" size="sm">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Invoice
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: ADDRESSES */}
        {activeTab === "addresses" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg text-ink">
                  Delivery Addresses
                </h3>
                <p className="text-xs text-muted">
                  Addresses saved here will be available for quick selection at checkout.
                </p>
              </div>
              <Button onClick={handleOpenAddAddress} size="sm">
                <Plus className="w-4 h-4 mr-1.5" /> Add New Address
              </Button>
            </div>

            {addresses.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-pink-light space-y-3">
                <MapPin className="w-10 h-10 text-muted mx-auto" />
                <h4 className="font-semibold text-ink text-sm">No saved addresses</h4>
                <p className="text-xs text-muted">
                  Add your primary delivery address for confidential discreet packaging.
                </p>
                <Button onClick={handleOpenAddAddress} size="sm" variant="outline">
                  Add Address Now
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white rounded-3xl p-6 border transition-all space-y-3 relative ${
                      addr.isDefault
                        ? "border-brand shadow-xs bg-linear-to-b from-blush/20 to-white"
                        : "border-pink-light"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-sm text-ink flex items-center gap-1.5">
                        {addr.fullName}
                      </span>
                      {addr.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-brand text-white px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[11px] text-muted hover:text-brand font-medium hover:underline"
                        >
                          Set as default
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-muted leading-relaxed">
                      <p>{addr.addressLine1}</p>
                      {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                      <p>
                        {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p className="pt-1 text-ink font-medium">Phone: {formatIndianPhone(addr.phone)}</p>
                    </div>

                    <div className="pt-3 border-t border-blush flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditAddress(addr)}
                        className="text-xs text-stone-600 hover:text-brand flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-blush"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-xs text-stone-400 hover:text-red-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: PROFILE */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-lg text-ink">
                    Personal Information
                  </h3>
                  <p className="text-xs text-muted">
                    Update your account details and contact preferences.
                  </p>
                </div>
                {!isEditingProfile && (
                  <Button
                    onClick={() => {
                      setIsEditingProfile(true);
                      setProfileMsg(null);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                  </Button>
                )}
              </div>

              {profileMsg && (
                <div
                  className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                    profileMsg.error
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {profileMsg.error ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink">Full Name</label>
                    <Input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      minLength={2}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink">Email Address</label>
                    <Input
                      type="email"
                      value={user.email}
                      disabled
                      className="bg-stone-50 text-stone-500 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-muted">
                      Email address cannot be modified once verified.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink">Phone Number</label>
                    <Input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="10-digit Indian phone number"
                      pattern="[6-9][0-9]{9}"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button type="submit" size="sm" isLoading={profileLoading}>
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-blush">
                    <span className="text-muted">Full Name</span>
                    <span className="font-semibold text-ink">{user.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-blush">
                    <span className="text-muted">Email</span>
                    <span className="font-semibold text-ink">{user.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-blush">
                    <span className="text-muted">Phone</span>
                    <span className="font-semibold text-ink">
                      {user.phone ? formatIndianPhone(user.phone) : "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted">Account Role</span>
                    <span className="font-semibold text-ink capitalize">{user.role}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs space-y-6">
              <div>
                <h3 className="font-heading font-bold text-lg text-ink">
                  Security & Password
                </h3>
                <p className="text-xs text-muted">
                  Keep your account safe and manage password credentials.
                </p>
              </div>

              <div className="p-4 bg-blush/60 rounded-2xl space-y-2 border border-pink-light">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Password Protected</span>
                </div>
                <p className="text-xs text-muted">
                  To change your password, request a secure single-use reset link sent to your registered email address.
                </p>
                <div className="pt-2">
                  <Link href="/forgot-password">
                    <Button variant="outline" size="sm">
                      Request Password Reset Link
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADDRESS MODAL */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-pink-light shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-blush">
              <h3 className="font-heading font-bold text-lg text-ink">
                {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-stone-400 hover:text-ink text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {addressError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink">Full Name *</label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink">Phone *</label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit number"
                    pattern="[6-9][0-9]{9}"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Address Line 1 *</label>
                <Input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="House, Flat, Street, Area"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Address Line 2 (Optional)</label>
                <Input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Landmark, Apartment Name"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink">City *</label>
                  <Input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink">State *</label>
                  <Input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink">PIN Code *</label>
                  <Input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    pattern="[0-9]{6}"
                    placeholder="6 digits"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="addr-default-check"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-brand focus:ring-brand h-4 w-4"
                />
                <label htmlFor="addr-default-check" className="text-xs text-ink cursor-pointer">
                  Make this my default shipping address
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-blush">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddressModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={addressLoading}>
                  {editingAddressId ? "Update Address" : "Save Address"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
