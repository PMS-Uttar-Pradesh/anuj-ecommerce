"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, MapPin, CreditCard, ShoppingBag, Loader2, ArrowRight, AlertTriangle, Undo2 } from "lucide-react";
import { updateOrderStatus } from "@/lib/actions/admin-orders";
import { processOrderRefundAction } from "@/lib/actions/refund";
import { OrderStatus, RefundStatus } from "@prisma/client";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    images: { url: string }[];
  };
  variant: {
    optionName: string;
    optionValue: string;
  } | null;
}

interface Address {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  refundStatus: RefundStatus;
  refundId: string | null;
  refundedAt: Date | string | null;
  refundedAmount: number | null;
  refundError: string | null;
  createdAt: Date | string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    addresses: Address[];
  };
  items: OrderItem[];
}

interface OrderDetailClientProps {
  order: OrderDetail;
}

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRefundPending, startRefundTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const customerName =
    order.user.firstName || order.user.lastName
      ? `${order.user.firstName ?? ""} ${order.user.lastName ?? ""}`.trim()
      : order.user.email;

  // Shipping address (default or first address)
  const shippingAddress =
    order.user.addresses.find((addr) => addr.isDefault) || order.user.addresses[0];

  // Legal transitions helper
  const getAvailableTransitions = (current: OrderStatus): OrderStatus[] => {
    if (current === OrderStatus.CANCELLED || current === OrderStatus.DELIVERED) {
      return [];
    }
    switch (current) {
      case OrderStatus.PENDING:
        return [OrderStatus.PROCESSING, OrderStatus.CANCELLED];
      case OrderStatus.PROCESSING:
        return [OrderStatus.SHIPPED, OrderStatus.CANCELLED];
      case OrderStatus.SHIPPED:
        return [OrderStatus.DELIVERED];
      default:
        return [];
    }
  };

  const transitions = getAvailableTransitions(order.status);

  // Refund eligibility: show button when order is cancelled, paid online, and refund is PENDING or FAILED
  const isRefundEligible =
    order.status === OrderStatus.CANCELLED &&
    order.paymentMethod === "ONLINE" &&
    (order.paymentStatus === "COMPLETED" || order.paymentStatus === "REFUNDED") &&
    (order.refundStatus === RefundStatus.PENDING || order.refundStatus === RefundStatus.FAILED);

  const handleProcessRefund = () => {
    setRefundError(null);
    startRefundTransition(async () => {
      const res = await processOrderRefundAction(order.id);
      if (res.success) {
        setShowRefundDialog(false);
        router.refresh();
      } else {
        setRefundError(res.error || "Failed to process refund.");
      }
    });
  };

  const refundStatusLabel: Record<string, string> = {
    NOT_REQUIRED: "Not Required",
    PENDING: "Pending",
    PROCESSING: "Processing…",
    REFUNDED: "Refunded",
    FAILED: "Failed",
  };

  const refundStatusColor: Record<string, string> = {
    NOT_REQUIRED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
    PROCESSING: "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
    REFUNDED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
    FAILED: "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-900/30",
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (status === order.status) return;

    startTransition(async () => {
      const res = await updateOrderStatus(order.id, status);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || "Failed to update order status");
        setStatus(order.status); // reset
      }
    });
  };

  return (
    <div className="space-y-8 animate-scaleIn">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-150 transition-colors shadow-sm"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">
                Order #{order.orderNumber}
              </h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  order.status === "DELIVERED"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/30"
                    : order.status === "PROCESSING" || order.status === "SHIPPED"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450 border border-blue-200 dark:border-blue-900/30"
                    : order.status === "CANCELLED"
                    ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-450 border border-red-200 dark:border-red-900/30"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-200 dark:border-amber-900/30"
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/* Transition Status Form */}
        {transitions.length > 0 && (
          <form onSubmit={handleStatusChange} className="flex items-center gap-3 bg-white dark:bg-zinc-950 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value={order.status}>No Change</option>
              {transitions.map((t) => (
                <option key={t} value={t}>
                  Transition to {t}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isPending || status === order.status}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 text-white disabled:text-zinc-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <ArrowRight className="size-3" />
              )}
              <span>Update Status</span>
            </button>
          </form>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-medium max-w-xl">
          {error}
        </div>
      )}

      {/* Detail grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-semibold font-display flex items-center gap-2">
              <ShoppingBag className="size-4 text-zinc-500" /> Items in Order
            </h3>

            <div className="divide-y divide-zinc-150 dark:divide-zinc-800">
              {order.items.map((item) => (
                <div key={item.id} className="flex py-4 gap-4 items-center justify-between">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="size-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center relative">
                      {item.product.images[0]?.url ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <ShoppingBag className="size-6 text-zinc-400" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[280px] sm:max-w-[400px]">
                        {item.product.name}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {item.variant.optionName}: {item.variant.optionValue}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      ₹{item.price} x {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total aggregation bar */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-2 text-sm text-zinc-500 font-semibold">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  ₹{order.subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>- ₹{order.discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee.toLocaleString("en-IN")}`}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold">
                <span>Order Grand Total</span>
                <span className="text-xl font-bold text-red-600 dark:text-red-500 font-display">
                  ₹{order.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer and Payment sidebar */}
        <div className="space-y-6">
          {/* Customer profile */}
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-semibold font-display flex items-center gap-2">
              <User className="size-4 text-zinc-500" /> Customer Information
            </h3>
            <div>
              <Link
                href={`/admin/customers/${order.user.id}`}
                className="font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-red-650 hover:underline"
              >
                {customerName}
              </Link>
              <p className="text-xs text-zinc-500 mt-0.5">{order.user.email}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-semibold font-display flex items-center gap-2">
              <MapPin className="size-4 text-zinc-500" /> Shipping Destination
            </h3>
            {shippingAddress ? (
              <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-850 dark:text-zinc-200">{customerName}</p>
                <p>{shippingAddress.line1}</p>
                {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                </p>
              </div>
            ) : (
              <p className="text-xs italic text-zinc-400">
                No delivery address details synced.
              </p>
            )}
          </div>

          {/* Payment metadata */}
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-semibold font-display flex items-center gap-2">
              <CreditCard className="size-4 text-zinc-500" /> Payment Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Payment Method</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Payment Status</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full border ${
                    order.paymentStatus === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/30"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-200 dark:border-amber-900/30"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.razorpayOrderId && (
                <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Razorpay Order ID
                  </p>
                  <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 select-all truncate">
                    {order.razorpayOrderId}
                  </p>
                </div>
              )}
              {order.razorpayPaymentId && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Razorpay Payment ID
                  </p>
                  <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 select-all truncate">
                    {order.razorpayPaymentId}
                  </p>
                </div>
              )}

              {/* Refund Status Section */}
              {order.refundStatus !== RefundStatus.NOT_REQUIRED && (
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Refund Status</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full border text-[10px] ${
                        refundStatusColor[order.refundStatus] ?? ""
                      }`}
                    >
                      {refundStatusLabel[order.refundStatus] ?? order.refundStatus}
                    </span>
                  </div>

                  {order.refundStatus === RefundStatus.REFUNDED && order.refundedAmount != null && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Refunded Amount</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        ₹{Number(order.refundedAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {order.refundId && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Refund ID
                      </p>
                      <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 select-all truncate">
                        {order.refundId}
                      </p>
                    </div>
                  )}

                  {order.refundStatus === RefundStatus.REFUNDED && order.refundedAt && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Refunded On</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {new Date(order.refundedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  )}

                  {order.refundStatus === RefundStatus.FAILED && order.refundError && (
                    <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                      <p className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                        Last Error: {order.refundError}
                      </p>
                    </div>
                  )}

                  {/* Process Refund Button */}
                  {isRefundEligible && (
                    <button
                      onClick={() => setShowRefundDialog(true)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer mt-2"
                    >
                      <Undo2 className="size-3.5" />
                      Process Refund
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Refund Confirmation Dialog Overlay */}
      {showRefundDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">Confirm Refund</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Order #{order.orderNumber}
                </p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You are about to refund <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{order.totalAmount.toLocaleString("en-IN")}</span> to the customer&apos;s original payment method via Razorpay. This action cannot be undone.
            </p>

            {refundError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-medium">
                {refundError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setShowRefundDialog(false);
                  setRefundError(null);
                }}
                disabled={isRefundPending}
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRefund}
                disabled={isRefundPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {isRefundPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Undo2 className="size-3.5" />
                )}
                {isRefundPending ? "Processing…" : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
