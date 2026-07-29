"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelOrderAction } from "@/lib/actions/orders";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CancelOrderButtonProps {
  orderId: string;
  orderStatus: string;
}

export default function CancelOrderButton({
  orderId,
  orderStatus,
}: CancelOrderButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Display the Cancel Order button only when status is PENDING
  if (orderStatus !== "PENDING") {
    return null;
  }

  const handleCancelOrder = () => {
    startTransition(async () => {
      try {
        const res = await cancelOrderAction(orderId);
        if (res.success) {
          toast.success("Order cancelled successfully!");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to cancel order.");
        }
      } catch (err: any) {
        toast.error(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <Dialog>
      {/* DialogTrigger correctly registers with @base-ui's dialog state machine */}
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer text-xs font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          />
        }
      >
        Cancel Order
      </DialogTrigger>

      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Cancel Order?</DialogTitle>
          <DialogDescription className="mt-3 text-sm whitespace-pre-line text-zinc-500 dark:text-zinc-400">
            {"Are you sure you want to cancel this order?\n\nThis action cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex justify-end gap-3">
          {/* DialogClose lets @base-ui close the dialog without extra state */}
          <DialogClose
            render={
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                className="cursor-pointer border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
              />
            }
          >
            Keep Order
          </DialogClose>
          <Button
            variant="default"
            size="sm"
            onClick={handleCancelOrder}
            disabled={isPending}
            className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold px-4 transition-colors"
          >
            {isPending ? "Cancelling..." : "Yes, Cancel Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
