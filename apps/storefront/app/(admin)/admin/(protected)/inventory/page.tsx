import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import InventoryClient from "@/components/admin/InventoryClient";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  // Ensure authenticated admin
  await requireAdmin();

  // Fetch products with images, categories, and variant stock details
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: {
      category: {
        select: { id: true, name: true },
      },
      images: {
        select: { url: true },
      },
      variants: {
        select: { id: true, stock: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">
            Inventory Control
          </h1>
          <p className="text-sm text-zinc-500">
            Monitor stock levels, review alerts, and adjust quantities directly.
          </p>
        </div>
        <AdminRefreshButton />
      </div>

      <InventoryClient initialProducts={products} />
    </div>
  );
}
