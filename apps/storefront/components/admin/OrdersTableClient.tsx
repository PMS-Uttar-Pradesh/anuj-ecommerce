"use client";

import React, { useState } from "react";
import Link from "next/link";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrdersForDashboard } from "@/lib/actions/admin-orders";
import { Eye, Search, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderStatus, RefundStatus } from "@prisma/client";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

interface OrderRow {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  status: OrderStatus;
  refundStatus: RefundStatus;
  createdAt: Date | string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface OrdersTableClientProps {
  initialOrders: OrderRow[];
}

function OrdersTable({ initialOrders }: OrdersTableClientProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Polling via React Query
  const { data: orders = initialOrders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const res = await getOrdersForDashboard();
      if (!res.success || !res.orders) {
        throw new Error(res.error || "Failed to fetch orders");
      }
      return res.orders as unknown as OrderRow[];
    },
    initialData: initialOrders,
    refetchInterval: 15000, // Poll every 15 seconds
  });

  // Unique list of statuses
  const tabs = ["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const customerName =
      order.user.firstName || order.user.lastName
        ? `${order.user.firstName ?? ""} ${order.user.lastName ?? ""}`.toLowerCase()
        : order.user.email.toLowerCase();

    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      customerName.includes(search.toLowerCase());

    const matchesTab =
      activeTab === "ALL" ||
      (activeTab === "REFUNDED" ? order.paymentStatus === "REFUNDED" : order.status === activeTab);

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">
            Orders Management
          </h1>
          <p className="text-sm text-zinc-500">
            Monitor incoming customer orders, manage statuses, and track payment conditions
          </p>
        </div>
        <AdminRefreshButton
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ["admin-orders"] })}
        />
      </div>

      {/* Tabs and search bar */}
      <div className="flex flex-col gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                activeTab === tab
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-4">Order Number</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Refund</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center gap-2 justify-center py-6">
                      <ShoppingBag className="size-8 stroke-[1.5] text-zinc-300" />
                      <p className="text-sm font-medium">No orders yet — they&apos;ll show up here the moment a customer checks out</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const customerName =
                    order.user.firstName || order.user.lastName
                      ? `${order.user.firstName ?? ""} ${order.user.lastName ?? ""}`.trim()
                      : order.user.email;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-red-600 dark:text-red-500">
                        #{order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/customers/${order.user.id}`}
                          className="font-semibold text-zinc-950 dark:text-zinc-50 hover:underline hover:text-red-600 dark:hover:text-red-400"
                        >
                          {customerName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        ₹{order.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            order.paymentMethod === "ONLINE"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/30"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-200 dark:border-amber-900/30"
                          }`}
                        >
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            order.paymentStatus === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/30"
                              : order.paymentStatus === "FAILED"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 border-rose-200 dark:border-rose-900/30"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-200 dark:border-amber-900/30"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            order.status === "DELIVERED"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/30"
                              : order.status === "PROCESSING" || order.status === "SHIPPED"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450 border-blue-200 dark:border-blue-900/30"
                              : order.status === "CANCELLED"
                              ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-450 border-red-200 dark:border-red-900/30"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-200 dark:border-amber-900/30"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {order.refundStatus !== "NOT_REQUIRED" ? (
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              order.refundStatus === "REFUNDED"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/30"
                                : order.refundStatus === "FAILED"
                                ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-450 border-red-200 dark:border-red-900/30"
                                : order.refundStatus === "PROCESSING"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450 border-blue-200 dark:border-blue-900/30"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 border-amber-200 dark:border-amber-900/30"
                            }`}
                          >
                            {order.refundStatus}
                          </span>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-55 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Eye className="size-3.5" />
                          <span>View Detail</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function OrdersTableClientWrapper({ initialOrders }: OrdersTableClientProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <OrdersTable initialOrders={initialOrders} />
    </QueryClientProvider>
  );
}
