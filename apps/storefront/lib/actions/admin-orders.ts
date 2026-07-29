"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logActivity } from "@/lib/audit/log-activity";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { sendOrderStatusEmail } from "@/lib/email";

// Legal transitions check
function isTransitionLegal(current: OrderStatus, target: OrderStatus): boolean {
  if (current === target) return true;
  if (current === OrderStatus.CANCELLED || current === OrderStatus.DELIVERED) {
    return false;
  }

  switch (current) {
    case OrderStatus.PENDING:
      return ([OrderStatus.PROCESSING, OrderStatus.CANCELLED] as OrderStatus[]).includes(target);
    case OrderStatus.PROCESSING:
      return ([OrderStatus.SHIPPED, OrderStatus.CANCELLED] as OrderStatus[]).includes(target);
    case OrderStatus.SHIPPED:
      return ([OrderStatus.DELIVERED] as OrderStatus[]).includes(target);
    default:
      return false;
  }
}

export async function updateOrderStatus(orderId: string, targetStatus: OrderStatus) {
  const admin = await requireAdmin();

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (!isTransitionLegal(order.status, targetStatus)) {
      return {
        success: false,
        error: `Illegal transition: cannot change order status from ${order.status} to ${targetStatus}`,
      };
    }

    const statusChanged = order.status !== targetStatus;

    // Update database
    await prisma.order.update({
      where: { id: orderId },
      data: { status: targetStatus },
    });

    // Trigger order status update email non-blocking
    if (
      statusChanged &&
      (targetStatus === OrderStatus.PROCESSING ||
        targetStatus === OrderStatus.SHIPPED ||
        targetStatus === OrderStatus.DELIVERED)
    ) {
      await sendOrderStatusEmail({
        orderId,
        status: targetStatus as "PROCESSING" | "SHIPPED" | "DELIVERED",
      });
    }

    // Write audit log
    await logActivity({
      adminId: admin.id,
      action: "ORDER_STATUS_CHANGED",
      entityType: "Order",
      entityId: orderId,
      metadata: {
        orderNumber: order.orderNumber,
        before: order.status,
        after: targetStatus,
      },
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath(`/dashboard/customers/${order.userId}`);
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[updateOrderStatus] Error:", err);
    return { success: false, error: err.message || "Failed to update order status" };
  }
}

// Simple API helper for polling orders
export async function getOrdersForDashboard() {
  await requireAdmin();
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    return { success: true, orders };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[getOrdersForDashboard] Error:", err);
    return { success: false, error: "Failed to fetch orders" };
  }
}
