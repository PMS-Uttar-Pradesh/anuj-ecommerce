import prisma from "@/lib/prisma";
import ReportsFilterClient from "@/components/admin/ReportsFilterClient";
import ReportsChartWrapper from "@/components/admin/ReportsChartWrapper";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ArrowUpRight, ShoppingBag, CreditCard, Box, TrendingUp } from "lucide-react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  // Enforce admin permission check
  await requireAdmin();

  const { preset = "last-30", from, to } = await searchParams;

  let startDate = new Date();
  let endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  let presetLabel = "Last 30 Days";

  if (preset === "today") {
    startDate.setHours(0, 0, 0, 0);
    presetLabel = "Today";
  } else if (preset === "last-7") {
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
    presetLabel = "Last 7 Days";
  } else if (preset === "last-30") {
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);
    presetLabel = "Last 30 Days";
  } else if (preset === "this-month") {
    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    presetLabel = "This Month";
  } else if (preset === "custom" && from && to) {
    startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
    presetLabel = `Custom Range (${startDate.toLocaleDateString("en-IN", { dateStyle: "short" })} to ${endDate.toLocaleDateString("en-IN", { dateStyle: "short" })})`;
  } else {
    // Fallback default to last 30 days
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);
  }

  // Fetch all completed orders in timeframe
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "COMPLETED",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Calculate high-level aggregates
  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalSales / totalOrdersCount : 0;
  
  const totalUnitsSold = orders.reduce(
    (sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  // Initialize daily chart map
  const dailyMap = new Map<string, number>();
  const tempDate = new Date(startDate);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const limitDays = Math.min(diffDays, 366); // Cap safety at 1 year

  for (let i = 0; i <= limitDays; i++) {
    const dateStr = tempDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyMap.set(dateStr, 0);
    tempDate.setDate(tempDate.getDate() + 1);
  }

  // Aggregate daily sales
  orders.forEach((o) => {
    const dateStr = o.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, dailyMap.get(dateStr)! + o.totalAmount);
    }
  });

  const chartData = Array.from(dailyMap.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }));

  // Aggregate products & categories sales
  const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  const categorySalesMap = new Map<string, { name: string; revenue: number }>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const pName = item.product?.name || "Deleted Product";
      const catName = item.product?.category?.name || "Uncategorized";

      // Products
      const existProd = productSalesMap.get(item.productId) || { name: pName, quantity: 0, revenue: 0 };
      existProd.quantity += item.quantity;
      existProd.revenue += item.price * item.quantity;
      productSalesMap.set(item.productId, existProd);

      // Categories
      const existCat = categorySalesMap.get(catName) || { name: catName, revenue: 0 };
      existCat.revenue += item.price * item.quantity;
      categorySalesMap.set(catName, existCat);
    });
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const categorySales = Array.from(categorySalesMap.values())
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-8 animate-scaleIn">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">
            Financial & Sales Reports
          </h1>
          <p className="text-sm text-zinc-500">
            Comprehensive business analytics, top products performance, and sales breakdown
          </p>
        </div>
        <AdminRefreshButton />
      </div>

      {/* Date filter selector client component */}
      <ReportsFilterClient />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Timeframe Revenue</span>
            <ArrowUpRight className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2 font-display">
            ₹{totalSales.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-zinc-400 mt-2">Completed transaction totals</p>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Completed Orders</span>
            <ShoppingBag className="size-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2 font-display">
            {totalOrdersCount}
          </p>
          <p className="text-[10px] text-zinc-400 mt-2">Orders successfully paid</p>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Average Order Value</span>
            <CreditCard className="size-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2 font-display">
            ₹{avgOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-zinc-400 mt-2">Total sales divided by orders count</p>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Total Units Sold</span>
            <Box className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2 font-display">
            {totalUnitsSold}
          </p>
          <p className="text-[10px] text-zinc-400 mt-2">Individual stationery items packaged</p>
        </div>
      </div>

      {/* Dynamic Graph */}
      <ReportsChartWrapper
        data={chartData}
        title="Revenue Breakdown"
        subtitle={`Daily sales trends inside the selected period (${presetLabel})`}
      />

      {/* Tables Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold font-display text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <TrendingUp className="size-4 text-zinc-450" /> Top Selling Products
            </h3>
            <p className="text-xs text-zinc-500">Highest grossing items inside this range</p>
          </div>
          <div className="flex-1">
            {topProducts.length === 0 ? (
              <p className="text-xs italic text-zinc-400 py-12 text-center">No product sales details found.</p>
            ) : (
              <div className="space-y-4 py-2">
                {topProducts.map((p, idx) => (
                  <div key={p.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[280px]">
                        {idx + 1}. {p.name}
                      </span>
                      <span className="text-zinc-950 dark:text-zinc-100 whitespace-nowrap">
                        {p.quantity} units (₹{p.revenue.toLocaleString("en-IN")})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-650 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (p.revenue / Math.max(...topProducts.map((p) => p.revenue))) * 100
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

        {/* Sales by Category */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold font-display text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Box className="size-4 text-zinc-450" /> Sales by Category
            </h3>
            <p className="text-xs text-zinc-500">Revenue split across stationery categories</p>
          </div>
          <div className="flex-1">
            {categorySales.length === 0 ? (
              <p className="text-xs italic text-zinc-400 py-12 text-center">No category sales details found.</p>
            ) : (
              <div className="space-y-4 py-2">
                {categorySales.map((cat, idx) => (
                  <div key={cat.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {idx + 1}. {cat.name}
                      </span>
                      <span className="text-zinc-950 dark:text-zinc-100 whitespace-nowrap">
                        ₹{cat.revenue.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (cat.revenue / Math.max(...categorySales.map((c) => c.revenue))) * 100
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
      </div>
    </div>
  );
}
