"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Sparkles, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { createProduct, updateProduct } from "@/lib/actions/admin-products";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";

// High quality stationery presets from Unsplash to wow the user
const IMAGE_PRESETS = [
  { name: "Pencils", url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop" },
  { name: "Pens", url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop" },
  { name: "Notebooks", url: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop" },
  { name: "Balloons", url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop" },
];

import ProductMediaManager, { MediaManagerImage } from "@/components/admin/ProductMediaManager";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: Category[];
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    mrp: number;
    salePrice?: number | null;
    categoryId: string;
    lowStockThreshold: number;
    images?: { id?: string; url: string; publicId?: string; isPrimary: boolean; sortOrder: number }[];
    stock: number;
    isActive: boolean;
    isFeatured: boolean;
    brandName?: string | null;
    brandDescription?: string | null;
    specifications?: any;
  };
}

export default function ProductFormClient({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [price, setPrice] = useState(initialData?.price.toString() ?? "");
  const [mrp, setMrp] = useState(initialData?.mrp.toString() ?? "");
  const [salePrice, setSalePrice] = useState(initialData?.salePrice?.toString() ?? "");
  const [stock, setStock] = useState(initialData?.stock.toString() ?? "0");
  const [lowStockThreshold, setLowStockThreshold] = useState(initialData?.lowStockThreshold.toString() ?? "10");
  const [images, setImages] = useState<MediaManagerImage[]>(initialData?.images ?? []);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  
  // Brand & Specs states
  const [brandName, setBrandName] = useState(initialData?.brandName ?? "");
  const [brandDescription, setBrandDescription] = useState(initialData?.brandDescription ?? "");
  
  const initialSpecs = initialData?.specifications
    ? Object.entries(initialData.specifications as Record<string, string>).map(([k, v]) => ({ key: k, value: v }))
    : [];
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(initialSpecs);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Product name is required");
    if (!categoryId) return setError("Please select a category");
    if (!price || parseFloat(price) <= 0) return setError("Please enter a valid price");
    if (!mrp || parseFloat(mrp) <= 0) return setError("Please enter a valid MRP");

    const parsedPrice = parseFloat(price);
    const parsedSalePrice = salePrice.trim() ? parseFloat(salePrice) : null;
    if (parsedSalePrice !== null) {
      if (isNaN(parsedSalePrice) || parsedSalePrice <= 0) {
        return setError("Sale Price must be greater than 0.");
      }
      if (parsedSalePrice >= parsedPrice) {
        return setError("Sale Price must be less than Original Price.");
      }
    }

    // Construct specifications JSON
    const specificationsObj: Record<string, string> = {};
    specs.forEach((spec) => {
      if (spec.key.trim()) {
        specificationsObj[spec.key.trim()] = spec.value.trim();
      }
    });

    const payload = {
      name,
      description: description.trim() || undefined,
      price: parseFloat(price),
      mrp: parseFloat(mrp),
      salePrice: parsedSalePrice,
      categoryId,
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
      images: images.map((img) => ({
        url: img.url,
        publicId: img.publicId,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
      })),
      stock: parseInt(stock) || 0,
      isActive,
      isFeatured,
      brandName: brandName.trim() || undefined,
      brandDescription: brandDescription.trim() || undefined,
      specifications: specificationsObj,
    };

    startTransition(async () => {
      let res;
      if (initialData) {
        res = await updateProduct(initialData.id, payload);
      } else {
        res = await createProduct(payload);
      }

      if (res.success) {
        router.push("/admin/products");
      } else {
        setError(res.error || "Something went wrong. Please check inputs.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-150 transition-colors shadow-sm"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">
              {initialData ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-sm text-zinc-500">
              {initialData ? "Modify existing product attributes and stock levels" : "Create a new product listing in your catalog"}
            </p>
          </div>
        </div>
        <AdminRefreshButton />
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-semibold font-display">General Information</h2>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Muji Style Gel Ink Pen 0.5mm"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of product features..."
                rows={5}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-semibold font-display">Pricing & Inventory</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Original Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  MRP (Maximum Retail Price) (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Sale Price (₹) (Offer)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Leave blank if no offer"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  In-Stock Inventory Count
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  placeholder="10"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Brand Information */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-semibold font-display">Brand Information</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Muji"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Brand Description
                </label>
                <textarea
                  value={brandDescription}
                  onChange={(e) => setBrandDescription(e.target.value)}
                  placeholder="Brand history, quality standards, or values..."
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y"
                />
              </div>
            </div>
          </div>

          {/* Product Specifications */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold font-display">Product Specifications</h2>
              <button
                type="button"
                onClick={() => setSpecs([...specs, { key: "", value: "" }])}
                className="text-xs py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer font-bold shadow-sm"
              >
                Add Row
              </button>
            </div>
            
            {specs.length > 0 ? (
              <div className="space-y-3">
                {specs.map((spec, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      placeholder="Key (e.g. Pages)"
                      value={spec.key}
                      onChange={(e) => {
                        const newSpecs = [...specs];
                        newSpecs[index].key = e.target.value;
                        setSpecs(newSpecs);
                      }}
                      className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 200)"
                      value={spec.value}
                      onChange={(e) => {
                        const newSpecs = [...specs];
                        newSpecs[index].value = e.target.value;
                        setSpecs(newSpecs);
                      }}
                      className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSpecs(specs.filter((_, idx) => idx !== index));
                      }}
                      className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-450 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No specifications added. Click &quot;Add Row&quot; to start.</p>
            )}
          </div>
        </div>

        {/* Right side controls */}
        <div className="space-y-6">
          {/* Category selection */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-semibold font-display">Categorization</h2>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Product Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image selection */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-semibold font-display">Product Media</h2>
            <ProductMediaManager
              images={images}
              onChange={setImages}
              productName={name}
            />
          </div>

          {/* Visibility and Featured flags */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-semibold font-display">Catalog Visibility</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-zinc-300 text-red-600 focus:ring-red-500 size-4"
              />
              <div className="text-sm">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">Active Listing</p>
                <p className="text-xs text-zinc-500">Visible to customers in the catalog</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-zinc-300 text-red-600 focus:ring-red-500 size-4"
              />
              <div className="text-sm">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">Featured Listing</p>
                <p className="text-xs text-zinc-500">Display prominently on the home page</p>
              </div>
            </label>
          </div>

          {/* Save / Actions */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-800 text-white font-semibold rounded-xl transition-all shadow-md shadow-red-600/10 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Saving Product...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Save Product</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
