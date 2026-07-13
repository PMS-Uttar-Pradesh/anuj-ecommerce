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
}

export async function createOrderFromCart(params: CreateOrderParams) {
  return prisma.$transaction(async (tx) => {
    if (params.razorpayPaymentId) {
      const existingOrder = await tx.order.findUnique({
        where: {
          razorpayPaymentId: params.razorpayPaymentId,
        },
        select: {
          id: true,
          orderNumber: true,
        },
      });

      if (existingOrder) {
        return existingOrder;
      }
    }

    const cart = await tx.cart.findUnique({
      where: {
        userId: params.userId,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                variants: true,
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty.");
    }

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
        throw new Error(`Insufficient stock for ${item.product.name}`);
      }

      return {
        productId: item.productId,
        variantId: item.variantId || defaultVariant.id,
        quantity: item.quantity,
        price,
      };
    });

    for (const item of orderItems) {
      const targetVariantId = item.variantId;
      if (!targetVariantId) {
        throw new Error("Variant ID missing for stock decrement.");
      }

      const variant = await tx.productVariant.findUnique({
        where: { id: targetVariantId },
        select: { stock: true },
      });

      if (!variant) {
        throw new Error("Variant not found for stock decrement.");
      }

      if (variant.stock < item.quantity) {
        throw new Error("Insufficient stock for variant.");
      }

      await tx.productVariant.update({
        where: { id: targetVariantId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
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
      select: {
        id: true,
        orderNumber: true,
      },
    });

    await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return order;
  });
}
