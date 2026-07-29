import prisma from "@/lib/prisma";
import ProductListClient from "@/components/admin/ProductListClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    filter?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = params.filter ?? "";

  // Fetch products and categories
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: { id: true, name: true },
        },
        images: {
          select: { url: true },
        },
        variants: {
          select: { stock: true },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">
          Products Management
        </h1>
        <p className="text-sm text-zinc-500">
          Create, edit, toggle active status, and track inventory for all products
        </p>
      </div>

      <ProductListClient
        initialProducts={products}
        categories={categories}
        initialFilter={filter}
      />
    </div>
  );
}
