"use client";

import React, { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Upload, Sparkles } from "lucide-react";
import Link from "next/link";
import { createPromotion, updatePromotion } from "@/lib/actions/admin-promotions";
import { PromotionTargetType } from "@prisma/client";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";

interface SimpleEntity {
  id: string;
  name: string;
}

interface PromotionFormProps {
  products: SimpleEntity[];
  categories: SimpleEntity[];
  initialData?: {
    id: string;
    title: string;
    subtitle?: string | null;
    description?: string | null;
    imageUrl: string;
    buttonText: string;
    redirectType: PromotionTargetType;
    redirectId: string;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
    displayOrder: number;
  };
}

export default function PromotionFormClient({ products, categories, initialData }: PromotionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [buttonText, setButtonText] = useState(initialData?.buttonText ?? "Shop Now");
  const [redirectType, setRedirectType] = useState<PromotionTargetType>(initialData?.redirectType ?? PromotionTargetType.PRODUCT);
  const [redirectId, setRedirectId] = useState(initialData?.redirectId ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [displayOrder, setDisplayOrder] = useState(initialData?.displayOrder.toString() ?? "0");

  // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
  const formatDateForInput = (dateObj: Date | undefined) => {
    if (!dateObj) return "";
    const d = new Date(dateObj);
    const pad = (num: number) => num.toString().padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [startDate, setStartDate] = useState(initialData ? formatDateForInput(initialData.startDate) : "");
  const [endDate, setEndDate] = useState(initialData ? formatDateForInput(initialData.endDate) : "");

  // Cloudinary image upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Upload failed");
      }

      setImageUrl(data.secure_url);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(`Image upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError("Promotion Title is required");
    if (!imageUrl.trim()) return setError("Banner Image is required");
    if (!buttonText.trim()) return setError("Button Text is required");
    if (!redirectId) return setError("Please select a redirect target");
    if (!startDate) return setError("Start Date is required");
    if (!endDate) return setError("End Date is required");

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return setError("Start Date must be before End Date");
    }

    const payload = {
      title,
      subtitle: subtitle.trim() || undefined,
      description: description.trim() || undefined,
      imageUrl,
      buttonText,
      redirectType,
      redirectId,
      isActive,
      startDate: start,
      endDate: end,
      displayOrder: parseInt(displayOrder) || 0,
    };

    startTransition(async () => {
      let res;
      if (initialData) {
        res = await updatePromotion(initialData.id, payload);
      } else {
        res = await createPromotion(payload);
      }

      if (res.success) {
        router.push("/admin/promotions");
        router.refresh();
      } else {
        setError(res.error || "Something went wrong.");
      }
    });
  };

  const currentSelectionList = redirectType === PromotionTargetType.PRODUCT ? products : categories;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/promotions"
            className="p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-150 transition-colors shadow-sm"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">
              {initialData ? "Edit Promotion" : "Add New Promotion"}
            </h1>
            <p className="text-sm text-zinc-500">
              {initialData ? "Modify promotional banner content and schedules" : "Create a new homepage promotional slide banner"}
            </p>
          </div>
        </div>
        <AdminRefreshButton />
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Content Details) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-semibold font-display">Banner Content</h2>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Promotion Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Back To School Sale"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Flat 20% OFF on all items"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Internal notes or extended description..."
                rows={3}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Button CTA Text *
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="e.g. Shop Now"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-semibold font-display">Schedule Campaign</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Image and Redirection Target) */}
        <div className="space-y-6">
          {/* Target selection */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-semibold font-display">Redirect Destination</h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Target Type
                </label>
                <select
                  value={redirectType}
                  onChange={(e) => {
                    setRedirectType(e.target.value as PromotionTargetType);
                    setRedirectId(""); // Reset selection
                  }}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value={PromotionTargetType.PRODUCT}>Product Detail Page</option>
                  <option value={PromotionTargetType.CATEGORY}>Category / Collection Page</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Select Target *
                </label>
                <select
                  value={redirectId}
                  onChange={(e) => setRedirectId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Choose Target...</option>
                  {currentSelectionList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Banner image upload */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-semibold font-display">Banner Image</h2>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {imageUrl ? (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                  <img src={imageUrl} alt="Banner Preview" className="object-cover w-full h-full" />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-250 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload size={13} /> Change Image
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-850 hover:border-zinc-350 dark:hover:border-zinc-700 flex flex-col items-center justify-center cursor-pointer transition-all bg-zinc-50/50 dark:bg-zinc-900/10 min-h-[140px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-5 text-red-500 animate-spin mb-1" />
                    <span className="text-xs font-semibold text-zinc-500">Uploading to Cloudinary...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-5 text-zinc-400 mb-1" />
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Upload Banner Image</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">Aspect ratio 21:8 recommended</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Visibility toggle */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-semibold font-display">Campaign Visibility</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-zinc-300 text-red-650 focus:ring-red-500 size-4"
              />
              <div className="text-sm">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">Active Slide</p>
                <p className="text-xs text-zinc-500">Display this banner during scheduled dates</p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <button
            type="submit"
            disabled={isPending || isUploading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-800 text-white font-semibold rounded-xl transition-all shadow-md shadow-red-600/10 cursor-pointer text-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Saving Promotion...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Save Promotion</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
