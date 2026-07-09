"use server";

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { PLACEHOLDER_IMAGE } from "@/lib/utils";

interface ZustandCartItem {
  id: string; // productId
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
}

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }
  return user;
}

// ── Fetch Cart from DB ───────────────────────────────────────────────
export async function fetchDbCart(): Promise<ZustandCartItem[]> {
  const user = await getAuthUser();
  if (!user) return [];

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
                variants: { take: 1 },
              },
            },
          },
        },
      },
    });

    if (!cart) return [];

    return cart.items.map((item) => {
      const primaryImage =
        item.product.images[0]?.url ||
        item.product.images.find(() => true)?.url ||
        PLACEHOLDER_IMAGE;

      const stock = item.product.variants[0]?.stock ?? 0;
      const activePrice = item.product.salePrice !== null && item.product.salePrice !== undefined 
        ? item.product.salePrice 
        : item.product.price;

      return {
        id: item.productId,
        name: item.product.name,
        price: activePrice,
        image: primaryImage,
        quantity: item.quantity,
        stock,
      };
    });
  } catch (error) {
    console.error("[fetchDbCart] Failed to fetch cart:", error);
    return [];
  }
}

// ── Sync entire Cart state to DB ─────────────────────────────────────
export async function syncCartAction(items: ZustandCartItem[]): Promise<ZustandCartItem[]> {
  const user = await getAuthUser();
  if (!user) return items;

  try {
    // 1. Get or create Cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
      });
    }

    // 2. Perform synchronization
    // Upsert items from frontend
    for (const item of items) {
      if (!item || typeof item.id !== "string" || !item.id.trim()) continue;
      if (typeof item.quantity !== "number" || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 100) {
        continue;
      }
      const productId = item.id.trim();
      const quantity = item.quantity;

      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: productId,
          variantId: null,
        },
      });

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: quantity,
          },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: productId,
            variantId: null,
            quantity: quantity,
          },
        });
      }
    }

    // Delete items not present in frontend array
    const frontendProductIds = items.map((i) => i.id);
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId: { notIn: frontendProductIds },
      },
    });

    // 3. Return refreshed list
    return fetchDbCart();
  } catch (error) {
    console.error("[syncCartAction] Failed to sync cart:", error);
    return items;
  }
}

// ── Merge Guest Cart with DB Cart on Login ───────────────────────────
export async function mergeCartAction(guestItems: ZustandCartItem[]): Promise<ZustandCartItem[]> {
  const user = await getAuthUser();
  if (!user) return guestItems;

  try {
    // Get or create Cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
      });
    }

    // Merge logic
    for (const guestItem of guestItems) {
      if (!guestItem || typeof guestItem.id !== "string" || !guestItem.id.trim()) continue;
      if (typeof guestItem.quantity !== "number" || !Number.isInteger(guestItem.quantity) || guestItem.quantity <= 0 || guestItem.quantity > 100) {
        continue;
      }
      const productId = guestItem.id.trim();
      const quantity = guestItem.quantity;

      const existingDbItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: productId,
          variantId: null,
        },
      });

      if (existingDbItem) {
        // Combine quantities, with a safety cap at 100
        const newQuantity = Math.min(existingDbItem.quantity + quantity, 100);
        await prisma.cartItem.update({
          where: { id: existingDbItem.id },
          data: {
            quantity: newQuantity,
          },
        });
      } else {
        // Create new item
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: productId,
            variantId: null,
            quantity: quantity,
          },
        });
      }
    }

    // Return the final merged cart from DB
    return fetchDbCart();
  } catch (error) {
    console.error("[mergeCartAction] Failed to merge cart:", error);
    return guestItems;
  }
}
