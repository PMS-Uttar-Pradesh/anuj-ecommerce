"use server";

import prisma from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";
import { OrderStatus, RefundStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function cancelOrderAction(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch order with items
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new Error("Order not found.");
      }

      // 2. Security validation: Verify order belongs to the logged-in customer
      if (order.userId !== user.id) {
        throw new Error("Unauthorized access.");
      }

      // 3. Reject cancellation of already cancelled orders
      if (order.status === OrderStatus.CANCELLED) {
        throw new Error("Order is already cancelled.");
      }

      // 4. Reject cancellation if order status is beyond PENDING
      if (order.status !== OrderStatus.PENDING) {
        throw new Error("Order cannot be cancelled at this stage.");
      }

      // 5. Update order status to CANCELLED
      // Keep existing paymentStatus and all Razorpay info intact.
      // If payment was completed online, set refundStatus to PENDING.
      const isOnlinePaid = order.paymentMethod === "ONLINE" && order.paymentStatus === "COMPLETED";
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          refundStatus: isOnlinePaid ? RefundStatus.PENDING : RefundStatus.NOT_REQUIRED,
        },
      });

      // 6. Restore inventory for every ordered product variant
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return { success: true };
    });

    // Revalidate relevant pages for customer and admin
    revalidatePath("/account/orders");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return result;
  } catch (error: any) {
    console.error("[cancelOrderAction] Error cancelling order:", error);
    return {
      success: false,
      error: error.message || "Failed to cancel order.",
    };
  }
}
