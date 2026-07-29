"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AdminRefreshButtonProps {
  onRefresh?: () => Promise<unknown> | unknown;
}

export default function AdminRefreshButton({ onRefresh }: AdminRefreshButtonProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const refreshing = isRefreshing || isPending;

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        startTransition(() => {
          router.refresh();
        });
      }

      toast.success("Page refreshed.");
    } catch (error) {
      console.error("[AdminRefreshButton] Refresh failed:", error);
      toast.error("Failed to refresh this page.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={refreshing}
      className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-60 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-semibold transition-colors shadow-sm"
    >
      <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
      <span>Refresh</span>
    </button>
  );
}
