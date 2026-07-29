"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logActivity } from "@/lib/audit/log-activity";
import { revalidatePath } from "next/cache";
import { OrderStatus, RefundStatus, PaymentStatus } from "@prisma/client";
import { razorpay } from "@/lib/razorpay";
import { sendOrderRefundEmail } from "@/lib/email/send-email";

export async function processOrderRefundAction(orderId: string): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  try {
    // 1. Validate & state-lock inside a transaction
    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!existingOrder) {
        throw new Error("Order not found.");
      }

      // Check order status
      if (existingOrder.status !== OrderStatus.CANCELLED) {
        throw new Error("Only cancelled orders can be refunded.");
      }

      // Check payment eligibility
      if (existingOrder.paymentMethod !== "ONLINE") {
        throw new Error("Only online orders require a Razorpay refund.");
      }

      if (existingOrder.paymentStatus !== PaymentStatus.COMPLETED) {
        throw new Error("Only completed payments can be refunded.");
      }

      if (!existingOrder.razorpayPaymentId) {
        throw new Error("Razorpay payment ID is missing on this order.");
      }

      // Check refund eligibility
      if (existingOrder.refundStatus === RefundStatus.REFUNDED) {
        throw new Error("This order has already been refunded.");
      }

      if (existingOrder.refundStatus === RefundStatus.PROCESSING) {
        throw new Error("Refund processing is already in progress.");
      }

      // Lock the status to PROCESSING to prevent concurrent execution
      return await tx.order.update({
        where: { id: orderId },
        data: {
          refundStatus: RefundStatus.PROCESSING,
        },
      });
    });

    // 2. Call Razorpay Refund API
    try {
      const refundAmountPaise = Math.round(order.totalAmount * 100);

      const refund = await razorpay.payments.refund(order.razorpayPaymentId!, {
        amount: refundAmountPaise,
        notes: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          adminId: admin.id,
        },
      });

      // 3. Update database upon successful refund
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          refundStatus: RefundStatus.REFUNDED,
          refundId: refund.id,
          refundedAt: new Date(),
          refundedAmount: order.totalAmount, // Decimal automatically cast
          refundError: null,
        },
      });

      // 4. Log successful audit activity
      await logActivity({
        adminId: admin.id,
        action: "ORDER_REFUNDED",
        entityType: "Order",
        entityId: orderId,
        metadata: {
          orderNumber: order.orderNumber,
          refundId: refund.id,
          amount: order.totalAmount,
          timestamp: new Date().toISOString(),
        },
      });

      // 5. Send customer email (non-blocking / error-safe)
      try {
        await sendOrderRefundEmail({ orderId });
      } catch (emailErr) {
        console.error("[processOrderRefundAction] Email send failed:", emailErr);
      }

      // 6. Revalidate caches
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
      revalidatePath("/account/orders");

      return { success: true };
    } catch (apiErr: any) {
      console.error("[processOrderRefundAction] Razorpay API failed:", apiErr);
      
      const errorMsg = apiErr.message || "Failed to issue refund via Razorpay.";

      // 7. Update database to FAILED status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          refundStatus: RefundStatus.FAILED,
          refundError: errorMsg,
        },
      });

      // 8. Log failed audit activity
      await logActivity({
        adminId: admin.id,
        action: "ORDER_REFUND_FAILED",
        entityType: "Order",
        entityId: orderId,
        metadata: {
          orderNumber: order.orderNumber,
          error: errorMsg,
          timestamp: new Date().toISOString(),
        },
      });

      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);

      return { success: false, error: errorMsg };
    }
  } catch (err: any) {
    console.error("[processOrderRefundAction] General error:", err);
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
