import prisma from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/orders/generate-order-number";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";

interface CreateOrderParams {
  userId: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  phone?: string | null;
}

export async function createOrderFromCart(params: CreateOrderParams) {
  // 1) Dedup: if a razorpayPaymentId is provided, check for existing order BEFORE entering transaction
  if (params.razorpayPaymentId) {
    const existingOrder = await prisma.order.findUnique({
      where: { razorpayPaymentId: params.razorpayPaymentId },
      select: { id: true, orderNumber: true },
    });
    if (existingOrder) return existingOrder;
  }

  // 2) Fetch cart and related product/variant info outside the transaction to reduce time inside tx
  const cart = await prisma.cart.findUnique({
    where: { userId: params.userId },
    include: {
      items: {
        include: {
          product: {
            include: { variants: true },
          },
          variant: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty.");
  }

  // 3) Build orderItems and perform initial validations (prices, variant presence, basic stock check)
  const orderItems = cart.items.map((item) => {
    const price =
      item.product.salePrice !== null && item.product.salePrice !== undefined
        ? item.product.salePrice
        : item.variant?.price ?? item.product.price;

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`Invalid price for ${item.product.name}`);
    }

    const defaultVariant = item.variant || item.product.variants[0];
    if (!defaultVariant) {
      throw new Error(`Variant not found for product ${item.product.name}`);
    }

    if (item.quantity > defaultVariant.stock) {
      // basic pre-check; final atomic decrement will enforce this as well
      throw new Error(`Insufficient stock for ${item.product.name}`);
    }

    return {
      productId: item.productId,
      variantId: item.variantId || defaultVariant.id,
      quantity: item.quantity,
      price,
    };
  });

  // 4) Short transaction: attempt atomic stock decrements and create the order + items, then clear cart
  return prisma.$transaction(async (tx) => {
    // Atomic decrement: for each variant, use updateMany with a >= where clause and check count
    for (const it of orderItems) {
      if (params.phone) {
        await tx.user.update({
          where: { id: params.userId },
          data: {
            phone: params.phone,
          },
        });
      }
      const targetVariantId = it.variantId;
      if (!targetVariantId) throw new Error("Variant ID missing for stock decrement.");

      const result = await tx.productVariant.updateMany({
        where: { id: targetVariantId, stock: { gte: it.quantity } },
        data: { stock: { decrement: it.quantity } },
      });

      if (result.count !== 1) {
        // If update didn't affect exactly one row, roll back by throwing
        throw new Error("Insufficient stock for variant.");
      }
    }

    const totalAmount = params.subtotal - params.discountAmount + params.shippingFee;

    const order = await tx.order.create({
      data: {
        userId: params.userId,
        orderNumber: generateOrderNumber(),
        subtotal: params.subtotal,
        discountAmount: params.discountAmount,
        shippingFee: params.shippingFee,
        totalAmount,
        status: params.status,
        paymentStatus: params.paymentStatus,
        paymentMethod: params.paymentMethod,
        razorpayOrderId: params.razorpayOrderId ?? null,
        razorpayPaymentId: params.razorpayPaymentId ?? null,
        items: {
          create: orderItems,
        },
      },
      select: { id: true, orderNumber: true },
    });

    // Clear cart items
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });
}
