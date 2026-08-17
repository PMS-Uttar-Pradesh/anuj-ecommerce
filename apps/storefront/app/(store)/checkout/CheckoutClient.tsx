// apps/storefront/app/(store)/checkout/CheckoutClient.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
  ArrowLeft,
  Check,
  Tag,
  AlertCircle,
} from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { useCheckoutStore, CheckoutStep } from "@/lib/store/checkout-store";
import { hasDefaultAddressAction } from "@/lib/actions/address";
import { getCheckoutDetails, createCodOrderAction } from "@/lib/actions/checkout";
import { PLACEHOLDER_IMAGE } from "@/lib/utils";

interface CheckoutClientProps {
  freeDeliveryThreshold: number;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

interface CreateRazorpayOrderSuccess {
  success: true;
  orderId: string;
  amount: number;
  currency: string;
}

interface CreateRazorpayOrderFailure {
  success: false;
  error?: string;
  errors?: string[];
}

type CreateRazorpayOrderResponse =
  | CreateRazorpayOrderSuccess
  | CreateRazorpayOrderFailure;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export default function CheckoutClient({ freeDeliveryThreshold }: CheckoutClientProps) {
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);

  const {
    step,
    contact,
    shipping,
    deliveryMethod,
    paymentMethod,
    setStep,
    setContact,
    setShipping,
    setDeliveryMethod,
    setPaymentMethod,
  } = useCheckoutStore();

  // Local validation error states
  const [contactErrors, setContactErrors] = useState<Record<string, string>>(
    {},
  );
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>(
    {},
  );
  const [originalSubtotal, setOriginalSubtotal] = useState(() =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  const [discountAmount, setDiscountAmount] = useState(0);
  const [offers, setOffers] = useState<{ id: string; title: string; description: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(
    () => typeof window !== "undefined" && Boolean(window.Razorpay),
  );
  const [paymentError, setPaymentError] = useState("");
  const [paymentPayload, setPaymentPayload] =
    useState<RazorpayPaymentResponse | null>(null);
  const [hasDefaultAddress, setHasDefaultAddress] = useState<boolean>(true);

  useEffect(() => {
    if (cartItems.length > 0) {
      const itemsParam = cartItems.map((item) => ({ id: item.id, quantity: item.quantity }));
      getCheckoutDetails(itemsParam).then((res) => {
        if (res.success) {
          setOriginalSubtotal(res.originalSubtotal);
          setDiscountAmount(res.discountAmount);
          setOffers(res.offers);
        }
      });
    }
  }, [cartItems]);

  // Focus Refs
  const fullNameRef = useRef<HTMLInputElement>(null);
  const addressLine1Ref = useRef<HTMLInputElement>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push("/cart");
    }
  }, [cartItems, router]);

  // Load Razorpay Checkout SDK once on the client.
  useEffect(() => {
    if (window.Razorpay) {
      return;
    }

    const handleScriptLoad = () => setRazorpayLoaded(true);
    const handleScriptError = () => {
      setRazorpayLoaded(false);
      setPaymentError("Unable to load payment gateway. Please try again.");
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", handleScriptLoad);
      existingScript.addEventListener("error", handleScriptError);

      return () => {
        existingScript.removeEventListener("load", handleScriptLoad);
        existingScript.removeEventListener("error", handleScriptError);
      };
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.addEventListener("load", handleScriptLoad);
    script.addEventListener("error", handleScriptError);

    document.body.appendChild(script);

    return () => {
      script.removeEventListener("load", handleScriptLoad);
      script.removeEventListener("error", handleScriptError);
    };
  }, []);

  // Autofocus field on step changes
  useEffect(() => {
    if (step === "contact" && fullNameRef.current) {
      fullNameRef.current.focus();
    } else if (step === "shipping" && addressLine1Ref.current) {
      addressLine1Ref.current.focus();
    }
  }, [step]);

  // Check default address on mount and step changes
  useEffect(() => {
    const checkAddress = async () => {
      const exists = await hasDefaultAddressAction();
      setHasDefaultAddress(exists);
    };
    checkAddress();
  }, [step]);

  // Calculations
  const subtotal = originalSubtotal;

  // Shipping logic
  const activeSubtotal = originalSubtotal - discountAmount;
  const isFreeShippingThreshold = activeSubtotal >= freeDeliveryThreshold;
  const shippingFee =
    deliveryMethod === "express" ? 99 : isFreeShippingThreshold ? 0 : 49;

  // Tax calculation (GST 18% included in product prices, but we show breakdown for transparency/premium feel)
  const taxableValue = activeSubtotal;
  const gstTax = Math.round(taxableValue * 0.18);
  const grandTotal = taxableValue + shippingFee;

  // Real-time validations
  const validateContact = () => {
    const errors: Record<string, string> = {};
    if (!contact.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (contact.fullName.trim().length < 3) {
      errors.fullName = "Name must be at least 3 characters long";
    }

    if (!contact.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(contact.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!contact.mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(contact.mobile)) {
      errors.mobile = "Enter a valid 10-digit mobile number";
    }

    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateShipping = () => {
    const errors: Record<string, string> = {};
    if (!shipping.addressLine1.trim())
      errors.addressLine1 = "Address Line 1 is required";
    if (!shipping.city.trim()) errors.city = "City is required";
    if (!shipping.state.trim()) errors.state = "State is required";

    if (!shipping.pinCode.trim()) {
      errors.pinCode = "PIN Code is required";
    } else if (!/^\d{6}$/.test(shipping.pinCode)) {
      errors.pinCode = "Enter a valid 6-digit PIN Code";
    }

    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigations between steps
  const handleNextStep = () => {
    if (step === "contact") {
      if (validateContact()) setStep("shipping");
    } else if (step === "shipping") {
      if (validateShipping()) setStep("delivery");
    } else if (step === "delivery") {
      setStep("payment");
    }
  };

  const handlePrevStep = () => {
    if (step === "shipping") setStep("contact");
    else if (step === "delivery") setStep("shipping");
    else if (step === "payment") setStep("delivery");
  };

  // Coupon code functionality removed.

  // Create Razorpay order or COD order.
  if (loading) return;
  const handlePlaceOrder = async () => {
    setPaymentError("");
    setPaymentPayload(null);

    if (paymentMethod === "COD") {
      setLoading(true);
      try {
        const res = await createCodOrderAction(deliveryMethod,contact.mobile);
        if (res.success) {
          // Clear cart items in store
          useCartStore.setState({ items: [] });
          // Redirect to success page
          router.push(`/checkout/success?orderId=${res.orderId}`);
        } else {
          setPaymentError(res.error || "Failed to place Cash on Delivery order.");
          setLoading(false);
        }
      } catch (err: any) {
        console.error("[COD Placement Error]", err);
        setPaymentError(err.message || "Failed to place Cash on Delivery order.");
        setLoading(false);
      }
      return;
    }

    if (!razorpayLoaded || !window.Razorpay) {
      setPaymentError("Payment gateway is still loading. Please try again.");
      return;
    }

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      setPaymentError(
        "Payment gateway is not configured. Please contact support.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deliveryMethod }),
      });
      const data = (await response.json()) as CreateRazorpayOrderResponse;

      if (!response.ok || !data.success) {
        const message =
          !data.success && data.errors?.length
            ? data.errors.join(" ")
            : !data.success && data.error
              ? data.error
              : "Unable to start payment. Please try again.";
        setPaymentError(message);
        setLoading(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: "Personal Marketing Store",
        description: "Stationery Purchase",
        order_id: data.orderId,
        prefill: {
          name: contact.fullName,
          email: contact.email,
          contact: contact.mobile,
        },
        theme: {
          color: "#e53c3c",
        },
        modal: {
          ondismiss: () => {
             setPaymentError(
               "Payment was cancelled. You can try again when ready.",
             );
             setLoading(false);
          },
        },
        handler: async (payload) => {
          try {
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...payload,
                deliveryMethod,
                mobile: contact.mobile,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              setPaymentError(
                "Payment verification failed. Please contact support.",
              );
              setLoading(false);
              return;
            }

            setPaymentPayload(payload);

            router.push(`/checkout/success?orderId=${verifyData.orderId}`);
          } catch (error) {
            console.error("[Checkout] Payment verification failed:", error);

            setPaymentError("Payment verification failed. Please try again.");

            setLoading(false);
          }
        },
      });

      razorpay.open();
    } catch (error) {
      console.error("[Checkout] Failed to create Razorpay order:", error);
      setPaymentError("Unable to start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepsList: { id: CheckoutStep; label: string }[] = [
    { id: "contact", label: "Contact" },
    { id: "shipping", label: "Address" },
    { id: "delivery", label: "Delivery" },
    { id: "payment", label: "Payment" },
  ];

  if (cartItems.length === 0) {
    return null; // Don't flash layout if redirecting
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumbs & Status */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-[var(--ag-gray-200)] dark:border-neutral-850">
          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="flex items-center gap-1 text-sm font-semibold text-[var(--ag-gray-500)] hover:text-[var(--ag-red)] transition-colors"
            >
              <ArrowLeft size={16} /> Return to Cart
            </Link>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 sm:gap-4">
            {stepsList.map((s, idx) => {
              const isActive = step === s.id;
              const isCompleted =
                stepsList.findIndex((item) => item.id === step) > idx;
              return (
                <div key={s.id} className="flex items-center">
                  <button
                    onClick={() => {
                      // Allow back-navigation to completed steps
                      if (isCompleted) setStep(s.id);
                    }}
                    disabled={!isCompleted}
                    className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-black transition-all ${
                      isActive
                        ? "bg-[var(--ag-red)] text-white shadow-md scale-105"
                        : isCompleted
                          ? "bg-emerald-500 text-white cursor-pointer"
                          : "bg-card border border-border text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={14} className="stroke-[3]" />
                    ) : (
                      idx + 1
                    )}
                  </button>
                  <span
                    className={`ml-1.5 sm:ml-2 text-xs font-black ${
                      isActive
                        ? "text-[var(--ag-red)]"
                        : isCompleted
                          ? "text-emerald-500"
                          : "text-[var(--ag-gray-500)]"
                    }`}
                  >
                    {s.label}
                  </span>
                  {idx < stepsList.length - 1 && (
                    <ChevronRight
                      size={14}
                      className="mx-1.5 sm:mx-3 text-[var(--ag-gray-500)]"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left panel Form steps */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card text-card-foreground border border-border rounded-[var(--radius-2xl)] p-6 shadow-xs">
              <AnimatePresence mode="wait">
                {/* STEP 1: CONTACT */}
                {step === "contact" && (
                  <motion.div
                    key="step-contact"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <h2 className="text-lg font-black text-[var(--ag-dark)] dark:text-white border-b border-[var(--ag-gray-100)] dark:border-neutral-800 pb-3 mb-5">
                      Contact Information
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--ag-gray-500)]">
                          Full Name
                        </label>
                        <input
                          ref={fullNameRef}
                          type="text"
                          placeholder="Anuj Sharma"
                          value={contact.fullName}
                          onChange={(e) =>
                            setContact({ fullName: e.target.value })
                          }
                          className={`px-4 py-3 rounded-[var(--radius-lg)] bg-background text-foreground placeholder:text-muted-foreground border outline-none text-sm font-semibold transition-all ${
                            contactErrors.fullName
                              ? "border-red-500 focus:border-red-500"
                              : "border-[var(--ag-gray-200)] dark:border-neutral-700 focus:border-[var(--ag-red)]"
                          }`}
                        />
                        {contactErrors.fullName && (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
                            <AlertCircle size={10} /> {contactErrors.fullName}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--ag-gray-500)]">
                          Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="anuj@example.com"
                          value={contact.email}
                          onChange={(e) =>
                            setContact({ email: e.target.value })
                          }
                          className={`px-4 py-3 rounded-[var(--radius-lg)] bg-background text-foreground placeholder:text-muted-foreground border outline-none text-sm font-semibold transition-all ${
                            contactErrors.email
                              ? "border-red-500 focus:border-red-500"
                              : "border-[var(--ag-gray-200)] dark:border-neutral-700 focus:border-[var(--ag-red)]"
                          }`}
                        />
                        {contactErrors.email && (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
                            <AlertCircle size={10} /> {contactErrors.email}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-[var(--ag-gray-500)]">
                          Mobile Number
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--ag-gray-500)]">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="9876543210"
                            value={contact.mobile}
                            onChange={(e) =>
                              setContact({
                                mobile: e.target.value.replace(/\D/g, ""),
                              })
                            }
                            className={`w-full pl-14 pr-4 py-3 rounded-[var(--radius-lg)] bg-background text-foreground placeholder:text-muted-foreground border outline-none text-sm font-semibold transition-all ${
                              contactErrors.mobile
                                ? "border-red-500 focus:border-red-500"
                                : "border-[var(--ag-gray-200)] dark:border-neutral-700 focus:border-[var(--ag-red)]"
                            }`}
                          />
                        </div>
                        {contactErrors.mobile && (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
                            <AlertCircle size={10} /> {contactErrors.mobile}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                      <button
                        onClick={handleNextStep}
                        className="px-6 py-3 bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] text-white font-black text-xs rounded-[var(--radius-lg)] transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                      >
                        CONTINUE TO SHIPPING
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: SHIPPING ADDRESS */}
                {step === "shipping" && (
                  <motion.div
                    key="step-shipping"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <h2 className="text-lg font-black text-[var(--ag-dark)] dark:text-white border-b border-[var(--ag-gray-100)] dark:border-neutral-800 pb-3 mb-5">
                      Shipping Address
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-[var(--ag-gray-500)]">
                          Address Line 1
                        </label>
                        <input
                          ref={addressLine1Ref}
                          type="text"
                          placeholder="Flat, House no., Building, Company"
                          value={shipping.addressLine1}
                          onChange={(e) =>
                            setShipping({ addressLine1: e.target.value })
                          }
                          className={`px-4 py-3 rounded-[var(--radius-lg)] bg-background text-foreground placeholder:text-muted-foreground border outline-none text-sm font-semibold transition-all ${
                            shippingErrors.addressLine1
                              ? "border-red-500 focus:border-red-500"
                              : "border-[var(--ag-gray-200)] dark:border-neutral-700 focus:border-[var(--ag-red)]"
                          }`}
                        />
                        {shippingErrors.addressLine1 && (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
                            <AlertCircle size={10} />{" "}
                            {shippingErrors.addressLine1}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-[var(--ag-gray-500)]">
                          Address Line 2 (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Area, Street, Sector, Village"
                          value={shipping.addressLine2}
                          onChange={(e) =>
                            setShipping({ addressLine2: e.target.value })
                          }
                          className="px-4 py-3 rounded-[var(--radius-lg)] bg-background text-foreground placeholder:text-muted-foreground border border-border outline-none text-sm font-semibold focus:border-[var(--ag-red)] transition-all"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--ag-gray-500)]">
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="E.g. Near Apollo Hospital"
                          value={shipping.landmark}
                          onChange={(e) =>
                            setShipping({ landmark: e.target.value })
                          }
                          className="px-4 py-3 rounded-[var(--radius-lg)] bg-background text-foreground placeholder:text-muted-foreground border border-border outline-none text-sm font-semibold focus:border-[var(--ag-red)] transition-all"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--ag-gray-500)]">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder="Mumbai"
                          value={shipping.city}
                          onChange={(e) =>
                            setShipping({ city: e.target.value })
                          }
                          className={`px-4 py-3 rounded-[var(--radius-lg)] bg-background text-foreground placeholder:text-muted-foreground border outline-none text-sm font-semibold transition-all ${
                            shippingErrors.city
                              ? "border-red-500 focus:border-red-500"
                              : "border-[var(--ag-gray-200)] dark:border-neutral-700 focus:border-[var(--ag-red)]"
                          }`}
                        />
                        {shippingErrors.city && (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
                            <AlertCircle size={10} /> {shippingErrors.city}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--ag-gray-500)]">
                          State
                        </label>
                        <input
                          type="text"
                          placeholder="Maharashtra"
                          value={shipping.state}
                          onChange={(e) =>
                            setShipping({ state: e.target.value })
                          }
                          className={`px-4 py-3 rounded-[var(--radius-lg)] bg-background text-foreground placeholder:text-muted-foreground border outline-none text-sm font-semibold transition-all ${
                            shippingErrors.state
                              ? "border-red-500 focus:border-red-500"
                              : "border-[var(--ag-gray-200)] dark:border-neutral-700 focus:border-[var(--ag-red)]"
                          }`}
                        />
                        {shippingErrors.state && (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
                            <AlertCircle size={10} /> {shippingErrors.state}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--ag-gray-500)]">
                          PIN Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="400001"
                          value={shipping.pinCode}
                          onChange={(e) =>
                            setShipping({
                              pinCode: e.target.value.replace(/\D/g, ""),
                            })
                          }
                          className={`px-4 py-3 rounded-[var(--radius-lg)] bg-background text-foreground placeholder:text-muted-foreground border outline-none text-sm font-semibold transition-all ${
                            shippingErrors.pinCode
                              ? "border-red-500 focus:border-red-500"
                              : "border-[var(--ag-gray-200)] dark:border-neutral-700 focus:border-[var(--ag-red)]"
                          }`}
                        />
                        {shippingErrors.pinCode && (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
                            <AlertCircle size={10} /> {shippingErrors.pinCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 flex justify-between gap-4">
                      <button
                        onClick={handlePrevStep}
                        className="px-5 py-3 border border-[var(--ag-gray-200)] dark:border-neutral-700 hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-800 text-[var(--ag-dark)] dark:text-white font-black text-xs rounded-[var(--radius-lg)] transition-all cursor-pointer"
                      >
                        BACK
                      </button>
                      <button
                        onClick={handleNextStep}
                        className="px-6 py-3 bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] text-white font-black text-xs rounded-[var(--radius-lg)] transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                      >
                        CONTINUE TO DELIVERY
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: DELIVERY METHOD */}
                {step === "delivery" && (
                  <motion.div
                    key="step-delivery"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <h2 className="text-lg font-black text-[var(--ag-dark)] dark:text-white border-b border-[var(--ag-gray-100)] dark:border-neutral-800 pb-3 mb-5">
                      Delivery Method
                    </h2>

                    <div className="grid gap-4">
                      {/* Standard Card */}
                      <button
                        onClick={() => setDeliveryMethod("standard")}
                        className={`flex items-center justify-between p-5 rounded-[var(--radius-xl)] border text-left transition-all w-full cursor-pointer ${
                          deliveryMethod === "standard"
                            ? "border-[var(--ag-red)] bg-[var(--ag-red)]/5 dark:bg-[var(--ag-red)]/10"
                            : "border-[var(--ag-gray-200)] dark:border-neutral-800 hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-850"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              deliveryMethod === "standard"
                                ? "border-[var(--ag-red)] bg-[var(--ag-red)]"
                                : "border-gray-400"
                            }`}
                          >
                            {deliveryMethod === "standard" && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-[var(--ag-dark)] dark:text-white">
                                Standard Shipping
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                {isFreeShippingThreshold
                                  ? "Free Delivery"
                                  : "Best Value"}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-[var(--ag-gray-500)] mt-1">
                              Delivered in 4–7 business days across India.
                            </p>
                          </div>
                        </div>
                        <span className="font-extrabold text-sm text-[var(--ag-dark)] dark:text-white">
                          {isFreeShippingThreshold ? "FREE" : "₹49"}
                        </span>
                      </button>

                      {/* Express Card */}
                      <button
                        onClick={() => setDeliveryMethod("express")}
                        className={`flex items-center justify-between p-5 rounded-[var(--radius-xl)] border text-left transition-all w-full cursor-pointer ${
                          deliveryMethod === "express"
                            ? "border-[var(--ag-red)] bg-[var(--ag-red)]/5 dark:bg-[var(--ag-red)]/10"
                            : "border-[var(--ag-gray-200)] dark:border-neutral-800 hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-850"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              deliveryMethod === "express"
                                ? "border-[var(--ag-red)] bg-[var(--ag-red)]"
                                : "border-gray-400"
                            }`}
                          >
                            {deliveryMethod === "express" && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-[var(--ag-dark)] dark:text-white">
                                Express Shipping
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ag-yellow)] bg-[var(--ag-yellow)]/10 px-2 py-0.5 rounded-md">
                                Fast Delivery
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-[var(--ag-gray-500)] mt-1">
                              Delivered in 1–3 business days. Priority
                              processing.
                            </p>
                          </div>
                        </div>
                        <span className="font-extrabold text-sm text-[var(--ag-dark)] dark:text-white">
                          ₹99
                        </span>
                      </button>
                    </div>

                    <div className="pt-6 flex justify-between gap-4">
                      <button
                        onClick={handlePrevStep}
                        className="px-5 py-3 border border-[var(--ag-gray-200)] dark:border-neutral-700 hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-800 text-[var(--ag-dark)] dark:text-white font-black text-xs rounded-[var(--radius-lg)] transition-all cursor-pointer"
                      >
                        BACK
                      </button>
                      <button
                        onClick={handleNextStep}
                        className="px-6 py-3 bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] text-white font-black text-xs rounded-[var(--radius-lg)] transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                      >
                        CONTINUE TO PAYMENT
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: PAYMENT SELECTION */}
                {step === "payment" && (
                  <motion.div
                    key="step-payment"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <h2 className="text-lg font-black text-[var(--ag-dark)] dark:text-white border-b border-[var(--ag-gray-100)] dark:border-neutral-800 pb-3 mb-5">
                      Payment Method
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Online Payment */}
                      <button
                        onClick={() => setPaymentMethod("ONLINE")}
                        className={`flex flex-col p-4 rounded-[var(--radius-xl)] border text-left transition-colors cursor-pointer gap-2 ${
                          paymentMethod === "ONLINE"
                            ? "border-[var(--ag-red)] bg-[var(--ag-red)]/5 dark:bg-[var(--ag-red)]/10"
                            : "border-[var(--ag-gray-200)] dark:border-neutral-850 hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-850"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              paymentMethod === "ONLINE"
                                ? "border-[var(--ag-red)] bg-[var(--ag-red)]"
                                : "border-gray-400"
                            }`}
                          >
                            {paymentMethod === "ONLINE" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="font-black text-sm text-[var(--ag-dark)] dark:text-white">
                            Online Payment
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold text-[var(--ag-gray-500)] leading-tight ml-6 space-y-1">
                          <p>Secure payment via Razorpay.</p>
                          <p className="text-[9px] uppercase tracking-wider text-[var(--ag-red)]/85">
                            Supports: UPI · Cards · Net Banking · Wallets · EMI
                          </p>
                        </div>
                      </button>

                      {/* Cash on Delivery */}
                      <button
                        onClick={() => setPaymentMethod("COD")}
                        className={`flex flex-col p-4 rounded-[var(--radius-xl)] border text-left transition-colors cursor-pointer gap-2 ${
                          paymentMethod === "COD"
                            ? "border-[var(--ag-red)] bg-[var(--ag-red)]/5 dark:bg-[var(--ag-red)]/10"
                            : "border-[var(--ag-gray-200)] dark:border-neutral-850 hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-850"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              paymentMethod === "COD"
                                ? "border-[var(--ag-red)] bg-[var(--ag-red)]"
                                : "border-gray-400"
                            }`}
                          >
                            {paymentMethod === "COD" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="font-black text-sm text-[var(--ag-dark)] dark:text-white">
                            Cash on Delivery (COD)
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-[var(--ag-gray-500)] leading-tight ml-6">
                          Pay when your order is delivered.
                        </p>
                      </button>
                    </div>

                    {/* Razorpay Integration indicator */}
                    <div className="p-4 rounded-[var(--radius-lg)] bg-amber-500/10 border border-amber-500/25 flex gap-3 mt-4 text-xs font-semibold text-amber-600">
                      <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                      <div>
                        Secure Gateway: Razorpay opens when you click
                        &quot;PLACE ORDER &amp; PAY&quot;. 100% encrypted
                        environment.
                      </div>
                    </div>

                    {paymentError && (
                      <div className="p-3 rounded-[var(--radius-lg)] bg-red-500/10 border border-red-500/25 flex gap-2 text-xs font-bold text-red-500">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>{paymentError}</span>
                      </div>
                    )}

                    {paymentPayload && (
                      <div className="p-3 rounded-[var(--radius-lg)] bg-emerald-500/10 border border-emerald-500/25 flex gap-2 text-xs font-bold text-emerald-600">
                        <Check size={14} className="shrink-0 mt-0.5" />
                        <span>
                          Payment captured in checkout state:{" "}
                          {paymentPayload.razorpay_payment_id}
                        </span>
                      </div>
                    )}

                    {!hasDefaultAddress && (
                      <div className="p-4 rounded-[var(--radius-lg)] bg-red-500/10 border border-red-500/25 flex flex-col gap-3 mt-4 text-xs font-semibold text-red-500">
                        <div className="flex gap-2 items-center">
                          <AlertCircle size={16} className="shrink-0" />
                          <div>
                            <p className="font-bold">Default address is required.</p>
                            <p className="text-[11px] opacity-90">Please add a delivery address to continue.</p>
                          </div>
                        </div>
                        <Link
                          href="/account/addresses?returnTo=/checkout"
                          className="w-full sm:w-auto text-center px-4 py-2 bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] text-white font-black text-xs rounded-[var(--radius-lg)] transition-all cursor-pointer shadow-sm select-none"
                        >
                          Add / Manage Address
                        </Link>
                      </div>
                    )}

                    <div className="pt-6 flex justify-between gap-4">
                      <button
                        onClick={handlePrevStep}
                        className="px-5 py-3 border border-[var(--ag-gray-200)] dark:border-neutral-700 hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-800 text-[var(--ag-dark)] dark:text-white font-black text-xs rounded-[var(--radius-lg)] transition-all cursor-pointer"
                      >
                        BACK
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={loading || !hasDefaultAddress}
                        className="px-8 py-3 bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] disabled:bg-muted disabled:text-muted-foreground text-white font-black text-xs rounded-[var(--radius-lg)] transition-all cursor-pointer flex items-center gap-2 shadow-md hover:shadow-lg select-none active:scale-98 disabled:cursor-not-allowed"
                      >
                        {loading ? "PROCESSING..." : paymentMethod === "COD" ? "PLACE ORDER" : "PLACE ORDER & PAY"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 p-4 border border-border rounded-[var(--radius-xl)] bg-card text-card-foreground">
              <div className="flex flex-col items-center text-center gap-1.5">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span className="text-[9px] font-black text-[var(--ag-dark)] dark:text-white uppercase tracking-wider">
                  Secure Payment
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <Truck size={18} className="text-emerald-500" />
                <span className="text-[9px] font-black text-[var(--ag-dark)] dark:text-white uppercase tracking-wider">
                  Fast Delivery
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <RotateCcw size={18} className="text-emerald-500" />
                <span className="text-[9px] font-black text-[var(--ag-dark)] dark:text-white uppercase tracking-wider">
                  Easy Returns
                </span>
              </div>
            </div>
          </div>

          {/* Right panel Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Cart Items Summary */}
              <div className="bg-card text-card-foreground border border-border rounded-[var(--radius-xl)] p-5 shadow-xs flex flex-col gap-4">
                <h3 className="text-sm font-black text-[var(--ag-dark)] dark:text-white border-b border-[var(--ag-gray-100)] dark:border-neutral-800 pb-3">
                  Items Summary
                </h3>
                <div className="divide-y divide-[var(--ag-gray-100)] dark:divide-neutral-800 flex flex-col max-h-[200px] overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 py-3 first:pt-0 last:pb-0 items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Image
                          src={item.image || PLACEHOLDER_IMAGE}
                          alt=""
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover rounded-[var(--radius-md)] border border-border bg-muted shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[var(--ag-dark)] dark:text-white truncate">
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-bold text-[var(--ag-gray-500)]">
                            Qty: {item.quantity} × ₹{item.price}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-[var(--ag-dark)] dark:text-white">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
                   {/* Offers Applied */}
              <div className="bg-card text-card-foreground border border-border rounded-[var(--radius-xl)] p-5 shadow-xs">
                <h3 className="text-xs font-black text-[var(--ag-dark)] dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Tag size={13} className="text-[var(--ag-red)]" /> Offers Applied
                </h3>

                {offers.length > 0 ? (
                  <div className="space-y-2">
                    {offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-[var(--radius-lg)] text-emerald-600 text-[10px] font-bold"
                      >
                        <div className="font-extrabold text-xs">{offer.title}</div>
                        {offer.description && (
                          <div className="text-[9px] opacity-75 mt-0.5">{offer.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--ag-gray-500)] font-bold">No active offers</p>
                )}
              </div>           </div>

              {/* Totals Summary breakdown */}
              <div className="bg-card text-card-foreground border border-border rounded-[var(--radius-xl)] p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-[var(--ag-dark)] dark:text-white border-b border-[var(--ag-gray-100)] dark:border-neutral-800 pb-3">
                  Summary Breakdown
                </h3>

                <div className="space-y-2.5 text-xs font-bold text-[var(--ag-gray-800)] dark:text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-[var(--ag-gray-500)]">Subtotal</span>
                    <span className="text-[var(--ag-dark)] dark:text-white">
                      ₹{subtotal}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-500">
                      <span>Discount</span>
                      <span>− ₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-[var(--ag-gray-500)]">
                      Shipping Fee
                    </span>
                    <span className="text-[var(--ag-dark)] dark:text-white">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-500">FREE</span>
                      ) : (
                        `₹${shippingFee}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-[10px] font-semibold text-[var(--ag-gray-500)]">
                    <span>GST (18% Included)</span>
                    <span>₹{gstTax}</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-4 border-t border-[var(--ag-gray-100)] dark:border-neutral-800">
                  <span className="text-sm font-black text-[var(--ag-dark)] dark:text-white">
                    Grand Total
                  </span>
                  <span className="text-xl font-black text-[var(--ag-red)]">
                    ₹{grandTotal}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
