/**
 * Orders Page — `/account/orders`
 *
 * Displays the user's order history.
 */

import { requireAuth } from "@/lib/auth/require-auth";
import prisma from "@/lib/prisma";
import { Package, ShoppingBag, ArrowRight, CreditCard } from "lucide-react";
import Link from "next/link";
import { PLACEHOLDER_IMAGE } from "@/lib/utils";
import CancelOrderButton from "@/components/store/orders/CancelOrderButton";


export const metadata = {
  title: "My Orders — Personal Marketing Store",
};

export default async function OrdersPage() {
  const user = await requireAuth("/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-h2 text-[var(--ag-dark)] tracking-tight">
          My Orders
        </h2>
        <p className="text-sm text-[var(--ag-gray-500)] mt-1">
          Track and manage your order history
        </p>
      </div>

      {orders.length === 0 ? (
        /* ── Empty state ── */
        <div className="bg-white dark:bg-[var(--card)] border border-[var(--ag-gray-200)] dark:border-[var(--border)] rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[var(--ag-gray-100)] dark:bg-[var(--muted)] flex items-center justify-center mx-auto mb-4">
            <Package
              size={28}
              className="text-[var(--ag-gray-500)]"
            />
          </div>
          <h3 className="font-bold text-base text-[var(--ag-dark)] mb-1">
            No orders yet
          </h3>
          <p className="text-sm text-[var(--ag-gray-500)] mb-6 max-w-xs mx-auto">
            When you place an order, it will appear here for easy tracking.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-px"
          >
            <ShoppingBag size={16} />
            Start Shopping
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        /* ── Orders list ── */
        <div className="space-y-6">
          {orders.map((order) => {
            const statusColors: Record<string, string> = {
              PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30",
              PROCESSING: "bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30",
              SHIPPED: "bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/30",
              DELIVERED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30",
              CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200/50 dark:border-red-900/30",
            };

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-[var(--card)] border border-[var(--ag-gray-200)] dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Order Header strip */}
                <div className="bg-[var(--ag-gray-100)] dark:bg-neutral-900/50 px-5 py-4 border-b border-[var(--ag-gray-200)] dark:border-neutral-800 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[var(--ag-gray-500)]">
                        Order Placed
                      </p>
                      <p className="text-xs font-bold text-[var(--ag-dark)] dark:text-gray-300">
                        {new Intl.DateTimeFormat("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(order.createdAt))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[var(--ag-gray-500)]">
                        Order ID
                      </p>
                      <p className="text-xs font-bold text-[var(--ag-dark)] dark:text-gray-300 font-mono">
                        {order.orderNumber}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Order Items list */}
                <div className="p-5 divide-y divide-[var(--ag-gray-100)] dark:divide-neutral-800/50">
                  {order.items.map((item) => {
                    const primaryImage =
                      item.product.images.find((img) => img.isPrimary)?.url ||
                      item.product.images[0]?.url ||
                      PLACEHOLDER_IMAGE;

                    return (
                      <div key={item.id} className="flex gap-4 py-4.5 first:pt-0 last:pb-0">
                        <img
                          src={primaryImage}
                          alt={item.product.name}
                          className="w-14 h-14 object-cover rounded-xl border border-[var(--ag-gray-200)] dark:border-neutral-800 bg-[var(--ag-gray-100)] dark:bg-neutral-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[var(--ag-dark)] dark:text-gray-200 line-clamp-1">
                            {item.product.name}
                          </h4>
                          <div className="flex gap-4 mt-1 text-[11px] font-bold text-[var(--ag-gray-500)]">
                            <span>Qty: {item.quantity}</span>
                            <span>Price: ₹{item.price}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Razorpay structure & Total billing footer */}
                <div className="bg-[var(--ag-gray-100)]/30 dark:bg-neutral-900/10 px-5 py-4 border-t border-[var(--ag-gray-200)] dark:border-neutral-800/80 flex flex-wrap gap-4 items-center justify-between">
                  {/* Payment Method & Metadata */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ag-gray-500)]">
                    <CreditCard size={14} className="shrink-0" />
                    <span>Payment: </span>
                    <span className="font-bold text-[var(--ag-dark)] dark:text-gray-300">
                      {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
                    </span>
                    {order.paymentMethod === "ONLINE" && order.razorpayOrderId && (
                      <span className="font-mono text-[11px] text-[var(--ag-gray-500)] hidden sm:inline">
                        ({order.razorpayOrderId})
                      </span>
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      order.paymentStatus === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30"
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[var(--ag-gray-500)] font-bold">
                      Total ({order.items.length} item{order.items.length > 1 ? "s" : ""}):
                    </span>
                    <span className="text-base font-black text-[var(--ag-red)] mr-2">
                      ₹{order.totalAmount.toLocaleString("en-IN")}
                    </span>
                    <CancelOrderButton orderId={order.id} orderStatus={order.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
