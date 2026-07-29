import prisma from "@/lib/prisma";
import { ArrowUpRight, ArrowDownRight, PackageOpen, AlertTriangle } from "lucide-react";
import RevenueChart from "@/components/admin/RevenueChart";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch statistics in parallel
  const [
    revenueAggregation,
    totalOrders,
    totalCustomers,
    recentOrders,
    productsWithVariants,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "COMPLETED" },
      _sum: { totalAmount: true },
    }),
    prisma.order.count(),
    prisma.user.count({
      where: { role: "CUSTOMER" },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        variants: {
          select: { stock: true },
        },
      },
    }),
  ]);

  const totalRevenue = revenueAggregation._sum.totalAmount || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Filter low stock products
  const lowStockThresholdCount = productsWithVariants.filter((p) => {
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
    return totalStock < p.lowStockThreshold;
  }).length;

  // Inventory widgets counts
  const totalProducts = productsWithVariants.length;
  let inStockProducts = 0;
  let lowStockProducts = 0;
  let outOfStockProducts = 0;

  productsWithVariants.forEach((p) => {
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
    if (totalStock === 0) {
      outOfStockProducts++;
    } else if (totalStock < p.lowStockThreshold) {
      lowStockProducts++;
    } else {
      inStockProducts++;
    }
  });

  // Daily revenue for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const orders30Days = await prisma.order.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      paymentStatus: "COMPLETED",
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
  });

  const dailyMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyMap.set(dateStr, 0);
  }

  orders30Days.forEach((o) => {
    const dateStr = o.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, dailyMap.get(dateStr)! + o.totalAmount);
    }
  });

  const chartData = Array.from(dailyMap.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }));

  // Top 5 products by units sold
  const soldItems = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: { paymentStatus: "COMPLETED" },
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 5,
  });

  const topProducts = await Promise.all(
    soldItems.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, price: true },
      });
      return {
        name: product?.name || "Unknown Product",
        unitsSold: item._sum.quantity || 0,
        revenue: (item._sum.quantity || 0) * (product?.price || 0),
      };
    })
  );

  return (
    <div className="space-y-8 animate-scaleIn">
      {/* Low Stock Alert */}
      {lowStockThresholdCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Inventory Alert</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {lowStockThresholdCount} products require restocking
              </p>
            </div>
          </div>
          <Link
            href="/admin/inventory"
            className="text-xs font-semibold px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 rounded-lg transition-colors border border-amber-600/20"
          >
            Review Inventory
          </Link>
        </div>
      )}

      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">
            Dashboard Overview
          </h1>
          <p className="text-sm text-zinc-500">
            Real-time business performance metrics and insights
          </p>
        </div>
        <AdminRefreshButton />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Total Revenue
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold tracking-tight">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </span>
            <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5 mr-0.5" />
              12.4%
            </span>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Total Orders
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold tracking-tight">
              {totalOrders}
            </span>
            <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5 mr-0.5" />
              8.2%
            </span>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Total Customers
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold tracking-tight">
              {totalCustomers}
            </span>
            <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5 mr-0.5" />
              5.1%
            </span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Average Order Value
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold tracking-tight">
              ₹{avgOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
            <span className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="size-3.5 mr-0.5" />
              2.3%
            </span>
          </div>
        </div>
      </div>

      {/* Inventory Health Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-display text-zinc-900 dark:text-zinc-50">
          Inventory Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Products */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total Products
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold tracking-tight">
                {totalProducts}
              </span>
            </div>
          </div>
          
          {/* In Stock */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Products In Stock
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-450">
                {inStockProducts}
              </span>
            </div>
          </div>

          {/* Low Stock */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Low Stock Products
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-450">
                {lowStockProducts}
              </span>
            </div>
          </div>

          {/* Out of Stock */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Out of Stock Products
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-450">
                {outOfStockProducts}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Revenue Chart */}
      <RevenueChart data={chartData} />

      {/* Side-by-Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top 5 Products */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold font-display text-zinc-900 dark:text-zinc-50">
              Top Products by Units Sold
            </h3>
            <p className="text-xs text-zinc-500">Highest volume items based on completed orders</p>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {topProducts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <PackageOpen className="size-8 stroke-[1.5]" />
                <p className="text-xs">No orders yet — they&apos;ll show up here the moment a customer checks out</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div key={product.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="truncate max-w-[280px] text-zinc-700 dark:text-zinc-300">
                        {idx + 1}. {product.name}
                      </span>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {product.unitsSold} units (₹{product.revenue.toLocaleString("en-IN")})
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (product.unitsSold / Math.max(...topProducts.map((p) => p.unitsSold))) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold font-display text-zinc-900 dark:text-zinc-50">
                Recent Orders
              </h3>
              <p className="text-xs text-zinc-500">Latest customer purchases</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-medium text-red-600 hover:text-red-500 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="flex-1">
            {recentOrders.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <PackageOpen className="size-8 stroke-[1.5]" />
                <p className="text-xs">No orders yet — they&apos;ll show up here the moment a customer checks out</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {recentOrders.map((order) => {
                  const customerName =
                    order.user.firstName || order.user.lastName
                      ? `${order.user.firstName ?? ""} ${order.user.lastName ?? ""}`.trim()
                      : order.user.email;

                  return (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 -mx-2 transition-colors group"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 transition-colors">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs text-zinc-500 truncate max-w-[180px]">
                          {customerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          ₹{order.totalAmount.toLocaleString("en-IN")}
                        </span>
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
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
