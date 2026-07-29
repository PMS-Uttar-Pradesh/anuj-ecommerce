"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { createCategory, updateCategory } from "@/lib/actions/admin-categories";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";

interface CategoryFormProps {
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
  };
}

export default function CategoryFormClient({ initialData }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Category name is required");

    const payload = {
      name,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    };

    startTransition(async () => {
      let res;
      if (initialData) {
        res = await updateCategory(initialData.id, payload);
      } else {
        res = await createCategory(payload);
      }

      if (res.success) {
        router.push("/admin/categories");
      } else {
        setError(res.error || "Failed to save category");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/categories"
            className="p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-150 transition-colors shadow-sm"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">
              {initialData ? "Edit Category" : "Add New Category"}
            </h1>
            <p className="text-sm text-zinc-500">
              {initialData ? "Modify existing category name and description" : "Create a new catalog category for grouping products"}
            </p>
          </div>
        </div>
        <AdminRefreshButton />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h2 className="text-base font-semibold font-display">Category Details</h2>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fine Liners & Calligraphy"
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
              placeholder="Provide a brief summary of catalog items under this category..."
              rows={4}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Image URL
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {imageUrl && (
            <div className="relative aspect-video max-w-sm rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <img src={imageUrl} alt="Preview" className="object-cover w-full h-full" />
            </div>
          )}
        </div>

        {/* Form controls */}
        <div className="flex gap-4">
          <Link
            href="/admin/categories"
            className="flex-1 py-3 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-center transition-colors text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-800 text-white font-semibold rounded-xl transition-all shadow-md shadow-red-600/10 cursor-pointer text-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Save Category</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
