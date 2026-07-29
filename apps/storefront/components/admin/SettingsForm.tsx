"use client";

import { useState } from "react";
import { updateStoreSettings } from "@/lib/actions/settings";
import { toast } from "sonner";
import { Truck } from "lucide-react";

interface SettingsFormProps {
  initialThreshold: number;
}

export default function SettingsForm({ initialThreshold }: SettingsFormProps) {
  const [threshold, setThreshold] = useState(initialThreshold.toString());
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const val = parseInt(threshold, 10);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid positive number.");
      setIsLoading(false);
      return;
    }

    const result = await updateStoreSettings({ freeDeliveryThreshold: val });
    if (result.success) {
      toast.success("Settings updated successfully.");
    } else {
      toast.error(result.error || "Failed to update settings.");
    }

    setIsLoading(false);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
          <Truck className="size-5 text-zinc-500 dark:text-zinc-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Shipping
          </h2>
          <p className="text-sm text-zinc-500">
            Configure delivery rules and thresholds.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div>
          <label htmlFor="threshold" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Free Delivery Above (₹)
          </label>
          <input
            id="threshold"
            type="number"
            min="0"
            required
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
