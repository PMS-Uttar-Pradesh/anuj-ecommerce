"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Calendar, ShoppingBag, ExternalLink, User } from "lucide-react";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";

interface Address {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface OrderItem {
  id: string;
  product: {
    name: string;
  };
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: Date | string;
  items: OrderItem[];
}

interface CustomerDetail {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date | string;
  addresses: Address[];
  orders: Order[];
}

interface CustomerDetailClientProps {
  customer: CustomerDetail;
}

export default function CustomerDetailClient({ customer }: CustomerDetailClientProps) {
  const customerName =
    customer.firstName || customer.lastName
      ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()
      : customer.email.split("@")[0];

  // Calculate metrics
  const totalOrders = customer.orders.length;
  const totalSpent = customer.orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const aov = totalOrders > 0 ? totalSpent / totalOrders : 0;

  return (
    <div className="space-y-8 animate-scaleIn">
      {/* Header and Back Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-150 transition-colors shadow-sm"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">
              Customer Profile
            </h1>
            <p className="text-sm text-zinc-500">
              View detailed stats and buying history for {customerName}
            </p>
          </div>
        </div>
        <AdminRefreshButton />
      </div>

      {/* Grid: Profile Summary & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Identity Card */}
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-red-100 dark:bg-red-950/30 text-red-750 dark:text-red-400 flex items-center justify-center font-bold text-2xl uppercase shadow-inner shrink-0">
              {customerName.substring(0, 2)}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-lg font-bold font-display text-zinc-900 dark:text-zinc-100 truncate">
                {customerName}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                <User className="size-3.5" />
                <span>ID: {customer.id.substring(0, 8)}...</span>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-150 dark:border-zinc-850 pt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Mail className="size-3.5" /> Email
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 select-all">
                {customer.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Calendar className="size-3.5" /> Joined On
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                  dateStyle: "medium",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Lifetime Value Metrics */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* LTV */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Total Revenue (LTV)
              </p>
              <p className="text-3xl font-bold tracking-tight text-red-650 dark:text-red-500 mt-2 font-display">
                ₹{totalSpent.toLocaleString("en-IN")}
              </p>
            </div>
            <p className="text-[10px] text-zinc-400 mt-4">Cumulative purchase volume</p>
          </div>

          {/* Orders */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Total Orders Placed
              </p>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2 font-display">
                {totalOrders}
              </p>
            </div>
            <p className="text-[10px] text-zinc-400 mt-4">Orders count inside shop database</p>
          </div>

          {/* AOV */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Average Order Value
              </p>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2 font-display">
                ₹{aov.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <p className="text-[10px] text-zinc-400 mt-4">LTV divided by orders count</p>
          </div>
        </div>
      </div>

      {/* Main Info Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Address Book */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-semibold font-display flex items-center gap-2">
              <MapPin className="size-4 text-zinc-500" /> Delivery Address Directory
            </h3>

            {customer.addresses.length === 0 ? (
              <p className="text-xs italic text-zinc-400 py-2">No saved addresses found.</p>
            ) : (
              <div className="space-y-4">
                {customer.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-3 rounded-lg border text-xs space-y-1 relative ${
                      addr.isDefault
                        ? "bg-red-50/20 border-red-200 dark:bg-red-950/10 dark:border-red-900/30"
                        : "bg-zinc-50/50 border-zinc-150 dark:bg-zinc-900/20 dark:border-zinc-850"
                    }`}
                  >
                    {addr.isDefault && (
                      <span className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 bg-red-600 text-white rounded uppercase tracking-wider">
                        Default
                      </span>
                    )}
                    <p className="font-semibold text-zinc-850 dark:text-zinc-200">
                      {customerName}
                    </p>
                    <p>{addr.line1}</p>
                    {addr.line2 && <p>{addr.line2}</p>}
                    <p>
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
              <h3 className="text-base font-semibold font-display flex items-center gap-2">
                <ShoppingBag className="size-4 text-zinc-500" /> Chronological Order History
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-850 text-zinc-650 dark:text-zinc-300 rounded-full">
                {customer.orders.length} orders
              </span>
            </div>

            {customer.orders.length === 0 ? (
              <div className="p-12 text-center text-zinc-450">
                <ShoppingBag className="size-8 mx-auto stroke-[1.5] mb-2 text-zinc-400" />
                <p className="text-sm font-semibold">No orders placed by this customer yet</p>
                <p className="text-xs text-zinc-400">Order entries show up automatically upon checkout completion</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-150 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider select-none">
                      <th className="px-6 py-3.5">Order</th>
                      <th className="px-6 py-3.5">Placed Date</th>
                      <th className="px-6 py-3.5">Items Summary</th>
                      <th className="px-6 py-3.5">Order Status</th>
                      <th className="px-6 py-3.5">Payment</th>
                      <th className="px-6 py-3.5 text-right">Amount</th>
                      <th className="px-6 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-300">
                    {customer.orders.map((order) => {
                      const itemsSummary = order.items
                        .map((item) => `${item.product?.name || "Product"} (${item.quantity})`)
                        .join(", ");

                      return (
                        <tr key={order.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                          <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                            #{order.orderNumber}
                          </td>
                          <td className="px-6 py-4 text-zinc-500 whitespace-nowrap text-xs">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              dateStyle: "medium",
                            })}
                          </td>
                          <td className="px-6 py-4 text-xs font-normal">
                            <p className="truncate max-w-[200px]" title={itemsSummary}>
                              {itemsSummary}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                order.status === OrderStatus.DELIVERED
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/30"
                                  : order.status === OrderStatus.PROCESSING || order.status === OrderStatus.SHIPPED
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450 border border-blue-200 dark:border-blue-900/30"
                                  : order.status === OrderStatus.CANCELLED
                                  ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-450 border border-red-200 dark:border-red-900/30"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-200 dark:border-amber-900/30"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                order.paymentStatus === PaymentStatus.COMPLETED
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/30"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-200 dark:border-amber-900/30"
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                            ₹{order.totalAmount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                            >
                              View <ExternalLink className="size-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
