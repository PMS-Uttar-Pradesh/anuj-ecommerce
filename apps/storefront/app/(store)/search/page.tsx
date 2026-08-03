import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductCard from "@/components/store/products/ProductCard";
import { StorefrontProduct } from "@/components/store/products/ProductCard";
import { searchProducts } from "@/lib/actions/product-actions";

interface SearchPageProps {
  searchParams?: {
    q?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = (searchParams?.q ?? "").trim();
  const products: StorefrontProduct[] = query
    ? (await searchProducts(query, 100)) as StorefrontProduct[]
    : [];

  return (
    <main className="min-h-screen bg-background text-foreground select-none">
      <div className="bg-[#1A1A1A] text-white py-10 border-b border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-4 font-semibold">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-white/95">Search</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-display font-black text-white mb-2 tracking-tight">
            Search Results
          </h1>
          <p className="text-sm text-white/60 font-medium">
            {query
              ? `Showing ${products.length} result${products.length === 1 ? "" : "s"} for "${query}"`
              : "Enter a search query to discover products in our catalog."}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 bg-radial from-white to-transparent translate-x-1/3 -translate-y-1/3" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex flex-col gap-6">
        {query === "" ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card text-card-foreground border border-border rounded-[var(--radius-lg)] shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[var(--ag-gray-100)] flex items-center justify-center mb-4 text-[var(--ag-gray-500)] text-2xl">
              🔍
            </div>
            <h3 className="font-display font-black text-lg text-foreground mb-1">
              Search our catalog
            </h3>
            <p className="text-sm text-[var(--ag-gray-500)] max-w-xl">
              Try searching for pens, notebooks or drawing books to find premium stationery products.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card text-card-foreground border border-border rounded-[var(--radius-lg)] shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[var(--ag-gray-100)] flex items-center justify-center mb-4 text-[var(--ag-gray-500)] text-2xl">
              📦
            </div>
            <h3 className="font-display font-black text-lg text-foreground mb-1">
              No products found.
            </h3>
            <p className="text-sm text-[var(--ag-gray-500)] mb-4 max-w-xl">
              Try searching for pens, notebooks or drawing books.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--ag-red)] hover:bg-[var(--ag-red)]/10 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
