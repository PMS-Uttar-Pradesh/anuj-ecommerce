import prisma from "@/lib/prisma";
import CategoryListClient from "@/components/admin/CategoryListClient";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  // Fetch categories along with product counts to support listing checks
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">
            Categories Management
          </h1>
          <p className="text-sm text-zinc-500">
            Manage product categories used for organization and filters in the catalog
          </p>
        </div>
        <AdminRefreshButton />
      </div>

      <CategoryListClient initialCategories={categories} />
    </div>
  );
}
