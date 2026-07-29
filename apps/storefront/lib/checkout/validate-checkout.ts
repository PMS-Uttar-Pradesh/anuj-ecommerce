import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getStoreSettings } from "@/lib/actions/settings";

const checkoutCartInclude = {
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
} satisfies Prisma.CartInclude;

type CheckoutCart = Prisma.CartGetPayload<{
  include: typeof checkoutCartInclude;
}>;

type CheckoutAddress = Prisma.AddressGetPayload<Record<string, never>>;

export interface CheckoutValidationResult {
  valid: boolean;
  cart: CheckoutCart | null;
  address: CheckoutAddress | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  errors: string[];
}

export async function validateCheckout(
  userId: string,
  deliveryMethod: string = "standard"
): Promise<CheckoutValidationResult> {
  const errors: string[] = [];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return {
      valid: false,
      cart: null,
      address: null,
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0,
      errors: ["User does not exist."],
    };
  }

  const [cart, address] = await Promise.all([
    prisma.cart.findUnique({
      where: { userId },
      include: checkoutCartInclude,
    }),
    prisma.address.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    }),
  ]);

  if (!cart) {
    errors.push("Cart does not exist.");
  } else if (cart.items.length === 0) {
    errors.push("Cart is empty.");
  }

  if (!address) {
    errors.push("Default address is required.");
  }

  let subtotal = 0;
  let discount = 0;

  if (cart) {
    for (const item of cart.items) {
      if (!item.product) {
        errors.push(`Product no longer exists: ${item.productId}.`);
        continue;
      }

      const defaultVariant = item.variant || item.product.variants[0];
      if (!defaultVariant) {
        errors.push(
          `Product variant no longer exists for: ${item.product?.name || item.productId}.`
        );
        continue;
      }

      if (item.quantity > defaultVariant.stock) {
        errors.push(
          `Only ${defaultVariant.stock} units available for ${item.product.name}.`
        );
      }

      const originalPrice = defaultVariant.price ?? item.product.price;
      const activePrice =
        item.product.salePrice !== null && item.product.salePrice !== undefined
          ? item.product.salePrice
          : originalPrice;

      if (
        originalPrice === null ||
        originalPrice === undefined ||
        Number.isNaN(Number(originalPrice)) ||
        Number(originalPrice) <= 0 ||
        activePrice === null ||
        activePrice === undefined ||
        Number.isNaN(Number(activePrice)) ||
        Number(activePrice) <= 0
      ) {
        errors.push(
          `Invalid price detected for product: ${item.product.name}.`
        );
        continue;
      }

      subtotal += Number(originalPrice) * item.quantity;
      if (item.product.salePrice !== null && item.product.salePrice !== undefined) {
        discount += (Number(originalPrice) - Number(activePrice)) * item.quantity;
      }
    }
  }

  const activeSubtotal = subtotal - discount;
  const storeSettings = await getStoreSettings();
  const isFreeShippingThreshold = activeSubtotal >= storeSettings.freeDeliveryThreshold;
  const shipping =
    deliveryMethod === "express" ? 99 : isFreeShippingThreshold ? 0 : 49;
  const total = activeSubtotal + shipping;

  return {
    valid: errors.length === 0 && !cart?.items.some(i => i.quantity > (i.variant || i.product?.variants[0])?.stock),
    cart,
    address,
    subtotal,
    discount,
    shipping,
    total,
    errors,
  };
}