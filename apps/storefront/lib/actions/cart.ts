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
            variant: true,
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

      // Prefer the exact variant from the CartItem if present; otherwise fall back to product variants[0]
      const variant = item.variant || item.product.variants[0];
      const stock = variant?.stock ?? 0;
      const activePrice = item.product.salePrice !== null && item.product.salePrice !== undefined
        ? item.product.salePrice
        : variant?.price ?? item.product.price;

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
    // Important: bubble up error so callers can distinguish 'empty cart' vs 'fetch failed'
    throw error;
  }
}

// ── Sync entire Cart state to DB ─────────────────────────────────────
export async function syncCartAction(items: ZustandCartItem[]): Promise<ZustandCartItem[]> {
  const user = await getAuthUser();
  if (!user) return items;

  // Normalize and validate incoming items
  const validItems = items
    .filter((item) => item && typeof item.id === "string" && item.id.trim())
    .map((item) => ({ ...item, id: item.id.trim() }))
    .filter((item) => {
      if (typeof item.quantity !== "number" || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 100) {
        console.warn("[syncCartAction] Skipping invalid quantity item:", item);
        return false;
      }
      return true;
    });

  try {
    // 1. Get or create Cart
    let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: user.id } });
    }

    // 2. Fetch existing cart items for this cart in a single query
    const existingItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
    const existingByProduct: Record<string, typeof existingItems[0]> = {};
    for (const e of existingItems) {
      existingByProduct[e.productId] = e;
    }

    // 3. Prepare createMany payload and update operations
    const toCreate: Array<{ cartId: string; productId: string; variantId: string | null; quantity: number }> = [];
    const toUpdate: Array<{ id: string; quantity: number }> = [];

    for (const item of validItems) {
      const existing = existingByProduct[item.id];
      if (existing) {
        if (existing.quantity !== item.quantity) {
          toUpdate.push({ id: existing.id, quantity: item.quantity });
        }
      } else {
        toCreate.push({ cartId: cart.id, productId: item.id, variantId: null, quantity: item.quantity });
      }
    }

    // 4. Execute updates and creates (minimize round-trips)
    // Updates: perform individual updates (still faster than findFirst per item)
    await Promise.all(
      toUpdate.map((u) => prisma.cartItem.update({ where: { id: u.id }, data: { quantity: u.quantity } }))
    );

    // Creates: use createMany for bulk insert
    if (toCreate.length > 0) {
      await prisma.cartItem.createMany({ data: toCreate });
    }

    // 5. Deletes: remove items not present in frontend
    const frontendProductIds = validItems.map((i) => i.id);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId: { notIn: frontendProductIds } } });

    // 6. Return refreshed list (throw on failure to let caller decide)
    return await fetchDbCart();
  } catch (error) {
    console.error("[syncCartAction] Failed to sync cart:", error);
    // Bubble up so caller (store / auth provider) can decide what to do; do NOT return empty cart on DB failure
    throw error;
  }
}

// ── Merge Guest Cart with DB Cart on Login ───────────────────────────
export async function mergeCartAction(guestItems: ZustandCartItem[]): Promise<ZustandCartItem[]> {
  const user = await getAuthUser();
  if (!user) return guestItems;

  // Normalize guest items
  const validGuest = guestItems
    .filter((it) => it && typeof it.id === "string" && it.id.trim())
    .map((it) => ({ ...it, id: it.id.trim() }))
    .filter((it) => {
      if (typeof it.quantity !== "number" || !Number.isInteger(it.quantity) || it.quantity <= 0 || it.quantity > 100) {
        console.warn("[mergeCartAction] Skipping invalid guest item:", it);
        return false;
      }
      return true;
    });

  try {
    // Get or create Cart
    let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: user.id } });
    }

    // Fetch existing cart items once
    const existingItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
    const existingByProduct: Record<string, typeof existingItems[0]> = {};
    for (const e of existingItems) existingByProduct[e.productId] = e;

    const toCreate: Array<{ cartId: string; productId: string; variantId: string | null; quantity: number }> = [];
    const toUpdate: Array<{ id: string; quantity: number }> = [];

    for (const guestItem of validGuest) {
      const existing = existingByProduct[guestItem.id];
      if (existing) {
        const newQty = Math.min(existing.quantity + guestItem.quantity, 100);
        if (newQty !== existing.quantity) {
          toUpdate.push({ id: existing.id, quantity: newQty });
        }
      } else {
        toCreate.push({ cartId: cart.id, productId: guestItem.id, variantId: null, quantity: guestItem.quantity });
      }
    }

    await Promise.all(toUpdate.map((u) => prisma.cartItem.update({ where: { id: u.id }, data: { quantity: u.quantity } })));
    if (toCreate.length > 0) await prisma.cartItem.createMany({ data: toCreate });

    return await fetchDbCart();
  } catch (error) {
    console.error("[mergeCartAction] Failed to merge cart:", error);
    throw error;
  }
}
