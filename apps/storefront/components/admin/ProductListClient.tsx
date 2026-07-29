"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Edit2, Trash2, Check, X, Star, PackageOpen, RotateCcw } from "lucide-react";
import {
  toggleProductActive,
  toggleProductFeatured,
  deleteProduct,
  restoreProduct,
  permanentlyDeleteProduct,
} from "@/lib/actions/admin-products";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  isActive: boolean;
  isFeatured: boolean;
  isDeleted: boolean;
  deletedAt: Date | string | null;
  lowStockThreshold: number;
  category: {
    id: string;
    name: string;
  };
  images: {
    url: string;
  }[];
  variants: {
    stock: number;
  }[];
}

interface ProductListClientProps {
  initialProducts: ProductRow[];
  categories: { id: string; name: string }[];
  initialFilter?: string; // e.g. "low-stock"
}

export default function ProductListClient({
  initialProducts,
  categories,
  initialFilter = "",
}: ProductListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState(initialFilter);

  const productsForTab = initialProducts.filter((product) =>
    activeTab === "active" ? !product.isDeleted : product.isDeleted
  );

  // Filter products locally
  const filteredProducts = productsForTab.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.slug.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      !selectedCategory || product.category.id === selectedCategory;

    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    const matchesStock =
      !stockFilter || (stockFilter === "low-stock" && totalStock < product.lowStockThreshold);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleToggleActive = async (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleProductActive(id, !current);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to update status");
      }
    });
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleProductFeatured(id, !current);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to update status");
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This will move the product to Deleted Products.`)) {
      startTransition(async () => {
        const res = await deleteProduct(id);
        if (res.success) {
          router.refresh();
        } else {
          alert(res.error || "Failed to delete product");
        }
      });
    }
  };

  const handleRestore = async (id: string, name: string) => {
    if (confirm(`Restore ${name}? It will move back to Active Products.`)) {
      startTransition(async () => {
        const res = await restoreProduct(id);
        if (res.success) {
          router.refresh();
        } else {
          alert(res.error || "Failed to restore product");
        }
      });
    }
  };

  const handlePermanentDelete = async (id: string, name: string) => {
    if (
      confirm(
        `Permanently delete ${name}? This cannot be undone. Products referenced by existing orders will not be deleted.`
      )
    ) {
      startTransition(async () => {
        const res = await permanentlyDeleteProduct(id);
        if (res.success) {
          router.refresh();
        } else {
          alert(res.error || "Failed to permanently delete product");
        }
      });
    }
  };

  const formatDeletedDate = (deletedAt: Date | string | null) => {
    if (!deletedAt) return "Not available";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(deletedAt));
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
              activeTab === "active"
                ? "border-red-600 text-red-600"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Active Products
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("deleted")}
            className={`border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
              activeTab === "deleted"
                ? "border-red-600 text-red-600"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Deleted Products
          </button>
        </div>
      </div>

      {/* Header controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-3 w-full">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[160px]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Inventory Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[160px]"
          >
            <option value="">All Inventory Levels</option>
            <option value="low-stock">Low Stock Alerts</option>
          </select>
        </div>

        {/* Action Button */}
        <Link
          href="/admin/products/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm w-full md:w-auto justify-center"
        >
          <Plus className="size-4" />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Table view */}
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                {activeTab === "active" ? (
                  <>
                    <th className="px-6 py-4 text-center">Active</th>
                    <th className="px-6 py-4 text-center">Featured</th>
                  </>
                ) : (
                  <th className="px-6 py-4">Deleted Date</th>
                )}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "active" ? 7 : 6} className="px-6 py-12 text-center text-zinc-400">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                  const isLowStock = totalStock < product.lowStockThreshold;
                  const primaryImg = product.images[0]?.url || "";

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors"
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="size-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 relative">
                          {primaryImg ? (
                            <Image
                              src={primaryImg}
                              alt={product.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <PackageOpen className="size-5 text-zinc-400" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] md:max-w-[300px]">
                            {product.name}
                          </p>
                          <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                            {product.slug}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                        {product.category.name}
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        ₹{product.price.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isLowStock
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-zinc-900 dark:text-zinc-100"
                            }`}
                          >
                            {totalStock}
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 px-1.5 py-0.5 rounded-full shrink-0">
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      {activeTab === "active" ? (
                        <>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleToggleActive(product.id, product.isActive)}
                                disabled={isPending}
                                className={`size-6 rounded-md flex items-center justify-center transition-all ${
                                  product.isActive
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                                } hover:scale-105`}
                              >
                                {product.isActive ? (
                                  <Check className="size-3.5 stroke-[2.5]" />
                                ) : (
                                  <X className="size-3.5 stroke-[2.5]" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleToggleFeatured(product.id, product.isFeatured)}
                                disabled={isPending}
                                className={`size-6 rounded-md flex items-center justify-center transition-all ${
                                  product.isFeatured
                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                                } hover:scale-105`}
                              >
                                <Star
                                  className={`size-3.5 stroke-[2.5] ${
                                    product.isFeatured ? "fill-amber-500" : ""
                                  }`}
                                />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                          {formatDeletedDate(product.deletedAt)}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {activeTab === "active" ? (
                            <>
                              <Link
                                href={`/admin/products/${product.id}`}
                                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md transition-colors"
                              >
                                <Edit2 className="size-3.5" />
                              </Link>
                              <button
                                onClick={() => handleDelete(product.id, product.name)}
                                disabled={isPending}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleRestore(product.id, product.name)}
                                disabled={isPending}
                                className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md transition-colors"
                                title="Restore"
                              >
                                <RotateCcw className="size-3.5" />
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(product.id, product.name)}
                                disabled={isPending}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                                title="Permanently delete"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </>
                          )}
                        </div>
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
